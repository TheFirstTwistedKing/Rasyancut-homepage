// 사용법: node tools/build-3d.js
// 3d/src/*.js 를 순서대로 합치고 3d/vendor/three.min.js 와 함께 3d/template.html 에 넣어 3d/index.html (단일 파일, 인터넷 없이 동작)을 만듭니다.
const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', '3d');
const three = fs.readFileSync(path.join(dir, 'vendor', 'three.min.js'), 'utf8');
const game = fs.readdirSync(path.join(dir, 'src')).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(dir, 'src', f), 'utf8')).join('\n');
let html = fs.readFileSync(path.join(dir, 'template.html'), 'utf8');
html = html.replace('<script>/*THREE*/</script>', () => '<script>' + three + '</script>').replace('<script>/*GAME*/</script>', () => '<script>(function(){\n' + game + '\n})();</script>');
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('3d/index.html 생성', (html.length / 1048576).toFixed(2) + 'MB');
