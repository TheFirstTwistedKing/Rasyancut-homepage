/* ==========================================================================
   메인: 플레이어 · 카메라 · 조사 · 이동 연출(엘리베이터·계단) · 퀘스트 · 루프
   ========================================================================== */
const Q = { on: false };
const BUILD = { office: buildOffice, hall: buildHall, f95: buildF95, roof: buildRoof };
function ensure(name) { if (!MAPS[name]) { const m = BUILD[name](); if (!m.bounds) { const b = { office: [48, 34], f95: [44, 34] }[name]; if (b) m.bounds = { camX0: .6, camX1: b[0] - .6, camZ0: .6, camZ1: b[1] - .6 }; } } return MAPS[name]; }
const player = makeHuman(PLAYER); scene.add(player);
const pLight = new T.PointLight(0xffe8cc, 9, 10, 1.4); scene.add(pLight);   // 플레이어가 어두운 방에서도 잘 보이도록 따라다니는 약한 보조광
const P = { x: 24, z: 15, yaw: Math.PI, moving: false, run: false };
function giveQuest() { if (Q.on) return; Q.on = true; $('#quest').hidden = false; tone(988, .12, 'sine', .06); tone(1318, .2, 'sine', .06, .1); tone(1760, .3, 'sine', .05, .22); }

function enterMap(name, x, z, yaw) { ensure(name); showMap(name); P.x = x; P.z = z; P.yaw = yaw; camYaw = yaw + Math.PI; player.position.set(x, 0, z); player.rotation.y = yaw; }
async function travel(dest, o = {}) {
  if (UI.trans) return; UI.trans = true; const fade = $('#fade'), fl = $('#floor'); fade.classList.add('on'); click(); await sleep(RM ? 20 : 450);
  if (o.stairs) { fl.hidden = false; const up = o.stairs === 'up', n = 16; for (let k = 0; k < n; k++) { fl.innerHTML = `<small>STAIRS</small><b>${up ? 'RF' : '100F'}</b><em>${up ? '▲' : '▼'}</em><i>${k + 1}/${n}</i>`; step(); await sleep(RM ? 8 : 190); } tone(880, .3, 'sine', .05); await sleep(RM ? 10 : 300); fl.hidden = true; }
  if (o.ride) { fl.hidden = false; const a = o.ride[0], b = o.ride[1], d = b > a ? 1 : -1; tone(70, 1.2, 'sine', .08, 0, 55); for (let f = a; f !== b + d; f += d) { fl.innerHTML = `<small>FLOOR</small><b>${f}</b><i>F</i><em>${d > 0 ? '▲' : '▼'}</em>`; tick(); await sleep(RM ? 10 : 170); } tone(1318, .5, 'sine', .07); tone(1760, .6, 'sine', .05, .12); await sleep(RM ? 10 : 520); fl.hidden = true; }
  enterMap(dest, o.x, o.z, o.yaw); await sleep(RM ? 20 : 280); fade.classList.remove('on'); await sleep(RM ? 20 : 450); UI.trans = false;
  if (dest === 'roof' && o.first) say(['…옥상이다. 난간이 없다.', '매끄러운 흰 바닥과 하늘뿐이다. 그리고 저 멀리, 꺾인 탑이 하나 보인다.']);
  if (dest === 'f95' && o.first) say(['여기가 95층이다. 내가 맡긴 사무층.', '직원들이 분주하게 움직이고 있다.']);
}
/* 엘리베이터 */
let elevI = 0, elevFloor = 100; const EB = () => [...document.querySelectorAll('#elev button')];
function openElev(from) { UI.elevOpen = true; elevFloor = from; elevI = from === 100 ? 1 : 0; $('#elev').hidden = false; $('#eNow').textContent = from + 'F'; EB().forEach(b => b.classList.toggle('cur', +b.dataset.f === from)); paintElev(); click(); }
function paintElev() { EB().forEach((b, i) => b.classList.toggle('on', i === elevI)); }
function closeElev() { UI.elevOpen = false; $('#elev').hidden = true; }
function pickElev() { const f = +EB()[elevI].dataset.f; click(); if (!f) { closeElev(); return; } if (f === elevFloor) { closeElev(); say(f === 100 ? '이미 100층이다. 내 회장실이 있는 층.' : '이미 95층이다.'); return; } closeElev(); if (f === 95) travel('f95', { ride: [100, 95], x: 22, z: 28.4, yaw: Math.PI, first: !Q.on }); else travel('hall', { ride: [95, 100], x: 7.5, z: 38.2, yaw: Math.PI }); }
EB().forEach((b, i) => { b.addEventListener('pointerdown', e => { e.stopPropagation(); elevI = i; pickElev(); }); b.addEventListener('mouseenter', () => { elevI = i; paintElev(); }); });

