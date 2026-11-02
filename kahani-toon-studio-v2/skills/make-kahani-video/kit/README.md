# Kahani Studio

A small Node + Canvas toolkit for making silent 1920×1080 @ 30 fps cartoon episodes in the flat 2D "village story" style.
Everything is drawn in code (no image assets), and everything reusable lives in `library/` so the next episode starts
from the same characters, props and scenery.

```
library/
  characters/*.json   reusable characters (skin, hair, headwear, clothes, extras) – data only
  scenes/*.json       persistent scenery: parallax layers of props (village-street, kitchen)
  skies.json          sky + colour-grade presets (night, dawn, day, sunset, warm)
  gestures.js         named hand/arm gestures (stir, eat, explain, namaste, carryHandle …; rig-2: speak, fear, shock, chant …)
  props/*.js          prop drawing functions registered by name (tree, tilehouse, foodCart, chulha …)
  manifest.json       which characters / scenes get loaded
engine/               puppet (rig + IK), actor timeline compiler, stage (camera, layers, grade, captions, cards), script.js (story builder)
episodes/ep01/episode.js   a hand-timed episode (shots, cast, props, captions, narration text)
episodes/ep02/episode.js   a longer episode written with the story builder (see below)
web/                  browser player (play / scrub / CC)
tools/                render.mjs (MP4), test.mjs, shot.mjs (single frame), server.mjs
```

## Run

```bash
npm install                     # puppeteer-core + @sparticuz/chromium (headless Chromium), needs ffmpeg on PATH
node tools/server.mjs           # player at http://localhost:8080/   (Space = play, C = captions, ←/→ = seek)
node tools/test.mjs             # structure / determinism / caption checks
node tools/render.mjs --ep ep01 --out out/ep01.mp4 --workers 2          # 1920x1080, 30 fps, silent, captions burned in
node tools/render.mjs --ep ep01 --out out/ep01_nocaps.mp4 --no-caps     # same without subtitles
node tools/shot.mjs frame.png "t=31&ep=ep01&nocaps=1"                    # one frame
node tools/frames.mjs ep02 out/frames 12 95.5 240 --nocaps              # several frames in one browser session
```

Every frame is a pure function of its time `t`, so seeking, pausing and parallel rendering are all exact.

## Add a character

Copy `library/characters/ramu.json`, change the fields, add its id to `library/manifest.json`, then use it in an
episode: `cast: { raju: { char: 'raju', x: 900, y: 850, script: [...] } }`.
`top.type`: `shirt | kurta | polo | blouse` (+ `vest`), `bottom.type`: `pants | dhoti | saree`,
`hair.style`: `short | bun | curly | elder`, `headwear.type`: `turban | topi`, `extras`: bindi, bangles, earring, necklace, wrinkles.

## Add a prop or scene

* Prop: in `library/props/*.js` call `defineProp('name', (ctx, t, o) => { … })` (origin = ground contact, y up is negative).
* Scene: a JSON file in `library/scenes/` with `layers: [{ parallax, items: [{ prop, x, y, s, … }] }]`
  (`parallax` 0 = fixed sky, 1 = world, `front: true` = drawn over the actors). Add its id to the manifest.
* Anything you build for one episode is automatically available to every later episode.

## Script an episode

Each shot: `{ id, t:[start,end], scene, sky, camera:[[t,x,y,zoom]…], props:[…], cast:{…} }`.
Actor script tuples: `['walk',t0,t1,x,(y)]`, `['say',t0,t1]`, `['do','explain',t0,t1,{…}]`,
`['hold','plate',t0,t1,'R']`, `['look',t0,t1,'ramu'|{x,y}]`, `['face',t,±1]`, `['sit',t0,t1]`,
`['emote',t0,t1,{ smile, brow, eyeOpen … }]`. A gesture or sit that should already be in effect at the start of a
shot must begin a little before it (weights ease in over ~0.3 s).

## Windows / macOS

`@sparticuz/chromium` only ships a Linux build, so `tools/env.mjs` picks a local Chrome/Edge instead (override with `CHROME_PATH`).
ffmpeg is taken from `PATH`, or from `FFMPEG` / `FFPROBE` (e.g. the binaries from the `ffmpeg-static` / `ffprobe-static` npm packages).

## Story builder (`engine/script.js`) and rig 2

