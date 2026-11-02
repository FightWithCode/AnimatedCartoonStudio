"""mux.py - put the recorded voice-over (and optional music) on the rendered video.

    python tools/mux.py --project projects/<slug> --voice voice.wav [--music bgm.mp3 --music-db -20]
    python tools/mux.py --project projects/<slug> --clips projects/<slug>/voice    # line clips, placed at their line times

Line clips (001_*.wav ...) are placed at each line's start time from build/timeline.json, so run
tools/plan.py --clips <folder> and re-render first: then every clip fits its line exactly.
"""
import argparse, glob, json, os, re, subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ap = argparse.ArgumentParser()
ap.add_argument("--project", required=True)
ap.add_argument("--voice"); ap.add_argument("--clips"); ap.add_argument("--music")
ap.add_argument("--music-db", type=float, default=-20)
ap.add_argument("--video", help="video to use (default: the newest out/*.mp4 without _voice)")
a = ap.parse_args()
proj = os.path.abspath(a.project)
tl = json.load(open(os.path.join(proj, "build", "timeline.json"), encoding="utf-8"))
vids = sorted((v for v in glob.glob(os.path.join(proj, "out", "*.mp4")) if not v.endswith("_voice.mp4")), key=os.path.getmtime)
video = a.video or (vids[-1] if vids else None)
if not video: raise SystemExit("no rendered video in out/ - run render.mjs first")
inputs, filters, labels = ["-i", video], [], []
if a.voice:
    inputs += ["-i", a.voice]; labels.append("[1:a]")
elif a.clips:
    starts = {ln["n"]: ln["start"] for sh in tl["shots"] for ln in sh["lines"]}
    files = sorted(f for f in os.listdir(a.clips) if re.match(r"^\d+.*\.(wav|mp3|m4a|ogg|flac)$", f, re.I))
    for f in files:
        n = int(re.match(r"^(\d+)", f).group(1))
        if n not in starts: continue
        idx = len(inputs) // 2; inputs += ["-i", os.path.join(a.clips, f)]
        ms = int(starts[n] * 1000); filters.append(f"[{idx}:a]adelay={ms}|{ms}[c{idx}]"); labels.append(f"[c{idx}]")
if a.music:
    idx = len(inputs) // 2; inputs += ["-stream_loop", "-1", "-i", a.music]
    filters.append(f"[{idx}:a]volume={a.music_db}dB,atrim=0:{tl['duration']}[m]"); labels.append("[m]")
if not labels: raise SystemExit("give --voice, --clips and/or --music")
filters.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{tl['duration']},loudnorm=I=-14:TP=-1.5[a]")
out = video[:-4] + "_voice.mp4"
subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filters), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
print("wrote " + out)
