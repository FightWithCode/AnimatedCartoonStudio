// node tools/frames.mjs <ep> <outDir> <t> [t ...] [--nocaps]   — PNG of several frames in one browser session (for quick visual checks)
import { browser } from './env.mjs'; import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path';
import { startServer } from './server.mjs';
const args = process.argv.slice(2), nocaps = args.includes('--nocaps'), rest = args.filter((a) => a !== '--nocaps'); const [ep, dir, ...ts] = rest;
fs.mkdirSync(dir, { recursive: true });
const { srv, port } = await startServer();
const b = await puppeteer.launch({ ...(await browser()), defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(`http://127.0.0.1:${port}/web/index.html?export=1&ep=${ep}${nocaps ? '&nocaps=1' : ''}`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__studio?.ready, { timeout: 60000 });
for (const t of ts) { const b64 = await p.evaluate((t) => { window.__studio.seek(t); return document.getElementById('c').toDataURL('image/png').slice(22); }, +t); fs.writeFileSync(path.join(dir, `t${String(t).padStart(6, '0')}.png`), Buffer.from(b64, 'base64')); }
if (errs.length) console.log([...new Set(errs)].slice(0, 8).join('\n')); await b.close(); srv.close();
