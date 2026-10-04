/* ==========================================================================
   신호 IV — 유리가 깨지고, 눈과 '발신자 표시 제한'의 주인공과 마주함. 배경음악은 멈추고 바람 소리만. 나가려면 복구 코드(Re-code)
   ========================================================================== */
const Eye = (() => {
  const view = $('#scEye'), cv = $('#eCv'), g = cv.getContext('2d'), eye = $('#eEye'), fig = $('#eFig'), say = $('#eSay'), txt = $('#eTxt'), form = $('#eCode'), inp = $('#eIn'), err = $('#eErr');
  const LINES = ['…드디어 이곳까지 오셨군요, 설립자.', '발신자는 밝히지 않습니다. 이름도 얼굴도, 이곳에서는 필요하지 않으니까요.', '여기는 설립자께서 물으신 적 없는 것들이 모이는 곳입니다. 오래 머무를 곳은 못 됩니다.', '돌아가시려면 오른쪽 아래에 복구 코드를 적으십시오.\n코드는 ‘Re-code’입니다.'];
  let raging = false, locked = false, rageText = 'CALLER ID RESTRICTED  ', ambTimer = 0, rageRaf = 0, crtRaf = 0, rageStop = null;
  /* 하얀 신화풍의 눈 20개: 화면 위쪽에 '호(∩)' 모양으로 빼곡히, 서로 조금씩만 떨어져서. 위로 뻗은 뿔과 아래로 떨어지는 줄기, 크고 하얀 동공. 각자 따로 깜빡이고 시선이 포인터를 따라간다 */
  const NEYE = 20, eyes = [];
  for (let i = 0; i < NEYE; i++) {
    eye.insertAdjacentHTML('beforeend', `<svg viewBox="-110 -104 220 208" style="--k:${i}"><defs><clipPath id="eCl${i}"><path class="cp" d=""/></clipPath></defs><path d="M-6 -50L0 -102L6 -50Z" fill="#e4e4e4"/><path d="M-11 48C-7 72 -2 90 0 104C2 90 7 72 11 48Z" fill="#d2d2d2"/><path class="al" d="" fill="#0b0b0b" stroke="#e2e2e2" stroke-width="11" stroke-linejoin="round"/><g clip-path="url(#eCl${i})"><g class="ir"><ellipse rx="33" ry="28" fill="#f4f4f4"/></g></g></svg>`);
    const s = eye.lastElementChild; eyes.push({ s, al: s.querySelector('.al'), cp: s.querySelector('.cp'), ir: s.querySelector('.ir'), open: .02, target: 1, blink: 1.5 + Math.random() * 4 });
  }
  let px = -1, py = -1;
  function layoutEyes() {
    const r = view.getBoundingClientRect(), W = r.width, H = r.height, mob = W < 700, counts = mob ? [7, 7, 6] : [10, 10], pos = [];
    const arc = (rx, ry, apex, tm, n) => {          // 타원 호를 '호 길이' 기준으로 똑같은 간격으로 나눈다
      const S = 400, pts = []; let len = 0;
      for (let k = 0; k <= S; k++) { const th = -tm + 2 * tm * k / S, x = W / 2 + Math.sin(th) * rx, y = apex + (1 - Math.cos(th)) * ry; if (k) len += Math.hypot(x - pts[k - 1].x, y - pts[k - 1].y); pts.push({ x, y, len }); }
      const out = []; for (let i = 0; i < n; i++) { const tl = len * (i + .5) / n; let k = 1; while (k < S && pts[k].len < tl) k++; const p0 = pts[k - 1], p1 = pts[k], f = (tl - p0.len) / Math.max(1e-6, p1.len - p0.len); out.push({ x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f, a: Math.atan2(p1.y - p0.y, p1.x - p0.x) }); }
      return { out, len };
    };
    const rx0 = mob ? W * .47 : Math.min(W * .45, H * .95), ry0 = mob ? H * .1 : Math.min(H * .27, 260), tm = (mob ? 66 : 62) * Math.PI / 180, apex0 = mob ? 44 : 60;
    const first = arc(rx0, ry0, apex0, tm, counts[0]), w0 = Math.min(first.len / counts[0], mob ? 66 : 150) * (mob ? .9 : 1), rows = counts.map((n, row) => { const g = row * w0 * 1.0; return arc(rx0 - g, Math.max(10, ry0 - g * .35), apex0 + g, tm, n); });
    const w = Math.min(w0, ...rows.map((r, i) => r.len / counts[i] * .96)), h = w * 208 / 220;
    rows.forEach(rr => rr.out.forEach(p => pos.push(p)));
    pos.forEach((p, i) => { const e = eyes[i], s = e.s.style; e.cx = p.x; e.cy = p.y; e.ang = p.a; s.width = w + 'px'; s.height = h + 'px'; s.left = (p.x - w / 2) + 'px'; s.top = (p.y - h / 2) + 'px'; s.transform = `rotate(${(p.a * 180 / Math.PI).toFixed(1)}deg)`; });
  }
  let raf = 0, on = false, t0 = 0, li = 0, open = 0, target = 1, blinkT = 0, mx = .5, my = .3, W = 0, H = 0, dpr = 1, tm = [];
  const parts = Array.from({ length: 90 }, (_, i) => ({ x: Math.random(), y: Math.random(), v: .04 + Math.random() * .16, l: 30 + Math.random() * 120, a: .05 + Math.random() * .22, m: i % 4 === 0 }));
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); layoutEyes(); }
  function eyePath(o) { const k = Math.max(.02, o), t = -64 * k, b = 64 * k; return `M-100 0C-60 ${t} 60 ${t} 100 0C60 ${b} -60 ${b} -100 0Z`; }
  function frame(ts) {
    raf = requestAnimationFrame(frame); const t = (ts - t0) / 1000; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    // 바람: 가로로 흐르는 가는 줄과 먼지
    parts.forEach(p => {
      p.x += p.v * .016 * (1 + Math.sin(t * .5 + p.y * 6) * .4); if (p.x > 1.2) { p.x = -.2; p.y = Math.random(); }
      const x = p.x * W, y = p.y * H + Math.sin(t * .8 + p.x * 8) * 6;
      if (p.m) { g.fillStyle = `rgba(233,216,166,${p.a * 1.6})`; g.fillRect(x, y, 1.5, 1.5); } else { const gr = g.createLinearGradient(x - p.l, y, x, y); gr.addColorStop(0, 'rgba(233,216,166,0)'); gr.addColorStop(1, `rgba(233,216,166,${p.a})`); g.strokeStyle = gr; g.lineWidth = 1; g.beginPath(); g.moveTo(x - p.l, y); g.lineTo(x, y); g.stroke(); }
    });
    // 눈 20개: 천천히 뜨고, 제각각 깜빡이고, 시선이 포인터를 따라감
    eyes.forEach((e, i) => {
      if (t > .6) { e.blink -= .016; if (e.blink < 0) { e.target = e.target > .5 ? .04 : 1; e.blink = e.target < .5 ? .12 : 2.2 + Math.random() * 5; } }
      e.open += (e.target - e.open) * (e.target < .5 ? .5 : .08);
      const d = eyePath(e.open); e.al.setAttribute('d', d); e.cp.setAttribute('d', d);
      const tx = px < 0 ? W / 2 : px, ty = py < 0 ? H * .62 : py, dx = tx - e.cx, dy = ty - e.cy, ca = Math.cos(-e.ang), sa = Math.sin(-e.ang), lx = dx * ca - dy * sa, ly = dx * sa + dy * ca, dist = Math.hypot(lx, ly) || 1, mag = Math.min(1, dist / 160);
      e.ir.setAttribute('transform', `translate(${(lx / dist * 27 * mag).toFixed(1)} ${(ly / dist * 11 * mag).toFixed(1)})`);
    });
  }
  function nextLine() {
    if (li >= LINES.length) { say.hidden = true; inp.focus({ preventScroll: true }); return; }
    say.hidden = false; Typer.say(txt, LINES[li], () => { });
  }
  say.addEventListener('click', () => { if (!Typer.done) { Typer.finish(); return; } li++; SND.tick(); nextLine(); });
  view.addEventListener('pointermove', e => { const r = view.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; px = e.clientX - r.left; py = e.clientY - r.top; });
  view.addEventListener('pointerdown', e => { const r = view.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });

  /* ---------- 'No-code' 를 적으면: 영어 글자가 화면을 가득 채우고 경보 · 글리치 · 분노 → 10초 뒤 '삐' + 브라운관 지지직 ---------- */
  const RAGE_LINES = ['…지금 무슨 말을 적은 겁니까.', 'NO-CODE?!\n그런 코드는 존재하지 않습니다!!', '여기서 장난을 치면\n어떻게 되는지 아십니까?!', '멈추십시오!!\n당장 멈추라고 했습니다!!', '…돌아가고 싶다면 ‘Re-code’.\n그 외에는 전부 소음일 뿐입니다.'];
  const rageC = $('#eRage'), rageTx = $('#eRageTx'), crtC = $('#eCrt');
  const rageT = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); rageT.push(id); return id; };
  function drawRage(ts) {
    rageRaf = requestAnimationFrame(drawRage); const W = rageC.width, H = rageC.height, g = rageC.getContext('2d'), t = (ts - rageT0) / 1000;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgb(${18 + (Math.sin(t * 9) > 0 ? 14 : 0)},0,0)`; g.fillRect(0, 0, W, H);
    const sz = Math.max(46, Math.round(H / 6.5)), txt = rageText, lines = Math.ceil(H / (sz * .92)) + 1;
    g.font = `800 ${sz}px "Share Tech Mono", "Courier New", monospace`; g.textBaseline = 'top'; const tw = g.measureText(txt).width || 1;
    const amp = 1 + Math.min(1, t / 8);       // 시간이 갈수록 떨림이 커진다
    for (let i = 0; i < lines; i++) {
      const y = i * sz * .92 + (Math.random() - .5) * 5 * amp, off = ((i % 2 ? 1 : -1) * t * (90 + i * 22)) % tw;
      for (let x = -tw + off; x < W; x += tw) {
        g.fillStyle = 'rgba(0,255,255,.55)'; g.fillText(txt, x + 5 * amp, y); g.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,.92)' : 'rgba(255,32,20,.92)'; g.fillText(txt, x - 3 * amp, y);
      }
    }
    for (let k = 0, n = 3 + Math.floor(Math.random() * 5 * amp); k < n; k++) { const y = Math.random() * H, h = 4 + Math.random() * 46, dx = (Math.random() - .5) * 140 * amp; g.drawImage(rageC, 0, y, W, h, dx, y, W, h); }   // 가로로 찢어지는 글리치
    g.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    if (!locked && Math.random() < .06 * (RM ? 0 : 1)) { g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, 0, W, H); }        // 번쩍임은 약하고 드물게
    const vg = g.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, H); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  let rageT0 = 0;
  function showRageLine(i) {
    const line = RAGE_LINES[i]; rageTx.hidden = false; rageTx.textContent = ''; let n = 0;
    const id = setInterval(() => { n++; rageTx.textContent = line.slice(0, n); if (n % 2 === 0) SND._t(900 + Math.random() * 400, .02, 'square', .02); if (n >= line.length) clearInterval(id); }, RM ? 1 : 26); rageT.push(id);
  }
  /* ---------- 브라운관: WebGL 로 화면 가득 눈보라(치지직). 가장자리로 갈수록 휘어져 유리가 볼록하게 튀어나온 느낌 ---------- */
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D tx;uniform float t,mx,ps;uniform vec2 cells;varying vec2 v;
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec2 d=v-.5;float r2=dot(d,d);
  vec2 u=.5+d*(1.+.5*r2)/(1.+.25);            // 배럴 왜곡: 가장자리 중앙은 안쪽, 네 모서리는 정확히 모서리로 → 빈틈 없이 가득
  float ft=mod(floor(t*24.),97.);
  vec2 c=floor(u*cells);
  float n=h(c+ft*vec2(37.,17.));
  float row=floor(u.y*70.);
  float tear=step(.955,h(vec2(row,ft+5.)))*(h(vec2(row,ft))-.5)*.05;
  float st=step(.992,h(vec2(floor(u.y*cells.y*.5),ft+9.)));
  vec2 tu=vec2(u.x+tear,u.y);
  float ca=.0035+.004*r2*4.;
  float mr=texture2D(tx,tu+vec2(ca,0.)).r,mg=texture2D(tx,tu).r,mb=texture2D(tx,tu-vec2(ca,0.)).r;
  vec3 m=vec3(mr,mg,mb)*mx;
  vec3 base=vec3(n*.72,n*.74,n*.8);
  vec3 col=mix(base,vec3(.7+.3*n),m*.92);
  col+=st*.35;
  float roll=fract(t*.11);float rb=exp(-pow((u.y-roll)*9.,2.));col+=rb*.14;
  float sc=.8+.2*sin(gl_FragCoord.y*3.14159/ps);col*=sc;
  col*=.96+.04*sin(t*53.);
  float vg=1.-smoothstep(.12,.5,r2)*.62;col*=vg;
  float gl=exp(-dot(v-vec2(.2,.82),v-vec2(.2,.82))*14.);col+=gl*.07;     // 유리에 비친 빛
  float rim=smoothstep(.43,.5,r2);col*=1.-rim*.25;
  gl_FragColor=vec4(col,1.);
}`;
  let gl = null, crtProg = null, crtTex = null, txC = null, crtT0 = 0, crtMix = 0, crtFall = false, crtLoopStop = null;
  function crtSize() { const r = view.getBoundingClientRect(), k = Math.min(devicePixelRatio || 1, 1.5); return { w: Math.max(2, Math.round(r.width * k)), h: Math.max(2, Math.round(r.height * k)), css: r, k }; }
  function drawTxt(w, h, word) {
    if (!txC) txC = document.createElement('canvas'); txC.width = Math.min(2048, w); txC.height = Math.min(2048, h); const g = txC.getContext('2d'), W = txC.width, H = txC.height;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.font = '800 100px "Share Tech Mono","Courier New",monospace'; const w100 = g.measureText(word).width || 600, sz = Math.min(H / 6, W * .94 / w100 * 100);
    g.font = `800 ${sz}px "Share Tech Mono","Courier New",monospace`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = '#fff';
    const rows = Math.ceil(H / (sz * 1.05)) + 1, y0 = (H - (rows - 1) * sz * 1.05) / 2;
    for (let i = 0; i < rows; i++) { const y = y0 + i * sz * 1.05; g.fillText(word, W / 2 + (i % 2 ? sz * .0 : 0), y); }
  }
  function crtResize() {
    if (crtC.hidden) return; const s = crtSize(); crtC.width = s.w; crtC.height = s.h;
    if (gl) { gl.viewport(0, 0, s.w, s.h); drawTxt(s.w, s.h, 'Enter-code'); gl.bindTexture(gl.TEXTURE_2D, crtTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, txC); }
  }
  function crtFrame(ts) {
    crtRaf = requestAnimationFrame(crtFrame); const t = (ts - crtT0) / 1000, s = crtSize();
    if (crtC.width !== s.w || crtC.height !== s.h) crtResize();
    if (gl) {
      const mix = Math.max(0, Math.min(1, (t - (RM ? .1 : 2.2)) / (RM ? .1 : 1.4)));
      gl.uniform1f(gl.getUniformLocation(crtProg, 't'), t); gl.uniform1f(gl.getUniformLocation(crtProg, 'mx'), mix); gl.uniform1f(gl.getUniformLocation(crtProg, 'ps'), 2.4 * s.k);
      gl.uniform2f(gl.getUniformLocation(crtProg, 'cells'), s.css.width / 2.6, s.css.height / 2.6); gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {              // WebGL 이 없는 기기: 2D 눈보라 + 글자
      const g = crtC.getContext('2d'), w = 320, h = Math.round(320 * s.h / s.w), sm = crtFall; if (!sm) { crtFall = true; }
      const im = g.createImageData(crtC.width, crtC.height), d = new Uint32Array(im.data.buffer); for (let i = 0; i < d.length; i++) { const v = (Math.random() * 190) | 0; d[i] = 0xff000000 | (v << 16) | (v << 8) | v; } g.putImageData(im, 0, 0);
      drawTxt(crtC.width, crtC.height, 'Enter-code'); g.globalAlpha = Math.max(0, Math.min(1, (t - 2.2) / 1.4)) * .85; g.globalCompositeOperation = 'lighten'; g.drawImage(txC, 0, 0, crtC.width, crtC.height); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; void w; void h;
    }
  }
  function crtStart() {
    crtC.hidden = false; const s = crtSize(); crtC.width = s.w; crtC.height = s.h; gl = null;
    try { gl = crtC.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (gl) {
      const mk = (ty, src) => { const sh = gl.createShader(ty); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
      crtProg = gl.createProgram(); gl.attachShader(crtProg, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(crtProg, mk(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(crtProg);
      if (!gl.getProgramParameter(crtProg, gl.LINK_STATUS)) { gl = null; } else {
        gl.useProgram(crtProg); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(crtProg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        crtTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, crtTex); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        crtResize();
      }
    }
    view.classList.add('crt-on'); crtT0 = performance.now(); cancelAnimationFrame(crtRaf); crtRaf = requestAnimationFrame(crtFrame);
  }
  function crtStop() { cancelAnimationFrame(crtRaf); crtRaf = 0; if (crtLoopStop) { crtLoopStop(); crtLoopStop = null; } if (gl) { const ex = gl.getExtension('WEBGL_lose_context'); if (ex) ex.loseContext(); } gl = null; crtProg = null; crtTex = null; crtC.hidden = true; view.classList.remove('crt-on'); }
  async function rage() {
    if (raging) return; raging = true; inp.disabled = true; inp.blur(); err.textContent = ''; Typer.stop(); say.hidden = true; tm.forEach(clearTimeout); tm = [];
    const dpr = 1, r = view.getBoundingClientRect(); rageC.width = Math.round(r.width * dpr); rageC.height = Math.round(r.height * dpr);
    view.classList.add('rage'); rageC.hidden = false; rageT0 = performance.now(); cancelAnimationFrame(rageRaf); rageRaf = requestAnimationFrame(drawRage);
    rageStop = SND.rageStart(10); [0.2, 2.3, 4.5, 6.6, 8.4].forEach((a, i) => later(() => showRageLine(i), a * 1000 * (RM ? .1 : 1)));
    await new Promise(res => later(res, RM ? 1200 : 10000));
    // 10초 뒤: '삐' + 브라운관 눈보라(이후 계속 유지)
    if (rageStop) rageStop(); rageStop = null; cancelAnimationFrame(rageRaf); rageC.hidden = true; rageTx.hidden = true; view.classList.remove('rage');
    crtStart(); SND.beep(1.7); crtLoopStop = SND.crtLoop();
    await new Promise(res => later(res, RM ? 600 : 4200));
    raging = false; enterLocked();
  }


  /* ---------- 30초가 지나도 비밀 기록 보관소를 열지 않으면: 검은 화면 → 설립자를 겨냥한 검은 리볼버(클릭 = 한 발, 6발) → 느와르 문장 → 효과 없이 아주 큰 '삐' + 이진수 레드스크린 ---------- */
  const trap = $('#eTrap'), tBin = $('#eBin'), tReboot = $('#eReboot'), gunEl = $('#eGun'), gFx = $('#eGunFx'), gCr = $('#eGunCr'), gNz = $('#eGunNz'), gFlash = $('#eFlash'), gNoir = $('#eNoir'), gXh = $('#eXh'), gPips = $('#ePips'), gHint = $('#eGunHint');
  const SHOTS = 6, NOIR_TEXT = '당신이 당신을 죽인겁니다.\n설립자.';
  let trapOn = false, trapT = [], trapRaf = 0, lockTimer = 0, vaultSeen = false;
  let gunOn = false, gunReady = false, shots = 0, gunCracks = [], drips = [], noiseUntil = 0, noiseDur = 1, gunDone = null;
  const twait = ms => new Promise(res => trapT.push(setTimeout(res, ms)));
  function splat(g, W, H) {                   // 피: 중심에서 사방으로 튄 방울 + 가운데 큰 얼룩, 일부는 아래로 흘러내린다
    const m = Math.min(W, H), cx = W * (.32 + Math.random() * .36), cy = H * (.28 + Math.random() * .34);
    g.fillStyle = '#5c0000'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(cx + (Math.random() - .5) * m * .1, cy + (Math.random() - .5) * m * .1, m * (.03 + Math.random() * .045), 0, 6.283); g.fill(); }
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * 6.283, k = Math.pow(Math.random(), 1.5), d = k * m * .46, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, r = 2 + Math.random() * (15 - k * 10);
      g.fillStyle = Math.random() < .5 ? '#8a0000' : '#b30a0a'; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
      if (Math.random() < .3) drips.push({ x, y, len: 0, max: 40 + Math.random() * 190, v: 26 + Math.random() * 80, w: 2 + Math.random() * 4 });
    }
  }
  function gunLoop() {
    const nz = gNz.getContext('2d'), W = gNz.width, H = gNz.height, nc = document.createElement('canvas'), nw = nc.width = Math.ceil(W / 3), nh = nc.height = Math.ceil(H / 3), ng = nc.getContext('2d'), im = ng.createImageData(nw, nh), nd = new Uint32Array(im.data.buffer), fx = gFx.getContext('2d');
    let last = performance.now();
    const f = ts => {
      trapRaf = requestAnimationFrame(f); const dt = Math.min(.05, (ts - last) / 1000); last = ts;
      drips.forEach(d => { if (d.len < d.max) { const n = Math.min(d.max - d.len, d.v * dt); fx.strokeStyle = '#6e0000'; fx.lineWidth = d.w; fx.lineCap = 'round'; fx.beginPath(); fx.moveTo(d.x, d.y + d.len); fx.lineTo(d.x, d.y + d.len + n); fx.stroke(); d.len += n; d.v *= .995; } });
      const left = noiseUntil - ts, k = left > 0 ? Math.min(1, left / noiseDur) : 0, base = shots / SHOTS * .07;
      nz.clearRect(0, 0, W, H);
      if (k > 0 || base > 0) {
        const al = Math.min(.9, base + k * .85);
        for (let i = 0; i < nd.length; i++) { const v = (Math.random() * 255) | 0; nd[i] = ((al * 255 * (.4 + Math.random() * .6) | 0) << 24) | (v << 16) | (v << 8) | v; }
        ng.putImageData(im, 0, 0); nz.imageSmoothingEnabled = false; nz.drawImage(nc, 0, 0, nw, nh, 0, 0, W, H);
        for (let q = 0, n = Math.floor(k * 9); q < n; q++) { nz.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.7)'; nz.fillRect(0, Math.random() * H, W, 1 + Math.random() * 5); }
        if (k > 0) { const gr = nz.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .2, W / 2, H / 2, Math.max(W, H) * .75); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(150,0,0,${(.55 * k).toFixed(2)})`); nz.fillStyle = gr; nz.fillRect(0, 0, W, H); }
      }
    };
    trapRaf = requestAnimationFrame(f);
  }
  function fire() {
    if (!gunOn || !gunReady || shots >= SHOTS) return; shots++; gunReady = false; gHint.hidden = true;
    SND.gunshot();
    gunEl.classList.remove('kick'); void gunEl.offsetWidth; gunEl.classList.add('kick');
    gFlash.classList.remove('on'); void gFlash.offsetWidth; gFlash.classList.add('on');
    quakeView(); splat(gFx.getContext('2d'), gFx.width, gFx.height);
    gunCracks.push(...crackGen()); if (shots > 2) gunCracks.push(...crackGen()); crackDrawTo(gCr, gunCracks);   // 화면이 점점 깨진다
    noiseDur = RM ? 150 : 750; noiseUntil = performance.now() + noiseDur;
    [...gPips.children].forEach((p, i) => p.classList.toggle('spent', i < shots));
    if (shots < SHOTS) setTimeout(() => { gunReady = true; }, RM ? 80 : 420);
    else setTimeout(() => { gunOn = false; if (gunDone) gunDone(); }, RM ? 300 : 2000);
  }
  const gunKey = e => { if (gunOn && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); fire(); } };
  trap.addEventListener('pointerdown', e => { if (gunOn && !e.target.closest('#eReboot')) { e.preventDefault(); fire(); } });
  addEventListener('keydown', gunKey);
  function gunScene() {
    const r = view.getBoundingClientRect(); [gFx, gCr, gNz].forEach(c => { c.width = Math.round(r.width); c.height = Math.round(r.height); c.hidden = false; c.getContext('2d').clearRect(0, 0, c.width, c.height); });
    shots = 0; gunCracks = []; drips = []; noiseUntil = 0; [...gPips.children].forEach(p => p.classList.remove('spent'));
    gunEl.hidden = false; gPips.hidden = false; gXh.hidden = false; void gunEl.offsetWidth; gunEl.classList.add('up'); SND.gunCock(); gunLoop();
    return new Promise(res => { gunDone = res; trapT.push(setTimeout(() => { gunOn = true; gunReady = true; gHint.hidden = false; }, RM ? 100 : 1100)); });
  }
  function trapReset() {
    trapOn = false; gunOn = false; gunDone = null; trapT.forEach(clearTimeout); trapT = []; cancelAnimationFrame(trapRaf); trapRaf = 0; trap.hidden = true; trap.classList.remove('noir');
    [gFx, gCr, gNz, tBin, gunEl, gPips, gXh, gHint, gNoir, tReboot].forEach(x => { x.hidden = true; }); gunEl.classList.remove('up', 'kick'); gNoir.textContent = '';
  }
  function binaryLoop() {
    const r = view.getBoundingClientRect(), W = tBin.width = Math.round(r.width), H = tBin.height = Math.round(r.height), g = tBin.getContext('2d'), cs = W < 700 ? 15 : 20, cols = Math.ceil(W / cs), rows = Math.ceil(H / cs); let last = 0;
    g.font = `700 ${cs}px "Share Tech Mono","Courier New",monospace`; g.textBaseline = 'top';
    const f = ts => {
      trapRaf = requestAnimationFrame(f); if (ts - last < 70) return; last = ts;
      g.fillStyle = '#c40000'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const v = Math.random(); g.fillStyle = v < .08 ? '#ff9a8a' : v < .5 ? '#5a0000' : '#2a0000'; g.fillText(Math.random() < .5 ? '0' : '1', x * cs, y * cs); }
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
    };
    trapRaf = requestAnimationFrame(f);
  }
  async function startTrap() {
    if (!on || !locked || vaultSeen || trapOn || raging) return;
    trapOn = true; clearInterval(ambTimer); enterIn.blur(); enterF.hidden = true; vault.hidden = true; crackC.hidden = true; crtStop(); view.classList.remove('locked'); view.classList.add('trap');
    SND.blackout(); trap.hidden = false; gNoir.textContent = '';
    await twait(RM ? 300 : 2500);                                   // 완전한 어둠
    await gunScene();                                               // 클릭할 때마다 한 발, 6발
    cancelAnimationFrame(trapRaf); gunEl.hidden = true; gPips.hidden = true; gXh.hidden = true; gNz.hidden = true;
    trap.classList.add('noir'); gNoir.hidden = false;               // 느와르 문장: 기울어진 굵은 글씨가 한 자씩 찍힌다
    for (const ch of NOIR_TEXT) { gNoir.textContent += ch; if (!/\s/.test(ch)) SND.knock(); await twait(RM ? 15 : 150); }
    await twait(RM ? 300 : 3600);
    gNoir.hidden = true; gFx.hidden = true; gCr.hidden = true; trap.classList.remove('noir');   // 아무 효과 없이: 곧바로 아주 큰 '삐' + 레드스크린
    tBin.hidden = false; SND.loudBeep(RM ? .6 : 3.4); binaryLoop();
    await twait(RM ? 100 : 1500); tReboot.hidden = false; try { tReboot.focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
  }
  tReboot.addEventListener('click', () => { SND.click(); Scenes.rebootEye(); });


  /* 틀린 코드를 넣을 때마다: 화면 전체가 흔들리고 금이 늘어나며, 30초 제한시간이 줄어든다 */
  const crackC = $('#eCrack'); let cracks = [], lockStart = 0, lockLimit = 30000;
  function crackGen() {
    const r = view.getBoundingClientRect(), W = r.width, H = r.height, edge = Math.random() < .6, out = [];
    let x = edge ? (Math.random() < .5 ? 0 : W) : Math.random() * W, y = edge ? Math.random() * H : Math.random() * H, a = Math.atan2(H / 2 - y, W / 2 - x) + (Math.random() - .5) * 1.4;
    const walk = (x, y, a, n, w) => { const pts = [[x, y]]; for (let i = 0; i < n; i++) { a += (Math.random() - .5) * .9; const l = 30 + Math.random() * 90; x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y]); if (i > 1 && i < n - 1 && Math.random() < .3) out.push({ pts: walkPts(x, y, a + (Math.random() < .5 ? -1 : 1) * (.5 + Math.random() * .7), 3 + (Math.random() * 4 | 0)), w: w * .6 }); } return pts; };
    const walkPts = (x, y, a, n) => { const pts = [[x, y]]; for (let i = 0; i < n; i++) { a += (Math.random() - .5) * 1; const l = 14 + Math.random() * 40; x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y]); } return pts; };
    out.push({ pts: walk(x, y, a, 9 + (Math.random() * 7 | 0), 1), w: 1 }); return out;
  }
  function crackDrawTo(cv, list) {
    const r = view.getBoundingClientRect(), k = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k);
    const g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
    list.forEach(cr => { [[ 'rgba(0,0,0,.8)', 5 ], [ 'rgba(255,255,255,.95)', 2 ], [ 'rgba(255,255,255,.35)', 4.5 ]].forEach(([col, lw], idx) => { g.strokeStyle = col; g.lineWidth = lw * cr.w * (idx === 2 ? 1.4 : 1); g.shadowColor = idx === 1 ? 'rgba(255,255,255,.8)' : 'transparent'; g.shadowBlur = idx === 1 ? 6 : 0; g.beginPath(); cr.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }); });
    g.shadowBlur = 0;
  }
  function crackDraw() { crackDrawTo(crackC, cracks); }
  function quakeView() {
    if (RM || !view.animate) return; const f = []; for (let i = 0; i < 12; i++) { const a = 1 - i / 12; f.push({ transform: `translate(${((Math.random() - .5) * 46 * a).toFixed(1)}px,${((Math.random() - .5) * 30 * a).toFixed(1)}px) rotate(${((Math.random() - .5) * 2.2 * a).toFixed(2)}deg)` }); } f.push({ transform: 'none' });
    view.animate(f, { duration: 560, easing: 'linear' });
  }
  function armTrap(ms) { clearTimeout(lockTimer); lockTimer = setTimeout(startTrap, Math.max(0, ms)); }
  function wrongCode() {
    SND.tone(160, .16, 'square', .05); SND.tone(110, .22, 'square', .05, .13); SND.glass && SND.glass();
    quakeView(); cracks.push(...crackGen()); crackC.hidden = false; crackDraw();
    if (!vaultSeen && locked) { const el = performance.now() - lockStart; lockLimit -= 6000; if (lockLimit - el < 1500) lockLimit = el + 1500; armTrap(lockLimit - el); }   // 틀릴 때마다 제한시간이 6초씩 줄어든다
  }

  /* 분노 이후: 브라운관 눈보라가 계속 켜져 있고 'Enter-code' 가 화면 가득, 입력창은 하나뿐 */
  const enterF = $('#eEnter'), enterIn = $('#eEnterIn'), vault = $('#eVault');
  function enterLocked() {
    locked = true; view.classList.add('locked'); say.hidden = true; vault.hidden = true; rageTx.hidden = true;
    enterF.hidden = false; enterIn.value = ''; enterIn.disabled = false; try { enterIn.focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
    vaultSeen = false; cracks = []; crackC.hidden = true; lockStart = performance.now(); lockLimit = RM ? 3000 : 30000; armTrap(lockLimit);
  }
  function leaveLocked() { locked = false; cracks = []; crackC.hidden = true; clearInterval(ambTimer); clearTimeout(lockTimer); trapReset(); view.classList.remove('trap'); crtStop(); enterF.hidden = true; vault.hidden = true; view.classList.remove('locked'); }
  enterIn.addEventListener('input', () => SND.type());
  enterF.addEventListener('submit', e => {
    e.preventDefault(); const v = enterIn.value.trim().toLowerCase().replace(/[\s_]/g, '');
    if (v === 'enter-code' || v === 'entercode') { enterIn.value = ''; SND.tone(1318, .12, 'sine', .06); SND.tone(1760, .2, 'sine', .05, .08); SND._n(0, .25, 4000, 300, .14, .8); vault.hidden = false; vaultSeen = true; clearTimeout(lockTimer); return; }
    if (v === 're-code' || v === 'recode') { enterIn.blur(); leaveLocked(); Scenes.leaveEye(); return; }
    enterIn.value = ''; wrongCode();
  });
  $('#eVaultX').addEventListener('click', () => { SND.click(); vault.hidden = true; try { enterIn.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } });
  form.addEventListener('submit', e => {
    e.preventDefault(); if (raging) return; const v = inp.value.trim().toLowerCase().replace(/[\s_]/g, '');
    if (v === 'no-code' || v === 'nocode') { rage(); return; }
    if (v === 're-code' || v === 'recode') { err.textContent = ''; SND.tone(1318, .12, 'sine', .06); SND.tone(1760, .2, 'sine', .05, .08); inp.blur(); Scenes.leaveEye(); }
    else { err.textContent = '코드가 일치하지 않습니다.'; form.classList.remove('bad'); void form.offsetWidth; form.classList.add('bad'); SND.tone(160, .16, 'square', .05); SND.tone(110, .22, 'square', .05, .13); inp.select(); }
  });
  addEventListener('resize', () => { if (on) resize(); if (cracks.length && !crackC.hidden) crackDraw(); });
  addEventListener('orientationchange', () => { if (on) setTimeout(() => { resize(); crtResize(); }, 250); });
  return {
    enter() {
      on = true; li = 0; px = py = -1; open = .02; target = 1; blinkT = 1.5; eyes.forEach(e => { e.open = .02; e.target = 1; e.blink = 1.5 + Math.random() * 4; }); inp.value = ''; err.textContent = ''; say.hidden = true; eye.classList.remove('show'); fig.classList.remove('show'); resize();
      SND.musicTo(0, 1.2); SND.windStart();
      t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      tm.push(setTimeout(() => eye.classList.add('show'), 500 * (RM ? .1 : 1)), setTimeout(() => fig.classList.add('show'), 2200 * (RM ? .1 : 1)), setTimeout(nextLine, 4200 * (RM ? .1 : 1)));
    },
    leave() { leaveLocked(); raging = false; rageT.forEach(id => { clearTimeout(id); clearInterval(id); }); rageT.length = 0; if (rageStop) { rageStop(); rageStop = null; } cancelAnimationFrame(rageRaf); crtStop(); SND.unblackout(); rageC.hidden = true; rageTx.hidden = true; view.classList.remove('rage', 'crt-on'); inp.disabled = false; on = false; cancelAnimationFrame(raf); raf = 0; tm.forEach(clearTimeout); tm = []; Typer.stop(); SND.windStop(); SND.musicTo(.95, 2.5); },
  };
})();
