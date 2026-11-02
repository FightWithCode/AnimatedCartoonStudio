// Start a new episode from the template.
//   node tools/new_episode.mjs ep04 "शीर्षक"
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const [id, title = 'नई कहानी'] = process.argv.slice(2);
if (!id || !/^ep[\w-]+$/.test(id)) { console.error('usage: node tools/new_episode.mjs ep04 "शीर्षक"   (id must start with "ep")'); process.exit(1); }
const dir = path.join(root, 'episodes', id);
if (fs.existsSync(path.join(dir, 'episode.js'))) { console.error(`episodes/${id}/episode.js already exists`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'clips.js'), '// written by tools/clips.mjs — line number -> recorded clip length (s)\nexport default {};\n');
fs.writeFileSync(path.join(dir, 'episode.js'), `// ${title}
// Written with the story builder (engine/script.js); rig 3 = the "kahani" movement and realistic proportions.
import { Story, END } from '../../engine/script.js';
import clips from './clips.js';

// speaker tags shown in the captions (n = narrator, no tag)
const voices = { n: {}, ramu: { label: 'रामू', color: '#ffe08a' } };
const story = new Story({ id: '${id}', title: '${title.replace(/'/g, "\\'")}', rig: 3 }, voices, { clips });
const CY = 625; // camera height that keeps feet above the caption strip on village-street

story.shot('s0-title', { scene: 'village-street', sky: 'dawn', cam: [1700, 560, 1.0], camTo: [2000, 560, 1.05], cast: {} }, (s) => {
  s.wait(0.3); s.card({ kind: 'title', text: '${title.replace(/'/g, "\\'")}', size: 112, y: 340 }, 2.7, false); s.wait(3.0);
});

story.shot('s1', { scene: 'village-street', sky: 'day', in: 'dip', cam: [1700, CY, 1.1], camTo: [1800, CY, 1.15],
  cast: { ramu: { x: 1500, y: 820, facing: 1 } } }, (s) => {
  s.n('एक गाँव में रामू नाम का एक किसान रहता था।');
  s.say('ramu', 'नमस्ते!', { g: 'namaste', emote: { smile: 0.8 } });
});

export default story.build();
`);
console.log(`created episodes/${id}/episode.js — preview: node tools/server.mjs  then open http://localhost:8080/?ep=${id}`);
