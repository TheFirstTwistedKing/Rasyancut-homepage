#!/usr/bin/env node
// 사용법: node tools/add-notice.js <major|medium|small> "제목" "본문 한 줄" ["- 목록 항목" ...] [--dry] [--tag=NEW|UPDATE|FIX|INFO]
//   major  = 크고 중요한 업데이트  → 버전 첫 자리 +1   (x.0.0)   태그 NEW
//   medium = 중간 규모 업데이트    → 버전 둘째 자리 +1 (x.y.0)   태그 UPDATE
//   small  = 소규모 수정           → 버전 셋째 자리 +1 (x.y.z)   태그 FIX
// index.html 의 NOTICES 맨 위에 'Patch v-X.Y.Z · 제목' 항목을 추가합니다(번호는 가장 최근 Patch 번호에서 자동 계산, 날짜는 오늘).
// 본문 인자: 일반 문장 = 문단, '- ' 로 시작하는 연속된 인자 = 점 목록.
// 예) node tools/add-notice.js medium "관리자 권한" "메뉴에 관리자 권한 버튼이 생겼어요." "- 코드를 입력하면 바로 사용할 수 있어요."
const fs = require('fs'), path = require('path'), vm = require('vm');
const file = path.join(__dirname, '..', 'index.html');
const args = process.argv.slice(2), flags = args.filter(a => a.startsWith('--')), pos = args.filter(a => !a.startsWith('--'));
const dry = flags.includes('--dry'), tagFlag = (flags.find(f => f.startsWith('--tag=')) || '').slice(6).toUpperCase();
const level = pos[0], title = pos[1], lines = pos.slice(2);
if (!['major', 'medium', 'small'].includes(level) || !title || !lines.length) { console.error('사용법: node tools/add-notice.js <major|medium|small> "제목" "본문" ["- 목록"...] [--dry] [--tag=...]'); process.exit(1); }
let html = fs.readFileSync(file, 'utf8');
const start = html.indexOf('const NOTICES = ['); if (start < 0) { console.error('NOTICES 를 찾을 수 없습니다'); process.exit(1); }
const open = html.indexOf('[', start), close = html.indexOf('\n];', start);
const before = vm.runInNewContext(html.slice(open, close + 2));
const last = before.map(n => /^Patch v-(\d+)\.(\d+)\.(\d+)/.exec(n.title)).find(Boolean);
let [X, Y, Z] = last ? last.slice(1).map(Number) : [1, 0, 0];
if (last) { if (level === 'major') { X++; Y = 0; Z = 0; } else if (level === 'medium') { Y++; Z = 0; } else Z++; }
const ver = `v-${X}.${Y}.${Z}`, tag = tagFlag || { major: 'NEW', medium: 'UPDATE', small: 'FIX' }[level];
const d = new Date(), date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
const body = []; let list = null;
for (const l of lines) { if (l.startsWith('- ')) { (list = list || []).push(l.slice(2)); } else { if (list) { body.push(list); list = null; } body.push(l); } }
if (list) body.push(list);
const id = `p${X}-${Y}-${Z}`;
if (before.some(n => n.id === id)) { console.error('이미 같은 번호의 공지가 있습니다: ' + id); process.exit(1); }
const entry = `  { id: ${JSON.stringify(id)}, tag: ${JSON.stringify(tag)}, date: ${JSON.stringify(date)}, title: ${JSON.stringify(`Patch ${ver} · ${title}`)}, body: ${JSON.stringify(body)} },\n`;
const marker = 'const NOTICES = [\n', at = html.indexOf(marker) + marker.length;
const out = html.slice(0, at) + entry + html.slice(at);
const o2 = out.indexOf('[', out.indexOf('const NOTICES = [')), c2 = out.indexOf('\n];', o2);
const after = vm.runInNewContext(out.slice(o2, c2 + 2));          // 문법 검사
if (after.length !== before.length + 1 || after[0].id !== id) { console.error('검증 실패'); process.exit(1); }
console.log(`${dry ? '[dry] ' : ''}Patch ${ver} (${tag}, ${date}) — ${title}`);
if (!dry) { fs.writeFileSync(file, out); console.log('index.html 의 공지에 추가했습니다. 공지는 총 ' + after.length + '개입니다.'); }
