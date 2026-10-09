#!/usr/bin/env node
/* 세계 지도 벡터화: data/map/world-map.webp(손그림 지도) → index.html 의 `const MAP = {...}`
   - 흰 땅 / 회색 바다 / 검은 해안선 / 회색 국경선 / 빨강 빗금(혈해) / 초록 빗금(블러드러스트 발생 가능 구역)을 색으로 갈라
     해안선·구역(나라)·혈해·블러드러스트·소버린 아일랜드를 SVG path 로 만든다.
   - 나라(구역) 배정: data/map/map-config.json 의 seeds(씨앗 좌표)를 국경선(벽)을 넘지 않고 땅 위로 번지게 해서 정한다.
   사용법: node tools/build-map.js            (data/map/map.json 만 만든다)
           node tools/build-map.js --inject   (index.html 의 MAP 도 바꾼다)
   필요: ImageMagick(convert) — webp 를 읽기 위해서만 쓴다. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..');
const CFG = JSON.parse(fs.readFileSync(path.join(root, 'data/map/map-config.json'), 'utf8'));

/* ---------- 이미지 읽기 ---------- */
const ppm = cp.execFileSync('convert', [path.join(root, 'data/map/world-map.webp'), '-depth', '8', 'ppm:-'], { maxBuffer: 1 << 28 });
let p = 0; const tok = []; while (tok.length < 4) { let s = ''; while (ppm[p] > 32) s += String.fromCharCode(ppm[p++]); p++; tok.push(s); }
const W0 = +tok[1], H = +tok[2], raw = Buffer.from(ppm.subarray(p));
/* 범례(좌상단 글씨·견본)는 바다색으로 지운다. */
for (const [x0, x1, y0, y1] of CFG.legend) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * W0 + x) * 3; raw[i] = 176; raw[i + 1] = 177; raw[i + 2] = 195; }
/* 이 지도는 좌우로 이어진다(양쪽 가장자리의 대륙·혈해가 서로 맞물림). 원반이 그림보다 넓으니 좌우에 PAD 만큼 맞은편 그림을 덧붙여서 처리한다. 좌표는 마지막에 PAD 를 빼 그림 기준으로 돌려놓는다. */
const PAD = CFG.pad || 0, W = W0 + 2 * PAD, N = W * H, d = Buffer.alloc(N * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = ((x - PAD) % W0 + W0) % W0, j = (y * W0 + sx) * 3, i = (y * W + x) * 3; d[i] = raw[j]; d[i + 1] = raw[j + 1]; d[i + 2] = raw[j + 2]; }
const SHIFT = [0, -W0, W0];                       // 같은 상자를 맞은편 덧붙임에도 적용
const boxAll = (m, [x0, x1, y0, y1], v) => { for (const o of SHIFT) box(m, x0 + o + PAD, x1 + o + PAD, y0, y1, v); };
const U8 = () => new Uint8Array(N);

