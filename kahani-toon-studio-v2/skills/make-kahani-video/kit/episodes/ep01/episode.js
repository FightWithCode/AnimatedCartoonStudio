// Episode 01 — "रामू की चिकन करी" (Ramu's Chicken Curry). 72 s, silent, Hindi captions.
// This file is the SCRIPT: shots reference scenes, characters, props and gestures from /library by name.
// Script tuples per actor:  ['walk',t0,t1,x,(y)]  ['say',t0,t1]  ['do',gesture,t0,t1,opts]  ['hold',item,t0,t1,'R'|'L']
//                           ['look',t0,t1,actorId|{x,y}]  ['face',t,±1]  ['sit',t0,t1]  ['emote',t0,t1,{pose params}]
const CART = 1900;

export default {
  meta: { id: 'ep01', title: 'रामू की चिकन करी', duration: 72, fps: 30, width: 1920, height: 1080 },

  // Narration is the voice-over script (kept separately from the on-screen captions; the film is silent).
  narration: [
    { id: 'n1', start: 0, end: 6, text: 'चंदनपुर गाँव में भोर होने को थी।' },
    { id: 'n2', start: 6, end: 17, text: 'सीता हर सुबह मसालेदार चिकन करी बनाती थी, और रामू उसे अपने ठेले पर बेचता था।' },
    { id: 'n3', start: 17, end: 27, text: 'रामू ठेला लेकर गाँव के चौक पर पहुँचता, जहाँ पेड़ के नीचे उसकी रोज़ की जगह थी।' },
    { id: 'n4', start: 27, end: 37, text: 'ठेले पर गरम-गरम करी और रोटियाँ सजी थीं, और खुशबू से लोग खिंचे चले आते।' },
    { id: 'n5', start: 37, end: 47, text: 'सब रामू की करी की तारीफ़ करते। दादा बोले—वाह रामू! ऐसा स्वाद कहीं नहीं।' },
    { id: 'n6', start: 47, end: 58, text: 'तभी पड़ोसी मोहन आया, जो रामू से जलता था। बोला—इतनी सस्ती करी बेचकर तू कभी अमीर नहीं बनेगा!' },
    { id: 'n7', start: 58, end: 67, text: 'रामू मुस्कुराया और उसे एक थाली परोस दी। पहला निवाला खाते ही मोहन का गुस्सा पिघल गया।' },
    { id: 'n8', start: 67, end: 72, text: 'सच्चा स्वाद और अच्छा व्यवहार दिल जीत लेता है।' },
  ],
  captions: [
    { start: 0.5, end: 5.6, text: 'चंदनपुर गाँव में भोर होने को थी।' },
    { start: 6.5, end: 11.4, text: 'सीता हर सुबह मसालेदार चिकन करी बनाती थी,' },
    { start: 11.6, end: 16.6, text: 'और रामू उसे अपने ठेले पर बेचता था।' },
    { start: 17.5, end: 22.8, text: 'रामू ठेला लेकर गाँव के चौक पर पहुँचता,' },
    { start: 23.0, end: 26.8, text: 'जहाँ पेड़ के नीचे उसकी रोज़ की जगह थी।' },
    { start: 27.4, end: 32.0, text: 'ठेले पर गरम-गरम करी और रोटियाँ सजी थीं,' },
    { start: 32.2, end: 36.6, text: 'और खुशबू से लोग खिंचे चले आते।' },
    { start: 37.4, end: 41.8, text: 'सब रामू की करी की तारीफ़ करते।' },
    { start: 42.0, end: 46.6, text: 'दादा बोले—वाह रामू! ऐसा स्वाद कहीं नहीं।' },
    { start: 47.4, end: 51.8, text: 'तभी पड़ोसी मोहन आया, जो रामू से जलता था।' },
    { start: 52.0, end: 57.6, text: 'बोला—इतनी सस्ती करी बेचकर तू कभी अमीर नहीं बनेगा!' },
    { start: 58.4, end: 62.2, text: 'रामू मुस्कुराया और उसे एक थाली परोस दी।' },
    { start: 62.5, end: 66.6, text: 'पहला निवाला खाते ही मोहन का गुस्सा पिघल गया।' },
    { start: 67.3, end: 71.4, text: 'सच्चा स्वाद और अच्छा व्यवहार दिल जीत लेता है।' },
  ],

  shots: [
    { id: 's1-dawn', t: [0, 6], scene: 'village-street', sky: ['night', 'dawn'],
      camera: [[0, 1250, 520, 1.12], [6, 1750, 520, 1.12]],
      props: [{ id: 'birds', prop: 'birds', x: 1500, y: 240, z: -9999, n: 5 }], cast: {} },

    { id: 's2-kitchen', t: [6, 17], scene: 'kitchen', sky: 'warm', in: 'dip', glow: 0.18,
      camera: [[6, 1280, 560, 1.0], [17, 1330, 560, 1.22]],
      cast: {
        sita: { x: 1085, y: 862, facing: 1, script: [['do', 'stir', 5.6, 16.8, { dy: -20 }], ['hold', 'ladle', 5, 18, 'R'], ['say', 8.2, 10.8], ['say', 13.6, 15.2], ['look', 5, 12.5, { x: 1260, y: 600 }], ['look', 12.6, 16, 'ramu']] },
        ramu: { x: 1790, y: 872, facing: -1, script: [['sit', 4, 18], ['hold', 'plate', 5, 18, 'L'], ['do', 'hold', 12.0, 18, { only: 'L' }], ['do', 'eat', 5.6, 12.4, { period: 3.4 }], ['do', 'explain', 12.8, 16, {}], ['say', 12.9, 15.8], ['look', 5, 12.5, { x: 1500, y: 700 }], ['look', 12.6, 16.5, 'sita']] },
      } },

    { id: 's3-push', t: [17, 27], scene: 'village-street', sky: 'day', in: 'dip',
      camera: [[17, 1380, 560, 1.12], [24, 1700, 560, 1.12], [27, 1760, 560, 1.12]],
      props: [{ id: 'cart', prop: 'foodCart', x: 1450, y: 800, stand: false, script: [['walk', 17.4, 24.6, CART]] }],
      cast: { ramu: { x: 1450 - 500, y: 806, facing: 1, script: [['walk', 17.4, 24.6, CART - 500], ['do', 'carryHandle', 17, 24.4, {}], ['do', 'namaste', 25.2, 26.8, {}], ['say', 25.4, 26.4], ['look', 17, 27, { x: 2600, y: 600 }]] } } },

    { id: 's4-cart', t: [27, 37], scene: 'village-street', sky: 'day', in: 'dip',
      camera: [[27, 2020, 560, 1.5], [37, 2120, 560, 1.55]],
      props: [{ id: 'cart', prop: 'foodCart', x: CART, y: 800 }],
      cast: {
        ramu: { x: CART - 99, y: 790, facing: 1, script: [['do', 'stir', 26.6, 33.4, { dy: 36 }], ['hold', 'ladle', 26, 33.0, 'R'], ['do', 'offer', 34.6, 36.6, {}], ['hold', 'plate', 34.4, 37.2, 'R'], ['say', 33.8, 35.6], ['look', 27, 33, { x: CART + 43, y: 620 }], ['look', 33.2, 37, 'bhola']] },
        bhola: { x: 3000, y: 846, facing: -1, script: [['walk', 29, 34, 2330], ['do', 'wave', 34.2, 35.2, {}], ['look', 27, 37, 'ramu']] },
      } },

    { id: 's5-praise', t: [37, 47], scene: 'village-street', sky: 'day', in: 'dip',
      camera: [[37, 2180, 540, 1.3], [47, 2250, 540, 1.38]],
      props: [{ id: 'cart', prop: 'foodCart', x: CART, y: 800 }],
      cast: {
        ramu: { x: CART - 99, y: 790, facing: 1, script: [['do', 'stir', 36.6, 41, { dy: 36 }], ['hold', 'ladle', 36.2, 40.6, 'R'], ['do', 'namaste', 44.6, 46.8, {}], ['say', 44.9, 46.2], ['emote', 38, 47, { smile: 0.8 }], ['look', 37, 47, 'dada']] },
        bhola: { x: 2330, y: 850, facing: -1, script: [['hold', 'plate', 36, 47.5, 'L'], ['do', 'eat', 36.4, 44, { period: 3.3 }], ['do', 'hold', 43.6, 47.5, { only: 'L' }], ['emote', 41, 44, { smile: 0.9 }], ['look', 37, 47, 'ramu']] },
        dada: { x: 2640, y: 872, facing: -1, script: [['walk', 38.0, 41.8, 2530], ['do', 'explain2', 42.2, 46.4, {}], ['say', 42.3, 46.2], ['emote', 38, 47, { smile: 0.75 }], ['look', 37, 47, 'ramu']] },
      } },

    { id: 's6-mohan', t: [47, 58], scene: 'village-street', sky: 'day', in: 'dip',
      camera: [[47, 2330, 540, 1.3], [58, 2310, 540, 1.42]],
      props: [{ id: 'cart', prop: 'foodCart', x: CART, y: 800 }],
      cast: {
        ramu: { x: CART - 99, y: 790, facing: 1, script: [['emote', 47, 58, { smile: 0.25, brow: 0.2 }], ['look', 47, 58, 'mohan'], ['do', 'hips', 52, 57.4, {}]] },
        mohan: { x: 3300, y: 868, facing: -1, script: [['walk', 47.4, 51.2, 2740], ['do', 'explain2', 52.2, 57.4, {}], ['say', 52.3, 57.2], ['emote', 51, 58, { brow: -0.8, smile: -0.4 }], ['look', 47, 58, 'ramu']] },
        bhola: { x: 2330, y: 852, facing: -1, script: [['hold', 'plate', 46, 56, 'L'], ['do', 'hold', 45.6, 56, { only: 'L' }], ['do', 'eat', 47, 51, { period: 3.2 }], ['look', 47, 55, 'mohan'], ['walk', 55.4, 58, 3000], ['face', 55.3, 1]] },
        dada: { x: 2530, y: 874, facing: -1, script: [['do', 'arms', 46, 52, {}], ['look', 47, 58, 'mohan'], ['emote', 52, 58, { brow: 0.4, smile: -0.1 }], ['walk', 55.6, 57.6, 2590]] },
      } },

    { id: 's7-plate', t: [58, 67], scene: 'village-street', sky: 'day', in: 'dip',
      camera: [[58, 2260, 540, 1.38], [67, 2330, 540, 1.5]],
      props: [{ id: 'cart', prop: 'foodCart', x: CART, y: 800 }],
      cast: {
        ramu: { x: CART - 99, y: 790, facing: 1, script: [['do', 'offer', 58.4, 62.4, {}], ['hold', 'plate', 58.2, 62.6, 'R'], ['emote', 58, 67, { smile: 0.9 }], ['look', 58, 67, 'mohan']] },
        mohan: { x: 2740, y: 868, facing: -1, script: [['walk', 58.2, 60.6, 2290], ['emote', 58, 61, { brow: -0.5, smile: -0.1 }], ['hold', 'plate', 61.6, 67.4, 'L'], ['do', 'hold', 61.2, 67.4, { only: 'L' }], ['do', 'eat', 62.2, 65.6, { period: 3.2 }], ['emote', 64.6, 67, { brow: 0.3, smile: 0.9, eyeOpen: 1.1 }], ['look', 58, 67, 'ramu']] },
        dada: { x: 2590, y: 874, facing: -1, script: [['look', 58, 67, 'mohan'], ['emote', 60, 67, { smile: 0.8 }]] },
      } },

    { id: 's8-end', t: [67, 72], scene: 'village-street', sky: ['day', 'sunset'], in: 'dip', out: 'dip', dip: 0.7,
      camera: [[67, 2200, 540, 1.1], [72, 2260, 540, 1.16]],
      props: [{ id: 'cart', prop: 'foodCart', x: CART, y: 800 }],
      cast: {
        ramu: { x: CART - 99, y: 790, facing: 1, script: [['emote', 67, 72, { smile: 0.95 }], ['look', 67, 72, 'mohan']] },
        mohan: { x: 2290, y: 868, facing: -1, script: [['do', 'namaste', 67.4, 71.4, {}], ['emote', 67, 72, { smile: 0.95 }], ['look', 67, 72, 'ramu']] },
        dada: { x: 2590, y: 874, facing: -1, script: [['do', 'explain', 68, 71, {}], ['emote', 67, 72, { smile: 0.9 }], ['look', 67, 72, 'mohan']] },
        sita: { x: 2960, y: 884, facing: -1, script: [['walk', 67.1, 69.8, 2800], ['do', 'namaste', 69.6, 71.6, {}], ['emote', 67, 72, { smile: 0.9 }], ['look', 67, 72, 'ramu']] },
      } },
  ],
};
