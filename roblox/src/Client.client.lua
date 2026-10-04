-- 라시안컷 소설 모음집 (클라이언트): 인트로 · 메인 · 공지 · 사령관 통신 · 월드 UI(대화/선택/엘리베이터/퀘스트/이동 연출)
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local TS = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local UIS = game:GetService("UserInputService")

local plr = Players.LocalPlayer
local Data = RS:WaitForChild("RSC_Data")
local R = RS:WaitForChild("RSC_Remotes")
local META = require(Data:WaitForChild("Meta"))
local NOTICES = require(Data:WaitForChild("Notices"))

local function C(h) return Color3.fromHex(h) end
local GOLD, PALE, LEMON, INK, PANEL = C("#c9a94c"), C("#e9d8a6"), C("#fff3a6"), C("#050403"), C("#0b0a07")
local FONT, MONO = Enum.Font.GothamMedium, Enum.Font.Code

---------------------------------------------------------------- 도우미
local function mk(class, props, parent)
	local o = Instance.new(class)
	for k, v in pairs(props) do o[k] = v end
	if parent then o.Parent = parent end
	return o
end
local function stroke(p, color, th)
	return mk("UIStroke", { Color = color or GOLD, Thickness = th or 1, ApplyStrokeMode = Enum.ApplyStrokeMode.Border }, p)
end
local function frame(parent, props)
	local f = mk("Frame", { BackgroundColor3 = PANEL, BorderSizePixel = 0 }, parent)
	for k, v in pairs(props or {}) do f[k] = v end
	return f
end
local function text(parent, str, size, color, props)
	local t = mk("TextLabel", { BackgroundTransparency = 1, Text = str, TextSize = size, TextColor3 = color or PALE, Font = FONT, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left }, parent)
	for k, v in pairs(props or {}) do t[k] = v end
	return t
end
local function button(parent, str, size, props)
	local b = mk("TextButton", { BackgroundColor3 = PANEL, BorderSizePixel = 0, Text = str, TextSize = size, TextColor3 = PALE, Font = FONT, AutoButtonColor = false }, parent)
	stroke(b, GOLD, 1)
	for k, v in pairs(props or {}) do b[k] = v end
	b.MouseEnter:Connect(function() TS:Create(b, TweenInfo.new(0.12), { BackgroundColor3 = C("#2a2410"), TextColor3 = LEMON }):Play() end)
	b.MouseLeave:Connect(function() TS:Create(b, TweenInfo.new(0.12), { BackgroundColor3 = b:GetAttribute("base") or PANEL, TextColor3 = PALE }):Play() end)
	return b
end
local function typeInto(label, str, speed, token)
	label.MaxVisibleGraphemes = 0
	label.Text = str
	local n = utf8.len(str) or #str
	for i = 1, n do
		if token and token.stop then break end
		label.MaxVisibleGraphemes = i
		task.wait(speed)
	end
	label.MaxVisibleGraphemes = -1
end

local gui = mk("ScreenGui", { Name = "RSC", ResetOnSpawn = false, IgnoreGuiInset = true, DisplayOrder = 20, ZIndexBehavior = Enum.ZIndexBehavior.Sibling }, plr:WaitForChild("PlayerGui"))

---------------------------------------------------------------- 화면 전환 (스캔 셔터 + 회전 아이콘)
local shutter = frame(gui, { Size = UDim2.fromScale(1, 1), Position = UDim2.fromScale(0, -1), BackgroundColor3 = INK, ZIndex = 100 })
local bar = frame(shutter, { Size = UDim2.new(1, 0, 0, 3), Position = UDim2.fromScale(0, 1), BackgroundColor3 = GOLD, ZIndex = 101 })
local icon = frame(shutter, { Size = UDim2.fromOffset(46, 46), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), BackgroundTransparency = 1, ZIndex = 101 })
stroke(icon, GOLD, 2)
local icon2 = frame(icon, { Size = UDim2.fromOffset(22, 22), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), BackgroundTransparency = 1, Rotation = 45, ZIndex = 101 })
stroke(icon2, PALE, 2)
local transBusy = false
local function wipe(mid)
	if transBusy then return end
	transBusy = true
	TS:Create(shutter, TweenInfo.new(0.3, Enum.EasingStyle.Quad), { Position = UDim2.fromScale(0, 0) }):Play()
	local spin = RunService.RenderStepped:Connect(function(dt)
		icon.Rotation = icon.Rotation + dt * 240
		icon2.Rotation = icon2.Rotation - dt * 360
	end)
	task.wait(0.36)
	if mid then mid() end
	task.wait(0.22)
	TS:Create(shutter, TweenInfo.new(0.3, Enum.EasingStyle.Quad), { Position = UDim2.fromScale(0, 1) }):Play()
	task.wait(0.32)
	spin:Disconnect()
	shutter.Position = UDim2.fromScale(0, -1)
	transBusy = false
