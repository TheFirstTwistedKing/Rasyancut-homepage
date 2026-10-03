-- 라시안컷 3D 월드 (서버): 회장실(100F) · 복도 · 95층 · 옥상 + 이동 연출 · 크리토스 퀘스트
-- 웹 3D 버전(3d/)과 같은 배치. 1m = 3.6 스터드. x 동쪽, z 남쪽.
local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local RS = game:GetService("ReplicatedStorage")
local TS = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local S = 3.6
local ORIGIN = {
	office = Vector3.new(0, 0, 0),
	hall = Vector3.new(1500, 0, 0),
	f95 = Vector3.new(3000, 0, 0),
	roof = Vector3.new(4500, 0, 0),
}
local MAT = Enum.Material
local function C(h) return Color3.fromHex(h) end
local GOLD, PALE = C("#c9a94c"), C("#f1dc8c")

---------------------------------------------------------------- 환경
Lighting.ClockTime = 0
Lighting.Brightness = 0.6
Lighting.Ambient = Color3.fromRGB(46, 42, 52)
Lighting.OutdoorAmbient = Color3.fromRGB(46, 42, 52)
Lighting.GlobalShadows = true
Lighting.ExposureCompensation = 0.1
do
	local sky = Instance.new("Sky")
	sky.StarCount = 3000
	sky.CelestialBodiesShown = false
	sky.Parent = Lighting
end

---------------------------------------------------------------- 리모트
local remotes = Instance.new("Folder")
remotes.Name = "RSC_Remotes"
remotes.Parent = RS
local function remote(n)
	local r = Instance.new("RemoteEvent")
	r.Name = n
	r.Parent = remotes
	return r
end
local Say, SayDone, Fx, Elev, ElevPick = remote("Say"), remote("SayDone"), remote("Fx"), remote("Elev"), remote("ElevPick")
local Ask, AskReply, Quest = remote("Ask"), remote("AskReply"), remote("Quest")

---------------------------------------------------------------- 도우미
local function newMap(name)
	local m = Instance.new("Model")
	m.Name = "Map_" .. name
	m.Parent = workspace
	return { name = name, model = m, o = ORIGIN[name], upd = {} }
end

-- 미터 단위로 크기·중심 좌표를 받는다.
local function P(map, sx, sy, sz, cx, cy, cz, color, mat, tr)
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = Vector3.new(sx * S, sy * S, sz * S)
	p.Position = map.o + Vector3.new(cx * S, cy * S, cz * S)
	p.Color = color
	p.Material = mat or MAT.SmoothPlastic
	p.Transparency = tr or 0
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = map.model
	return p
end
local function deco(p) -- 충돌 없는 장식
	p.CanCollide = false
	p.CastShadow = false
	return p
end
local function glow(map, sx, sy, sz, cx, cy, cz, color)
	return deco(P(map, sx, sy, sz, cx, cy, cz, color, MAT.Neon))
end
local function cylinder(map, d, h, cx, cy, cz, color, mat)
	local p = P(map, h, d, d, cx, cy, cz, color, mat)
	p.Shape = Enum.PartType.Cylinder
	p.Orientation = Vector3.new(0, 0, 90)
	return p
end
local function ball(map, d, cx, cy, cz, color, mat)
	local p = P(map, d, d, d, cx, cy, cz, color, mat)
	p.Shape = Enum.PartType.Ball
	return p
end
local function lamp(map, cx, cy, cz, color, br, range)
	local a = deco(P(map, 0.2, 0.2, 0.2, cx, cy, cz, color, MAT.Neon, 1))
	local l = Instance.new("PointLight")
	l.Color = color
	l.Brightness = br
	l.Range = range
	l.Parent = a
	return l
end
local function label(part, face, text, color, bg, size)
	local g = Instance.new("SurfaceGui")
	g.Face = face
	g.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	g.PixelsPerStud = 40
	g.LightInfluence = 0
	g.Parent = part
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundColor3 = bg
	t.BorderSizePixel = 0
	t.Text = text
	t.TextColor3 = color
	t.Font = Enum.Font.Code
	t.TextScaled = true
	t.Parent = g
	return g
end
local function prompt(part, action, obj, fn, dist)
	local pp = Instance.new("ProximityPrompt")
	pp.ActionText = action
	pp.ObjectText = obj
	pp.MaxActivationDistance = dist or 11
	pp.HoldDuration = 0
	pp.RequiresLineOfSight = false
	pp.Parent = part
	pp.Triggered:Connect(fn)
	return pp
end

---------------------------------------------------------------- 대화 · 선택 · 이동
local pendingSay, pendingAsk, busy = {}, {}, {}
local function say(plr, name, lines, cb)
	pendingSay[plr] = cb
	Say:FireClient(plr, name or "", lines)
end
SayDone.OnServerEvent:Connect(function(plr)
	local cb = pendingSay[plr]
	pendingSay[plr] = nil
	if cb then cb(plr) end
end)
local function ask(plr, text, yes, noText)
	pendingAsk[plr] = { yes = yes, noText = noText }
	Ask:FireClient(plr, text)
end
AskReply.OnServerEvent:Connect(function(plr, ok)
	local a = pendingAsk[plr]
	pendingAsk[plr] = nil
	if not a then return end
	if ok == true then
		a.yes(plr)
	elseif a.noText then
		say(plr, "", { a.noText })
	end
end)

local SPAWN = {
	office = { 24, 28, 0, -1 },
	hall = { 7.5, 6.6, 0, 1 },
}
local function placeAt(plr, mapName, x, z, lx, lz)
	local ch = plr.Character
	local hrp = ch and ch:FindFirstChild("HumanoidRootPart")
	if not hrp then return end
	local pos = ORIGIN[mapName] + Vector3.new(x * S, 4.5, z * S)
	hrp.CFrame = CFrame.lookAt(pos, pos + Vector3.new(lx, 0, lz))
	hrp.AssemblyLinearVelocity = Vector3.zero
	plr:SetAttribute("Map", mapName)
	plr:SetAttribute("Spawn", mapName .. "|" .. x .. "|" .. z .. "|" .. lx .. "|" .. lz)
end
-- kind: "fade" | "ride"(a→b층) | "stairs"("up"/"down")
local function travel(plr, dest, x, z, lx, lz, kind, a, b, after)
	if busy[plr] then return end
	busy[plr] = true
	local dur = 0.55
	if kind == "ride" then
		dur = 0.45 + (math.abs(b - a) + 1) * 0.17 + 0.6
	elseif kind == "stairs" then
		dur = 0.45 + 16 * 0.19 + 0.4
	end
	Fx:FireClient(plr, kind, a, b)
	task.spawn(function()
		task.wait(dur)
		placeAt(plr, dest, x, z, lx, lz)
		Fx:FireClient(plr, "done")
		task.wait(1)
		busy[plr] = nil
		if after then after(plr) end
	end)
end

local questOn = {}
local function giveQuest(plr)
	if questOn[plr] then return end
	questOn[plr] = true
	Quest:FireClient(plr, true)
end

---------------------------------------------------------------- 방 만들기 공통
local function room(map, W, D, H, floorColor, floorMat, wallColor, wallMat, ceilColor)
	P(map, W + 2, 0.6, D + 2, W / 2, -0.3, D / 2, floorColor, floorMat)
	P(map, W + 1, H, 0.5, W / 2, H / 2, -0.25, wallColor, wallMat)
	P(map, W + 1, H, 0.5, W / 2, H / 2, D + 0.25, wallColor, wallMat)
	P(map, 0.5, H, D, -0.25, H / 2, D / 2, wallColor, wallMat)
	P(map, 0.5, H, D, W + 0.25, H / 2, D / 2, wallColor, wallMat)
	P(map, W + 1, 0.5, D + 1, W / 2, H + 0.25, D / 2, ceilColor, MAT.SmoothPlastic)