/* ---------- 마스크 도구 ---------- */
function dilate(m, r) {
  const a = U8(), b = U8();
  for (let y = 0; y < H; y++) { let last = -1e9; for (let x = 0; x < W; x++) { if (m[y * W + x]) last = x; a[y * W + x] = x - last <= r ? 1 : 0; } last = 1e9; for (let x = W - 1; x >= 0; x--) { if (m[y * W + x]) last = x; if (last - x <= r) a[y * W + x] = 1; } }
  for (let x = 0; x < W; x++) { let last = -1e9; for (let y = 0; y < H; y++) { if (a[y * W + x]) last = y; b[y * W + x] = y - last <= r ? 1 : 0; } last = 1e9; for (let y = H - 1; y >= 0; y--) { if (a[y * W + x]) last = y; if (last - y <= r) b[y * W + x] = 1; } }
  return b;
}
const inv = m => { const o = U8(); for (let i = 0; i < N; i++) o[i] = m[i] ? 0 : 1; return o; };
const erode = (m, r) => inv(dilate(inv(m), r));
function blur(m, r, th = .5) {          // 상자 흐림 3번 → 문턱값: 모서리를 둥글게
  let a = Float32Array.from(m), b = new Float32Array(N);
  for (let it = 0; it < 3; it++) {
    for (let y = 0; y < H; y++) { let s = 0; const k = 2 * r + 1; for (let x = -r; x <= r; x++) s += a[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { b[y * W + x] = s / k; s += a[y * W + Math.min(W - 1, x + r + 1)] - a[y * W + Math.max(0, x - r)]; } }
    for (let x = 0; x < W; x++) { let s = 0; const k = 2 * r + 1; for (let y = -r; y <= r; y++) s += b[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { a[y * W + x] = s / k; s += b[Math.min(H - 1, y + r + 1) * W + x] - b[Math.max(0, y - r) * W + x]; } }
  }
  const o = U8(); for (let i = 0; i < N; i++) o[i] = a[i] >= th ? 1 : 0; return o;
}
function comps(mask, conn = 4) {
  const lab = new Int32Array(N), info = [null]; let n = 0; const st = [];
  for (let s = 0; s < N; s++) {
    if (!mask[s] || lab[s]) continue; n++; let a = 0, sx = 0, sy = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; st.push(s); lab[s] = n;
    while (st.length) {
      const i = st.pop(); a++; const x = i % W, y = (i / W) | 0; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
      if (conn === 8) { if (x > 0 && y > 0) nb.push(i - W - 1); if (x < W - 1 && y > 0) nb.push(i - W + 1); if (x > 0 && y < H - 1) nb.push(i + W - 1); if (x < W - 1 && y < H - 1) nb.push(i + W + 1); }
      for (const j of nb) if (j >= 0 && mask[j] && !lab[j]) { lab[j] = n; st.push(j); }
    }
    info.push({ id: n, a, cx: sx / a, cy: sy / a, x0, x1, y0, y1 });
  }
  return { lab, info };
}
const dropSmall = (m, min, conn = 4) => { const { lab, info } = comps(m, conn); const o = U8(); for (let i = 0; i < N; i++) if (lab[i] && info[lab[i]].a >= min) o[i] = 1; return o; };
const flood = (seed, pass) => { const o = U8(), st = []; for (let i = 0; i < N; i++) if (seed[i] && pass[i]) { o[i] = 1; st.push(i); } while (st.length) { const i = st.pop(), x = i % W, y = (i / W) | 0; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && pass[j] && !o[j]) { o[j] = 1; st.push(j); } } return o; };
const box = (m, x0, x1, y0, y1, v) => { for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) m[y * W + x] = v; };

/* ---------- 색 분류 ---------- */
const O = U8(), K = U8(), Gr = U8(), R = U8(), Gn = U8();
for (let i = 0; i < N; i++) {
  const r = d[i * 3], g = d[i * 3 + 1], b = d[i * 3 + 2];
  if (r >= 165 && r <= 205 && Math.abs(r - g) <= 7 && b - r >= 7 && b - r <= 32) O[i] = 1;        // 바다색
  if (r < 70 && g < 70 && b < 70) K[i] = 1;                                                       // 검은 선
  if (Math.abs(r - g) < 14 && Math.abs(g - b) < 14 && r >= 95 && r <= 170) Gr[i] = 1;             // 회색(국경선)
  if (r > 170 && g < 120 && b < 120 && r - g > 80) R[i] = 1;                                      // 빨강 빗금
  if (g > r + 35 && g > b + 35) Gn[i] = 1;                                                        // 초록 빗금
}

/* ---------- 바다 · 혈해 · 블러드러스트 ---------- */
let O1 = dropSmall(dilate(erode(O, 1), 1), 80);
const oc = dilate(O1, 2);
let Z = erode(dilate(R, 9), 8); Z = dropSmall(Z, 300);            // 혈해: 빗금을 한 덩어리로
for (const b of CFG.redText) boxAll(Z, b, 0);   // 빨간 글씨(지명) 오검출 제거
let Gz = erode(dilate(Gn, 7), 6); Gz = dropSmall(Gz, 250);        // 블러드러스트
Z = blur(Z, 4); Gz = blur(Gz, 3);
let land = U8(); for (let i = 0; i < N; i++) land[i] = !oc[i] && !Z[i] ? 1 : 0;
for (const b of CFG.noLand) boxAll(land, b, 0);
land = dropSmall(land, 40);
for (let i = 0; i < N; i++) if (Gz[i] && !land[i]) Gz[i] = 0;     // 블러드러스트는 땅 위에만

