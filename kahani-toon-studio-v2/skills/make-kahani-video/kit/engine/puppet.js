// Parametric 2D character ("puppet"). A character is a JSON spec (library/characters/*.json); a pose is a plain
// object of numbers. drawPuppet(ctx, spec, pose, t) is a pure function, so any frame can be rendered in isolation.
import { clamp, lerp } from './util.js';
import { OUT, shade, mix, poly, ellipse, fill, line, limb, limb2, vgrad, hgrad, rgrad, rrect, blobs } from './draw.js';
import { PROPS } from './registry.js';

export const UNIT = 366;
export const L1 = 86, L2 = 84; // upper arm / forearm
const T_LEG = 168, DEG = Math.PI / 180; // thigh + shin
// rig 3 proportions: shorter arms (wrist at the hip, not the knee), smaller hands and head
export const LA1 = 74, LA2 = 66;
const HAND3 = 0.74, HEAD3 = 0.9;

export function defaultPose() {
  return { x: 0, y: 0, facing: 1, scale: 1, bob: 0, lean: 0, sit: 0, crouch: 0, walk: 0, stride: 0,
    headRoll: 0, headYaw: 0, headPitch: 0, mouth: 0, smile: 0.35, brow: 0, browRaise: 0, browAsym: 0, eyeX: 0, eyeY: 0, blink: 0, eyeOpen: 1,
    hands: { R: null, L: null }, handMode: { R: null, L: null }, hold: { R: null, L: null }, swing: 1, sway: 0,
    rig: 1, sweat: 0, shake: 0, fx: null, arms: null };
}

/** two-bone IK in a local frame; side = +1 (front arm) / -1 (back arm). Returns elbow [x,y]. */
export function solveArm(sx, sy, tx, ty, side) {
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); const max = L1 + L2 - 1.5;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  if (d < 22) d = 22;
  const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), base = Math.atan2(dy, dx);
  // elbow: hang outward when the hand is mostly below the shoulder, otherwise keep the elbow low
  const c1 = base - a, c2 = base + a;
  const ang = dy > 0.72 * d ? (side > 0 ? c1 : c2) : (Math.sin(c1) > Math.sin(c2) ? c1 : c2);
  return { ex: sx + Math.cos(ang) * L1, ey: sy + Math.sin(ang) * L1, hx: sx + dx, hy: sy + dy };
}

/** rig 2: same two-bone IK, but the elbow side follows a smooth pole vector (down + outward) so it never flips between frames. */
export function solveArm2(sx, sy, tx, ty, side, l1 = L1, l2 = L2) {
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 1; const max = l1 + l2 - 1.5;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  if (d < 30) { dx *= 30 / d; dy *= 30 / d; d = 30; }
  const ux = dx / d, uy = dy / d, a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const px = -uy, py = ux, dot = px * side * 0.55 + py, k = clamp(dot / 0.22, -1, 1), sg = k * (2 - Math.abs(k)); // smooth sign
  return { ex: sx + ux * a + px * h * sg, ey: sy + uy * a + py * h * sg, hx: sx + dx, hy: sy + dy };
}

/** capsule that narrows from w0 (start) to w1 (end): reads as a real upper arm / forearm instead of a tube */
function taper(ctx, x0, y0, x1, y1, w0, w1, color, ol = 2.4) {
  const a = Math.atan2(y1 - y0, x1 - x0), h = Math.PI / 2;
  ctx.beginPath(); ctx.arc(x0, y0, w0 / 2, a + h, a - h); ctx.arc(x1, y1, w1 / 2, a - h, a + h); ctx.closePath(); fill(ctx, color, ol);
}

export function drawPuppet(ctx, spec, P, t) {
  const s = ((spec.height || UNIT) / UNIT) * (P.scale || 1);
  ctx.save(); ctx.translate(P.x, P.y);
  ctx.fillStyle = 'rgba(40,25,10,.3)'; ctx.beginPath(); ctx.ellipse(0, 4, 74 * s, 14 * s, 0, 0, 7); ctx.fill();
  if (P.shake) ctx.translate(Math.sin(t * 41) * P.shake * 2.4, Math.sin(t * 53) * P.shake * 0.8);
  ctx.save(); ctx.scale(s * P.facing, s);
  body(ctx, spec, P, t);
  ctx.restore();
  if (P.fx && P.fx.w > 0.01) drawFx(ctx, P.fx, s, t);
  ctx.restore();
}

/** floating effects above a character (rig 2): 'swirl' = hypnotic pull, 'sparkle', 'question'. Pure function of t. */
function drawFx(ctx, fx, s, t) {
  ctx.save(); ctx.translate(0, -455 * s); ctx.globalAlpha = Math.min(1, fx.w) * 0.9; ctx.scale(s, s);
  if (fx.kind === 'swirl') {
    ctx.rotate(t * 3.2); ctx.lineCap = 'round';
    for (const [c, w] of [['rgba(60,20,90,.95)', 11], ['#c98bff', 6]]) { ctx.beginPath(); for (let i = 0; i <= 90; i++) { const a = i * 0.21, r = 3 + i * 0.56; const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.62; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); }
  } else if (fx.kind === 'sparkle') {
    for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.26, r = 36 + 8 * Math.sin(t * 3 + i), x = Math.cos(a) * r, y = Math.sin(a) * r * 0.5 - 6, k = 7 + 3 * Math.sin(t * 7 + i * 2); ctx.beginPath(); ctx.moveTo(x, y - k); ctx.lineTo(x + k * 0.3, y - k * 0.3); ctx.lineTo(x + k, y); ctx.lineTo(x + k * 0.3, y + k * 0.3); ctx.lineTo(x, y + k); ctx.lineTo(x - k * 0.3, y + k * 0.3); ctx.lineTo(x - k, y); ctx.lineTo(x - k * 0.3, y - k * 0.3); ctx.closePath(); ctx.fillStyle = '#ffe27a'; ctx.fill(); }
  } else if (fx.kind === 'question') {
    ctx.translate(0, Math.sin(t * 3) * 5); ctx.font = '700 84px NotoDeva, "Noto Sans Devanagari", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(40,20,10,.9)'; ctx.strokeText('?', 0, 0); ctx.fillStyle = '#ffd24a'; ctx.fillText('?', 0, 0);
  }
  ctx.restore();
}

