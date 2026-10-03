/* ==========================================================================
   관측소 신호기 연출 (scenes/): 신호 I 회장실 · 신호 II R.S.S. · 신호 III 바탕화면 · 신호 IV 마주함
   ========================================================================== */
/* ---------- 소리 추가: 일렁임 · 부팅음 · 지직거림 · 유리 · 바람 ---------- */
Object.assign(SND, {
  _echoBus() {
    if (this._eb || !this.ctx) return this._eb;
    const c = this.ctx, inp = c.createGain(), dl = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter();
    dl.delayTime.value = .19; fb.gain.value = .32; lp.type = 'lowpass'; lp.frequency.value = 3200;
    inp.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(this.sfx);
    return (this._eb = inp);
  },
  /* 소리 하나: 시작 시각(at) · 길이(d) · 파형 · 세기(g) · 도착 음높이(to) · 에코 양(send) · 좌우(pan) */
  _t(f, d, type, g, at = 0, to = null, send = 0, pan = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), v = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + Math.min(.008, d / 3)); v.gain.exponentialRampToValueAtTime(.0001, t + d);
    let out = v; if (c.createStereoPanner && pan) { const p = c.createStereoPanner(); p.pan.value = pan; v.connect(p); out = p; }
    o.connect(v); out.connect(this.sfx); if (send) { const s = c.createGain(); s.gain.value = send; out.connect(s); s.connect(this._echoBus()); }
    o.start(t); o.stop(t + d + .05);
  },
  _n(at, d, f0, f1, g, q = 1.4, type = 'bandpass') {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), v = c.createGain();
    s.buffer = this.nbuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d);
    v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + d * .3); v.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(v); v.connect(this.sfx); s.start(t); s.stop(t + d + .05);
  },
  warp(d = 1.9) {      // 화면이 일렁일 때: 낮은 소리가 떨리며 올라갔다 내려옴
    if (!this.ctx || !this.on) return;
    [[98, .07], [147.2, .05], [196.9, .04], [293.9, .02]].forEach(([f, g], i) => {
      const c = this.ctx, t = c.currentTime, o = c.createOscillator(), v = c.createGain(), lp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = i % 2 ? 'triangle' : 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 3.4, t + d * .5); o.frequency.exponentialRampToValueAtTime(f * .9, t + d);
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(3600, t + d * .5); lp.frequency.exponentialRampToValueAtTime(400, t + d);
      lfo.frequency.value = 5 + i * 1.7; lg.gain.value = f * .05; lfo.connect(lg); lg.connect(o.frequency);
      v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + d * .45); v.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(lp); lp.connect(v); v.connect(this.sfx); const s = c.createGain(); s.gain.value = .3; v.connect(s); s.connect(this._echoBus());
      o.start(t); lfo.start(t); o.stop(t + d + .1); lfo.stop(t + d + .1);
    });
    this._n(0, d * .95, 180, 5200, .12, .8); this._n(d * .5, d * .5, 5200, 300, .08, .8);
  },
  glitch(d = 1) {      // 지지직: 짧은 잡음 조각과 높은 지직음
    if (!this.ctx || !this.on) return;
    for (let i = 0, t = 0; t < d; i++) { const l = .02 + Math.random() * .07; this._n(t, l, 600 + Math.random() * 4200, 1200 + Math.random() * 6000, .09 + Math.random() * .08, .6); if (Math.random() < .5) this._t(1800 + Math.random() * 3000, l, 'square', .02, t, null, .2, Math.random() * 2 - 1); t += l + Math.random() * .09; }
    this._t(55, d * .8, 'sawtooth', .05, 0, 40);
  },
  boot() {             // R.S.S. 부팅음: 서보 소리 → 릴레이 → 빠른 삐리리리 → 칩 → 확인음
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t0 = c.currentTime;
    { const o = c.createOscillator(), v = c.createGain(), lp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(52, t0); o.frequency.exponentialRampToValueAtTime(190, t0 + 1.5); lp.type = 'lowpass'; lp.frequency.value = 520;
      v.gain.setValueAtTime(.0001, t0); v.gain.exponentialRampToValueAtTime(.07, t0 + .3); v.gain.setValueAtTime(.07, t0 + 1.2); v.gain.exponentialRampToValueAtTime(.0001, t0 + 1.7); o.connect(lp); lp.connect(v); v.connect(this.sfx); o.start(t0); o.stop(t0 + 1.8); }
    [.1, .34, .62, .95, 1.4].forEach((a, i) => { this._n(a, .018, 2600 + i * 400, 3400, .12, 3); this._t(140 + i * 20, .05, 'square', .04, a); });
    for (let i = 0; i < 28; i++) {         // 삐리리리
      const st = (i * 5) % 12, f = 740 * Math.pow(2, st / 12 + Math.floor(i / 12) * .5) * (1 + (i % 2 ? .0 : .006)), at = .28 + i * .043;
      this._t(f, .036, 'square', .028, at, null, .18, Math.sin(i) * .6); this._t(f * 2, .03, 'triangle', .012, at + .004, null, .12, Math.sin(i) * .6);
    }
    this._t(420, .34, 'sine', .05, 1.5, 2600, .25); this._t(2600, .12, 'square', .02, 1.84, 1300);
    this._t(70, .75, 'sine', .22, 1.9, 34); this._t(1174.7, .7, 'triangle', .05, 1.92, null, .3, -.3); this._t(1760, .8, 'sine', .04, 1.97, null, .3, .3); this._t(2349.3, .9, 'sine', .018, 2.02, null, .35);
  },
  glass() {            // 유리 깨짐: 첫 타격 → 균열 → 쏟아지는 파편
    if (!this.ctx || !this.on) return;
    this._n(0, .09, 3000, 9000, .3, .5, 'highpass'); this._t(95, .5, 'sine', .3, 0, 38); this._t(2400, .25, 'triangle', .05, 0, 900, .3);
    for (let i = 0; i < 26; i++) { const at = .08 + i * .018 + Math.random() * .05; this._n(at, .03 + Math.random() * .04, 3500 + Math.random() * 5000, 6000 + Math.random() * 4000, .06 + Math.random() * .07, .8, 'highpass'); this._t(2800 + Math.random() * 3800, .05, 'triangle', .02 + Math.random() * .02, at + .03, null, .3, Math.random() * 2 - 1); }
    for (let i = 0; i < 40; i++) { const at = .5 + Math.random() * 1.1; this._t(2200 + Math.random() * 4400, .06 + Math.random() * .1, 'sine', .012 + Math.random() * .02, at, null, .35, Math.random() * 2 - 1); }
  },
  step() { this._n(0, .06, 220 + Math.random() * 60, 120, .035, .9); },
  tick() { this._t(1100, .04, 'square', .02); },
  /* 바람 소리(마주함 화면): 잡음을 거르고 돌풍처럼 크기가 흔들린다 */
  windStart() {
    if (!this.ctx || this._wind) return;
    const c = this.ctx, t = c.currentTime, out = c.createGain(); out.gain.value = 0; out.connect(this.sfx);
    const mk = () => { const s = c.createBufferSource(); s.buffer = this.nbuf; s.loop = true; s.start(t + Math.random()); return s; };
    const s1 = mk(), bp = c.createBiquadFilter(), g1 = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .7; g1.gain.value = .2; s1.connect(bp); bp.connect(g1); g1.connect(out);
    const l1 = c.createOscillator(), lg = c.createGain(); l1.frequency.value = .09; lg.gain.value = 240; l1.connect(lg); lg.connect(bp.frequency); l1.start(t);
    const s2 = mk(), lp = c.createBiquadFilter(), g2 = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 170; g2.gain.value = .9; s2.connect(lp); lp.connect(g2); g2.connect(out);
    const w = c.createOscillator(), wg = c.createGain(), wl = c.createOscillator(), wlg = c.createGain(); w.type = 'sine'; w.frequency.value = 760; wg.gain.value = .006; wl.frequency.value = .23; wlg.gain.value = 90; wl.connect(wlg); wlg.connect(w.frequency); w.connect(wg); wg.connect(out); w.start(t); wl.start(t);
    out.gain.setTargetAtTime(.9, t, 1.4);
    const gust = () => { const n = c.currentTime; g1.gain.setTargetAtTime(.06 + Math.random() * .34, n, 1.3 + Math.random() * 1.4); wg.gain.setTargetAtTime(.002 + Math.random() * .014, n, 1.6); };
    gust(); const timer = setInterval(gust, 2600);
    this._wind = { out, nodes: [s1, s2, l1, w, wl], timer };
  },
  windStop() {
    const w = this._wind; if (!w) return; this._wind = null; clearInterval(w.timer);
    const t = this.ctx.currentTime; w.out.gain.cancelScheduledValues(t); w.out.gain.setTargetAtTime(0, t, .5);
    setTimeout(() => { w.nodes.forEach(n => { try { n.stop(); } catch (e) { /* 이미 멈춤 */ } }); try { w.out.disconnect(); } catch (e) { /* 무시 */ } }, 2400);
  },
  musicTo(v, sec = 1) { if (!this.ctx || !this.mus) return; const t = this.ctx.currentTime; this.mus.gain.cancelScheduledValues(t); this.mus.gain.setValueAtTime(this.mus.gain.value, t); this.mus.gain.linearRampToValueAtTime(v, t + sec); },
});