/* ---------- 국경선 ---------- */
const nearK = dilate(K, 4);
let B = U8(); for (let i = 0; i < N; i++) B[i] = Gr[i] && !nearK[i] && land[i] ? 1 : 0;
for (const b of CFG.grayText) boxAll(B, b, 0);
{ const { lab, info } = comps(B, 8); B = U8(); for (let i = 0; i < N; i++) if (lab[i] && info[lab[i]].a >= 60) B[i] = 1; }
B = dilate(B, 1);

/* 세선화 → 끝점 → 해안까지 연장(그림에서 끊긴 국경선을 닫는다) */
function thin(m) {
  const g = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : m[y * W + x]; let ch = true, it = 0;
  while (ch && it < 60) {
    ch = false; it++;
    for (let pass = 0; pass < 2; pass++) {
      const del = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (!m[y * W + x]) continue;
        const p2 = g(x, y - 1), p3 = g(x + 1, y - 1), p4 = g(x + 1, y), p5 = g(x + 1, y + 1), p6 = g(x, y + 1), p7 = g(x - 1, y + 1), p8 = g(x - 1, y), p9 = g(x - 1, y - 1);
        const A = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2), Bn = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (Bn < 2 || Bn > 6 || A !== 1) continue;
        if (pass === 0) { if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue; } else { if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue; }
        del.push(y * W + x);
      }
      if (del.length) { ch = true; for (const i of del) m[i] = 0; }
    }
  }
  return m;
}
const wall = U8(); for (let i = 0; i < N; i++) wall[i] = B[i];
{
  const sk = thin(Uint8Array.from(B));
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!sk[y * W + x]) continue; let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && sk[(y + dy) * W + x + dx]) n++;
    if (n !== 1) continue;
    let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H || !land[yy * W + xx]) { near = true; break; } }
    if (near) continue;
    let px = x, py = y, pv = [-1, -1], k = 0; const tr = [[x, y]];
    for (; k < 14; k++) { let nx = -1, ny = -1; for (let dy = -1; dy <= 1 && nx < 0; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = px + dx, yy = py + dy; if (xx === pv[0] && yy === pv[1]) continue; if (sk[yy * W + xx]) { nx = xx; ny = yy; break; } } if (nx < 0) break; pv = [px, py]; px = nx; py = ny; tr.push([px, py]); }
    if (tr.length < 8) continue;
    let vx = x - px, vy = y - py; const L = Math.hypot(vx, vy); vx /= L; vy /= L;
    for (let s = 1; s <= 90; s++) { const xx = Math.round(x + vx * s), yy = Math.round(y + vy * s); if (xx < 1 || yy < 1 || xx >= W - 1 || yy >= H - 1 || !land[yy * W + xx]) break; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) wall[(yy + dy) * W + xx + dx] = 1; }
  }
}
for (const w of CFG.walls) for (let k = 0; k + 1 < w.length; k++) { const [x0, y0] = [w[k][0] + PAD, w[k][1]], [x1, y1] = [w[k + 1][0] + PAD, w[k + 1][1]], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let t = 0; t <= n; t++) { const x = Math.round(x0 + (x1 - x0) * t / n), y = Math.round(y0 + (y1 - y0) * t / n); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) wall[(y + dy) * W + x + dx] = 1; } }

/* ---------- 소버린 아일랜드: 타원형 장막 안의 섬 ---------- */
const [ox, oy] = [CFG.oval[0] + PAD, CFG.oval[1]];                                          // 타원 안쪽의 한 점
const blob = (() => { const c = comps(land, 4); const id = c.lab[oy * W + ox]; const o = U8(); for (let i = 0; i < N; i++) if (c.lab[i] === id) o[i] = 1; return o; })();
for (let i = 0; i < N; i++) if (blob[i]) land[i] = 0;
const wh = U8(); for (let i = 0; i < N; i++) wh[i] = blob[i] && d[i * 3] >= 225 && d[i * 3 + 1] >= 225 && d[i * 3 + 2] >= 225 ? 1 : 0;
const edge = U8(); { const er = erode(blob, 6); for (let i = 0; i < N; i++) edge[i] = blob[i] && !er[i] ? 1 : 0; }
const band = flood(edge, wh), bd5 = dilate(band, 5), bd2 = dilate(band, 2);
const inner = U8(); for (let i = 0; i < N; i++) inner[i] = blob[i] && !bd2[i] ? 1 : 0;
const seaSeed = U8(); for (let i = 0; i < N; i++) seaSeed[i] = inner[i] && bd5[i] && wh[i] ? 1 : 0;
const sea = flood(seaSeed, wh);
let isl = U8(); for (let i = 0; i < N; i++) isl[i] = inner[i] && !sea[i] ? 1 : 0;
isl = dilate(erode(isl, 3), 3);
{ const c = comps(isl, 4); isl = U8(); for (let i = 0; i < N; i++) { const q = c.info[c.lab[i]]; if (q && q.a >= 150 && q.x1 - q.x0 < 250 && q.y1 < CFG.oval[2]) isl[i] = 1; } }
const ring = U8(); for (let i = 0; i < N; i++) ring[i] = blob[i] && !inner[i] ? 1 : 0;

