// 사용법: node tools/inline-scenes.js
// scenes/ 폴더의 연출 코드(HTML · CSS · JS)를 index.html 안의 SCENES-* 표시 사이에 넣습니다.
// 연출을 고친 뒤 이 도구를 실행하면 index.html 한 파일만으로 동작합니다(별도 파일 불필요).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), htmlPath = path.join(root, 'index.html'), dir = path.join(root, 'scenes');
const rd = f => fs.readFileSync(path.join(dir, f), 'utf8').trim();
let html = fs.readFileSync(htmlPath, 'utf8');
function put(b, e, body) {
  const i = html.indexOf(b), j = html.indexOf(e); if (i < 0 || j < i) throw new Error('표시를 찾을 수 없음: ' + b);
  html = html.slice(0, i + b.length) + '\n' + body + '\n' + html.slice(j);
}
put('<!-- SCENES-HTML:BEGIN -->', '<!-- SCENES-HTML:END -->', rd('scenes.html'));
put('/* SCENES-CSS:BEGIN */', '/* SCENES-CSS:END */', rd('scenes.css'));
put('/* SCENES-JS:BEGIN */', '/* SCENES-JS:END */', ['core.js', 'game.js', 'rss.js', 'desk.js', 'eye.js'].map(rd).join('\n\n'));
fs.writeFileSync(htmlPath, html);
console.log('index.html 에 신호기 연출을 넣었습니다');
