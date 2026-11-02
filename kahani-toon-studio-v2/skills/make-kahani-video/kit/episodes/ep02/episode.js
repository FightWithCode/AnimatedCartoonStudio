// Episode 02 — "लालची आलू-पूरी वाला" (The Greedy Aloo-Puri Seller). Hindi captions, silent, ~9-10 min.
// Written with the story builder (engine/script.js): every line carries its own reading time, so pacing follows the text.
// Uses rig 2 (smoother arms + beat-based hand gestures); ep01 keeps rig 1 and is untouched.
//
// Cast  — reused from the library: mohan, dada (as the village head), bhola, ramu, sita (villagers)
//         new:  kishan, meera, sajan, rakesh, neha
// Scenes — reused: village-street          new: forest-night, cave-inside, mohan-house, kishan-evening
import { Story, END } from '../../engine/script.js';

const voices = {
  n: {},
  kishan: { label: 'किशन', color: '#ffb066' }, meera: { label: 'मीरा', color: '#8fe0a8' }, mohan: { label: 'मोहन', color: '#ff8a7a' },
  sajan: { label: 'सजन', color: '#d9a0ff' }, rakesh: { label: 'राकेश', color: '#8ec8ff' }, neha: { label: 'नेहा', color: '#ffa6cf' },
  ramu: { label: 'रामू', color: '#ffe08a' }, bhola: { label: 'भोला', color: '#b9e68a' }, dada: { label: 'मुखिया', color: '#e8cfa0' },
};
const story = new Story({ id: 'ep02', title: 'लालची आलू-पूरी वाला', rig: 2 }, voices);

// ---- shared set pieces -------------------------------------------------------------------------------------------
const KC = 1450, MC = 2950; // x of Kishan's and Mohan's carts on village-street
const kCart = (o = {}) => Object.assign({ id: 'kcart', prop: 'foodCart', x: KC, y: 800, menu: 'puri', sign: 'किशन|आलू पूरी', seed: 1 }, o);
const mCart = (o = {}) => Object.assign({ id: 'mcart', prop: 'foodCart', x: MC, y: 800, menu: 'puri', sign: 'मोहन|आलू पूरी', seed: 2, body: ['#d9463a', '#a82f26'] }, o);
const birds = { id: 'birds', prop: 'birds', x: 1500, y: 240, z: -9999, n: 5 };
const STREET = (sky, extra = {}) => Object.assign({ scene: 'village-street', sky }, extra);
const CY = 625; // camera height that keeps feet above the caption strip

/** a customer standing at Mohan's cart, plate in the left hand */
const eater = (s, id, t0 = -0.5) => { s.act(id, ['hold', 'plate', t0, END, 'L']); s.act(id, ['do', 'hold', t0, END, { only: 'L' }]); };
/** cook busy at his cart */
const cook = (s, id, dy = 36) => { s.act(id, ['hold', 'ladle', -0.5, END, 'R']); s.act(id, ['do', 'stir', -0.5, END, { dy }]); };

// =================================================================================================================
// 0. TITLE + THE VILLAGE
// =================================================================================================================
story.shot('s00-title', STREET(['night', 'dawn'], { cam: [1500, 560, 1.0], camTo: [2100, 560, 1.06], props: [birds], cast: {} }), (s) => {
  s.wait(0.5); s.card({ kind: 'title', text: 'लालची आलू-पूरी वाला', sub: 'सोनापुर गाँव की कहानी', size: 112, y: 340 }, 6.6, false); s.wait(7.4);
});

story.shot('s01-village', STREET(['dawn', 'day'], { cam: [1000, 590, 1.0], camTo: [1700, 590, 1.0], props: [birds, kCart(), mCart()], cast: {} }), (s) => {
  s.wait(0.6);
  s.n('एक छोटा सा गाँव था। नाम था सोनापुर।');
  s.n('सुबह की ठंडी हवा चल रही थी और पंछी चहक रहे थे।');
});

story.shot('s02-couple', STREET('day', { in: 'dip', cam: [KC + 120, CY, 1.3], camTo: [KC + 200, CY, 1.42], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 }, meera: { x: KC + 150, y: 782, facing: 1 } } }), (s) => {
  cook(s, 'kishan'); s.act('meera', ['do', 'open', 0, END, {}]); s.act('meera', ['emote', -0.5, END, { smile: 0.8 }]); s.act('kishan', ['emote', -0.5, END, { smile: 0.7 }]);
  s.act('kishan', ['look', 0, END, { x: KC + 43, y: 620 }]); s.act('meera', ['look', 0, END, 'kishan']);
  s.wait(0.4);
  s.n('वहाँ एक गरीब दंपति रहते थे: किशन और मीरा।');
  s.n('अपनी रोज़ी-रोटी के लिए वे आलू-पूरी का ठेला चलाते थे।');
});

story.shot('s03-taste', STREET('day', { cam: [KC + 40, 640, 2.1], camTo: [KC + 90, 640, 2.25], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 }, meera: { x: KC + 150, y: 782, facing: 1 } } }), (s) => {
  cook(s, 'kishan', 30); s.act('meera', ['do', 'explain', 0, END, {}]); s.act('meera', ['emote', -0.5, END, { smile: 0.9 }]); s.act('kishan', ['emote', -0.5, END, { smile: 0.8 }]);
  s.act('kishan', ['look', 0, END, { x: KC + 43, y: 620 }]); s.act('meera', ['look', 0, END, { x: KC + 43, y: 620 }]);
  s.n('उनकी पूरी का स्वाद लाजवाब था!');
  s.n('मसालेदार आलू की सब्ज़ी, ऊपर से हरी मिर्च और धनिये की खुशबू, और फूली-फूली गरम पूरी।');
});

story.shot('s04-empty', STREET('day', { cam: [KC + 420, CY, 1.12], camTo: [KC + 470, CY, 1.2], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 }, meera: { x: KC + 150, y: 782, facing: 1 } } }), (s) => {
  s.act('kishan', ['do', 'sad', -0.5, END, {}]); s.act('meera', ['do', 'worry', -0.5, END, {}]);
  s.act('kishan', ['emote', -0.5, END, { smile: -0.6, brow: 0.7 }]); s.act('meera', ['emote', -0.5, END, { smile: -0.5, brow: 0.6 }]);
  s.act('kishan', ['look', 0, END, { x: KC + 900, y: 640 }]); s.act('meera', ['look', 0, END, { x: KC + 900, y: 640 }]);
  s.act('kishan', ['fx', 1.5, END, 'question']);
  s.wait(0.4);
  s.n('लेकिन पता नहीं क्यों…');
  s.n('अब उनके ठेले पर कोई आता ही नहीं था।');
  s.wait(0.6);
});

// =================================================================================================================
// 1. MOHAN'S BUSY CART  — the villagers feel pulled towards it
// =================================================================================================================
story.shot('s05-mohan', STREET('day', { cam: [MC + 300, CY, 1.12], camTo: [MC + 380, CY, 1.2], props: [mCart()],
  cast: { mohan: { x: MC - 99, y: 790, facing: 1 }, ramu: { x: MC + 430, y: 850, facing: -1 }, bhola: { x: MC + 610, y: 858, facing: -1 }, sita: { x: MC + 800, y: 872, facing: -1 } } }), (s) => {
  cook(s, 'mohan'); s.act('mohan', ['emote', -0.5, END, { smile: 0.8 }]); s.act('mohan', ['look', 0, END, 'ramu']);
  eater(s, 'ramu'); eater(s, 'bhola'); eater(s, 'sita');
  s.do('ramu', 'eat', END, { period: 3.4 }); s.do('bhola', 'eat', END, { period: 3.1 }); s.do('sita', 'eat', END, { period: 3.6 });
  for (const id of ['ramu', 'bhola', 'sita']) s.act(id, ['look', 0, END, 'mohan']);
  s.wait(0.4);
  s.n('उसी गाँव में मोहन नाम का एक आदमी भी आलू-पूरी बेचता था।');
  s.n('उसके ठेले पर रोज़ इतनी भीड़ रहती कि जगह भी नहीं मिलती थी।');
});

