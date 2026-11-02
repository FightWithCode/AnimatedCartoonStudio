"""doctor.py - check that everything the studio needs is installed.   python tools/doctor.py [--install]"""
import os, shutil, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
install = "--install" in sys.argv
ok = True


def check(name, good, fix=None, cmd=None):
    global ok
    print(f"  {'OK ' if good else 'MISSING'}  {name}" + ("" if good or not fix else f"   ->  {fix}"))
    if not good and install and cmd:
        print(f"        running: {cmd}")
        subprocess.run(cmd, shell=True, cwd=root)
    ok = ok and good


print("Kahani Toon Studio - doctor")
check("python >= 3.8", sys.version_info >= (3, 8))
check("node", bool(shutil.which("node")), "install Node.js 18+ (winget install OpenJS.NodeJS.LTS / brew install node)")
check("ffmpeg + ffprobe", bool(shutil.which("ffmpeg") and shutil.which("ffprobe")), "winget install --id Gyan.FFmpeg -e  |  brew install ffmpeg  |  apt-get install ffmpeg")
nm = os.path.isdir(os.path.join(root, "node_modules", "playwright")) and os.path.isdir(os.path.join(root, "node_modules", "@fontsource", "baloo-2"))
check("npm packages (playwright, fonts)", nm, "npm install", "npm install --no-audit --no-fund")
if shutil.which("node"):
    r = subprocess.run(["node", "-e", "import('playwright').then(async p=>{const b=await p.chromium.launch();await b.close();console.log('ok')}).catch(e=>{console.log('fail');process.exit(1)})"], cwd=root, capture_output=True, text=True)
    check("headless Chromium", r.returncode == 0, "npx playwright install chromium", "npx playwright install chromium")
print("\nAll good." if ok else "\nFix the MISSING lines (or run with --install), then run doctor again.")
sys.exit(0 if ok else 1)
