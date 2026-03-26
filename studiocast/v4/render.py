#!/usr/bin/env python3
import base64, json, os, subprocess, time
from pathlib import Path
import requests

SCRIPT_PATH = Path(__file__).parent / "podcast_script.json"
SS_DIR = Path(__file__).parent / "screenshots"
WORK = Path(__file__).parent / "work"
WORK.mkdir(exist_ok=True)

TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
API_KEY = os.environ.get("GOOGLE_API_KEY", "")
VOICES = {"HOST": {"name": "en-US-Studio-Q", "gender": "MALE"}, "GUEST": {"name": "en-US-Studio-O", "gender": "FEMALE"}}
W, H, FPS, FADE = 1920, 1080, 30, 0.5

def tts(text, speaker, out):
    if out.exists() and out.stat().st_size > 1000: return gdur(out)
    v = VOICES.get(speaker, VOICES["HOST"])
    r = requests.post(f"{TTS_URL}?key={API_KEY}", json={"input":{"text":text},"voice":{"languageCode":"en-US","name":v["name"],"ssmlGender":v["gender"]},"audioConfig":{"audioEncoding":"MP3","sampleRateHertz":24000,"speakingRate":1.0,"pitch":0.0}}, timeout=120)
    if r.status_code != 200: raise RuntimeError(f"TTS {r.status_code}")
    out.write_bytes(base64.b64decode(r.json()["audioContent"])); time.sleep(0.15)
    return gdur(out)

def gdur(p):
    r = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(p)], capture_output=True, text=True)
    return float(r.stdout.strip() or "0")

def gih(p):
    r = subprocess.run(["ffprobe","-v","quiet","-select_streams","v:0","-show_entries","stream=height","-of","csv=p=0",str(p)], capture_output=True, text=True)
    return int(r.stdout.strip() or "1080")

def caudio(segs, out):
    out.with_suffix(".txt").write_text("\n".join(f"file '{s}'" for s in segs))
    subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(out.with_suffix(".txt")),"-c","copy",str(out)], capture_output=True)
    return gdur(out)

def estatic(img, audio, out, dur):
    p = dur + 0.5
    subprocess.run(["ffmpeg","-y","-loop","1","-i",str(img),"-i",str(audio),"-c:v","libx264","-preset","fast","-crf","23","-c:a","aac","-b:a","192k","-vf",f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0x0A0A0A,fade=in:0:{FPS*FADE},fade=out:st={p-FADE}:d={FADE}","-t",str(p),"-pix_fmt","yuv420p",str(out)], capture_output=True)

def escroll(img, audio, out, dur):
    p = dur + 0.5; ih = gih(img); sr = max(0, ih - H)
    if sr <= 0: return estatic(img, audio, out, dur)
    hs, he = 1.5, 1.5; st = max(1.0, p - hs - he); pps = sr / st
    y = f"if(lt(t,{hs}),0,if(lt(t,{hs+st}),min((t-{hs})*{pps},{sr}),{sr}))"
    subprocess.run(["ffmpeg","-y","-loop","1","-i",str(img),"-i",str(audio),"-c:v","libx264","-preset","fast","-crf","23","-c:a","aac","-b:a","192k","-vf",f"scale={W}:-1:flags=lanczos,crop={W}:{H}:0:'{y}',fade=in:0:{FPS*FADE},fade=out:st={p-FADE}:d={FADE}","-t",str(p),"-pix_fmt","yuv420p",str(out)], capture_output=True)

topics = json.loads(SCRIPT_PATH.read_text())["topics"]
print(f"Rendering {len(topics)} scenes...\n")
clips = []
for i, t in enumerate(topics):
    print(f"[{i+1}/{len(topics)}] {t['topic_title']}")
    img = SS_DIR / t["screenshot"]
    if not img.exists(): print(f"  SKIP: {img.name}"); continue
    ih = gih(img); tall = ih > H + 100
    print(f"  {W}x{ih} {'SCROLL' if tall else 'STATIC'}")
    segs, dur = [], 0
    for j, l in enumerate(t["dialogue"]):
        sp = WORK / f"s{i:02d}_{j:02d}.mp3"; d = tts(l["text"], l["speaker"], sp); segs.append(sp); dur += d
        print(f"  {l['speaker']}: {d:.1f}s")
    ta = WORK / f"s{i:02d}_audio.mp3"; dur = caudio(segs, ta); print(f"  Total: {dur:.1f}s")
    sc = WORK / f"scene{i:02d}.mp4"; (escroll if tall else estatic)(img, ta, sc, dur); clips.append(sc); print()

final = Path(__file__).parent / "sigil-tour-v4.mp4"
cl = WORK / "concat.txt"; cl.write_text("\n".join(f"file '{s}'" for s in clips))
subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(cl),"-c","copy","-movflags","+faststart",str(final)], capture_output=True)
fd = gdur(final); fs = final.stat().st_size/(1024*1024)
print(f"{'='*60}\nDONE: {final}\nDuration: {int(fd//60)}:{int(fd%60):02d}\nSize: {fs:.1f} MB\nScenes: {len(clips)}\n{'='*60}")
