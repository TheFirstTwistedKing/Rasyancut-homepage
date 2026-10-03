// 사용법: node tools/build-laugh.js
// scenes/laugh/laugh-a|b|c.mp3 를 base64 로 바꿔 scenes/laugh-data.js 에 저장합니다. 이후 node tools/inline-scenes.js 로 index.html 에 넣으세요.
const fs = require('fs'), path = require('path'), d = path.join(__dirname, '..', 'scenes');
const o = {}; for (const k of ['a', 'b', 'c']) o[k] = fs.readFileSync(path.join(d, 'laugh', `laugh-${k}.mp3`)).toString('base64');
fs.writeFileSync(path.join(d, 'laugh-data.js'), `/* 자동 생성: tools/build-laugh.js — 웃음소리 3종(기본 + 변형 2개) */\nconst LAUGH_B64 = ${JSON.stringify(o)};\n`);
console.log('laugh-data.js 생성', Object.values(o).reduce((s, v) => s + v.length, 0), 'bytes');
