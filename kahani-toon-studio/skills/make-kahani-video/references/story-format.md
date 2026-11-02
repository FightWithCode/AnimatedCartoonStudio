# story.json format

One file per video: `projects/<slug>/story.json`. `tools/plan.py` turns it into `build/timeline.json`.
Complete example: `kit/examples/imaandari/story.json`.

```json
{
  "title": "ईमानदारी का फल",
  "resolution": "1080p",          // 720p | 1080p | 1440p (16:9)
  "fps": 25,
  "captions": true,               // burned-in Hindi captions (render --no-captions for a clean copy)
  "speakerLabels": true,          // "रामू: ..." in the caption
  "captionSize": 0.04,            // fraction of frame height
  "pace": 2.4,                    // Hindi words per second used to time lines
  "lineGap": 0.25,                // pause between lines (s)
  "cast": { "<id>": { ...look } },
  "locations": { "<name>": { ...variant } },
  "scenes": [ { "location": "village", "time": "day", "shots": [ ...shot ] } ]
}
```

## cast: character looks
Key = the id used in shots and as `speaker`. Every field except `name` is optional.

| field | values / meaning |
|---|---|
| `name` | Hindi display name, shown in captions ("रामू") |
| `gender` | `m` (default) / `f` |
| `age` | `child` / `young` (no moustache) / `adult` / `old` (grey hair, wrinkles) |
| `outfit` | `shirt-pants`, `shirt-dhoti`, `kurta-dhoti`, `kurta-pajama`, `vest-kurta-dhoti`, `lungi`, `saree`, `lehenga`, `school` (boy), `frock` (girl) |
| `topColor`, `bottomColor` | shirt/kurta/blouse colour; pants/dhoti/saree colour (hex) |
| `border` | saree/lehenga border colour (default gold `#f0c02c`) |
| `pattern` | `dots`, `flowers`, `checks`, `stripes` on the shirt/kurta (saree: on the saree) |
| `vest` | Nehru vest colour (`null` for none) — village elite, seth, mukhiya |
| `scarf`, `scarfStyle` | gamchha/dupatta colour; `both` (ends down the front, default) or `shoulder` |
| `sleeves` | `long` / `short`; `tucked: true` puts a shirt in the pants with a belt (officials) |
| `skin` | `fair`, `wheat`, `medium`, `brown`, `dark` or hex |
| `hair` | men: `short`, `neat`, `wavy`, `puffy`, `kid`, `balding`, `none`; women: `bun`, `bun-low`, `braid`, `open`, `pigtails` |
| `hairColor` | `black`, `darkbrown`, `grey`, `salt`, `white` or hex |
| `mustache` | `thick`, `bushy`, `handlebar`, `thin`, `none` (adult men default `thick`) |
| `beard` | `none`, `stubble`, `goatee`, `full` |
| `headwear` | `pagdi` (+`pagdiColor`), `topi` (Gandhi cap), `ghunghat` (saree over the head) |
| `glasses` | `true` / `"gold"` |
| `jewelry` | women `gold` (necklace, earrings, mangalsutra), men `gold` = gold chains (seth) |
| `bangles`, `bindi`, `tilak`, `noseRing`, `flowers` (gajra in the bun) | small details |
| `build` | `slim`, `medium`, `heavy` (belly: seth, sahukar) |
| `height` | multiplier (child default 0.64, women 0.93) |
| `feet` | `chappal`, `shoes`, `bare` |
| `prop` | always-held prop: `cane`, `bag`, `basket` (on head), `paper`, `coins`, `pot` |

Keep a fixed palette per character for the whole video, and make the main pair contrast (e.g. hero in
maroon/rust, wife in pink saree with blue blouse, villain in red vest).

## locations
The built-in sets: `village`, `chaupal`, `lane`, `courtyard`, `fields`, `building`, `hut`, `shop`, `office`
(details in `backgrounds.md`). Use one directly as a scene `location`, or define a named variant:

