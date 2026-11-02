// render.mjs — Kahani Toon renderer (headless Chromium canvas -> ffmpeg).
//   node render.mjs --project projects/<slug>                    full video -> out/<title>.mp4 (silent)
//   node render.mjs --project P --from 20 --to 35 --scale 0.5     preview a range -> build/preview.mp4
//   node render.mjs --project P --sheet [--scale 0.5]             one still per shot -> build/sheets/sheet_NN.jpg
//   node render.mjs --project P --stills 3.5,12                   stills -> build/stills/
//   node render.mjs --project P --cast                            cast line-up -> build/cast.jpg
//   node render.mjs --project P --sets [village,hut] [--times day,night]   location gallery -> build/sets.jpg
// Options: --workers N  --scale K  --no-captions  --debug  --crf 18  --out FILE
// Run tools/plan.py first: it writes build/timeline.json from story.json.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = {}; { const a = process.argv.slice(2); for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2); const v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; args[k] = v; } } }
if (!args.project) { console.error('usage: node render.mjs --project projects/<slug> [options]'); process.exit(1); }
const PROJECT = path.resolve(args.project);
const BUILD = path.join(PROJECT, 'build'); fs.mkdirSync(BUILD, { recursive: true });
if (!fs.existsSync(path.join(BUILD, 'timeline.json'))) { console.error('build/timeline.json is missing: run  python tools/plan.py --project ' + args.project); process.exit(1); }
const TL = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const p = url.startsWith('/project/') ? path.join(PROJECT, url.slice(9)) : path.join(ROOT, url);
  if (!(p.startsWith(ROOT) || p.startsWith(PROJECT)) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const PORT = server.address().port;
const LAUNCH = { args: ['--disable-dev-shm-usage', '--force-color-profile=srgb'] };

async function openPlayer(browser) {
  const qs = new URLSearchParams(); if (args.scale) qs.set('scale', args.scale); if (args['no-captions']) qs.set('captions', '0'); if (args.debug) qs.set('debug', '1');
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(`http://localhost:${PORT}/player.html?${qs}`);
  await page.waitForFunction('window.READY === true || !!window.BOOT_ERROR', null, { timeout: 120000 });
  const boot = await page.evaluate('window.BOOT_ERROR'); if (boot) throw new Error('Player failed to boot: ' + boot);
  return page;
}
const b64 = s => Buffer.from(s.slice(s.indexOf(',') + 1), 'base64');
const grab = async (page, f) => b64(await page.evaluate(i => window.grab(i), f));
const fmtT = s => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;
const safe = s => String(s || 'video').replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '_') || 'video';
const run = (cmd, a) => new Promise((res, rej) => spawn(cmd, a, { stdio: 'inherit' }).on('close', c => (c ? rej(new Error(cmd + ' failed')) : res())));