end
local function inspect(map, cx, cy, cz, obj, lines, dist)
	local a = deco(P(map, 0.5, 0.5, 0.5, cx, cy, cz, C("#000000"), nil, 1))
	prompt(a, "조사", obj, function(plr) say(plr, "", lines) end, dist or 9)
	return a
end
local function elevatorDoors(map, cx, cz, floorLabel, accent, facing) -- facing: 1 = 북쪽(-z)을 바라봄(남쪽 벽), -1 = 남쪽을 바라봄
	local f = facing
	local frame = P(map, 4.6, 3.9, 0.5, cx, 1.95, cz, C("#12161b"), MAT.Metal)
	glow(map, 4.2, 0.1, 0.52, cx, 3.95, cz, C("#d9a21b"))
	local disp = P(map, 3.4, 0.8, 0.1, cx, 3.45, cz - f * 0.28, C("#05080b"))
	disp.CanCollide = false
	label(disp, f == 1 and Enum.NormalId.Front or Enum.NormalId.Back, floorLabel, accent, C("#05080b"))
	local dl = P(map, 1.7, 2.9, 0.12, cx - 0.86, 1.45, cz - f * 0.22, C("#59636d"), MAT.Metal)
	local dr = P(map, 1.7, 2.9, 0.12, cx + 0.86, 1.45, cz - f * 0.22, C("#59636d"), MAT.Metal)
	return { dl = dl, dr = dr, x0l = dl.Position.X, x0r = dr.Position.X, frame = frame }
end
local function openDoors(ed)
	TS:Create(ed.dl, TweenInfo.new(0.5), { Position = Vector3.new(ed.x0l - 1.55 * S, ed.dl.Position.Y, ed.dl.Position.Z) }):Play()
	TS:Create(ed.dr, TweenInfo.new(0.5), { Position = Vector3.new(ed.x0r + 1.55 * S, ed.dr.Position.Y, ed.dr.Position.Z) }):Play()
	task.delay(3.2, function()
		TS:Create(ed.dl, TweenInfo.new(0.5), { Position = Vector3.new(ed.x0l, ed.dl.Position.Y, ed.dl.Position.Z) }):Play()
		TS:Create(ed.dr, TweenInfo.new(0.5), { Position = Vector3.new(ed.x0r, ed.dr.Position.Y, ed.dr.Position.Z) }):Play()
	end)
end

-- 사람 모양 NPC(고정 포즈). 앞쪽은 +z 방향.
local function figure(map, cx, cz, yaw, o)
	local m = Instance.new("Model")
	m.Name = o.name or "직원"
	m.Parent = map.model
	local root = CFrame.new(map.o + Vector3.new(cx * S, 0, cz * S)) * CFrame.Angles(0, yaw, 0)
	local function bp(sx, sy, sz, x, y, z, color, mat)
		local p = Instance.new("Part")
		p.Anchored = true
		p.Size = Vector3.new(sx, sy, sz)
		p.CFrame = root * CFrame.new(x, y, z)
		p.Color = color
		p.Material = mat or MAT.SmoothPlastic
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = m
		return p
	end
	local dy = o.sit and -0.4 or 0
	if o.sit then
		for _, sx in ipairs({ -0.5, 0.5 }) do
			bp(0.95, 0.9, 1.9, sx, 1.95, 0.9, o.bottom)
			bp(0.95, 1.9, 0.9, sx, 0.95, 1.7, o.bottom)
			bp(1.1, 0.3, 1.2, sx, 0.15, 1.8, C("#07080c"))
		end
	else
		bp(0.95, 2.4, 1, -0.5, 1.2, 0, o.bottom)
		bp(0.95, 2.4, 1, 0.5, 1.2, 0, o.bottom)
		bp(1.1, 0.3, 1.2, -0.5, 0.15, 0.1, C("#07080c"))
		bp(1.1, 0.3, 1.2, 0.5, 0.15, 0.1, C("#07080c"))
	end
	local torso = bp(2.2, 2.3, 1.2, 0, 3.55 + dy, 0, o.top)
	bp(0.8, 2.2, 0.9, -1.55, 3.55 + dy, 0, o.top)
	bp(0.8, 2.2, 0.9, 1.55, 3.55 + dy, 0, o.top)
	bp(0.7, 0.7, 0.8, -1.55, 2.3 + dy, 0, o.skin)
	bp(0.7, 0.7, 0.8, 1.55, 2.3 + dy, 0, o.skin)
	bp(0.7, 1.9, 0.12, 0, 3.7 + dy, 0.62, o.shirt or C("#e8f0ff"))
	local head = bp(1.5, 1.6, 1.4, 0, 5.3 + dy, 0, o.skin)
	bp(1.62, 0.7, 1.52, 0, 6.0 + dy, -0.02, o.hair)
	bp(1.62, 1.3, 0.4, 0, 5.4 + dy, -0.55, o.hair)
	bp(1.62, 0.5, 0.35, 0, 6.0 + dy, 0.55, o.hair)
	local eyeC = C("#10131c")
	bp(0.28, 0.4, 0.1, -0.35, 5.3 + dy, 0.72, eyeC)
	bp(0.28, 0.4, 0.1, 0.35, 5.3 + dy, 0.72, eyeC)
	if o.glasses then
		bp(0.55, 0.5, 0.1, -0.35, 5.3 + dy, 0.74, o.glasses, MAT.Glass).Transparency = 0.35
		bp(0.55, 0.5, 0.1, 0.35, 5.3 + dy, 0.74, o.glasses, MAT.Glass).Transparency = 0.35
		bp(0.3, 0.1, 0.1, 0, 5.35 + dy, 0.74, o.glasses)
	end
	if o.fur then
		bp(2.9, 0.6, 1.6, 0, 4.75 + dy, 0, o.fur, MAT.Fabric)
		bp(0.9, 0.6, 1.2, -1.55, 4.6 + dy, 0, o.fur, MAT.Fabric)
		bp(0.9, 0.6, 1.2, 1.55, 4.6 + dy, 0, o.fur, MAT.Fabric)
	end
	m.PrimaryPart = torso
	return m, root
end
local function setPose(model, base, dx, dz, yaw, bob) -- 걷는 NPC 이동
	model:PivotTo(CFrame.new(base.Position + Vector3.new(dx, bob or 0, dz)) * CFrame.Angles(0, yaw, 0))
end