end

---------------------------------------------------------------- 화면 틀
local screens = {}
local function newScreen(name)
	local s = frame(gui, { Name = name, Size = UDim2.fromScale(1, 1), BackgroundColor3 = INK, Visible = false, ZIndex = 2 })
	screens[name] = s
	return s
end
local current = nil
local function showScreen(name, instant)
	local function apply()
		for n, s in pairs(screens) do s.Visible = (n == name) end
		local w = gui:FindFirstChild("world")
		if w then w.Visible = false end
		current = name
		gui.Enabled = true
	end
	if instant then apply() else task.spawn(function() wipe(apply) end) end
end

-- 홀로그램 장식 (돌아가는 사각 테두리)
local function holoRings(parent, cx, cy, sizes)
	local rings = {}
	for i, sz in ipairs(sizes) do
		local r = frame(parent, { Size = UDim2.fromOffset(sz, sz), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(cx, cy), BackgroundTransparency = 1, Rotation = i * 17 })
		stroke(r, i % 2 == 0 and PALE or GOLD, i == 1 and 2 or 1)
		table.insert(rings, { r, (i % 2 == 0 and -1 or 1) * (8 + i * 6) })
	end
	RunService.RenderStepped:Connect(function(dt)
		for _, e in ipairs(rings) do e[1].Rotation = e[1].Rotation + e[2] * dt end
	end)
end

---------------------------------------------------------------- 인트로
local intro = newScreen("intro")
holoRings(intro, 0.5, 0.5, { 420, 340, 260, 190 })
text(intro, "RASYANCUT", 54, LEMON, { Size = UDim2.new(1, 0, 0, 70), Position = UDim2.fromScale(0, 0.18), TextXAlignment = Enum.TextXAlignment.Center, Font = Enum.Font.GothamBold })
text(intro, "NOVEL ARCHIVE · HOLOGRAPHIC TERMINAL", 14, GOLD, { Size = UDim2.new(1, 0, 0, 20), Position = UDim2.fromScale(0, 0.28), TextXAlignment = Enum.TextXAlignment.Center, Font = MONO })
local enter = button(intro, "접근하기", 22, { Size = UDim2.fromOffset(220, 54), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5) })
stroke(enter, LEMON, 2)

---------------------------------------------------------------- 메인
local menu = newScreen("menu")
holoRings(menu, 0.82, 0.5, { 360, 280, 200 })
text(menu, "RASYANCUT", 36, LEMON, { Size = UDim2.fromOffset(500, 50), Position = UDim2.new(0, 60, 0, 60), Font = Enum.Font.GothamBold })
text(menu, "소설 모음집", 18, GOLD, { Size = UDim2.fromOffset(500, 28), Position = UDim2.new(0, 62, 0, 108) })
local menuList = frame(menu, { Size = UDim2.fromOffset(340, 300), Position = UDim2.new(0, 60, 0.5, -110), BackgroundTransparency = 1 })
mk("UIListLayout", { Padding = UDim.new(0, 12), SortOrder = Enum.SortOrder.LayoutOrder }, menuList)
local function menuBtn(str, order, fn)
	local b = button(menuList, str, 20, { Size = UDim2.new(1, 0, 0, 56), LayoutOrder = order })
	b.MouseButton1Click:Connect(fn)
	return b
end

