/* ==========================================================================
   사람: 4등신 일본 애니메풍 도트 캐릭터를 3D 도형으로 옮긴 것(큰 머리 · 큰 눈 · 가는 몸). 키 약 1.9m, 정면은 +z
   ========================================================================== */
const SKIN = '#f3d9c4';
function eyeTex(iris, irisD, irisL, fem) {
  return ctex(64, 80, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#e8e2dc'; g.beginPath(); g.ellipse(32, 44, 24, 30, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, 14, 0, 76); gr.addColorStop(0, irisD); gr.addColorStop(.5, iris); gr.addColorStop(1, irisL); g.fillStyle = gr; g.beginPath(); g.ellipse(32, 46, 17, 27, 0, 0, 7); g.fill();
    g.fillStyle = '#0a0810'; g.beginPath(); g.ellipse(32, 46, 8, 14, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1418'; g.beginPath(); g.moveTo(4, 24); g.quadraticCurveTo(32, 2, 60, 24); g.lineTo(60, 17); g.quadraticCurveTo(32, -4, 4, 17); g.fill();
    if (fem) { g.fillRect(56, 10, 7, 4); g.fillRect(58, 5, 5, 4); }
  });
}
const eyeCache = {};
function getEye(S, flip) { const k = S.iris + S.irisD + S.irisL + (S.style === 'long') + (flip ? 'f' : ''); if (!eyeCache[k]) { const t = eyeTex(S.iris, S.irisD, S.irisL, S.style === 'long'); if (flip) { t.wrapS = T.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; } eyeCache[k] = new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); } return eyeCache[k]; }
let furTex = null;
function getFur() { if (!furTex) furTex = ctex(128, 128, (g, w, h) => { g.fillStyle = '#d9b44a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(246,225,154,.55)' : 'rgba(150,115,30,.45)'; const x = Math.random() * w, y = Math.random() * h; g.fillRect(x, y, 1.5, 4 + Math.random() * 5); } }, true, 1.5, 1.5); return furTex; }
let tieTex = null;
function getTie() { if (!tieTex) tieTex = ctex(32, 128, (g, w, h) => { g.fillStyle = '#15226e'; g.fillRect(0, 0, w, h); g.fillStyle = '#e6c04a'; for (let y = 14; y < h; y += 22) { g.beginPath(); g.moveTo(16, y - 5); g.lineTo(21, y); g.lineTo(16, y + 5); g.lineTo(11, y); g.fill(); } }); return tieTex; }

