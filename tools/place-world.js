#!/usr/bin/env node
/* 새 세계 지도(tools/build-map.js 가 만든 구역 격자)에 맞춰 index.html 의 WORLD 항목(도시·마을·신호·관문…) 위치를 다시 잡는다.
   - 원래 위치는 data/map/world-orig-pos.json (지도를 바꾸기 전 좌표)에서 읽는다 → 몇 번을 돌려도 같은 결과(결정적).
   - 같은 나라 안에서는 예전 배치의 상대 방향(서쪽/동쪽/북쪽…)을 그대로 살린다. 북두칠성(아스트랄리스)은 모양을 그대로 두고 크기·각도만 맞춘다.
   사용법: node tools/place-world.js          (결과만 출력)
           node tools/place-world.js --write  (index.html 의 WORLD 를 바꾼다) */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..');
const CFG = JSON.parse(fs.readFileSync(path.join(root, 'data/map/map-config.json'), 'utf8')), DY = CFG.dy || 0;
const MJ = JSON.parse(fs.readFileSync(path.join(root, 'data/map/map.json'), 'utf8')), PAD = MJ.pad || 0, W0 = MJ.w, W = W0 + 2 * PAD, H = MJ.h, N = W * H;   // 격자는 좌우로 PAD 씩 덧붙인 폭
const G = new Uint16Array(zlib.gunzipSync(fs.readFileSync(path.join(root, 'data/map/labels.u16.gz'))).buffer.slice(0));
const orig = JSON.parse(fs.readFileSync(path.join(root, 'data/map/world-orig-pos.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const wa = html.indexOf('const WORLD = ') + 'const WORLD = '.length, wb = html.indexOf('\n', wa);
const WORLD = JSON.parse(html.slice(wa, wb).replace(/;\s*$/, ''));

const NATION = { '아스트랄리스': 14, '코르닉시아': 12, '추풍': 16, '인페르누스 공화국': 5, '버믹쿠루시아': 10, '은월': 15, '레스렉시온': 11, '스텔루비아': 18, '글라시카에룰리아': 25, '솔라리아': 4, '루나시아': 3, '엘라렌': 8, '소버린 아일랜드': 19 };
const UNK = [[43, 56], [44, 5], [45, 2]];       // 이름 없는 구역('?')에 퍼뜨릴 미확인 신호 수(나머지는 43번)
const rng = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(20260101);

const inRegion = (id, x, y) => { x = Math.round(x) + PAD; y = Math.round(y - DY); if (x < 0 || y < 0 || x >= W || y >= H) return false; const v = G[y * W + x]; return (v & 255) === id && !(v & 256) && !(v & 1024); };
const isOcean = (x, y) => { x = Math.round(x) + PAD; y = Math.round(y - DY); if (x < 0 || y < 0 || x >= W || y >= H) return true; const v = G[y * W + x]; return !(v & 255) && !(v & 256) && !(v & 1024); };
function dtOf(id) {                                                    // 구역 안쪽 거리(경계·혈해까지)
  const D = new Float32Array(N); for (let i = 0; i < N; i++) { const v = G[i]; D[i] = ((v & 255) === id && !(v & 256)) ? 1e6 : 0; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!D[i]) continue; let v = D[i]; if (x > 0) v = Math.min(v, D[i - 1] + 1); else v = 1; if (y > 0) { v = Math.min(v, D[i - W] + 1); if (x > 0) v = Math.min(v, D[i - W - 1] + 1.414); if (x < W - 1) v = Math.min(v, D[i - W + 1] + 1.414); } else v = 1; D[i] = v; }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!D[i]) continue; let v = D[i]; if (x < W - 1) v = Math.min(v, D[i + 1] + 1); else v = 1; if (y < H - 1) { v = Math.min(v, D[i + W] + 1); if (x < W - 1) v = Math.min(v, D[i + W + 1] + 1.414); if (x > 0) v = Math.min(v, D[i + W - 1] + 1.414); } else v = 1; D[i] = v; }
  return D;
}
const DTS = {}, dt = id => DTS[id] || (DTS[id] = dtOf(id));
const gridOf = (x, y) => String.fromCharCode(65 + Math.floor((x - 10) / 110) + 1) + (Math.floor((y - 12) / 110) + 6);

