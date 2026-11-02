---
name: make-kahani-video
description: >
  This skill should be used when the user wants a 2D Indian village cartoon story video in the style of Hindi
  kahani YouTube channels (flat-colour characters in dhoti, saree, pagdi, topi and shirts in a village street,
  kitchen, houses, forest or cave), e.g. "make a Hindi kahani cartoon", "make a moral story video", "animate my
  Hindi story", "turn this script into a cartoon", "make a 30 second village story", "add a new character / scene
  to the kahani studio", "re-time the video to my voice-over", or "add my voice-over and music to the video".
  It writes the story as an episode script, reuses and extends a library of characters, scenes and props, renders
  every frame in code (no stick figures, no AI video), burns small Hindi captions as a voice-over guide and
  exports the MP4, an SRT and a numbered voice-over script. The voice-over is recorded by the user later; the skill
  can re-time the video to the recorded clips and mux them with music.
metadata:
  version: "2.0.0"
---

# Kahani Toon Studio 2: Hindi village cartoon story videos

Videos look like Hindi kahani cartoon channels: flat-colour characters with thin dark outlines, detailed faces
(almond eyes with lids, shaped nose, lips, soft shading), realistic proportions, acting in code-drawn village
scenes with parallax depth, sky presets (dawn, day, sunset, night) and a gentle camera. Characters walk with
planted feet, hold a gesture while they speak and ease into the next one, lip-flap, blink and look at whoever is
talking. No voice is generated: every line is a small Hindi caption (speaker name in colour) so the user can record
the voice-over later; timings are exported as an SRT and a numbered voice-over script.

Every frame is a pure function of time, rendered in headless Chrome/Edge (≈30 fps of video per second with 4
workers), so characters stay 100 % consistent and any frame can be checked on its own.

