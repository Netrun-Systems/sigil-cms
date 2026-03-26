#!/usr/bin/env python3
"""
Sigil CMS Feature Tour v2 — Full Platform with Scrolling

Google Cloud TTS (Studio-Q host + Studio-O guest) + FFmpeg Assembly.
Supports tall images with pan/scroll animation for admin page tours.
"""

import base64
import json
import os
import subprocess
import time
from pathlib import Path

import requests

# ── Config ───────────────────────────────────────────────────────────────

SCRIPT_PATH = Path(__file__).parent / "podcast_script.json"
SCREENSHOTS_DIR = Path(__file__).parent / "screenshots"
OUTPUT_DIR = Path(__file__).parent
WORK_DIR = OUTPUT_DIR / "work"

GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

VOICES = {
    "HOST": {"name": "en-US-Studio-Q", "gender": "MALE"},
    "GUEST": {"name": "en-US-Studio-O", "gender": "FEMALE"},
}

FPS = 30
FADE = 0.5
BG_COLOR = "0x0A0A0A"
OUTPUT_WIDTH = 1920
OUTPUT_HEIGHT = 1080


# ── Google Cloud TTS ─────────────────────────────────────────────────────

def tts_segment(text: str, speaker: str, out_path: Path) -> float:
    if out_path.exists() and out_path.stat().st_size > 1000:
        return get_duration(out_path)

    voice = VOICES.get(speaker, VOICES["HOST"])
    resp = requests.post(
        f"{GOOGLE_TTS_URL}?key={GOOGLE_API_KEY}",
        headers={"Content-Type": "application/json"},
        json={
            "input": {"text": text},
            "voice": {"languageCode": "en-US", "name": voice["name"], "ssmlGender": voice["gender"]},
            "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 24000, "speakingRate": 1.0, "pitch": 0.0},
        },
        timeout=120,
    )

    if resp.status_code != 200:
        print(f"  TTS error {resp.status_code}: {resp.text[:200]}")
        raise RuntimeError(f"TTS failed: {resp.status_code}")

    audio_bytes = base64.b64decode(resp.json()["audioContent"])
    out_path.write_bytes(audio_bytes)
    time.sleep(0.2)
    return get_duration(out_path)


def get_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    )
    return float(result.stdout.strip() or "0")


# ── FFmpeg Helpers ───────────────────────────────────────────────────────

def concat_audio(segments: list[Path], out_path: Path) -> float:
    list_file = out_path.with_suffix(".txt")
    list_file.write_text("\n".join(f"file '{s}'" for s in segments))
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(list_file), "-c", "copy", str(out_path),
    ], capture_output=True)
    return get_duration(out_path)


