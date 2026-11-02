// Render an episode to a silent 1920x1080 @30fps H.264 MP4.
//   node tools/render.mjs --ep ep01 --out out/ep01.mp4 [--no-caps] [--workers 4] [--from 0] [--to 2160] [--fps 30] [--crf 16]
// Every frame is a pure function of its time, so frame ranges render independently in parallel and are stitched.
import { browser, FFMPEG, FFPROBE } from './env.mjs'; import puppeteer from 'puppeteer-core';
import { spawn, execFileSync } from 'child_process'; import fs from 'fs'; import path from 'path'; import os from 'os';
import { startServer } from './server.mjs'; import { exportCaptions } from './export.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || i + 1 >= process.argv.length ? true : process.argv[i + 1]); };
const ep = arg('ep', 'ep01'), out = path.resolve(arg('out', `out/${ep}.mp4`)), caps = !process.argv.includes('--no-caps');
const fps = +arg('fps', 30), crf = +arg('crf', 16), workers = +arg('workers', Math.max(1, Math.min(4, os.cpus().length)));
fs.mkdirSync(path.dirname(out), { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kahani-'));
const { srv, port } = await startServer();
const url = `http://127.0.0.1:${port}/web/index.html?export=1&ep=${ep}${caps ? '' : '&nocaps=1'}`;
const BR = await browser();

async function open() {
  const b = await puppeteer.launch({ ...BR, defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'load' }); await p.waitForFunction(() => window.__studio?.ready, { timeout: 60000 });
  return { b, p, errs };
}
const probe = await open(); const duration = await probe.p.evaluate(() => window.__studio.duration); await probe.b.close();
const total = Math.round(duration * fps), from = +arg('from', 0), to = Math.min(+arg('to', total), total);
const n = to - from, per = Math.ceil(n / workers); console.log(`episode ${ep}: ${duration}s, frames ${from}..${to} (${n}) with ${workers} workers`);
const t0 = Date.now(); let done = 0; const segs = [];

async function work(k) {
  const a = from + k * per, z = Math.min(to, a + per); if (a >= z) return;
  const seg = path.join(tmp, `seg${String(k).padStart(3, '0')}.mp4`); segs[k] = seg;
  const { b, p, errs } = await open();
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'png', '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-r', String(fps), '-g', String(fps * 2), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((r) => ff.on('close', r));
  for (let f = a; f < z; f++) {
    const b64 = await p.evaluate((t) => { window.__studio.seek(t); return document.getElementById('c').toDataURL('image/png').slice(22); }, f / fps);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 60 === 0) console.log(`  ${done}/${n} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await closed; await b.close(); if (errs.length) throw new Error('page errors: ' + errs.slice(0, 3).join(' | '));
}
await Promise.all(Array.from({ length: workers }, (_, k) => work(k)));
const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, segs.filter(Boolean).map((s) => `file '${s}'`).join('\n'));
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-an', '-movflags', '+faststart', out]);
srv.close(); fs.rmSync(tmp, { recursive: true, force: true });
const info = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,nb_read_frames,codec_name:format=duration', '-of', 'json', out]));
console.log('wrote', out, JSON.stringify(info.streams[0]), 'duration', info.format.duration, 'in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
const ex = await exportCaptions(ep, path.dirname(out)); console.log('wrote', ex.srtPath); console.log('wrote', ex.voPath);
