// Compiles an actor's script (tuples) into a pure state(t) function. No state survives between calls.
import { clamp, lerp, sstep, ramp, mulberry32, noise1, hash1, easeIO } from './util.js';
import { defaultPose, solveArm2, LA1, LA2 } from './puppet.js';
import { GESTURES, POSES, AUTO_GESTURES } from '../library/gestures.js';

const wgt = (t, a, b, r = 0.3) => sstep(a, a + r, t) * (1 - sstep(b - r, b, t));

/** trapezoidal-velocity move along one segment: returns 0..1 */
function trap(tt, dur) { const e = Math.min(0.4, dur / 3), v = 1 / (dur - e); if (tt <= 0) return 0; if (tt >= dur) return 1; if (tt < e) return v * tt * tt / (2 * e); if (tt < dur - e) return v * e / 2 + v * (tt - e); const r = dur - tt; return 1 - v * r * r / (2 * e); }

export class Mover {
  constructor(x0, y0, walks, tA, tB, scale = 1) {
    this.walks = walks.slice().sort((a, b) => a[0] - b[0]);
    this.tA = tA; this.dt = 1 / 60; const n = Math.ceil((tB - tA) / this.dt) + 2;
    this.x = new Float32Array(n); this.y = new Float32Array(n); this.d = new Float32Array(n); this.v = new Float32Array(n);
    let cx = x0, cy = y0; const segs = []; for (const [a, b, tx, ty] of this.walks) { segs.push({ a, b, x0: cx, y0: cy, x1: tx, y1: ty ?? cy }); cx = tx; cy = ty ?? cy; }
    let dist = 0, px = x0, py = y0;
    for (let i = 0; i < n; i++) {
      const t = tA + i * this.dt; let x = x0, y = y0;
      for (const s of segs) { if (t >= s.b) { x = s.x1; y = s.y1; } else if (t > s.a) { const k = trap(t - s.a, s.b - s.a); x = lerp(s.x0, s.x1, k); y = lerp(s.y0, s.y1, k); break; } else break; }
      if (i) dist += Math.hypot(x - px, y - py); px = x; py = y; this.x[i] = x; this.y[i] = y; this.d[i] = dist;
    }
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2); this.v[i] = Math.hypot(this.x[b] - this.x[a], this.y[b] - this.y[a]) / ((b - a) * this.dt); }
    this.o = { x: 0, y: 0, dist: 0, speed: 0 };
  }
  at(t) { const f = clamp((t - this.tA) / this.dt, 0, this.x.length - 1.001), i = Math.floor(f), u = f - i, o = this.o; o.x = lerp(this.x[i], this.x[i + 1], u); o.y = lerp(this.y[i], this.y[i + 1], u); o.dist = lerp(this.d[i], this.d[i + 1], u); o.speed = lerp(this.v[i], this.v[i + 1], u); return o; }
}

