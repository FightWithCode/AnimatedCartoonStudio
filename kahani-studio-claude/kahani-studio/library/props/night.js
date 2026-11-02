// Night / cave / story props (added for ep02). Origin = ground contact, y up is negative. All pure functions of t.
import { defineProp, PROPS } from '../../engine/registry.js';
import { rng, shade, fill, vgrad, rgrad, rrect, ellipse, limb, blobs } from '../../engine/draw.js';

/** Moon with a soft halo. o.r radius. */
defineProp('moon', (ctx, t, o) => {
  const r = o.r || 70;
  ctx.fillStyle = rgrad(ctx, 0, 0, r * 0.8, r * 3.4, 'rgba(255,245,200,.45)', 'rgba(255,245,200,0)'); ctx.beginPath(); ctx.arc(0, 0, r * 3.4, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = vgrad(ctx, -r, r, '#fffbe6', '#f2e3a6'); ctx.fill();
  ctx.fillStyle = 'rgba(190,170,110,.28)';
  for (const [x, y, k] of [[-0.3, -0.25, 0.22], [0.25, 0.1, 0.3], [-0.1, 0.45, 0.16], [0.35, -0.4, 0.12]]) { ctx.beginPath(); ctx.arc(x * r, y * r, k * r, 0, 7); ctx.fill(); }
});

/** A pair of glowing eyes watching from the dark. o.s scale, o.glow colour. */
defineProp('eyes', (ctx, t, o) => {
  const s = o.s || 1, c = o.glow || '#ff3b2a', pulse = 0.75 + 0.25 * Math.sin(t * 2.2), bl = (t % 5.3) < 0.14 ? 0.1 : 1;
  ctx.save(); ctx.scale(s, s * bl);
  for (const a of [-1, 1]) {
    const x = a * 74;
    ctx.fillStyle = rgrad(ctx, x, 0, 6, 120, `rgba(255,60,40,${0.5 * pulse})`, 'rgba(255,60,40,0)'); ctx.beginPath(); ctx.arc(x, 0, 120, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - a * 46, 14); ctx.quadraticCurveTo(x, -34, x + a * 46, -6); ctx.quadraticCurveTo(x + a * 6, 34, x - a * 46, 14); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + (o.look || 0), 2, 7, 20, a * 0.2, 0, 7); ctx.fillStyle = '#220402'; ctx.fill();
    ctx.fillStyle = 'rgba(255,235,200,.8)'; ctx.beginPath(); ctx.arc(x - 8, -8, 5, 0, 7); ctx.fill();
  }
  ctx.restore();
});

/** Rocky hillside with a dark cave mouth (exterior). o.w width, o.h height, o.eyes 0..1 shows eyes deep inside. */
defineProp('cave', (ctx, t, o) => {
  const w = o.w || 760, h = o.h || 520, r = rng(o.seed || 4), rock = o.rock || '#5d5a63';
  ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w * 0.46, -h * 0.3); ctx.lineTo(-w * 0.36, -h * 0.62); ctx.lineTo(-w * 0.2, -h * 0.86); ctx.lineTo(-w * 0.02, -h); ctx.lineTo(w * 0.18, -h * 0.9); ctx.lineTo(w * 0.34, -h * 0.64); ctx.lineTo(w * 0.47, -h * 0.28); ctx.lineTo(w / 2, 0); ctx.closePath();
  fill(ctx, vgrad(ctx, -h, 0, shade(rock, 0.2), shade(rock, -0.25)), 3.2);
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(20,15,30,.35)'; ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) { const x = (r() - 0.5) * w, y = -r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 90, y + 40 + r() * 60); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.moveTo(-w * 0.2, -h * 0.86); ctx.lineTo(-w * 0.02, -h); ctx.lineTo(w * 0.1, -h * 0.55); ctx.lineTo(-w * 0.1, -h * 0.5); ctx.closePath(); ctx.fill(); ctx.restore();
  // mouth
  const mw = w * 0.3, mh = h * 0.5;
  ctx.beginPath(); ctx.moveTo(-mw / 2, 0); ctx.bezierCurveTo(-mw / 2, -mh * 0.9, -mw * 0.25, -mh, 0, -mh); ctx.bezierCurveTo(mw * 0.25, -mh, mw / 2, -mh * 0.9, mw / 2, 0); ctx.closePath();
  ctx.fillStyle = rgrad(ctx, 0, -mh * 0.35, 20, mw * 0.7, '#1a0f22', '#050308'); ctx.fill(); ctx.strokeStyle = 'rgba(10,5,15,.95)'; ctx.lineWidth = 5; ctx.stroke();
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.8); ctx.fillStyle = `rgba(150,60,200,${0.1 + 0.08 * pulse})`; ctx.beginPath(); ctx.ellipse(0, -mh * 0.35, mw * 0.4, mh * 0.4, 0, 0, 7); ctx.fill();
  if (o.eyes > 0) { ctx.save(); ctx.globalAlpha = o.eyes; ctx.translate(0, -mh * 0.46); ctx.scale(0.32, 0.32); PROPS.eyes(ctx, t, {}); ctx.restore(); }
  // jagged rocks either side of the mouth
  for (const a of [-1, 1]) for (let i = 0; i < 3; i++) { const x = a * (mw / 2 + 10 + i * 26), hh = 40 + i * 14; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + a * 4, -hh); ctx.lineTo(x + 20, 0); ctx.closePath(); fill(ctx, shade(rock, -0.1 - i * 0.05), 2.4); }
});

