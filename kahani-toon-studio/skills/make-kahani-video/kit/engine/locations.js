// locations.js — code-painted village sets. Each set paints in frame units (1 = frame height, frame width = AR)
// with a 10% margin on every side for camera moves. Sets push window/door rectangles into `o.lights`
// so evening and night versions light up.
(function () {
  const KT = window.KT, P = KT.paint;
  const { shade, mix, rgba } = KT;
  const SETS = (KT.SETS = {});

  // ---------------------------------------------------------------- exteriors
  SETS.village = {
    label: 'Open village road: fields, palms, distant huts, electric poles', ground: 0.92, exterior: true,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      P.sky(ctx, XL, XR, -0.12, 0.68, o.time, o.seed);
      P.treeLine(ctx, XL, XR, 0.62, 0.05, '#7fa58e', o.seed + 1);
      for (let i = 0; i < 6; i++) P.hut(ctx, 0.15 + i * 0.37 + (i % 2) * 0.05, 0.635, 0.07, 0.05, { roof: i % 3 ? 'tile' : 'thatch', seed: 40 + i, window: false, door: false });
      P.treeLine(ctx, XL, XR, 0.655, 0.035, '#4f7f45', o.seed + 2);
      for (const [x, b, h, l] of [[0.05, 0.66, 0.26, -0.04], [0.32, 0.655, 0.2, 0.03], [0.75, 0.655, 0.16, 0.02], [1.28, 0.66, 0.22, -0.02], [1.5, 0.665, 0.3, 0.05], [1.86, 0.67, 0.34, -0.05]]) P.palm(ctx, x, b, h, l, Math.round(x * 100));
      P.field(ctx, XL, XR, 0.655, 0.72, o.seed + 3);
      P.dirt(ctx, XL, XR, 0.7, 1.12, o.seed + 4);
      // the road
      ctx.fillStyle = '#d8b480'; ctx.beginPath(); ctx.moveTo(0.78, 0.7); ctx.lineTo(0.98, 0.7); ctx.lineTo(1.9, 1.12); ctx.lineTo(0.0, 1.12); ctx.closePath(); ctx.fill();
      P.dabs(ctx, 0.0, 0.7, 1.9, 0.42, '#b08850', 40, o.seed + 5, 0.03, 0.15);
      P.grass(ctx, XL, 0.7, 0.7, 1.1, 120, o.seed + 6); P.grass(ctx, 1.4, XR, 0.72, 1.1, 120, o.seed + 7);
      P.bush(ctx, -0.12, 0.84, 0.3, 11); P.bush(ctx, 1.98, 0.86, 0.32, 12);
      const tops = [P.pole(ctx, 1.5, 0.97, 0.98), P.pole(ctx, 1.18, 0.76, 0.36), P.pole(ctx, 1.02, 0.7, 0.15), P.pole(ctx, 0.95, 0.67, 0.07)];
      P.wires(ctx, tops, 0.03);
      P.wires(ctx, [P.pole(ctx, 0.22, 0.7, 0.17), tops[2]], 0.01);
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.07);
    },
  };

  SETS.chaupal = {
    label: 'Village square under a giant banyan tree with a raised platform and charpai', ground: 0.93, exterior: true,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      P.sky(ctx, XL, XR, -0.12, 0.62, o.time, o.seed);
      P.treeLine(ctx, XL, XR, 0.58, 0.07, '#5d8a54', o.seed + 1);
      P.hut(ctx, 0.12, 0.66, 0.36, 0.26, { roof: 'thatch', seed: 3, lights: o.lights });
      P.hut(ctx, 1.62, 0.8, 0.56, 0.42, { roof: 'tile', seed: 4, wall: '#d6a878', doorX: -0.2, lights: o.lights, doorOpen: true });
      P.dirt(ctx, XL, XR, 0.6, 1.12, o.seed + 4, '#cfa46c');
      // banyan trunk + aerial roots
      const tx = 0.86;
      ctx.fillStyle = '#6e5440';
      ctx.beginPath(); ctx.moveTo(tx - 0.13, 0.72); ctx.bezierCurveTo(tx - 0.08, 0.5, tx - 0.1, 0.3, tx - 0.16, 0.12); ctx.lineTo(tx + 0.12, 0.1); ctx.bezierCurveTo(tx + 0.08, 0.3, tx + 0.07, 0.5, tx + 0.14, 0.72); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#4e3a2c'; ctx.lineWidth = 0.004; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(tx + i * 0.025, 0.72); ctx.bezierCurveTo(tx + i * 0.018, 0.5, tx + i * 0.02, 0.3, tx + i * 0.03 - 0.01, 0.1); ctx.stroke(); }
      ctx.strokeStyle = '#8a7058'; ctx.lineWidth = 0.002; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(tx + i * 0.025 + 0.008, 0.7); ctx.bezierCurveTo(tx + i * 0.02 + 0.008, 0.5, tx + i * 0.02 + 0.008, 0.3, tx + i * 0.03, 0.12); ctx.stroke(); }
      for (const [bx, ex, ey] of [[-0.05, -0.55, 0.05], [0.05, 0.6, 0.02], [-0.02, -0.25, -0.05], [0.03, 0.3, -0.06]]) { ctx.strokeStyle = '#6e5440'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(tx + bx, 0.2); ctx.quadraticCurveTo(tx + ex * 0.5, 0.1, tx + ex, ey); ctx.stroke(); }
      P.foliage(ctx, tx - 0.55, 0.06, 0.55, 0.22, 21, ['#2c5226', '#47803a', '#7cb04a'], 1.2);
      P.foliage(ctx, tx + 0.5, 0.04, 0.6, 0.2, 22, ['#2c5226', '#47803a', '#7cb04a'], 1.2);
      P.foliage(ctx, tx, -0.04, 0.5, 0.17, 23, ['#2c5226', '#47803a', '#7cb04a'], 1.2);
      const r = KT.rng(5); ctx.strokeStyle = 'rgba(92,70,52,0.85)'; for (let i = 0; i < 26; i++) { const x = tx - 0.9 + r() * 1.8, y0 = 0.08 + r() * 0.12, L = 0.1 + r() * 0.35; ctx.lineWidth = 0.0015 + r() * 0.002; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + 0.01, y0 + L * 0.5, x - 0.005, y0 + L); ctx.stroke(); }
      // chabutra (raised platform) around the trunk
      ctx.beginPath(); ctx.moveTo(tx - 0.42, 0.79); ctx.lineTo(tx + 0.42, 0.79); ctx.lineTo(tx + 0.38, 0.7); ctx.lineTo(tx - 0.38, 0.7); ctx.closePath(); P.fillLine(ctx, '#b89a74');
      ctx.beginPath(); ctx.rect(tx - 0.42, 0.79, 0.84, 0.05); P.fillLine(ctx, '#9a7c58');
      ctx.strokeStyle = '#7a5c40'; ctx.lineWidth = 0.0012; for (let x = tx - 0.42; x < tx + 0.42; x += 0.04) { ctx.beginPath(); ctx.moveTo(x, 0.79); ctx.lineTo(x, 0.84); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(tx - 0.42, 0.815); ctx.lineTo(tx + 0.42, 0.815); ctx.stroke();
      P.dabs(ctx, tx - 0.4, 0.7, 0.8, 0.09, '#8a6c4c', 20, 31, 0.02, 0.2);
      P.charpai(ctx, 0.3, 0.86, 0.32);
      P.pot(ctx, 1.25, 0.82, 0.06); P.pot(ctx, 1.31, 0.83, 0.045, '#9a4a24');
      P.grass(ctx, XL, XR, 0.62, 0.7, 60, 9);
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.07);
    },
  };

  SETS.lane = {
    label: 'Narrow village lane between mud houses with tiled roofs', ground: 0.93, exterior: true,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      P.sky(ctx, XL, XR, -0.12, 0.6, o.time, o.seed);
      P.treeLine(ctx, XL, XR, 0.56, 0.08, '#5a8a50', o.seed + 1);
      P.tree(ctx, 0.95, 0.58, 0.32, 8);
      P.dirt(ctx, XL, XR, 0.55, 1.12, o.seed + 2, '#c89c66');
      ctx.fillStyle = '#d9b383'; ctx.beginPath(); ctx.moveTo(0.82, 0.56); ctx.lineTo(1.0, 0.56); ctx.lineTo(1.75, 1.12); ctx.lineTo(0.1, 1.12); ctx.closePath(); ctx.fill();
      P.dabs(ctx, 0.1, 0.56, 1.6, 0.56, '#a8804c', 40, 3, 0.03, 0.15);
      const L = o.lights;
      P.hut(ctx, 0.66, 0.6, 0.16, 0.13, { roof: 'tile', seed: 11, window: false, lights: L });
      P.hut(ctx, 1.14, 0.6, 0.16, 0.13, { roof: 'thatch', seed: 12, window: false, lights: L });
      P.hut(ctx, 0.43, 0.69, 0.32, 0.28, { roof: 'tile', seed: 13, wall: '#d4a474', lights: L });
      P.hut(ctx, 1.4, 0.69, 0.32, 0.28, { roof: 'tile', seed: 14, wall: '#c9976a', lights: L, doorOpen: true });
      P.hut(ctx, 0.0, 0.88, 0.6, 0.56, { roof: 'tile', seed: 15, wall: '#cf9f6c', doorX: 0.18, lights: L });
      P.hut(ctx, 1.8, 0.88, 0.6, 0.56, { roof: 'thatch', seed: 16, wall: '#d6aa7a', doorX: -0.2, lights: L });
      P.pot(ctx, 0.36, 0.9, 0.07); P.pot(ctx, 0.43, 0.91, 0.05, '#8a4a24'); P.pot(ctx, 1.5, 0.9, 0.06);
      P.grass(ctx, XL, 0.25, 0.85, 1.1, 50, 4); P.grass(ctx, 1.55, XR, 0.85, 1.1, 50, 5);
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.07);
    },
  };

  SETS.courtyard = {
    label: 'Aangan (courtyard) of a village house: veranda with pillars, tulsi platform, charpai, clothesline', ground: 0.94, exterior: true,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      P.sky(ctx, XL, XR, -0.12, 0.4, o.time, o.seed);
      P.treeLine(ctx, XL, XR, 0.3, 0.12, '#4f7f45', o.seed + 1);
      // house back wall
      ctx.beginPath(); ctx.rect(XL, 0.2, XR - XL, 0.52); P.fillLine(ctx, '#d2a170');
      ctx.save(); ctx.beginPath(); ctx.rect(XL, 0.2, XR - XL, 0.52); ctx.clip(); P.dabs(ctx, XL, 0.2, XR - XL, 0.52, '#a87848', 60, 2, 0.06, 0.15); P.dabs(ctx, XL, 0.2, XR - XL, 0.52, '#ecc494', 40, 3, 0.05, 0.12);
      ctx.fillStyle = '#8a5a3a'; ctx.fillRect(XL, 0.64, XR - XL, 0.08); ctx.restore();
      // doors and windows
      for (const [x, open] of [[0.45, false], [1.35, true]]) { ctx.beginPath(); ctx.rect(x - 0.08, 0.36, 0.16, 0.34); P.fillLine(ctx, '#7a5432'); ctx.beginPath(); ctx.rect(x - 0.065, 0.375, 0.13, 0.325); P.fillLine(ctx, open ? '#2a1a12' : '#6b4527'); if (open) o.lights.push({ type: 'rect', x: x - 0.065, y: 0.375, w: 0.13, h: 0.325, a: 0.7 }); }
      for (const x of [0.92, 1.8]) { ctx.beginPath(); ctx.rect(x - 0.06, 0.4, 0.12, 0.1); P.fillLine(ctx, '#2a1d16'); o.lights.push({ type: 'rect', x: x - 0.06, y: 0.4, w: 0.12, h: 0.1, a: 1 }); ctx.strokeStyle = '#6a4a30'; ctx.lineWidth = 0.003; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 0.06 + i * 0.03, 0.4); ctx.lineTo(x - 0.06 + i * 0.03, 0.5); ctx.stroke(); } }
      // veranda roof (tiles) on pillars
      ctx.beginPath(); ctx.moveTo(XL, 0.26); ctx.lineTo(XR, 0.26); ctx.lineTo(XR, 0.13); ctx.lineTo(XL, 0.13); ctx.closePath(); P.fillLine(ctx, '#b8573a');
      ctx.save(); ctx.clip(); for (let k = 0; k < 5; k++) { const y = 0.13 + k * 0.026; ctx.strokeStyle = '#7a3420'; ctx.lineWidth = 0.0014; ctx.beginPath(); for (let x = XL; x < XR; x += 0.014) { ctx.moveTo(x, y + 0.026); ctx.quadraticCurveTo(x + 0.007, y - 0.002, x + 0.014, y + 0.026); } ctx.stroke(); } ctx.restore();
      ctx.fillStyle = 'rgba(60,30,20,0.35)'; ctx.fillRect(XL, 0.26, XR - XL, 0.05);
      for (const x of [0.12, 0.88, 1.62]) { ctx.beginPath(); ctx.rect(x - 0.016, 0.26, 0.032, 0.48); P.fillLine(ctx, '#7a4e2c'); ctx.beginPath(); ctx.rect(x - 0.026, 0.7, 0.052, 0.04); P.fillLine(ctx, '#6a4226'); }
      // plastered floor
      P.dirt(ctx, XL, XR, 0.72, 1.12, o.seed + 4, '#c6a072');
      ctx.beginPath(); ctx.rect(XL, 0.72, XR - XL, 0.03); P.fillLine(ctx, '#a07a50');
      // tulsi chaura
      const tx = 1.55; ctx.beginPath(); ctx.rect(tx - 0.06, 0.74, 0.12, 0.12); P.fillLine(ctx, '#e8dccb'); ctx.beginPath(); ctx.rect(tx - 0.075, 0.72, 0.15, 0.025); P.fillLine(ctx, '#d4c4ae'); ctx.fillStyle = '#c8452a'; ctx.fillRect(tx - 0.02, 0.78, 0.04, 0.05); P.bush(ctx, tx, 0.73, 0.12, 41, ['#2f6a2a', '#4a9036', '#7cc04a']);
      P.charpai(ctx, 0.3, 0.9, 0.36);
      // clothesline
      ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 0.0016; ctx.beginPath(); ctx.moveTo(0.12, 0.33); ctx.quadraticCurveTo(0.5, 0.38, 0.88, 0.33); ctx.stroke();
      for (const [x, c, w] of [[0.3, '#d84a6a', 0.08], [0.45, '#3a7ad0', 0.06], [0.6, '#f0c02c', 0.09]]) { ctx.beginPath(); ctx.rect(x - w / 2, 0.355, w, 0.09); P.fillLine(ctx, c); }
      P.pot(ctx, 1.0, 0.76, 0.07); P.pot(ctx, 1.08, 0.765, 0.055, '#8a4a24');
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.07);
    },
  };

  SETS.fields = {
    label: 'Farm fields with a brick well, a mango tree and a mud bund path', ground: 0.94, exterior: true,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      P.sky(ctx, XL, XR, -0.12, 0.6, o.time, o.seed);
      P.treeLine(ctx, XL, XR, 0.56, 0.05, '#86a890', o.seed + 1);
      for (let i = 0; i < 4; i++) P.hut(ctx, 0.5 + i * 0.35, 0.57, 0.06, 0.045, { roof: 'thatch', seed: 50 + i, window: false, door: false });
      P.treeLine(ctx, XL, XR, 0.585, 0.03, '#4f7f45', o.seed + 2);
      P.field(ctx, XL, XR, 0.58, 0.83, o.seed + 3, o.variant === 'gold' ? 'gold' : 'green');
      P.dirt(ctx, XL, XR, 0.8, 1.12, o.seed + 4, '#b98e5a');
      P.grass(ctx, XL, XR, 0.8, 1.1, 160, 6);
      P.tree(ctx, 0.12, 0.8, 0.62, 77, ['#2c5226', '#47803a', '#86b84c']);
      // well
      const wx = 1.5; ctx.beginPath(); ctx.ellipse(wx, 0.8, 0.13, 0.03, 0, 0, 7); P.fillLine(ctx, '#3a2a20');
      ctx.beginPath(); ctx.moveTo(wx - 0.13, 0.8); ctx.lineTo(wx - 0.13, 0.88); ctx.quadraticCurveTo(wx, 0.92, wx + 0.13, 0.88); ctx.lineTo(wx + 0.13, 0.8); ctx.quadraticCurveTo(wx, 0.83, wx - 0.13, 0.8); P.fillLine(ctx, '#b8684a');
      ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = 0.0012; for (let y = 0.82; y < 0.9; y += 0.02) { ctx.beginPath(); ctx.moveTo(wx - 0.13, y); ctx.quadraticCurveTo(wx, y + 0.03, wx + 0.13, y); ctx.stroke(); }
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.rect(wx + s * 0.11 - 0.008, 0.66, 0.016, 0.15); P.fillLine(ctx, '#6a4426'); }
      ctx.beginPath(); ctx.rect(wx - 0.12, 0.66, 0.24, 0.012); P.fillLine(ctx, '#6a4426'); ctx.beginPath(); ctx.arc(wx, 0.672, 0.016, 0, 7); P.fillLine(ctx, '#8a8a8a');
      ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 0.0012; ctx.beginPath(); ctx.moveTo(wx + 0.015, 0.675); ctx.lineTo(wx + 0.015, 0.79); ctx.stroke();
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.07);
    },
  };

  SETS.building = {
    label: 'Pucca village building with a sign board (bank, school, medical store, panchayat office). Option: "sign": "GRAMIN BANK"', ground: 0.93, exterior: true,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      P.sky(ctx, XL, XR, -0.12, 0.66, o.time, o.seed);
      P.treeLine(ctx, XL, XR, 0.62, 0.08, '#4f7f45', o.seed + 1);
      P.tree(ctx, 0.08, 0.66, 0.4, 31); P.palm(ctx, 1.75, 0.66, 0.36, 0.04, 32);
      P.hut(ctx, 0.0, 0.7, 0.3, 0.2, { roof: 'tile', seed: 33, lights: o.lights }); P.hut(ctx, 1.85, 0.7, 0.3, 0.2, { roof: 'tile', seed: 34, lights: o.lights });
      P.dirt(ctx, XL, XR, 0.66, 1.12, o.seed + 4, '#cba26e');
      const x0 = 0.42, x1 = 1.36, top = 0.26, base = 0.74, wall = o.wall || '#eef0ee', trim = o.trim || '#2a4e9a';
      ctx.beginPath(); ctx.rect(x0, top, x1 - x0, base - top); P.fillLine(ctx, wall);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, base - top); ctx.clip(); P.dabs(ctx, x0, top, x1 - x0, base - top, '#b8bcc4', 40, 5, 0.04, 0.12); ctx.fillStyle = 'rgba(40,40,60,0.14)'; ctx.fillRect(x0, top, 0.08, base - top); ctx.restore();
      ctx.beginPath(); ctx.rect(x0 - 0.02, top - 0.03, x1 - x0 + 0.04, 0.035); P.fillLine(ctx, trim);
      ctx.beginPath(); ctx.rect(x0, base - 0.05, x1 - x0, 0.05); P.fillLine(ctx, trim);
      // shutter / entrance
      const cx = (x0 + x1) / 2; ctx.beginPath(); ctx.rect(cx - 0.12, 0.44, 0.24, 0.27); P.fillLine(ctx, o.open ? '#3a3026' : shade(trim, -0.1));
      if (!o.open) { ctx.strokeStyle = shade(trim, -0.4); ctx.lineWidth = 0.0016; for (let y = 0.45; y < 0.71; y += 0.012) { ctx.beginPath(); ctx.moveTo(cx - 0.12, y); ctx.lineTo(cx + 0.12, y); ctx.stroke(); } }
      else o.lights.push({ type: 'rect', x: cx - 0.12, y: 0.44, w: 0.24, h: 0.27, a: 0.8 });
      for (const wx of [x0 + 0.12, x1 - 0.12]) { ctx.beginPath(); ctx.rect(wx - 0.07, 0.44, 0.14, 0.14); P.fillLine(ctx, '#2a3240'); o.lights.push({ type: 'rect', x: wx - 0.07, y: 0.44, w: 0.14, h: 0.14, a: 1 }); ctx.strokeStyle = '#d8dce0'; ctx.lineWidth = 0.003; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(wx - 0.07 + i * 0.0233, 0.44); ctx.lineTo(wx - 0.07 + i * 0.0233, 0.58); ctx.stroke(); } }
      P.sign(ctx, cx, 0.34, 0.6, 0.1, o.sign || 'GRAMIN BANK', { bg: o.signBg || trim });
      ctx.beginPath(); ctx.rect(cx - 0.18, base, 0.36, 0.025); P.fillLine(ctx, '#b8b4ac'); ctx.beginPath(); ctx.rect(cx - 0.22, base + 0.025, 0.44, 0.025); P.fillLine(ctx, '#a8a49c');
      const tops = [P.pole(ctx, 0.3, 0.75, 0.5), P.pole(ctx, 1.55, 0.76, 0.52)]; P.wires(ctx, tops, 0.04);
      P.grass(ctx, XL, 0.35, 0.7, 1.1, 60, 7); P.grass(ctx, 1.45, XR, 0.7, 1.1, 60, 8);
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.07);
    },
  };

  // ---------------------------------------------------------------- interiors
  SETS.hut = {
    label: 'Inside a poor mud hut: barred windows with light shafts, chulha, clay pots, charpai', ground: 0.95, exterior: false,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      ctx.fillStyle = '#7a5a40'; ctx.fillRect(XL, -0.12, XR - XL, 0.92);
      const g = ctx.createRadialGradient(0.9, 0.4, 0.1, 0.9, 0.4, 1.2); g.addColorStop(0, 'rgba(232,190,140,0.55)'); g.addColorStop(1, 'rgba(40,24,14,0.6)'); ctx.fillStyle = g; ctx.fillRect(XL, -0.12, XR - XL, 0.92);
      P.dabs(ctx, XL, -0.1, XR - XL, 0.88, '#5a3e2a', 90, 3, 0.07, 0.2); P.dabs(ctx, XL, -0.1, XR - XL, 0.88, '#b08a64', 60, 4, 0.05, 0.16);
      // beams
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.rect(XL + i * 0.4, -0.12, 0.035, 0.2); P.fillLine(ctx, '#4a3020'); }
      ctx.beginPath(); ctx.rect(XL, 0.06, XR - XL, 0.03); P.fillLine(ctx, '#4a3020');
      // windows with bars + light shafts
      for (const wx of [0.36, 1.32]) {
        ctx.beginPath(); ctx.rect(wx - 0.07, 0.24, 0.14, 0.14); P.fillLine(ctx, '#f6e6bc'); o.lights.push({ type: 'rect', x: wx - 0.07, y: 0.24, w: 0.14, h: 0.14, a: 1, day: true });
        ctx.strokeStyle = '#3a281a'; ctx.lineWidth = 0.007; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(wx - 0.07 + i * 0.028, 0.24); ctx.lineTo(wx - 0.07 + i * 0.028, 0.38); ctx.stroke(); }
        ctx.beginPath(); ctx.rect(wx - 0.08, 0.23, 0.16, 0.16); P.line(ctx, 0.01, '#5a3a24');
        if (o.time !== 'night') { const sh = ctx.createLinearGradient(wx, 0.3, wx + 0.25, 0.95); sh.addColorStop(0, 'rgba(255,236,190,0.28)'); sh.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(wx - 0.07, 0.38); ctx.lineTo(wx + 0.07, 0.24); ctx.lineTo(wx + 0.42, 0.95); ctx.lineTo(wx + 0.12, 0.98); ctx.closePath(); ctx.fill(); }
      }
      // shelf with brass pots
      ctx.beginPath(); ctx.rect(0.72, 0.36, 0.34, 0.015); P.fillLine(ctx, '#5a3a24');
      P.pot(ctx, 0.78, 0.36, 0.06, '#c8962a'); P.pot(ctx, 0.88, 0.36, 0.05, '#a87420'); P.pot(ctx, 0.98, 0.36, 0.065, '#b0582c');
      // floor
      ctx.fillStyle = '#8a6646'; ctx.fillRect(XL, 0.78, XR - XL, 0.34);
      P.dabs(ctx, XL, 0.78, XR - XL, 0.34, '#6a4a32', 50, 6, 0.05, 0.2);
      ctx.beginPath(); ctx.moveTo(XL, 0.78); ctx.lineTo(XR, 0.78); P.line(ctx, 0.004, '#4a3020');
      // chulha + fire-blackened wall
      P.glow(ctx, 1.62, 0.6, 0.22, '#1a0e08', 0.5);
      ctx.beginPath(); ctx.moveTo(1.5, 0.82); ctx.quadraticCurveTo(1.5, 0.7, 1.62, 0.7); ctx.quadraticCurveTo(1.74, 0.7, 1.74, 0.82); ctx.closePath(); P.fillLine(ctx, '#a06a44');
      ctx.beginPath(); ctx.arc(1.62, 0.8, 0.035, Math.PI, 0); P.fillLine(ctx, '#1a0e08'); if (o.time === 'night') o.lights.push({ type: 'glow', x: 1.62, y: 0.78, r: 0.3, color: '#ff9a40', a: 0.6 });
      P.pot(ctx, 1.62, 0.7, 0.07, '#3a3a3a');
      P.charpai(ctx, 0.25, 0.92, 0.42);
      P.pot(ctx, 1.25, 0.86, 0.09); P.pot(ctx, 1.36, 0.87, 0.07, '#9a4a24'); P.pot(ctx, 1.3, 0.74, 0.06);
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.08);
    },
  };

  SETS.shop = {
    label: 'Kirana (grocery) shop interior: packed shelves, hanging sachets, counter with jars and scale, doorway to the street', ground: 0.96, exterior: false,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      ctx.fillStyle = '#9a8a74'; ctx.fillRect(XL, -0.12, XR - XL, 0.9);
      P.dabs(ctx, XL, -0.1, XR - XL, 0.85, '#6a5a48', 60, 3, 0.06, 0.15);
      // doorway to the bright street
      const dx0 = 1.32, dx1 = 1.78;
      ctx.save(); ctx.beginPath(); ctx.rect(dx0, 0.1, dx1 - dx0, 0.72); ctx.clip();
      P.sky(ctx, dx0, dx1, 0.1, 0.5, o.time, 3); P.hut(ctx, 1.48, 0.55, 0.22, 0.16, { roof: 'tile', seed: 2, lights: o.lights }); P.hut(ctx, 1.75, 0.56, 0.2, 0.16, { roof: 'tile', seed: 3, lights: o.lights }); P.dirt(ctx, dx0, dx1, 0.55, 0.85, 4, '#d8b480'); P.pole(ctx, 1.62, 0.56, 0.4); P.tree(ctx, 1.36, 0.56, 0.3, 9);
      ctx.restore();
      ctx.beginPath(); ctx.rect(dx0, 0.1, dx1 - dx0, 0.72); P.line(ctx, 0.012, '#4a5a7a');
      // shelves full of goods
      const r = KT.rng(7);
      const pal = ['#e8452c', '#f2b51e', '#2f8a4a', '#2a62c0', '#e86a1a', '#c02a5a', '#f4e04a', '#4ab0d8', '#8a3ab0', '#f0f0e8'];
      for (let row = 0; row < 5; row++) {
        const y = 0.06 + row * 0.13;
        ctx.beginPath(); ctx.rect(XL, y + 0.11, dx0 - XL - 0.04, 0.016); P.fillLine(ctx, '#7a4a26');
        let x = XL + 0.01;
        while (x < dx0 - 0.08) {
          const w = 0.025 + r() * 0.04, h = 0.05 + r() * 0.055, c = pal[Math.floor(r() * pal.length)];
          const kind = r();
          if (kind < 0.25) { ctx.beginPath(); ctx.moveTo(x, y + 0.11); ctx.lineTo(x, y + 0.11 - h * 0.85); ctx.quadraticCurveTo(x + w / 2, y + 0.11 - h * 1.05, x + w, y + 0.11 - h * 0.85); ctx.lineTo(x + w, y + 0.11); ctx.closePath(); P.fillLine(ctx, c, 0.0012); }
          else { ctx.beginPath(); ctx.rect(x, y + 0.11 - h, w, h); P.fillLine(ctx, c, 0.0012); ctx.fillStyle = r() < 0.5 ? '#ffffff' : shade(c, -0.3); ctx.fillRect(x + w * 0.15, y + 0.11 - h * 0.65, w * 0.7, h * 0.22); }
          x += w + 0.004;
        }
        ctx.fillStyle = 'rgba(30,20,10,0.22)'; ctx.fillRect(XL, y + 0.126, dx0 - XL - 0.04, 0.012);
      }
      // hanging sachet strips + bunting
      for (let i = 0; i < 9; i++) { const x = 0.05 + i * 0.14, c = pal[i % pal.length]; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.rect(x, -0.02 + k * 0.03, 0.04, 0.027); P.fillLine(ctx, k % 2 ? c : shade(c, 0.25), 0.0008); } }
      ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.0012; ctx.beginPath(); ctx.moveTo(XL, 0.0); ctx.quadraticCurveTo(0.6, 0.06, dx0, 0.0); ctx.stroke();
      // floor
      ctx.fillStyle = '#7a6a58'; ctx.fillRect(XL, 0.78, XR - XL, 0.34); P.dabs(ctx, XL, 0.78, XR - XL, 0.34, '#5a4a3a', 30, 8, 0.05, 0.2);
      ctx.beginPath(); ctx.moveTo(XL, 0.78); ctx.lineTo(XR, 0.78); P.line(ctx, 0.004, '#3a2a20');
      P.glow(ctx, 0.6, -0.05, 0.6, '#fff2c8', 0.25);
      ctx.fillStyle = '#f4f4ee'; ctx.fillRect(0.4, -0.06, 0.36, 0.014);
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.07);
    },
    fg(ctx, o) {
      // counter (characters standing behind it use "layer": "back")
      const XL = -0.1 * o.AR - 0.02;
      const x1 = 1.12, top = 0.74;
      ctx.beginPath(); ctx.rect(XL, top, x1 - XL, 0.4); P.fillLine(ctx, '#8a5430');
      ctx.beginPath(); ctx.rect(XL, top - 0.02, x1 - XL + 0.02, 0.03); P.fillLine(ctx, '#a86a3a');
      ctx.strokeStyle = '#5a3420'; ctx.lineWidth = 0.002; for (let x = XL + 0.1; x < x1; x += 0.16) { ctx.beginPath(); ctx.rect(x, top + 0.05, 0.12, 0.2); ctx.stroke(); }
      // jars
      const pal = ['#e8452c', '#f2b51e', '#8a4a20', '#e86a1a'];
      for (let i = 0; i < 4; i++) { const x = 0.1 + i * 0.09; ctx.beginPath(); KT.roundRect(ctx, x - 0.035, top - 0.13, 0.07, 0.11, 0.01); ctx.fillStyle = 'rgba(220,235,240,0.55)'; ctx.fill(); P.line(ctx, 0.0015); ctx.fillStyle = pal[i]; ctx.globalAlpha = 0.85; ctx.fillRect(x - 0.03, top - 0.08, 0.06, 0.055); ctx.globalAlpha = 1; ctx.beginPath(); ctx.rect(x - 0.03, top - 0.145, 0.06, 0.02); P.fillLine(ctx, '#d84a2a'); }
      // weighing scale
      const sx = 0.85; ctx.beginPath(); ctx.rect(sx - 0.005, top - 0.16, 0.01, 0.14); P.fillLine(ctx, '#6a6a6a'); ctx.beginPath(); ctx.moveTo(sx - 0.1, top - 0.16); ctx.lineTo(sx + 0.1, top - 0.16); P.line(ctx, 0.004, '#4a4a4a');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx + s * 0.1, top - 0.16); ctx.lineTo(sx + s * 0.07, top - 0.07); ctx.moveTo(sx + s * 0.1, top - 0.16); ctx.lineTo(sx + s * 0.13, top - 0.07); P.line(ctx, 0.001, '#4a4a4a'); ctx.beginPath(); ctx.ellipse(sx + s * 0.1, top - 0.065, 0.045, 0.012, 0, 0, Math.PI); P.fillLine(ctx, '#b0b4b8'); }
    },
  };

  SETS.office = {
    label: 'Government office / bank manager cabin: blinds, clock, calendar, files, desk', ground: 0.96, exterior: false,
    paint(ctx, o) {
      const A = o.AR, XL = -0.1 * A - 0.02, XR = 1.1 * A + 0.02;
      ctx.fillStyle = '#ead8b8'; ctx.fillRect(XL, -0.12, XR - XL, 0.9);
      const g = ctx.createLinearGradient(XL, 0, XR, 0); g.addColorStop(0, 'rgba(255,250,230,0.3)'); g.addColorStop(1, 'rgba(120,90,60,0.25)'); ctx.fillStyle = g; ctx.fillRect(XL, -0.12, XR - XL, 0.9);
      P.dabs(ctx, XL, -0.1, XR - XL, 0.85, '#c8b090', 30, 3, 0.06, 0.1);
      ctx.beginPath(); ctx.rect(XL, 0.7, XR - XL, 0.04); P.fillLine(ctx, '#c8b090');
      // window with blinds
      ctx.beginPath(); ctx.rect(0.08, 0.1, 0.42, 0.4); P.fillLine(ctx, '#f4f0e4', 0.003); o.lights.push({ type: 'rect', x: 0.08, y: 0.1, w: 0.42, h: 0.4, a: 0.6, day: true });
      ctx.strokeStyle = '#c8c0ae'; ctx.lineWidth = 0.004; for (let y = 0.115; y < 0.5; y += 0.016) { ctx.beginPath(); ctx.moveTo(0.085, y); ctx.lineTo(0.495, y); ctx.stroke(); }
      // clock, calendar, AC
      ctx.beginPath(); ctx.arc(1.0, 0.12, 0.045, 0, 7); P.fillLine(ctx, '#f8f8f4', 0.004); ctx.beginPath(); ctx.moveTo(1.0, 0.12); ctx.lineTo(1.0, 0.09); ctx.moveTo(1.0, 0.12); ctx.lineTo(1.022, 0.13); P.line(ctx, 0.003, '#222');
      ctx.beginPath(); ctx.rect(1.22, 0.18, 0.1, 0.15); P.fillLine(ctx, '#ffffff', 0.0015); const r = KT.rng(4); for (let i = 0; i < 20; i++) { ctx.fillStyle = ['#e84a4a', '#4a8ae8', '#f2b51e', '#4ab04a'][i % 4]; ctx.fillRect(1.23 + (i % 5) * 0.018, 0.22 + Math.floor(i / 5) * 0.025, 0.014, 0.018); } ctx.fillStyle = '#d82a2a'; ctx.fillRect(1.22, 0.18, 0.1, 0.03);
      ctx.beginPath(); KT.roundRect(ctx, 0.62, -0.06, 0.3, 0.09, 0.015); P.fillLine(ctx, '#f6f6f2');
      // office chair behind the desk
      ctx.beginPath(); KT.roundRect(ctx, 0.88, 0.4, 0.2, 0.3, 0.04); P.fillLine(ctx, '#2a2a2e');
      // cabinet + files
      ctx.beginPath(); ctx.rect(1.55, 0.4, 0.22, 0.4); P.fillLine(ctx, '#9aa0a6'); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.rect(1.57, 0.42 + i * 0.125, 0.18, 0.11); P.line(ctx, 0.002, '#6a7076'); ctx.fillStyle = '#5a5e64'; ctx.fillRect(1.64, 0.47 + i * 0.125, 0.04, 0.01); }
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.rect(1.56 + i * 0.04, 0.3, 0.035, 0.1); P.fillLine(ctx, ['#2a62c0', '#2a2a2a', '#c02a2a', '#2a62c0', '#2a2a2a'][i], 0.0012); }
      // tiled floor
      ctx.fillStyle = '#e6d8c0'; ctx.fillRect(XL, 0.74, XR - XL, 0.4);
      ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 0.002; for (let y = 0.78; y < 1.12; y += 0.06 + (y - 0.74) * 0.2) { ctx.beginPath(); ctx.moveTo(XL, y); ctx.lineTo(XR, y); ctx.stroke(); } for (let i = -12; i < 14; i++) { ctx.beginPath(); ctx.moveTo(0.89 + i * 0.07, 0.74); ctx.lineTo(0.89 + i * 0.2, 1.12); ctx.stroke(); }
      P.grain(ctx, XL, -0.12, XR - XL, 1.25, 0.05);
    },
    fg(ctx, o) {
      const x0 = 0.6, x1 = 1.38, top = 0.66;
      ctx.beginPath(); ctx.rect(x0, top, x1 - x0, 0.03); P.fillLine(ctx, '#a8662e');
      ctx.beginPath(); ctx.rect(x0 + 0.01, top + 0.03, x1 - x0 - 0.02, 0.3); P.fillLine(ctx, '#8a5022');
      ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 0.002; ctx.beginPath(); ctx.rect(x0 + 0.05, top + 0.06, 0.2, 0.22); ctx.rect(x1 - 0.25, top + 0.06, 0.2, 0.22); ctx.stroke();
      // things on the desk
      ctx.beginPath(); ctx.rect(0.7, top - 0.025, 0.14, 0.025); P.fillLine(ctx, '#f6f2e6', 0.0012); ctx.beginPath(); ctx.rect(0.72, top - 0.045, 0.12, 0.02); P.fillLine(ctx, '#e8d8a8', 0.0012);
      ctx.beginPath(); ctx.rect(1.18, top - 0.06, 0.12, 0.06); P.fillLine(ctx, '#2a62c0', 0.0012); ctx.beginPath(); ctx.rect(1.2, top - 0.08, 0.1, 0.02); P.fillLine(ctx, '#c02a2a', 0.0012);
      ctx.beginPath(); ctx.rect(0.98, top - 0.05, 0.03, 0.05); P.fillLine(ctx, '#3a3a3a', 0.0012); ctx.beginPath(); ctx.moveTo(0.99, top - 0.05); ctx.lineTo(0.985, top - 0.08); ctx.moveTo(1.0, top - 0.05); ctx.lineTo(1.01, top - 0.085); P.line(ctx, 0.002, '#2a4ac0');
    },
  };

  // ---------------------------------------------------------------- builder with time-of-day grading
  const cache = new Map();
  KT.buildSet = function (name, time, W, H, opts = {}) {
    const key = `${name}|${time}|${W}x${H}|${JSON.stringify(opts)}`;
    if (cache.has(key)) return cache.get(key);
    const S = SETS[name]; if (!S) throw new Error(`unknown location "${name}" (known: ${Object.keys(SETS).join(', ')})`);
    const R = 1.5;                                        // supersampling so zoomed-in shots stay crisp
    const FH = H * R, AR = W / H;
    const bw = Math.round(AR * FH * 1.2), bh = Math.round(FH * 1.2);
    const mk = () => { const c = KT.makeCanvas(bw, bh), x = c.getContext('2d'); x.setTransform(FH, 0, 0, FH, 0.1 * AR * FH, 0.1 * FH); return [c, x]; };
    const o = Object.assign({ AR, time, seed: KT.strHash(name + (opts.variant || '')) % 1000, lights: [] }, opts);
    const [bg, bx] = mk(); const [sky, sx] = mk();
    P._skyCtx = sx; try { S.paint(bx, o); } finally { P._skyCtx = null; }
    let fg = null; if (S.fg) { const [c, x] = mk(); S.fg(x, o); fg = c; }
    grade(bg, time, S.exterior, o, AR, FH); if (fg) grade(fg, time, S.exterior, { lights: [] }, AR, FH);
    // put the sky under the graded scene
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.drawImage(bg, 0, 0);
    const out0 = sky;
    const out = { bg: out0, fg, ground: opts.ground || S.ground, scale: FH, AR, dim: !S.exterior };
    cache.set(key, out); return out;
  };
  function grade(canvas, time, exterior, o, AR, FH) {
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (time === 'night' || time === 'evening') {
      const tint = KT.makeCanvas(canvas.width, canvas.height), t = tint.getContext('2d');
      t.drawImage(canvas, 0, 0);
      t.globalCompositeOperation = 'multiply';
      t.fillStyle = time === 'night' ? (exterior ? '#5c6cb0' : '#9a8478') : '#f0c4a0';
      t.fillRect(0, 0, tint.width, tint.height);
      if (time === 'night') { t.globalCompositeOperation = 'multiply'; t.fillStyle = exterior ? '#c4ccec' : '#c8b0a0'; t.fillRect(0, 0, tint.width, tint.height); }
      t.globalCompositeOperation = 'destination-in'; t.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(tint, 0, 0);
    }
    ctx.setTransform(FH, 0, 0, FH, 0.1 * AR * FH, 0.1 * FH);
    if (time === 'night' || time === 'evening') {
      for (const L of o.lights || []) {
        if (L.day) continue;
        if (L.type === 'rect') {
          ctx.fillStyle = time === 'night' ? '#f6b54a' : '#f8c870'; ctx.globalAlpha = (L.a || 1) * (time === 'night' ? 0.95 : 0.6); ctx.fillRect(L.x, L.y, L.w, L.h); ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, L.x + L.w / 2, L.y + L.h / 2, Math.max(L.w, L.h) * 1.6, '#ff9a30', time === 'night' ? 0.28 : 0.15); ctx.globalCompositeOperation = 'source-over';
        } else if (L.type === 'glow') { ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, L.x, L.y, L.r, L.color, L.a); ctx.globalCompositeOperation = 'source-over'; }
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
})();
