# Directing: how to shoot a kahani episode

## Shot grammar
- **Title card** first: a wide scene at dawn/day with `s.card({ kind: 'title', text, sub }, 2.7, false)` and `s.wait(3.0)`.
- **New scene → wider shot** (zoom 1.0–1.15) that shows the place and who is there; then move in.
- **Dialogue** in a two-shot (zoom 1.45–1.7) centred between the two speakers. A strong line (anger, a secret, the moral)
  closer (zoom 2.0–2.3) on the speaker. Keep both speakers in frame unless the line is a close-up.
- **Every shot moves a little**: `cam` → `camTo` a slow push-in (zoom +0.05–0.12) or a 50–350 px drift. Follow a walk
  with `camKeys`.
- **Walks** cover 250–400 px per second (`s.walk(id, dur, x)`); a walk of 3–5 s reads well. Exit a character by walking
  off-frame. Don't walk through another character; walk away from them or around (change y).
- **Reactions**: listeners react with `react: { id: { g: 'shock', emote: { eyeOpen: 1.25 } } }` or an `emote` tuple.
  Use `fx: 'question'` for confusion, `'sparkle'` for joy or a good idea, `'swirl'` for a spell or dizziness.
- **Moral / ending**: a calm shot with narration, characters smiling (`emote: { smile: 0.9 }`), optionally a `note` card.
- Fade (`in: 'dip'`) when time or place changes.

## Pacing
- ≈ 8–12 shots per minute; a shot holds 1–4 lines. Narration lines ≤ 14 words; dialogue lines ≤ 12 words.
- Reading time per line ≈ 0.9 s + 0.088 s per letter, plus a 0.45 s pause (the builder does it). A 30 s short is a title
  (3 s) + 6–8 lines.
- Same speaker, several lines in a row: they keep one gesture phrase going (no restart).

## Acting
- Speakers: default `speak` gesture; use a pose for meaning: `namaste` (greeting), `bless` (elder blessing), `point`
  (there / you), `chest` (me / my), `think`, `shrug`, `angry` / `gopts: { angry: true }`, `cry`, `worried`, `hips` (scolding).
- Faces carry the emotion: `smile` and `brow` with every important line; `eyeOpen: 1.2` + `browRaise` for surprise.
- Elders use slower gestures (`gopts: { period: 3.4 }`).

## Positions and framing
- Feet must stay above the caption strip: on village-street keep camera y ≈ 600–625 at zoom ≤ 1.7.
- Characters 280–360 px apart for a two-shot; nearer characters have larger y (drawn in front).
- Facing: set `facing` so speakers face each other; the builder turns them for walks.

## QC checklist (open the frames yourself)
- [ ] Heads not cropped at the top; feet not hidden by the caption box.
- [ ] Nobody overlaps another character's face; no character inside a house or a cart.
- [ ] Speakers face each other; the speaker's caption tag matches who is moving their mouth.
- [ ] Gestures match the line (namaste when greeting, pointing at the right side).
- [ ] Walks end where the next shot expects the character (positions carry over between shots).
- [ ] Night scenes are readable (sky `night` with `glow` for interiors).
- [ ] Captions ≤ 2 lines and not cut off; title card readable.
- [ ] `node tools/test.mjs` → ALL PASS.