---------------------------------------------------------------- 회장실(100F)
local function buildOffice()
	local map = newMap("office")
	local W, D, H = 48, 34, 5.2
	room(map, W, D, H, C("#5a3a22"), MAT.WoodPlanks, C("#1b1511"), MAT.Wood, C("#120e0b"))
	-- 카펫
	P(map, 20, 0.06, 12, 24, 0.03, 17, C("#10281f"), MAT.Fabric).CanCollide = false
	for _, e in ipairs({ { 20, 0.2, 24, 11 }, { 20, 0.2, 24, 23 }, { 0.2, 12, 14, 17 }, { 0.2, 12, 34, 17 } }) do
		deco(P(map, e[1], 0.07, e[2], e[3], 0.04, e[4], GOLD, MAT.SmoothPlastic))
	end
	local dia = deco(P(map, 2.4, 0.08, 2.4, 24, 0.05, 17, GOLD, MAT.SmoothPlastic))
	dia.CFrame = dia.CFrame * CFrame.Angles(0, math.rad(45), 0)
	-- 창문(야경)
	for _, wx in ipairs({ 21, 30 }) do
		deco(P(map, 3, 2.2, 0.1, wx, 2.5, 0.05, C("#071229"), MAT.Neon))
		for i = 1, 24 do
			deco(P(map, 0.07, 0.07, 0.06, wx - 1.4 + math.random() * 2.8, 1.5 + math.random() * 2.0, 0.12, math.random() < 0.7 and C("#ffd36a") or C("#bfe4ff"), MAT.Neon))
		end
		deco(P(map, 3.2, 0.12, 0.2, wx, 3.7, 0.12, C("#0a0c10"), MAT.Metal))
		deco(P(map, 3.2, 0.12, 0.2, wx, 1.35, 0.12, C("#0a0c10"), MAT.Metal))
	end
	inspect(map, 21, 1.6, 2.4, "창문", { "창밖으로 리바이어던의 야경이 펼쳐진다.", "저 불빛 하나하나가 내가 지켜야 할 것들이다." })
	inspect(map, 30, 1.6, 2.4, "창문", { "창밖은 고요하다. 이 고요를 유지하는 것이 내 일이다." })
	-- 현수막
	deco(P(map, 2.4, 3, 0.08, 24, 2.7, 0.06, C("#0d1c3d"), MAT.Fabric))
	local ring = deco(P(map, 1.4, 1.4, 0.06, 24, 3.0, 0.12, GOLD, MAT.Neon))
	ring.Shape = Enum.PartType.Cylinder
	ring.Orientation = Vector3.new(0, 90, 0)
	inspect(map, 24, 1.6, 2.2, "현수막", { "리바이어던의 문장이 수놓인 내 현수막이다.", "의자에 앉으면 정확히 이 아래가 된다." })
	-- 책장
	local bookLines = { "빽빽하게 꽂힌 서적들이다. 전부 내가 읽은 책이다.", "법전, 지도, 역사서. 읽지 않은 책은 한 권도 없다." }
	for _, bx in ipairs({ 4.5, 9.5, 42.5 }) do
		P(map, 4, 3.4, 0.9, bx, 1.7, 0.8, C("#2a190d"), MAT.Wood)
		for r = 0, 3 do
			for i = 0, 11 do
				local col = ({ "#7a2a2a", "#2a4a7a", "#c9a94c", "#3a6a4a", "#5a3a7a", "#8a6a3a" })[(i + r) % 6 + 1]
				deco(P(map, 0.22, 0.6 + math.random() * 0.2, 0.5, bx - 1.7 + i * 0.31, 0.65 + r * 0.8, 1.3, C(col)))
			end
		end
		inspect(map, bx, 1.6, 2.4, "책장", bookLines)
	end
	-- 서고 · 금고 · 언월도 · 지도
	for i = 0, 3 do
		P(map, 0.9, 2.4, 2.4, 0.7, 1.2, 9 + i * 2.8, C("#20150c"), MAT.Wood)
	end
	inspect(map, 2.6, 1.4, 13.5, "서고", { "벽을 따라 문서 보관함이 늘어서 있다. 전부 내 손을 거친 문서들이다." })
	local safe = P(map, 1.6, 1.8, 1.4, 32, 0.9, 2, C("#1c2128"), MAT.Metal)
	deco(P(map, 0.5, 0.5, 0.1, 32, 1.1, 2.75, GOLD, MAT.Metal))
	inspect(map, 32, 1.4, 3.1, "금고", { "내 금고다. 다이얼은 굳게 잠겨 있다. 열 수 있는 사람은 나뿐이다." })
	P(map, 1.8, 0.2, 0.6, 14.5, 1.0, 1.6, C("#2a190d"), MAT.Wood)
	local gd = P(map, 0.12, 0.12, 3.8, 14.5, 1.9, 1.6, C("#6e4a28"), MAT.Wood)
	gd.CFrame = gd.CFrame * CFrame.Angles(math.rad(90), 0, 0)
	deco(P(map, 0.9, 0.05, 0.3, 14.5, 3.7, 1.6, C("#dfe6ec"), MAT.Metal))
	inspect(map, 14.5, 1.6, 3.4, "언월도 거치대", { "내 의장용 언월도가 거치대에 걸려 있다.", "지금 들고 있는 것과 모양이 같다. 날은 잘 서 있고, 먼지 한 톨 없게 내가 직접 관리한다." })
	deco(P(map, 3.4, 2, 0.08, 36, 2.7, 0.06, C("#0e2a30"), MAT.SmoothPlastic))
	for i = 1, 7 do
		deco(P(map, 0.18, 0.18, 0.06, 34.8 + math.random() * 2.4, 2.1 + math.random() * 1.2, 0.12, i % 3 == 0 and C("#c0392b") or GOLD, MAT.Neon))
	end
	inspect(map, 36, 1.6, 2.6, "벽 지도", { "벽면 지도에 등록된 국가들의 위치가 표시되어 있다.", "붉은 표식은 멸망한 국가다. 전부 내가 기록해 두었다." })
	-- 책상 · 컴퓨터 · 의자
	P(map, 7, 0.2, 2.4, 24, 1.0, 14.4, C("#3a2414"), MAT.Wood)
	P(map, 6.6, 0.9, 2.0, 24, 0.45, 14.4, C("#24150a"), MAT.Wood)
	for _, mx in ipairs({ 21.5, 24, 26.5 }) do
		P(map, 1.5, 0.9, 0.08, mx, 1.75, 13.6, C("#07090c"), MAT.Metal)
		glow(map, 1.36, 0.76, 0.06, mx, 1.75, 13.66, C("#7ad8ff")).Transparency = 0.35
		P(map, 0.2, 0.5, 0.2, mx, 1.2, 13.6, C("#07090c"), MAT.Metal)
	end
	P(map, 1.4, 0.06, 0.4, 24, 1.13, 15, C("#0a0c10"), MAT.Metal)
	P(map, 0.9, 0.1, 0.5, 26.4, 1.12, 14.9, GOLD, MAT.Metal)
	inspect(map, 24, 1.6, 15.6, "책상", { "내 결재 서류가 가지런히 쌓여 있다. 급한 건 이미 처리해 두었다.", "책상 위의 명패에는 ‘설립자’라고 적혀 있다. 내 자리다." })
	inspect(map, 21.5, 1.6, 15.0, "컴퓨터", { "내 컴퓨터다. 화면에는 리바이어던 전역의 보고서가 쉴 새 없이 올라온다.", "등급 갱신, 등록 신청, 기억 에너지 보급 현황… 전부 한눈에 들어온다.", "지금은 건드릴 것이 없다. 내가 보지 않는 동안에도 조직은 돌아간다." })
	P(map, 1.1, 0.14, 1.1, 24, 0.55, 12.3, C("#14161c"), MAT.Fabric)
	P(map, 1.1, 1.2, 0.14, 24, 1.2, 11.7, C("#14161c"), MAT.Fabric)
	-- 지구본 · 소파 · 탁자 · 의자
	P(map, 0.2, 0.9, 0.2, 30.6, 0.45, 6.6, C("#3a2414"), MAT.Wood)
	ball(map, 1.5, 30.6, 1.4, 6.6, C("#1c4f8f"), MAT.SmoothPlastic)
	deco(P(map, 1.7, 0.06, 1.7, 30.6, 1.4, 6.6, GOLD, MAT.Metal))
	inspect(map, 30.6, 1.6, 7.6, "지구본", { "세계 지도가 새겨진 내 지구본이다.", "소버린 아일랜드에 작은 불빛이 켜져 있다. 내가 켜 둔 것이다." })
	P(map, 4.4, 0.5, 1.4, 7, 0.4, 20, C("#5b1f1f"), MAT.Fabric)
	P(map, 4.4, 1.0, 0.4, 7, 1.0, 20.7, C("#5b1f1f"), MAT.Fabric)
	inspect(map, 7, 1.2, 19.8, "소파", { "손님을 맞이하는 내 자리다. 쿠션은 한 치 흐트러짐 없이 놓여 있다." })
	P(map, 2, 0.12, 1.2, 7, 0.55, 23.6, C("#3a2414"), MAT.Wood)
	P(map, 0.15, 0.55, 0.15, 7, 0.28, 23.6, C("#1b1511"), MAT.Wood)
	deco(P(map, 0.25, 0.14, 0.25, 6.7, 0.69, 23.6, C("#f2f2f2"), MAT.SmoothPlastic))
	deco(P(map, 0.25, 0.14, 0.25, 7.3, 0.69, 23.6, C("#f2f2f2"), MAT.SmoothPlastic))
	inspect(map, 7, 1.2, 23.6, "탁자", { "찻잔 두 개가 놓여 있다. 내가 내온 차다. 아직 따뜻하다." })
	for _, a in ipairs({ { 3.2, 22 }, { 10.8, 22 } }) do
		P(map, 1.4, 0.5, 1.4, a[1], 0.4, a[2], C("#2a3a2a"), MAT.Fabric)
		P(map, 1.4, 1.0, 0.3, a[1], 1.0, a[2] + 0.6, C("#2a3a2a"), MAT.Fabric)
		inspect(map, a[1], 1.2, a[2], "안락의자", { "푹신한 안락의자다. 지금은 앉을 틈이 없다." })
	end
	-- 회의 탁자
	P(map, 8, 0.18, 3.6, 40, 1.0, 19, C("#2a190d"), MAT.Wood)
	P(map, 1.4, 0.95, 1.4, 40, 0.5, 19, C("#1b1511"), MAT.Wood)
	for i = 0, 2 do
		for _, dz in ipairs({ 16.6, 21.4 }) do
			P(map, 0.9, 0.9, 0.9, 37.6 + i * 2.4, 0.5, dz, C("#14161c"), MAT.Fabric)
		end
	end
	P(map, 1.0, 1.0, 1.0, 35, 0.5, 19, C("#14161c"), MAT.Fabric)
	inspect(map, 40, 1.5, 19, "회의 탁자", { "내가 사령관들을 앉히는 긴 회의 탁자다. 자리는 이미 정해 두었다.", "탁자 가운데의 투영 장치는 꺼져 있다. 내가 호출하면 켜질 것이다." }, 12)
	inspect(map, 35, 1.2, 19, "상석", { "내 자리, 상석이다. 가장 안쪽, 문이 잘 보이는 자리." })
	-- 수족관 · 차 준비대
	P(map, 2.2, 2.4, 4, 44, 1.2, 8.5, C("#0a2a4a"), MAT.Glass).Transparency = 0.5
	glow(map, 2.0, 0.1, 3.8, 44, 2.4, 8.5, C("#2b8bff")).Transparency = 0.2
	lamp(map, 44, 2.2, 8.5, C("#3a9bff"), 1.2, 18)
	for i = 1, 6 do
		deco(P(map, 0.3, 0.14, 0.14, 43.4 + math.random() * 1.0, 0.8 + math.random() * 1.2, 7 + math.random() * 3, C("#ff9a3a"), MAT.Neon))
	end
	inspect(map, 44, 1.4, 8.5, "수족관", { "푸른 물속에서 물고기들이 느리게 헤엄친다. 보고 있으면 생각이 정리된다." })
	P(map, 2, 1.0, 1, 44.2, 0.5, 14, C("#2a190d"), MAT.Wood)
	inspect(map, 44.2, 1.2, 14, "차 준비대", { "내 차가 준비되어 있다. 마실 시간은 없지만." })
	-- 화분 · 목인형
	for _, pl in ipairs({ { 1.8, 4.2 }, { 46.2, 4.2 }, { 1.8, 31 }, { 46.2, 31 }, { 11.5, 17 }, { 32, 14.5 } }) do
		cylinder(map, 0.7, 0.6, pl[1], 0.3, pl[2], C("#4a2a18"), MAT.Concrete)
		ball(map, 1.1, pl[1], 1.1, pl[2], C("#1f5a34"), MAT.Grass)
		inspect(map, pl[1], 1.0, pl[2], "화분", { "잎이 윤기 있게 반짝인다. 내가 아끼는 화분이다. 누군가 매일 돌보고 있다." }, 7)
	end
	cylinder(map, 0.5, 2.0, 5.8, 1.1, 27.2, C("#6e4a28"), MAT.Wood)
	P(map, 0.2, 0.2, 1.4, 5.8, 1.5, 27.2, C("#6e4a28"), MAT.Wood)
	inspect(map, 5.8, 1.4, 27.2, "목인형", { "내 언월도 연습용 목인형이다.", "베인 자국이 깊다. 한 곳에 겹쳐서, 같은 각도로 수없이 베었다." })
	-- 문(남쪽)
	P(map, 2.2, 3.2, 0.3, 24, 1.6, D - 0.15, C("#2a190d"), MAT.Wood)
	deco(P(map, 0.12, 0.4, 0.14, 24.7, 1.5, D - 0.35, PALE, MAT.Metal))
	local door = deco(P(map, 2.6, 3.4, 0.4, 24, 1.7, D - 0.2, C("#000000"), nil, 1))
	prompt(door, "나가기", "문", function(plr)
		ask(plr, "복도로 나갈까?", function(p2)
			travel(p2, "hall", SPAWN.hall[1], SPAWN.hall[2], 0, 1, "fade", 100, 100)
		end, "…조금 더 둘러보자.")
	end, 12)
	-- 조명
	for _, lp in ipairs({ { 12, 8 }, { 36, 8 }, { 12, 26 }, { 36, 26 }, { 24, 17 } }) do
		glow(map, 2.4, 0.08, 0.5, lp[1], H - 0.05, lp[2], C("#ffe2a8"))
		lamp(map, lp[1], H - 0.6, lp[2], C("#ffd9a0"), 1.4, 70)
	end
	local sp = Instance.new("SpawnLocation")
	sp.Name = "OfficeSpawn"
	sp.Anchored = true
	sp.Size = Vector3.new(6, 1, 6)
	sp.Position = map.o + Vector3.new(24 * S, 0.5, 28 * S)
	sp.Transparency = 1
	sp.CanCollide = false
	sp.Neutral = true
	sp.Parent = map.model
	return map
