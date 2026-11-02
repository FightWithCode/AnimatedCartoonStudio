// Look QC: four characters close up (t=0.5 idle, 1.5 explain, 2.5 namaste, 3.5 talking), plus a full-body row (t=4.5).
//   node tools/frames.mjs looktest out/look 0.5 1.5 2.5 3.5 4.5 --nocaps
const who = ['ramu', 'meera', 'dada', 'kishan'], cast = {};
who.forEach((id, i) => {
  cast[id] = { x: 760 + i * 230, y: 860, facing: i % 2 ? -1 : 1, script: [['do', 'explain', 1, 2, { ramp: 0.1 }], ['do', 'namaste', 2, 3, { ramp: 0.1 }], ['say', 3, 4], ['do', 'point', 3, 4, { ramp: 0.1 }]] };
});
export default {
  meta: { id: 'looktest', title: 'look', fps: 30, width: 1920, height: 1080, rig: 3, duration: 5 },
  narration: [], captions: [],
  shots: [{ id: 'look', t: [0, 4], scene: 'village-street', sky: 'day', camera: [[0, 1105, 560, 2.3], [4, 1105, 560, 2.3]], props: [], cast },
          { id: 'full', t: [4, 5], scene: 'village-street', sky: 'day', camera: [[4, 1105, 640, 1.25], [5, 1105, 640, 1.25]], props: [], cast }],
};
