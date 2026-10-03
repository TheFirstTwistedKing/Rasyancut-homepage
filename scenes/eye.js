/* ==========================================================================
   신호 IV — 유리가 깨지고, 눈과 '발신자 표시 제한'의 주인공과 마주함. 배경음악은 멈추고 바람 소리만. 나가려면 복구 코드(Re-code)
   ========================================================================== */
const Eye = (() => {
  const view = $('#scEye'), cv = $('#eCv'), g = cv.getContext('2d'), eye = $('#eEye'), fig = $('#eFig'), say = $('#eSay'), txt = $('#eTxt'), form = $('#eCode'), inp = $('#eIn'), err = $('#eErr');
  const LINES = ['…드디어 이곳까지 오셨군요, 설립자.', '발신자는 밝히지 않습니다. 이름도 얼굴도, 이곳에서는 필요하지 않으니까요.', '여기는 설립자께서 물으신 적 없는 것들이 모이는 곳입니다. 오래 머무를 곳은 못 됩니다.', '돌아가시려면 오른쪽 아래에 복구 코드를 적으십시오.\n코드는 ‘Re-code’입니다.'];
  let raging = false, locked = false, rageText = 'CALLER ID RESTRICTED  ', ambTimer = 0, rageRaf = 0, crtRaf = 0, rageStop = null;
  let raf = 0, on = false, t0 = 0, li = 0, open = 0, target = 1, blinkT = 0, mx = .5, my = .3, W = 0, H = 0, dpr = 1, tm = [];
  const parts = Array.from({ length: 90 }, (_, i) => ({ x: Math.random(), y: Math.random(), v: .04 + Math.random() * .16, l: 30 + Math.random() * 120, a: .05 + Math.random() * .22, m: i % 4 === 0 }));
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  function eyePath(o) { const k = Math.max(.02, o), t = -62 * k, b = 62 * k; return `M-150 0C-90 ${t} 90 ${t} 150 0C90 ${b} -90 ${b} -150 0Z`; }
  function frame(ts) {
    raf = requestAnimationFrame(frame); const t = (ts - t0) / 1000; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    // 바람: 가로로 흐르는 가는 줄과 먼지
    parts.forEach(p => {
      p.x += p.v * .016 * (1 + Math.sin(t * .5 + p.y * 6) * .4); if (p.x > 1.2) { p.x = -.2; p.y = Math.random(); }
      const x = p.x * W, y = p.y * H + Math.sin(t * .8 + p.x * 8) * 6;
      if (p.m) { g.fillStyle = `rgba(233,216,166,${p.a * 1.6})`; g.fillRect(x, y, 1.5, 1.5); } else { const gr = g.createLinearGradient(x - p.l, y, x, y); gr.addColorStop(0, 'rgba(233,216,166,0)'); gr.addColorStop(1, `rgba(233,216,166,${p.a})`); g.strokeStyle = gr; g.lineWidth = 1; g.beginPath(); g.moveTo(x - p.l, y); g.lineTo(x, y); g.stroke(); }
    });
    // 눈: 천천히 뜨고, 가끔 깜빡이고, 시선이 포인터를 따라감
    if (t > .6) { blinkT -= .016; if (blinkT < 0) { target = target > .5 ? .04 : 1; blinkT = target < .5 ? .12 : 2.6 + Math.random() * 3.4; } }
    open += (target - open) * (target < .5 ? .5 : .08);
    const d = eyePath(open); $('#eAlm').setAttribute('d', d); $('#eClipP').setAttribute('d', d);
    const ix = (mx - .5) * 60, iy = (my - .25) * 40; $('#eIris').setAttribute('transform', `translate(${Math.max(-44, Math.min(44, ix)).toFixed(1)} ${Math.max(-12, Math.min(14, iy)).toFixed(1)})`);
    $('#ePup').setAttribute('rx', (8 + Math.sin(t * 1.3) * 1.2).toFixed(1));
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
  function drawCrt(ts) {
    crtRaf = requestAnimationFrame(drawCrt); const g = crtC.getContext('2d'), w = crtC.width, h = crtC.height, im = g.createImageData(w, h), d = new Uint32Array(im.data.buffer), t = ts / 1000;
    const roll = ((t * .35) % 1.3) * h - h * .15;
    for (let y = 0; y < h; y++) { const band = Math.abs(y - roll) < h * .06 ? 1.5 : 1, tear = (y * 7 + Math.floor(t * 30)) % 53 === 0 ? 40 : 0; for (let x = 0; x < w; x++) { let v = Math.random() * 255 * band; if (tear && (x + tear) % 11 < 6) v = 255 - v * .3; v = Math.min(255, v); d[y * w + x] = 0xff000000 | (v << 16) | (v << 8) | v; } }
    g.putImageData(im, 0, 0);
  }
  async function rage() {
    if (raging) return; raging = true; inp.disabled = true; inp.blur(); err.textContent = ''; Typer.stop(); say.hidden = true; tm.forEach(clearTimeout); tm = [];
    const dpr = 1, r = view.getBoundingClientRect(); rageC.width = Math.round(r.width * dpr); rageC.height = Math.round(r.height * dpr);
    view.classList.add('rage'); rageC.hidden = false; rageT0 = performance.now(); cancelAnimationFrame(rageRaf); rageRaf = requestAnimationFrame(drawRage);
    rageStop = SND.rageStart(10); [0.2, 2.3, 4.5, 6.6, 8.4].forEach((a, i) => later(() => showRageLine(i), a * 1000 * (RM ? .1 : 1)));
    await new Promise(res => later(res, RM ? 1200 : 10000));
    // 10초 뒤: '삐' + 브라운관
    if (rageStop) rageStop(); rageStop = null; cancelAnimationFrame(rageRaf); rageC.hidden = true; rageTx.hidden = true; view.classList.remove('rage');
    crtC.width = 320; crtC.height = 180; crtC.hidden = false; crtC.style.opacity = '1'; crtC.style.transform = ''; view.classList.add('crt-on'); SND.beep(1.7); SND.crt(4.2); cancelAnimationFrame(crtRaf); crtRaf = requestAnimationFrame(drawCrt);
    await new Promise(res => later(res, RM ? 600 : 4200));
    SND.crtOff(); cancelAnimationFrame(crtRaf);
    if (crtC.animate) { const a = crtC.animate([{ transform: 'scale(1,1)', filter: 'brightness(1)' }, { transform: 'scale(1,.012)', filter: 'brightness(3)', offset: .55 }, { transform: 'scale(.003,.012)', filter: 'brightness(4)', opacity: 1, offset: .85 }, { transform: 'scale(0,0)', opacity: 0 }], { duration: RM ? 50 : 620, easing: 'ease-in', fill: 'forwards' }); await a.finished.catch(() => {}); } 
    crtC.hidden = true; view.classList.remove('crt-on'); crtC.getAnimations && crtC.getAnimations().forEach(a => a.cancel());
    raging = false; enterLocked();
  }

  /* 분노 이후: 글리치가 계속 뜨는 화면에 'Enter-code' 가 가득하고, 입력창은 하나뿐 */
  const enterF = $('#eEnter'), enterIn = $('#eEnterIn'), vault = $('#eVault');
  function enterLocked() {
    locked = true; rageText = 'Enter-code  '; view.classList.add('locked'); say.hidden = true; vault.hidden = true; rageTx.hidden = true;
    const r = view.getBoundingClientRect(); rageC.width = Math.round(r.width); rageC.height = Math.round(r.height); rageC.hidden = false; rageT0 = performance.now(); cancelAnimationFrame(rageRaf); rageRaf = requestAnimationFrame(drawRage);
    enterF.hidden = false; enterIn.value = ''; enterIn.disabled = false; try { enterIn.focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
    clearInterval(ambTimer); ambTimer = setInterval(() => { SND._n(0, .02 + Math.random() * .04, 2600 + Math.random() * 4000, 1600, .022 + Math.random() * .02, .9, 'highpass', Math.random() * 2 - 1); if (Math.random() < .25) SND._t(1200 + Math.random() * 2400, .03, 'square', .01, 0, null, 0, Math.random() * 2 - 1); }, 340);
  }
  function leaveLocked() { locked = false; rageText = 'CALLER ID RESTRICTED  '; clearInterval(ambTimer); enterF.hidden = true; vault.hidden = true; view.classList.remove('locked'); }
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
  return {
    enter() {
      on = true; li = 0; open = .02; target = 1; blinkT = 1.5; inp.value = ''; err.textContent = ''; say.hidden = true; eye.classList.remove('show'); fig.classList.remove('show'); resize();
      SND.musicTo(0, 1.2); SND.windStart();
      t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      tm.push(setTimeout(() => eye.classList.add('show'), 500 * (RM ? .1 : 1)), setTimeout(() => fig.classList.add('show'), 2200 * (RM ? .1 : 1)), setTimeout(nextLine, 4200 * (RM ? .1 : 1)));
    },
    leave() { leaveLocked(); raging = false; rageT.forEach(id => { clearTimeout(id); clearInterval(id); }); rageT.length = 0; if (rageStop) { rageStop(); rageStop = null; } cancelAnimationFrame(rageRaf); cancelAnimationFrame(crtRaf); rageC.hidden = true; crtC.hidden = true; rageTx.hidden = true; view.classList.remove('rage', 'crt-on'); inp.disabled = false; on = false; cancelAnimationFrame(raf); raf = 0; tm.forEach(clearTimeout); tm = []; Typer.stop(); SND.windStop(); SND.musicTo(.95, 2.5); },
  };
})();
