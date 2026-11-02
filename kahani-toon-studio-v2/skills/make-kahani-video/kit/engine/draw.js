// Small 2D drawing toolkit shared by props, scenes and the puppet. Everything is a pure function of its inputs.
import { mulberry32 } from './util.js';

export const OUT = 'rgba(52,30,18,.9)';
export const rng = mulberry32;

const _c = new Map();
export function rgb(c) {
  if (_c.has(c)) return _c.get(c);
  let r, g, b;
  if (c[0] === '#') {
    const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
    r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
  } else { [r, g, b] = c.match(/[\d.]+/g).map(Number); }
  const o = [r, g, b]; _c.set(c, o); return o;
}
export const toCss = (r, g, b, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
/** k>0 lightens, k<0 darkens. */
export function shade(c, k) { const [r, g, b] = rgb(c); const t = k < 0 ? 0 : 255, a = Math.abs(k); return toCss(r + (t - r) * a, g + (t - g) * a, b + (t - b) * a); }
export function mix(c1, c2, k) { const a = rgb(c1), b = rgb(c2); return toCss(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); }

export function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
export function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); }
export function rrect(ctx, x, y, w, h, r) { r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
export function line(ctx, ol = 2, color = OUT) { ctx.lineWidth = ol; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
export function fill(ctx, color, ol = 2) { ctx.fillStyle = color; ctx.fill(); if (ol) line(ctx, ol); }
export function vgrad(ctx, y0, y1, c0, c1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
export function hgrad(ctx, x0, x1, c0, c1) { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
export function rgrad(ctx, x, y, r0, r1, c0, c1) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }

/** Thick rounded segment with an outline (arms, legs, poles). */
export function limb(ctx, ax, ay, bx, by, w, color, ol = 2.2) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
  if (ol) { ctx.lineWidth = w + ol * 2; ctx.strokeStyle = OUT; ctx.stroke(); }
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
}
export function limb2(ctx, pts, w, color, ol = 2.2) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (ol) { ctx.lineWidth = w + ol * 2; ctx.strokeStyle = OUT; ctx.stroke(); }
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
}
/** Cluster of circles (foliage, bushes, clouds, steam). */
export function blobs(ctx, list, color, ol = 0) { ctx.fillStyle = color; for (const [x, y, r] of list) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); } if (ol) { ctx.strokeStyle = OUT; ctx.lineWidth = ol; for (const [x, y, r] of list) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); } } }
