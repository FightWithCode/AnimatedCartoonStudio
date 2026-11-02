// Named gestures: (lt = seconds since gesture start, o = options) -> hand targets.
//   R / L   = relative to that arm's shoulder (+x = the way the character faces, +y = down)
//   Ra / La = absolute in the torso frame (x from the body centre-line, y from the shoulder line) – use for plates, mouth, chest
//   mR / mL = hand shape: relaxed | open | point | fist | pinch | under     holdR = item drawn in the right hand
const S = Math.sin, C = Math.cos;
const E = (x) => x * x * (3 - 2 * x), cl = (x) => Math.min(1, Math.max(0, x));
const seg = (u, a, b) => E(cl((u - a) / (b - a))), mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const PLATE = [60, 114], PLATE_R = [44, 108], MOUTH = [20, -10], REST = [28, 46];
export const GESTURES = {
  rest: () => ({}),
  talk: (t) => ({ R: [76 + S(t * 2.4) * 10, 78 + S(t * 3.3) * 14], mR: 'open', lean: 0.01 }),
  explain: (t) => ({ R: [100 + S(t * 3.1) * 14, 52 + S(t * 4.3) * 16], mR: 'open', lean: 0.03 }),
  explain2: (t) => ({ R: [96 + S(t * 3.1) * 12, 56 + S(t * 4) * 14], L: [40 + S(t * 3.3 + 1) * 10, 74 + S(t * 3.7) * 12], mR: 'open', mL: 'open', lean: 0.02 }),
  open: (t) => ({ R: [110, 62 + S(t * 2) * 6], L: [70, 76 + S(t * 2.2) * 6], mR: 'open', mL: 'open' }),
  point: (t, o) => ({ R: [165, -6 + (o.up || 0)], mR: 'point', lean: 0.05 }),
  pointDown: () => ({ R: [60, 160], mR: 'point' }),
  stir: (t, o) => ({ R: [96 + C(t * 5) * 20, (o.dy ?? 40) + S(t * 5) * 9], L: [40, 140], mR: 'fist', lean: 0.05 }),
  hold: (t, o) => (o.only === 'L' ? { La: PLATE, mL: 'under' } : { La: PLATE, Ra: PLATE_R, mL: 'under', mR: 'under' }),
  offer: () => ({ Ra: [150, 58], La: [132, 62], mR: 'under', mL: 'under', lean: 0.06 }),
  // eating: dip -> pinch a morsel -> lift to mouth -> bite -> chew -> back to rest. The plate stays in the left hand.
  eat: (t, o) => {
    const T = o.period || 3.4, u = (((t / T) % 1) + 1) % 1; let R, m = 'open', hold = null, mouth = 0, pitch = 0;
    if (u < 0.2) { R = mix(REST, PLATE, seg(u, 0, 0.2)); pitch = 0.22 * seg(u, 0, 0.2); }
    else if (u < 0.34) { R = [PLATE[0] - 2, PLATE[1] + 2 * S(u * 40)]; m = u > 0.27 ? 'pinch' : 'open'; hold = u > 0.3 ? 'morsel' : null; pitch = 0.26; }
    else if (u < 0.6) { const k = seg(u, 0.34, 0.6); R = mix(PLATE, MOUTH, k); m = 'pinch'; hold = 'morsel'; pitch = 0.26 * (1 - k); }
    else if (u < 0.68) { R = MOUTH; m = 'pinch'; hold = u < 0.655 ? 'morsel' : null; mouth = 0.6 * seg(u, 0.6, 0.65); }
    else if (u < 0.9) { R = mix(MOUTH, REST, seg(u, 0.68, 0.9)); mouth = 0.12 + 0.14 * Math.abs(S(t * 13)); }
    else { R = REST; mouth = 0.1 * (1 - seg(u, 0.9, 1)) * Math.abs(S(t * 13)); }
    return { Ra: R, mR: m, holdR: hold, La: o.holdL === false ? null : PLATE, mL: 'under', mouth, headPitch: pitch, lean: 0.02 };
  },
  wave: (t) => ({ R: [40 + S(t * 7) * 18, -118 + S(t * 3) * 8], mR: 'open' }),
  hips: () => ({ R: [48, 116], L: [48, 116], mR: 'fist', mL: 'fist' }),
  namaste: () => ({ Ra: [22, 30], La: [18, 32], mR: 'open', mL: 'open' }),
  shrug: (t) => ({ R: [62, 64 + S(t * 6) * 3], L: [48, 66], mR: 'open', mL: 'open', lean: -0.03 }),
  think: () => ({ R: [26, -22], L: [22, 100], headRoll: 0.1 }),
  count: (t) => ({ R: [100, 70 + S(t * 6) * 22], L: [60, 108], mR: 'point' }),
  give: (t, o) => ({ R: [130, 90 + (o.dy || 0)], L: null, mR: 'under' }),
  scratch: (t) => ({ R: [30 + S(t * 9) * 5, -52], headRoll: -0.08 }),
  arms: () => ({ R: [40, 70], L: [-6, 66], mR: 'fist', mL: 'fist' }),
  carryHandle: (t) => ({ R: [100, 108 + S(t * 4) * 1.5], L: [92, 108], mR: 'fist', mL: 'fist' }),
};

