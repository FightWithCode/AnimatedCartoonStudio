# Directing: making it look like a Hindi kahani cartoon channel

The reference channels cut like a TV serial with puppets: lots of short dialogue shots, characters standing,
gesturing and reacting, the camera always slowly moving. Copy that grammar.

## Shot grammar
1. **Open every new location with a `wide` establishing shot** (2.5–4 s), with narration or the first line.
   Put villagers (`extra`) in public places — chaupal, bank, market — at `scale` 0.85–0.95 to fill the frame.
2. **Dialogue = alternating two-shots and over-the-shoulder shots.**
   - Two-shot: `medium`, A at x≈0.28, B at x≈0.72, both 3q, facing each other.
   - Over-the-shoulder (the signature look): listener in `view: "back"` at x≈0.25–0.3, speaker 3q at x≈0.68–0.72, `medium`.
     Reverse it for the reply (swap sides and who is in back view).
   - A strong line (anger, shock, a decision, the moral) gets an `mcu` or `close` single with `cam: "zoom"` or `push`.
3. **One or two lines per shot**, 2–6 s each. Long speeches: split over 2–3 shots (two-shot → mcu → OTS).
4. **Entrances/exits**: `walk` in a `wide` or `full` shot.
5. **Interiors**: shopkeepers and officers stand behind the counter/desk with `layer: "back"` (officer `y: -0.06`), customers in front.
6. **Time passing**: an empty `wide` of the next location, or the same place at `evening`/`night`.
7. **End** on the moral: wide or full of the family/village, narrator line "सीख: …", `cam: "pull"`.

## Acting
- Give every emotional line an `expr` (and often a `pose`) in `acts`; listeners react in the same line (`"sita": {"expr": "sad"}`).
- Elders: `cane` pose and prop. Pleading: `namaste`. Accusing: `point` + `angry`. Explaining: leave it to auto gestures.
- Keep screen direction: within a scene, A stays left and B right unless someone walks across.

## Pacing
- 12–15 shots per minute. Narration over establishing shots, dialogue over character shots.
- `pace` 2.4 words/s suits the calm storytelling voice of these channels; use 2.6–2.8 for quick dialogue.

## QC checklist (contact sheet)
- No head cropped at the top in `medium`/`mcu`; nobody cut in half at the frame edge (x within 0.12–0.88).
- Speakers face the person they talk to; back views only in OTS shots.
- Characters standing on the floor/ground, not in the sky or inside furniture; behind-the-counter people use `layer: "back"`.
- Night scenes use `time: "night"` for the whole scene; interiors at night are lit warm.
- Each location has an establishing shot; no two consecutive shots with identical framing and positions.
- Caption text is the exact line; long lines wrap to at most two caption rows (split the line if not).

## Don'ts
- No stick figures, emoji faces, or text-only slides. No characters floating without a set.
- Don't change a character's outfit colour mid-story (unless the story says so).
- Don't put more than 3 speaking characters in a `medium` shot — use `wide` or `full`.