story.shot('s06-gossip', STREET('day', { cam: [MC + 480, CY, 1.55], camTo: [MC + 520, CY, 1.65], props: [mCart()],
  cast: { ramu: { x: MC + 430, y: 850, facing: 1 }, bhola: { x: MC + 640, y: 858, facing: -1 } } }), (s) => {
  eater(s, 'ramu'); eater(s, 'bhola');
  s.wait(0.3);
  s.n('एक दिन दो ग्राहक वहीं बात कर रहे थे।');
  s.say('ramu', 'अरे भाई! यह मोहन की पूरी में वो बात नहीं है।', { g: 'speakR', emote: { smile: 0.1 } });
  s.say('ramu', 'स्वाद तो किशन वाली पूरी में है।', { g: 'speakR' });
  s.say('ramu', 'पर जाने क्यों, पैर खुद-ब-खुद मोहन के ठेले की ओर खिंच जाते हैं।', { g: 'speakR', emote: { brow: 0.4, smile: -0.1 }, fx: 'swirl' });
  s.say('bhola', 'सही कहा रे! पहले तो रोज़ किशन की पूरी ही खाते थे।', { g: 'speakR' });
  s.say('bhola', 'उसकी आलू की सब्ज़ी में जो तीखापन था, वो तो मज़ा दे देता था।', { g: 'speakR', emote: { smile: 0.6 } });
  s.say('bhola', 'अब तो बस मन ही नहीं करता उसके ठेले पर जाने का।', { g: 'speakR', emote: { brow: 0.5, smile: -0.2 }, fx: 'swirl' });
});

story.shot('s07-kishan-hears', STREET('day', { cam: [KC + 250, CY, 1.35], camTo: [KC + 300, CY, 1.45], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 } } }), (s) => {
  s.act('kishan', ['do', 'worry', -0.5, END, {}]); s.act('kishan', ['look', 0, END, { x: KC + 1500, y: 600 }]); s.act('kishan', ['emote', -0.5, END, { smile: -0.5, brow: 0.7 }]);
  s.wait(0.3);
  s.n('उधर किशन अपने ठेले के पास अकेला खड़ा चुपचाप सब सुन रहा था।');
  s.say('kishan', 'पहले तो मेरे ठेले पर भी भीड़ लगती थी। अब सब मोहन के पास क्यों जा रहे हैं?', { g: 'speak', gopts: { energy: 0.45 }, emote: { smile: -0.4, brow: 0.6 }, look: false, fx: 'question' });
  s.say('kishan', 'क्या उसने कोई जादू कर दिया है क्या?', { g: 'speak', gopts: { energy: 0.6 }, emote: { brow: 0.3, smile: -0.2 }, look: false });
});

// =================================================================================================================
// 2. NEW-MOON NIGHT AT MOHAN'S HOUSE
// =================================================================================================================
story.shot('s08-pack-up', STREET(['sunset', 'night'], { in: 'dip', cam: [MC + 100, CY, 1.1], camKeys: [[0, MC + 100, CY, 1.1], [1, MC + 700, CY, 1.1]],
  props: [mCart()],
  cast: { mohan: { x: MC - 99, y: 790, facing: 1 } } }), (s) => {
  s.walkProp('mcart', 2.0, 8.0, MC + 1500);
  s.act('mohan', ['walk', 0.3, 1.8, MC - 500, 806]); s.act('mohan', ['walk', 2.0, 8.0, MC + 1000]); s.act('mohan', ['do', 'carryHandle', 1.6, 7.8, {}]); s.act('mohan', ['look', 0, END, { x: MC + 2600, y: 600 }]);
  s.act('mohan', ['emote', -0.5, END, { smile: 0.6 }]);
  s.wait(0.3);
  s.n('उस रात मोहन ने अपना ठेला जल्दी समेटा। सारे आलू-पूरी बिक चुके थे।');
  s.wait(1.0);
});

story.shot('s09-house', { scene: 'mohan-house', sky: 'nightRoom', in: 'dip', glow: 0.16, cam: [1450, 640, 1.0], camTo: [1500, 640, 1.18],
  cast: { sajan: { x: 1080, y: 866, facing: 1 }, mohan: { x: 2080, y: 872, facing: -1 } } }, (s) => {
  s.act('sajan', ['hold', 'ladle', -0.5, END, 'R']); s.act('sajan', ['do', 'stir', -0.5, 4.5, { dy: -20 }]); s.act('sajan', ['look', 0, 4.5, { x: 1260, y: 600 }]);
  s.act('mohan', ['walk', 0.4, 4.4, 1720]); s.act('mohan', ['look', 0, END, 'sajan']);
  s.wait(0.5);
  s.n('घर पहुँचते ही उसकी पत्नी सजन बोली।');
});

story.shot('s10-amavasya', { scene: 'mohan-house', sky: 'nightRoom', glow: 0.16, cam: [1500, 600, 1.35], camTo: [1560, 600, 1.45],
  cast: { sajan: { x: 1180, y: 866, facing: 1 }, mohan: { x: 1650, y: 872, facing: -1 } } }, (s) => {
  s.say('sajan', 'जी, आज तो अमावस्या की रात है। याद है ना?', { gopts: { energy: 0.7 } });
  s.say('mohan', 'हाँ, याद है। तुमने तैयारी कर ली?');
  s.say('sajan', 'जी। पूरे 13 किलो चिकन पका लिया है।', { emote: { smile: 0.6 } });
  s.card({ kind: 'note', text: '13 किलो चिकन', size: 76, y: 250 }, 3.2, false);
  s.say('sajan', 'पर बताओ ना, हर बार 13 किलो ही क्यों? 10 या 20 क्यों नहीं?', { emote: { brow: 0.4 } });
});

story.shot('s11-secret', { scene: 'mohan-house', sky: 'nightRoom', glow: 0.14, cam: [1520, 600, 1.55], camTo: [1580, 600, 1.7],
  cast: { sajan: { x: 1230, y: 866, facing: 1 }, mohan: { x: 1650, y: 872, facing: -1 } } }, (s) => {
  s.say('mohan', 'अरे भगवान! मैंने उसे 13 तारीख को ही नींद से जगाया था।', { emote: { brow: 0.3, smile: -0.1 } });
  s.say('mohan', 'अब उसे हर अमावस्या को 13 किलो चिकन चाहिए।', { emote: { brow: -0.3, smile: -0.2 } });
  s.say('mohan', 'अगर नहीं दिया तो हमें ही खा जाएगा!', { g: 'speak', gopts: { energy: 1.0, angry: true }, emote: { brow: -0.8, smile: -0.5, eyeOpen: 1.2 }, react: { sajan: { g: 'fear', emote: { smile: -0.7, brow: 0.9, eyeOpen: 1.25 } } } });
  s.say('sajan', 'क्या?! आपने उसे जगाया क्यों?', { g: 'fear' });
});

