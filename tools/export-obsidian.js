#!/usr/bin/env node
/* 세계관(CODEX)을 옵시디언용 마크다운으로 내보낸다.  사용법: node tools/export-obsidian.js
   결과: obsidian/라시안컷 세계관/ (허브 + 장마다 한 파일 + 지도 지명 목록). 폴더째 옵시디언 보관함에 넣으면 된다. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const grab = (a, b) => { const i = html.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a); return html.slice(i + a.length, html.indexOf(b, i + a.length)); };
const CODEX = vm.runInNewContext('[' + grab('const CODEX = [', '\n];') + ']');
const WORLD = JSON.parse(grab('const WORLD = ', ';\n'));
const out = path.join(root, 'obsidian', '라시안컷 세계관');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });

const fname = c => `${String(CODEX.indexOf(c) + 1).padStart(2, '0')} ${c.ko}`;
const byId = Object.fromEntries(CODEX.map(c => [c.id, c]));
const q = s => String(s).replace(/\n/g, ' ');
function block(b) {
  if (typeof b === 'string') return b + '\n';
  switch (b.t) {
    case 'sub': return `### ${b.x}\n`;
    case 'sub2': return `#### ${b.x}\n`;
    case 'ul': return b.x.map(s => `- ${q(s)}`).join('\n') + '\n';
    case 'ol': return b.x.map((s, i) => `${i + 1}. ${q(s)}`).join('\n') + '\n';
    case 'q': return `> ${q(b.x)}\n`;
    case 'note': return `> [!note] ${b.k}\n> ${q(b.x)}\n`;
    case 'kv': return '| 항목 | 내용 |\n|---|---|\n' + b.x.map(([k, v]) => `| ${q(k)} | ${q(v)} |`).join('\n') + '\n';
    case 'ladder': return b.x.map(([a, s], i) => `${i + 1}. **${q(a)}**${s ? ' — ' + q(s) : ''}`).join('\n') + '\n';
    case 'cards': return b.x.map(c => `**${c.h}**${c.en ? ` (${c.en})` : ''}\n${c.p}\n`).join('\n');
    case 'eras': return b.x.map(e => `#### ${e.n}\n` + e.i.map(([ko, en, dead]) => `- ${ko}${en ? ` (${en})` : ''}${dead ? ' — 멸망' : ''}`).join('\n') + '\n').join('\n');
    case 'defs': return b.x.map(([h, en, p]) => `- **${h}**${en ? ` (${en})` : ''}: ${q(p)}`).join('\n') + '\n';
    case 'chips': return b.x.map(s => `\`${s}\``).join(' ') + '\n';
    case 'legend': return `*${b.x}*\n`;
    case 'jump': { const t = byId[b.to]; return t ? `→ [[${fname(t)}|${b.x}]]\n` : ''; }
    default: return '';
  }
}
const fm = (o) => '---\n' + Object.entries(o).map(([k, v]) => `${k}: ${Array.isArray(v) ? '[' + v.join(', ') + ']' : JSON.stringify(v)}`).join('\n') + '\n---\n\n';
const w = (n, s) => fs.writeFileSync(path.join(out, n + '.md'), s);

CODEX.forEach((c, i) => {
  let s = fm({ title: c.ko, aliases: [c.en].filter(Boolean), tags: ['라시안컷', '세계관'], chapter: c.no });
  s += `# ${c.no}. ${c.ko}${c.en ? ` (${c.en})` : ''}\n\n${c.blurb ? `> ${c.blurb}\n\n` : ''}`;
  c.entries.forEach(e => {
    s += `## ${e.h}${e.en ? ` (${e.en})` : ''}\n\n`;
    if (e.lead) s += `**${e.lead}**\n\n`;
    s += e.b.map(block).join('\n') + '\n';
  });
  const prev = CODEX[i - 1], next = CODEX[i + 1];
  s += '---\n' + [prev && `이전: [[${fname(prev)}]]`, next && `다음: [[${fname(next)}]]`, '[[00 세계관 허브|허브로]]'].filter(Boolean).join(' · ') + '\n';
  w(fname(c), s);
});

// 지도 지명 목록: 국가별 표
const kindKo = { city: '도시', town: '마을', sig: '신호', gate: '관문', walker: '이동 신호', unk: '미확인 신호' };
const nats = {}; WORLD.items.forEach(it => { (nats[it.nat || '미분류'] = nats[it.nat || '미분류'] || []).push(it); });
let m = fm({ title: '지도 지명 목록', tags: ['라시안컷', '세계관', '지도'] }) + '# 지도 지명 목록\n\n관측소 지도에 표시되는 지명입니다. 격자는 지도 위 칸 번호입니다.\n\n';
Object.entries(nats).sort((a, b) => b[1].length - a[1].length).forEach(([n, list]) => {
  m += `## ${n}\n\n| 이름 | 종류 | 격자 | 설명 |\n|---|---|---|---|\n` + list.map(it => `| ${it.n}${it.en ? ` (${it.en})` : ''}${it.cap ? ' ★수도' : ''} | ${kindKo[it.k] || it.k} | ${it.g || ''} | ${q(it.d || '').slice(0, 160)} |`).join('\n') + '\n\n';
});
w('지도 지명 목록', m);

// 허브
let hub = fm({ title: '라시안컷 세계관 허브', tags: ['라시안컷', '세계관', '허브'] }) + '# 라시안컷 세계관\n\n사이트의 세계관 기록(CODEX)을 옵시디언용으로 옮긴 노트입니다. 장마다 한 파일입니다.\n\n## 장\n\n';
CODEX.forEach(c => { hub += `- [[${fname(c)}]] — ${c.blurb || ''}\n`; });
hub += '\n## 함께 보기\n\n- [[지도 지명 목록]]\n';
w('00 세계관 허브', hub);
console.log('옵시디언 노트 생성:', path.relative(root, out), '— 장', CODEX.length, '+ 허브 + 지도 지명 목록');
