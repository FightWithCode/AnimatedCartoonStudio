# Kahani Toon Studio 2.0

A Claude plugin that makes Hindi kahani cartoon story videos in the flat 2D Indian village style.

Ask Claude for a story ("make a 1 minute Hindi kahani about an honest farmer", or paste your Hindi script) and the
`make-kahani-video` skill:
1. installs the studio kit in your workspace (`kahani-studio-v2/`) and checks Node, ffmpeg and Chrome/Edge;
2. writes the episode script from your story, reusing the library's characters and scenes and adding new ones when needed;
3. renders QC frames and checks them, then renders a 1920×1080, 30 fps MP4 with small Hindi captions;
4. exports an SRT and a numbered voice-over script, and can re-time the video to your recorded clips and add voice and music.

What's new in 2.0 (vs 1.x): a new engine with a reusable library (10 characters, 6 scenes, 39 props), detailed
realistic faces and proportions, and the calm "kahani" movement (held gestures that ease into each other, planted-foot
walk, natural lip-flap and blinks). Episodes are written as `episodes/<id>/episode.js` instead of `story.json`.

Requirements: Node.js 18+, ffmpeg (with ffprobe), Google Chrome or Microsoft Edge (Windows/macOS; on Linux a bundled
Chromium is used). Install 2.0 in place of 1.x — both are named `kahani-toon-studio`.