story.shot('s12-reason', { scene: 'mohan-house', sky: 'nightRoom', glow: 0.14, cam: [1520, 600, 1.5], camTo: [1500, 600, 1.62],
  cast: { sajan: { x: 1230, y: 866, facing: 1 }, mohan: { x: 1650, y: 872, facing: -1 } } }, (s) => {
  s.act('sajan', ['do', 'worry', -0.5, END, {}]);
  s.say('mohan', 'पगली! उसी की वजह से तो हमारी पूरी बिकती है।', { emote: { smile: 0.2 } });
  s.say('mohan', 'वरना हम भी किशन की तरह बैठे रहते।', { emote: { smile: 0.1 } });
  s.say('mohan', 'उसके कारण ही हमारे अच्छे दिन आए हैं। उसका शुक्र मानो।', { emote: { smile: 0.4 } });
  s.n('दोनों कुछ देर खामोश रहे। बाहर हवा में अजीब सी सिहरन थी।');
});

story.shot('s13-feed', { scene: 'mohan-house', sky: 'nightRoom', glow: 0.14, cam: [1450, 620, 1.2], camTo: [1500, 620, 1.3],
  cast: { sajan: { x: 1230, y: 866, facing: 1 }, mohan: { x: 1650, y: 872, facing: -1 } } }, (s) => {
  s.act('sajan', ['do', 'clasp', -0.5, END, {}]); s.act('sajan', ['emote', -0.5, END, { smile: -0.4, brow: 0.6 }]);
  s.say('mohan', 'चलो, अब सो जाओ। मैं जाकर उसको चिकन खिलाकर आता हूँ।', { emote: { smile: 0.1 } });
  s.act('mohan', ['walk', 0.2, 3.4, 2300]);
  s.wait(1.2);
  s.n('आख़िर वो कौन है, जो हर अमावस्या को 13 किलो चिकन माँगता है?');
});

// ---- night walk to the cave ------------------------------------------------------------------------------------
story.shot('s14-forest-walk', { scene: 'forest-night', sky: 'night', in: 'dip', cam: [700, CY, 1.1], camKeys: [[0, 700, CY, 1.1], [1, 3000, CY, 1.1]],
  cast: { mohan: { x: 200, y: 836, facing: 1 } } }, (s) => {
  s.act('mohan', ['hold', 'pot', -0.5, END, 'R']); s.act('mohan', ['do', 'carryPot', -0.5, END, {}]); s.act('mohan', ['look', 0, END, { x: 4300, y: 600 }]);
  s.act('mohan', ['walk', 0.6, 13.0, 2900]);
  s.wait(0.5);
  s.n('आधी रात को मोहन 13 किलो चिकन की बड़ी सी हाँडी लेकर जंगल की ओर चल पड़ा।');
  s.n('चाँद चमक रहा था और चारों ओर गहरा सन्नाटा था।');
  s.wait(0.8);
});

story.shot('s15-cave-door', { scene: 'forest-night', sky: 'night', cam: [3400, CY, 1.15], camTo: [3500, CY, 1.3],
  props: [{ id: 'eyes', prop: 'eyes', x: 3850, y: 640, s: 0.37, z: -9998 }],
  cast: { mohan: { x: 2900, y: 836, facing: 1 } } }, (s) => {
  s.act('mohan', ['hold', 'pot', -0.5, END, 'R']); s.act('mohan', ['do', 'carryPot', -0.5, END, {}]); s.act('mohan', ['look', 0, END, { x: 3850, y: 560 }]);
  s.act('mohan', ['walk', 0.4, 6.4, 3560]); s.act('mohan', ['emote', -0.5, END, { smile: -0.1, brow: 0.3 }]);
  s.wait(0.5);
  s.n('गुफ़ा के भीतर अँधेरे में दो लाल आँखें चमक रही थीं…');
  s.wait(1.8);
});

// =================================================================================================================
// 3. NEXT MORNING — the two rival carts
// =================================================================================================================
story.shot('s16-morning', STREET(['dawn', 'day'], { in: 'dip', cam: [MC + 300, CY, 1.1], camTo: [MC + 360, CY, 1.2], props: [birds, mCart()],
  cast: { mohan: { x: MC - 99, y: 790, facing: 1 } } }), (s) => {
  cook(s, 'mohan'); s.act('mohan', ['emote', -0.5, END, { smile: 0.9 }]); s.act('mohan', ['look', 0, END, { x: MC + 900, y: 600 }]);
  s.wait(0.4);
  s.n('अगली सुबह सूरज की किरणें गाँव की पगडंडियों पर फैल चुकी थीं।');
  s.n('मोहन अपने ठेले को चमका रहा था। तेल गरम हो चुका था और पूरी तलने की खुशबू पूरे चौराहे में फैल रही थी।');
  s.n('उसके चेहरे पर वही आत्मविश्वास था। आज फिर भीड़ लगेगी!');
});

story.shot('s17-kishan-sad', STREET('day', { cam: [KC + 260, CY, 1.4], camTo: [KC + 300, CY, 1.5], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 } } }), (s) => {
  s.act('kishan', ['do', 'sad', -0.5, 7, {}]); s.act('kishan', ['emote', -0.5, END, { smile: -0.6, brow: 0.8 }]); s.act('kishan', ['look', 0, 6.5, { x: KC + 420, y: 760 }]);
  s.n('उधर किशन अपने ठेले पर उदास बैठा था। बर्तन सजे थे, आलू की सब्ज़ी तैयार थी, पर ग्राहक कोई नहीं।');
  s.say('kishan', 'कभी मेरे ठेले पर भी भीड़ रहती थी। अब तो जैसे गाँव वालों को मेरा चेहरा भी नहीं दिखता।', { g: 'speak', gopts: { energy: 0.4 }, emote: { smile: -0.5, brow: 0.7 }, look: false });
});

// =================================================================================================================
// 4. THE CITY COUPLE
// =================================================================================================================
story.shot('s18-arrive', STREET('day', { cam: [900, CY, 1.15], camKeys: [[0, 900, CY, 1.15], [0.55, 1800, CY, 1.15], [1, 2150, CY, 1.3]], props: [kCart(), mCart()],
  cast: { rakesh: { x: 330, y: 842, facing: 1 }, neha: { x: 180, y: 856, facing: 1 }, bhola: { x: 2420, y: 856, facing: -1 }, kishan: { x: KC - 99, y: 790, facing: 1 } } }), (s) => {
  s.act('rakesh', ['walk', 0.3, 7.0, 2000]); s.act('neha', ['walk', 0.5, 7.2, 1840]);
  s.act('kishan', ['do', 'sad', -0.5, END, {}]); s.act('kishan', ['emote', -0.5, END, { smile: -0.5, brow: 0.7 }]);
  s.act('bhola', ['look', 0, END, 'rakesh']); s.act('bhola', ['do', 'arms', -0.5, END, {}]);
  s.wait(0.4);
  s.n('तभी गाँव में शहर से आए एक दंपति दाखिल हुए: राकेश और नेहा।');
  s.wait(1.8);
});