end

---------------------------------------------------------------- 복도 · 엘리베이터 · 계단실
local hallElev
local function buildHall()
	local map = newMap("hall")
	local X0, X1, Z0, Z1, H, cx = 3, 12, 4, 40, 4.4, 7.5
	local stone = C("#262d36")
	P(map, X1 - X0 + 1, 0.6, Z1 - Z0 + 1, cx, -0.3, 22, stone, MAT.DiamondPlate)
	for _, x in ipairs({ X0 + 0.14, X1 - 0.14 }) do
		for z = Z0, Z1 - 1, 1.5 do
			deco(P(map, 0.28, 0.03, 0.75, x, 0.02, z + 0.4, C("#d9a21b"), MAT.SmoothPlastic))
			deco(P(map, 0.28, 0.03, 0.75, x, 0.02, z + 1.15, C("#14110a"), MAT.SmoothPlastic))
		end
	end
	for z = Z0 + 1, Z1 - 1, 1.8 do
		deco(P(map, 0.12, 0.03, 0.6, cx, 0.03, z, GOLD, MAT.Neon))
	end
	local wc = C("#1d242c")
	P(map, 0.5, H, Z1 - Z0 + 1, X0 - 0.25, H / 2, 22, wc, MAT.Metal)
	P(map, 0.5, H, Z1 - Z0 + 1, X1 + 0.25, H / 2, 22, wc, MAT.Metal)
	P(map, X1 - X0 + 1, H, 0.5, cx, H / 2, Z0 - 0.25, wc, MAT.Metal)
	P(map, X1 - X0 + 1, H, 0.5, cx, H / 2, Z1 + 0.25, wc, MAT.Metal)
	P(map, X1 - X0 + 1, 0.5, Z1 - Z0 + 1, cx, H + 0.25, 22, C("#0e1216"), MAT.Metal)
	for z = Z0 + 3, Z1 - 1, 5 do
		glow(map, 3.4, 0.1, 0.5, cx, H - 0.06, z, C("#cfe0ff"))
		lamp(map, cx, H - 0.6, z, C("#bcd0ff"), 1.2, 44)
	end
	for _, x in ipairs({ X0 + 0.45, X1 - 0.45 }) do
		cylinder(map, 0.3, H, x, H / 2, 22 - 17, C("#3a4651"), MAT.Metal).Size = Vector3.new((H) * S, 0.3 * S, 0.3 * S)
		P(map, 0.1, 0.14, Z1 - Z0, x, H - 0.8, 22, C("#2a323b"), MAT.Metal)
	end
	-- 북쪽: 회장실 문
	P(map, 4.4, 3.5, 0.2, cx, 1.75, Z0 + 0.1, C("#07090c"), MAT.Metal)
	P(map, 2, 3.2, 0.16, cx - 1.05, 1.6, Z0 + 0.2, C("#27303a"), MAT.Metal)
	P(map, 2, 3.2, 0.16, cx + 1.05, 1.6, Z0 + 0.2, C("#27303a"), MAT.Metal)
	local sign = P(map, 2.6, 0.5, 0.06, cx, 3.75, Z0 + 0.22, C("#05080b"))
	label(sign, Enum.NormalId.Back, "CHAIRMAN · 100F", GOLD, C("#05080b")).Parent = sign
	local od = deco(P(map, 4.6, 3.4, 1.6, cx, 1.7, Z0 + 0.9, C("#000000"), nil, 1))
	prompt(od, "들어가기", "회장실 문", function(plr)
		ask(plr, "회장실로 돌아갈까?", function(p2)
			travel(p2, "office", SPAWN.office[1], SPAWN.office[2], 0, -1, "fade", 100, 100)
		end, "…조금 더 둘러보자.")
	end, 14)
	-- 남쪽: 엘리베이터 + 호출 단말 + 계단실 문
	local ed = elevatorDoors(map, cx, Z1 - 0.25, "100F", C("#ffb84a"), 1)
	hallElev = ed
	local ep = deco(P(map, 5, 3.4, 1.6, cx, 1.7, Z1 - 1.0, C("#000000"), nil, 1))
	prompt(ep, "엘리베이터 호출", "엘리베이터", function(plr)
		openDoors(ed)
		Elev:FireClient(plr, 100)
	end, 14)
	deco(P(map, 0.4, 0.9, 0.12, X0 + 0.35, 1.2, Z1 - 1.4, C("#0b0e12"), MAT.Metal))
	glow(map, 0.12, 0.12, 0.05, X0 + 0.35, 1.45, Z1 - 1.33, C("#ffb84a"))
	-- 계단실 문(엘리베이터 바로 옆)
	P(map, 1.8, 3.2, 0.2, 10.9, 1.6, Z1 - 0.1, C("#12161b"), MAT.Metal)
	P(map, 1.4, 2.7, 0.12, 10.9, 1.35, Z1 - 0.2, C("#3a444f"), MAT.Metal)
	deco(P(map, 0.1, 0.5, 0.06, 10.5, 1.25, Z1 - 0.3, GOLD, MAT.Metal))
	local ss = P(map, 1.5, 0.4, 0.06, 10.9, 3.0, Z1 - 0.22, C("#04170c"))
	ss.CanCollide = false
	label(ss, Enum.NormalId.Front, "STAIRS ▲", C("#44e08a"), C("#04170c"))
	lamp(map, 10.9, 2.6, Z1 - 1, C("#44e08a"), 1.2, 20)
	local sp = deco(P(map, 2.4, 3.2, 1.6, 10.9, 1.6, Z1 - 1.0, C("#000000"), nil, 1))
	prompt(sp, "조사", "계단실 문", function(plr)
		ask(plr, "계단으로 옥상에 올라갈까?", function(p2)
			travel(p2, "roof", 12, 12, 0, 1, "stairs", "up", nil)
			task.delay(6, function()
				say(p2, "", { "…옥상이다. 난간이 없다.", "매끄러운 흰 바닥과 하늘뿐이다. 그리고 저 멀리, 꺾인 탑이 하나 보인다." })
			end)
		end, "…나중에 올라가 보자.")
	end, 12)
	-- 옆 방 문(잠김)
	local sides = {
		{ X0, 9, "LAB-101", { "잠긴 방이다. 이 층의 방은 전부 내 소유다.", "지금은 열 일이 없다." }, 1 },
		{ X0, 17, "ARCH-102", { "기록 보관실이다. 필요한 문서는 이미 내 책상에 올라와 있다." }, 1 },
		{ X0, 25, "SRV-103", { "서버실이다. 안쪽에서 낮은 팬 소리가 들린다. 조직의 숨소리다." }, 1 },
		{ X1, 9, "OPS-201", { "작전실이다. 호출 전까지는 비어 있다." }, -1 },
		{ X1, 17, "ARC-202", { "잠겨 있다. 내가 허락하지 않은 사람은 들어올 수 없다." }, -1 },
		{ X1, 25, "STO-203", { "보급 창고다. 목록은 내가 직접 서명했다." }, -1 },
	}
	for _, s in ipairs(sides) do
		local x, z, name, txt, dir = s[1], s[2], s[3], s[4], s[5]
		P(map, 0.16, 3.0, 2.2, x + dir * 0.08, 1.5, z, C("#06080a"), MAT.Metal)
		P(map, 0.12, 2.7, 1.9, x + dir * 0.16, 1.35, z, C("#27303a"), MAT.Metal)
		local lb = P(map, 0.06, 0.3, 1.2, x + dir * 0.2, 2.9, z, C("#05080b"))
		lb.CanCollide = false
		label(lb, dir == 1 and Enum.NormalId.Right or Enum.NormalId.Left, name, C("#ffb84a"), C("#05080b"))
		local a = deco(P(map, 1.6, 3, 2.4, x + dir * 0.9, 1.5, z, C("#000000"), nil, 1))
		prompt(a, "조사", name, function(plr) say(plr, "", txt) end, 9)
	end
	-- 소화기 · 보급 상자
	cylinder(map, 0.26, 0.5, X1 - 0.5, 0.35, 21.6, C("#a3241c"), MAT.Metal)
	inspect(map, X1 - 1.2, 1, 21.6, "소화기", { "소화기다. 쓸 일이 없기를 바란다." }, 7)
	P(map, 1.8, 1.2, 1.2, X0 + 1.2, 0.6, 30.6, C("#2a313a"), MAT.Metal)
	deco(P(map, 1.8, 0.2, 1.2, X0 + 1.2, 0.85, 30.6, C("#d9a21b"), MAT.SmoothPlastic))
	inspect(map, X0 + 2.6, 1, 30.6, "보급 상자", { "보급 상자다. 내가 직접 서명한 봉인이 그대로 붙어 있다." }, 8)
	return map
