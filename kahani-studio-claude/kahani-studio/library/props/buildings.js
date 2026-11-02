import { defineProp } from '../../engine/registry.js';
import { rng, shade, poly, fill, line, vgrad, hgrad, rrect, ellipse, limb } from '../../engine/draw.js';

function windowFrame(ctx, x, y, w, h, shutter = '#2f8f8a', glass = '#9fd6ee') {
  rrect(ctx, x, y, w, h, 4); fill(ctx, glass, 2);
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.strokeStyle = 'rgba(60,35,20,.7)'; ctx.lineWidth = 3; ctx.stroke();
  rrect(ctx, x - w * 0.42, y - 2, w * 0.4, h + 4, 3); fill(ctx, shutter, 2); rrect(ctx, x + w * 1.02, y - 2, w * 0.4, h + 4, 3); fill(ctx, shutter, 2);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x + 4, y + 4, w * 0.2, h * 0.35);
}
function door(ctx, x, y, w, h, col = '#8a5530') {
  rrect(ctx, x, y, w, h, 6); fill(ctx, vgrad(ctx, y, y + h, shade(col, 0.1), shade(col, -0.15)), 2.5);
  ctx.strokeStyle = 'rgba(40,20,10,.5)'; ctx.lineWidth = 2; rrect(ctx, x + w * 0.12, y + h * 0.1, w * 0.76, h * 0.38, 3); ctx.stroke(); rrect(ctx, x + w * 0.12, y + h * 0.55, w * 0.76, h * 0.38, 3); ctx.stroke();
  ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(x + w * 0.82, y + h * 0.52, 4, 0, 7); ctx.fill();
}

/** Tiled-roof village house. o: w,h,wall,base,roof,doorX,windows */
defineProp('tilehouse', (ctx, t, o) => {
  const w = o.w || 480, h = o.h || 220, wall = o.wall || '#f3ead2', base = o.base || '#58a6a0', roof = o.roof || '#d9693a', rh = o.rh || 110;
  // roof (front slope) with overhang
  poly(ctx, [[-w / 2 - 36, -h], [w / 2 + 36, -h], [w / 2 - 20, -h - rh], [-w / 2 + 20, -h - rh]]); fill(ctx, vgrad(ctx, -h - rh, -h, shade(roof, 0.12), shade(roof, -0.12)), 2.5);
  ctx.save(); poly(ctx, [[-w / 2 - 36, -h], [w / 2 + 36, -h], [w / 2 - 20, -h - rh], [-w / 2 + 20, -h - rh]]); ctx.clip();
  ctx.strokeStyle = 'rgba(90,30,10,.35)'; ctx.lineWidth = 2; for (let y = -h - rh + 14; y < -h; y += 14) { ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w, y); ctx.stroke(); }
  for (let y = -h - rh, row = 0; y < -h; y += 14, row++) for (let x = -w / 2 - 36 + (row % 2) * 12; x < w / 2 + 40; x += 24) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(40,20,10,.28)'; ctx.fillRect(-w / 2 - 30, -h, w + 60, 12);
  // wall
  rrect(ctx, -w / 2, -h, w, h, 2); fill(ctx, vgrad(ctx, -h, 0, wall, shade(wall, -0.1)), 2.5);
  ctx.fillStyle = base; ctx.fillRect(-w / 2 + 1, -42, w - 2, 41); ctx.strokeStyle = 'rgba(52,30,18,.5)'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 1, -42, w - 2, 41);
  ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(w / 2 - 40, -h, 40, h);
  const dx = o.doorX ?? 0; door(ctx, dx - 34, -h + 30, 68, h - 30, o.door || '#8a5530');
  if (o.windows !== false) { windowFrame(ctx, -w / 2 + 52, -h + 56, 56, 64, o.shutter || '#2f8f8a'); windowFrame(ctx, w / 2 - 108, -h + 56, 56, 64, o.shutter || '#2f8f8a'); }
  ctx.fillStyle = '#b8b2a2'; ctx.fillRect(dx - 46, -6, 92, 8); ctx.fillRect(dx - 56, 0, 112, 8);
});

/** Flat-roofed pucca house with parapet. */
defineProp('flathouse', (ctx, t, o) => {
  const w = o.w || 420, h = o.h || 250, wall = o.wall || '#f1ead8', trim = o.trim || '#c9bfa5';
  rrect(ctx, -w / 2, -h, w, h, 3); fill(ctx, vgrad(ctx, -h, 0, wall, shade(wall, -0.1)), 2.5);
  ctx.fillStyle = trim; ctx.fillRect(-w / 2 - 8, -h - 18, w + 16, 22); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 - 8, -h - 18, w + 16, 22);
  for (let x = -w / 2; x < w / 2; x += 34) { ctx.fillStyle = shade(trim, 0.15); ctx.fillRect(x + 4, -h - 46, 20, 28); ctx.strokeRect(x + 4, -h - 46, 20, 28); }
  windowFrame(ctx, -w / 2 + 60, -h + 60, 64, 76, o.shutter || '#d8863a'); windowFrame(ctx, w / 2 - 130, -h + 60, 64, 76, o.shutter || '#d8863a');
  door(ctx, -34, -h + 80, 68, h - 80, o.door || '#7a4a2a');
  ctx.fillStyle = o.base || '#b9c9c4'; ctx.fillRect(-w / 2 + 1, -26, w - 2, 25);
});
const OUTL = 'rgba(52,30,18,.7)';

