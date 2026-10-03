/* ==========================================================================
   효과음 리얼화: 버튼 · 키보드 · 바람 가르는 소리 · 발소리 · 유리 · 종소리를 실제 소리의 구조(충격음 + 몸통 울림 + 잔향)로 다시 합성
   ========================================================================== */
Object.assign(SND, {
  /* 짧은 방 울림(잔향): 감쇠하는 잡음으로 만든 임펄스 */
  _verb() {
    if (this._vb || !this.ctx) return this._vb;
    const c = this.ctx, len = Math.floor(c.sampleRate * 1.7), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8) * (1 - Math.exp(-i / (c.sampleRate * .004))); }
    const cv = c.createConvolver(), inp = c.createGain(), out = c.createGain(), hp = c.createBiquadFilter(); cv.buffer = ir; out.gain.value = .6; hp.type = 'highpass'; hp.frequency.value = 180;
    inp.connect(hp); hp.connect(cv); cv.connect(out); out.connect(this.sfx); return (this._vb = inp);
  },
  /* 소리 하나(확장): echo = 되울림 양, rv = 잔향 양 */
  _t(f, d, type, g, at = 0, to = null, send = 0, pan = 0, rv = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), v = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + Math.min(.006, d / 3)); v.gain.exponentialRampToValueAtTime(.0001, t + d);
    let out = v; if (c.createStereoPanner && pan) { const p = c.createStereoPanner(); p.pan.value = pan; v.connect(p); out = p; }
    o.connect(v); out.connect(this.sfx);
    if (send) { const s = c.createGain(); s.gain.value = send; out.connect(s); s.connect(this._echoBus()); }
    if (rv) { const r = c.createGain(); r.gain.value = rv; out.connect(r); r.connect(this._verb()); }
    o.start(t); o.stop(t + d + .05);
  },
  _n(at, d, f0, f1, g, q = 1.4, type = 'bandpass', pan = 0, rv = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), v = c.createGain();
    s.buffer = this.nbuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d);
    v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + Math.min(.004, d * .3)); v.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(v); let out = v; if (this.ctx.createStereoPanner && pan) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; v.connect(p); out = p; }
    out.connect(this.sfx); if (rv) { const r = c.createGain(); r.gain.value = rv; out.connect(r); r.connect(this._verb()); }
    s.start(t, Math.random() * .8); s.stop(t + d + .05);
  },
  /* 버튼: 눌릴 때의 딸깍(충격) + 몸통 울림, 떼어질 때의 작은 딸깍 */
  click() {
    this._n(0, .028, 2800, 2100, .1, 2.2); this._t(210, .07, 'sine', .1, 0, 95); this._t(1400, .02, 'triangle', .025, 0);
    this._n(.055, .02, 3600, 3000, .05, 2.4); this._t(150, .04, 'sine', .04, .055, 100);
  },
  hover() {
    const n = performance.now(); if (n - this.lastHover < 80) return; this.lastHover = n;
    this._n(0, .022, 5200, 4000, .022, 2.4); this._t(1900 + Math.random() * 200, .03, 'sine', .008);
  },
  tick() { this._n(0, .022, 3400, 2600, .06, 2.2); this._t(180, .035, 'sine', .04, 0, 110); },
  /* 키보드: 키마다 높낮이가 다른 짧은 클랙 */
  type() {
    const r = Math.random(); this._n(0, .02, 1800 + r * 1700, 1200, .055, 1.5); this._t(120 + r * 70, .045, 'sine', .045, 0, 70); if (Math.random() < .3) this._n(.045, .012, 3000, 2600, .02, 2);
  },
  toggle(on) {      // 스위치: 딸깍 + 켜짐/꺼짐 방향의 짧은 음
    this._n(0, .03, 2600, 2000, .1, 2); this._t(on ? 480 : 620, .09, 'triangle', .05, .015, on ? 820 : 360, 0, 0, .15); this._n(.07, .02, 3300, 2800, .05, 2.4);
  },
  /* 공기를 가르는 소리: 대역이 올라갔다 내려가고 좌우로 지나감 + 아래쪽 묵직한 울림 */
  swoosh() {
    if (!this.ctx || !this.on) return;
    const k = Math.max(1, TS * .85), d = .9 * k, c = this.ctx, t = c.currentTime, s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nbuf; s.loop = true; bp.type = 'bandpass'; bp.Q.value = .65; bp.frequency.setValueAtTime(220, t); bp.frequency.exponentialRampToValueAtTime(2900, t + d * .52); bp.frequency.exponentialRampToValueAtTime(420, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + d * .5); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    let out = g; if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.setValueAtTime(-.55, t); p.pan.linearRampToValueAtTime(.55, t + d); g.connect(p); out = p; }
    s.connect(bp); bp.connect(g); out.connect(this.sfx); const r = c.createGain(); r.gain.value = .3; out.connect(r); r.connect(this._verb());
    s.start(t); s.stop(t + d + .05); this._t(95, d * .75, 'sine', .13, 0, 36);
  },
  /* 종소리: 종의 배음(비정수 배)이 서로 다른 길이로 사라지며 잔향이 남음 */
  arrive() {
    const k = Math.max(1, TS * .64);
    [523.25, 659.25, 783.99].forEach((f, i) => [[1, .06, 1.5], [2.76, .028, .9], [5.4, .012, .5], [8.9, .006, .3]].forEach(([m, g, L]) => this._t(f * m, L * k * .8, 'sine', g, i * .08 * k, null, 0, (i - 1) * .35, .5)));
    this._n(0, .03, 4200, 3000, .03, 2, 'bandpass', 0, .3);
  },
  /* 데이터 전송: 짧은 신호음 열 + 잡음 틱 + 아래의 서보 소리 */
  digital() {
    const k = Math.max(1, TS * .85), sc = [0, 3, 5, 7, 10, 12];
    for (let i = 0; i < 18; i++) { const f = 880 * Math.pow(2, sc[Math.floor(Math.random() * sc.length)] / 12 + (Math.random() < .3 ? 1 : 0)), at = i * .034 * k; this._t(f, .02, 'square', .012, at, null, .12, Math.random() * 1.2 - .6); if (i % 3 === 0) this._n(at, .012, 4200, 3200, .02, 2.4); }
    this._t(64, .8 * k, 'sawtooth', .04, 0, 30); this._t(1320, .12, 'triangle', .02, .6 * k, null, .25, 0, .3);
  },
  /* 발소리(나무 바닥): 뒤꿈치 충격 + 바닥 울림, 매번 조금씩 다름 */
  step() {
    const r = Math.random(); this._n(0, .014, 2400 + r * 600, 1800, .05, 2.4); this._n(0, .06, 320 + r * 90, 150, .09, .9); this._t(80 + r * 20, .1, 'sine', .11, 0, 46);
  },
  /* 유리: 첫 타격 + 균열이 번지는 높은 틱 + 흩어지는 파편 소리 + 조각이 바닥에 닿는 소리 */
  glass() {
    if (!this.ctx || !this.on) return;
    this._n(0, .08, 3200, 9000, .38, .5, 'highpass', 0, .25); this._n(0, .12, 700, 220, .16, .8); this._t(88, .55, 'sine', .3, 0, 36); this._t(2300, .22, 'triangle', .05, 0, 800, .3, 0, .3);
    this._n(.07, .05, 4800, 7600, .24, .7, 'highpass', .3);
    for (let i = 0; i < 32; i++) { const at = .1 + i * .017 + Math.random() * .05, pan = Math.random() * 2 - 1; this._n(at, .02 + Math.random() * .035, 4200 + Math.random() * 4800, 7000 + Math.random() * 3000, .05 + Math.random() * .08, .9, 'highpass', pan, .2); if (i % 3 === 0) this._t(3200 + Math.random() * 4000, .06 + Math.random() * .05, 'sine', .016 + Math.random() * .016, at + .02, null, 0, pan, .3); }
    for (let i = 0; i < 46; i++) { const at = .5 + Math.random() * 1.2, pan = Math.random() * 2 - 1, f = 2400 + Math.random() * 5200; this._t(f, .05 + Math.random() * .16, 'sine', .01 + Math.random() * .026, at, null, 0, pan, .45); this._t(f * 1.51, .03 + Math.random() * .08, 'sine', .006 + Math.random() * .012, at + .004, null, 0, pan, .35); if (i % 2) this._n(at + .02, .02, 2600, 1800, .03, 1.2, 'bandpass', pan, .2); }
  },
});