export class Actor {
  constructor(id, spec, cast, shot) {
    this.id = id; this.spec = spec; this.cast = cast; this.shot = shot; const sc = cast.script || [];
    this.seed = (id.length * 7.31 + (spec.seed || 1)) % 17;
    this.scale = cast.scale || 1; this.rig = shot.rig || 1;
    this.mover = new Mover(cast.x, cast.y, sc.filter((s) => s[0] === 'walk').map((s) => s.slice(1)), shot.t[0] - 0.5, shot.t[1] + 0.5);
    this.acts = sc.filter((s) => s[0] !== 'walk');
    const ev = [[-1e9, cast.facing ?? 1]]; for (const [a, b, tx] of this.mover.walks) { const x0 = this.mover.at(a).x; if (Math.abs(tx - x0) > 1) ev.push([a, Math.sign(tx - x0)]); }
    for (const s of this.acts) if (s[0] === 'face') ev.push([s[1], s[2]]);
    this.faceEv = ev.sort((a, b) => a[0] - b[0]);
    this.z = cast.z;
  }
  pos(t) { return this.mover.at(t); }
  facing(t) {
    let cur = this.faceEv[0][1], prev = cur, tt = -1e9;
    for (const [te, d] of this.faceEv) { if (te <= t) { prev = cur; cur = d; tt = te; } }
    return lerp(prev, cur, sstep(tt, tt + 0.22, t));
  }
  state(t, world) {
    if (this.rig >= 3) return this.state3(t, world);
    const P = defaultPose(), m = this.mover.at(t), seed = this.seed;
    P.rig = this.rig; P.x = m.x; P.y = m.y; P.scale = this.scale; P.facing = this.facing(t) || 0.001;
    const amp = clamp(m.speed / 105, 0, 1); P.stride = amp; P.walk = (m.dist / 54) * Math.PI;
    P.bob = -Math.abs(Math.sin(P.walk)) * 6 * amp + Math.sin(t * 2.1 + seed) * 1.4;
    const bt = (t + seed * 1.37) % 3.7; P.blink = bt < 0.13 ? Math.sin((bt / 0.13) * Math.PI) : 0;
    let sit = 0, crouch = 0, mouth = 0, say = 0, eatHold = null; const swx = (this.spec.build?.sw ?? 1) * 50 * 0.92;
    const g = { R: null, L: null, wR: 0, wL: 0 }; let look = null, lw = 0; const hold = { R: null, L: null };
    for (const a of this.acts) {
      const k = a[0];
      if (k === 'sit') sit = Math.max(sit, wgt(t, a[1], a[2], 0.7));
      else if (k === 'crouch') crouch = Math.max(crouch, wgt(t, a[1], a[2], 0.5));
      else if (k === 'say') { const w = wgt(t, a[1], a[2], 0.12); if (w > 0) { say = Math.max(say, w); } }
      else if (k === 'do') { // (rig 2 eases gestures in/out a little more slowly)
        const w = wgt(t, a[2], a[3], a[4]?.ramp ?? (this.rig >= 2 ? 0.5 : 0.35)); if (w <= 0.001) continue; const gf = GESTURES[a[1]]; if (!gf) throw new Error('unknown gesture ' + a[1]);
        const r = gf(t - a[2], a[4] || {});
        for (const h of ['R', 'L']) {
          const sgn = h === 'R' ? 1 : -1; let tg = r[h] || null; if (!tg && r[h + 'a']) tg = [r[h + 'a'][0] - sgn * swx, r[h + 'a'][1]];
          if (tg) { g[h] = g[h] ? [lerp(g[h][0], tg[0], w), lerp(g[h][1], tg[1], w)] : tg; g['w' + h] = Math.max(g['w' + h], w); if (r['m' + h] && w > 0.3) P.handMode[h] = r['m' + h]; }
        }
        if (r.holdR !== undefined && a[1] === 'eat') eatHold = w > 0.3 ? r.holdR : eatHold;
        if (r.shake) P.shake += r.shake * w; if (r.lean) P.lean += r.lean * w; if (r.headRoll) P.headRoll += r.headRoll * w; if (r.headPitch) P.headPitch += r.headPitch * w; if (r.mouth) mouth = Math.max(mouth, r.mouth * w);
      } else if (k === 'hold') { if (t >= a[2] - 0.001 && t <= a[3]) hold[a[4] || 'R'] = a[1]; }
      else if (k === 'look') { const w = wgt(t, a[1], a[2], 0.3); if (w > 0) { look = a[3]; lw = Math.max(lw, w); } }
      else if (k === 'emote') { const w = wgt(t, a[1], a[2], 0.4), o = a[3]; for (const key in o) P[key] = lerp(P[key], o[key], w); }
      else if (k === 'lean') P.lean += a[3] * wgt(t, a[1], a[2], 0.5);
      else if (k === 'fx') { const w = wgt(t, a[1], a[2], 0.4); if (w > 0.001) P.fx = { kind: a[3], w }; }
    }
    if (eatHold) hold.R = eatHold;
    if (say > 0 && !g.R) {
      if (this.rig >= 2) { const r = GESTURES.speak(t, { seed }); for (const h of ['R', 'L']) if (!g[h] && !(hold[h])) { g[h] = r[h]; g['w' + h] = say; P.handMode[h] = r['m' + h]; } }
      else { const r = GESTURES.talk(t, {}); g.R = r.R; g.wR = say; P.handMode.R = 'open'; }
    }
    P.sway = Math.sin(t * 1.25 + seed); P.lean += P.sway * 0.006 * (1 - amp);
    P.sit = sit; P.crouch = crouch; P.hold = hold;
    // hands: blend rest -> gesture
    for (const h of ['R', 'L']) {
      const a = h === 'R' ? 1 : -1;
      if (g[h]) { const ph = P.walk + (a > 0 ? Math.PI : 0); const rest = [a * 8 + Math.sin(ph) * 26 * amp, 166 - sit * 40]; const w = g['w' + h]; P.hands[h] = [lerp(rest[0], g[h][0], w), lerp(rest[1], g[h][1], w)]; }
    }
    if (say > 0) { P.mouth = Math.max(mouth, say * 0.85 * Math.abs(Math.sin(t * 10.5 + seed)) * (0.55 + 0.45 * Math.sin(t * 3.3 + seed * 2))); P.headPitch += say * 0.12 * Math.sin(t * 4.1 + seed); P.browRaise += say * 0.25 * Math.max(0, Math.sin(t * 2.6 + seed)); }
    else P.mouth = mouth;
    // gaze
    let tx = null, ty = -240;
    if (look && world) { if (look === 'camera') { tx = null; } else if (typeof look === 'string') { const o = world.posOf(look, t); if (o) { tx = o.x; ty = o.y - (o.h || 240); } } else { tx = look.x; ty = look.y ?? ty; } }
    if (tx !== null) { const dx = tx - m.x, dy = ty - (m.y - 300); const yaw = clamp(dx / 280, -1, 1) * P.facing; P.headYaw = lerp(0, yaw, lw); P.eyeX = lerp(0, clamp(dx / 200, -1, 1) * P.facing, lw); P.eyeY = lerp(0, clamp(dy / 200, -1, 1), lw); }
    if (look === 'camera') { P.eyeX *= 0; }
    P.headRoll += Math.sin(t * 0.8 + seed) * 0.012;
    return P;
  }

