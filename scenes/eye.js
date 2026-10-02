/* ==========================================================================
   신호 IV — 유리가 깨지고, 눈과 '발신자 표시 제한'의 주인공과 마주함. 배경음악은 멈추고 바람 소리만. 나가려면 복구 코드(Re-code)
   ========================================================================== */
const Eye = (() => {
  const view = $('#scEye'), cv = $('#eCv'), g = cv.getContext('2d'), eye = $('#eEye'), fig = $('#eFig'), say = $('#eSay'), txt = $('#eTxt'), form = $('#eCode'), inp = $('#eIn'), err = $('#eErr');
  const LINES = ['…드디어 이곳까지 오셨군요, 설립자.', '발신자는 밝히지 않습니다. 이름도 얼굴도, 이곳에서는 필요하지 않으니까요.', '여기는 설립자께서 물으신 적 없는 것들이 모이는 곳입니다. 오래 머무를 곳은 못 됩니다.', '돌아가시려면 오른쪽 아래에 복구 코드를 적으십시오.\n코드는 ‘Re-code’입니다.'];
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
  form.addEventListener('submit', e => {
    e.preventDefault(); const v = inp.value.trim().toLowerCase().replace(/[\s_]/g, '');
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
    leave() { on = false; cancelAnimationFrame(raf); raf = 0; tm.forEach(clearTimeout); tm = []; Typer.stop(); SND.windStop(); SND.musicTo(.95, 2.5); },
  };
})();
