// puppet.js — semi-realistic Indian cartoon cut-out characters (flat cel colour, thin dark outline,
// one cel-shadow tone), drawn in "units": 100 units = full standing height, feet at (0,0), facing right.
// Views: '3q' (three-quarter, the default), 'front', 'back'. Mirrored for facing left.
(function () {
  const KT = window.KT;
  const { shade, mix, rgba, smoothClosed, smoothOpen, deg, clamp, lerp } = KT;
  const OL = '#2a1b14';          // outline colour
  const OLW = 0.5;               // outline width in units (at small sizes)
  let LS = 1;                    // line scale: keeps outlines thin in close-ups

  // ---------------------------------------------------------------- presets
  const SKIN = { fair: '#e4b48e', wheat: '#d79f74', medium: '#c4875b', brown: '#a86d45', dark: '#8a5534' };
  const HAIR = { black: '#1d1513', darkbrown: '#33231b', grey: '#9a9894', white: '#dedbd4', salt: '#5d5753' };

  const OUTFITS = {
    'shirt-pants':      { top: 'shirt', bottom: 'pants', sleeves: 'long', topColor: '#3c8dde', bottomColor: '#3a3a42' },
    'shirt-dhoti':      { top: 'shirt', bottom: 'dhoti', sleeves: 'long', topColor: '#b4483c', bottomColor: '#f1ede2' },
    'kurta-dhoti':      { top: 'kurta', bottom: 'dhoti', sleeves: 'long', topColor: '#2e5fc4', bottomColor: '#f1ede2' },
    'kurta-pajama':     { top: 'kurta', bottom: 'pajama', sleeves: 'long', topColor: '#f3efe4', bottomColor: '#f3efe4' },
    'vest-kurta-dhoti': { top: 'kurta', bottom: 'dhoti', sleeves: 'long', topColor: '#f3efe4', bottomColor: '#f1ede2', vest: '#a51d24' },
    'lungi':            { top: 'shirt', bottom: 'lungi', sleeves: 'short', topColor: '#e8e2d0', bottomColor: '#2f6a4a' },
    'saree':            { top: 'blouse', bottom: 'saree', sleeves: 'short', topColor: '#2f73c8', bottomColor: '#d8509a', border: '#f0c02c' },
    'lehenga':          { top: 'blouse', bottom: 'lehenga', sleeves: 'short', topColor: '#e8a21c', bottomColor: '#c8283c', border: '#f0c02c' },
    'school':           { top: 'shirt', bottom: 'shorts', sleeves: 'short', topColor: '#f4f4f0', bottomColor: '#2c3c7a' },
    'frock':            { top: 'blouse', bottom: 'lehenga', sleeves: 'short', topColor: '#f06aa0', bottomColor: '#f06aa0', border: '#ffffff' },
  };

  // pose = arm angles, "outward positive": a1 = upper arm from straight down, a2 = elbow bend added.
  // L = lead arm (the side the character faces), B = back arm.
  const POSES = {
    idle:     { L: [7, 6, 'relaxed'], B: [6, 4, 'relaxed'] },
    explain:  { L: [24, 68, 'palm'], B: [6, 4, 'relaxed'] },
    explain2: { L: [6, 5, 'relaxed'], B: [-14, -96, 'palm'] },
    point:    { L: [72, 14, 'point'], B: [6, 4, 'relaxed'] },
    open:     { L: [32, 52, 'palm'], B: [30, 54, 'palm'] },
    shrug:    { L: [44, 70, 'palm'], B: [44, 70, 'palm'] },
    chest:    { L: [-16, -112, 'flat'], B: [6, 4, 'relaxed'] },
    hips:     { L: [38, -78, 'fist'], B: [38, -78, 'fist'] },
    namaste:  { L: [25, -141, 'namaste'], B: [25, -141, 'namaste'] },
    think:    { L: [-22, -150, 'fist'], B: [-10, -82, 'relaxed'] },
    worried:  { L: [-8, -72, 'relaxed'], B: [-8, -72, 'relaxed'] },
    folded:   { L: [-6, -96, 'hidden'], B: [-6, -96, 'hidden'] },
    wave:     { L: [148, 28, 'palm'], B: [6, 4, 'relaxed'] },
    cane:     { L: [18, 30, 'fist'], B: [6, 4, 'relaxed'] },
    headload: { L: [160, 14, 'palm'], B: [6, 4, 'relaxed'] },
    give:     { L: [40, 40, 'palm'], B: [6, 4, 'relaxed'] },
    angry:    { L: [16, 96, 'fist'], B: [10, 10, 'fist'] },
    bless:    { L: [80, -60, 'palm'], B: [6, 4, 'relaxed'] },
    cry:      { L: [-24, -150, 'flat'], B: [-20, -140, 'flat'] },
    sit:      { L: [-6, -64, 'relaxed'], B: [-4, -60, 'relaxed'] },
  };

  const EXPR = {
    neutral:   { brow: 0, inner: 0, open: 1, curve: 0.12, look: 0 },
    happy:     { brow: 0.35, inner: -0.25, open: 0.82, curve: 0.95, look: 0 },
    smile:     { brow: 0.2, inner: 0, open: 0.92, curve: 0.6, look: 0 },
    sad:       { brow: 0.25, inner: -1, open: 0.78, curve: -0.65, look: 0.6 },
    angry:     { brow: -0.45, inner: 1, open: 0.92, curve: -0.5, look: 0 },
    surprised: { brow: 1.2, inner: -0.2, open: 1.28, curve: 0, o: true, look: 0 },
    worried:   { brow: 0.55, inner: -0.85, open: 1.06, curve: -0.35, look: 0 },
    thinking:  { brow: 0.35, inner: 0.35, open: 0.9, curve: -0.1, look: -0.8 },
    sly:       { brow: -0.15, inner: 0.4, open: 0.7, curve: 0.55, look: 0 },
    crying:    { brow: 0.3, inner: -1.1, open: 0.35, curve: -0.85, tears: true, look: 0.6 },
    proud:     { brow: 0.1, inner: 0.2, open: 0.8, curve: 0.45, look: 0 },
  };

  // ---------------------------------------------------------------- spec normalisation
  KT.normalizeCast = function (id, c) {
    c = Object.assign({}, c);
    c.id = id;
    c.gender = c.gender || 'm';
    const f = c.gender === 'f';
    c.age = c.age || 'adult';                          // child | young | adult | old
    const of = OUTFITS[c.outfit || (f ? 'saree' : 'shirt-pants')] || OUTFITS['shirt-pants'];
    c.top = c.top || of.top; c.bottom = c.bottom || of.bottom; c.sleeves = c.sleeves || of.sleeves;
    c.topColor = c.topColor || of.topColor; c.bottomColor = c.bottomColor || of.bottomColor;
    c.vest = c.vest !== undefined ? c.vest : of.vest || null;
    c.border = c.border || of.border || '#f0c02c';
    c.skin = SKIN[c.skin] || c.skin || (f ? SKIN.wheat : SKIN.medium);
    c.hairColor = HAIR[c.hairColor] || c.hairColor || (c.age === 'old' ? HAIR.grey : HAIR.black);
    c.hair = c.hair || (f ? (c.age === 'child' ? 'pigtails' : 'bun') : c.age === 'child' ? 'kid' : c.age === 'old' ? 'balding' : 'short');
    c.mustache = c.mustache !== undefined ? c.mustache : (!f && c.age !== 'child' && c.age !== 'young' ? 'thick' : 'none');
    c.mustacheColor = c.mustacheColor || c.hairColor;
    c.beard = c.beard || 'none';
    c.build = c.build || 'medium';                      // slim | medium | heavy
    c.height = c.height || (c.age === 'child' ? 0.64 : f ? 0.93 : 1.0);
    c.headScale = c.headScale || (c.age === 'child' ? 1.28 : 1.0);
    c.bindi = c.bindi !== undefined ? c.bindi : f && c.age !== 'child';
    c.jewelry = c.jewelry !== undefined ? c.jewelry : f ? 'gold' : null;
    c.bangles = c.bangles || (f ? '#d42a3a' : null);
    c.feet = c.feet || (c.bottom === 'pants' ? 'shoes' : 'chappal');
    c.pocket = c.pocket !== undefined ? c.pocket : true;
    c.pattern = c.pattern || null;                        // 'dots' | 'flowers' | 'checks' for the main garment
    c.seed = KT.strHash(id);
    return c;
  };
  KT.POSES = POSES; KT.EXPR = EXPR; KT.OUTFITS = OUTFITS; KT.SKIN = SKIN;

  // ---------------------------------------------------------------- drawing primitives
  function fillOL(ctx, color, lw = OLW) { ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = LS * lw; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke(); }
  function limb(ctx, pts, w, color) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); smoothOpen(ctx, pts, 0.4); ctx.strokeStyle = OL; ctx.lineWidth = w + OLW * 2 * LS; ctx.stroke();
    ctx.beginPath(); smoothOpen(ctx, pts, 0.4); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  }
  // cel shadow on the back (-x) side of the current path, plus a soft floor shadow at the bottom
  function celShade(ctx, pathFn, color, edgeX, amt = 0.17) {
    ctx.save(); ctx.beginPath(); pathFn(); ctx.clip();
    ctx.fillStyle = shade(color, -amt);
    ctx.beginPath(); ctx.moveTo(-80, -200); ctx.lineTo(edgeX, -200); ctx.bezierCurveTo(edgeX + 2.5, -120, edgeX - 1.5, -60, edgeX + 1, 10); ctx.lineTo(-80, 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function pattern(ctx, pathFn, kind, color, seed) {
    if (!kind) return;
    ctx.save(); ctx.beginPath(); pathFn(); ctx.clip();
    const r = KT.rng(seed); ctx.fillStyle = color; ctx.strokeStyle = color;
    if (kind === 'checks') { ctx.globalAlpha = 0.35; ctx.lineWidth = 0.7; for (let x = -30; x < 30; x += 3.2) { ctx.beginPath(); ctx.moveTo(x, -110); ctx.lineTo(x, 5); ctx.stroke(); } for (let y = -110; y < 5; y += 3.2) { ctx.beginPath(); ctx.moveTo(-30, y); ctx.lineTo(30, y); ctx.stroke(); } }
    else if (kind === 'stripes') { ctx.globalAlpha = 0.4; ctx.lineWidth = LS * 0.6; for (let x = -30; x < 30; x += 2.2) { ctx.beginPath(); ctx.moveTo(x, -110); ctx.lineTo(x, 5); ctx.stroke(); } }
    else { for (let y = -110; y < 5; y += 3.6) for (let x = -30; x < 30; x += 3.6) { const ox = ((Math.round(y / 3.6) % 2) * 1.8); if (kind === 'flowers') { for (let p = 0; p < 5; p++) { const a = p * 1.2566; ctx.beginPath(); ctx.arc(x + ox + Math.cos(a) * 0.55, y + Math.sin(a) * 0.55, 0.42, 0, 7); ctx.fill(); } } else { ctx.beginPath(); ctx.arc(x + ox, y, 0.42 + r() * 0.1, 0, 7); ctx.fill(); } } }
    ctx.restore();
  }

  // ---------------------------------------------------------------- body geometry
  function geom(c) {
    const f = c.gender === 'f';
    const g = f ? { sw: 9.0, cw: 9.3, ww: 7.4, hw: 10.0, neck: 2.65, arm: 3.5, fore: 3.0 } : { sw: 11.0, cw: 10.2, ww: 9.0, hw: 9.3, neck: 3.05, arm: 4.4, fore: 3.7 };
    if (c.build === 'heavy') { g.cw += 1.2; g.ww += 2.6; g.hw += 1.4; g.arm += 0.5; g.fore += 0.3; }
    if (c.build === 'slim') { g.sw -= 0.6; g.cw -= 0.8; g.ww -= 0.8; g.hw -= 0.6; g.arm -= 0.35; }
    g.shY = -79.5; g.neckY = -81.2; g.pitY = -71; g.waistY = -56; g.hipY = -47;
    g.upper = 16.2; g.lower = 14.2;
    return g;
  }
  function torsoPath(ctx, g, hemY, hemW, collarDip = 0) {
    ctx.moveTo(-3.2, g.neckY + collarDip);
    ctx.quadraticCurveTo(-g.sw + 2.5, g.neckY + 0.4, -g.sw, g.shY + 2.2);
    ctx.quadraticCurveTo(-g.cw - 0.7, g.pitY - 3, -g.cw, g.pitY);
    ctx.quadraticCurveTo(-g.ww - 0.4, g.waistY + 6, -g.ww, g.waistY);
    ctx.quadraticCurveTo(-hemW + 0.4, (g.waistY + hemY) / 2, -hemW, hemY);
    ctx.quadraticCurveTo(0, hemY + 0.8, hemW, hemY);
    ctx.quadraticCurveTo(hemW - 0.4, (g.waistY + hemY) / 2, g.ww, g.waistY);
    ctx.quadraticCurveTo(g.ww + 0.4, g.waistY + 6, g.cw, g.pitY);
    ctx.quadraticCurveTo(g.cw + 0.7, g.pitY - 3, g.sw, g.shY + 2.2);
    ctx.quadraticCurveTo(g.sw - 2.5, g.neckY + 0.4, 3.2, g.neckY + collarDip);
    ctx.closePath();
  }

  // ---------------------------------------------------------------- arms
  function armPoints(g, side, a1, a2) {
    // side: +1 lead (screen +x), -1 back
    const sx = side * (g.sw - 1.9), sy = g.shY + 2.3;
    const t1 = deg(a1) * side, t2 = deg(a1 + a2) * side;
    const ex = sx + Math.sin(t1) * g.upper, ey = sy + Math.cos(t1) * g.upper;
    const wx = ex + Math.sin(t2) * g.lower, wy = ey + Math.cos(t2) * g.lower;
    return { s: [sx, sy], e: [ex, ey], w: [wx, wy], ang: t2 };
  }
  // hand: wrist at the origin, fingers along +y, thumb on +x (mirrored with `side`). Drawn as one silhouette
  // (outline pass, then fill pass) so the fingers read as separate digits joined to the palm.
  const HANDS = {
    palm:    { a: [-0.34, -0.13, 0.06, 0.26], curl: 0.0, thumb: 1.05, palmUp: true },
    flat:    { a: [-0.07, -0.025, 0.025, 0.07], curl: 0.0, thumb: 0.38 },
    namaste: { a: [-0.05, -0.02, 0.02, 0.05], curl: 0.0, thumb: 0.18 },
    relaxed: { a: [-0.12, -0.04, 0.03, 0.1], curl: 0.42, thumb: 0.5, nails: true },
    fist:    { fold: [true, true, true, true], thumb: -1.25 },
    point:   { fold: [true, true, true, false], a: [0, 0, 0, 0.04], thumb: -1.1 },
  };
  function hand(ctx, c, p, kind, side) {
    if (kind === 'hidden') return;
    const H = HANDS[kind] || HANDS.relaxed, skin = c.skin, crease = shade(skin, -0.34);
    const sc = (c.gender === 'f' ? 0.86 : 0.98) * (c.age === 'child' ? 0.9 : 1);
    ctx.save(); ctx.translate(p.w[0], p.w[1]);
    if (kind === 'namaste') ctx.rotate(Math.PI - side * 0.12); else ctx.rotate(-p.ang);
    ctx.scale(sc * side, sc);
    const bx = [-1.32, -0.44, 0.44, 1.3], L = [2.5, 3.25, 3.5, 3.2], fw = [0.86, 0.96, 0.98, 0.98];
    const caps = [], palmUp = !!H.palmUp;
    for (let i = 0; i < 4; i++) {
      const base = [bx[i] * 0.98, 3.55];
      if (H.fold && H.fold[i]) { caps.push({ pts: [[bx[i], 3.0], [bx[i] * 1.02, 4.3]], w: fw[i] + 0.12, knuckle: true }); continue; }
      const a = (H.a || HANDS.relaxed.a)[i], cu = H.curl || 0, l1 = L[i] * 0.56, l2 = L[i] * 0.46 * (1 - cu * 0.55);
      const m = [base[0] + Math.sin(a) * l1, base[1] + Math.cos(a) * l1];
      const a2 = a - cu * 0.5;
      const tip = [m[0] + Math.sin(a2) * l2, m[1] + Math.cos(a2) * l2];
      caps.push({ pts: [base, m, tip], w: fw[i], mid: m, tip, a: a2 });
    }
    const ta = H.thumb, tb = [1.55, 0.9];
    const tm = [tb[0] + Math.sin(ta) * 1.8, tb[1] + Math.cos(ta) * 1.8], tt = [tm[0] + Math.sin(ta * 0.8) * 1.55, tm[1] + Math.cos(ta * 0.8) * 1.55];
    const thumb = { pts: [tb, tm, tt], w: 1.12, tip: tt, a: ta * 0.8 };
    const palm = () => { ctx.beginPath(); ctx.moveTo(-1.62, -0.3); ctx.quadraticCurveTo(-2.05, 2.0, -1.78, 3.8); ctx.quadraticCurveTo(0, 4.25, 1.78, 3.85); ctx.quadraticCurveTo(2.15, 1.8, 1.7, -0.3); ctx.closePath(); };
    const stroke = (cp, w, col) => { ctx.beginPath(); smoothOpen(ctx, cp.pts, 0.5); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
    const ow = OLW * 2 * LS;
    const thumbFront = !!H.fold;              // a fist's thumb wraps over the folded fingers
    // outline pass
    if (!thumbFront) stroke(thumb, thumb.w + ow, OL);
    for (const cp of caps) stroke(cp, cp.w + ow, OL);
    palm(); ctx.lineWidth = ow; ctx.strokeStyle = OL; ctx.stroke();
    // fill pass
    if (!thumbFront) stroke(thumb, thumb.w, skin);
    palm(); ctx.fillStyle = skin; ctx.fill();
    for (const cp of caps) stroke(cp, cp.w, skin);
    // finger separations, knuckle creases, nails, palm lines
    ctx.lineCap = 'round'; ctx.strokeStyle = crease; ctx.lineWidth = LS * 0.26;
    for (let i = 0; i < 3; i++) { const x = (bx[i] + bx[i + 1]) / 2; ctx.beginPath(); ctx.moveTo(x, 3.2); ctx.lineTo(x + ((caps[i].a || 0) + (caps[i + 1].a || 0)) * 0.8, 4.35); ctx.stroke(); }
    for (const cp of caps) {
      if (cp.knuckle) { ctx.beginPath(); ctx.arc(cp.pts[1][0], cp.pts[1][1] - 0.2, cp.w * 0.32, 0.4, Math.PI - 0.4); ctx.stroke(); continue; }
      ctx.beginPath(); const m = cp.mid, n = [Math.cos(cp.a), -Math.sin(cp.a)]; ctx.moveTo(m[0] - n[0] * cp.w * 0.3, m[1] - n[1] * cp.w * 0.3); ctx.lineTo(m[0] + n[0] * cp.w * 0.3, m[1] + n[1] * cp.w * 0.3); ctx.stroke();
      if (H.nails) { ctx.save(); ctx.fillStyle = shade(skin, 0.28); ctx.beginPath(); ctx.ellipse(cp.tip[0], cp.tip[1] - 0.25, cp.w * 0.28, 0.42, -cp.a, 0, 7); ctx.fill(); ctx.restore(); }
    }
    if (palmUp) { ctx.beginPath(); ctx.moveTo(-1.4, 2.6); ctx.quadraticCurveTo(0, 2.2, 1.2, 2.9); ctx.moveTo(-1.2, 1.5); ctx.quadraticCurveTo(0.2, 1.4, 1.0, 0.6); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(1.15, 0.6); ctx.quadraticCurveTo(0.6, 1.6, 0.9, 2.6); ctx.stroke(); }
    if (thumbFront) { stroke(thumb, thumb.w + ow, OL); stroke(thumb, thumb.w, skin); }
    ctx.restore();
  }
  function drawArm(ctx, c, g, side, arm, st) {
    const p = armPoints(g, side, arm[0], arm[1]);
    const skin = c.skin, sl = c.top === 'blouse' ? 'short' : c.sleeves;
    const cloth = c.top === 'tshirt' ? c.topColor : c.topColor;
    const mid = [(p.s[0] + p.e[0]) / 2, (p.s[1] + p.e[1]) / 2];
    // bare skin first
    limb(ctx, [p.s, p.e, p.w], g.fore, skin);
    if (c.bangles && sl !== 'long') {
      ctx.save(); ctx.translate(p.w[0], p.w[1]); ctx.rotate(-p.ang);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-g.fore / 2 - 0.3, -0.5 - i * 0.75); ctx.lineTo(g.fore / 2 + 0.3, -0.5 - i * 0.75); ctx.strokeStyle = i === 1 ? '#f2c43a' : c.bangles; ctx.lineWidth = LS * 0.55; ctx.stroke(); }
      ctx.restore();
    }
    // sleeve
    if (sl === 'long') {
      const cuff = [lerp(p.e[0], p.w[0], 0.86), lerp(p.e[1], p.w[1], 0.86)];
      limb(ctx, [p.s, p.e, cuff], g.arm, cloth);
      if (st.view !== 'back') { ctx.beginPath(); ctx.moveTo(lerp(p.e[0], p.w[0], 0.72), lerp(p.e[1], p.w[1], 0.72)); ctx.strokeStyle = shade(cloth, -0.22); ctx.lineWidth = LS * 0.35; }
    } else if (sl === 'short') {
      const end = c.top === 'blouse' ? [lerp(p.s[0], p.e[0], 0.42), lerp(p.s[1], p.e[1], 0.42)] : [lerp(p.s[0], p.e[0], 0.72), lerp(p.s[1], p.e[1], 0.72)];
      limb(ctx, [p.s, end], g.arm + (c.top === 'blouse' ? 0.4 : 1.3), cloth);
      if (c.top === 'blouse') { ctx.beginPath(); ctx.moveTo(end[0], end[1]); ctx.lineTo(end[0] + 0.01, end[1] + 0.01); ctx.strokeStyle = c.border; ctx.lineWidth = g.arm + 0.4; ctx.lineCap = 'round'; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1; }
    }
    // fold crease at elbow
    if (sl === 'long') { ctx.beginPath(); ctx.moveTo(p.e[0] - 0.8, p.e[1] - 0.4); ctx.quadraticCurveTo(p.e[0], p.e[1] + 0.4, p.e[0] + 0.8, p.e[1] - 0.3); ctx.strokeStyle = shade(cloth, -0.3); ctx.lineWidth = LS * 0.32; ctx.stroke(); }
    hand(ctx, c, p, arm[2], side);
    return p;
  }

  // ---------------------------------------------------------------- legs & lower garments
  function legsPants(ctx, c, g, st, color) {
    const ph = st.walk;
    const sw = ph == null ? 0 : Math.sin(ph) * 16, kn = ph == null ? 0 : Math.max(0, -Math.cos(ph)) * 10;
    const legs = [];
    for (const side of [-1, 1]) {
      const a = deg(side === 1 ? sw : -sw);
      const hip = [side * 4.3, g.hipY - 1];
      const knee = [hip[0] + Math.sin(a) * 21.5, hip[1] + Math.cos(a) * 21.5];
      const b = a - deg(side === 1 ? kn : (ph == null ? 0 : Math.max(0, Math.cos(ph)) * 10));
      const ank = [knee[0] + Math.sin(b) * 21, knee[1] + Math.cos(b) * 21];
      legs.push({ side, hip, knee, ank });
    }
    const w = c.bottom === 'shorts' ? 5.2 : 6.4 + (c.build === 'heavy' ? 1 : 0);
    // back leg first
    for (const L of legs) {
      if (c.bottom === 'shorts') {
        limb(ctx, [L.hip, L.knee, L.ank], 3.6, c.skin);
        const mid = [lerp(L.hip[0], L.knee[0], 0.55), lerp(L.hip[1], L.knee[1], 0.55)];
        limb(ctx, [L.hip, mid], w + 1.2, color);
      } else limb(ctx, [L.hip, L.knee, L.ank], w, L.side < 0 ? shade(color, -0.1) : color);
      foot(ctx, c, L.ank, st);
    }
    // crotch / hip block
    ctx.beginPath(); ctx.moveTo(-g.hw + 0.3, g.hipY - 6); ctx.lineTo(g.hw - 0.3, g.hipY - 6); ctx.lineTo(g.hw - 1.2, g.hipY + 1.5); ctx.quadraticCurveTo(0, g.hipY + 4.5, -g.hw + 1.2, g.hipY + 1.5); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.2, g.hipY - 1); ctx.lineTo(0.3, g.hipY + 3.2); ctx.strokeStyle = shade(color, -0.35); ctx.lineWidth = LS * 0.35; ctx.stroke();
  }
  function foot(ctx, c, ank, st) {
    const dir = st.view === 'back' ? 0 : 1;
    if (c.feet === 'bare' || c.feet === 'chappal') {
      ctx.beginPath(); ctx.ellipse(ank[0] + 1.6 * dir, ank[1] + 1.7, 3.6, 1.15, 0, 0, 7); fillOL(ctx, c.feet === 'chappal' ? '#6b4026' : shade(c.skin, -0.25));
      ctx.beginPath(); ctx.ellipse(ank[0] + 1.3 * dir, ank[1] + 0.6, 2.7, 1.4, 0, 0, 7); fillOL(ctx, c.skin);
      if (c.feet === 'chappal') { ctx.beginPath(); ctx.moveTo(ank[0] + 0.2, ank[1] - 0.2); ctx.lineTo(ank[0] + 2.4 * dir + 0.2, ank[1] + 1.2); ctx.strokeStyle = '#7a3a1f'; ctx.lineWidth = 0.9; ctx.stroke(); }
    } else {
      ctx.beginPath(); ctx.moveTo(ank[0] - 2.4, ank[1] - 1); ctx.quadraticCurveTo(ank[0] + 4.8 * dir, ank[1] - 1.6, ank[0] + 4.6 * dir + (1 - dir) * 2, ank[1] + 1.4); ctx.lineTo(ank[0] - 2.6, ank[1] + 1.6); ctx.closePath(); fillOL(ctx, '#2a2422');
      ctx.beginPath(); ctx.moveTo(ank[0] - 1, ank[1] - 0.6); ctx.lineTo(ank[0] + 2.4 * dir, ank[1] - 0.6); ctx.strokeStyle = '#4d4541'; ctx.lineWidth = LS * 0.4; ctx.stroke();
    }
  }
  function skirtGarment(ctx, c, g, st, kind) {
    // dhoti / pajama-less draped lower: from waist to ankle, flared
    const ph = st.walk; const sway = ph == null ? 0 : Math.sin(ph) * 1.2;
    const top = kind === 'saree' || kind === 'lehenga' ? g.waistY + 1 : g.hipY - 6;
    const hemY = kind === 'lungi' ? -5.5 : kind === 'dhoti' ? -6.5 : -2.2;
    const hw = kind === 'lehenga' ? g.hw + 5 : kind === 'saree' ? g.hw + 1.6 : kind === 'dhoti' ? g.hw + 2.6 : g.hw + 0.8;
    const col = c.bottomColor;
    // feet under the hem
    for (const s of [-1, 1]) foot(ctx, c, [s * 3.6 + (s === 1 ? sway : -sway), -1.6], st);
    const path = () => {
      ctx.moveTo(-g.ww - 0.3, top);
      ctx.quadraticCurveTo(-g.hw - 1, -40, -hw + sway, hemY);
      ctx.quadraticCurveTo(0, hemY + 1.6, hw + sway, hemY);
      ctx.quadraticCurveTo(g.hw + 1, -40, g.ww + 0.3, top);
      ctx.closePath();
    };
    ctx.beginPath(); path(); fillOL(ctx, col);
    pattern(ctx, path, c.bottomPattern || (kind === 'saree' ? c.pattern : kind === 'lungi' ? 'checks' : null), kind === 'lungi' ? shade(col, -0.45) : c.border, c.seed + 7);
    celShade(ctx, path, col, -g.ww * 0.5);
    ctx.save(); ctx.beginPath(); path(); ctx.clip();
    ctx.strokeStyle = shade(col, -0.24); ctx.lineWidth = LS * 0.4;
    if (kind === 'dhoti') {
      // the central tuck + folds between the legs
      ctx.beginPath(); ctx.moveTo(1, top + 2); ctx.quadraticCurveTo(1.6, -25, 0.6 + sway, hemY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, top + 6); ctx.quadraticCurveTo(-4.5, -24, -6 + sway, hemY + 0.4); ctx.moveTo(4.2, top + 7); ctx.quadraticCurveTo(5.6, -22, 7 + sway, hemY + 0.4); ctx.moveTo(-1.5, top + 2); ctx.quadraticCurveTo(-1.6, -30, -2.4 + sway, hemY + 0.8); ctx.stroke();
    } else if (kind === 'saree' || kind === 'lehenga') {
      // pleats fanning down the front
      for (let i = 0; i < 5; i++) { const x0 = 0.5 + i * 1.2, x1 = -1 + i * 2.2 + sway; ctx.beginPath(); ctx.moveTo(x0, g.waistY + 3); ctx.quadraticCurveTo(x0 + 0.6, -24, x1, hemY + 1); ctx.stroke(); }
      // hem border
      ctx.beginPath(); ctx.moveTo(-hw - 2 + sway, hemY - 2.6); ctx.quadraticCurveTo(0, hemY - 1, hw + 2 + sway, hemY - 2.6); ctx.lineTo(hw + 2, hemY + 3); ctx.lineTo(-hw - 2, hemY + 3); ctx.closePath(); ctx.fillStyle = c.border; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-hw - 2 + sway, hemY - 2.6); ctx.quadraticCurveTo(0, hemY - 1, hw + 2 + sway, hemY - 2.6); ctx.strokeStyle = shade(c.border, -0.35); ctx.lineWidth = LS * 0.35; ctx.stroke();
    } else if (kind === 'lungi') {
      ctx.beginPath(); ctx.moveTo(2, top + 1); ctx.lineTo(3.4 + sway, hemY); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- torso garments
  function drawTorso(ctx, c, g, st) {
    const back = st.view === 'back', f = c.gender === 'f';
    const col = c.topColor;
    let hemY, hemW;
    if (c.top === 'kurta') { hemY = -29; hemW = g.hw + 2.6; }
    else if (c.top === 'blouse') { hemY = -63.5; hemW = g.cw - 0.6; }
    else { hemY = c.tucked ? -52 : -44.5; hemW = g.hw + 0.8; }
    // neck
    ctx.beginPath(); ctx.moveTo(-g.neck, -88); ctx.lineTo(-g.neck - 0.3, g.neckY + 1.2); ctx.lineTo(g.neck + 0.3, g.neckY + 1.2); ctx.lineTo(g.neck, -88); ctx.closePath(); fillOL(ctx, c.skin);
    ctx.beginPath(); ctx.moveTo(-g.neck, -86); ctx.lineTo(g.neck, -84.5); ctx.lineTo(g.neck, -86.8); ctx.closePath(); ctx.fillStyle = shade(c.skin, -0.2); ctx.fill();
    if (c.top === 'blouse') {
      // bare midriff between blouse and saree
      ctx.beginPath(); ctx.moveTo(-g.cw + 0.4, -66); ctx.quadraticCurveTo(-g.ww - 0.6, -60, -g.ww, g.waistY + 2); ctx.lineTo(g.ww, g.waistY + 2); ctx.quadraticCurveTo(g.ww + 0.6, -60, g.cw - 0.4, -66); ctx.closePath(); fillOL(ctx, c.skin);
    }
    const dip = back ? 0 : c.top === 'blouse' ? 3.2 : c.top === 'kurta' ? 0.4 : 0.6;
    const path = () => torsoPath(ctx, g, hemY, hemW, dip);
    ctx.beginPath(); path(); fillOL(ctx, col);
    if (c.top !== 'blouse') pattern(ctx, path, c.pattern, shade(col, c.pattern === 'checks' ? -0.5 : 0.35), c.seed);
    celShade(ctx, path, col, -g.cw * 0.42);
    ctx.save(); ctx.beginPath(); path(); ctx.clip();
    ctx.strokeStyle = shade(col, -0.28); ctx.lineWidth = LS * 0.38;
    // folds
    ctx.beginPath(); ctx.moveTo(-g.cw + 1.5, g.pitY + 2); ctx.quadraticCurveTo(-g.ww + 2.5, -62, -g.ww + 1.4, -55); ctx.moveTo(g.cw - 1.8, g.pitY + 3); ctx.quadraticCurveTo(g.ww - 2.2, -62, g.ww - 2.4, -57); ctx.stroke();
    if (c.top === 'kurta') { ctx.beginPath(); ctx.moveTo(-g.hw - 1.2, -36); ctx.lineTo(-g.hw - 2.2, -29); ctx.moveTo(g.hw + 1.2, -36); ctx.lineTo(g.hw + 2.2, -29); ctx.moveTo(-3, -50); ctx.quadraticCurveTo(-4, -40, -5, -30); ctx.moveTo(3.5, -48); ctx.quadraticCurveTo(4.5, -40, 5.6, -30); ctx.stroke(); }
    if (!back && c.top !== 'blouse') {
      // placket + buttons
      const plEnd = c.top === 'kurta' ? -62 : hemY;
      ctx.beginPath(); ctx.moveTo(0.6, g.neckY + 1); ctx.lineTo(0.6, plEnd); ctx.stroke();
      ctx.fillStyle = c.top === 'kurta' ? '#e8c35a' : shade(col, 0.45);
      const nb = c.top === 'kurta' ? 3 : 5;
      for (let i = 0; i < nb; i++) { const y = g.neckY + 4 + i * (c.top === 'kurta' ? 6 : 6.3); if (y > plEnd - 1) break; ctx.beginPath(); ctx.arc(1.4, y, 0.48, 0, 7); ctx.fill(); ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = LS * 0.2; ctx.stroke(); }
      // pocket on the wearer's left (screen +x when facing camera)
      if (c.top === 'shirt' && c.pocket) { ctx.beginPath(); ctx.moveTo(3.4, -72); ctx.lineTo(8.2, -72); ctx.lineTo(8.2, -66.4); ctx.lineTo(5.8, -65.4); ctx.lineTo(3.4, -66.4); ctx.closePath(); ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = LS * 0.38; ctx.stroke(); ctx.beginPath(); ctx.moveTo(3.4, -70.8); ctx.lineTo(8.2, -70.8); ctx.stroke(); }
      if (c.tucked && c.top === 'shirt') { ctx.fillStyle = '#3a2a22'; ctx.fillRect(-20, -53.2, 40, 1.8); }
    }
    ctx.restore();
    // blouse border hem
    if (c.top === 'blouse') { ctx.beginPath(); ctx.moveTo(-g.cw + 0.2, -64.4); ctx.quadraticCurveTo(0, -62.6, g.cw - 0.2, -64.4); ctx.strokeStyle = c.border; ctx.lineWidth = 1.1; ctx.stroke(); }
    // collar
    if (!back) {
      if (c.top === 'shirt') {
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 0.2, g.neckY + 4.2); ctx.lineTo(s * 3.6, g.neckY - 0.9); ctx.lineTo(s * 5.4, g.neckY + 0.4); ctx.lineTo(s * 4.4, g.neckY + 4.0); ctx.closePath(); fillOL(ctx, shade(col, 0.06), 0.4); }
      } else if (c.top === 'kurta') {
        ctx.beginPath(); ctx.moveTo(-3.4, g.neckY - 1.2); ctx.quadraticCurveTo(0, g.neckY + 0.8, 3.4, g.neckY - 1.2); ctx.lineTo(3.3, g.neckY + 0.6); ctx.quadraticCurveTo(0, g.neckY + 2.6, -3.3, g.neckY + 0.6); ctx.closePath(); fillOL(ctx, shade(col, -0.05), 0.4);
      } else if (c.top === 'blouse') {
        ctx.beginPath(); ctx.moveTo(-3.6, g.neckY + 0.2); ctx.quadraticCurveTo(0, g.neckY + 5.4, 3.6, g.neckY + 0.2); ctx.strokeStyle = c.border; ctx.lineWidth = 0.8; ctx.stroke();
      }
    }
    return { hemY };
  }
  function drawVest(ctx, c, g, st) {
    if (!c.vest) return;
    const col = c.vest, back = st.view === 'back';
    const path = () => {
      ctx.moveTo(-3.6, g.neckY - 0.5); ctx.quadraticCurveTo(-g.sw + 3.6, g.neckY + 0.3, -g.sw + 1.4, g.shY + 3);
      ctx.quadraticCurveTo(-g.cw + 1.8, -73, -g.cw + 0.6, -69); ctx.quadraticCurveTo(-g.ww - 0.8, -60, -g.ww - 0.6, -46);
      ctx.lineTo(g.ww + 0.6, -46); ctx.quadraticCurveTo(g.ww + 0.8, -60, g.cw - 0.6, -69); ctx.quadraticCurveTo(g.cw - 1.8, -73, g.sw - 1.4, g.shY + 3);
      ctx.quadraticCurveTo(g.sw - 3.6, g.neckY + 0.3, 3.6, g.neckY - 0.5);
      if (!back) { ctx.lineTo(0.9, -64); ctx.lineTo(-0.3, -64); }
      ctx.closePath();
    };
    ctx.beginPath(); path(); fillOL(ctx, col);
    celShade(ctx, path, col, -g.cw * 0.4, 0.2);
    if (!back) {
      ctx.beginPath(); ctx.moveTo(0.3, -64); ctx.lineTo(0.3, -46); ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = LS * 0.4; ctx.stroke();
      ctx.fillStyle = '#e8c35a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(1.2, -61 + i * 3.8, 0.5, 0, 7); ctx.fill(); }
      ctx.strokeStyle = shade(col, -0.3); ctx.beginPath(); ctx.moveTo(-7.4, -60); ctx.lineTo(-3.8, -60); ctx.stroke();
    }
  }
  function drawScarf(ctx, c, g, st) {
    if (!c.scarf) return;
    const col = c.scarf; const back = st.view === 'back';
    const stripe = c.scarfStripe || shade(col, 0.45);
    if (back) {
      ctx.beginPath(); ctx.moveTo(-5.5, g.neckY - 0.4); ctx.quadraticCurveTo(0, g.neckY + 2.2, 5.5, g.neckY - 0.4); ctx.lineTo(5.7, g.neckY + 2); ctx.quadraticCurveTo(0, g.neckY + 4.6, -5.7, g.neckY + 2); ctx.closePath(); fillOL(ctx, col); return;
    }
    // both ends hanging down the front (gamchha / dupatta style)
    const strip = (x0, x1, len) => {
      const p = () => { ctx.moveTo(x0 - 2.1, g.neckY - 0.5); ctx.quadraticCurveTo(x1 - 2.3, -70, x1 - 2.2, -81 + len); ctx.lineTo(x1 + 2.2, -81 + len); ctx.quadraticCurveTo(x1 + 2.3, -70, x0 + 2.1, g.neckY - 0.5); ctx.closePath(); };
      ctx.beginPath(); p(); fillOL(ctx, col);
      ctx.save(); ctx.beginPath(); p(); ctx.clip(); ctx.strokeStyle = stripe; ctx.lineWidth = LS * 0.55;
      for (let k = 0; k < 3; k++) { const y = -81 + len - 1.2 - k * 1.3; ctx.beginPath(); ctx.moveTo(x1 - 4, y); ctx.lineTo(x1 + 4, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x0 - 1.4, g.neckY); ctx.quadraticCurveTo(x1 - 1.4, -70, x1 - 1.4, -81 + len); ctx.stroke();
      ctx.restore();
    };
    if (c.scarfStyle === 'shoulder') strip(-4.6, -6.8, 36);
    else { strip(-4.4, -5.6, 30); strip(4.4, 5.6, 33); }
  }
  function drawScarfBand(ctx, c, g, st) {
    if (!c.scarf || st.view === 'back') return;
    const col = shade(c.scarf, -0.14);
    ctx.beginPath(); ctx.moveTo(-6.2, g.neckY + 1.2); ctx.quadraticCurveTo(-5.4, g.neckY - 4.4, 0, g.neckY - 4.6); ctx.quadraticCurveTo(5.4, g.neckY - 4.4, 6.2, g.neckY + 1.2); ctx.lineTo(3.4, g.neckY + 1.0); ctx.quadraticCurveTo(0, g.neckY - 2.4, -3.4, g.neckY + 1.0); ctx.closePath(); fillOL(ctx, col);
    ctx.strokeStyle = shade(col, -0.25); ctx.lineWidth = LS * 0.3; ctx.beginPath(); ctx.moveTo(-5.0, g.neckY - 0.4); ctx.quadraticCurveTo(0, g.neckY - 4.0, 5.0, g.neckY - 0.4); ctx.stroke();
  }
  function drawPallu(ctx, c, g, st, front) {
    if (c.bottom !== 'saree') return;
    const col = c.bottomColor, back = st.view === 'back';
    if (!front) {
      // the end of the pallu hanging down behind the left (back) shoulder
      const p = () => { ctx.moveTo(-g.sw + 0.5, g.shY + 0.5); ctx.quadraticCurveTo(-g.sw - 3.4, -60, -g.sw - 3, -36); ctx.lineTo(-g.sw + 3.2, -38); ctx.quadraticCurveTo(-g.sw + 3.4, -60, -g.sw + 4.8, g.shY + 1); ctx.closePath(); };
      ctx.beginPath(); p(); fillOL(ctx, shade(col, -0.12));
      ctx.save(); ctx.beginPath(); p(); ctx.clip(); ctx.fillStyle = c.border; ctx.fillRect(-40, -39.6, 80, 2.6); ctx.restore();
      return;
    }
    if (back) {
      const p = () => { ctx.moveTo(-g.sw + 0.5, g.shY + 0.4); ctx.lineTo(-g.sw + 6.5, g.shY + 0.4); ctx.quadraticCurveTo(-1, -64, g.ww + 0.6, -52); ctx.lineTo(g.ww + 0.4, -46); ctx.quadraticCurveTo(-4, -56, -g.sw + 0.2, -66); ctx.closePath(); };
      ctx.beginPath(); p(); fillOL(ctx, col); pattern(ctx, p, c.pattern, c.border, c.seed + 3);
      return;
    }
    // diagonal band from the right hip over the left shoulder, with borders on both edges
    const A = [g.ww - 0.2, g.waistY + 1.5], B = [g.ww + 0.4, g.waistY - 6.5], C = [-g.sw + 6.4, g.shY - 0.2], D = [-g.sw + 0.4, g.shY + 1.4];
    const p = () => { ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(-1, -62, D[0], D[1]); ctx.quadraticCurveTo(-g.sw + 3.2, g.shY - 1.8, C[0], C[1]); ctx.quadraticCurveTo(3.4, -70, B[0], B[1]); ctx.closePath(); };
    ctx.beginPath(); p(); fillOL(ctx, col);
    pattern(ctx, p, c.pattern, c.border, c.seed + 3);
    ctx.save(); ctx.beginPath(); p(); ctx.clip();
    ctx.lineWidth = 1.5; ctx.strokeStyle = c.border;
    ctx.beginPath(); ctx.moveTo(A[0], A[1] - 0.4); ctx.quadraticCurveTo(-1, -62.6, D[0], D[1] - 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(B[0], B[1] + 0.4); ctx.quadraticCurveTo(3.4, -69.4, C[0], C[1] + 0.6); ctx.stroke();
    ctx.strokeStyle = shade(col, -0.25); ctx.lineWidth = LS * 0.38; ctx.beginPath(); ctx.moveTo(g.ww - 2, -54); ctx.quadraticCurveTo(-0.5, -65, -g.sw + 3.4, g.shY + 0.6); ctx.stroke();
    ctx.restore();
  }
  function drawNecklace(ctx, c, g, st) {
    if (st.view === 'back' || !c.jewelry) return;
    const f = c.gender === 'f';
    ctx.lineCap = 'round';
    if (f) {
      ctx.beginPath(); ctx.moveTo(-2.6, g.neckY - 0.4); ctx.quadraticCurveTo(0, g.neckY + 5.8, 2.6, g.neckY - 0.4); ctx.strokeStyle = '#c8962a'; ctx.lineWidth = LS * 0.55; ctx.stroke();
      ctx.fillStyle = '#e8b83a'; for (let i = 0; i < 7; i++) { const t = i / 6, x = lerp(-2.4, 2.4, t), y = g.neckY - 0.2 + Math.sin(t * Math.PI) * 5.6; ctx.beginPath(); ctx.arc(x, y, 0.45, 0, 7); ctx.fill(); }
      if (c.mangalsutra !== false) { ctx.beginPath(); ctx.moveTo(-3.6, g.neckY); ctx.quadraticCurveTo(0, g.neckY + 11, 3.6, g.neckY); ctx.strokeStyle = '#1a1414'; ctx.lineWidth = LS * 0.35; ctx.stroke(); ctx.fillStyle = '#e8b83a'; ctx.beginPath(); ctx.ellipse(0, g.neckY + 5.6, 0.8, 1.1, 0, 0, 7); ctx.fill(); }
    } else if (c.jewelry === 'gold') {
      for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(-3.4 - k, g.neckY - 0.2); ctx.quadraticCurveTo(0, g.neckY + 8 + k * 3.4, 3.4 + k, g.neckY - 0.2); ctx.strokeStyle = '#d9a62c'; ctx.lineWidth = 0.75; ctx.stroke(); }
    }
  }

  // ---------------------------------------------------------------- head
  function drawHead(ctx, c, st) {
    const back = st.view === 'back';
    const k = back ? 0 : st.view === 'front' ? 0 : 0.55;
    const f = c.gender === 'f';
    const W = f ? 5.9 : 6.3, H = f ? 7.5 : 7.8;
    const x0 = k * 3.4;
    const skin = c.skin, skinS = shade(skin, -0.17);
    const ex = EXPR[st.expr] || EXPR.neutral;
    const hc = c.hairColor;

    // --- hair masses that sit behind the head
    if (c.hair === 'bun' || c.hair === 'bun-low') {
      const bx = back ? 0 : -W - 0.9 + k, by = c.hair === 'bun' ? 0.6 : 3.4;
      ctx.beginPath(); ctx.ellipse(bx, by, 3.4, 3.1, 0, 0, 7); fillOL(ctx, hc);
      ctx.strokeStyle = shade(hc, 0.25); ctx.lineWidth = LS * 0.3; ctx.beginPath(); ctx.arc(bx, by, 2.2, -2.4, 0.4); ctx.stroke();
      if (c.flowers) { ctx.fillStyle = '#f7f3e3'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(bx - 2.6 + i * 0.3, by - 2.4 + i * 1.0, 0.65, 0, 7); ctx.fill(); } }
    }
    if (c.hair === 'open' || c.hair === 'braid' || c.hair === 'pigtails') {
      if (c.hair === 'open') { ctx.beginPath(); ctx.moveTo(-W - 1, -2); ctx.quadraticCurveTo(-W - 3, 8, -W - 1.4, 16); ctx.lineTo(W * (back ? 1 : 0.2), 16); ctx.quadraticCurveTo(W, 6, W, -2); ctx.closePath(); fillOL(ctx, hc); }
    }

    // --- skull / face
    if (back) {
      ctx.beginPath(); ctx.ellipse(-W - 0.1, 0.8, 1.2, 2.2, 0, 0, 7); fillOL(ctx, skin);
      ctx.beginPath(); ctx.ellipse(W + 0.1, 0.8, 1.2, 2.2, 0, 0, 7); fillOL(ctx, skin);
      ctx.beginPath(); ctx.ellipse(0, -0.4, W + 0.2, H, 0, 0, 7); fillOL(ctx, skin);
    } else {
      const chinY = f ? H + 0.05 : H + 0.3;
      const face = [[-W + 0.3, -3.6], [-W + 0.25 + k * 0.4, 2.3], [-W * 0.6 + k * 1.3, 5.8], [x0 * 0.5 - 0.7, chinY - 0.35], [x0 * 0.5 + 1.3, chinY], [W * 0.8 + k * 0.5, f ? 4.6 : 5.0], [W + k * 0.55, 1.3], [W + 0.15 + k * 0.4, -2.0], [W - 0.3 + k * 0.3, -4.6], [W * 0.5, -H + 0.6], [-W * 0.45, -H + 0.3]];
      ctx.beginPath(); smoothClosed(ctx, face, 0.55); fillOL(ctx, skin);
      ctx.save(); ctx.beginPath(); smoothClosed(ctx, face, 0.55); ctx.clip();
      // cel shadow on the far side of the face and under the jaw
      ctx.fillStyle = skinS; ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(x0 - 4.5, -20); ctx.bezierCurveTo(x0 - 5.4, -2, x0 - 4.0, 3.5, x0 - 1.4, 20); ctx.lineTo(-20, 20); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x0 * 0.5 + 0.6, chinY + 1.7, 4.8, 1.5, 0, 0, 7); ctx.fill();
      // shadow under the hairline, cheekbone shade
      ctx.fillStyle = rgba(shade(skin, -0.25), 0.35); ctx.beginPath(); ctx.ellipse(x0 * 0.3, -5.2, W + 1, 1.3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = rgba(shade(skin, -0.2), 0.32); ctx.beginPath(); ctx.ellipse(x0 + 3.9 + k * 0.4, 2.9, 1.4, 0.7, -0.5, 0, 7); ctx.fill();
      // light on the near cheek and the forehead
      ctx.fillStyle = rgba(shade(skin, 0.3), 0.4); ctx.beginPath(); ctx.ellipse(x0 + 3.2, 1.1, 1.6, 1.0, -0.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x0 + 1.4, -4.2, 2.2, 0.8, -0.1, 0, 7); ctx.fill();
      if (f) { ctx.fillStyle = 'rgba(225,95,95,0.16)'; ctx.beginPath(); ctx.ellipse(x0 + 3.3, 2.3, 1.5, 0.95, 0, 0, 7); ctx.fill(); if (k < 0.25) { ctx.beginPath(); ctx.ellipse(x0 - 3.3, 2.3, 1.5, 0.95, 0, 0, 7); ctx.fill(); } }
      if (c.beard === 'stubble') { ctx.fillStyle = rgba('#3a2a28', 0.28); ctx.beginPath(); ctx.moveTo(-W, 1.5); ctx.quadraticCurveTo(x0, 12, W + 1, 1.5); ctx.lineTo(W + 1, 12); ctx.lineTo(-W, 12); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      // ears
      const ear = (x, s) => { const d = x < x0 ? 1 : -1; ctx.beginPath(); ctx.moveTo(x + 0.4 * d, -1.0); ctx.bezierCurveTo(x - 1.5 * s * d, -1.9, x - 1.6 * s * d, 2.4, x - 0.1 * d, 3.2); ctx.quadraticCurveTo(x + 0.6 * d, 3.3, x + 0.6 * d, 2.2); ctx.closePath(); fillOL(ctx, skin); ctx.strokeStyle = shade(skin, -0.32); ctx.lineWidth = LS * 0.28; ctx.beginPath(); ctx.moveTo(x + 0.15 * d, -0.4); ctx.bezierCurveTo(x - 0.95 * s * d, -0.9, x - 1.05 * s * d, 1.9, x - 0.15 * d, 2.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 0.05 * d, 0.4); ctx.quadraticCurveTo(x - 0.55 * s * d, 1.0, x - 0.05 * d, 1.6); ctx.stroke(); if (f && c.jewelry) { ctx.beginPath(); ctx.arc(x, 3.6, 0.7, 0, 7); ctx.fillStyle = '#e8b83a'; ctx.fill(); ctx.beginPath(); ctx.arc(x, 4.9, 0.45, 0, 7); ctx.fill(); } };
      st._ear = ear;
    }

    // --- hair on top
    drawHair(ctx, c, W, H, k, x0, back);
    if (!back && !(c.headwear === 'ghunghat')) { const ear = st._ear; if (k < 0.25) { ear(-W - 0.1, 1); ear(W + 0.1, 1); } else ear(x0 - 5.3, 1.05); }

    if (!back) {
      // eyes
      const blink = st.blink;
      const eyeY = -0.5;
      const eyes = k < 0.25 ? [[-2.55, 1], [2.55, 1]] : [[x0 - 2.35 + k * 0.6, 1 - 0.42 * k], [x0 + 2.6 + k * 0.25, 1 + 0.08]];
      const lookX = (st.lookX || 0) * 0.5 + k * 0.45, lookY = (ex.look || 0) * 0.35;
      for (const [cx, sc] of eyes) {
        const ew = 2.0 * sc, eh = 0.86 * ex.open * (1 - blink);
        const outer = cx > x0 ? 1 : -1;
        const lift = f ? 0.25 : 0.1;                   // outer corner a little higher
        const L = [cx - ew, eyeY + (outer < 0 ? -lift : 0)], R = [cx + ew, eyeY - 0.12 + (outer > 0 ? -lift : 0)];
        ctx.fillStyle = rgba(shade(skin, -0.3), 0.22); ctx.beginPath(); ctx.ellipse(cx, eyeY - 0.9, ew * 1.05, 1.2, 0, 0, 7); ctx.fill();   // socket shade
        if (eh > 0.12) {
          const eyeP = () => { ctx.moveTo(L[0], L[1]); ctx.bezierCurveTo(cx - ew * 0.6, eyeY - eh * 1.5, cx + ew * 0.45, eyeY - eh * 1.55, R[0], R[1]); ctx.bezierCurveTo(cx + ew * 0.5, eyeY + eh * 1.05, cx - ew * 0.55, eyeY + eh * 1.05, L[0], L[1]); ctx.closePath(); };
          ctx.beginPath(); eyeP(); ctx.fillStyle = '#fbf6ee'; ctx.fill();
          ctx.save(); ctx.beginPath(); eyeP(); ctx.clip();
          const ix = cx + lookX * sc, iy = eyeY + lookY - 0.12, ir = 1.02 * sc + 0.08;
          ctx.fillStyle = '#5a3420'; ctx.beginPath(); ctx.arc(ix, iy, ir, 0, 7); ctx.fill();
          ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.arc(ix + 0.15, iy + 0.3, ir * 0.62, 0, 7); ctx.fill();
          ctx.strokeStyle = '#24140c'; ctx.lineWidth = LS * 0.3; ctx.beginPath(); ctx.arc(ix, iy, ir - 0.08, 0, 7); ctx.stroke();
          ctx.fillStyle = '#100806'; ctx.beginPath(); ctx.arc(ix, iy, 0.46 * sc, 0, 7); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ix + 0.38, iy - 0.4, 0.27, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(ix - 0.35, iy + 0.38, 0.12, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(60,30,20,0.22)'; ctx.fillRect(cx - ew - 1, eyeY - eh * 2, ew * 2 + 2, eh * 0.95);   // lid shadow
          ctx.restore();
          // upper lid (thick), lid crease, lower lid
          ctx.strokeStyle = OL; ctx.lineCap = 'round'; ctx.lineWidth = LS * (f ? 0.7 : 0.55);
          ctx.beginPath(); ctx.moveTo(L[0] - 0.05, L[1] + 0.05); ctx.bezierCurveTo(cx - ew * 0.6, eyeY - eh * 1.52, cx + ew * 0.45, eyeY - eh * 1.58, R[0] + 0.15, R[1] - 0.05); ctx.stroke();
          ctx.strokeStyle = shade(skin, -0.38); ctx.lineWidth = LS * 0.26;
          ctx.beginPath(); ctx.moveTo(cx - ew * 0.75, eyeY - eh * 1.25 - 0.35); ctx.bezierCurveTo(cx - ew * 0.3, eyeY - eh * 1.75 - 0.4, cx + ew * 0.4, eyeY - eh * 1.75 - 0.4, cx + ew * 0.9, eyeY - eh * 1.1 - 0.45); ctx.stroke();
          ctx.strokeStyle = f ? '#3a2018' : shade(skin, -0.35); ctx.lineWidth = LS * (f ? 0.34 : 0.24);
          ctx.beginPath(); ctx.moveTo(cx - ew * 0.55, eyeY + eh * 0.85); ctx.bezierCurveTo(cx - ew * 0.1, eyeY + eh * 1.05, cx + ew * 0.5, eyeY + eh * 0.85, R[0] - 0.1, R[1] + 0.1); ctx.stroke();
          if (f) { ctx.strokeStyle = OL; ctx.lineWidth = LS * 0.32; const ox = outer > 0 ? R[0] : L[0], oy = outer > 0 ? R[1] : L[1]; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(ox - outer * j * 0.5, oy - j * 0.32); ctx.lineTo(ox - outer * j * 0.45 + outer * 0.55, oy - j * 0.32 - 0.55); ctx.stroke(); } }
        } else {
          ctx.beginPath(); ctx.moveTo(L[0], L[1] + 0.1); ctx.quadraticCurveTo(cx, eyeY + (ex.curve > 0.5 ? -0.6 : 0.55), R[0], R[1]); ctx.strokeStyle = OL; ctx.lineWidth = LS * 0.55; ctx.lineCap = 'round'; ctx.stroke();
        }
        // brow
        const inner = (cx < x0 ? 1 : -1) * (k < 0.25 ? 1 : 1);
        const by = eyeY - 2.5 - ex.brow * 0.7 - (blink > 0.5 ? -0.1 : 0);
        const innerX = cx + (cx < x0 + 0.2 ? ew * 0.85 : -ew * 0.85), outerX = cx + (cx < x0 + 0.2 ? -ew * 1.05 : ew * 1.05);
        const innerY = by + ex.inner * 0.65, outerY = by - ex.inner * 0.15 + 0.15;
        const bt = f ? 0.42 : 0.8, bmx = (innerX + outerX) / 2, bmy = Math.min(innerY, outerY) - 0.65;
        ctx.beginPath(); ctx.moveTo(innerX, innerY + 0.15 + bt * 0.5); ctx.quadraticCurveTo(bmx, bmy + bt * 0.55, outerX, outerY + 0.3); ctx.quadraticCurveTo(bmx, bmy - bt * 0.5, innerX, innerY + 0.15 - bt * 0.5); ctx.closePath(); ctx.fillStyle = c.age === 'old' ? shade(c.hairColor, -0.2) : '#1a1210'; ctx.fill();
      }
      // nose
      const nx = x0 + 0.2 + k * 1.2;
      const nl = shade(skin, -0.5);
      ctx.save(); ctx.translate(0, -0.45);
      ctx.fillStyle = rgba(shade(skin, -0.3), 0.18); ctx.beginPath(); ctx.ellipse(nx - 0.2, 2.75, 0.85, 0.5, 0.2, 0, 7); ctx.fill();   // shadow beside the nose
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (k < 0.25) {
        ctx.strokeStyle = rgba(nl, 0.45); ctx.lineWidth = LS * 0.26; ctx.beginPath(); ctx.moveTo(nx + 0.55, -0.6); ctx.quadraticCurveTo(nx + 0.75, 1.3, nx + 0.9, 2.4); ctx.stroke();
        ctx.strokeStyle = nl; ctx.lineWidth = LS * 0.38; ctx.beginPath(); ctx.moveTo(nx - 1.25, 2.7); ctx.quadraticCurveTo(nx - 1.35, 3.4, nx - 0.6, 3.45); ctx.moveTo(nx + 1.25, 2.7); ctx.quadraticCurveTo(nx + 1.35, 3.4, nx + 0.6, 3.45); ctx.moveTo(nx - 0.5, 3.6); ctx.quadraticCurveTo(nx, 3.9, nx + 0.5, 3.6); ctx.stroke();
        ctx.fillStyle = shade(skin, -0.55); for (const sx of [-0.55, 0.55]) { ctx.beginPath(); ctx.ellipse(nx + sx, 3.3, 0.32, 0.18, 0, 0, 7); ctx.fill(); }
      } else {
        ctx.strokeStyle = rgba(nl, 0.4); ctx.lineWidth = LS * 0.26; ctx.beginPath(); ctx.moveTo(nx - 0.1, -0.9); ctx.quadraticCurveTo(nx + 0.5, 0.6, nx + 1.05, 1.7); ctx.stroke();
        ctx.strokeStyle = nl; ctx.lineWidth = LS * 0.4;
        ctx.beginPath(); ctx.moveTo(nx + 1.05, 1.7); ctx.quadraticCurveTo(nx + 1.75 + k * 0.8, 2.6, nx + 1.35 + k * 0.6, 3.2); ctx.quadraticCurveTo(nx + 1.0, 3.55, nx + 0.45, 3.45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nx - 0.15, 2.55); ctx.quadraticCurveTo(nx - 0.85, 2.8, nx - 0.55, 3.35); ctx.quadraticCurveTo(nx - 0.2, 3.6, nx + 0.25, 3.45); ctx.stroke();
        ctx.fillStyle = shade(skin, -0.55); ctx.beginPath(); ctx.ellipse(nx + 0.6, 3.28, 0.36, 0.17, 0.1, 0, 7); ctx.fill();
        ctx.fillStyle = rgba(shade(skin, 0.35), 0.6); ctx.beginPath(); ctx.ellipse(nx + 1.15, 2.35, 0.32, 0.22, 0, 0, 7); ctx.fill();
      }
      ctx.restore();
      // smile lines (adults)
      if (c.age !== 'child') { ctx.strokeStyle = rgba(shade(skin, -0.4), c.age === 'old' ? 0.7 : 0.35); ctx.lineWidth = LS * 0.24; ctx.beginPath(); ctx.moveTo(nx + 1.8 + k * 0.5, 3.3); ctx.quadraticCurveTo(nx + 2.6 + k * 0.4, 4.4 + ex.curve * -0.3, nx + 2.4 + k * 0.4, 5.6); ctx.stroke(); }
      if (f && c.noseRing) { ctx.beginPath(); ctx.arc(nx + 0.2, 3.3, 0.7, 0, 7); ctx.strokeStyle = '#e2b03a'; ctx.lineWidth = LS * 0.25; ctx.stroke(); }
      // mouth
      drawMouth(ctx, c, st, ex, x0 + 0.5 + k * 0.6, f);
      // mustache / beard
      drawFacialHair(ctx, c, x0, k, W, H);
      if (c.bindi) { ctx.beginPath(); ctx.arc(x0 + 0.25, -3.7, 0.5, 0, 7); ctx.fillStyle = '#d0162c'; ctx.fill(); }
      if (c.tilak) { ctx.beginPath(); ctx.moveTo(x0 - 0.2, -5.4); ctx.lineTo(x0 + 0.6, -5.4); ctx.lineTo(x0 + 0.3, -3.2); ctx.closePath(); ctx.fillStyle = '#e04020'; ctx.fill(); }
      if (c.age === 'old') { ctx.strokeStyle = shade(skin, -0.32); ctx.lineWidth = LS * 0.25; ctx.beginPath(); ctx.moveTo(x0 - 1.8, -5.2); ctx.lineTo(x0 + 1.8, -5.4); ctx.moveTo(x0 - 1.2, -4.5); ctx.lineTo(x0 + 1.4, -4.6); ctx.moveTo(x0 + 3.6, 2.6); ctx.quadraticCurveTo(x0 + 4.4, 4.2, x0 + 3.8, 5.6); ctx.stroke(); }
      if (ex.tears) { ctx.fillStyle = 'rgba(140,200,255,0.85)'; const [cx] = eyes[eyes.length - 1]; ctx.beginPath(); ctx.ellipse(cx + 0.3, eyeY + 2.6, 0.45, 0.9, 0, 0, 7); ctx.fill(); }
      if (c.glasses) {
        ctx.strokeStyle = c.glasses === 'gold' ? '#a8822a' : '#2a2220'; ctx.lineWidth = LS * 0.42;
        for (const [cx, sc] of eyes) { ctx.beginPath(); ctx.ellipse(cx, eyeY - 0.1, 2.25 * sc, 1.75, 0, 0, 7); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(eyes[0][0] + 2.2 * eyes[0][1], eyeY - 0.5); ctx.quadraticCurveTo((eyes[0][0] + eyes[1][0]) / 2, eyeY - 1.3, eyes[1][0] - 2.2 * eyes[1][1], eyeY - 0.5); ctx.stroke();
        if (k >= 0.25) { ctx.beginPath(); ctx.moveTo(eyes[0][0] - 2.2 * eyes[0][1], eyeY - 0.6); ctx.lineTo(x0 - 5.2, -0.4); ctx.stroke(); }
      }
    }
    // headwear
    drawHeadwear(ctx, c, W, H, k, x0, back);
  }

  function drawMouth(ctx, c, st, ex, mx, f) {
    const my = 5.0, m = st.mouth || 0;
    const lip = f ? '#b8434a' : shade(c.skin, -0.42);
    if (m > 0.06 || ex.o) {
      const oo = ex.o ? Math.max(m, 0.55) : m;
      const w = ex.o ? 0.95 : 1.55 + 0.25 * oo + ex.curve * 0.3, h = 0.25 + 1.55 * oo;
      ctx.beginPath(); ctx.moveTo(mx - w, my - 0.1 - ex.curve * 0.35); ctx.quadraticCurveTo(mx, my - 0.5 * oo - 0.1, mx + w, my - 0.1 - ex.curve * 0.35); ctx.quadraticCurveTo(mx + w * 0.6, my + h, mx, my + h); ctx.quadraticCurveTo(mx - w * 0.6, my + h, mx - w, my - 0.1 - ex.curve * 0.35); ctx.closePath();
      ctx.fillStyle = '#4a1414'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = LS * 0.4; ctx.stroke();
      ctx.save(); ctx.clip();
      if (!ex.o) { ctx.fillStyle = '#f6efe2'; ctx.fillRect(mx - w, my - 1.4, w * 2, 0.55 + 0.75 * Math.min(1, oo * 1.5) + 0.75); }
      ctx.fillStyle = '#c75a5a'; ctx.beginPath(); ctx.ellipse(mx + 0.2, my + h, w * 0.65, 0.65 * oo + 0.1, 0, 0, 7); ctx.fill();
      ctx.restore();
      if (f) { ctx.beginPath(); ctx.moveTo(mx - w * 0.7, my + h + 0.15); ctx.quadraticCurveTo(mx, my + h + 0.75, mx + w * 0.7, my + h + 0.15); ctx.strokeStyle = lip; ctx.lineWidth = LS * 0.42; ctx.stroke(); }
    } else {
      const cv = ex.curve;
      const lx = mx - 1.6, rx = mx + 1.65, ly = my - cv * 0.5, ry = my - cv * 0.55, cy = my + cv * 0.9;
      if (f) {
        // upper lip with a cupid's bow, fuller lower lip with a highlight
        ctx.beginPath(); ctx.moveTo(lx + 0.1, ly); ctx.quadraticCurveTo(mx - 0.7, my - 0.75 - cv * 0.2, mx - 0.15, my - 0.55); ctx.quadraticCurveTo(mx + 0.1, my - 0.4, mx + 0.4, my - 0.6); ctx.quadraticCurveTo(mx + 1.0, my - 0.75 - cv * 0.2, rx - 0.1, ry); ctx.quadraticCurveTo(mx, cy, lx + 0.1, ly); ctx.closePath(); ctx.fillStyle = shade(lip, -0.15); ctx.fill();
        ctx.beginPath(); ctx.moveTo(lx + 0.3, ly + 0.05); ctx.quadraticCurveTo(mx, cy + 0.05, rx - 0.3, ry + 0.05); ctx.quadraticCurveTo(mx + 0.2, my + 1.25 + cv * 0.35, lx + 0.3, ly + 0.05); ctx.closePath(); ctx.fillStyle = lip; ctx.fill();
        ctx.fillStyle = 'rgba(255,230,230,0.45)'; ctx.beginPath(); ctx.ellipse(mx + 0.3, my + 0.75 + cv * 0.25, 0.55, 0.18, 0, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = rgba(shade(c.skin, -0.3), 0.45); ctx.beginPath(); ctx.ellipse(mx + 0.1, my + 1.0 + cv * 0.2, 1.0, 0.32, 0, 0, 7); ctx.fill();   // lower lip shade
      }
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(mx, cy, rx, ry);
      ctx.strokeStyle = f ? '#6a1e26' : shade(c.skin, -0.58); ctx.lineWidth = LS * 0.42; ctx.lineCap = 'round'; ctx.stroke();
      // mouth-corner tick and the chin crease
      ctx.strokeStyle = rgba(shade(c.skin, -0.45), 0.6); ctx.lineWidth = LS * 0.24;
      ctx.beginPath(); ctx.moveTo(rx - 0.1, ry - 0.1); ctx.lineTo(rx + 0.35, ry + (cv > 0.3 ? -0.35 : 0.2)); ctx.stroke();
      if (!f) { ctx.beginPath(); ctx.moveTo(mx - 0.55, my + 1.55 + cv * 0.2); ctx.quadraticCurveTo(mx + 0.1, my + 1.8 + cv * 0.2, mx + 0.75, my + 1.5 + cv * 0.2); ctx.stroke(); }
    }
  }

  function drawFacialHair(ctx, c, x0, k, W, H) {
    const col = c.mustacheColor, mx = x0 + 0.6 + k * 0.7, my = 3.55;
    if (c.beard === 'full' || c.beard === 'goatee') {
      ctx.beginPath();
      if (c.beard === 'full') { ctx.moveTo(x0 - 5.0, -0.4); ctx.quadraticCurveTo(x0 - 5.6, 5.5, x0 - 1.4, 9.4); ctx.quadraticCurveTo(x0 + 1.6, 11.2, x0 + 4.2, 8.2); ctx.quadraticCurveTo(W + k, 5.2, W + k * 0.5, 1.2); ctx.lineTo(W - 0.6, 4.0); ctx.quadraticCurveTo(mx + 1.4, 6.6, mx, 6.6); ctx.quadraticCurveTo(x0 - 2.6, 6.2, x0 - 3.6, -0.6); ctx.closePath(); }
      else { ctx.moveTo(mx - 1.6, 6.6); ctx.quadraticCurveTo(mx, 10.4, mx + 1.6, 6.6); ctx.closePath(); }
      fillOL(ctx, col, 0.4);
      ctx.strokeStyle = shade(col, 0.25); ctx.lineWidth = LS * 0.25; ctx.beginPath(); ctx.moveTo(x0 - 2, 6); ctx.lineTo(x0 - 1.2, 8.4); ctx.moveTo(x0 + 1.4, 7); ctx.lineTo(x0 + 1.6, 9.2); ctx.stroke();
    }
    const m = c.mustache; if (!m || m === 'none') return;
    const lw = 1 - 0.4 * k, rw = 1 + 0.12 * k;
    ctx.beginPath();
    if (m === 'thin') {
      ctx.moveTo(mx - 2.2 * lw, my + 0.9); ctx.quadraticCurveTo(mx, my - 0.1, mx + 2.3 * rw, my + 0.9); ctx.quadraticCurveTo(mx, my + 0.55, mx - 2.2 * lw, my + 0.9); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); return;
    }
    const thick = m === 'bushy' ? 1.5 : 1.0;
    const tipUp = m === 'handlebar' ? 1 : 0;
    ctx.moveTo(mx, my - 0.5);
    ctx.bezierCurveTo(mx - 1.6 * lw, my - 1.1 * thick, mx - 3.2 * lw, my - 0.4, mx - 3.6 * lw - tipUp * 0.8, my + 1.6 - tipUp * 3.2);
    ctx.quadraticCurveTo(mx - 2.6 * lw, my + 1.2 * thick, mx - 1.2 * lw, my + 0.9 * thick);
    ctx.quadraticCurveTo(mx, my + 0.6, mx + 1.2 * rw, my + 0.9 * thick);
    ctx.quadraticCurveTo(mx + 2.7 * rw, my + 1.2 * thick, mx + 3.7 * rw + tipUp * 0.8, my + 1.6 - tipUp * 3.2);
    ctx.bezierCurveTo(mx + 3.3 * rw, my - 0.4, mx + 1.6 * rw, my - 1.1 * thick, mx, my - 0.5);
    ctx.closePath(); fillOL(ctx, col, 0.35);
    ctx.strokeStyle = shade(col, 0.22); ctx.lineWidth = LS * 0.22; ctx.beginPath(); ctx.moveTo(mx - 1.6 * lw, my); ctx.lineTo(mx - 2.4 * lw, my + 0.8); ctx.moveTo(mx + 1.5 * rw, my); ctx.lineTo(mx + 2.4 * rw, my + 0.8); ctx.stroke();
  }

  function drawHair(ctx, c, W, H, k, x0, back) {
    const st = c.hair, col = c.hairColor, hl = shade(col, 0.22);
    if (st === 'none' || st === 'shaved') return;
    const front = k < 0.25;
    ctx.save();
    if (back) {
      // back of head: hair covers the whole skull
      ctx.beginPath();
      if (st === 'balding') { ctx.moveTo(-W - 0.4, 2.6); ctx.quadraticCurveTo(-W - 0.8, -3, -W + 1.8, -4.4); ctx.quadraticCurveTo(0, -2, W - 1.8, -4.4); ctx.quadraticCurveTo(W + 0.8, -3, W + 0.4, 2.6); ctx.quadraticCurveTo(0, 5.4, -W - 0.4, 2.6); }
      else { ctx.moveTo(-W - 0.6, 2.8); ctx.quadraticCurveTo(-W - 1.2, -H - 1.2, 0, -H - 1.3 - (c.gender === 'f' ? 0 : 0.6)); ctx.quadraticCurveTo(W + 1.2, -H - 1.2, W + 0.6, 2.8); ctx.quadraticCurveTo(0, c.gender === 'f' ? 6.8 : 5.6, -W - 0.6, 2.8); }
      ctx.closePath(); fillOL(ctx, col);
      ctx.strokeStyle = hl; ctx.lineWidth = LS * 0.32; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 1.3, -H + 0.5); ctx.quadraticCurveTo(i * 1.8, -2, i * 1.5, 3); ctx.stroke(); }
      if (c.gender === 'f' && (st === 'bun' || st === 'bun-low')) { ctx.beginPath(); ctx.ellipse(0, st === 'bun' ? 1.4 : 4, 3.4, 3.1, 0, 0, 7); fillOL(ctx, col); ctx.strokeStyle = hl; ctx.beginPath(); ctx.arc(0, 1.4, 2.1, -2.2, 0.8); ctx.stroke(); }
      if (st === 'braid') braid(ctx, col, 0, 3, 26);
      if (st === 'pigtails') { braid(ctx, col, -3.8, 3, 9); braid(ctx, col, 3.8, 3, 9); }
      ctx.restore(); return;
    }
    if (st === 'balding' && c.headwear) { ctx.restore(); return; }
    if (st === 'balding') {
      // fringe of hair around the back and sides, shiny bald top
      ctx.beginPath(); ctx.moveTo(x0 - 4.3, 1.4); ctx.quadraticCurveTo(x0 - 4.8, -3.4, x0 - 6.6, -3.2); ctx.quadraticCurveTo(-W - 1.2, -2.5, -W - 0.6, 3.0); ctx.quadraticCurveTo(-W + 1.4, 4.4, x0 - 4.3, 1.4); ctx.closePath(); fillOL(ctx, col, 0.4);
      if (front) { ctx.beginPath(); ctx.moveTo(W - 0.4, 1.4); ctx.quadraticCurveTo(W - 0.6, -3.4, W + 0.6, -3.2); ctx.quadraticCurveTo(W + 1.2, -1.5, W + 0.6, 2.6); ctx.closePath(); fillOL(ctx, col, 0.4); }
      ctx.beginPath(); ctx.ellipse(x0 + 0.8, -H + 2.2, 2.4, 0.9, -0.2, 0, 7); ctx.fillStyle = 'rgba(255,240,220,0.4)'; ctx.fill();
      ctx.restore(); return;
    }
    const f = c.gender === 'f';
    const vol = st === 'wavy' || st === 'puffy' ? 1.6 : st === 'kid' ? 1.2 : st === 'neat' ? 0.6 : 1.0;
    const sideburn = f ? 2.6 : 1.2;
    ctx.beginPath();
    if (front) {
      ctx.moveTo(-W - 0.3, sideburn);
      ctx.quadraticCurveTo(-W - 1.4, -H - vol, 0, -H - 0.9 - vol);
      ctx.quadraticCurveTo(W + 1.4, -H - vol, W + 0.3, sideburn);
      ctx.lineTo(W - 0.9, sideburn);
      if (f) { ctx.quadraticCurveTo(W - 1.0, -4.6, 0.25, -5.6); ctx.quadraticCurveTo(-W + 1.0, -4.6, -W + 0.9, sideburn); }
      else { ctx.quadraticCurveTo(W - 0.6, -4.2, W * 0.4, -4.6); ctx.quadraticCurveTo(0, -3.8 + (st === 'kid' ? 0.6 : 0), -W * 0.45, -4.9); ctx.quadraticCurveTo(-W + 0.6, -4.4, -W + 0.9, sideburn); }
    } else {
      const tvol = vol * 0.7;
      ctx.moveTo(x0 - 3.95, f ? 2.6 : 0.9);                               // sideburn in front of the ear
      ctx.lineTo(x0 - 3.35, -2.4);
      if (f) { ctx.quadraticCurveTo(x0 - 2.0, -5.5, x0 + 0.3, -5.8); ctx.quadraticCurveTo(x0 + 3.8, -5.6, W + 0.1 + k * 0.3, -1.2); ctx.lineTo(W + 0.7 + k * 0.3, -2.6); }
      else { ctx.quadraticCurveTo(x0 - 1.6, -4.6, x0 + 1.0, -4.9 + (st === 'kid' ? 0.7 : 0)); ctx.quadraticCurveTo(x0 + 3.4, -4.9, W + 0.2 + k * 0.4, -3.3); }
      ctx.quadraticCurveTo(W + 0.9 + k * 0.3, -H + 0.6, x0 + 0.6, -H - 0.9 - tvol);   // front-top
      ctx.quadraticCurveTo(-W + 0.2, -H - 0.6 - tvol * 0.6, -W - 0.35, -1.6);          // over the crown
      ctx.quadraticCurveTo(-W - 0.2, 2.6, -W + 1.0, f ? 5.6 : 4.4);                   // nape
      ctx.quadraticCurveTo(x0 - 5.6, f ? 4.6 : 3.6, x0 - 6.4, 2.4);
      ctx.quadraticCurveTo(x0 - 6.6, -1.6, x0 - 5.0, -2.0);                          // over the ear
      ctx.quadraticCurveTo(x0 - 4.1, -1.9, x0 - 4.2, f ? 2.6 : 1.2);
    }
    ctx.closePath(); fillOL(ctx, col);
    // strands and highlight
    ctx.clip();
    ctx.strokeStyle = hl; ctx.lineWidth = LS * 0.26; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 + 3.6 - i * 0.6, -H + 0.4 + i * 0.9); ctx.quadraticCurveTo(x0 - 1.5 - i * 0.3, -H - 0.4 + i * 1.2, -W + 1.4 + i * 0.5, -1.5 + i * 1.3); ctx.stroke(); } ctx.globalAlpha = 1;
    ctx.strokeStyle = rgba('#ffffff', 0.13); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x0 - 3.2, -H + 0.9); ctx.quadraticCurveTo(x0 + 0.8, -H - 0.9 - vol * 0.5, x0 + 4.4, -H + 2.4); ctx.stroke(); ctx.strokeStyle = rgba('#ffffff', 0.08); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x0 - 2.6, -H + 2.0); ctx.quadraticCurveTo(x0 + 0.6, -H + 0.2 - vol * 0.4, x0 + 3.6, -H + 3.2); ctx.stroke();
    if (f) { ctx.strokeStyle = shade(col, 0.4); ctx.lineWidth = LS * 0.3; ctx.beginPath(); ctx.moveTo(x0 + 0.3, -5.6); ctx.quadraticCurveTo(x0 - 0.2, -H, x0 - 0.8, -H - 0.8); ctx.stroke(); if (c.sindoor !== false && c.bindi) { ctx.strokeStyle = '#d0162c'; ctx.lineWidth = LS * 0.55; ctx.beginPath(); ctx.moveTo(x0 + 0.3, -5.8); ctx.quadraticCurveTo(x0 - 0.1, -H + 0.4, x0 - 0.5, -H - 0.2); ctx.stroke(); } }
    ctx.restore();
    if (st === 'braid' && !back) braid(ctx, col, -W - 0.2, 4, 18);
    if (st === 'pigtails') { braid(ctx, col, -W - 0.8, 2.5, 9); if (front) braid(ctx, col, W + 0.8, 2.5, 9); }
  }
  function braid(ctx, col, x, y, len) {
    for (let i = 0; i < len / 2.2; i++) { ctx.beginPath(); ctx.ellipse(x + (i % 2 ? 0.35 : -0.35), y + i * 2.2, 1.5 - i * 0.02, 1.4, (i % 2 ? 0.5 : -0.5), 0, 7); fillOL(ctx, col, 0.35); }
    ctx.beginPath(); ctx.arc(x, y + len + 0.5, 0.8, 0, 7); ctx.fillStyle = '#d0263a'; ctx.fill();
  }
  function drawHeadwear(ctx, c, W, H, k, x0, back) {
    const hw = c.headwear; if (!hw) return;
    if (hw === 'pagdi') {
      const col = c.pagdiColor || '#e0465a';
      const P = () => { ctx.moveTo(-W - 1.3, -0.8); ctx.quadraticCurveTo(-W - 2.6, -H - 3.8, x0 * 0.4 - 0.4, -H - 4.6); ctx.quadraticCurveTo(W + 2.6, -H - 3.4, W + 1.3 + k * 0.6, -1.6); ctx.quadraticCurveTo(x0 + 2.2, -4.6, x0 - 1.4, -4.3); ctx.quadraticCurveTo(-W + 1, -3.8, -W - 1.3, -0.8); ctx.closePath(); };
      ctx.beginPath(); P(); fillOL(ctx, col);
      ctx.save(); ctx.beginPath(); P(); ctx.clip();
      ctx.strokeStyle = shade(col, -0.28); ctx.lineWidth = LS * 0.45;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-W - 2, -1.2 - i * 2.1); ctx.quadraticCurveTo(x0, -6 - i * 1.6 + (i % 2) * 1.4, W + 2, -3.4 - i * 1.9); ctx.stroke(); }
      ctx.fillStyle = shade(col, 0.2); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(x0 + 1.8, -H - 1.8, 3, 1.2, -0.3, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      ctx.restore();
      if (!back) { ctx.beginPath(); ctx.ellipse(x0 + 0.6, -6.0, 1.2, 1.6, 0.2, 0, 7); fillOL(ctx, shade(col, -0.1), 0.35); }
    } else if (hw === 'topi') {
      ctx.beginPath(); ctx.moveTo(-W - 0.4, -4.2); ctx.lineTo(-W + 0.2, -H - 2.6); ctx.quadraticCurveTo(0, -H - 1.4, W - 0.2, -H - 2.6); ctx.lineTo(W + 0.4, -4.2); ctx.quadraticCurveTo(0, -3.4, -W - 0.4, -4.2); ctx.closePath(); fillOL(ctx, c.topiColor || '#f4f1ea');
      ctx.beginPath(); ctx.moveTo(-W + 0.6, -H - 2.0); ctx.quadraticCurveTo(0, -H - 0.4, W - 0.6, -H - 2.0); ctx.strokeStyle = '#c9c4b8'; ctx.lineWidth = LS * 0.4; ctx.stroke();
    } else if (hw === 'ghunghat' && c.bottom === 'saree') {
      const col = c.bottomColor;
      ctx.beginPath(); ctx.moveTo(-W - 2, 7); ctx.quadraticCurveTo(-W - 2.8, -H - 3, x0, -H - 2.2); ctx.quadraticCurveTo(W + 2.2, -H - 1.6, W + 1 + k, -2.6); ctx.quadraticCurveTo(x0 + 1, -6.4, x0 - 3.8, -2.8); ctx.quadraticCurveTo(x0 - 5.6, 3, -W + 1.6, 8); ctx.closePath(); fillOL(ctx, col);
      ctx.beginPath(); ctx.moveTo(W + 1 + k, -2.6); ctx.quadraticCurveTo(x0 + 1, -6.4, x0 - 3.8, -2.8); ctx.strokeStyle = c.border; ctx.lineWidth = 1.1; ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- props held
  function drawProp(ctx, c, g, st, lead, stage) {
    const pr = st.prop || c.prop; if (!pr) return;
    if (pr === 'cane' && stage === 'before') { const w = lead.w; ctx.beginPath(); ctx.moveTo(w[0] + 1.2, w[1] - 4); ctx.lineTo(w[0] + 2.4, 0); ctx.strokeStyle = OL; ctx.lineWidth = 2.0; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.beginPath(); ctx.ellipse(w[0] + 1.1, w[1] - 4.6, 1.4, 1.1, 0, 0, 7); fillOL(ctx, '#c9ccd0', 0.35); }
    if (pr === 'basket' && stage === 'after') { ctx.beginPath(); ctx.moveTo(-9, -104.5); ctx.lineTo(9, -104.5); ctx.lineTo(6.6, -99.2); ctx.lineTo(-6.6, -99.2); ctx.closePath(); fillOL(ctx, '#b88442'); ctx.fillStyle = '#d6b07a'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(-6.6 + i * 1.65, -105 - (i % 2) * 0.8, 1.5, 0, 7); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = LS * 0.3; ctx.stroke(); } }
    if (pr === 'bag' && stage === 'after') { const w = lead.w; ctx.beginPath(); KT.roundRect(ctx, w[0] - 4, w[1] + 3, 8, 9, 1.4); fillOL(ctx, c.bagColor || '#8a5a2a'); ctx.beginPath(); ctx.moveTo(w[0] - 2.4, w[1] + 3.2); ctx.quadraticCurveTo(w[0], w[1] - 1.5, w[0] + 2.4, w[1] + 3.2); ctx.strokeStyle = OL; ctx.lineWidth = LS * 0.5; ctx.stroke(); }
    if (pr === 'paper' && stage === 'after') { const w = lead.w; ctx.save(); ctx.translate(w[0], w[1]); ctx.rotate(-lead.ang + 0.4); ctx.beginPath(); ctx.rect(-2.5, 3, 5, 6.5); fillOL(ctx, '#f8f6ee', 0.3); ctx.strokeStyle = '#9aa0b0'; ctx.lineWidth = LS * 0.25; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-1.8, 4.6 + i * 1.2); ctx.lineTo(1.8, 4.6 + i * 1.2); ctx.stroke(); } ctx.restore(); }
    if (pr === 'coins' && stage === 'after') { const px = lead.w[0] + Math.sin(lead.ang) * 2.4, py = lead.w[1] + Math.cos(lead.ang) * 2.4 - 1.0; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(px - 1.0 + i * 0.7, py - i * 0.45, 1.0, 0.45, 0, 0, 7); fillOL(ctx, '#e8b83a', 0.25); } }
    if (pr === 'pot' && stage === 'after') { ctx.beginPath(); ctx.ellipse(-g.ww - 2, -57, 5, 5.4, 0, 0, 7); fillOL(ctx, '#b65f30'); ctx.beginPath(); ctx.ellipse(-g.ww - 2, -62.4, 2.4, 0.9, 0, 0, 7); fillOL(ctx, '#8a4520', 0.3); }
  }

  // ---------------------------------------------------------------- main entry
  // st: { x, y, h, facing, view, arms:{L:[a1,a2,hand], B:[...]}, expr, mouth, blink, headRot, headDY, bob, walk, lookX, prop, sit }
  KT.drawPuppet = function (ctx, c, st) {
    const g = geom(c);
    const u = st.h / 100;
    LS = Math.min(1, (st.maxLinePx || 2.2) / (OLW * u));
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.scale(u * (st.facing < 0 ? -1 : 1), u);
    const back = st.view === 'back';
    if (back) ctx.scale(-1, 1); // in back view the lead arm sits on the other side
    const breathe = st.bob || 0;
    ctx.translate(0, breathe);
    const arms = st.arms || { L: POSES.idle.L, B: POSES.idle.B };
    // back view swaps which arm is in front of the body
    if (c.hair === 'open' || c.hair === 'braid') { /* drawn with the head */ }
    // pallu tail behind the body
    drawPallu(ctx, c, g, st, false);
    if (c.hair === 'braid' && !back) { /* behind body: braid hangs at the back, mostly hidden */ }
    // lower body
    if (c.bottom === 'pants' || c.bottom === 'shorts' || c.bottom === 'pajama') legsPants(ctx, c, g, st, c.bottomColor);
    else skirtGarment(ctx, c, g, st, c.bottom);
    // arms that are behind the torso (big outward swings are fine in front)
    const leadBehind = back, backBehind = !back;
    let pBack = null, pLead = null;
    if (backBehind && arms.B[1] > -40) pBack = drawArm(ctx, c, g, -1, arms.B, st);
    if (leadBehind && arms.L[1] > -40) pLead = drawArm(ctx, c, g, 1, arms.L, st);
    drawScarfBand(ctx, c, g, st);
    drawTorso(ctx, c, g, st);
    drawVest(ctx, c, g, st);
    drawPallu(ctx, c, g, st, true);
    drawScarf(ctx, c, g, st);
    drawNecklace(ctx, c, g, st);
    const lp = armPoints(g, 1, arms.L[0], arms.L[1]);
    drawProp(ctx, c, g, st, lp, 'before');
    if (!pBack) pBack = drawArm(ctx, c, g, -1, arms.B, st);
    if (!pLead) pLead = drawArm(ctx, c, g, 1, arms.L, st);
    // head
    ctx.save();
    const hs = c.headScale * 1.1;
    ctx.translate(0, -86.5 + (c.gender === 'f' ? 1.3 : 0) + (st.headDY || 0));
    ctx.rotate(deg(st.headRot || 0));
    ctx.scale(hs, hs);
    ctx.translate(0, -6.1);
    drawHead(ctx, c, st);
    ctx.restore();
    drawProp(ctx, c, g, st, pLead, 'after');
    ctx.restore();
  };

  // child bodies are drawn with the adult rig at a smaller height; their head is enlarged via headScale
})();
