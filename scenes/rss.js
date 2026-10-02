/* ==========================================================================
   신호 II — R.S.S.(정보 관리국) 메인 화면. 울트라마린 + 시안 · 홀로그램 70% / 테크니컬 30%. 지금은 디자인만(기능 없음)
   ========================================================================== */
const Rss = (() => {
  const cv = $('#rCv'), g = cv.getContext('2d'), view = $('#scRss');
  let raf = 0, on = false, tm = [], t0 = 0, W = 0, H = 0, dpr = 1;
  const BARS = ['UPLINK', 'ARCHIVE', 'VAULT', 'CIPHER', 'SENSOR', 'RELAY'];
  const LOGS = ['I.P.I. 핸드셰이크 완료', '파견 팀 영상 수신 대기', '보안 등급 코드 갱신', '아카이브 무결성 검사', '암호 키 순환', '정보 처리 팀 동기화', '설립자 접속 확인', '전송 구간 암호화 유지'];
  const rb = rng(2026);
  const stars = Array.from({ length: 140 }, () => ({ x: rb(), y: rb(), z: .3 + rb() * .7, p: rb() * 6 }));
  const nodes = Array.from({ length: 46 }, () => { const u = rb() * Math.PI * 2, v = Math.acos(2 * rb() - 1); return { a: u, b: v }; });
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  function build() {
    $('#rBars').innerHTML = BARS.map(n => `<li><span>${n}</span><span class="bar"><i style="transform:scaleX(.3)"></i></span><span class="v">--</span></li>`).join('');
    $('#rWave').innerHTML = Array.from({ length: 34 }, () => '<i style="height:4px"></i>').join('');
    $('#rLv').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < 3 ? 'on' : ''}"></i>`).join('');
  }
  function tick() {
    $$('#rBars li').forEach(li => { const v = .25 + Math.random() * .7; $('i', li).style.transform = `scaleX(${v.toFixed(2)})`; $('.v', li).textContent = Math.round(v * 100) + '%'; });
    const rl = $('#rLog'), l = LOGS[Math.floor(Math.random() * LOGS.length)], tt = new Date().toTimeString().slice(0, 8); rl.textContent = (`[${tt}] ${l}  ◈  ` + rl.textContent).slice(0, 260);
  }
  function clock() { $('#rClock').textContent = new Date().toTimeString().slice(0, 8); }
  function frame(ts) {
    raf = requestAnimationFrame(frame); const t = (ts - t0) / 1000; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    // 별빛 입자(홀로그램 배경)
    stars.forEach(s => { const y = (s.y + t * .012 * s.z) % 1; g.fillStyle = `rgba(154,243,255,${(.2 + .5 * s.z * (.6 + .4 * Math.sin(t * 2 + s.p))).toFixed(2)})`; g.fillRect(s.x * W, y * H, 1 + s.z, 1 + s.z); });
    // 바닥 격자(테크니컬)
    const hz = H * .62; g.strokeStyle = 'rgba(46,230,255,.16)'; g.lineWidth = 1;
    for (let i = 0; i <= 20; i++) { const x = (i / 20 - .5) * W * 3 + W / 2; g.beginPath(); g.moveTo(W / 2 + (x - W / 2) * .06, hz); g.lineTo(x, H); g.stroke(); }
    for (let i = 1; i < 14; i++) { const k = Math.pow((i + (t * .35) % 1) / 14, 2.2), y = hz + (H - hz) * k; g.globalAlpha = .1 + k * .5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.globalAlpha = 1; }
    // 중앙 홀로그램 구체
    const cx = W / 2, cy = H * .47, R = Math.min(W * .34, H * .3), ang = t * .35;
    const grd = g.createRadialGradient(cx, cy, R * .2, cx, cy, R * 1.5); grd.addColorStop(0, 'rgba(46,230,255,.16)'); grd.addColorStop(1, 'rgba(46,230,255,0)'); g.fillStyle = grd; g.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2);
    g.strokeStyle = 'rgba(46,230,255,.55)'; g.lineWidth = 1; g.shadowColor = '#2ee6ff'; g.shadowBlur = 8;
    for (let i = 0; i < 12; i++) { const a = ang + i / 12 * Math.PI, rx = Math.abs(Math.cos(a)) * R; g.beginPath(); g.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2); g.stroke(); }
    for (let k = -3; k <= 3; k++) { const y = cy + k / 4 * R, rr = Math.sqrt(Math.max(0, R * R - (k / 4 * R) ** 2)); g.beginPath(); g.ellipse(cx, y, rr, rr * .22, 0, 0, Math.PI * 2); g.stroke(); }
    g.shadowBlur = 0; g.strokeStyle = 'rgba(154,243,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    // 구체 위 노드
    const pts = nodes.map(n => { const a = n.a + ang * 1.4, x = Math.sin(n.b) * Math.cos(a), z = Math.sin(n.b) * Math.sin(a), y = Math.cos(n.b); return { x: cx + x * R, y: cy + y * R, z }; });
    pts.forEach((p, i) => { if (p.z < 0) return; for (let j = i + 1; j < pts.length; j++) { const q = pts[j]; if (q.z < 0) continue; const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < R * .42) { g.strokeStyle = `rgba(46,230,255,${(.5 * (1 - d / (R * .42))).toFixed(2)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); } } });
    pts.forEach(p => { if (p.z < 0) return; g.fillStyle = '#e9fdff'; g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); });
    // 궤도 고리 · 눈금 · 스캔 빔
    g.save(); g.translate(cx, cy); g.rotate(-.28); g.strokeStyle = 'rgba(46,230,255,.55)'; g.setLineDash([2, 6]); g.beginPath(); g.ellipse(0, 0, R * 1.32, R * .34, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); const oa = t * .9; g.fillStyle = '#fff'; g.shadowColor = '#2ee6ff'; g.shadowBlur = 14; g.beginPath(); g.arc(Math.cos(oa) * R * 1.32, Math.sin(oa) * R * .34, 4, 0, 7); g.fill(); g.restore(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(46,230,255,.4)'; g.lineWidth = 1; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, L = i % 6 ? 6 : 14; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R * 1.12), cy + Math.sin(a) * (R * 1.12)); g.lineTo(cx + Math.cos(a) * (R * 1.12 + L), cy + Math.sin(a) * (R * 1.12 + L)); g.stroke(); }
    const sy = cy - R + ((t * .45) % 1) * R * 2; const sg = g.createLinearGradient(0, sy - 18, 0, sy + 2); sg.addColorStop(0, 'rgba(46,230,255,0)'); sg.addColorStop(1, 'rgba(154,243,255,.35)'); g.fillStyle = sg; g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip(); g.fillRect(cx - R, sy - 18, R * 2, 20); g.restore();
    // 중앙 글자(홀로그램 표시)
    g.textAlign = 'center'; g.font = `800 ${Math.max(16, R * .17)}px Cinzel, serif`; g.fillStyle = 'rgba(233,253,255,.92)'; g.shadowColor = '#2ee6ff'; g.shadowBlur = 16; g.fillText('R . S . S .', cx, cy + R * 1.3); g.shadowBlur = 0; g.font = '11px "Share Tech Mono", monospace'; g.fillStyle = 'rgba(154,243,255,.7)'; g.fillText('INFORMATION  ·  ARCHIVE  ·  SECURITY', cx, cy + R * 1.3 + 22);
    // 홀로그램 줄무늬
    g.fillStyle = 'rgba(46,230,255,.035)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
    if (Math.random() < .012) { g.fillStyle = 'rgba(154,243,255,.08)'; g.fillRect(0, Math.random() * H, W, 2 + Math.random() * 6); }
  }
  addEventListener('resize', () => { if (on) resize(); });
  return {
    enter() {
      on = true; build(); resize(); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); tick(); clock();
      tm.push(setInterval(tick, 1500), setInterval(clock, 1000), setInterval(() => $$('#rWave i').forEach(i => { i.style.height = (3 + Math.random() * 40) + 'px'; }), 130));
    },
    leave() { on = false; cancelAnimationFrame(raf); raf = 0; tm.forEach(clearInterval); tm = []; },
  };
})();
$('#rExit').addEventListener('click', () => { SND.click(); Scenes.leaveRss(); });
