/* ==========================================================================
   복도(100F): 회장실 문 → 엘리베이터 + 계단실 문. 산업·테크니컬. 복도 폭 9m, 길이 36m (x 3~12, z 4~40)
   ========================================================================== */
function plateTex() { return ctex(256, 256, (g, w, h) => { g.fillStyle = '#262d36'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 64, y = j * 64, k = .88 + Math.random() * .2; g.fillStyle = mix('#2c343e', k); g.fillRect(x + 1, y + 1, 62, 62); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 1, y + 1, 62, 1); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, y, 1, 64); g.fillRect(x, y, 64, 1); [[5, 5], [57, 5], [5, 57], [57, 57]].forEach(([a, b]) => { g.fillStyle = '#4a5663'; g.fillRect(x + a, y + b, 3, 3); }); if ((i * 3 + j) % 5 === 0) { g.fillStyle = '#14181d'; g.fillRect(x + 12, y + 12, 40, 40); for (let k2 = 0; k2 < 8; k2++) { g.fillStyle = '#2f3a45'; g.fillRect(x + 14, y + 14 + k2 * 5, 36, 1.5); } } } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},${Math.random() * .06})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 1); } }, true, 9, 36); }
function hazardTex() { return ctex(64, 64, (g, w, h) => { g.fillStyle = '#14110a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9a21b'; for (let i = -h; i < w + h; i += 32) { g.beginPath(); g.moveTo(i, h); g.lineTo(i + 16, h); g.lineTo(i + 16 + h, 0); g.lineTo(i + h, 0); g.fill(); } }, true, 1, 1); }
function labelTex(text, color = '#ffb84a', bg = '#05080b', w = 256, h = 64, size = 34) { return ctex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = color; g.font = `700 ${size}px "Share Tech Mono", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = color; g.shadowBlur = 8; g.fillText(text, w / 2, h / 2 + 2); }); }
function elevatorDoors(parent, x, z, floorLabel, acc, ry = 0) {
  const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  box(g, 4.6, 3.9, .5, M('#12161b', .5, .6), 0, 1.95, 0); box(g, 4.2, .1, .52, new T.MeshStandardMaterial({ map: hazardTex(), roughness: .6 }), 0, 3.95, 0);
  const disp = new T.Mesh(new T.PlaneGeometry(3.4, .8), new T.MeshBasicMaterial({ map: labelTex(floorLabel, acc, '#05080b', 256, 64, 40), toneMapped: false })); disp.position.set(0, 3.45, .27); g.add(disp);
  const dm = M('#59636d', .35, .85); const dl = box(g, 1.7, 2.9, .12, dm, -.86, 1.45, .22), dr = box(g, 1.7, 2.9, .12, dm, .86, 1.45, .22); box(g, .05, 2.9, .13, M('#05080b'), 0, 1.45, .23);
  box(g, .22, .5, .08, M('#0a0d11'), 2.05, 1.5, .27); box(g, .1, .1, .04, E(0xffb84a), 2.05, 1.62, .32);
  g.userData = { dl, dr, open: 0, target: 0 }; return g;
}
function buildHall() {
  const m = newMap('hall', '복도 · 100F'); m.bg = 0x07090c; m.fog = [0x07090c, 18, 60]; const g = m.g, X0 = 3, X1 = 12, Z0 = 4, Z1 = 40, H = 4.4, cx = 7.5, cz = 22;
  plane(g, X1 - X0, Z1 - Z0, M(0xffffff, .45, .5, { map: plateTex() }), cx, 0, cz, -Math.PI / 2);
  const hz = new T.MeshStandardMaterial({ map: hazardTex(), roughness: .7 }); [X0 + .14, X1 - .14].forEach(x => { const t = hazardTex(); t.repeat.set(.5, 36); box(g, .28, .02, Z1 - Z0, new T.MeshStandardMaterial({ map: t, roughness: .7 }), x, .012, cz, { cast: false }); });
  for (let z = Z0 + 1; z < Z1; z += 1.8) box(g, .12, .014, .6, M('#c9a94c', .4, .6, { emissive: 0x3a2c08, emissiveIntensity: .8 }), cx, .014, z, { cast: false });
  // 벽(안쪽) + 배관 · 케이블 트레이 · 벽등
  const wm = M('#1d242c', .6, .5); [[X0, Z0, X0, Z1], [X1, Z0, X1, Z1], [X0, Z0, X1, Z0], [X0, Z1, X1, Z1]].forEach(([ax, az, bx, bz]) => wallPlane(g, ax, az, bx, bz, H, wm, cx, cz));
  for (let z = Z0 + 1; z < Z1; z += 3) { [X0 + .02, X1 - .02].forEach((x, i) => box(g, .05, 1.3, 2.7, M('#2c3640', .5, .6), x + (i ? -.02 : .02), 1.3, z + 1.1, { cast: false })); }
  [X0 + .35, X1 - .35].forEach((x, i) => { cyl(g, .13, .13, H, M('#3a4651', .35, .8), x + (i ? -.1 : .1), H / 2, cz + 0, { seg: 12 }).scale.set(1, 1, 1); g.children[g.children.length - 1].geometry = new T.CylinderGeometry(.13, .13, H, 12); for (let z = Z0 + 2; z < Z1; z += 4) cyl(g, .18, .18, .16, M('#59636d', .4, .8), x + (i ? -.1 : .1), 2 + (z % 3), z, { seg: 12 }); const pp = cyl(g, .12, .12, Z1 - Z0, M('#2a323b', .4, .7), x + (i ? -.35 : .35), 3.6, cz, { rx: Math.PI / 2, seg: 12 }); const tray = box(g, .5, .1, Z1 - Z0, M('#59636d', .5, .6), x + (i ? -.5 : .5), 3.1, cz); });
  // 천장 + 조명띠
  plane(g, X1 - X0, Z1 - Z0, M('#0e1216', .8, .3), cx, H, cz, Math.PI / 2);
  for (let z = Z0 + 2.5; z < Z1; z += 5) { box(g, 3.4, .1, .5, E(0xcfe0ff, 2.4), cx, H - .06, z, { cast: false }); const pl = new T.PointLight(0xbcd0ff, 11, 11, 1.6); pl.position.set(cx, H - .5, z); light(m, pl); }
  g.add(new T.HemisphereLight(0x8aa0c8, 0x1a1a22, .55));
  // 아래·위 끝 벽 + 문들
  const doorMat = M('#27303a', .45, .6);
  const office = new T.Group(); office.position.set(cx, 0, Z0 + .05); g.add(office); box(office, 4.4, 3.5, .2, M('#07090c'), 0, 1.75, 0); box(office, 2, 3.2, .16, doorMat, -1.05, 1.6, .06); box(office, 2, 3.2, .16, doorMat, 1.05, 1.6, .06); box(office, .08, .3, .08, M('#f1dc8c', .3, .8), -.2, 1.5, .16); box(office, .08, .3, .08, M('#f1dc8c', .3, .8), .2, 1.5, .16);
  const sign = new T.Mesh(new T.PlaneGeometry(2.6, .5), new T.MeshBasicMaterial({ map: labelTex('CHAIRMAN · 100F', '#c9a94c', '#05080b', 320, 56, 26), toneMapped: false })); sign.position.set(0, 3.75, .12); office.add(sign);
  inter(m, cx, Z0 + 1.3, 2.6, '회장실 문', null); m.inter[m.inter.length - 1].fn = () => ask('회장실로 돌아갈까?', () => travel('office', { x: 24, z: 31.2, yaw: Math.PI }), () => say('…조금 더 둘러보자.'));
  const ed = elevatorDoors(g, cx, Z1 - .25, '100F', '#ffb84a', Math.PI); m.elev = ed; col(m, X0, Z1 - .3, X1, Z1 + 1);
  inter(m, cx, Z1 - 1.4, 2.8, '엘리베이터', () => openElev(100)); inter(m, X0 + 1.4, Z1 - 1.4, 1.2, '호출 단말', () => openElev(100));
  box(g, .4, .9, .12, M('#0b0e12'), X0 + .35, 1.2, Z1 - 1.4, {}); box(g, .12, .12, .05, E(0xffb84a), X0 + .35, 1.45, Z1 - 1.33);
  // 계단실 문(엘리베이터 바로 옆)
  const sd = new T.Group(); sd.position.set(10.9, 0, Z1 - .08); sd.rotation.y = Math.PI; g.add(sd); box(sd, 1.8, 3.2, .2, M('#12161b'), 0, 1.6, 0); box(sd, 1.4, 2.7, .12, M('#3a444f', .4, .7), 0, 1.35, .1); box(sd, .1, .5, .06, M('#c9a94c', .3, .8), .45, 1.25, .2);
  const ss = new T.Mesh(new T.PlaneGeometry(1.5, .4), new T.MeshBasicMaterial({ map: labelTex('STAIRS ▲', '#44e08a', '#04170c', 256, 64, 34), toneMapped: false })); ss.position.set(0, 3.0, .12); sd.add(ss); const gl = new T.PointLight(0x44e08a, 5, 5, 1.8); gl.position.set(10.9, 2.6, Z1 - 1); light(m, gl);
  inter(m, 10.9, Z1 - 1.4, 1.8, '계단실 문', () => ask('계단으로 옥상에 올라갈까?', () => travel('roof', { stairs: 'up', x: 12, z: 12, yaw: Math.PI * 0, first: true }), () => say('…나중에 올라가 보자.')));
  // 옆 문들(잠긴 방)
  const sides = [[X0, 9, 'LAB-101', ['잠긴 방이다. 이 층의 방은 전부 내 소유다.', '지금은 열 일이 없다.'], 1], [X0, 17, 'ARCH-102', ['기록 보관실이다. 필요한 문서는 이미 내 책상에 올라와 있다.'], 1], [X0, 25, 'SRV-103', ['서버실이다. 안쪽에서 낮은 팬 소리가 들린다. 조직의 숨소리다.'], 1], [X1, 9, 'OPS-201', ['작전실이다. 호출 전까지는 비어 있다.'], -1], [X1, 17, 'LNK-202', ['통신 중계실이다. 사령관들의 회선이 이곳을 지난다.'], -1], [X1, 25, 'STK-203', ['자재 창고다. 문은 내 인증으로만 열린다. 오늘은 열지 않는다.'], -1]];
  sides.forEach(([x, z, label, txt, dir]) => { const d = new T.Group(); d.position.set(x + dir * .08, 0, z); d.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(d); box(d, 2.2, 3, .16, M('#06080a'), 0, 1.5, 0); box(d, 1.9, 2.7, .12, M('#27303a', .45, .6), 0, 1.35, .06); box(d, .08, .4, .06, M('#f1dc8c', .3, .8), .6, 1.3, .14); const lb = new T.Mesh(new T.PlaneGeometry(1.2, .3), new T.MeshBasicMaterial({ map: labelTex(label, '#ffb84a', '#05080b', 256, 64, 34), toneMapped: false })); lb.position.set(0, 2.85, .1); d.add(lb); inter(m, x + dir * 1.1, z, 1.8, label, txt); });
  box(g, .5, 1.6, .6, M('#0b0e12'), X0 + .45, 1.0, 13.2); const ts = new T.Mesh(new T.PlaneGeometry(.4, .9), new T.MeshBasicMaterial({ map: monitorTex(null, '#38d6ff', '#38d6ff', '#05161c'), toneMapped: false })); ts.rotation.y = Math.PI / 2; ts.position.set(X0 + .73, 1.25, 13.2); g.add(ts); inter(m, X0 + 1.2, 13.2, 1.6, '복도 단말기', ['층별 상태가 표시되는 복도 단말기다.', '100F — 내 층은 정상. 95F — 사무층도 정상 가동 중이다.']);
  cyl(g, .13, .13, .5, M('#a3241c', .5), X1 - .5, .35, 21.6); inter(m, X1 - 1.2, 21.6, 1.4, '소화기', ['소화기다. 쓸 일이 없기를 바란다.']);
  box(g, 1.8, 1.2, 1.2, M('#2a313a', .5, .5), X0 + 1.2, .6, 30.6); box(g, 1.8, .2, 1.2, new T.MeshStandardMaterial({ map: hazardTex(), roughness: .7 }), X0 + 1.2, .85, 30.6); col(m, X0 + .3, 30, X0 + 2.1, 31.2); inter(m, X0 + 2.6, 30.6, 2, '보급 상자', ['보급 상자다. 내가 직접 서명한 봉인이 그대로 붙어 있다.']);
  col(m, -1, -1, X0, 60); col(m, X1, -1, 20, 60); col(m, -1, -1, 20, Z0); m.bounds = { x0: X0 + .6, x1: X1 - .6, z0: Z0 + .3, z1: Z1 - .3, camX0: X0 + .8, camX1: X1 - .8, camZ0: Z0 + .8, camZ1: Z1 + 3 };
  m.spawn = { x: 7.5, z: 5.4, yaw: 0 };
  return m;
}