/* ---------- 연출 관리: 화면 일렁임 · 검은 화면 · 지지직 · 유리 깨짐 ---------- */
const Scenes = (() => {
  const root = $('#sc'), app = $('#app'), black = $('#scBlack'), welcome = $('#scWelcome'), shC = $('#scShatter'), glC = $('#scGlitch');
  const warpT = $('#warpT'), warpD = $('#warpD');
  const V = { game: $('#scGame'), rss: $('#scRss'), desk: $('#scDesk'), eye: $('#scEye') };
  let active = null, busy = false;
  const K = () => (RM ? .12 : 1);
  const wait = ms => sleep(ms * K());
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function show(name) {
    root.hidden = false; Object.keys(V).forEach(k => V[k].classList.toggle('on', k === name));
    active = name; Obs.hold(true);
  }
  function hide() { Object.keys(V).forEach(k => V[k].classList.remove('on')); root.hidden = true; active = null; Obs.hold(false); }
  /* 화면이 일렁이며 왜곡됐다가 풀림: 가운데(peak)에서 mid() 를 불러 화면을 바꿔 치움 */
  function warp(ms, mid) {
    ms *= K();
    return new Promise(res => {
      const t0 = performance.now(); let did = false; app.classList.add('warping'); app.style.filter = 'url(#warpF)';
      const step = now => {
        const p = clamp((now - t0) / ms, 0, 1), a = Math.sin(Math.PI * Math.pow(p, .92)), tt = (now - t0) / 1000;
        warpD.setAttribute('scale', (a * 120).toFixed(1));
        warpT.setAttribute('baseFrequency', (0.004 + a * .012 + Math.sin(tt * 3) * .002).toFixed(4) + ' ' + (0.01 + a * .03 + Math.cos(tt * 2.3) * .003).toFixed(4));
        warpT.setAttribute('seed', String(3 + Math.floor(tt * 6) % 8));
        app.style.transform = `scale(${(1 + a * .035).toFixed(4)}) rotate(${(Math.sin(tt * 7) * a * .9).toFixed(3)}deg)`;
        app.style.filter = `url(#warpF) saturate(${(1 + a * .8).toFixed(2)}) hue-rotate(${(a * 28).toFixed(0)}deg) brightness(${(1 + a * .25).toFixed(2)})`;
        if (!did && p >= .5) { did = true; mid && mid(); }
        if (p < 1) requestAnimationFrame(step);
        else { app.style.filter = ''; app.style.transform = ''; app.classList.remove('warping'); warpD.setAttribute('scale', '0'); res(); }
      };
      requestAnimationFrame(step);
    });
  }
  async function fade(to, ms) { black.style.transition = `opacity ${Math.round(ms * K())}ms ease`; void black.offsetWidth; black.style.opacity = String(to); await sleep(ms * K()); }
  /* 지지직: 가로로 찢어진 잡음 + 색 번짐 + 화면 흔들림 */
  function glitch(ms, mid) {
    ms *= K();
    return new Promise(res => {
      const g = glC.getContext('2d'), W = glC.width = Math.ceil(app.clientWidth / 3), H = glC.height = Math.ceil(app.clientHeight / 3); glC.hidden = false;
      const t0 = performance.now(); let did = false;
      const step = now => {
        const p = clamp((now - t0) / ms, 0, 1); g.clearRect(0, 0, W, H);
        const inten = p < .5 ? p * 2 : (1 - p) * 2;
        for (let i = 0, n = 6 + inten * 30; i < n; i++) {
          const y = Math.random() * H, h = 1 + Math.random() * (4 + inten * 18), x = Math.random() * W * .4, w = W * (.2 + Math.random() * .8);
          g.fillStyle = `rgba(${Math.random() < .3 ? '255,60,60' : Math.random() < .5 ? '60,255,240' : '235,235,235'},${(.1 + Math.random() * .45 * inten).toFixed(2)})`; g.fillRect(x, y, w, h);
        }
        for (let i = 0, n = 70 + inten * 340; i < n; i++) { const v = 150 + (Math.random() * 105 | 0); g.fillStyle = `rgba(${v},${v},${v},${(Math.random() * .6 * inten).toFixed(2)})`; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1); }
        if (Math.random() < .25 + inten * .4) { g.fillStyle = 'rgba(0,0,0,.85)'; g.fillRect(0, 0, W, H); }
        app.style.transform = Math.random() < .5 * inten + .1 ? `translate(${((Math.random() - .5) * 26 * inten).toFixed(1)}px,${((Math.random() - .5) * 6 * inten).toFixed(1)}px) skewX(${((Math.random() - .5) * 3 * inten).toFixed(2)}deg)` : '';
        app.style.filter = Math.random() < inten * .6 ? `hue-rotate(${(Math.random() * 90 - 45) | 0}deg) contrast(${(1 + inten * .6).toFixed(2)})` : '';
        if (!did && p >= .5) { did = true; mid && mid(); }
        if (p < 1) requestAnimationFrame(step); else { glC.hidden = true; app.style.transform = ''; app.style.filter = ''; res(); }
      };
      requestAnimationFrame(step);
    });
  }
  /* 유리가 깨지며 쏟아짐: (ox,oy) 에서 금이 퍼지고, 조각이 떨어지며 아래의 화면이 드러남 */
  function shatter(ox, oy, mid) {
    return new Promise(res => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = app.clientWidth, H = app.clientHeight;
      shC.hidden = false; shC.width = W * dpr; shC.height = H * dpr; const g = shC.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const maxR = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) + 40, NA = 15, NR = 7;
      const ang = Array.from({ length: NA }, (_, i) => i / NA * Math.PI * 2 + (Math.random() - .5) * .3).sort((a, b) => a - b);
      const rad = [0]; for (let j = 1; j <= NR; j++) rad.push(maxR * Math.pow(j / NR, 1.55) * (.92 + Math.random() * .16));
      const jit = Array.from({ length: NR + 1 }, () => Array.from({ length: NA }, () => (Math.random() - .5) * .16));
      const P = (j, i) => { const a = ang[i % NA] + (j ? jit[j][i % NA] : 0), r = rad[j]; return [ox + Math.cos(a) * r, oy + Math.sin(a) * r]; };
      const shards = []; for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) {
        const pts = j === 0 ? [P(0, i), P(1, i), P(1, i + 1)] : [P(j, i), P(j + 1, i), P(j + 1, i + 1), P(j, i + 1)];
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length, d = Math.hypot(cx - ox, cy - oy);
        shards.push({ pts, cx, cy, vx: (cx - ox) / (d + 40) * (40 + Math.random() * 120) * (.4 + j * .12), vy: -80 - Math.random() * 120 + (cy - oy) / (d + 40) * 30, rot: (Math.random() - .5) * 5, delay: d / maxR * .35 + Math.random() * .25, sh: Math.random() });
      }
      SND.glass();
      const T1 = 480 * K(), T2 = 1700 * K(), t0 = performance.now(); let did = false;
      const step = now => {
        const t = now - t0; g.clearRect(0, 0, W, H);
        if (t < T1) {
          const p = t / T1, e = 1 - Math.pow(1 - p, 3);
          if (p < .25) { g.fillStyle = `rgba(255,252,235,${(.55 * (1 - p / .25)).toFixed(2)})`; g.fillRect(0, 0, W, H); }
          g.lineCap = 'round'; g.strokeStyle = 'rgba(255,248,215,.95)'; g.shadowColor = 'rgba(255,217,61,.9)'; g.shadowBlur = 8;
          for (let i = 0; i < NA; i++) { g.lineWidth = 1.6; g.beginPath(); g.moveTo(ox, oy); for (let j = 1; j <= NR; j++) { if (rad[j] > maxR * e * 1.05) break; const q = P(j, i); g.lineTo(q[0], q[1]); } g.stroke(); }
          g.lineWidth = 1; for (let j = 1; j <= NR; j++) { if (rad[j] > maxR * e) break; g.beginPath(); for (let i = 0; i <= NA; i++) { const q = P(j, i); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); }
          g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, 0, W, H);
        } else {
          if (!did) { did = true; mid && mid(); }
          const u = (t - T1) / (T2 - T1);
          shards.forEach(s => {
            const k = Math.max(0, (t - T1) / 1000 - s.delay); if (k * 1000 > T2 - T1) return;
            const x = s.vx * k, y = s.vy * k + 900 * k * k, a = Math.max(0, 1 - Math.max(0, k - .5) / .9);
            g.save(); g.translate(s.cx + x, s.cy + y); g.rotate(s.rot * k); g.translate(-s.cx, -s.cy); g.globalAlpha = a;
            g.beginPath(); s.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
            const gr = g.createLinearGradient(s.pts[0][0], s.pts[0][1], s.cx, s.cy + 60); gr.addColorStop(0, `rgba(255,248,215,${(.16 + s.sh * .14).toFixed(2)})`); gr.addColorStop(1, 'rgba(120,150,200,.06)');
            g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(255,243,166,.8)'; g.lineWidth = 1; g.stroke(); g.restore();
          });
        }
        if (t < T2) requestAnimationFrame(step); else { g.clearRect(0, 0, W, H); shC.hidden = true; res(); }
      };
      requestAnimationFrame(step);
    });
  }
  /* ---------- 신호 4개 ---------- */
  async function s1() {                    // 회장실: 일렁이며 들어가고, 일렁이며 돌아옴
    SND.init(); SND.warp(1.9); await warp(1900, () => { show('game'); Game.enter(); });
  }
  async function s2() {                    // R.S.S.
    root.hidden = false; black.classList.add('on'); SND.boot(); await fade(1, 1100);
    const txt = 'Welcome, Founder.'; welcome.textContent = '';
    for (let i = 0; i < txt.length; i++) { welcome.innerHTML = txt.slice(0, i + 1).replace(/&/g, '&amp;') + '<span class="cur"></span>'; if (i % 2 === 0) SND._t(2200 + Math.random() * 900, .02, 'triangle', .012); await wait(RM ? 5 : 78); }
    await wait(1500); show('rss'); Rss.enter(); welcome.textContent = ''; await fade(0, 1300); black.classList.remove('on');
  }
  async function leaveRss() {
    if (busy) return; busy = true; black.classList.add('on'); SND.tone(660, .1, 'triangle', .05); SND.tone(330, .22, 'triangle', .05, .08); await fade(1, 800);
    Rss.leave(); Object.keys(V).forEach(k => V[k].classList.remove('on')); active = null; Obs.hold(false); await fade(0, 900); black.classList.remove('on'); root.hidden = true; busy = false;
  }
  async function s3() {                    // 바탕화면: 지지직 하다가 컴퓨터 화면으로
    SND.init(); SND.glitch(1.1); await glitch(1250, () => { show('desk'); Desk.enter(); });
  }
  async function leaveDesk() {
    if (busy) return; busy = true; SND.glitch(.9); await glitch(1000, () => { Desk.leave(); hide(); }); busy = false;
  }
  async function s4(from) {                // 마주함: 유리가 깨지며 눈과 존재가 나타남
    const r = from ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 }, ar = app.getBoundingClientRect();
    await shatter(r.left + r.width / 2 - ar.left, r.top + r.height / 2 - ar.top, () => { show('eye'); Eye.enter(); });
  }
  async function leaveEye() {
    if (busy) return; busy = true; black.style.background = '#fff'; black.classList.add('on'); SND.tone(880, .5, 'sine', .05, 0, 1760); await fade(1, 600);
    Eye.leave(); Object.keys(V).forEach(k => V[k].classList.remove('on')); active = null; Obs.hold(false); black.style.background = ''; await fade(0, 1100); black.classList.remove('on'); root.hidden = true; busy = false;
  }
  async function rebootEye() {          // 함정 끝: 인트로 화면으로 돌아간다
    if (busy) return; busy = true; black.style.background = '#000'; black.classList.add('on'); await fade(1, 500);
    Eye.leave(); Object.keys(V).forEach(k => V[k].classList.remove('on')); active = null; Obs.hold(false); black.style.background = ''; root.hidden = true; black.classList.remove('on'); busy = false;
    if (window.RSC && window.RSC.go) window.RSC.go('intro', { force: true }, { glitch: true });
  }
  async function leaveGame() { if (busy) return; busy = true; SND.warp(1.9); await warp(1900, () => { Game.leave(); hide(); }); busy = false; }
  /* 신호기를 눌렀을 때 */
  async function start(n, from) {
    if (busy || active) return; busy = true;
    try { await ({ 1: s1, 2: s2, 3: s3, 4: () => s4(from) })[n](); } catch (e) { console.error(e); hide(); black.style.opacity = '0'; black.classList.remove('on'); app.style.filter = ''; app.style.transform = ''; }
    busy = false;
  }
  /* 연출 화면이 떠 있는 동안에는 키 입력이 아래(관측소·전체 단축키)로 새지 않게 막는다 */
  addEventListener('keydown', e => {
    if (!active) return;
    const inp = e.target && e.target.matches && e.target.matches('input, textarea');
    if (!inp) { if (active === 'game' && Game.key(e, true)) { e.preventDefault(); } e.stopImmediatePropagation(); }
  }, true);
  addEventListener('keyup', e => { if (active === 'game') Game.key(e, false); }, true);
  return { start, show, hide, glitch, leaveRss, leaveDesk, leaveEye, rebootEye, leaveGame, active: () => active };
})();
window.RSC.Scenes = Scenes;