function poisson(id, count, margin, avoid = [], avoidR = 0) {         // 구역 안쪽 후보점(서로 s 이상 떨어짐)
  const D = dt(id); let area = 0, pts = []; for (let i = 0; i < N; i++) { const cx = i % W; if (D[i] >= margin && cx >= PAD && cx < PAD + W0) { area++; if (!(i % 3)) pts.push(i); } }
  let s = Math.max(14, Math.min(48, .9 * Math.sqrt(area / (Math.max(count, 1) * 1.5))));
  for (let tries = 0; tries < 30; tries++) {
    const out = [], cell = s / Math.SQRT2, gw = Math.ceil(W0 / cell) + 2, grid = new Map();
    const ok = (x, y) => { const cx = Math.floor(x / cell), cy = Math.floor(y / cell); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const q = grid.get((cy + dy) * gw + cx + dx); if (q && Math.hypot(q[0] - x, q[1] - y) < s) return false; } return true; };
    for (const [ax, ay] of avoid) { const cx = Math.floor((ax) / cell), cy = Math.floor((ay - DY) / cell); grid.set(cy * gw + cx, [ax, ay - DY]); }
    const order = pts.map((p, k) => [rng(), p]).sort((a, b) => a[0] - b[0]);
    for (const [, p] of order) { const x = p % W - PAD, y = (p / W) | 0; if (avoid.some(a => Math.hypot(a[0] - x, a[1] - DY - y) < avoidR)) continue; if (ok(x, y)) { out.push([x, y + DY]); grid.set(Math.floor(y / cell) * gw + Math.floor(x / cell), [x, y]); } }
    if (out.length >= count * 2 || s <= 14) return out; s *= .88;
  }
  return [];
}
function assign(items, cands) {                                        // 예전 상대 위치(서/동/북/남)가 비슷한 후보점을 하나씩 준다
  const xs = items.map(t => t.x), ys = items.map(t => t.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const cx0 = Math.min(...cands.map(c => c[0])), cx1 = Math.max(...cands.map(c => c[0])), cy0 = Math.min(...cands.map(c => c[1])), cy1 = Math.max(...cands.map(c => c[1]));
  const nu = (v, a, b) => b > a ? (v - a) / (b - a) : .5;
  const cu = cands.map(c => [nu(c[0], cx0, cx1), nu(c[1], cy0, cy1)]), used = new Uint8Array(cands.length), res = new Map();
  const iu = items.map(t => [nu(t.x, x0, x1), nu(t.y, y0, y1)]);
  const ord = items.map((t, k) => k).sort((a, b) => Math.hypot(iu[b][0] - .5, iu[b][1] - .5) - Math.hypot(iu[a][0] - .5, iu[a][1] - .5));
  for (const k of ord) { let bi = -1, bd = 1e9; for (let j = 0; j < cands.length; j++) { if (used[j]) continue; const dd = Math.hypot(cu[j][0] - iu[k][0], cu[j][1] - iu[k][1]); if (dd < bd) { bd = dd; bi = j; } } used[bi] = 1; res.set(items[k].i, cands[bi]); }
  return res;
}

const pos = new Map();                                                 // i → [x, y]
const byNat = {}; orig.forEach(t => { (byNat[t.nat] = byNat[t.nat] || []).push(t); });

/* 아스트랄리스: 북두칠성은 모양 그대로 */
const DIPPER = ['두베', '메락', '페크다', '메그레즈', '알리오트', '미자르', '알카이드'];
{
  const ast = byNat['아스트랄리스'], dip = DIPPER.map(n => ast.find(t => t.n === n));
  const cxo = dip.reduce((a, t) => a + t.x, 0) / 7, cyo = dip.reduce((a, t) => a + t.y, 0) / 7, D = dt(14);
  let best = null;
  for (let th = -90; th <= 90; th += 3) for (let s = 2.2; s >= .6; s -= .05) {
    const c = Math.cos(th * Math.PI / 180), sn = Math.sin(th * Math.PI / 180), rel = dip.map(t => [(t.x - cxo) * s, (t.y - cyo) * s]).map(([x, y]) => [x * c - y * sn, x * sn + y * c]);
    let found = null;
    for (let gy = 90; gy < 330 && !found; gy += 6) for (let gx = 1100; gx < 1460; gx += 6) {
      let mn = 1e9, ok = true; for (const [rx, ry] of rel) { const x = Math.round(gx + rx) + PAD, y = Math.round(gy + ry); if (x < 0 || y < 0 || x >= W || y >= H) { ok = false; break; } const v = D[y * W + x]; if (v < 12) { ok = false; break; } mn = Math.min(mn, v); }
      if (ok) { found = { gx, gy, mn }; break; }
    }
    if (found && (!best || s > best.s + 1e-9 || (Math.abs(s - best.s) < 1e-9 && found.mn > best.mn))) best = { th, s, ...found, rel };
    if (found && best && best.s === s) { /* 같은 s 에서 다른 각도도 비교 */ }
  }
  if (!best) throw new Error('북두칠성을 놓을 곳이 없어요');
  dip.forEach((t, k) => pos.set(t.i, [best.gx + best.rel[k][0], best.gy + best.rel[k][1] + DY]));
  console.log('북두칠성: 각도', best.th, '배율', best.s.toFixed(2), '중심', best.gx, best.gy);
  const stars = dip.map(t => pos.get(t.i));
  const others = ast.filter(t => !DIPPER.includes(t.n)), gate = others.find(t => t.k === 'gate'), rest = others.filter(t => t !== gate);
  const cand = poisson(14, rest.length + 2, 12, stars, 26);
  const mp = assign(rest, cand); rest.forEach(t => pos.set(t.i, mp.get(t.i)));
  const meg = pos.get(dip[3].i), near = cand.filter(c => !rest.some(t => pos.get(t.i) === c)).map(c => [Math.hypot(c[0] - meg[0], c[1] - meg[1]), c]).filter(a => a[0] > 22).sort((a, b) => a[0] - b[0]);
  pos.set(gate.i, (near[0] || [0, cand[0]])[1]);
}

/* 나머지 나라 */
for (const [nat, id] of Object.entries(NATION)) {
  if (nat === '아스트랄리스') continue;
  const its = byNat[nat].filter(t => t.k !== 'walker'); const walker = byNat[nat].find(t => t.k === 'walker');
  const margin = id === 19 ? 6 : 9; const cands = poisson(id, its.length + (walker ? 1 : 0), margin);
  if (cands.length < its.length) throw new Error(nat + ': 후보점 부족 ' + cands.length + '/' + its.length);
  const mp = assign(its, cands); its.forEach(t => pos.set(t.i, mp.get(t.i)));
  if (walker) {                                                        // 세계화: 궤도(반지름 ~50)가 통째로 땅 위에 들어가는 가장 넓은 곳
    const D = dt(id); let bi = 0, bv = 0; for (let i = 0; i < N; i++) if (D[i] > bv && i % W >= PAD && i % W < PAD + W0) { bv = D[i]; bi = i; }
    walker.nc = [bi % W - PAD, ((bi / W) | 0) + DY]; console.log('세계화 궤도 중심', walker.nc, '여유', bv.toFixed(0));
  }
}

/* 이름 없는 구역: 미확인 신호 */
{
  const unk = byNat[''].filter(t => t.k === 'unk'); let at = 0;
  for (const [id, n] of UNK) {
    const take = id === 43 ? unk.length - UNK.slice(1).reduce((a, b) => a + b[1], 0) : n, its = unk.slice(at, at + take); at += take;
    const cands = poisson(id, its.length, 9); if (cands.length < its.length) throw new Error('미확인 구역 ' + id + ' 후보점 부족');
    const mp = assign(its, cands); its.forEach(t => pos.set(t.i, mp.get(t.i)));
  }
}

/* 바다 위 신호·관문: 예전 자리에서 가장 가까운 '바다'(땅·혈해·장막에서 20px 이상) */
{
  const sea = byNat['해상'], taken = [];
  const clear = (x, y) => { if (Math.hypot(x - 1000, y - 562) > 1040) return false; for (let a = 0; a < 360; a += 30) for (const r of [8, 20]) { if (!isOcean(x + Math.cos(a * Math.PI / 180) * r, y + Math.sin(a * Math.PI / 180) * r)) return false; } return isOcean(x, y) && !taken.some(q => Math.hypot(q[0] - x, q[1] - y) < 60); };
  for (const t of sea) {
    let p = null; if (clear(t.x, t.y)) p = [t.x, t.y]; else for (let r = 6; r < 700 && !p; r += 6) for (let a = 0; a < 360; a += 10) { const x = t.x + Math.cos(a * Math.PI / 180) * r, y = t.y + Math.sin(a * Math.PI / 180) * r; if (clear(x, y)) { p = [x, y]; break; } }
    if (!p) throw new Error('바다 자리 없음 ' + t.n); taken.push(p); pos.set(t.i, p);
  }
}

/* 반영 */
let moved = 0;
for (const t of WORLD.items) {
  const o = orig.find(q => q.i === t.i); let p = pos.get(t.i);
  if (o.k === 'walker') { const nc = byNat['엘라렌'].find(q => q.k === 'walker').nc; t.orb.cx = nc[0]; t.orb.cy = nc[1]; const dx = o.x - o.orb.cx, dy = o.y - o.orb.cy; t.x = +(nc[0] + dx).toFixed(1); t.y = +(nc[1] + dy).toFixed(1); t.g = gridOf(t.x, t.y); moved++; continue; }
  if (!p) throw new Error('위치 없음 ' + t.i + ' ' + t.n);
  t.x = Math.round(p[0]); t.y = Math.round(p[1]); t.g = gridOf(t.x, t.y); moved++;
}
console.log('옮긴 항목', moved, '/', WORLD.items.length);
if (process.argv.includes('--write')) { fs.writeFileSync(path.join(root, 'index.html'), html.slice(0, wa) + JSON.stringify(WORLD) + ';' + html.slice(wb)); console.log('index.html WORLD 교체 완료'); }