function body(ctx, spec, P, t) {
  const B = Object.assign({ sw: 1, ww: 1 }, spec.build), top = spec.top || {}, bot = spec.bottom || {}, skin = spec.skin || '#d49a6a';
  const sit = P.sit || 0, SH = 122;
  const amp = P.stride || 0, rig3 = (P.rig || 1) >= 3;
  // rig 3: pendulum legs (thigh swings ±GA about the hip, the forward-swinging leg bends its knee and lifts the foot).
  // The hip drops by the stance leg's shortening, so the planted foot stays on the ground.
  const GA = 0.3 * Math.min(1, amp * 1.6), wph = P.walk || 0;
  const gaitDrop = rig3 ? (T_LEG) * (1 - Math.cos(Math.abs(Math.sin(wph)) * GA)) * (1 - sit) : 0;
  const hipY = lerp(-166, -30, sit) + (P.crouch || 0) * 46 + (P.bob || 0) * (1 - sit * 0.4) + gaitDrop;
  const lean = P.lean || 0;
  const sw = 50 * B.sw, ww = 42 * B.ww;

  // ---------- legs
  const legs = [], T1 = 84, T2 = 84, wk = (P.walk || 0) / (2 * Math.PI);
  for (const a of [-1, 1]) {
    // gait: stance (foot slides back under the body) 60 %, swing (foot lifts and reaches forward) 40 %
    const hx = a * 14, hy = hipY + 3 * amp * (1 - sit);
    const f = (((wk + (a > 0 ? 0 : 0.5)) % 1) + 1) % 1, S = 32.4 * Math.min(1, amp * 6);
    let fxs, fys;
    if (f < 0.6) { fxs = S - (f / 0.6) * 2 * S; fys = 0; } else { const u = (f - 0.6) / 0.4, e = u * u * (3 - 2 * u); fxs = -S + e * 2 * S; fys = -Math.sin(Math.PI * u) * 24 * Math.min(1, amp * 6); }
    let fs = { x: a * 12 + fxs, y: fys }, ks;
    if (rig3) { // thigh angle (+ = forward), knee bend only while the leg swings forward
      const hy3 = hipY, th = Math.sin(wph) * -a * GA, bend = Math.max(0, Math.cos(wph) * -a) * GA * 1.9;
      ks = { x: hx + Math.sin(th) * T1, y: hy3 + Math.cos(th) * T1 };
      fs = { x: ks.x + Math.sin(th - bend) * T2 + a * 2, y: ks.y + Math.cos(th - bend) * T2 };
      fys = Math.min(0, fs.y);
    } else {
      const dx = fs.x - hx, dy = fs.y - hy; const d = Math.min(Math.hypot(dx, dy), T1 + T2 - 0.5);
      const aa = Math.acos(clamp((T1 * T1 + d * d - T2 * T2) / (2 * T1 * d), -1, 1)), base = Math.atan2(dy, dx), c1 = base - aa, c2 = base + aa, ang = Math.cos(c1) > Math.cos(c2) ? c1 : c2;
      ks = { x: hx + Math.cos(ang) * T1, y: hy + Math.sin(ang) * T1 };
    }
    const fz = { x: -a * 24, y: -11 }, kz = { x: a * 88, y: -26 };
    legs.push({ a, hx, hy, kx: lerp(ks.x, kz.x, sit), ky: lerp(ks.y, kz.y, sit), fx: lerp(fs.x, fz.x, sit), fy: lerp(fs.y, fz.y, sit), toe: fys < -1 ? 0.35 * Math.min(1, -fys / 24) : 0 });
  }
  const dhoti = bot.type === 'dhoti', saree = bot.type === 'saree';
  const pc = bot.color || '#8a7a60';
  if (!saree) {
    for (const g of legs) {
      const w1 = dhoti ? 48 : 38, w2 = dhoti ? 42 : 32;
      limb2(ctx, [[g.hx, g.hy], [g.kx, g.ky]], w1, pc, 2.4); limb2(ctx, [[g.kx, g.ky], [g.fx, g.fy - 8]], w2, dhoti ? pc : shade(pc, -0.04), 2.4);
      if (dhoti && bot.border) { const k = 0.82; const bx = lerp(g.kx, g.fx, k), by = lerp(g.ky, g.fy - 8, k); limb(ctx, bx, by, g.fx, g.fy - 8, w2 + 1, bot.border, 0); }
    }
    if (dhoti) { poly(ctx, [[-30, hipY - 4], [30, hipY - 4], [14, hipY + 96], [-14, hipY + 96]]); ctx.fillStyle = shade(pc, -0.03); ctx.globalAlpha = clamp(1 - sit * 2.2, 0, 1); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(90,70,50,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(0, hipY + 90); ctx.stroke(); }
  }
  // shoes / bare feet
  const sh = spec.shoes || {};
  for (const g of legs) { ellipse(ctx, g.fx + 8, g.fy - 3, 25, 10, -g.toe); fill(ctx, sh.color || skin, 2); if (sh.kind === 'shoe') { ellipse(ctx, g.fx + 14, g.fy - 7, 12, 6); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill(); } }
  if (saree) {
    const bw = lerp(60, 118, sit), by = lerp(-6, -14, sit), sc = bot.color || '#b42a3a';
    ctx.beginPath(); ctx.moveTo(-36, hipY - 8); ctx.lineTo(36, hipY - 8); ctx.bezierCurveTo(48, hipY + 70, bw + 4, by - 70, bw, by); ctx.lineTo(-bw, by); ctx.bezierCurveTo(-bw - 4, by - 70, -48, hipY + 70, -36, hipY - 8); ctx.closePath();
    fill(ctx, hgrad(ctx, -bw, bw, shade(sc, 0.1), shade(sc, -0.2)), 2.6);
    ctx.fillStyle = bot.border || '#e8b84a'; ctx.beginPath(); ctx.moveTo(-bw, by); ctx.lineTo(bw, by); ctx.lineTo(bw - 2, by - 18); ctx.lineTo(-bw + 2, by - 18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,20,20,.3)'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 8, hipY + 6); ctx.lineTo(i * bw / 3.6, by - 18); ctx.stroke(); }
  }

  // ---------- torso (rotates about the hip)
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean);
  const long = top.type === 'kurta', tc = top.color || '#8fb8e8';
  ctx.beginPath(); ctx.moveTo(-ww, 6);
  if (long) { ctx.lineTo(-ww - 10, 84 - sit * 20); ctx.quadraticCurveTo(0, 96 - sit * 20, ww + 10, 84 - sit * 20); ctx.lineTo(ww, 6); } else { ctx.lineTo(ww, 6); }
  ctx.bezierCurveTo(ww + 4, -40, sw + 4, -70, sw, -SH + 18); ctx.quadraticCurveTo(sw - 2, -SH - 2, 26, -SH - 2); ctx.lineTo(-26, -SH - 2); ctx.quadraticCurveTo(-sw + 2, -SH - 2, -sw, -SH + 18); ctx.bezierCurveTo(-sw - 4, -70, -ww - 4, -40, -ww, 6); ctx.closePath();
  fill(ctx, hgrad(ctx, -sw, sw, shade(tc, 0.14), shade(tc, -0.16)), 2.6);
  if (top.type === 'blouse') { // blouse + pallu band over one shoulder
    ctx.save(); ctx.clip(); const pal = top.pallu || bot.color || '#b42a3a';
    ctx.beginPath(); ctx.moveTo(-sw - 8, -SH + 8); ctx.lineTo(-sw + 30, -SH - 6); ctx.lineTo(ww + 8, 20); ctx.lineTo(ww - 34, 22); ctx.closePath(); ctx.fillStyle = pal; ctx.fill(); ctx.strokeStyle = top.border || '#e8b84a'; ctx.lineWidth = 6; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-ww, 6); ctx.bezierCurveTo(-ww - 4, -40, -sw - 4, -70, -sw, -SH + 18); ctx.quadraticCurveTo(-sw + 2, -SH - 2, -26, -SH - 2); ctx.lineTo(26, -SH - 2); ctx.quadraticCurveTo(sw - 2, -SH - 2, sw, -SH + 18); ctx.bezierCurveTo(sw + 4, -70, ww + 4, -40, ww, 6); ctx.closePath(); line(ctx, 2.6);
  }
  if (top.type === 'shirt' || top.type === 'kurta') {
    ctx.beginPath(); ctx.moveTo(-18, -SH - 2); ctx.lineTo(0, -SH + 26); ctx.lineTo(18, -SH - 2); ctx.closePath(); ctx.fillStyle = skin; ctx.fill(); line(ctx, 2);
    ctx.beginPath(); ctx.moveTo(-26, -SH - 2); ctx.lineTo(-6, -SH + 30); ctx.lineTo(0, -SH + 26); ctx.lineTo(-18, -SH - 2); ctx.closePath(); ctx.fillStyle = shade(tc, 0.2); ctx.fill(); line(ctx, 1.8);
    ctx.beginPath(); ctx.moveTo(26, -SH - 2); ctx.lineTo(6, -SH + 30); ctx.lineTo(0, -SH + 26); ctx.lineTo(18, -SH - 2); ctx.closePath(); ctx.fillStyle = shade(tc, 0.2); ctx.fill(); line(ctx, 1.8);
    ctx.strokeStyle = 'rgba(40,25,15,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -SH + 26); ctx.lineTo(0, long ? 90 : 6); ctx.stroke();
    ctx.fillStyle = shade(tc, -0.35); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -SH + 46 + i * 26, 3.2, 0, 7); ctx.fill(); }
    if (top.pocket) { rrect(ctx, 14, -SH + 54, 24, 28, 3); ctx.strokeStyle = 'rgba(40,25,15,.45)'; ctx.lineWidth = 2; ctx.stroke(); }
  }
  if (top.type === 'polo') {
    ctx.beginPath(); ctx.moveTo(-22, -SH - 2); ctx.lineTo(0, -SH + 20); ctx.lineTo(22, -SH - 2); ctx.closePath(); ctx.fillStyle = skin; ctx.fill(); line(ctx, 2);
    poly(ctx, [[-28, -SH - 2], [-8, -SH + 24], [-2, -SH + 12], [-20, -SH - 6]]); ctx.fillStyle = shade(tc, 0.1); ctx.fill(); line(ctx, 1.8); poly(ctx, [[28, -SH - 2], [8, -SH + 24], [2, -SH + 12], [20, -SH - 6]]); ctx.fillStyle = shade(tc, 0.1); ctx.fill(); line(ctx, 1.8);
    ctx.fillStyle = shade(tc, -0.4); for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(0, -SH + 30 + i * 12, 3, 0, 7); ctx.fill(); }
  }
  if (top.type === 'blouse') { ctx.beginPath(); ctx.moveTo(-22, -SH - 2); ctx.quadraticCurveTo(0, -SH + 30, 22, -SH - 2); ctx.closePath(); ctx.fillStyle = skin; ctx.fill(); line(ctx, 2); }
  if (top.vest) { // waistcoat panels over the shirt
    const vc = top.vest; for (const a of [-1, 1]) { ctx.beginPath(); ctx.moveTo(a * 20, -SH - 2); ctx.lineTo(a * sw, -SH + 16); ctx.bezierCurveTo(a * (sw + 4), -70, a * (ww + 4), -40, a * ww, 6); ctx.lineTo(a * 4, 6); ctx.lineTo(a * 6, -SH + 40); ctx.closePath(); fill(ctx, hgrad(ctx, -sw, sw, shade(vc, 0.1), shade(vc, -0.2)), 2.4); }
  }
  if (top.type === 'kurta') { ctx.strokeStyle = 'rgba(40,25,15,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-ww - 4, 60); ctx.lineTo(-ww - 10, 84); ctx.moveTo(ww + 4, 60); ctx.lineTo(ww + 10, 84); ctx.stroke(); }
  if (spec.extras?.necklace) { ctx.beginPath(); ctx.arc(0, -SH + 4, 28, 0.15, Math.PI - 0.15); ctx.strokeStyle = spec.extras.necklace; ctx.lineWidth = 4; ctx.stroke(); }
  ctx.restore();

  // ---------- head
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean); ctx.translate(0, -SH - 4); ctx.rotate(P.headRoll || 0);
  if (rig3) { // slimmer neck that flares into the shoulders, shadowed under the jaw
    ctx.beginPath(); ctx.moveTo(-11, -22); ctx.lineTo(11, -22); ctx.quadraticCurveTo(11, 2, 17, 8); ctx.lineTo(-17, 8); ctx.quadraticCurveTo(-11, 2, -11, -22); ctx.closePath(); ctx.fillStyle = skin; ctx.fill();
    ctx.fillStyle = vgrad(ctx, -22, 2, 'rgba(70,32,14,.42)', 'rgba(70,32,14,0)'); ctx.fill();
    ctx.strokeStyle = 'rgba(52,30,18,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-11, -20); ctx.quadraticCurveTo(-11, 2, -16, 6); ctx.moveTo(11, -20); ctx.quadraticCurveTo(11, 2, 16, 6); ctx.stroke();
    ctx.translate(0, -33 + (P.headPitch || 0) * 6); ctx.scale(HEAD3, HEAD3);
  } else { ctx.beginPath(); ctx.rect(-14, -14, 28, 22); ctx.fillStyle = shade(skin, -0.1); ctx.fill(); ctx.translate(0, -32 + (P.headPitch || 0) * 6); } // neck
  head(ctx, spec, P, t); ctx.restore();

  // ---------- arms (drawn last: hands may reach the face)
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean);
  const sleeve = top.sleeve || 'short', sc = top.type === 'blouse' ? tc : tc;
  const order = [-1, 1];
  for (const a of order) {
    const key = a > 0 ? 'R' : 'L', sx = a * sw * 0.92, sy = -SH + 16;
    let tgt = (P.hands && P.hands[key]) || null;
    const ph = (P.walk || 0) + (a > 0 ? Math.PI : 0), rig2 = (P.rig || 1) >= 2;
    if (!tgt) {
      const th = Math.cos((P.walk || 0) + (a > 0 ? Math.PI : 0)) * 0.55 * amp * (P.swing ?? 1), reach = 164 - 26 * Math.max(0, th); tgt = [a * 6 + Math.sin(th) * reach + (P.sway || 0) * 3, Math.cos(th) * reach * 0.99 - sit * 40];
      if (rig2) { const q = 1 - amp; tgt = [tgt[0] + a * 7 * q + Math.sin(t * 0.9 + a * 1.7) * 3.5 * q, tgt[1] - 6 * q + Math.sin(t * 1.5 + a) * 2.2 * q]; } // hands rest slightly away from the hips and breathe
    }
    let ex, ey, hx, hy, sy2 = sy; const AR = P.arms && P.arms[key];
    if (AR) { // rig 3: forward kinematics from [upper-arm angle, elbow bend] in degrees, "outward positive"
      const t1 = AR[0] * DEG * a, t2 = (AR[0] + AR[1]) * DEG * a;
      ex = sx + Math.sin(t1) * LA1; ey = sy + Math.cos(t1) * LA1; hx = ex + Math.sin(t2) * LA2; hy = ey + Math.cos(t2) * LA2;
    } else if (rig2) { // the shoulder rises with a raised hand; the elbow follows a smooth pole vector
      const lift = clamp((24 - tgt[1]) / 120, 0, 1) * 9; sy2 = sy - lift;
      ({ ex, ey, hx, hy } = solveArm2(sx, sy2, sx + tgt[0], sy + tgt[1], a));
    } else ({ ex, ey, hx, hy } = solveArm(sx, sy, sx + tgt[0], sy + tgt[1], a));
    const long = sleeve === 'long';
    if (rig3) { // tapered: shoulder > elbow > wrist, with an elbow crease
      const fx = lerp(ex, hx, 0.92), fy = lerp(ey, hy, 0.92);
      if (sleeve === 'none') { taper(ctx, sx, sy2, ex, ey, 25, 19, skin); taper(ctx, ex, ey, hx, hy, 19, 14, skin); }
      else { if (!long) taper(ctx, ex, ey, hx, hy, 19, 14, skin); taper(ctx, sx, sy2, ex, ey, 30, 23, sc); if (long) taper(ctx, ex, ey, fx, fy, 23, 19, shade(sc, -0.04)); }
      if (long || sleeve === 'none') { const c = long ? shade(sc, -0.3) : 'rgba(80,40,20,.45)', n = Math.atan2(hy - ey, hx - ex) + Math.PI / 2; ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex + Math.cos(n) * 6, ey + Math.sin(n) * 6); ctx.quadraticCurveTo(ex + 3 * Math.cos(n - 1.2), ey + 3 * Math.sin(n - 1.2), ex - Math.cos(n) * 2, ey - Math.sin(n) * 2); ctx.stroke(); }
      if (!long && sleeve !== 'none') { ctx.save(); ctx.translate(lerp(sx, ex, 0.62), lerp(sy2, ey, 0.62)); ctx.rotate(Math.atan2(ey - sy2, ex - sx)); ctx.strokeStyle = shade(sc, -0.32); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(0, -3); ctx.stroke(); ctx.restore(); }
    } else {
    limb(ctx, sx, sy2, ex, ey, 31, sc, 2.4);
    if (long) limb(ctx, ex, ey, hx, hy, 27, shade(sc, -0.04), 2.4); else if (sleeve === 'none') { limb(ctx, sx, sy2, ex, ey, 24, skin, 2.4); limb(ctx, ex, ey, hx, hy, 24, skin, 2.4); } else limb(ctx, ex, ey, hx, hy, 24, skin, 2.4);
    }
    ctx.beginPath(); ctx.arc(sx, sy2 + 2, rig3 ? 15 : 17.5, 0, 7); ctx.fillStyle = sleeve === 'none' ? skin : sc; ctx.fill();
    if (spec.extras?.bangles) { const bx = lerp(ex, hx, rig3 ? 0.84 : 0.8), by = lerp(ey, hy, rig3 ? 0.84 : 0.8); limb(ctx, bx, by, hx, hy, rig3 ? 18 : 25, spec.extras.bangles, 1.2); }
    const held = P.hold && P.hold[key];
    const ang = Math.atan2(hy - ey, hx - ex);
    const flat = held === 'plate' || held === 'plateEmpty' || held === 'bowl' || held === 'roti' || held === 'morsel' || held === 'coin';
    let mode = (P.handMode && P.handMode[key]) || 'relaxed';
    if (held === 'ladle' || held === 'stick' || held === 'spoon') mode = 'fist'; else if (held === 'plate' || held === 'plateEmpty' || held === 'bowl') mode = 'under'; else if (held === 'morsel') mode = 'pinch';
    if (held && !flat) drawHeld(ctx, held, hx, hy, ang, t);
    drawHand(ctx, hx, hy, ang, mode, skin, a, rig3 ? HAND3 : 1);
    if (held && flat) drawHeld(ctx, held, hx, hy, ang, t);
  }
  ctx.restore();
}