def get_image_height(image: Path) -> int:
    """Get image height via ffprobe."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-select_streams", "v:0",
         "-show_entries", "stream=height", "-of", "csv=p=0", str(image)],
        capture_output=True, text=True,
    )
    return int(result.stdout.strip() or "1080")


def encode_scene_static(image: Path, audio: Path, out_path: Path, duration: float):
    """Static scene: loop image for audio duration with fade."""
    pad_dur = duration + 0.5
    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(image),
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k",
        "-vf", f"scale={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}:force_original_aspect_ratio=decrease,"
               f"pad={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color={BG_COLOR},"
               f"fade=in:0:{FPS * FADE},"
               f"fade=out:st={pad_dur - FADE}:d={FADE}",
        "-t", str(pad_dur),
        "-pix_fmt", "yuv420p",
        str(out_path),
    ], capture_output=True)


def encode_scene_scroll(image: Path, audio: Path, out_path: Path, duration: float):
    """Scrolling scene: pan down a tall image over the audio duration."""
    pad_dur = duration + 0.5
    img_h = get_image_height(image)
    scroll_range = max(0, img_h - OUTPUT_HEIGHT)

    if scroll_range <= 0:
        # Image isn't tall enough to scroll, use static
        encode_scene_static(image, audio, out_path, duration)
        return

    # Hold at top for 1s, scroll down, hold at bottom for 1s
    hold_start = 1.0
    hold_end = 1.0
    scroll_time = max(1.0, pad_dur - hold_start - hold_end)
    pixels_per_sec = scroll_range / scroll_time

    # FFmpeg crop expression: start at y=0, scroll down, stop at max
    # t is time in seconds
    y_expr = f"if(lt(t,{hold_start}),0,if(lt(t,{hold_start + scroll_time}),min((t-{hold_start})*{pixels_per_sec},{scroll_range}),{scroll_range}))"

    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(image),
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k",
        "-vf", f"scale={OUTPUT_WIDTH}:-1:flags=lanczos,"
               f"crop={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}:0:'{y_expr}',"
               f"fade=in:0:{FPS * FADE},"
               f"fade=out:st={pad_dur - FADE}:d={FADE}",
        "-t", str(pad_dur),
        "-pix_fmt", "yuv420p",
        str(out_path),
    ], capture_output=True)


def concat_scenes(scenes: list[Path], out_path: Path):
    list_file = out_path.with_suffix(".txt")
    list_file.write_text("\n".join(f"file '{s}'" for s in scenes))
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(list_file),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(out_path),
    ], capture_output=True)


# ── Main Pipeline ────────────────────────────────────────────────────────

def main():
    WORK_DIR.mkdir(parents=True, exist_ok=True)

    if not GOOGLE_API_KEY:
        print("ERROR: GOOGLE_API_KEY not set")
        return

    script = json.loads(SCRIPT_PATH.read_text())
    topics = script["topics"]
    print(f"Loaded {len(topics)} scenes from {SCRIPT_PATH.name}\n")

    scene_clips = []

    for i, topic in enumerate(topics):
        print(f"[{i+1}/{len(topics)}] {topic['topic_title']}")

        screenshot = SCREENSHOTS_DIR / topic["screenshot"]
        if not screenshot.exists():
            print(f"  WARNING: {screenshot.name} not found, skipping")
            continue

        img_h = get_image_height(screenshot)
        is_tall = img_h > OUTPUT_HEIGHT + 100
        mode = "SCROLL" if is_tall else "STATIC"
        print(f"  Image: {OUTPUT_WIDTH}x{img_h} ({mode})")

        # Generate TTS
        audio_segments = []
        topic_dur = 0
        for j, line in enumerate(topic["dialogue"]):
            seg_path = WORK_DIR / f"topic{i:02d}_seg{j:02d}.mp3"
            dur = tts_segment(line["text"], line["speaker"], seg_path)
            audio_segments.append(seg_path)
            topic_dur += dur
            print(f"  {line['speaker']}: {dur:.1f}s")

        topic_audio = WORK_DIR / f"topic{i:02d}_audio.mp3"
        topic_dur = concat_audio(audio_segments, topic_audio)
        print(f"  Total: {topic_dur:.1f}s")

        # Encode scene
        scene_clip = WORK_DIR / f"scene{i:02d}.mp4"
        if is_tall:
            encode_scene_scroll(screenshot, topic_audio, scene_clip, topic_dur)
        else:
            encode_scene_static(screenshot, topic_audio, scene_clip, topic_dur)

        scene_clips.append(scene_clip)
        print()

    if not scene_clips:
        print("ERROR: No scene clips generated")
        return

    # Final assembly
    final_path = OUTPUT_DIR / "sigil-tour-v2.mp4"
    print(f"Assembling {len(scene_clips)} scenes...")
    concat_scenes(scene_clips, final_path)

    final_dur = get_duration(final_path)
    final_size = final_path.stat().st_size / (1024 * 1024)
    mins = int(final_dur // 60)
    secs = int(final_dur % 60)

    print(f"\n{'=' * 60}")
    print(f"DONE: {final_path}")
    print(f"Duration: {mins}:{secs:02d}")
    print(f"Size: {final_size:.1f} MB")
    print(f"Resolution: {OUTPUT_WIDTH}x{OUTPUT_HEIGHT}")
    print(f"Scenes: {len(scene_clips)}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
