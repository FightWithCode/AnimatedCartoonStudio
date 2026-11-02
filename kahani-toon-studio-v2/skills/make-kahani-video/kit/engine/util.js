// Small math / animation helpers. Everything here is a pure function of its inputs,
// so any animation built on top of it can be sampled at an arbitrary time (seek-safe).

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const ramp = (a, b, x) => clamp((x - a) / (b - a));
export const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
/** 0 → 1 → 0 pulse between a and b (smooth). */
export const bump = (a, b, x) => Math.sin(Math.PI * ramp(a, b, x));
export const frac = (x) => x - Math.floor(x);

export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Monotone cubic keyframe track (Fritsch–Butland). No overshoot, flat tangents at holds,
 * so equal consecutive keys give a perfectly still hold.
 * keys: [[time, value | [v0, v1, ...]], ...] sorted by time.
 * Returns f(t) -> number | number[] (clamped outside the key range).
 */
export function track(keys) {
  const n = keys.length;
  const isVec = Array.isArray(keys[0][1]);
  const d = isVec ? keys[0][1].length : 1;
  const T = keys.map((k) => k[0]);
  const V = keys.map((k) => (isVec ? k[1] : [k[1]]));
  const delta = [];
  for (let i = 0; i < n - 1; i++) {
    const h = T[i + 1] - T[i];
    delta.push(V[i].map((v, c) => (V[i + 1][c] - v) / h));
  }
  const M = V.map((_, i) =>
    new Array(d).fill(0).map((__, c) => {
      if (i === 0 || i === n - 1) return 0;
      const d0 = delta[i - 1][c];
      const d1 = delta[i][c];
      if (d0 * d1 <= 0) return 0;
      const h0 = T[i] - T[i - 1];
      const h1 = T[i + 1] - T[i];
      return (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
    })
  );
  return function (t) {
    let i = 0;
    if (t <= T[0]) i = -1;
    else if (t >= T[n - 1]) i = n - 1;
    else {
      // small arrays: linear scan is fine
      while (i < n - 2 && t > T[i + 1]) i++;
    }
    let out;
    if (i === -1) out = V[0].slice();
    else if (i === n - 1) out = V[n - 1].slice();
    else {
      const h = T[i + 1] - T[i];
      const u = (t - T[i]) / h;
      const u2 = u * u;
      const u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1;
      const h10 = u3 - 2 * u2 + u;
      const h01 = -2 * u3 + 3 * u2;
      const h11 = u3 - u2;
      out = V[i].map((p0, c) => h00 * p0 + h10 * h * M[i][c] + h01 * V[i + 1][c] + h11 * h * M[i + 1][c]);
    }
    return isVec ? out : out[0];
  };
}

/** Wrap an angle difference to [-PI, PI]. */
export const angDiff = (a, b) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/** deterministic hash of a number -> [0, 1) */
export const hash1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** smooth 1D value noise in [0, 1) */
export const noise1 = (x, seed = 0) => { const i = Math.floor(x), f = x - i, a = hash1(i * 7919 + seed * 131), b = hash1((i + 1) * 7919 + seed * 131), u = f * f * (3 - 2 * f); return a + (b - a) * u; };
/** cubic ease in/out */
export const easeIO = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