```json
"locations": {
  "bank":      { "base": "building", "options": { "sign": "GRAMIN BANK" } },
  "medical":   { "base": "building", "options": { "sign": "PANKAJ MEDICAL STORE", "wall": "#f4e9d0", "trim": "#2a8a4a", "open": true } },
  "farm":      { "base": "fields", "options": { "variant": "gold" } },
  "my_temple": { "images": { "day": "backgrounds/my_temple_day.png", "night": "backgrounds/my_temple_night.png" }, "ground": 0.9 }
}
```
`images` replaces the painted set with the user's picture for that time of day (`interior: true` dims
characters slightly indoors); `ground` is where feet go in wide shots (fraction of frame height).

## scenes and shots
A scene groups shots in one location and time (`day`, `evening`, `night`); a shot may override both.
A change of location/time gets a short dip to black automatically.

```json
{ "framing": "medium", "cam": "push",
  "chars": [ { "id": "sita", "x": 0.3, "expr": "worried" },
             { "id": "ramu", "x": 0.72, "view": "back", "prop": "bag" } ],
  "lines": [ { "speaker": "sita", "text": "घर में खाने को कुछ नहीं है…", "acts": { "sita": { "pose": "open" } } } ] }
```

| shot field | meaning |
|---|---|
| `framing` | `wide` (full bodies small, set visible), `full` (full body, large), `medium` (knees up), `mcu` (waist up), `close` (chest up) |
| `cam` | `push` (slow push-in), `pull`, `zoom` (strong push, drama), `panL`, `panR`, `static` (tiny drift). Default cycles through a mix |
| `chars` | characters in shot (see below); may be empty for an establishing shot |
| `lines` | dialogue/narration lines played on this shot, in order |
| `dur` | minimum shot length (s); shots without lines default to 2.5 s |
| `title`, `subtitle` | big Hindi title card text over the shot |
| `lead`, `tail` | silence before the first line / after the last (default 0.3 / 0.35 s) |
| `setOptions` | per-shot set options (e.g. a different `sign`) |

Character in a shot:

| field | meaning |
|---|---|
| `id` | cast id — or `"extra": N` (0–9) for a generic villager in crowd shots |
| `x` | horizontal position, 0 = left edge, 1 = right edge (keep 0.12–0.88) |
| `y` | feet offset (fraction of frame height); negative = higher (further back), e.g. `-0.06` behind a desk |
| `scale` | size multiplier; 0.85–0.95 for people further back in wide shots |
| `facing` | `left`/`right`; default = toward the other characters |
| `view` | `3q` (default), `front`, `back` (over-the-shoulder) |
| `pose`, `expr`, `prop` | starting pose / expression / prop |
| `layer` | `back` = behind the set's foreground (shopkeeper behind the counter, officer behind the desk) |
| `walk` | `{ "from": 0.1, "to": 0.5, "start": 0, "end": 3 }` (seconds into the shot) |

## lines
| field | meaning |
|---|---|
| `speaker` | cast id, or `narrator` (caption without a name, nobody's mouth moves) |
| `text` | the exact Hindi line (also the caption and the voice-over script) |
| `dur` | override the auto duration (s) |
| `acts` | `{ "<id>": { "pose": "...", "expr": "...", "view": "...", "facing": "...", "prop": "..." } }` changes that start with this line and persist |

The speaker lip-flaps and nods; if the speaker has no explicit pose they get an automatic talking gesture that
changes each line. Listeners keep their pose.

**Poses:** `idle`, `explain` (forearm out, palm up), `explain2` (other hand), `point`, `open` (both palms out),
`shrug`, `chest` (hand on heart), `hips`, `namaste`, `think` (hand to chin), `worried` (hands clasped),
`folded`, `wave`, `cane`, `headload` (with `prop: basket`), `give` (offering, with `bag`/`coins`/`paper`),
`angry` (fist), `bless`, `cry`, `sit`.

**Expressions:** `neutral`, `happy`, `smile`, `sad`, `angry`, `surprised`, `worried`, `thinking`, `sly`,
`crying`, `proud`.
