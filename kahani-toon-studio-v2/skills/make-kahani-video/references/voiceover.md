# Captions and the voice-over route

The studio does not generate voices. It gives the user everything needed to record them afterwards.

## What every render produces (next to the MP4, e.g. `out/`)
- `ep<NN>.mp4` — silent video with small Hindi captions at the bottom: speaker name in its colour, line in white
  (narration has no name). `--no-caps` renders without captions.
- `ep<NN>_captions.srt` — the same lines as subtitles (for YouTube, or as a teleprompter in an editor).
- `ep<NN>_voiceover_script.txt` — numbered lines: `003  [00:12.4 - 00:15.0]  (2.6s)  रामू: मेले में! …`
  The number is the clip name to record; the window is how long the line is on screen.
- Re-export without rendering: `node tools/export.mjs --ep ep<NN> [--dir out]`.

## Route A — one recording over the finished video (simplest)
Record the whole voice-over while watching the captioned video, then
`node tools/mux.mjs --ep ep<NN> --voice voice.wav [--music bgm.mp3 --music-db -20]` → `out/ep<NN>_voice.mp4`
(add `--video <file>` if the MP4 is not `out/ep<NN>.mp4`).

## Route B — one clip per line, video re-timed to fit (best sync)
1. Record one clip per script line into a folder: `001_narrator.wav`, `002_ramu.wav`, … (only the leading number matters;
   wav/mp3/m4a/aac/ogg/flac).
2. `node tools/clips.mjs --ep ep<NN> --clips <folder>` → writes `episodes/ep<NN>/clips.js`; every line now lasts exactly as long
   as its clip (the episode must pass `{ clips }` to `new Story`, as the template does).
3. `node tools/render.mjs --ep ep<NN> --out out/ep<NN>.mp4` — re-render (the captions and lip-flap follow the new timing).
4. `node tools/mux.mjs --ep ep<NN> --clips <folder> [--music bgm.mp3 --music-db -20]` → `out/ep<NN>_voice.mp4`, each clip
   placed at its line's start, voice normalised to −14 LUFS, music ducked under the voice, audio padded to the video length.
5. `node tools/clips.mjs --ep ep<NN> --clear` returns to reading-time pacing.
