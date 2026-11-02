// Renders an episode at any time t. Pure function of t: sky + parallax scene layers + depth-sorted actors/props
// + colour grade + transitions + optional captions. Nothing carries over between frames.
import { clamp, lerp, ramp, sstep, track, mulberry32 } from './util.js';
import { mix, rgb, toCss, shade } from './draw.js';
import { PROPS, LIB } from './registry.js';
import { drawPuppet } from './puppet.js';
import { Actor, Mover } from './actor.js';

const W = 1920, H = 1080;

export class Stage {
  constructor(canvas, episode, opts = {}) {
    this.canvas = canvas; canvas.width = W; canvas.height = H; this.ctx = canvas.getContext('2d', { willReadFrequently: !!opts.cpu, alpha: false });
    this.ep = episode; this.opts = Object.assign({ captions: true }, opts);
    this.shots = episode.shots.map((s) => this._compile(s));
    this.caps = episode.captions || [];
    this.duration = episode.meta.duration;
  }
  _compile(shot) {
    if (shot.rig == null && this.ep.meta.rig) shot = Object.assign({}, shot, { rig: this.ep.meta.rig }); // episode-wide rig level (1 = original puppet arms)
    const scene = LIB.scenes[shot.scene]; if (!scene) throw new Error('unknown scene ' + shot.scene);
    const actors = {}; for (const id in shot.cast || {}) { const c = shot.cast[id]; const spec = LIB.characters[c.char || id]; if (!spec) throw new Error('unknown character ' + (c.char || id)); actors[id] = new Actor(id, spec, c, shot); }
    const props = {}; for (const p of shot.props || []) { const m = new Mover(p.x, p.y ?? scene.ground, (p.script || []).filter((s) => s[0] === 'walk').map((s) => s.slice(1)), shot.t[0] - 0.5, shot.t[1] + 0.5); props[p.id] = { def: p, mover: m }; }
    const cam = track(shot.camera.map(([t, x, y, z]) => [t, [x, y, z]]));
    return { shot, scene, actors, props, cam };
  }
  shotAt(t) { for (let i = 0; i < this.shots.length; i++) if (t < this.shots[i].shot.t[1] - 1e-9) return this.shots[i]; return this.shots[this.shots.length - 1]; }