story.shot('s19-ask', STREET('day', { cam: [2220, CY, 1.55], camTo: [2260, CY, 1.65], props: [kCart(), mCart()],
  cast: { rakesh: {}, neha: {}, bhola: {} } }), (s) => {
  s.act('rakesh', ['walk', 0, 1.0, 2120]); s.act('neha', ['walk', 0.1, 1.2, 1990]);
  s.wait(1.2);
  s.say('rakesh', 'भाई साहब, हम इस गाँव में नए आए हैं। नाश्ता करना है।', { to: 'bhola' });
  s.say('rakesh', 'बताइए, कहाँ मिलेगा अच्छा?', { to: 'bhola' });
  s.say('bhola', 'सबसे बढ़िया नाश्ता तो मोहन के ठेले पर मिलता है।', { g: 'speak', emote: { smile: 0.7 } });
  s.act('bhola', ['face', 0, 1]);
  s.say('bhola', 'यहीं पास में है।', { g: 'point', gopts: { up: 6 }, emote: { smile: 0.7 }, look: false });
  s.say('rakesh', 'बहुत-बहुत शुक्रिया!', { to: 'bhola', emote: { smile: 0.8 } });
});

story.shot('s20-crowd', STREET('day', { cam: [3150, CY, 1.12], camKeys: [[0, 2700, CY, 1.12], [0.55, 3250, CY, 1.2], [1, 3300, CY, 1.4]], props: [mCart()],
  cast: { rakesh: {}, neha: {}, mohan: { x: MC - 99, y: 790, facing: 1 }, ramu: { x: MC + 430, y: 850, facing: -1 }, sita: { x: MC + 640, y: 866, facing: -1 }, bhola: { x: MC + 820, y: 858, facing: -1 } } }), (s) => {
  cook(s, 'mohan'); eater(s, 'ramu'); eater(s, 'sita'); eater(s, 'bhola');
  s.do('ramu', 'eat', END, { period: 3.3 }); s.do('sita', 'eat', END, { period: 3.5 }); s.do('bhola', 'eat', END, { period: 3.0 });
  s.act('rakesh', ['walk', 0.2, 6.6, 3280]); s.act('neha', ['walk', 0.4, 6.8, 3110]);
  s.wait(0.6);
  s.n('जब वे मोहन के ठेले के पास पहुँचे, तो वहाँ भारी भीड़ लगी थी।');
  s.wait(1.2);
});

story.shot('s21-too-crowded', STREET('day', { cam: [3180, CY, 1.6], camTo: [3150, CY, 1.7], props: [mCart()],
  cast: { rakesh: {}, neha: {}, ramu: { x: MC + 600, y: 850, facing: -1 } } }), (s) => {
  s.act('rakesh', ['face', 0, -1]); s.act('neha', ['face', 0, -1]);
  s.say('neha', 'अरे जी, यहाँ तो बहुत भीड़ है! कितना इंतज़ार करें?', { to: 'rakesh', emote: { brow: 0.3 } });
  s.say('rakesh', 'सही कहा। चलो, कहीं और देखते हैं।', { to: 'neha' });
});

story.shot('s22-clean-cart', STREET('day', { cam: [3100, CY, 1.5], camKeys: [[0, 3150, CY, 1.55], [0.38, 3100, CY, 1.5], [0.62, 2500, CY, 1.25], [1, 1900, CY, 1.3]], props: [kCart(), mCart()],
  cast: { rakesh: {}, neha: {}, kishan: { x: KC - 99, y: 790, facing: 1 } } }), (s) => {
  s.act('kishan', ['do', 'sad', -0.5, END, {}]); s.act('kishan', ['emote', -0.5, END, { smile: -0.4, brow: 0.6 }]);
  s.say('neha', 'देखो, उधर वो ठेला कितना साफ़ है, और खुशबू भी कितनी अच्छी आ रही है!', { to: 'rakesh', emote: { smile: 0.7 } });
  s.act('rakesh', ['walk', 0.6, 9.5, 1900]); s.act('neha', ['walk', 0.9, 9.8, 1760]);
  s.say('rakesh', 'हाँ, चलो वहीं चलते हैं।', { to: 'neha' });
  s.wait(2.6);
});

story.shot('s23-serve', STREET('day', { cam: [KC + 320, CY, 1.45], camTo: [KC + 360, CY, 1.55], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 }, rakesh: { x: 1900, y: 846, facing: -1 }, neha: { x: 1760, y: 860 } } }), (s) => {
  s.act('rakesh', ['walk', 0, 0.8, 1880]); s.act('neha', ['walk', 0, 1.0, 1990]); s.act('neha', ['face', 0, -1]);
  s.act('kishan', ['emote', -0.3, END, { smile: 0.9, brow: 0 }]);
  s.wait(1.0);
  s.say('kishan', 'आइए सर, मैडम! गरम-गरम आलू-पूरी दूँ?', { g: 'speak', gopts: { energy: 0.9 }, emote: { smile: 0.95 }, to: 'rakesh' });
  s.say('rakesh', 'हाँ भाई, दो प्लेट देना। पूरी एकदम फूली हुई होनी चाहिए।', { to: 'kishan' });
  s.n('किशन ने स्नेह से दो प्लेट परोसीं।');
  s.act('kishan', ['do', 'offer', -3.0, 0.0, {}]); s.act('kishan', ['hold', 'plate', -3.2, 0.2, 'R']);
});

story.shot('s24-taste-it', STREET('day', { cam: [KC + 330, CY, 1.5], camTo: [KC + 360, CY, 1.6], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 }, rakesh: { x: 1900, y: 846, facing: -1 }, neha: { x: 2060, y: 860, facing: -1 } } }), (s) => {
  eater(s, 'rakesh'); eater(s, 'neha'); s.do('rakesh', 'eat', 5.8, { period: 3.0 }); s.do('neha', 'eat', 6.2, { period: 3.3 });
  s.act('kishan', ['emote', -0.3, END, { smile: 0.85 }]); s.act('kishan', ['look', 0, END, 'rakesh']); s.act('kishan', ['do', 'clasp', -0.5, END, {}]);
  s.act('rakesh', ['look', 0, 6, 'kishan']); s.act('neha', ['look', 0, 6, 'kishan']);
  s.wait(6.2);
  s.act('rakesh', ['emote', -4, END, { smile: 0.9, eyeOpen: 1.15 }]); s.act('neha', ['emote', -4, END, { smile: 0.9, eyeOpen: 1.15 }]);
  s.say('rakesh', 'वाह! यह तो वाकई लाजवाब है!', { g: 'speakR', emote: { smile: 0.95 } });
  s.say('neha', 'सच में भाई, तुम्हारी पूरी का तो कोई जवाब नहीं।', { g: 'speakR', emote: { smile: 0.95 } });
});

story.shot('s25-why-empty', STREET('day', { cam: [KC + 330, CY, 1.5], camTo: [KC + 340, CY, 1.6], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 }, rakesh: { x: 1900, y: 846, facing: -1 }, neha: { x: 2060, y: 860, facing: -1 } } }), (s) => {
  eater(s, 'rakesh'); eater(s, 'neha');
  s.say('rakesh', 'पर एक बात बताओ।', { g: 'speakR', to: 'kishan' });
  s.say('rakesh', 'इतने बढ़िया स्वाद के बाद भी यहाँ कोई ग्राहक क्यों नहीं?', { g: 'speakR', to: 'kishan', emote: { brow: 0.3 } });
  s.say('kishan', 'क्या बताऊँ साहब? उस मोहन ने कुछ जादू कर रखा है।', { gopts: { energy: 0.7 }, emote: { smile: -0.3, brow: 0.6 }, to: 'rakesh' });
  s.say('kishan', 'गाँव वाले अब मेरे ठेले की तरफ़ देखते भी नहीं।', { gopts: { energy: 0.7 }, emote: { smile: -0.4, brow: 0.7 } });
  s.say('kishan', 'आप शहर से हैं, इसलिए बच गए। नहीं तो आपके पैर भी उसी के ठेले की ओर खिंच जाते।', { gopts: { energy: 0.8 }, emote: { brow: 0.4, smile: -0.2 } });
});

