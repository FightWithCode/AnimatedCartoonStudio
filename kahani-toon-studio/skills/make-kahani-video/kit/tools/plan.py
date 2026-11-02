"""plan.py - turn a project's story.json into build/timeline.json (+ captions.srt and voiceover_script.txt).

    python tools/plan.py --project projects/<slug>
    python tools/plan.py --project projects/<slug> --clips projects/<slug>/voice   # re-time from recorded clips

Timing: with no audio, every dialogue line gets a duration from its word count (Hindi kahani pace,
~2.4 words/s, tunable with "pace" in story.json or "dur" on a line). After recording the voice-over
line by line (001_*.wav, 002_*.wav ... in script order), pass --clips to make each line exactly as long
as its clip, then re-render: the video then lines up with the voice-over.
"""
import argparse, json, os, re, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

RES = {"720p": (1280, 720), "1080p": (1920, 1080), "1440p": (2560, 1440)}
KNOWN_SETS = {"village", "chaupal", "lane", "courtyard", "fields", "building", "hut", "shop", "office"}
POSES = {"idle", "explain", "explain2", "point", "open", "shrug", "chest", "hips", "namaste", "think", "worried", "folded", "wave", "cane", "headload", "give", "angry", "bless", "cry", "sit"}
EXPRS = {"neutral", "happy", "smile", "sad", "angry", "surprised", "worried", "thinking", "sly", "crying", "proud"}
FRAMINGS = {"wide", "full", "medium", "mcu", "close"}


def words(text):
    return len([w for w in re.split(r"\s+", text.strip()) if w])


def clip_durations(folder):
    files = sorted(f for f in os.listdir(folder) if re.match(r"^\d+.*\.(wav|mp3|m4a|ogg|flac)$", f, re.I))
    out = {}
    for f in files:
        n = int(re.match(r"^(\d+)", f).group(1))
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(folder, f)], capture_output=True, text=True)
        try:
            out[n] = float(r.stdout.strip())
        except ValueError:
            print(f"  could not read duration of {f}")
    return out


