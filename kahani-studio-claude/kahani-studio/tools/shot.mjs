// node tools/shot.mjs out.png "t=12&ep=ep01" [w h]  — screenshot of one frame (headless Chromium, software GL not needed for 2D)
import { browser, FFMPEG, FFPROBE } from './env.mjs'; import puppeteer from 'puppeteer-core'; import { startServer } from './server.mjs';
const [out, query = '', w = 1920, h = 1080] = process.argv.slice(2);
const { srv, port } = await startServer();
const b = await puppeteer.launch({ ...(await browser()), defaultViewport: { width: +w, height: +h, deviceScaleFactor: 1 } });
const p = await b.newPage(); const logs = [];
p.on('console', (m) => logs.push(m.type() + ': ' + m.text())); p.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '')));
await p.goto(`http://127.0.0.1:${port}/web/index.html?export=1&${query}`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__studio && window.__studio.ready, { timeout: 30000 }).catch(() => {});
await p.screenshot({ path: out }); if (logs.length) console.log(logs.slice(0, 15).join('\n')); await b.close(); srv.close();