/* ---------- 구역(나라) 나누기: 씨앗에서 국경선(벽)을 넘지 않고 번지기 ---------- */
const lab = new Int16Array(N), q = [];
for (const [id, ps] of Object.entries(CFG.seeds)) for (const [x0, y] of ps) { const x = x0 + PAD;
  let best = -1, bd = 1e9; for (let dy = -25; dy <= 25; dy++) for (let dx = -25; dx <= 25; dx++) { const j = (y + dy) * W + x + dx; if (land[j] && !wall[j]) { const dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = j; } } }
  if (best < 0) { console.warn('씨앗이 땅에 없음', id, x, y); continue; } if (!lab[best]) { lab[best] = +id; q.push(best); }
}
for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, y = (i / W) | 0; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && land[j] && !wall[j] && !lab[j]) { lab[j] = lab[i]; q.push(j); } }
{ // 벽 위 픽셀 · 섬: 가장 가까운(바다를 건너도 됨) 구역으로
  const fr = []; const dist = new Int16Array(N).fill(-1), src = new Int16Array(N);
  for (let i = 0; i < N; i++) if (lab[i]) { dist[i] = 0; src[i] = lab[i]; fr.push(i); }
  for (let h = 0; h < fr.length; h++) { const i = fr[h], x = i % W, y = (i / W) | 0; if (dist[i] > 300) continue; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && dist[j] < 0) { dist[j] = dist[i] + 1; src[j] = src[i]; fr.push(j); } }
  const L0 = U8(); for (let i = 0; i < N; i++) L0[i] = land[i] && !wall[i] ? 1 : 0; const cc = comps(L0, 4);
  const vote = {}; for (let i = 0; i < N; i++) if (cc.lab[i] && !lab[i] && src[i]) { const v = vote[cc.lab[i]] || (vote[cc.lab[i]] = {}); v[src[i]] = (v[src[i]] || 0) + 1; }
  const cl = {}; for (const [c, v] of Object.entries(vote)) cl[c] = +Object.entries(v).sort((a, b) => b[1] - a[1])[0][0];
  for (let i = 0; i < N; i++) if (land[i] && !lab[i]) { if (cc.lab[i] && cl[cc.lab[i]]) lab[i] = cl[cc.lab[i]]; else if (src[i]) lab[i] = src[i]; }
}
for (let i = 0; i < N; i++) if (isl[i]) lab[i] = 19;               // 소버린 아일랜드
const allLand = U8(); for (let i = 0; i < N; i++) allLand[i] = (land[i] || isl[i]) ? 1 : 0;

