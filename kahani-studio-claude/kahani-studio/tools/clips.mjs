// Re-time an episode to recorded voice clips: every caption line then lasts exactly as long as its clip.
//   node tools/clips.mjs --ep ep03 --clips voice/          (files named by line number: 001_narrator.wav, 002_ramu.mp3 …)
//   node tools/clips.mjs --ep ep03 --clear                 (back to reading-time pacing)
// Writes episodes/<ep>/clips.js ({ lineNumber: seconds }), which the episode passes to new Story(meta, voices, { clips }).
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
import { FFPROBE } from './env.mjs';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const ep = arg('ep'), dir = arg('clips'), clear = process.argv.includes('--clear');
if (!ep || (!dir && !clear)) { console.error('usage: node tools/clips.mjs --ep <id> --clips <folder> | --clear'); process.exit(1); }
const out = path.join(root, 'episodes', ep, 'clips.js'), map = {};
if (!clear) {
  for (const f of fs.readdirSync(dir).sort()) {
    const m = f.match(/^(\d+)/); if (!m || !/\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(f)) continue;
    const d = +execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(dir, f)]).toString().trim();
    if (d > 0) map[+m[1]] = +d.toFixed(3);
  }
  if (!Object.keys(map).length) { console.error('no numbered audio clips found in ' + dir); process.exit(1); }
}
fs.writeFileSync(out, `// written by tools/clips.mjs — line number -> recorded clip length (s)\nexport default ${JSON.stringify(map)};\n`);
console.log(clear ? `cleared ${out}` : `wrote ${out} (${Object.keys(map).length} clips). Re-render, then: node tools/mux.mjs --ep ${ep} --clips ${dir}`);
const pre = fs.readFileSync(path.join(root, 'episodes', ep, 'episode.js'), 'utf8');
if (!/clips\.js/.test(pre)) console.log(`note: episodes/${ep}/episode.js does not import clips.js yet — add  import clips from './clips.js';  and pass { clips } as the 3rd argument of new Story(...)`);
