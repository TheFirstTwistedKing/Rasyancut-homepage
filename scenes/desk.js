/* ==========================================================================
   신호 III — 컴퓨터 바탕화면(디자인). 파일을 두 번 누르면 사령관 인사 기록 창(문서는 아직 없음), '돌아가기' 앱으로 관측소 복귀
   ========================================================================== */
const Desk = (() => {
  const view = $('#scDesk'), icons = $('#dIcons'), wins = $('#dWins'), menu = $('#dMenu'), tasks = $('#dTasks'), cv = $('#dCv'), g = cv.getContext('2d');
  let tm = [], z = 10, n = 0, lastTap = { id: '', t: 0, x: 0, y: 0 };
  const GL = {
    pc: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/><path d="M6 8h6M6 11h9"/></svg>',
    bin: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/></svg>',
    cfg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><circle cx="12" cy="12" r="2.2"/><path d="M8.5 18c.8-2.2 2.2-3 3.5-3s2.7.8 3.5 3"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15h6M9 18h4"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M10 6l-6 6 6 6"/><path d="M4 12h12a4 4 0 0 1 4 4v3"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  };
  const CMDS = CONFIG.commanders;
  const ICONS = [
    { id: 'pc', name: '내 컴퓨터', g: 'pc', info: ['내 컴퓨터', '저장 장치와 연결된 구역이 표시되는 곳입니다.\n지금은 열람할 수 있는 항목이 없습니다.'] },
    { id: 'bin', name: '휴지통', g: 'bin', info: ['휴지통', '비어 있습니다.'] },
    { id: 'note', name: '메모', g: 'note', info: ['메모', '아직 작성된 메모가 없습니다.'] },
    { id: 'cfg', name: '설정', g: 'cfg', info: ['설정', '이 단말의 설정은 잠겨 있습니다.'] },
    { id: 'file', name: '사령관 인사 기록', g: 'file', open: 'files' },
    { id: 'back', name: '돌아가기', g: 'back', app: true, open: 'return' },
  ];
  function drawWall() {
    const dpr = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect(), W = r.width, H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = g.createRadialGradient(W * .62, H * .42, 0, W * .62, H * .42, Math.max(W, H) * .8); bg.addColorStop(0, '#2a2008'); bg.addColorStop(.45, '#0f0c05'); bg.addColorStop(1, '#030302'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // 육각 격자(홀로그램)
    g.strokeStyle = 'rgba(201,169,76,.07)'; g.lineWidth = 1; const s = 38, hh = s * Math.sqrt(3) / 2;
    for (let row = -1; row < H / hh + 1; row++) for (let col = -1; col < W / (s * 1.5) + 1; col++) { const x = col * s * 1.5, y = row * hh * 1 + (col % 2 ? hh / 2 : 0); g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, px = x + Math.cos(a) * s * .5, py = y + Math.sin(a) * s * .5; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.stroke(); }
    // 큰 문장(동심원 + 눈금)
    const cx = W * .66, cy = H * .46, R = Math.min(W, H) * .3; g.strokeStyle = 'rgba(233,216,166,.22)';
    [1, .86, .62, .4].forEach((k, i) => { g.lineWidth = i ? 1 : 2; g.setLineDash(i === 2 ? [3, 7] : []); g.beginPath(); g.arc(cx, cy, R * k, 0, 7); g.stroke(); }); g.setLineDash([]);
    for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2, L = i % 8 ? 6 : 16; g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * (R + L), cy + Math.sin(a) * (R + L)); g.stroke(); }
    g.fillStyle = 'rgba(255,217,61,.18)'; g.beginPath(); g.moveTo(cx, cy - R * .3); g.lineTo(cx + R * .22, cy); g.lineTo(cx, cy + R * .3); g.lineTo(cx - R * .22, cy); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,243,166,.5)'; g.stroke();
    g.textAlign = 'right'; g.font = `800 ${Math.max(20, Math.min(34, W * .028))}px Cinzel,serif`; g.fillStyle = 'rgba(233,216,166,.22)'; g.fillText('FOUNDER  TERMINAL', W - 28, H - 76); g.font = '11px "Share Tech Mono",monospace'; g.fillStyle = 'rgba(233,216,166,.3)'; g.fillText('LEVIATHAN  //  INTERNAL  NETWORK', W - 28, H - 58);
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  /* ---------- 창 ---------- */
  function openWin(id, title, build, opt = {}) {
    let w = $(`.d-win[data-id="${id}"]`, wins);
    if (w) { focus(w); return w; }
    w = document.createElement('div'); w.className = 'd-win'; w.dataset.id = id;
    const W = Math.min(opt.w || 560, view.clientWidth - 12), Hh = Math.min(opt.h || 380, view.clientHeight - 76);
    w.style.width = W + 'px'; w.style.height = Hh + 'px'; w.style.left = Math.max(6, (view.clientWidth - W) / 2 + (n % 5) * 22 - 40) + 'px'; w.style.top = Math.max(6, (view.clientHeight - 52 - Hh) / 2 + (n % 5) * 18 - 30) + 'px'; n++;
    w.innerHTML = `<div class="d-tb"><span></span><button type="button" aria-label="닫기">✕</button></div>`; $('.d-tb span', w).textContent = title;
    const body = build(w); w.appendChild(body);
    wins.appendChild(w); focus(w); SND._t(740, .08, 'triangle', .04); SND._t(1110, .1, 'triangle', .03, .05);
    const tb = $('.d-tb', w); let drag = null;
    tb.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; focus(w); drag = { x: e.clientX - w.offsetLeft, y: e.clientY - w.offsetTop }; tb.setPointerCapture(e.pointerId); });
    tb.addEventListener('pointermove', e => { if (!drag) return; w.style.left = Math.max(-w.offsetWidth + 80, Math.min(view.clientWidth - 80, e.clientX - drag.x)) + 'px'; w.style.top = Math.max(0, Math.min(view.clientHeight - 90, e.clientY - drag.y)) + 'px'; });
    tb.addEventListener('pointerup', () => { drag = null; });
    w.addEventListener('pointerdown', () => focus(w));
    $('button', tb).addEventListener('click', () => closeWin(w));
    const tk = document.createElement('button'); tk.type = 'button'; tk.className = 'd-task'; tk.dataset.id = id; tk.textContent = title; tk.addEventListener('click', () => focus(w)); tasks.appendChild(tk); focus(w);
    return w;
  }
  function focus(w) { z++; w.style.zIndex = z; $$('.d-win', wins).forEach(x => x.classList.toggle('top', x === w)); $$('.d-task', tasks).forEach(t => t.classList.toggle('on', t.dataset.id === w.dataset.id)); }
  function closeWin(w) { const t = $(`.d-task[data-id="${w.dataset.id}"]`, tasks); if (t) t.remove(); w.remove(); SND._t(520, .08, 'triangle', .04); }
  function infoWin(it) {
    openWin(it.id, it.info[0], () => { const b = document.createElement('div'); b.className = 'd-body'; b.style.whiteSpace = 'pre-line'; b.textContent = it.info[1]; return b; }, { w: 360, h: 190 });
  }
  /* 사령관 인사 기록: 사령관별 문서 자리(문서 내용은 아직 없음) */
  function filesWin() {
    openWin('files', '사령관 인사 기록', () => {
      const root = document.createElement('div'); root.style.cssText = 'display:flex;flex-direction:column;min-height:0;flex:1';
      root.innerHTML = '<div class="d-files"><div class="d-side"><div class="on">사령관 문서</div><div>보관함</div><div>열람 기록</div></div><div class="d-list" id="dList"></div></div><div class="d-stat" id="dStat"></div>';
      const list = $('#dList', root), stat = $('#dStat', root);
      CMDS.forEach(c => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'd-doc'; b.dataset.id = c.id; b.innerHTML = `<span class="g">${GL.doc}</span><span><b></b><small></small></span>`;
        $('b', b).textContent = c.sn; $('small', b).textContent = c.id === 'sender' ? '소속 불명' : c.dept;
        b.addEventListener('click', () => { $$('.d-doc', list).forEach(x => x.classList.toggle('sel', x === b)); stat.textContent = c.ko + ' · 문서가 아직 작성되지 않았습니다'; SND.tick(); });
        b.addEventListener('dblclick', () => { openDoc(c); });
        list.appendChild(b);
      });
      stat.textContent = CMDS.length + '개 항목';
      return root;
    }, { w: 640, h: 420 });
  }
  function openDoc(c) { openWin('doc-' + c.id, c.sn, () => { const b = document.createElement('div'); b.className = 'd-body'; b.innerHTML = '<p style="margin:0 0 8px;color:var(--yellow);font-family:var(--f-mono);letter-spacing:.14em;font-size:12px">PERSONNEL FILE</p><p style="margin:0">문서가 아직 작성되지 않았습니다.</p>'; return b; }, { w: 340, h: 200 }); }
  function activate(it) {
    SND.click();
    if (it.open === 'return') { Scenes.leaveDesk(); return; }
    if (it.open === 'files') { filesWin(); return; }
    infoWin(it);
  }
  /* 아이콘: 한 번 누르면 선택, 두 번 누르면(더블클릭 · 더블탭) 열림. '돌아가기' 앱은 한 번 눌러도 열림 */
  function buildIcons() {
    icons.innerHTML = '';
    ICONS.forEach(it => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'd-ic' + (it.app ? ' app' : ''); b.dataset.id = it.id; b.innerHTML = `<span class="g">${GL[it.g]}</span><span></span>`; $('span:last-child', b).textContent = it.name;
      b.addEventListener('click', e => {
        $$('.d-ic', icons).forEach(x => x.classList.toggle('sel', x === b));
        if (it.app) { activate(it); return; }
        const now = performance.now(), same = lastTap.id === it.id && now - lastTap.t < 420 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 26;
        if (same) { lastTap = { id: '', t: 0, x: 0, y: 0 }; activate(it); } else { lastTap = { id: it.id, t: now, x: e.clientX, y: e.clientY }; SND.tick(); }
      });
      b.addEventListener('keydown', e => { if (e.key === 'Enter') activate(it); });
      icons.appendChild(b);
    });
  }
  function buildMenu() {
    menu.innerHTML = ''; ICONS.forEach(it => { if (it.id === 'back') return; const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<span class="g">${GL[it.g]}</span><span></span>`; $('span:last-child', b).textContent = it.name; b.addEventListener('click', () => { menu.hidden = true; $('#dStart').classList.remove('on'); activate(it); }); menu.appendChild(b); });
    menu.appendChild(document.createElement('hr')); const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<span class="g">${GL.back}</span><span>돌아가기</span>`; b.addEventListener('click', () => { menu.hidden = true; Scenes.leaveDesk(); }); menu.appendChild(b);
  }
  const clock = () => { const d = new Date(); $('#dClock').textContent = d.toTimeString().slice(0, 5); };
  $('#dStart').addEventListener('click', e => { e.stopPropagation(); SND.click(); menu.hidden = !menu.hidden; $('#dStart').classList.toggle('on', !menu.hidden); });
  view.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('#dMenu, #dStart')) { menu.hidden = true; $('#dStart').classList.remove('on'); } if (!e.target.closest('.d-ic, .d-win, #dMenu')) $$('.d-ic', icons).forEach(x => x.classList.remove('sel')); });
  addEventListener('resize', () => { if (view.classList.contains('on')) drawWall(); });
  return {
    enter() { wins.innerHTML = ''; tasks.innerHTML = ''; menu.hidden = true; $('#dStart').classList.remove('on'); n = 0; z = 10; buildIcons(); buildMenu(); drawWall(); clock(); tm.push(setInterval(clock, 10000)); },
    leave() { tm.forEach(clearInterval); tm = []; wins.innerHTML = ''; tasks.innerHTML = ''; },
  };
})();