function drawHand(ctx, x, y, ang, mode, skin, side, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
  const finger = (px, py, len, w, rot) => { ctx.save(); ctx.translate(px, py); ctx.rotate(rot); limb(ctx, 0, 0, len, 0, w, skin, 1.7); ctx.restore(); };
  const palm = (rx = 11, ry = 11.5) => { ellipse(ctx, 6, 0, rx, ry); fill(ctx, skin, 2); };
  const ts = side > 0 ? -1 : 1;
  if (mode === 'open') { for (let i = 0; i < 4; i++) finger(10, -7.5 + i * 5, 15 - (i === 0 || i === 3 ? 2 : 0), 5.6, (i - 1.5) * 0.09); finger(4, ts * 8, 13, 6.4, ts * 0.9); palm(); }
  else if (mode === 'point') { finger(10, -1, 22, 5.6, 0); palm(10, 10.5); ellipse(ctx, 14, 4, 5, 4.5); fill(ctx, skin, 1.5); finger(6, ts * 8, 8, 6, ts * 0.6); }
  else if (mode === 'fist') { palm(11.5, 12); ctx.strokeStyle = 'rgba(70,35,15,.5)'; ctx.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(13, i * 5); ctx.lineTo(17, i * 5); ctx.stroke(); } }
  else if (mode === 'pinch') { palm(10.5, 11); finger(12, -3, 11, 5.2, 0.35); finger(10, ts * 7, 11, 5.6, -ts * 0.5); }
  else if (mode === 'under') { for (let i = 0; i < 4; i++) finger(8, -7 + i * 4.8, 12, 5.4, (i - 1.5) * 0.12); palm(11, 11.5); finger(4, ts * 9, 10, 6, ts * 0.7); }
  else { finger(11, -6, 8, 5.4, 0.25); finger(11, 0, 9, 5.4, 0.1); finger(11, 6, 8, 5.4, -0.05); palm(); finger(4, ts * 8, 9, 6, ts * 0.8); }
  ctx.restore();
}

