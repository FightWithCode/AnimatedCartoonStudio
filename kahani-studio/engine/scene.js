// scene.js — turns build/timeline.json (made by tools/plan.py) into frames.
// Every frame is a pure function of the frame index: no randomness, no wall clock.
(function () {
  const KT = window.KT;
  const { clamp, lerp, smooth, easeInOut, noise1, hash, strHash } = KT;

  // screen-space framing: character height (fraction of frame height), feet line, background zoom
  const FRAMING = {
    wide:   { h: 0.46, feet: null, bg: 1.0 },
    full:   { h: 0.78, feet: 0.975, bg: 1.12 },
    medium: { h: 1.2, feet: 1.3, bg: 1.22 },
    mcu:    { h: 1.55, feet: 1.71, bg: 1.32 },
    close:  { h: 2.3, feet: 2.5, bg: 1.45 },
  };
  KT.FRAMING = FRAMING;
  const AUTO_GESTURES = ['explain', 'idle', 'open', 'explain2', 'chest', 'explain', 'shrug', 'idle', 'point'];

  // villagers for crowd fill (deterministic from their index)
  const EXTRA_LOOKS = [
    { outfit: 'kurta-dhoti', topColor: '#d8c070' }, { gender: 'f', outfit: 'saree', topColor: '#2a8a4a', bottomColor: '#e0602a' },
    { outfit: 'shirt-pants', topColor: '#4ab0c8' }, { gender: 'f', outfit: 'saree', topColor: '#c02a4a', bottomColor: '#f0b020' },
    { outfit: 'vest-kurta-dhoti', vest: '#3a5a8a', age: 'old', hair: 'balding' }, { outfit: 'shirt-dhoti', topColor: '#8a3a2a', scarf: '#f0f0e8' },
    { gender: 'f', outfit: 'saree', topColor: '#6a2a8a', bottomColor: '#3a7ad0', pattern: 'dots' }, { outfit: 'lungi', topColor: '#e8e2d0' },
    { age: 'child', outfit: 'school' }, { outfit: 'kurta-pajama', headwear: 'topi', age: 'old' },
  ];

  const S = (KT.Scene = {});
  S.init = function (T, canvas, opts) {
    S.T = T; S.canvas = canvas; S.ctx = canvas.getContext('2d'); S.W = canvas.width; S.H = canvas.height; S.fps = T.fps;
    S.opts = opts || {};
    S.cast = {}; for (const [id, c] of Object.entries(T.cast || {})) S.cast[id] = KT.normalizeCast(id, c);
    S.extras = EXTRA_LOOKS.map((l, i) => KT.normalizeCast('extra' + i, l));
    S.images = {};
    S.charLayer = KT.makeCanvas(S.W, S.H);
    S.errors = new Set();
  };
  S.preload = async function (base) {
    const jobs = [];
    for (const [name, L] of Object.entries(S.T.locations || {})) {
      for (const [key, file] of Object.entries(L.images || {})) {
        jobs.push(new Promise(res => { const im = new Image(); im.onload = () => { S.images[`${name}|${key}`] = im; res(); }; im.onerror = () => { S.errors.add(`background image not found: ${file}`); res(); }; im.src = base + file; }));
      }
    }
    await Promise.all(jobs);
  };
  S.totalFrames = () => Math.round(S.T.duration * S.fps);
  S.shotAt = (t) => { const sh = S.T.shots; let lo = 0, hi = sh.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (sh[m].start <= t) lo = m; else hi = m - 1; } return sh[lo]; };

  // ---------------------------------------------------------------- set lookup (code-painted or image)
  function getSet(shot) {
    const name = shot.location, time = shot.time || 'day';
    const L = (S.T.locations || {})[name] || {};
    const img = S.images[`${name}|${time}`] || S.images[`${name}|day`] && time === 'day' && S.images[`${name}|day`];
    if (img) return { image: img, ground: L.ground || 0.9, dim: !!L.interior, fgSet: null };
    const base = L.base || name;
    const set = KT.buildSet(base, time, S.W, S.H, Object.assign({}, L.options || {}, shot.setOptions || {}));
    return set;
  }

  // ---------------------------------------------------------------- per-character animation state
  function poseAt(shot, ch, t, idx) {
    // pose keyframes: the shot's base pose, then per-line overrides / auto gestures for the speaker
    const keys = [{ t: shot.start - 1, pose: ch.pose || 'idle' }];
    shot.lines.forEach((ln, li) => {
      const act = (ln.acts || {})[ch.id];
      if (act && act.pose) keys.push({ t: ln.start, pose: act.pose });
      else if (ln.speaker === ch.id && !ch.pose && !ch.walk) keys.push({ t: ln.start, pose: AUTO_GESTURES[(strHash(ch.id) + li + idx) % AUTO_GESTURES.length] });
      else if (ln.speaker !== ch.id && keys.length > 1 && !(act && act.pose)) keys.push({ t: ln.start, pose: ch.pose || 'idle' });
    });
    let k = 0; while (k + 1 < keys.length && keys[k + 1].t <= t) k++;
    const cur = KT.POSES[keys[k].pose] || KT.POSES.idle, prev = k > 0 ? KT.POSES[keys[k - 1].pose] || KT.POSES.idle : cur;
    const b = easeInOut((t - keys[k].t) / 0.35);
    const mixArm = (a, c) => [lerp(a[0], c[0], b), lerp(a[1], c[1], b), b > 0.5 ? c[2] : a[2]];
    return { L: mixArm(prev.L, cur.L), B: mixArm(prev.B, cur.B), name: keys[k].pose };
  }
  function lineAt(shot, t) { for (const ln of shot.lines) if (t >= ln.start && t < ln.end) return ln; return null; }
  function attrAt(shot, ch, t, key, def) {
    let v = ch[key] !== undefined ? ch[key] : def;
    for (const ln of shot.lines) { if (ln.start > t) break; const a = (ln.acts || {})[ch.id]; if (a && a[key] !== undefined) v = a[key]; }
    return v;
  }
  function mouthAt(c, t, ln) {
    if (!ln || ln.speaker !== c.id || t > ln.end - 0.12 || t < ln.start + 0.04) return 0;
    const s = t * 7.2;
    const v = noise1(s, c.seed % 97) * 0.75 + noise1(s * 2.3, 5) * 0.25;
    const phrase = noise1(t * 1.4, c.seed % 31 + 3) > 0.22 ? 1 : 0.1;
    return clamp((v - 0.22) * 1.7, 0, 1) * phrase;
  }
  function blinkAt(c, t) {
    const period = 3.2 + (c.seed % 13) * 0.12; const k = Math.floor((t + (c.seed % 7)) / period); const at = k * period - (c.seed % 7) + 0.4 + hash(k + c.seed) * 1.6;
    const d = t - at; return d >= 0 && d < 0.16 ? Math.sin((d / 0.16) * Math.PI) : 0;
  }

  // ---------------------------------------------------------------- frame
  S.render = function (frame) {
    const ctx = S.ctx, W = S.W, H = S.H;
    const t = (frame + 0.5) / S.fps;
    const shot = S.shotAt(t);
    const lt = t - shot.start, dur = shot.end - shot.start, p = clamp(lt / dur, 0, 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    let set; try { set = getSet(shot); } catch (e) { S.errors.add(`${shot.id}: ${e.message}`); return; }
    const fr = FRAMING[shot.framing || 'wide'] || FRAMING.wide;
    const chars = (shot.chars || []).filter(ch => S.cast[ch.id] || ch.extra !== undefined);
    // camera
    const cam = shot.cam || 'push';
    const e = easeInOut(p);
    let zoom = 1, panX = 0;
    if (cam === 'push') zoom = lerp(1, 1.05, e); else if (cam === 'pull') zoom = lerp(1.06, 1, e); else if (cam === 'zoom') zoom = lerp(1, 1.18, e);
    else if (cam === 'panL') panX = lerp(0.035, -0.035, e); else if (cam === 'panR') panX = lerp(-0.035, 0.035, e); else zoom = lerp(1, 1.015, e);
    if (shot.camOffset) panX += shot.camOffset;
    const focusX = chars.length ? chars.reduce((a, ch) => a + (ch.x ?? 0.5), 0) / chars.length : 0.5;
    const bgZoom = fr.bg * zoom * (set.image ? 1.06 : 1);
    // ---- background
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    const bgFx = lerp(0.5, focusX, fr.bg > 1 ? 0.6 : 0) * W, bgFy = H * 0.55;
    const drawSetLayer = (img, isImage) => {
      ctx.save();
      ctx.translate(bgFx + panX * W * 0.6, bgFy); ctx.scale(fr.bg * (set.image ? 1.06 : 1), fr.bg * (set.image ? 1.06 : 1)); ctx.translate(-bgFx, -bgFy);
      if (isImage) { const s = Math.max(W / img.width, H / img.height); ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s); }
      else { const k = W / (set.AR * set.scale); ctx.drawImage(img, -0.1 * W, -0.1 * H, img.width * k, img.height * k); }
      ctx.restore();
    };
    drawSetLayer(set.image || set.bg, !!set.image);
    ctx.restore();
    // ---- characters
    const feetY = fr.feet != null ? fr.feet : set.ground;
    const toDraw = chars.map((ch, i) => {
      const c = ch.extra !== undefined ? S.extras[ch.extra % S.extras.length] : S.cast[ch.id];
      let x = ch.x ?? 0.5, walkPh = null;
      if (ch.walk) {
        const w0 = shot.start + (ch.walk.start || 0), w1 = shot.start + (ch.walk.end ?? dur);
        const wp = clamp((t - w0) / Math.max(0.1, w1 - w0), 0, 1);
        const from = ch.walk.from ?? x, to = ch.walk.to ?? x; x = lerp(from, to, smooth(wp) * 0.15 + wp * 0.85);
        if (wp > 0 && wp < 1) walkPh = (t - w0) * 7.5;
      }
      const sc = ch.scale || 1;
      const hPx = fr.h * H * c.height * sc;
      const yFeet = (feetY + (ch.y || 0)) * H - (sc < 1 && fr.feet == null ? (1 - sc) * 0.12 * H : 0);
      return { ch, c, x, hPx, yFeet, walkPh, i };
    });
    // facing: toward the others unless set
    for (const d of toDraw) {
      let f = attrAt(shot, d.ch, t, 'facing', null);
      if (d.ch.walk && d.walkPh != null) f = (d.ch.walk.to ?? d.x) >= (d.ch.walk.from ?? d.x) ? 'right' : 'left';
      if (!f) { const others = toDraw.filter(o => o !== d && !o.ch.extra); const cx = others.length ? others.reduce((a, o) => a + o.x, 0) / others.length : 0.5; f = cx >= d.x ? 'right' : 'left'; }
      d.facing = f === 'left' ? -1 : 1;
    }
    const ln = lineAt(shot, t);
    const back = toDraw.filter(d => d.ch.layer === 'back'), front = toDraw.filter(d => d.ch.layer !== 'back');
    const depthSort = a => a.sort((p, q) => (p.hPx - q.hPx) || (p.yFeet - q.yFeet));
    const tint = shot.time === 'night' ? 'brightness(0.74) saturate(0.88) hue-rotate(-6deg)' : shot.time === 'evening' ? 'brightness(0.93) sepia(0.12) saturate(1.05)' : set.dim ? 'brightness(0.9) sepia(0.08)' : 'none';
    const drawGroup = (group) => {
      if (!group.length) return;
      const L = S.charLayer, lc = L.getContext('2d');
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, W, H);
      lc.translate(W / 2, H / 2); lc.scale(zoom, zoom); lc.translate(-W / 2, -H / 2); lc.translate(panX * W, 0);
      for (const d of depthSort(group)) {
        const { ch, c } = d;
        // floor shadow
        if (fr.feet == null || shot.framing === 'full') { const g = lc.createRadialGradient(d.x * W, d.yFeet, 0, d.x * W, d.yFeet, d.hPx * 0.18); g.addColorStop(0, 'rgba(30,18,8,0.32)'); g.addColorStop(1, 'rgba(30,18,8,0)'); lc.save(); lc.translate(d.x * W, d.yFeet); lc.scale(1, 0.22); lc.translate(-d.x * W, -d.yFeet); lc.fillStyle = g; lc.fillRect(d.x * W - d.hPx * 0.2, d.yFeet - d.hPx * 0.2, d.hPx * 0.4, d.hPx * 0.4); lc.restore(); }
        const talking = ln && ln.speaker === ch.id;
        let arms = poseAt(shot, ch, t, d.i);
        const seedT = t + (c.seed % 100) * 0.37;
        if (talking && arms.name !== 'idle' && arms.name !== 'folded' && arms.name !== 'namaste') { arms = { L: [arms.L[0] + Math.sin(seedT * 2.3) * 4, arms.L[1] + Math.sin(seedT * 4.4) * 8, arms.L[2]], B: arms.B, name: arms.name }; }
        if (d.walkPh != null) { const s = Math.sin(d.walkPh); arms = { L: [s * 16 + 4, 8 + Math.max(0, s) * 10, 'relaxed'], B: [-s * 16 + 4, 8 + Math.max(0, -s) * 10, 'relaxed'] }; }
        const expr = attrAt(shot, ch, t, 'expr', 'neutral');
        const view = attrAt(shot, ch, t, 'view', '3q');
        try {
          KT.drawPuppet(lc, c, {
            x: d.x * W, y: d.yFeet, h: d.hPx, facing: d.facing, view, arms, expr,
            mouth: mouthAt(c, t, ln), blink: blinkAt(c, t), lookX: 0,
            headRot: talking ? Math.sin(seedT * 2.9) * 2.2 + Math.sin(seedT * 1.1) * 1.2 : Math.sin(seedT * 0.7) * 1.4,
            headDY: talking ? Math.abs(Math.sin(seedT * 5.2)) * -0.35 : 0,
            bob: d.walkPh != null ? -Math.abs(Math.sin(d.walkPh)) * 1.4 : Math.sin(seedT * 1.9) * 0.22,
            walk: c.bottom === 'pants' || c.bottom === 'shorts' || c.bottom === 'pajama' ? d.walkPh : (d.walkPh != null ? d.walkPh : null),
            prop: attrAt(shot, ch, t, 'prop', null),
            maxLinePx: 2.1 * H / 720,
          });
        } catch (err) { S.errors.add(`${shot.id}/${ch.id}: ${err.message}`); }
      }
      ctx.save(); ctx.filter = tint; ctx.drawImage(L, 0, 0); ctx.restore();
    };
    drawGroup(back);
    if (set.fg) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); drawSetLayer(set.fg, false); ctx.restore(); }
    drawGroup(front);
    // ---- grade: soft vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(20,10,5,${shot.time === 'night' ? 0.4 : 0.2})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // ---- overlays
    if (shot.title) drawTitle(ctx, shot.title, shot.subtitle, lt, dur);
    if (S.opts.captions && ln && ln.text) drawCaption(ctx, ln, t);
    // ---- fades
    let fade = 0;
    if (shot.fadeIn && lt < shot.fadeIn) fade = 1 - lt / shot.fadeIn;
    if (shot.fadeOut && dur - lt < shot.fadeOut) fade = Math.max(fade, 1 - (dur - lt) / shot.fadeOut);
    if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(fade, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
    if (S.opts.debug) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(8, 8, 360, 28); ctx.fillStyle = '#fff'; ctx.font = `16px monospace`; ctx.fillText(`${shot.id} ${shot.location}/${shot.framing} t=${t.toFixed(2)}`, 14, 28); }
  };

  const FONT = '"Baloo 2", "Hind", "Nirmala UI", "Mangal", sans-serif';
  function wrap(ctx, text, maxW) { const words = String(text).split(/\s+/); const lines = []; let cur = ''; for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; } if (cur) lines.push(cur); return lines; }
  function drawCaption(ctx, ln, t) {
    const W = S.W, H = S.H, fs = Math.round(H * (S.opts.captionSize || 0.04));
    const c = S.cast[ln.speaker];
    const label = S.opts.speakerLabels !== false && ln.speaker && ln.speaker !== 'narrator' ? ((c && c.name) || ln.speaker) + ': ' : '';
    ctx.save();
    ctx.font = `600 ${fs}px ${FONT}`; ctx.textBaseline = 'middle';
    const lines = wrap(ctx, label + ln.text, W * 0.78);
    const lh = fs * 1.32, boxH = lines.length * lh + fs * 0.5, y0 = H - boxH - H * 0.035;
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); KT.roundRect(ctx, W / 2 - maxW / 2 - fs * 0.6, y0, maxW + fs * 1.2, boxH, fs * 0.35); ctx.fill();
    lines.forEach((l, i) => {
      const y = y0 + fs * 0.25 + lh * (i + 0.5), w = ctx.measureText(l).width; let x = W / 2 - w / 2;
      ctx.lineJoin = 'round'; ctx.lineWidth = fs * 0.14; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      if (i === 0 && label && l.startsWith(label)) {
        ctx.strokeText(label, x, y); ctx.fillStyle = '#ffd34a'; ctx.fillText(label, x, y); const lw = ctx.measureText(label).width;
        const rest = l.slice(label.length); ctx.strokeText(rest, x + lw, y); ctx.fillStyle = '#ffffff'; ctx.fillText(rest, x + lw, y);
      } else { ctx.strokeText(l, x, y); ctx.fillStyle = ln.speaker === 'narrator' ? '#f4ecd8' : '#ffffff'; ctx.fillText(l, x, y); }
    });
    ctx.restore();
  }
  function drawTitle(ctx, title, sub, lt, dur) {
    const W = S.W, H = S.H; const a = clamp(Math.min(lt / 0.5, (dur - lt) / 0.4), 0, 1); const pop = 0.85 + 0.15 * easeInOut(clamp(lt / 0.5, 0, 1));
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H * 0.4); ctx.scale(pop, pop);
    const fs = Math.round(H * 0.13); ctx.font = `800 ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = fs * 0.15; ctx.shadowOffsetY = fs * 0.06;
    ctx.lineJoin = 'round'; ctx.lineWidth = fs * 0.2; ctx.strokeStyle = '#6a1208'; ctx.strokeText(title, 0, 0); ctx.shadowColor = 'transparent';
    const g = ctx.createLinearGradient(0, -fs / 2, 0, fs / 2); g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffc21a'); g.addColorStop(1, '#ff7a10'); ctx.fillStyle = g; ctx.fillText(title, 0, 0);
    if (sub) { const f2 = Math.round(fs * 0.36); ctx.font = `700 ${f2}px ${FONT}`; ctx.lineWidth = f2 * 0.22; ctx.strokeStyle = '#2a1408'; ctx.strokeText(sub, 0, fs * 0.85); ctx.fillStyle = '#ffffff'; ctx.fillText(sub, 0, fs * 0.85); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- QC helpers
  S.renderCast = function () {
    const ctx = S.ctx, W = S.W, H = S.H; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const set = KT.buildSet('village', 'day', W, H); const k = W / (set.AR * set.scale); ctx.drawImage(set.bg, -0.1 * W, -0.1 * H, set.bg.width * k, set.bg.height * k);
    const ids = Object.keys(S.cast); const n = ids.length;
    ids.forEach((id, i) => {
      const c = S.cast[id]; const x = W * (i + 0.5) / n; const h = H * 0.62 * c.height;
      KT.drawPuppet(ctx, c, { x, y: H * 0.86, h, facing: 1, view: '3q', arms: { L: KT.POSES.idle.L, B: KT.POSES.idle.B }, expr: 'smile', mouth: 0, blink: 0, maxLinePx: 2 * H / 720 });
      ctx.font = `700 ${Math.round(H * 0.03)}px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#000'; for (const [txt, yy] of [[c.name || id, 0.93], [id, 0.97]]) { ctx.strokeText(txt, x, H * yy); ctx.fillStyle = '#fff'; ctx.fillText(txt, x, H * yy); }
    });
  };
  S.renderSet = function (name, time) {
    const ctx = S.ctx, W = S.W, H = S.H; ctx.setTransform(1, 0, 0, 1, 0, 0);
    const set = KT.buildSet(name, time, W, H); const k = W / (set.AR * set.scale);
    ctx.drawImage(set.bg, -0.1 * W, -0.1 * H, set.bg.width * k, set.bg.height * k);
    if (set.fg) ctx.drawImage(set.fg, -0.1 * W, -0.1 * H, set.fg.width * k, set.fg.height * k);
    ctx.strokeStyle = 'rgba(255,0,0,0.6)'; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(0, set.ground * H); ctx.lineTo(W, set.ground * H); ctx.stroke(); ctx.setLineDash([]);
  };
})();
