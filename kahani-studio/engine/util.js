// util.js — deterministic helpers shared by the engine (no Math.random anywhere).
(function () {
  const KT = (window.KT = window.KT || {});

  KT.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  KT.lerp = (a, b, t) => a + (b - a) * t;
  KT.smooth = t => { t = KT.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  KT.easeInOut = t => { t = KT.clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  KT.deg = d => (d * Math.PI) / 180;

  // integer hash -> [0,1)
  KT.hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; };
  KT.strHash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // seeded RNG (mulberry32)
  KT.rng = (seed) => { let a = (typeof seed === 'string' ? KT.strHash(seed) : seed) >>> 0; const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; r.range = (lo, hi) => lo + (hi - lo) * r(); r.pick = arr => arr[Math.floor(r() * arr.length)]; return r; };
  // smooth 1D value noise
  KT.noise1 = (x, seed = 0) => { const i = Math.floor(x), f = x - i; const a = KT.hash(i * 7919 + seed * 131), b = KT.hash((i + 1) * 7919 + seed * 131); const u = f * f * (3 - 2 * f); return a + (b - a) * u; };

  // ---- colour ----
  const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(KT.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  KT.hex2rgb = hex2rgb;
  KT.mix = (c1, c2, t) => { const a = hex2rgb(c1), b = hex2rgb(c2); return rgb2hex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); };
  // shade(c, -0.2) darker (towards a warm dark), shade(c, 0.2) lighter
  KT.shade = (c, amt) => amt < 0 ? KT.mix(c, '#1a0f14', -amt) : KT.mix(c, '#fff8ec', amt);
  KT.rgba = (c, a) => { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; };

  // ---- paths ----
  // closed Catmull-Rom spline through points [[x,y],...]
  KT.smoothClosed = (ctx, pts, tension = 0.5) => {
    const n = pts.length; ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const k = tension / 3;
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
    ctx.closePath();
  };
  // open Catmull-Rom spline
  KT.smoothOpen = (ctx, pts, tension = 0.5, move = true) => {
    const n = pts.length; if (move) ctx.moveTo(pts[0][0], pts[0][1]); else ctx.lineTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      const k = tension / 3;
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
  };
  KT.roundRect = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

  KT.makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
})();
