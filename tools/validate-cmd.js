// 사용법: node validate.js [id ...]  — data/cmd/<id>.js 구조 검사(주제 7개 × 50개, 답변 5개씩, 중복·빈 문자열 없음)
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'data', 'cmd');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['kanehira','avyssion','shen','memory','lucien','caeluna','solaria','overseer'];
const topics = ['talk','ask','work','love','food','honest','hobby'];
let bad = 0;
for (const id of ids) {
  const f = path.join(dir, id + '.js'); if (!fs.existsSync(f)) { console.log(id, 'MISSING'); continue; }
  const ctx = { window: {} }; ctx.window.window = ctx.window;
  try { vm.runInNewContext(fs.readFileSync(f, 'utf8'), ctx); } catch (e) { console.log(id, 'SYNTAX', e.message); bad++; continue; }
  const d = ctx.window.CMD_DATA && ctx.window.CMD_DATA[id]; if (!d) { console.log(id, 'NO DATA'); bad++; continue; }
  const rep = [];
  if (!d.hello || d.hello.length !== 5) rep.push('hello=' + (d.hello ? d.hello.length : 0));
  for (const t of topics) {
    const a = d[t]; if (!a) { rep.push(t + ':none'); continue; }
    if (a.length !== 50) rep.push(`${t}:${a.length}개`);
    const qs = new Set();
    a.forEach((it, i) => {
      if (!Array.isArray(it) || typeof it[0] !== 'string' || !it[0].trim()) { rep.push(`${t}[${i}] 질문 이상`); return; }
      if (qs.has(it[0])) rep.push(`${t}[${i}] 질문 중복 "${it[0]}"`); qs.add(it[0]);
      const ans = it[1];
      if (!Array.isArray(ans) || ans.length !== 5) { rep.push(`${t}[${i}] 답변 ${ans && ans.length}개 "${it[0]}"`); return; }
      if (new Set(ans).size !== 5 || ans.some(x => typeof x !== 'string' || !x.trim())) rep.push(`${t}[${i}] 답변 중복/빈칸 "${it[0]}"`);
    });
  }
  if (d.rel) {
    let n = 0; for (const k of Object.keys(d.rel)) { n += d.rel[k].length; if (new Set(d.rel[k]).size !== d.rel[k].length) rep.push('rel 중복 ' + k); }
    const others = ['kanehira','avyssion','shen','memory','lucien','caeluna','solaria','overseer'].filter(x => x !== id);
    others.forEach(o => { if (!d.rel[o] || d.rel[o].length < 3) rep.push('rel 부족 ' + o); });
    if (!d.rel._all || d.rel._all.length < 2) rep.push('rel._all 부족');
    rep.push('(rel 답변 ' + n + '개)');
  } else rep.push('rel:none');
  console.log(id, rep.length ? rep.join(' | ') : 'OK'); if (rep.some(x => !x.startsWith('(rel') )) bad++;
}
process.exit(0);
