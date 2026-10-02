// 사용법: node tools/inline-cmd.js
// data/cmd/<id>.js 의 내용을 index.html 안(CMD-DATA:BEGIN ~ END 사이)에 그대로 넣습니다.
// 대화 데이터를 고친 뒤 이 도구를 실행하면 index.html 한 파일만으로도(별도 파일을 못 불러오는 환경에서도) 사령관 통신이 동작합니다.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), htmlPath = path.join(root, 'index.html');
const ids = ['kanehira', 'avyssion', 'shen', 'memory', 'lucien', 'caeluna', 'solaria', 'overseer', 'sender'];
const B = '<!-- CMD-DATA:BEGIN -->', E = '<!-- CMD-DATA:END -->';
let html = fs.readFileSync(htmlPath, 'utf8');
const i = html.indexOf(B), j = html.indexOf(E);
if (i < 0 || j < i) { console.error('index.html 에 CMD-DATA 표시가 없습니다'); process.exit(1); }
const body = ids.map(id => {
  const js = fs.readFileSync(path.join(root, 'data', 'cmd', id + '.js'), 'utf8').trim();
  if (/<\/script/i.test(js)) throw new Error(id + ': </script 가 들어 있습니다');
  return `<script data-cmd="${id}">\n${js}\n</script>`;
}).join('\n');
html = html.slice(0, i + B.length) + '\n' + body + '\n' + html.slice(j);
fs.writeFileSync(htmlPath, html);
console.log('index.html 에 사령관 데이터 ' + ids.length + '개를 넣었습니다 (' + Math.round(body.length / 1024) + 'KB)');