story.shot('s26-no-magic', STREET('day', { cam: [KC + 330, CY, 1.5], camTo: [KC + 360, CY, 1.6], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 }, rakesh: { x: 1900, y: 846, facing: -1 }, neha: { x: 2060, y: 860, facing: -1 } } }), (s) => {
  eater(s, 'neha');
  s.say('rakesh', 'अरे भैया, ऐसा कुछ नहीं होता। अपने कर्म देखिए।', { g: 'speak', to: 'kishan', emote: { smile: 0.3 } });
  s.say('rakesh', 'जादू-टोने पर क्यों दोष डालते हैं?', { g: 'speak', to: 'kishan', emote: { smile: 0.2 } });
  s.n('इतना कहकर दोनों चले गए।');
  s.act('rakesh', ['walk', -2.4, 1.6, 2900]); s.act('neha', ['walk', -2.3, 1.8, 3050]);
  s.act('kishan', ['emote', -3, END, { smile: -0.5, brow: 0.7 }]);
});

story.shot('s27-mohan-watches', STREET('day', { cam: [MC + 320, CY, 1.4], camTo: [MC + 380, CY, 1.55], props: [mCart()],
  cast: { mohan: { x: MC - 99, y: 790, facing: -1 } } }), (s) => {
  s.act('mohan', ['do', 'arms', -0.5, END, {}]); s.act('mohan', ['emote', -0.5, END, { brow: -0.9, smile: -0.5 }]); s.act('mohan', ['look', 0, END, { x: KC + 400, y: 620 }]);
  s.n('पर उधर मोहन यह सब दूर से देख रहा था।');
  s.say('mohan', 'हम्म! इसे तो मैं देख लूँगा…', { g: 'rub', emote: { brow: -0.8, smile: -0.4 }, look: false });
});

story.shot('s28-leaves', STREET(['day', 'sunset'], { cam: [MC + 100, CY, 1.1], camKeys: [[0, MC + 100, CY, 1.1], [1, MC + 800, CY, 1.1]], props: [mCart()],
  cast: { mohan: { x: MC - 99, y: 790, facing: -1 } } }), (s) => {
  s.walkProp('mcart', 1.8, 7.6, MC + 1500);
  s.act('mohan', ['walk', 0.3, 1.6, MC - 500, 806]); s.act('mohan', ['walk', 1.8, 7.6, MC + 1000]); s.act('mohan', ['do', 'carryHandle', 1.4, 7.4, {}]); s.act('mohan', ['look', 0, END, { x: MC + 2600, y: 600 }]);
  s.act('mohan', ['emote', -0.5, END, { brow: -0.5, smile: -0.2 }]);
  s.n('वह तुरंत अपना ठेला समेटकर जंगल की ओर निकल गया।');
  s.wait(2.2);
});

// =================================================================================================================
// 5. THE CAVE (Mohan's secret)
// =================================================================================================================
story.shot('s29-to-cave', { scene: 'forest-night', sky: ['sunset', 'night'], in: 'dip', cam: [900, CY, 1.1], camKeys: [[0, 900, CY, 1.1], [1, 3400, CY, 1.15]],
  props: [{ id: 'eyes', prop: 'eyes', x: 3850, y: 640, s: 0.37, z: -9998 }],
  cast: { mohan: { x: 150, y: 836, facing: 1 } } }, (s) => {
  s.act('mohan', ['hold', 'bag', -0.5, END, 'R']); s.act('mohan', ['do', 'carryBag', -0.5, END, {}]); s.act('mohan', ['look', 0, END, { x: 4300, y: 600 }]);
  s.act('mohan', ['walk', 0.6, 13.6, 3500]); s.act('mohan', ['emote', -0.5, END, { brow: -0.3 }]);
  s.wait(0.4);
  s.n('अँधेरा गिरने लगा था।');
  s.n('जंगल के भीतर वह एक पुरानी गुफ़ा में दाख़िल हुआ।');
  s.wait(1.5);
});

story.shot('s30-chant', { scene: 'cave-inside', sky: 'cave', in: 'dip', glow: 0.1, cam: [1250, 560, 1.15], camTo: [1250, 560, 1.28],
  props: [{ id: 'eyes', prop: 'eyes', x: 1250, y: 330, s: 1.5, z: -9998 }, { id: 'pot', prop: 'curryPan', x: 1000, y: 868, rx: 110, seed: 3, z: 860 }],
  cast: { mohan: { x: 1450, y: 862, facing: -1 } } }, (s) => {
  s.act('mohan', ['do', 'chant', 0.6, END, {}]); s.act('mohan', ['emote', -0.5, END, { brow: 0.4, eyeOpen: 1.1 }]); s.act('mohan', ['look', 0, END, { x: 1250, y: 330 }]);
  s.wait(0.5);
  s.n('भीतर से कुछ मंत्रों की आवाज़ आई।');
  s.n('हवा भारी हो गई…');
  s.wait(1.5);
});

story.shot('s31-ten-min', { scene: 'forest-night', sky: 'night', cam: [3500, CY, 1.2], camTo: [3500, CY, 1.2],
  cast: {} }, (s) => {
  s.card({ kind: 'note', text: '10 मिनट बाद…', size: 90, y: 480, bg: '#05030a' }, 3.6, true);
});

story.shot('s32-sweat', { scene: 'forest-night', sky: 'night', cam: [3500, CY, 1.3], camTo: [3420, CY, 1.4],
  props: [{ id: 'eyes', prop: 'eyes', x: 3850, y: 640, s: 0.37, z: -9998 }],
  cast: { mohan: { x: 3750, y: 836, facing: -1 } } }, (s) => {
  s.act('mohan', ['walk', 0.4, 5.0, 3300]); s.act('mohan', ['do', 'wipe', 5.3, END, {}]);
  s.act('mohan', ['emote', -0.5, END, { sweat: 1, smile: -0.3, brow: 0.3, eyeOpen: 1.1 }]); s.act('mohan', ['look', 0, END, { x: 3000, y: 640 }]);
  s.wait(0.4);
  s.n('और ठीक 10 मिनट बाद वह पसीने से तर, हाँफता हुआ बाहर निकला।');
  s.wait(1.0);
});

// =================================================================================================================
// 6. NEXT MORNING — the spell works on the city couple too
// =================================================================================================================
story.shot('s33-urge', STREET(['dawn', 'day'], { in: 'dip', cam: [1000, CY, 1.5], camTo: [1050, CY, 1.6], props: [birds, kCart(), mCart()],
  cast: { rakesh: { x: 1060, y: 846, facing: 1 }, neha: { x: 900, y: 860, facing: 1 } } }), (s) => {
  s.wait(0.4);
  s.n('अगली सुबह वही शहर वाले फिर नाश्ते के लिए निकले।');
  s.say('neha', 'सुनो जी, पता नहीं क्यों, मेरा मन उस मोहन के ठेले पर जाने का कर रहा है।', { to: 'rakesh', emote: { brow: 0.3 }, fx: 'swirl' });
  s.say('rakesh', 'अरे, मेरा भी! कल तो मैंने कहा था वहाँ भीड़ ज़्यादा है।', { to: 'neha', emote: { brow: 0.4 }, fx: 'swirl' });
  s.say('rakesh', 'फिर भी मुझे आज वहीं जाने का मन कर रहा है।', { to: 'neha', emote: { smile: 0.3 } });
});

