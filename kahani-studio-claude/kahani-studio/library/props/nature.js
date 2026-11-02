import { defineProp } from '../../engine/registry.js';
import { rng, shade, mix, poly, fill, line, vgrad, blobs, limb2, ellipse } from '../../engine/draw.js';

defineProp('cloud', (ctx, t, o) => {
  const w = o.w || 260, r = rng(o.seed || 1);
  const dx = ((t * (o.drift ?? 6)) % 1) * 0; // drift handled by caller offset
  ctx.save(); ctx.translate(dx, 0);
  const parts = []; const n = 6;
  for (let i = 0; i < n; i++) parts.push([(i / (n - 1) - 0.5) * w * 0.8, -Math.sin((i / (n - 1)) * Math.PI) * w * 0.12 - r() * 8, w * (0.12 + 0.1 * Math.sin((i / (n - 1)) * Math.PI)) + r() * 8]);
  blobs(ctx, parts.map(([x, y, rr]) => [x, y + 10, rr]), 'rgba(150,185,225,.55)');
  blobs(ctx, parts, o.color || '#ffffff');
  ctx.restore();
});

defineProp('mountains', (ctx, t, o) => {
  const w = o.w || 3000, h = o.h || 260, r = rng(o.seed || 3), step = 40;
  const cols = o.colors || ['#5fa7a4', '#3d8a86'];
  const top = []; let y = 0;
  for (let x = -w / 2; x <= w / 2; x += step) {
    const u = (x + w / 2) / w;
    y = -h * (0.45 + 0.3 * Math.sin(u * 9 + (o.seed || 3)) + 0.2 * Math.sin(u * 23 + 1) + 0.12 * Math.sin(u * 51) * r());
    top.push([x, y]);
  }
  ctx.beginPath(); ctx.moveTo(-w / 2, 40); top.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(w / 2, 40); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, -h, 40, cols[0], cols[1]); ctx.fill();
  // light ridge
  ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.strokeStyle = shade(cols[0], 0.35); ctx.lineWidth = 5; ctx.stroke();
  // haze at the base
  ctx.fillStyle = vgrad(ctx, -40, 40, 'rgba(255,255,255,0)', o.haze || 'rgba(214,240,238,.75)'); ctx.fillRect(-w / 2, -40, w, 80);
});

defineProp('tree', (ctx, t, o) => {
  const h = o.h || 240, seed = o.seed || 1, r = rng(seed), g = o.leaf || '#3f9b3a';
  // trunk
  ctx.beginPath(); ctx.moveTo(-26, 0); ctx.bezierCurveTo(-20, -h * 0.3, -14, -h * 0.7, -12, -h); ctx.lineTo(14, -h); ctx.bezierCurveTo(14, -h * 0.6, 22, -h * 0.25, 30, 0); ctx.closePath();
  ctx.fillStyle = '#7b4d2c'; ctx.fill(); ctx.strokeStyle = 'rgba(52,30,18,.6)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.bezierCurveTo(8, -h * 0.4, 6, -h * 0.7, 6, -h); ctx.lineTo(14, -h); ctx.bezierCurveTo(14, -h * 0.6, 22, -h * 0.25, 30, 0); ctx.fillStyle = 'rgba(60,30,10,.28)'; ctx.fill();
  // branches
  limb2(ctx, [[0, -h * 0.55], [-60, -h * 0.85]], 14, '#7b4d2c', 1.5); limb2(ctx, [[4, -h * 0.65], [70, -h * 0.9]], 14, '#7b4d2c', 1.5);
  // canopy
  const sw = Math.sin(t * 0.9 + seed) * 2.5;
  const R = o.r || 105, cx = sw, cy = -h - R * 0.45;
  const list = [];
  for (let i = 0; i < 12; i++) { const a = r() * Math.PI * 2, d = r() * R * 0.95; list.push([cx + Math.cos(a) * d * 1.25, cy + Math.sin(a) * d * 0.7, R * (0.38 + r() * 0.3)]); }
  list.push([cx, cy, R * 0.8]);
  blobs(ctx, list.map(([x, y, rr]) => [x + 6, y + 10, rr]), shade(g, -0.38));
  blobs(ctx, list, shade(g, -0.12));
  blobs(ctx, list.map(([x, y, rr]) => [x - rr * 0.16, y - rr * 0.2, rr * 0.72]), g);
  blobs(ctx, list.filter((_, i) => i % 2 === 0).map(([x, y, rr]) => [x - rr * 0.3, y - rr * 0.4, rr * 0.3]), shade(g, 0.12));
  ctx.fillStyle = 'rgba(20,70,20,.35)'; for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * R * 0.9; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d * 1.2, cy + Math.sin(a) * d * 0.6 + 10, 5 + r() * 9, 0, 7); ctx.fill(); }
});