/* 조사 */
let near = null;
function findNear() {
  let best = null, bd = 1e9; for (const it of cur.inter) { if (it.test) { if (it.test(P)) { best = it; bd = 0; break; } continue; } const d = Math.hypot(it.x - P.x, it.z - P.z); if (d <= it.r && d < bd) { bd = d; best = it; } } return best;
}
function interact() { if (!near) return; click(); const f = near.fn; if (Array.isArray(f)) say(f, near.name); else if (typeof f === 'function') f(); }
function onKey(code) {
  if (!started || UI.trans) return;
  if (UI.elevOpen) { if (code === 'ArrowUp' || code === 'KeyW') { elevI = (elevI + EB().length - 1) % EB().length; paintElev(); tick(); } else if (code === 'ArrowDown' || code === 'KeyS') { elevI = (elevI + 1) % EB().length; paintElev(); tick(); } else if (code === 'Space' || code === 'Enter' || code === 'KeyE') pickElev(); else if (code === 'Escape') closeElev(); return; }
  if (UI.choiceOpen) { if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'KeyW' || code === 'KeyS') { choiceI = (choiceI + 1) % 2; paintChoice(); tick(); } else if (code === 'Space' || code === 'Enter' || code === 'KeyE') pickChoice(choiceI); else if (code === 'Escape') pickChoice(1); return; }
  if (UI.msgOpen) { if (code === 'Space' || code === 'Enter' || code === 'KeyE') advance(); return; }
  if (code === 'Space' || code === 'Enter' || code === 'KeyE') interact();
}

/* 루프 */
let started = false, last = 0, clock = 0;
const camPos = new T.Vector3(), camLook = new T.Vector3();
function update(dt) {
  clock += dt;
  const blockedInput = UI.msgOpen || UI.elevOpen || UI.trans;
  let mx = 0, mz = 0;
  if (!blockedInput) {
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = -fz, rz = fx;
    const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - joy.y, r = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + joy.x;
    mx = fx * f + rx * r; mz = fz * f + rz * r; const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
    P.moving = l > .05; P.run = keys.has('ShiftLeft') || keys.has('ShiftRight');
  } else P.moving = false;
  if (P.moving) {
    const sp = (P.run ? 7.8 : 4.8) * dt, nx = P.x + mx * sp, nz = P.z + mz * sp;
    if (!blocked(nx, P.z, .38)) P.x = nx; if (!blocked(P.x, nz, .38)) P.z = nz;
    const ty = Math.atan2(mx, mz); let d = ty - P.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; P.yaw += d * Math.min(1, dt * 12);
    P.stepT = (P.stepT || 0) + dt * (P.run ? 1.5 : 1); if (P.stepT > .34) { P.stepT = 0; step(); }
  }
  pLight.position.set(P.x, 2.8, P.z); player.position.set(P.x, 0, P.z); player.rotation.y = P.yaw; animHuman(player, clock, P.moving, P.run ? 1.35 : 1);
  cur.npcs.forEach(n => n.upd(dt, clock)); cur.upd.forEach(u => u(dt, clock));
  if (cur.elev) { const u = cur.elev.userData, tgt = UI.elevOpen ? 1 : 0; u.open += (tgt - u.open) * Math.min(1, dt * 4); u.dl.position.x = -.86 - u.open * 1.55; u.dr.position.x = .86 + u.open * 1.55; }
  near = (!blockedInput && cur) ? findNear() : null; const pr = $('#prompt'); if (near) pr.textContent = (touch ? '조사 버튼' : 'E / Space') + ' — ' + near.name; pr.classList.toggle('on', !!near);
  // 카메라(3인칭 추적, 방 안으로 가둠)
  const hx = P.x, hy = 1.5, hz = P.z, cp = Math.cos(camPitch), sp2 = Math.sin(camPitch);
  let cxp = hx + Math.sin(camYaw) * cp * camDist, cyp = hy + sp2 * camDist + .4, czp = hz + Math.cos(camYaw) * cp * camDist;
  const b = cur.bounds; if (b) { cxp = clamp(cxp, b.camX0, b.camX1); czp = clamp(czp, b.camZ0, b.camZ1); cyp = Math.min(cyp, cur.name === 'hall' ? 4.0 : cur.name === 'office' ? 6 : cur.name === 'f95' ? 5.2 : 99); }
  camPos.lerp(new T.Vector3(cxp, cyp, czp), Math.min(1, dt * 10)); camera.position.copy(camPos); camLook.set(hx, hy, hz); camera.lookAt(camLook);
}
function loop(ts) { requestAnimationFrame(loop); const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; if (!started) return; update(dt); renderer.render(scene, camera); }
$('#go').addEventListener('click', () => {
  audioInit(); $('#start').remove(); $('#load').hidden = false;
  setTimeout(() => { enterMap('office', 24, 15.5, Math.PI); camPos.set(24, 5, 22); $('#load').hidden = true; started = true; setTimeout(() => say(['여기는 내 회장실이다.', touch ? '스틱으로 이동하고 조사 버튼으로 주변을 살펴보자.' : 'WASD로 이동하고 E 또는 Space로 주변을 살펴보자.']), 700); }, 60);
});
requestAnimationFrame(loop);
window.__rsc3d = { P, MAPS, travel, enterMap, scene, camera, renderer, get cur() { return cur; }, set started(v) { started = v; }, setCam(y, p, d) { camYaw = y; camPitch = p; camDist = d; }, Q };
