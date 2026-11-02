# Kahani Toon Studio

A Claude skill that makes Hindi kahani-style cartoon story videos: semi-realistic cut-out Indian village
characters on painted village sets, cut like the popular Hindi moral-story channels. No stick figures, no AI
video. Each line shows as a small Hindi caption with the speaker's name, and the skill exports an SRT and a
numbered voice-over script, so you can record the voice-over afterwards. With per-line clips, the video can be
re-timed to your recording and muxed.

Skill: `make-kahani-video`. Say "make a Hindi kahani cartoon about …" or give it a Hindi script.

Studio commands (inside `kahani-studio/`):
- `python tools/new_project.py --name <slug> --title "<title>"`, then write `projects/<slug>/story.json`
- `python tools/plan.py --project projects/<slug>`: timing, captions.srt, voiceover_script.txt
- `node render.mjs --project projects/<slug> --cast | --sheet | --sets`: QC images
- `node render.mjs --project projects/<slug>`: the final MP4 in `out/`
- `python tools/bg_prompts.py --project projects/<slug> [--link]`: custom painted backgrounds from any image generator
- `python tools/plan.py ... --clips <folder>`, then `python tools/mux.py ... --clips <folder>`: sync to the recorded voice-over

Needs Node 18+, Python 3.8+ and ffmpeg. `python tools/doctor.py --install` sets up the rest.