/* ---------- 윤곽선 → path ---------- */
function loops(mask) {
  const nxt = new Map(), V = (x, y) => y * (W + 1) + x, add = (x0, y0, x1, y1) => { const k = V(x0, y0); let a = nxt.get(k); if (!a) { a = []; nxt.set(k, a); } a.push([x1, y1]); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue;
    if (y === 0 || !mask[(y - 1) * W + x]) add(x, y, x + 1, y);
    if (x === W - 1 || !mask[y * W + x + 1]) add(x + 1, y, x + 1, y + 1);
    if (y === H - 1 || !mask[(y + 1) * W + x]) add(x + 1, y + 1, x, y + 1);
    if (x === 0 || !mask[y * W + x - 1]) add(x, y + 1, x, y);
  }
  const out = [];
  for (const [k0, arr0] of nxt) while (arr0.length) {
    const sx = k0 % (W + 1), sy = (k0 / (W + 1)) | 0; let cx = sx, cy = sy, pdx = 0, pdy = 0; const pts = [[sx, sy]]; let e = arr0.pop();
    for (;;) {
      const dx = e[0] - cx, dy = e[1] - cy; cx = e[0]; cy = e[1]; pdx = dx; pdy = dy; if (cx === sx && cy === sy) break; pts.push([cx, cy]);
      const a = nxt.get(V(cx, cy)); if (!a || !a.length) break;
      if (a.length === 1) e = a.pop(); else { let bi = 0, bs = -9; for (let i = 0; i < a.length; i++) { const cr = pdx * (a[i][1] - cy) - pdy * (a[i][0] - cx); if (cr > bs) { bs = cr; bi = i; } } e = a.splice(bi, 1)[0]; }
    }
    out.push(pts);
  }
  return out;
}
function dp(pt, eps) {
  if (pt.length < 4) return pt; let b = 0, bd = -1; for (let i = 1; i < pt.length; i++) { const dd = (pt[i][0] - pt[0][0]) ** 2 + (pt[i][1] - pt[0][1]) ** 2; if (dd > bd) { bd = dd; b = i; } }
  const half = (s, e) => { const keep = new Uint8Array(pt.length); keep[s] = keep[e] = 1; const st = [[s, e]]; while (st.length) { const [i, j] = st.pop(); let md = 0, mi = -1; const [x0, y0] = pt[i], [x1, y1] = pt[j], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1; for (let k = i + 1; k < j; k++) { const dd = Math.abs((pt[k][0] - x0) * dy - (pt[k][1] - y0) * dx) / L; if (dd > md) { md = dd; mi = k; } } if (md > eps) { keep[mi] = 1; st.push([i, mi], [mi, j]); } } const r = []; for (let k = s; k <= e; k++) if (keep[k]) r.push(pt[k]); return r; };
  const A = half(0, b), Bp = half(b, pt.length - 1).concat([pt[0]]); return A.slice(0, -1).concat(Bp.slice(0, -1));
}
const r1 = v => Math.round(v * 10) / 10, DY = CFG.dy || 0;
const smooth = pts => { pts = pts.map(q => [q[0] - PAD, q[1]]); const n = pts.length; if (n < 3) return ''; const m = i => { const a = pts[i % n], b = pts[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + DY]; }; let s = 'M' + r1(m(n - 1)[0]) + ' ' + r1(m(n - 1)[1]); for (let i = 0; i < n; i++) { const c = pts[i], mm = m(i); s += 'Q' + r1(c[0]) + ' ' + r1(c[1] + DY) + ' ' + r1(mm[0]) + ' ' + r1(mm[1]); } return s + 'Z'; };
const area = pt => { let s = 0; for (let i = 0; i < pt.length; i++) { const a = pt[i], b = pt[(i + 1) % pt.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s / 2); };
const svg = (mask, eps = 1, minA = 16) => { let s = ''; for (const l of loops(mask)) { if (area(l) < minA) continue; const t = dp(l, eps); if (t.length < 3) continue; s += smooth(t); } return s; };

/* 거리 변환(체펜): 구역마다 이름표 자리(가장 안쪽 점)와 안쪽 반지름을 구한다 */
function dt(mask) {
  const D = new Float32Array(N); for (let i = 0; i < N; i++) D[i] = mask[i] ? 1e6 : 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!D[i]) continue; let v = D[i]; if (x > 0) v = Math.min(v, D[i - 1] + 1); else v = 1; if (y > 0) { v = Math.min(v, D[i - W] + 1); if (x > 0) v = Math.min(v, D[i - W - 1] + 1.414); if (x < W - 1) v = Math.min(v, D[i - W + 1] + 1.414); } else v = 1; D[i] = v; }   // 그림 가장자리는 바깥이 비어 있다고 본다
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!D[i]) continue; let v = D[i]; if (x < W - 1) v = Math.min(v, D[i + 1] + 1); else v = 1; if (y < H - 1) { v = Math.min(v, D[i + W] + 1); if (x < W - 1) v = Math.min(v, D[i + W + 1] + 1.414); if (x > 0) v = Math.min(v, D[i + W - 1] + 1.414); } else v = 1; D[i] = v; }
  return D;
}
const regions = []; const ids = [...new Set(Array.from(lab).filter(Boolean))].sort((a, b) => a - b);
for (const id of ids) {
  const m = U8(); let a = 0; for (let i = 0; i < N; i++) if (lab[i] === id && allLand[i]) { m[i] = 1; a++; }
  const D = dt(m); let bi = 0, bv = 0; for (let i = 0; i < N; i++) if (D[i] > bv) { bv = D[i]; bi = i; }       // 가장 안쪽 점 = 이름표 자리
  const lc = comps(m, 8); if (lc.info.length > 2) { const big = lc.info.slice(1).sort((a, b) => b.a - a.a)[0]; bv = 0; for (let i = 0; i < N; i++) if (lc.lab[i] === big.id && D[i] > bv) { bv = D[i]; bi = i; } }   // 땅이 여러 덩어리면 가장 큰 덩어리에서
  const o = CFG.labelAt && CFG.labelAt[id]; const px = o ? o[0] : bi % W - PAD, py = (o ? o[1] : (bi / W) | 0) + DY;
  regions.push({ id, d: svg(m), px: Math.round(px), py: Math.round(py), area: a, r: Math.round(bv) });
}

