// Resolves the browser + ffmpeg binaries. Override with CHROME_PATH / FFMPEG / FFPROBE (needed on Windows/macOS,
// where @sparticuz/chromium's bundled Linux build can't run). Falls back to the bundled chromium + PATH ffmpeg.
import chromium from '@sparticuz/chromium'; import fs from 'fs';
const WIN = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'];
export async function browser() {
  const MAC = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium'];
  const LOCAL = process.platform === 'win32' ? WIN : process.platform === 'darwin' ? MAC : [];
  const local = process.env.CHROME_PATH || LOCAL.find((p) => fs.existsSync(p));
  if (local) return { executablePath: local, args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'], headless: true };
  return { executablePath: await chromium.executablePath(), args: chromium.args, headless: 'shell' };
}
export const FFMPEG = process.env.FFMPEG || 'ffmpeg', FFPROBE = process.env.FFPROBE || 'ffprobe';
