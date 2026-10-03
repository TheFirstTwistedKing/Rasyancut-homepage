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
  function layoutEyes() {
    const r = view.getBoundingClientRect(), W = r.width, H = r.height, rows = W < 700 ? 2 : 1, per = NEYE / rows, pos = [];
    let minD = 1e9;
    for (let row = 0; row < rows; row++) {
      const rx = rows > 1 ? W * .465 - row * W * .075 : Math.min(W * .44, H * .9), ry = Math.min(H * (rows > 1 ? .09 : .27), 260), apex = (rows > 1 ? 40 : 56) + row * (W * .095), tm = (rows > 1 ? 68 : 62) * Math.PI / 180, p = [];
      for (let i = 0; i < per; i++) { const th = -tm + (2 * tm) * i / (per - 1); p.push({ x: W / 2 + Math.sin(th) * rx, y: apex + (1 - Math.cos(th)) * ry, th }); }
      for (let i = 1; i < per; i++) minD = Math.min(minD, Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y));
      pos.push(...p);
    }
    const w = Math.min(minD * 1.12, 120), h = w * 208 / 220;
    pos.forEach((p, i) => { const s = eyes[i].s.style; s.width = w + 'px'; s.height = h + 'px'; s.left = (p.x - w / 2) + 'px'; s.top = (p.y - h / 2) + 'px'; s.transform = `rotate(${(p.th * 180 / Math.PI).toFixed(1)}deg)`; });
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
      const ix = (mx - (i % 10 + .5) / 10) * 60, iy = (my - .1) * 30; e.ir.setAttribute('transform', `translate(${Math.max(-26, Math.min(26, ix)).toFixed(1)} ${Math.max(-8, Math.min(10, iy)).toFixed(1)})`);
    });
  }
  function nextLine() {
    if (li >= LINES.length) { say.hidden = true; inp.focus({ preventScroll: true }); return; }
    say.hidden = false; Typer.say(txt, LINES[li], () => { });
  }
  say.addEventListener('click', () => { if (!Typer.done) { Typer.finish(); return; } li++; SND.tick(); nextLine(); });
  view.addEventListener('pointermove', e => { const r = view.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; });

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

  /* 분노 이후: 브라운관 눈보라가 계속 켜져 있고 'Enter-code' 가 화면 가득, 입력창은 하나뿐 */
  const enterF = $('#eEnter'), enterIn = $('#eEnterIn'), vault = $('#eVault');
  function enterLocked() {
    locked = true; view.classList.add('locked'); say.hidden = true; vault.hidden = true; rageTx.hidden = true;
    enterF.hidden = false; enterIn.value = ''; enterIn.disabled = false; try { enterIn.focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
  }
  function leaveLocked() { locked = false; clearInterval(ambTimer); crtStop(); enterF.hidden = true; vault.hidden = true; view.classList.remove('locked'); }
  enterIn.addEventListener('input', () => SND.type());
  enterF.addEventListener('submit', e => {
    e.preventDefault(); const v = enterIn.value.trim().toLowerCase().replace(/[\s_]/g, '');
    if (v === 'enter-code' || v === 'entercode') { enterIn.value = ''; SND.tone(1318, .12, 'sine', .06); SND.tone(1760, .2, 'sine', .05, .08); SND._n(0, .25, 4000, 300, .14, .8); vault.hidden = false; return; }
    if (v === 're-code' || v === 'recode') { enterIn.blur(); leaveLocked(); Scenes.leaveEye(); return; }
    enterIn.value = ''; enterF.classList.remove('bad'); void enterF.offsetWidth; enterF.classList.add('bad'); SND.tone(160, .16, 'square', .05); SND.tone(110, .22, 'square', .05, .13);
  });
  $('#eVaultX').addEventListener('click', () => { SND.click(); vault.hidden = true; try { enterIn.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } });
  form.addEventListener('submit', e => {
    e.preventDefault(); if (raging) return; const v = inp.value.trim().toLowerCase().replace(/[\s_]/g, '');
    if (v === 'no-code' || v === 'nocode') { rage(); return; }
    if (v === 're-code' || v === 'recode') { err.textContent = ''; SND.tone(1318, .12, 'sine', .06); SND.tone(1760, .2, 'sine', .05, .08); inp.blur(); Scenes.leaveEye(); }
    else { err.textContent = '코드가 일치하지 않습니다.'; form.classList.remove('bad'); void form.offsetWidth; form.classList.add('bad'); SND.tone(160, .16, 'square', .05); SND.tone(110, .22, 'square', .05, .13); inp.select(); }
  });
  addEventListener('resize', () => { if (on) resize(); });
  addEventListener('orientationchange', () => { if (on) setTimeout(() => { resize(); crtResize(); }, 250); });
  return {
    enter() {
      on = true; li = 0; open = .02; target = 1; blinkT = 1.5; eyes.forEach(e => { e.open = .02; e.target = 1; e.blink = 1.5 + Math.random() * 4; }); inp.value = ''; err.textContent = ''; say.hidden = true; eye.classList.remove('show'); fig.classList.remove('show'); resize();
      SND.musicTo(0, 1.2); SND.windStart();
      t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      tm.push(setTimeout(() => eye.classList.add('show'), 500 * (RM ? .1 : 1)), setTimeout(() => fig.classList.add('show'), 2200 * (RM ? .1 : 1)), setTimeout(nextLine, 4200 * (RM ? .1 : 1)));
    },
    leave() { leaveLocked(); raging = false; rageT.forEach(id => { clearTimeout(id); clearInterval(id); }); rageT.length = 0; if (rageStop) { rageStop(); rageStop = null; } cancelAnimationFrame(rageRaf); crtStop(); rageC.hidden = true; rageTx.hidden = true; view.classList.remove('rage', 'crt-on'); inp.disabled = false; on = false; cancelAnimationFrame(raf); raf = 0; tm.forEach(clearTimeout); tm = []; Typer.stop(); SND.windStop(); SND.musicTo(.95, 2.5); },
  };
})();