const coastComps = comps(allLand, 8), coasts = [], small = U8();
for (const c of coastComps.info.slice(1).sort((a, b) => b.a - a.a)) { const m = U8(); for (let i = 0; i < N; i++) if (coastComps.lab[i] === c.id) m[i] = 1; if (c.a >= 4000) coasts.push(svg(m)); else for (let i = 0; i < N; i++) if (m[i]) small[i] = 1; }
const smallD = svg(small); if (smallD) coasts.push(smallD);

const smoothLand = blur(allLand, 2), shelf = [svg(dilate(smoothLand, 34), 1.4), svg(dilate(smoothLand, 15), 1.4)];
const topo = [14, 30, 54, 84, 120].map(r => svg(erode(allLand, r), 1.3, 60)).filter(Boolean);

function hazLabels(mask, k, minA) {         // 혈해·블러드러스트 덩어리마다 이름표 자리
  const c = comps(mask, 8), out = [], D = dt(mask);
  for (const q of c.info.slice(1)) { if (q.a < minA) continue; let bi = 0, bv = 0; for (let y = q.y0; y <= q.y1; y++) for (let x = q.x0; x <= q.x1; x++) { const i = y * W + x; if (c.lab[i] === q.id && D[i] > bv) { bv = D[i]; bi = i; } } out.push({ k, px: bi % W - PAD, py: ((bi / W) | 0) + DY, r: Math.round(bv), a: q.a }); }
  return out.sort((a, b) => b.a - a.a);
}
const MAP = {
  regions, coasts, isl: [], shelf, topo, rivers: [], peaks: '',
  blood: svg(Z, 1.2, 60), rust: svg(Gz, 1.2, 60), ring: svg(ring, 1, 60), hz: hazLabels(Z, 'b', 3000).concat(hazLabels(Gz, 'r', 3000)),
  w: W0, h: H, pad: PAD,
};
/* 픽셀별 구역 번호(+혈해/블러드러스트/장막 비트) — 항목 배치 도구(place-world.js)가 읽는다. 하위 8비트 = 구역 id, 256 = 혈해, 512 = 블러드러스트, 1024 = 장막 */
{ const g = new Uint16Array(N); for (let i = 0; i < N; i++) g[i] = lab[i] | (Z[i] ? 256 : 0) | (Gz[i] ? 512 : 0) | (blob[i] && !isl[i] ? 1024 : 0);
  fs.writeFileSync(path.join(root, 'data/map/labels.u16.gz'), require('zlib').gzipSync(Buffer.from(g.buffer), { level: 9 })); }
const out = path.join(root, 'data/map/map.json'); fs.writeFileSync(out, JSON.stringify(MAP));
console.log('MAP', (JSON.stringify(MAP).length / 1024).toFixed(0) + 'KB', '구역', regions.map(r => r.id + ':' + r.area).join(' '), '해안', coasts.length, '등고선', topo.length);

if (process.argv.includes('--inject')) {
  const f = path.join(root, 'index.html'); let h = fs.readFileSync(f, 'utf8');
  const a = h.indexOf('\nconst MAP = '), b = h.indexOf('\n', a + 1); if (a < 0) throw new Error('index.html 에 const MAP 이 없어요');
  h = h.slice(0, a) + '\nconst MAP = ' + JSON.stringify(MAP) + ';' + h.slice(b); fs.writeFileSync(f, h); console.log('index.html MAP 교체 완료');
}