function makeHuman(S) {
  const root = new T.Group(), P = {}; root.userData.P = P;
  const skin = M(S.skin || SKIN, .7), hair = M(S.hair, .55), top = M(S.top || '#222', .75), bottom = M(S.bottom || '#0c0f1c', .8), shoe = M(S.shoe || '#07080c', .6, .1), hand = M(S.hand || S.skin || SKIN, .7);
  const furM = S.fur ? new T.MeshStandardMaterial({ map: getFur(), roughness: 1 }) : null;
  // 다리(허벅지·정강이)
  const leg = side => { const hip = new T.Group(); hip.position.set(side * .12, .88, 0); const th = box(hip, .17, .42, .19, bottom, 0, -.21, 0); const knee = new T.Group(); knee.position.set(0, -.42, 0); hip.add(knee); box(knee, .15, .42, .17, bottom, 0, -.21, 0); box(knee, .17, .09, .27, shoe, 0, -.43, .045); root.add(hip); return { hip, knee }; };
  P.legL = leg(-1); P.legR = leg(1);
  // 몸통
  const torso = new T.Group(); torso.position.y = 1.1; root.add(torso); P.torso = torso;
  if (S.coat) {
    box(torso, .5, .56, .27, top, 0, .1, 0);
    const skirt = cyl(root, .27, .43, .78, top, 0, .86, 0, { seg: 20 }); skirt.scale.z = .78;
    box(root, .13, .84, .02, M(S.inner, .9), 0, .88, .335 * .78 + .06); box(root, .5, .08, .3, M('#0e0f12', .5), 0, 1.0, 0, {}); box(root, .08, .08, .02, M('#c9a94c', .4, .6), 0, 1.0, .16);
    cyl(torso, .09, .1, .1, M(S.inner, .9), 0, .42, 0);
    box(torso, .16, .26, .02, M(S.topL, .7), -.09, .3, .14, { ry: 0 }); box(torso, .16, .26, .02, M(S.topL, .7), .09, .3, .14);
  } else if (S.fur) {
    box(torso, .46, .56, .26, M(S.jacket, .6), 0, .1, 0); box(torso, .13, .46, .02, M(S.shirt, .6), 0, .16, .14);
    const tie = new T.Mesh(new T.PlaneGeometry(.075, .42), new T.MeshStandardMaterial({ map: getTie(), roughness: .5 })); tie.position.set(0, .13, .146); torso.add(tie);
    box(torso, .2, .12, .27, M(S.jacket, .6), 0, -.2, 0, {});
    const cx = -.205; box(root, .2, .66, .3, furM, -.2, 1.14, 0); box(root, .2, .66, .3, furM, .2, 1.14, 0);
    box(root, .66, .14, .34, furM, 0, 1.48, 0); box(root, .62, .06, .3, furM, 0, 0, 0, {}).visible = false;
    for (let i = 0; i < 9; i++) { box(root, .08, .08, .3, furM, -.3 + i * .075, .79, 0, { cast: false }); }
    box(root, .2, .26, .3, furM, -.2, .98, 0); box(root, .2, .26, .3, furM, .2, .98, 0);
  } else {
    box(torso, .46, .56, .26, top, 0, .1, 0);
    box(torso, .13, .5, .02, M(S.shirt || '#e8f0ff', .6), 0, .14, .135); box(torso, .06, .4, .025, M(S.tie || '#38d6ff', .5), 0, .1, .145);
    box(torso, .46, .08, .27, M(S.belt || '#06070c', .5), 0, -.17, 0); box(torso, .07, .06, .02, M('#c9a94c', .4, .6), 0, -.17, .14);
  }
  // 목
  cyl(root, .075, .085, .12, skin, 0, 1.42, 0);
  // 팔
  const arm = side => { const sh = new T.Group(); sh.position.set(side * .31, 1.34, 0); const up = box(sh, .12, .52, .13, S.fur ? furM : top, 0, -.26, 0); const hd = box(sh, .1, .1, .12, hand, 0, -.58, 0); root.add(sh); return sh; };
  P.armL = arm(-1); P.armR = arm(1);
  // 머리
  const head = new T.Group(); head.position.y = 1.64; root.add(head); P.head = head;
  sph(head, .22, skin, 0, 0, 0, .98, 1.08, .94);
  box(head, .036, .036, .04, M(S.skinD || '#c6a58a', .8), 0, -.03, .206 * .94, {});
  [-1, 1].forEach(sd => { const e = new T.Mesh(new T.PlaneGeometry(.095, .12), getEye(S, sd > 0)); e.position.set(sd * .088, .0, .2); e.rotation.y = sd * .22; head.add(e); box(head, .07, .014, .02, hair, sd * .088, .085, .205, { cast: false }).rotation.z = -sd * .12; });
  if (S.glasses) { const gm = M(S.glasses, .4); [-1, 1].forEach(sd => { const r = new T.Mesh(new T.TorusGeometry(.062, .014, 8, 20), gm); r.position.set(sd * .088, .0, .215); r.rotation.y = sd * .22; head.add(r); }); box(head, .05, .012, .012, gm, 0, .025, .22, { cast: false }); [-1, 1].forEach(sd => box(head, .012, .012, .17, gm, sd * .19, .02, .12, { cast: false })); }
  // 머리카락
  const cap = (r, tl, y = 0.01, sz = 1) => { const g = new T.SphereGeometry(r, 22, 14, 0, Math.PI * 2, 0, tl); const m = new T.Mesh(g, hair); m.position.set(0, y, 0); m.scale.set(1, 1.08, .98 * sz); m.castShadow = true; head.add(m); return m; };
  cap(.232, Math.PI * .52, .02);
  if (S.style === 'slick') { box(head, .4, .26, .1, hair, 0, -.03, -.17); }
  else if (S.style === 'long') { box(head, .46, .26, .13, hair, 0, -.04, -.16); box(root, .42, .98, .1, hair, 0, 1.1, -.2); box(head, .06, .46, .13, hair, -.24, -.2, .0); box(head, .06, .46, .13, hair, .24, -.2, .0); box(head, .15, .08, .03, hair, -.09, .13, .215); box(head, .15, .08, .03, hair, .09, .13, .215); }
  else if (S.style === 'messy') { box(head, .42, .22, .1, hair, 0, -.0, -.17); [-.14, 0, .14].forEach((x, i) => { const c = new T.Mesh(new T.ConeGeometry(.06, .17, 6), hair); c.position.set(x, .27, -.01 + i * .01); c.rotation.z = -x * 1.4; head.add(c); }); box(head, .12, .1, .03, hair, -.1, .12, .215); box(head, .1, .08, .03, hair, .09, .12, .215); box(head, .06, .24, .12, hair, -.22, -.06, .01); box(head, .06, .2, .12, hair, .22, -.05, .01); }
  else { box(head, .42, .22, .1, hair, 0, -.01, -.17); box(head, .36, .09, .03, hair, 0, .125, .21); }
  // 무기
  if (S.guandao) {
    const w = new T.Group(); w.position.set(0, -.58, .02); P.armR.add(w);
    cyl(w, .018, .018, 2.1, M('#6e4a28', .6), 0, .45, 0); cyl(w, .022, .022, .08, M('#d9b44a', .3, .7), 0, 1.45, 0);
    const sh = new T.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.28, .06, .34, .42, .12, .62); sh.bezierCurveTo(.2, .38, .12, .2, 0, .16); sh.lineTo(0, 0);
    const bl = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: .02, bevelEnabled: false }), M('#dfe6ec', .25, .8)); bl.position.set(0, 1.5, -.01); bl.rotation.y = 0; bl.castShadow = true; w.add(bl);
    cyl(w, .014, .006, .3, M('#36a86e', .8), .0, 1.28, 0); w.rotation.z = .06; P.weapon = w;
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return root;
}
/* 걷기 · 앉기 · 가만히 서 있기 애니메이션 */
function animHuman(h, t, moving, sp = 1, seated = false) {
  const P = h.userData.P; if (!P) return;
  if (seated) { P.legL.hip.rotation.x = P.legR.hip.rotation.x = -1.5; P.legL.knee.rotation.x = P.legR.knee.rotation.x = 1.5; P.armL.rotation.x = -.9 + Math.sin(t * 9) * .08; P.armR.rotation.x = -.9 + Math.sin(t * 9 + 2) * .08; P.torso.rotation.x = .06; P.head.rotation.x = .2; return; }
  const w = Math.sin(t * 9 * sp), k = moving ? .7 : 0;
  P.legL.hip.rotation.x = w * k; P.legR.hip.rotation.x = -w * k; P.legL.knee.rotation.x = Math.max(0, -w) * k * 1.1; P.legR.knee.rotation.x = Math.max(0, w) * k * 1.1;
  P.armL.rotation.x = -w * k * .8; P.armR.rotation.x = w * k * .8 * (P.weapon ? .25 : 1); if (P.weapon) P.armR.rotation.x = -.08;
  const b = moving ? Math.abs(Math.sin(t * 9 * sp)) * .03 : Math.sin(t * 1.6) * .006; P.torso.position.y = 1.1 + b; P.head.position.y = 1.64 + b; P.head.rotation.x = 0; P.torso.rotation.x = 0;
}