`episodes/ep02` is written as a list of *lines* instead of absolute times. Each `s.n(text)` (narrator) or `s.say(who, text)` (dialogue)
gets a reading time from its length (≈ 11 letters / s + a settle), and the builder derives from that the shot length, the captions
(max 2 lines, coloured speaker tag), the narration track, lip-flap, a continuous gesture phrase for the speaker and the gaze of everybody else.
Actor tuples take seconds *relative to the cursor* (`END` = end of the shot); an actor that continues into the next shot keeps its position;
a shot is never cut while a walk is still in progress. Extras: `s.card({kind:'title'|'note', text, sub, bg}, dur)` full-frame cards,
`say(..., {fx:'swirl'|'question'|'sparkle', react:{ id:{ g, emote } }})`, `s.walkProp('cart', t0, t1, x)`.

`meta.rig: 2` switches an episode to the newer arms (ep01 stays on rig 1 and renders byte-identically):

* **continuous elbow** – the elbow side follows a smooth pole vector (down + outward). The rig-1 solver flips the elbow between two
  solutions (up to ~120 px in one frame, e.g. in the old `talk` gesture); rig 2 moves it ≤ 2 px per frame.
* **beat-based speech** – `speak` / `speakR` build two-handed phrases from emphasis poses (an arc to a new pose every ~1.6 s, small
  overshoot, slow drift), chosen deterministically from the beat number and the actor's seed, so frames stay seek-safe.
* shoulders rise with a raised hand, resting hands breathe and sit slightly away from the hips, gestures ease in/out over 0.5 s.
* new effects/poses: `fx` tuples (`swirl`, `question`, `sparkle`), `sweat`, `shake` (fear), held `pot` and `torch`.

To move an old episode over, add `rig: 2` to its `meta` (its `say` tuples then also use the two-handed speech gesture).

## Rig 3 (the "kahani" movement)

`meta.rig: 3` swaps in the movement of the original Kahani Toon Studio while keeping these characters (ep01/ep02 are unchanged):

* **angle poses** – arms are `[upper-arm angle, elbow bend, hand]` poses (`POSES` in `library/gestures.js`: idle, explain, explain2, point,
  open, shrug, chest, hips, namaste, think, worried, folded, wave, give, offer, angry, bless, cry, sit, scratch) that ease into each other
  over 0.35 s. Use them like any gesture: `['do', 'namaste', t0, t1]` or `s.say(who, text, { g: 'bless' })`. Gestures without a pose
  (eat, stir, hold, carryPot, fear …) are solved once with IK and converted to angles, so they blend the same way.
* **speaking** – `speak` holds one gesture per ~2.6 s beat (auto-picked from `AUTO_GESTURES`) and the front hand sways a few degrees;
  `gopts: { pose: 'explain' }` fixes the pose, `{ angry: true }` uses fists.
* **walk** – pendulum legs, knee bends on the swinging leg, the hip drops so the planted foot stays on the ground, arms swing
  against the legs; the stride phase follows the distance walked, so feet do not slide.
* **face** – phrase-shaped noise lip-flap, irregular blinks, a gentle head sway that grows while talking.
* **proportions** – shorter, tapered arms (wrist at the hip), hands at 74 %, head at 90 %, a slim neck shadowed under the jaw.
  All rigs share the newer face: almond eyes with lids and crease, shaped nose with nostrils, lips, ear folds, soft shading.

QC sheet of every pose: `node tools/frames.mjs posetest out/qc 0.7 1.7 2.7 …` (one pose per second). Example: `episodes/ep03` (~31 s).

## Tools

```bash
node tools/doctor.mjs                                   # check Node, ffmpeg, Chrome/Edge, packages, fonts
node tools/new_episode.mjs ep04 "शीर्षक"                 # new episode from the template (episodes/ep04/episode.js + clips.js)
node tools/frames.mjs ep04 out/qc 5 12.5 20            # QC frames (PNG) at given times; --nocaps to hide captions
node tools/render.mjs --ep ep04 --out out/ep04.mp4      # MP4 + ep04_captions.srt + ep04_voiceover_script.txt
node tools/export.mjs --ep ep04                         # only the SRT + voice-over script
node tools/clips.mjs --ep ep04 --clips voice/          # re-time lines to recorded clips 001_*.wav … (--clear to undo)
node tools/mux.mjs --ep ep04 --clips voice/ [--music bgm.mp3 --music-db -20]   # or --voice one.wav → out/ep04_voice.mp4
node tools/test.mjs                                     # checks every ep* episode
```
