#!/usr/bin/env python3
"""
Sigil CMS Product Tour — Studiocast Render Pipeline

Google Cloud TTS (Studio-Q host + Studio-O guest) + FFmpeg Assembly.
Dual-host mode with narration over 10 feature screenshots.
"""

import base64
import json
import os
import subprocess
import time
from pathlib import Path

import requests

# ── Config ───────────────────────────────────────────────────────────────

SCRIPT_PATH = Path(__file__).parent.parent / "podcast_script.json"
SCREENSHOTS_DIR = Path(__file__).parent.parent / "screenshots"
OUTPUT_DIR = Path(__file__).parent
WORK_DIR = OUTPUT_DIR / "work"

# Google Cloud TTS
GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

# Voices
VOICES = {
    "HOST": {"name": "en-US-Studio-Q", "gender": "MALE"},
    "GUEST": {"name": "en-US-Studio-O", "gender": "FEMALE"},
}

# Video
FPS = 30
FADE = 0.5
BG_COLOR = "0x0A0A0A"

# ── Google Cloud TTS ─────────────────────────────────────────────────────

def tts_segment(text: str, speaker: str, out_path: Path) -> float:
    """Call Google Cloud TTS. Returns duration in seconds."""
    if out_path.exists() and out_path.stat().st_size > 1000:
        return get_duration(out_path)

    voice = VOICES.get(speaker, VOICES["HOST"])

    resp = requests.post(
        f"{GOOGLE_TTS_URL}?key={GOOGLE_API_KEY}",
        headers={"Content-Type": "application/json"},
        json={
            "input": {"text": text},
            "voice": {
                "languageCode": "en-US",
                "name": voice["name"],
                "ssmlGender": voice["gender"],
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "sampleRateHertz": 24000,
                "speakingRate": 1.0,
                "pitch": 0.0,
            },
        },
        timeout=120,
    )

    if resp.status_code != 200:
        print(f"  TTS error {resp.status_code}: {resp.text[:200]}")
        raise RuntimeError(f"TTS failed: {resp.status_code}")

    audio_bytes = base64.b64decode(resp.json()["audioContent"])
    out_path.write_bytes(audio_bytes)
    time.sleep(0.2)  # rate limit

    return get_duration(out_path)


def get_duration(path: Path) -> float:
    """Get audio duration via ffprobe."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    )
    return float(result.stdout.strip() or "0")


# ── FFmpeg Helpers ───────────────────────────────────────────────────────

def concat_audio(segments: list[Path], out_path: Path) -> float:
    """Concatenate audio segments via FFmpeg concat demuxer."""
    list_file = out_path.with_suffix(".txt")
    list_file.write_text("\n".join(f"file '{s}'" for s in segments))

    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(list_file), "-c", "copy", str(out_path),
    ], capture_output=True)

    return get_duration(out_path)


def encode_scene(image: Path, audio: Path, out_path: Path, duration: float):
    """Encode a scene: loop image for audio duration + padding, overlay fade."""
    pad_dur = duration + 0.5
    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(image),
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k",
        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,"
               f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color={BG_COLOR},"
               f"fade=in:0:{FPS * FADE},"
               f"fade=out:st={pad_dur - FADE}:d={FADE}",
        "-t", str(pad_dur),
        "-pix_fmt", "yuv420p",
        str(out_path),
    ], capture_output=True)


def concat_scenes(scenes: list[Path], out_path: Path):
    """Concatenate scene clips into final video."""
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

    # Load script
    script = json.loads(SCRIPT_PATH.read_text())
    topics = script["topics"]
    print(f"Loaded {len(topics)} topics from {SCRIPT_PATH.name}\n")

    scene_clips = []

    for i, topic in enumerate(topics):
        print(f"[{i+1}/{len(topics)}] {topic['topic_title']}")

        screenshot = SCREENSHOTS_DIR / topic["screenshot"]
        if not screenshot.exists():
            print(f"  WARNING: {screenshot} not found, skipping")
            continue

        # Generate TTS for each dialogue line
        audio_segments = []
        topic_dur = 0

        for j, line in enumerate(topic["dialogue"]):
            seg_path = WORK_DIR / f"topic{i:02d}_seg{j:02d}.mp3"
            dur = tts_segment(line["text"], line["speaker"], seg_path)
            audio_segments.append(seg_path)
            topic_dur += dur
            voice_label = VOICES.get(line["speaker"], {}).get("name", "?")
            print(f"  {line['speaker']} ({voice_label}): {dur:.1f}s")

        # Concatenate segments into topic audio
        topic_audio = WORK_DIR / f"topic{i:02d}_audio.mp3"
        topic_dur = concat_audio(audio_segments, topic_audio)
        print(f"  Total: {topic_dur:.1f}s")

        # Encode scene clip
        scene_clip = WORK_DIR / f"scene{i:02d}.mp4"
        encode_scene(screenshot, topic_audio, scene_clip, topic_dur)
        scene_clips.append(scene_clip)
        print()

    if not scene_clips:
        print("ERROR: No scene clips generated")
        return

    # Concatenate all scenes
    final_path = OUTPUT_DIR / "sigil-tour.mp4"
    print(f"Assembling {len(scene_clips)} scenes into final video...")
    concat_scenes(scene_clips, final_path)

    # Report
    final_dur = get_duration(final_path)
    final_size = final_path.stat().st_size / (1024 * 1024)
    mins = int(final_dur // 60)
    secs = int(final_dur % 60)

    print(f"\n{'=' * 60}")
    print(f"DONE: {final_path}")
    print(f"Duration: {mins}:{secs:02d}")
    print(f"Size: {final_size:.1f} MB")
    print(f"Resolution: 1920x1080")
    print(f"Scenes: {len(scene_clips)}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
