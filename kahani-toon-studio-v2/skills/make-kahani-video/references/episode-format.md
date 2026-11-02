# Episode script format (`episodes/<id>/episode.js`)

An episode is an ES module written with the story builder (`engine/script.js`). You write **lines** (narration and
dialogue) inside **shots**; the builder gives each line a reading time and derives shot lengths, captions, lip-flap,
speaking gestures and who looks at whom. Reference: `episodes/ep03/episode.js` (31 s), `episodes/ep02/episode.js` (every feature).

```js
import { Story, END } from '../../engine/script.js';
import clips from './clips.js';                     // recorded clip lengths (tools/clips.mjs); {} until recorded

const voices = {                                    // caption speaker tags; n = narrator (no tag)
  n: {}, ramu: { label: 'रामू', color: '#ffe08a' }, dada: { label: 'दादाजी', color: '#e8cfa0' },
};
const story = new Story({ id: 'ep04', title: 'माँ की चूड़ियाँ', rig: 3 }, voices, { clips });

story.shot('s1-talk', {
  scene: 'village-street', sky: 'day', in: 'dip',
  cam: [2140, 615, 1.55], camTo: [2150, 615, 1.66],          // [x, y, zoom] at shot start / end
  props: [{ id: 'birds', prop: 'birds', x: 1900, y: 240, z: -9999, n: 5 }],
  cast: { ramu: { x: 1980, y: 820, facing: 1 }, dada: { x: 2300, y: 800, facing: -1 } },
}, (s) => {
  s.n('सोनापुर गाँव में रामू नाम का एक मेहनती लड़का रहता था।');
  s.say('ramu', 'प्रणाम दादाजी!', { g: 'namaste', emote: { smile: 0.8 } });
  s.say('dada', 'खुश रहो बेटा।', { g: 'bless', emote: { smile: 0.9 } });
});

export default story.build();
```

## Story
`new Story(meta, voices, { clips })` — `meta`: `id` (= folder name), `title` (Hindi), **`rig: 3`** (always for new
episodes). `voices[id]`: `label` (Hindi name shown before the caption), `color` (caption tag colour; pick distinct ones).

## Shot spec
| key | meaning |
|---|---|
| `scene` | a scene id from `library/scenes` (see library.md) |
| `sky` | sky preset (`day`, `dawn`, `sunset`, `night`, `warm`, `nightRoom`, `eveRoom`, `cave`) or `[from, to]` to change across the shot (e.g. `['sunset','night']`) |
| `cam`, `camTo` | `[x, y, zoom]` in world pixels at the start / end of the shot (smooth). zoom 1.0 = wide, 1.5 = two-shot, 2.0–2.3 = close |
| `camKeys` | instead of camTo: `[[fraction, x, y, zoom], …]` with fraction 0..1 of the shot (pans that follow a walk) |
| `cast` | `{ id: { x, y, facing: 1 | -1, scale, char, z, listen } }`. `char` = library character when the id differs (two villagers from one spec). `listen: false` = doesn't turn to speakers. An actor that was in the previous shot can omit x/y/facing and continues where it ended |
| `props` | extra props in this shot: `{ id, prop, x, y, s, flip, z, …prop options }`. `z` = depth (default y); `-9999` = behind everyone |
| `in` / `out` | `'dip'` = fade through dark at the start / end (first and last shot always fade) ; `dip` = fade length (s) |
| `glow` | warm lamp glow 0–0.2 for interiors at night |

## Inside a shot: `(s) => { … }`
Time inside a shot is a **cursor** that advances with every line. Action times are seconds **relative to the cursor**;
`END` = until the end of the shot.

| call | what it does |
|---|---|
| `s.n(text, o)` | narrator line: caption, advances the cursor by its reading time + pause. `o.look = { id: target }` makes actors look somewhere during it |
| `s.say(who, text, o)` | dialogue: caption with tag, lip-flap, speaking gesture, everybody else looks at the speaker |
| `s.wait(sec)` | advance the cursor (silent beat, let a walk finish) |
| `s.walk(id, dur, x, y?)` | walk from the current position to x (and y) over dur seconds, starting now; facing follows the direction. A shot never ends before a walk finishes |
| `s.do(id, gesture, dur, opts)` | hold a gesture/pose from now for dur (END = to the end of the shot) |
| `s.look(id, target, dur)` | look at an actor id, `{ x, y }` in world pixels, or `'camera'` |
| `s.card({ kind, text, sub, size, y, bg, color }, dur, block = true)` | full-frame text: `kind: 'title'` (big gold lettering) or `'note'` (framed plate). `text` lines split by `|`. `block: false` = shown over the shot without advancing the cursor |
| `s.walkProp(propId, t0, t1, x)` | move a prop (a cart) between t0 and t1 |
| `s.act(id, tuple)` | any raw action tuple (below) |

### `say` options
`g` gesture while speaking (default `'speak'`: holds one auto-picked pose per ~2.6 s; `'speakR'` front hand only; or any
pose name like `'namaste'`, `'point'`, `'bless'`), `gopts` (`{ pose: 'explain' }` fixes the speaking pose, `{ angry: true }`
fists, `{ period: 3 }` slower changes), `emote` (face during the line), `fx` (`'question'`, `'sparkle'`, `'swirl'` above the
head until the shot ends), `to` (who the speaker looks at; default the previous speaker), `look: false` (speaker looks
nowhere in particular), `react: { id: { g, emote, fx } }` (listeners' reaction, held to the end of the shot),
`dur` / `pause` (override the timing).

### Action tuples for `s.act(id, [...])` (times relative to the cursor)
- `['do', gesture, t0, t1, opts]` — gesture or pose (eases in/out over 0.35 s; `opts.ramp` to change).
- `['hold', item, t0, t1, 'R' | 'L']` — item in the hand: `plate`, `plateEmpty`, `roti`, `bowl`, `ladle`, `spoon`, `bag`, `pot`, `torch`, `stick`, `morsel`, `coin`.
  Combine with a matching gesture (`hold` + `{ only: 'L' }` for a plate, `stir` with a ladle, `carryPot` with a pot, `torch`, `carryBag`).
- `['emote', t0, t1, { … }]` — face values, blended in over 0.4 s: `smile` (−1 sad … 1 happy), `brow` (−1 angry … 1 worried),
  `browRaise` (surprise), `browAsym`, `eyeOpen` (0.3 sleepy … 1.3 shocked), `sweat` (0–1), `headPitch` (+ = head down), `headRoll`.
- `['look', t0, t1, target]`, `['face', t, 1 | -1]` (turn), `['sit', t0, t1]` (sits on the ground/a stool), `['crouch', t0, t1]`,
  `['lean', t0, t1, radians]`, `['fx', t0, t1, 'question' | 'sparkle' | 'swirl']`, `['say', t0, t1]` (lip-flap without a caption).
- A gesture or sit that should already be in effect when a shot starts must begin a little before it (t0 = −0.5).

## Positions
World pixels per scene: `x` from 0 to the scene width, `y` = the feet line. Characters are ~340–370 px tall at zoom 1.
Standing spots: village-street / forest-night y 790–880 (larger y = nearer the camera, drawn in front); interiors y 860–880.
Two people in conversation stand 280–360 px apart. See library.md for each scene's width and good camera heights.