---------------------------------------------------------------- 공지
local noticeS = newScreen("notice")
text(noticeS, "공지 · PATCH NOTES", 26, LEMON, { Size = UDim2.new(1, -240, 0, 40), Position = UDim2.new(0, 40, 0, 28), Font = Enum.Font.GothamBold })
local noticeScroll = mk("ScrollingFrame", { Size = UDim2.new(1, -80, 1, -120), Position = UDim2.new(0, 40, 0, 84), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 5, ScrollBarImageColor3 = GOLD, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y }, noticeS)
mk("UIListLayout", { Padding = UDim.new(0, 10) }, noticeScroll)
local TAGC = { NEW = C("#ffd93d"), UPDATE = C("#7ad8ff"), FIX = C("#44e08a") }
for i, n in ipairs(NOTICES) do
	local card = frame(noticeScroll, { Size = UDim2.new(1, -12, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = i })
	stroke(card, C("#6e5e2a"), 1)
	mk("UIPadding", { PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12), PaddingLeft = UDim.new(0, 16), PaddingRight = UDim.new(0, 16) }, card)
	mk("UIListLayout", { Padding = UDim.new(0, 5) }, card)
	text(card, n.tag .. "  ·  " .. n.date, 13, TAGC[n.tag] or GOLD, { Size = UDim2.new(1, 0, 0, 16), Font = MONO, LayoutOrder = 1 })
	text(card, n.title, 18, LEMON, { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = 2, Font = Enum.Font.GothamBold })
	text(card, table.concat(n.lines, "\n"), 15, PALE, { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = 3 })
end