story.shot('s34-walk-over', STREET('day', { cam: [1700, CY, 1.15], camKeys: [[0, 1300, CY, 1.15], [1, 3000, CY, 1.15]], props: [kCart(), mCart()],
  cast: { rakesh: {}, neha: {}, kishan: { x: KC - 99, y: 790, facing: 1 }, ramu: { x: MC + 430, y: 850, facing: -1 }, sita: { x: MC + 640, y: 866, facing: -1 } } }), (s) => {
  cook(s, 'kishan'); eater(s, 'ramu'); eater(s, 'sita'); s.do('ramu', 'eat', END, { period: 3.3 }); s.do('sita', 'eat', END, { period: 3.5 });
  s.act('rakesh', ['walk', 0.4, 8.0, 3350]); s.act('neha', ['walk', 0.6, 8.2, 3190]);
  s.act('rakesh', ['fx', 0, END, 'swirl']); s.act('neha', ['fx', 0, END, 'swirl']);
  s.act('rakesh', ['look', 0, END, { x: 3500, y: 600 }]); s.act('neha', ['look', 0, END, { x: 3500, y: 600 }]);
  s.act('kishan', ['look', 0, END, 'rakesh']);
  s.wait(0.4);
  s.n('दोनों हँसते हुए सीधे मोहन के ठेले पर पहुँचे।');
  s.wait(1.8);
});

story.shot('s35-kishan-pale', STREET('day', { cam: [KC + 200, CY, 1.55], camTo: [KC + 230, CY, 1.7], props: [kCart()],
  cast: { kishan: { x: KC - 99, y: 790, facing: 1 } } }), (s) => {
  s.act('kishan', ['do', 'shock', -0.5, END, {}]); s.act('kishan', ['emote', -0.5, END, { smile: -0.8, brow: 0.9, eyeOpen: 1.25 }]); s.act('kishan', ['look', 0, END, { x: MC + 400, y: 600 }]);
  s.n('किशन दूर से यह सब देख रहा था। उसका चेहरा सफ़ेद पड़ गया।');
  s.say('kishan', 'तो अब उन पर भी जादू चल गया!', { g: 'speak', gopts: { energy: 0.85 }, emote: { smile: -0.7, brow: 0.9, eyeOpen: 1.2 }, look: false });
});

// =================================================================================================================
// 7. THE VILLAGE HEAD
// =================================================================================================================
story.shot('s36-mukhiya', STREET('day', { cam: [2150, CY, 1.5], camTo: [2180, CY, 1.6], props: [kCart(), mCart()],
  cast: { rakesh: { x: 2100, y: 846, facing: 1 }, neha: { x: 1940, y: 860, facing: 1 }, dada: { x: 2650, y: 868, facing: -1 } } }), (s) => {
  s.act('rakesh', ['walk', 0.0, 0.6, 2140]); s.act('neha', ['walk', 0.0, 0.8, 1990]);
  s.act('dada', ['walk', 0.0, 2.8, 2380]);
  s.wait(0.4);
  s.n('जब राकेश और नेहा नाश्ता करके लौट रहे थे, तो रास्ते में गाँव के मुखिया मिल गए।');
  s.say('dada', 'कैसे हैं शहर वाले बाबू? कैसा लगा हमारा गाँव?', { emote: { smile: 0.9 }, to: 'rakesh' });
  s.say('rakesh', 'बहुत प्यारा गाँव है मुखिया जी। बस एक अजीब बात है।', { to: 'dada', emote: { smile: 0.5 } });
});

story.shot('s37-mukhiya2', STREET('day', { cam: [2150, CY, 1.5], camTo: [2180, CY, 1.6], props: [kCart(), mCart()],
  cast: { rakesh: { x: 2140, y: 846 }, neha: { x: 1990, y: 860 }, dada: { x: 2380, y: 868 } } }), (s) => {
  s.say('rakesh', 'कल हम किशन के ठेले पर गए थे। आज जाने क्यों हमारे पैर खुद-ब-खुद मोहन के ठेले की ओर खिंच गए।', { to: 'dada', emote: { brow: 0.4 } });
  s.say('rakesh', 'कुछ तो अजीब है उस ठेले में।', { to: 'dada', emote: { brow: 0.6 } });
  s.say('dada', 'अरे नहीं बाबूजी, कुछ अजीब नहीं।', { g: 'speak', emote: { smile: 0.6 } });
  s.say('dada', 'मोहन के आलू-पूरी का स्वाद ही ऐसा है कि लोग खुद खिंच जाते हैं।', { g: 'speak', emote: { smile: 0.8 } });
});

story.shot('s38-question', STREET('day', { cam: [1900, CY, 1.3], camTo: [2300, CY, 1.3], props: [kCart(), mCart()],
  cast: { rakesh: { x: 2140, y: 846 }, neha: { x: 1990, y: 860 }, dada: { x: 2380, y: 868, facing: -1 } } }), (s) => {
  s.act('rakesh', ['face', 0, -1]); s.act('neha', ['face', 0, -1]); s.act('dada', ['face', 0, 1]);
  s.act('rakesh', ['walk', 0.5, 5.5, 1650]); s.act('neha', ['walk', 0.7, 5.7, 1500]); s.act('dada', ['walk', 0.5, 4.0, 2650]);
  s.act('rakesh', ['fx', 2.0, END, 'question']); s.act('neha', ['fx', 2.0, END, 'question']);
  s.act('rakesh', ['emote', 1, END, { brow: 0.6, smile: -0.1 }]); s.act('neha', ['emote', 1, END, { brow: 0.6, smile: -0.1 }]);
  s.act('rakesh', ['look', 0, END, { x: 900, y: 650 }]); s.act('neha', ['look', 0, END, { x: 900, y: 650 }]);
  s.n('पर राकेश और नेहा जब आगे बढ़े, तो दोनों के मन में एक ही सवाल गूँज रहा था…');
  s.n('क्या सचमुच स्वाद खींचता है, या फिर मोहन का कोई रहस्यमयी राज़?');
});

// =================================================================================================================
// 8. EVENING AT KISHAN'S HOME — the plan
// =================================================================================================================
story.shot('s39-home', { scene: 'kishan-evening', sky: 'eveRoom', in: 'dip', glow: 0.2, cam: [1400, 640, 1.05], camTo: [1450, 640, 1.2],
  cast: { meera: { x: 1085, y: 866, facing: 1 }, kishan: { x: 1620, y: 878, facing: -1 } } }, (s) => {
  s.act('kishan', ['sit', -1, END]); s.act('kishan', ['emote', -0.5, END, { smile: -0.3, brow: 0.5 }]); s.act('kishan', ['look', 0, END, { x: 1260, y: 700 }]);
  s.act('meera', ['hold', 'ladle', -0.5, END, 'R']); s.act('meera', ['do', 'stir', -0.5, END, { dy: -20 }]); s.act('meera', ['look', 0, END, { x: 1260, y: 600 }]);
  s.wait(0.4);
  s.n('शाम का समय था। किशन अपने घर में चूल्हे के पास बैठा था।');
  s.card({ kind: 'note', text: 'ठक! ठक! ठक!', size: 80, y: 250 }, 2.6, false);
  s.n('कि तभी दरवाज़े पर दस्तक हुई।');
  s.wait(0.6);
});

