"""bg_prompts.py - write image-generator prompts for every location/time a project uses.

    python tools/bg_prompts.py --project projects/<slug>

Writes backgrounds/PROMPTS.md. The user pastes each prompt into any image generator (ChatGPT, Gemini,
Ideogram, Leonardo, a local Stable Diffusion ...), saves the result as backgrounds/<location>_<time>.png,
then runs this again with --link to register every image that exists in story.json.
"""
import argparse, json, os
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

STYLE = ("2D Indian cartoon background art for a Hindi moral-story YouTube video, painted digital illustration, "
         "clean shapes with soft painterly shading, warm natural colours, detailed but uncluttered, eye-level camera, "
         "16:9 wide frame, the lower third is open, empty ground where characters will stand, "
         "NO people, NO animals, NO text, NO watermark")
TIME = {"day": "bright sunny day, clear blue sky with a few white clouds",
        "evening": "golden evening light, orange-pink sky, long soft shadows",
        "night": "night, deep blue sky with stars and a moon, warm yellow light glowing from windows and lamps"}
SCENES = {
    "village": "open rural road in an Indian village, green fields, coconut palms, small huts with clay tile roofs in the distance, electric poles with sagging wires, dry dirt road",
    "chaupal": "village square under a huge old banyan tree with hanging aerial roots, a raised brick platform (chabutra) around the trunk, a wooden charpai, mud houses with tiled roofs and a thatched hut around",
    "lane": "narrow lane of an Indian village between mud-plastered houses with terracotta tiled roofs, wooden doors, clay pots, a tree at the end of the lane",
    "courtyard": "aangan courtyard of a village house, mud-plastered walls, veranda with wooden pillars and a tiled roof, tulsi platform, charpai, clothesline",
    "fields": "farm fields in rural India, rows of crops, an old brick well with a wooden pulley frame, a mango tree, a mud bund path",
    "building": "small pucca government building in an Indian village with a blank sign board above the entrance, white and blue paint, rolling shutter, barred windows, steps, dirt road",
    "hut": "inside a poor Indian village mud hut, cracked mud walls, small barred windows with light shafts, clay stove (chulha), clay pots, brass vessels on a shelf, a charpai",
    "shop": "inside a small Indian village kirana grocery shop, shelves packed with colourful packets and boxes, hanging sachet strips, a wooden counter with glass jars and a weighing scale, doorway to the street",
    "office": "small Indian government office / bank manager cabin, beige walls, window blinds, wall clock, calendar, steel cupboard, files, a wooden desk with an office chair behind it",
}

ap = argparse.ArgumentParser()
ap.add_argument("--project", required=True)
ap.add_argument("--link", action="store_true", help="register existing backgrounds/<location>_<time>.png files in story.json")
a = ap.parse_args()
proj = os.path.abspath(a.project)
sp = os.path.join(proj, "story.json")
story = json.load(open(sp, encoding="utf-8"))
locs = story.setdefault("locations", {})
used = []
for sc in story["scenes"]:
    for sh in sc["shots"]:
        k = (sh.get("location", sc.get("location", "village")), sh.get("time", sc.get("time", "day")))
        if k not in used: used.append(k)
bgdir = os.path.join(proj, "backgrounds"); os.makedirs(bgdir, exist_ok=True)
if a.link:
    n = 0
    for loc, time in used:
        for ext in ("png", "jpg", "jpeg", "webp"):
            f = f"{loc}_{time}.{ext}"
            if os.path.exists(os.path.join(bgdir, f)):
                L = locs.setdefault(loc, {}); L.setdefault("images", {})[time] = f"backgrounds/{f}"
                if L.get("base", loc) in ("hut", "shop", "office"): L["interior"] = True
                n += 1; break
    json.dump(story, open(sp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"linked {n} background image(s) in story.json; run tools/plan.py again")
else:
    out = [f"# Background prompts for \"{story.get('title', '')}\"", "",
           "Generate each image at 16:9 (1920x1080 or larger) and save it in this folder with the exact file name shown.",
           "Then run:  python tools/bg_prompts.py --project <project> --link", ""]
    for loc, time in used:
        L = locs.get(loc, {}); base = L.get("base", loc)
        desc = L.get("prompt") or SCENES.get(base, loc)
        if base == "building" and L.get("options", {}).get("sign"): desc = desc.replace("a blank sign board", f"a sign board reading \"{L['options']['sign']}\"").replace("NO text, ", "")
        out += [f"## {loc}_{time}.png", "", "```", f"{desc}, {TIME.get(time, time)}. {STYLE}", "```", ""]
    open(os.path.join(bgdir, "PROMPTS.md"), "w", encoding="utf-8").write("\n".join(out))
    print(f"wrote backgrounds/PROMPTS.md ({len(used)} prompts)")
