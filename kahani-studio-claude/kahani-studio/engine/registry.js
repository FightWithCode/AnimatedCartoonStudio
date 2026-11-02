// Registries. Props are code (they draw), characters / scenes / skies are plain JSON data in /library.
export const PROPS = Object.create(null);
export const defineProp = (name, draw) => { PROPS[name] = draw; };
export const LIB = { characters: {}, scenes: {}, skies: {}, gestures: {} };
