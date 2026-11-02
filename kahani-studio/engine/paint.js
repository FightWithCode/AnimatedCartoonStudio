// paint.js — painterly drawing helpers for the sets. All sizes are in "frame units": 1 = frame height.
(function () {
  const KT = window.KT;
  const { shade, mix, rgba, smoothClosed, smoothOpen } = KT;
  const P = (KT.paint = {});
  const LINE = '#3b2a20';

  // value-noise texture canvas, reused as a painterly grain overlay
  let NOISE = null;
  P.noiseCanvas = function () {
    if (NOISE) return NOISE;
    const n = 256, c = KT.makeCanvas(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), r = KT.rng(99);
    const grid = []; for (let i = 0; i < 17 * 17; i++) grid.push(r());
    for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
      const gx = xx / 16, gy = y / 16, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
      const g = (a, b) => grid[(b % 17) * 17 + (a % 17)];
      const v1 = g(ix, iy) + (g(ix + 1, iy) - g(ix, iy)) * fx, v2 = g(ix, iy + 1) + (g(ix + 1, iy + 1) - g(ix, iy + 1)) * fx;
      const v = (v1 + (v2 - v1) * fy) * 0.6 + r() * 0.4;
      const o = (y * n + xx) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = v * 255; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0); NOISE = c; return c;
  };
  // painterly grain over a region (call with the frame-unit transform active)
  P.grain = function (ctx, x, y, w, h, alpha = 0.08, scale = 0.25) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(P.noiseCanvas(), 'repeat'); const m = new DOMMatrix(); pat.setTransform(m.scaleSelf(scale / 256, scale / 256));
    ctx.fillStyle = pat; ctx.fillRect(x, y, w, h); ctx.restore();
  };
  // soft brush dabs: gives flat fills a hand-painted variation
  P.dabs = function (ctx, x, y, w, h, color, n, seed, size = 0.02, alpha = 0.12) {
    const r = KT.rng(seed); ctx.save(); ctx.fillStyle = color;
    for (let i = 0; i < n; i++) { ctx.globalAlpha = alpha * (0.4 + r() * 0.6); ctx.beginPath(); ctx.ellipse(x + r() * w, y + r() * h, size * (0.5 + r()), size * (0.25 + r() * 0.4), r() * 3, 0, 7); ctx.fill(); }
    ctx.restore();
  };
  P.line = function (ctx, w = 0.0018, color = LINE) { ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
  P.fillLine = function (ctx, color, w = 0.0016) { ctx.fillStyle = color; ctx.fill(); P.line(ctx, w); };

  // ---------------------------------------------------------------- sky & atmosphere
  P.sky = function (ctx0, x0, x1, top, bottom, time, seed) {
    const ctx = P._skyCtx || ctx0;   // sets paint the sky on its own layer so night grading leaves it alone
    let g = ctx.createLinearGradient(0, top, 0, bottom);
    if (time === 'night') { g.addColorStop(0, '#0b1430'); g.addColorStop(0.6, '#1a2a55'); g.addColorStop(1, '#2c3f6e'); }
    else if (time === 'evening') { g.addColorStop(0, '#3e4f8c'); g.addColorStop(0.45, '#c9769a'); g.addColorStop(0.8, '#f2a868'); g.addColorStop(1, '#fbd38c'); }
    else { g.addColorStop(0, '#3f8fdc'); g.addColorStop(0.55, '#86c0ee'); g.addColorStop(1, '#d8ecf7'); }
    ctx.fillStyle = g; ctx.fillRect(x0, top, x1 - x0, bottom - top);
    const r = KT.rng(seed);
    if (time === 'night') {
      for (let i = 0; i < 260; i++) { const x = x0 + r() * (x1 - x0), y = top + r() * (bottom - top) * 0.85, s = r(); ctx.fillStyle = rgba('#ffffff', 0.35 + s * 0.6); ctx.beginPath(); ctx.arc(x, y, 0.0009 + s * s * 0.0022, 0, 7); ctx.fill(); }
      const mx = x0 + (x1 - x0) * (0.2 + r() * 0.6), my = top + (bottom - top) * 0.18;
      const gl = ctx.createRadialGradient(mx, my, 0, mx, my, 0.16); gl.addColorStop(0, 'rgba(220,230,255,0.35)'); gl.addColorStop(1, 'rgba(220,230,255,0)'); ctx.fillStyle = gl; ctx.fillRect(mx - 0.2, my - 0.2, 0.4, 0.4);
      ctx.fillStyle = '#f4f1dc'; ctx.beginPath(); ctx.arc(mx, my, 0.032, 0, 7); ctx.fill();
      ctx.fillStyle = '#1d2c58'; ctx.beginPath(); ctx.arc(mx + 0.014, my - 0.008, 0.029, 0, 7); ctx.fill();
    } else {
      const n = 5 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) P.cloud(ctx, x0 + r() * (x1 - x0), top + 0.05 + r() * (bottom - top) * 0.45, 0.12 + r() * 0.16, time, r);
    }
  };
  P.cloud = function (ctx, x, y, w, time, r) {
    const base = time === 'evening' ? '#f6c9a8' : '#ffffff', sh = time === 'evening' ? '#c9849a' : '#c9d9ee';
    const puffs = []; const n = 6 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) { const t = i / (n - 1); puffs.push([x + (t - 0.5) * w, y - Math.sin(t * Math.PI) * w * (0.18 + r() * 0.12), w * (0.12 + r() * 0.1)]); }
    ctx.fillStyle = sh; for (const [px, py, pr] of puffs) { ctx.beginPath(); ctx.arc(px, py + pr * 0.25, pr, 0, 7); ctx.fill(); }
    ctx.fillStyle = base; for (const [px, py, pr] of puffs) { ctx.beginPath(); ctx.arc(px - pr * 0.1, py, pr * 0.9, 0, 7); ctx.fill(); }
    ctx.fillStyle = sh; ctx.fillRect(x - w * 0.62, y + w * 0.04, w * 1.24, w * 0.05);
  };
  // band of distant trees (silhouette with blob tops)
  P.treeLine = function (ctx, x0, x1, y, h, color, seed) {
    const r = KT.rng(seed); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x0, y + 0.02);
    for (let x = x0; x <= x1 + 0.02; x += 0.012 + r() * 0.02) ctx.lineTo(x, y - h * (0.3 + r() * 0.7) * (0.6 + 0.4 * Math.sin(x * 9 + seed)));
    ctx.lineTo(x1, y + 0.02); ctx.closePath(); ctx.fill();
    for (let i = 0; i < (x1 - x0) * 40; i++) { const x = x0 + r() * (x1 - x0), rr = h * (0.25 + r() * 0.4); ctx.beginPath(); ctx.arc(x, y - h * 0.35 - r() * h * 0.4, rr, 0, 7); ctx.fill(); }
    ctx.fillStyle = shade(color, 0.12); for (let i = 0; i < (x1 - x0) * 30; i++) { const x = x0 + r() * (x1 - x0); ctx.beginPath(); ctx.arc(x, y - h * 0.55 - r() * h * 0.3, h * (0.12 + r() * 0.15), 0, 7); ctx.fill(); }
  };

  // ---------------------------------------------------------------- vegetation
  // leafy canopy: dark base blobs, mid tone, lit tops (light from the upper right)
  P.foliage = function (ctx, cx, cy, rx, ry, seed, cols = ['#2f5a2a', '#4f8a3a', '#86b84c'], density = 1) {
    const r = KT.rng(seed);
    const n = Math.round(26 * density * (rx + ry) / 0.25 + 10);
    const layer = (col, k, off, sz) => { ctx.fillStyle = col; for (let i = 0; i < n * k; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); const x = cx + Math.cos(a) * rx * d * 0.92 + off[0] * rx, y = cy + Math.sin(a) * ry * d * 0.92 + off[1] * ry; const s = (rx + ry) * sz * (0.6 + r() * 0.6); ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.82, r() * 3, 0, 7); ctx.fill(); } };
    layer(cols[0], 1, [0, 0.06], 0.2);
    layer(cols[1], 0.85, [0.08, -0.08], 0.15);
    layer(cols[2], 0.45, [0.22, -0.28], 0.1);
    // leaf flecks
    ctx.fillStyle = shade(cols[2], 0.25); for (let i = 0; i < n * 0.6; i++) { const a = -0.4 - r() * 1.8, d = 0.5 + r() * 0.5; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, (rx + ry) * 0.018, (rx + ry) * 0.01, r() * 3, 0, 7); ctx.fill(); }
  };
  P.tree = function (ctx, x, base, h, seed, cols) {
    const r = KT.rng(seed);
    ctx.fillStyle = '#5a3a26'; ctx.beginPath(); ctx.moveTo(x - h * 0.05, base); ctx.quadraticCurveTo(x - h * 0.02, base - h * 0.35, x - h * 0.015, base - h * 0.55); ctx.lineTo(x + h * 0.015, base - h * 0.55); ctx.quadraticCurveTo(x + h * 0.03, base - h * 0.35, x + h * 0.05, base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = h * 0.02; ctx.beginPath(); ctx.moveTo(x, base - h * 0.45); ctx.lineTo(x - h * 0.14, base - h * 0.7); ctx.moveTo(x, base - h * 0.5); ctx.lineTo(x + h * 0.16, base - h * 0.74); ctx.stroke();
    P.foliage(ctx, x, base - h * 0.72, h * 0.36, h * 0.3, seed + 1, cols);
  };
  P.palm = function (ctx, x, base, h, lean, seed) {
    const r = KT.rng(seed);
    const top = [x + lean * h, base - h];
    // trunk
    ctx.lineCap = 'round';
    const tw = h * 0.035;
    ctx.beginPath(); ctx.moveTo(x - tw, base); ctx.quadraticCurveTo(x + lean * h * 0.2 - tw * 0.6, base - h * 0.6, top[0] - tw * 0.5, top[1]); ctx.lineTo(top[0] + tw * 0.5, top[1]); ctx.quadraticCurveTo(x + lean * h * 0.2 + tw * 0.6, base - h * 0.6, x + tw, base); ctx.closePath();
    ctx.fillStyle = '#8a6a4a'; ctx.fill();
    ctx.strokeStyle = '#6a4e36'; ctx.lineWidth = h * 0.004;
    for (let t = 0.05; t < 0.95; t += 0.045) { const px = x + lean * h * 0.2 * 2 * t * (1 - t) + (top[0] - x) * t * t, py = base - h * t; ctx.beginPath(); ctx.moveTo(px - tw * (1 - t * 0.45), py); ctx.lineTo(px + tw * (1 - t * 0.45), py + h * 0.006); ctx.stroke(); }
    // fronds
    const nf = 10;
    for (let i = 0; i < nf; i++) {
      const a = -Math.PI / 2 + (i / (nf - 1) - 0.5) * Math.PI * 1.7 + (r() - 0.5) * 0.25;
      const L = h * (0.32 + r() * 0.1), droop = 0.55 + r() * 0.3;
      const pts = []; for (let s = 0; s <= 10; s++) { const t = s / 10; pts.push([top[0] + Math.cos(a) * L * t, top[1] + Math.sin(a) * L * t + droop * L * t * t]); }
      const col = i % 3 === 0 ? '#3e6e2e' : i % 3 === 1 ? '#56913a' : '#6aa844';
      ctx.strokeStyle = col; ctx.lineWidth = h * 0.006; ctx.beginPath(); smoothOpen(ctx, pts); ctx.stroke();
      ctx.lineWidth = h * 0.0055;
      for (let s = 1; s < 10; s++) {
        const [px, py] = pts[s], [qx, qy] = pts[s + 1]; const dx = qx - px, dy = qy - py, len = Math.hypot(dx, dy) || 1; const nx = -dy / len, ny = dx / len; const ll = L * 0.16 * Math.sin((s / 10) * Math.PI) + L * 0.03;
        for (const sg of [1, -1]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * ll * sg + dx * 0.8, py + ny * ll * sg + dy * 0.8 + ll * 0.5); ctx.stroke(); }
      }
    }
    ctx.fillStyle = '#5a4a2a'; ctx.beginPath(); ctx.arc(top[0], top[1] + h * 0.01, h * 0.025, 0, 7); ctx.fill();
  };
  P.bush = function (ctx, x, base, w, seed, cols = ['#2f5a2a', '#4a8236', '#7cb246']) { P.foliage(ctx, x, base - w * 0.28, w * 0.5, w * 0.3, seed, cols, 0.7); };
  P.grass = function (ctx, x0, x1, y0, y1, n, seed, col = '#5d8c35') {
    const r = KT.rng(seed); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), s = 0.006 + (y - y0) / Math.max(0.01, y1 - y0) * 0.012;
      ctx.strokeStyle = r() < 0.5 ? col : shade(col, 0.2); ctx.lineWidth = s * 0.25;
      for (let b = 0; b < 4; b++) { ctx.beginPath(); ctx.moveTo(x + b * s * 0.2, y); ctx.quadraticCurveTo(x + b * s * 0.2 + (b - 1.5) * s * 0.4, y - s * 1.2, x + (b - 1.5) * s * 0.8, y - s * (1.6 + r())); ctx.stroke(); }
    }
  };
  // crops: rows of green or golden plants receding
  P.field = function (ctx, x0, x1, y0, y1, seed, kind = 'green') {
    const base = kind === 'gold' ? '#c9a640' : '#5f9a3a', dark = shade(base, -0.25), lite = shade(base, 0.25);
    ctx.fillStyle = base; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    const r = KT.rng(seed);
    for (let y = y0; y < y1; y += 0.004 + (y - y0) * 0.06) {
      const t = (y - y0) / (y1 - y0);
      ctx.strokeStyle = r() < 0.5 ? dark : lite; ctx.lineWidth = 0.001 + t * 0.004; ctx.beginPath(); ctx.moveTo(x0, y); for (let x = x0; x < x1; x += 0.01 + t * 0.02) ctx.lineTo(x, y - (0.002 + t * 0.012) * (0.5 + r())); ctx.stroke();
    }
  };

  // ---------------------------------------------------------------- built things
  // roof styles: 'tile' (terracotta khaprail), 'thatch' (straw), 'tin'
  P.hut = function (ctx, x, base, w, h, o = {}) {
    const r = KT.rng(o.seed || 1);
    const wall = o.wall || '#cf9f6c', roofH = h * (o.roofH || 0.55), wallH = h - roofH * 0.55;
    const L = o.lights;
    // wall
    ctx.beginPath(); ctx.rect(x - w / 2, base - wallH, w, wallH); P.fillLine(ctx, wall);
    ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2, base - wallH, w, wallH); ctx.clip();
    P.dabs(ctx, x - w / 2, base - wallH, w, wallH, shade(wall, -0.2), 30, (o.seed || 1) + 3, w * 0.06, 0.18);
    P.dabs(ctx, x - w / 2, base - wallH, w, wallH, shade(wall, 0.2), 16, (o.seed || 1) + 4, w * 0.05, 0.14);
    ctx.fillStyle = shade(wall, -0.25); ctx.fillRect(x - w / 2, base - wallH * 0.14, w, wallH * 0.14);
    // shadow under the eaves
    const gsh = ctx.createLinearGradient(0, base - wallH, 0, base - wallH * 0.55); gsh.addColorStop(0, 'rgba(60,30,20,0.45)'); gsh.addColorStop(1, 'rgba(60,30,20,0)'); ctx.fillStyle = gsh; ctx.fillRect(x - w / 2, base - wallH, w, wallH * 0.5);
    // cracks
    ctx.strokeStyle = shade(wall, -0.35); ctx.lineWidth = 0.0012; for (let i = 0; i < 3; i++) { const cx = x - w / 2 + r() * w, cy = base - wallH * (0.2 + r() * 0.6); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 0.008, cy + 0.012); ctx.lineTo(cx + 0.004, cy + 0.024); ctx.stroke(); }
    ctx.restore();
    // door
    if (o.door !== false) {
      const dw = w * 0.2, dh = wallH * 0.68, dx = x + (o.doorX ?? -0.12) * w;
      ctx.beginPath(); ctx.rect(dx - dw / 2 - dw * 0.1, base - dh - dw * 0.1, dw * 1.2, dh + dw * 0.1); P.fillLine(ctx, '#7a5432');
      ctx.beginPath(); ctx.rect(dx - dw / 2, base - dh, dw, dh); P.fillLine(ctx, o.doorOpen ? '#2a1a12' : '#6b4527');
      if (!o.doorOpen) { ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = 0.0012; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(dx - dw / 2 + (dw / 4) * i, base - dh); ctx.lineTo(dx - dw / 2 + (dw / 4) * i, base); ctx.stroke(); } }
      if (o.doorOpen && L) L.push({ type: 'rect', x: dx - dw / 2, y: base - dh, w: dw, h: dh, a: 0.7 });
    }
    // window
    if (o.window !== false) {
      const ww = w * 0.16, wh = wallH * 0.3, wx = x + (o.winX ?? 0.22) * w, wy = base - wallH * 0.72;
      ctx.beginPath(); ctx.rect(wx - ww / 2 - 0.004, wy - 0.004, ww + 0.008, wh + 0.008); P.fillLine(ctx, '#7a5432');
      ctx.beginPath(); ctx.rect(wx - ww / 2, wy, ww, wh); P.fillLine(ctx, '#2a1d16');
      if (L) L.push({ type: 'rect', x: wx - ww / 2, y: wy, w: ww, h: wh, a: 1 });
      ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 0.002; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(wx - ww / 2 + (ww / 4) * i, wy); ctx.lineTo(wx - ww / 2 + (ww / 4) * i, wy + wh); ctx.stroke(); }
    }
    // roof
    const ov = w * 0.1, ry = base - wallH;
    if (o.roof === 'thatch') {
      const path = () => { ctx.moveTo(x - w / 2 - ov, ry + roofH * 0.08); ctx.quadraticCurveTo(x - w * 0.3, ry - roofH * 1.05, x, ry - roofH * 1.0); ctx.quadraticCurveTo(x + w * 0.3, ry - roofH * 1.05, x + w / 2 + ov, ry + roofH * 0.08); ctx.quadraticCurveTo(x, ry + roofH * 0.2, x - w / 2 - ov, ry + roofH * 0.08); ctx.closePath(); };
      ctx.beginPath(); path(); P.fillLine(ctx, '#c49a52');
      ctx.save(); ctx.beginPath(); path(); ctx.clip();
      ctx.lineWidth = 0.0016; for (let i = 0; i < 160; i++) { const sx = x - w / 2 - ov + r() * (w + ov * 2), sy = ry - roofH * r(); ctx.strokeStyle = r() < 0.5 ? '#9a7432' : '#e0bf78'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (sx - x) * 0.05, sy + 0.03); ctx.stroke(); }
      const gr = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, 'rgba(70,40,10,0.35)'); gr.addColorStop(0.6, 'rgba(70,40,10,0)'); ctx.fillStyle = gr; ctx.fillRect(x - w, ry - roofH * 1.2, w * 2, roofH * 1.5);
      ctx.restore();
    } else {
      const col = o.roof === 'tin' ? '#8d969c' : '#b8573a';
      const path = () => { ctx.moveTo(x - w / 2 - ov, ry + roofH * 0.1); ctx.lineTo(x - w * 0.36, ry - roofH * 0.9); ctx.lineTo(x + w * 0.36, ry - roofH * 0.9); ctx.lineTo(x + w / 2 + ov, ry + roofH * 0.1); ctx.closePath(); };
      ctx.beginPath(); path(); P.fillLine(ctx, col);
      ctx.save(); ctx.beginPath(); path(); ctx.clip();
      if (o.roof === 'tin') { ctx.strokeStyle = shade(col, -0.25); ctx.lineWidth = 0.0015; for (let sx = x - w; sx < x + w; sx += 0.008) { ctx.beginPath(); ctx.moveTo(sx, ry - roofH); ctx.lineTo(sx + (sx - x) * 0.25, ry + roofH * 0.1); ctx.stroke(); } }
      else {
        const rows = 7; for (let k = 0; k < rows; k++) { const yy = ry - roofH * 0.9 + (k + 1) * roofH / rows; ctx.fillStyle = shade(col, k % 2 ? -0.12 : 0.04); ctx.fillRect(x - w, yy - roofH / rows, w * 2, roofH / rows); ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = 0.0013; ctx.beginPath(); for (let sx = x - w; sx < x + w; sx += 0.012) { ctx.moveTo(sx, yy); ctx.quadraticCurveTo(sx + 0.006, yy - roofH / rows * 1.1, sx + 0.012, yy); } ctx.stroke(); }
        P.dabs(ctx, x - w / 2 - ov, ry - roofH, w + ov * 2, roofH * 1.1, '#5a3a2a', 24, (o.seed || 1) + 9, 0.012, 0.25);
      }
      const gr = ctx.createLinearGradient(0, ry - roofH, 0, ry + roofH * 0.1); gr.addColorStop(0, 'rgba(255,240,220,0.18)'); gr.addColorStop(1, 'rgba(60,20,10,0.25)'); ctx.fillStyle = gr; ctx.fillRect(x - w, ry - roofH, w * 2, roofH * 1.2);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(x - w * 0.36, ry - roofH * 0.9); ctx.lineTo(x + w * 0.36, ry - roofH * 0.9); P.line(ctx, 0.004, shade(col, -0.4));
    }
  };
  P.pole = function (ctx, x, base, h) {
    ctx.fillStyle = '#9a9488'; ctx.beginPath(); ctx.moveTo(x - h * 0.012, base); ctx.lineTo(x - h * 0.007, base - h); ctx.lineTo(x + h * 0.007, base - h); ctx.lineTo(x + h * 0.012, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a7468'; ctx.fillRect(x, base - h, h * 0.007, h);
    ctx.fillStyle = '#5a5248'; ctx.fillRect(x - h * 0.09, base - h * 0.94, h * 0.18, h * 0.014);
    ctx.fillStyle = '#e8e4da'; for (const dx of [-0.075, -0.03, 0.03, 0.075]) { ctx.beginPath(); ctx.arc(x + dx * h, base - h * 0.95, h * 0.006, 0, 7); ctx.fill(); }
    return [[x - h * 0.075, base - h * 0.95], [x - h * 0.03, base - h * 0.95], [x + h * 0.03, base - h * 0.95], [x + h * 0.075, base - h * 0.95]];
  };
  P.wires = function (ctx, polesTops, sag = 0.03) {
    ctx.strokeStyle = 'rgba(40,36,40,0.75)'; ctx.lineWidth = 0.0012;
    for (let i = 0; i < polesTops.length - 1; i++) {
      const A = polesTops[i], B = polesTops[i + 1];
      for (let k = 0; k < Math.min(A.length, B.length); k++) { const a = A[k], b = B[k]; const d = Math.abs(b[0] - a[0]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * (0.3 + d), b[0], b[1]); ctx.stroke(); }
    }
  };
  P.pot = function (ctx, x, base, s, col = '#b0582c') {
    ctx.beginPath(); ctx.moveTo(x - s * 0.25, base - s * 0.92); ctx.quadraticCurveTo(x - s * 0.62, base - s * 0.7, x - s * 0.5, base - s * 0.25); ctx.quadraticCurveTo(x - s * 0.3, base, x, base); ctx.quadraticCurveTo(x + s * 0.3, base, x + s * 0.5, base - s * 0.25); ctx.quadraticCurveTo(x + s * 0.62, base - s * 0.7, x + s * 0.25, base - s * 0.92); ctx.closePath(); P.fillLine(ctx, col);
    ctx.beginPath(); ctx.ellipse(x, base - s * 0.94, s * 0.28, s * 0.07, 0, 0, 7); P.fillLine(ctx, shade(col, -0.25));
    ctx.fillStyle = rgba('#ffffff', 0.18); ctx.beginPath(); ctx.ellipse(x + s * 0.22, base - s * 0.55, s * 0.08, s * 0.2, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = rgba('#1a0a00', 0.22); ctx.beginPath(); ctx.ellipse(x - s * 0.25, base - s * 0.45, s * 0.18, s * 0.32, 0.1, 0, 7); ctx.fill();
  };
  P.charpai = function (ctx, x, base, w, h = w * 0.28) {
    const top = base - h;
    for (const lx of [-0.46, 0.46]) { ctx.beginPath(); ctx.rect(x + lx * w - w * 0.025, top, w * 0.05, h); P.fillLine(ctx, '#7a4a26'); }
    ctx.beginPath(); ctx.moveTo(x - w * 0.5, top); ctx.lineTo(x + w * 0.5, top); ctx.lineTo(x + w * 0.44, top - h * 0.32); ctx.lineTo(x - w * 0.44, top - h * 0.32); ctx.closePath(); P.fillLine(ctx, '#d8b886');
    ctx.save(); ctx.clip(); ctx.strokeStyle = '#a88452'; ctx.lineWidth = 0.0015; for (let i = -30; i < 30; i++) { ctx.beginPath(); ctx.moveTo(x + i * 0.01, top); ctx.lineTo(x + i * 0.01 + h * 0.3, top - h * 0.32); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + i * 0.01, top); ctx.lineTo(x + i * 0.01 - h * 0.3, top - h * 0.32); ctx.stroke(); } ctx.restore();
    ctx.beginPath(); ctx.rect(x - w * 0.5, top - h * 0.04, w, h * 0.09); P.fillLine(ctx, '#8a5a30');
  };
  P.groundShadow = function (ctx, x, y, rx, ry, a = 0.25) { const g = ctx.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, `rgba(40,25,10,${a})`); g.addColorStop(1, 'rgba(40,25,10,0)'); ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2); ctx.restore(); };
  // dirt ground with tone variation, pebbles and tracks
  P.dirt = function (ctx, x0, x1, y0, y1, seed, col = '#c9a06a') {
    const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(col, 0.08)); g.addColorStop(1, shade(col, -0.08)); ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    P.dabs(ctx, x0, y0, x1 - x0, y1 - y0, shade(col, -0.22), 70, seed, 0.05, 0.12);
    P.dabs(ctx, x0, y0, x1 - x0, y1 - y0, shade(col, 0.2), 50, seed + 1, 0.04, 0.12);
    const r = KT.rng(seed + 2);
    for (let i = 0; i < 160; i++) { const y = y0 + Math.pow(r(), 0.7) * (y1 - y0), t = (y - y0) / (y1 - y0), x = x0 + r() * (x1 - x0); ctx.fillStyle = r() < 0.5 ? shade(col, -0.3) : shade(col, 0.25); ctx.beginPath(); ctx.ellipse(x, y, 0.001 + t * 0.004, 0.0006 + t * 0.002, 0, 0, 7); ctx.fill(); }
  };
  P.sign = function (ctx, x, y, w, h, text, o = {}) {
    ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); P.fillLine(ctx, o.bg || '#1f4e9c', 0.003);
    ctx.beginPath(); ctx.rect(x - w / 2 + 0.006, y - h / 2 + 0.006, w - 0.012, h - 0.012); P.line(ctx, 0.002, o.trim || '#e8e4da');
    ctx.fillStyle = o.fg || '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = String(text).split('\n'); const fs = Math.min(h * 0.6 / lines.length, w / (Math.max(...lines.map(l => l.length)) * 0.62));
    ctx.font = `700 ${fs}px "Baloo 2", "Nirmala UI", sans-serif`;
    lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * fs * 1.05));
  };
  P.glow = function (ctx, x, y, r, color, a = 0.5) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
})();