story.shot('s40-guests', { scene: 'kishan-evening', sky: 'eveRoom', glow: 0.2, cam: [1600, 620, 1.1], camTo: [1700, 620, 1.28],
  cast: { meera: {}, kishan: {}, rakesh: { x: 2060, y: 862, facing: -1 }, neha: { x: 2200, y: 876, facing: -1 } } }, (s) => {
  s.act('kishan', ['sit', -1, 1.6]); s.act('kishan', ['walk', 2.2, 4.2, 1760]); s.act('kishan', ['emote', -0.5, END, { smile: 0.6, brow: 0 }]);
  s.act('meera', ['hold', 'ladle', -0.5, END, 'R']); s.act('meera', ['do', 'stir', -0.5, END, { dy: -20 }]);
  s.act('rakesh', ['walk', 3.0, 4.4, 2020]); s.act('neha', ['walk', 3.2, 4.6, 2160]);
  s.wait(4.8);
  s.say('kishan', 'अरे सर, मैडम! आप यहाँ, मेरे घर पर?', { emote: { smile: 0.8, eyeOpen: 1.2 }, to: 'rakesh' });
});

story.shot('s41-believe', { scene: 'kishan-evening', sky: 'eveRoom', glow: 0.2, cam: [1700, 620, 1.35], camTo: [1760, 620, 1.5],
  cast: { meera: {}, kishan: {}, rakesh: {}, neha: {} } }, (s) => {
  s.act('meera', ['look', 0, END, 'kishan']);
  s.say('rakesh', 'किशन जी, जो आपने कहा था, लगता है वो सब सच है।', { to: 'kishan', emote: { brow: 0.4 } });
  s.say('kishan', 'देखा! मैंने पहले ही कहा था, वो मोहन कोई साधारण आदमी नहीं है।', { to: 'rakesh', emote: { smile: 0.2, brow: 0.3 } });
  s.say('kishan', 'पर आपको यक़ीन ही नहीं हुआ।', { to: 'rakesh', emote: { smile: 0, brow: 0.2 } });
  s.say('rakesh', 'अब यक़ीन हो गया है, किशन। जो आज हमने देखा, उसके बाद शक की गुंजाइश नहीं बची।', { to: 'kishan', emote: { brow: 0.5 } });
});

story.shot('s42-saw', { scene: 'kishan-evening', sky: 'eveRoom', glow: 0.2, cam: [1700, 620, 1.35], camTo: [1760, 620, 1.5],
  cast: { meera: {}, kishan: {}, rakesh: {}, neha: {} } }, (s) => {
  s.act('meera', ['look', 0, END, 'kishan']);
  s.say('kishan', 'क्या देखा आपने?', { emote: { eyeOpen: 1.2, brow: 0.3 }, to: 'rakesh' });
  s.say('rakesh', 'हमने मोहन को जंगल की तरफ़ जाते देखा। एक थैली में कुछ था।', { to: 'kishan', emote: { brow: 0.3 } });
  s.say('rakesh', 'शायद वही राज़ छिपा है वहाँ।', { to: 'kishan', emote: { brow: 0.4 } });
  s.say('kishan', 'तो फिर देर किस बात की? चलो, आज उस जादू का पर्दा फाड़ ही देते हैं!', { gopts: { energy: 1.0, angry: true }, emote: { brow: -0.5, smile: 0.1, eyeOpen: 1.15 }, to: 'rakesh' });
});

story.shot('s43-meera', { scene: 'kishan-evening', sky: 'eveRoom', glow: 0.2, cam: [1550, 620, 1.3], camTo: [1700, 620, 1.35],
  cast: { meera: {}, kishan: {}, rakesh: {}, neha: {} } }, (s) => {
  s.act('meera', ['walk', 0, 1.6, 1300]); s.act('meera', ['do', 'worry', -0.5, 5.0, {}]); s.act('kishan', ['face', 0, -1]);
  s.say('meera', 'सँभलकर जाना जी… मुझे चिंता हो रही है।', { to: 'kishan', gopts: { energy: 0.5 }, emote: { brow: 0.7, smile: -0.3 } });
  s.say('kishan', 'चिंता मत करो मीरा। हम जल्दी लौट आएँगे।', { to: 'meera', emote: { smile: 0.5 } });
  s.act('kishan', ['walk', -2.0, 1.4, 2300]); s.act('rakesh', ['walk', -1.6, 1.8, 2500]); s.act('neha', ['walk', -1.4, 2.0, 2640]);
  s.wait(1.4);
});

// =================================================================================================================
// 9. INTO THE FOREST
// =================================================================================================================
story.shot('s44-forest-three', { scene: 'forest-night', sky: 'night', in: 'dip', cam: [600, CY, 1.15], camKeys: [[0, 650, CY, 1.15], [1, 2500, CY, 1.15]],
  cast: { kishan: { x: 450, y: 840, facing: 1 }, rakesh: { x: 300, y: 852, facing: 1 }, neha: { x: 150, y: 866, facing: 1 } } }, (s) => {
  s.act('kishan', ['hold', 'torch', -0.5, END, 'R']); s.act('kishan', ['do', 'torch', -0.5, END, {}]);
  s.act('kishan', ['walk', 0.5, 13.0, 2450]); s.act('rakesh', ['walk', 0.8, 13.2, 2300]); s.act('neha', ['walk', 1.0, 13.4, 2150]);
  s.act('kishan', ['look', 0, END, { x: 4000, y: 620 }]); s.act('rakesh', ['look', 0, END, { x: 4000, y: 620 }]); s.act('neha', ['look', 0, END, { x: 4000, y: 620 }]);
  s.wait(0.4);
  s.n('तीनों जंगल की ओर निकल पड़े।');
  s.n('हवा ठंडी थी, पेड़ झूम रहे थे और चारों तरफ़ एक रहस्यमय सन्नाटा था।');
  s.wait(1.5);
});

story.shot('s45-smell', { scene: 'forest-night', sky: 'night', cam: [2550, CY, 1.5], camTo: [2600, CY, 1.6],
  cast: { kishan: { x: 2450, y: 840 }, rakesh: { x: 2300, y: 852 }, neha: { x: 2150, y: 866 } } }, (s) => {
  s.act('kishan', ['hold', 'torch', -0.5, END, 'R']); s.act('kishan', ['do', 'torch', -0.5, END, {}]);
  s.act('kishan', ['walk', 0.0, 1.5, 2520]); s.act('rakesh', ['walk', 0.0, 1.6, 2370]); s.act('neha', ['walk', 0.0, 1.7, 2220]);
  s.wait(1.4);
  s.say('neha', 'सुनिए, यह कैसी गंध है? चिकन की खुशबू जैसी।', { to: 'rakesh', emote: { brow: 0.5 } });
  s.say('rakesh', 'लगता है मोहन ने ही चिकन लाया होगा।', { to: 'neha' });
  s.say('rakesh', 'दूसरा कौन जंगल में चिकन लाएगा?', { to: 'neha', emote: { smile: 0.1 } });
});

story.shot('s46-cave-seen', { scene: 'forest-night', sky: 'night', cam: [3150, CY, 1.15], camTo: [3300, CY, 1.3],
  props: [{ id: 'eyes', prop: 'eyes', x: 3850, y: 640, s: 0.37, z: -9998 }],
  cast: { kishan: { x: 2520, y: 840 }, rakesh: { x: 2370, y: 852 }, neha: { x: 2220, y: 866 } } }, (s) => {
  s.act('kishan', ['hold', 'torch', -0.5, END, 'R']); s.act('kishan', ['do', 'torch', -0.5, END, {}]);
  s.act('kishan', ['walk', 0.4, 6.0, 3000]); s.act('rakesh', ['walk', 0.6, 6.2, 2850]); s.act('neha', ['walk', 0.8, 6.4, 2700]);
  s.act('kishan', ['look', 0, END, { x: 3850, y: 600 }]); s.act('rakesh', ['look', 0, END, { x: 3850, y: 600 }]); s.act('neha', ['look', 0, END, { x: 3850, y: 600 }]);
  s.wait(0.4);
  s.n('कुछ दूर जाने पर उन्हें एक पुरानी गुफ़ा दिखाई दी।');
  s.n('गुफ़ा के भीतर से किसी के बड़बड़ाने की आवाज़ आ रही थी, जैसे कोई मंत्र पढ़ रहा हो।');
  s.wait(0.6);
});

