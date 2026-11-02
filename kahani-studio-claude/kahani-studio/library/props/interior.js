import { defineProp } from '../../engine/registry.js';
import { rng, shade, poly, fill, line, vgrad, hgrad, rgrad, rrect, ellipse, limb, blobs } from '../../engine/draw.js';

/** A room shell: back wall, tiled ceiling with rafters, floor. y=0 is the floor line. */
defineProp('room', (ctx, t, o) => {
  const w = o.w || 2400, h = o.h || 700, wall = o.wall || '#86bfa6', floor = o.floor || '#b98a5a', c = o.ceiling || '#c46a35';
  ctx.fillStyle = vgrad(ctx, -h, 0, shade(wall, 0.08), shade(wall, -0.08)); ctx.fillRect(-w / 2, -h, w, h);
  // faint plaster mottling
  const r = rng(11); ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 24; i++) { ellipse(ctx, (r() - 0.5) * w, -r() * h, 60 + r() * 120, 30 + r() * 60); ctx.fill(); }
  // ceiling tiles
  ctx.fillStyle = vgrad(ctx, -h, -h + 120, shade(c, -0.25), c); ctx.fillRect(-w / 2, -h, w, 110);
  ctx.strokeStyle = 'rgba(60,20,5,.45)'; ctx.lineWidth = 2; for (let x = -w / 2; x < w / 2; x += 26) { ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x, -h + 110); ctx.stroke(); }
  for (let x = -w / 2 + 90; x < w / 2; x += 330) { rrect(ctx, x - 14, -h, 28, 128, 3); fill(ctx, '#7a4527', 2.5); }
  ctx.fillStyle = '#6a3a1f'; ctx.fillRect(-w / 2, -h + 108, w, 16);
  // floor
  ctx.fillStyle = vgrad(ctx, 0, 380, shade(floor, 0.05), shade(floor, -0.22)); ctx.fillRect(-w / 2, 0, w, 420);
  ctx.fillStyle = shade(wall, -0.3); ctx.fillRect(-w / 2, -36, w, 36); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-w / 2, 0, w, 8);
  ctx.strokeStyle = 'rgba(70,40,15,.25)'; ctx.lineWidth = 2; for (let y = 60; y < 400; y += 70) { ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); ctx.stroke(); }
});

defineProp('windowWood', (ctx, t, o) => {
  const w = o.w || 190, h = o.h || 240;
  rrect(ctx, -w / 2 - 12, -h - 12, w + 24, h + 24, 6); fill(ctx, '#8a5530', 3);
  ctx.save(); rrect(ctx, -w / 2, -h, w, h, 4); ctx.clip();
  if (o.sky === 'night' || o.sky === 'dusk') { // evening / night view through the window
    const night = o.sky === 'night'; ctx.fillStyle = vgrad(ctx, -h, 0, night ? '#0b1038' : '#4f64b8', night ? '#2a3a7a' : '#f08a76'); ctx.fillRect(-w / 2, -h, w, h);
    if (night) { ctx.fillStyle = '#fff'; for (let i = 0; i < 14; i++) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + i); ctx.fillRect(-w / 2 + ((i * 53) % w), -h + ((i * 37) % (h * 0.6)), 2.5, 2.5); } ctx.globalAlpha = 1; ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(w * 0.2, -h * 0.68, 22, 0, 7); ctx.fill(); }
    ctx.fillStyle = night ? '#10281c' : '#2a5a3a'; ctx.fillRect(-w / 2, -h * 0.25, w, h * 0.3); blobs(ctx, [[-60, -h * 0.28, 40], [10, -h * 0.3, 50], [70, -h * 0.26, 36]], night ? '#0c2016' : '#244d30'); ctx.restore();
  } else {
  ctx.fillStyle = vgrad(ctx, -h, 0, '#7fc6ee', '#d9f0f4'); ctx.fillRect(-w / 2, -h, w, h);
  blobs(ctx, [[-40, -h * 0.5, 40], [-5, -h * 0.55, 34], [40, -h * 0.48, 36]], '#ffffff'); ctx.fillStyle = '#4aa94a'; ctx.fillRect(-w / 2, -h * 0.25, w, h * 0.3); ctx.fillStyle = '#3f8f3a'; blobs(ctx, [[-60, -h * 0.28, 40], [10, -h * 0.3, 50], [70, -h * 0.26, 36]], '#2f7d33'); ctx.restore(); }
  ctx.strokeStyle = '#8a5530'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, 0); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(52,30,18,.7)'; ctx.lineWidth = 2; rrect(ctx, -w / 2, -h, w, h, 4); ctx.stroke();
  for (let x = -w / 2 + 20; x < w / 2; x += 26) { ctx.strokeStyle = '#6a3f20'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, -h); ctx.lineTo(x, 0); ctx.stroke(); }
});
defineProp('doorWood', (ctx, t, o) => {
  const w = o.w || 170, h = o.h || 400;
  rrect(ctx, -w / 2 - 12, -h - 12, w + 24, h + 12, 4); fill(ctx, '#6a3f20', 3);
  rrect(ctx, -w / 2, -h, w, h, 3); fill(ctx, vgrad(ctx, -h, 0, '#9a6236', '#7a4824'), 2.5);
  ctx.strokeStyle = 'rgba(40,20,10,.55)'; ctx.lineWidth = 3; for (const [a, b] of [[0.06, 0.4], [0.5, 0.92]]) { rrect(ctx, -w / 2 + 16, -h + h * a, w - 32, h * (b - a) - 10, 4); ctx.stroke(); }
  ctx.fillStyle = '#e0b440'; ctx.beginPath(); ctx.arc(w / 2 - 22, -h * 0.45, 7, 0, 7); ctx.fill();
});