/* ---------- 'No-code' 분노 연출용 소리: 경보 · 디지털 깨짐 · 분노의 으르렁 · 삐 · 브라운관 ---------- */
Object.assign(SND, {
  _dist(k = 120) {
    if (this._ws || !this.ctx) return this._ws;
    const c = this.ctx, ws = c.createWaveShaper(), n = 1024, cur = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n / 2) - 1; cur[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    ws.curve = cur; ws.oversample = '2x'; const g = c.createGain(); g.gain.value = .55; ws.connect(g); g.connect(this.sfx); this._ws = ws; return ws;
  },
  /* 분노한 목소리 대신: 낮은 으르렁(톱니파 + 강한 왜곡 + 포먼트 이동 + 떨림) */
  growl(len = 1.2, at = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), o2 = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain(), tr = c.createOscillator(), tg = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(78, t); o.frequency.linearRampToValueAtTime(52, t + len); o2.type = 'square'; o2.frequency.setValueAtTime(39, t); o2.frequency.linearRampToValueAtTime(26, t + len);
    bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.setValueAtTime(420, t); bp.frequency.linearRampToValueAtTime(900, t + len * .4); bp.frequency.linearRampToValueAtTime(300, t + len);
    tr.frequency.value = 28; tg.gain.value = .5; tr.connect(tg); const am = c.createGain(); am.gain.value = .6; tg.connect(am.gain);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.34, t + .05); g.gain.setValueAtTime(.34, t + len * .7); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(bp); o2.connect(bp); bp.connect(am); am.connect(this._dist(60)); am.connect(g); g.connect(this.sfx);
    [o, o2, tr].forEach(n => { n.start(t); n.stop(t + len + .05); });
    this._n(at, len * .8, 700, 2400, .08, .8, 'bandpass', 0, .1);
  },
  /* 모뎀 같은 디지털 비명 + 끊기는 잡음(글리치) */
  screech(at = 0) {
    for (let i = 0; i < 14; i++) this._t(700 + Math.random() * 3600, .02 + Math.random() * .05, i % 3 ? 'square' : 'sawtooth', .03, at + i * .045, null, .1, Math.random() * 2 - 1);
    this._n(at, .3, 6000, 900, .12, .6, 'highpass');
  },
  /* 경보: 실제 경보기처럼 두 음을 번갈아 울리고(960/770Hz), 그 위에 사이렌 훑는 소리와 깊은 진동 + 불규칙한 글리치. 반환값 stop() 으로 끈다 */
  rageStart(d = 10) {
    if (!this.ctx || !this.on) return () => {};
    const c = this.ctx, t0 = c.currentTime, grp = c.createGain(), lp = c.createBiquadFilter(), nodes = [];
    grp.gain.setValueAtTime(.0001, t0); grp.gain.exponentialRampToValueAtTime(1, t0 + .06); lp.type = 'lowpass'; lp.frequency.value = 5200; lp.connect(grp); grp.connect(this.sfx);
    const al = c.createOscillator(), ag = c.createGain(); al.type = 'square'; ag.gain.value = .05; al.connect(ag); ag.connect(lp);
    for (let k = 0, tt = 0; tt < d + .4; k++, tt += .28) al.frequency.setValueAtTime(k % 2 ? 770 : 960, t0 + tt);
    al.start(t0); al.stop(t0 + d + .6); nodes.push(al);
    const sr = c.createOscillator(), sg = c.createGain(); sr.type = 'sawtooth'; sg.gain.value = .028; sr.connect(sg); sg.connect(lp);
    for (let tt = 1.2, up = true; tt < d; tt += .55, up = !up) { sr.frequency.setValueAtTime(up ? 480 : 1500, t0 + tt); sr.frequency.linearRampToValueAtTime(up ? 1500 : 480, t0 + tt + .55); } sr.start(t0 + 1.2); sr.stop(t0 + d + .6); nodes.push(sr);
    const sub = c.createOscillator(), sbg = c.createGain(), lf = c.createOscillator(), lg = c.createGain(); sub.type = 'sine'; sub.frequency.value = 46; sbg.gain.value = .14; lf.frequency.value = 4.2; lg.gain.value = .09; lf.connect(lg); lg.connect(sbg.gain); sub.connect(sbg); sbg.connect(grp);
    sub.start(t0); lf.start(t0); sub.stop(t0 + d + .6); lf.stop(t0 + d + .6); nodes.push(sub, lf);
    for (let tt = .1; tt < d - .3; tt += .25 + Math.random() * .7) {
      const r = Math.random(); if (r < .35) this.screech(tt); else if (r < .7) this._n(tt, .04 + Math.random() * .12, 800 + Math.random() * 4000, 2500 + Math.random() * 5000, .12 + Math.random() * .1, .5, Math.random() < .5 ? 'highpass' : 'bandpass', Math.random() * 2 - 1);
      else for (let j = 0; j < 4; j++) this._t(1000, .025, 'square', .05, tt + j * .06, null, 0, 0);
    }
    [.1, 2.3, 4.5, 6.6, 8.4].forEach((a, i) => this.growl(1.2 + (i % 2) * .5, a));
    return () => { const t = c.currentTime; grp.gain.cancelScheduledValues(t); grp.gain.setTargetAtTime(0, t, .03); nodes.forEach(n => { try { n.stop(t + .2); } catch (e) { /* 이미 멈춤 */ } }); };
  },
  beep(d = 1.7) {         // 방송 시험 신호처럼 길게 이어지는 '삐'
    if (!this.ctx || !this.on) return;
    this._t(1000, d, 'sine', .085, 0, null, 0, 0, .1); this._t(2000, d, 'sine', .012, 0); this._n(0, .02, 3000, 3000, .06, 3);
  },
  /* 브라운관 눈보라 화면: 넓은 대역 잡음 + 지글거리는 틱 + 전원 낮은 웅웅거림 */
  crt(d = 4.2) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nbuf; s.loop = true; hp.type = 'highpass'; hp.frequency.value = 500; lp.type = 'lowpass'; lp.frequency.value = 9000; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .08); g.gain.setValueAtTime(.12, t + d - .15); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.sfx); s.start(t); s.stop(t + d + .05);
    this._t(50, d, 'sine', .05, 0); this._t(100, d, 'sine', .018, 0);
    for (let i = 0; i < d * 9; i++) this._n(Math.random() * d, .006 + Math.random() * .02, 3000 + Math.random() * 6000, 2000, .07 + Math.random() * .06, 1.2, 'highpass', Math.random() * 2 - 1);
    this._t(90, .45, 'sine', .22, 0, 40); this._n(0, .25, 1200, 150, .12, .7);          // 전원이 켜질 때 '퉁'
  },
  /* 브라운관 눈보라가 계속 켜져 있는 동안의 소리: 낮은 전원 웅웅거림 + 넓은 대역 지글거림. 반환값 stop() 으로 끈다 */
  crtLoop() {
    if (!this.ctx || !this.on) return () => {};
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain(), nodes = [s];
    s.buffer = this.nbuf; s.loop = true; hp.type = 'highpass'; hp.frequency.value = 600; lp.type = 'lowpass'; lp.frequency.value = 8500;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.075, t + .1); s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.sfx); s.start(t);
    const o1 = c.createOscillator(), o2 = c.createOscillator(), og = c.createGain(); o1.frequency.value = 50; o2.frequency.value = 15734; og.gain.value = .03; o1.connect(og); o2.connect(og); og.connect(g); o1.start(t); o2.start(t); nodes.push(o1, o2);   // 전원 웅웅 + 수평 주사음
    this._t(90, .45, 'sine', .2, 0, 40); this._n(0, .25, 1200, 150, .12, .7);
    return () => { const n = c.currentTime; g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0, n, .04); nodes.forEach(x => { try { x.stop(n + .3); } catch (e) { /* 이미 멈춤 */ } }); };
  },
  /* 모든 소리를 끊는다 (바람·음악) */
  blackout() { this.windStop(); this.musicTo(0, .06); },
  /* 글자가 한 자씩 찍힐 때: 딱딱한 '탁' */
  knock() {
    const v = .85 + Math.random() * .3;
    this._n(0, .025, 2600 * v, 500, .2, 1.3, 'bandpass', Math.random() * .4 - .2); this._t(150 * v, .09, 'sine', .22, 0, 55); this._n(.002, .012, 5200, 3000, .08, 1.5, 'highpass');
  },
  /* 기괴한 웃음 한 줄기: 쉰 목소리 '하' 를 점점 빨라지고 낮아지게 이어 붙인다 (f0: 높이, n: 횟수) */
  laugh(f0 = 170, pan = 0, at = 0, n = 9, tempo = 1) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t0 = c.currentTime + at, pn = c.createStereoPanner ? c.createStereoPanner() : null; if (pn) { pn.pan.value = pan; pn.connect(this.sfx); }
    const dst = pn || this.sfx; let tt = t0;
    for (let k = 0; k < n; k++) {
      const d = (.17 + Math.random() * .05) * tempo, f = f0 * (1.22 - k * .028) * (1 + (Math.random() - .5) * .05), o = c.createOscillator(), o2 = c.createOscillator(), env = c.createGain(), b1 = c.createBiquadFilter(), b2 = c.createBiquadFilter(), vb = c.createOscillator(), vg = c.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; o.frequency.setValueAtTime(f * 1.12, tt); o.frequency.exponentialRampToValueAtTime(f * .84, tt + d); o2.frequency.value = f * 1.005; o2.frequency.setValueAtTime(f * 1.12, tt); o2.frequency.exponentialRampToValueAtTime(f * .84, tt + d);
      vb.frequency.value = 22; vg.gain.value = f * .025; vb.connect(vg); vg.connect(o.frequency);
      b1.type = 'bandpass'; b1.frequency.value = 760 + Math.random() * 120; b1.Q.value = 5; b2.type = 'bandpass'; b2.frequency.value = 1250 + Math.random() * 200; b2.Q.value = 7;
      env.gain.setValueAtTime(.0001, tt); env.gain.exponentialRampToValueAtTime(.16, tt + .02); env.gain.exponentialRampToValueAtTime(.0001, tt + d);
      o.connect(b1); o2.connect(b2); b1.connect(env); b2.connect(env); env.connect(dst);
      o.start(tt); o2.start(tt); vb.start(tt); o.stop(tt + d + .03); o2.stop(tt + d + .03); vb.stop(tt + d + .03);
      const ns = c.createBufferSource(), hp = c.createBiquadFilter(), ng = c.createGain(); ns.buffer = this.nbuf; hp.type = 'highpass'; hp.frequency.value = 2200; ng.gain.setValueAtTime(.05, tt); ng.gain.exponentialRampToValueAtTime(.0001, tt + d * .6); ns.connect(hp); hp.connect(ng); ng.connect(dst); ns.start(tt); ns.stop(tt + d);
      tt += d * (1.02 - k * .02);
    }
  },
  crtOff() {              // 브라운관이 꺼질 때: 높은 소리가 떨어지며 사라지고 '퍽'
    this._t(4200, .38, 'sine', .05, 0, 70); this._t(60, .3, 'sine', .22, .32, 30); this._n(.3, .06, 3000, 800, .1, .8); this._n(.3, .4, 400, 60, .06, .6, 'lowpass');
  },
});
window.RSC.SND = SND;