// ---------------------------------------------------------------------------------------------------------------
// Rig-2 gestures (used by episodes with meta.rig >= 2). Speech is built from "beats": every ~1.4 s a hand travels along a
// gentle arc to a new emphasis pose, then settles. Poses are picked deterministically (hash of beat number + seed), so a
// frame is still a pure function of time. Hands: R/L = shoulder-relative targets (+x forward, +y down).
const hash = (n, s) => { const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
const NEU = [80, 100], LOW = [52, 124];
const FWR = [[88, 84], [112, 52], [100, 26], [72, 104], [126, 72], [82, 58], [106, 96], [94, 40]];
const FWL = [[60, 100], [84, 64], [72, 88], [98, 56], [56, 116], [78, 78]];
const pick = (T, k, s) => T[Math.floor(hash(k, s) * T.length) % T.length];
const toward = (p, en) => [NEU[0] + (p[0] - NEU[0]) * en, NEU[1] + (p[1] - NEU[1]) * en];
function beatHand(u, T, seed, en, active, amp) {
  const i = Math.floor(u), f = u - i, cur = (k) => (active(k) ? toward(pick(T, k, seed), en) : LOW), a = cur(i - 1), b = cur(i);
  const k = seg(f, 0, 0.42), arc = S(Math.PI * k) * -amp, over = 1 + 0.07 * S(Math.PI * seg(f, 0.2, 0.55)); // small overshoot, then settle
  return [a[0] + (b[0] - a[0]) * k * over + S(u * 2.9 + seed) * 2.4, a[1] + (b[1] - a[1]) * k + arc + C(u * 2.3 + seed) * 2.6, k]; // slow drift is a function of absolute phase, so it is continuous across beats
}
GESTURES.speak = (t, o = {}) => {
  const seed = o.seed || 0, en = o.energy ?? 0.75, period = o.period || 1.6, u = t / period + hash(0, seed) * 3;
  const R = beatHand(u, FWR, seed, en, () => true, 15), L = beatHand(u + 0.5, FWL, seed + 5, en, (k) => hash(k, seed + 9) < 0.42, 10);
  const stroke = S(Math.PI * Math.min(1, (u - Math.floor(u)) / 0.45));
  return { R: [R[0], R[1]], L: o.only === 'R' ? null : [L[0], L[1]], mR: o.angry ? 'fist' : 'open', mL: o.angry ? 'fist' : 'open', lean: 0.012 + 0.02 * en * stroke, headRoll: 0.025 * S(u * 2.1 + seed), headPitch: 0.07 * en * stroke };
};
GESTURES.speakR = (t, o = {}) => GESTURES.speak(t, Object.assign({ only: 'R' }, o));
GESTURES.fear = (t) => ({ Ra: [50 + S(t * 31) * 1.6, -4 + C(t * 27) * 1.4], La: [42 + S(t * 29) * 1.6, 0 + C(t * 33) * 1.4], mR: 'open', mL: 'open', lean: -0.05, shake: 1, headPitch: 0.1 });
GESTURES.shock = (t) => ({ R: [84 + S(t * 3) * 2, -2], L: [70 + S(t * 3 + 1) * 2, 4], mR: 'open', mL: 'open', lean: -0.05, headPitch: -0.12 });
GESTURES.sad = (t) => ({ R: [16, 150 + S(t * 1.2) * 2], L: [2, 148], lean: 0.035, headPitch: 0.55, headRoll: 0.05 });
GESTURES.worry = (t) => ({ Ra: [30, 66 + S(t * 4) * 2], La: [26, 70 + C(t * 3.7) * 2], mR: 'fist', mL: 'fist', headPitch: 0.3, lean: 0.03 });
GESTURES.clasp = () => ({ Ra: [26, 86], La: [22, 86], mR: 'fist', mL: 'fist' });
GESTURES.rub = (t) => ({ Ra: [46 + S(t * 9) * 5, 72 + C(t * 9) * 4], La: [40 + S(t * 9 + 1) * 5, 74 + C(t * 9 + 2) * 4], mR: 'open', mL: 'open', lean: 0.04 });
GESTURES.chant = (t) => ({ R: [100, -44 + S(t * 2) * 10], L: [100, -44 + S(t * 2 + 1.2) * 10], mR: 'open', mL: 'open', lean: -0.02 + S(t * 1.6) * 0.02, headPitch: -0.1 });
GESTURES.knock = (t) => ({ R: [118, 34 - Math.abs(S(t * 8)) * 18], mR: 'fist', lean: 0.03 });
GESTURES.wipe = (t) => ({ R: [34 + S(t * 6) * 18, -56], mR: 'open', headPitch: 0.2, lean: 0.03 });
GESTURES.cheer = (t) => ({ R: [58 + S(t * 6) * 4, -84 + S(t * 5) * 6], L: [54 + S(t * 6 + 1) * 4, -88 + S(t * 5 + 1) * 6], mR: 'open', mL: 'open', lean: -0.03 });
GESTURES.shush = () => ({ Ra: [26, -6], mR: 'point', lean: 0.02 });
GESTURES.beckon = (t) => ({ R: [112, 30 + S(t * 7) * 10], mR: 'open', lean: 0.03 });
GESTURES.carryBag = (t) => ({ R: [34, 120 + S(t * 4) * 1.5], mR: 'fist' });
GESTURES.carryPot = (t) => ({ Ra: [74, 108 + S(t * 4) * 1.5], La: [70, 106], mR: 'under', mL: 'under', lean: 0.04 });
GESTURES.torch = (t) => ({ R: [82, 28 + S(t * 3) * 2], mR: 'fist', lean: 0.01 });
GESTURES.eatFast = (t, o) => GESTURES.eat(t, Object.assign({ period: 2.4 }, o));

// ---------------------------------------------------------------------------------------------------------------
// Rig-3 arm POSES (the "kahani" movement): a pose is two arm angles in degrees, "outward positive":
//   [upper arm from straight down, elbow bend added to it, hand shape]   R = front arm (the side the character faces), L = back arm.
// A character holds a pose and eases into the next one over 0.35 s; while speaking the front arm sways a few degrees.
// Gestures that have no pose here (eat, stir, hold, carryPot, fear …) still work: their hand targets are solved once
// with IK and converted to angles, so they blend the same way.
export const POSES = {
  idle:     { R: [6, 5, 'relaxed'], L: [6, 4, 'relaxed'] },
  explain:  { R: [10, 108, 'open'], L: [6, 4, 'relaxed'] },
  explain2: { R: [8, 6, 'relaxed'], L: [10, 108, 'open'] },
  point:    { R: [72, 8, 'point'], L: [6, 4, 'relaxed'] },
  pointDown:{ R: [34, 6, 'point'], L: [6, 4, 'relaxed'] },
  open:     { R: [14, 96, 'open'], L: [12, 98, 'open'] },
  shrug:    { R: [8, 122, 'open'], L: [8, 122, 'open'] },
  chest:    { R: [-4, -122, 'open'], L: [6, 4, 'relaxed'] },
  hips:     { R: [36, -74, 'fist'], L: [36, -74, 'fist'] },
  namaste:  { R: [4, -144, 'open'], L: [4, -144, 'open'] },
  think:    { R: [-16, -150, 'fist'], L: [-8, -84, 'relaxed'] },
  worried:  { R: [-10, -76, 'fist'], L: [-10, -76, 'fist'] },
  folded:   { R: [-4, -100, 'fist'], L: [-4, -100, 'fist'] },
  wave:     { R: [150, 26, 'open'], L: [6, 4, 'relaxed'] },
  give:     { R: [20, 78, 'under'], L: [6, 4, 'relaxed'] },
  offer:    { R: [16, 84, 'under'], L: [14, 86, 'under'] },
  angry:    { R: [14, 34, 'fist'], L: [14, 30, 'fist'] },
  bless:    { R: [16, 142, 'open'], L: [6, 4, 'relaxed'] },
  cry:      { R: [-22, -150, 'open'], L: [-18, -142, 'open'] },
  sit:      { R: [-6, -60, 'relaxed'], L: [-4, -58, 'relaxed'] },
  scratch:  { R: [-14, -168, 'open'], L: [6, 4, 'relaxed'] },
};
/** poses a speaker cycles through (one per ~2.6 s beat), like the original studio's auto gestures */
export const AUTO_GESTURES = ['explain', 'idle', 'open', 'explain2', 'chest', 'explain', 'shrug', 'idle', 'point'];
