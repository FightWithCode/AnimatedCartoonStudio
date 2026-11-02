import { defineProp } from '../../engine/registry.js';
import { rng, shade, poly, fill, line, vgrad, hgrad, rrect, ellipse, limb, blobs } from '../../engine/draw.js';
import { steam } from './interior.js';

export function rotiStack(ctx, x, y, n, rx = 62, ry = 13) {
  for (let i = 0; i < n; i++) { const yy = y - i * 7; ellipse(ctx, x + Math.sin(i * 2.1) * 3, yy, rx - (i % 2) * 2, ry); fill(ctx, i % 2 ? '#e9c586' : '#f1d49a', 1.6); }
  const r = rng(5); ctx.fillStyle = 'rgba(160,100,40,.5)'; for (let k = 0; k < 8; k++) { const a = r() * 6.28, d = r() * rx * 0.6; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * d, y - (n - 1) * 7 + Math.sin(a) * d * 0.22, 5, 2.4, 0, 0, 7); ctx.fill(); }
}
export function curryPan(ctx, t, x, y, rx = 112, seed = 1, o = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-rx, -20); ctx.bezierCurveTo(-rx * 0.95, 62, rx * 0.95, 62, rx, -20); ctx.closePath(); fill(ctx, vgrad(ctx, -20, 60, '#3a3a3e', '#17171a'), 3);
  limb(ctx, -rx, -14, -rx - 20, -26, 9, '#222', 1.5); limb(ctx, rx, -14, rx + 20, -26, 9, '#222', 1.5);
  ellipse(ctx, 0, -20, rx, 27); fill(ctx, '#202024', 3);
  const aloo = o.dish === 'aloo'; // spiced potato sabzi instead of chicken curry
  ellipse(ctx, 0, -18, rx - 9, 22); ctx.fillStyle = aloo ? '#d98a1e' : '#d2531a'; ctx.fill();
  const g = ctx.createRadialGradient(-20, -26, 4, 0, -18, rx); g.addColorStop(0, aloo ? 'rgba(255,205,90,.9)' : 'rgba(255,170,60,.9)'); g.addColorStop(1, 'rgba(160,40,10,.0)'); ctx.fillStyle = g; ellipse(ctx, 0, -18, rx - 9, 22); ctx.fill();
  const r = rng(seed + 20);
  for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = 0.15 + r() * 0.7; const px = Math.cos(a) * (rx - 24) * d, py = -18 + Math.sin(a) * 15 * d; ellipse(ctx, px, py, aloo ? 12 : 15, aloo ? 9 : 8, a); fill(ctx, aloo ? '#e8b24a' : '#a8481c', 1.6); ctx.fillStyle = 'rgba(255,190,120,.5)'; ctx.beginPath(); ctx.ellipse(px - 3, py - 2, 6, 2.5, a, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#4aa84a'; for (let i = 0; i < 10; i++) { const a = r() * 6.28, d = r() * 0.8; ctx.beginPath(); ctx.ellipse(Math.cos(a) * (rx - 20) * d, -18 + Math.sin(a) * 15 * d, 3.5, 2.2, a, 0, 7); ctx.fill(); }
  for (let i = 0; i < 4; i++) { const ph = (t * 1.3 + i * 0.27 + seed) % 1; ctx.strokeStyle = `rgba(255,220,160,${0.65 - ph * 0.6})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(-50 + i * 34, -18 + Math.sin(i * 3) * 6, 3 + ph * 7, (3 + ph * 7) * 0.45, 0, 0, 7); ctx.stroke(); }
  ctx.restore();
  if (o.steam !== false) steam(ctx, t, x, y - 40, 5, seed);
}

defineProp('curryPan', (ctx, t, o) => curryPan(ctx, t, 0, 0, o.rx || 112, o.seed || 1, o));
defineProp('rotiBasket', (ctx, t, o) => {
  const w = o.w || 150; rotiStack(ctx, 0, -62, o.n || 6, w * 0.4, 11);
  ctx.beginPath(); ctx.moveTo(-w / 2, -62); ctx.bezierCurveTo(-w * 0.46, 2, w * 0.46, 2, w / 2, -62); ctx.closePath(); fill(ctx, vgrad(ctx, -62, 0, '#c8903f', '#8a5a22'), 2.5);
  ctx.strokeStyle = 'rgba(70,40,10,.5)'; ctx.lineWidth = 2; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + i * 4, -62 + i * 11); ctx.quadraticCurveTo(0, -50 + i * 11 + 8, w / 2 - i * 4, -62 + i * 11); ctx.stroke(); } for (let x = -w / 2 + 16; x < w / 2; x += 18) { ctx.beginPath(); ctx.moveTo(x, -60); ctx.lineTo(x * 0.8, -4); ctx.stroke(); }
  ellipse(ctx, 0, -62, w / 2, 13); ctx.strokeStyle = OUTLN; ctx.lineWidth = 2.5; ctx.stroke();
});
const OUTLN = 'rgba(52,30,18,.9)';

defineProp('plate', (ctx, t, o) => { // steel plate with curry + roti, drawn flat on its own base
  const r = o.r || 46; ellipse(ctx, 0, 0, r, r * 0.3); fill(ctx, vgrad(ctx, -r * 0.3, r * 0.3, '#e2e7ea', '#9aa5ab'), 2); ellipse(ctx, 0, -2, r * 0.8, r * 0.22); ctx.fillStyle = '#c5ccd0'; ctx.fill();
  if (o.food !== false) { ellipse(ctx, -r * 0.25, -5, r * 0.4, r * 0.14); fill(ctx, '#c9501a', 1.4); ellipse(ctx, r * 0.28, -6, r * 0.34, r * 0.12); fill(ctx, '#f1d49a', 1.4); }
});
defineProp('bowl', (ctx, t, o) => { const r = o.r || 24; ctx.beginPath(); ctx.moveTo(-r, -r * 0.6); ctx.quadraticCurveTo(-r * 0.9, r * 0.7, 0, r * 0.7); ctx.quadraticCurveTo(r * 0.9, r * 0.7, r, -r * 0.6); ctx.closePath(); fill(ctx, '#c9d2d6', 1.8); });

/** The curry cart. o.roll = wheel rotation (radians), o.stirT = optional, o.sign = text */
defineProp('foodCart', (ctx, t, o) => {
  const roll = o.roll || 0, R = 78, wx = [-130, 140];
  // handles (resting poles)
  limb(ctx, -190, -140, -410, -166, 15, '#9b6234', 2); ellipse(ctx, -410, -166, 9, 9); fill(ctx, '#7e4a24', 1.5);
  if (o.stand !== false) limb(ctx, -330, -158, -330, 0, 10, '#6a3f20', 1.5);
  // body platform
  const bc = o.body || ['#f08a2a', '#c8601a'];
  rrect(ctx, -240, -176, 500, 62, 8); fill(ctx, vgrad(ctx, -176, -114, bc[0], bc[1]), 3);
  rrect(ctx, -228, -166, 476, 14, 5); ctx.fillStyle = 'rgba(255,240,200,.45)'; ctx.fill();
  ctx.strokeStyle = 'rgba(120,50,10,.5)'; ctx.lineWidth = 2; for (let x = -190; x < 250; x += 46) { ctx.beginPath(); ctx.moveTo(x, -150); ctx.lineTo(x, -118); ctx.stroke(); }
  // wheels
  for (const cx of wx) {
    ctx.save(); ctx.translate(cx, -R);
    ellipse(ctx, 0, 0, R, R); fill(ctx, '#5a2f16', 3); ellipse(ctx, 0, 0, R - 9, R - 9); fill(ctx, '#d9d2c0', 0); ctx.strokeStyle = '#2a170a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(250,240,220,.14)'; ellipse(ctx, 0, 0, R - 10, R - 10); ctx.fill();
    ctx.rotate(roll); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); limb(ctx, 0, 0, R - 12, 0, 8, '#7a4824', 1.3); }
    ellipse(ctx, 0, 0, 15, 15); fill(ctx, '#e0a14a', 2.5); ctx.restore();
  }
  // goods: roti basket (left), stove + pan (centre), steel tins (right)
  const bx = -150; ctx.save(); ctx.translate(bx, -170); ctx.scale(1.05, 1.05); if (o.menu === 'puri') PROPS.puriBasket(ctx, t, { w: 150 }); else PROPS_rotiBasket(ctx, t); ctx.restore();
  // stove
  rrect(ctx, -52, -226, 190, 52, 8); fill(ctx, vgrad(ctx, -226, -174, '#4c8fd8', '#2f62a8'), 2.5); ctx.fillStyle = '#ffb04a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-34 + i * 28, -196, 6, 4 + Math.sin(t * 12 + i) * 1.5, 0, 0, 7); ctx.fill(); }
  curryPan(ctx, t, 43, -222, 112, o.seed || 1, { dish: o.menu === 'puri' ? 'aloo' : 'curry' });
  // steel tins and bowls
  const tins = [[188, 30, 34, '#cfd6da'], [218, 24, 28, '#e1a14a'], [170, 18, 24, '#b9c3c8']];
  for (const [x, h, w, c] of tins) { rrect(ctx, x - w / 2, -176 - h, w, h, 4); fill(ctx, hgrad(ctx, x - w / 2, x + w / 2, shade(c, 0.25), shade(c, -0.2)), 2); ellipse(ctx, x, -176 - h, w / 2, 4); fill(ctx, shade(c, 0.1), 1.2); }
  ctx.fillStyle = '#d83a68'; ellipse(ctx, 200, -200, 8, 4); ctx.fill(); ctx.fillStyle = '#f0e8a8'; ellipse(ctx, 160, -178, 12, 4); ctx.fill();
  // sign board on a pole
  if (o.sign !== false) {
    limb(ctx, 236, -176, 236, -300, 8, '#7a4a2a', 1.5);
    ctx.save(); ctx.translate(268, -320); ctx.rotate(0.03);
    rrect(ctx, -70, -62, 140, 124, 8); fill(ctx, '#fff7e6', 3.5); rrect(ctx, -62, -54, 124, 108, 5); ctx.strokeStyle = '#cc2a1f'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#d4231a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 46px NotoDeva, "Noto Sans Devanagari", sans-serif';
    const [a, b] = (o.sign || 'चिकन|करी').split('|');
    for (const [txt, y] of [[a, -20], [b || '', 26]]) { let fs = 46; ctx.font = `700 ${fs}px NotoDeva, "Noto Sans Devanagari", sans-serif`; const w = ctx.measureText(txt).width; if (w > 116) { fs = Math.floor(fs * 116 / w); ctx.font = `700 ${fs}px NotoDeva, "Noto Sans Devanagari", sans-serif`; } ctx.fillText(txt, 0, y); }
    ctx.restore();
  }
  // bottom shadow
});
// local helper so cart can reuse rotiBasket drawing without registry import cycle
import { PROPS } from '../../engine/registry.js';
function PROPS_rotiBasket(ctx, t) { PROPS.rotiBasket(ctx, t, { w: 150, n: 6 }); }