/** Wall shelf with brass pots / jars. */
defineProp('shelf', (ctx, t, o) => {
  const w = o.w || 420, r = rng(o.seed || 9);
  rrect(ctx, -w / 2, -8, w, 16, 3); fill(ctx, '#8a5530', 2.5);
  for (let x = -w / 2 + 50; x < w / 2 - 30; x += 70) {
    const k = r(), s = 22 + r() * 12, col = k < 0.4 ? '#d6a43a' : k < 0.7 ? '#c0622e' : '#b9c3c8';
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, -8 - s * 1.35); ctx.bezierCurveTo(x - s * 1.2, -8 - s * 1.2, x - s * 1.1, -8 - s * 0.2, x - s * 0.5, -8); ctx.lineTo(x + s * 0.5, -8); ctx.bezierCurveTo(x + s * 1.1, -8 - s * 0.2, x + s * 1.2, -8 - s * 1.2, x + s * 0.5, -8 - s * 1.35); ctx.closePath();
    fill(ctx, vgrad(ctx, -8 - s * 1.4, -8, shade(col, 0.2), shade(col, -0.2)), 2); ellipse(ctx, x, -8 - s * 1.36, s * 0.52, s * 0.14); fill(ctx, shade(col, -0.35), 1.5);
  }
});
/** Hanging utensil rack (ladles, pans). */
defineProp('rack', (ctx, t, o) => {
  const w = o.w || 360; limb(ctx, -w / 2, 0, w / 2, 0, 8, '#6a3f20', 1.5);
  for (let i = 0; i < 6; i++) { const x = -w / 2 + 30 + i * (w - 60) / 5, L = 70 + (i % 3) * 25; limb(ctx, x, 0, x, L, 5, '#aeb8bd', 1.2); ellipse(ctx, x, L + 14, 15, 17); fill(ctx, i % 2 ? '#c9d2d6' : '#d6a43a', 2); }
});

