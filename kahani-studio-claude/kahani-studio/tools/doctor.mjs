// Check that everything the studio needs is installed.   node tools/doctor.mjs
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
let bad = 0; const ok = (name, good, hint = '') => { if (!good) bad++; console.log(`${good ? 'OK  ' : 'FAIL'} ${name}${!good && hint ? '  →  ' + hint : ''}`); };
const major = +process.versions.node.split('.')[0]; ok(`node ${process.versions.node}`, major >= 18, 'install Node.js 18 or newer');
const deps = ['puppeteer-core', '@sparticuz/chromium'].every((m) => fs.existsSync(path.join(root, 'node_modules', m)));
ok('npm packages', deps, 'run  npm install  in ' + root);
let env = null; if (deps) { try { env = await import('./env.mjs'); } catch (e) { ok('env.mjs', false, e.message); } }
const run = (bin) => { try { return execFileSync(bin, ['-version'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n')[0]; } catch { return null; } };
const ff = run(env?.FFMPEG || process.env.FFMPEG || 'ffmpeg'), fp = run(env?.FFPROBE || process.env.FFPROBE || 'ffprobe');
ok('ffmpeg ' + (ff ? ff.split(' ')[2] : ''), !!ff, 'install ffmpeg (winget install Gyan.FFmpeg / brew install ffmpeg / apt install ffmpeg) or set FFMPEG');
ok('ffprobe', !!fp, 'comes with ffmpeg, or set FFPROBE');
if (env) { try { const b = await env.browser(); ok('browser ' + b.executablePath, !!b.executablePath && (fs.existsSync(b.executablePath)), 'install Google Chrome or Microsoft Edge, or set CHROME_PATH'); } catch (e) { ok('browser', false, e.message + ' — install Chrome/Edge or set CHROME_PATH'); } }
ok('fonts', fs.existsSync(path.join(root, 'fonts', 'noto-sans-devanagari-devanagari-600-normal.woff2')), 'fonts/ folder is missing — re-copy the kit');
console.log(bad ? `\n${bad} problem(s)` : '\nALL OK'); process.exit(bad ? 1 : 0);
