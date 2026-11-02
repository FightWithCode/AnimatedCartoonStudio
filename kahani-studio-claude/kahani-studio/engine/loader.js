import { LIB } from './registry.js';
import '../library/props/index.js';
import { GESTURES } from '../library/gestures.js';
export async function loadLibrary(base = '') {
  const j = async (p) => { const r = await fetch(base + p); if (!r.ok) throw new Error('missing ' + p); return r.json(); };
  const man = await j('library/manifest.json');
  LIB.skies = await j('library/skies.json'); LIB.gestures = GESTURES;
  for (const c of man.characters) LIB.characters[c] = await j(`library/characters/${c}.json`);
  for (const s of man.scenes) LIB.scenes[s] = await j(`library/scenes/${s}.json`);
  return LIB;
}