/** Inside of the cave: rock walls, stalactites, torch-lit floor with a glowing rune circle. y=0 is the floor line. */
defineProp('caveRoom', (ctx, t, o) => {
  const w = o.w || 2600, h = o.h || 760, r = rng(o.seed || 13), c = o.rock || '#4a4252';
  ctx.fillStyle = vgrad(ctx, -h, 0, shade(c, -0.55), shade(c, -0.15)); ctx.fillRect(-w / 2, -h, w, h);
  ctx.strokeStyle = 'rgba(10,6,18,.45)'; ctx.lineWidth = 4;
  for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * w, y = -r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 160, y + 40 + r() * 120); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 18; i++) { ellipse(ctx, (r() - 0.5) * w, -r() * h, 70 + r() * 120, 40 + r() * 70); ctx.fill(); }
  for (let x = -w / 2; x < w / 2; x += 70 + r() * 60) { const L = 70 + r() * 150; ctx.beginPath(); ctx.moveTo(x - 32, -h); ctx.lineTo(x + 6, -h + L); ctx.lineTo(x + 34, -h); ctx.closePath(); fill(ctx, shade(c, -0.3), 2.4); }
  // floor
  ctx.fillStyle = vgrad(ctx, 0, 380, shade(c, -0.05), shade(c, -0.5)); ctx.fillRect(-w / 2, 0, w, 420); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-w / 2, 0, w, 10);
  ctx.strokeStyle = 'rgba(10,6,18,.4)'; ctx.lineWidth = 2; for (let y = 70; y < 400; y += 80) { ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); ctx.stroke(); }
  // glowing rune circle on the floor
  const cx = o.cx ?? 0, cy = o.cy ?? 150, pulse = 0.55 + 0.45 * Math.sin(t * 1.7);
  ctx.save(); ctx.translate(cx, cy); ctx.globalCompositeOperation = 'screen';
  for (const [rx, ry, lw, a] of [[330, 78, 6, 0.55], [250, 58, 4, 0.4], [170, 40, 3, 0.35]]) { ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.strokeStyle = `rgba(190,90,255,${a * pulse + 0.15})`; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5, x = Math.cos(a) * 250, y = Math.sin(a) * 58; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.strokeStyle = `rgba(255,120,220,${0.35 * pulse + 0.15})`; ctx.lineWidth = 3; ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + t * 0.15, x = Math.cos(a) * 292, y = Math.sin(a) * 68; ctx.fillStyle = `rgba(230,170,255,${0.55 * pulse + 0.2})`; ctx.fillRect(x - 6, y - 8, 12, 16); }
  ctx.restore();
  // drifting sparks
  ctx.fillStyle = 'rgba(210,150,255,.5)'; for (let i = 0; i < 22; i++) { const ph = ((t * 0.12 + i * 0.137) % 1); ctx.beginPath(); ctx.arc(((i * 211) % w) - w / 2 + Math.sin(t + i) * 14, -ph * 520 + 40, 2.2, 0, 7); ctx.fill(); }
});