export function drawHeld(ctx, name, x, y, ang, t) {
  ctx.save(); ctx.translate(x, y);
  if (name === 'plate') { ctx.translate(0, -8); PROPS.plate(ctx, t, { r: 52 }); }
  else if (name === 'plateEmpty') { ctx.translate(0, -8); PROPS.plate(ctx, t, { r: 52, food: false }); }
  else if (name === 'roti') { ctx.translate(0, -6); ellipse(ctx, 0, 0, 30, 9); fill(ctx, '#f1d49a', 2); }
  else if (name === 'bowl') { ctx.translate(0, -10); PROPS.bowl(ctx, t, { r: 28 }); }
  else if (name === 'ladle') { ctx.rotate(1.05); limb(ctx, -26, 0, 78, 0, 7, '#8a5530', 1.5); ctx.translate(86, 0); ellipse(ctx, 0, 0, 20, 14); fill(ctx, '#b9c3c8', 2); ellipse(ctx, 0, -2, 14, 8); ctx.fillStyle = '#c9501a'; ctx.fill(); }
  else if (name === 'spoon') { ctx.rotate(ang); limb(ctx, -10, 0, 40, 0, 5, '#cfd6da', 1.5); ellipse(ctx, 48, 0, 10, 7); fill(ctx, '#e0e6e9', 1.8); }
  else if (name === 'bag') { ctx.translate(0, 24); ctx.beginPath(); ctx.moveTo(-26, -22); ctx.lineTo(26, -22); ctx.lineTo(32, 36); ctx.lineTo(-32, 36); ctx.closePath(); fill(ctx, '#d9c18a', 2.4); limb(ctx, -14, -22, -6, -42, 4, '#8a6a3a', 0); limb(ctx, 14, -22, 6, -42, 4, '#8a6a3a', 0); }
  else if (name === 'pot') { ctx.translate(0, -34); ctx.beginPath(); ctx.moveTo(-52, -26); ctx.bezierCurveTo(-66, 20, -40, 50, 0, 50); ctx.bezierCurveTo(40, 50, 66, 20, 52, -26); ctx.closePath(); fill(ctx, vgrad(ctx, -26, 50, '#e1e5e7', '#8e979c'), 2.6); ellipse(ctx, 0, -26, 56, 11); fill(ctx, '#c9d2d6', 2.2); limb(ctx, -58, -8, -76, -14, 7, '#7a848a', 1.5); limb(ctx, 58, -8, 76, -14, 7, '#7a848a', 1.5); }
  else if (name === 'torch') { limb(ctx, 0, 30, 0, -70, 9, '#6a3f20', 1.5); const f = 1 + Math.sin(t * 12) * 0.1; ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgrad(ctx, 0, -100, 6, 190, 'rgba(255,160,60,.42)', 'rgba(255,160,60,0)'); ctx.beginPath(); ctx.arc(0, -100, 190, 0, 7); ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.moveTo(-14, -70); ctx.quadraticCurveTo(-20, -104 * f, Math.sin(t * 9) * 4, -140 * f); ctx.quadraticCurveTo(20, -104 * f, 14, -70); ctx.closePath(); ctx.fillStyle = '#ff8a1f'; ctx.fill(); ctx.beginPath(); ctx.moveTo(-7, -70); ctx.quadraticCurveTo(-9, -92 * f, 0, -112 * f); ctx.quadraticCurveTo(9, -92 * f, 7, -70); ctx.closePath(); ctx.fillStyle = '#ffd84a'; ctx.fill(); }
  else if (name === 'stick') { ctx.rotate(-0.15); limb(ctx, 0, 40, 0, -150, 8, '#7a4a2a', 1.5); }
  else if (name === 'morsel') { ctx.rotate(ang); ctx.translate(22, 0); ellipse(ctx, 0, 0, 9.5, 8.5); fill(ctx, '#efcf94', 1.8); ctx.beginPath(); ctx.ellipse(1, 1, 6, 4.5, 0, 0, 7); ctx.fillStyle = '#c4501a'; ctx.fill(); ctx.fillStyle = '#4aa84a'; ctx.fillRect(-2, -1, 2, 2); }
  else if (name === 'coin') { ctx.translate(0, -12); ellipse(ctx, 0, 0, 9, 9); fill(ctx, '#e6c04a', 1.5); }
  ctx.restore();
}

