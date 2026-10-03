/* ==========================================================================
   신호 I — 설립자의 회장실 (쯔꾸르풍 탑다운). WASD 이동 · Shift 달리기 · Space/Enter/E 조사
   ========================================================================== */
const Game = (() => {
  const T = 32; let COLS = 48, ROWS = 34, WW = COLS * T, WH = ROWS * T;
  const cv = $('#gCv'), ctx = cv.getContext('2d'), msgEl = $('#gMsg'), nameEl = $('#gName'), txtEl = $('#gTxt'), nextEl = $('#gNext'), choiceEl = $('#gChoice'), padEl = $('#gPad'), stickEl = $('#gStick'), actBtn = $('#gAct');
  const C = { wd: '#3b2414', wm: '#5b3a1f', wl: '#7a5230', wh: '#946a3f', gold: '#c9a94c', gl: '#f1dc8c', gd: '#8f7530', blk: '#0a0908', ink: '#17130e', paper: '#e9e2cf', steel: '#8a949e', stl: '#c6cfd6' };
  let on = false, raf = 0, last = 0, Z = 2, vw = 0, vh = 0, dpr = 1, camX = 0, camY = 0, clock = 0;
  const keys = new Set(), joy = { x: 0, y: 0 };
  let busyMsg = false, choice = null, lines = [], li = 0, msgDone = null;
  const P = { x: 21.5 * T, y: 13.7 * T, dir: 'up', t: 0, moving: false, step: 0 };
  const rnd = rng(77);
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g, w, h); return c; };
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

  /* ---------- 월드 그리기: 바닥 · 벽 · 카펫 (한 번만 그려 둔다) ---------- */
  let floorC = null, objs = [], solids = [];
  function buildFloor() {
    return mk(WW, WH, (g) => {
      for (let ty = 3; ty < ROWS - 1; ty++) for (let tx = 1; tx < COLS - 1; tx++) {
        const x = tx * T, y = ty * T, k = .92 + rnd() * .16, h = (tx + ty) % 2;
        R(g, x, y, T, T, shade('#5b3a22', k));
        for (let p = 0; p < 2; p++) {
          const px = h ? x + p * 16 : x, py = h ? y : y + p * 16, pw = h ? 16 : T, ph = h ? T : 16, kk = .9 + rnd() * .2;
          R(g, px, py, pw, ph, shade(p ? '#68432a' : '#5a3a22', kk)); R(g, px, py, pw, 1, 'rgba(255,220,160,.07)'); R(g, px + pw - 1, py, 1, ph, 'rgba(0,0,0,.28)'); R(g, px, py + ph - 1, pw, 1, 'rgba(0,0,0,.28)');
        }
      }
      // 카펫
      const rx = 15 * T, ry = 15 * T, rw = 18 * T, rh = 14 * T;
      R(g, rx - 6, ry - 6, rw + 12, rh + 12, '#0b0907'); R(g, rx - 3, ry - 3, rw + 6, rh + 6, C.gold); R(g, rx, ry, rw, rh, '#10281f');
      g.strokeStyle = C.gd; g.lineWidth = 2; g.strokeRect(rx + 12, ry + 12, rw - 24, rh - 24); g.strokeStyle = 'rgba(241,220,140,.55)'; g.lineWidth = 1; g.strokeRect(rx + 20, ry + 20, rw - 40, rh - 40);
      for (let i = 0; i < 36; i++) { const a = rx + 30 + i * (rw - 60) / 35; R(g, a, ry + 14, 3, 3, C.gl); R(g, a, ry + rh - 17, 3, 3, C.gl); }
      for (let i = 0; i < 28; i++) { const b = ry + 30 + i * (rh - 60) / 27; R(g, rx + 14, b, 3, 3, C.gl); R(g, rx + rw - 17, b, 3, 3, C.gl); }
      const cx = rx + rw / 2, cy = ry + rh / 2;
      g.strokeStyle = C.gold; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 104, 0, 7); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 90, 0, 7); g.stroke(); g.setLineDash([3, 5]); g.beginPath(); g.arc(cx, cy, 74, 0, 7); g.stroke(); g.setLineDash([]);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; g.strokeStyle = i % 6 ? C.gd : C.gl; g.lineWidth = i % 6 ? 1 : 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 104, cy + Math.sin(a) * 104); g.lineTo(cx + Math.cos(a) * (i % 6 ? 112 : 120), cy + Math.sin(a) * (i % 6 ? 112 : 120)); g.stroke(); }
      g.fillStyle = C.gold; g.beginPath(); g.moveTo(cx, cy - 56); g.lineTo(cx + 40, cy); g.lineTo(cx, cy + 56); g.lineTo(cx - 40, cy); g.closePath(); g.fill(); g.fillStyle = '#10281f'; g.beginPath(); g.moveTo(cx, cy - 44); g.lineTo(cx + 30, cy); g.lineTo(cx, cy + 44); g.lineTo(cx - 30, cy); g.closePath(); g.fill();
      g.strokeStyle = C.gl; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.stroke(); g.fillStyle = C.gl; g.fillRect(cx - 3, cy - 3, 6, 6);
      g.strokeStyle = C.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 90, cy); g.bezierCurveTo(cx - 60, cy - 30, cx - 40, cy + 30, cx - 20, cy); g.moveTo(cx + 90, cy); g.bezierCurveTo(cx + 60, cy + 30, cx + 40, cy - 30, cx + 20, cy); g.stroke();
      // 연습용 매트(남서쪽)
      R(g, 3 * T, 25 * T, 6 * T, 5 * T, '#2a1d12'); R(g, 3 * T + 4, 25 * T + 4, 6 * T - 8, 5 * T - 8, '#6b2a22'); g.strokeStyle = C.gd; g.lineWidth = 2; g.strokeRect(3 * T + 10, 25 * T + 10, 6 * T - 20, 5 * T - 20);
      // 벽: 위
      for (let x = 0; x < WW; x += 16) R(g, x, 0, 16, 64, (x / 16) % 2 ? '#211c16' : '#27211a');
      for (let x = 0; x < WW; x += 32) { R(g, x + 6, 10, 4, 44, 'rgba(201,169,76,.05)'); }
      R(g, 0, 0, WW, 5, C.gd); R(g, 0, 5, WW, 2, C.gl); R(g, 0, 7, WW, 2, '#3a2c10');
      R(g, 0, 64, WW, 32, '#2c1d12'); for (let x = 0; x < WW; x += 32) { R(g, x + 3, 70, 26, 20, '#35241a'); R(g, x + 3, 70, 26, 1, 'rgba(255,220,160,.1)'); R(g, x + 3, 89, 26, 1, 'rgba(0,0,0,.4)'); }
      R(g, 0, 62, WW, 3, C.gold); R(g, 0, 65, WW, 1, '#000'); R(g, 0, 93, WW, 3, '#1a110a'); R(g, 0, 96, WW, 3, 'rgba(0,0,0,.45)');
      // 벽: 좌우·아래
      const side = (x0) => { R(g, x0, 0, T, WH, '#1b1712'); R(g, x0 + (x0 ? 0 : T - 3), 0, 3, WH, C.gd); };
      side(0); side(WW - T); R(g, 0, WH - T, WW, T, '#1b1712'); R(g, 0, WH - T, WW, 3, C.gd); R(g, 0, WH - T + 3, WW, 1, C.gl); R(g, T, WH - T - 6, WW - 2 * T, 6, 'rgba(0,0,0,.35)');
      for (let y = 0; y < WH; y += 4) { R(g, 0, y, 3, 1, 'rgba(0,0,0,.35)'); }
      // 창문(밤 풍경) 2개 + 달빛
      [[17, 3], [28, 3]].forEach(([tx, w]) => {
        const x = tx * T, y = 10, ww = w * T, wh = 52;
        R(g, x - 4, y - 4, ww + 8, wh + 8, C.gd); R(g, x - 2, y - 2, ww + 4, wh + 4, '#0b0907');
        const gr = g.createLinearGradient(0, y, 0, y + wh); gr.addColorStop(0, '#050a1c'); gr.addColorStop(1, '#1d3263'); g.fillStyle = gr; g.fillRect(x, y, ww, wh);
        for (let i = 0; i < 24; i++) R(g, x + rnd() * ww, y + rnd() * 20, 1, 1, 'rgba(255,255,255,.75)');
        g.fillStyle = '#e8eefc'; g.beginPath(); g.arc(x + ww * .82, y + 14, 6, 0, 7); g.fill(); g.fillStyle = '#050a1c'; g.beginPath(); g.arc(x + ww * .82 + 3, y + 12, 5, 0, 7); g.fill();
        for (let b = 0, bx = x; bx < x + ww; b++) { const bw = 8 + rnd() * 12 | 0, bh = 12 + rnd() * 30 | 0; R(g, bx, y + wh - bh, bw, bh, '#0a1330'); for (let k = 0; k < bh / 6; k++) if (rnd() < .55) R(g, bx + 2 + rnd() * (bw - 4), y + wh - bh + 2 + k * 5, 2, 2, rnd() < .5 ? '#ffd93d' : '#ff9d4a'); bx += bw + 1; }
        R(g, x + ww / 2 - 1, y, 2, wh, '#0b0907'); R(g, x, y + wh / 2, ww, 2, '#0b0907'); R(g, x - 6, y + wh + 4, ww + 12, 4, C.gd);
        // 바닥에 비치는 달빛
        g.save(); g.globalCompositeOperation = 'lighter'; const lg = g.createLinearGradient(0, 96, 0, 96 + 300); lg.addColorStop(0, 'rgba(120,160,255,.13)'); lg.addColorStop(1, 'rgba(120,160,255,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(x + 6, 99); g.lineTo(x + ww - 6, 99); g.lineTo(x + ww + 90, 99 + 300); g.lineTo(x - 50, 99 + 300); g.closePath(); g.fill(); g.restore();
      });
      // 벽 지도(33~38) · 현수막(21~26)
      { const x = 33.6 * T, y = 12, w = 5.2 * T, h = 46; R(g, x - 4, y - 4, w + 8, h + 8, C.gd); R(g, x - 2, y - 2, w + 4, h + 4, '#000'); R(g, x, y, w, h, '#06100f');
        g.strokeStyle = 'rgba(46,230,200,.18)'; g.lineWidth = 1; for (let i = 1; i < 9; i++) { g.beginPath(); g.moveTo(x + i * w / 9, y); g.lineTo(x + i * w / 9, y + h); g.stroke(); } for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x, y + i * h / 4); g.lineTo(x + w, y + i * h / 4); g.stroke(); }
        for (let b = 0; b < 12; b++) { const bx = x + 8 + rnd() * (w - 30), by = y + 6 + rnd() * (h - 20), bw = 8 + rnd() * 22, bh = 6 + rnd() * 12; R(g, bx, by, bw, bh, 'rgba(255,217,61,.20)'); R(g, bx, by, bw, 1, 'rgba(255,243,166,.5)'); }
        for (let d = 0; d < 15; d++) R(g, x + 6 + rnd() * (w - 12), y + 4 + rnd() * (h - 8), 3, 3, d % 3 ? '#fff3a6' : '#ff9d4a'); }
      { const x = 21.4 * T, y = 10, w = 5.2 * T, h = 84; R(g, x - 3, y - 4, w + 6, 6, C.gold); R(g, x, y, w, h, '#0b0b12'); R(g, x + 6, y + 6, w - 12, h - 12, '#12122a'); g.strokeStyle = C.gold; g.lineWidth = 2; g.strokeRect(x + 6, y + 6, w - 12, h - 12);
        const bx = x + w / 2, by = y + 44; g.lineWidth = 3; g.beginPath(); g.arc(bx, by, 22, 0, 7); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, 14, 0, 7); g.stroke(); g.fillStyle = C.gl; g.beginPath(); g.moveTo(bx, by - 8); g.lineTo(bx + 6, by); g.lineTo(bx, by + 8); g.lineTo(bx - 6, by); g.closePath(); g.fill();
        for (let k = 0; k < 6; k++) { R(g, x + 10 + k * 22, y + h - 6, 4, 12, C.gold); } }
    });
  }

  /* ---------- 오브젝트: 스프라이트 + 충돌 + 조사 ---------- */
  function add(o) {   // o: {x,y,w,h(타일: 충돌/조사 영역), sx,sy,sw,sh(스프라이트 영역, 타일), draw, solid, ia(문장 배열 | 함수), name, glow}
    o.px = o.x * T; o.py = o.y * T; o.pw = o.w * T; o.ph = o.h * T; o.base = o.sortY !== undefined ? o.sortY * T : o.py + o.ph;
    if (o.draw) { o.spr = mk(o.sw * T, o.sh * T, (g, w, h) => o.draw(g, w, h)); o.ox = o.sx * T; o.oy = o.sy * T; }
    if (o.solid !== false) solids.push({ x: o.px, y: o.py, w: o.pw, h: o.ph });
    objs.push(o); return o;
  }
  const woodTop = (g, x, y, w, h, base = C.wm) => { R(g, x, y, w, h, base); R(g, x, y, w, 2, 'rgba(255,230,180,.28)'); R(g, x, y + h - 2, w, 2, 'rgba(0,0,0,.3)'); for (let i = 0; i < w; i += 14) R(g, x + i + 5, y + 4, 8, 1, 'rgba(0,0,0,.12)'); };
  const frontPanel = (g, x, y, w, h) => { R(g, x, y, w, h, C.wd); R(g, x, y, w, 2, C.gd); for (let i = 8; i < w - 8; i += 44) { R(g, x + i, y + 6, 36, h - 12, '#2e1c0f'); R(g, x + i, y + 6, 36, 1, 'rgba(255,220,160,.15)'); R(g, x + i + 15, y + h / 2 - 2, 6, 3, C.gold); } R(g, x, y + h - 2, w, 2, 'rgba(0,0,0,.45)'); };
  function monitor(g, x, y, w, h, screen = '#ffd93d') {
    R(g, x - 2, y - 2, w + 4, h + 4, '#0a0a0c'); R(g, x, y, w, h, '#06100f'); const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(255,217,61,.28)'); gr.addColorStop(1, 'rgba(255,150,30,.1)'); g.fillStyle = gr; g.fillRect(x, y, w, h);
    for (let i = 0; i < h - 6; i += 4) { R(g, x + 4, y + 4 + i, 6 + (i * 7 % (w - 20)), 1, screen); } R(g, x + w - 14, y + 4, 10, h - 12, 'rgba(255,243,166,.15)');
    R(g, x + w / 2 - 7, y + h + 2, 14, 3, '#1a1a1e'); R(g, x + w / 2 - 14, y + h + 5, 28, 3, '#26262c');
  }
  const bookRow = (g, x, y, w, h) => { for (let bx = x; bx < x + w - 4;) { const bw = 4 + rnd() * 5 | 0, bh = h - 2 - (rnd() * 6 | 0), hue = ['#6b2a22', '#23455e', '#2f5a3a', '#6b5a22', '#3c2a55', '#7a4a22', '#1f3f3a'][rnd() * 7 | 0]; R(g, bx, y + h - bh, bw, bh, hue); R(g, bx, y + h - bh, 1, bh, 'rgba(255,255,255,.12)'); R(g, bx + 1, y + h - bh + 3, bw - 2, 1, C.gold); bx += bw + (rnd() < .2 ? 2 : 0); } };

  function buildObjects() {
    // 바깥 경계
    solids.push({ x: 0, y: 0, w: WW, h: 3 * T + 4 }, { x: 0, y: 0, w: T, h: WH }, { x: WW - T, y: 0, w: T, h: WH }, { x: 0, y: WH - T - 4, w: WW, h: T + 4 });
    // 책장 (벽에 붙음: 충돌은 맨 아래 한 줄)
    const shelf = (x, w, text) => add({ x, y: 3, w, h: 1, sx: x, sy: 0, sw: w, sh: 4, name: '책장', ia: text, draw: (g, W, H) => {
      R(g, 0, 8, W, H - 8, '#2a1a0e'); R(g, 0, 8, W, 3, C.gold); R(g, 2, 12, W - 4, H - 14, '#1a0f07');
      for (let r = 0; r < 3; r++) { const yy = 14 + r * 36; bookRow(g, 5, yy, W - 10, 30); R(g, 2, yy + 30, W - 4, 4, C.wl); R(g, 2, yy + 30, W - 4, 1, 'rgba(255,230,180,.3)'); }
      R(g, 0, 8, 3, H - 8, C.wd); R(g, W - 3, 8, 3, H - 8, C.wd); R(g, 0, H - 6, W, 6, C.wd); R(g, 0, H - 6, W, 1, C.gold); } });
    shelf(2, 5, ['내 서가다. 리바이어던의 보고서철이 연도별로 꽂혀 있다.', '손이 닿는 높이의 칸만 유독 자주 꺼내 본 흔적이 있다. …내가 그랬지.']);
    shelf(7, 5, ['지도와 법전, 그리고 낡은 기록물을 내가 직접 가지런히 정리해 두었다.']);
    shelf(40, 5, ['등록 관리국과 정보 관리국에서 올라온 문서가 분류별로 꽂혀 있다. 내가 정한 분류 그대로다.']);
    // 의장용 언월도 거치대
    add({ x: 13, y: 3, w: 3, h: 1, sx: 13, sy: 0.5, sw: 3, sh: 3.5, name: '언월도 거치대', ia: ['내 의장용 언월도가 거치대에 걸려 있다.', '지금 들고 있는 것과 모양이 같다. 날은 잘 서 있고, 먼지 한 톨 없게 내가 직접 관리한다.'], draw: (g, W, H) => {
      R(g, 4, 20, 6, H - 20, C.wd); R(g, W - 10, 20, 6, H - 20, C.wd); R(g, 0, H - 10, W, 10, C.wm); R(g, 0, H - 10, W, 2, C.gold); R(g, 0, 30, W, 5, C.wm); R(g, 0, 30, W, 1, C.gl);
      R(g, 6, 24, W - 12, 4, '#6e4a28'); R(g, 6, 24, W - 12, 1, '#946a3f'); g.fillStyle = C.stl; g.beginPath(); g.moveTo(W - 14, 26); g.bezierCurveTo(W - 20, 4, W - 4, 4, W - 6, 28); g.bezierCurveTo(W - 14, 22, W - 14, 26, W - 14, 26); g.fill(); R(g, W - 12, 20, 2, 8, C.steel); R(g, 14, 22, 6, 8, '#36a86e'); R(g, 16, 28, 2, 10, '#36a86e'); } });
    // 금고
    add({ x: 31, y: 3, w: 2, h: 1, sx: 31, sy: 1.2, sw: 2, sh: 2.8, name: '금고', ia: ['내 금고다. 다이얼은 굳게 잠겨 있다. 열 수 있는 사람은 나뿐이다.'], draw: (g, W, H) => {
      R(g, 0, 10, W, H - 10, '#2a2f36'); R(g, 0, 10, W, 3, '#566069'); R(g, 4, 16, W - 8, H - 24, '#1d2127'); R(g, W / 2 - 12, 30, 24, 24, '#566069'); g.strokeStyle = C.gl; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, 42, 8, 0, 7); g.stroke(); R(g, W / 2 - 1, 36, 2, 6, C.gl); R(g, W - 12, 28, 4, 12, C.gold); R(g, 0, H - 6, W, 6, '#0f1114'); } });
    // 책상(컴퓨터) — 충돌은 책상 면 전체
    add({ x: 19, y: 10, w: 10, h: 3, sx: 19, sy: 9, sw: 10, sh: 4, name: '책상', ia: ['내 결재 서류가 가지런히 쌓여 있다. 급한 건 이미 처리해 두었다.', '책상 위의 명패에는 ‘설립자’라고 적혀 있다. 내 자리다.'], draw: (g, W, H) => {
      woodTop(g, 0, 32, W, 64, C.wh); frontPanel(g, 0, 96, W, 32); R(g, 4, 96, W - 8, 3, 'rgba(0,0,0,.35)');
      R(g, 40, 54, 150, 36, '#15110d'); R(g, 40, 54, 150, 1, C.gd); R(g, 40, 89, 150, 1, C.gd);
      monitor(g, 56, 4, 84, 44); monitor(g, 150, 14, 44, 30, '#9af3ff'); R(g, 62, 66, 64, 11, '#1c1c20'); for (let i = 0; i < 14; i++) R(g, 64 + i * 4.4, 68, 3, 3, '#3a3a42'); for (let i = 0; i < 12; i++) R(g, 65 + i * 4.8, 72, 3, 3, '#3a3a42'); R(g, 140, 68, 10, 8, '#222');
      R(g, 232, 38, 36, 24, C.paper); R(g, 236, 42, 28, 1, '#9a947f'); R(g, 236, 47, 24, 1, '#9a947f'); R(g, 232, 38, 36, 1, '#fff'); R(g, 238, 28, 30, 12, '#d8d0b8'); R(g, 244, 70, 40, 14, '#2a1d12'); R(g, 244, 70, 40, 2, C.gold);
      R(g, 280, 40, 26, 40, '#16130e'); R(g, 280, 40, 26, 1, C.gold); R(g, 294, 20, 3, 22, '#2a2a2e'); R(g, 284, 14, 24, 8, '#c9a94c'); R(g, 288, 8, 16, 8, '#f1dc8c'); } });
    // 컴퓨터(조사 영역): 책상 왼쪽 절반
    add({ x: 19, y: 10, w: 5.5, h: 3, solid: false, name: '컴퓨터', ia: ['내 컴퓨터다. 화면에는 리바이어던 전역의 보고서가 쉴 새 없이 올라온다.', '등급 갱신, 등록 신청, 기억 에너지 보급 현황… 전부 한눈에 들어온다.', '지금은 건드릴 것이 없다. 내가 보지 않는 동안에도 조직은 돌아간다.'] });
    // 의자(책상 뒤): 상호작용하면 '앉겠습니까?'
    add({ x: 21, y: 8, w: 2, h: 2, sx: 20.5, sy: 6.5, sw: 3, sh: 3.5, name: '의자', ia: 'sit', sortY: 9.1, draw: (g, W, H) => {
      R(g, 16, 60, 64, 36, 'rgba(0,0,0,.25)'); R(g, 14, 6, 68, 62, '#17130f'); R(g, 14, 6, 68, 3, C.gold); R(g, 20, 12, 56, 50, '#221a13'); for (let i = 0; i < 4; i++) R(g, 26 + i * 14, 18, 3, 3, C.gold);
      R(g, 8, 52, 16, 30, '#17130f'); R(g, 72, 52, 16, 30, '#17130f'); R(g, 8, 52, 16, 3, '#2c2418'); R(g, 72, 52, 16, 3, '#2c2418'); R(g, 20, 62, 56, 40, '#2a2017'); R(g, 20, 62, 56, 3, 'rgba(255,255,255,.12)'); R(g, 28, 102, 40, 6, '#0b0a08'); } });
    // 지구본
    add({ x: 30, y: 6, w: 1.4, h: 1.4, sx: 29.6, sy: 4.8, sw: 2.4, sh: 3, name: '지구본', ia: ['세계 지도가 새겨진 내 지구본이다.', '소버린 아일랜드에 작은 불빛이 켜져 있다. 내가 켜 둔 것이다.'], draw: (g, W, H) => {
      R(g, W / 2 - 16, H - 10, 32, 8, C.wd); R(g, W / 2 - 3, 52, 6, 36, C.gd); g.fillStyle = '#16365e'; g.beginPath(); g.arc(W / 2, 34, 28, 0, 7); g.fill();
      g.fillStyle = '#c9a94c'; [[-12, 22, 12, 10], [4, 26, 18, 8], [-8, 40, 12, 8], [10, 38, 8, 12], [-18, 32, 6, 6]].forEach(([a, b, c, d]) => { g.beginPath(); g.ellipse(W / 2 + a, b + 8, c / 2, d / 2, 0, 0, 7); g.fill(); });
      g.strokeStyle = C.gl; g.lineWidth = 2; g.beginPath(); g.ellipse(W / 2, 34, 33, 12, -.5, 0, 7); g.stroke(); g.fillStyle = '#fff3a6'; g.beginPath(); g.arc(W / 2 + 8, 30, 2, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(W / 2 - 10, 24, 8, 0, 7); g.fill(); } });
    // 소파 구역(서쪽)
    add({ x: 4, y: 17, w: 6, h: 2, sx: 4, sy: 15.8, sw: 6, sh: 3.4, name: '소파', ia: ['손님을 맞이하는 내 자리다. 쿠션은 한 치 흐트러짐 없이 놓여 있다.'], draw: (g, W, H) => {
      R(g, 4, 6, W - 8, 44, '#1e1a22'); R(g, 4, 6, W - 8, 3, '#3a3345'); R(g, 0, 28, 20, 56, '#26202c'); R(g, W - 20, 28, 20, 56, '#26202c'); R(g, 20, 40, W - 40, 44, '#31283a'); R(g, 20, 40, W - 40, 3, 'rgba(255,255,255,.12)');
      for (let i = 1; i < 3; i++) R(g, 20 + i * (W - 40) / 3, 44, 2, 38, 'rgba(0,0,0,.35)'); R(g, 0, 84, W, 6, 'rgba(0,0,0,.35)'); R(g, 28, 50, 20, 14, '#c9a94c'); R(g, W - 48, 50, 20, 14, '#8f7530'); } });
    add({ x: 5, y: 21, w: 4, h: 2, sx: 5, sy: 20.5, sw: 4, sh: 2.8, name: '탁자', ia: ['찻잔 두 개가 놓여 있다. 내가 내온 차다. 아직 따뜻하다.'], draw: (g, W, H) => {
      R(g, 4, 20, W - 8, 44, '#0f0b08'); R(g, 6, 16, W - 12, 40, '#2a1d12'); R(g, 6, 16, W - 12, 3, C.gold); R(g, 14, 22, W - 28, 26, '#15100a'); R(g, 30, 26, 10, 8, '#e9e2cf'); R(g, 31, 24, 8, 3, '#9a947f'); R(g, W - 42, 30, 10, 8, '#e9e2cf'); R(g, W - 41, 28, 8, 3, '#9a947f'); R(g, W / 2 - 4, 30, 8, 12, C.gold); } });
    add({ x: 2.4, y: 21, w: 1.6, h: 1.6, sx: 2.3, sy: 20, sw: 1.8, sh: 2.4, name: '안락의자', ia: ['푹신한 안락의자다. 지금은 앉을 틈이 없다.'], draw: (g, W, H) => { R(g, 0, 8, W, 44, '#26202c'); R(g, 0, 8, W, 3, '#3a3345'); R(g, 6, 34, W - 12, 34, '#31283a'); R(g, 0, 28, 8, 44, '#1e1a22'); R(g, W - 8, 28, 8, 44, '#1e1a22'); } });
    add({ x: 10, y: 21, w: 1.6, h: 1.6, sx: 9.9, sy: 20, sw: 1.8, sh: 2.4, name: '안락의자', ia: ['푹신한 안락의자다. 지금은 앉을 틈이 없다.'], draw: (g, W, H) => { R(g, 0, 8, W, 44, '#26202c'); R(g, 0, 8, W, 3, '#3a3345'); R(g, 6, 34, W - 12, 34, '#31283a'); R(g, 0, 28, 8, 44, '#1e1a22'); R(g, W - 8, 28, 8, 44, '#1e1a22'); } });
    // 회의 탁자(동쪽)
    add({ x: 36, y: 17, w: 8, h: 4, sx: 36, sy: 16.4, sw: 8, sh: 5, name: '회의 탁자', ia: ['내가 사령관들을 앉히는 긴 회의 탁자다. 자리는 이미 정해 두었다.', '탁자 가운데의 투영 장치는 꺼져 있다. 내가 호출하면 켜질 것이다.'], draw: (g, W, H) => {
      R(g, 10, 24, W - 20, 128, '#0c0806'); R(g, 6, 18, W - 12, 120, '#2a1b10'); R(g, 6, 18, W - 12, 4, C.gold); R(g, 14, 28, W - 28, 100, '#33210f'); R(g, 14, 28, W - 28, 2, 'rgba(255,230,180,.25)');
      g.strokeStyle = C.gd; g.lineWidth = 1; g.strokeRect(24, 38, W - 48, 80); R(g, W / 2 - 22, 62, 44, 32, '#07110f'); g.strokeStyle = '#2ee6c8'; g.lineWidth = 1; g.beginPath(); g.ellipse(W / 2, 78, 16, 8, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(W / 2, 74, 10, 5, 0, 0, 7); g.stroke(); R(g, W / 2 - 1, 62, 2, 14, 'rgba(46,230,200,.4)'); } });
    for (let i = 0; i < 4; i++) { [16.2, 21].forEach(cy => add({ x: 37 + i * 1.8, y: cy, w: 1, h: 1, sx: 37 + i * 1.8, sy: cy - .3, sw: 1, sh: 1.4, name: '의자', ia: ['사령관들이 앉을 회의용 의자다.'], draw: (g, W, H) => { R(g, 2, 10, W - 4, 24, '#16110d'); R(g, 2, 10, W - 4, 2, C.gold); R(g, 4, 28, W - 8, 14, '#201812'); } })); }
    add({ x: 35, y: 18, w: 1, h: 2, sx: 35, sy: 17.6, sw: 1, sh: 2.4, name: '상석', ia: ['내 자리, 상석이다. 가장 안쪽, 문이 잘 보이는 자리.'], draw: (g, W, H) => { R(g, 4, 8, W - 6, 56, '#16110d'); R(g, 4, 8, 3, 56, C.gold); R(g, 8, 14, W - 14, 44, '#221a13'); } });
    // 수족관(동쪽 벽)
    add({ x: 45, y: 7, w: 2, h: 3, sx: 44.5, sy: 5.8, sw: 2.5, sh: 4.4, name: '수족관', ia: ['푸른 물속에서 물고기들이 느리게 헤엄친다. 보고 있으면 생각이 정리된다.'], draw: (g, W, H) => {
      R(g, 0, 20, W, H - 26, '#0b0907'); R(g, 4, 24, W - 8, H - 44, '#0e3360'); const gr = g.createLinearGradient(0, 24, 0, H - 20); gr.addColorStop(0, '#1a5a99'); gr.addColorStop(1, '#0a2447'); g.fillStyle = gr; g.fillRect(4, 24, W - 8, H - 44);
      R(g, 4, H - 28, W - 8, 8, '#3a2c10'); for (let i = 0; i < 6; i++) R(g, 8 + i * 12, H - 38 - (i % 3) * 6, 3, 14 + (i % 3) * 6, '#2f8a5b');
      [[18, 50, '#ffb04a'], [44, 70, '#ff6a4a'], [30, 90, '#ffd93d'], [56, 56, '#9af3ff']].forEach(([x, y, c]) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 7, 4, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x - 12, y - 4); g.lineTo(x - 12, y + 4); g.fill(); R(g, x + 3, y - 1, 1, 1, '#000'); });
      R(g, 0, 8, W, 14, C.wd); R(g, 0, 8, W, 2, C.gold); R(g, 4, 24, 4, H - 44, 'rgba(255,255,255,.12)'); } });
    // 차 준비대(동쪽)
    add({ x: 44, y: 13, w: 3, h: 2, sx: 44, sy: 12.2, sw: 3, sh: 2.8, name: '차 준비대', ia: ['내 차가 준비되어 있다. 마실 시간은 없지만.'], draw: (g, W, H) => {
      R(g, 0, 24, W, H - 24, C.wd); R(g, 0, 24, W, 4, C.wh); R(g, 0, 24, W, 1, 'rgba(255,230,180,.4)'); R(g, 6, 34, W - 12, H - 40, '#2a1b10'); R(g, W / 2 - 2, 52, 4, 8, C.gold);
      R(g, 14, 6, 18, 18, '#e9e2cf'); R(g, 12, 6, 22, 3, '#fff'); R(g, 32, 12, 6, 8, '#e9e2cf'); R(g, 20, 2, 6, 5, '#8a949e'); R(g, 54, 10, 14, 14, '#c9a94c'); R(g, 54, 10, 14, 2, '#f1dc8c'); R(g, 76, 14, 12, 10, '#e9e2cf'); } });
    // 화분·조명
    const plant = (x, y) => add({ x, y, w: 1, h: 1, sx: x - .2, sy: y - 1.4, sw: 1.4, sh: 2.4, name: '화분', ia: ['잎이 윤기 있게 반짝인다. 내가 아끼는 화분이다. 누군가 매일 돌보고 있다.'], draw: (g, W, H) => {
      R(g, 8, H - 26, 30, 24, '#3a2414'); R(g, 6, H - 28, 34, 5, C.gold); [[0, 40], [10, 22], [22, 10], [34, 24], [42, 44]].forEach(([a, b], i) => { g.fillStyle = i % 2 ? '#2f8a5b' : '#236b45'; g.beginPath(); g.ellipse(a + 4, b + 2, 8, 16, (i - 2) * .35, 0, 7); g.fill(); }); } });
    [[1.2, 4], [45.8, 4], [1.2, 31], [45.8, 31], [11.5, 17], [32, 14]].forEach(([x, y]) => plant(x, y));
    const lamp = (x, y) => add({ x, y, w: .8, h: .8, sx: x - .4, sy: y - 2.4, sw: 1.6, sh: 3.2, name: '스탠드', ia: ['은은한 불빛이 켜져 있는 내 스탠드다.'], glow: [x * T + 13, (y - 1.9) * T, 150], draw: (g, W, H) => {
      R(g, W / 2 - 2, 28, 4, H - 36, '#2a2a2e'); R(g, W / 2 - 10, H - 10, 20, 6, '#16161a'); g.fillStyle = '#f1dc8c'; g.beginPath(); g.moveTo(W / 2 - 14, 30); g.lineTo(W / 2 + 14, 30); g.lineTo(W / 2 + 9, 8); g.lineTo(W / 2 - 9, 8); g.fill(); R(g, W / 2 - 9, 8, 18, 2, '#fff3a6'); } });
    lamp(12, 14.2); lamp(35, 12.2);
    // 연습용 목인형 (남서쪽 매트 위)
    add({ x: 5.8, y: 27, w: 1, h: 1, sx: 5.5, sy: 25.4, sw: 1.6, sh: 2.8, name: '목인형', ia: ['내 언월도 연습용 목인형이다.', '베인 자국이 깊다. 한 곳에 겹쳐서, 같은 각도로 수없이 베었다.'], draw: (g, W, H) => {
      R(g, 8, H - 14, 36, 12, '#2a1d12'); R(g, 22, 30, 8, H - 40, '#6e4a28'); R(g, 10, 32, 32, 8, '#6e4a28'); R(g, 4, 36, 10, 6, '#6e4a28'); R(g, 38, 36, 10, 6, '#6e4a28'); R(g, 14, 12, 24, 22, '#946a3f'); R(g, 14, 12, 24, 2, '#b88a55'); R(g, 20, 20, 3, 8, '#3a2414'); R(g, 28, 24, 6, 2, '#3a2414'); R(g, 16, 34, 20, 18, '#8a5f36'); R(g, 18, 40, 16, 2, '#3a2414'); } });
    // 출입문(남쪽 벽)
    add({ x: 22, y: 32, w: 4, h: 2, solid: false, sx: 22, sy: 32, sw: 4, sh: 2, name: '문', ia: () => ask('복도로 나갈까?', '', yes => { if (yes) travel('hall', { x: 7.5 * T, y: 4.9 * T, dir: 'down' }); else say('…아직은 이 방에서 할 일이 남았다.', ''); }), draw: (g, W, H) => {
      R(g, 0, 0, W, H, '#0b0907'); R(g, 0, 0, W, 5, C.gold); R(g, 6, 8, W / 2 - 8, H - 8, '#3b2414'); R(g, W / 2 + 2, 8, W / 2 - 8, H - 8, '#3b2414'); [6, W / 2 + 2].forEach(x => { R(g, x + 4, 14, W / 2 - 16, 36, '#2e1c0f'); R(g, x + 4, 14, W / 2 - 16, 1, 'rgba(255,220,160,.2)'); R(g, x + 4, 56, W / 2 - 16, 6, '#2e1c0f'); });
      R(g, W / 2 - 8, 34, 4, 8, C.gl); R(g, W / 2 + 4, 34, 4, 8, C.gl); R(g, 0, H - 4, W, 4, 'rgba(0,0,0,.5)'); } });
    // 신문 거치대·장식 (바닥 조명 없는 곳에 작은 오브젝트)
    add({ x: 17, y: 3, w: 3, h: .6, solid: false, name: '창문', ia: ['창밖으로 리바이어던의 야경이 펼쳐진다.', '저 불빛 하나하나가 내가 지켜야 할 것들이다.'] });
    add({ x: 28, y: 3, w: 3, h: .6, solid: false, name: '창문', ia: ['창밖은 고요하다. 이 고요를 유지하는 것이 내 일이다.'] });
    add({ x: 21.4, y: 3, w: 5.2, h: .6, solid: false, name: '현수막', ia: ['리바이어던의 문장이 수놓인 내 현수막이다.', '의자에 앉으면 정확히 이 아래가 된다.'] });
    add({ x: 33.6, y: 3, w: 5.2, h: .6, solid: false, name: '벽 지도', ia: ['벽면 지도에 등록된 국가들의 위치가 표시되어 있다.', '붉은 표식은 멸망한 국가다. 전부 내가 기록해 두었다.'] });
    // 장식용 대형 두루마리 서가(서쪽 벽 중간)
    add({ x: 1, y: 11, w: 1.1, h: 5, solid: true, sx: 1, sy: 10.4, sw: 1.1, sh: 5.8, name: '서고', ia: ['벽을 따라 문서 보관함이 늘어서 있다. 전부 내 손을 거친 문서들이다.'], draw: (g, W, H) => { R(g, 0, 8, W, H - 8, '#1a110a'); for (let i = 0; i < 9; i++) { R(g, 2, 12 + i * 20, W - 4, 16, '#2a1b10'); R(g, 2, 12 + i * 20, W - 4, 1, 'rgba(255,220,160,.25)'); R(g, W / 2 - 4, 18 + i * 20, 8, 3, C.gold); } R(g, 0, 8, W, 2, C.gold); } });
    objs.sort((a, b) => a.base - b.base);
  }

  /* ==========================================================================
     여러 맵: 회장실(100F) → 복도 → 엘리베이터 → 95F 사무층
     ========================================================================== */
  const MAPS = {}, mapNames = { office: '회장실 · 100F', hall: '복도 · 100F', f95: '사무층 · 95F' };
  let curMap = 'office', npcs = [], trans = false, elevOpen = false, elevI = 0, elevFloor = 100, questOn = false;
  const fadeEl = $('#gFade'), floorEl = $('#gFloor'), elevEl = $('#gElev'), questEl = $('#gQuest');
  function useMap(name) {
    const M = MAPS[name]; curMap = name;
    if (!M.ready) { COLS = M.cols; ROWS = M.rows; WW = COLS * T; WH = ROWS * T; objs = []; solids = []; npcs = []; floorC = null; M.build(); M.floorC = floorC; M.objs = objs; M.solids = solids; M.npcs = npcs; M.ready = true; }
    COLS = M.cols; ROWS = M.rows; WW = COLS * T; WH = ROWS * T; floorC = M.floorC; objs = M.objs; solids = M.solids; npcs = M.npcs;
    $('#gHudA').textContent = mapNames[name];
  }

  /* ---------- 공용 소품 그리기 (산업·테크니컬) ---------- */
  const STEEL = { d: '#12161b', m: '#1d242c', l: '#2c3640', h: '#46525f', hh: '#6c7a88' };
  const hazard = (g, x, y, w, h, a = '#d9a21b', b = '#14110a') => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); R(g, x, y, w, h, b); g.fillStyle = a; for (let i = -h; i < w + h; i += 12) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + 6, y + h); g.lineTo(x + i + 6 + h, y); g.lineTo(x + i + h, y); g.fill(); } g.restore(); };
  function elevatorArt(g, W, H, floor, acc) {   // 엘리베이터 문: 강철 틀 + 층 표시창 + 미닫이문
    R(g, 0, 0, W, H, STEEL.d); R(g, 2, 2, W - 4, H - 4, STEEL.m); hazard(g, 0, 0, W, 8);
    R(g, 10, 12, W - 20, 26, '#05080b'); R(g, 10, 12, W - 20, 1, STEEL.h); R(g, 10, 37, W - 20, 1, STEEL.h);
    g.fillStyle = acc; g.font = '700 22px "Share Tech Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(floor + 'F', W / 2, 26); g.textAlign = 'left';
    g.fillStyle = acc; g.beginPath(); g.moveTo(22, 30); g.lineTo(28, 20); g.lineTo(34, 30); g.fill(); g.beginPath(); g.moveTo(W - 22, 20); g.lineTo(W - 28, 30); g.lineTo(W - 34, 20); g.fill();
    const dw = (W - 28) / 2; [14, 14 + dw + 0].forEach((x, i) => { R(g, x, 46, dw, H - 52, '#59636d'); R(g, x, 46, dw, H - 52, 'rgba(0,0,0,.18)'); for (let k = 0; k < dw; k += 6) R(g, x + k, 46, 2, H - 52, 'rgba(255,255,255,.07)'); R(g, x, 46, dw, 2, STEEL.hh); R(g, x + (i ? 0 : dw - 2), 46, 2, H - 52, 'rgba(0,0,0,.5)'); });
    R(g, W / 2 - 1, 46, 2, H - 52, '#05080b'); R(g, 6, H - 8, W - 12, 6, STEEL.h); hazard(g, 6, H - 8, W - 12, 3); R(g, W - 12, 52, 6, 14, '#0a0d11'); R(g, W - 11, 55, 4, 3, acc); R(g, W - 11, 61, 4, 3, '#555');
  }

  /* ---------- 복도 (100F): 회장실 문 앞에서 엘리베이터까지 ---------- */
  function buildHall() {
    const FX0 = 3, FX1 = 12, TOP = 4, BOT = ROWS - 4;
    floorC = mk(WW, WH, g => {
      R(g, 0, 0, WW, WH, '#080a0d');
      for (let ty = TOP; ty < BOT; ty++) for (let tx = FX0; tx < FX1; tx++) {
        const x = tx * T, y = ty * T, k = .9 + rnd() * .14; R(g, x, y, T, T, shade('#232a32', k)); R(g, x, y, T, 1, 'rgba(255,255,255,.08)'); R(g, x, y, 1, T, 'rgba(0,0,0,.4)'); R(g, x + T - 1, y, 1, T, 'rgba(0,0,0,.4)'); R(g, x, y + T - 1, T, 1, 'rgba(0,0,0,.45)');
        [[3, 3], [T - 5, 3], [3, T - 5], [T - 5, T - 5]].forEach(([a, b]) => { R(g, x + a, y + b, 2, 2, '#4a5663'); R(g, x + a, y + b, 1, 1, '#7d8b99'); });
        if ((tx * 7 + ty * 3) % 9 === 0) { R(g, x + 6, y + 6, T - 12, T - 12, '#14181d'); for (let i = 0; i < 5; i++) R(g, x + 8, y + 8 + i * 4, T - 16, 1, '#2f3a45'); }
      }
      for (let y = TOP * T + 6; y < BOT * T; y += 28) { R(g, 7.5 * T - 2, y, 4, 12, '#c9a94c'); R(g, 7.5 * T - 2, y, 4, 1, '#f1dc8c'); }              // 중앙 안내선
      hazard(g, FX0 * T, TOP * T, 8, (BOT - TOP) * T); hazard(g, FX1 * T - 8, TOP * T, 8, (BOT - TOP) * T);                                               // 가장자리 경고 줄
      for (let ty = TOP + 3; ty < BOT - 1; ty += 6) { R(g, FX0 * T + 12, ty * T, 3, 22, '#ffb84a'); R(g, FX1 * T - 15, ty * T, 3, 22, '#ffb84a'); R(g, FX0 * T + 12, ty * T, 1, 22, '#fff0c0'); R(g, FX1 * T - 15, ty * T, 1, 22, '#fff0c0'); }
      const wall = (x0, flip) => {          // 옆 벽: 강철 판 · 세로 배관 · 케이블 트레이 · 벽등
        R(g, x0, 0, 3 * T, WH, '#12161b');
        for (let y = 0; y < WH; y += 64) { R(g, x0 + 4, y + 2, 3 * T - 8, 60, STEEL.m); R(g, x0 + 4, y + 2, 3 * T - 8, 1, STEEL.h); R(g, x0 + 4, y + 61, 3 * T - 8, 1, '#06080a'); [8, 3 * T - 12].forEach(a => { R(g, x0 + a, y + 6, 3, 3, '#46525f'); R(g, x0 + a, y + 54, 3, 3, '#46525f'); }); }
        const pxs = flip ? [x0 + 14, x0 + 34] : [x0 + 30, x0 + 52];
        pxs.forEach((px, i) => { R(g, px, 0, 9, WH, i ? '#2a323b' : '#3a4651'); R(g, px, 0, 2, WH, 'rgba(255,255,255,.14)'); R(g, px + 7, 0, 2, WH, 'rgba(0,0,0,.4)'); for (let y = 20; y < WH; y += 72) { R(g, px - 2, y, 13, 5, '#59636d'); R(g, px - 2, y, 13, 1, '#8a96a3'); } });
        const lipX = flip ? x0 + 3 * T - 6 : x0 + 2;
        R(g, flip ? x0 + 3 * T - 10 : x0, 0, 10, WH, '#0b0e12'); R(g, lipX, 0, 4, WH, '#46525f'); R(g, lipX + (flip ? 4 : -1), 0, 1, WH, '#8a96a3');
        for (let y = 40; y < WH; y += 96) { const lx = flip ? x0 + 3 * T - 16 : x0 + 10; R(g, lx, y, 6, 22, '#ffb84a'); R(g, lx + 1, y + 1, 2, 20, '#fff0c0'); }
      };
      wall(0, false); wall(FX1 * T, true);
      // 위쪽 끝(회장실 문이 있는 벽) · 아래쪽 끝(엘리베이터 벽)
      R(g, 0, 0, WW, TOP * T, '#12161b'); R(g, 0, (TOP - 1) * T, WW, T, STEEL.m); R(g, 0, TOP * T - 4, WW, 4, '#0a0d11'); hazard(g, 0, (TOP - 1) * T, WW, 6);
      for (let x = 0; x < WW; x += 32) { R(g, x + 3, 6, 26, 40, STEEL.m); R(g, x + 3, 6, 26, 1, STEEL.h); R(g, x + 6, 20, 20, 2, '#06080a'); }
      R(g, 0, BOT * T, WW, 4 * T, '#12161b'); R(g, 0, BOT * T, WW, 6, '#0a0d11'); hazard(g, 0, BOT * T + 6, WW, 6);
      for (let x = 0; x < WW; x += 32) { R(g, x + 3, BOT * T + 20, 26, 80, STEEL.m); R(g, x + 3, BOT * T + 20, 26, 1, STEEL.h); }
    });
    solids.push({ x: 0, y: 0, w: WW, h: TOP * T }, { x: 0, y: 0, w: FX0 * T, h: WH }, { x: FX1 * T, y: 0, w: 3 * T, h: WH }, { x: 0, y: BOT * T, w: WW, h: 4 * T });
    // 회장실 문(위쪽 끝)
    add({ x: 5.5, y: 3, w: 4, h: 1.2, solid: false, sx: 5, sy: 0.4, sw: 5, sh: 3.8, name: '회장실 문', ia: () => ask('회장실로 돌아갈까?', '', yes => { if (yes) travel('office', { x: 24 * T, y: 30.4 * T, dir: 'up' }); else say('…조금 더 둘러보자.', ''); }), draw: (g, W, H) => {
      R(g, 0, 0, W, H, '#07090c'); hazard(g, 0, 0, W, 8, '#c9a94c'); R(g, 6, 12, W - 12, H - 16, '#1c232b'); R(g, 6, 12, W - 12, 2, STEEL.hh);
      [10, W / 2 + 2].forEach(x => { R(g, x, 18, W / 2 - 12, H - 24, '#2b343e'); R(g, x + 4, 24, W / 2 - 20, 40, '#222a32'); R(g, x + 4, 24, W / 2 - 20, 1, STEEL.h); R(g, x + 4, 74, W / 2 - 20, 30, '#222a32'); });
      R(g, W / 2 - 1, 18, 2, H - 24, '#05080b'); R(g, W / 2 - 10, 62, 4, 12, '#f1dc8c'); R(g, W / 2 + 6, 62, 4, 12, '#f1dc8c');
      R(g, 28, 2, W - 56, 10, '#05080b'); g.fillStyle = '#c9a94c'; g.font = '700 9px "Share Tech Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CHAIRMAN · 100F', W / 2, 7); g.textAlign = 'left'; } });
    // 엘리베이터(아래쪽 끝)
    const elevIa = () => openElev(100);
    add({ x: 5.5, y: BOT - .8, w: 4, h: 1.2, solid: false, sx: 5, sy: BOT - .05, sw: 5, sh: 4, name: '엘리베이터', ia: elevIa, draw: (g, W, H) => elevatorArt(g, W, H, 100, '#ffb84a') });
    add({ x: 10.2, y: BOT - 1.4, w: .8, h: 1, solid: false, sx: 10, sy: BOT - 1.9, sw: 1.2, sh: 1.4, name: '호출 단말', ia: elevIa, draw: (g, W, H) => { R(g, 4, 4, W - 8, H - 6, '#0b0e12'); R(g, 4, 4, W - 8, 1, STEEL.h); R(g, W / 2 - 3, 10, 6, 6, '#ffb84a'); R(g, W / 2 - 3, 20, 6, 6, '#555'); R(g, W / 2 - 1, 11, 2, 2, '#fff0c0'); } });
    // 옆 문들 (잠긴 방): 왼쪽 3 · 오른쪽 3
    const sideDoor = (left, ty, label, text) => add({ x: left ? 2.1 : 12, y: ty, w: .9, h: 2.4, solid: false, sx: left ? 1.3 : 12, sy: ty - .2, sw: 1.7, sh: 2.8, name: label, ia: text, draw: (g, W, H) => {
      const x0 = left ? W - 40 : 0; R(g, x0, 6, 40, H - 8, '#06080a'); R(g, x0 + 4, 10, 32, H - 16, '#27303a'); R(g, x0 + 4, 10, 32, 2, STEEL.hh); R(g, x0 + 8, 18, 24, 30, '#1c242c'); R(g, x0 + 8, 54, 24, 16, '#1c242c');
      R(g, left ? x0 + 28 : x0 + 8, 44, 4, 10, '#f1dc8c'); R(g, x0 + 10, 0, 20, 7, '#05080b'); g.fillStyle = '#ffb84a'; g.font = '700 7px "Share Tech Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x0 + 20, 4); g.textAlign = 'left'; R(g, x0 + 14, 76, 12, 4, '#d9a21b'); } });
    sideDoor(true, 9, 'LAB-101', ['잠긴 방이다. 이 층의 방은 전부 내 소유다.', '지금은 열 일이 없다.']);
    sideDoor(true, 17, 'ARCH-102', ['기록 보관실이다. 필요한 문서는 이미 내 책상에 올라와 있다.']);
    sideDoor(true, 25, 'SRV-103', ['서버실이다. 안쪽에서 낮은 팬 소리가 들린다. 조직의 숨소리다.']);
    sideDoor(false, 9, 'OPS-201', ['작전실이다. 호출 전까지는 비어 있다.']);
    sideDoor(false, 17, 'LNK-202', ['통신 중계실이다. 사령관들의 회선이 이곳을 지난다.']);
    sideDoor(false, 25, 'STK-203', ['자재 창고다. 문은 내 인증으로만 열린다. 오늘은 열지 않는다.']);
    // 단말기 · 소화기 · 상자
    add({ x: 3.1, y: 13.2, w: .8, h: 1, sx: 3.0, sy: 12.2, sw: 1.2, sh: 2.2, name: '복도 단말기', ia: ['층별 상태가 표시되는 복도 단말기다.', '100F — 내 층은 정상. 95F — 사무층도 정상 가동 중이다.'], draw: (g, W, H) => { R(g, 6, 18, W - 10, 40, '#0b0e12'); R(g, 8, 20, W - 14, 28, '#05161c'); for (let i = 0; i < 6; i++) R(g, 10, 23 + i * 4, 8 + (i * 5) % 14, 1, '#38d6ff'); R(g, 6, 58, W - 10, 8, STEEL.m); R(g, W - 10, 4, 3, 14, '#555'); } });
    add({ x: 11.1, y: 21.6, w: .8, h: .8, sx: 10.9, sy: 20.8, sw: 1, sh: 1.8, name: '소화기', ia: ['소화기다. 쓸 일이 없기를 바란다.'], draw: (g, W, H) => { R(g, 8, 18, 14, 34, '#a3241c'); R(g, 8, 18, 14, 3, '#d34a3c'); R(g, 11, 12, 8, 7, '#222'); R(g, 14, 8, 2, 6, '#888'); R(g, 8, 36, 14, 4, '#f1dc8c'); } });
    add({ x: 3.2, y: 30.6, w: 1.6, h: 1.2, sx: 3.1, sy: 29.6, sw: 1.8, sh: 2.2, name: '보급 상자', ia: ['보급 상자다. 내가 직접 서명한 봉인이 그대로 붙어 있다.'], draw: (g, W, H) => { R(g, 4, 14, W - 8, H - 18, '#2a313a'); R(g, 4, 14, W - 8, 3, STEEL.h); hazard(g, 4, 28, W - 8, 8, '#c9a94c'); R(g, 4, H - 6, W - 8, 4, '#0a0d11'); R(g, W / 2 - 8, 20, 16, 5, '#e9e2cf'); } });
    // 천장 조명(빛만)
    for (let ty = TOP + 2; ty < BOT; ty += 5) add({ x: 7.5, y: ty, w: .1, h: .1, solid: false, glow: [7.5 * T, ty * T, 150], gc: '170,200,255' });
    objs.sort((a, b) => a.base - b.base);
  }

  /* ---------- 95F 사무층: 진청색 + 울트라마린의 테크니컬한 심해 사무실 ---------- */
  const NV = { bg: '#030a1c', d: '#061230', m: '#0a1d4a', l: '#102b6e', u: '#2b3fe6', ul: '#5d7bff', cy: '#38d6ff', wh: '#cfe0ff' };
  let causticC = null;
  function buildF95() {
    floorC = mk(WW, WH, g => {
      R(g, 0, 0, WW, WH, NV.bg);
      for (let ty = 5; ty < ROWS - 3; ty++) for (let tx = 1; tx < COLS - 1; tx++) {
        const x = tx * T, y = ty * T, k = .9 + rnd() * .2; R(g, x, y, T, T, shade((tx + ty) % 2 ? '#081a42' : '#0a1f4e', k)); R(g, x, y, T, 1, 'rgba(93,123,255,.22)'); R(g, x, y, 1, T, 'rgba(93,123,255,.14)'); R(g, x + T - 1, y, 1, T, 'rgba(0,0,0,.35)'); R(g, x, y + T - 1, T, 1, 'rgba(0,0,0,.35)');
        if ((tx + ty * 5) % 7 === 0) R(g, x + 12, y + 12, 8, 8, 'rgba(56,214,255,.10)');
      }
      // 구역 카펫: 책상 블록 아래의 어두운 판 + 울트라마린 테두리
      [[2, 7, 14, 19], [28, 7, 15, 19]].forEach(([tx, ty, tw, th]) => { const x = tx * T, y = ty * T, w = tw * T, h = th * T; R(g, x, y, w, h, 'rgba(2,6,22,.55)'); g.strokeStyle = 'rgba(43,63,230,.7)'; g.lineWidth = 2; g.strokeRect(x + 4, y + 4, w - 8, h - 8); g.strokeStyle = 'rgba(56,214,255,.3)'; g.lineWidth = 1; g.strokeRect(x + 9, y + 9, w - 18, h - 18); });
      // 통로 안내선(빛)
      [12.6, 19.6, 26.4].forEach(ly => { R(g, 2 * T, ly * T - 1, (COLS - 4) * T, 2, 'rgba(56,214,255,.20)'); }); [9, 17, 27, 35].forEach(lx => { R(g, lx * T - 1, 5 * T, 2, (ROWS - 8) * T, 'rgba(56,214,255,.14)'); });
      // 중앙 홀로그램 원판
      const cx = 22 * T, cy = 16 * T; g.strokeStyle = NV.u; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 120, 0, 7); g.stroke(); g.strokeStyle = 'rgba(93,123,255,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 100, 0, 7); g.stroke(); g.setLineDash([4, 6]); g.beginPath(); g.arc(cx, cy, 82, 0, 7); g.stroke(); g.setLineDash([]);
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; g.strokeStyle = i % 9 ? 'rgba(93,123,255,.5)' : NV.cy; g.beginPath(); g.moveTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120); g.lineTo(cx + Math.cos(a) * (i % 9 ? 128 : 138), cy + Math.sin(a) * (i % 9 ? 128 : 138)); g.stroke(); }
      // 뒷벽: 심해 전망창
      R(g, 0, 0, WW, 5 * T, '#02050f'); R(g, 0, 5 * T - 6, WW, 6, NV.l); R(g, 0, 5 * T - 8, WW, 2, NV.ul);
      const panes = 7, pw = (WW - 2 * T) / panes;
      for (let i = 0; i < panes; i++) {
        const x = T + i * pw + 6, w = pw - 12, y = 12, h = 5 * T - 36, gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#041a5e'); gr.addColorStop(.55, '#031244'); gr.addColorStop(1, '#010826'); R(g, x - 4, y - 4, w + 8, h + 8, NV.l); R(g, x - 2, y - 2, w + 4, h + 4, '#020615'); g.fillStyle = gr; g.fillRect(x, y, w, h);
        g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const sx = x + rnd() * w; const lg = g.createLinearGradient(sx, y, sx + 30, y + h); lg.addColorStop(0, 'rgba(93,123,255,.30)'); lg.addColorStop(1, 'rgba(93,123,255,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + 14, y); g.lineTo(sx + 40, y + h); g.lineTo(sx + 6, y + h); g.fill(); } g.globalCompositeOperation = 'source-over';
        for (let k = 0; k < 14; k++) R(g, x + rnd() * w, y + rnd() * h, 1, 1, 'rgba(160,210,255,.55)');
        if (i % 3 === 1) { g.fillStyle = 'rgba(2,10,40,.9)'; g.beginPath(); g.ellipse(x + w * .5, y + h * .62, 26, 8, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + w * .5 + 24, y + h * .62); g.lineTo(x + w * .5 + 40, y + h * .62 - 8); g.lineTo(x + w * .5 + 40, y + h * .62 + 8); g.fill(); }
        if (i % 3 === 2) { g.fillStyle = 'rgba(56,214,255,.5)'; g.beginPath(); g.arc(x + w * .5, y + h * .4, 9, Math.PI, 0); g.fill(); for (let t = 0; t < 4; t++) R(g, x + w * .5 - 7 + t * 5, y + h * .4, 1, 14 + (t % 2) * 6, 'rgba(56,214,255,.45)'); }
        g.restore(); R(g, x + w / 2 - 1, y, 2, h, NV.l); R(g, x - 4, y + h + 4, w + 8, 4, NV.ul);
      }
      // 옆 벽
      [[0, 1], [WW - T, 1]].forEach(([x]) => { R(g, x, 0, T, WH, '#02060f'); R(g, x + (x ? 0 : T - 3), 0, 3, WH, NV.u); R(g, x + (x ? 4 : T - 8), 0, 1, WH, NV.cy); });
      R(g, 0, WH - 3 * T, WW, 3 * T, '#02060f'); R(g, 0, WH - 3 * T, WW, 3, NV.u); R(g, 0, WH - 3 * T + 3, WW, 1, NV.cy);
      for (let x = 0; x < WW; x += 32) { R(g, x + 3, WH - 3 * T + 12, 26, 60, '#071538'); R(g, x + 3, WH - 3 * T + 12, 26, 1, NV.ul); }
    });
    solids.push({ x: 0, y: 0, w: WW, h: 5 * T }, { x: 0, y: 0, w: T, h: WH }, { x: WW - T, y: 0, w: T, h: WH }, { x: 0, y: WH - 3 * T, w: WW, h: 3 * T });
    // 책상 모듈
    const desk = (x, y, variant) => {
      add({ x, y, w: 5, h: 2, sx: x, sy: y - 1.3, sw: 5, sh: 3.3, name: '책상', ia: ['직원의 자리다. 모니터에는 업무가 빼곡하다.'], draw: (g, W, H) => {
        R(g, 0, 42, W, 64, '#02060f'); R(g, 2, 44, W - 4, 56, '#0a1d4a'); R(g, 2, 44, W - 4, 2, NV.ul); R(g, 2, 98, W - 4, 3, NV.u); R(g, 6, 100, W - 12, 4, 'rgba(56,214,255,.5)');
        [[16, 4, 52, 34], [78, 8, 52, 30]].forEach(([mx, my, mw, mh], i) => { R(g, mx - 2, my - 2, mw + 4, mh + 4, '#02050c'); R(g, mx, my, mw, mh, '#041031'); const gr = g.createLinearGradient(0, my, 0, my + mh); gr.addColorStop(0, 'rgba(93,123,255,.55)'); gr.addColorStop(1, 'rgba(56,214,255,.2)'); g.fillStyle = gr; g.fillRect(mx, my, mw, mh); for (let r = 0; r < mh / 4 - 1; r++) R(g, mx + 4, my + 4 + r * 4, 8 + ((r * 7 + variant * 3 + i * 5) % (mw - 16)), 1, r % 4 ? '#8fb2ff' : '#38d6ff'); R(g, mx + mw / 2 - 5, my + mh + 2, 10, 3, '#0a1126'); R(g, mx + mw / 2 - 12, my + mh + 5, 24, 3, '#0e1a40'); });
        R(g, 30, 60, 70, 16, '#06102b'); for (let i = 0; i < 12; i++) R(g, 33 + i * 5.5, 63, 4, 3, '#1d3a8a'); for (let i = 0; i < 11; i++) R(g, 35 + i * 5.5, 68, 4, 3, '#1d3a8a'); R(g, 110, 62, 8, 12, '#cfe0ff'); R(g, 124, 60, 24, 18, '#e8efff'); R(g, 126, 64, 18, 1, '#9fb4e8'); R(g, 126, 68, 14, 1, '#9fb4e8'); } });
      add({ x: x + 1.8, y: y + 2.1, w: 1.2, h: .9, solid: false, sx: x + 1.6, sy: y + 1.8, sw: 1.6, sh: 1.6, name: '의자', sortY: y + 2.5, draw: (g, W, H) => { R(g, 6, 10, W - 12, 26, '#050d28'); R(g, 6, 10, W - 12, 2, NV.u); R(g, 10, 30, W - 20, 12, '#0a1d4a'); R(g, W / 2 - 2, 42, 4, 6, '#02060f'); } });
    };
    [3, 10].forEach(x => [8, 15, 22].forEach((y, i) => desk(x, y, i)));
    [29, 36].forEach(x => [8, 15, 22].forEach((y, i) => desk(x, y, i + 1)));
    // 중앙 홀로그램 탁자
    add({ x: 20, y: 14.4, w: 4, h: 2.6, sx: 19.5, sy: 12.5, sw: 5, sh: 5, name: '홀로그램 탁자', ia: ['조직의 실시간 현황판이다. 내가 보는 것과 같은 수치가 이곳 직원들에게도 공유된다.', '빛이 천천히 돈다. 심해의 해류처럼.'], draw: (g, W, H) => {
      R(g, 8, 70, W - 16, 80, '#02060f'); R(g, 14, 64, W - 28, 76, '#0a1d4a'); R(g, 14, 64, W - 28, 3, NV.ul); R(g, 22, 74, W - 44, 56, '#050f2c'); g.strokeStyle = NV.u; g.lineWidth = 1; g.strokeRect(26, 78, W - 52, 48);
      g.strokeStyle = NV.cy; g.beginPath(); g.ellipse(W / 2, 100, 40, 14, 0, 0, 7); g.stroke(); R(g, W / 2 - 1, 80, 2, 20, 'rgba(56,214,255,.5)'); },
      anim: (c, t, o) => { const cx = o.px + o.pw / 2, cy = o.py + o.ph * .35; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(93,123,255,.85)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(cx, cy, 34 - k * 8, 12 - k * 3, 0, 0, 7); c.stroke(); } const a = t * 1.2; c.strokeStyle = 'rgba(56,214,255,.9)'; c.beginPath(); c.ellipse(cx, cy - 12, 22, 22, 0, 0, 7); c.stroke(); for (let k = 0; k < 3; k++) { const aa = a + k * 2.1; c.beginPath(); c.ellipse(cx, cy - 12, 22 * Math.abs(Math.cos(aa)), 22, 0, 0, 7); c.stroke(); } c.fillStyle = 'rgba(207,224,255,.9)'; c.fillRect(Math.round(cx + Math.cos(a * 2) * 34) - 1, Math.round(cy + Math.sin(a * 2) * 12) - 1, 3, 3); c.restore(); } });
    // 서버 랙 · 복사기 · 수조 · 화분
    const rack = (x, y) => add({ x, y, w: 1.6, h: 1, sx: x, sy: y - 1.6, sw: 1.6, sh: 2.6, name: '서버 랙', ia: ['서버 랙이다. 안쪽에서 낮은 팬 소리가 난다.'], draw: (g, W, H) => { R(g, 0, 8, W, H - 8, '#02050e'); R(g, 3, 12, W - 6, H - 18, '#0a1530'); for (let i = 0; i < 6; i++) { R(g, 6, 16 + i * 11, W - 12, 8, '#0e1d45'); R(g, 6, 16 + i * 11, W - 12, 1, NV.ul); for (let k = 0; k < 4; k++) R(g, 10 + k * 5, 19 + i * 11, 2, 2, (i + k) % 3 ? NV.cy : '#ffffff'); } R(g, 0, 8, W, 2, NV.u); } });
    [[3, 6.2], [5, 6.2], [7, 6.2], [36, 6.2], [38, 6.2], [40, 6.2]].forEach(([x, y]) => rack(x, y));
    add({ x: 15.6, y: 6, w: 2, h: 1.2, sx: 15.5, sy: 4.8, sw: 2.2, sh: 2.4, name: '복사기', ia: ['복사기다. 종이가 쉴 새 없이 나온다.'], draw: (g, W, H) => { R(g, 2, 18, W - 4, H - 22, '#102552'); R(g, 2, 18, W - 4, 3, NV.ul); R(g, 6, 26, W - 12, 8, '#050f2c'); R(g, 10, 28, 16, 4, NV.cy); R(g, 8, 38, W - 16, 10, '#e8efff'); } });
    add({ x: 26.4, y: 6, w: 1.2, h: 1.2, sx: 26.2, sy: 4.8, sw: 1.6, sh: 2.4, name: '정수기', ia: ['정수기다. 물은 심해에서 끌어올려 걸러낸 것이다.'], draw: (g, W, H) => { R(g, 8, 24, W - 16, H - 28, '#102552'); R(g, 10, 6, W - 20, 20, 'rgba(93,170,255,.45)'); R(g, 10, 6, W - 20, 2, '#cfe0ff'); R(g, 14, 36, 8, 4, NV.cy); R(g, W - 22, 36, 8, 4, '#ff6a4a'); } });
    [[2.2, 28.4], [41.2, 28.4], [2.2, 5.6]].forEach(([x, y]) => add({ x, y, w: .9, h: .9, sx: x - .4, sy: y - 1.6, sw: 1.7, sh: 2.5, name: '산호 화분', ia: ['산호처럼 생긴 발광 식물이다. 푸른빛이 은은하다.'], glow: [x * T + 16, (y - .8) * T, 90], gc: '56,214,255', draw: (g, W, H) => { R(g, 12, H - 22, 30, 20, '#0a1d4a'); R(g, 10, H - 24, 34, 4, NV.ul); [[10, 30], [22, 14], [34, 24], [44, 38]].forEach(([a, b], i) => { g.fillStyle = i % 2 ? '#2b8bff' : '#38d6ff'; g.beginPath(); g.ellipse(a + 4, b + 4, 5, 15, (i - 1.5) * .3, 0, 7); g.fill(); }); } }));
    // 엘리베이터(아래쪽 끝)
    const BOT = ROWS - 3;
    add({ x: 20, y: BOT - .8, w: 4, h: 1.2, solid: false, sx: 19.5, sy: BOT - .05, sw: 5, sh: 3, name: '엘리베이터', ia: () => openElev(95), draw: (g, W, H) => elevatorArt(g, W, H, 95, '#5d7bff') });
    // 직원들(걸어 다니는 사람 · 앉아 일하는 사람) + 아비시온 크리토스
    const PAL = NPC_SPECS;
    const LX = [9, 17, 27, 35], LY = [12.6, 19.6, 26.4];
    for (let i = 0; i < 7; i++) { const xi = (i * 3) % 4, yi = i % 3; npcs.push({ kind: 'walk', pal: PAL[i % 6], x: LX[xi] * T, y: LY[yi] * T, xi, yi, nx: xi, ny: yi, dir: 'down', t: rnd() * 5, wait: rnd() * 2, carry: i % 2 === 0, sp: 46 + rnd() * 22, prev: -1 }); }
    [[3, 8], [10, 15], [29, 22], [36, 8], [10, 22], [29, 15], [3, 22]].forEach(([x, y], i) => npcs.push({ kind: 'sit', pal: PAL[(i + 2) % 6], x: (x + 2.4) * T, y: (y + 2.6) * T, dir: 'up', t: rnd() * 6 }));
    add({ x: 21.5, y: 10.2, w: 1, h: 1, sx: 21.3125, sy: 9.4063, sw: 1.375, sh: 1.6875, name: '아비시온 크리토스', sortY: 11, ia: () => {
      if (!questOn) say(['안녕하십니까, 설립자님.', '오늘 카네히라가 여쭈어 볼께 있다고 합니다.'], '아비시온 크리토스', giveQuest); else say(['안녕하십니까, 설립자님.', '카네히라의 용건은 아직 준비 중입니다. 때가 되면 다시 말씀드리겠습니다.'], '아비시온 크리토스'); },
      draw: (g, W, H) => g.drawImage(KR_SPR, 0, 0) });
    objs.sort((a, b) => a.base - b.base);
  }
  MAPS.office = { cols: 48, rows: 34, build: () => { floorC = buildFloor(); buildObjects(); } };
  MAPS.hall = { cols: 15, rows: 44, build: buildHall };
  MAPS.f95 = { cols: 44, rows: 34, build: buildF95 };

  /* ---------- 사람 그리기: 직원(여러 팔레트) · 아비시온 크리토스 ---------- */
  const WSPR = new Map(); let KR_SPR = null;
  const KRITOS = { skin: '#f3dccb', skinD: '#d9bfae', hair: '#2f5bff', hairL: '#9ab8ff', style: 'slick', glasses: '#0b1030', iris: '#3a66d8', irisD: '#14246a', jacket: '#1d3fd6', shirt: '#6f90ff', tie: '#15226e', gold: '#e6c04a', fur: '#d9b44a', furL: '#f6e19a', furD: '#9a7a24', bottom: '#0a0a10', bottomL: '#22222c', shoe: '#0a0a10', shoeL: '#30303c', blush: '#eab0a4', hand: '#f3dccb', mouth: '#b98a7a', hairD: '#1c3ab0' };
  const mkNpc = (hair, hairL, style, skin, top, topD, shirt, tie, extra = {}) => Object.assign({ skin, skinD: '#00000000', hair, hairL, hairD: hair, style, top, topD, topL: top, shirt, tie, bottom: '#0d1020', bottomL: '#1e2848', shoe: '#06070c', shoeL: '#2a2e3a', hand: skin, belt: '#06070c', blush: '#e8a898' }, extra);
  const NPC_SPECS = [
    mkNpc('#2a1f18', '#5a463a', 'short', '#f0d2b8', '#1c2f6e', '#0f1c48', '#e8f0ff', '#38d6ff', { topL: '#2f4a9a', skinD: '#d8b59c', iris: '#3a4a6a' }),
    mkNpc('#7a5232', '#b88a58', 'long', '#f4d9c4', '#27408c', '#16265a', '#ffffff', '#ff7a9a', { topL: '#3f60b8', skinD: '#dcb8a2', glasses: '#2a2f55', iris: '#6a4a8a', irisD: '#2a1a40' }),
    mkNpc('#14141c', '#3a3a52', 'short', '#e8c9ae', '#20242f', '#12151c', '#d8e4ff', '#ffd93d', { topL: '#363c4e', skinD: '#c6a58a', iris: '#2a3a2a' }),
    mkNpc('#a87a4a', '#e0b078', 'long', '#f0d2b8', '#142a5e', '#0a1838', '#dbe6ff', '#ff6a8a', { topL: '#2a4a98', skinD: '#d6b49c', iris: '#4a8a6a', irisD: '#1a3a2a' }),
    mkNpc('#3a3c48', '#6a6e82', 'slick', '#d4ae90', '#262e44', '#151b2c', '#eef3ff', '#38d6ff', { topL: '#3a4666', skinD: '#b48c70', glasses: '#14141e', iris: '#3a3a4a' }),
    mkNpc('#2a1408', '#6a3a1a', 'messy', '#e8c9ae', '#1c3470', '#0e1c44', '#dbe6ff', '#c9a94c', { topL: '#2c4e9e', skinD: '#c6a58a', iris: '#5a3a1a', irisD: '#2a1a08' })];
  function npcSprite(spec, dir, f, sit, carry) {
    const key = spec.top + spec.hair + dir + f + (sit ? 's' : '') + (carry ? 'c' : ''); if (WSPR.has(key)) return WSPR.get(key);
    const base = dir === 'right' ? 'left' : dir; let c = outline(mk(CW, CH, g => drawChibi(g, base, f, spec, { sit, carry })));
    if (dir === 'right') { const src = c; c = mk(CW, CH, g => { g.translate(CW, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); }); }
    WSPR.set(key, c); return c;
  }
  function buildKritos() { return outline(mk(CW, CH, g => drawChibi(g, 'down', 0, KRITOS))); }
  const NPC_NODES = { LX: [9, 17, 27, 35], LY: [12.6, 19.6, 26.4] };
  function updateNpcs(dt) {
    if (curMap !== 'f95') return;
    const { LX, LY } = NPC_NODES;
    npcs.forEach(n => {
      n.t += dt; if (n.kind !== 'walk') return;
      if (n.wait > 0) { n.wait -= dt; n.moving = false; return; }
      const tx = LX[n.nx] * T, ty = LY[n.ny] * T, dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
      if (d < 2) {
        n.x = tx; n.y = ty; n.xi = n.nx; n.yi = n.ny; if (rnd() < .5) n.wait = 1 + rnd() * 3, n.carry = rnd() < .5;
        const opts = []; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const x2 = n.xi + a, y2 = n.yi + b; if (x2 >= 0 && x2 < 4 && y2 >= 0 && y2 < 3) opts.push([x2, y2]); });
        const pick = opts[Math.floor(rnd() * opts.length)]; n.nx = pick[0]; n.ny = pick[1]; n.moving = false; return;
      }
      n.moving = true; n.x += dx / d * n.sp * dt; n.y += dy / d * n.sp * dt; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    });
  }

  /* ---------- 이동 연출 · 엘리베이터 · 퀘스트 ---------- */
  async function travel(dest, o = {}) {
    if (trans) return; trans = true; keys.clear(); joy.x = joy.y = 0; P.moving = false; fadeEl.classList.add('on');
    if (o.ride) SND.tone(220, .5, 'sine', .05, 0, 160); else SND.click();
    await sleep(RM ? 20 : 420);
    if (o.ride) {
      floorEl.hidden = false; const a = o.ride[0], b = o.ride[1], dir = b > a ? 1 : -1; SND.tone(70, 1.2, 'sine', .08, 0, 55);
      for (let f = a; f !== b + dir; f += dir) { floorEl.innerHTML = `<small>FLOOR</small><b>${f}</b><i>F</i><em>${dir > 0 ? '▲' : '▼'}</em>`; SND.tick(); await sleep(RM ? 10 : 170); }
      SND.tone(1318, .5, 'sine', .07); SND.tone(1760, .6, 'sine', .05, .12); await sleep(RM ? 10 : 520); floorEl.hidden = true;
    }
    useMap(dest); P.x = o.x; P.y = o.y; P.dir = o.dir || 'up'; P.t = 0; msgEl.hidden = true; busyMsg = false; choice = null; choiceEl.hidden = true;
    await sleep(RM ? 20 : 260); fadeEl.classList.remove('on'); await sleep(RM ? 20 : 420); trans = false;
    if (dest === 'f95' && o.first) say(['여기가 95층이다. 내가 맡긴 사무층.', '직원들이 분주하게 움직이고 있다.'], '');
  }
  function openElev(from) {
    elevOpen = true; elevFloor = from; elevI = from === 100 ? 1 : 0; keys.clear(); elevEl.hidden = false; $('#geNow').textContent = from + 'F'; $$('button[data-f]', elevEl).forEach(b => { const f = +b.dataset.f; b.classList.toggle('cur', f === from); }); paintElev(); SND.click();
  }
  const ELEV_BTNS = () => $$('button', elevEl);
  function paintElev() { ELEV_BTNS().forEach((b, i) => b.classList.toggle('on', i === elevI)); }
  function moveElev(d) { const n = ELEV_BTNS().length; elevI = (elevI + d + n) % n; paintElev(); SND.tick(); }
  function closeElev() { elevOpen = false; elevEl.hidden = true; }
  function pickElev() {
    const b = ELEV_BTNS()[elevI], f = +b.dataset.f; SND.click();
    if (!f) { closeElev(); return; }
    if (f === elevFloor) { closeElev(); say(f === 100 ? '이미 100층이다. 내 회장실이 있는 층.' : '이미 95층이다.', ''); return; }
    closeElev();
    if (f === 95) travel('f95', { ride: [100, 95], x: 22 * T, y: 28.3 * T, dir: 'up', first: !questOn });
    else travel('hall', { ride: [95, 100], x: 7.5 * T, y: 38.8 * T, dir: 'up' });
  }
  ELEV_BTNS().forEach((b, i) => { b.addEventListener('click', e => { e.stopPropagation(); elevI = i; pickElev(); }); b.addEventListener('mouseenter', () => { elevI = i; paintElev(); }); });
  function giveQuest() {
    if (questOn) return; questOn = true; showQuest(true); SND.tone(988, .12, 'sine', .06); SND.tone(1318, .2, 'sine', .06, .1); SND.tone(1760, .3, 'sine', .05, .22);
  }
  function showQuest(anim) { questEl.hidden = false; questEl.classList.remove('in'); if (anim) { void questEl.offsetWidth; questEl.classList.add('in'); } else questEl.classList.add('in', 'still'); }


  /* ---------- 플레이어: 회색빛 도는 긴 가죽 트렌치코트 · 검은 터틀넥과 바지 · 흐트러진 머리 · 장갑 낀 손에 언월도를 든 남성(참고 이미지) ---------- */
  const SK = '#e8c9ae', SKD = '#c6a58a', HR = '#1b1c22', HRL = '#3b404b', CG = '#566763', CGD = '#3a4846', CGL = '#728480', CGE = '#1e2828', IN = '#14151a', INL = '#262830', PT = '#1a1b21', PTL = '#2c2e36', BT = '#0e0f12', GLV = '#121317', SCB = '#1b1b21', SCL = '#3a3a44', TSU = '#9097a2', HLT = '#24252c', HLTL = '#3c3d47';
  const SPR = {};
  const CW = 44, CH = 54;
  function drawChar(g, dir, f) { drawChibi(g, dir, f, PLAYER); drawGuandao(g, dir, f); }
  const PLAYER = { skin: SK, skinD: SKD, hair: HR, hairL: HRL, hairD: '#0d0e12', style: 'messy', iris: '#6a8f8a', irisD: '#2e4642',  top: CG, topD: CGD, topL: CGL, coat: true, inner: IN, innerL: INL, shirt: IN, bottom: PT, shoe: BT, hand: GLV, eye: '#15161a' };
  function drawGuandao(g, dir, f) {
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, bob = f === 1 || f === 3 ? -1 : 0;
    const guandao = (x, out, gx, by) => {   // 언월도: 긴 자루 + 폭 넓은 초승달 날 + 금 마디 + 녹색 술, 손(장갑)이 자루를 쥠
      const BL = '#dfe6ec', BLD = '#8f9ba5', PL = '#6e4a28', PLD = '#4a3018', GD = '#d9b44a', TASS = '#36a86e';
      const R2 = (dy, d0, w, c) => { const x0 = out > 0 ? x + 2 + d0 : x - d0 - w + 2; px(x0, dy, w, 1, c); };
      px(x, 14, 2, 38 + by, PL); px(x, 14, 1, 38 + by, PLD);
      R2(0, -1, 2, BL); R2(1, -1, 2, BL); R2(2, 0, 4, BL); R2(3, 0, 6, BL); R2(4, 0, 8, BL);
      for (let y = 5; y <= 8; y++) R2(y, 0, 9, BL);
      R2(9, 0, 8, BL); R2(10, 0, 7, BL); R2(11, 1, 6, BL); R2(12, 2, 5, BL); R2(13, 3, 3, BL);
      px(x, 2, 2, 12, BLD); for (let y = 4; y <= 10; y++) R2(y, y < 9 ? 8 : 7, 1, '#fff'); R2(3, 5, 1, '#fff');
      px(x, 14, 2, 2, GD); px(x, 16, 2, 5, TASS); px(x + (out > 0 ? 1 : 0), 21, 1, 3, TASS);
      px(gx, 35 + by, 5, 4, GLV);
    };
    if (dir === 'down') guandao(12, -1, 10, bob); else if (dir === 'up') guandao(31, 1, 28, bob); else guandao(12, -1, 10, bob);
  }
  /* ---------- 캐릭터: 2.5등신 도트 일러스트풍(참고 이미지) — 큰 머리 · 가는 몸 · 눈동자 하이라이트 · 머리 결 · 옷의 밝은/어두운 면. 플레이어와 모든 NPC가 같은 크기(44×54, 발끝 y=51) ---------- */
  function drawChibi(g, dir, f, S, o = {}) {
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const bob = f === 1 || f === 3 ? -1 : 0, lf = f === 1 ? 1 : 0, rf = f === 3 ? 1 : 0, sw = f === 1 ? 1 : f === 3 ? -1 : 0, sit = !!o.sit;
    const hD = S.hairD || S.hair, hL = S.hairL || S.hair, skD = S.skinD || S.skin, bL = S.bottomL || S.bottom, shL = S.shoeL || S.shoe, iris = S.iris || '#5a4636', irisD = S.irisD || '#2a2018';
    const fr = (x, y, w, h, c) => { px(x, y, w, 2, c); px(x, y + h - 2, w, 2, c); px(x, y, 2, h, c); px(x + w - 2, y, 2, h, c); };   // 뿔테 (알 없음)
    const fur = (x, y, w, h, hem) => { px(x, y, w, h, S.fur); for (let j = 0; j < h; j += 4) for (let i = (j / 4) % 2 ? 2 : 0; i < w; i += 5) px(x + i, y + j + 1, 2, 2, S.furL); px(x, y, 1, h, S.furD); px(x + w - 1, y, 1, h, S.furD); px(x, y + h - 1, w, 1, S.furD); if (hem) for (let i = 0; i < w; i += 3) px(x + i, y + h, 2, 2, S.fur); };
    const fem = S.style === 'long';
    const eye = (x, y, side = 0) => {        // 반짝임 없는 눈: 윗눈꺼풀 선 · 흰자 · 홍채+동공 · 아래 그늘 (여성은 속눈썹)
      px(x - 1, y, 6, 1, S.lid || '#1a1418'); px(x, y + 1, 4, 3, '#e6e0da'); px(x + 1, y + 1, 2, 3, iris); px(x + 1, y + 2, 2, 2, irisD); px(x + 1, y + 2, 2, 1, '#0a0810'); px(x, y + 4, 4, 1, skD);
      if (fem) { px(x + (side ? 4 : -2), y - 1, 1, 1, S.lid || '#1a1418'); px(x + (side ? 4 : -2), y, 1, 1, S.lid || '#1a1418'); }
    };
    const brow = (x, y, side) => { const c = hD; px(x, y, 4, 1, c); px(x + (side ? 3 : -1), y - (fem ? 0 : 0), 2, 1, c); if (!fem) px(x, y + 1, 4, 1, c); };
    const hairTop = () => {            // 머리 윗면: 둥근 덮개 + 결 + 하이라이트
      px(14, 4 + bob, 16, 2, S.hair); px(12, 5 + bob, 20, 3, S.hair); px(11, 7 + bob, 22, 5, S.hair);
      px(15, 4 + bob, 9, 1, hL); px(13, 6 + bob, 7, 1, hL); px(23, 6 + bob, 5, 1, hL); px(12, 11 + bob, 20, 1, hD);
      if (S.style === 'messy') { px(13, 2 + bob, 4, 3, S.hair); px(20, 1 + bob, 5, 4, S.hair); px(28, 3 + bob, 4, 3, S.hair); px(21, 1 + bob, 2, 1, hL); }
    };
    const frontHair = () => {
      hairTop();
      if (S.style === 'slick') { px(11, 8 + bob, 3, 8, S.hair); px(30, 8 + bob, 3, 8, S.hair); px(14, 8 + bob, 16, 2, S.hair); px(14, 9 + bob, 16, 1, hL); px(12, 7 + bob, 20, 1, hL); }
      else if (S.style === 'short') { px(11, 10 + bob, 4, 7, S.hair); px(29, 10 + bob, 4, 7, S.hair); px(14, 10 + bob, 16, 3, S.hair); px(18, 12 + bob, 5, 2, S.hair); px(14, 12 + bob, 3, 1, hD); }
      else if (S.style === 'long') { px(10, 10 + bob, 5, 24, S.hair); px(29, 10 + bob, 5, 24, S.hair); px(11, 12 + bob, 1, 20, hL); px(32, 12 + bob, 1, 20, hD); px(14, 10 + bob, 8, 5, S.hair); px(23, 10 + bob, 7, 3, S.hair); px(16, 14 + bob, 4, 1, hD); }
      else if (S.style === 'messy') { px(10, 10 + bob, 5, 12, S.hair); px(29, 10 + bob, 5, 12, S.hair); px(14, 10 + bob, 7, 5, S.hair); px(22, 10 + bob, 4, 4, S.hair); px(26, 10 + bob, 4, 3, S.hair); px(14, 14 + bob, 4, 1, hD); px(11, 12 + bob, 1, 8, hL); }
      else { px(10, 10 + bob, 5, 14, S.hair); px(29, 10 + bob, 5, 14, S.hair); px(14, 10 + bob, 16, 3, S.hair); px(11, 12 + bob, 1, 10, hL); px(15, 12 + bob, 5, 1, hD); }
    };
    const hairBack = () => {
      if (S.style === 'long') { px(9, 5 + bob, 26, 29, S.hair); px(9, 33 + bob, 26, 1, hD); for (let i = 0; i < 24; i += 4) px(11 + i, 14 + bob, 1, 18, hD); px(13, 8 + bob, 6, 1, hL); px(25, 9 + bob, 5, 1, hL); }
      else if (S.style === 'slick') { px(11, 4 + bob, 22, 19, S.hair); px(13, 22 + bob, 18, 2, hD); px(14, 7 + bob, 16, 1, hL); px(14, 12 + bob, 16, 1, hL); px(14, 17 + bob, 16, 1, hD); }
      else { px(10, 4 + bob, 24, 21, S.hair); px(12, 24 + bob, 20, 2, hD); px(13, 7 + bob, 8, 1, hL); px(24, 10 + bob, 6, 1, hL); px(14, 16 + bob, 16, 1, hD); if (S.style === 'messy') { px(13, 2 + bob, 4, 3, S.hair); px(20, 1 + bob, 5, 4, S.hair); px(28, 3 + bob, 4, 3, S.hair); } }
    };
    const face = () => {                 // 갸름한 얼굴: 광대에서 턱으로 좁아진다
      px(13, 11 + bob, 18, 8, S.skin); px(14, 19 + bob, 16, 3, S.skin); px(15, 22 + bob, 14, 1, S.skin); px(16, 23 + bob, 12, 1, S.skin); px(18, 24 + bob, 8, 1, S.skin);
      px(29, 12 + bob, 2, 7, skD); px(28, 19 + bob, 2, 3, skD); px(27, 22 + bob, 2, 1, skD); px(18, 24 + bob, 8, 1, skD); px(13, 11 + bob, 1, 8, skD);
      if (S.blush) { px(15, 20 + bob, 2, 1, S.blush); px(27, 20 + bob, 2, 1, S.blush); }
    };
    const eyes = () => {
      if (S.glasses) { eye(16, 16 + bob, 0); eye(25, 16 + bob, 1); fr(13, 13 + bob, 9, 9, S.glasses); fr(23, 13 + bob, 9, 9, S.glasses); px(22, 15 + bob, 1, 2, S.glasses); px(11, 15 + bob, 2, 2, S.glasses); px(32, 15 + bob, 2, 2, S.glasses); }
      else { brow(15, 13 + bob, 0); brow(25, 13 + bob, 1); eye(16, 15 + bob, 0); eye(24, 15 + bob, 1); }
      px(22, 19 + bob, 1, 2, skD); px(21, 21 + bob, 3, 1, skD);       // 코 · 입은 생략
    };
    const legs = (side) => {
      if (sit) return;
      if (side) { px(19 + sw * 2, 39, 4, 9 - (sw ? 1 : 0), S.bottom); px(23 - sw * 2, 39, 4, 9, S.bottom); px(19 + sw * 2, 39, 1, 8, bL); px(23 - sw * 2, 39, 1, 8, bL); px(17 + sw * 2, 47 - (sw > 0 ? 1 : 0), 8, 4, S.shoe); px(22 - sw * 2, 47 - (sw < 0 ? 1 : 0), 8, 4, S.shoe); px(17 + sw * 2, 47 - (sw > 0 ? 1 : 0), 8, 1, shL); }
      else { px(17, 39, 4, 9 - lf * 2, S.bottom); px(23, 39, 4, 9 - rf * 2, S.bottom); px(17, 39, 1, 8 - lf * 2, bL); px(23, 39, 1, 8 - rf * 2, bL); px(16, 47 - lf * 2, 6, 4, S.shoe); px(22, 47 - rf * 2, 6, 4, S.shoe); px(16, 47 - lf * 2, 6, 1, shL); px(22, 47 - rf * 2, 6, 1, shL); px(17, 49 - lf * 2, 1, 1, shL); px(23, 49 - rf * 2, 1, 1, shL); }
    };
    const suit = (x, w) => {            // 재킷: 밝은 어깨선 · 어두운 옆면 · 단추 · 허리띠
      px(x, 26 + bob, w, 13, S.top); px(x, 26 + bob, w, 1, S.topL || S.top); px(x, 26 + bob, 1, 13, S.topL || S.top); px(x + w - 1, 26 + bob, 1, 13, S.topD); px(x, 38 + bob, w, 1, S.topD);
      px(x, 36 + bob, w, 2, S.belt || S.topD); px(x + w / 2 - 1, 36 + bob, 2, 2, S.buckle || '#c9a94c');
    };
    const sleeve = (x, h, c, hand) => { px(x, 27 + bob, 3, h, c); px(x, 27 + bob, 1, h, S.topL || c); px(x + 2, 27 + bob, 1, h, S.topD || c); px(x - 1, 27 + bob + h - 1, 5, 1, S.topD || c); px(x - 0, 27 + bob + h, 4, 3, hand); px(x, 27 + bob + h, 4, 1, S.handL || hand); };
    if (dir === 'down') {
      if (S.style === 'long' || S.style === 'bob') hairBack();
      legs(false);
      if (S.coat) { for (let y = 26; y <= 45; y++) { const e = y > 38 ? Math.floor((y - 38) / 3) : 0; px(15 - e, y + bob, 14 + e * 2, 1, S.top); px(15 - e, y + bob, 1, 1, S.topL); px(28 + e, y + bob, 1, 1, S.topD); } px(13, 45 + bob, 18, 1, S.topD); px(20, 26 + bob, 4, 19, S.inner); px(21, 26 + bob, 1, 19, S.innerL); px(16, 26 + bob, 4, 8, S.topL); px(24, 26 + bob, 4, 8, S.topL); px(15, 26 + bob, 1, 18, S.topL); px(19, 26 + bob, 1, 8, S.topD); px(24, 26 + bob, 1, 8, S.topD); px(15, 36 + bob, 14, 2, '#0e0f12'); px(21, 36 + bob, 2, 2, '#c9a94c'); px(19, 24 + bob, 6, 3, S.shirt); }
      else if (S.fur) { px(16, 26 + bob, 12, 13, S.jacket); px(16, 26 + bob, 12, 1, '#4466ee'); px(20, 26 + bob, 4, 8, S.shirt); fur(13, 25 + bob, 6, 16, true); fur(25, 25 + bob, 6, 16, true); px(21, 27 + bob, 2, 10, S.tie); px(20, 26 + bob, 4, 2, S.tie); [29, 32, 35].forEach(y => { px(21, y + bob, 2, 1, S.gold); px(20, y + 1 + bob, 1, 1, S.gold); px(23, y + 1 + bob, 1, 1, S.gold); }); }
      else { suit(16, 12); px(20, 26 + bob, 4, 9, S.shirt); px(19, 26 + bob, 1, 6, S.topL); px(24, 26 + bob, 1, 6, S.topL); if (S.tie) { px(21, 27 + bob, 2, 8, S.tie); px(20, 26 + bob, 4, 2, S.tie); px(21, 31 + bob, 2, 1, S.tieP || S.tie); } }
      const armC = S.coat ? S.top : S.fur ? S.fur : (S.sleeve || S.top);
      if (S.fur) { fur(10, 26 + bob, 5, 11 + sw, false); fur(29, 26 + bob, 5, 11 - sw, false); px(10, 36 + bob + sw, 4, 3, S.hand); px(30, 36 + bob - sw, 4, 3, S.hand); }
      else { sleeve(13, 9 + sw, armC, S.hand); sleeve(28, 9 - sw, armC, S.hand); }
      px(20, 24 + bob, 4, 3, skD);
      if (S.fur) { px(13, 24 + bob, 18, 3, S.fur); for (let i = 0; i < 18; i += 3) px(13 + i, 26 + bob, 2, 1, S.furL); }
      face(); frontHair(); eyes();
      if (o.carry) { px(6, 34 + bob, 7, 6, '#e8efff'); px(6, 34 + bob, 7, 1, '#fff'); px(7, 36 + bob, 5, 1, '#9fb4e8'); px(7, 38 + bob, 4, 1, '#9fb4e8'); }
    } else if (dir === 'up') {
      legs(false);
      if (S.coat) { for (let y = 26; y <= 45; y++) { const e = y > 38 ? Math.floor((y - 38) / 3) : 0; px(15 - e, y + bob, 14 + e * 2, 1, S.top); px(15 - e, y + bob, 1, 1, S.topL); px(28 + e, y + bob, 1, 1, S.topD); } px(13, 45 + bob, 18, 1, S.topD); px(22, 28 + bob, 1, 17, S.topD); px(15, 25 + bob, 14, 3, S.topL); px(15, 36 + bob, 14, 2, '#0e0f12'); }
      else if (S.fur) { fur(13, 25 + bob, 18, 16, true); px(22, 28 + bob, 1, 12, S.furD); }
      else { suit(16, 12); px(21, 27 + bob, 2, 8, S.topD); }
      const armC = S.coat ? S.top : S.fur ? S.fur : (S.sleeve || S.top), up = sit ? -2 : 0;
      if (S.fur) { fur(10, 26 + bob, 5, 11 + up + sw, false); fur(29, 26 + bob, 5, 11 + up - sw, false); px(10, 36 + bob + up + sw, 4, 3, S.hand); px(30, 36 + bob + up - sw, 4, 3, S.hand); }
      else { sleeve(13, 9 + up + sw, armC, S.hand); sleeve(28, 9 + up - sw, armC, S.hand); }
      hairBack();
      if (S.fur) px(13, 24 + bob, 18, 3, S.fur);
    } else {      // 왼쪽 옆모습
      legs(true);
      if (S.style === 'long') { px(17, 5 + bob, 17, 29, S.hair); px(17, 33 + bob, 17, 1, hD); }
      if (S.coat) { for (let y = 26; y <= 45; y++) { const e = y > 38 ? Math.floor((y - 38) / 4) : 0; px(16 - e, y + bob, 12 + e * 2, 1, S.top); px(16 - e, y + bob, 1, 1, S.topL); px(27 + e, y + bob, 1, 1, S.topD); } px(14, 45 + bob, 16, 1, S.topD); px(16, 26 + bob, 3, 19, S.inner); px(19, 25 + bob, 9, 3, S.topL); px(16, 36 + bob, 12, 2, '#0e0f12'); }
      else if (S.fur) { px(16, 26 + bob, 12, 13, S.jacket); fur(14, 25 + bob, 14, 16, true); }
      else { px(17, 26 + bob, 11, 13, S.top); px(17, 26 + bob, 11, 1, S.topL || S.top); px(27, 26 + bob, 1, 13, S.topD); px(17, 36 + bob, 11, 2, S.belt || S.topD); if (S.tie) px(17, 28 + bob, 2, 8, S.tie); }
      if (S.fur) { fur(15, 26 + bob, 6, 11 + sw, false); px(15, 36 + bob + sw, 5, 3, S.hand); }
      else { px(17, 27 + bob, 4, 9 + sw, S.coat ? S.top : (S.sleeve || S.top)); px(17, 27 + bob, 1, 9 + sw, S.topL || S.top); px(16, 36 + bob + sw, 5, 3, S.hand); }
      px(19, 24 + bob, 5, 3, skD);
      if (S.style !== 'long') { px(12, 4 + bob, 21, 20, S.hair); px(13, 22 + bob, 17, 2, hD); }
      px(11, 11 + bob, 13, 8, S.skin); px(12, 19 + bob, 12, 3, S.skin); px(13, 22 + bob, 10, 2, S.skin); px(10, 17 + bob, 1, 3, S.skin); px(12, 24 + bob, 9, 1, skD); px(22, 12 + bob, 2, 10, skD);
      // 윗머리 · 앞머리
      px(12, 4 + bob, 21, 3, S.hair); px(11, 6 + bob, 22, 5, S.hair); px(14, 4 + bob, 9, 1, hL); px(12, 6 + bob, 7, 1, hL); px(11, 9 + bob, 13, 3, S.hair); px(11, 11 + bob, 4, 3, S.hair); px(12, 11 + bob, 12, 1, hD);
      if (S.style === 'messy') { px(13, 2 + bob, 4, 3, S.hair); px(20, 1 + bob, 5, 4, S.hair); px(28, 3 + bob, 4, 3, S.hair); }
      if (S.fur) px(13, 24 + bob, 15, 3, S.fur);
      if (S.glasses) { eye(13, 16 + bob); fr(11, 13 + bob, 9, 9, S.glasses); px(20, 15 + bob, 13, 2, S.glasses); } else { px(12, 13 + bob, 4, 1, hD); eye(13, 15 + bob); }
      if (o.carry) { px(10, 34 + bob, 7, 6, '#e8efff'); px(10, 34 + bob, 7, 1, '#fff'); }
    }
  }
  const outline = c => {        // 윤곽선: 테두리를 어두운 선으로 둘러 작은 그림에서도 형태가 또렷하게
    const w = c.width, h = c.height, src = c.getContext('2d').getImageData(0, 0, w, h), d = src.data, o = mk(w, h, () => {}), og = o.getContext('2d'), out = og.createImageData(w, h), od = out.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] > 40) { od[i] = d[i]; od[i + 1] = d[i + 1]; od[i + 2] = d[i + 2]; od[i + 3] = 255; continue; }
      let edge = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && d[(ny * w + nx) * 4 + 3] > 40) { edge = true; break; } }
      if (edge) { od[i] = 8; od[i + 1] = 9; od[i + 2] = 12; od[i + 3] = 235; }
    }
    og.putImageData(out, 0, 0); return o;
  };
  function buildSprites() {
    ['down', 'up', 'left'].forEach(d => { SPR[d] = [0, 1, 2, 3].map(f => outline(mk(CW, CH, g => drawChar(g, d, f)))); });
    SPR.right = SPR.left.map(c => mk(CW, CH, g => { g.translate(CW, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); }));
  }

  /* ---------- 메시지 창 · 선택지 ---------- */
  const typing = () => !Typer.done;
  function showLine() {
    nextEl.classList.remove('on'); Typer.say(txtEl, lines[li], () => nextEl.classList.add('on'));
  }
  function say(arr, name, done) {
    lines = Array.isArray(arr) ? arr : [arr]; li = 0; msgDone = done || null; busyMsg = true; nameEl.textContent = name || ''; msgEl.hidden = false; showLine();
  }
  function advance() {
    if (choice) return;
    if (typing()) { Typer.finish(); return; }
    if (li < lines.length - 1) { li++; showLine(); return; }
    Typer.stop(); msgEl.hidden = true; busyMsg = false; const d = msgDone; msgDone = null; if (d) d();
  }
  function ask(prompt, name, onPick) {   // '네/아니요'
    say(prompt, name, null);
    const open = () => {
      choice = { i: 0, onPick }; choiceEl.hidden = false; paintChoice();
    };
    msgDone = null; lines = [prompt]; li = 0;
    const origAdv = advance;
    // 문장이 다 적히면 선택지를 띄운다
    const wait = setInterval(() => { if (!msgEl.hidden && Typer.done) { clearInterval(wait); open(); } else if (msgEl.hidden) clearInterval(wait); }, 60);
  }
  function paintChoice() { $$('button', choiceEl).forEach((b, i) => b.classList.toggle('on', i === choice.i)); }
  function pickChoice(i) {
    if (!choice) return; const c = choice; choice = null; choiceEl.hidden = true; msgEl.hidden = true; Typer.stop(); busyMsg = false; SND.click(); c.onPick(i === 0);
  }
  $$('button', choiceEl).forEach((b, i) => { b.addEventListener('click', e => { e.stopPropagation(); pickChoice(i); }); b.addEventListener('mouseenter', () => { if (choice) { choice.i = i; paintChoice(); } }); });
  msgEl.addEventListener('click', () => { SND.tick(); advance(); });

  /* ---------- 입력 ---------- */
  const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function interact() {
    if (busyMsg || trans || elevOpen) return;
    const v = DIRV[P.dir]; let hit = null, best = 1e9;
    [14, 26].forEach(d => {
      if (hit) return; const ix = P.x + v[0] * d, iy = P.y - 4 + v[1] * d;
      objs.forEach(o => { if (!o.ia) return; if (ix >= o.px - 4 && ix <= o.px + o.pw + 4 && iy >= o.py - 4 && iy <= o.py + o.ph + 4) { const a = o.pw * o.ph; if (a < best) { best = a; hit = o; } } });
    });
    if (!hit) return; SND.click();
    if (hit.ia === 'sit') { ask('내 의자다.\n앉을까?', '', yes => { if (yes) { Scenes.leaveGame(); } else { say('…나중에 앉자.', ''); } }); return; }
    if (typeof hit.ia === 'function') { hit.ia(hit); return; }
    say(hit.ia, hit.name || '');
  }
  function key(e, down) {
    const c = e.code;
    if (trans) return true;
    if (elevOpen) { if (!down) return true; if (c === 'ArrowUp' || c === 'KeyW') moveElev(-1); else if (c === 'ArrowDown' || c === 'KeyS') moveElev(1); else if (!e.repeat && (c === 'Space' || c === 'Enter' || c === 'KeyE' || c === 'KeyZ')) pickElev(); else if (c === 'Escape') closeElev(); return true; }
    const map = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' };
    if (map[c]) {
      if (down && choice && (map[c] === 'u' || map[c] === 'd')) { choice.i = (choice.i + 1) % 2; paintChoice(); SND.tick(); return true; }
      if (down) keys.add(map[c]); else keys.delete(map[c]); return true;
    }
    if (down && (c === 'Space' || c === 'Enter' || c === 'KeyE' || c === 'KeyZ')) {
      if (e.repeat) return true;
      if (choice) pickChoice(choice.i); else if (busyMsg) advance(); else interact(); return true;
    }
    if (down && c === 'Escape' && choice) { pickChoice(1); return true; }
    return false;
  }
  // 터치 조작: 가상 스틱 + 조사 버튼
  let stickId = null;
  stickEl.addEventListener('pointerdown', e => { stickId = e.pointerId; stickEl.setPointerCapture(e.pointerId); moveStick(e); });
  stickEl.addEventListener('pointermove', e => { if (e.pointerId === stickId) moveStick(e); });
  const endStick = e => { if (e.pointerId !== stickId) return; stickId = null; joy.x = joy.y = 0; $('i', stickEl).style.transform = ''; };
  stickEl.addEventListener('pointerup', endStick); stickEl.addEventListener('pointercancel', endStick);
  function moveStick(e) { const r = stickEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = Math.abs(dx) < .18 ? 0 : dx; joy.y = Math.abs(dy) < .18 ? 0 : dy; $('i', stickEl).style.transform = `translate(${dx * 38}px,${dy * 38}px)`; }
  actBtn.addEventListener('pointerdown', e => { e.preventDefault(); if (trans) return; if (elevOpen) { pickElev(); return; } if (choice) pickChoice(choice.i); else if (busyMsg) advance(); else interact(); });
  cv.addEventListener('pointerdown', () => { if (busyMsg && !choice) advance(); });

  /* ---------- 이동 · 충돌 ---------- */
  const hitAt = (x, y) => { const fx = x - 8, fy = y - 8, fw = 16, fh = 8; return solids.some(s => fx < s.x + s.w && fx + fw > s.x && fy < s.y + s.h && fy + fh > s.y); };
  function update(dt) {
    clock += dt; updateNpcs(dt); if (busyMsg || trans || elevOpen) { P.moving = false; return; }
    let dx = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0) + joy.x, dy = (keys.has('d') ? 1 : 0) - (keys.has('u') ? 1 : 0) + joy.y;
    const l = Math.hypot(dx, dy); P.moving = l > .05;
    if (P.moving) {
      if (l > 1) { dx /= l; dy /= l; }
      if (Math.abs(dx) > Math.abs(dy)) P.dir = dx > 0 ? 'right' : 'left'; else P.dir = dy > 0 ? 'down' : 'up';
      const sp = (keys.has('run') ? 250 : 150) * dt;
      let nx = P.x + dx * sp, ny = P.y + dy * sp;
      if (!hitAt(nx, P.y)) P.x = nx; if (!hitAt(P.x, ny)) P.y = ny;
      P.t += dt * (keys.has('run') ? 1.5 : 1); P.step += dt; if (P.step > (keys.has('run') ? .16 : .24)) { P.step = 0; SND.step(); }
    } else P.t = 0;
  }
  /* ---------- 그리기 ---------- */
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1); const r = cv.getBoundingClientRect(); vw = r.width; vh = r.height;
    const nw = Math.round(vw * dpr), nh = Math.round(vh * dpr); if (cv.width !== nw || cv.height !== nh) { cv.width = nw; cv.height = nh; }   // 크기가 같으면 다시 만들지 않는다(모바일 주소창 변화로 깜빡이는 것 방지)
    Z = Math.max(1, Math.min(3, Math.round(Math.max(vw, 1) / 640)));
    if (vw < 520) Z = 1.5;
  }
  let vigC = null, vigK = '';
  const glowCache = {}; let causticP = null;
  const causticPat = () => causticP || (causticP = ctx.createPattern(mk(128, 128, g => { g.strokeStyle = 'rgba(130,170,255,.9)'; g.lineWidth = 1.5; for (let i = 0; i < 7; i++) { g.beginPath(); for (let x = 0; x <= 128; x += 4) { const y = (i * 18 + Math.sin(x / 128 * Math.PI * 4 + i) * 8 + 128) % 128; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } }), 'repeat'));
  const glowSpr = (r, a, rgb = '255,200,110') => { const k = r + ':' + a + ':' + rgb; return glowCache[k] || (glowCache[k] = mk(r * 2, r * 2, g => { const gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); })); };
  function render() {
    const W = cv.width, H = cv.height, s = Math.max(1, Math.round(Z * dpr));   // 화면 확대는 항상 정수 배(깜빡임 방지)
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#050403'; ctx.fillRect(0, 0, W, H);
    const viewW = Math.ceil(W / s), viewH = Math.ceil(H / s), ppx = Math.round(P.x), ppy = Math.round(P.y);
    camX = viewW >= WW ? Math.round((WW - viewW) / 2) : Math.max(0, Math.min(WW - viewW, Math.round(ppx - viewW / 2)));
    camY = viewH >= WH ? Math.round((WH - viewH) / 2) : Math.max(0, Math.min(WH - viewH, Math.round(ppy - 20 - viewH / 2)));
    ctx.setTransform(s, 0, 0, s, -camX * s, -camY * s);
    const sx = Math.max(0, camX), sy = Math.max(0, camY), sw2 = Math.min(WW - sx, viewW + 1), sh2 = Math.min(WH - sy, viewH + 1);
    ctx.drawImage(floorC, sx, sy, sw2, sh2, sx, sy, sw2, sh2);
    const list = objs.filter(o => o.spr && o.ox + o.spr.width > camX && o.ox < camX + viewW && o.oy + o.spr.height > camY && o.oy < camY + viewH).map(o => ({ b: o.base, f: () => ctx.drawImage(o.spr, o.ox, o.oy) }));
    objs.forEach(o => { if (o.anim && o.spr && o.ox + o.spr.width > camX && o.ox < camX + viewW) list.push({ b: o.base + .5, f: () => o.anim(ctx, clock, o) }); });
    npcs.forEach(n => { const sit = n.kind === 'sit', f = n.moving ? [0, 1, 0, 3][Math.floor(n.t / .15) % 4] : (sit ? (Math.floor(n.t * 3) % 2 ? 1 : 0) : 0), spr = npcSprite(n.pal, n.dir, f, sit, n.carry && !sit); if (n.x + 20 < camX || n.x - 20 > camX + viewW) return; list.push({ b: n.y + (sit ? 2 : 0), f: () => { if (!sit) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(Math.round(n.x), Math.round(n.y) - 1, 12, 4, 0, 0, 7); ctx.fill(); } ctx.drawImage(spr, Math.round(n.x) - 22, Math.round(n.y) - (sit ? 38 : 51)); } }); });
    const fi = P.moving ? [0, 1, 0, 3][Math.floor(P.t / .12) % 4] : 0;
    list.push({ b: ppy, f: () => { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(ppx, ppy - 1, 12, 4, 0, 0, 7); ctx.fill(); ctx.drawImage(SPR[P.dir][fi], ppx - CW / 2, ppy - 51); } });
    list.sort((a, b) => a.b - b.b).forEach(o => o.f());
    if (curMap === 'f95') { const tx = Math.round(clock * 14 % 128), ty = Math.round(clock * 8 % 128); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .17; ctx.fillStyle = causticPat(); ctx.translate(tx, ty); ctx.fillRect(camX - tx, camY - ty, viewW + 1, viewH + 1); ctx.restore(); }
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, a, rgb) => ctx.drawImage(glowSpr(r, a, rgb), Math.round(x - r), Math.round(y - r));
    if (curMap === 'office') glow(21.5 * T + 20, 10.4 * T, 200, .16); objs.forEach(o => { if (o.glow) glow(o.glow[0], o.glow[1], o.glow[2], .22, o.gc); });
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vk = W + 'x' + H; if (vk !== vigK) { vigK = vk; vigC = mk(W, H, g => { const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); }); }
    ctx.drawImage(vigC, 0, 0);
  }
  function loop(ts) {
    raf = requestAnimationFrame(loop); const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; update(dt); render();
  }
  addEventListener('resize', () => { if (on) resize(); });
  return {
    key, sprites: () => SPR, player: P, debug: { npcSprite, NPC_SPECS, KRITOS, outline },
    enter() {
      on = true; keys.clear(); joy.x = joy.y = 0; busyMsg = false; choice = null; msgEl.hidden = true; choiceEl.hidden = true; Typer.stop();
      if (!SPR.down) buildSprites(); if (!KR_SPR) KR_SPR = buildKritos();
      trans = false; elevOpen = false; elevEl.hidden = true; fadeEl.classList.remove('on'); floorEl.hidden = true; useMap('office'); if (questOn) showQuest(false); else questEl.hidden = true;
      P.x = 21.5 * T; P.y = 13.7 * T; P.dir = 'up'; P.t = 0; P.moving = false;
      const touch = matchMedia('(pointer:coarse)').matches || innerWidth < 760; padEl.hidden = !touch; $('#scGame').classList.toggle('touch', touch); $('.g-keys').style.display = touch ? 'none' : '';
      resize(); last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      setTimeout(() => { if (on && !busyMsg) say(['여기는 내 회장실이다.', touch ? '스틱으로 이동하고 조사 버튼으로 주변을 살펴보자.' : 'WASD로 이동하고 Space 또는 Enter로 주변을 살펴보자.'], ''); }, RM ? 0 : 900);
    },
    leave() { on = false; cancelAnimationFrame(raf); raf = 0; keys.clear(); Typer.stop(); trans = false; elevOpen = false; elevEl.hidden = true; fadeEl.classList.remove('on'); floorEl.hidden = true; questEl.hidden = true; msgEl.hidden = true; choiceEl.hidden = true; choice = null; busyMsg = false; },
  };
})();
window.RSC.Game = Game;
