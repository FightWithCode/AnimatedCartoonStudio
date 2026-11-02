// Caption exports for the voice-over: SRT subtitles and a numbered line-by-line voice-over script.
//   node tools/export.mjs --ep ep03 [--dir out]
// Writes <dir>/<ep>_captions.srt and <dir>/<ep>_voiceover_script.txt. render.mjs calls this automatically.
// Line numbers are the clip names to record (001_ramu.wav …), see tools/clips.mjs.
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const pad = (n, k = 2) => String(Math.floor(n)).padStart(k, '0');
const srtTime = (t) => `${pad(t / 3600)}:${pad((t / 60) % 60)}:${pad(t % 60)},${pad((t % 1) * 1000, 3)}`;
const shortTime = (t) => `${pad(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

export async function exportCaptions(ep, dir = path.join(root, 'out')) {
  const mod = await import(pathToFileURL(path.join(root, 'episodes', ep, 'episode.js')).href);
  const E = mod.default, caps = (E.captions || []).slice().sort((a, b) => a.start - b.start);
  fs.mkdirSync(dir, { recursive: true });
  const srt = caps.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.label ? c.label + ': ' : ''}${c.text}\n`).join('\n');
  const head = [`${E.meta.title || ep}  —  voice-over script (${caps.length} lines, ${E.meta.duration.toFixed(1)} s)`,
    'Record one clip per line, named by its number (001_narrator.wav, 002_ramu.wav …), then: node tools/clips.mjs --ep ' + ep + ' --clips <folder>', ''];
  const lines = caps.map((c, i) => `${pad(i + 1, 3)}  [${shortTime(c.start)} - ${shortTime(c.end)}]  (${(c.end - c.start).toFixed(1)}s)  ${c.label || 'कथावाचक'}: ${c.text}`);
  const srtPath = path.join(dir, `${ep}_captions.srt`), voPath = path.join(dir, `${ep}_voiceover_script.txt`);
  fs.writeFileSync(srtPath, '﻿' + srt, 'utf8'); fs.writeFileSync(voPath, '﻿' + head.concat(lines).join('\n') + '\n', 'utf8');
  return { srtPath, voPath, lines: caps.length };
}

if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
  const ep = arg('ep'); if (!ep) { console.error('usage: node tools/export.mjs --ep <id> [--dir out]'); process.exit(1); }
  const r = await exportCaptions(ep, arg('dir') ? path.resolve(arg('dir')) : undefined);
  console.log(`wrote ${r.srtPath}\nwrote ${r.voPath}  (${r.lines} lines)`);
}
