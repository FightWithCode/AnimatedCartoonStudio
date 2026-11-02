# Backgrounds

## Built-in painted sets
All have `day`, `evening` and `night` versions (night: blue grade, stars and moon, glowing windows).
Preview them: `node render.mjs --project <project> --sets --times day,night`.

| set | what it is | good for |
|---|---|---|
| `village` | open dirt road, green fields, coconut palms, distant huts, electric poles and wires | walking, meeting on the road, narration |
| `chaupal` | huge banyan with aerial roots, raised platform, charpai, mud houses | panchayat, elders, gossip, village gathering |
| `lane` | lane between tiled-roof mud houses | neighbours, entering a house, night walks |
| `courtyard` | aangan with veranda pillars, tulsi platform, charpai, clothesline | family scenes at home |
| `fields` | crops (`variant: "gold"` for wheat), brick well, mango tree | farmers, harvest, the well |
| `building` | pucca building with a sign (`sign`, `wall`, `trim`, `open`) | bank, school, medical store, panchayat bhawan, police chowki |
| `hut` | poor mud hut inside: barred windows with light shafts, chulha, pots, charpai | poverty, family talks, night worry |
| `shop` | kirana shop inside: packed shelves, sachets, counter (foreground) with jars and scale | shopkeeper scenes (`layer: "back"` behind the counter) |
| `office` | manager/officer cabin: blinds, clock, calendar, cupboard, desk (foreground) | bank manager, sarpanch office, doctor |

Make variants in `locations` (see story-format.md), e.g. a medical store:
`"medical": { "base": "building", "options": { "sign": "PANKAJ MEDICAL STORE\nVillage Pharmacy", "trim": "#2a8a4a", "open": true } }`.

## Custom image backgrounds (closest to the reference look)
The reference channels use richly painted backgrounds. To match that for some or all locations:
1. `python tools/bg_prompts.py --project projects/<slug>` → `backgrounds/PROMPTS.md` with one prompt per location/time used, already styled (2D Indian cartoon background, painterly, empty lower third, no people/text).
2. The user generates each image in any image generator at 16:9 and saves it as `backgrounds/<location>_<time>.png`. A location the story needs that isn't a built-in set (temple, river ghat, school classroom, hospital) can be added in `locations` with a `"prompt"` text first, then generated the same way.
3. `python tools/bg_prompts.py --project projects/<slug> --link` → registers the images in story.json, then `python tools/plan.py --project projects/<slug>`.
4. Check the sheet: feet must land on the ground. Adjust that location's `"ground"` (0.85–0.95) if characters float or sink in wide shots.

Images are cropped to fill 16:9 and slightly zoomed (camera moves need the margin). Closer framings zoom the
background a little (the 2.5D parallax), so use images of 1920×1080 or larger. Foreground occlusion
(counters, desks) exists only for the built-in `shop`/`office` sets.