function head(ctx, spec, P, t) {
  const skin = spec.skin || '#d49a6a', F = spec.face || {}, hair = spec.hair || {}, hw = spec.headwear || {};
  const yaw = (P.headYaw || 0) * 9;
  // back hair
  if (hair.style === 'bun') { ctx.beginPath(); ctx.ellipse(0, -6, 49, 54, 0, 0, 7); fill(ctx, hair.color, 2.2); ellipse(ctx, yaw * 0.4, -64, 21, 19); fill(ctx, shade(hair.color, 0.08), 2.2); }
  // face shape
  const path = () => { ctx.beginPath(); ctx.moveTo(0, -45); ctx.bezierCurveTo(30, -46, 44, -22, 43, 2); ctx.bezierCurveTo(42, 28, 24, 46, 0, 47); ctx.bezierCurveTo(-24, 46, -42, 28, -43, 2); ctx.bezierCurveTo(-44, -22, -30, -46, 0, -45); ctx.closePath(); };
  for (const a of [-1, 1]) { ellipse(ctx, a * 43, 5, 8, 12.5); fill(ctx, shade(skin, -0.04), 2); ctx.strokeStyle = shade(skin, -0.3); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a * 41, -2); ctx.quadraticCurveTo(a * 48, 0, a * 46, 8); ctx.quadraticCurveTo(a * 44, 13, a * 43, 12); ctx.stroke(); ellipse(ctx, a * 43, 9, 2.2, 2.8); ctx.fillStyle = shade(skin, -0.22); ctx.fill(); }
  path(); fill(ctx, rgrad(ctx, -14, -14, 4, 66, shade(skin, 0.12), shade(skin, -0.12)), 2.6);
  ctx.save(); path(); ctx.clip();
  ctx.fillStyle = hgrad(ctx, 8, 46, 'rgba(95,45,20,0)', 'rgba(95,45,20,.2)'); ctx.fillRect(8, -50, 40, 100);              // shadow side (soft)
  ctx.fillStyle = vgrad(ctx, 30, 48, 'rgba(95,45,20,0)', 'rgba(95,45,20,.18)'); ctx.fillRect(-46, 30, 92, 20);              // under the jaw
  ctx.fillStyle = rgrad(ctx, -14, -24, 2, 22, 'rgba(255,240,220,.2)', 'rgba(255,240,220,0)'); ctx.fillRect(-40, -46, 50, 46); // forehead light
  ctx.restore();
  if (F.blush) { ctx.fillStyle = F.blush; ctx.globalAlpha = 0.35; for (const a of [-1, 1]) { ellipse(ctx, a * 26 + yaw * 0.8, 18, 9, 6); ctx.fill(); } ctx.globalAlpha = 1; }
  // eyes
  const es = F.eyeScale || 1, open = clamp((P.eyeOpen ?? 1) * (1 - (P.blink || 0)), 0.04, 1.3);
  for (const a of [-1, 1]) {
    const ex = a * 17 + yaw * 0.9, ey = -2 + (P.headPitch || 0) * 2;
    // almond eye: inner corner lower, outer corner a little higher; the upper lid covers the top of the iris
    const w = 10.6 * es, hu = 7.6 * es * open, hl = 4.6 * es * Math.min(1, open * 1.3), ix0 = ex - a * w, ix1 = ex + a * w, iy0 = ey + 1.2, iy1 = ey - 0.6;
    const upper = () => { ctx.moveTo(ix0, iy0); ctx.bezierCurveTo(ex - a * w * 0.5, ey - hu * 1.25, ex + a * w * 0.45, ey - hu * 1.3, ix1, iy1); };
    const lower = () => { ctx.bezierCurveTo(ex + a * w * 0.45, ey + hl * 1.15, ex - a * w * 0.5, ey + hl * 1.2, ix0, iy0); };
    ctx.fillStyle = 'rgba(110,55,30,.18)'; ctx.beginPath(); ctx.ellipse(ex, ey - 3, w * 1.15, 8 * es, 0, 0, 7); ctx.fill();   // socket shade
    if (open > 0.12) {
      ctx.save(); ctx.beginPath(); upper(); lower(); ctx.closePath(); ctx.fillStyle = '#f8f1e6'; ctx.fill(); ctx.clip();
      const px = clamp((P.eyeX || 0) * 3.4 + yaw * 0.28, -4.5, 4.5), py = clamp((P.eyeY || 0) * 2.4, -2.5, 2.5), ir = 5.6 * es;
      ctx.fillStyle = F.iris || '#3a2412'; ctx.beginPath(); ctx.arc(ex + px, ey + py + 0.4, ir, 0, 7); ctx.fill();
      ctx.fillStyle = shade(F.iris || '#3a2412', 0.25); ctx.beginPath(); ctx.arc(ex + px, ey + py + 1.6, ir * 0.62, 0, 7); ctx.fill();
      ctx.fillStyle = '#0c0705'; ctx.beginPath(); ctx.arc(ex + px, ey + py + 0.4, ir * 0.48, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(ex + px - 1.9, ey + py - 1.6, 1.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(ex + px + 1.8, ey + py + 2.2, 0.7, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(70,35,20,.28)'; ctx.beginPath(); ctx.ellipse(ex, ey - hu * 1.05, w * 1.1, 3.4, 0, 0, 7); ctx.fill(); // lid shadow on the eyeball
      ctx.restore();
      ctx.strokeStyle = 'rgba(90,45,25,.55)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(ix1, iy1); lower(); ctx.stroke();              // lower lid
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = 3.0; ctx.lineCap = 'round'; ctx.beginPath(); upper(); ctx.stroke();                            // upper lid
    ctx.strokeStyle = 'rgba(80,40,22,.5)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(ex - a * w * 0.55, ey - hu * 1.05 - 3.2); ctx.quadraticCurveTo(ex, ey - hu * 1.35 - 4.4, ex + a * w * 0.85, ey - hu * 0.75 - 3); ctx.stroke(); // crease
    if (F.lash) { ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; for (let i = 0; i < 3; i++) { const lx = ex + a * (w * 0.6 + i * 2.2), ly = ey - hu * (0.9 - i * 0.3) - 0.6; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + a * 2.2, ly - 1.6 + i * 0.4); ctx.stroke(); } }
    // brows
    const raise = (P.browRaise || 0) + (a > 0 ? (P.browAsym || 0) : 0), b = P.brow || 0, by = -23 - raise * 6 + (P.headPitch || 0) * 2;
    const inner = [ex - a * 10, by - b * 7 + (a > 0 ? (P.browAsym || 0) * -2 : 0)], outer = [ex + a * 11, by + b * 3];
    { const bt = (F.browThick || 5) * 0.6, mx2 = (inner[0] + outer[0]) / 2, my2 = Math.min(inner[1], outer[1]) - 2.6;
      ctx.beginPath(); ctx.moveTo(inner[0], inner[1] + bt); ctx.quadraticCurveTo(mx2, my2 + bt * 0.9, outer[0], outer[1] + 0.6); ctx.quadraticCurveTo(mx2, my2 - bt * 0.5, inner[0] + a * 0.5, inner[1] - bt); ctx.closePath(); ctx.fillStyle = F.brow || hair.color || '#22160f'; ctx.fill(); }
  }
  // nose
  { const nx = yaw * 1.1, k = F.nose || 1;
    ctx.fillStyle = 'rgba(95,45,20,.16)'; ctx.beginPath(); ctx.moveTo(nx + 3, -4); ctx.quadraticCurveTo(nx + 6.5 * k, 6, nx + 6 * k, 13); ctx.lineTo(nx + 1, 13); ctx.quadraticCurveTo(nx + 2, 4, nx + 1, -4); ctx.closePath(); ctx.fill(); // shadow side of the bridge
    ctx.fillStyle = 'rgba(95,45,20,.14)'; ctx.beginPath(); ctx.ellipse(nx, 17.5, 7 * k, 2.4, 0, 0, 7); ctx.fill();                  // shadow under the nose
    ctx.fillStyle = shade(skin, 0.05); ctx.beginPath(); ctx.ellipse(nx, 11.5, 4.2 * k, 3.6 * k, 0, 0, 7); ctx.fill();                // tip
    ctx.strokeStyle = 'rgba(60,30,16,.75)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    for (const a of [-1, 1]) { ctx.beginPath(); ctx.moveTo(nx + a * 3.4 * k, 9.5); ctx.quadraticCurveTo(nx + a * 7.6 * k, 11.5, nx + a * 5.6 * k, 15.2); ctx.quadraticCurveTo(nx + a * 3.6 * k, 16.4, nx + a * 1.8 * k, 15.6); ctx.stroke(); }
    ctx.fillStyle = 'rgba(55,22,12,.7)'; for (const a of [-1, 1]) { ctx.beginPath(); ctx.ellipse(nx + a * 3.1 * k, 14.6, 1.7, 0.95, a * 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,245,230,.4)'; ctx.beginPath(); ctx.ellipse(nx - 1.2, 9.6, 1.6, 1.1, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(90,45,25,.35)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(nx + 2, -6); ctx.quadraticCurveTo(nx + 3.6, 2, nx + 3.4 * k, 8); ctx.stroke(); }
  // mouth
  const mx = yaw * 1.0, my = 28, sm = P.smile ?? 0.3, mo = clamp(P.mouth || 0, 0, 1), mw = 15 - Math.abs(sm) * 0 + Math.max(0, sm) * 2;
  if (mo > 0.06) {
    ctx.beginPath(); ctx.moveTo(mx - mw, my - 1 + Math.max(0, -sm) * 3); ctx.quadraticCurveTo(mx, my + mo * 22 + sm * 8, mx + mw, my - 1 + Math.max(0, -sm) * 3); ctx.quadraticCurveTo(mx, my - 2 + sm * 6, mx - mw, my - 1);
    ctx.closePath(); ctx.fillStyle = '#5a1710'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.clip(); ellipse(ctx, mx, my + mo * 16, 9, 6); ctx.fillStyle = '#d9606a'; ctx.fill(); ctx.restore();
  } else {
    const lip = F.lash ? '#b65a52' : shade(skin, -0.2), w2 = mw * 0.86;
    ctx.fillStyle = lip; ctx.beginPath(); ctx.moveTo(mx - w2 * 0.8, my + sm * 3); ctx.quadraticCurveTo(mx, my + 6.6 + sm * 6, mx + w2 * 0.8, my + sm * 3); ctx.quadraticCurveTo(mx, my + 1.6 + sm * 7, mx - w2 * 0.8, my + sm * 3); ctx.fill(); // lower lip
    if (F.lash) { ctx.beginPath(); ctx.moveTo(mx - w2 * 0.85, my - sm * 1.5); ctx.quadraticCurveTo(mx - w2 * 0.35, my - 4, mx, my - 2.2); ctx.quadraticCurveTo(mx + w2 * 0.35, my - 4, mx + w2 * 0.85, my - sm * 1.5); ctx.quadraticCurveTo(mx, my + sm * 7, mx - w2 * 0.85, my - sm * 1.5); ctx.fillStyle = shade(lip, -0.12); ctx.fill(); } // upper lip
    ctx.fillStyle = 'rgba(255,235,220,.3)'; ctx.beginPath(); ctx.ellipse(mx, my + 3.4 + sm * 5, w2 * 0.32, 1.1, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(mx - mw, my - sm * 2); ctx.quadraticCurveTo(mx, my + sm * 12, mx + mw, my - sm * 2); ctx.strokeStyle = 'rgba(70,25,15,.9)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.stroke(); // lip line
    ctx.lineWidth = 1.4; for (const a of [-1, 1]) { ctx.beginPath(); ctx.moveTo(mx + a * mw, my - sm * 2); ctx.lineTo(mx + a * (mw + 1.6), my - sm * 2 - 1.4 * Math.sign(sm || 1)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(95,45,20,.28)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx - 6, my + 12 + sm * 4); ctx.quadraticCurveTo(mx, my + 14.5 + sm * 4, mx + 6, my + 12 + sm * 4); ctx.stroke(); // chin
  }
  if (F.moustache) { ctx.fillStyle = F.moustache; for (const a of [-1, 1]) { ctx.beginPath(); ctx.moveTo(mx, 19); ctx.bezierCurveTo(mx + a * 10, 15, mx + a * 28, 17, mx + a * 31, 26); ctx.bezierCurveTo(mx + a * 22, 22, mx + a * 8, 25, mx, 24); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); } }
  if (spec.extras?.bindi) { ctx.fillStyle = spec.extras.bindi; ctx.beginPath(); ctx.arc(yaw * 0.9, -24, 4, 0, 7); ctx.fill(); }
  if (spec.extras?.wrinkles) { ctx.strokeStyle = 'rgba(80,45,25,.35)'; ctx.lineWidth = 1.6; for (const a of [-1, 1]) { ctx.beginPath(); ctx.moveTo(a * 12 + yaw, 14); ctx.quadraticCurveTo(a * 18 + yaw, 22, a * 12 + yaw, 30); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-14, -34); ctx.lineTo(14, -34); ctx.moveTo(-10, -38); ctx.lineTo(10, -38); ctx.stroke(); }
  if (spec.extras?.earring) { for (const a of [-1, 1]) { ctx.beginPath(); ctx.arc(a * 44, 20, 3.6, 0, 7); ctx.fillStyle = spec.extras.earring; ctx.fill(); } }
  if (P.sweat > 0.02) { ctx.fillStyle = 'rgba(150,215,245,.95)'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; for (let i = 0; i < 3; i++) { const ph = ((t * 0.9 + i / 3) % 1), x = (i - 1) * 24 + yaw, y = -34 + ph * 54; ctx.globalAlpha = P.sweat * (1 - ph * 0.5); ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 7, y + 2, x, y + 6); ctx.quadraticCurveTo(x - 7, y + 2, x, y - 9); ctx.fill(); ctx.stroke(); } ctx.globalAlpha = 1; }
  // hair on top
  if (hair.style === 'short' || hair.style === 'bun') {
    ctx.beginPath(); ctx.moveTo(-44, -2); ctx.bezierCurveTo(-49, -42, -20, -57, 0, -56); ctx.bezierCurveTo(22, -57, 49, -42, 44, -2); ctx.lineTo(38, -12); ctx.quadraticCurveTo(20, -35 + (hair.style === 'bun' ? -4 : 0), 0, -32); ctx.quadraticCurveTo(-20, -35, -38, -12); ctx.closePath();
    fill(ctx, vgrad(ctx, -56, -20, shade(hair.color, 0.12), hair.color), 2.2);
    if (hair.style === 'bun') { ctx.beginPath(); ctx.moveTo(0, -33); ctx.lineTo(0, -56); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke(); if (spec.extras?.sindoor) { ctx.beginPath(); ctx.moveTo(yaw * 0.5, -34); ctx.lineTo(yaw * 0.5, -46); ctx.strokeStyle = spec.extras.sindoor; ctx.lineWidth = 3; ctx.stroke(); } }
  } else if (hair.style === 'curly') {
    const pts = []; for (let i = 0; i < 11; i++) { const a = Math.PI * (1.02 + i * 0.096); pts.push([Math.cos(a) * 46, -2 + Math.sin(a) * 52]); }
    blobs(ctx, pts.map(([x, y]) => [x, y, 15]), hair.color, 1.4);
  } else if (hair.style === 'elder') {
    for (const a of [-1, 1]) { ctx.beginPath(); ctx.moveTo(a * 38, -22); ctx.quadraticCurveTo(a * 56, -14, a * 47, 14); ctx.quadraticCurveTo(a * 40, 4, a * 36, -4); ctx.closePath(); fill(ctx, hair.color, 2); }
    ctx.beginPath(); ctx.moveTo(-38, -26); ctx.quadraticCurveTo(0, -52, 38, -26); ctx.quadraticCurveTo(0, -40, -38, -26); ctx.fillStyle = hair.color; ctx.fill();
  }
  // headwear
  if (hw.type === 'turban') {
    const c = hw.color || '#2d3fb0';
    ctx.beginPath(); ctx.moveTo(-50, -14); ctx.bezierCurveTo(-60, -50, -44, -78, 0, -80); ctx.bezierCurveTo(44, -78, 60, -50, 50, -14); ctx.bezierCurveTo(36, -26, 14, -32, 0, -31); ctx.bezierCurveTo(-14, -32, -36, -26, -50, -14); ctx.closePath();
    fill(ctx, vgrad(ctx, -80, -14, shade(c, 0.12), shade(c, -0.18)), 2.6);
    ctx.save(); ctx.clip(); ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-60, -22 - i * 11 + 4); ctx.quadraticCurveTo(0, -48 - i * 11 - 6 + 0, 60, -22 - i * 11 + 4 - 14); ctx.stroke(); } ctx.strokeStyle = shade(c, 0.3); ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-58, -28 - i * 11); ctx.quadraticCurveTo(0, -50 - i * 11, 58, -34 - i * 11); ctx.stroke(); } ctx.restore();
    if (hw.tail) { ctx.beginPath(); ctx.moveTo(46, -34); ctx.bezierCurveTo(66, -30, 70, -2, 62, 22); ctx.lineTo(48, 14); ctx.bezierCurveTo(54, -4, 50, -16, 40, -22); ctx.closePath(); fill(ctx, shade(c, -0.08), 2.4); }
  } else if (hw.type === 'topi') {
    const c = hw.color || '#f4f0e6'; ctx.beginPath(); ctx.moveTo(-42, -30); ctx.bezierCurveTo(-44, -66, 44, -66, 42, -30); ctx.quadraticCurveTo(0, -22, -42, -30); ctx.closePath(); fill(ctx, vgrad(ctx, -64, -26, shade(c, 0.1), shade(c, -0.1)), 2.4);
    ctx.strokeStyle = 'rgba(60,50,40,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-40, -34); ctx.quadraticCurveTo(0, -26, 40, -34); ctx.stroke();
  }
}