story.shot('s47-dare', { scene: 'forest-night', sky: 'night', cam: [3000, CY, 1.55], camTo: [3030, CY, 1.65],
  props: [{ id: 'eyes', prop: 'eyes', x: 3850, y: 640, s: 0.37, z: -9998 }],
  cast: { kishan: { x: 3000, y: 840 }, rakesh: { x: 2850, y: 852 }, neha: { x: 2700, y: 866 } } }, (s) => {
  s.act('kishan', ['hold', 'torch', -0.5, END, 'R']); s.act('rakesh', ['do', 'rest', 0, 0.1, {}]);
  s.act('neha', ['do', 'worry', -0.5, END, {}]); s.act('neha', ['emote', -0.5, END, { brow: 0.8, smile: -0.5 }]);
  s.say('kishan', 'सुनो, यह आवाज़ मोहन की लग रही है।', { g: 'speakR', gopts: { energy: 0.6 }, to: 'rakesh', emote: { brow: 0.3 } });
  s.say('neha', 'मुझे डर लग रहा है। वापस चलें?', { g: 'fear', to: 'kishan', emote: { smile: -0.7, brow: 0.9, eyeOpen: 1.2 } });
  s.say('kishan', 'नहीं नेहा जी, अब पीछे नहीं हटेंगे। चलिए!', { g: 'speakR', gopts: { energy: 0.9 }, to: 'neha', emote: { brow: -0.3, smile: 0.1 } });
  s.n('तीनों धीरे-धीरे गुफ़ा के अंदर गए।');
  s.act('kishan', ['walk', -2.2, 1.5, 3500]); s.act('rakesh', ['walk', -2.0, 1.7, 3360]); s.act('neha', ['walk', -1.8, 1.9, 3220]);
  s.act('kishan', ['do', 'torch', -2.5, END, {}]);
});

// =================================================================================================================
// 10. INSIDE THE CAVE  +  THE END
// =================================================================================================================
story.shot('s48-trapped', { scene: 'cave-inside', sky: 'cave', in: 'dip', glow: 0.12, cam: [1150, 560, 1.1], camTo: [1200, 560, 1.22],
  props: [{ id: 'eyes', prop: 'eyes', x: 1280, y: 320, s: 1.7, z: -9998 }, { id: 'pot', prop: 'curryPan', x: 1560, y: 872, rx: 110, seed: 3, z: 870 }],
  cast: { mohan: { x: 1700, y: 862, facing: -1 }, kishan: { x: 500, y: 850, facing: 1 }, rakesh: { x: 360, y: 862, facing: 1 }, neha: { x: 220, y: 876, facing: 1 } } }, (s) => {
  s.act('mohan', ['do', 'chant', -0.5, END, {}]); s.act('mohan', ['look', 0, END, { x: 1280, y: 330 }]);
  s.act('kishan', ['hold', 'torch', -0.5, END, 'R']); s.act('kishan', ['do', 'torch', -0.5, 3, {}]);
  s.act('kishan', ['walk', 0.4, 3.0, 900]); s.act('rakesh', ['walk', 0.6, 3.2, 760]); s.act('neha', ['walk', 0.8, 3.4, 620]);
  for (const id of ['kishan', 'rakesh', 'neha']) { s.act(id, ['do', 'fear', 3.6, END, {}]); s.act(id, ['emote', 3.4, END, { smile: -0.8, brow: 0.9, eyeOpen: 1.3 }]); s.act(id, ['look', 0, END, { x: 1280, y: 330 }]); s.act(id, ['fx', 5.2, END, 'swirl']); }
  s.wait(4.0);
  s.n('उस रात के बाद किशन, राकेश और नेहा को किसी ने फिर कभी नहीं देखा।');
  s.wait(1.2);
});

story.shot('s49-secret', { scene: 'forest-night', sky: 'night', in: 'dip', cam: [3500, CY, 1.1], camTo: [3560, CY, 1.2],
  props: [{ id: 'eyes', prop: 'eyes', x: 3850, y: 640, s: 0.37, z: -9998 }], cast: {} }, (s) => {
  s.wait(0.6);
  s.n('कहते हैं, तीनों उसी गुफ़ा में क़ैद हो गए और मोहन का राज़, राज़ ही रह गया।');
  s.wait(1.0);
});

story.shot('s50-morning', STREET(['dawn', 'day'], { in: 'dip', cam: [MC + 280, CY, 1.12], camTo: [MC + 340, CY, 1.22], props: [birds, mCart()],
  cast: { mohan: { x: MC - 99, y: 790, facing: 1 }, ramu: { x: MC + 430, y: 850, facing: -1 }, bhola: { x: MC + 620, y: 858, facing: -1 }, sita: { x: MC + 800, y: 872, facing: -1 } } }), (s) => {
  cook(s, 'mohan'); s.act('mohan', ['emote', -0.5, END, { smile: 0.95 }]); s.act('mohan', ['look', 0, END, 'ramu']);
  eater(s, 'ramu'); eater(s, 'bhola'); eater(s, 'sita');
  s.do('ramu', 'eat', END, { period: 3.4 }); s.do('bhola', 'eat', END, { period: 3.1 }); s.do('sita', 'eat', END, { period: 3.6 });
  for (const id of ['ramu', 'bhola', 'sita']) s.act(id, ['look', 0, END, 'mohan']);
  s.wait(0.4);
  s.n('अगली सुबह मोहन ने हमेशा की तरह अपना ठेला लगाया।');
  s.n('मुस्कुराते हुए वह पूरी तलने लगा…');
  s.n('और इसी तरह ख़त्म हो गई कहानी, एक लालची आलू-पूरी वाले की।');
  s.wait(0.8);
});

story.shot('s51-moral', STREET(['day', 'sunset'], { cam: [MC + 300, CY, 1.0], camTo: [MC + 330, CY, 1.04], props: [mCart()], cast: {} }), (s) => {
  s.wait(0.5);
  s.n('बच्चो, याद रखना: लालच बुरी बला है!');
  s.card({ kind: 'title', text: 'सीख', sub: 'लालच बुरी बला है', size: 120, y: 300, bg: 'rgba(12,6,20,.5)' }, 12.5, false);
  s.n('सच्चाई और मेहनत से कमाई हुई रोटी ही सबसे मीठी होती है।');
  s.n('और किसी अनजान जगह पर बड़ों को बताए बिना कभी मत जाना।');
  s.wait(0.6);
});

story.shot('s52-end', STREET('sunset', { out: 'dip', dip: 1.2, cam: [MC + 300, CY, 1.04], camTo: [MC + 300, CY, 1.04], props: [mCart()], cast: {} }), (s) => {
  s.card({ kind: 'title', text: 'समाप्त', sub: 'कहानी पसंद आई? अगली कहानी में फिर मिलेंगे!', size: 130, y: 380, bg: 'rgba(12,6,20,.62)' }, 5.0, true);
});

export default story.build();