**Bundled resources (this skill's base directory):**
- `kit/` — the studio: `engine/` (puppet, actor, stage, story builder), `library/` (characters, scenes, props, gestures,
  skies), `episodes/` (`ep03` = a complete 31 s reference story; `ep02` = a 10 min story showing every builder feature;
  `posetest`, `looktest` = QC sheets), `tools/` (render, frames, export, clips, mux, new_episode, doctor, test, server), `web/` (player).
- `references/episode-format.md` — **the episode script API**: shots, lines, actor actions, gestures, cards, camera. Read before writing.
- `references/library.md` — every character, scene, sky, prop and gesture by name, with positions; how to add new ones.
- `references/directing.md` — shot grammar, pacing, positions and the QC checklist.
- `references/voiceover.md` — captions, SRT, voice-over script, re-timing to recorded clips, muxing voice and music.

## Golden rules
1. **The look is fixed, the story is new.** Use library characters and scenes; when a story needs something new (a
   temple, a school, a new villager), add it to `library/` in the same style. Never fall back to stick figures or
   placeholder shapes.
2. **Rig 3 always.** New episodes use `rig: 3` in the Story meta (the calm "kahani" movement and realistic proportions).
3. **Show what is said.** Each line plays on a shot that shows who speaks or what is described; speakers face the
   person they talk to (the builder makes listeners look at the speaker automatically).
4. **Look before you render.** Render QC frames (`tools/frames.mjs`) and open them yourself before the full render.
   Fix cropped heads, characters overlapping, feet under the caption strip, wrong facing.
5. **Hindi stays exact.** If the user gives a script, keep their words. If they give an idea, write natural, simple
   Hindi (Devanagari) in short lines (≤ 14 words).
6. **Files are the truth.** One video = `episodes/<id>/episode.js`; the builder derives all timing from the text
   (or from recorded clips).

## Stage 1: Intake
Ask once (AskUserQuestion when available), skipping anything already given:
- **Story:** a full Hindi script with speaker names, or an idea/plot.
- **Length:** 30 s–1 min short, 2–3 min, or 5–10 min (≈ 8–12 shots per minute).
- **Captions:** burned-in Hindi captions with speaker names (default), and/or a clean copy without.
- **Title** (Hindi).

## Stage 2: Install or check the studio
1. Find an existing studio in the workspace: a folder containing `engine/stage.js` and `episodes/` (for example
   `kahani-studio-v2/` or `kahani-studio-claude/kahani-studio/`). Use it and never overwrite its `episodes/` or `library/`.
2. Otherwise copy `kit/` to `kahani-studio-v2/` in the workspace: `cp -r "<skill>/kit/." kahani-studio-v2/`
   (PowerShell: `Copy-Item -Recurse "<skill>\kit\*" kahani-studio-v2\`).
3. In the studio folder: `npm install`, then `node tools/doctor.mjs` until ALL OK (Node 18+, ffmpeg + ffprobe on PATH or
   `FFMPEG`/`FFPROBE`, Chrome or Edge installed or `CHROME_PATH`).
4. Self-test: `node tools/frames.mjs ep03 out/selftest 12 20 --nocaps` and open the two PNGs.

All commands below run inside the studio folder. On Windows pass Windows-style paths (`C:\...`) to node, not `/c/...`.

## Stage 3: Write the episode
1. `node tools/new_episode.mjs ep<NN> "<हिंदी शीर्षक>"` → `episodes/ep<NN>/episode.js` (+ `clips.js`). Ids must start with `ep`.
2. Read `references/episode-format.md`, `references/library.md` and `references/directing.md`; look at `episodes/ep03/episode.js`.
3. Plan the cast and scenes from the library. If the story needs a new character, scene or prop, add it first
   (`references/library.md` → "Adding to the library") and register it in `library/manifest.json`.
4. Write the episode: `voices` (Hindi label + caption colour per speaker), a title card shot, then shots with
   `s.n(...)` narration and `s.say(...)` dialogue, walks, gestures, emotes, props.
5. Check timing: `node -e "import('./episodes/ep<NN>/episode.js').then(m=>{const e=m.default;console.log(e.meta.duration);for(const s of e.shots)console.log(s.id,s.t)})"`.
   Adjust waits and lines if far from the target length.
6. Send the user a 5–10 line summary (cast, scenes, beat outline, length) and continue unless they object.

## Stage 4: Look check
1. New characters: render `episodes/looktest` with them swapped in (edit its `who` list) → `node tools/frames.mjs looktest out/look 0.5 1.5 4.5 --nocaps`.
2. Pick 1–2 times per shot (the middle of each line, the end of each walk) and render them:
   `node tools/frames.mjs ep<NN> out/qc <t1> <t2> …` → open the PNGs (tile them with ffmpeg `xstack`/`tile` to view many at once).
   Check against the QC list in `references/directing.md`; fix the episode and re-check the changed shots.
3. `node tools/test.mjs` must print ALL PASS (unknown names, determinism, captions, missing files) for every `ep*` episode.

## Stage 5: Render and deliver
1. `node tools/render.mjs --ep ep<NN> --out out/ep<NN>.mp4 --workers 4` (add `--no-caps` and a different `--out` for a
   clean copy). Long videos: run in the background; it prints progress every 60 frames.
2. Outputs next to the MP4: `ep<NN>_captions.srt` and `ep<NN>_voiceover_script.txt` (numbered lines with time windows and speaker).
3. QC the MP4: a strip of frames (`ffmpeg -i out/ep<NN>.mp4 -vf "fps=1/4,scale=480:-1,tile=4x3" -frames:v 1 out/strip.png`) looks right.
4. Deliver: send the MP4 and the voice-over script, say where the files are, and explain the voice-over route in two
   lines (record one clip per numbered line → `tools/clips.mjs` → re-render → `tools/mux.mjs`). See `references/voiceover.md`.
5. Clean up QC folders in `out/`.

## Defaults
- 1920×1080, 30 fps, captions on with speaker names, rig 3.
- A title card first, a new scene opens on a wider shot, dialogue in a two-shot at zoom ≈ 1.5, a strong line closer (≈ 2.0).
- Lines are timed by reading speed (≈ 11 letters/s + 0.9 s) plus a 0.45 s pause; recorded clips override that.
