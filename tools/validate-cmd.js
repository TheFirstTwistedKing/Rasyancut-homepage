// 사용법: node tools/validate-cmd.js [id ...]
// data/cmd/<id>.js 구조 검사
//  · 일반 사령관 8명: 주제 6개 × 질문 50개, 질문마다 답변 5개(중복·빈 문자열 없음), hello 5개, 관계(rel) 답변
//  · sender(발신자 표시 제한): info 50개 · fortune 40개 이상, 질문마다 답변 5개 + 키워드, hello 5개, vague 3개 이상,
//    그리고 각 질문 문장을 그대로 입력했을 때 자기 자신이 가장 높은 점수로 잡히는지(키워드 충돌) 확인
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'data', 'cmd');
const STD = ['kanehira', 'avyssion', 'shen', 'memory', 'lucien', 'caeluna', 'solaria', 'overseer'];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : [...STD, 'sender'];
const topics = ['talk', 'ask', 'work', 'food', 'honest', 'hobby'];
const norm = t => t.toLowerCase().replace(/[\s.,!?~…·'"“”‘’()\-_/]/g, '');
let bad = 0;

function checkRows(rep, t, a, need, withKw) {
  if (!a) { rep.push(t + ':none'); return; }
  if (need === 50 ? a.length !== 50 : a.length < need) rep.push(`${t}:${a.length}개`);
  const qs = new Set();
  a.forEach((it, i) => {
    if (!Array.isArray(it) || typeof it[0] !== 'string' || !it[0].trim()) { rep.push(`${t}[${i}] 질문 이상`); return; }
    if (qs.has(it[0])) rep.push(`${t}[${i}] 질문 중복 "${it[0]}"`); qs.add(it[0]);
    const ans = it[1];
    if (!Array.isArray(ans) || ans.length !== 5) { rep.push(`${t}[${i}] 답변 ${ans && ans.length}개 "${it[0]}"`); return; }
    if (new Set(ans).size !== 5 || ans.some(x => typeof x !== 'string' || !x.trim())) rep.push(`${t}[${i}] 답변 중복/빈칸 "${it[0]}"`);
    if (withKw && (!Array.isArray(it[2]) || !it[2].length)) rep.push(`${t}[${i}] 키워드 없음 "${it[0]}"`);
  });
}

for (const id of ids) {
  const f = path.join(dir, id + '.js'); if (!fs.existsSync(f)) { console.log(id, 'MISSING'); bad++; continue; }
  const ctx = { window: {} }; ctx.window.window = ctx.window;
  try { vm.runInNewContext(fs.readFileSync(f, 'utf8'), ctx); } catch (e) { console.log(id, 'SYNTAX', e.message); bad++; continue; }
  const d = ctx.window.CMD_DATA && ctx.window.CMD_DATA[id]; if (!d) { console.log(id, 'NO DATA'); bad++; continue; }
  const rep = [];
  if (!d.hello || d.hello.length !== 5) rep.push('hello=' + (d.hello ? d.hello.length : 0));
  if (id === 'sender') {
    checkRows(rep, 'info', d.info, 50, true); checkRows(rep, 'fortune', d.fortune, 40, true);
    if (!d.vague || d.vague.length < 3) rep.push('vague 부족');
    ['love', 'talk', 'rel'].forEach(k => { if (d[k]) rep.push(k + ' 는 있으면 안 됩니다'); });
    const match = text => { const t = norm(text); let best = null, bs = 0;
      ['info', 'fortune'].forEach(tp => (d[tp] || []).forEach((it, i) => { let s = 0; (it[2] || []).forEach(k => { const kk = norm(k); if (kk && t.includes(kk)) s += kk.length + 1; }); if (s > bs) { bs = s; best = [tp, i]; } }));
      return best; };
    ['info', 'fortune'].forEach(tp => (d[tp] || []).forEach((it, i) => { const m = match(it[0]); if (!m || m[0] !== tp || m[1] !== i) rep.push(`키워드 충돌 ${tp}[${i}] "${it[0]}" → ${m ? m.join('.') : '없음'}`); }));
  } else {
    for (const t of topics) checkRows(rep, t, d[t], 50, false);
    if (d.love) rep.push('love 는 삭제된 주제입니다');
    if (d.rel) {
      let n = 0; for (const k of Object.keys(d.rel)) { n += d.rel[k].length; if (new Set(d.rel[k]).size !== d.rel[k].length) rep.push('rel 중복 ' + k); }
      STD.filter(x => x !== id).forEach(o => { if (!d.rel[o] || d.rel[o].length < 3) rep.push('rel 부족 ' + o); });
      if (!d.rel._all || d.rel._all.length < 2) rep.push('rel._all 부족');
      rep.push('(rel 답변 ' + n + '개)');
    } else rep.push('rel:none');
  }
  console.log(id, rep.filter(x => !x.startsWith('(rel')).length ? rep.join(' | ') : 'OK ' + rep.filter(x => x.startsWith('(rel')).join(''));
  if (rep.some(x => !x.startsWith('(rel'))) bad++;
}
process.exit(bad ? 1 : 0);
