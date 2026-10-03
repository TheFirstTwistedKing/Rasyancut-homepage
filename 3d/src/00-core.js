'use strict';
/* ==========================================================================
   라시안컷 3D — 코어: 렌더러 · 재료 · 텍스처 · 충돌 · 조작 · 대화창
   1타일 = 1미터. x 는 동쪽, z 는 남쪽, y 는 위. 2D 쯔꾸르 게임의 타일 좌표를 그대로 쓴다.
   ========================================================================== */
const T = THREE, $ = s => document.querySelector(s), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let _s = 20261003; const rnd = () => { _s = (_s * 1664525 + 1013904223) >>> 0; return _s / 4294967296; };
const rr = (a, b) => a + rnd() * (b - a);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = $('#c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new T.Scene(), camera = new T.PerspectiveCamera(58, 1, .1, 600);
function resize() { const dpr = Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1.5 : 2); renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ---------- 재료 · 텍스처 ---------- */
const M = (color, rough = .85, metal = 0, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, o));
const E = (color, k = 1) => new T.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: k });
function ctex(w, h, fn, rep, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g, w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); } return t; }
const mix = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => clamp(Math.round(v * k), 0, 255); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

/* 어디서든 쓰는 도형 도우미 */
function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, o = {}) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = o.cast !== false; m.receiveShadow = o.recv !== false; if (o.ry) m.rotation.y = o.ry; (parent || scene).add(m); return m; }
function cyl(parent, rt, rb, h, mat, x = 0, y = 0, z = 0, o = {}) { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, o.seg || 16), mat); m.position.set(x, y, z); m.castShadow = o.cast !== false; m.receiveShadow = true; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; (parent || scene).add(m); return m; }
function sph(parent, r, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) { const m = new T.Mesh(new T.SphereGeometry(r, 20, 14), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; (parent || scene).add(m); return m; }
function plane(parent, w, h, mat, x, y, z, rx = 0, ry = 0) { const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; (parent || scene).add(m); return m; }
/* 방 안쪽을 향하는 벽(바깥에서는 보이지 않아 카메라가 벽 뒤로 가도 가려지지 않는다) */
function wallPlane(parent, ax, az, bx, bz, h, mat, cx, cz, y0 = 0) {
  const len = Math.hypot(bx - ax, bz - az), m = new T.Mesh(new T.PlaneGeometry(len, h), mat), mx = (ax + bx) / 2, mz = (az + bz) / 2;
  m.position.set(mx, y0 + h / 2, mz); let ang = Math.atan2(-(bz - az), bx - ax); m.rotation.y = ang;
  const nx = Math.sin(ang), nz = Math.cos(ang), dot = (cx - mx) * nx + (cz - mz) * nz; if (dot < 0) m.rotation.y = ang + Math.PI;
  m.receiveShadow = true; parent.add(m); return m;
}

/* ---------- 지도(방) 관리 ---------- */
const MAPS = {}; let cur = null;
function newMap(name, label) { const g = new T.Group(); g.visible = false; scene.add(g); return (MAPS[name] = { name, label, g, cols: [], inter: [], npcs: [], upd: [], bg: 0x05060a, fog: null, spawn: { x: 0, z: 0, yaw: 0 }, lights: [] }); }
function col(map, x0, z0, x1, z1) { map.cols.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) }); }
function inter(map, x, z, r, name, fn) { map.inter.push({ x, z, r, name, fn }); }
function light(map, l) { map.g.add(l); map.lights.push(l); return l; }
function showMap(name) {
  Object.values(MAPS).forEach(m => { m.g.visible = m.name === name; });
  cur = MAPS[name]; scene.background = new T.Color(cur.bg); scene.fog = cur.fog ? new T.Fog(cur.fog[0], cur.fog[1], cur.fog[2]) : null; $('#hudA').textContent = cur.label;
}
function blocked(x, z, r) { for (const c of cur.cols) if (x + r > c.x0 && x - r < c.x1 && z + r > c.z0 && z - r < c.z1) return true; return false; }

