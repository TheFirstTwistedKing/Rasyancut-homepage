#!/usr/bin/env node
/* 로블록스 스튜디오용 플레이스 파일(roblox/Rasyancut.rbxlx) 생성기.
   - roblox/src/*.lua (월드·UI 스크립트) + index.html 의 공지·사령관 목록 + data/cmd/* (대화 데이터)를 한 파일로 묶는다.
   사용법: node tools/build-roblox.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// ── 공지 · 사령관 목록 추출
function grab(startMarker, endMarker) {
  const a = html.indexOf(startMarker); if (a < 0) throw new Error('못 찾음: ' + startMarker);
  const b = html.indexOf(endMarker, a); return html.slice(a + startMarker.length, b);
}
const notices = vm.runInNewContext('[' + grab('const NOTICES = [', '\n];') + ']').map(n => {
  const lines = [];
  (function walk(v, sub) { if (Array.isArray(v)) v.forEach(x => walk(x, true)); else lines.push((sub && lines.length ? '· ' : '') + String(v)); })(n.body);
  return { id: n.id, tag: n.tag, date: n.date, title: n.title, lines };
});
const meta = vm.runInNewContext('[' + grab('commanders: [', '\n  ],') + ']').map(c => ({ id: c.id, ko: c.ko, sn: c.sn, dept: c.dept, tone: c.tone, oracle: c.mode === 'oracle' }));

// ── 대화 데이터
global.window = {};
fs.readdirSync(path.join(root, 'data/cmd')).filter(f => f.endsWith('.js')).forEach(f => require(path.join(root, 'data/cmd', f)));
const CMD = window.CMD_DATA;

// ── XML
let ref = 0;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cdata = s => '<![CDATA[' + String(s).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>';
const item = (cls, name, props, kids) => `<Item class="${cls}" referent="RBX${ref++}"><Properties><string name="Name">${esc(name)}</string>${props || ''}</Properties>${(kids || []).join('')}</Item>`;
const src = s => `<ProtectedString name="Source">${cdata(s)}</ProtectedString>`;
const script = (cls, name, code) => item(cls, name, src(code));
const lua = f => fs.readFileSync(path.join(root, 'roblox/src', f), 'utf8');
const jsonModule = obj => {
  const j = JSON.stringify(obj);
  if (j.includes(']==]')) throw new Error('JSON 안에 ]==] 가 있어요');
  return `local H = game:GetService("HttpService")\nreturn H:JSONDecode([==[${j}]==])\n`;
};

const cmdFolders = Object.keys(CMD).map(id => item('Folder', id, '', Object.keys(CMD[id]).map(t => script('ModuleScript', t, jsonModule(CMD[id][t])))));
const dataFolder = item('Folder', 'RSC_Data', '', [
  script('ModuleScript', 'Meta', jsonModule(meta)),
  script('ModuleScript', 'Notices', jsonModule(notices)),
  item('Folder', 'Cmd', '', cmdFolders),
]);

const xml = `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
<Meta name="ExplicitAutoJoints">true</Meta>
${item('Workspace', 'Workspace', '')}
${item('Lighting', 'Lighting', '')}
${item('ReplicatedStorage', 'ReplicatedStorage', '', [dataFolder])}
${item('ServerScriptService', 'ServerScriptService', '', [script('Script', 'World', lua('World.server.lua'))])}
${item('StarterGui', 'StarterGui', '')}
${item('StarterPlayer', 'StarterPlayer', '', [item('StarterPlayerScripts', 'StarterPlayerScripts', '', [script('LocalScript', 'Client', lua('Client.client.lua'))])])}
</roblox>
`;
const out = path.join(root, 'roblox/Rasyancut.rbxlx');
fs.writeFileSync(out, xml);
console.log('생성:', path.relative(root, out), (xml.length / 1048576).toFixed(2) + 'MB', '· 공지', notices.length, '· 사령관', meta.length, '· 모듈', cmdFolders.length ? Object.values(CMD).reduce((a, c) => a + Object.keys(c).length, 0) : 0);
