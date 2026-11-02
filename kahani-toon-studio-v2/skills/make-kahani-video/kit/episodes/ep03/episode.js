// Episode 03 — "माँ की चूड़ियाँ" (Mother's Bangles). ~30 s short, Hindi captions, silent.
// Uses rig 3: the original studio's movement (angle poses that ease into each other, a held speaking gesture that
// changes every few seconds, a pendulum walk with planted feet, noise lip-flap) on this studio's characters.
import { Story, END } from '../../engine/script.js';
import clips from './clips.js';

const voices = { n: {}, ramu: { label: 'रामू', color: '#ffe08a' }, dada: { label: 'दादाजी', color: '#e8cfa0' }, sita: { label: 'सीता', color: '#ffa6cf' } };
const story = new Story({ id: 'ep03', title: 'माँ की चूड़ियाँ', rig: 3 }, voices, { clips });
const birds = { id: 'birds', prop: 'birds', x: 1900, y: 240, z: -9999, n: 5 };
const CY = 625, DX = 2300; // camera height; where Dadaji stands

story.shot('s0-title', { scene: 'village-street', sky: 'dawn', cam: [1700, 560, 1.0], camTo: [2000, 560, 1.05], props: [birds], cast: {} }, (s) => {
  s.wait(0.3); s.card({ kind: 'title', text: 'माँ की चूड़ियाँ', sub: 'एक छोटी सी कहानी', size: 112, y: 340 }, 2.7, false); s.wait(3.0);
});

story.shot('s1-walk', { scene: 'village-street', sky: 'day', in: 'dip', cam: [1700, CY, 1.05], camTo: [2050, CY, 1.08], props: [birds],
  cast: { ramu: { x: 1150, y: 820, facing: 1 }, dada: { x: DX, y: 800, facing: -1 } } }, (s) => {
  s.walk('ramu', 5.2, 1980); s.act('dada', ['do', 'idle', 0, END, {}]);
  s.n('सोनापुर गाँव में रामू नाम का एक मेहनती लड़का रहता था।');
  s.wait(0.2);
});

story.shot('s2-talk', { scene: 'village-street', sky: 'day', cam: [2140, CY - 10, 1.55], camTo: [2150, CY - 10, 1.66], props: [],
  cast: { ramu: { x: 1980, y: 820 }, dada: { x: DX, y: 800, facing: -1 } } }, (s) => {
  s.say('ramu', 'प्रणाम दादाजी!', { g: 'namaste', emote: { smile: 0.8 } });
  s.say('dada', 'खुश रहो बेटा। इतनी जल्दी कहाँ जा रहे हो?', { emote: { smile: 0.5, browRaise: 0.3 } });
  s.say('ramu', 'मेले में! माँ के लिए लाल चूड़ियाँ लेने।', { emote: { smile: 0.9 } });
  s.say('ramu', 'मज़दूरी करके पैसे बचाए हैं।', { g: 'chest', emote: { smile: 0.6 } });
  s.say('dada', 'शाबाश! माँ की सेवा से बड़ा कोई धर्म नहीं।', { g: 'bless', emote: { smile: 0.9 } });
});

story.shot('s3-away', { scene: 'village-street', sky: 'day', cam: [2050, CY, 1.12], camTo: [1700, CY, 1.12], props: [birds],
  cast: { ramu: { x: 1980, y: 820 }, dada: { x: DX, y: 800, facing: -1 } } }, (s) => {
  s.act('dada', ['do', 'wave', 0.6, 3.2, {}]); s.act('dada', ['emote', 0, END, { smile: 0.9 }]);
  s.act('ramu', ['emote', 0, END, { smile: 0.9 }]);
  s.walk('ramu', 4.4, 950);
  s.n('और रामू मुस्कुराता हुआ मेले की ओर चल पड़ा।');
  s.wait(0.5);
});

export default story.build();
