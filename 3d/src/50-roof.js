/* ==========================================================================
   옥상(RF): 난간 없는 매끄러운 흰색 바닥 · 아래로 길게 내려가는 하얀 건물 외벽 · 고장 난 수신탑
   바닥은 x 8~48, z 7~30 (40×23m)
   ========================================================================== */
function strut(parent, a, b, r, mat) { const d = new T.Vector3().subVectors(b, a), len = d.length(); const m = new T.Mesh(new T.CylinderGeometry(r, r, len, 6), mat); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; parent.add(m); return m; }
function buildTower(parent) {
  const g = new T.Group(); parent.add(g); const st = M('#6b7683', .5, .7), dk = M('#2a313a', .6, .6), rust = M('#6a4328', .9, .3);
  const base = box(g, 3.4, .45, 3.4, M('#9aa3b0', .9), 0, .22, 0); [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([x, z]) => box(g, .14, .1, .14, dk, x, .5, z));
  const H1 = 9, bw = 1.1, tw = .3, pt = (s, y, k) => new T.Vector3(s[0] * lerp(bw, tw, y / H1) * 1, y, s[1] * lerp(bw, tw, y / H1));
  const S = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  S.forEach(s => strut(g, pt(s, .45), pt(s, H1), .07, st));
  for (let y = .45, k = 0; y < H1 - .9; y += 1.5, k++) { const y2 = y + 1.5; S.forEach((s, i) => { const n = S[(i + 1) % 4]; strut(g, pt(s, y), pt(n, y), .035, dk); if (!(k === 3 && i === 1)) { strut(g, pt(s, y), pt(n, y2), .03, st); strut(g, pt(n, y), pt(s, y2), .03, st); } }); }
  for (let i = 0; i < 8; i++) { const r = box(g, .02, .8 + rnd(), .02, rust, rr(-.4, .4), 2 + i, rr(-.4, .4), { cast: false }); }
  // 꺾인 윗부분
  const top = new T.Group(); top.position.set(0, H1, 0); top.rotation.set(.0, 0, -.42); g.add(top); const S2 = [[-.3, -.3], [.3, -.3], [.3, .3], [-.3, .3]];
  S2.forEach(s => strut(top, new T.Vector3(s[0], 0, s[1]), new T.Vector3(s[0] * .5, 3.4, s[1] * .5), .05, st)); for (let y = 0; y < 3.2; y += .8) { S2.forEach((s, i) => { const n = S2[(i + 1) % 4], k1 = 1 - y / 3.4 * .5, k2 = 1 - (y + .8) / 3.4 * .5; strut(top, new T.Vector3(s[0] * k1, y, s[1] * k1), new T.Vector3(n[0] * k2, y + .8, n[1] * k2), .025, st); }); }
  cyl(top, .03, .03, 1.6, dk, 0, 4.2, 0); box(top, 1.3, .08, .08, st, 0, 3.7, 0); cyl(top, .09, .09, .22, M('#3a1212', .3, .2), 0, 5.1, 0);
  box(top, .5, .3, .4, dk, .45, 3.55, .1);
  // 매달린 접시 안테나
  const dish = new T.Mesh(new T.SphereGeometry(.55, 18, 8, 0, Math.PI * 2, 0, .8), M('#c8d0da', .35, .7, { side: T.DoubleSide })); dish.position.set(1.0, 6.6, .3); dish.rotation.set(1.9, .3, .5); dish.castShadow = true; g.add(dish); cyl(g, .01, .01, 1.0, dk, .75, 7.1, .2, { rz: .5 });
  // 늘어진 케이블
  [[new T.Vector3(-.2, 8.6, .1), new T.Vector3(-2, 5, 1.2), new T.Vector3(-1.9, .35, 1.9)], [new T.Vector3(.3, 8.2, -.2), new T.Vector3(2.4, 4, -1.6), new T.Vector3(2.8, .3, -1.2)]].forEach(([a, b, c]) => { const crv = new T.CatmullRomCurve3([a, b, c]); const tube = new T.Mesh(new T.TubeGeometry(crv, 20, .025, 5), M('#101418', .8)); tube.castShadow = true; g.add(tube); });
  box(g, 1.4, .08, .12, dk, 2.6, .12, 2.2, { ry: .4 }); // 떨어진 부품
  // 불꽃: 이음새에서 가끔 튄다
  const spark = new T.PointLight(0xaad7ff, 0, 7, 1.8); spark.position.set(.6, 9.2, .2); g.add(spark); const sm = new T.Mesh(new T.SphereGeometry(.06, 6, 6), new T.MeshBasicMaterial({ color: 0xcfe9ff, toneMapped: false })); sm.position.copy(spark.position); sm.visible = false; g.add(sm);
  return { g, upd: (dt, t) => { const ph = t % 5.3, on = ph < .1 || (ph > .22 && ph < .3); spark.intensity = on ? 30 : 0; sm.visible = on; } };
}
function buildRoof() {
  const m = newMap('roof', '옥상 · RF'); m.bg = 0x040a1a; m.fog = [0x040a1a, 90, 330]; const g = m.g, X0 = 8, X1 = 48, Z0 = 7, Z1 = 30, W = X1 - X0, D = Z1 - Z0, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
  // 하늘의 별 · 저 아래 도시의 불빛
  const sp = []; for (let i = 0; i < 1400; i++) { const a = rnd() * Math.PI * 2, e = rnd() * 1.35 - .1, r = 300; sp.push(cx + Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, cz + Math.sin(a) * Math.cos(e) * r); }
  const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); const stars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })); g.add(stars);
  const cp = [], cc = []; for (let i = 0; i < 2600; i++) { cp.push(cx + rr(-260, 260), rr(-150, -90), cz + rr(-260, 260)); const w = rnd() < .7; cc.push(w ? 1 : .6, w ? .78 : .8, w ? .45 : 1); }
  const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.Float32BufferAttribute(cp, 3)); cg.setAttribute('color', new T.Float32BufferAttribute(cc, 3)); g.add(new T.Points(cg, new T.PointsMaterial({ size: 2.2, vertexColors: true, sizeAttenuation: false, fog: false })));
  // 흰색 바닥(난간 없음) + 건물 외벽
  const slabTex = ctex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f6f9fd'); gr.addColorStop(1, '#e3e9f1'); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '150,165,190'},${Math.random() * .05})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 2); } }, true, 14, 8);
  const slab = box(g, W, .6, D, M(0xffffff, .22, .05, { map: slabTex }), cx, -.3, cz); slab.receiveShadow = true;
  const wallTex = ctex(256, 256, (c, w, h) => { c.fillStyle = '#e9eef5'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 64) { c.fillStyle = 'rgba(120,135,155,.35)'; c.fillRect(x, 0, 1.5, h); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + 2, 0, 1.5, h); } for (let y = 0; y < h; y += 64) { c.fillStyle = 'rgba(120,135,155,.35)'; c.fillRect(0, y, w, 1.5); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(0, y + 2, w, 1.5); } }, true, 14, 40);
  const body = box(g, W, 110, D, M(0xffffff, .55, 0, { map: wallTex }), cx, -55.6, cz); body.castShadow = false;
  const lip = M('#c4ccd7', .4); box(g, W + .2, .22, .2, lip, cx, -.11, Z1 + .02, { cast: false }); box(g, W + .2, .22, .2, lip, cx, -.11, Z0 - .02, { cast: false }); box(g, .2, .22, D, lip, X0 - .02, -.11, cz, { cast: false }); box(g, .2, .22, D, lip, X1 + .02, -.11, cz, { cast: false });
  // 빛
  g.add(new T.HemisphereLight(0x6a86c8, 0x9aa8c0, .7));
  const moon = new T.DirectionalLight(0xaac4ff, 1.5); moon.position.set(cx + 40, 60, cz - 30); moon.target.position.set(cx, 0, cz); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); const sc = moon.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 30; sc.bottom = -30; sc.near = 10; sc.far = 160; moon.shadow.bias = -.0003; g.add(moon); g.add(moon.target);
  // 수신탑
  const tw = buildTower(g); tw.g.position.set(28, 0, 15.4); m.upd.push(tw.upd); col(m, 26.4, 13.8, 29.6, 17); inter(m, 28, 18.2, 3.2, '수신탑', ['수신탑이다. 이미 고장 나 있다. 윗부분이 꺾였고, 접시 안테나는 케이블 하나에 매달려 있다.', '전파는 하나도 들어오지 않는다. 지금은 쓸 수 없다.', '언젠가 이 탑이 필요해질 것이다. 그때까지 이대로 두자.']);
  // 계단실 출입구
  const hut = new T.Group(); hut.position.set(12, 0, 9.2); g.add(hut); box(hut, 3.4, 2.8, 2.2, M('#d4dbe5', .6), 0, 1.4, 0); box(hut, 3.5, .14, 2.3, M('#ffffff', .4), 0, 2.85, 0); const dr = box(hut, 1.3, 2.2, .1, M('#4a5561', .4, .6), 0, 1.1, 1.13); box(hut, .08, .35, .06, M('#c9a94c', .3, .8), .45, 1.0, 1.2); const hs = new T.Mesh(new T.PlaneGeometry(1.2, .3), new T.MeshBasicMaterial({ map: labelTex('STAIRS ▼', '#44e08a', '#04170c', 256, 64, 34), toneMapped: false })); hs.position.set(0, 2.4, 1.2); hut.add(hs); const hl = new T.PointLight(0x44e08a, 3, 5, 1.8); hl.position.set(12, 2.4, 10.8); light(m, hl);
  col(m, 10.3, 8.1, 13.7, 10.3); inter(m, 12, 11.2, 2, '계단실 출입구', () => ask('계단으로 내려갈까?', () => travel('hall', { stairs: 'down', x: 11.2, z: 38.6, yaw: Math.PI }), () => say('…조금 더 있자.')));
  // 가장자리(난간이 없다): 바닥 끝 밖으로는 나갈 수 없다
  col(m, -50, -50, 200, Z0); col(m, -50, Z1, 200, 200); col(m, -50, -50, X0, 200); col(m, X1, -50, 200, 200);
  const edge = ['난간이 없다. 한 걸음만 더 가면 떨어진다.', '저 아래로 리바이어던의 불빛이 점처럼 흩어져 있다.'];
  [['z', p => p.z - Z0 < 1.7], ['z', p => Z1 - p.z < 1.7], ['x', p => p.x - X0 < 1.7], ['x', p => X1 - p.x < 1.7]].forEach(([_, test]) => m.inter.push({ x: cx, z: cz, r: 0, name: '옥상 가장자리', fn: edge, test }));
  m.spawn = { x: 12, z: 12, yaw: 0 };
  return m;
}
