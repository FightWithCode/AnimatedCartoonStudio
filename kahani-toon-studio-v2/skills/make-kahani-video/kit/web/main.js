import { loadLibrary } from '../engine/loader.js';
import { Stage } from '../engine/stage.js';
const q = new URLSearchParams(location.search);
if (q.has('export')) document.body.classList.add('export');
const ep = q.get('ep') || 'ep01';
const lib = await loadLibrary('../');
await Promise.all(['600 20px NotoDeva', '700 20px NotoDeva'].map((f) => document.fonts.load(f, 'चिकन करी अआक')));
const mod = await import(`../episodes/${ep}/episode.js`);
const canvas = document.getElementById('c');
const stage = new Stage(canvas, mod.default, { captions: !q.has('nocaps'), cpu: q.has('export') });
let t = 0, playing = false, last = 0;
const scrub = document.getElementById('scrub'), tc = document.getElementById('tc'), shot = document.getElementById('shot'), play = document.getElementById('play');
scrub.max = stage.duration;
const fmt = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
function draw() { stage.render(t); scrub.value = t; tc.textContent = `${fmt(t)} / ${fmt(stage.duration)}`; shot.textContent = stage.shotAt(t).shot.id; }
function seek(x) { t = Math.min(stage.duration, Math.max(0, x)); draw(); }
function loop(now) { if (!playing) return; t += Math.min(0.25, (now - last) / 1000); last = now; if (t >= stage.duration) { t = stage.duration; playing = false; play.textContent = '▶'; } draw(); if (playing) requestAnimationFrame(loop); }
function setPlay(p) { if (p && t >= stage.duration) t = 0; playing = p; play.textContent = p ? '❚❚' : '▶'; if (p) { last = performance.now(); requestAnimationFrame(loop); } }
play.onclick = () => setPlay(!playing); document.getElementById('restart').onclick = () => seek(0);
scrub.oninput = () => seek(parseFloat(scrub.value));
document.getElementById('cc').onclick = () => { stage.opts.captions = !stage.opts.captions; draw(); };
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); } else if (e.key === 'c') document.getElementById('cc').click(); else if (e.key === 'ArrowRight') seek(t + 1); else if (e.key === 'ArrowLeft') seek(t - 1); });
window.__studio = { stage, seek, play: () => setPlay(true), pause: () => setPlay(false), state: () => ({ time: t, playing, captions: stage.opts.captions }), duration: stage.duration, ready: true };
seek(q.has('t') ? parseFloat(q.get('t')) : 0);
if (q.has('play')) setPlay(true);
