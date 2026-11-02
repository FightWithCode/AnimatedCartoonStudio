// Rig-3 QC sheet: every arm pose on four characters (one pose per second), then a walk and a talk.
//   node tools/frames.mjs posetest out/qc 0.8 1.8 2.8 …
import { POSES } from '../../library/gestures.js';
const names = Object.keys(POSES), T = names.length, who = ['kishan', 'meera', 'dada', 'neha'];
const cast = {};
who.forEach((id, i) => {
  const script = names.map((n, k) => ['do', n, k + 0.1, k + 1.1, { ramp: 0.1 }]);
  cast[id] = { x: 560 + i * 280, y: 860, facing: i % 2 ? -1 : 1, script };
});
cast.ramu = { x: 400, y: 900, facing: 1, script: [['walk', T + 0.5, T + 6.5, 2200]] };
cast.mohan = { x: 1500, y: 880, facing: -1, script: [['say', T + 0.5, T + 8], ['do', 'speak', T + 0.4, T + 8.2, { seed: 3 }]] };
export default {
  meta: { id: 'posetest', title: 'rig 3 poses', fps: 30, width: 1920, height: 1080, rig: 3, duration: T + 9, poses: names },
  narration: [], captions: names.map((n, k) => ({ start: k, end: k + 1, text: n })),
  shots: [{ id: 'qc', t: [0, T + 9], scene: 'village-street', sky: 'day', camera: [[0, 1150, 600, 1.0], [T + 9, 1150, 600, 1.0]], props: [], cast }],
};
