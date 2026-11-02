# The library (`library/`)

Everything reusable lives here and is referenced by name from episodes. Anything added for one story is available to
every later story. `library/manifest.json` lists which characters and scenes are loaded.

## Characters (`library/characters/<id>.json`)
| id | who | look |
|---|---|---|
| `ramu` | cart seller / young villager | blue turban, light-blue short-sleeve shirt with pocket, white dhoti, moustache |
| `sita` | Ramu's wife | red saree + blouse, bun, bindi, sindoor, bangles, earrings, necklace |
| `mohan` | neighbour | dark olive polo shirt, white dhoti |
| `bhola` | customer / villager | green kurta, white dhoti, moustache |
| `dada` | village elder (Dadaji, mukhiya) | white topi, white hair and moustache, cream shirt, brown vest, wrinkles |
| `kishan` | kind food seller | orange turban, yellow shirt with pocket, white dhoti, moustache |
| `meera` | Kishan's wife | green saree, bun, bindi, sindoor, bangles, earrings, necklace |
| `sajan` | Mohan's wife | purple saree, bun, bindi, sindoor, bangles, earrings, necklace |
| `neha` | city visitor (woman) | pink kurta, purple pants, bun, bindi, earrings, bangles |
| `rakesh` | city visitor (man) | blue polo shirt, khaki pants |

Reuse a character under another name with `cast: { gopal: { char: 'bhola', … } }` (and a `voices.gopal` label).

### Character spec fields
```json
{ "id": "raju", "name": "Raju (farmer)", "height": 362, "seed": 11, "skin": "#c68a5a",
  "build": { "sw": 1.0, "ww": 1.0 },                         // shoulder / waist width factors (0.85 slim … 1.15 heavy)
  "hair": { "style": "short | bun | curly | elder", "color": "#1b130e" },
  "headwear": { "type": "turban | topi", "color": "#d9822b", "tail": true },
  "face": { "moustache": "#1b130e", "brow": "#1b130e", "browThick": 5, "eyeScale": 1.0, "iris": "#3a2412",
            "nose": 1.0, "lash": true, "blush": "#e56a6a" },   // lash = female eyes and lips
  "top": { "type": "shirt | kurta | polo | blouse", "color": "#efd48a", "sleeve": "long | short | none",
           "pocket": true, "vest": "#6a3d22", "pallu": "#3aa56a", "border": "#e8c24a" },
  "bottom": { "type": "pants | dhoti | saree", "color": "#f1ece0", "border": "#8a5a2a" },
  "shoes": { "color": "#6a4428", "kind": "sandal | shoe | bare" },
  "extras": { "bindi": "#b01a1a", "sindoor": "#c0261b", "bangles": "#e8c24a", "earring": "#e8c24a",
              "necklace": "#e8c24a", "wrinkles": true } }
```
Heights: men 355–372, women 336–345, elders 350, children ~260 with `"eyeScale": 1.1`. Give every speaking character a
distinct top colour. Women: `top.type: "blouse"` + `bottom.type: "saree"` + `face.lash: true`.

## Scenes (`library/scenes/<id>.json`)
| id | what | width | ground | stand y | camera y |
|---|---|---|---|---|---|
| `village-street` | open village road: tile houses, huts, fence, trees, palms, mountains, cow, bench | 4400 | 742 | 790–880 | 590–625 |
| `forest-night` | forest edge with mountains, moon, palms, a cave mouth (default sky night) | 4400 | 742 | 820–860 | 600–625 |
| `kitchen` | mud-house kitchen: chulha, shelves, matka, sacks, hanging lamp (interior) | 2400 | 800 | 860–880 | 600–640 |
| `mohan-house` | the same room with a calendar and a mat (interior) | 2400 | 800 | 860–880 | 600–640 |
| `kishan-evening` | the room in evening light (interior) | 2400 | 800 | 860–880 | 600–640 |
| `cave-inside` | dark cave with torches and rocks (interior) | 2400 | 800 | 860–880 | 600 |