def ts(t, srt=True):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}" if srt else f"{m:02d}:{s:02d}.{ms // 100}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--clips", help="folder of recorded line clips (001_*.wav ...) to time the lines from")
    a = ap.parse_args()
    proj = os.path.abspath(a.project)
    story = json.load(open(os.path.join(proj, "story.json"), encoding="utf-8"))
    W, H = RES.get(story.get("resolution", "1080p"), RES["1080p"])
    fps = int(story.get("fps", 25))
    pace = float(story.get("pace", 2.4))           # words per second
    gap = float(story.get("lineGap", 0.25))
    cast = story.get("cast", {})
    locs = story.get("locations", {})
    clips = clip_durations(a.clips) if a.clips else {}
    warnings = []

    shots, t, line_no, prev_key = [], 0.0, 0, None
    srt, vo = [], []
    all_shots = [(si, sc, sh) for si, sc in enumerate(story["scenes"]) for sh in sc["shots"]]
    for k, (si, sc, sh) in enumerate(all_shots):
        loc = sh.get("location", sc.get("location", "village"))
        time = sh.get("time", sc.get("time", "day"))
        base = locs.get(loc, {}).get("base", loc)
        if base not in KNOWN_SETS and not locs.get(loc, {}).get("images"):
            warnings.append(f"shot {k + 1}: unknown location '{loc}' (sets: {', '.join(sorted(KNOWN_SETS))}, or add it under 'locations' with images)")
        framing = sh.get("framing", "wide")
        if framing not in FRAMINGS:
            warnings.append(f"shot {k + 1}: unknown framing '{framing}'")
        for ch in sh.get("chars", []):
            if "extra" not in ch and ch.get("id") not in cast:
                warnings.append(f"shot {k + 1}: character '{ch.get('id')}' is not in cast")
            if ch.get("pose") and ch["pose"] not in POSES: warnings.append(f"shot {k + 1}: unknown pose '{ch['pose']}'")
            if ch.get("expr") and ch["expr"] not in EXPRS: warnings.append(f"shot {k + 1}: unknown expr '{ch['expr']}'")
        start = t
        cur = t + float(sh.get("lead", 0.3 if sh.get("lines") else 0))
        lines = []
        for ln in sh.get("lines", []):
            line_no += 1
            text = ln.get("text", "")
            spk = ln.get("speaker", "narrator")
            if spk != "narrator" and spk not in cast:
                warnings.append(f"line {line_no}: speaker '{spk}' is not in cast")
            for cid, act in (ln.get("acts") or {}).items():
                if act.get("pose") and act["pose"] not in POSES: warnings.append(f"line {line_no}: unknown pose '{act['pose']}'")
                if act.get("expr") and act["expr"] not in EXPRS: warnings.append(f"line {line_no}: unknown expr '{act['expr']}'")
            d = clips.get(line_no) or float(ln.get("dur", max(1.3, words(text) / pace + 0.4)))
            lines.append({"n": line_no, "speaker": spk, "text": text, "start": round(cur, 3), "end": round(cur + d, 3), "acts": ln.get("acts", {})})
            name = cast.get(spk, {}).get("name", spk) if spk != "narrator" else "कथावाचक (Narrator)"
            emo = ""
            acts = ln.get("acts", {}).get(spk, {})
            if acts.get("expr"): emo = f" [{acts['expr']}]"
            srt.append(f"{len(srt) + 1}\n{ts(cur)} --> {ts(cur + d)}\n{(name + ': ') if spk != 'narrator' else ''}{text}\n")
            vo.append(f"{line_no:03d}  [{ts(cur, False)} - {ts(cur + d, False)}]  ({d:.1f}s)  {name}{emo}:  {text}")
            cur += d + gap
        end = max(cur - gap + float(sh.get("tail", 0.35)) if lines else cur, start + float(sh.get("dur", 0)), start + (2.5 if not lines else 0))
        key = (loc, time)
        shot = {"id": f"s{k + 1:03d}", "start": round(start, 3), "end": round(end, 3), "location": loc, "time": time, "framing": framing,
                "cam": sh.get("cam", ["push", "static", "push", "panR", "push", "static", "pull", "panL"][k % 8]),
                "chars": sh.get("chars", []), "lines": lines}
        for opt in ("title", "subtitle", "setOptions", "camOffset"):
            if opt in sh: shot[opt] = sh[opt]
        if k == 0: shot["fadeIn"] = 0.6
        elif key != prev_key: shot["fadeIn"] = 0.3; shots[-1]["fadeOut"] = shots[-1].get("fadeOut", 0.3)
        prev_key = key
        shots.append(shot)
        t = end
    if shots: shots[-1]["fadeOut"] = 0.8

    tl = {"title": story.get("title", "Kahani"), "width": W, "height": H, "fps": fps, "duration": round(t, 3),
          "captions": story.get("captions", True), "speakerLabels": story.get("speakerLabels", True), "captionSize": story.get("captionSize", 0.04),
          "cast": cast, "locations": locs, "shots": shots}
    os.makedirs(os.path.join(proj, "build"), exist_ok=True)
    json.dump(tl, open(os.path.join(proj, "build", "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(proj, "build", "captions.srt"), "w", encoding="utf-8").write("\n".join(srt))
    head = [f"{tl['title']}  -  voice-over script ({len(vo)} lines, {t / 60:.1f} min)", "Record one clip per line, named 001_<speaker>.wav, 002_... then: python tools/plan.py --project <project> --clips <folder>", ""]
    open(os.path.join(proj, "build", "voiceover_script.txt"), "w", encoding="utf-8").write("\n".join(head + vo) + "\n")
    print(f"{len(shots)} shots, {line_no} lines, {t:.1f} s ({t / 60:.1f} min) at {W}x{H} {fps} fps" + (f", {len(clips)} lines timed from clips" if clips else ""))
    print(f"wrote build/timeline.json, build/captions.srt, build/voiceover_script.txt")
    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings[:60]: print("  " + w)
        sys.exit(2 if any("not in cast" in w or "unknown location" in w for w in warnings) else 0)


if __name__ == "__main__":
    main()
