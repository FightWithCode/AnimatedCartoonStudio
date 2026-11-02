// Put the voice-over (and optional music) on a rendered episode.
//   node tools/mux.mjs --ep ep03 --voice voice.wav [--music bgm.mp3 --music-db -20] [--video out/ep03.mp4]
//   node tools/mux.mjs --ep ep03 --clips voice/   [--music bgm.mp3]     (one clip per line, placed at its caption start)
// Output: out/<ep>_voice.mp4, voice loudness-normalised to -14 LUFS, music ducked under it.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath, pathToFileURL } from 'url';
import { FFMPEG } from './env.mjs';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const ep = arg('ep'), voice = arg('voice'), dir = arg('clips'), music = arg('music'), mdb = +arg('music-db', -20);
const video = path.resolve(arg('video', path.join(root, 'out', `${ep}.mp4`))), out = path.resolve(arg('out', path.join(root, 'out', `${ep}_voice.mp4`)));
if (!ep || (!voice && !dir)) { console.error('usage: node tools/mux.mjs --ep <id> (--voice file | --clips folder) [--music file --music-db -20]'); process.exit(1); }
if (!fs.existsSync(video)) { console.error('render the video first: ' + video); process.exit(1); }
const inputs = ['-i', video], parts = [];
if (voice) { inputs.push('-i', path.resolve(voice)); parts.push('[1:a]aresample=48000[v0]'); }
else {
  const E = (await import(pathToFileURL(path.join(root, 'episodes', ep, 'episode.js')).href)).default;
  const caps = (E.captions || []).slice().sort((a, b) => a.start - b.start); let n = 0;
  for (const f of fs.readdirSync(dir).sort()) {
    const m = f.match(/^(\d+)/); if (!m || !/\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(f)) continue; const c = caps[+m[1] - 1]; if (!c) { console.log('skip (no line ' + m[1] + '): ' + f); continue; }
    inputs.push('-i', path.join(dir, f)); n++; const ms = Math.round(c.start * 1000); parts.push(`[${n}:a]aresample=48000,adelay=${ms}|${ms}[c${n}]`);
  }
  if (!n) { console.error('no numbered clips found in ' + dir); process.exit(1); }
  parts.push(Array.from({ length: n }, (_, i) => `[c${i + 1}]`).join('') + `amix=inputs=${n}:normalize=0[v0]`);
}
parts.push('[v0]loudnorm=I=-14:TP=-1.5:LRA=11[voice]');
let final = '[voice]';
if (music) {
  const mi = inputs.filter((x) => x === '-i').length; inputs.push('-stream_loop', '-1', '-i', path.resolve(music));
  parts.push(`[${mi}:a]aresample=48000,volume=${mdb}dB[m0]`, `[voice]asplit[vk][vs]`, `[m0][vs]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=400[md]`, `[vk][md]amix=inputs=2:normalize=0[mix]`);
  final = '[mix]';
}
parts.push(`${final}apad[aout]`); // pad with silence so the video is never cut short
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('wrote ' + out);