  // ------------------------------------------------------------------------------------------------------------------
  // rig 3 ("kahani" movement): arms are angle poses that ease into each other, speakers hold a gesture and change it
  // every few seconds, walking is a pendulum stride whose phase follows the distance walked (no foot sliding),
  // lip-flap is phrase-shaped noise, blinks come at irregular intervals. Still a pure function of t.
  state3(t, world) {
    const P = defaultPose(), m = this.mover.at(t), seed = this.seed, st = t + seed * 0.37;
    P.rig = 3; P.x = m.x; P.y = m.y; P.scale = this.scale; P.facing = this.facing(t) || 0.001;
    const amp = clamp(m.speed / 105, 0, 1); P.stride = amp; P.walk = (m.dist / 99) * Math.PI;
    P.bob = Math.sin(st * 1.9) * 0.8;
    P.blink = blink3(t, seed);
    const swx = (this.spec.build?.sw ?? 1) * 50 * 0.92, sy = -122 + 16;
    let sit = 0, crouch = 0, mouth = 0, say = 0, eatHold = null, look = null, lw = 0;
    const hold = { R: null, L: null }, g = { R: null, L: null, wR: 0, wL: 0, mR: null, mL: null };
    const add = (h, ang, mode, w) => { // blend one gesture's arm angles in
      if (!ang) return; g[h] = g[h] ? [lerp(g[h][0], ang[0], w), lerp(g[h][1], ang[1], w)] : [ang[0], ang[1]];
      if (w > g['w' + h]) { g['w' + h] = w; if (mode) g['m' + h] = mode; }
    };
    for (const a of this.acts) {
      const k = a[0];
      if (k === 'sit') sit = Math.max(sit, wgt(t, a[1], a[2], 0.7));
      else if (k === 'crouch') crouch = Math.max(crouch, wgt(t, a[1], a[2], 0.5));
      else if (k === 'say') say = Math.max(say, wgt(t, a[1], a[2], 0.12));
      else if (k === 'do') {
        const w = wgt(t, a[2], a[3], a[4]?.ramp ?? 0.35); if (w <= 0.001) continue;
        const name = a[1], o = a[4] || {};
        if (name === 'speak' || name === 'speakR' || name === 'talk') { // hold a gesture per beat, ease to the next one
          const fixed = o.angry ? POSES.angry : o.pose ? POSES[o.pose] : null, beat = o.period || 2.6, u = (t - a[2]) / beat + hash1(seed) * 0.5, i = Math.floor(u);
          const pick = (j) => fixed || POSES[AUTO_GESTURES[(Math.floor(hash1(j * 3.1 + seed) * 97) + j) % AUTO_GESTURES.length]];
          const A = pick(i - 1), B = pick(i), b = easeIO(((u - i) * beat) / 0.35);
          for (const h of ['R', 'L']) { if (name !== 'speak' && h === 'L') continue; add(h, mixArm(A[h], B[h], b), b > 0.5 ? B[h][2] : A[h][2], w); }
          continue;
        }
        const pose = POSES[name];
        if (pose) { for (const h of ['R', 'L']) add(h, pose[h], pose[h][2], w); continue; }
        const gf = GESTURES[name]; if (!gf) throw new Error('unknown gesture ' + name);
        const r = gf(t - a[2], o);
        for (const h of ['R', 'L']) {
          const sgn = h === 'R' ? 1 : -1; let tg = r[h] || null; if (!tg && r[h + 'a']) tg = [r[h + 'a'][0] - sgn * swx, r[h + 'a'][1]];
          if (tg) add(h, ikAngles(tg, sgn, swx, sy), r['m' + h], w);
        }
        if (r.holdR !== undefined && name === 'eat') eatHold = w > 0.3 ? r.holdR : eatHold;
        if (r.shake) P.shake += r.shake * w; if (r.lean) P.lean += r.lean * w * 0.6; if (r.headRoll) P.headRoll += r.headRoll * w; if (r.headPitch) P.headPitch += r.headPitch * w; if (r.mouth) mouth = Math.max(mouth, r.mouth * w);
      } else if (k === 'hold') { if (t >= a[2] - 0.001 && t <= a[3]) hold[a[4] || 'R'] = a[1]; }
      else if (k === 'look') { const w = wgt(t, a[1], a[2], 0.3); if (w > 0) { look = a[3]; lw = Math.max(lw, w); } }
      else if (k === 'emote') { const w = wgt(t, a[1], a[2], 0.4), o = a[3]; for (const key in o) P[key] = lerp(P[key], o[key], w); }
      else if (k === 'lean') P.lean += a[3] * wgt(t, a[1], a[2], 0.5);
      else if (k === 'fx') { const w = wgt(t, a[1], a[2], 0.4); if (w > 0.001) P.fx = { kind: a[3], w }; }
    }
    if (eatHold) hold.R = eatHold;
    P.sit = sit; P.crouch = crouch; P.hold = hold;
    // rest arms: idle, swinging against the legs while walking, folded in the lap when sitting
    const s = Math.sin(P.walk), I = POSES.idle, SIT = POSES.sit;
    const walkR = [5 + s * 18, 10 + Math.max(0, s) * 16], walkL = [5 + s * 18, 6 - Math.max(0, -s) * 22];
    const rest = { R: mixArm(mixArm(I.R, walkR, amp), SIT.R, sit), L: mixArm(mixArm(I.L, walkL, amp), SIT.L, sit) };
    P.arms = {};
    for (const h of ['R', 'L']) {
      const w = g[h] ? g['w' + h] : 0, gx = g[h] || rest[h];
      let a1 = lerp(rest[h][0], gx[0], w), a2 = lerp(rest[h][1], gx[1], w);
      if (h === 'R' && say > 0 && w > 0.5) { a1 += Math.sin(st * 2.3) * 4 * say; a2 += Math.sin(st * 4.4) * 8 * say; } // the talking hand sways a little
      P.arms[h] = [a1, a2]; P.handMode[h] = w > 0.5 && g['m' + h] ? g['m' + h] : 'relaxed';
    }
    // face: phrase-shaped lip flap, gentle head motion (a little more while talking)
    if (say > 0) {
      const v = noise1(t * 7.2, seed * 7) * 0.75 + noise1(t * 16.5, 5) * 0.25, phrase = noise1(t * 1.4, seed + 3) > 0.22 ? 1 : 0.1;
      P.mouth = Math.max(mouth, say * clamp((v - 0.22) * 1.7, 0, 1) * phrase);
      P.browRaise += say * 0.18 * Math.max(0, Math.sin(st * 2.6));
    } else P.mouth = mouth;
    const D = Math.PI / 180;
    P.headRoll += ((Math.sin(st * 2.9) * 2.2 + Math.sin(st * 1.1) * 1.2) * say + Math.sin(st * 0.7) * 1.4 * (1 - say)) * D;
    P.headPitch += say * -0.06 * Math.abs(Math.sin(st * 5.2));
    // gaze
    let tx = null, ty = -240;
    if (look && world) { if (look === 'camera') tx = null; else if (typeof look === 'string') { const o = world.posOf(look, t); if (o) { tx = o.x; ty = o.y - (o.h || 240); } } else { tx = look.x; ty = look.y ?? ty; } }
    if (tx !== null) { const dx = tx - m.x, dy = ty - (m.y - 300); const yaw = clamp(dx / 280, -1, 1) * P.facing; P.headYaw = lerp(0, yaw, lw); P.eyeX = lerp(0, clamp(dx / 200, -1, 1) * P.facing, lw); P.eyeY = lerp(0, clamp(dy / 200, -1, 1), lw); }
    return P;
  }
}

const mixArm = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
/** shoulder-relative hand target -> [upper-arm angle, elbow bend] (degrees, outward positive) via the smooth-pole IK */
function ikAngles(tg, side, swx, sy) {
  const sx = side * swx, r = solveArm2(sx, sy, sx + tg[0], sy + tg[1], side, LA1, LA2), R = 180 / Math.PI;
  const t1 = Math.atan2(r.ex - sx, r.ey - sy) * R, t2 = Math.atan2(r.hx - r.ex, r.hy - r.ey) * R;
  let a2 = (t2 - t1) * side; a2 = ((a2 + 540) % 360) - 180;
  return [t1 * side, a2];
}
/** blinks at irregular intervals (period ~3.2-4.8 s, jittered per blink) */
function blink3(t, seed) {
  const period = 3.2 + (seed % 13) * 0.12, k = Math.floor((t + (seed % 7)) / period), at = k * period - (seed % 7) + 0.4 + hash1(k + seed * 17) * 1.6, d = t - at;
  return d >= 0 && d < 0.16 ? Math.sin((d / 0.16) * Math.PI) : 0;
}