---------------------------------------------------------------- 사령관 통신
local cmdS = newScreen("cmd")
text(cmdS, "COMMAND LINK · 사령관 통신", 24, LEMON, { Size = UDim2.new(1, -240, 0, 36), Position = UDim2.new(0, 40, 0, 20), Font = Enum.Font.GothamBold })
local left = mk("ScrollingFrame", { Size = UDim2.new(0, 250, 1, -110), Position = UDim2.new(0, 40, 0, 70), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 4, ScrollBarImageColor3 = GOLD, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y }, cmdS)
mk("UIListLayout", { Padding = UDim.new(0, 6) }, left)
local right = frame(cmdS, { Size = UDim2.new(1, -330, 1, -110), Position = UDim2.new(0, 305, 0, 70) })
stroke(right, C("#6e5e2a"), 1)
local head = text(right, "", 16, LEMON, { Size = UDim2.new(1, -24, 0, 40), Position = UDim2.fromOffset(12, 6), Font = Enum.Font.GothamBold })
local chat = mk("ScrollingFrame", { Size = UDim2.new(1, -24, 1, -300), Position = UDim2.fromOffset(12, 50), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 4, ScrollBarImageColor3 = GOLD, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y }, right)
mk("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, chat)
local tabs = frame(right, { Size = UDim2.new(1, -24, 0, 34), Position = UDim2.new(0, 12, 1, -244), BackgroundTransparency = 1 })
mk("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }, tabs)
local qlist = mk("ScrollingFrame", { Size = UDim2.new(1, -24, 0, 160), Position = UDim2.new(0, 12, 1, -204), BackgroundColor3 = C("#080705"), BorderSizePixel = 0, ScrollBarThickness = 4, ScrollBarImageColor3 = GOLD, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y }, right)
stroke(qlist, C("#3a3014"), 1)
mk("UIListLayout", { Padding = UDim.new(0, 3) }, qlist)
local inputBox = mk("TextBox", { Size = UDim2.new(1, -24, 0, 32), Position = UDim2.new(0, 12, 1, -40), BackgroundColor3 = C("#12100a"), TextColor3 = LEMON, PlaceholderText = "직접 말을 걸어 보세요 (예: 오늘의 운세)", PlaceholderColor3 = C("#7a6a3a"), Font = FONT, TextSize = 15, ClearTextOnFocus = false, Text = "", Visible = false, BorderSizePixel = 0 }, right)
stroke(inputBox, GOLD, 1)

local TOPICS = { { "talk", "간단한 대화" }, { "ask", "질문" }, { "work", "일거리" }, { "food", "음식" }, { "honest", "솔직 토크" }, { "hobby", "취미" }, { "rel", "관계" } }
local ORACLE = { { "info", "정보 전달" }, { "fortune", "운세" } }
local cache = {}
local function load(cid, topic)
	local k = cid .. "/" .. topic
	if not cache[k] then
		local f = Data.Cmd:FindFirstChild(cid)
		local m = f and f:FindFirstChild(topic)
		cache[k] = m and require(m) or {}
	end
	return cache[k]
end
local META_BY = {}
for _, m in ipairs(META) do META_BY[m.id] = m end
local cid, topic = nil, nil
local deck = {}
local function nextAnswer(key, answers)
	local d = deck[key]
	if not d or #d == 0 then
		d = {}
		for i = 1, #answers do d[i] = i end
		for i = #d, 2, -1 do
			local j = math.random(1, i)
			d[i], d[j] = d[j], d[i]
		end
		deck[key] = d
	end
	return answers[table.remove(d)]
end
local chatN, chatToken = 0, { stop = false }
local function bubble(who, str, mine, animate)
	chatN = chatN + 1
	local row = frame(chat, { Size = UDim2.new(1, -8, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, LayoutOrder = chatN })
	local b = frame(row, { Size = UDim2.new(0, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.XY, BackgroundColor3 = mine and C("#3a3010") or C("#12100a"), AnchorPoint = Vector2.new(mine and 1 or 0, 0), Position = UDim2.fromScale(mine and 1 or 0, 0) })
	stroke(b, mine and GOLD or C("#6e5e2a"), 1)
	mk("UIPadding", { PaddingTop = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8), PaddingLeft = UDim.new(0, 12), PaddingRight = UDim.new(0, 12) }, b)
	mk("UIListLayout", { Padding = UDim.new(0, 3) }, b)
	text(b, who, 12, GOLD, { Size = UDim2.new(0, 0, 0, 14), AutomaticSize = Enum.AutomaticSize.X, Font = MONO })
	local t = text(b, "", 16, mine and LEMON or PALE, { Size = UDim2.new(0, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.XY })
	mk("UISizeConstraint", { MaxSize = Vector2.new(480, 9999) }, t)
	if animate then
		typeInto(t, str, 0.008, chatToken)
	else
		t.Text = str
	end
	chat.CanvasPosition = Vector2.new(0, 1e6)
	return t
end
local function clearChat()
	chatToken.stop = true
	chatToken = { stop = false }
	for _, c in ipairs(chat:GetChildren()) do
		if c:IsA("Frame") then c:Destroy() end
	end
	chatN = 0
end
local function say_(cm, str)
	local tok = chatToken
	task.spawn(function()
		task.wait(0.35)
		if tok.stop then return end
		bubble(cm.sn, str, false, true)
	end)
end
local function norm(s) return (string.gsub(string.lower(s), "[%s%p]", "")) end
local function oracleAnswer(cm, q)
	local nq = norm(q)
	if nq == "" then return nil end
	local best, bs = nil, 0
	for _, t in ipairs({ "info", "fortune" }) do
		for _, e in ipairs(load(cm.id, t)) do
			local sc = 0
			for _, kw in ipairs(e[3] or {}) do
				local nk = norm(kw)
				if #nk >= 6 and string.find(nq, nk, 1, true) then sc = sc + (utf8.len(nk) or #nk) end
			end
			if sc > bs then bs, best = sc, e end
		end
	end
	if best then return nextAnswer(cm.id .. "/" .. best[1], best[2]) end
	return nil
end
local function fillQuestions()
	for _, c in ipairs(qlist:GetChildren()) do
		if c:IsA("TextButton") then c:Destroy() end
	end
	local cm = META_BY[cid]
	local order = 0
	local function add(str, fn)
		order = order + 1
		local b = button(qlist, str, 15, { Size = UDim2.new(1, -8, 0, 30), LayoutOrder = order, TextXAlignment = Enum.TextXAlignment.Left, TextTruncate = Enum.TextTruncate.AtEnd })
		b.BackgroundTransparency = 0
		mk("UIPadding", { PaddingLeft = UDim.new(0, 10) }, b)
		b.MouseButton1Click:Connect(fn)
	end
	if topic == "rel" then
		local rel = load(cid, "rel")
		local ids = {}
		for _, m in ipairs(META) do
			if m.id ~= cid and m.id ~= "sender" then table.insert(ids, m) end
		end
		table.insert(ids, { id = "_all", ko = "사령관 전체" })
		for _, m in ipairs(ids) do
			local list = rel[m.id]
			if list and #list > 0 then
				add(m.ko .. "에 대해 물어본다", function()
					bubble("설립자", m.ko .. "에 대해 어떻게 생각해?", true, false)
					say_(cm, nextAnswer(cid .. "/rel/" .. m.id, list))
				end)
			end
		end
	elseif cm.oracle then
		for _, e in ipairs(load(cid, topic)) do
			add(e[1], function()
				bubble("설립자", e[1], true, false)
				say_(cm, nextAnswer(cid .. "/" .. topic .. "/" .. e[1], e[2]))
			end)
		end
	else
		for i, e in ipairs(load(cid, topic)) do
			add(e[1], function()
				bubble("설립자", e[1], true, false)
				say_(cm, nextAnswer(cid .. "/" .. topic .. "/" .. i, e[2]))
			end)
		end
	end
	qlist.CanvasPosition = Vector2.new(0, 0)
end
local tabBtns = {}
local function setTopic(k)
	topic = k
	for key, b in pairs(tabBtns) do
		b.BackgroundColor3 = key == k and C("#3a3010") or PANEL
		b:SetAttribute("base", key == k and C("#3a3010") or PANEL)
	end
	fillQuestions()
end
local function pickCommander(id)
	cid = id
	local cm = META_BY[id]
	head.Text = cm.ko .. "   ·   " .. cm.dept .. "  /  " .. cm.tone
	for _, b in pairs(tabBtns) do b:Destroy() end
	tabBtns = {}
	local tp = cm.oracle and ORACLE or TOPICS
	for _, t in ipairs(tp) do
		local b = button(tabs, t[2], 14, { Size = UDim2.fromOffset(cm.oracle and 120 or 92, 32) })
		b.MouseButton1Click:Connect(function() setTopic(t[1]) end)
		tabBtns[t[1]] = b
	end
	inputBox.Visible = cm.oracle == true
	clearChat()
	local hello = load(id, "hello")
	if #hello > 0 then
		say_(cm, hello[math.random(1, #hello)])
	end
	setTopic(tp[1][1])
end
inputBox.FocusLost:Connect(function(enter)
	if not enter or inputBox.Text == "" then return end
	local cm = META_BY[cid]
	local q = inputBox.Text
	inputBox.Text = ""
	bubble("설립자", q, true, false)
	local a = oracleAnswer(cm, q)
	if a then say_(cm, a) else bubble(cm.sn, "읽음", false, false) end
end)
for i, m in ipairs(META) do
	local b = button(left, m.sn .. "\n" .. m.dept, 15, { Size = UDim2.new(1, -8, 0, 54), LayoutOrder = i, TextXAlignment = Enum.TextXAlignment.Left })
	mk("UIPadding", { PaddingLeft = UDim.new(0, 12) }, b)
	b.MouseButton1Click:Connect(function() pickCommander(m.id) end)
end

---------------------------------------------------------------- 뒤로 가기 / 메인 버튼
local function backBtn(screen)
	local b = button(screen, "◀ 메인", 16, { Size = UDim2.fromOffset(110, 38), AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -40, 0, 24) })
	b.MouseButton1Click:Connect(function() showScreen("menu") end)
end
backBtn(noticeS)
backBtn(cmdS)

---------------------------------------------------------------- 월드 UI
local world = frame(gui, { Name = "world", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 5, Visible = false })
local menuOpen = button(world, "MENU", 14, { Size = UDim2.fromOffset(86, 34), Position = UDim2.new(0, 14, 0, 14), ZIndex = 6 })
menuOpen.MouseButton1Click:Connect(function() showScreen("menu") end)
local locLabel = text(world, "", 14, GOLD, { Size = UDim2.fromOffset(220, 20), Position = UDim2.new(0, 108, 0, 21), Font = MONO, ZIndex = 6 })

local function enterWorld()
	task.spawn(function()
		wipe(function()
			for _, s in pairs(screens) do s.Visible = false end
			world.Visible = true
			current = "world"
		end)
	end)
end

-- 대화창
local msg = frame(world, { Size = UDim2.new(0.8, 0, 0, 130), AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -24), BackgroundColor3 = C("#05060f"), Visible = false, ZIndex = 20 })
stroke(msg, PALE, 2)
mk("UICorner", { CornerRadius = UDim.new(0, 6) }, msg)
local mName = text(msg, "", 15, LEMON, { Size = UDim2.new(1, -32, 0, 20), Position = UDim2.fromOffset(16, 8), Font = Enum.Font.GothamBold, ZIndex = 21 })
local mTxt = text(msg, "", 19, C("#ffffff"), { Size = UDim2.new(1, -32, 1, -50), Position = UDim2.fromOffset(16, 32), TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 21 })
local mNext = text(msg, "▼", 16, LEMON, { Size = UDim2.fromOffset(20, 20), Position = UDim2.new(1, -30, 1, -26), ZIndex = 21 })
local msgBtn = mk("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", ZIndex = 30 }, msg)
local lines, li, typing, msgOpen, msgToken = {}, 0, false, false, nil
local function closeMsg()
	msgOpen = false
	msg.Visible = false
	R.SayDone:FireServer()
end
local function typeLine()
	local tok = { stop = false }
	msgToken = tok
	typing = true
	mNext.Visible = false
	task.spawn(function()
		typeInto(mTxt, lines[li], 0.014, tok)
		if not tok.stop then
			typing = false
			mNext.Visible = true
		end
	end)
end
local function advance()
	if not msgOpen then return end
	if typing then
		if msgToken then msgToken.stop = true end
		mTxt.MaxVisibleGraphemes = -1
		mTxt.Text = lines[li]
		typing = false
		mNext.Visible = true
		return
	end
	li = li + 1
	if li > #lines then closeMsg() else typeLine() end
end
msgBtn.MouseButton1Click:Connect(advance)
R.Say.OnClientEvent:Connect(function(name, ls)
	if msgToken then msgToken.stop = true end
	lines, li, msgOpen = ls, 1, true
	mName.Text = name
	msg.Visible = true
	typeLine()
end)

-- 선택창
local choice = frame(world, { Size = UDim2.fromOffset(360, 150), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), BackgroundColor3 = C("#05060f"), Visible = false, ZIndex = 40 })
stroke(choice, PALE, 2)
local cTxt = text(choice, "", 19, C("#ffffff"), { Size = UDim2.new(1, -32, 0, 56), Position = UDim2.fromOffset(16, 12), ZIndex = 41, TextXAlignment = Enum.TextXAlignment.Center })
local cYes = button(choice, "네", 18, { Size = UDim2.fromOffset(140, 42), Position = UDim2.new(0, 28, 1, -58), ZIndex = 41 })
local cNo = button(choice, "아니요", 18, { Size = UDim2.fromOffset(140, 42), Position = UDim2.new(1, -168, 1, -58), ZIndex = 41 })
R.Ask.OnClientEvent:Connect(function(t)
	cTxt.Text = t
	choice.Visible = true
end)
cYes.MouseButton1Click:Connect(function() choice.Visible = false; R.AskReply:FireServer(true) end)
cNo.MouseButton1Click:Connect(function() choice.Visible = false; R.AskReply:FireServer(false) end)

-- 엘리베이터
local elev = frame(world, { Size = UDim2.fromOffset(320, 250), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), BackgroundColor3 = C("#0a0b0f"), Visible = false, ZIndex = 40 })
stroke(elev, GOLD, 2)
text(elev, "ELEVATOR", 14, C("#ffb84a"), { Size = UDim2.new(1, -32, 0, 24), Position = UDim2.fromOffset(16, 12), Font = MONO, ZIndex = 41 })
local eNow = text(elev, "100F", 26, C("#ffb84a"), { Size = UDim2.new(1, -32, 0, 30), Position = UDim2.fromOffset(16, 8), TextXAlignment = Enum.TextXAlignment.Right, Font = Enum.Font.GothamBold, ZIndex = 41 })
local elevFrom = 100
local function elevBtn(y, f, label, sub)
	local b = button(elev, f .. "F   " .. label .. "   " .. sub, 17, { Size = UDim2.new(1, -32, 0, 46), Position = UDim2.fromOffset(16, y), ZIndex = 41 })
	b.MouseButton1Click:Connect(function()
		elev.Visible = false
		if f ~= elevFrom then R.ElevPick:FireServer(elevFrom, f) end
	end)
	return b
end
elevBtn(52, 100, "회장실", "CHAIRMAN")
elevBtn(106, 95, "사무층", "OFFICE")
local eClose = button(elev, "닫기", 16, { Size = UDim2.new(1, -32, 0, 40), Position = UDim2.fromOffset(16, 162), ZIndex = 41 })
eClose.MouseButton1Click:Connect(function() elev.Visible = false end)
R.Elev.OnClientEvent:Connect(function(from)
	elevFrom = from
	eNow.Text = from .. "F"
	elev.Visible = true
end)

-- 퀘스트 표시
local quest = frame(world, { Size = UDim2.fromOffset(250, 96), AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -16, 0, 16), BackgroundColor3 = C("#0a0b0f"), Visible = false, ZIndex = 10 })
stroke(quest, GOLD, 1)
text(quest, "QUEST", 12, GOLD, { Size = UDim2.new(1, -24, 0, 14), Position = UDim2.fromOffset(12, 8), Font = MONO, ZIndex = 11 })
text(quest, "카네히라의 질문", 17, LEMON, { Size = UDim2.new(1, -24, 0, 22), Position = UDim2.fromOffset(12, 24), Font = Enum.Font.GothamBold, ZIndex = 11 })
text(quest, "카네히라가 설립자에게 여쭐 것이 있다.\n준비 중 · 나중에 진행할 수 있습니다", 12, PALE, { Size = UDim2.new(1, -24, 0, 40), Position = UDim2.fromOffset(12, 48), ZIndex = 11 })
R.Quest.OnClientEvent:Connect(function(on) quest.Visible = on == true end)

-- 이동 연출 (페이드 · 층수 표시 · 계단)
local fade = frame(gui, { Size = UDim2.fromScale(1, 1), BackgroundColor3 = INK, BackgroundTransparency = 1, ZIndex = 60, Visible = false })
local flTop = text(fade, "", 14, GOLD, { Size = UDim2.new(1, 0, 0, 20), Position = UDim2.new(0, 0, 0.5, -100), TextXAlignment = Enum.TextXAlignment.Center, Font = MONO, ZIndex = 61 })
local flBig = text(fade, "", 100, C("#ffb84a"), { Size = UDim2.new(1, 0, 0, 120), Position = UDim2.new(0, 0, 0.5, -70), TextXAlignment = Enum.TextXAlignment.Center, Font = Enum.Font.GothamBold, ZIndex = 61 })
local flSub = text(fade, "", 24, PALE, { Size = UDim2.new(1, 0, 0, 30), Position = UDim2.new(0, 0, 0.5, 60), TextXAlignment = Enum.TextXAlignment.Center, Font = MONO, ZIndex = 61 })
local fxDone = false
R.Fx.OnClientEvent:Connect(function(kind, a, b)
	if kind == "done" then fxDone = true; return end
	fxDone = false
	task.spawn(function()
		fade.Visible = true
		TS:Create(fade, TweenInfo.new(0.45), { BackgroundTransparency = 0 }):Play()
		task.wait(0.45)
		if kind == "ride" then
			flTop.Text = "FLOOR"
			local d = b > a and 1 or -1
			for f = a, b, d do
				flBig.Text = tostring(f)
				flSub.Text = (d > 0 and "▲" or "▼") .. " " .. f .. "F"
				task.wait(0.17)
			end
		elseif kind == "stairs" then
			local up = a == "up"
			flTop.Text = "STAIRS"
			flBig.Text = up and "RF" or "100F"
			for k = 1, 16 do
				flSub.Text = (up and "▲" or "▼") .. "  " .. k .. " / 16"
				task.wait(0.19)
			end
		end
		local t0 = os.clock()
		while not fxDone and os.clock() - t0 < 6 do task.wait(0.05) end
		flTop.Text, flBig.Text, flSub.Text = "", "", ""
		task.wait(0.25)
		TS:Create(fade, TweenInfo.new(0.45), { BackgroundTransparency = 1 }):Play()
		task.wait(0.45)
		fade.Visible = false
	end)
end)

-- 층 이름 표시
local LOC = { office = "회장실 · 100F", hall = "복도 · 100F", f95 = "사무층 · 95F", roof = "옥상 · RF" }
plr:GetAttributeChangedSignal("Map"):Connect(function() locLabel.Text = LOC[plr:GetAttribute("Map")] or "" end)

---------------------------------------------------------------- 메뉴 구성 & 시작
menuBtn("공지", 1, function() showScreen("notice") end)
menuBtn("사령관 통신", 2, function() showScreen("cmd") end)
menuBtn("3D 월드 입장 (회장실)", 3, enterWorld)
enter.MouseButton1Click:Connect(function() showScreen("menu") end)
UIS.InputBegan:Connect(function(i, gp)
	if gp then return end
	if i.KeyCode == Enum.KeyCode.E or i.KeyCode == Enum.KeyCode.Space or i.KeyCode == Enum.KeyCode.Return then advance() end
	if i.KeyCode == Enum.KeyCode.M and current == "world" and not msgOpen then showScreen("menu") end
end)
showScreen("intro", true)