defineProp('palm', (ctx, t, o) => {
  const h = o.h || 320, lean = o.lean ?? 30, seed = o.seed || 1;
  const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([lean * u * u, -h * u]); }
  limb2(ctx, pts, 26, '#8a6a46', 2);
  for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(pts[i][0] - 12, pts[i][1]); ctx.lineTo(pts[i][0] + 12, pts[i][1] - 3); ctx.strokeStyle = 'rgba(60,35,15,.45)'; ctx.lineWidth = 2; ctx.stroke(); }
  const [tx, ty] = pts[10], sway = Math.sin(t * 1.1 + seed) * 0.05;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI + (i / 8) * Math.PI + sway; const len = 130 + (i % 2) * 20;
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + 55;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.85 - 20, ex, ey);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.55, ty + Math.sin(a) * len * 0.7 - 2, tx, ty);
    ctx.fillStyle = i % 2 ? '#2f8f3c' : '#3da648'; ctx.fill(); ctx.strokeStyle = 'rgba(20,70,25,.55)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  blobs(ctx, [[tx - 8, ty + 8, 11], [tx + 8, ty + 10, 11]], '#6b4a2a');
});

defineProp('bush', (ctx, t, o) => {
  const w = o.w || 160, g = o.leaf || '#3c9a3a', r = rng(o.seed || 2); const L = [];
  for (let i = 0; i < 7; i++) L.push([(i / 6 - 0.5) * w, -20 - r() * 24 + Math.abs(i - 3) * 4, 26 + r() * 16]);
  blobs(ctx, L.map(([x, y, rr]) => [x + 3, y + 7, rr]), shade(g, -0.35)); blobs(ctx, L, g); blobs(ctx, L.map(([x, y, rr]) => [x - 5, y - 8, rr * 0.6]), shade(g, 0.2));
  if (o.flowers) { const f = o.flowers; for (let i = 0; i < 6; i++) blobs(ctx, [[(r() - 0.5) * w * 0.9, -20 - r() * 40, 5]], f); }
});

defineProp('grass', (ctx, t, o) => {
  const w = o.w || 120, r = rng(o.seed || 5), g = o.leaf || '#4aa63e';
  ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const x = (r() - 0.5) * w, h = 16 + r() * 22, b = (r() - 0.5) * 16 + Math.sin(t * 1.5 + i) * 1.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + b * 0.3, -h * 0.6, x + b, -h); ctx.stroke(); }
});

defineProp('rock', (ctx, t, o) => {
  const w = o.w || 90; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(-w * 0.55, -w * 0.4, -w * 0.15, -w * 0.5); ctx.quadraticCurveTo(w * 0.3, -w * 0.62, w * 0.5, -w * 0.15); ctx.lineTo(w / 2, 0); ctx.closePath();
  fill(ctx, '#9a9a96', 2); ctx.beginPath(); ctx.moveTo(-w * 0.2, -w * 0.48); ctx.quadraticCurveTo(w * 0.3, -w * 0.6, w * 0.48, -w * 0.15); ctx.lineTo(w * 0.1, -w * 0.2); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill();
});

/** Big ground plane: grass verge, dirt road, soft lighting bands. y=0 is the horizon line. */
defineProp('ground', (ctx, t, o) => {
  const w = o.w || 8000, h = o.h || 700, c = o.color || '#cfa968', gr = o.grass || '#6db84c';
  ctx.fillStyle = vgrad(ctx, 0, h, shade(c, 0.1), shade(c, -0.12)); ctx.fillRect(-w / 2, 0, w, h);
  if (o.verge !== false) { ctx.fillStyle = vgrad(ctx, -6, 40, gr, shade(gr, -0.18)); ctx.beginPath(); ctx.moveTo(-w / 2, -8); for (let x = -w / 2; x <= w / 2; x += 60) ctx.lineTo(x, -8 + Math.sin(x * 0.013 + (o.seed || 0)) * 6); ctx.lineTo(w / 2, 36); ctx.lineTo(-w / 2, 36); ctx.closePath(); ctx.fill(); }
  const r = rng(7); ctx.fillStyle = 'rgba(120,80,40,.22)';
  for (let i = 0; i < 70; i++) { const x = (r() - 0.5) * w, y = 40 + r() * (h - 60); ellipse(ctx, x, y, 14 + r() * 28, 3 + r() * 5); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,240,200,.14)'; for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * w, y = 50 + r() * (h - 80); ellipse(ctx, x, y, 20 + r() * 30, 3 + r() * 4); ctx.fill(); }
});

defineProp('birds', (ctx, t, o) => {
  ctx.strokeStyle = '#3a3a52'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < (o.n || 5); i++) { const x = ((t * 28 + i * 70) % 600) - 100, y = Math.sin(i * 2.1) * 30 + i * 8, f = Math.sin(t * 6 + i) * 6; ctx.beginPath(); ctx.moveTo(x - 14, y - f); ctx.quadraticCurveTo(x - 5, y - 8, x, y); ctx.quadraticCurveTo(x + 5, y - 8, x + 14, y - f); ctx.stroke(); }
});
