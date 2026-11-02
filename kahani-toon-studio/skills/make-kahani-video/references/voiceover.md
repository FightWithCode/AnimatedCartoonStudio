# Captions and the voice-over route

The studio does not generate voices. It gives the user everything needed to record them afterwards.

## What every render produces (in `projects/<slug>/out/`)
- `<title>.mp4` — silent video with small Hindi captions at the bottom: speaker name in yellow, line in white (narration has no name). `--no-captions` renders `<title>_clean.mp4` without them.
- `<title>_captions.srt` — the same lines as subtitles (for YouTube, or as a teleprompter in an editor).
- `<title>_voiceover_script.txt` — numbered lines: `003  [00:15.4 - 00:20.0]  (4.6s)  रामू [surprised]: अरे! …`
  The number is the clip name to record; the time window is how long the line has on screen; the bracket is the emotion to act.

## Route A — record over the finished video (simplest)
Record the whole voice-over in a video/audio editor while watching the captioned video, delete or keep the
captions, done. Or mux a single recorded file: `python tools/mux.py --project projects/<slug> --voice voice.wav [--music bgm.mp3]`.

## Route B — record per line, re-time the video to fit (best sync)
1. Record one clip per script line: `001_narrator.wav`, `002_narrator.wav`, `003_ramu.wav` … into a folder (only the leading number matters).
2. `python tools/plan.py --project projects/<slug> --clips <folder>` — every line now lasts exactly as long as its clip.
3. `node render.mjs --project projects/<slug>` — re-render (fast).
4. `python tools/mux.py --project projects/<slug> --clips <folder> [--music bgm.mp3 --music-db -20]` → `<title>_voice.mp4`, each clip placed at its line's start, loudness-normalised to −14 LUFS.
Lip flaps follow the line timing, so with Route B the mouths move while the voice speaks.