end

---------------------------------------------------------------- 95층
local function buildF95()
	local map = newMap("f95")
	local W, D, H = 44, 34, 5.6
	local navy, edge, cy = C("#081a42"), C("#5d7bff"), C("#38d6ff")
	room(map, W, D, H, navy, MAT.Metal, C("#02060f"), MAT.Metal, C("#01040c"))
	for _, z in ipairs({ 12.6, 19.6, 26.4 }) do glow(map, W - 4, 0.02, 0.07, W / 2, 0.02, z, cy) end
	for _, x in ipairs({ 9, 17, 27, 35 }) do glow(map, 0.07, 0.02, D - 10, x, 0.02, 17.5, cy) end
	-- 심해 전망창(북쪽 벽)
	local panes = 7
	local pw = (W - 2) / panes
	for i = 0, panes - 1 do
		local x = 1 + pw * (i + 0.5)
		deco(P(map, pw - 0.5, 3.8, 0.1, x, 3, 0.1, C("#031a5e"), MAT.Neon))
		deco(P(map, pw - 0.3, 0.14, 0.2, x, 4.95, 0.2, C("#102b6e"), MAT.Metal))
		deco(P(map, pw - 0.3, 0.14, 0.2, x, 1.1, 0.2, C("#102b6e"), MAT.Metal))
		deco(P(map, 0.14, 3.9, 0.2, x + pw / 2, 3, 0.2, C("#102b6e"), MAT.Metal))
		for k = 1, 3 do
			deco(P(map, 0.16, 0.1, 0.06, x - 0.9 + math.random() * 1.8, 1.6 + math.random() * 2.6, 0.18, k == 1 and C("#8fd4ff") or C("#1a4fb0"), MAT.Neon))
		end
	end
	-- 조명
	for _, lp in ipairs({ { 8, 8 }, { 8, 20 }, { 22, 8 }, { 36, 8 }, { 36, 20 }, { 22, 27 }, { 8, 28 }, { 36, 28 }, { 22, 20 } }) do
		glow(map, 2.6, 0.08, 0.5, lp[1], H - 0.05, lp[2], C("#9ab4ff"))
		lamp(map, lp[1], H - 0.6, lp[2], C("#6a8cff"), 1.6, 52)
	end
	-- 책상 12개 + 의자
	local seats = {}
	local function desk(x, z)
		P(map, 5, 0.12, 2, x + 2.5, 0.8, z + 1, C("#0a1d4a"), MAT.Metal)
		P(map, 4.8, 0.7, 1.8, x + 2.5, 0.4, z + 1, C("#061230"), MAT.Metal)
		glow(map, 5, 0.05, 0.06, x + 2.5, 0.8, z + 2.0, edge)
		for _, dx in ipairs({ 1.9, 3.9 }) do
			P(map, 1.5, 0.8, 0.06, x + dx, 1.55, z + 0.35, C("#02050c"), MAT.Metal)
			glow(map, 1.4, 0.7, 0.04, x + dx, 1.55, z + 0.4, C("#4a8cff")).Transparency = 0.3
		end
		P(map, 0.8, 0.12, 0.8, x + 2.4, 0.55, z + 2.5, C("#050d28"), MAT.Fabric)
		P(map, 0.8, 0.9, 0.12, x + 2.4, 1.0, z + 2.9, C("#050d28"), MAT.Fabric)
		table.insert(seats, { x + 2.4, z + 2.3 })
	end
	for _, x in ipairs({ 3, 10 }) do for _, z in ipairs({ 8, 15, 22 }) do desk(x, z) end end
	for _, x in ipairs({ 29, 36 }) do for _, z in ipairs({ 8, 15, 22 }) do desk(x, z) end end
	-- 홀로그램 탁자
	P(map, 4, 0.2, 2.6, 22, 0.75, 15.7, C("#0a1d4a"), MAT.Metal)
	P(map, 3.6, 0.7, 2.2, 22, 0.35, 15.7, C("#02060f"), MAT.Metal)
	local r1 = cylinder(map, 2.0, 0.05, 22, 0.88, 15.7, cy, MAT.Neon)
	r1.Orientation = Vector3.new(0, 0, 90)
	deco(r1)
	local holo = ball(map, 1.1, 22, 1.9, 15.7, cy, MAT.ForceField)
	deco(holo)
	lamp(map, 22, 1.9, 15.7, cy, 2, 34)
	table.insert(map.upd, function(t) holo.CFrame = CFrame.new(holo.Position) * CFrame.Angles(math.sin(t) * 0.3, t * 1.2, 0) end)
	inspect(map, 22, 1.2, 17.5, "홀로그램 탁자", { "홀로그램 탁자다. 리바이어던 전역의 지도가 천천히 회전하고 있다." }, 9)
	-- 서버 랙 · 복사기 · 정수기
	for _, x in ipairs({ 3, 5, 7, 36, 38, 40 }) do
		P(map, 1.6, 2.6, 1, x + 0.8, 1.3, 6.8, C("#02050e"), MAT.Metal)
		for k = 0, 7 do
			deco(P(map, 0.12, 0.08, 0.06, x + 0.3 + (k % 4) * 0.35, 0.4 + math.floor(k / 4) * 1.0 + math.random() * 0.2, 6.25, k % 2 == 0 and cy or C("#ffffff"), MAT.Neon))
		end
	end
	inspect(map, 5, 1.4, 8.2, "서버 랙", { "서버 랙이다. 안쪽에서 낮은 팬 소리가 난다." }, 9)
	inspect(map, 38, 1.4, 8.2, "서버 랙", { "서버 랙이다. 안쪽에서 낮은 팬 소리가 난다." }, 9)
	P(map, 2, 1.4, 1.2, 16.6, 0.7, 6.8, C("#102552"), MAT.Metal)
	P(map, 1.6, 0.06, 0.8, 16.6, 1.45, 6.8, C("#e8efff"))
	inspect(map, 16.6, 1.4, 8.2, "복사기", { "복사기다. 종이가 쉴 새 없이 나온다." }, 8)
	cylinder(map, 0.8, 1.4, 27, 0.7, 6.8, C("#102552"), MAT.Metal)
	cylinder(map, 0.64, 0.6, 27, 1.7, 6.8, C("#5daaff"), MAT.Glass).Transparency = 0.5
	inspect(map, 27, 1.4, 8.2, "정수기", { "정수기다. 물은 심해에서 끌어올려 걸러낸 것이다." }, 8)
	for _, c in ipairs({ { 2.2, 28.4 }, { 41.2, 28.4 }, { 2.2, 5.6 } }) do
		cylinder(map, 0.8, 0.5, c[1], 0.25, c[2], C("#0a1d4a"), MAT.Metal)
		for i = 0, 5 do
			cylinder(map, 0.12, 0.8 + (i % 3) * 0.3, c[1] + math.cos(i * 1.2) * 0.22, 0.85 + (i % 3) * 0.15, c[2] + math.sin(i * 1.2) * 0.22, i % 2 == 1 and C("#2b8bff") or cy, MAT.Neon)
		end
		lamp(map, c[1], 1.4, c[2], cy, 1, 20)
		inspect(map, c[1], 1.2, c[2], "산호 화분", { "심해에서 가져온 산호가 은은하게 빛난다." }, 7)
	end
	-- 엘리베이터(남쪽 벽)
	local ed = elevatorDoors(map, 22, D - 0.25, "95F", edge, 1)
	local ep = deco(P(map, 5, 3.4, 1.6, 22, 1.7, D - 1.0, C("#000000"), nil, 1))
	prompt(ep, "엘리베이터 호출", "엘리베이터", function(plr)
		openDoors(ed)
		Elev:FireClient(plr, 95)
	end, 14)
	-- 직원: 앉아 일하는 7명
	local NPC = {
		{ top = C("#102552"), bottom = C("#0a0c18"), hair = C("#1a1a22"), skin = C("#f0d2b8") },
		{ top = C("#14284a"), bottom = C("#0a0c18"), hair = C("#5a3a22"), skin = C("#e8c8a8") },
		{ top = C("#0c1c3a"), bottom = C("#0a0c18"), hair = C("#8a8a96"), skin = C("#f0d2b8") },
		{ top = C("#16305e"), bottom = C("#0a0c18"), hair = C("#2a1a3a"), skin = C("#e0b898") },
		{ top = C("#102552"), bottom = C("#0a0c18"), hair = C("#0e0e12"), skin = C("#f4dcc4") },
		{ top = C("#1a2a52"), bottom = C("#0a0c18"), hair = C("#6a3a1a"), skin = C("#e8c8a8") },
	}
	for i, si in ipairs({ 1, 4, 9, 7, 5, 8, 3 }) do
		local s = seats[si]
		local o = NPC[(i + 1) % 6 + 1]
		figure(map, s[1], s[2] + 0.1, math.pi, { name = "직원", sit = true, top = o.top, bottom = o.bottom, hair = o.hair, skin = o.skin })
	end
	-- 걷는 직원 7명(통로 격자를 따라 이동)
	local LX, LY = { 9, 17, 27, 35 }, { 12.6, 19.6, 26.4 }
	for i = 0, 6 do
		local o = NPC[i % 6 + 1]
		local mdl = figure(map, 0, 0, 0, { name = "직원", top = o.top, bottom = o.bottom, hair = o.hair, skin = o.skin })
		local st = { xi = (i * 3) % 4, yi = i % 3, wait = math.random() * 2, sp = 1.4 + math.random() * 0.7, yaw = 0 }
		st.nx, st.ny = st.xi, st.yi
		st.x, st.z = LX[st.xi + 1], LY[st.yi + 1]
		local base = CFrame.new(map.o)
		table.insert(map.upd, function(t, dt)
			if st.wait > 0 then
				st.wait = st.wait - dt
			else
				local tx, tz = LX[st.nx + 1], LY[st.ny + 1]
				local dx, dz = tx - st.x, tz - st.z
				local d = math.sqrt(dx * dx + dz * dz)
				if d < 0.1 then
					st.x, st.z, st.xi, st.yi = tx, tz, st.nx, st.ny
					if math.random() < 0.5 then st.wait = 1 + math.random() * 3 end
					local opts = {}
					for _, dd in ipairs({ { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } }) do
						local x2, y2 = st.xi + dd[1], st.yi + dd[2]
						if x2 >= 0 and x2 < 4 and y2 >= 0 and y2 < 3 then table.insert(opts, { x2, y2 }) end
					end
					local pk = opts[math.random(1, #opts)]
					st.nx, st.ny = pk[1], pk[2]
				else
					st.x = st.x + dx / d * st.sp * dt
					st.z = st.z + dz / d * st.sp * dt
					st.yaw = math.atan2(dx, dz)
				end
			end
			local bob = math.abs(math.sin(t * 6 + i)) * 0.15 * (st.wait > 0 and 0 or 1)
			mdl:PivotTo(CFrame.new(map.o + Vector3.new(st.x * S, bob, st.z * S)) * CFrame.Angles(0, st.yaw, 0))
		end)
	end
	-- 아비시온 크리토스
	local kr = figure(map, 22, 10.6, 0, {
		name = "아비시온 크리토스", top = C("#1d3fd6"), bottom = C("#0a0a10"), hair = C("#2f5bff"),
		skin = C("#f6e2d2"), shirt = C("#6f90ff"), glasses = C("#0b1030"), fur = C("#d9b44a"),
	})
	local ka = deco(P(map, 3, 3, 2, 22, 1.6, 11.6, C("#000000"), nil, 1))
	prompt(ka, "대화", "아비시온 크리토스", function(plr)
		if not questOn[plr] then
			say(plr, "아비시온 크리토스", { "안녕하십니까, 설립자님.", "오늘 카네히라가 여쭈어 볼께 있다고 합니다." }, giveQuest)
		else
			say(plr, "아비시온 크리토스", { "안녕하십니까, 설립자님.", "카네히라의 용건은 아직 준비 중입니다. 때가 되면 다시 말씀드리겠습니다." })
		end
	end, 12)
	return map
end

---------------------------------------------------------------- 옥상
local function strut(map, a, b, th, color, mat)
	local mid = (a + b) / 2
	local len = (b - a).Magnitude
	local p = Instance.new("Part")
	p.Anchored = true
	p.Size = Vector3.new(th * S, th * S, len)
	local dir = (b - a).Unit
	local up = math.abs(dir.Y) > 0.95 and Vector3.new(1, 0, 0) or Vector3.new(0, 1, 0)
	p.CFrame = CFrame.lookAt(mid, b, up)
	p.Color = color
	p.Material = mat or MAT.Metal
	p.Parent = map.model
	return p
end
local function buildRoof()
	local map = newMap("roof")
	local X0, X1, Z0, Z1 = 8, 48, 7, 30
	local W, D = X1 - X0, Z1 - Z0
	local cx, cz = (X0 + X1) / 2, (Z0 + Z1) / 2
	-- 별 · 아래 도시 불빛
	for i = 1, 160 do
		local a, e = math.random() * math.pi * 2, math.random() * 1.3 - 0.05
		local r = 900
		local p = Instance.new("Part")
		p.Anchored, p.CanCollide, p.CastShadow = true, false, false
		p.Size = Vector3.new(3, 3, 3)
		p.Material = MAT.Neon
		p.Color = Color3.new(1, 1, 1)
		p.Position = map.o + Vector3.new(cx * S + math.cos(a) * math.cos(e) * r, math.sin(e) * r + 200, cz * S + math.sin(a) * math.cos(e) * r)
		p.Parent = map.model
	end
	for i = 1, 260 do
		local p = Instance.new("Part")
		p.Anchored, p.CanCollide, p.CastShadow = true, false, false
		p.Size = Vector3.new(2.4, 2.4, 2.4)
		p.Material = MAT.Neon
		p.Color = math.random() < 0.7 and C("#ffc766") or C("#9ccbff")
		p.Position = map.o + Vector3.new(cx * S + (math.random() - 0.5) * 1200, -440 + math.random() * 30, cz * S + (math.random() - 0.5) * 1200)
		p.Parent = map.model
	end
	-- 난간 없는 매끄러운 흰색 바닥
	P(map, W, 0.6, D, cx, -0.3, cz, C("#f6f9fd"), MAT.SmoothPlastic)
	-- 아래로 길게 내려가는 하얀 건물 외벽
	local body = P(map, W, 110, D, cx, -55.6, cz, C("#e9eef5"), MAT.SmoothPlastic)
	body.CastShadow = false
	for k = 1, 17 do
		local y = -k * 6.2
		local ln = C("#c5cdd9")
		deco(P(map, W + 0.1, 0.12, 0.1, cx, y, Z1 + 0.03, ln))
		deco(P(map, W + 0.1, 0.12, 0.1, cx, y, Z0 - 0.03, ln))
		deco(P(map, 0.1, 0.12, D + 0.1, X0 - 0.03, y, cz, ln))
		deco(P(map, 0.1, 0.12, D + 0.1, X1 + 0.03, y, cz, ln))
	end
	for k = 0, 9 do
		local x = X0 + k * W / 9
		deco(P(map, 0.1, 100, 0.1, x, -50, Z1 + 0.03, C("#c5cdd9")))
		deco(P(map, 0.1, 100, 0.1, x, -50, Z0 - 0.03, C("#c5cdd9")))
	end
	local lip = C("#c4ccd7")
	deco(P(map, W + 0.2, 0.22, 0.2, cx, -0.11, Z1 + 0.02, lip))
	deco(P(map, W + 0.2, 0.22, 0.2, cx, -0.11, Z0 - 0.02, lip))
	deco(P(map, 0.2, 0.22, D, X0 - 0.02, -0.11, cz, lip))
	deco(P(map, 0.2, 0.22, D, X1 + 0.02, -0.11, cz, lip))
	-- 달빛
	lamp(map, cx, 30, cz, C("#aac4ff"), 0.6, 400)
	lamp(map, 28, 8, 22, C("#aac4ff"), 1.0, 200)
	-- 계단실 출입구
	P(map, 3.4, 2.8, 2.2, 12, 1.4, 9.2, C("#d4dbe5"))
	P(map, 3.5, 0.14, 2.3, 12, 2.85, 9.2, C("#ffffff"))
	P(map, 1.3, 2.2, 0.1, 12, 1.1, 10.35, C("#4a5561"), MAT.Metal)
	deco(P(map, 0.08, 0.35, 0.06, 12.45, 1.0, 10.45, GOLD, MAT.Metal))
	local hs = P(map, 1.2, 0.3, 0.06, 12, 2.4, 10.4, C("#04170c"))
	hs.CanCollide = false
	label(hs, Enum.NormalId.Back, "STAIRS ▼", C("#44e08a"), C("#04170c"))
	lamp(map, 12, 2.4, 11.2, C("#44e08a"), 1.2, 22)
	local hd = deco(P(map, 3, 3, 2.4, 12, 1.5, 11.4, C("#000000"), nil, 1))
	prompt(hd, "조사", "계단실 출입구", function(plr)
		ask(plr, "계단으로 내려갈까?", function(p2)
			travel(p2, "hall", 11.2, 38.6, 0, -1, "stairs", "down", nil)
		end, "…조금 더 있자.")
	end, 14)
	-- 고장 난 수신탑
	local tx, tz = 28, 15.4
	local function T3(x, y, z) return map.o + Vector3.new((tx + x) * S, y * S, (tz + z) * S) end
	local st, dk, rust = C("#6b7683"), C("#2a313a"), C("#6a4328")
	P(map, 3.4, 0.45, 3.4, tx, 0.22, tz, C("#9aa3b0"))
	local H1, bw, tw = 9, 1.1, 0.3
	local function pt(sx, sz, y)
		local k = bw + (tw - bw) * (y / H1)
		return T3(sx * k, y, sz * k)
	end
	local corners = { { -1, -1 }, { 1, -1 }, { 1, 1 }, { -1, 1 } }
	for _, c in ipairs(corners) do strut(map, pt(c[1], c[2], 0.45), pt(c[1], c[2], H1), 0.14, st) end
	local y, k = 0.45, 0
	while y < H1 - 0.9 do
		for i, c in ipairs(corners) do
			local n = corners[i % 4 + 1]
			strut(map, pt(c[1], c[2], y), pt(n[1], n[2], y), 0.07, dk)
			if not (k == 3 and i == 2) then
				strut(map, pt(c[1], c[2], y), pt(n[1], n[2], y + 1.5), 0.06, st)
				strut(map, pt(n[1], n[2], y), pt(c[1], c[2], y + 1.5), 0.06, st)
			end
		end
		y = y + 1.5
		k = k + 1
	end
	-- 꺾인 윗부분
	local topBase = CFrame.new(T3(0, H1, 0)) * CFrame.Angles(0, 0, -0.42)
	local function tp(x, y2, z) return (topBase * CFrame.new(x * S, y2 * S, z * S)).Position end
	for _, c in ipairs({ { -0.3, -0.3 }, { 0.3, -0.3 }, { 0.3, 0.3 }, { -0.3, 0.3 } }) do
		strut(map, tp(c[1], 0, c[2]), tp(c[1] * 0.5, 3.4, c[2] * 0.5), 0.1, st)
	end
	strut(map, tp(0, 3.4, 0), tp(0, 5.6, 0), 0.06, dk)
	strut(map, tp(-0.65, 3.7, 0), tp(0.65, 3.7, 0), 0.08, st)
	local tip = ball(map, 0.22, 0, 0, 0, C("#3a1212"), MAT.Neon)
	tip.Position = tp(0, 5.7, 0)
	-- 매달린 접시 안테나
	local dish = Instance.new("Part")
	dish.Anchored = true
	dish.Shape = Enum.PartType.Cylinder
	dish.Size = Vector3.new(0.12 * S, 1.2 * S, 1.2 * S)
	dish.CFrame = CFrame.new(T3(1.0, 6.2, 0.3)) * CFrame.Angles(0.5, 0.3, 1.9)
	dish.Color = C("#c8d0da")
	dish.Material = MAT.Metal
	dish.Parent = map.model
	-- 늘어진 케이블
	local function cable(a, b, c)
		local prev = a
		for i = 1, 10 do
			local t = i / 10
			local p = a * (1 - t) * (1 - t) + b * 2 * t * (1 - t) + c * t * t
			deco(strut(map, prev, p, 0.05, C("#101418"), MAT.Plastic))
			prev = p
		end
	end
	cable(T3(-0.2, 8.6, 0.1), T3(-2, 5, 1.2), T3(-1.9, 0.35, 1.9))
	cable(T3(0.3, 8.2, -0.2), T3(2.4, 4, -1.6), T3(2.8, 0.3, -1.2))
	-- 이음새 불꽃
	local spark = ball(map, 0.18, 0, 0, 0, C("#cfe9ff"), MAT.Neon)
	deco(spark)
	spark.Position = T3(0.6, 9.2, 0.2)
	spark.Transparency = 1
	local sl = Instance.new("PointLight")
	sl.Color = C("#aad7ff")
	sl.Range = 60
	sl.Brightness = 0
	sl.Parent = spark
	table.insert(map.upd, function(t)
		local ph = t % 5.3
		local on = ph < 0.1 or (ph > 0.22 and ph < 0.3)
		sl.Brightness = on and 8 or 0
		spark.Transparency = on and 0 or 1
	end)
	local ti = deco(P(map, 8, 4, 8, tx, 2, tz + 3.2, C("#000000"), nil, 1))
	prompt(ti, "조사", "수신탑", function(plr)
		say(plr, "", {
			"수신탑이다. 이미 고장 나 있다. 윗부분이 꺾였고, 접시 안테나는 케이블 하나에 매달려 있다.",
			"전파는 하나도 들어오지 않는다. 지금은 쓸 수 없다.",
			"언젠가 이 탑이 필요해질 것이다. 그때까지 이대로 두자.",
		})
	end, 24)
	return map
end

---------------------------------------------------------------- 실행
local maps = { buildOffice(), buildHall(), buildF95(), buildRoof() }
local t0 = os.clock()
RunService.Heartbeat:Connect(function(dt)
	local t = os.clock() - t0
	for _, m in ipairs(maps) do
		for _, fn in ipairs(m.upd) do fn(t, dt) end
	end
end)

-- 엘리베이터 층 선택 (서버에서 거리 검사)
local function nearElevator(plr, floor)
	local ch = plr.Character
	local hrp = ch and ch:FindFirstChild("HumanoidRootPart")
	if not hrp then return false end
	local m = plr:GetAttribute("Map")
	return (floor == 100 and m == "hall") or (floor == 95 and m == "f95")
end
ElevPick.OnServerEvent:Connect(function(plr, from, to)
	if from ~= 100 and from ~= 95 then return end
	if not nearElevator(plr, from) then return end
	if to ~= 100 and to ~= 95 then return end
	if to == from then return end
	if to == 95 then
		travel(plr, "f95", 22, 28.4, 0, -1, "ride", 100, 95, function(p2)
			if not questOn[p2] then say(p2, "", { "여기가 95층이다. 내가 맡긴 사무층.", "직원들이 분주하게 움직이고 있다." }) end
		end)
	else
		travel(plr, "hall", 7.5, 38.2, 0, -1, "ride", 95, 100)
	end
end)

-- 플레이어 입장 / 리스폰 / 옥상 가장자리 안내
local edgeCool = {}
local function onChar(plr, ch)
	task.wait(0.2)
	local info = plr:GetAttribute("Spawn")
	if info then
		local n, x, z, lx, lz = string.match(info, "^(%w+)|([%-%d%.]+)|([%-%d%.]+)|([%-%d%.]+)|([%-%d%.]+)$")
		if n then
			placeAt(plr, n, tonumber(x), tonumber(z), tonumber(lx), tonumber(lz))
			return
		end
	end
	placeAt(plr, "office", 24, 28, 0, -1)
end
Players.PlayerAdded:Connect(function(plr)
	plr.CharacterAdded:Connect(function(ch) onChar(plr, ch) end)
end)
for _, plr in ipairs(Players:GetPlayers()) do
	plr.CharacterAdded:Connect(function(ch) onChar(plr, ch) end)
end
Players.PlayerRemoving:Connect(function(plr)
	pendingSay[plr], pendingAsk[plr], busy[plr], questOn[plr], edgeCool[plr] = nil, nil, nil, nil, nil
end)

local edgeLines = { "난간이 없다. 한 걸음만 더 가면 떨어진다.", "저 아래로 리바이어던의 불빛이 점처럼 흩어져 있다." }
task.spawn(function()
	while true do
		task.wait(0.5)
		for _, plr in ipairs(Players:GetPlayers()) do
			if plr:GetAttribute("Map") == "roof" and not busy[plr] then
				local ch = plr.Character
				local hrp = ch and ch:FindFirstChild("HumanoidRootPart")
				if hrp then
					local p = (hrp.Position - ORIGIN.roof) / S
					local d = math.min(p.X - 8, 48 - p.X, p.Z - 7, 30 - p.Z)
					if d < 1.7 and d > -0.5 and p.Y > -1 and (edgeCool[plr] or 0) < os.clock() then
						edgeCool[plr] = os.clock() + 40
						say(plr, "", edgeLines)
					end
				end
			end
		end
	end
end)