async function renderVideo() {
  const fps = TL.fps, total = Math.round(TL.duration * fps);
  const f0 = Math.max(0, Math.round((+args.from || 0) * fps)), f1 = Math.min(total, args.to ? Math.round(+args.to * fps) : total);
  const W = Math.max(1, Math.min(+(args.workers || Math.max(1, Math.min(6, Math.floor(os.cpus().length / 2)))), Math.ceil((f1 - f0) / 50)));
  const partsDir = path.join(BUILD, 'parts'); fs.rmSync(partsDir, { recursive: true, force: true }); fs.mkdirSync(partsDir, { recursive: true });
  const chunk = Math.ceil((f1 - f0) / W); let done = 0; const t0 = Date.now(); const errs = new Set();
  console.log(`Rendering ${f1 - f0} frames (${((f1 - f0) / fps).toFixed(1)} s of ${TL.duration.toFixed(1)} s) with ${W} worker(s)…`);
  const work = async (k) => {
    const a = f0 + k * chunk, b = Math.min(f1, a + chunk); if (a >= b) return null;
    const browser = await chromium.launch(LAUNCH); const page = await openPlayer(browser);
    const out = path.join(partsDir, `part_${String(k).padStart(3, '0')}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf || 18), '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const img = await grab(page, f); if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once('drain', r)); done++;
      if (done % 100 === 0) { const el = (Date.now() - t0) / 1000, eta = (el / done) * (f1 - f0 - done); console.log(`  ${done}/${f1 - f0} frames  ${(done / el).toFixed(1)} fps  elapsed ${fmtT(el)}  eta ${fmtT(eta)}`); }
    }
    (await page.evaluate('window.errors()')).forEach(e => errs.add(e));
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); return out;
  };
  const parts = (await Promise.all([...Array(W)].map((_, k) => work(k)))).filter(Boolean);
  const list = path.join(partsDir, 'list.txt'); fs.writeFileSync(list, parts.map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  const preview = args.from !== undefined || args.to !== undefined;
  let out = args.out ? path.resolve(args.out) : preview ? path.join(BUILD, 'preview.mp4') : path.join(PROJECT, 'out', safe(TL.title) + (args['no-captions'] ? '_clean' : '') + '.mp4');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  if (!preview) for (const f of ['captions.srt', 'voiceover_script.txt']) if (fs.existsSync(path.join(BUILD, f))) fs.copyFileSync(path.join(BUILD, f), path.join(path.dirname(out), safe(TL.title) + '_' + f));
  if (errs.size) { console.log(`\n${errs.size} problem(s):`); [...errs].slice(0, 40).forEach(e => console.log('  ' + e)); }
  console.log(`\nDone: ${out}  (${fmtT((Date.now() - t0) / 1000)})`);
}

async function sheet(browser, items, outFile, cols = 4, cellW = 440) {
  const page = await browser.newPage({ viewport: { width: cols * (cellW + 10) + 10, height: 400 } });
  const html = `<html><body style="margin:0;background:#111;font:600 14px sans-serif;color:#eee"><div style="display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:10px;padding:10px">${items.map(it => `<div><img src="data:image/jpeg;base64,${it.img.toString('base64')}" style="width:${cellW}px;display:block;border-radius:3px"><div style="padding:4px 2px">${it.label.replace(/</g, '&lt;')}</div></div>`).join('')}</div></body></html>`;
  await page.setContent(html); await page.screenshot({ path: outFile, fullPage: true, type: 'jpeg', quality: 88 }); await page.close();
}
async function renderStills() {
  const browser = await chromium.launch(LAUNCH); const page = await openPlayer(browser); const fps = TL.fps;
  if (args.cast) { const img = b64(await page.evaluate('window.grabCast()')); const f = path.join(BUILD, 'cast.jpg'); fs.writeFileSync(f, img); console.log('Wrote ' + f); }
  else if (args.sets) {
    const names = args.sets === true ? await page.evaluate('window.SETS') : String(args.sets).split(',');
    const times = String(args.times || 'day').split(',');
    const items = []; for (const n of names) for (const tm of times) items.push({ img: b64(await page.evaluate(([a, b]) => window.grabSet(a, b), [n, tm])), label: `${n} / ${tm}` });
    const f = path.join(BUILD, 'sets.jpg'); await sheet(browser, items, f, Math.min(3, items.length), 560); console.log('Wrote ' + f);
  } else {
    const dir = path.join(BUILD, args.sheet ? 'sheets' : 'stills'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const shots = await page.evaluate('window.SHOT_LIST');
    const targets = args.sheet ? shots.map(s => ({ t: s.start + (s.end - s.start) * 0.55, label: `${s.id}  ${s.start.toFixed(1)}s  ${s.location}/${s.framing}` })) : String(args.stills || '1').split(',').map(Number).map(t => ({ t, label: `${t}s` }));
    const items = []; for (const tg of targets) { const img = await grab(page, Math.min(Math.round(tg.t * fps), Math.round(TL.duration * fps) - 1)); items.push({ img, label: tg.label }); if (!args.sheet) fs.writeFileSync(path.join(dir, `still_${tg.t.toFixed(2)}.jpg`), img); }
    const per = 20; for (let i = 0; i < items.length; i += per) await sheet(browser, items.slice(i, i + per), path.join(dir, `sheet_${String(i / per + 1).padStart(2, '0')}.jpg`));
    console.log(`Wrote ${items.length} frames to ${dir}`);
  }
  const errs = await page.evaluate('window.errors()'); errs.forEach(e => console.log('  problem: ' + e));
  await browser.close();
}
try { if (args.sheet || args.stills || args.cast || args.sets) await renderStills(); else await renderVideo(); }
catch (e) { console.error('RENDER FAILED:', e.message); process.exitCode = 1; }
finally { server.close(); }
