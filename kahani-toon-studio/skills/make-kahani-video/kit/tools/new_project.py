"""new_project.py - create projects/<slug>/ with a starter story.json and a backgrounds/ folder.

    python tools/new_project.py --name <slug> --title "<Hindi title>" [--resolution 1080p] [--no-captions]
"""
import argparse, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ap = argparse.ArgumentParser()
ap.add_argument("--name", required=True)
ap.add_argument("--title", default="मेरी कहानी")
ap.add_argument("--resolution", default="1080p", choices=["720p", "1080p", "1440p"])
ap.add_argument("--no-captions", action="store_true")
a = ap.parse_args()

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug = re.sub(r"[^a-z0-9-]+", "-", a.name.lower()).strip("-") or "kahani"
proj = os.path.join(root, "projects", slug)
if os.path.exists(os.path.join(proj, "story.json")):
    sys.exit(f"projects/{slug}/story.json already exists - edit it instead")
os.makedirs(os.path.join(proj, "backgrounds"), exist_ok=True)
story = {
    "title": a.title, "resolution": a.resolution, "fps": 25, "captions": not a.no_captions, "pace": 2.4,
    "cast": {"ramu": {"name": "रामू", "outfit": "kurta-dhoti", "topColor": "#2e5fc4", "scarf": "#e0566a"}},
    "locations": {},
    "scenes": [{"location": "village", "time": "day", "shots": [
        {"framing": "wide", "title": a.title, "dur": 3.5},
        {"framing": "medium", "chars": [{"id": "ramu", "x": 0.5}], "lines": [{"speaker": "ramu", "text": "नमस्ते!"}]}]}],
}
json.dump(story, open(os.path.join(proj, "story.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"created projects/{slug}/story.json")