/* ---------- 이 건물의 사람들 ---------- */
const PLAYER = { skin: SKIN, skinD: '#d6b49c', hair: '#1b1c22', style: 'messy', top: '#566763', topL: '#728480', coat: true, inner: '#14151a', bottom: '#1a1b21', shoe: '#0e0f12', hand: '#121317', iris: '#4fa59a', irisD: '#1d4a44', irisL: '#9ee0d2', guandao: true };
const KRITOS = { skin: '#f6e2d2', hair: '#2f5bff', style: 'slick', glasses: '#0b1030', fur: true, jacket: '#1d3fd6', shirt: '#6f90ff', tie: '#15226e', bottom: '#0a0a10', shoe: '#0a0a10', iris: '#3a7cff', irisD: '#14246a', irisL: '#8fc4ff' };
const NPC = [
  { hair: '#2a2f5a', style: 'short', top: '#1c2f6e', shirt: '#e8f0ff', tie: '#38d6ff', iris: '#3a6ad8', irisD: '#142a6a', irisL: '#9ec4ff' },
  { hair: '#8a5a3a', style: 'long', top: '#27408c', shirt: '#ffffff', tie: '#ff7a9a', glasses: '#2a2f55', iris: '#9a5ad8', irisD: '#3a1a6a', irisL: '#e0b8ff', skin: '#fbe4d2' },
  { hair: '#14141c', style: 'short', top: '#20242f', shirt: '#d8e4ff', tie: '#ffd93d', iris: '#3a8a5a', irisD: '#143a24', irisL: '#a0e8b8' },
  { hair: '#d8a0b8', style: 'long', top: '#142a5e', shirt: '#dbe6ff', tie: '#ff6a8a', iris: '#e0507a', irisD: '#6a1a3a', irisL: '#ffb0c8', skin: '#fbe4d2' },
  { hair: '#9aa4c0', style: 'slick', top: '#262e44', shirt: '#eef3ff', tie: '#38d6ff', glasses: '#14141e', iris: '#5a6a8a', irisD: '#1a2038', irisL: '#b8c8e8' },
  { hair: '#3a1a10', style: 'messy', top: '#1c3470', shirt: '#dbe6ff', tie: '#c9a94c', iris: '#d89a3a', irisD: '#6a3a0a', irisL: '#ffd890' },
];
