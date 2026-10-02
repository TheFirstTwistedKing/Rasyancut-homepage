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
window.RSC.SND = SND;