/** Wall torch with a flickering flame and warm glow. */
defineProp('wallTorch', (ctx, t, o) => {
  const f = 1 + Math.sin(t * 12 + (o.seed || 0)) * 0.08 + Math.sin(t * 19) * 0.05;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgrad(ctx, 0, -60, 10, 300 * f, 'rgba(255,150,50,.38)', 'rgba(255,150,50,0)'); ctx.beginPath(); ctx.arc(0, -60, 300 * f, 0, 7); ctx.fill(); ctx.restore();
  limb(ctx, 0, 40, 0, -20, 14, '#5a3a22', 2); rrect(ctx, -16, -26, 32, 14, 4); fill(ctx, '#3a3a40', 2);
  ctx.beginPath(); ctx.moveTo(-17, -24); ctx.quadraticCurveTo(-24, -60 * f, Math.sin(t * 9) * 5, -96 * f); ctx.quadraticCurveTo(24, -60 * f, 17, -24); ctx.closePath(); ctx.fillStyle = '#ff8a1f'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-9, -24); ctx.quadraticCurveTo(-12, -48 * f, Math.sin(t * 9) * 3, -66 * f); ctx.quadraticCurveTo(12, -48 * f, 9, -24); ctx.closePath(); ctx.fillStyle = '#ffd84a'; ctx.fill();
});

/** Wall calendar page for the new-moon night. o.sub = heading, o.text = caption. */
defineProp('calendar', (ctx, t, o) => {
  const w = 150, h = 190; ctx.save(); ctx.rotate(0.02);
  rrect(ctx, -w / 2, -h, w, h, 6); fill(ctx, '#fff7e6', 3); ctx.fillStyle = '#c8302a'; ctx.fillRect(-w / 2, -h, w, 34); ctx.fillStyle = '#e8b84a'; ctx.beginPath(); ctx.arc(0, -h, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 22px NotoDeva, "Noto Sans Devanagari", sans-serif'; ctx.fillText(o.sub || 'अमावस्या', 0, -h + 17);
  ctx.beginPath(); ctx.arc(0, -86, 44, 0, 7); ctx.fillStyle = '#1a1830'; ctx.fill(); ctx.strokeStyle = '#8a8aa8'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#2a2a44'; ctx.font = '700 28px NotoDeva, "Noto Sans Devanagari", sans-serif'; ctx.fillText(o.text || 'काली रात', 0, -20); ctx.restore();
});

/** Basket piled with golden puffed puris (used on the aloo-puri cart). */
defineProp('puriBasket', (ctx, t, o) => {
  const w = o.w || 150, r = rng(7);
  ctx.beginPath(); ctx.moveTo(-w / 2, -50); ctx.bezierCurveTo(-w * 0.46, 8, w * 0.46, 8, w / 2, -50); ctx.closePath(); fill(ctx, vgrad(ctx, -50, 8, '#c8903f', '#8a5a22'), 2.5);
  ctx.strokeStyle = 'rgba(70,40,10,.5)'; ctx.lineWidth = 2; for (let x = -w / 2 + 16; x < w / 2; x += 18) { ctx.beginPath(); ctx.moveTo(x, -48); ctx.lineTo(x * 0.8, 0); ctx.stroke(); }
  const puris = [[-34, -56, 30], [34, -56, 30], [0, -58, 32], [-52, -52, 26], [52, -52, 26], [-18, -84, 30], [20, -84, 30], [0, -108, 28]];
  for (const [x, y, rr] of puris) {
    ellipse(ctx, x, y, rr, rr * 0.82); fill(ctx, vgrad(ctx, y - rr, y + rr, '#f6cf7a', '#d99a3a'), 2.2);
    ctx.fillStyle = 'rgba(160,90,20,.4)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + (r() - 0.5) * rr, y + (r() - 0.5) * rr * 0.6, 2.4, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(x - rr * 0.3, y - rr * 0.3, rr * 0.3, rr * 0.14, -0.5, 0, 7); ctx.fill();
  }
  ellipse(ctx, 0, -50, w / 2, 11); ctx.strokeStyle = 'rgba(52,30,18,.9)'; ctx.lineWidth = 2.5; ctx.stroke();
});
