#!/usr/bin/env python3
"""
Sigil CMS Feature Tour v3 — Complete Platform (v2 scenes + 6 new)

Merges the 15 v2 scenes with 6 new scenes covering features built after v2.
Inserts new scenes at logical positions in the narrative flow.
"""

import base64
import json
import os
import subprocess
import time
from pathlib import Path

import requests

# ── Config ───────────────────────────────────────────────────────────────

V2_DIR = Path(__file__).parent.parent / "v2"
V3_DIR = Path(__file__).parent
V2_SCREENSHOTS = V2_DIR / "screenshots"
V3_SCREENSHOTS = V3_DIR / "screenshots"
OUTPUT_DIR = V3_DIR
WORK_DIR = V3_DIR / "work"

GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

VOICES = {
    "HOST": {"name": "en-US-Studio-Q", "gender": "MALE"},
    "GUEST": {"name": "en-US-Studio-O", "gender": "FEMALE"},
}

FPS = 30
FADE = 0.5
BG_COLOR = "0x0A0A0A"
W, H = 1920, 1080


def tts_segment(text, speaker, out_path):
    if out_path.exists() and out_path.stat().st_size > 1000:
        return get_duration(out_path)
    voice = VOICES.get(speaker, VOICES["HOST"])
    resp = requests.post(
        f"{GOOGLE_TTS_URL}?key={GOOGLE_API_KEY}",
        json={
            "input": {"text": text},
            "voice": {"languageCode": "en-US", "name": voice["name"], "ssmlGender": voice["gender"]},
            "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 24000, "speakingRate": 1.0, "pitch": 0.0},
        },
        timeout=120,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"TTS {resp.status_code}: {resp.text[:200]}")
    out_path.write_bytes(base64.b64decode(resp.json()["audioContent"]))
    time.sleep(0.2)
    return get_duration(out_path)


def get_duration(p):
    r = subprocess.run(["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip() or "0")


def get_image_height(p):
    r = subprocess.run(["ffprobe", "-v", "quiet", "-select_streams", "v:0", "-show_entries", "stream=height", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return int(r.stdout.strip() or "1080")


def concat_audio(segs, out):
    out.with_suffix(".txt").write_text("\n".join(f"file '{s}'" for s in segs))
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(out.with_suffix(".txt")), "-c", "copy", str(out)], capture_output=True)
    return get_duration(out)


def encode_static(img, audio, out, dur):
    pad = dur + 0.5
    subprocess.run([
        "ffmpeg", "-y", "-loop", "1", "-i", str(img), "-i", str(audio),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "192k",
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color={BG_COLOR},fade=in:0:{FPS*FADE},fade=out:st={pad-FADE}:d={FADE}",
        "-t", str(pad), "-pix_fmt", "yuv420p", str(out),
    ], capture_output=True)


def encode_scroll(img, audio, out, dur):
    pad = dur + 0.5
    ih = get_image_height(img)
    scroll = max(0, ih - H)
    if scroll <= 0:
        return encode_static(img, audio, out, dur)
    hold_s, hold_e = 1.0, 1.0
    st = max(1.0, pad - hold_s - hold_e)
    pps = scroll / st
    y = f"if(lt(t,{hold_s}),0,if(lt(t,{hold_s+st}),min((t-{hold_s})*{pps},{scroll}),{scroll}))"
    subprocess.run([
        "ffmpeg", "-y", "-loop", "1", "-i", str(img), "-i", str(audio),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "192k",
        "-vf", f"scale={W}:-1:flags=lanczos,crop={W}:{H}:0:'{y}',fade=in:0:{FPS*FADE},fade=out:st={pad-FADE}:d={FADE}",
        "-t", str(pad), "-pix_fmt", "yuv420p", str(out),
    ], capture_output=True)


def main():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    if not GOOGLE_API_KEY:
        print("ERROR: GOOGLE_API_KEY not set"); return

    # Load both scripts
    v2_script = json.loads((V2_DIR / "podcast_script.json").read_text())
    v3_additions = json.loads((V3_DIR / "additional_script.json").read_text())

    # Build combined scene list — insert new scenes at logical positions
    # v2 order: landing, dashboard, sites, design, editor, marketplace, commerce, community, analytics, docs, migrate, platform, webhooks, billing, pricing
    # Insert new scenes:
    #   After sites (3): cloning (16), subdomains (17)
    #   After editor (5): templates (18)
    #   After webhooks (13): security (19)
    #   After billing (14): transfer (20)
    #   After pricing (15): POS (21)

    v2_topics = v2_script["topics"]
    v3_topics = v3_additions["topics"]

    combined = []
    v3_map = {t["screenshot"]: t for t in v3_topics}

    insert_after = {
        2: ["16-cloning.png", "17-subdomains.png"],  # after sites (index 2)
        4: ["18-templates.png"],                       # after editor (index 4)
        12: ["19-security.png"],                       # after webhooks (index 12)
        13: ["20-transfer.png"],                       # after billing (index 13)
        14: ["21-pos.png"],                            # after pricing (index 14)
    }

    for i, topic in enumerate(v2_topics):
        combined.append(("v2", topic))
        if i in insert_after:
            for ss in insert_after[i]:
                if ss in v3_map:
                    combined.append(("v3", v3_map[ss]))

    print(f"Combined tour: {len(combined)} scenes\n")

    scene_clips = []
    for idx, (source, topic) in enumerate(combined):
        print(f"[{idx+1}/{len(combined)}] {topic['topic_title']}")

        ss_dir = V2_SCREENSHOTS if source == "v2" else V3_SCREENSHOTS
        img = ss_dir / topic["screenshot"]
        if not img.exists():
            print(f"  WARNING: {img.name} not found, skipping"); continue

        ih = get_image_height(img)
        is_tall = ih > H + 100
        print(f"  {source.upper()} | {W}x{ih} | {'SCROLL' if is_tall else 'STATIC'}")

        segs, dur = [], 0
        for j, line in enumerate(topic["dialogue"]):
            sp = WORK_DIR / f"s{idx:02d}_seg{j:02d}.mp3"
            d = tts_segment(line["text"], line["speaker"], sp)
            segs.append(sp); dur += d
            print(f"  {line['speaker']}: {d:.1f}s")

        ta = WORK_DIR / f"s{idx:02d}_audio.mp3"
        dur = concat_audio(segs, ta)
        print(f"  Total: {dur:.1f}s")

        sc = WORK_DIR / f"scene{idx:02d}.mp4"
        (encode_scroll if is_tall else encode_static)(img, ta, sc, dur)
        scene_clips.append(sc)
        print()

    if not scene_clips:
        print("No scenes!"); return

    # Concat
    final = OUTPUT_DIR / "sigil-tour-v3.mp4"
    print(f"Assembling {len(scene_clips)} scenes...")
    cl = final.with_name("concat.txt")
    cl.write_text("\n".join(f"file '{s}'" for s in scene_clips))
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(cl), "-c", "copy", "-movflags", "+faststart", str(final)], capture_output=True)

    fd = get_duration(final)
    fs = final.stat().st_size / (1024*1024)
    print(f"\n{'='*60}")
    print(f"DONE: {final}")
    print(f"Duration: {int(fd//60)}:{int(fd%60):02d}")
    print(f"Size: {fs:.1f} MB")
    print(f"Scenes: {len(scene_clips)}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