/** Thatched hut. */
defineProp('hut', (ctx, t, o) => {
  const w = o.w || 300, h = o.h || 130, wall = o.wall || '#d9b47c', th = o.thatch || '#e3c16a';
  rrect(ctx, -w / 2, -h, w, h, 4); fill(ctx, vgrad(ctx, -h, 0, wall, shade(wall, -0.14)), 2.5);
  door(ctx, -26, -h + 22, 52, h - 22, '#6e4526');
  windowFrame(ctx, w / 2 - 84, -h + 28, 44, 44, '#7a5a3a', '#7bb7d6');
  ctx.beginPath(); ctx.moveTo(-w / 2 - 40, -h + 12); ctx.quadraticCurveTo(-w / 2 + 10, -h - 20, -w * 0.12, -h - 110); ctx.quadraticCurveTo(0, -h - 150, w * 0.12, -h - 110); ctx.quadraticCurveTo(w / 2 - 10, -h - 20, w / 2 + 40, -h + 12); ctx.quadraticCurveTo(0, -h + 34, -w / 2 - 40, -h + 12); ctx.closePath();
  fill(ctx, vgrad(ctx, -h - 150, -h + 20, shade(th, 0.15), shade(th, -0.18)), 2.5);
  ctx.strokeStyle = 'rgba(120,80,20,.4)'; ctx.lineWidth = 2; const r = rng(4);
  for (let i = 0; i < 38; i++) { const x = (r() - 0.5) * (w + 60); ctx.beginPath(); ctx.moveTo(x * 0.3, -h - 120 + r() * 30); ctx.lineTo(x, -h + 22 - r() * 10); ctx.stroke(); }
});

defineProp('wall', (ctx, t, o) => {
  const w = o.w || 600, h = o.h || 90, c = o.color || '#e6d8b8';
  rrect(ctx, -w / 2, -h, w, h, 3); fill(ctx, vgrad(ctx, -h, 0, c, shade(c, -0.12)), 2);
  ctx.fillStyle = shade(c, -0.2); ctx.fillRect(-w / 2 - 4, -h - 10, w + 8, 14); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 - 4, -h - 10, w + 8, 14);
});
defineProp('fence', (ctx, t, o) => {
  const w = o.w || 500, h = o.h || 70; const n = Math.floor(w / 36);
  for (let i = 0; i <= n; i++) { const x = -w / 2 + i * (w / n); limb(ctx, x, 0, x, -h - (i % 2) * 6, 10, '#9b6a3f', 1.5); }
  limb(ctx, -w / 2, -h * 0.4, w / 2, -h * 0.4, 8, '#b07a48', 1.5); limb(ctx, -w / 2, -h * 0.8, w / 2, -h * 0.8, 8, '#b07a48', 1.5);
});
defineProp('matka', (ctx, t, o) => {
  const s = o.r || 34; ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 1.7); ctx.bezierCurveTo(-s * 1.3, -s * 1.5, -s * 1.3, -s * 0.2, -s * 0.4, 0); ctx.lineTo(s * 0.4, 0); ctx.bezierCurveTo(s * 1.3, -s * 0.2, s * 1.3, -s * 1.5, s * 0.45, -s * 1.7); ctx.closePath();
  fill(ctx, vgrad(ctx, -s * 1.7, 0, '#d9733a', '#a9481f'), 2.5); ellipse(ctx, 0, -s * 1.72, s * 0.46, s * 0.12); fill(ctx, '#6e2d12', 2);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(-s * 0.6, -s * 0.9, s * 0.12, s * 0.4, 0.3, 0, 7); ctx.fill();
});
defineProp('bench', (ctx, t, o) => {
  const w = o.w || 200; limb(ctx, -w / 2 + 14, -34, -w / 2 + 14, 0, 12, '#7a4a2a', 1.5); limb(ctx, w / 2 - 14, -34, w / 2 - 14, 0, 12, '#7a4a2a', 1.5);
  rrect(ctx, -w / 2, -48, w, 16, 4); fill(ctx, '#b77a45', 2.5); rrect(ctx, -w / 2 + 6, -42, w - 12, 5, 2); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill();
});
defineProp('cow', (ctx, t, o) => {
  const c = o.color || '#2a2522', sw = Math.sin(t * 1.3) * 3;
  limb(ctx, -50, -50, -50, 0, 16, c, 2); limb(ctx, -30, -50, -30, 0, 16, c, 2); limb(ctx, 46, -50, 46, 0, 16, c, 2); limb(ctx, 66, -50, 66, 0, 16, c, 2);
  rrect(ctx, -86, -112, 176, 72, 30); fill(ctx, c, 2.5); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(-70, -108, 120, 12);
  limb(ctx, -86, -92, -112 + sw, -40, 6, c, 1.5);
  ctx.save(); ctx.translate(98, -110); ctx.rotate(0.25); ellipse(ctx, 18, 0, 38, 26); fill(ctx, c, 2.5); ellipse(ctx, 40, 10, 17, 13); fill(ctx, '#d8b6a0', 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(12, -8, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(13, -8, 2.5, 0, 7); ctx.fill();
  limb(ctx, 0, -14, -14, -34, 7, '#e8e0c8', 1.5); ellipse(ctx, -10, 0, 10, 16, 0.3); fill(ctx, c, 2); ctx.restore();
});
