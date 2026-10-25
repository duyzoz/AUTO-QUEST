'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, handler) {
	const listener = (_event, payload) => handler(payload);
	ipcRenderer.on(channel, listener);
	return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('autoquest', {
	getConfig: () => ipcRenderer.invoke('config:get'),
	saveConfig: (config) => ipcRenderer.invoke('config:save', config),
	// Wave#88 (Multiaccount) — danh sách tài khoản đã lưu (token KHÔNG trả về).
	accountsList: () => ipcRenderer.invoke('accounts:from-config'),
	// Thêm/cập nhật một tài khoản vào danh sách (token mã hoá ở main process).
	accountsAdd: (account) => ipcRenderer.invoke('accounts:add', account),
	// Xoá một tài khoản khỏi danh sách.
	accountsRemove: (id) => ipcRenderer.invoke('accounts:remove', id),
	// Chọn activeIdx (tài khoản hiện đăng nhập).
	accountsSetActive: (idx) => ipcRenderer.invoke('accounts:set-active', idx),
	start: (config) => ipcRenderer.invoke('bot:start', config),
	stop: () => ipcRenderer.invoke('bot:stop'),
	getState: () => ipcRenderer.invoke('bot:state'),
	authCheck: (token) => ipcRenderer.invoke('auth:check', token),
	fetchOrbs: (token) => ipcRenderer.invoke('orbs:fetch', token),
	claimQuest: (payload) => ipcRenderer.invoke('quests:claim', payload),
	// Waves 32: chẩn đoán (chỉ có tác dụng khi main bật AQ_DUMP_RAW_QUESTS=1).
	debugRawQuests: () => ipcRenderer.invoke('debug:raw-quests'),
	debugClaimOne: (questId, variant) => ipcRenderer.invoke("debug:claim-one", questId, variant),
	debugProbePlatform: (questId, platform) => ipcRenderer.invoke("debug:probe-platform", questId, platform),
	captchaProbe: (questId) => ipcRenderer.invoke("debug:captcha-probe", questId),
	submitCaptcha: (questId, captcha) => ipcRenderer.invoke("debug:submit-captcha", questId, captcha),
	// Waves 38: in trạng thái widget hCaptcha trong modal ra terminal (đo hộp trắng).
	captchaTrace: (info) => ipcRenderer.send("debug:captcha-trace", info),
	readClipboard: () => ipcRenderer.invoke('clipboard:read'),
	writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
	openDataFolder: () => ipcRenderer.invoke('shell:open-data-folder'),
	openUrl: (url) => ipcRenderer.invoke('shell:open-url', url),
	// Waves 40 (B): mở đúng trang quest trong Discord thật (deep link → app, fallback web).
	openQuest: (questId) => ipcRenderer.invoke('shell:open-quest', questId),
	// Waves 40 (C): lớp CDP — Discord thật tự gửi request/heartbeat (captcha native).
	cdpStatus: (port) => ipcRenderer.invoke('cdp:status', port),
	cdpSuperProperties: (port) => ipcRenderer.invoke('cdp:super-properties', port),
	cdpRunningGames: (port) => ipcRenderer.invoke('cdp:running-games', port),
	cdpNavigateQuest: (questId, port) => ipcRenderer.invoke('cdp:navigate-quest', questId, port),
	cdpEvaluate: (expression, port) => ipcRenderer.invoke('cdp:evaluate', expression, port),
	cdpLaunchDebug: (port) => ipcRenderer.invoke('cdp:launch-with-debug', port),
	// Waves 47 — KIỂU TÊN HIỂN THỊ: đọc style thật từ Discord + tải đúng file font.
	dnsRead: (payload) => ipcRenderer.invoke('dns:read', payload),
	dnsFont: (url) => ipcRenderer.invoke('dns:font', url),
	saveLog: (content) => ipcRenderer.invoke('log:save', content),
	// Waves 46: các bridge token ứng dụng / OAuth2 (appTokenStatus, appTokenImportTxt,
	// appTokenClear, oauthBuildUrl, botWhoami) ĐÃ XOÁ cùng chức năng "Mời bot vào server".
	// Waves 45b — token TÀI KHOẢN người dùng nạp từ .txt (ĐĂNG NHẬP THẬT).
	// usertokenTake đọc đúng MỘT LẦN rồi xoá token khỏi RAM của main process.
	userTokenImportTxt: () => ipcRenderer.invoke('usertoken:import-txt'),
	userTokenTake: () => ipcRenderer.invoke('usertoken:take'),
	userTokenDiscard: () => ipcRenderer.invoke('usertoken:discard'),
	userTokenPendingStatus: () => ipcRenderer.invoke('usertoken:pending-status'),
	onLog: (handler) => subscribe('log', handler),
	onEvent: (handler) => subscribe('event', handler),
	onState: (handler) => subscribe('state', handler),
});