  render(t) {
    t = clamp(t, 0, this.duration);
    const S = this.shotAt(t), shot = S.shot, ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const cv = S.cam(t), cam = { x: cv[0], y: cv[1], z: cv[2] };
    const sc = S.scene, grade = this._env(S, t);
    if (!sc.interior) this._sky(ctx, grade, t);
    else { ctx.fillStyle = sc.backdrop || '#222'; ctx.fillRect(0, 0, W, H); }
    const world = { posOf: (id, tt) => { const a = S.actors[id]; if (a) { const p = a.pos(tt); return { x: p.x, y: p.y, h: 250 * (a.spec.height || 366) / 366 * a.scale }; } const p = S.props[id]; if (p) { const q = p.mover.at(tt); return { x: q.x, y: q.y, h: 100 }; } return null; } };
    // layers behind
    for (const L of sc.layers) if (!L.front) this._layer(ctx, S, L, cam, t);
    // dynamic objects, depth sorted
    const objs = [];
    for (const id in S.actors) { const a = S.actors[id], p = a.pos(t); objs.push({ z: a.z ?? p.y, a, id }); }
    for (const id in S.props) { const p = S.props[id], q = p.mover.at(t); objs.push({ z: p.def.z ?? q.y, p, q }); }
    objs.sort((a, b) => a.z - b.z);
    this._camTransform(ctx, cam, 1);
    for (const o of objs) {
      if (o.a) { const P = o.a.state(t, world); drawPuppet(ctx, o.a.spec, P, t); }
      else { const d = o.p.def; ctx.save(); ctx.translate(o.q.x, o.q.y); ctx.scale((d.s || 1) * (d.flip ? -1 : 1), d.s || 1); PROPS[d.prop](ctx, t, Object.assign({}, d, { roll: (o.q.x - d.x) / 78 * (d.flip ? -1 : 1) })); ctx.restore(); }
    }
    for (const L of sc.layers) if (L.front) this._layer(ctx, S, L, cam, t);
    // grade (multiply colour), vignette
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (grade.color && grade.color !== '#ffffff') { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = grade.color; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    if (shot.glow) { const g = ctx.createRadialGradient(W / 2, H * 0.55, 100, W / 2, H * 0.55, 1100); g.addColorStop(0, `rgba(255,190,90,${shot.glow})`); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    const vg = ctx.createRadialGradient(W / 2, H / 2, 420, W / 2, H / 2, 1200); vg.addColorStop(0, 'rgba(20,10,30,0)'); vg.addColorStop(1, `rgba(20,10,30,${sc.interior ? 0.5 : 0.34})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    this._cards(ctx, t, shot);
    // dips
    const d = this.dipAt(t); if (d > 0) { ctx.fillStyle = `rgba(10,6,16,${d})`; ctx.fillRect(0, 0, W, H); }
    if (this.opts.captions) this._caption(ctx, t);
  }
  dipAt(t) {
    let a = 0; const n = this.shots.length;
    this.shots.forEach((S, i) => { const sh = S.shot, dur = sh.dip ?? 0.4; if ((sh.in === 'dip' || i === 0) && t >= sh.t[0] && t < sh.t[0] + dur) a = Math.max(a, 1 - ramp(sh.t[0], sh.t[0] + dur, t)); if ((sh.out === 'dip' || i === n - 1) && t > sh.t[1] - dur && t <= sh.t[1]) a = Math.max(a, ramp(sh.t[1] - dur, sh.t[1], t)); });
    return clamp(a);
  }
  _env(S, t) {
    const sh = S.shot, sk = sh.sky || S.scene.sky || 'day', pair = Array.isArray(sk) ? sk : [sk, sk];
    const k = Array.isArray(sk) ? sstep(sh.t[0], sh.t[1] - 0.5, t) : 0; const A = LIB.skies[pair[0]], B = LIB.skies[pair[1]];
    const sun = (k < 0.5 ? A.sun : B.sun);
    return { top: mix(A.top, B.top, k), mid: mix(A.mid, B.mid, k), bottom: mix(A.bottom, B.bottom, k), color: mix(A.grade, B.grade, k), stars: lerp(A.stars || 0, B.stars || 0, k), sun, sunK: sun ? (Array.isArray(sk) ? (k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2) : 1) : 0 };
  }
  _sky(ctx, g, t) {
    const gr = ctx.createLinearGradient(0, 0, 0, 760); gr.addColorStop(0, g.top); gr.addColorStop(0.55, g.mid); gr.addColorStop(1, g.bottom); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    if (g.stars > 0.01) { const r = mulberry32(42); ctx.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * 520, s = 1 + r() * 2, tw = 0.5 + 0.5 * Math.sin(t * 2 + i); ctx.globalAlpha = g.stars * (0.4 + 0.6 * tw); ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
    if (g.sun && g.sunK > 0.02) { const s = g.sun, x = s.x * W, y = s.y * H, a = g.sunK; const gl = ctx.createRadialGradient(x, y, s.r * 0.3, x, y, s.r * 4.2); gl.addColorStop(0, `rgba(255,220,150,${0.75 * a})`); gl.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = a; ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(x, y, s.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  }
  _camTransform(ctx, cam, p, scene) {
    const ref = this._ref, refY = 540, zl = 1 + (cam.z - 1) * (0.3 + 0.7 * p);
    const cx = ref + (cam.x - ref) * p, cy = refY + (cam.y - refY) * p;
    ctx.setTransform(zl, 0, 0, zl, W / 2 - cx * zl, H / 2 - cy * zl);
  }
  _layer(ctx, S, L, cam, t) {
    this._ref = S.scene.width / 2; this._camTransform(ctx, cam, L.parallax ?? 1);
    for (const it of L.items) { ctx.save(); ctx.translate(it.x + (it.drift ? t * it.drift : 0), it.y ?? S.scene.ground); ctx.scale((it.s || 1) * (it.flip ? -1 : 1), it.s || 1); const f = PROPS[it.prop]; if (!f) throw new Error('unknown prop ' + it.prop); f(ctx, t, it); ctx.restore(); }
  }
  /** Wrapped caption (max 2 lines) with an optional coloured speaker tag. Stays inside the bottom strip (y >= 880). */
  _caption2(ctx, c, a) {
    const FF = 'NotoDeva, "Noto Sans Devanagari", sans-serif', MAXW = 1660, label = c.label ? c.label + ': ' : '';
    let fs = 50, lines, lw = 0;
    const split = () => {
      ctx.font = `600 ${fs}px ${FF}`; lw = label ? ctx.measureText(label).width : 0;
      const words = c.text.split(' '), wd = (s) => ctx.measureText(s).width, full = lw + wd(c.text);
      if (full <= MAXW) return [c.text];
      let best = null, bw = 1e9;
      for (let i = 1; i < words.length; i++) { const A = words.slice(0, i).join(' '), B = words.slice(i).join(' '), m = Math.max(lw + wd(A), wd(B)); if (m < bw) { bw = m; best = [A, B]; } }
      return best && bw <= MAXW ? best : null;
    };
    while (!(lines = split()) && fs > 34) fs -= 2;
    if (!lines) lines = [c.text];
    const lh = fs * 1.28, ph = lines.length * lh + fs * 0.42, bottom = H - 34;
    ctx.save(); ctx.globalAlpha = a; ctx.font = `600 ${fs}px ${FF}`;
    const widths = lines.map((l, i) => ctx.measureText(l).width + (i === 0 ? lw : 0)), pw = Math.max(...widths) + 76;
    ctx.fillStyle = 'rgba(18,10,22,.64)'; ctx.beginPath(); ctx.roundRect(W / 2 - pw / 2, bottom - ph, pw, ph, 22); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
    lines.forEach((l, i) => {
      const y = bottom - ph + fs * 0.21 + lh * (i + 0.5), x0 = W / 2 - widths[i] / 2;
      if (i === 0 && label) { ctx.fillStyle = c.color || '#ffd36a'; ctx.fillText(label, x0, y); ctx.fillStyle = '#fff6e2'; ctx.fillText(l, x0 + lw, y); }
      else { ctx.fillStyle = '#fff6e2'; ctx.fillText(l, x0, y); }
    });
    ctx.restore();
  }
  /** Full-frame cards: shot.cards = [{ start, end, text, sub, bg, size, y, kind }]. kind 'title' = big gold lettering, 'note' = framed plate. */
  _cards(ctx, t, shot) {
    for (const k of shot.cards || []) {
      if (t < k.start || t >= k.end) continue;
      const a = Math.min(ramp(k.start, k.start + 0.6, t), 1 - ramp(k.end - 0.6, k.end, t)), FF = 'NotoDeva, "Noto Sans Devanagari", sans-serif';
      ctx.save(); ctx.globalAlpha = a;
      if (k.bg) { ctx.fillStyle = k.bg; ctx.fillRect(0, 0, W, H); }
      const size = k.size || 104, y = k.y ?? H * 0.42, lines = k.text.split('|');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      if (k.kind === 'note') {
        ctx.font = `700 ${size}px ${FF}`; const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 140, h = lines.length * size * 1.25 + (k.sub ? size * 0.9 : 0) + 70;
        ctx.fillStyle = 'rgba(25,12,34,.82)'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y - h / 2, w, h, 36); ctx.fill(); ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 6; ctx.stroke();
        ctx.fillStyle = k.color || '#ffd36a'; lines.forEach((l, i) => ctx.fillText(l, W / 2, y - h / 2 + 35 + size * 0.62 + i * size * 1.25));
        if (k.sub) { ctx.font = `600 ${Math.round(size * 0.46)}px ${FF}`; ctx.fillStyle = '#fff6e2'; ctx.fillText(k.sub, W / 2, y + h / 2 - 28 - size * 0.3); }
      } else {
        ctx.font = `700 ${size}px ${FF}`; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 18;
        lines.forEach((l, i) => { const yy = y + i * size * 1.28; ctx.lineWidth = size * 0.12; ctx.strokeStyle = 'rgba(60,20,10,.95)'; ctx.strokeText(l, W / 2, yy); ctx.fillStyle = k.color || '#ffd75e'; ctx.fillText(l, W / 2, yy); });
        ctx.shadowBlur = 0; if (k.sub) { ctx.font = `600 ${Math.round(size * 0.44)}px ${FF}`; ctx.fillStyle = '#fff6e2'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 8; ctx.fillText(k.sub, W / 2, y + lines.length * size * 1.28 + size * 0.1); }
      }
      ctx.restore();
    }
  }
  _caption(ctx, t) {
    const c = this.caps.find((x) => t >= x.start && t < x.end); if (!c) return;
    const a = Math.min(ramp(c.start, c.start + 0.2, t), 1 - ramp(c.end - 0.2, c.end, t));
    if (c.wrap || c.label) return this._caption2(ctx, c, a);
    ctx.save(); ctx.globalAlpha = a;
    let fs = 50; ctx.font = `600 ${fs}px NotoDeva, "Noto Sans Devanagari", sans-serif`; let w = ctx.measureText(c.text).width; if (w > 1640) { fs = Math.floor(fs * 1640 / w); ctx.font = `600 ${fs}px NotoDeva, "Noto Sans Devanagari", sans-serif`; w = ctx.measureText(c.text).width; }
    const x = W / 2, y = H - 74; ctx.fillStyle = 'rgba(18,10,22,.58)'; const pw = w + 70, ph = fs * 1.55; ctx.beginPath(); ctx.roundRect(x - pw / 2, y - ph * 0.62, pw, ph, 22); ctx.fill();
    ctx.fillStyle = '#fff6e2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6; ctx.fillText(c.text, x, y); ctx.restore();
  }
}