/* ---------- 입력 ---------- */
const keys = new Set(), joy = { x: 0, y: 0 }; let camYaw = 0, camPitch = .42, camDist = 6.2;
addEventListener('keydown', e => { if (e.repeat) return; keys.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); onKey(e.code); });
addEventListener('keyup', e => keys.delete(e.code));
let drag = null;
canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); if (UI.msgOpen && !UI.choiceOpen) advance(); });
canvas.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; camYaw -= (e.clientX - drag.x) * .006; camPitch = clamp(camPitch + (e.clientY - drag.y) * .004, .08, 1.2); drag.x = e.clientX; drag.y = e.clientY; });
const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; }; canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { camDist = clamp(camDist + e.deltaY * .004, 3, 11); }, { passive: true });
const touch = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
if (touch) { $('#pad').hidden = false; $('#help').style.display = 'none'; }
let stickId = null; const stickEl = $('#stick');
stickEl.addEventListener('pointerdown', e => { stickId = e.pointerId; stickEl.setPointerCapture(e.pointerId); mvStick(e); });
stickEl.addEventListener('pointermove', e => { if (e.pointerId === stickId) mvStick(e); });
const endStick = e => { if (e.pointerId !== stickId) return; stickId = null; joy.x = joy.y = 0; stickEl.querySelector('i').style.transform = ''; }; stickEl.addEventListener('pointerup', endStick); stickEl.addEventListener('pointercancel', endStick);
function mvStick(e) { const r = stickEl.getBoundingClientRect(); let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = Math.abs(dx) < .18 ? 0 : dx; joy.y = Math.abs(dy) < .18 ? 0 : dy; stickEl.querySelector('i').style.transform = `translate(${dx * 38}px,${dy * 38}px)`; }
$('#act').addEventListener('pointerdown', e => { e.preventDefault(); onKey('Space'); });

/* ---------- 대화창 · 선택지 ---------- */
const UI = { msgOpen: false, choiceOpen: false, elevOpen: false, trans: false };
let lines = [], li = 0, done = null, typeT = 0, typed = true, choiceI = 0, choiceCb = null;
const mTxt = $('#mTxt'), mName = $('#mName'), mNext = $('#mNext');
function typeLine() {
  clearInterval(typeT); const s = lines[li]; let n = 0; typed = false; mNext.classList.remove('on'); mTxt.textContent = '';
  typeT = setInterval(() => { n += 1; mTxt.textContent = s.slice(0, n); if (n % 2 === 0) tick(); if (n >= s.length) { clearInterval(typeT); typed = true; mNext.classList.add('on'); } }, RM ? 1 : 22);
}
function say(arr, name = '', cb = null) { lines = Array.isArray(arr) ? arr : [arr]; li = 0; done = cb; UI.msgOpen = true; $('#msg').hidden = false; mName.textContent = name; typeLine(); }
function advance() {
  if (UI.choiceOpen) return;
  if (!typed) { clearInterval(typeT); mTxt.textContent = lines[li]; typed = true; mNext.classList.add('on'); return; }
  if (li < lines.length - 1) { li++; typeLine(); return; }
  closeMsg(); const d = done; done = null; if (d) d();
}
function closeMsg() { clearInterval(typeT); UI.msgOpen = false; $('#msg').hidden = true; }
$('#msg').addEventListener('pointerdown', e => { e.stopPropagation(); advance(); });
function ask(prompt, onYes, onNo) {
  say(prompt, '', null);
  const w = setInterval(() => { if (!UI.msgOpen) { clearInterval(w); return; } if (typed) { clearInterval(w); UI.choiceOpen = true; choiceI = 0; choiceCb = yes => { onYes && yes && onYes(); onNo && !yes && onNo(); }; $('#choice').hidden = false; paintChoice(); } }, 60);
}
function paintChoice() { document.querySelectorAll('#choice button').forEach((b, i) => b.classList.toggle('on', i === choiceI)); }
function pickChoice(i) { if (!UI.choiceOpen) return; UI.choiceOpen = false; $('#choice').hidden = true; closeMsg(); const cb = choiceCb; choiceCb = null; click(); cb(i === 0); }
document.querySelectorAll('#choice button').forEach((b, i) => { b.addEventListener('pointerdown', e => { e.stopPropagation(); pickChoice(i); }); b.addEventListener('mouseenter', () => { choiceI = i; paintChoice(); }); });

/* ---------- 효과음(간단한 합성) ---------- */
let AC = null, master = null;
function audioInit() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination); } catch (e) { AC = null; } }
function tone(f, d, type = 'sine', g = .05, at = 0, to = 0) { if (!AC) return; const t = AC.currentTime + at, o = AC.createOscillator(), v = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d); v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + .01); v.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(v); v.connect(master); o.start(t); o.stop(t + d + .05); }
function noiseHit(d, f0, f1, g) { if (!AC) return; const t = AC.currentTime, n = AC.sampleRate * d, b = AC.createBuffer(1, n, AC.sampleRate), c = b.getChannelData(0); for (let i = 0; i < n; i++) c[i] = Math.random() * 2 - 1; const s = AC.createBufferSource(), f = AC.createBiquadFilter(), v = AC.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(f); f.connect(v); v.connect(master); s.start(t); }
const tick = () => { tone(1700, .02, 'square', .015); }, click = () => { tone(900, .05, 'square', .03); tone(1300, .05, 'sine', .03, .04); }, step = () => noiseHit(.06, 500 + Math.random() * 300, 200, .05);
