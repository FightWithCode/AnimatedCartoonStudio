// node tools/test.mjs — structure, determinism, caption and render checks for every episode in /episodes.
import { fileURLToPath } from 'url'; import { browser, FFMPEG, FFPROBE } from './env.mjs'; import puppeteer from 'puppeteer-core'; import crypto from 'crypto'; import fs from 'fs';
import { startServer } from './server.mjs';
const eps = fs.readdirSync(fileURLToPath(new URL('../episodes', import.meta.url))).filter((d) => d.startsWith('ep'));
const { srv, port } = await startServer();
const b = await puppeteer.launch({ ...(await browser()), defaultViewport: { width: 1920, height: 1080 } });
let fails = 0; const ok = (n, c, d = '') => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
for (const ep of eps) {
  console.log(`\n== ${ep}`);
  const p = await b.newPage(); const errs = [], bad = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); });
  p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  await p.goto(`http://127.0.0.1:${port}/web/index.html?export=1&ep=${ep}`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__studio?.ready, { timeout: 60000 });
  const E = await p.evaluate(async () => { const m = await import(`../episodes/${new URLSearchParams(location.search).get('ep')}/episode.js`); const { LIB } = await import('../engine/registry.js'); const { PROPS } = await import('../engine/registry.js'); const { GESTURES, POSES } = await import('../library/gestures.js'); return { ep: JSON.parse(JSON.stringify(m.default)), chars: Object.keys(LIB.characters), scenes: LIB.scenes, props: Object.keys(PROPS), gest: Object.keys(GESTURES), poses: Object.keys(POSES) }; });
  const { ep: D } = E, dur = D.meta.duration;
  // structure
  const shots = D.shots; let contiguous = shots[0].t[0] === 0 && shots.at(-1).t[1] === dur; for (let i = 1; i < shots.length; i++) if (shots[i].t[0] !== shots[i - 1].t[1]) contiguous = false;
  ok('shots are contiguous and cover 0..' + dur + ' s', contiguous);
  const N = D.narration; let nc = N[0].start === 0 && N.at(-1).end === dur; for (let i = 1; i < N.length; i++) if (N[i].start !== N[i - 1].end) nc = false; ok('narration segments are contiguous and cover the episode', nc);
  const capIn = D.captions.every((c) => c.end > c.start && N.some((n) => c.start >= n.start && c.end <= n.end)); ok('every caption sits inside one narration segment', capIn);
  ok('captions never overlap', D.captions.every((c, i) => i === 0 || c.start >= D.captions[i - 1].end));
  const refs = []; for (const s of shots) { if (!E.scenes[s.scene]) refs.push('scene ' + s.scene); for (const id in s.cast || {}) { const c = s.cast[id].char || id; if (!E.chars.includes(c)) refs.push('char ' + c); for (const a of s.cast[id].script || []) if (a[0] === 'do' && !E.gest.includes(a[1]) && !((s.rig ?? E.ep.meta.rig) >= 3 && E.poses.includes(a[1]))) refs.push('gesture ' + a[1]); } for (const pr of s.props || []) if (!E.props.includes(pr.prop)) refs.push('prop ' + pr.prop); }
  for (const sc of Object.values(E.scenes)) for (const L of sc.layers) for (const it of L.items) if (!E.props.includes(it.prop)) refs.push('scene prop ' + it.prop);
  ok('all characters, gestures, props and scenes referenced exist', refs.length === 0, refs.join(', '));
  // determinism + no NaNs
  const hash = (t, caps = true) => p.evaluate((t, caps) => { const S = window.__studio.stage; S.opts.captions = caps; S.render(t); const d = S.ctx.getImageData(0, 0, 1920, 1080).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; }, t, caps);
  const times = [0.2, 9, 20.5, 33.3, 44, 52.7, 61, 70.1, 71.9]; const first = []; for (const t of times) first.push(await hash(t));
  let det = true; for (let i = times.length - 1; i >= 0; i--) { await hash((times[i] + 17) % dur); if ((await hash(times[i])) !== first[i]) det = false; }
  ok('frames are identical after seeking away and back (seek-safe)', det);
  const nan = await p.evaluate((dur) => { const S = window.__studio.stage; let bad = 0; for (let t = 0; t <= dur; t += 0.1) { const sh = S.shotAt(t); for (const id in sh.actors) { const P = sh.actors[id].state(t, { posOf: () => null }); const chk = (v) => { if (typeof v === 'number') { if (!Number.isFinite(v)) bad++; } else if (v && typeof v === 'object') Object.values(v).forEach(chk); }; chk(P); } } return bad; }, dur);
  ok('every pose value is finite at 10 Hz sampling', nan === 0, nan + ' bad');
  // captions are overlay only
  const diff = await p.evaluate((t) => { const S = window.__studio.stage, W = 1920; S.opts.captions = true; S.render(t); const a = S.ctx.getImageData(0, 0, W, 1080).data.slice(); S.opts.captions = false; S.render(t); const c = S.ctx.getImageData(0, 0, W, 1080).data; let top = 0, bot = 0; for (let i = 0; i < a.length; i += 4) { if (a[i] !== c[i] || a[i + 1] !== c[i + 1]) { const y = Math.floor(i / 4 / W); if (y < 880) top++; else bot++; } } S.opts.captions = true; return { top, bot }; }, (D.captions[Math.min(3, D.captions.length - 1)] || { start: 0.5 }).start + Math.min(1, ((D.captions[Math.min(3, D.captions.length - 1)] || { start: 0, end: 1 }).end - (D.captions[Math.min(3, D.captions.length - 1)] || { start: 0 }).start) / 2));
  ok('captions-off changes only the caption strip (scene pixels untouched)', diff.top === 0 && diff.bot > 0, JSON.stringify(diff));
  // not blank: mean luminance of mid-shot frames
  const lum = await p.evaluate((shots) => shots.map((s) => { const S = window.__studio.stage; S.render((s.t[0] + s.t[1]) / 2); const d = S.ctx.getImageData(0, 0, 1920, 1080).data; let l = 0, n = 0; for (let i = 0; i < d.length; i += 4000) { l += d[i] + d[i + 1] + d[i + 2]; n += 3; } return l / n; }), shots);
  const floor = D.shots.map((s) => ((s.cards || []).some((c) => c.bg) ? 3 : /night|cave/i.test(JSON.stringify(s.sky)) ? 20 : 40)); // night / cave shots and black title cards are meant to be dark
  ok('every shot renders visible content', lum.every((l, i) => l > floor[i]), lum.map((x) => x.toFixed(0)).join(','));
  const dipsOk = await p.evaluate((dur) => { const S = window.__studio.stage; return S.dipAt(0) === 1 && S.dipAt(dur) === 1 && S.dipAt(dur / 2 + 0.01) < 1; }, dur); ok('fade-in at 0 and fade-out at end', dipsOk);
  ok('no console errors / warnings', errs.length === 0, errs.slice(0, 3).join(' | ')); ok('no missing files', bad.length === 0, bad.join(' | '));
  const dim = await p.evaluate(() => [document.getElementById('c').width, document.getElementById('c').height]); ok('canvas is 1920x1080', dim[0] === 1920 && dim[1] === 1080);
  await p.close();
}
await b.close(); srv.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASS'); process.exit(fails ? 1 : 0);