Interiors ignore the sky gradient; use `sky: 'warm'`, `'eveRoom'` or `'nightRoom'` for their colour grade.
Scene file: `{ id, width, ground, sky, interior, backdrop, layers: [{ parallax, front, items: [{ prop, x, y, s, flip, …options }] }] }`.
`parallax` 0 = fixed with the camera (sky), 0.1–0.6 = distant layers, 1 = the actors' world; `front: true` = drawn over the actors.

## Skies (`library/skies.json`)
`day`, `dawn`, `sunset`, `night` (stars), `warm`, `nightRoom`, `eveRoom`, `cave`. Each is a gradient + colour grade (+ sun).

## Props (`library/props/*.js`, registered with `defineProp(name, (ctx, t, o) => …)`)
Origin = ground contact point, y up is negative, sizes in world pixels at s = 1. Options in brackets.
- Buildings: `tilehouse` [w h wall roof door doorX windows shutter base rh], `flathouse` [w h wall trim door shutter base],
  `hut` [w h wall thatch], `wall` [w h color], `fence` [w h], `bench` [w], `matka` [r], `cow` [color]
- Nature: `tree` [h r leaf seed], `palm` [h lean seed], `bush` [w leaf flowers seed], `grass` [w leaf seed], `rock` [w],
  `ground` [w h color grass verge seed], `mountains` [w h colors haze seed], `cloud` [w color drift seed], `birds` [n]
- Food stall: `foodCart` [menu sign body stand roll seed] (sign `'किशन|आलू पूरी'`), `curryPan` [rx seed], `rotiBasket` [n w],
  `plate` [r food], `bowl` [r], `puriBasket` [w]
- Interior: `room` [w h wall floor ceiling], `windowWood` [w h sky], `doorWood` [w h], `shelf` [w seed], `rack` [w],
  `chulha` [w h steam seed], `mat` [w], `stool`, `sack`, `hangingLamp` [len], `calendar` [text sub]
- Night / mystery: `moon` [r glow], `cave` [w h rock eyes seed], `caveRoom` [w h rock cx cy seed], `eyes` [w h eyes glow look], `wallTorch` [text sub seed]

## Gestures and poses (`library/gestures.js`)
**Rig-3 poses** (`POSES`, arm angles that ease into each other): `idle`, `explain`, `explain2`, `point`, `pointDown`, `open`,
`shrug`, `chest`, `hips`, `namaste`, `think`, `worried`, `folded`, `wave`, `give`, `offer`, `angry`, `bless`, `cry`, `sit`, `scratch`.
**Action gestures** (`GESTURES`, hand targets, converted to angles in rig 3): `speak`, `speakR`, `talk`, `eat` / `eatFast`
(with a plate in L), `stir` (ladle), `hold` (`{ only: 'L' }` plate), `offer`, `carryHandle`, `carryBag`, `carryPot`, `torch`,
`count`, `beckon`, `knock`, `wipe`, `cheer`, `chant`, `shush`, `clasp`, `rub`, `fear` (shaking), `shock`, `sad`, `worry`, `scratch`.

## Adding to the library
- **Character:** copy a similar JSON in `library/characters/`, change `id`, `name`, colours, hair, headwear, extras and a new
  `seed`; add the id to `manifest.json` → `characters`. Check it with `episodes/looktest` (edit its `who` list).
- **Prop:** add `defineProp('temple', (ctx, t, o) => { … })` to a file in `library/props/` (or a new file imported from
  `library/props/index.js`). Draw with the helpers in `engine/draw.js` (`poly`, `ellipse`, `rrect`, `fill(ctx, color, outline)`,
  `vgrad`, `hgrad`, `shade(color, ±k)`): flat fills, a darker shade for depth, `OUT`-coloured 2–3 px outlines, like the existing props.
  Keep it a pure function of `t` and `o` (use `mulberry32(o.seed)` for randomness).
- **Scene:** a new JSON in `library/scenes/` with layers of props (sky-fixed mountains/clouds at parallax 0.02–0.1, distant trees
  and houses at 0.28–0.6, the world at 1, foreground grass/bushes with `front: true`); add the id to `manifest.json` → `scenes`.
- **Pose:** add an entry to `POSES` (`R` = front arm, `L` = back arm, each `[upper-arm angle°, elbow bend°, hand]`; angles are
  "outward positive", hands `relaxed | open | point | fist | pinch | under`) and check it with `episodes/posetest`.
