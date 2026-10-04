/* ==========================================================================
   주인공 도트 스프라이트 (참고 이미지: 초록 머리 · 흰 도포에 금 테두리와 갈색 띠 · 언월도)
   · 앞(down)은 참고 이미지의 픽셀을 그대로 쓰고, 옆(left)·뒤(up)는 같은 색으로 새로 그렸다. 오른쪽은 왼쪽을 뒤집어 쓴다.
   · 캔버스 72×64, 몸 중심 x=36, 발끝 y=63. 걷기는 4프레임 [0,1,0,3] (0 = 서 있기, 1·3 = 걸음).
   ========================================================================== */
const HERO = (() => {
  const PW = 72, PH = 64;
  const REF = [
    '................................K.................',
    '...............................KYK................',
    '...............................KYK..KKKKK.........',
    '............................KK..KYKKYYYYYKK.......',
    '............................KGKKBYYYYGYYYYWK......',
    '.............................KGGYYYYYGGYYYYYK.....',
    '..............................KKYYYYYYYGYYYYWK....',
    '...............................KGYYGYYYGGYYYYWK...',
    '..............................KGYYGYYWYYGYYYYYK...',
    '..............................KGGGYYYBBYGYYGYYK...',
    '.............................KWGGGYYGWgGgYYGYYK...',
    '.............................KWWGGYgYgLGgGYGGGK...',
    '............................KWKWWGWLYLLGLGgGWGK...',
    '............................KWKKBWBcYLLGLGLWBWWK..',
    '............................KK.KgKKKYcLGLKKKgKKW..',
    '.............................K.KLBLYBgcgBYKBLK.WK.',
    '................................KBLYYLLcYYKBK..K..',
    '..............................WWWKLLLLLLLLLKW.....',
    '.................................WKLLLLLLLKW.WW...',
    '..................................BKKSKKKKB.......',
    '..................................KDlDlDdKKK......',
    '.................................KDlDDDlDmmnK.....',
    '................................KdDlDpDlDmnLLK....',
    '...............................KmDlDDDlDmnnLLK....',
    '...............................KdDlpplDdmnLLLLK...',
    '..............................KmdDlqplDrdnLLLLK...',
    '.............................KmKdDlqplDrdKLLLLK...',
    '.............................KnKrDlqplDsrKLLLLLK..',
    '............................KtLKrDlqqlDsrKLLLLLK..',
    '...........................KuuuKsDlqqlDsrKLLLLLK..',
    '..........................KsuurKsDlKKlDssKtttLtK..',
    '.........................KssssrKsDlqqlDsKsuttttK..',
    '.........................KlllrdKsDlKKlDsKssuuttK..',
    '........................KllKKldKsDlmmlDsKdrssutK..',
    '........................llKnKKlKlDlmnlDlDlllssuK..',
    '........................lKLLnKlDsDlKnlDslKnmlssK..',
    '.......................KKKKLLKLKlDlKnlDlKKLnmlsK..',
    '......................KnvK.KK.KslDlKnlDlKLLLnKlK..',
    '....................KKnKK.....KssDlKnlDsKKLKKKl...',
    '...................KLnK.......KlDlmKLlDslKKKll....',
    '.................KKKvK.......KlrDlnKLmlDslldK.....',
    '................KFFKK........KrDlmLKLnlDsrrlDK....',
    '...............KFFKFK.......KDrDlnLKKnlDrllDllK...',
    '.............KKKFKFKvK.....KlDdDlnLLKnlDdDDlKK....',
    '...........KKLvKKFKvnvK.....KlDlDLLLKnlDDllK......',
    '..........KLLmK.KKLLnKK......KlKmLLLKLDllDDK......',
    '.........KLnnK.KKLLnKK........K.KvLLKLnDDmmK......',
    '.......KKLnKK.KLLnnKK...........KLvvKvLLLLvK......',
    '.....KKLnnKK.KLnnKK.............KvvnmKvvvvK.......',
    '....KKnnKK..KLnnKK.............KvnnnmKnvvLK.......',
    '..KKnnKKK.KKnnKK.............KKLLnmmmKnnvvK.......',
    '.KKKKK..KKKKKK...............KLmmKKKKKnLLLK.......',
    '.......KKKK..................KKKK.....KnvvvK......',
    '......................................KnnLLK......',
    '.......................................KnnK.......',
    '.......................................KKKK.......'
  ];
  const PAL = { K: '#000000', Y: '#2c8569', G: '#24765c', B: '#0a3b2c', W: '#1d624c', g: '#e7e6e6', L: '#ffffff', c: '#d3d3d3', S: '#ebebeb', D: '#683c00', l: '#ebbc00', d: '#9cc88e', m: '#c6c6c6', n: '#d9d6d6', p: '#939393', q: '#a4a4a4', r: '#abd99c', s: '#c0ebb1', t: '#d9ebd3', u: '#caebbf', v: '#666666', F: '#494949' };
  const mkc = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  const px = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + .5) !== (yj > y + .5) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const poly = (g, pts, col) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) if (inPoly(pts, x, y)) px(g, x, y, typeof col === 'function' ? col(x, y) : col); };
  const ell = (g, cx, cy, rx, ry, col) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) px(g, x, y, typeof col === 'function' ? col(x, y) : col); } };
  const line = (g, x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) px(g, Math.round(x0 + (x1 - x0) * i / (n || 1)), Math.round(y0 + (y1 - y0) * i / (n || 1)), c); };
  const outline = src => {          // 투명한 칸 중 그림과 맞닿은 칸을 검게
    const [o, og] = mkc(), s = src.getContext('2d').getImageData(0, 0, PW, PH), d = s.data, out = og.createImageData(PW, PH), od = out.data;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const i = (y * PW + x) * 4; if (d[i + 3] > 40) { od[i] = d[i]; od[i + 1] = d[i + 1]; od[i + 2] = d[i + 2]; od[i + 3] = 255; continue; } let e = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + a, ny = y + b; if (nx >= 0 && ny >= 0 && nx < PW && ny < PH && d[(ny * PW + nx) * 4 + 3] > 40) { e = true; break; } } if (e) { od[i + 3] = 255; } }
    og.putImageData(out, 0, 0); return o;
  };
  /* 참고 이미지 → 캔버스 (열 c → x = c - 1, 행 i → y = 8 + i). dy: 위아래 이동, fn: 칸마다 바꿔 그리기 */
  const refPix = (g, dy = 0, keep = () => true, ox = 0) => REF.forEach((row, i) => { for (let c = 0; c < row.length; c++) { const ch = row[c]; if (ch !== '.' && keep(c, i, ch)) px(g, c - 1 + ox, 8 + i + dy, PAL[ch]); } });
  const isGlaive = (c, i) => c <= 28 && i >= 33;                 // 언월도(자루+날): 참고 이미지 왼쪽 아래 대각선
  const isLegs = (c, i) => c >= 29 && i >= 50;                   // 발
  /* ---- 앞 (참고 이미지 그대로) ---- */
  function down(f) {
    const [c, g] = mkc(), bob = (f === 1 || f === 3) ? -1 : 0;
    if (f === 3) { refPix(g, bob, (cc, i) => !isLegs(cc, i)); REF.forEach((row, i) => { if (i < 50) return; for (let cc = 29; cc <= 44; cc++) { const ch = row[cc]; if (ch && ch !== '.') px(g, (73 - cc) - 1, 8 + i + bob, PAL[ch]); } }); }
    else refPix(g, bob);
    return c;
  }
  /* ---- 공통 부품 ---- */
  const GR = ['#ffffff', '#f1f6ee', '#d9ebd3', '#c0ebb1', '#abd99c'];     // 도포: 위는 흰색, 아래로 갈수록 연초록
  const robeCol = (y, shade) => { const k = y < 38 ? 0 : y < 43 ? 1 : y < 48 ? 2 : y < 53 ? 3 : 4; return shade ? ['#e7e6e6', '#dfe9dc', '#cfe0c8', '#b3dca5', '#9cc88e'][k] : GR[k]; };
  const hairShade = (x, y, cx) => (x > cx + 4 || y > 22) ? '#24765c' : '#2c8569';
  const ahoge = (g, x, y) => { px(g, x, y, '#2c8569'); px(g, x, y - 1, '#2c8569'); px(g, x + 1, y - 2, '#2c8569'); px(g, x - 1, y, '#24765c'); };
  const glaive = (g, ox, oy, mirror) => REF.forEach((row, i) => { for (let c = 0; c < row.length; c++) { const ch = row[c]; if (ch === '.' || !isGlaive(c, i) || c > 26 && i < 38) continue; px(g, mirror ? ox - c : ox + c, oy + i, PAL[ch]); } });
  const boot = (g, x, y, face, w = 8, h = 6) => {      // 흰 장화
    rect(g, x, y, w, h, '#d9d6d6'); rect(g, x, y + h - 2, w, 2, '#a4a4a4'); rect(g, x + (face < 0 ? 0 : w - 3), y + 2, 3, 2, '#ffffff'); rect(g, x, y, w, 1, '#c6c6c6');
  };
  /* ---- 옆 (왼쪽을 본다) ---- */
  function left(f) {
    const [c, g] = mkc(), B = (f === 1 || f === 3) ? -1 : 0;
    // 다리(도포 아래로 보이는 장화): 걸음마다 앞뒤로 벌어진다
    const st = f === 1 ? [26, 41] : f === 3 ? [38, 31] : [32, 36], lift = f === 1 ? [-1, 0] : f === 3 ? [0, -1] : [0, 0];
    boot(g, st[1], 57 + lift[1], -1); boot(g, st[0], 57 + lift[0], -1);
    // 언월도: 앞쪽 손에서 아래로 늘어뜨린다
    glaive(g, 5, 10, false);
    // 뒷머리 꼬리
    poly(g, [[41, 19 + B], [48, 22 + B], [47, 29 + B], [43, 28 + B], [40, 23 + B]], '#24765c');
    // 몸: 도포
    poly(g, [[29, 28 + B], [44, 28 + B], [46, 40], [48, 58], [26, 58], [28, 40]], (x, y) => robeCol(y, x >= 43));
    // 금·갈색 앞 트임 띠와 밑단
    for (let y = 30 + B; y <= 56; y++) { const xe = Math.round(28 - 2 * (y - 28) / 29); px(g, xe + 1, y, '#ebbc00'); if (y % 3 !== 2) px(g, xe + 2, y, '#683c00'); }
    rect(g, 26, 55, 23, 1, '#ebbc00'); rect(g, 26, 56, 23, 1, '#683c00');
    ell(g, 32, 30 + B, 2.4, 2.4, '#ebbc00'); ell(g, 32, 30 + B, 1.2, 1.2, '#683c00');
    // 소매: 넓고 긴 소매가 몸 앞쪽에 걸쳐 내려온다
    poly(g, [[34, 29 + B], [43, 29 + B], [45, 38], [46, 47], [30, 47], [33, 38]], (x, y) => robeCol(y + 4, false));
    line(g, 34, 29 + B, 33, 38, '#000000'); line(g, 33, 38, 30, 47, '#000000'); line(g, 43, 29 + B, 45, 38, '#000000'); line(g, 45, 38, 46, 47, '#000000');
    rect(g, 30, 44, 17, 2, '#ebbc00'); rect(g, 30, 46, 17, 1, '#683c00');
    // 손
    rect(g, 29, 47, 3, 2, '#ffffff'); px(g, 29, 49, '#ffffff'); px(g, 30, 47, '#d3d3d3');
    // 목 · 머리
    rect(g, 33, 27 + B, 5, 2, '#ffffff');
    ell(g, 38, 17 + B, 10.5, 9.5, (x, y) => hairShade(x, y, 38));
    poly(g, [[28, 16 + B], [39, 15 + B], [41, 20 + B], [41, 26 + B], [35, 28 + B], [30, 26 + B], [28, 22 + B]], '#ffffff');
    px(g, 27, 21 + B, '#ffffff'); px(g, 41, 22 + B, '#d3d3d3'); px(g, 40, 21 + B, '#d3d3d3');
    // 앞머리: 이마를 덮고 한 가닥이 눈 쪽으로 내려온다
    poly(g, [[27, 13 + B], [41, 12 + B], [42, 17 + B], [38, 18 + B], [35, 23 + B], [33, 18 + B], [30, 19 + B], [27, 17 + B]], '#2c8569');
    px(g, 35, 24 + B, '#24765c'); px(g, 34, 22 + B, '#24765c');
    rect(g, 30, 20 + B, 2, 2, '#1d624c'); px(g, 30, 21 + B, '#0a3b2c');
    for (const [x, y] of [[33, 11], [37, 10], [41, 13], [44, 17], [41, 22], [43, 24]]) px(g, x, y + B, '#1d624c');
    ahoge(g, 38, 7 + B);
    return outline(c);
  }
  /* ---- 뒤 ---- */
  function up(f) {
    const [c, g] = mkc(), B = (f === 1 || f === 3) ? -1 : 0;
    const st = f === 1 ? [0, -1] : f === 3 ? [-1, 0] : [0, 0];
    boot(g, 29, 57 + st[0], 1, 7); boot(g, 38, 57 + st[1], 1, 7);
    // 언월도: 오른손(화면 오른쪽)에서 내려온다 — 참고 이미지를 좌우로 뒤집어 놓는다
    glaive(g, 73, 11, true);
    // 도포 뒷면
    poly(g, [[28, 28 + B], [44, 28 + B], [47, 40], [49, 58], [23, 58], [26, 40]], (x, y) => robeCol(y, x < 31));
    line(g, 36, 31 + B, 36, 54, '#d3d3d3'); line(g, 35, 36, 35, 54, '#e7e6e6');
    rect(g, 29, 28 + B, 14, 1, '#ebbc00'); rect(g, 30, 29 + B, 12, 1, '#683c00');
    rect(g, 23, 55, 27, 1, '#ebbc00'); rect(g, 23, 56, 27, 1, '#683c00');
    // 소매 (양쪽)
    poly(g, [[23, 29 + B], [29, 29 + B], [30, 38], [30, 47], [20, 47], [22, 38]], (x, y) => robeCol(y + 4, true));
    poly(g, [[43, 29 + B], [49, 29 + B], [51, 38], [52, 47], [42, 47], [43, 38]], (x, y) => robeCol(y + 4, false));
    line(g, 29, 29 + B, 30, 47, '#000000'); line(g, 43, 29 + B, 42, 47, '#000000');
    rect(g, 20, 44, 11, 2, '#ebbc00'); rect(g, 20, 46, 11, 1, '#683c00'); rect(g, 42, 44, 11, 2, '#ebbc00'); rect(g, 42, 46, 11, 1, '#683c00');
    rect(g, 22, 47, 3, 2, '#ffffff'); rect(g, 47, 47, 3, 2, '#ffffff');
    // 머리: 뒤통수는 전부 머리카락
    ell(g, 36, 17 + B, 11, 9.5, (x, y) => (x < 31 || y > 22) ? '#24765c' : '#2c8569');
    for (const x of [31, 35, 39, 43]) line(g, x, 11 + B, x + (x < 36 ? -1 : 1), 25 + B, '#1d624c');
    poly(g, [[27, 22 + B], [45, 22 + B], [46, 28 + B], [43, 26 + B], [40, 29 + B], [36, 26 + B], [32, 29 + B], [29, 26 + B], [26, 28 + B]], '#24765c');
    for (const x of [30, 34, 38, 42]) px(g, x, 27 + B, '#0a3b2c');
    ahoge(g, 37, 7 + B);
    return outline(c);
  }
  const build = () => { const S = {}; S.down = [0, 1, 2, 3].map(f => down(f)); S.left = [0, 1, 2, 3].map(f => left(f)); S.up = [0, 1, 2, 3].map(f => up(f)); S.right = S.left.map(c => { const [o, og] = mkc(); og.translate(PW, 0); og.scale(-1, 1); og.drawImage(c, 0, 0); return o; }); return S; };
  return { PW, PH, build };
})();
