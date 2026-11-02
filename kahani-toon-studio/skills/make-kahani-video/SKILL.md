---
name: make-kahani-video
description: >
  This skill should be used when the user wants a 2D / 2.5D Indian village cartoon story video in the style
  of Hindi kahani YouTube channels (semi-realistic cut-out characters in saree, dhoti, kurta, pagdi and shirts
  on painted village sets: fields with palms and electric poles, banyan chaupal, mud huts, kirana shop,
  government office, bank), e.g. "make a Hindi kahani cartoon", "make a moral story video", "animate my Hindi
  story", "make a village story video like Bina Paise Ka Gaon", "turn this script into a cartoon",
  "make a Hindi cartoon story with captions", or "re-time the video to my voice-over". It writes the story
  and shot plan, renders every frame in code (no stick figures, no AI video), burns small Hindi captions
  as a voice-over guide, and exports the MP4, an SRT and a line-by-line voice-over script. Voice-over is
  recorded by the user later; the skill can re-time the video to the recorded clips and mux them.
metadata:
  version: "1.1.0"
---

# Kahani Toon Studio: Hindi village cartoon story videos

Make videos that look like Hindi kahani cartoon channels: flat-colour, thin-outlined, semi-realistic **cut-out
puppet characters** (proper proportions, 3/4 faces, big moustaches, sarees with pallu and border, dhoti-kurta,
Nehru vests, pagdi, gamchha) acting on **painted village sets**, cut like a TV serial: establishing wide shot,
two-shots, over-the-shoulder back views, waist-up close shots, slow camera push-ins. Characters blink, lip-flap
while they speak, gesture on each line, turn, walk. No voice is generated: every line is shown as a small
Hindi caption (with the speaker's name) so the user can record the voice-over later, and the timings are
exported as an SRT and a numbered voice-over script.

Everything is drawn by code in headless Chromium (≈80 fps at 1080p on a desktop), so characters stay
100% consistent from shot to shot. Backgrounds are code-painted by default; any location can be replaced by
a PNG the user makes in an image generator (`tools/bg_prompts.py` writes matching prompts).

**Bundled resources (this skill's base directory):**
- `kit/` — the studio: `render.mjs`, `player.html`, `engine/` (puppet, sets, scene), `tools/` (plan, new_project, doctor, bg_prompts, mux), `examples/imaandari/story.json` (a complete 1-minute reference story).
- `references/story-format.md` — **the story.json schema**: cast looks, outfits, poses, expressions, framings, camera moves, locations, per-line acting. Read before writing a story.
- `references/directing.md` — **how to shoot it so it looks like the reference channels**: shot grammar, framing per beat, pacing, crowd shots, what to avoid. Read before writing shots.
- `references/backgrounds.md` — the built-in sets, and the custom-image background route.
- `references/voiceover.md` — captions, SRT, the voice-over script, re-timing to recorded clips, muxing audio.

## Golden rules
1. **The look is fixed, the story is new.** Never fall back to stick figures or simple shapes. Use the puppet cast and the sets; give every character a distinct, fixed outfit colour.
2. **Show what is said.** Each line plays on a shot that shows who is speaking or what is described. Speakers face the person they talk to.
3. **Look before you render.** Render the cast line-up and the shot contact sheet and open the images yourself before the full render. Fix anything off-model, cropped heads, characters standing in walls, wrong facing.
4. **Hindi stays exact.** If the user gives a script, keep their words. If they give an idea, write natural, simple Hindi (Devanagari), short lines (≤ 14 words), as these channels do.
5. **Files are the truth.** One video = `kahani-studio/projects/<slug>/story.json`; `tools/plan.py` derives all timing from it.

## Stage 1: Intake
Ask once (AskUserQuestion when available), skipping anything already given:
- **Story:** a full Hindi script (with speaker names), a story idea/plot, or a reference video to imitate the story beat structure of.
- **Length:** 1–3 min short, 5–8 min, or 10–15 min (≈ 12–15 shots per minute).
- **Resolution:** 1080p (default) or 720p. 16:9 only.
- **Captions:** burned-in small Hindi captions with speaker names (default on), plus a clean version without captions if wanted.
- **Backgrounds:** code-painted (default, automatic) or the user's own generated images for some locations.
- **Title** (Hindi).

## Stage 2: Install or check the studio
1. Copy `kit/` into the workspace as `kahani-studio/` (skip if `kahani-studio/render.mjs` exists; never overwrite `projects/`). `cp -r "<skill>/kit/." kahani-studio/` or `Copy-Item -Recurse "<skill>\kit\*" kahani-studio\`.
2. Inside `kahani-studio/`: `npm install`, then `python tools/doctor.py --install` until every line is OK (needs Node 18+, ffmpeg, Python 3.8+; installs Playwright Chromium).
3. Self-test: `python tools/plan.py --project examples/imaandari` then `node render.mjs --project examples/imaandari --sheet --scale 0.5` and open `examples/imaandari/build/sheets/sheet_01.jpg`.

## Stage 3: Write the story
1. `python tools/new_project.py --name <slug> --title "<हिंदी शीर्षक>"` (run inside `kahani-studio/`).
2. Read `references/story-format.md` and `references/directing.md`, and look at `examples/imaandari/story.json`.
3. Write `projects/<slug>/story.json`: the **cast** (one entry per speaking character with `name` in Hindi and a distinct look), custom **locations** (named variants such as a bank built from `building` with a sign), and **scenes → shots → lines**. Every dialogue line gets `speaker`, `text`, and `acts` for pose/expression changes where the emotion matters.
4. `python tools/plan.py --project projects/<slug>`. Fix every warning (unknown cast id, pose, location). It prints the shot count and total duration; adjust if far from the target length.
5. Send the user a 5–10 line summary (cast, locations, beat outline, length) and continue unless they object.

## Stage 4: Look check
1. `node render.mjs --project projects/<slug> --cast` → open `build/cast.jpg`. Characters must be distinct and match the story (age, gender, status: seth in vest and gold, mukhiya in pagdi with cane, women in sarees).
2. `node render.mjs --project projects/<slug> --sheet --scale 0.5` → open every `build/sheets/sheet_NN.jpg`. Check against the QC list in `references/directing.md`. Fix story.json, re-run plan.py, re-check the changed shots.
3. Optional motion check: `node render.mjs --project projects/<slug> --from 10 --to 25 --scale 0.5` → `build/preview.mp4`.
4. If the user wants custom backgrounds: `python tools/bg_prompts.py --project projects/<slug>` → give them `backgrounds/PROMPTS.md`; when they've saved the images run `--link`, then plan.py again (see `references/backgrounds.md`).

## Stage 5: Render and deliver
1. `node render.mjs --project projects/<slug>` (add `--no-captions` for a clean copy). Long videos: run in the background; the log prints fps and ETA.
2. Outputs in `projects/<slug>/out/`: `<title>.mp4` (silent), `<title>_captions.srt`, `<title>_voiceover_script.txt` (numbered lines with timecodes, speaker and emotion).
3. QC the MP4: duration matches plan.py, and a 1-frame-per-10-s strip (`ffmpeg -i out.mp4 -vf "fps=1/10,scale=480:-1,tile=4x3" -frames:v 1 strip.jpg`) looks right.
4. Deliver: send the MP4 and the voice-over script, say where the files are, and explain the voice-over route in two lines (record per line → `plan.py --clips` → re-render → `mux.py`). See `references/voiceover.md`.

## Defaults
- 1080p, 25 fps, captions on with speaker names, code-painted sets, pace 2.4 Hindi words/s.
- 12–15 shots per minute; a new location always opens with a wide establishing shot; the title card is the first shot.
- When unsure about a shot: two-shot medium for dialogue, mcu for a strong emotional line, back-view over-the-shoulder for the reply.
