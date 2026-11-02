// Story builder: write an episode as a sequence of narration / dialogue LINES and let the builder derive the timing.
// It produces the plain episode object the Stage already understands ({ meta, narration, captions, shots }), so episodes
// written by hand (ep01) and episodes written with this builder play through exactly the same engine.
//
//   const story = new Story({ id: 'ep02', title: '…', rig: 2 }, voices);
//   story.shot('s1', { scene: 'village-street', sky: 'day', cam: [2000, 620, 1.1], camTo: [2300, 620, 1.2],
//                      props: [...], cast: { kishan: { x: 1400, y: 790, facing: 1 } } }, (s) => {
//     s.n('एक छोटा सा गाँव था।');                                    // narrator caption, shot grows by its reading time
//     s.say('kishan', 'नमस्ते!', { g: 'speak', emote: { smile: .8 } });  // dialogue: caption + mouth + gesture + listeners look
//     s.walk('kishan', 3, 1800); s.wait(3);                            // actor tuples use seconds RELATIVE to the cursor
//     s.act('kishan', ['hold', 'plate', -0.5, END, 'L']);              // END = until the end of this shot
//   });
//   export default story.build();
//
// An actor that appears in several consecutive shots without x/y/facing keeps its last position and facing.

export const END = 1e6;
const TIME_FIELDS = { walk: [1, 2], say: [1, 2], do: [2, 3], hold: [2, 3], look: [1, 2], face: [1], sit: [1, 2], crouch: [1, 2], emote: [1, 2], lean: [1, 2], fx: [1, 2] };
const codePoints = (s) => [...s.replace(/[\s.,!?।—…:;'"“”‘’()\-]/g, '')].length;
/** Reading time for a caption: enough for a child to read it comfortably (≈ 11 letters / s plus a short settle). */
export const readTime = (text, o = {}) => (o.base ?? 0.9) + codePoints(text) * (o.perChar ?? 0.088);

export class Story {
  /** opts.clips = { lineNumber: seconds } from tools/clips.mjs: a line with a recorded clip lasts exactly as long as the clip */
  constructor(meta, voices = {}, opts = {}) {
    this.meta = Object.assign({ fps: 30, width: 1920, height: 1080 }, meta); this.voices = voices; this.clips = opts.clips || {}; this.lineNo = 0;
    this.t = 0; this.shots = []; this.captions = []; this.segs = []; this.memory = {};
  }
  shot(id, spec, fn) {
    const s = new Shot(this, id, spec); fn(s); this.shots.push(s.finish()); return this;
  }
  build() {
    const dur = +this.t.toFixed(3), segs = this.segs.slice().sort((a, b) => a.start - b.start), narration = []; let cur = 0, n = 0;
    for (const g of segs) { if (g.start > cur + 1e-6) narration.push({ id: 'b' + n++, start: cur, end: g.start, text: '' }); narration.push({ id: 'n' + n++, start: g.start, end: g.end, text: g.text }); cur = g.end; }
    if (cur < dur - 1e-6) narration.push({ id: 'b' + n++, start: cur, end: dur, text: '' });
    return { meta: Object.assign({}, this.meta, { duration: dur }), narration, captions: this.captions, shots: this.shots };
  }
}

class Shot {
  constructor(story, id, spec) {
    this.S = story; this.id = id; this.spec = spec; this.t0 = story.t; this.c = 0; this.acts = {}; this.cards = []; this.lastGest = {}; this.speaker = story.lastSpeaker || null;
    this.cast = {}; this.props = (spec.props || []).map((p) => Object.assign({}, p, p.script ? { script: p.script.map((x) => x.slice()) } : {}));
    for (const id in spec.cast || {}) {
      const c = Object.assign({}, story.memory[id] || {}, spec.cast[id]);
      if (c.x == null || c.y == null) throw new Error(`shot ${this.id}: actor ${id} needs x/y (no earlier position to continue from)`);
      this.cast[id] = c; this.acts[id] = [];
    }
    this.ids = Object.keys(this.cast);
  }
  abs(rel) { return rel === END ? END : +(this.t0 + this.c + rel).toFixed(3); }
  /** Add an actor tuple; its time fields are seconds relative to the cursor (END = end of shot). */
  act(id, tuple) {
    if (!this.acts[id]) throw new Error(`shot ${this.id}: unknown actor ${id}`);
    const t = tuple.slice(); for (const i of TIME_FIELDS[t[0]] || []) t[i] = this.abs(t[i]); this.acts[id].push(t); return t;
  }
  /** shorthand: gesture from now for dt seconds (END = to the end of the shot) */
  do(id, name, dt, opts = {}) { return this.act(id, ['do', name, 0, dt, opts]); }
  walk(id, dur, x, y) { return this.act(id, y == null ? ['walk', 0, dur, x] : ['walk', 0, dur, x, y]); }
  /** move a prop (e.g. a cart): from t0 to t1 seconds relative to the cursor */
  walkProp(id, t0, t1, x, y) { const p = this.props.find((q) => q.id === id); (p.script ||= []).push(['walk', this.abs(t0), this.abs(t1), x].concat(y == null ? [] : [y])); }
  look(id, target, dt = END) { return this.act(id, ['look', 0, dt, target]); }
  wait(dt) { this.c += dt; return this; }
  /** full-frame card (title / note) shown from the cursor for dur seconds; block = also advance the cursor */
  card(o, dur, block = true) { this.cards.push(Object.assign({}, o, { start: this.abs(0), end: this.abs(dur) })); if (block) this.c += dur; return this; }

  _line(who, text, o) {
    const no = ++this.S.lineNo, clip = this.S.clips[no], dur = clip != null ? clip + 0.1 : o.dur ?? readTime(text), pause = o.pause ?? 0.45, v = this.S.voices[who] || {}, a = this.abs(0);
    this.S.captions.push({ start: +(a + 0.05).toFixed(3), end: +(a + dur).toFixed(3), text, wrap: true, label: v.label, color: v.color });
    this.S.segs.push({ start: a, end: +(a + dur + pause).toFixed(3), text: (v.label ? v.label + ': ' : '') + text });
    return { dur, pause };
  }
  /** narrator line (voice-over) */
  n(text, o = {}) { const { dur, pause } = this._line('n', text, o); for (const id of this.ids) if (o.look?.[id]) this.act(id, ['look', 0, dur, o.look[id]]); this.c += dur + pause; return this; }
  /** dialogue line: caption with speaker tag, lip-flap, gesture phrasing, and everybody else looks at the speaker */
  say(who, text, o = {}) {
    const { dur, pause } = this._line(who, text, o), c0 = this.c;
    if (this.acts[who]) {
      this.act(who, ['say', 0.1, dur - 0.12]);
      const g = o.g ?? 'speak';
      if (g) {
        const last = this.lastGest[who], a = this.abs(-0.15), b = this.abs(dur + 0.1);
        if (last && last.g === g && a - last.t[3] <= 0.8 && !o.gopts) last.t[3] = b; // consecutive lines of the same speaker keep one phrase going
        else this.lastGest[who] = { g, t: this.act(who, ['do', g, -0.15, dur + 0.1, Object.assign({ seed: this.ids.indexOf(who) + 1 }, o.gopts || {})]) };
      }
      if (o.emote) this.act(who, ['emote', -0.1, dur + 0.2, o.emote]);
      if (o.fx) this.act(who, ['fx', -0.1, END, o.fx]); // floating effect (swirl / sparkle / question) that stays until the end of the shot
      const to = o.to ?? (this.speaker && this.speaker !== who && this.acts[this.speaker] ? this.speaker : this.ids.find((i) => i !== who));
      if (to && o.look !== false) this.act(who, ['look', -0.05, dur + 0.1, to]);
      this.speaker = who; this.S.lastSpeaker = who;
    }
    for (const id of this.ids) if (id !== who && this.cast[id].listen !== false && this.acts[who]) this.act(id, ['look', -0.05, dur + 0.1, who]);
    for (const [id, r] of Object.entries(o.react || {})) { // listeners' reactions: { sajan: { g: 'fear', emote: {...}, fx: '...' } } — they hold until the end of the shot
      if (r.g) this.act(id, ['do', r.g, -0.1, END, r.gopts || {}]); if (r.emote) this.act(id, ['emote', -0.1, END, r.emote]); if (r.fx) this.act(id, ['fx', -0.1, END, r.fx]);
    }
    this.c = c0 + dur + pause; return this;
  }
  finish() {
    // a shot never ends while somebody (or a cart) is still walking: extend it until the last scripted walk has finished
    let end = this.t0 + this.c; const lastWalk = (list) => { for (const t of list) if (t[0] === 'walk' && t[2] < END) end = Math.max(end, t[2] + 0.35); };
    for (const id of this.ids) lastWalk(this.acts[id]); for (const p of this.props) lastWalk(p.script || []);
    const t1 = +end.toFixed(3), sp = this.spec, S = this.S; S.t = t1;
    const fix = (t) => t.map((v) => (v === END ? t1 + 0.4 : v));
    const cast = {}, mem = {};
    for (const id of this.ids) {
      const c = Object.assign({}, this.cast[id]); delete c.listen; const script = this.acts[id].map(fix); c.script = script; cast[id] = c;
      // remember where this actor ends up (for the next shot)
      let x = c.x, y = c.y, f = c.facing ?? 1; const ev = [];
      for (const t of script) { if (t[0] === 'walk') ev.push([t[1], 'w', t]); else if (t[0] === 'face') ev.push([t[1], 'f', t]); }
      ev.sort((a, b) => a[0] - b[0]);
      for (const [, k, t] of ev) { if (k === 'w') { const dx = t[3] - x; if (Math.abs(dx) > 1) f = Math.sign(dx); x = t[3]; if (t[4] != null) y = t[4]; } else f = t[2]; }
      mem[id] = { x, y, facing: f };
      if (c.scale) mem[id].scale = c.scale;
    }
    Object.assign(S.memory, mem);
    const camKeys = sp.camKeys ? sp.camKeys.map(([f, x, y, z]) => [+(this.t0 + f * (t1 - this.t0)).toFixed(3), x, y, z])
      : [[this.t0, ...sp.cam], [t1, ...(sp.camTo || sp.cam)]];
    const shot = { id: this.id, t: [this.t0, t1], scene: sp.scene, sky: sp.sky, camera: camKeys, props: this.props, cast };
    for (const k of ['in', 'out', 'dip', 'glow']) if (sp[k] !== undefined) shot[k] = sp[k];
    if (this.cards.length) shot.cards = this.cards;
    return shot;
  }
}