defineProp('chulha', (ctx, t, o) => {
  // clay stove platform with a pot of curry; fire flicker is a pure function of t
  const w = o.w || 330, h = o.h || 150;
  rrect(ctx, -w / 2, -h, w, h, 14); fill(ctx, vgrad(ctx, -h, 0, '#c99a6a', '#a8774a'), 3);
  ctx.fillStyle = '#2a1a10'; rrect(ctx, -w * 0.28, -h * 0.5, w * 0.56, h * 0.42, 14); ctx.fill();
  for (let i = 0; i < 5; i++) { const fx = -w * 0.2 + i * w * 0.1, fl = 26 + Math.sin(t * 11 + i * 2.3) * 8 + Math.sin(t * 17 + i) * 4; ctx.beginPath(); ctx.moveTo(fx - 12, -h * 0.1); ctx.quadraticCurveTo(fx - 6, -h * 0.1 - fl * 0.7, fx + Math.sin(t * 9 + i) * 4, -h * 0.1 - fl - 14); ctx.quadraticCurveTo(fx + 8, -h * 0.1 - fl * 0.6, fx + 12, -h * 0.1); ctx.fillStyle = '#ff8a1f'; ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - 6, -h * 0.1); ctx.quadraticCurveTo(fx - 2, -h * 0.1 - fl * 0.5, fx, -h * 0.1 - fl * 0.8); ctx.quadraticCurveTo(fx + 4, -h * 0.1 - fl * 0.4, fx + 6, -h * 0.1); ctx.fillStyle = '#ffd34a'; ctx.fill(); }
  // pot
  ctx.save(); ctx.translate(0, -h);
  ctx.beginPath(); ctx.moveTo(-100, 0); ctx.bezierCurveTo(-110, -70, -80, -100, -60, -100); ctx.lineTo(60, -100); ctx.bezierCurveTo(80, -100, 110, -70, 100, 0); ctx.closePath(); fill(ctx, vgrad(ctx, -100, 0, '#d9dde0', '#8e979c'), 3);
  ellipse(ctx, 0, -100, 62, 12); fill(ctx, '#e0a14a', 2);
  ctx.restore();
  if (o.steam !== false) steam(ctx, t, 0, -h - 105, 5, o.seed || 1);
});

export function steam(ctx, t, x, y, n = 4, seed = 1) {
  for (let i = 0; i < n; i++) {
    const ph = ((t * 0.55 + i / n + seed * 0.13) % 1), yy = y - ph * 130, xx = x + Math.sin(ph * 7 + i * 2 + seed) * 16 + (i - n / 2) * 14, a = Math.sin(ph * Math.PI) * 0.5;
    const g = rgrad(ctx, xx, yy, 2, 26 + ph * 20, `rgba(255,255,255,${a})`, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, 26 + ph * 20, 0, 7); ctx.fill();
  }
}

defineProp('mat', (ctx, t, o) => { const w = o.w || 360; ellipse(ctx, 0, 0, w / 2, 26); fill(ctx, '#d8b25a', 2.5); ctx.strokeStyle = 'rgba(150,90,20,.55)'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, w / 2 - 16 - Math.abs(i) * 3, 26 - 5 - Math.abs(i), 0, 0, 7); } for (let r = 0.3; r < 1; r += 0.22) { ctx.beginPath(); ctx.ellipse(0, 0, w / 2 * r, 26 * r, 0, 0, 7); ctx.stroke(); } });
defineProp('stool', (ctx, t, o) => { limb(ctx, -34, -40, -40, 0, 10, '#7a4a2a', 1.5); limb(ctx, 34, -40, 40, 0, 10, '#7a4a2a', 1.5); rrect(ctx, -52, -54, 104, 18, 5); fill(ctx, '#b77a45', 2.5); });
defineProp('sack', (ctx, t, o) => { ctx.beginPath(); ctx.moveTo(-40, 0); ctx.bezierCurveTo(-60, -50, -40, -90, -20, -96); ctx.lineTo(20, -96); ctx.bezierCurveTo(40, -90, 60, -50, 40, 0); ctx.closePath(); fill(ctx, '#d9c18a', 2.5); ctx.strokeStyle = 'rgba(130,100,50,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, -86); ctx.lineTo(26, -86); ctx.stroke(); });
defineProp('hangingLamp', (ctx, t, o) => { limb(ctx, 0, -o.len || 0, 0, 0, 3, '#444', 0); ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.lineTo(12, 30); ctx.lineTo(-12, 30); ctx.closePath(); fill(ctx, '#2e7d6a', 2); ellipse(ctx, 0, 36, 10, 10); fill(ctx, '#ffe39a', 1.5); });
