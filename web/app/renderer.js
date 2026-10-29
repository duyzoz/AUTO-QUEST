'use strict';

const api = window.autoquest;

const el = (id) => document.getElementById(id);

const ui = {
	token: el('token'),
	loopMode: el('loopMode'),
	loopInterval: el('loopInterval'),
	loopIntervalRow: el('loopIntervalRow'),
	btnStart: el('btnStart'),
	btnStop: el('btnStop'),
	btnScan: el('btnScan'),
	btnPaste: el('btnPaste'),
	btnToggleToken: el('btnToggleToken'),
	btnToggleTokenText: el('btnToggleTokenText'),
	btnSaveToken: el('btnSaveToken'),
	// Waves 48: dòng trạng thái đăng nhập dưới ô token.
	tokenStatus: el('tokenStatus'),
	btnCopyScript: el('btnCopyScript'),
	// Waves 44: hướng dẫn token có mũi tên sổ ra.
	btnGuideToggle: el('btnGuideToggle'),
	guideBody: el('guideBody'),
	// Waves 46: tab "Cách 2 · Mời bot vào server" + toàn bộ khối OAuth2/token ứng dụng
	// ĐÃ BỊ XOÁ theo yêu cầu. Chỉ còn pane Console (đăng nhập tài khoản thật).
	guidePaneConsole: el('guidePaneConsole'),
	// Waves 45b — nạp token TÀI KHOẢN từ .txt (đăng nhập thật).
	btnUserTokImport: el('btnUserTokImport'),
	userTokNote: el('userTokNote'),
	btnClearLog: el('btnClearLog'),
	btnOpenFolder: el('btnOpenFolder'),
	// Wave#108/#109: bảng dữ liệu & chẩn đoán
	btnDataPanel: el('btnDataPanel'),
	dataModal: el('dataModal'),
	dataPassword: el('dataPassword'),
	btnDataToggle: el('btnDataToggle'),
	btnDataToggleText: el('btnDataToggleText'),
	btnBackupExport: el('btnBackupExport'),
	btnBackupImport: el('btnBackupImport'),
	btnBackupApply: el('btnBackupApply'),
	btnBackupCancel: el('btnBackupCancel'),
	dataImportPreview: el('dataImportPreview'),
	dataImportMeta: el('dataImportMeta'),
	btnRunDiagnostics: el('btnRunDiagnostics'),
	btnExportCfg: el('btnExportCfg'),
	dataDiagOut: el('dataDiagOut'),
	dataStatus: el('dataStatus'),
	btnDataClose: el('btnDataClose'),
	// Waves 28: chế độ Sáng/Tối
	themeDark: el('themeDark'),
	themeLight: el('themeLight'),
	btnDrawer: el('btnDrawer'),
	drawerOverlay: el('drawerOverlay'),
	sidebar: el('sidebar'),
	selectAll: el('selectAll'),
	selectAllLabel: el('selectAllLabel'),
	selectTools: el('selectTools'),
	selectedLabel: el('selectedLabel'),
	selectedCount: el('selectedCount'),
	selectedOrbs: el('selectedOrbs'),
	// Discord profile (left rail + pop, Waves 12)
	dprofile: el('dprofile'),
	upRow: el('upRow'),
	upPop: el('upPop'),
	upAvatar: el('upAvatar'),
	upName: el('upName'),
	upSub: el('upSub'),
	btnLogout: el('btnLogout'),
	dpBanner: el('dpBanner'),
	dpAvatar: el('dpAvatar'),
	dpDecoration: el('dpDecoration'),
	dpDisplay: el('dpDisplay'),
	dpNameplate: el('dpNameplate'),
	dpUsername: el('dpUsername'),
	dpClanBadge: el('dpClanBadge'),
	dpClanTag: el('dpClanTag'),
	dpBadge: el('dpBadge'),
	dpBadgeText: el('dpBadgeText'),
	dpBadges: el('dpBadges'),
	// Waves 49: profile effect + frame trong popout
	dpEffect: el('dpEffect'),
	dpFrame: el('dpFrame'),
	// Hero trung tâm: guest vs profile (Waves 15: guest hero đã bỏ, chỉ còn profile)
	heroProfile: el('heroProfile'),
	phBanner: el('phBanner'),
	phAvatarwrap: el('phAvatarwrap'),
	phAvatar: el('phAvatar'),
	phAvatarOrb: el('phAvatarOrb'),
	phDecoration: el('phDecoration'),
	// Waves 49: profile effect + frame trong hero
	phEffect: el('phEffect'),
	phFrame: el('phFrame'),
	phDisplay: el('phDisplay'),
	phNameplate: el('phNameplate'),
	phUsername: el('phUsername'),
	phUserId: el('phUserId'),
	phUserIdValue: el('phUserIdValue'),
	phBadges: el('phBadges'),
	phClanBadge: el('phClanBadge'),
	phClanTag: el('phClanTag'),
	// Số dư ORB (card emerald trong khu Auto Orb)
	sideBalance: el('sideBalance'),
	orbBalance: el('orbBalance'),
	orbPending: el('orbPending'),
	// Modal xác nhận đăng xuất (Waves 15 + Waves 17 account card)
	logoutModal: el('logoutModal'),
	btnLogoutCancel: el('btnLogoutCancel'),
	btnLogoutConfirm: el('btnLogoutConfirm'),
	logoutDesc: el('logoutDesc'),
	logoutAccount: el('logoutAccount'),
	logoutAccAvatar: el('logoutAccAvatar'),
	logoutAccName: el('logoutAccName'),
	logoutAccId: el('logoutAccId'),
	// Modal xác minh hCaptcha (Waves 31)
	captchaModal: el('captchaModal'),
	captchaWidget: el('hcaptchaWidget'),
	captchaLoading: el('captchaLoading'),
	captchaHint: el('captchaHint'),
	captchaErr: el('captchaErr'),
	captchaTarget: el('captchaTarget'),
	captchaTargetArt: el('captchaTargetArt'),
	captchaTargetName: el('captchaTargetName'),
	captchaTargetSub: el('captchaTargetSub'),
	btnCaptchaCancel: el('btnCaptchaCancel'),
	btnCaptchaRetry: el('btnCaptchaRetry'),
	captchaVeilClick: el('captchaModal'),
	// Nav
	navQuest: el('navQuest'),
	navSettings: el('navSettings'),
	navStats: el('navStats'),
	navAbout: el('navAbout'),
	pageQuest: el('pageQuest'),
	pageSettings: el('pageSettings'),
	pageStats: el('pageStats'),
	pageAbout: el('pageAbout'),
	// Waves #117–#131
	updateBar: el('updateBar'),
	updateBarText: el('updateBarText'),
	btnUpdateReload: el('btnUpdateReload'),
	btnUpdateDismiss: el('btnUpdateDismiss'),
	netBadge: el('netBadge'),
	btnRecover: el('btnRecover'),
	claimQueueChip: el('claimQueueChip'),
	langSelect: el('langSelect'),
	liteMode: el('liteMode'),
	autoLockSelect: el('autoLockSelect'),
	appVersion: el('appVersion'),
	swVersion: el('swVersion'),
	btnCheckUpdate: el('btnCheckUpdate'),
	updateStatus: el('updateStatus'),
	statsScope: el('statsScope'),
	statsOrbs: el('statsOrbs'),
	statsClaims: el('statsClaims'),
	statsStreak: el('statsStreak'),
	statsAvg: el('statsAvg'),
	statsBars: el('statsBars'),
	statsRecent: el('statsRecent'),
	statsEmpty: el('statsEmpty'),
	btnStatsCsv: el('btnStatsCsv'),
	btnStatsClear: el('btnStatsClear'),
	claimPill: el('claimPill'),
	claimPillText: el('claimPillText'),
	claimPillCount: el('claimPillCount'),
	lockVeil: el('lockVeil'),
	btnUnlock: el('btnUnlock'),
	btnReqLogCopy: el('btnReqLogCopy'),
	btnReqLogClear: el('btnReqLogClear'),
	reqLogOut: el('reqLogOut'),
	btnRunIntegrity: el('btnRunIntegrity'),
	integrityOut: el('integrityOut'),
	tamperWarn: el('tamperWarn'),
	btnWipeData: el('btnWipeData'),
	skipLink: el('skipLink'),
	// Waves 21: chip tài khoản sidebar — khung nameplate ngoài + trang trí avatar + tag clan
	upFrame: el('upFrame'),
	upAvatarwrap: el('upAvatarwrap'),
	upDeco: el('upDeco'),
	upClanTag: el('upClanTag'),
	// Wave#88 (Multiaccount) — nút "Đổi tài khoản" trên hàng user panel.
	btnSwitchAccountRow: el('btnSwitchAccountRow'),
	btnSwitchAccount: el('btnSwitchAccount'),
	btnLogout2: el('btnLogout2'),
	// Wave#88 (Multiaccount) — popup "Đổi tài khoản" + xác nhận.
	accSwitchModal: el('accSwitchModal'),
	accswToken: el('accswToken'),
	accswPaste: el('accswPaste'),
	accswToggle: el('accswToggle'),
	accswToggleText: el('accswToggleText'),
	accswAdd: el('accswAdd'),
	accswGuideToggle: el('accswGuideToggle'),
	accswGuideBody: el('accswGuideBody'),
	accswCopyScript: el('accswCopyScript'),
	accswList: el('accswList'),
	accswEmpty: el('accswEmpty'),
	btnAccSwitchCancel: el('btnAccSwitchCancel'),
	accConfirmSwitchModal: el('accConfirmSwitchModal'),
	accSwitchConfirmName: el('accSwitchConfirmName'),
	accSwitchPreview: el('accSwitchPreview'),
	accSwitchPreviewAvatar: el('accSwitchPreviewAvatar'),
	accSwitchPreviewName: el('accSwitchPreviewName'),
	accSwitchPreviewId: el('accSwitchPreviewId'),
	// Wave#96 — màn "Đang đăng nhập" khi chuyển account (chỉ chữ + vòng xoay).
	loginVeil: el('loginVeil'),
	loginVeilText: el('loginVeilText'),
	loginVeilSpin: el('loginVeilSpin'),
	btnAccSwitchConfirmCancel: el('btnAccSwitchConfirmCancel'),
	btnAccSwitchConfirmOk: el('btnAccSwitchConfirmOk'),
	// Wave#89 (Cài đặt chỉ-có-display) — thông tin tài khoản + token drawer.
	accCfgAvwrap: el('accCfgAvwrap'),
	accCfgAvwrapGone: el('accCfgAvwrapGone'),
	accCfgAvatar: el('accCfgAvatar'),
	accCfgUser: el('accCfgUser'),
	accCfgDisplayName: el('accCfgDisplayName'),
	accCfgUid: el('accCfgUid'),
	accCfgUidValue: el('accCfgUidValue'),
	btnAccCfgSwitch: el('btnAccCfgSwitch'),
	btnTokenDrawer: el('btnTokenDrawer'),
	accCfgTokenBody: el('accCfgTokenBody'),
	accCfgToken: el('accCfgToken'),
	accCfgTokenHint: el('accCfgTokenHint'),
	btnTokenEye: el('btnTokenEye'),
	btnTokenEyeText: el('btnTokenEyeText'),
	btnTokenCopy: el('btnTokenCopy'),
	// Guest "Đăng nhập Discord" (hero giữa) — nút nhấn thật.
	phLoginHint: el('phLoginHint'),
	console: el('console'),
	logCount: el('logCount'),
	tabActive: el('tabActive'),
	tabNew: el('tabNew'),
	tabDone: el('tabDone'),
	countActive: el('countActive'),
	countNew: el('countNew'),
	countDone: el('countDone'),
	questListActive: el('questListActive'),
	questListNew: el('questListNew'),
	questListDone: el('questListDone'),
	stateActive: el('stateActive'),
	stateNew: el('stateNew'),
	stateDone: el('stateDone'),
	questCounter: el('questCounter'),
	// Wave#111: tìm kiếm · lọc · nhận tất cả
	questTools: el('questTools'),
	questSearch: el('questSearch'),
	btnQuestSearchClear: el('btnQuestSearchClear'),
	questFilter: el('questFilter'),
	btnClaimAll: el('btnClaimAll'),
	questFilterCount: el('questFilterCount'),
	toast: el('toast'),
};

const STATE_TEXT = {
	idle: 'Sẵn sàng',
	starting: 'Đang kết nối…',
	running: 'Đang cày nhiệm vụ',
	scanning: 'Đang quét nhiệm vụ…',
	stopping: 'Đang dừng…',
	error: 'Gặp sự cố',
};

let state = 'idle';
let currentTab = 'active';
let logText = '';
let sessionOrbsBonus = 0;

/* Quest store: khóa theo quest id ổn định (từ Discord API). */
const quests = new Map(); // id -> quest object
const questOrder = []; // id theo thứ tự quét
const selected = new Set(); // id người dùng tích chọn
const doneSeen = new Set(); // id đã phát thưởng (dedupe chống cộng orbs ảo)
let claimNoteShown = false; // chỉ báo 1 lần chuyện Discord chặn claim bằng captcha
let sessionClaimCount = 0; // Waves 27: đếm tổng số nhiệm vụ đã nhận thưởng trong phiên
let sessionClaimOrbs = 0; // Waves 27: tổng Orbs đã nhận trong phiên
/* Wave#111: tìm kiếm / lọc / nhận hàng loạt. */
let questQuery = '';
let questFilter = 'all';
let bulkClaimBusy = false;
let bulkClaimDone = 0;
let bulkClaimTotal = 0;
let questSearchTimer = null;
// Waves 40 (C): CDP có sẵn không? (Discord mở kèm --remote-debugging-port)
let cdpReady = false;
/* Wave#88 (Multiaccount): danh sách tài khoản đã lưu (không chứa token —
   token nằm ở main process, chỉ hiển thị cho drawer Cài đặt qua IPC). */
let accountsCache = [];
let activeIdxCache = 0;
let pendingSwitchIdx = -1; // index sẽ chuyển đến (đợi xác nhận)
let tokenVisibleCfg = false; // drawer Cài đặt: token hiện hay ẩn
/* Waves 27: buffer quest nhận trong lúc quét — giữ trong RAM, render 1 lượt khi
   nạp xong (tránh render dần gây lag + giật khi đang loading). */
const scanBuffer = [];

/* ═══════════════════════════════════════════════════════════════════
   WAVES #117–#131 — trạng thái cục bộ
   ═══════════════════════════════════════════════════════════════════ */
const APP_VERSION = '2.0.0';
const HISTORY_KEY = 'autoquest.history.v1';
const QUEUE_KEY = 'autoquest.claimQueue.v1';
const HISTORY_MAX = 400;
const QUEUE_TTL_MS = 30 * 60 * 1000;

let currentLang = 'vi';
let liteModeOn = false;
let autoLockMin = 0;
let lastRunConfig = null;
let claimQueue = [];
let claimProgress = null;

let historyStore = loadJsonLocal(HISTORY_KEY, {});
let queueStore = loadJsonLocal(QUEUE_KEY, {});
let historyLastKey = '';

const i18nDict = {
	'nav.quest': ['Auto Quest', 'Auto Quest'],
	'nav.settings': ['Cài Đặt', 'Settings'],
	'nav.stats': ['Thống kê', 'Stats'],
	'nav.about': ['Giới Thiệu', 'About'],
	'tab.active': ['Chưa làm', 'To do'],
	'tab.new': ['Chưa nhận', 'Unclaimed'],
	'tab.done': ['Đã làm', 'Done'],
	'act.scan': ['Quét nhiệm vụ', 'Scan quests'],
	'act.start': ['Auto ORBs', 'Auto ORBs'],
	'act.stop': ['Dừng', 'Stop'],
	'act.search': ['Tìm nhiệm vụ, game, phần thưởng…', 'Search quests, games, rewards…'],
	'act.claimAll': ['Nhận tất cả', 'Claim all'],
	'filter.all': ['Tất cả nhiệm vụ', 'All quests'],
	'filter.orbs': ['Có thưởng Orb', 'With Orb rewards'],
	'filter.manual': ['Cần làm thủ công', 'Manual only'],
	'filter.urgent': ['Sắp hết hạn (3 ngày)', 'Expiring soon (3 days)'],
	'log.title': ['Nhật ký hoạt động', 'Activity log'],
	'log.clear': ['Xóa', 'Clear'],
	'balance.label': ['Số dư khả dụng', 'Available balance'],
	'balance.guest': ['Đăng nhập để trích xuất Orb từ account', 'Sign in to read Orbs from your account'],
	'settings.account': ['Cấu hình tài khoản', 'Account'],
	'settings.appearance': ['Giao diện', 'Appearance'],
	'settings.lang': ['Ngôn ngữ giao diện', 'Interface language'],
	'settings.optimize': ['Tối ưu & riêng tư', 'Performance & privacy'],
	'settings.version': ['Phiên bản & cập nhật', 'Version & updates'],
	'settings.themeDark': ['Tối', 'Dark'],
	'settings.themeLight': ['Sáng', 'Light'],
	'settings.lite': ['Chế độ nhẹ (máy yếu)', 'Lite mode (low-end device)'],
	'settings.liteHint': [
		'Tắt bớt hiệu ứng nền, blur và chuyển động — giảm tải CPU/GPU trên máy cấu hình thấp.',
		'Reduce background effects, blur and motion to save CPU/GPU on low-end devices.',
	],
	'settings.lock': ['Tự khoá màn hình khi rảnh', 'Auto-lock when idle'],
	'settings.lockOff': ['Tắt', 'Off'],
	'settings.lockHint': [
		'Khoá chỉ che giao diện (không dừng tiến trình). Token vẫn được mã hoá trong trình duyệt.',
		'Lock only covers the interface (it does not stop the engine). Tokens stay encrypted in the browser.',
	],
	'settings.switchAcc': ['Đổi tài khoản', 'Switch account'],
	'settings.token': ['Token Discord', 'Discord token'],
	'settings.loop': ['Chế độ Treo Orb liên tục (AFK Loop)', 'Continuous Orb loop (AFK Loop)'],
	'settings.loopHint': [
		'Tự động lặp lại kiểm tra và cày nhiệm vụ mới hoặc tự thử lại sau khi hết thời gian giới hạn API.',
		'Automatically re-checks for new quests and retries after API rate limits expire.',
	],
	'settings.interval': ['Thời gian lặp lại quét:', 'Scan interval:'],
	'settings.interval15': ['Mỗi 15 phút', 'Every 15 minutes'],
	'settings.interval30': ['Mỗi 30 phút (Khuyên dùng)', 'Every 30 minutes (Recommended)'],
	'settings.interval45': ['Mỗi 45 phút (Chu kỳ Discord)', 'Every 45 minutes (Discord cycle)'],
	'settings.interval60': ['Mỗi 60 phút', 'Every 60 minutes'],
	'settings.folder': ['Thư mục cấu hình', 'Config folder'],
	'settings.data': ['Dữ liệu & chẩn đoán', 'Data & diagnostics'],
	'settings.versionApp': ['Ứng dụng', 'App'],
	'settings.versionSw': ['Service Worker', 'Service Worker'],
	'stats.title': ['Thống kê & lịch sử', 'Stats & history'],
	'stats.orbs': ['Tổng Orb đã nhận', 'Total Orbs claimed'],
	'stats.claims': ['Nhiệm vụ đã nhận', 'Quests claimed'],
	'stats.streak': ['Chuỗi ngày hoạt động', 'Active-day streak'],
	'stats.avg': ['Trung bình mỗi ngày', 'Average per day'],
	'stats.week': ['7 ngày gần nhất', 'Last 7 days'],
	'stats.recent': ['Nhận thưởng gần đây', 'Recent claims'],
	'stats.csv': ['Xuất CSV', 'Export CSV'],
	'stats.clear': ['Xoá lịch sử', 'Clear history'],
	'stats.empty': [
		'Chưa có lịch sử nhận thưởng. Lịch sử được lưu cục bộ theo từng tài khoản.',
		'No claim history yet. History is stored locally per account.',
	],
	'update.available': ['Đã có bản cập nhật mới.', 'A new version is available.'],
	'update.now': ['Cập nhật', 'Update'],
	'update.later': ['Để sau', 'Later'],
	'lock.title': ['Đã khoá màn hình', 'Screen locked'],
	'lock.desc': [
		'Tiến trình vẫn chạy nền. Bấm nút bên dưới hoặc nhấn Enter để quay lại.',
		'Your session keeps running. Press the button below or Enter to return.',
	],
	'lock.unlock': ['Mở khoá', 'Unlock'],
	'data.title': ['Dữ liệu & chẩn đoán', 'Data & diagnostics'],
	'data.backup': ['Sao lưu / Khôi phục', 'Backup / Restore'],
	'data.diag': ['Chẩn đoán môi trường', 'Environment diagnostics'],
	'data.reqlog': ['Nhật ký yêu cầu Discord', 'Discord request log'],
	'data.integrity': ['Toàn vẹn ứng dụng', 'App integrity'],
	'data.danger': ['Vùng nguy hiểm', 'Danger zone'],
	'data.close': ['Đóng', 'Close'],
	'data.runDiag': ['Chạy chẩn đoán', 'Run diagnostics'],
	'data.exportCfg': ['Xuất cấu hình (không token)', 'Export config (no token)'],
	'data.copyReq': ['Sao chép (đã che token)', 'Copy (tokens masked)'],
	'data.clearReq': ['Xoá nhật ký', 'Clear log'],
	'data.checkIntegrity': ['Kiểm tra toàn vẹn', 'Check integrity'],
	'data.wipe': ['Xoá toàn bộ dữ liệu', 'Erase all data'],
	'data.intro': [
		'Toàn bộ dữ liệu nằm trong trình duyệt này. Bản sao lưu được mã hoá bằng mật khẩu bạn đặt — không có mật khẩu thì không đọc được.',
		'All data stays in this browser. Backups are encrypted with the password you set — without it they cannot be read.',
	],
	'data.passLabel': ['Mật khẩu sao lưu (tối thiểu 8 ký tự)', 'Backup password (at least 8 characters)'],
	'data.passPlaceholder': ['Mật khẩu mã hoá file…', 'Password for backup file…'],
	'data.show': ['Hiện', 'Show'],
	'data.hide': ['Ẩn', 'Hide'],
	'data.toggleTitle': ['Hiện/ẩn mật khẩu', 'Show/hide password'],
	'data.backupExport': ['Sao lưu mã hoá', 'Encrypted backup'],
	'data.backupImport': ['Khôi phục từ file', 'Restore from file'],
	'data.backupHint': [
		'File .json chứa token đã mã hoá AES-256-GCM; khôi phục sẽ THAY THẾ toàn bộ tài khoản đang lưu.',
		'The .json file holds AES-256-GCM encrypted tokens; restoring REPLACES all saved accounts.',
	],
	'data.applyRestore': ['Ghi đè & khôi phục', 'Overwrite & restore'],
	'data.cancel': ['Huỷ', 'Cancel'],
	'data.reqlogHint': [
		'Chỉ ghi phương thức, đường dẫn, mã trạng thái và thời gian — không bao giờ ghi token.',
		'Only method, path, status code and timing are logged — tokens are never logged.',
	],
	'data.integrityWarn': [
		'Cảnh báo: tệp ứng dụng đã bị thay đổi so với bản phát hành. Chỉ tiếp tục nếu bạn tự sửa mã.',
		'Warning: app files differ from the released build. Continue only if you edited the code yourself.',
	],
	'data.dangerHint': [
		'Xoá toàn bộ dữ liệu cục bộ (token, tài khoản, lịch sử, cài đặt). Không thể hoàn tác.',
		'Erase all local data (tokens, accounts, history, settings). This cannot be undone.',
	],
	'about.title': ['Về ZoZ Development', 'About ZoZ Development'],
	'about.banner': [
		'<strong>Bảo mật 100%:</strong> Đã ngắt toàn bộ endpoint ngoài và webhook. Token được mã hóa AES-GCM ngay trong trình duyệt của bạn.',
		'<strong>100% secure:</strong> All external endpoints and webhooks are removed. Tokens are AES-GCM encrypted inside your browser.',
	],
	'about.list': [
		'<li>Chỉ kết nối <strong>discord.com</strong> — chặn đứng mọi webhook/endpoint ngoài.</li><li>Không tự nhận nhiệm vụ — chỉ cày nhiệm vụ bạn đã nhận trong Discord.</li><li>Số ORB là số THẬT: đếm từ quest đã hoàn thành + đã claim thưởng trên account.</li><li>100% local: không telemetry, không tracking, không link kiếm tiền.</li>',
		'<li>Only connects to <strong>discord.com</strong> — every webhook and external endpoint is blocked.</li><li>Never auto-claims quests — it only completes quests you enrolled in on Discord.</li><li>Orb counts are REAL: counted from completed quests and claimed rewards on your account.</li><li>100% local: no telemetry, no tracking, no monetized links.</li>',
	],
	'about.hint': [
		'Dự án phục vụ mục đích học tập và tối ưu trải nghiệm cá nhân. Không liên kết chính thức với Discord Inc.',
		'Built for learning and personal workflow optimization. Not affiliated with Discord Inc.',
	],
	'logout.title': [
		'Bạn có muốn đăng xuất tài khoản này không?',
		'Do you want to sign out of this account?',
	],
	'logout.desc': [
		'Token sẽ được xoá khỏi thiết bị. Bạn có thể đăng nhập lại bất cứ lúc nào.',
		'The token will be removed from this device. You can sign in again anytime.',
	],
	'logout.cancel': ['Huỷ', 'Cancel'],
	'logout.confirm': ['Đăng xuất', 'Sign out'],
	'common.checkUpdate': ['Kiểm tra cập nhật', 'Check for updates'],
};

function t(key) {
	const row = i18nDict[key];
	if (!row) return '';
	return row[currentLang === 'en' ? 1 : 0];
}

function loadJsonLocal(key, fallback) {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? parsed : fallback;
	} catch {
		return fallback;
	}
}

function saveJsonLocal(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* localStorage đầy — bỏ qua, chỉ mất phần phụ */
	}
}

function accountScope() {
	return currentUser && currentUser.id ? String(currentUser.id) : 'guest';
}

/* ---------------- Toast Notification ---------------- */

let toastTimer = null;

/* #107: thông báo hệ thống chỉ khi tab đang ẩn VÀ người dùng đã cấp quyền.
   Không bao giờ tự xin quyền (không làm phiền). */
function notifySystem(title, body) {
	try {
		if (!('Notification' in window) || Notification.permission !== 'granted') return;
		if (!document.hidden) return;
		new Notification(title, { body, icon: 'assets/orb-logo.png', tag: 'autoquest', silent: true });
	} catch {
		/* trình duyệt chặn — bỏ qua */
	}
}

function toast(message, isError = false) {
	ui.toast.textContent = message;
	ui.toast.classList.toggle('error', isError);
	// #107: lỗi đọc ngay (assertive), tin thường đọc lần lượt (polite).
	ui.toast.setAttribute('aria-live', isError ? 'assertive' : 'polite');
	ui.toast.classList.add('show');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2800);
	// #107: rung nhẹ khi lỗi trên thiết bị hỗ trợ — không rung với tin thường.
	// #116: chỉ rung khi tab đang được người dùng tương tác (userActivation),
	// tránh cảnh báo "Blocked call to navigator.vibrate" trên Chrome.
	if (isError && typeof navigator.vibrate === 'function') {
		const canVibrate = navigator.userActivation ? navigator.userActivation.isActive : true;
		if (canVibrate) {
			try {
				navigator.vibrate([60, 40, 60]);
			} catch {
				/* ignore */
			}
		}
	}
	if (isError) notifySystem('Auto Quest — lỗi', message);
}

/* ---------------- State Management ---------------- */

function setBusyFlags() {
	// Waves 42: nút "Dừng" phải bấm được khi CÓ nhiệm vụ đang chạy, dù tiến
	// trình đang ở trạng thái nào. Trước đây nút chỉ mở theo `state` của tiến
	// trình → có tình huống quest vẫn "Đang chạy" mà nút Dừng bị khoá, bro bấm
	// không được nên thẻ treo mãi ở "Đang chạy". Giờ tính theo NGUỒN SỰ THẬT
	// là chính danh sách nhiệm vụ.
	const busy = state === 'starting' || state === 'running' || state === 'stopping' || state === 'scanning';
	const hasRunningQuest = countRunningQuests() > 0;
	ui.btnStop.disabled = !(busy && state !== 'stopping') && !hasRunningQuest;
	ui.btnScan.disabled = busy || !ui.token.value.trim();
	ui.token.disabled = busy;
	ui.loopMode.disabled = busy;
	ui.loopInterval.disabled = busy;
	ui.btnStart.disabled = busy || selected.size === 0;
	// Wave#111: "Nhận tất cả" khoá theo tiến trình/tiến trình nhận hàng loạt.
	if (ui.btnClaimAll) ui.btnClaimAll.disabled = bulkClaimBusy || state !== 'idle';
}

/** Đếm số nhiệm vụ đang thực sự chạy (nguồn sự thật cho nút Dừng). */
function countRunningQuests() {
	let n = 0;
	for (const q of quests.values()) if (q.running && !q.stopFlag) n += 1;
	return n;
}

function setState(next, extra = {}) {
	state = next;
	// Waves 21: chip sidebar giữ đúng dạng "@username" như Discord (trạng thái đã có
	// ở card "Chế độ treo" + nút bấm), chỉ guest mới hiện gợi ý đăng nhập.
	if (ui.dprofile.dataset.state === 'guest') {
		// Waves 45b: nói rõ đường ĐĂNG NHẬP THẬT (token tài khoản), không phải mời bot.
		ui.upSub.textContent =
			currentLang === 'en' ? 'Tap to paste your account token' : 'Bấm để dán token tài khoản';
	} else {
		const uname = currentUser && currentUser.username ? `@${currentUser.username}` : '';
		if (uname) ui.upSub.textContent = uname;
		else ui.upSub.textContent = STATE_TEXT[next] || next;
	}
	setBusyFlags();
}

function updateModeDisplay() {
	// Waves 22: thẻ "Chế độ treo" đã bị xoá — chỉ log 1 dòng khi đổi chế độ.
	const mode = ui.loopMode.checked ? `Treo tự động (${ui.loopInterval.value} phút/lần)` : 'Chạy 1 lần';
	appendLog(`[Hệ thống] Chế độ: ${mode}`, 'system');
}

ui.loopMode.addEventListener('change', () => {
	ui.loopIntervalRow.style.display = ui.loopMode.checked ? 'flex' : 'none';
	updateModeDisplay();
});

ui.loopInterval.addEventListener('change', updateModeDisplay);

/* ---------------- Tab Switching ---------------- */

function switchTab(tab) {
	currentTab = tab;
	ui.tabActive.classList.toggle('active', tab === 'active');
	ui.tabNew.classList.toggle('active', tab === 'new');
	ui.tabDone.classList.toggle('active', tab === 'done');
	ui.questListActive.hidden = tab !== 'active';
	ui.questListNew.hidden = tab !== 'new';
	ui.questListDone.hidden = tab !== 'done';
	// Wave#111: chuyển tab phải tính lại thanh chọn + nút "Nhận tất cả"
	// theo bộ lọc hiện tại (không chỉ dựa vào việc lưới có thẻ hay không).
	renderQuests();
}

ui.tabActive.addEventListener('click', () => switchTab('active'));
ui.tabNew.addEventListener('click', () => switchTab('new'));
ui.tabDone.addEventListener('click', () => switchTab('done'));

/* ---------------- Log Formatter — TERMINAL #229 (self-typing) ----------------
   Mọi dòng nhật ký được "gõ" ra như terminal thật: hiện dần từng ký tự,
   có con trỏ nhấp nháy ở dòng đang gõ, có nhãn [ ok ]/[ .. ]/[ !! ]/[ $ ].
   - Không hardcode class cũ `.log-line` (đã bỏ) — dùng `.u229-line`.
   - reduced-motion: hiện NGUYÊN dòng ngay (không gõ) để không gây khó chịu.
   - Nhãn + màu: màu KHÔNG phải chỉ báo duy nhất (luôn kèm ký hiệu tag). */

/* Waves 45 — DẤU TÍCH (icon) Ở ĐẦU MỖI DÒNG.
   Bro yêu cầu rõ: nhật ký phải có "dấu tích ở đầu" chứ không chỉ chữ.
   Trước đây tôi dùng nhãn chữ ASCII `[ ok ]` — bro vẫn thấy "đéo có dấu tích".
   Nay mỗi dòng mở đầu bằng một ICON VECTOR THẬT (SVG inline, không font, không
   emoji → không bao giờ "??"), tô màu theo trạng thái:
     ✔ ok     — dấu tích (đường V lệch chuẩn)       màu xanh emerald
     ✖ err    — dấu X                               màu đỏ
     ! warn   — chấm than trong tam giác            màu vàng
     ◇ orb    — viên kim cương (Orb)                màu tím thương hiệu
     › sys    — mũi nhọn dòng hệ thống              màu mờ
   Icon luôn ĐI KÈM nhãn chữ ẩn (sr-only) nên vẫn đọc được khi mù màu. */
const U229_TAG = {
	ok: { vi: 'thành công', en: 'success' },
	warn: { vi: 'cảnh báo', en: 'warning' },
	err: { vi: 'lỗi', en: 'error' },
	orb: { vi: 'orb', en: 'orb' },
	sys: { vi: 'hệ thống', en: 'system' },
};

function u229TagLabel(kind) {
	const row = U229_TAG[kind];
	if (!row) return currentLang === 'en' ? 'system' : 'hệ thống';
	return currentLang === 'en' ? row.en : row.vi;
}
/* Waves 46e — EMLEM (LOGO) RIÊNG CHO TỪNG NHÓM, vẽ NGAY SAU nhãn `[ … ]`.
   Bro: "mỗi phần [] này bắt buộc phải có phác hoạ ra một cái logo gì đó thông
   minh chạy luôn sau text" → mỗi nhãn có một HUY HIỆU VECTOR riêng, đặt NGAY SAU
   chữ của nhãn, KHÔNG chèn vào giữa câu.
   Thiết kế: một HỌ HÌNH THỐNG NHẤT — khung lục giác (như một con chip/khiên)
   + dấu hiệu bên trong, nên 5 nhóm trông cùng một bộ logo chứ không phải 5 icon
   rời rạc. Riêng `orb` dùng ĐÚNG dấu hiệu Orb của app (ngôi sao 4 cánh) vì đó là
   thứ người dùng đang săn.
   Toàn bộ dùng `currentColor` → ăn màu ngữ nghĩa của nhóm, tự đổi theo theme. */
const U229_HEX = 'M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6z';
const U229_MARK = {
	// lục giác + dấu tích
	ok: `<path d="${U229_HEX}"/><path d="m9.1 12.1 2.1 2.1 3.9-4.3"/>`,
	// lục giác + dấu X
	err: `<path d="${U229_HEX}"/><path d="m9.6 9.6 4.8 4.8m0-4.8-4.8 4.8"/>`,
	// lục giác + chấm than
	warn: `<path d="${U229_HEX}"/><path d="M12 8.9v3.4"/><path d="M12 15.1h.01"/>`,
	// lục giác + lõi chip (hệ thống/engine)
	sys: `<path d="${U229_HEX}"/><path d="M10.3 10.3h3.4v3.4h-3.4z"/>`,
	// NGÔI SAO ORB (4 cánh) trong khung kim cương — chính là biểu tượng Orb
	orb: '<path d="M12 2.8 16 8l5.2 4-5.2 4-4 5.2-4-5.2L2.8 12 8 8z"/><path d="M12 7.4 13.7 10.3 16.6 12l-2.9 1.7L12 16.6l-1.7-2.9L7.4 12l2.9-1.7z"/>',
};
const TYPE_STEP_MS = 9; // tốc độ gõ mỗi ký tự
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
/** Người dùng có bật "giảm chuyển động" không (dùng chung cho effect/frame). */
function isReducedMotion() {
	return !!prefersReduced.matches;
}
let typeQueue = Promise.resolve(); // hàng đợi gõ tuần tự để các dòng không đè nhau

function streamOf(line, stream) {
	if (stream === 'stderr') return 'err';
	if (stream === 'system') return 'sys';
	if (/orb|orbs/i.test(line)) return 'orb';
	if (/hoàn thành|thành công|đã nhận thưởng|đăng nhập thành công/i.test(line)) return 'ok';
	if (/cảnh báo|bỏ qua|ratelimit|giới hạn|lỗi|thất bại|hết hạn/i.test(line)) return 'warn';
	return 'sys';
}

function stickConsoleBottom(force) {
	const c = ui.console;
	if (!c) return;
	const nearBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 60;
	if (force || nearBottom) c.scrollTop = c.scrollHeight;
}

/* Waves 44 — CHỐT CHẶN CUỐI chống "??" trong nhật ký (lỗi bro báo nhiều lần).
   Font nhúng của app (JetBrains Mono/Inter, subset) CÓ phủ tiếng Việt
   (U+1EA0-1EF9, U+1A0-1A1, U+1AF-1B0) nhưng KHÔNG phủ mũi tên U+2192 `→`
   (face cuối chỉ có U+2191/U+2193) hay khối vẽ U+2588/U+2593/U+2591/U+258B.
   Mọi ký tự như vậy bị Chromium vẽ thành ô "tofu" = đúng cái bro thấy là "??".
   → Thay ngay tại cửa vào bằng chuỗi ASCII tương đương. Không bao giờ "??" nữa,
     kể cả khi sau này có ai thêm chữ lạ vào log. */
const LOG_GLYPH_MAP = [
	[/→/g, '->'], [/⇒/g, '=>'], [/←/g, '<-'], [/↔/g, '<->'],
	[/↗/g, '^'], [/↘/g, 'v'], [/↑/g, '^'], [/↓/g, 'v'],
	[/[▋▊▉█▓▒░]/g, '#'], [/≥/g, '>='], [/≤/g, '<='], [/≠/g, '!='],
	[/π/g, 'pi'], [/…/g, '...'], [/·/g, '-'],
	[/[✨✳❇]/g, '*'], [/[⚠❗❕]/g, '!'], [/[❌✖✗]/g, 'x'], [/[✅✔✓]/g, 'ok'],
	[/[⏳⌛]/g, '...'], [/[🗑]/g, 'x'], [/[🎮]/g, 'game'], [/[🔒]/g, 'lock'],
];
function asciifyLog(s) {
	if (!s) return s;
	let out = s;
	for (const [re, rep] of LOG_GLYPH_MAP) out = out.replace(re, rep);
	// Lưới an toàn cuối: bỏ variation selector (U+FE0F) và mọi emoji ngoài BMP
	// (font app chắc chắn không phủ) để không còn ô vuông nào lọt ra UI.
	return out.replace(/[\uFE00-\uFE0F]/g, '').replace(/[\u{1F000}-\u{1FAFF}]/gu, '');
}

/* Waves 46e — "CHỮ CHÍNH" của mỗi dòng log được tô màu nổi hơn phần còn lại.
   Bro: "cái chữ chính đổi màu đỏ chẳng hạn, còn text thường để xanh hay gì tuỳ",
   "nhưng màu không quá sặc sỡ".
   → Chỉ 3 loại token được coi là CHÍNH, mỗi dòng thường chỉ 1–3 token:
       · tên trong ngoặc kép   "ROR2 Hallowed Concepts"
       · tên tài khoản         @duyoz
       · con số (kèm đơn vị nếu có)   69 · 7.3s · 3580 · +15 Orbs
     Phần còn lại dùng MỘT màu chữ trung tính, dịu hơn hẳn → không loè loẹt.
   Tách token trên chuỗi RAW rồi escape từng mảnh (escape cả chuỗi trước sẽ biến
   `"` thành `&quot;` và làm hỏng biểu thức dò tên trong ngoặc kép). */
const LOG_KEY_RE = /("[^"]{1,80}"|@[A-Za-z0-9._]{2,32}|\d+(?:[.,]\d+)?\s?(?:Orbs?|orbs?|giây|ms|s\b|%|phút|nhiệm vụ)?)/g;

function logBodyHtml(raw) {
	const s = String(raw == null ? '' : raw);
	let out = '';
	let last = 0;
	LOG_KEY_RE.lastIndex = 0;
	let m = LOG_KEY_RE.exec(s);
	while (m) {
		if (m.index > last) out += escapeHtml(s.slice(last, m.index));
		out += `<span class="u229-key">${escapeHtml(m[0])}</span>`;
		last = m.index + m[0].length;
		m = LOG_KEY_RE.exec(s);
	}
	if (last < s.length) out += escapeHtml(s.slice(last));
	return out;
}

/** Bỏ tiền tố `[Nhãn]` ĐÃ ĐƯỢC THỂ HIỆN bằng chip `[ hệ thống ]` ở đầu dòng.
 *  Trước đây mỗi dòng hiện HAI lần nhãn: `[ hệ thống ] [Hệ thống] Đã đăng nhập…`
 *  — đúng cái "loạn" bro thấy trong ảnh chụp. Nay chỉ còn chip. */
function stripLogPrefix(line) {
	return String(line).replace(/^\s*\[[^\]]{1,24}\]\s*/, '');
}

/** Dòng nhật ký có phải "nhận ORBS THÀNH CÔNG" → bật chữ cầu vồng chạy quanh.
 *  LƯU Ý: KHÔNG được đòi `kind === 'ok'`. `streamOf()` xét /orb/ TRƯỚC các từ
 *  khoá thành công, nên mọi dòng có chữ "Orbs" đều bị xếp vào nhóm `orb` —
 *  nếu buộc kind phải là 'ok' thì cầu vồng KHÔNG BAO GIỜ hiện (đã mắc đúng lỗi
 *  này ở lần chạy probe đầu tiên). Nay xét theo NỘI DUNG: có Orb + có dấu hiệu
 *  nhận thành công, và KHÔNG phải dòng lỗi/cảnh báo. */
function isOrbWinLine(line) {
	const s = String(line || '');
	if (!/\borbs?\b/i.test(s)) return false;
	if (/lỗi|thất bại|cảnh báo|giới hạn|hết hạn|bỏ qua|không nhận/i.test(s)) return false;
	return /(đã nhận|nhận được|thành công|\+\s*\d)/i.test(s);
}

/** Ghi nội dung dòng log và CẮT GỌN CÓ DẤU "…" nếu vượt quá 2 dòng.
 *  Bro: "1 dòng text nếu quá dài thì chỉ nên gói gọn lại trong 2 dòng hoặc giản
 *  lược nó lại hoặc ...".
 *  CSS `-webkit-line-clamp: 2` chỉ CẮT — nó không cho biết là đã cắt (và với
 *  `white-space: pre-wrap` dấu "…" tự động có thể không hiện). Vì vậy ở đây ta
 *  tự tìm độ dài vừa 2 dòng rồi thêm "…" — người đọc biết chắc là còn nữa.
 *  Tìm bằng tìm-kiếm-nhị-phân trên chuỗi RAW (mỗi lần dựng lại HTML từ raw nên
 *  không bao giờ cắt vào giữa thẻ <span>). */
function fitLogBody(body, text) {
	/* PHẢI TẮT CLAMP khi đo: với `-webkit-line-clamp`, Chromium kẹp LUÔN cả
	   `scrollHeight` về đúng 2 dòng → `scrollHeight <= clientHeight` luôn đúng →
	   tưởng "không tràn" và không bao giờ thêm "…" (đã mắc đúng lỗi này: probe
	   báo "dòng dài KHÔNG có dấu …"). Tắt clamp một nhịp để lấy chiều cao THẬT,
	   đo xong bật lại ngay trong cùng một frame nên không thấy nháy. */
	body.style.webkitLineClamp = 'unset';
	body.innerHTML = logBodyHtml(text);
	const lineH = parseFloat(getComputedStyle(body).lineHeight) || 16;
	const maxH = Math.round(lineH * 2) + 1;
	if (body.scrollHeight <= maxH) {
		body.style.webkitLineClamp = '';
		return;
	}
	let lo = 0;
	let hi = text.length;
	while (lo < hi) {
		const mid = (lo + hi + 1) >> 1;
		body.innerHTML = logBodyHtml(`${text.slice(0, mid)}…`);
		if (body.scrollHeight <= maxH) lo = mid;
		else hi = mid - 1;
	}
	body.innerHTML = logBodyHtml(`${text.slice(0, lo).trimEnd()}…`);
	body.style.webkitLineClamp = '';
}

function appendLog(line, stream) {
	line = asciifyLog(String(line == null ? '' : line));
	logText += `${line}\n`;
	if (logText.length > 2 * 1024 * 1024) logText = logText.slice(-1024 * 1024);

	const kind0 = streamOf(line, stream);
	// Waves 46e — NHẬN ORBS THÀNH CÔNG → coi là THÀNH CÔNG (nhãn + logo tick) và
	// bật chữ cầu vồng. Phải nâng kind lên 'ok' vì `streamOf` xếp mọi dòng có
	// chữ "Orb" vào nhóm `orb` (kể cả dòng nhận thưởng thành công).
	const win = isOrbWinLine(line);
	const kind = win ? 'ok' : kind0;
	const shown = stripLogPrefix(line);
	const div = document.createElement('div');
	div.className = `u229-line t-${kind}`;
	if (win) div.classList.add('is-orbwin');

	// Nhãn chữ `[ … ]` — giữ vai trò chỉ báo THỨ HAI (màu/logo không bao giờ là
	// chỉ báo duy nhất: người mù màu vẫn đọc được nhãn).
	const tag = document.createElement('span');
	tag.className = 'u229-tag';
	tag.textContent = `[ ${u229TagLabel(kind)} ]`;

	// Waves 46e — LOGO của nhóm, đặt NGAY SAU nhãn (không chèn vào giữa câu,
	// không bao giờ làm gãy dòng chữ).
	const ico = document.createElement('span');
	ico.className = 'u229-ico';
	ico.setAttribute('aria-hidden', 'true');
	ico.innerHTML = u229IconHtml(kind);

	const body = document.createElement('span');
	body.className = 'u229-body';
	div.append(tag, ico, body);
	ui.console.appendChild(div);

	while (ui.console.childElementCount > 400) {
		ui.console.removeChild(ui.console.firstChild);
	}
	stickConsoleBottom(true);

	// Gõ dần từng ký tự; các dòng xếp hàng để không chồng chữ lên nhau.
	const text = shown;
	if (prefersReduced.matches || text.length <= 2) {
		fitLogBody(body, text);
		return;
	}
	typeQueue = typeQueue.then(
		() =>
			new Promise((resolve) => {
				div.classList.add('is-typing');
				let i = 0;
				const tick = () => {
					if (!div.isConnected) {
						resolve();
						return;
					}
					i += 1;
					body.innerHTML = logBodyHtml(text.slice(0, i));
					stickConsoleBottom(false);
					if (i < text.length) {
						setTimeout(tick, TYPE_STEP_MS);
					} else {
						div.classList.remove('is-typing');
						div.classList.add('is-done');
						// Gõ xong mới cắt gọn + thêm "…" (đo được chiều cao thật).
						fitLogBody(body, text);
						stickConsoleBottom(false);
						resolve();
					}
				};
				tick();
			}),
	);
}

/* ---------------- Waves 41: TIẾN TRÌNH QUÉT bằng DÒNG TERMINAL ----------------
   Thay hẳn khối loader nổi kiểu cũ (thanh chạy + vòng xoay).
   Nay chỉ MỘT dòng trong khung nhật ký, tự cập nhật:
     [ .. ] Đang nạp nhiệm vụ  [#######---------]  42%   12/27
   (Thanh dùng ký tự ASCII `#`/`-` — Waves 42 đổi từ khối Unicode vì font app
    không phủ nên bị vẽ thành "??" — xem progressBar() bên dưới.)
   Xong → đổi thành [ ok ] Đã nạp 27 nhiệm vụ · …  rồi đứng yên.
   Không tràn viền, không phình chiều cao. */

let scanTotal = 0;
let scanDone = 0;
let scanning = false;
let scanT0 = 0;
let progEl = null; // dòng tiến trình đang hiển thị
let loaderToken = 0; // token chống race khi có lượt quét mới
/* Wave#96 (bro lệnh): bro báo "ấn quét nhiệm vụ … đợi một lúc nó mới bắt đầu
   chạy phần trăm" — tức từ lúc bấm đến event `quest:scan-progress` ĐẦU TIÊN
   từ bot có một khoảng CHẾT (kết nối Discord + lấy inventory) khiến thanh %
   đứng im ⇒ cảm giác "chậm vãi".
   VÁ: chạy một "nhịp bò" (creep) NGAY khi bấm quét — % tự bò TỪ TỪ (không nhảy
   cóc) lên tới trần mềm, và LUÔN nhường số thật khi bot gửi progress thật.
   ⇒ Nhận diện + nạp trông "ngay lập tức", vẫn mượt, không quá nhanh. */
let creepTimer = null;
let creepPct = 0;      // % hiển thị do nhịp bò giữ (khi chưa có số thật)
let creepRealSeen = false; // đã nhận progress THẬT từ bot chưa
const CREEP_CEIL = 88; // trần mềm: không bao giờ tự bò quá 88% (để 100% là của bot)
const CREEP_TICK = 90; // ms mỗi nhịp — êm, không giật

function startCreep() {
	stopCreep();
	creepPct = 0;
	creepRealSeen = false;
	creepTimer = setInterval(() => {
		if (!scanning) { stopCreep(); return; }
		// Đã có số THẬT từ bot ⇒ nhịp bò ngừng, nhường hẳn cho bumpScan().
		if (creepRealSeen) { stopCreep(); return; }
		// Bò theo hàm bão hoà: nhanh lúc đầu (phản hồi tức thì), chậm dần.
		const remain = CREEP_CEIL - creepPct;
		creepPct += Math.max(0.25, remain * 0.045);
		if (creepPct > CREEP_CEIL) creepPct = CREEP_CEIL;
		paintProgress(scanDone, scanTotal, creepPct);
	}, CREEP_TICK);
}

function stopCreep() {
	if (creepTimer) { clearInterval(creepTimer); creepTimer = null; }
}

function setLogCount(text) {
	if (!ui.logCount) return;
	if (ui.logCount.textContent === text) return;
	ui.logCount.textContent = text;
	ui.logCount.classList.remove('is-bump');
	void ui.logCount.offsetWidth; // reflow để animation chạy lại
	ui.logCount.classList.add('is-bump');
}

/** Back-compat: tên cũ dropLoader() vẫn được gọi ở vài chỗ → xoá dòng tiến trình. */
function dropLoader() {
	dropProgress();
}

const PROG_BAR_CELLS = 16;

/* Waves 42 — SỬA LỖI "??" TRONG NHẬT KÝ:
   Trước đây thanh tiến trình dùng khối Unicode `▓` (U+2593) / `░` (U+2591) và con
   trỏ `▋` (U+258B). Bộ font của app (JetBrains Mono) chỉ nhúng subset latin —
   KHÔNG face nào phủ khối vẽ → Chromium vẽ ô "tofu" (bro thấy "??").
   Nay dùng ký tự ASCII thuần (`#` và `-`) + con trỏ `_`: có ở MỌI font trên mọi
   máy, không bao giờ thành "??". Vẫn giữ đúng hình dạng thanh tiến trình. */
function progressBar(shown, target) {
	const pct = Math.max(0, Math.min(100, target));
	let filled = Math.round((pct / 100) * PROG_BAR_CELLS);
	// Luôn có ít nhất 1 ô sáng khi đang chạy → thấy chuyển động ngay cả khi 0%.
	if (scanning && filled < 1) filled = 1;
	return '[' + '#'.repeat(filled) + '-'.repeat(PROG_BAR_CELLS - filled) + ']';
}

/** SVG huy hiệu của một nhóm (dùng cho cả dòng nhật ký và dòng tiến trình).
 *  Waves 46e: chuyển từ "một nét đơn" sang HỌ HÌNH LỤC GIÁC để mỗi nhóm có một
 *  LOGO nhận diện được, đúng yêu cầu bro. */
function u229IconHtml(kind, size) {
	const s = size || 13;
	return (
		`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" ` +
		`stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">` +
		`${U229_MARK[kind] || U229_MARK.sys}</svg>`
	);
}

function ensureProg() {
	if (progEl && progEl.isConnected) return progEl;
	progEl = document.createElement('div');
	progEl.className = 'u229-prog is-live';
	progEl.innerHTML =
		`<span class="u229-ico" aria-hidden="true">${u229IconHtml('sys')}</span>` +
		'<span class="u229-prog-label">Đang nạp nhiệm vụ</span>' +
		'<span class="u229-prog-bar" aria-hidden="true"></span>' +
		'<span class="u229-prog-pct mono">0%</span>' +
		'<span class="u229-prog-count mono">0/0</span>';
	ui.console.appendChild(progEl);
	stickConsoleBottom(true);
	return progEl;
}

function paintProgress(done, total, shownPct) {
	const el = ensureProg();
	const pct = typeof shownPct === 'number' ? shownPct : total > 0 ? (done / total) * 100 : 0;
	el.querySelector('.u229-prog-bar').textContent = progressBar(done, pct);
	el.querySelector('.u229-prog-pct').textContent = `${Math.round(pct)}%`;
	el.querySelector('.u229-prog-count').textContent = total > 0 ? `${done}/${total}` : `${done}`;
	el.setAttribute('role', 'progressbar');
	el.setAttribute('aria-valuemin', '0');
	el.setAttribute('aria-valuemax', '100');
	el.setAttribute('aria-valuenow', String(Math.round(pct)));
	el.setAttribute('aria-label', `Đang nạp nhiệm vụ ${Math.round(pct)} phần trăm`);
	stickConsoleBottom(false);
}

function dropProgress() {
	stopCreep(); // Wave#96: bỏ dòng tiến trình ⇒ tắt nhịp bò (không chạy nền)
	if (progEl) {
		progEl.remove();
		progEl = null;
	}
}

function setScanning(on, total) {
	const wasScanning = scanning;
	scanning = !!on;
	if (on) {
		if (!wasScanning) {
			scanDone = 0;
			scanTotal = typeof total === 'number' && total > 0 ? total : 0;
			scanT0 = Date.now();
			loaderToken += 1;
			dropProgress();
			paintProgress(0, scanTotal, 0);
			// Wave#96: bật nhịp bò NGAY ⇒ % chạy tức thì, không đợi event đầu.
			startCreep();
		} else if (typeof total === 'number' && total > 0) {
			scanTotal = total;
			paintProgress(scanDone, scanTotal);
		}
		setLogCount(scanTotal ? `${scanDone}/${scanTotal}` : '0');
	} else {
		// Wave#96: tắt nhịp bò khi kết thúc/ngừng quét.
		stopCreep();
		if (typeof total === 'number' && total > 0) scanTotal = total;
		setLogCount(scanTotal ? `${scanDone}/${scanTotal}` : '0/0');
	}
	setListsLoading(scanning);
	document.body.classList.toggle('is-scanning', scanning);
	// Wave#111: quét xong phải áp lại trạng thái rỗng THEO BỘ LỌC — trong lúc
	// quét, setListsLoading giữ spinner nên trạng thái "không khớp" bị hoãn.
	if (!scanning && wasScanning) renderQuests();
}

function bumpScan(done, total) {
	if (typeof total === 'number' && total > 0) scanTotal = total;
	scanDone = done || 0;
	// Wave#96: có số THẬT ⇒ nhường hẳn cho số thật (nhịp bò tự dừng ở tick sau,
	// nhưng đánh dấu ngay để %.không bị nhịp bò ghi đè trong frame kế tiếp).
	if ((done > 0) || (typeof total === 'number' && total > 0)) creepRealSeen = true;
	setLogCount(`${scanDone}/${scanTotal || scanDone}`);
	if (scanning) {
		const pct = scanTotal > 0 ? (scanDone / scanTotal) * 100 : 0;
		paintProgress(scanDone, scanTotal, pct);
	}
}

/** Chốt tiến trình: đẩy 100%, ghi 1 dòng tổng kết kiểu terminal, xoá dòng động. */
function finishLoader(total, breakdown) {
	stopCreep(); // Wave#96: chốt xong ⇒ tắt nhịp bò
	if (!progEl) {
		// chưa từng có dòng tiến trình → chỉ ghi tổng kết
		if (total) writeScanSummary(total, breakdown, 0);
		return;
	}
	scanTotal = total || scanTotal;
	scanDone = scanTotal;
	const token = loaderToken;
	const el = progEl;
	if (el) {
		el.classList.remove('is-live');
		el.classList.add('is-done');
		// Waves 45: dòng tiến trình cũng đổi sang DẤU TÍCH khi xong.
		const ico = el.querySelector('.u229-ico');
		if (ico) ico.innerHTML = u229IconHtml('ok');
		el.querySelector('.u229-prog-label').textContent =
			currentLang === 'en' ? 'Scan complete' : 'Đã nạp xong';
		el.querySelector('.u229-prog-bar').textContent = progressBar(scanTotal, 100);
		el.querySelector('.u229-prog-pct').textContent = '100%';
		el.querySelector('.u229-prog-count').textContent = `${scanTotal}/${scanTotal}`;
	}
	setLogCount(`${scanDone}/${scanTotal || scanDone}`);
	const secs = scanT0 ? Math.max(0.1, (Date.now() - scanT0) / 1000) : 0;

	// Giữ đủ lâu để mắt kịp thấy, rồi thay bằng 1 dòng tĩnh trong log.
	const minHold = 620;
	const wait = Math.max(0, minHold - (Date.now() - scanT0));
	setTimeout(() => {
		if (token !== loaderToken) return;
		dropProgress();
		writeScanSummary(scanTotal, breakdown, secs);
	}, wait);
}

function writeScanSummary(total, breakdown, secs) {
	const en = currentLang === 'en';
	const bits = [];
	if (breakdown) {
		if (breakdown.active) bits.push(en ? `${breakdown.active} to do` : `${breakdown.active} chưa làm`);
		if (breakdown.fresh) bits.push(en ? `${breakdown.fresh} unclaimed` : `${breakdown.fresh} chưa nhận`);
		if (breakdown.done) bits.push(en ? `${breakdown.done} claimed` : `${breakdown.done} đã nhận`);
	}
	const tail = bits.length ? ` · ${bits.join(' · ')}` : '';
	const t = secs ? ` (${secs.toFixed(1)}s)` : '';
	appendLog(
		en ? `Loaded ${total} quests${t}${tail}` : `Đã nạp ${total} nhiệm vụ${t}${tail}`,
		'ok',
	);
}

/** Thông điệp trạng thái rỗng của danh sách nhiệm vụ, đổi ngôn ngữ theo cài đặt. */
function emptyMsg(kind) {
	const en = currentLang === 'en';
	switch (kind) {
		case 'loading':
			return en ? 'Loading quests…' : 'Đang tải nhiệm vụ…';
		case 'hint':
			return en
				? 'No quests yet — press <strong>Scan quests</strong> to load.'
				: 'Chưa có nhiệm vụ nào — bấm <strong>Quét nhiệm vụ</strong> để tải.';
		case 'active':
			return en ? 'No unfinished quests.' : 'Không còn nhiệm vụ nào chưa làm.';
		case 'claimable':
			return en ? 'No quests awaiting claim.' : 'Không có nhiệm vụ nào chờ nhận thưởng.';
		case 'done':
			return en ? 'No claimed quests yet.' : 'Chưa nhận thưởng nhiệm vụ nào.';
		case 'filter':
			return en ? 'No quests match the current filter.' : 'Không có nhiệm vụ nào khớp bộ lọc.';
		default:
			return '';
	}
}

/** 3 tab đều xoay vòng khi bắt đầu quét (theo yêu cầu: loading đồng bộ cả 3 mục). */
function setListsLoading(on) {
	for (const [list, state] of [
		[ui.questListActive, ui.stateActive],
		[ui.questListNew, ui.stateNew],
		[ui.questListDone, ui.stateDone],
	]) {
		if (!list || !state) continue;
		const cards = list.querySelectorAll('.qcard, .qdone');
		const txt = state.querySelector('.qstate-text');
		if (on) {
			state.hidden = false;
			state.classList.remove('is-empty');
			if (txt) txt.textContent = emptyMsg('loading');
			for (const c of cards) c.classList.add('is-loading');
		} else {
			for (const c of cards) c.classList.remove('is-loading');
			// Chưa quét / không có nhiệm vụ → trạng thái RỖNG, không xoay vòng.
			if (!cards.length) {
				state.hidden = false;
				state.classList.add('is-empty');
				if (txt) {
					txt.innerHTML = emptyMsg('hint');
				}
			}
		}
	}
}

/* ---------------- Quest Rendering (node-level update) ---------------- */

const TASK_LABEL = {
	WATCH_VIDEO: { vi: 'Xem video', en: 'Watch video' },
	WATCH_VIDEO_ON_MOBILE: { vi: 'Xem video (Mobile)', en: 'Watch video (mobile)' },
	PLAY_ON_DESKTOP: { vi: 'Chơi trên PC', en: 'Play on desktop' },
	PLAY_ON_XBOX: { vi: 'Chơi trên Xbox', en: 'Play on Xbox' },
	PLAY_ON_PLAYSTATION: { vi: 'Chơi trên PS', en: 'Play on PlayStation' },
	PLAY_ACTIVITY: { vi: 'Hoạt động Voice', en: 'Voice activity' },
	STREAM_ON_DESKTOP: { vi: 'Stream voice', en: 'Stream in voice' },
	ACHIEVEMENT_IN_ACTIVITY: { vi: 'Thành tựu Discord', en: 'Discord achievement' },
};

function taskLabel(task) {
	const row = TASK_LABEL[task];
	if (!row) return '';
	return currentLang === 'en' ? row.en : row.vi;
}

function escapeHtml(text) {
	return String(text ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function canSelectQuest(q) {
	// Waves 24: cho chọn CẢ nhiệm vụ "Chưa làm" (chưa nhận). Bot chỉ đăng ký đúng
	// những nhiệm vụ người dùng đã tích — không đụng tới quest khác.
	return q.status === 'todo' && q.automatable !== false;
}

/* Wave#111 — TÌM KIẾM & LỌC NHIỆM VỤ
   Lọc thuần phía UI, không đụng dữ liệu engine. Bỏ dấu tiếng Việt để gõ
   "nhan vat" vẫn tìm ra "Nhân vật"; mọi từ khoá phải khớp (AND). */
function foldText(s) {
	return String(s == null ? '' : s)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.toLowerCase()
		.trim();
}

function isQuestFiltering() {
	return questFilter !== 'all' || !!questQuery;
}

function questMatchesFilter(q) {
	if (!q || q.flag === 'gone') return false;
	if (questFilter === 'orbs' && !(Number(q.orbs) > 0)) return false;
	if (questFilter === 'manual' && q.automatable !== false) return false;
	if (questFilter === 'urgent') {
		const t = q.expiresAt ? Date.parse(q.expiresAt) : NaN;
		if (!Number.isFinite(t)) return false;
		const delta = t - Date.now();
		if (delta < 0 || delta > 3 * 86400000) return false;
	}
	if (!questQuery) return true;
	const hay = foldText(
		[
			q.name,
			q.gameTitle,
			q.publisher,
			q.application,
			q.rewardName,
			q.rewardTitle,
			q.taskLabel,
			taskLabel(q.task),
			q.orbs ? `${q.orbs} orbs` : '',
		]
			.filter(Boolean)
			.join(' '),
	);
	for (const word of foldText(questQuery).split(/\s+/)) {
		if (word && !hay.includes(word)) return false;
	}
	return true;
}

/* =====================================================================
   Waves 22 — THẺ NHIỆM VỤ KIỂU DISCORD
   - Dữ liệu 100% THẬT từ API: banner (config.assets.hero), nhà phát hành,
     hạn kết thúc, ảnh phần thưởng (orb / avatar decoration), mô tả.
   - Không còn thanh tiến độ ngang, không nút "↗ Discord", không dấu 3 chấm.
   - Tiến độ = VÒNG TRÒN chạy theo chiều kim đồng hồ quanh ảnh thưởng,
     rê chuột vào ảnh mới hiện %.
   ===================================================================== */

/* Waves 23 — SỬA GỐC LỖI ẢNH:
   `config.assets.*` của Discord KHÔNG phải hash mà là ĐƯỜNG DẪN TƯƠNG ĐỐI
   dạng `quests/<quest_id>/<snowflake>.jpg|png|mp4`. URL thật chỉ là
   CDN + đường dẫn đó (đã verify: trả 200 image/jpeg thật).
   Giá trị "PLACEHOLDER" = Discord không có asset → coi như rỗng.
   Nhờ vậy KHÔNG còn dò đuôi file, không còn 4 request hỏng mỗi ảnh. */
const QCDN = 'https://cdn.discordapp.com/';

function questAssetUrl(p) {
	const s = String(p ?? '').trim();
	if (!s || s.toUpperCase() === 'PLACEHOLDER') return '';
	if (/^https?:\/\//i.test(s)) return s;
	return QCDN + s.replace(/^\/+/, '');
}

/* Waves 42 — LOGO CHUẨN CỦA TỪNG NHIỆM VỤ.
   `assets.logotype` / `assets.game_tile` của Discord RẤT HAY là "PLACEHOLDER"
   (không có asset) → trước đây UI rơi về logo Orb nên bro thấy "lúc hiện lúc
   không, thành ra có mỗi logo orb chả phải của nhiệm vụ nào".
   `application.icon` LUÔN có (hash icon app/game trên CDN) → dùng làm nguồn
   DỰ PHÒNG ĐÚNG, cho ra logo THẬT của từng game.
   Thứ tự ưu tiên: logotype_dark → logotype_light → logotype → game_tile(_dark/_light)
   → icon application. Chỉ khi TẤT CẢ đều rỗng mới dùng logo Orb. */
function appIconUrl(id, icon, size) {
	if (!id || !icon) return '';
	const ext = String(icon).startsWith('a_') ? 'gif' : 'png';
	return `${QCDN}app-icons/${id}/${icon}.${ext}?size=${size || 128}`;
}

/** Ảnh logo THẬT của quest (không bao giờ trả logo Orb). '' nếu không có gì. */
function questLogoUrl(q) {
	const direct = questAssetUrl(q.logotype) || questAssetUrl(q.gameTile);
	if (direct) return direct;
	return appIconUrl(q.appId, q.appIcon);
}

/** Gán ảnh/video quest từ đường dẫn tương đối của API. Trả false nếu không có asset. */
function setQuestImg(img, p) {
	const url = questAssetUrl(p);
	if (!url) return false;
	img.addEventListener('error', () => img.remove(), { once: true });
	img.src = url;
	return true;
}

function toHexColor(v) {
	if (v === null || v === undefined || v === '') return '';
	const s = String(v).trim();
	if (s.startsWith('#')) return s.length >= 7 ? s.slice(0, 7) : s;
	if (/^\d+$/.test(s)) return `#${Number(s).toString(16).padStart(6, '0')}`;
	if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`;
	return '';
}

function fmtShortDate(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/* Waves 30/46 — LOGO ORB (ảnh do bro cung cấp, đã TÁCH NỀN sạch).
   File: web/app/assets/orb-logo.png (256×256) — dùng cho glyph nhỏ inline.
   Waves 46: bro yêu cầu orb TO Ở CHÍNH GIỮA → thêm bản orb-logo-big.png
   (500×500, alpha thật) dùng cho logo lớn giữa thẻ hero + các ô "Đã làm".
   Giữ class .orb-glyph để CSS cũ áp dụng. */
const ORB_GLYPH =
	'<img class="orb-glyph" src="assets/orb-logo.png" alt="" aria-hidden="true" draggable="false" />';

/* Waves 46 — ảnh logo Orb TO (500×500) cho vị trí chính giữa + ô "Đã làm". */
const ORB_ICON_SRC = 'assets/orb-logo-big.png';

/* Waves 46b — ORB LỚN LÀ ẢNH CỦA Ô AVATAR HERO (không còn lớp phủ lơ lửng).
   Quy tắc: chỉ bật orb khi (a) user KHÔNG có ảnh đại diện thật, và (b) file
   ảnh nạp được thật sự. Ảnh hỏng → gỡ class, hình người mặc định quay lại.
   Ảnh gốc bro đưa còn nguyên MÀN ĐEN alpha=128 phủ toàn khung; đã tách nền
   thật bằng tools/cutout-orb-alpha.py (alpha=0 ở vùng ngoài đĩa orb). */
let heroOrbOk = null; // null = chưa biết, true/false = kết quả nạp ảnh

function syncHeroOrb() {
	const avatarEl = ui.phAvatar;
	const orbImg = ui.phAvatarOrb;
	if (!avatarEl || !orbImg) return;
	const hasPhoto = avatarEl.classList.contains('has-photo');
	if (hasPhoto) {
		avatarEl.classList.remove('has-orb');
		return;
	}
	const apply = (ok) => {
		heroOrbOk = ok;
		avatarEl.classList.toggle('has-orb', ok);
	};
	if (heroOrbOk !== null) return apply(heroOrbOk);
	if (orbImg.complete) return apply(orbImg.naturalWidth > 0);
	orbImg.addEventListener(
		'load',
		() => apply(orbImg.naturalWidth > 0),
		{ once: true },
	);
	orbImg.addEventListener('error', () => apply(false), { once: true });
}

/* Waves 44 — thương hiệu CỘNG ĐỒNG hiển thị khi CHƯA đăng nhập.
   Bro: "bro xóa đi replace lại bằng ZoZ Community nhé; nếu user không có ảnh bìa
   và avt thì bro để mặc định như này". Tên + khai báo đặt 1 chỗ để đổi dễ. */
const ZOZ_NAME = 'ZoZ Community';
/* Wave#96 (bro lệnh): CẤM mọi tiền tố/hậu tố kiểu "Nền tảng ALL IN ONE DISCORD".
   Bro: "tên app chỉ có ZoZ Development mà thôi, các tiền tố phía sau như nền
   tảng All in one tự động xoá sạch". Hằng này dùng cho profile khách ⇒ chỉ để
   đúng tên app. */
const ZOZ_TAG = 'ZoZ Development';

/** Avatar mặc định (silhouette người) — dùng khi chưa đăng nhập / không có avatar.
 *  Thuần SVG nội bộ, không gọi mạng, nên luôn hiện được kể cả khi offline. */
function defaultAvatarSvg(size) {
	const s = Number(size) || 24;
	return (
		`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor" aria-hidden="true">` +
		'<path d="M12 12c2.7 0 4.8-2.2 4.8-4.9S14.7 2.3 12 2.3 7.2 4.4 7.2 7.1 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.9v2.4h19.2v-2.4c0-3.3-6.4-4.9-9.6-4.9z"/>' +
		'</svg>'
	);
}

/* Waves 25: 3 trạng thái ĐÚNG theo repo gốc (Discord-Auto-Quests/src/engine.ts):
     isCompleted() = có completed_at · isClaimed() = có claimed_at
   → 'todo'      : CHƯA LÀM  (chưa completed_at, dù đã nhận hay chưa nhận nhiệm vụ)
   → 'claimable' : CHƯA NHẬN (đã xong 100% nhưng CHƯA nhận thưởng)
   → 'claimed'   : ĐÃ LÀM    (đã xong + ĐÃ nhận thưởng)
   Trước đây tôi map 'new'(chưa enroll) → "Chưa nhận" nên tab đó đầy quest rác. */
const STATE_LABEL = {
	todo: { vi: 'Chưa làm', en: 'To do' },
	claimable: { vi: 'Chờ nhận', en: 'Unclaimed' },
	claimed: { vi: 'Đã nhận', en: 'Claimed' },
	running: { vi: 'Đang chạy', en: 'Running' },
	skip: { vi: 'Bỏ qua', en: 'Skipped' },
	error: { vi: 'Lỗi', en: 'Error' },
};

function stateLabel(status) {
	const row = STATE_LABEL[status];
	if (!row) return currentLang === 'en' ? 'To do' : 'Chưa làm';
	return currentLang === 'en' ? row.en : row.vi;
}

function questPct(q) {
	if (q.status === 'claimed' || q.status === 'claimable') return 100;
	const need = q.secondsNeeded || 0;
	const done = q.secondsDone || 0;
	if (!need) return 0;
	return Math.max(0, Math.min(100, Math.round((done / need) * 100)));
}

/** Mô tả kiểu Discord: "<Loại nhiệm vụ> trong N phút và nhận thưởng <X>."
 *  Wave#126 follow-up: cùng câu, nhưng đổi ngôn ngữ theo cài đặt. */
function questDesc(q) {
	const en = currentLang === 'en';
	const label = taskLabel(q.task) || q.taskLabel || (en ? 'Complete the quest' : 'Hoàn thành nhiệm vụ');
	const mins = q.secondsNeeded ? Math.round(q.secondsNeeded / 60) : 0;
	const reward = q.orbs ? `${q.orbs} Orbs` : q.rewardName || (en ? 'the reward' : 'phần thưởng');
	return en
		? `${label}${mins ? ` for ${mins} minutes` : ''} and earn ${reward}.`
		: `${label}${mins ? ` trong ${mins} phút` : ''} và nhận thưởng ${reward}.`;
}

function buildQuestCard(q) {
	const node = document.createElement('article');
	node.className = 'qcard';
	node.dataset.questId = q.id;
	node.dataset.rewardKind = q.rewardKind || 'orbs';

	// Chỉ nhiệm vụ CHƯA XONG mới chọn để cày; nhiệm vụ đã xong thì đi nhận thưởng.
	const isDone = q.status === 'claimed' || q.status === 'claimable';
	const selectable = canSelectQuest(q);
	const en = currentLang === 'en';
	const checkTitle = selectable
		? en
			? 'Select this quest'
			: 'Chọn nhiệm vụ này'
		: en
			? 'Manual quest — cannot be auto-run'
			: 'Nhiệm vụ phải làm thủ công';
	const checkHtml = isDone
		? ''
		: `<label class="qcard-check" title="${checkTitle}">
				<input type="checkbox" data-quest-check="${escapeHtml(q.id)}" aria-label="${en ? 'Select' : 'Chọn'} ${escapeHtml(q.name || '')}"${selectable ? '' : ' disabled'} />
			</label>`;

	node.innerHTML = `
		<div class="qcard-banner">
			${checkHtml}
			<span class="qcard-state"></span>
		</div>
		<div class="qcard-body">
			<div class="qcard-pub">
				<span class="qcard-pub-l">
					<span class="qcard-pub-caption">${en ? 'Promoted by' : 'Được quảng bá bởi'}</span>
					<svg class="qcard-verified" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2 15 4.5 18.8 4.2 20.4 7.6 23.4 10.2 22.4 13.9 23.4 17.6 20.4 20.2 18.8 23.6 15 23.3 12 25.8 9 23.3 5.2 23.6 3.6 20.2 0.6 17.6 1.6 13.9 0.6 10.2 3.6 7.6 5.2 4.2 9 4.5z" transform="translate(0 -1.4) scale(.96)"/><path d="m10.6 15.2-2.7-2.7 1.2-1.2 1.5 1.5 4-4 1.2 1.2z" fill="#0b0c10"/></svg>
					<b class="qcard-pub-name"></b>
				</span>
				<span class="qcard-end"></span>
			</div>
			<div class="qcard-main">
				<div class="qcard-reward">
					<svg class="qring" viewBox="0 0 44 44" aria-hidden="true">
						<circle class="qring-bg" cx="22" cy="22" r="20"></circle>
						<circle class="qring-fg" cx="22" cy="22" r="20"></circle>
					</svg>
					<span class="qcard-reward-art"></span>
					<span class="qcard-pct">0%</span>
				</div>
				<div class="qcard-info">
					<span class="qcard-kicker"></span>
					<span class="qcard-title"></span>
					<span class="qcard-desc"></span>
				</div>
			</div>
		</div>
		<!-- Waves 31: hàng nút trạng thái — Chưa làm (khoá) / Nhận (bấm được) / Đã nhận -->
		<div class="qcard-foot">
			<button type="button" class="qcard-act" data-act="todo" disabled></button>
		</div>
	`;

	updateQuestCard(node, q);
	return node;
}

/* Waves 31: nội dung + hành vi nút trạng thái theo đúng trạng thái thật của quest.
   - todo      → "Chưa làm"      (disabled, không bấm)
   - claimable → "Nhận N Orbs"   (bấm → claim thật, captcha thì mở modal)
   - busy      → "Đang nhận…"    (đang gọi Discord)
   - claimed   → "Đã nhận"       (tick xanh, không bấm)
   - error     → "Thử lại"       (claim lỗi, cho thử lại)
   KHÔNG tự cộng orbs — chỉ đổi trạng thái khi Discord trả OK thật. */
const ACT_ICON = {
	todo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
	claim:
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/><path d="m9 11 3 3 9-9"/></svg>',
	busy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.6"/></svg>',
	claimed:
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
	error:
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/></svg>',
	// Waves 40 (B): captcha trong app bị hCaptcha "passive" chặn → mở Discord thật
	// để nhận (captcha chạy native ở đó). Cùng khuôn nút, chỉ khác nhãn/hành vi.
	open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
};

function updateQuestFoot(node, q) {
	const r = node._r || {};
	const btn = r.act;
	if (!btn) return;
	const en = currentLang === 'en';

	let act;
	let label;
	if (q.claimBusy) {
		act = 'busy';
		label = q.claimPhase || (en ? 'Claiming…' : 'Đang nhận…');
	} else if (q.claimOpenDiscord) {
		// Waves 40 (B): app không tự nhận được (hCaptcha passive) → nút này đưa
		// người dùng sang Discord thật. CÙNG một nút .qcard-act, chỉ đổi hành vi.
		act = 'open';
		label = en ? 'Open Discord to claim' : 'Mở Discord để nhận';
	} else if (q.claimError) {
		act = 'error';
		label = en ? 'Try again' : 'Thử lại';
	} else if (q.status === 'claimed') {
		act = 'claimed';
		label = en ? 'Claimed' : 'Đã nhận';
	} else if (q.status === 'claimable') {
		act = 'claim';
		label = q.orbs ? `${en ? 'Claim' : 'Nhận'} ${q.orbs} Orbs` : en ? 'Claim reward' : 'Nhận thưởng';
	} else {
		act = 'todo';
		label = q.stopFlag
			? en
				? 'Stopped'
				: 'Đã dừng'
			: q.running
				? en
					? 'Working…'
					: 'Đang cày…'
				: en
					? 'To do'
					: 'Chưa làm';
	}

	if (btn.dataset.act !== act) btn.dataset.act = act;
	btn.disabled = act === 'todo' || act === 'claimed' || act === 'busy';
	if (btn.dataset.label !== label) {
		btn.dataset.label = label;
		btn.innerHTML = `${ACT_ICON[act] || ''}<span>${escapeHtml(label)}</span>`;
	}
	if (btn.title !== label) btn.title = label;
	node.classList.add('has-foot');
}

function updateQuestCard(node, q) {
	// Cache tham chiếu DOM — updateQuestCard chạy mỗi frame khi đang cày
	const r =
		node._r ||
		(node._r = {
			banner: node.querySelector('.qcard-banner'),
			state: node.querySelector('.qcard-state'),
			pub: node.querySelector('.qcard-pub-name'),
			pubCaption: node.querySelector('.qcard-pub-caption'),
			end: node.querySelector('.qcard-end'),
			art: node.querySelector('.qcard-reward-art'),
			kicker: node.querySelector('.qcard-kicker'),
			title: node.querySelector('.qcard-title'),
			desc: node.querySelector('.qcard-desc'),
			ring: node.querySelector('.qring-fg'),
			pct: node.querySelector('.qcard-pct'),
			check: node.querySelector('input[data-quest-check]'),
			act: node.querySelector('.qcard-act'),
		});

	node.dataset.status = q.stopFlag
		? 'stop'
		: q.running
			? 'running'
			: q.flag || q.status;
	const sel = selected.has(q.id) ? '1' : '0';
	if (node.dataset.selected !== sel) node.dataset.selected = sel;

	// ---- Banner thật + logo game (1 lần / thẻ) ----
	const banner = r.banner;
	if (!banner.dataset.media) {
		banner.dataset.media = '1';
		const grad = [toHexColor(q.colorPrimary), toHexColor(q.colorSecondary)].filter(Boolean);
		if (grad.length === 2) banner.style.background = `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`;
		if (q.hero) {
			const img = document.createElement('img');
			img.alt = '';
			img.loading = 'lazy';
			img.decoding = 'async';
			if (setQuestImg(img, q.hero)) banner.appendChild(img);
		}
		// Waves 42: logo THẬT của nhiệm vụ — ưu tiên logotype/game_tile, thiếu thì
		// dùng icon application (luôn có). Nếu ảnh lỗi → thử tiếp icon app, cuối
		// cùng mới bỏ (không hiện logo Orb sai nhiệm vụ).
		const logoUrl = questLogoUrl(q);
		if (logoUrl) {
			const logo = document.createElement('img');
			logo.className = 'qcard-logo';
			logo.alt = '';
			logo.loading = 'lazy';
			logo.decoding = 'async';
			let triedAppIcon = questAssetUrl(q.logotype) || questAssetUrl(q.gameTile) ? false : true;
			const fallback = appIconUrl(q.appId, q.appIcon);
			logo.addEventListener(
				'error',
				() => {
					if (!triedAppIcon && fallback && logo.src !== fallback) {
						triedAppIcon = true;
						logo.src = fallback;
					} else {
						logo.remove();
					}
				},
				{ once: true },
			);
			logo.src = logoUrl;
			banner.appendChild(logo);
		}
	}

	// ---- Nhãn trạng thái ----
	// Waves 42: "Dừng" là trạng thái RIÊNG, ĐỎ — không còn treo ở "Đang chạy"
	// sau khi người dùng bấm nút Dừng.
	const en = currentLang === 'en';
	const label = q.stopFlag
		? en
			? 'Stopped'
			: 'Dừng'
		: q.running
			? en
				? 'Running'
				: 'Đang chạy'
			: q.flag === 'skip'
				? en
					? 'Skipped'
					: 'Bỏ qua'
				: q.flag === 'error'
					? en
						? 'Error'
						: 'Lỗi'
					: stateLabel(q.status);
	if (r.state.textContent !== label) r.state.textContent = label;

	// ---- Nhà phát hành + hạn ----
	if (r.pubCaption) {
		const caption = en ? 'Promoted by' : 'Được quảng bá bởi';
		if (r.pubCaption.textContent !== caption) r.pubCaption.textContent = caption;
	}
	const pubText = q.publisher || q.application || q.gameTitle || 'Discord';
	if (r.pub.textContent !== pubText) r.pub.textContent = pubText;
	const endText = q.expiresAt
		? `${en ? 'Ends' : 'Kết thúc vào'} ${fmtShortDate(q.expiresAt)}`
		: '';
	if (r.end.textContent !== endText) r.end.textContent = endText;

	// ---- Ảnh phần thưởng (orb hoặc avatar decoration) ----
	if (!r.art.dataset.built) {
		r.art.dataset.built = '1';
		if (q.rewardKind === 'item' && q.rewardAsset) {
			const media = rewardMediaEl(q);
			if (media) r.art.appendChild(media);
			else r.art.innerHTML = ORB_GLYPH;
		} else {
			r.art.innerHTML = ORB_GLYPH;
		}
	}

	// ---- Kicker / tiêu đề / mô tả ----
	const kickerText = `${en ? 'Quest' : 'Nhiệm vụ'} ${q.name || q.gameTitle || 'Discord'}`.toUpperCase();
	if (r.kicker.textContent !== kickerText) r.kicker.textContent = kickerText;

	const titleText =
		q.rewardTitle ||
		(q.orbs
			? `${en ? 'Claim' : 'Nhận'} ${q.orbs} Orbs`
			: en
				? 'Claim Discord reward'
				: 'Nhận phần thưởng Discord');
	if (r.title.textContent !== titleText) {
		r.title.textContent = titleText;
		r.title.title = titleText;
	}

	const descText = questDesc(q);
	if (r.desc.textContent !== descText) r.desc.textContent = descText;

	// ---- Vòng tiến độ + % ----
	const pct = questPct(q);
	if (r.ring) {
		const C = 125.66; // 2πr, r = 20
		const off = String(Math.round((C - (C * pct) / 100) * 100) / 100);
		if (r.ring.style.strokeDashoffset !== off) r.ring.style.strokeDashoffset = off;
	}
	const pctText = `${pct}%`;
	if (r.pct.textContent !== pctText) r.pct.textContent = pctText;

	// ---- Checkbox ----
	if (r.check) {
		r.check.checked = selected.has(q.id);
		r.check.disabled = !canSelectQuest(q);
	}

	// ---- Nút trạng thái (Waves 31) ----
	updateQuestFoot(node, q);
}

/** Ảnh/video phần thưởng. Video (avatar decoration) chỉ tải+phát khi rê chuột
    để 20-30 thẻ không cùng decode video → không lag.
    Poster dùng `gameTile` (ảnh VUÔNG) chứ không dùng hero (ảnh ngang) — hero nhét
    vào ô vuông 33-64px sẽ bị bóp méo/trông như ảnh lỗi. */
function rewardMediaEl(q) {
	const url = questAssetUrl(q.rewardAsset);
	if (!url) return null;
	if (q.rewardIsVideo) {
		const v = document.createElement('video');
		v.className = 'qmedia';
		v.muted = true;
		v.loop = true;
		v.playsInline = true;
		v.preload = 'none'; // chưa tải gì cho tới khi hover
		const poster = questAssetUrl(q.gameTile) || questAssetUrl(q.hero);
		if (poster) v.poster = poster;
		v.src = url;
		v.addEventListener('pointerenter', () => v.play().catch(() => {}));
		v.addEventListener('pointerleave', () => {
			v.pause();
			v.currentTime = 0;
		});
		return v;
	}
	const img = document.createElement('img');
	img.className = 'qmedia';
	img.alt = '';
	img.loading = 'lazy';
	img.decoding = 'async';
	img.src = url;
	return img;
}

/* Waves 44 — TAB "ĐÃ LÀM": ô vuông, LOGO ORB Ở TRÊN, logo nhiệm vụ Ở DƯỚI.
   Bro nói rõ (nguyên văn): "phải có logo ORBS VÀ BÊN DƯỚI NÓ LÀ LOGO CỦA QUEST
   ẤY" và "đéo phải sổ lên khi người dùng truy cập vào mà sổ NGAY TRONG khung
   vuông ấy cơ mà ... di chuột vào vuông ấy nó TỰ LÀM MỜ Orb logo phía sau rồi
   trôi vào các logo text: nhận được bao nhiêu, khi nào, nhiệm vụ gì".

   Cấu trúc 1 ô (2 tầng chồng lên nhau, cùng nằm TRONG khung vuông):
     Tầng A (mặc định) : [ logo ORB ]  trên   +   [ logo nhiệm vụ ]  dưới
     Tầng B (:hover)    : Orb mờ đi (dim + blur) → chữ trôi vào ngay trong ô:
                          tên nhiệm vụ · nhận bao nhiêu Orb · nhận lúc nào
   KHÔNG có panel nổi bên ngoài ô nữa (Wave 43 làm sai ý bro). */
function buildDoneTile(q) {
	const node = document.createElement('article');
	node.className = 'qdone';
	node.dataset.questId = q.id;
	node.dataset.rewardKind = q.rewardKind || 'orbs';

	const isItem = q.rewardKind === 'item' && !!q.rewardAsset;
	const orbs = Number(q.orbs) || 0;

	// ---------- TẦNG A: mặt trước (Orb trên, logo nhiệm vụ dưới) ----------
	const face = document.createElement('div');
	face.className = 'qdone-face';

	// A1 — logo ORB (trên) + số Orb
	const orbRow = document.createElement('span');
	orbRow.className = 'qdone-orbs';
	const orbIco = document.createElement('img');
	orbIco.className = 'qdone-orb';
	orbIco.src = ORB_ICON_SRC;
	orbIco.alt = '';
	orbIco.setAttribute('aria-hidden', 'true');
	orbIco.draggable = false;
	const orbNum = document.createElement('span');
	orbNum.className = 'qdone-orb-num';
	orbNum.textContent = orbs > 0 ? String(orbs) : '—';
	orbRow.append(orbIco, orbNum);
	// Waves 46c — KHÔNG ẨN BADGE ORB NỮA (bro: "nhiều cái ko hiện logo orbs").
	// Trước đây dòng `if (orbs <= 0) orbRow.hidden = true;` giấu cả logo Orb lẫn
	// số Orb với MỌI nhiệm vụ thưởng vật phẩm (avatar decoration…) → bro thấy
	// "nhiều cái không hiện logo Orbs". Nay logo Orb LUÔN hiện trên mọi ô;
	// nhiệm vụ không có Orb thì chỗ số Orb ghi tên phần thưởng ngắn (hoặc "—"),
	// nên ô nào cũng có logo Orb như bro yêu cầu.

	// A2 — logo nhiệm vụ/game (dưới). Waves 46c: LUÔN để trong DOM (chỉ ẩn khi
	// chưa nạp xong / nạp lỗi) vì nay nó sống CHUNG với chữ tên game.
	const logo = document.createElement('img');
	logo.className = 'qdone-logo';
	logo.alt = '';
	/* Waves 46c — ĐÂY LÀ GỐC RỄ CỦA "CHƯA HIỆN ĐƯỢC LOGO RIÊNG TỪNG NHIỆM VỤ".
	   Bản cũ để `loading = 'lazy'`. Lưới "Đã làm" là một VÙNG CUỘN
	   (`overflow-y: auto`) và có thể chứa hàng chục ô; ảnh `lazy` nằm ngoài khung
	   nhìn KHÔNG BAO GIỜ được trình duyệt nạp → `naturalWidth = 0` → trình nạp
	   tưởng ảnh hỏng, leo hết chuỗi rồi bỏ ảnh, chỉ còn chữ. Đo được bằng probe
	   thật có mạng: trước khi sửa, 1/6 request ảnh được gửi; sau khi sửa, 6/6.
	   Logo ô "Đã làm" là phần tử nhỏ (≤46px cao) nên nạp ngay cũng rẻ. */
	logo.loading = 'eager';
	logo.decoding = 'async';
	logo.hidden = true;

	// Chữ tên game — Waves 46c: KHÔNG còn là phương án dự phòng thay thế logo.
	// Discord hiện CẢ logo game LẪN tên game trên từng nhiệm vụ, bro đòi đúng
	// thế: "cả logo chữ quest từng nhiệm vụ". Vậy ta luôn đổ tên vào đây; CSS
	// quyết định nó có đủ chỗ để hiện hay không (xem `.qdone-name`).
	const name = document.createElement('span');
	name.className = 'qdone-name';
	name.textContent = doneTileGameLabel(q);
	if (!name.textContent) name.hidden = true;

	face.append(orbRow, logo, name);

	// ---------- TẦNG B: mặt sau, hiện NGAY TRONG ô khi rê chuột ----------
	const info = document.createElement('div');
	info.className = 'qdone-info';
	info.setAttribute('role', 'tooltip');
	setDoneInfoHtml(info, q, orbs);
	node.title = ''; // tránh tooltip hệ thống chồng lên hiệu ứng trong ô
	node.setAttribute('aria-label', doneTileAria(q, orbs));
	node.append(face, info);

	// ---------- Nạp logo nhiệm vụ (leo thang logotype -> game_tile -> icon app) ----------
	const chain = [
		questAssetUrl(q.logotype),
		questAssetUrl(q.gameTile),
		appIconUrl(q.appId, q.appIcon),
	].filter(Boolean);

	const showName = () => {
		if (!name.textContent) name.textContent = doneTileGameLabel(q);
		name.hidden = !name.textContent;
	};

	if (chain.length) {
		let i = 0;
		const tryNext = () => {
			if (i >= chain.length) {
				// Hết chuỗi mà vẫn không nạp được ảnh nào → bỏ ảnh, dùng chữ.
				logo.remove();
				showName();
				return;
			}
			logo.src = chain[i++];
		};
		/* Waves 46c — ĐÚNG NHƯ DISCORD: logotype THAY CHỮ, không hiện song song.
		   Ảnh chụp tile Discord cho thấy mỗi ô chỉ có: logo Orb TO + LOGOTYPE của
		   game (wordmark dạng ảnh, ví dụ "EA SPORTS FC27"). Không có dòng chữ tên
		   game riêng — chính logotype LÀ "chữ quest" mà bro muốn.
		   Vì vậy: logotype nạp được → ẩn chữ, nhường toàn bộ chỗ cho orb + logo.
		   Logotype hỏng hết chuỗi → mới hiện chữ (dự phòng, không bao giờ ô trống). */
		logo.addEventListener('load', () => {
			logo.hidden = false;
			/* Chỉ WORDMARK ngang mới thay được chữ (đúng như Discord). Ảnh nạp
			   được mà gần VUÔNG (icon app / game_tile) thì vẫn phải có tên game
			   bằng chữ, nếu không ô thành "một cái icon vô danh". */
			name.hidden = logoIsWordmark(logo) || !name.textContent;
		});
		logo.addEventListener('error', tryNext);
		tryNext();
	} else if (isItem) {
		const media = rewardMediaEl(q);
		if (media) {
			media.classList.add('qdone-logo');
			face.insertBefore(media, logo);
			logo.remove();
		} else {
			showName();
		}
	} else {
		showName();
	}

	return node;
}

/** Logo nạp được có phải WORDMARK (chữ dạng ảnh) hay không?
 *  Waves 46c — chỉ WORDMARK mới được phép THAY tên game bằng chữ. Icon app và
 *  game_tile của Discord là ảnh gần VUÔNG; nếu ẩn chữ đi thì ô chỉ còn một
 *  hình vuông vô danh, không ai biết là game nào.
 *  Ngưỡng 1.4: đo trên dữ liệu thật — logotype Discord rộng gấp ~3–4 lần chiều
 *  cao, còn icon app / game_tile đúng 1:1. */
function logoIsWordmark(img) {
	if (!img || !img.naturalWidth || !img.naturalHeight) return false;
	return img.naturalWidth / img.naturalHeight >= 1.4;
}

/** Nhãn game NGẮN cho mặt trước ô "Đã làm".
 *  Ưu tiên tên game thật (Discord `messages.game_title`), rồi nhà phát hành,
 *  rồi tên nhiệm vụ. Cắt bớt để vừa ô vuông ~168px. */
function doneTileGameLabel(q) {
	const raw = String(q.gameTitle || q.publisher || q.name || '').trim();
	if (!raw) return '';
	return raw.length > 26 ? `${raw.slice(0, 25).trimEnd()}…` : raw;
}

/** Cập nhật TẠI CHỖ ô "Đã làm" khi số Orb / thời gian nhận thay đổi
 *  (không dựng lại node → giữ ảnh đã nạp, không nháy). */
function updateDoneTile(node, q) {
	const orbs = Number(q.orbs) || 0;
	const orbNum = node.querySelector('.qdone-orb-num');
	if (orbNum && orbNum.textContent !== String(orbs > 0 ? orbs : '—')) {
		orbNum.textContent = orbs > 0 ? String(orbs) : '—';
	}
	// Waves 46c — badge Orb LUÔN hiện (bro: "nhiều cái ko hiện logo orbs").
	// Bản cũ đặt `orbRow.hidden = orbs <= 0` → ô thưởng vật phẩm mất luôn logo.
	const orbRow = node.querySelector('.qdone-orbs');
	if (orbRow && orbRow.hidden) orbRow.hidden = false;
	// Tên game có thể tới muộn (payload cập nhật) → đồng bộ lại chữ.
	// Chữ tên game: CHỈ dùng khi KHÔNG có logotype (xem buildDoneTile — Discord
	// dùng logotype thay chữ). Nếu ảnh logo đang hiện thì giữ chữ ẩn.
	const name = node.querySelector('.qdone-name');
	const logoEl = node.querySelector('.qdone-logo');
	const logoShowing = !!(logoEl && !logoEl.hidden && logoIsWordmark(logoEl));
	if (name) {
		const label = doneTileGameLabel(q);
		if (label && name.textContent !== label) name.textContent = label;
		name.hidden = !label || logoShowing;
	}
	node.setAttribute('aria-label', doneTileAria(q, orbs));
	const info = node.querySelector('.qdone-info');
	if (info) {
		const html = doneTileInfoHtml(q, orbs);
		if (info.dataset.html !== html) {
			info.dataset.html = html;
			// Dùng chung setDoneInfoHtml để ảnh logotype hỏng vẫn có chữ thay thế.
			setDoneInfoHtml(info, q, orbs);
		}
	}
}

/** Nhãn đọc cho trình đọc màn hình — gồm tên, Orb, thời gian. */
function doneTileAria(q, orbs) {
	const en = currentLang === 'en';
	const parts = [q.name || q.gameTitle || (en ? 'Quest' : 'Nhiệm vụ')];
	if (orbs > 0) parts.push(`${orbs} Orbs`);
	else if (q.rewardName) parts.push(q.rewardName);
	const when = fmtClaimTime(q.claimedAt);
	if (when) parts.push(en ? `claimed at ${when}` : `nhận lúc ${when}`);
	return `${en ? 'Claimed' : 'Đã nhận'}: ${parts.join(' · ')}`;
}

/** Nội dung hiện TRONG ô khi rê chuột — DỰNG LẠI THEO ĐÚNG TOOLTIP CỦA DISCORD.
 *
 *  Bro gửi ảnh chụp tooltip thật (F12) và yêu cầu "khi user di chuột tới ô đó sẽ
 *  phải hiện thật chuẩn như này, cấm bịa đặt bất cứ thông tin gì". Bố cục Discord
 *  quan sát được, từ trên xuống:
 *    1. quầng ORB MỜ (ảnh orb phóng to + blur) làm nền phía trên
 *    2. LOGOTYPE của game (ảnh wordmark, ví dụ "EA SPORTS FC27")
 *    3. "Nhiệm Vụ <tên nhiệm vụ>"            ← chữ trắng, đậm
 *    4. "<N> Orbs đã được nhận vào"          ← chữ xám
 *    5. "<dd>/<mm>"                          ← chữ xám
 *  Mọi giá trị lấy từ dữ liệu THẬT Discord trả về (xem getQuestCardData):
 *    q.name (messages.quest_name) · q.gameTitle (messages.game_title) ·
 *    q.logotype (assets.logotype_dark/light) · q.orbs · q.claimedAt (claimed_at).
 *  KHÔNG có chuỗi nào được bịa thêm.
 */
function doneTileInfoHtml(q, orbs) {
	const en = currentLang === 'en';
	const questName = String(q.name || q.gameTitle || '').trim();
	const gameName = String(q.gameTitle || '').trim();
	const logoUrl = questLogoUrl(q);

	// (1) Quầng orb mờ — chính là ảnh orb lớn, CSS phóng to + blur.
	const glow = `<span class="qdone-info-glow" aria-hidden="true"></span>`;

	// (2) Logotype thật của game. Ảnh hỏng → JS gỡ và bật (2b) chữ tên game.
	const logo = logoUrl
		? `<img class="qdone-info-logo" src="${escapeHtml(logoUrl)}" alt="" aria-hidden="true" draggable="false" loading="eager" decoding="async" />`
		: '';
	const gameText = `<span class="qdone-info-game"${logoUrl ? ' hidden' : ''}>${escapeHtml(gameName)}</span>`;

	// (3) "Nhiệm Vụ <tên>" — Discord luôn đặt tiền tố "Nhiệm Vụ" (EN: "Quest").
	const title = questName
		? `<span class="qdone-info-title">${en ? 'Quest' : 'Nhiệm Vụ'} ${escapeHtml(questName)}</span>`
		: '';

	// (4) Phần thưởng: có Orb → "<N> Orbs đã được nhận vào";
	//     thưởng vật phẩm → "<tên phần thưởng> đã được nhận vào".
	const rewardText =
		orbs > 0
			? `${orbs} Orbs ${en ? 'received' : 'đã được nhận vào'}`
			: `${String(q.rewardName || q.rewardTitle || (en ? 'Reward' : 'Phần thưởng')).trim()} ${
					en ? 'received' : 'đã được nhận vào'
				}`;
	const reward = `<span class="qdone-info-reward">${escapeHtml(rewardText)}</span>`;

	// (5) Ngày nhận dạng NGẮN dd/mm (Discord hiện "22/10", không kèm giờ/năm).
	const when = fmtClaimDay(q.claimedAt);
	const whenHtml = when ? `<span class="qdone-info-when">${escapeHtml(when)}</span>` : '';

	return glow + logo + gameText + title + reward + whenHtml;
}

/** Gán nội dung tooltip + nối xử lý ảnh logotype hỏng (dùng chung cho dựng & cập nhật). */
function setDoneInfoHtml(info, q, orbs) {
	info.innerHTML = doneTileInfoHtml(q, orbs);
	const infoLogo = info.querySelector('.qdone-info-logo');
	if (!infoLogo) return;
	// Ảnh nạp được nhưng KHÔNG phải wordmark (icon app / game_tile vuông) →
	// vẫn hiện tên game bằng chữ để người xem biết đó là game nào.
	infoLogo.addEventListener('load', () => {
		if (logoIsWordmark(infoLogo)) return;
		const g = info.querySelector('.qdone-info-game');
		if (g) g.hidden = false;
	});
	infoLogo.addEventListener(
		'error',
		() => {
			infoLogo.remove();
			const g = info.querySelector('.qdone-info-game');
			if (g) g.hidden = false;
		},
		{ once: true },
	);
}

/** Ngày nhận dạng NGẮN dd/mm — đúng như Discord hiện trong tooltip ("22/10"). */
function fmtClaimDay(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const p = (n) => String(n).padStart(2, '0');
	return `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
}

/** Định dạng thời gian nhận (giờ địa phương, ngắn gọn). Rỗng nếu không có. */
function fmtClaimTime(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const p = (n) => String(n).padStart(2, '0');
	return `${p(d.getHours())}:${p(d.getMinutes())} ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Thoát ký tự HTML để không phá DOM (tên quest do Discord cấp). */
function escapeHtml(s) {
	return String(s == null ? '' : s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/* Waves 22: giữ tham chiếu node theo id để không phải querySelector lại mỗi frame
   (180 thẻ × mỗi lần cập nhật tiến độ = rất nặng nếu query liên tục). */
const questNodes = new Map(); // id -> { node, kind }
let needSort = true;

function renderQuests() {
	// Waves 33: ẩn hẳn mọi thẻ đã bị Discord gỡ (flag 'gone') — chúng chỉ gây
	// nhiễu (404 mỗi lần bấm). Dọn cả node đã dựng để không giữ DOM rác.
	for (const id of questOrder) {
		const q = quests.get(id);
		if (q && q.flag === 'gone') {
			const stale = questNodes.get(id);
			if (stale) {
				stale.node.remove();
				questNodes.delete(id);
			}
		}
	}

	// Đảm bảo mọi quest có node, gắn vào đúng tab
	let visActive = 0;
	let visNew = 0;
	let visDone = 0;
	let visTotal = 0;
	for (const id of questOrder) {
		const q = quests.get(id);
		if (q.flag === 'gone') continue; // đã bị Discord gỡ → không dựng thẻ
		// 'claimed' → tab Đã làm (ô vuông) · 'claimable' → Chưa nhận · còn lại → Chưa làm
		const targetList =
			q.status === 'claimed'
				? ui.questListDone
				: q.status === 'claimable'
					? ui.questListNew
					: ui.questListActive;
		const kind = q.status === 'claimed' ? 'done' : 'card';
		const cached = questNodes.get(id);
		let node = cached && cached.kind === kind ? cached.node : null;

		if (cached && cached.kind !== kind) {
			// Đổi loại thẻ (card ↔ tile) → bỏ node cũ, dựng lại
			cached.node.remove();
			questNodes.delete(id);
			needSort = true;
		}
		if (!node) {
			node = kind === 'done' ? buildDoneTile(q) : buildQuestCard(q);
			questNodes.set(id, { node, kind });
			needSort = true;
		}
		if (node.parentElement !== targetList) {
			targetList.appendChild(node); // di chuyển node, không dựng lại
			needSort = true;
		}
		if (kind === 'card') updateQuestCard(node, q);
		else updateDoneTile(node, q);

		// Wave#111: ẩn/hiện theo tìm kiếm + bộ lọc. Badge tab vẫn là TỔNG,
		// còn đếm riêng số thẻ đang hiện để xử lý trạng thái rỗng đúng.
		const matches = questMatchesFilter(q);
		if (node.hidden === matches) node.hidden = !matches;
		if (matches) {
			visTotal++;
			if (q.status === 'claimed') visDone++;
			else if (q.status === 'claimable') visNew++;
			else visActive++;
		}
	}

	// Chỉ sắp xếp khi có thay đổi cấu trúc (tránh appendChild 180 lần mỗi frame)
	if (needSort) {
		for (const list of [ui.questListActive, ui.questListNew, ui.questListDone]) {
			const nodes = Array.from(list.querySelectorAll('.qcard, .qdone'));
			nodes.sort((a, b) => questOrder.indexOf(a.dataset.questId) - questOrder.indexOf(b.dataset.questId));
			for (const n of nodes) list.appendChild(n);
		}
		needSort = false;
	}

	let countActive = 0;
	let countNew = 0;
	let countDone = 0;
	for (const id of questOrder) {
		const q = quests.get(id);
		if (q.flag === 'gone') continue; // đã bị Discord gỡ → không tính vào tổng
		if (q.status === 'claimed') countDone++;
		else if (q.status === 'claimable') countNew++;
		else countActive++;
	}

	ui.countActive.textContent = countActive;
	ui.countNew.textContent = countNew;
	ui.countDone.textContent = countDone;
	ui.questCounter.textContent = `${countDone} / ${countActive + countNew + countDone}`;

	// Trạng thái rỗng cho từng tab (khi không quét thì hiện gợi ý, khi quét thì xoay vòng)
	setTabEmptyState(ui.stateActive, visActive, countActive, emptyMsg('active'));
	setTabEmptyState(ui.stateNew, visNew, countNew, emptyMsg('claimable'));
	setTabEmptyState(ui.stateDone, visDone, countDone, emptyMsg('done'));

	// Thanh công cụ chọn: chỉ ở tab "Chưa làm" (nhiệm vụ ở 2 tab kia không chọn được)
	ui.selectTools.hidden = !(currentTab === 'active' && visActive > 0);
	updateSelectionUi();
	syncQuestTools(visNew, visTotal, countActive + countNew + countDone);

	// Waves 42: nút "Dừng" bám theo số nhiệm vụ đang chạy THẬT, không chỉ theo
	// state của tiến trình — tránh cảnh nút bị khoá trong khi quest vẫn cày.
	setBusyFlags();
}

/** Waves 27: sau khi nạp xong, cho toàn bộ thẻ "trôi vào + mờ dần lên".
 *  Dùng animation CSS rẻ (GPU) + stagger nhẹ để mượt, máy yếu vẫn ổn. */
function animateQuestsIn() {
	const nodes = document.querySelectorAll('.qcard, .qdone');
	nodes.forEach((n, i) => {
		n.classList.remove('qin');
		void n.offsetWidth; // reflow để animation chạy lại
		n.style.animationDelay = `${Math.min(i * 14, 320)}ms`;
		n.classList.add('qin');
	});
}

function setEmptyState(stateEl, count, message) {
	if (!stateEl) return;
	// Waves 46: ô "rỗng" là một MỤC CỦA CHÍNH LƯỚI (grid-column: 1/-1). Nếu nó
	// còn hiện trong khi lưới ĐÃ CÓ thẻ, nó chiếm trọn hàng đầu và ĐẨY TOÀN BỘ
	// thẻ xuống ~107px — mắt nhìn thành các khối lệch/xếp chồng. Luật: có thẻ
	// thì ô rỗng LUÔN ẩn, bất kể đang quét hay không.
	const hasCards = !!stateEl.parentElement && !!stateEl.parentElement.querySelector('.qcard, .qdone');
	if (count > 0 || hasCards) {
		stateEl.hidden = true;
		stateEl.classList.toggle('is-empty', !scanning);
		return;
	}
	stateEl.classList.toggle('is-empty', !scanning);
	stateEl.hidden = false;
	// Chưa quét lần nào → nhắc bấm nút, KHÔNG hiện spinner.
	const finalMsg = questOrder.length === 0 ? emptyMsg('hint') : message;
	const txt = stateEl.querySelector('.qstate-text');
	if (!scanning && txt && txt.dataset.msg !== finalMsg) {
		txt.dataset.msg = finalMsg;
		txt.innerHTML = finalMsg;
	}
}

/* Wave#111: trạng thái rỗng có tính bộ lọc. Tab có nhiệm vụ nhưng bộ lọc
   không khớp cái nào → phải nói rõ "không khớp bộ lọc", không để trống trơn. */
function setTabEmptyState(stateEl, visible, total, message) {
	if (!stateEl) return;
	if (visible > 0) {
		setEmptyState(stateEl, visible, message);
		return;
	}
	if (total > 0 && isQuestFiltering() && !scanning) {
		stateEl.hidden = false;
		stateEl.classList.add('is-empty');
		const txt = stateEl.querySelector('.qstate-text');
		const msg = emptyMsg('filter');
		if (txt && txt.dataset.msg !== msg) {
			txt.dataset.msg = msg;
			txt.innerHTML = msg;
		}
		return;
	}
	setEmptyState(stateEl, total, message);
}

/* Wave#111: danh sách nhiệm vụ CHỌN ĐƯỢC trong phạm vi bộ lọc hiện tại.
   Nhờ vậy "Chọn tất cả" chỉ tác động lên thứ người dùng đang NHÌN THẤY. */
function visibleSelectableIds() {
	return questOrder.filter((id) => {
		const q = quests.get(id);
		return q && canSelectQuest(q) && questMatchesFilter(q);
	});
}

/* Wave#111: đồng bộ hàng công cụ (số khớp bộ lọc + nút "Nhận tất cả"). */
function syncQuestTools(visNew, visTotal, countAll) {
	if (ui.questFilterCount) {
		const filtering = isQuestFiltering();
		ui.questFilterCount.hidden = !filtering;
		if (filtering) ui.questFilterCount.textContent = `${visTotal}/${countAll}`;
	}
	if (!ui.btnClaimAll) return;
	const show = currentTab === 'new' && visNew > 0;
	ui.btnClaimAll.hidden = !show;
	if (!show) return;
	ui.btnClaimAll.disabled = bulkClaimBusy || state !== 'idle';
	ui.btnClaimAll.textContent = bulkClaimBusy
		? `Đang nhận… ${bulkClaimDone}/${bulkClaimTotal}`
		: `Nhận tất cả (${visNew})`;
}

function updateSelectionUi() {
	ui.selectedCount.textContent = selected.size;
	const label = selected.size > 0 ? `Auto ORBs (${selected.size})` : 'Auto ORBs';
	if (ui.btnStart.dataset.label !== label) {
		ui.btnStart.dataset.label = label;
		// Giữ nguyên SVG icon, chỉ đổi text node cuối
		const keep = ui.btnStart.querySelector('.btn-ico');
		ui.btnStart.textContent = '';
		if (keep) ui.btnStart.appendChild(keep);
		ui.btnStart.appendChild(document.createTextNode(` ${label}`));
	}
	const busy = state !== 'idle';
	ui.btnStart.disabled = selected.size === 0 || busy;
	const selectableIds = visibleSelectableIds();
	ui.selectAll.checked = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
	ui.selectAll.indeterminate = !ui.selectAll.checked && selectableIds.some((id) => selected.has(id));

	// Tổng Orbs của các nhiệm vụ đang được chọn (tính năng tóm tắt nhanh)
	let selOrbs = 0;
	for (const id of selected) {
		const q = quests.get(id);
		if (q) selOrbs += q.orbs || 0;
	}
	ui.selectedOrbs.textContent = selected.size > 0 ? `(+${selOrbs} Orbs)` : '';
}

/* ---------------- Selection handlers ---------------- */

function onQuestCheckChange(e) {
	const check = e.target.closest('input[data-quest-check]');
	if (!check) return;
	const id = check.dataset.questCheck;
	if (check.checked) selected.add(id);
	else selected.delete(id);
	// Tô viền thẻ đang được chọn (giống Discord chọn nhiệm vụ để chạy)
	const card = check.closest('.qcard');
	if (card) card.dataset.selected = check.checked ? '1' : '0';
	updateSelectionUi();
}

/* Waves 24: gắn cho CẢ tab "Chưa làm" và "Chưa nhận" — trước đây chỉ gắn tab
   "Chưa làm" nên tích ở tab "Chưa nhận" không ăn, nút Auto ORBs luôn bị khoá. */
ui.questListActive.addEventListener('change', onQuestCheckChange);
ui.questListNew.addEventListener('change', onQuestCheckChange);

ui.selectAll.addEventListener('change', () => {
	const selectableIds = visibleSelectableIds();
	if (ui.selectAll.checked) {
		for (const id of selectableIds) selected.add(id);
	} else {
		for (const id of selectableIds) selected.delete(id);
	}
	renderQuests();
	updateSelectionUi();
});

/* ---------------- Wave#111: tìm kiếm · lọc · nhận tất cả ---------------- */

function clearQuestSearch() {
	if (ui.questSearch) ui.questSearch.value = '';
	if (ui.btnQuestSearchClear) ui.btnQuestSearchClear.hidden = true;
	questQuery = '';
	renderQuests();
}

if (ui.questSearch) {
	ui.questSearch.addEventListener('input', () => {
		const v = ui.questSearch.value;
		if (ui.btnQuestSearchClear) ui.btnQuestSearchClear.hidden = !v;
		// Gõ nhanh không render từng ký tự — gộp 120ms cho máy yếu.
		clearTimeout(questSearchTimer);
		questSearchTimer = setTimeout(() => {
			questQuery = ui.questSearch.value.trim();
			renderQuests();
		}, 120);
	});
	ui.questSearch.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			clearTimeout(questSearchTimer);
			questQuery = ui.questSearch.value.trim();
			renderQuests();
		} else if (e.key === 'Escape' && ui.questSearch.value) {
			e.preventDefault();
			clearTimeout(questSearchTimer);
			clearQuestSearch();
		}
	});
}
if (ui.btnQuestSearchClear) ui.btnQuestSearchClear.addEventListener('click', clearQuestSearch);
if (ui.questFilter) {
	ui.questFilter.addEventListener('change', () => {
		questFilter = ui.questFilter.value || 'all';
		renderQuests();
	});
}
if (ui.btnClaimAll) ui.btnClaimAll.addEventListener('click', claimAllMatching);

// Wave#116: chạm/rê tới nút Nhận là bắt đầu tải hCaptcha song song với request
// claim — Discord trả captcha_sitekey là widget dựng được ngay.
document.addEventListener(
	'pointerdown',
	(e) => {
		const target = e.target;
		if (!target || typeof target.closest !== 'function') return;
		const act = target.closest('.qcard-act');
		if (act && (act.dataset.act === 'claim' || act.dataset.act === 'retry')) warmUpCaptcha();
		else if (target.closest('#btnClaimAll')) warmUpCaptcha();
	},
	{ passive: true },
);

/* Waves 22: bỏ nút "↗ Discord" + dấu 3 chấm — thẻ chỉ còn nội dung thật.
   Chọn nhiệm vụ bằng ô tích ngay trên banner. */

/* ---------------- Quest store helpers ---------------- */

/* Gộp các event cập nhật tiến độ trong 1 frame -> tránh re-render hàng chục lần/giây. */
let renderScheduled = false;
function scheduleRender() {
	if (renderScheduled) return;
	renderScheduled = true;
	requestAnimationFrame(() => {
		renderScheduled = false;
		renderQuests();
	});
}

function upsertQuest(id, patch, opts = {}) {
	if (!id) return;
	if (!quests.has(id)) {
		questOrder.push(id);
		quests.set(id, {
			id,
			name: '',
			// Mặc định 'todo' (chưa xong) → rơi vào tab "Chưa làm".
			status: 'todo',
			secondsDone: 0,
			secondsNeeded: 0,
			orbs: 0,
		});
	}
	Object.assign(quests.get(id), patch);
	if (opts.defer) {
		scheduleRender(); // gộp: render 1 lần duy nhất mỗi frame
	} else {
		renderQuests();
	}
}

/**
 * Wave#103: danh sách quét là NGUỒN CHÂN LÝ. Quest biến mất khỏi Discord
 * (hết hạn/bị gỡ) mà vẫn nằm trong bộ nhớ UI → thẻ "ma" bấm vào chỉ nhận 404.
 * Xoá hẳn khỏi store + DOM + lựa chọn khi không còn trong danh sách mới.
 */
function pruneQuestsMissing(list) {
	const keep = new Set();
	for (const item of list || []) {
		if (item && item.id) keep.add(String(item.id));
	}
	for (let i = questOrder.length - 1; i >= 0; i--) {
		const id = questOrder[i];
		if (keep.has(id)) continue;
		questOrder.splice(i, 1);
		quests.delete(id);
		selected.delete(id);
		doneSeen.delete(id);
		const node = questNodes.get(id);
		if (node) {
			node.node.remove();
			questNodes.delete(id);
		}
	}
}

/* ============================================================
   Waves 31 — NHẬN THƯỞNG THẬT + XÁC MINH hCAPTCHA TẠI CLIENT
   Luồng:
     1) Bấm "Nhận" trên thẻ → api.claimQuest({token, quest})
     2) Discord trả OK  → orbs nhảy THẬT (đọc lại ví) + thẻ sang "Đã nhận"
     3) Discord trả 400 + captcha_sitekey → mở MODAL hCaptcha:
        render widget hCaptcha THẬT bằng sitekey/rqdata Discord cấp.
        Người dùng tự giải. Giải xong → tự gọi lại claim kèm captcha_key.
     4) Nếu vẫn lỗi → hiện NGUYÊN VĂN lỗi server, tuyệt đối không bịa.
   Không bypass, không bẻ khoá: chỉ dựng lại đúng trình xác thực của Discord.
   ============================================================ */

let captchaCtx = null; // { quest, captcha, widgetId }
let hcaptchaLoading = null;
let captchaWarmStarted = false;
let captchaPreconnected = false;

/** Mở kết nối sớm tới các origin hCaptcha để lúc claim không phải bắt tay TLS. */
function preconnectCaptcha() {
	if (captchaPreconnected) return;
	captchaPreconnected = true;
	for (const href of ['https://js.hcaptcha.com', 'https://hcaptcha.com', 'https://newassets.hcaptcha.com']) {
		const link = document.createElement('link');
		link.rel = 'preconnect';
		link.href = href;
		link.crossOrigin = 'anonymous';
		document.head.appendChild(link);
	}
}

/**
 * Wave#116: nạp sẵn API hCaptcha sau khi đăng nhập / lúc quét / khi rê tới nút
 * Nhận. Script chỉ tải 1 lần; lúc Discord trả `captcha_sitekey` thì `render`
 * chạy ngay, không phải chờ tải API như trước.
 */
function warmUpCaptcha() {
	if (captchaWarmStarted) return;
	captchaWarmStarted = true;
	preconnectCaptcha();
	const start = () => {
		ensureHcaptcha().catch(() => {
			// Lỗi mạng lúc warm-up không được khoá đường thử lại sau này.
			captchaWarmStarted = false;
		});
	};
	// Không dùng requestIdleCallback: tab nền bị throttle nên có thể không chạy
	// trong nhiều giây — đúng lúc người dùng bấm Nhận lại phải chờ.
	setTimeout(start, 50);
}

/**
 * Nạp script hCaptcha THẬT (js.hcaptcha.com).
 *
 * Wave#134 — Vì sao trước đây hay báo "Hết thời gian tải hCaptcha (mạng?)":
 * đo thật trên máy này (curl) thì `js.hcaptcha.com/1/api.js` = 414KB, total
 * 0.43s ⇒ mạng KHÔNG chậm. Thủ phạm là HTML/JS: file 414KB phải ĐƯỢC DỊCH &
 * THỰC THI trên main thread đúng lúc máy đang lag (engine quest chạy + animation
 * nặng), và khi tab bị ẩn thì trình duyệt throttle luôn cả phần khởi động đó.
 * Hạn cũ 15s ĐẾM CẢ thời gian chờ CPU nên dễ chạm vạch dù tải xong từ lâu.
 * ⇒ Nay: (1) trần 20s cho MỖI nhịp (gấp ~30 lần mức đo thật, đủ cho máy lag),
 * (2) TỰ THỬ LẠI 1 lần với <script> mới (response đã nằm trong HTTP cache nên
 * nhịp 2 chỉ mất công parse), (3) tab quay lại mà hcaptcha đã có thì resolve
 * ngay thay vì báo lỗi, (4) thông điệp nói rõ "máy đang chậm" chứ không đổ tại
 * mạng, và log ở mức CẢNH BÁO. Worst case 2 nhịp = 40s rồi mới báo.
 */
const HCAPTCHA_LOAD_TIMEOUT_MS = 20000;
const HCAPTCHA_LOAD_ATTEMPTS = 2;

function hcaptchaText(vi, en) {
	return currentLang === 'en' ? en : vi;
}

function ensureHcaptcha() {
	if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
		return Promise.resolve(window.hcaptcha);
	}
	if (hcaptchaLoading) return hcaptchaLoading;

	hcaptchaLoading = new Promise((resolve, reject) => {
		let settled = false;
		let script = null;
		let timer = 0;
		let attempt = 0;

		const stop = () => {
			clearTimeout(timer);
			timer = 0;
			if (script) {
				try {
					script.remove();
				} catch {
					/* ignore */
				}
				script = null;
			}
			document.removeEventListener('visibilitychange', onVisible);
		};
		/* Wave#101: mọi nhánh kết thúc phải xoá hcaptchaLoading + onload global,
		   nếu không nút "Thử lại" chết vĩnh viễn (Promise reject bị giữ lại). */
		const done = (err, api) => {
			if (settled) return;
			settled = true;
			stop();
			hcaptchaLoading = null;
			window.__aqHcaptchaOnload = null;
			if (err) reject(err);
			else resolve(api);
		};

		// Tab ẩn bị throttle → vừa quay lại mà API đã kịp có thì resolve tức thì.
		function onVisible() {
			if (settled || document.visibilityState !== 'visible') return;
			if (window.hcaptcha && typeof window.hcaptcha.render === 'function') done(null, window.hcaptcha);
		}

		const failAttempt = (reason) => {
			if (settled) return;
			clearTimeout(timer);
			timer = 0;
			if (script) {
				try {
					script.remove();
				} catch {
					/* ignore */
				}
				script = null;
			}
			attempt += 1;
			// Nhịp 2 chạy NGAY: response đã nằm trong HTTP cache nên chỉ mất công parse.
			if (attempt < HCAPTCHA_LOAD_ATTEMPTS) launch();
			else done(reason, null);
		};

		function launch() {
			if (settled) return;
			if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
				done(null, window.hcaptcha);
				return;
			}
			const s = document.createElement('script');
			script = s;
			s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=__aqHcaptchaOnload';
			s.async = true;
			window.__aqHcaptchaOnload = () => {
				if (window.hcaptcha) done(null, window.hcaptcha);
				else failAttempt(new Error(hcaptchaText('hCaptcha tải xong nhưng không khởi tạo', 'hCaptcha loaded but did not initialise')));
			};
			s.onerror = () =>
				failAttempt(new Error(hcaptchaText('Không tải được hCaptcha (kiểm tra mạng / firewall)', 'hCaptcha failed to load (check network / firewall)')));
			timer = setTimeout(
				() =>
					failAttempt(
						new Error(
							hcaptchaText(
								'Máy đang phản hồi chậm, hCaptcha khởi động chưa xong',
								'The machine is running slowly, hCaptcha has not finished starting',
							),
						),
					),
				HCAPTCHA_LOAD_TIMEOUT_MS,
			);
			document.head.appendChild(s);
		}

		document.addEventListener('visibilitychange', onVisible);
		launch();
	});
	return hcaptchaLoading;
}

/** Hiện lỗi trong modal captcha (nguyên văn thông điệp server). */
function setCaptchaError(msg) {
	const el = ui.captchaErr;
	if (!el) return;
	if (msg) {
		el.textContent = msg;
		el.hidden = false;
	} else {
		el.textContent = '';
		el.hidden = true;
	}
}

/**
 * Wave#116: hCaptcha chốt theme NGAY LÚC RENDER, không đổi theo app sau đó.
 * Nếu người dùng đổi Sáng/Tối khi modal đang mở, widget sẽ mang theme ngược
 * với modal — dựng lại widget bằng theme hiện tại (challenge cũ reset).
 */
function refreshOpenCaptchaTheme() {
	if (!captchaCtx || !ui.captchaModal || ui.captchaModal.hidden) return;
	const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
	if (captchaCtx.theme === theme) return;
	const ctx = captchaCtx;
	closeCaptchaModal();
	if (ctx.quest && ctx.captcha) openCaptchaModal(ctx.quest, ctx.captcha);
}

function closeCaptchaModal() {
	// Reset widget cũ của hCaptcha trước khi gỡ (hcaptcha giữ tham chiếu nội bộ).
	if (captchaCtx && captchaCtx.widgetId != null && window.hcaptcha && typeof window.hcaptcha.reset === 'function') {
		try {
			window.hcaptcha.reset(captchaCtx.widgetId);
		} catch {
			/* widget đã bị gỡ — bỏ qua */
		}
	}
	if (ui.captchaWidget) ui.captchaWidget.innerHTML = '';
	captchaCtx = null;
	if (ui.captchaModal) ui.captchaModal.hidden = true;
	setCaptchaError('');
}

/**
 * Mở modal hCaptcha cho quest + dữ liệu captcha Discord vừa trả.
 * Rendering widget hCaptcha THẬT (không phải ảnh giả).
 */
async function openCaptchaModal(quest, captcha) {
	captchaCtx = {
		quest,
		captcha,
		widgetId: null,
		theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
	};
	if (!ui.captchaModal) return;

	// Thông tin nhiệm vụ đang xác minh
	if (ui.captchaTarget) {
		ui.captchaTargetArt.innerHTML = quest.rewardKind === 'item' ? '' : ORB_GLYPH;
		if (quest.rewardKind === 'item' && quest.rewardAsset) {
			const media = rewardMediaEl(quest);
			if (media) ui.captchaTargetArt.appendChild(media);
			else ui.captchaTargetArt.innerHTML = ORB_GLYPH;
		}
		ui.captchaTargetName.textContent =
			quest.rewardTitle || quest.name || quest.gameTitle || 'Nhiệm vụ Discord';
		// Dòng phụ: tên nhiệm vụ thật (nếu dòng chính là tên phần thưởng).
		if (ui.captchaTargetSub) {
			const sub = quest.name && quest.name !== ui.captchaTargetName.textContent ? quest.name : '';
			ui.captchaTargetSub.textContent = sub;
			ui.captchaTargetSub.hidden = !sub;
		}
		ui.captchaTarget.hidden = false;
	}
	if (ui.captchaErr) setCaptchaError('');
	if (ui.captchaLoading) ui.captchaLoading.hidden = false;
	if (ui.btnCaptchaRetry) ui.btnCaptchaRetry.disabled = true;
	ui.captchaModal.hidden = false;

	const service = captcha && captcha.service ? captcha.service : 'hcaptcha';
	if (!captcha || !captcha.sitekey) {
		if (ui.captchaLoading) ui.captchaLoading.hidden = true;
		if (ui.btnCaptchaRetry) ui.btnCaptchaRetry.disabled = false;
		setCaptchaError('Discord yêu cầu xác minh nhưng không cấp sitekey. Hãy mở Discord bấm Nhận thủ công.');
		appendLog('[Cảnh báo] Discord yêu cầu captcha nhưng thiếu sitekey — không thể dựng widget.', 'warn');
		return;
	}
	if (service !== 'hcaptcha') {
		if (ui.captchaLoading) ui.captchaLoading.hidden = true;
		if (ui.btnCaptchaRetry) ui.btnCaptchaRetry.disabled = false;
		setCaptchaError(`Discord dùng dịch vụ xác minh "${service}" — app hiện chỉ hỗ trợ hCaptcha. Mở Discord để nhận thủ công.`);
		return;
	}

	let hcaptcha;
	try {
		hcaptcha = await ensureHcaptcha();
	} catch (err) {
		if (ui.captchaLoading) ui.captchaLoading.hidden = true;
		if (ui.btnCaptchaRetry) ui.btnCaptchaRetry.disabled = false;
		/* Wave#134: đây KHÔNG phải lỗi mạng chắc chắn — máy chậm/throttle tab cũng
		   ratimeout (đo: api.js tải 0.43s nhưng parse trên main thread đang lag).
		   Đã tự thử lại 1 nhịp trong ensureHcaptcha; ở đây báo CẢNH BÁO kèm đường
		   thử lại rõ ràng thay vì log đỏ "Lỗi" gây hiểu nhầm. */
		setCaptchaError(
			hcaptchaText(
				`hCaptcha khởi động chưa xong: ${err.message}. Bấm "Thử lại" (đừng tải lại cả app).`,
				`hCaptcha did not finish starting: ${err.message}. Press "Retry" (no need to reload the app).`,
			),
		);
		appendLog(`[Cảnh báo] hCaptcha chưa sẵn sàng: ${err.message}`, 'warn');
		return;
	}
	if (!captchaCtx || !ui.captchaModal || ui.captchaModal.hidden) return; // đã đóng trong lúc chờ

	// Render widget THẬT với sitekey + rqdata do Discord cấp.
	try {
		if (captchaCtx.widgetId != null) {
			try {
				hcaptcha.reset(captchaCtx.widgetId);
			} catch {
				/* widget cũ đã bị gỡ */
			}
			captchaCtx.widgetId = null;
		}
		ui.captchaWidget.innerHTML = '';
	// Waves 38: BRO YÊU CẦU "tự túc ấn xác minh, không cần người dùng bấm".
	// → App tự gọi `hcaptcha.execute()` để hCaptcha tự chạy xác minh:
	//   • Nếu hCaptcha cho qua (passive) → callback bắn NGAY, app tự gửi Discord
	//     mà người dùng KHÔNG phải bấm gì (đúng ý bro).
	//   • Nếu hCaptcha bung bảng thử thách → widget VẪN HIỆN (size 'normal' +
	//     execute) để người dùng giải trực tiếp, rồi app tự gửi.
	// Trước đây để `size:'invisible'` → hộp hoàn toàn trắng, không có gì để bấm
	// (bro phàn nàn). Nay dùng size 'normal': luôn có UI thật, có checkbox thật.
	const renderOpts = {
		sitekey: captcha.sitekey,
		size: 'normal',
		theme: captchaCtx.theme,
		// Wave#101 — MẮT XÍCH CÒN THIẾU: hCaptCha Enterprise gắn token với rqdata
		// NGAY TỪ LÚC RENDER. Trước đây rqdata chỉ được đưa vào execute(); với widget
		// visible người dùng tick trực tiếp, token do render tạo nên không mang
		// rqdata → Discord xác minh sai → captcha-required / 403·10008.
		...(captcha.rqdata ? { rqdata: captcha.rqdata } : {}),
		callback: (token) => onCaptchaSolved(token),
		'error-callback': () => setCaptchaError('hCaptcha báo lỗi khi tải. Bấm "Thử lại" hoặc tải lại ô xác minh.'),
		'expired-callback': () => {
			// Waves 41: hCaptcha "passive" token sống rất ngắn (vài chục giây). Khi nó
			// hết hạn, widget KHÔNG tự lấy token mới → phải reset để lấy phiên mới.
			// Trước đây chỉ báo lỗi mà không tự làm mới → user thấy "dead link" lặp lại.
			appendLog('[Cảnh báo] Phiên xác minh hết hạn (token hCaptcha sống ngắn) — đang tự làm mới…', 'warn');
			setCaptchaError('Phiên xác minh hết hạn — app đang tự làm mới, đợi chút hoặc giải lại ô bên trên.');
			// Tự reset widget để lấy phiên mới rồi chạy lại xác minh.
			try {
				if (captchaCtx && captchaCtx.widgetId != null) {
					window.hcaptcha.reset(captchaCtx.widgetId);
					hcaptchaRecover(captcha);
				}
			} catch {
				/* widget đã bị gỡ — người dùng bấm "Thử lại" */
			}
		},
	};
	appendLog(
		`[Hệ thống] Dựng hCaptcha: sitekey=${String(captcha.sitekey).slice(0, 12)}…` +
			` · rqdata=${captcha.rqdata ? 'có (' + captcha.rqdata.length + ' ký tự)' : 'THIẾU'}` +
			` · rqtoken=${captcha.rqtoken ? 'có' : 'không'}` +
			` · chế độ=TỰ ĐỘNG (app tự chạy xác minh)`,
		'system',
	);
	if (!captcha.rqdata) {
		appendLog(
			'[Cảnh báo] Discord KHÔNG cấp captcha_rqdata — token có thể bị từ chối.',
			'warn',
		);
	}
	captchaCtx.widgetId = hcaptcha.render(ui.captchaWidget, renderOpts);
	if (ui.captchaLoading) ui.captchaLoading.hidden = true;
	if (ui.btnCaptchaRetry) ui.btnCaptchaRetry.disabled = false;
	// TỰ ĐỘNG chạy xác minh — không cần người dùng bấm gì.
	try {
		const execArgs = { async: false };
		if (captcha.rqdata) execArgs.rqdata = captcha.rqdata;
		hcaptcha.execute(captchaCtx.widgetId, execArgs);
		appendLog('[Hệ thống] Đã tự chạy xác minh — nếu hCaptcha bung ô thử thách, hãy giải rồi app tự gửi.', 'system');
	} catch (e) {
		appendLog(
			`[Cảnh báo] Không gọi được hcaptcha.execute (${e.message}) — đã có widget để bấm thủ công.`,
			'warn',
		);
	}
	// Waves 38: NẾU callback không bắn (một số môi trường hCaptcha chỉ đẩy token
	// vào getResponse), app TỰ ĐỘNG đọc token và gửi — người dùng KHÔNG phải bấm.
	// Đây chính là "tự túc ấn xác minh rồi gửi" mà bro yêu cầu. Dừng ngay khi có.
	startCaptchaAutoSubmit();
	// Waves 38: đo trạng thái widget ra terminal (chẩn đoán hộp trắng / không bấm được).
	if (window.autoquest && window.autoquest.captchaTrace) {
		let n = 0;
		const iv = setInterval(() => {
			n++;
			const slot = ui.captchaWidget;
			const box = slot ? slot.getBoundingClientRect() : null;
			const ifr = slot ? slot.querySelector('iframe') : null;
			const r = ifr ? ifr.getBoundingClientRect() : null;
			window.autoquest.captchaTrace({
				where: 'modal',
				tick: n,
				widgetId: captchaCtx ? captchaCtx.widgetId : null,
				slotW: box ? Math.round(box.width) : null,
				slotH: box ? Math.round(box.height) : null,
				iframeW: r ? Math.round(r.width) : null,
				iframeH: r ? Math.round(r.height) : null,
				frames: window.frames.length,
			});
			if (n >= 12) clearInterval(iv);
		}, 1000);
	}
	appendLog(`[Hệ thống] Discord yêu cầu xác minh người thật — đã dựng hCaptcha trong app cho "${quest.name || ''}".`, 'system');
	} catch (err) {
		if (ui.captchaLoading) ui.captchaLoading.hidden = true;
		if (ui.btnCaptchaRetry) ui.btnCaptchaRetry.disabled = false;
		setCaptchaError(`Không dựng được widget hCaptcha: ${err.message}`);
		appendLog(`[Lỗi] Không dựng được widget hCaptcha: ${err.message}`, 'stderr');
	}
}

/** Người dùng giải xong captcha → tự gọi lại claim kèm captcha_key (2A). */
async function onCaptchaSolved(captchaToken) {
	if (!captchaCtx || !captchaToken) return;
	if (captchaCtx.submitted) return; // Waves 38: chỉ gửi 1 lần (auto + callback không đua)
	captchaCtx.submitted = true;
	if (captchaCtx.autoTimer) {
		clearInterval(captchaCtx.autoTimer);
		captchaCtx.autoTimer = null;
	}
	const { quest } = captchaCtx;
	const captcha = captchaCtx.captcha;
	appendLog('[Hệ thống] Đã có kết quả xác minh — tự gửi lại yêu cầu nhận thưởng tới Discord…', 'system');
	closeCaptchaModal();
	const outcome = await runClaim(quest, {
		captchaKey: captchaToken,
		captchaRqdata: captcha.rqdata,
		captchaRqtoken: captcha.rqtoken,
		captchaSessionId: captcha.sessionId,
	});
	// Wave#118: xác minh xong mà còn hàng đợi → tự nhận tiếp, không cần bấm lại.
	if (outcome === 'claimed' || outcome === 'unconfirmed' || outcome === 'gone') {
		setTimeout(() => {
			if (queueRows().length) continueClaimQueue();
		}, 600);
	}
}

/**
 * Waves 41: LÀM MỚI phiên hCaptCha sau khi token cũ hết hạn ("dead link").
 * Vì sao cần: token passive sống rất ngắn; khi hết hạn widget không tự lấy token
 * mới. Ta reset widget rồi chạy lại execute() + vòng auto-submit → không bắt user
 * bấm lại nhiều lần. Chỉ 1 lần cho mỗi lần mở modal để tránh vòng lặp vô tận.
 */
function hcaptchaRecover(captcha) {
	if (!captchaCtx || captchaCtx.recovering) return;
	captchaCtx.recovering = true;
	captchaCtx.submitted = false;
	if (captchaCtx.autoTimer) {
		clearInterval(captchaCtx.autoTimer);
		captchaCtx.autoTimer = null;
	}
	try {
		const execArgs = { async: false };
		if (captcha && captcha.rqdata) execArgs.rqdata = captcha.rqdata;
		window.hcaptcha.execute(captchaCtx.widgetId, execArgs);
		appendLog('[Hệ thống] Đã tự làm mới phiên xác minh — chạy lại.', 'system');
		startCaptchaAutoSubmit();
	} catch (e) {
		appendLog(`[Cảnh báo] Không làm mới được phiên xác minh (${e.message}) — hãy giải lại ô bên trên.`, 'warn');
	}
}

/**
 * Waves 38: TỰ ĐỘNG gửi xác minh — không cần người dùng bấm "Tôi đã giải xong".
 * Vì sao cần: hCaptcha trong một số môi trường chỉ đẩy token vào getResponse()
 * mà KHÔNG gọi callback (hoặc callback bắn trước khi widget settle). Vòng poll
 * này đọc token mỗi 800ms; có token hợp lệ → tự onCaptchaSolved() → tự claim.
 * Dừng sau 2 phút (hết hạn phiên) để không treo vô hạn.
 */
function startCaptchaAutoSubmit() {
	if (!captchaCtx) return;
	let waited = 0;
	const MAX_MS = 120000;
	captchaCtx.autoTimer = setInterval(() => {
		waited += 800;
		if (!captchaCtx || captchaCtx.submitted) {
			clearInterval(captchaCtx && captchaCtx.autoTimer);
			return;
		}
		if (ui.captchaModal && ui.captchaModal.hidden) {
			clearInterval(captchaCtx.autoTimer);
			captchaCtx.autoTimer = null;
			return;
		}
		let token = null;
		try {
			token = window.hcaptcha && captchaCtx.widgetId != null
				? window.hcaptcha.getResponse(captchaCtx.widgetId)
				: null;
		} catch {
			token = null;
		}
		if (token) {
			appendLog('[Hệ thống] hCaptcha đã trả kết quả — tự động gửi (không cần bấm).', 'system');
			onCaptchaSolved(token);
			return;
		}
		if (waited >= MAX_MS) {
			clearInterval(captchaCtx && captchaCtx.autoTimer);
			if (captchaCtx) captchaCtx.autoTimer = null;
			setCaptchaError('Hết thời gian chờ xác minh. Bấm "Thử lại" hoặc giải ô thử thách bên trên.');
		}
	}, 800);
}

/** Nút "Tôi đã giải xong" — đọc token từ widget nếu callback chưa bắn. */
function onCaptchaRetryClick() {
	if (!captchaCtx || captchaCtx.widgetId == null) {
		closeCaptchaModal();
		return;
	}
	let token = null;
	try {
		token = window.hcaptcha.getResponse(captchaCtx.widgetId);
	} catch {
		token = null;
	}
	if (!token) {
		// Waves 38: không còn bắt buộc "đánh dấu ô". App tự chạy xác minh; nút này
		// chỉ để ép gửi ngay khi widget đã có token (hoặc thử lại).
		setCaptchaError('Chưa có kết quả xác minh. App đang tự chạy — đợi chút, hoặc giải ô thử thách nếu có.');
		return;
	}
	onCaptchaSolved(token);
}

/**
 * Gọi claim THẬT qua main process.
 * @param {object} quest
 * @param {object} [captchaMeta] { captchaKey, captchaRqdata, captchaRqtoken, captchaSessionId }
 */
async function runClaim(quest, captchaMeta) {
	if (!isOnline()) {
		toast('Bạn đang ngoại tuyến — cần mạng để nhận thưởng.', true);
		return 'error';
	}
	const token = tokenOf(currentUser);
	if (!token) {
		toast('Chưa đăng nhập — dán Token Discord ở Cài đặt rồi thử lại.', true);
		appendLog('[Cảnh báo] Không nhận được: chưa có Token Discord.', 'warn');
		return 'error';
	}
	const id = quest.id;
	const patch = {
		claimBusy: true,
		claimError: '',
		claimOpenDiscord: false,
		claimPhase:
			currentLang === 'en'
				? captchaMeta
					? 'Verifying…'
					: 'Claiming…'
				: captchaMeta
					? 'Đang xác minh…'
					: 'Đang nhận…',
	};
	upsertQuest(id, patch);
	pillStart(currentLang === 'en' ? 'Verifying…' : captchaMeta ? 'Đang xác minh…' : 'Đang nhận…');

	try {
		const res = await api.claimQuest({
			token,
			quest: {
				id,
				name: quest.name,
				task: quest.task,
				platform: quest.platform,
				application: quest.application,
				// Wave#102: gửi lại traffic metadata Discord cấp lúc enroll —
				// thiếu 2 trường này Discord coi request không hợp lệ.
				traffic_metadata_raw: quest.traffic_metadata_raw,
				traffic_metadata_sealed: quest.traffic_metadata_sealed,
			},
			questId: id,
			...(captchaMeta || {}),
		});

		if (res && res.ok && res.confirmed === false) {
			// Wave#102: HTTP 2xx nhưng Discord KHÔNG kèm claimed_at (và bước xác
			// minh lại cũng chưa thấy) → tuyệt đối không cộng Orb ảo. Giữ ở tab
			// "Chưa nhận" và nói thật để lần quét sau đối chiếu.
			upsertQuest(id, {
				status: 'claimable',
				running: false,
				flag: '',
				claimBusy: false,
				claimPhase: '',
				claimOpenDiscord: false,
				claimError: 'Discord đã nhận yêu cầu nhưng chưa xác nhận trao thưởng. Quét lại để kiểm tra.',
			});
			appendLog(
				`[Cảnh báo] "${quest.name || ''}": Discord trả 2xx nhưng chưa thấy claimed_at — chưa cộng Orb, sẽ đối chiếu ở lần quét sau.`,
				'warn',
			);
			toast('Discord chưa xác nhận trao thưởng — quét lại để kiểm tra.', true);
			queueRemove(id);
			return 'unconfirmed';
		}

		if (res && res.ok) {
			// ✅ Discord đã trao thưởng THẬT
			upsertQuest(id, {
				status: 'claimed',
				running: false,
				flag: '',
				claimBusy: false,
				claimError: '',
				claimOpenDiscord: false,
				claimPhase: '',
			});
			sessionClaimCount += 1;
			sessionClaimOrbs += res.orbs || quest.orbs || 0;
			queueRemove(id);
			recordClaim(quest.name, res.orbs || quest.orbs || 0, id);
			appendLog(`[OK] Đã nhận "${quest.name || ''}" (+${res.orbs || quest.orbs || 0} Orbs) — Discord xác nhận.`, 'ok');
			toast(`Đã nhận ${res.orbs || quest.orbs || 0} Orbs · "${quest.name || ''}"`);
			notifySystem('Đã nhận Orbs', `+${res.orbs || quest.orbs || 0} Orbs · ${quest.name || ''}`);
			// Số dư nhảy THẬT: đọc lại ví từ Discord (không tự cộng số ảo)
			fetchOrbBalance(token);
			return 'claimed';
		}

		if (res && res.captchaRequired) {
			upsertQuest(id, { claimBusy: false, claimPhase: '' });
			// Waves 37: CHỐNG LẶP VÔ TẬN. Nếu đã gửi token xác minh mà Discord VẪN
			// đòi captcha → hCaptcha đang ở chế độ "passive" (token P1_/pd:0, KHÔNG
			// có lời giải thử thách) nên Discord không công nhận. Mở lại modal chỉ
			// tạo vòng lặp y như bro đã gặp. Nói THẬT lý do và dừng lại.
			if (captchaMeta && captchaMeta.captchaKey) {
				const msg =
					'Discord vẫn đòi xác minh dù đã gửi kết quả. hCaptcha trong môi trường này ' +
					'tự cho qua (token "passive") nên Discord không công nhận. Hãy mở Discord chính chủ ' +
					'để nhận nhiệm vụ này.';
				// Waves 40 (B): đổi nút thành "Mở Discord để nhận" (logic-only, UI giữ nguyên).
				upsertQuest(id, { claimError: msg, claimOpenDiscord: true });
				appendLog(`[Cảnh báo] "${quest.name || ''}": Discord giữ nguyên yêu cầu xác minh — dừng vòng lặp.`, 'warn');
				appendLog('[Hệ thống] hCaptcha trả token passive (P1_/pd:0) không có lời giải thử thách, nên Discord từ chối. Không phải lỗi token.', 'system');
				toast('Discord chưa công nhận xác minh — hãy mở Discord để nhận nhiệm vụ này.', true);
				queueRemove(id);
				return 'captcha-rejected';
			}
			await openCaptchaModal(quest, res.captcha || {});
			return 'captcha';
		}

		// 🗑 404 — Discord đã gỡ quest này. Không phải lỗi của mình:
		// đánh dấu "gone" để thẻ tự ẩn khỏi tab hoạt động, nói thật với người dùng.
		if (res && res.notFound) {
			upsertQuest(id, {
				claimBusy: false,
				claimPhase: '',
				claimError: '',
				flag: 'gone',
				status: 'claimed',
			});
			appendLog(`[Hệ thống] Nhiệm vụ "${quest.name || id}" đã bị Discord gỡ — bỏ khỏi danh sách.`, 'warn');
			toast(`"${quest.name || 'Nhiệm vụ'}" không còn tồn tại trên Discord.`, true);
			queueRemove(id);
			return 'gone';
		}

		// ⏳ 429 — Discord giới hạn tốc độ. Main đã tự chờ & thử lại 1 lần;
		// tới đây nghĩa là vẫn bị chặn → báo rõ và cho bấm lại.
		if (res && res.rateLimited) {
			const wait = res.retryAfter ? `${Math.ceil(res.retryAfter)}s` : 'vài giây';
			const msg = res.message || `Discord đang giới hạn tốc độ — thử lại sau ${wait}.`;
			upsertQuest(id, { claimBusy: false, claimPhase: '', claimError: msg });
			appendLog(`[Cảnh báo] Nhận "${quest.name || ''}" bị giới hạn tốc độ (429) — thử lại sau ${wait}.`, 'warn');
			toast(`Chậm lại một chút: ${msg}`, true);
			return 'ratelimited';
		}

		// 🎮 403 code 260004 — quest không hỗ trợ nền tảng đang gửi.
		// Thường do quest chỉ chạy trên Xbox/PlayStation; nói thẳng thay vì "lỗi chung".
		if (res && res.wrongPlatform) {
			const msg = res.message || 'Nhiệm vụ không hỗ trợ nền tảng này.';
			upsertQuest(id, { claimBusy: false, claimPhase: '', claimError: msg });
			appendLog(`[Cảnh báo] "${quest.name || ''}": ${msg} (HTTP 403 · 260004)`, 'warn');
			toast(msg, true);
			queueRemove(id);
			return 'error';
		}

		// 🎮 403 code 10008 — Discord ăn captcha_key nhưng trả "Unknown Message".
		// Waves 37: đo được khi gửi kèm captcha_rqdata + captcha_rqtoken thì Discord
		// đổi từ `400 captcha-required` sang `403 10008`. Nghĩa là đã qua cổng
		// captcha nhưng phía thưởng truy hồi lỗi (token vẫn là loại "passive" chưa
		// được coi là đã giải). Nói rõ, KHÔNG mở lại modal (tránh lặp).
		if (res && res.status === 403 && (res.code === 10008 || /10008/.test(String(res.message || '')))) {
			const msg =
				'Discord đã nhận kết quả xác minh nhưng không thể trao thưởng (403 · 10008). ' +
				'Phiên hCaptcha trong app chưa được coi là "đã giải". Hãy mở Discord chính chủ cho nhiệm vụ này.';
			upsertQuest(id, { claimBusy: false, claimPhase: '', claimError: msg, claimOpenDiscord: true });
			appendLog(`[Cảnh báo] "${quest.name || ''}": Discord trả 403 · 10008 (đã qua captcha, lỗi trao thưởng).`, 'warn');
			toast('Discord chưa trao thưởng — hãy mở Discord để nhận nhiệm vụ này.', true);
			queueRemove(id);
			return 'captcha-rejected';
		}

		// ❌ Lỗi khác — hiện NGUYÊN VĂN thông điệp server
		const msg = (res && (res.message || res.error)) || 'Discord từ chối yêu cầu nhận thưởng.';
		upsertQuest(id, { claimBusy: false, claimPhase: '', claimError: msg });
		appendLog(`[Lỗi] Nhận "${quest.name || ''}" thất bại: ${msg}${res && res.status ? ` (HTTP ${res.status})` : ''}`, 'stderr');
		toast(`Nhận thất bại: ${msg}`, true);
		queueRemove(id);
		return 'error';
	} catch (err) {
		const msg = (err && err.message) || 'Lỗi không xác định khi gọi Discord.';
		upsertQuest(id, { claimBusy: false, claimPhase: '', claimError: msg });
		appendLog(`[Lỗi] Nhận "${quest.name || ''}" thất bại: ${msg}`, 'stderr');
		toast(`Nhận thất bại: ${msg}`, true);
		queueRemove(id);
		return 'error';
	} finally {
		pillEnd();
	}
}

/* Wave#111 — NHẬN TẤT CẢ (tuần tự, có nhịp nghỉ)
   Nguyên tắc an toàn:
   • Chỉ nhận quest đang "Chưa nhận" và khớp bộ lọc hiện tại.
   • Khoảng cách tối thiểu 1,2s giữa 2 claim do bridge tự giữ (Wave#116);
     không cộng thêm delay ở UI để claim đầu tiên đi ngay.
   • Gặp captcha hoặc rate-limit là DỪNG NGAY — không thử vượt xác minh.
   • Tôn trọng trạng thái mới nhất: quest đã đổi trạng thái thì bỏ qua. */
function claimableMatchingIds() {
	return questOrder.filter((id) => {
		const q = quests.get(id);
		return q && q.flag !== 'gone' && q.status === 'claimable' && !q.claimBusy && questMatchesFilter(q);
	});
}

async function claimSequence(ids, source = 'bulk') {
	bulkClaimBusy = true;
	bulkClaimDone = 0;
	bulkClaimTotal = ids.length;
	renderQuests();
	pillStart(currentLang === 'en' ? 'Claiming rewards…' : 'Đang nhận thưởng…');
	pillSetCount(0, ids.length);
	appendLog(
		source === 'queue'
			? `[Hệ thống] Tiếp tục nhận ${ids.length} nhiệm vụ đang chờ…`
			: `[Hệ thống] Nhận hàng loạt: ${ids.length} nhiệm vụ đang chờ nhận…`,
		'system',
	);

	let claimed = 0;
	let orbs = 0;
	let attempted = 0;
	let stopReason = '';
	try {
		for (const id of ids) {
			if (state !== 'idle') {
				stopReason = 'engine';
				break;
			}
			const q = quests.get(id);
			if (!q || q.flag === 'gone' || q.status !== 'claimable') {
				queueRemove(id);
				continue;
			}
			attempted += 1;
			bulkClaimDone = attempted;
			pillSetCount(attempted, ids.length);
			renderQuests();
			const out = await runClaim(q);
			if (out === 'claimed') {
				claimed += 1;
				orbs += Number(q.orbs) || 0;
			}
			if (out === 'captcha') {
				stopReason = 'captcha';
				break;
			}
			if (out === 'captcha-rejected') {
				stopReason = 'rejected';
				break;
			}
			if (out === 'ratelimited') {
				stopReason = 'rate';
				break;
			}
		}
	} finally {
		bulkClaimBusy = false;
		bulkClaimDone = 0;
		bulkClaimTotal = 0;
		pillSetCount(0, 0);
		pillEnd();
		renderQuests();
		renderQueueChip();
	}

	if (stopReason === 'captcha') {
		const left = queueRows().length;
		appendLog(
			left > 0
				? `[Hệ thống] Đã dừng nhận: Discord yêu cầu xác minh. Còn ${left} nhiệm vụ trong hàng đợi — giải xong sẽ tự nhận tiếp.`
				: '[Hệ thống] Đã dừng nhận: Discord yêu cầu xác minh. Xử lý xong rồi bấm lại để nhận tiếp.',
			'warn',
		);
		toast(
			left > 0
				? `Đã dừng: cần xác minh — còn ${left} nhiệm vụ chờ, giải xong sẽ tự nhận tiếp.`
				: 'Đã dừng: Discord yêu cầu xác minh — giải xong rồi bấm lại để nhận tiếp.',
			true,
		);
	} else if (stopReason === 'rejected') {
		const left = queueRows().length;
		appendLog(
			left > 0
				? `[Cảnh báo] Discord chưa trao thưởng (403 · 10008). Còn ${left} nhiệm vụ trong hàng đợi — hãy mở Discord chính chủ cho nhiệm vụ này.`
				: '[Cảnh báo] Discord chưa trao thưởng (403 · 10008) — hãy mở Discord chính chủ cho nhiệm vụ này.',
			'warn',
		);
		toast(
			left > 0
				? `Discord chưa trao thưởng — còn ${left} nhiệm vụ chờ, mở Discord để nhận rồi thử lại.`
				: 'Discord chưa trao thưởng — hãy mở Discord để nhận nhiệm vụ này.',
			true,
		);
	} else if (stopReason === 'rate') {
		appendLog('[Cảnh báo] Đã dừng nhận hàng loạt: Discord giới hạn tốc độ. Thử lại sau ít phút.', 'warn');
		toast('Đã dừng: Discord giới hạn tốc độ — thử lại sau ít phút.', true);
	} else if (stopReason === 'engine') {
		appendLog('[Hệ thống] Đã dừng nhận hàng loạt vì tiến trình cày vừa khởi động.', 'warn');
	} else {
		const bits = [`${claimed}/${attempted || ids.length} nhiệm vụ`];
		if (orbs > 0) bits.push(`+${orbs} Orbs`);
		appendLog(`[Hệ thống] Nhận hàng loạt xong: ${bits.join(' · ')}.`, claimed > 0 ? 'ok' : 'warn');
		if (claimed > 0) {
			toast(`Đã nhận ${claimed} nhiệm vụ${orbs > 0 ? ` (+${orbs} Orbs)` : ''}.`);
			notifySystem('Nhận hàng loạt', `Đã nhận ${claimed} nhiệm vụ${orbs > 0 ? ` (+${orbs} Orbs)` : ''}`);
		} else if (attempted > 0) {
			toast('Không nhận được nhiệm vụ nào — xem nhật ký để biết lý do.', true);
		}
	}
}

async function claimAllMatching() {
	if (bulkClaimBusy) return;
	if (!isOnline()) {
		toast('Đang ngoại tuyến — cần mạng để nhận thưởng.', true);
		return;
	}
	if (!tokenOf(currentUser)) {
		toast('Chưa đăng nhập — dán Token Discord ở Cài đặt rồi thử lại.', true);
		return;
	}
	if (ui.captchaModal && !ui.captchaModal.hidden) {
		toast('Hãy giải xong ô xác minh đang mở trước đã.', true);
		return;
	}
	if (state !== 'idle') {
		toast('Đang chạy tiến trình — dừng lại rồi hãy nhận hàng loạt.', true);
		return;
	}
	const ids = claimableMatchingIds();
	if (!ids.length) {
		toast('Không có nhiệm vụ nào chờ nhận trong bộ lọc hiện tại.', true);
		return;
	}
	queueAddMany(ids);
	await claimSequence(ids, 'bulk');
}

/* Nút "Nhận" trên thẻ quest — uỷ quyền theo data-act. */
function onQuestActClick(e) {
	const btn = e.target.closest('.qcard-act');
	if (!btn) return;
	const card = btn.closest('.qcard');
	if (!card) return;
	const quest = quests.get(card.dataset.questId);
	if (!quest) return;
	const act = btn.dataset.act;
	if (act === 'open') {
		// Waves 40 (B): mở đúng trang quest trong Discord thật (deep link → app,
		// fallback web). Captcha chạy native ở đó nên hợp lệ — KHÔNG bypass gì.
		e.preventDefault();
		e.stopPropagation();
		if (!quest.id) return;
		appendLog(`[Hệ thống] Mở Discord để nhận "${quest.name || quest.id}"…`, 'system');
		api
			.openQuest(quest.id)
			.then((r) => {
				if (r && r.ok) {
					appendLog(
						`[Hệ thống] Đã mở Discord (${r.via === 'app' ? 'ứng dụng' : 'trình duyệt'}). Bấm "Claim" trong đó để nhận.`,
						'ok',
					);
				} else {
					appendLog(`[Lỗi] Không mở được Discord: ${(r && r.message) || 'không rõ'}`, 'stderr');
					toast('Không mở được Discord — hãy mở thủ công.', true);
				}
			})
			.catch((err) => {
				appendLog(`[Lỗi] Không mở được Discord: ${(err && err.message) || err}`, 'stderr');
				toast('Không mở được Discord — hãy mở thủ công.', true);
			});
		return;
	}
	if (act === 'claim' || act === 'retry') {
		e.preventDefault();
		e.stopPropagation();
		// Wave#101: challenge chỉ sống vài phút. Dữ liệu captcha cũ (rqdata/session)
		// hết hạn mà vẫn đem ra giải = chắc chắn bị Discord từ chối. Chỉ dùng lại
		// nếu còn tươi (≤120s); quá hạn thì xoá và xin challenge MỚI bằng claim khô.
		const CAPTCHA_TTL_MS = 120000;
		if (quest.pendingCaptcha) {
			const at = Number(quest.pendingCaptchaAt) || 0;
			const fresh = Date.now() - at <= CAPTCHA_TTL_MS;
			const cap = quest.pendingCaptcha;
			quest.pendingCaptcha = null;
			quest.pendingCaptchaAt = null;
			if (fresh) {
				openCaptchaModal(quest, cap);
				return;
			}
			appendLog('[Hệ thống] Phiên xác minh cũ đã hết hạn — xin challenge mới từ Discord…', 'system');
		}
		runClaim(quest);
	}
}

ui.questListActive.addEventListener('click', onQuestActClick);
ui.questListNew.addEventListener('click', onQuestActClick);
ui.questListDone.addEventListener('click', onQuestActClick);

/* Nút trong modal captcha */
if (ui.btnCaptchaCancel) ui.btnCaptchaCancel.addEventListener('click', closeCaptchaModal);
if (ui.btnCaptchaRetry) ui.btnCaptchaRetry.addEventListener('click', onCaptchaRetryClick);
if (ui.captchaVeilClick) ui.captchaVeilClick.addEventListener('click', (e) => {
	if (e.target === ui.captchaModal) closeCaptchaModal();
});

/* ---------------- Event Dispatcher ---------------- */

async function handleEvent(evt) {
	const d = evt.data || {};
	switch (evt.type) {
		case 'login':
			setState('running', { username: d.username });
			// Bot login thành công → đồng bộ profile (nếu chưa vẽ từ authCheck)
			if (ui.dprofile.dataset.state !== 'logged-in') {
				renderDiscordProfile({
					id: d.id,
					username: d.username,
					displayName: d.globalName || d.username,
					avatar: d.avatar,
				});
			}
			appendLog(`[Hệ thống] Đã đăng nhập Discord: @${d.username}`, 'ok');
			break;

		case 'quests':
			if (d.total === 0) {
				appendLog('[Hệ thống] Không có nhiệm vụ nào cần làm trong đợt này.', 'system');
			}
			break;

		case 'scan:start':
			// Wave#103: mỗi lượt quét phải bắt đầu từ buffer RỖNG. Trước đây nếu
			// lượt trước dở dang (mất kết nối) buffer còn sót → lượt sau trộn quest
			// cũ với mới, đếm sai và có thể hồi sinh quest đã biến mất.
			scanBuffer.length = 0;
			// Waves 23: KHÔNG ghi log — chỉ bật loader terminal ở cả 3 tab
			setScanning(true, d.total || 0);
			setState('scanning');
			break;

		case 'quest:scan-progress':
			bumpScan(d.done || 0, d.total || 0);
			break;

		case 'quest:item': {
			// Waves 27: gom vào RAM — KHÔNG render ngay trong lúc loading.
			// Bot vẫn gửi từng quest (để đo tiến độ), nhưng UI chỉ đẩy ra 1 lượt khi
			// nạp xong ⇒ nạp mượt theo máy, không giật khi đang cuộn xem.
			if (!d || !d.id) break;
			scanBuffer.push(d);
			break;
		}

		case 'quest:inventory': {
			// Waves 27: đổ TOÀN BỘ quest từ RAM ra 1 lượt + hiệu ứng trôi + mờ dần.
			// Danh sách quét THẬT từ Discord API. KHÔNG cộng orbs, KHÔNG tự nhận.
			const rawList =
				scanBuffer.length > 0
					? scanBuffer
					: Array.isArray(d.quests)
						? d.quests
						: [];
			// Wave#103: dedupe theo id (Discord có thể trả trùng excluded + normal);
			// bản ghi CUỐI là bản mới nhất, giữ nguyên thứ tự xuất hiện đầu.
			const byId = new Map();
			for (const item of rawList) {
				if (item && item.id) byId.set(String(item.id), item);
			}
			const list = Array.from(byId.values());
			for (const item of list) {
				// Waves 33: quest đã bị Discord gỡ (404) mà vẫn quay lại trong 1 lần
				// quét khác → giữ trạng thái 'gone', không hồi sinh thành 'todo'.
				const prev = quests.get(item.id);
				if (prev && prev.flag === 'gone') continue;
				upsertQuest(item.id, {
					name: item.name,
					task: item.task,
					taskLabel: item.taskLabel,
					application: item.application,
					secondsNeeded: item.secondsNeeded,
					secondsDone: item.secondsDone,
					orbs: item.orbs || 0,
					automatable: item.automatable !== false,
					// Waves 25: 'todo' | 'claimable' | 'claimed' (đúng completed_at/claimed_at)
					status:
						item.status === 'claimed'
							? 'claimed'
							: item.status === 'claimable'
								? 'claimable'
								: 'todo',
					flag: '',
					// Waves 22: dữ liệu thẻ Discord
					hero: item.hero || '',
					gameTile: item.gameTile || '',
					logotype: item.logotype || '',
					// Waves 42: logo dự phòng LUÔN có — icon application (game).
					appId: item.appId || '',
					appIcon: item.appIcon || '',
					publisher: item.publisher || '',
					gameTitle: item.gameTitle || '',
					expiresAt: item.expiresAt || null,
					colorPrimary: item.colorPrimary || '',
					colorSecondary: item.colorSecondary || '',
					rewardKind: item.rewardKind || 'orbs',
					rewardTitle: item.rewardTitle || '',
					rewardAsset: item.rewardAsset || '',
					rewardIsVideo: item.rewardIsVideo === true,
					rewardName: item.rewardName || '',
					// Waves 43: thời điểm NHẬN THẬT để ô "Đã làm" hiện đúng "lúc nào".
					claimedAt: item.claimedAt || null,
					// Waves 32: platform THẬT (Discord cần đúng giá trị khi claim).
					platform: typeof item.platform === 'number' ? item.platform : 0,
					// Wave#102: traffic metadata Discord cấp lúc enroll — claim tay
					// phải gửi lại y hệt engine, thiếu là Discord từ chối.
					traffic_metadata_raw: item.traffic_metadata_raw,
					traffic_metadata_sealed: item.traffic_metadata_sealed,
				});
			}
			scanBuffer.length = 0;
			pruneQuestsMissing(list);
			// Wave#128: giữ bản lưu ngoại tuyến theo tài khoản (không token).
			saveInventoryCache(list);
			// Wave#118: hàng đợi chỉ giữ mục còn nhận được / chưa quá hạn.
			queuePrune();
			renderQueueChip();
			renderQuests();
			// Hiệu ứng "trôi vào + mờ dần lên" cho toàn bộ thẻ vừa nạp.
			animateQuestsIn();
			// Nạp xong → chốt loader thành ĐÚNG 1 dòng báo tổng
			setScanning(false, list.length);
			const doneCount = list.filter((x) => x.status === 'claimed').length;
			const newCount = list.filter((x) => x.status === 'claimable').length;
			finishLoader(list.length, {
				done: doneCount,
				fresh: newCount,
				active: list.length - doneCount - newCount,
			});
			// Waves 24: tab "Chưa làm" rỗng mà "Chưa nhận" có nhiệm vụ → tự nhảy sang
			// tab có việc để người dùng không nhìn vào màn hình trống.
			if (currentTab === 'active' && list.length - doneCount - newCount === 0 && newCount > 0) {
				switchTab('new');
			}
			break;
		}

		case 'scan:complete':
			// Waves 24: KHÔNG bỏ loader ở đây — finishLoader đang chạy hiệu ứng
			// trôi + mờ dần 620ms. Bỏ ngay sẽ làm nó biến mất giật cục.
			setScanning(false, questOrder.length);
			if (state === 'scanning') setState('idle');
			break;

		case 'quest:start':
			// Waves 24: KHÔNG đổi status sang 'running' nữa — nếu đổi, thẻ sẽ bị
			// nhảy sang tab "Chưa làm" và người dùng tưởng nó biến mất. Giữ nguyên
			// tab hiện tại, chỉ bật cờ running để vòng % phát sáng và chạy.
			// Waves 42: xoá cờ "Dừng" nếu nhiệm vụ được chạy lại.
			upsertQuest(d.id || d.name, {
				name: d.name,
				task: d.task,
				application: d.application,
				secondsNeeded: d.secondsNeeded,
				secondsDone: d.secondsDone,
				orbs: d.orbs || 0,
				running: true,
				stopFlag: false,
			});
			break;

		case 'quest:progress':
			upsertQuest(
				d.id || d.name,
				{
					secondsDone: d.secondsDone,
					secondsNeeded: d.secondsNeeded,
				},
				{ defer: true }, // event tần suất cao -> gộp render
			);
			break;

		case 'quest:done': {
			// Quest vừa XONG 100% nhưng CHƯA chắc đã nhận thưởng → sang tab "Chưa nhận".
			// (Bot phát 'quest:claim' ngay sau đó nếu claim được → lúc đó mới sang "Đã làm".)
			const key = d.id || d.name;
			const q = quests.get(key) || {};
			// Không fallback 300: chỉ dùng orbs thật từ API.
			const earned = d.orbs || q.orbs || 0;
			const first = !doneSeen.has(key);
			if (first) doneSeen.add(key);
			upsertQuest(key, {
				name: d.name || q.name,
				status: 'claimable',
				running: false,
				flag: '',
				secondsDone: q.secondsNeeded || q.secondsDone,
				orbs: earned,
			});
			if (first) {
				sessionOrbsBonus += earned;
				if (earned > 0) toast(`Hoàn thành "${d.name || q.name}" (+${earned} Orbs)`);
				else toast(`Hoàn thành "${d.name || q.name}"`);
			}
			// Discord chặn claim bằng captcha → báo 1 lần, đừng để bro tưởng app lỗi.
			if (d.note && !claimNoteShown) {
				claimNoteShown = true;
				appendLog(
					'Có nhiệm vụ cần mở Discord bấm Nhận thủ công (Discord yêu cầu captcha).',
					'warn',
				);
			}
			break;
		}

		case 'quest:captcha': {
			// Waves 42 — ĐỔI HÀNH VI (bro yêu cầu RÕ):
			// Khi Auto ORBs cày xong 1 nhiệm vụ mà Discord đòi xác minh, app
			// TUYỆT ĐỐI KHÔNG tự mở bảng nhận / captcha. Việc đúng phải làm là:
			//   → đưa nhiệm vụ sang tab "Chưa nhận" và ĐỨNG YÊN ở đó.
			// Chỉ khi NGƯỜI DÙNG bấm nút trên thẻ thì mới mở captcha (hoặc Discord).
			const key = d.id || d.name;
			const q = quests.get(key) || {};
			upsertQuest(key, {
				name: d.name || q.name,
				status: 'claimable',
				running: false,
				flag: '',
				orbs: d.orbs || q.orbs || 0,
				rewardKind: q.rewardKind || 'orbs',
				rewardAsset: q.rewardAsset || '',
				// claimBusy = false để thẻ hiện nút "Nhận …" cho người dùng tự bấm.
				claimBusy: false,
				claimPhase: '',
				// Giữ sẵn dữ liệu captcha để lúc người dùng bấm "Nhận" thì
				// openCaptchaModal() mở NGAY, không cần gọi lại Discord.
				pendingCaptcha: d.captcha || null,
				pendingCaptchaAt: d.captcha ? Date.now() : null,
			});
			appendLog(
				`"${d.name || key}" đã xong — chuyển sang mục "Chưa nhận". Bấm Nhận khi bạn muốn.`,
				'ok',
			);
			break;
		}

		case 'quest:run-start': {
			// Dự phòng: nếu bot phát event báo bắt đầu cày thì bật cờ chạy.
			upsertQuest(d.id || d.name, { running: true, flag: '', stopFlag: false });
			break;
		}

		case 'quest:stop-all': {
			// Waves 42 — Người dùng bấm DỪNG: mọi nhiệm vụ đang chạy phải đổi
			// trạng thái sang "Dừng" (ĐỎ), không còn treo ở "Đang chạy".
			let stopped = 0;
			for (const q of quests.values()) {
				if (q.running) {
					q.running = false;
					q.stopFlag = true;
					stopped += 1;
				}
			}
			// Thẻ nào cũng phải đổi ngay, kể cả khi không đếm được (đổi nhãn nút,
			// trạng thái trong tiến trình) — bro bấm Dừng là phải thấy "Dừng".
			renderQuests();
			setBusyFlags();
			if (stopped) appendLog(`Đã dừng ${stopped} nhiệm vụ đang chạy.`, 'warn');
			break;
		}

		case 'quest:claim': {
			// Đã nhận thưởng thật (claim API) → chuyển sang tab "Đã làm".
			// Waves 27: KHÔNG sổ từng dòng vào nhật ký nữa (gây rác + lag) — chỉ
			// toast ngắn + đếm tổng. Nhật ký chỉ giữ dòng tổng kết khi phiên kết thúc.
			if (d.id) {
				if (d.confirmed === false) {
					// Wave#102: engine nhận 2xx nhưng chưa thấy claimed_at.
					upsertQuest(d.id, {
						status: 'claimable',
						running: false,
						flag: '',
						stopFlag: false,
						claimBusy: false,
						claimPhase: '',
						claimError: 'Discord đã trả OK nhưng chưa xác nhận trao thưởng. Quét lại để kiểm tra.',
					});
					appendLog(
						`[Cảnh báo] "${d.name || d.id}": chưa xác nhận claimed_at — không cộng Orb.`,
						'warn',
					);
					break;
				}
				upsertQuest(d.id, { status: 'claimed', running: false, flag: '', stopFlag: false });
				sessionClaimCount += 1;
				sessionClaimOrbs += d.orbs || 0;
				recordClaim(d.name, d.orbs || 0, d.id);
				queueRemove(d.id);
				if (d.rewardName) toast(`Đã nhận: ${d.rewardName}`);
				notifySystem('Đã nhận Orbs', `${d.rewardName || ''} · ${d.name || ''}`.trim());
			} else if (typeof d.count === 'number') {
				sessionClaimCount += d.count;
				sessionClaimOrbs += d.orbs || 0;
			}
			break;
		}

		case 'quest:redeem':
			// Nhận thưởng thật (claim API) — orbs đã cộng qua quest:done.
			// Waves 27: gom đếm, không sổ từng dòng rác vào nhật ký.
			sessionClaimCount += 1;
			sessionClaimOrbs += d.orbs || 0;
			break;

		case 'quest:skip':
			// Không đổi status → thẻ ở nguyên tab, chỉ tắt cờ chạy và gắn nhãn.
			upsertQuest(d.id || d.name, { running: false, flag: 'skip' });
			break;

		case 'quest:error':
			upsertQuest(d.id || d.name, { running: false, flag: 'error' });
			break;

		case 'orb:summary':
			// Thống kê thật từ bot: tổng orb đã hoàn thành theo danh sách hiện tại.
			if (typeof d.completedOrbs === 'number') {
				appendLog(`[Hệ thống] Tổng Orb đã đạt trong đợt này: ${d.completedOrbs} Orbs`, 'orb');
			}
			break;

		case 'orbs:balance':
			// Số ORB KHẢ DỤNG thật từ account (ví Discord) — bot push trong phiên chạy.
			if (typeof d.balance === 'number') {
				setSideBalance(d.balance, d.pendingClaim || 0, d.source);
			}
			break;

		case 'cycle:wait': {
			const rem = d.remainingSeconds || 0;
			const m = Math.floor(rem / 60);
			const s = rem % 60;
			const pad = (n) => String(n).padStart(2, '0');
			// Waves 22: thẻ "Chế độ treo" đã xoá → hiện đếm ngược ngay trên ô đếm của nhật ký
			setLogCount(`${pad(m)}:${pad(s)}`);
			break;
		}

		case 'finish':
			if (d.note) appendLog(String(d.note), 'warn');
			// Waves 27: 1 dòng tổng kết nhiệm vụ đã nhận thưởng (thay vì sổ từng dòng).
			if (sessionClaimCount > 0) {
				appendLog(
					`Đã nhận thưởng ${sessionClaimCount} nhiệm vụ (~${sessionClaimOrbs} Orbs) trong phiên này.`,
					'ok',
				);
			}
			if (state === 'scanning' || d.scanned) {
				setState('idle');
			} else if (!ui.loopMode.checked) {
				appendLog('[Hệ thống] Hoàn tất mọi nhiệm vụ. Phiên làm việc kết thúc.', 'ok');
			}
			break;

		case 'fatal':
			appendLog(`[LỖI] ${d.message || 'Lỗi không xác định'}`, 'stderr');
			toast(`Lỗi: ${d.message}`, true);
			if (scanning) {
				// Wave#103: quét lỗi không được để loader quay mãi.
				setScanning(false, scanDone);
				dropProgress();
			}
			setState('error');
			break;

		case 'cycle:error': {
			// Wave#104: lỗi 1 lượt (mạng/Discord 5xx) — engine vẫn sống và sẽ thử
			// lại. Chỉ khi đang quét mới cần đóng loader.
			appendLog(
				`[Cảnh báo] Lượt chạy gặp lỗi: ${d.message || 'không rõ'}` +
					(scanning ? '.' : '. Sẽ thử lại ở lượt sau.'),
				'warn',
			);
			if (scanning) {
				setScanning(false, scanDone);
				dropProgress();
				setState('idle');
				toast(`Quét thất bại: ${d.message || 'lỗi mạng'}`, true);
			}
			break;
		}

		case 'reconnect':
			appendLog(
				`[Hệ thống] Mất kết nối Discord — thử lại lần ${d.attempt || 1} sau ${Math.round((Number(d.delayMs) || 0) / 1000)}s…`,
				'system',
			);
			break;

		default:
			break;
	}
}

/** #rrggbb <- int accent_color của Discord API. */
function intToHex(n) {
	return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

/* ============================================================================
   Wave#88 — MULTIACCOUNT: danh sách tài khoản + "Đổi tài khoản" (popup).
   renderDiscordProfile() gọi cuối: applyAccountButtons → registerAccount →
   refreshCfgCard. Popup: openAccSw → renderAccountList → openSwitchConfirm
   (bấm entry ⇒ hỏi Xác Nhận/Đóng; Xác Nhận ⇒ set-active + reload client).
   Token do bridge giữ (IndexedDB AES-GCM); renderer chỉ nhận metadata id/username/avatar.
   ========================================================================== */

/** URL avatar Discord (hash thật theo id, rớt về ảnh mặc định theo id). */
function discordAvatarSrc(a, size) {
	const s = Number(size) || 64;
	if (a && a.id && a.avatar) {
		const ext = a.avatar.startsWith('a_') ? 'gif' : 'png';
		return `${CDN}/avatars/${a.id}/${a.avatar}.${ext}?size=${s}`;
	}
	const idx = a && a.id ? Number((BigInt(a.id) >> 22n) % 6n) || 0 : 0;
	return `${CDN}/embed/avatars/${idx}.png`;
}

/** Nạp danh sách tài khoản đã lưu từ main (metadata; KHÔNG có token). */
async function loadAccountsCache() {
	if (typeof api.accountsList !== 'function') return false;
	try {
		const r = await api.accountsList();
		if (r && Array.isArray(r.accounts)) {
			accountsCache = r.accounts;
			activeIdxCache = typeof r.activeIdx === 'number' ? r.activeIdx : 0;
			return true;
		}
	} catch {
		/* main chưa sẵn sàng */
	}
	return false;
}

/** Vẽ danh sách tài khoản vào modal "Đổi tài khoản". */
function renderAccountList() {
	const list = ui.accswList;
	if (!list) return;
	list.innerHTML = '';
	for (let i = 0; i < accountsCache.length; i++) {
		const a = accountsCache[i];
		const li = document.createElement('li');
		li.className = 'accsw-item' + (i === activeIdxCache ? ' is-active' : '');
		li.tabIndex = 0;
		li.setAttribute('role', 'button');

		const av = document.createElement('span');
		av.className = 'accsw-av';
		av.title = a.id || '';
		if (a.avatar && a.id) {
			const img = document.createElement('img');
			img.src = discordAvatarSrc(a, 64);
			img.alt = '';
			img.addEventListener('error', () => {
				img.remove();
				av.textContent = (a.username || '?').charAt(0).toUpperCase();
			}, { once: true });
			av.appendChild(img);
		} else {
			av.textContent = (a.username || '?').charAt(0).toUpperCase();
		}

		const meta = document.createElement('span');
		meta.className = 'accsw-meta';
		const nm = a.displayName || a.username || ('#' + (a.id || ''));
		meta.innerHTML =
			`<span class="accsw-name">${escapeHtml(nm)}</span>` +
			`<span class="accsw-user">@${escapeHtml(a.username || '?')} · ${escapeHtml(a.id || '')}</span>`;

		li.appendChild(av);
		li.appendChild(meta);

		if (i === activeIdxCache) {
			const b = document.createElement('span');
			b.className = 'accsw-badge';
			b.textContent = 'Đang dùng';
			li.appendChild(b);
		} else {
			const del = document.createElement('button');
			del.type = 'button';
			del.className = 'accsw-remove';
			del.title = 'Xoá entry này khỏi danh sách (xoá token khỏi máy)';
			del.innerHTML =
				'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
			del.addEventListener('click', async (e) => {
				e.stopPropagation();
				const label = a.username ? '@' + a.username : 'entry này';
				if (!window.confirm('Xoá ' + label + ' khỏi danh sách tài khoản?')) return;
				try {
					const r = await api.accountsRemove(a.id);
					if (r && r.ok === false) {
						toast('Không xoá được: ' + (r.message || ''), true);
						return;
					}
					await loadAccountsCache();
					renderAccountList();
				} catch {
					toast('Lỗi xoá tài khoản', true);
				}
			});
			li.appendChild(del);
		}

		li.addEventListener('click', () => openSwitchConfirm(i));
		list.appendChild(li);
	}
	ui.accswEmpty.hidden = accountsCache.length > 0;
}

/** Bật/ẩn 4 nút tài khoản theo tình trạng đăng nhập. */
function applyAccountButtons() {
	const logged = !!(currentUser && currentUser.id);
	for (const b of [ui.btnSwitchAccountRow, ui.btnLogout, ui.btnSwitchAccount, ui.btnLogout2]) {
		if (b) b.hidden = !logged;
	}
}

/** Đăng ký/cập nhật tài khoản đang đăng nhập vào danh sách đã lưu. */
async function registerAccount(user) {
	if (typeof api.accountsAdd !== 'function') return;
	const token = (lastAuthedToken || ui.token.value || '').trim();
	if (!user || !user.id || !token) return;
	try {
		await api.accountsAdd({
			id: String(user.id),
			username: user.username || '',
			displayName: user.displayName || '',
			avatar: user.avatar || '',
			token,
			activate: true, // tài khoản đang đăng nhập = active
		});
		await loadAccountsCache();
	} catch {
		/* lỗi lưu không chặn đăng nhập */
	}
}

/** Cập nhật token drawer của Cài đặt (ẩn/hiện + hint). */
function syncCfgToken() {
	const token = (lastAuthedToken || ui.token.value || '').trim();
	const body = ui.accCfgTokenBody;
	const hint = ui.accCfgTokenHint;
	const code = ui.accCfgToken;
	if (!token) {
		if (code) code.textContent = 'chưa có token';
		if (hint) hint.textContent = 'chưa có';
		if (body) body.hidden = true;
		if (ui.btnTokenDrawer) ui.btnTokenDrawer.setAttribute('aria-expanded', 'false');
		tokenVisibleCfg = false;
		if (ui.btnTokenEyeText) ui.btnTokenEyeText.textContent = 'Hiện';
		return;
	}
	const masked = token.slice(0, 4) + ' •••••••• ' + token.slice(-4);
	if (code) {
		code.textContent = tokenVisibleCfg ? token : masked;
		code.classList.toggle('is-masked', !tokenVisibleCfg);
	}
	if (hint) {
		hint.textContent = token.slice(0, 8) + '…';
		hint.classList.toggle('is-masked', !tokenVisibleCfg);
	}
}

/** Cài đặt — thẻ "Thông tin tài khoản" (avt + bọc + @user + UID + token). */
function refreshCfgCard(user) {
	const wrap = ui.accCfgAvwrap;
	const gone = ui.accCfgAvwrapGone;
	const ok = !!(user && user.id);
	if (ok) {
		if (wrap) wrap.hidden = false;
		if (gone) gone.hidden = true;
		const gv = ui.accCfgAvatar;
		if (gv) {
			gv.innerHTML = '';
			const img = document.createElement('img');
			img.src = discordAvatarSrc(user, 96);
			img.alt = '';
			img.addEventListener('error', () => {
				img.remove();
				gv.textContent = (user.username || '?').charAt(0).toUpperCase();
			}, { once: true });
			gv.appendChild(img);
		}
		if (wrap) wrap.classList.add('has-ring'); // "cái bọc quanh avt"
		if (ui.accCfgUser) ui.accCfgUser.textContent = user.username ? '@' + user.username : '—';
		if (ui.accCfgDisplayName) {
			ui.accCfgDisplayName.textContent =
				user.displayName || (user.username ? '@' + user.username : 'Tài khoản Discord');
		}
		if (ui.accCfgUid) ui.accCfgUid.hidden = !user.id;
		if (ui.accCfgUidValue) ui.accCfgUidValue.textContent = user.id || '—';
	} else {
		if (wrap) wrap.hidden = true;
		if (gone) gone.hidden = false;
		if (ui.accCfgUser) ui.accCfgUser.textContent = '@chưa đăng nhập';
		if (ui.accCfgDisplayName) ui.accCfgDisplayName.textContent = 'Chưa có tài khoản';
		if (ui.accCfgUid) ui.accCfgUid.hidden = true;
		if (ui.accCfgUidValue) ui.accCfgUidValue.textContent = '—';
	}
	syncCfgToken();
}

/** Mở popup "Đổi tài khoản" (2 mục: Dán Token + Tài khoản). */
function openAccSw() {
	const modal = ui.accSwitchModal;
	if (!modal) return;
	const t = ui.accswToken;
	if (t) {
		t.value = '';
		t.type = 'password';
	}
	if (ui.accswToggleText) ui.accswToggleText.textContent = 'Hiện';
	if (ui.accswGuideBody) ui.accswGuideBody.hidden = true;
	if (ui.accswGuideToggle) ui.accswGuideToggle.setAttribute('aria-expanded', 'false');
	modal.hidden = false;
	if (typeof loadAccountsCache === 'function') {
		loadAccountsCache().then(() => renderAccountList());
	} else {
		renderAccountList();
	}
	if (t) t.focus();
}

/** Đóng popup "Đổi tài khoản" (và modal xác nhận nếu đang mở). */
function closeAccSw() {
	if (ui.accSwitchModal) ui.accSwitchModal.hidden = true;
	if (ui.accConfirmSwitchModal) ui.accConfirmSwitchModal.hidden = true;
}

/** Modal XÁC NHẬN "Bạn có muốn chuyển tài khoản sang @…/UID ?". */
function openSwitchConfirm(idx) {
	const a = accountsCache[idx];
	if (!a) return;
	pendingSwitchIdx = idx;
	if (ui.accSwitchConfirmName) {
		ui.accSwitchConfirmName.textContent = a.username ? '@' + a.username : ('#' + (a.id || ''));
	}
	if (ui.accSwitchPreview) ui.accSwitchPreview.hidden = false;
	const av = ui.accSwitchPreviewAvatar;
	if (av) {
		av.innerHTML = '';
		const img = document.createElement('img');
		img.src = discordAvatarSrc(a, 64);
		img.alt = '';
		img.addEventListener('error', () => {
			img.remove();
			av.textContent = (a.username || '?').charAt(0).toUpperCase();
		}, { once: true });
		av.appendChild(img);
	}
	if (ui.accSwitchPreviewName) ui.accSwitchPreviewName.textContent = a.displayName || a.username || '—';
	if (ui.accSwitchPreviewId) ui.accSwitchPreviewId.textContent = a.id ? 'ID: ' + a.id : 'ID: —';
	if (ui.accConfirmSwitchModal) ui.accConfirmSwitchModal.hidden = false;
}

/**
 * Wave#96 (bro lệnh) — Hiện màn "Đang đăng nhập" phủ đặc toàn client.
 * Bro chốt NGUYÊN VĂN: "NGAY LẬP TỨC client CHỈ CÒN MỖI CHỮ ĐANG ĐĂNG NHẬP Ở
 * CHÍNH GIỮA VÀ THANH XOAY LOADING XOAY TỪ TỪ PHÍA DƯỚI, CẤM THÊM SỰ VẬT NÀO
 * ĐẰNG SAU, CHỈ 2 SỰ VẬT ĐẤY THÔI."
 * ⇒ Veil ĐỤC + blur che SẠCH phiên cũ (nhiệm vụ đã/chưa nhận của account
 *   trước KHÔNG còn lộ ra đè lên account mới) — đúng lỗi bro báo.
 * Chỉ đổi `hidden` + 1 lần ép reflow; mọi thứ khác do CSS lo (rẻ, hợp máy yếu).
 */
function showLoginVeil() {
	const v = ui.loginVeil;
	if (!v) return;
	// Ẩn sạch mọi modal/popup đang mở để veil là thứ DUY NHẤT trên màn hình.
	if (ui.accSwitchModal) ui.accSwitchModal.hidden = true;
	if (ui.accConfirmSwitchModal) ui.accConfirmSwitchModal.hidden = true;
	if (ui.upPop) ui.upPop.hidden = true;
	if (ui.captchaModal) ui.captchaModal.hidden = true;
	if (ui.loginVeilText) ui.loginVeilText.textContent = 'Đang đăng nhập';
	v.hidden = false;
	// Buộc trình duyệt vẽ ngay frame đầu (tránh trễ 1 nhịp khiến lộ UI cũ).
	void v.offsetWidth;
}

/**
 * Wave#96 (bro lệnh) — RESET SẠCH PHIÊN ĐANG QUÉT của account CŨ trước khi
 * nạp account mới. Bro: "khi switch account nó không hề reset phiên đang làm
 * quét dở của phiên account trước mà để đè lên, cả đã làm chưa nhận lẫn đã
 * nhận". ⇒ Xoá state nhiệm vụ (danh sách, đã/chưa nhận, progress, log).
 */
function resetQuestSessionForSwitch() {
	try {
		// 1) State nhiệm vụ trong RAM (store theo id + thứ tự + chọn + dedupe + bộ đếm phiên).
		quests.clear();
		questOrder.length = 0;
		selected.clear();
		doneSeen.clear();
		scanBuffer.length = 0;
		sessionClaimCount = 0;
		sessionClaimOrbs = 0;
		sessionOrbsBonus = 0;
		claimNoteShown = false;
		logText = '';
		// 2) DOM: bỏ sạch thẻ ở CẢ 3 tab (Chưa làm / Chưa nhận / Đã làm)
		//    + node cache ⇒ account mới KHÔNG bị đè thẻ của phiên cũ.
		if (questNodes && typeof questNodes.clear === 'function') questNodes.clear();
		for (const list of [ui.questListActive, ui.questListNew, ui.questListDone]) {
			if (list) list.innerHTML = '';
		}
		// 3) Log/console + bộ đếm về 0.
		if (ui.console) ui.console.innerHTML = '';
		if (ui.logCount) ui.logCount.textContent = '0';
		for (const c of [ui.countActive, ui.countNew, ui.countDone]) {
			if (c) c.textContent = '0';
		}
		if (ui.questCounter) ui.questCounter.textContent = '0';
		if (ui.stateActive) ui.stateActive.textContent = STATE_TEXT.idle;
	} catch {
		/* best-effort: reload ngay sau đó sẽ dọn sạch mọi thứ còn sót */
	}
}

/** "Xác Nhận": hiện veil → reset phiên → đặt active mới → ghi config → RELOAD. */
async function confirmSwitchAccount() {
	const idx = pendingSwitchIdx;
	if (idx < 0 || !accountsCache[idx]) return;
	const a = accountsCache[idx];
	// BƯỚC 1 (bro chốt): hiện NGAY màn "Đang đăng nhập" — trước mọi việc khác.
	showLoginVeil();
	// BƯỚC 2: dọn phiên quét của account cũ ⇒ không đè lên account mới.
	resetQuestSessionForSwitch();
	try {
		// BƯỚC 3: đổi active (main giải mã tokenEnc → ghi token chính).
		await api.accountsSetActive(idx);
		const cfg = await api.getConfig();
		if (cfg && cfg.token && ui.token) ui.token.value = cfg.token;
		// BƯỚC 4: ghi config (kèm accounts/activeIdx để KHÔNG xoá danh sách).
		await api.saveConfig(collectConfig());
		appendLog(`[Multiaccount] Chuyển sang @${a.username || a.id} — đang nạp lại client…`, 'system');
		// BƯỚC 5 (Wave#96): "trong thời gian mờ mờ loading RENDER CÁC HIỆU ỨNG
		// VÀO RAM rồi đợi mở ra load siêu mượt" ⇒ warm-up ảnh/asset TRƯỚC khi
		// reload: decode avatar + banner + effect/collectible vào RAMCache của
		// trình duyệt để lúc client mở lại là hiện TỨC THÌ (0 network stall).
		await warmUpAccountAssets(a);
	} catch {
		/* dù lỗi vẫn reload để đồng bộ trạng thái */
	}
	window.location.reload();
}

/**
 * Wave#96 (bro: "render các hiệu ứng vào RAM rồi đợi mở ra load siêu mượt,
 * tối ưu cho tất cả các loại máy từ yếu đến rất mạnh").
 *
 * Prefetch + DECODE ảnh avatar/banner/effect của account mới vào cache trình
 * duyệt. Vì đây là `blob:`/`https:` được `img.decode()` (giải mã TRƯỚC), khi
 * app reload xong ảnh hiện TỨC THÌ thay vì vừa tải vừa decode (chính là độ
 * trễ bro thấy). Giới hạn số ảnh + timeout ngắn ⇒ máy YẾU cũng không bị treo.
 */
async function warmUpAccountAssets(acc) {
	const urls = [];
	const push = (u) => { if (u && typeof u === 'string' && !urls.includes(u)) urls.push(u); };
	try {
		// Avatar account mới ở 2 cỡ dùng ngay sau reload (hàng panel + hero).
		if (acc && acc.id) {
			push(discordAvatarSrc({ id: acc.id, avatar: acc.avatar }, 128));
			push(discordAvatarSrc({ id: acc.id, avatar: acc.avatar }, 256));
		}
		// Avatar mặc định (fallback) + logo app — luôn xuất hiện ở frame đầu.
		push(discordAvatarSrc({ id: (acc && acc.id) || '0', avatar: null }, 128));
		push('assets/zoZ-logo.png');
	} catch {
		/* bỏ qua: warm-up là tối ưu, KHÔNG được làm hỏng luồng chuyển account */
	}
	// Chỉ pre-decode tối đa 4 ảnh, mỗi ảnh tối đa 1200ms ⇒ tổng trần ~1.2s.
	const MAX = 4, TIMEOUT = 1200;
	const jobs = urls.slice(0, MAX).map((src) => new Promise((resolve) => {
		let done = false;
		const fin = () => { if (!done) { done = true; resolve(); } };
		const t = setTimeout(fin, TIMEOUT);
		try {
			const img = new Image();
			img.decoding = 'async';
			img.loading = 'eager';
			img.onload = () => {
				// decode() ép giải mã xong ⇒ frame đầu hiện ngay sau reload.
				if (typeof img.decode === 'function') {
					img.decode().then(() => { clearTimeout(t); fin(); }).catch(() => { clearTimeout(t); fin(); });
				} else { clearTimeout(t); fin(); }
			};
			img.onerror = () => { clearTimeout(t); fin(); };
			img.src = src;
		} catch { clearTimeout(t); fin(); }
	}));
	// KHÔNG chặn vô hạn: dù máy yếu/ảnh lỗi thì tối đa ~1.2s là reload.
	try { await Promise.all(jobs); } catch { /* ignore */ }
}

/** Thêm tài khoản từ token dán trong popup (auth → lưu → đăng nhập). */
async function addAccountFromToken() {
	const t = cleanTokenClient(ui.accswToken ? ui.accswToken.value : '');
	if (!looksLikeToken(t)) {
		toast('Token không đúng định dạng (cần dạng xxx.yyy.zzz).', true);
		return;
	}
	if (ui.accswAdd) ui.accswAdd.disabled = true;
	try {
		const r = await api.authCheck(t);
		if (!r || !r.ok || !r.user) {
			toast((r && r.message) || 'Token không hợp lệ.', true);
			return;
		}
		const saved = await api.accountsAdd({
			id: String(r.user.id),
			username: r.user.username || '',
			displayName: r.user.displayName || '',
			avatar: r.user.avatar || '',
			token: t,
			activate: true,
		});
		if (saved && saved.ok === false) {
			toast('Không lưu được tài khoản: ' + (saved.message || ''), true);
			return;
		}
		await loadAccountsCache();
		// Đăng nhập LUÔN tài khoản vừa thêm
		ui.token.value = t;
		lastAuthedToken = t;
		await api.saveConfig(collectConfig());
		closeAccSw();
		renderDiscordProfile(r.user);
		// Wave#111: thêm tài khoản xong phải mở khoá nút Quét/Auto ORBs ngay —
		// trước đây token có mà nút vẫn disabled đến lần render trạng thái kế tiếp.
		setBusyFlags();
		setTokenStatus(signedInLabel(r.user.username, r.user.id), 'ok');
		toast(`Đã thêm & đăng nhập: @${r.user.username}`);
		appendLog(`[Multiaccount] Đã thêm tài khoản @${r.user.username} (ID ${r.user.id})`, 'ok');
	} catch (e) {
		toast('Lỗi: ' + ((e && e.message) || 'không xác thực được'), true);
	} finally {
		if (ui.accswAdd) ui.accswAdd.disabled = false;
	}
}

/* ---------------- Discord Profile (bê nguyên từ Discord web) ---------------- */

const CDN = 'https://cdn.discordapp.com';

/**
 * Vẽ profile Discord (vào khung pop của user panel):
 * banner CDN (hoặc accent gradient), avatar thật, decoration đè lên avatar,
 * clan badge + tag — y hệt web Discord.
 */
function renderDiscordProfile(user) {
	if (!user) return;
	currentUser = user; // Waves 17: giữ lại cho modal logout (avatar + ID)
	const { id, username, displayName, avatar, banner, accentColor, avatarDecoration, avatarDecorationSku, clan, profileEffect, themeColors, profileBanner, profileFrame } = user;

	const display = displayName || username || 'Discord User';
	ui.dpDisplay.textContent = display;
	ui.dpUsername.textContent = username ? `@${username}` : '';
	ui.upName.textContent = display;
	ui.upSub.textContent = username ? `@${username}` : 'Đã đăng nhập';

	// Avatar nhỏ trên panel + avatar lớn trong pop
	ui.upAvatar.innerHTML = '';
	ui.dpAvatar.innerHTML = '';
	const setAvatar = (holder, size) => {
		holder.classList.toggle('is-default', !(avatar && id));
		if (avatar && id) {
			const ext = avatar.startsWith('a_') ? 'gif' : 'png';
			const img = document.createElement('img');
			img.src = `${CDN}/avatars/${id}/${avatar}.${ext}?size=${size}`;
			img.alt = '';
			img.className = holder === ui.upAvatar ? 'up-avatar-img' : 'dp-avatar-img';
			holder.appendChild(img);
		}
		// Waves 41: KHÔNG avatar → dùng avatar MẶC ĐỊNH của Discord (nền xám trung
		// tính, đúng style Discord), KHÔNG để nền tím thương hiệu như trước.
		// Ảnh mặc định lấy từ CDN Discord (embed/avatars) — đúng cái Discord dùng.
	};
	setAvatar(ui.upAvatar, 64);
	setAvatar(ui.dpAvatar, 128);
	// Gắn avatar mặc định cho cả 2 khung khi account không có avt
	const defaultIdx = id ? (Number((BigInt(id) >> 22n) % 6n) || 0) : 0;
	for (const holder of [ui.upAvatar, ui.dpAvatar]) {
		if (holder.classList.contains('is-default')) {
			const img = document.createElement('img');
			img.src = `${CDN}/embed/avatars/${defaultIdx}.png`;
			img.alt = '';
			img.className = holder === ui.upAvatar ? 'up-avatar-img' : 'dp-avatar-img';
			img.addEventListener('error', () => img.remove(), { once: true });
			holder.appendChild(img);
		}
	}

	// Waves 21: TRANG TRÍ ẢNH ĐẠI DIỆN trên chip sidebar (tràn ra ngoài khung tròn)
	if (avatarDecoration && id) {
		ui.upDeco.style.backgroundImage = `url('${CDN}/avatar-decoration-presets/${avatarDecoration}.png?size=96&passthrough=true')`;
		ui.upAvatarwrap.classList.add('has-deco');
	} else {
		ui.upDeco.style.backgroundImage = '';
		ui.upAvatarwrap.classList.remove('has-deco');
	}

	// Banner: profileBanner (from /profile) → banner (from /users/@me) → accent gradient → mặc định
	ui.dpBanner.innerHTML = '';
	ui.dpBanner.style.background = '';
	ui.dpBanner.classList.remove('default');
	const popBanner = profileBanner || banner;
	let dpHasImg = false;
	if (popBanner && id) {
		const ext = popBanner.startsWith('a_') ? 'gif' : 'png';
		ui.dpBanner.style.background = `center / cover no-repeat url('${CDN}/banners/${id}/${popBanner}.${ext}?size=600')`;
		dpHasImg = true;
	} else if (accentColor) {
		ui.dpBanner.style.background = linearGradientFromHex(intToHex(accentColor));
	} else {
		ui.dpBanner.classList.add('default');
	}
	ui.dpBanner.dataset.bannerImage = dpHasImg ? '1' : '';
	ui.upPop.dataset.bannerImage = dpHasImg ? '1' : '';

	// Waves 49/50: THEME COLORS — gradient Nitro từ Discord.
	//   Áp cho BANNER (lớp ::before) + cho chính THẺ (lớp ::after, nền khung).
	//   Bro: "phải có màu ở chỗ 2 khung này … làm background cho từng khung".
	const hasTheme = Array.isArray(themeColors) && themeColors.length >= 2;
	applyThemeColors(themeColors, ui.dpBanner, ui.upPop);
	applyThemeColors(themeColors, ui.phBanner, ui.heroProfile);
	if (hasTheme) {
		const tshadow = themeTextShadow();
		for (const el of [ui.upName, ui.dpDisplay, ui.dpUsername]) {
			if (el) el.style.textShadow = tshadow;
		}
	} else {
		for (const el of [ui.upName, ui.dpDisplay, ui.dpUsername]) {
			if (el) el.style.removeProperty('text-shadow');
		}
	}

	// Waves 49: PROFILE EFFECT (preset effect ảnh động từ CDN Discord)
	renderProfileEffect(profileEffect, ui.dpEffect, 'pop');

	// Waves#85 — BRO LỆNH: xoá Khung popout.
	// Trước `#85`: renderProfileFrame(profileFrame, ui.dpFrame, 'pop').
	// `#85`: truyền `null` → renderProfileFrame đi nhánh return-sớm +
	// hide khung + xoá hết CSS vars. Effect (avatar) vẫn chạy, banner,
	// Nitro, nameplate đều KHÔNG touch. Model: hero giũa trang đã truyền
	// `null` từ đầu. Lý do: khung overlay (staple top/bottom ôm thẻ)
	// lệch giữa animation `upPopIn scale(0.98→1)` (0.18s) — 2 round vá
	// (hoang-tràng ở `#57`/`#84`) chưa ổn ra; bro dừng hẳn.
	renderProfileFrame(null, ui.dpFrame, 'pop');

	// Avatar decoration đè lên avatar lớn (trang trí bảng tên Discord)
	ui.dpDecoration.innerHTML = '';
	if (avatarDecoration && id) {
		const decoImg = document.createElement('img');
		decoImg.src = `${CDN}/avatar-decoration-presets/${avatarDecoration}.png?size=96&passthrough=true`;
		decoImg.alt = '';
		ui.dpDecoration.appendChild(decoImg);
	}

	// Clan badge + tag — pop (sidebar) và hero giữa trang
	if (clan && clan.badge) {
		const badgeSrc = `${CDN}/clan-badges/${clan.guildId || '0'}/${clan.badge}.png?size=32`;
		ui.dpClanBadge.src = badgeSrc;
		ui.dpClanBadge.hidden = false;
		ui.phClanBadge.src = badgeSrc;
		ui.phClanBadge.hidden = false;
		for (const tagEl of [ui.dpClanTag, ui.phClanTag, ui.upClanTag]) {
			tagEl.textContent = clan.tag || '';
			tagEl.hidden = !clan.tag;
		}
	} else {
		ui.dpClanBadge.hidden = true;
		ui.dpClanTag.hidden = true;
		ui.phClanBadge.hidden = true;
		ui.phClanTag.hidden = true;
		ui.upClanTag.hidden = true;
	}

	ui.dprofile.dataset.state = 'logged-in';
	// Waves 22: bỏ hẳn dòng "Đóng khung quản lý" trong popup (chỉ giữ cho khách đăng nhập)
	ui.dpBadge.hidden = true;

	// ---- Hero giữa trang (Waves 15/16): BẮT BUỘC hiện khi đăng nhập ----
	ui.heroProfile.hidden = false;
	ui.phDisplay.textContent = display;
	// Waves 48: áp KIỂU TÊN HIỂN THỊ thật của Discord (font + hiệu ứng + màu).
	loadDisplayNameStyle(display, id);
	ui.phUsername.textContent = username ? `@${username}` : '';
	// Waves 17: dòng ID Discord thật (user.id từ API)
	ui.phUserId.hidden = !id;
	ui.phUserIdValue.textContent = id || '—';
	ui.phAvatar.innerHTML = '';
	ui.phAvatar.classList.toggle('is-default', !(avatar && id));
	if (avatar && id) {
		const ext = avatar.startsWith('a_') ? 'gif' : 'png';
		const img = document.createElement('img');
		img.src = `${CDN}/avatars/${id}/${avatar}.${ext}?size=160`;
		img.alt = '';
		img.className = 'ph-avatar-img';
		ui.phAvatar.appendChild(img);
		ui.phAvatar.classList.add('has-photo');
	} else {
		// Waves 41: avatar mặc định Discord (xám trung tính), không nền tím.
		const idx = id ? Number((BigInt(id) >> 22n) % 6n) || 0 : 0;
		const img = document.createElement('img');
		img.src = `${CDN}/embed/avatars/${idx}.png`;
		img.alt = '';
		img.className = 'ph-avatar-img';
		img.addEventListener('error', () => img.remove(), { once: true });
		ui.phAvatar.appendChild(img);
		ui.phAvatar.classList.add('has-photo');
	}
	// Waves 46b: nếu user KHÔNG có ảnh đại diện thật thì giữ LOGO ORB TO làm
	// "mặt" của thẻ hero — đây mới đúng ý bro "logo orb to ở chính giữa".
	// Ảnh phải nạp được (naturalWidth>0) mới bật; hỏng thì rơi về hình người.
	syncHeroOrb();
	// Wave#87: đã đăng nhập → BỎ class guest + Ẩn nút "Đăng nhập tài khoản Discord".
	ui.heroProfile.classList.remove('is-discord-guest');
	ui.heroProfile.dataset.state = 'logged-in';
	ui.phAvatar.classList.remove('is-discord-guest');
	if (ui.phLoginHint) ui.phLoginHint.hidden = true;
	ui.phBanner.classList.remove('default');
	// Waves 49: ưu tiên profileBanner (từ /users/@me/profile) rồi banner (từ /users/@me)
	const heroBanner = profileBanner || banner;
	let phHasImg = false;
	if (heroBanner && id) {
		const ext = heroBanner.startsWith('a_') ? 'gif' : 'png';
		ui.phBanner.style.background = `center / cover no-repeat url('${CDN}/banners/${id}/${heroBanner}.${ext}?size=600')`;
		phHasImg = true;
	} else if (accentColor) {
		ui.phBanner.style.background = linearGradientFromHex(intToHex(accentColor));
	} else {
		ui.phBanner.style.background = '';
		ui.phBanner.classList.add('default');
	}
	ui.phBanner.dataset.bannerImage = phHasImg ? '1' : '';
	ui.heroProfile.dataset.bannerImage = phHasImg ? '1' : '';
	/* Waves 50 — BRO CHỐT: "loại bỏ triệt để khung ở giữa" + "LOẠI BỎ TRIỆT ĐỂ
	   HIỆU ỨNG Ở BÊN KHUNG CHÍNH VÀ CẢ KHUNG".

	   ⇒ Thẻ hero GIỮA trang KHÔNG vẽ khung, KHÔNG vẽ hiệu ứng hồ sơ nữa. Chỉ
	   còn profile BÊN TRÁI (popout) mang khung + hiệu ứng. Avatar, tên, banner,
	   decoration… vẫn nguyên — bro cấm xoá mấy thứ đó.

	   Vẫn phải DỌN SẠCH node hero để lần trước không sót lại. */
	renderProfileEffect(null, ui.phEffect, 'hero');
	renderProfileFrame(null, ui.phFrame, 'hero');
	ui.phDecoration.innerHTML = '';
	if (avatarDecoration && id) {
		const decoImg = document.createElement('img');
		decoImg.src = `${CDN}/avatar-decoration-presets/${avatarDecoration}.png?size=96&passthrough=true`;
		decoImg.alt = '';
		ui.phDecoration.appendChild(decoImg);
	}

	// ---- NAMEPLATE CHUẨN DISCORD (Waves 16/18) ----
	// Waves 22: CHỈ hero giữa trang dùng nameplate. Popup quản lý để tên TRẦN
	// (bro yêu cầu bỏ hiệu ứng bảng tên bên trong khung quản lý).
	applyNameplate(user.nameplate, ui.phNameplate);
	applyNameplate(null, ui.dpNameplate); // dọn sạch hiệu ứng bảng tên trong popup
	// Waves 21: hiệu ứng bảng tên phủ lên KHUNG BO TRÒN NGOÀI của chip sidebar
	applyChipNameplate(user.nameplate);

	// Waves 28: VIỀN KHUNG PROFILE lấy ĐÚNG màu bảng tên của user.
	//   - Có nameplate  → --np = màu palette (đỏ → viền đỏ, xanh → viền xanh…)
	//   - Không có      → bỏ --np ⇒ CSS dùng viền mặc định (xanh thương hiệu)
	//   CẤM rainbow khi user đã có nameplate (đúng yêu cầu bro).
	applyProfileAura(user.nameplate);

	// ---- HIỆU ỨNG AVATAR (Waves 18): user có nameplate/decoration → ring conic xoay quanh avatar ----
	const hasEffect = !!(avatarDecoration || (user.nameplate && user.nameplate.asset));
	ui.phAvatarwrap.classList.toggle('has-effect', hasEffect);
	if (hasEffect) {
		/* Ring avatar xoay lấy màu palette bảng tên (do applyNameplate set) —
		   Waves 55: KHÔNG fallback tím. Không có palette ⇒ CSS rơi về màu Nitro
		   `--theme-b` của chính user (luôn động, không bịa màu). */
		const npRing = ui.phNameplate.style.getPropertyValue('--np-ring');
		if (npRing) {
			ui.phAvatarwrap.style.setProperty('--np', npRing);
			ui.phAvatarwrap.style.setProperty('--np-ring', npRing);
		} else {
			ui.phAvatarwrap.style.removeProperty('--np');
			ui.phAvatarwrap.style.removeProperty('--np-ring');
		}
	} else {
		ui.phAvatarwrap.style.removeProperty('--np');
		ui.phAvatarwrap.style.removeProperty('--np-ring');
	}

	// ---- TOÀN BỘ HUY HIỆU trích từ token (Waves 18): badges xếp cạnh tên ----
	renderBadges(ui.phBadges, user.badges, user.premiumType);
	renderBadges(ui.dpBadges, user.badges, user.premiumType);

	// ---- Wave#88/#90: NÚT ĐĂNG XUẤT (đỏ) + ĐỔI TÀI KHOẢN — bật khi đã login ----
	applyAccountButtons();
	// ---- Wave#88: lưu/đổi entry trong "Tài khoản" cache (token do authCheck trả về) ----
	registerAccount(user);
	// ---- Wave#89: thẻ "Thông tin tài khoản" trong Cài đặt (chỉ display) ----
	refreshCfgCard(user);

	// ---- SỐ ORB KHẢ DỤNG: trích xuất thật ngay khi đăng nhập ----
	fetchOrbBalance(tokenOf(user));
	// Waves #120/#121: lịch sử & hàng đợi tách riêng theo tài khoản.
	renderQueueChip();
	renderStats();
	hydrateOfflineInventory();
}

/* ========== Waves 49: PROFILE EFFECT + FRAME + THEME COLORS ==========
   Toàn bộ công thức dưới đây chép ĐÚNG từ client Discord đang chạy
   (js-web.057e7776e1c6251b.js), không phải đoán:
   - URL builder (module 746002):
       `${CDN}/media/v1/collectibles-shop/${skuId}/${assetId?}/${assetFormat}`
       assetFormat ∈ { static | animated | video }
   - Model frame (module 892118) + parser collectibles:
       { sku_id, type:"profile_frame", label, layers, inner_width,
         overflow_top, overflow_bottom, overflow_horizontal }
   - CSS vars (module 163697): class `custom-profile-frame` +
       --custom-profile-frame-container-width / -overflow-top / -overflow-bottom
       / -overflow-horizontal
   - Enums: layer type staple|rail|border; anchor top|bottom|center;
       order front|back.
   - computeFrameVars (module 561509):
       INNER_WIDTH=1200, OVERFLOW_TOP=304, OVERFLOW_BOTTOM=212,
       OVERFLOW_HORIZONTAL=56;
       overflowTop    = max(0, layerHeight - (716 - 304))   (layer staple neo top)
       overflowBottom = max(0, layerHeight - (424 - 212))   (layer staple neo bottom)
       overflowHorizontal = max round(max(0,(layerWidth-1200)/2))
   ========================================================================== */

/** Chuyển theme_colors integer (Discord) sang hex (#rrggbb). */
function themeColorToHex(n) {
	if (typeof n !== 'number' || !Number.isFinite(n)) return null;
	return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

/** Dựng style bóng chữ cho gradient: ở theme Sáng, chữ sáng trên nền sáng sẽ
 *  chìm → thêm viền tối để vẫn đọc được. KHÔNG dùng ở theme Tối (nền đã tối). */
function themeTextShadow() {
	const light = document.documentElement.dataset.theme === 'light';
	return light ? '0 1px 3px rgba(0,0,0,.55)' : '0 1px 3px rgba(0,0,0,.45)';
}

/** Áp theme colors [primary, accent] — Waves 50.

 *  Bro chốt: "MÀU DISCORD NITRO BRO GỌI ĐÂU ??? phải có màu ở chỗ 2 khung này
 *  là điều bắt buộc, ko chèn lên ảnh bìa, chỉ chiếm phần khoảng trống dưới và
 *  đóng vai trò background cho từng khung".

 *  ⇒ Gradient Nitro được ghi vào HAI nơi:
 *    1) `bannerEl` — lớp `::before` SẴN CÓ (giữ nguyên hành vi cũ: không ảnh
 *       thì gradient thay hẳn nền; có ảnh thì chỉ tint mờ 32%).
 *    2) `cardEl`  — lớp `::after` MỚI trên chính THẺ, nhưng bắt đầu từ
 *       `--theme-banner-h` trở xuống ⇒ KHÔNG chèn lên ảnh bìa, chỉ làm nền
 *       cho phần thân khung. Chữ/avatar nằm ở z-index cao hơn nên luôn nổi.

 *  `--theme-banner-h` do hàm này ĐO THẬT từ banner (không hardcode) để co giãn
 *  theo mọi theme/cỡ cửa sổ. */
function applyThemeColors(colors, bannerEl, cardEl) {
	const targets = [bannerEl, cardEl].filter(Boolean);
	const clear = () => {
		for (const el of targets) {
			el.style.removeProperty('--theme-a');
			el.style.removeProperty('--theme-b');
			el.style.removeProperty('--theme-gradient');
			el.style.removeProperty('--theme-active');
			el.style.removeProperty('--theme-banner-h');
			el.style.removeProperty('--theme-fg');
			el.style.removeProperty('--theme-fg-soft');
			el.style.removeProperty('--theme-text-shadow');
			el.style.removeProperty('--banner-fade-to');
			el.style.removeProperty('--banner-fade-h');
		}
	};
	if (!Array.isArray(colors) || colors.length < 2) {
		clear();
		return;
	}
	const a = themeColorToHex(colors[0]);
	const b = themeColorToHex(colors[1]);
	if (!a || !b) {
		clear();
		return;
	}
	/* Waves 53 — GRADIENT DỌC (180deg) thay cho 135deg.
	   Lý do kỹ thuật: dải chuyển tiếp ở đáy ẢNH BÌA phải khớp TUYỆT ĐỐI màu ở
	   mép trên lớp Nitro. Gradient chéo làm mép trên đổi màu theo trục ngang ⇒
	   không thể khớp bằng một màu duy nhất (sinh đường nối). Dọc thì mép trên là
	   MỘT màu (`b`) ⇒ khớp 100%. Vẫn đúng 2 màu Nitro của user, không bịa màu.
	   (Chuỗi gradient được dựng SAU khi kẹp độ sáng — xem bên dưới.) */

	/* Waves 53 — MÀU CHỮ TRÊN NỀN NITRO, TÍNH TỪ CHÍNH MÀU USER.
	   Skill UI/UX: "màu không được là chỉ báo duy nhất" + "hardcode rgba(255,…)
	   là gốc rễ khiến chế độ Sáng chìm màu". Nền Nitro có thể là đỏ/trắng/vàng
	   rất khác nhau giữa các user ⇒ KHÔNG được hardcode trắng hay đen.
	   Tính độ sáng tương đối của màu ĐẬM HƠN trong 2 màu (chỗ chữ nằm), rồi chọn
	   trắng hoặc gần-đen — đúng cách Discord tính màu tương phản cho profile. */
	const relLum = (hex) => {
		const n = parseInt(hex.slice(1), 16);
		const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
			const s = v / 255;
			return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
	};
	const la = relLum(a);
	const lb = relLum(b);

	const hexToRgb = (hex) => {
		const n = parseInt(hex.slice(1), 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	};
	const rgbToHex = (c) =>
		'#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
	const lumRgb = (c) => {
		const ch = c.map((v) => {
			const s = v / 255;
			return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
	};
	const contrast = (c1, c2) => {
		const l1 = lumRgb(c1);
		const l2 = lumRgb(c2);
		return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
	};

	/* Waves 53 — LUẬT CỨNG 4.5:1 CHO CẢ DẢI GRADIENT, KHÔNG CHỈ MỘT ĐIỂM.

	   Bẫy đã vấp (đo được trên chính tài khoản bro): Nitro là
	   `#000061 → #ff0000`. Bản trước chọn màu chữ theo độ sáng của **đầu trên**
	   (`b`, navy rất tối) ⇒ chọn TRẮNG. Nhưng dòng UID nằm tận ~62% chiều cao dải
	   nên nền quanh nó gần như đỏ thuần ⇒ trắng trên `#ff0000` chỉ **4.0:1**
	   (đen được 5.25:1). Một biến `--theme-fg` dùng chung cho mọi vị trí thì phải
	   đúng ở MỌI điểm của dải, không phải chỉ ở đỉnh.

	   ⇒ (1) chọn trắng/đen theo **điểm XẤU NHẤT** (trắng ⇒ đầu SÁNG nhất;
	   đen ⇒ đầu TỐI nhất), lấy phương án cho tương phản cao hơn.
	   (2) nếu phương án tốt nhất vẫn < 4.5 thì **kẹp độ sáng chính đầu màu đó**
	   (giữ nguyên hue, chỉ kéo sáng/tối) cho tới khi vừa đủ 4.5. Đây đúng là
	   "designer lại" theo ghi chú dự án: chỉnh độ sáng HSL, KHÔNG đổi hue. */
	const bgMax = Math.max(la, lb);
	const bgMin = Math.min(la, lb);
	const whiteC = 1.05 / (bgMax + 0.05);
	const blackC = (bgMin + 0.05) / 0.05;
	const useWhite = whiteC >= blackC;
	const fg = useWhite ? '#ffffff' : '#0b0d14';
	const TARGET = 4.5;

	/* Kéo độ sáng một màu (giữ hue) tới ngưỡng `lim`. dir=-1 làm tối, +1 làm sáng. */
	const clampLum = (hex, lim, dir) => {
		const c = hexToRgb(hex);
		let lo = 0;
		let hi = 1;
		let best = c;
		for (let i = 0; i < 26; i++) {
			const mid = (lo + hi) / 2;
			const cand = dir < 0 ? c.map((v) => v * mid) : c.map((v) => v + (255 - v) * mid);
			const ok = dir < 0 ? lumRgb(cand) <= lim : lumRgb(cand) >= lim;
			if (ok) {
				best = cand;
				if (dir < 0) lo = mid;
				else hi = mid;
			} else if (dir < 0) {
				hi = mid;
			} else {
				lo = mid;
			}
		}
		return rgbToHex(best);
	};

	let hexA = a;
	let hexB = b;
	if (useWhite && whiteC < TARGET) {
		/* Đầu SÁNG nhất phải tối lại: L ≤ 1.05/4.5 − 0.05 = 0.18333 */
		const lim = 1.05 / TARGET - 0.05;
		if (la >= lb) hexA = clampLum(a, lim, -1);
		else hexB = clampLum(b, lim, -1);
	} else if (!useWhite && blackC < TARGET) {
		/* Đầu TỐI nhất phải sáng lên: L ≥ 4.5·0.05 − 0.05 = 0.175 */
		const lim = TARGET * 0.05 - 0.05;
		if (la <= lb) hexA = clampLum(a, lim, 1);
		else hexB = clampLum(b, lim, 1);
	}

	const grad = `linear-gradient(180deg, ${hexB} 0%, ${hexA} 100%)`;

	/* Điểm nền XẤU NHẤT sau khi kẹp — chỉ dùng để BIẾT đã an toàn, không dùng để
	   quyết định thị giác: chữ thật không bao giờ nằm ở 100% chiều cao dải. */
	const fgRgb = hexToRgb(fg);
	const rgbA = hexToRgb(hexA);
	const rgbB = hexToRgb(hexB);
	const mixRgb = (c1, c2, k) => c1.map((v, i) => v + (c2[i] - v) * k);

	/* Màu nền Ở GIỮA dải = chỗ chữ thật sự nằm. Dùng nó cho các quyết định
	   thị giác (bóng chữ) — xét ở đầu mút thì quá bi quan và sinh ra quầng đen
	   không cần thiết, đúng thứ khiến chữ trông "thô". */
	const midBg = mixRgb(rgbB, rgbA, 0.5);
	const midContrast = contrast(fgRgb, midBg);

	/* Dòng UID: GIỮ ĐÚNG màu chữ chính, phân cấp bằng cỡ chữ + letter-spacing
	   (đã có trong CSS). KHÔNG hạ alpha/nền để "nhạt hơn" — hạ alpha là cách
	   chắc chắn nhất để phá 4.5:1, và pha màu chữ về phía nền Nitro sẽ làm dòng
	   UID bị ám màu (trắng thành hồng trên nền đỏ). */
	const fgSoft = fg;

	/* Bóng chữ CHỈ bật khi tương phản Ở GIỮA DẢI mỏng. Bro: "@username và uid
	   hiện rất thô" — quầng đen trên chữ vốn đã 8–11:1 chỉ làm nhoè nét. */
	const textShadow = midContrast >= 7 ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.34)';

	for (const el of targets) {
		el.style.setProperty('--theme-a', hexA);
		el.style.setProperty('--theme-b', hexB);
		el.style.setProperty('--theme-gradient', grad);
		el.style.setProperty('--theme-active', '1');
		el.style.setProperty('--theme-fg', fg);
		el.style.setProperty('--theme-fg-soft', fgSoft);
		el.style.setProperty('--theme-text-shadow', textShadow);
		/* Đáy ảnh bìa tan vào CHÍNH màu Nitro (không tan vào `--card` = trắng ở
		   chế độ Sáng — đó chính là dải trắng bro chỉ ra). */
		el.style.setProperty('--banner-fade-to', hexB);
	}
	/* Đo chiều cao THẬT của banner trên chính THẺ đó để lớp nền bắt đầu đúng
	   mép dưới banner (không chèn lên ảnh bìa). Banner có thể chưa có rect
	   (thẻ đang ẩn) → fallback theo biến `--ph-banner-h` của CSS. */
	if (cardEl) {
		const banner = bannerEl || cardEl.querySelector('.ph-banner, .up-pop-banner');
		const measure = () => {
			/* `hidden` ⇒ rect = 0 ⇒ KHÔNG ghi 0px (sẽ đè mất giá trị đúng khi
			   panel vừa hiện). Chỉ ghi khi đo được chiều cao THẬT. */
			const h = banner ? banner.getBoundingClientRect().height : 0;
			if (h > 0) {
				cardEl.style.setProperty('--theme-banner-h', `${Math.round(h)}px`);
				/* Waves 55 — chiều cao dải tan ở đáy ảnh bìa, TỈ LỆ theo banner
				   (không hardcode px cứng): popout banner 60px ⇒ ~22px; hero
				   banner 168px ⇒ kẹp ở 30px (quá dài sẽ thành "dải màu" — đúng
				   thứ bro bác ở Waves 42–49). */
				const fade = Math.min(30, Math.max(16, Math.round(h * 0.28)));
				bannerEl?.style.setProperty('--banner-fade-h', `${fade}px`);
				cardEl.style.setProperty('--banner-fade-h', `${fade}px`);
				const bw = bannerEl || cardEl.querySelector('.ph-banner, .up-pop-banner');
				bw?.style.setProperty('--banner-fade-h', `${fade}px`);
			}
		};
		cardEl.__themeMeasure = measure; // móc lại được lúc panel mở (xem upRow click)
		measure();
		// Đo lại sau khi layout ổn định (thẻ có thể vừa hiện / vừa đổi theme).
		if (typeof requestAnimationFrame === 'function') {
			requestAnimationFrame(measure);
			setTimeout(measure, 160);
			setTimeout(measure, 600);
		}
	}
}

/** URL asset collectible (effect / frame layer) theo ĐÚNG route Discord.
 *  assetId rỗng = tầng gộp của sku (dùng cho preset effect). */
function collectibleAssetUrl(skuId, assetFormat, assetId) {
	if (!skuId || !assetFormat) return '';
	const s = encodeURIComponent(skuId);
	const mid = assetId ? `${encodeURIComponent(assetId)}/` : '';
	return `${CDN}/media/v1/collectibles-shop/${s}/${mid}${assetFormat}`;
}

/** Render profile effect lên img element.
 *
 *  Waves 49b — HÌNH DẠNG THẬT (đo từ tài khoản thật):
 *    profileEffect = {
 *      sku, staticFrameSrc, reducedMotionSrc, thumbnailSrc,
 *      effects: [ { src, loop, height, width, duration, start, loopDelay, x, y, zIndex } ]
 *    }
 *  `src` là URL TUYỆT ĐỐI `assets/content/<hash>` — KHÔNG phải route
 *  collectibles-shop. Ảnh luôn PNG tĩnh, "animation" là do CSS/JS xếp lớp
 *  (Discord phát từng frame theo `duration`/`start`/`loopDelay`).
 *
 *  Ở đây ta chỉ cần một ảnh đại diện đủ đẹp: ưu tiên layer có zIndex cao nhất
 *  (nằm trên cùng, thấy rõ nhất), dự phòng `staticFrameSrc`, cuối cùng mới tới
 *  `reducedMotionSrc`. */
function renderProfileEffect(profileEffect, imgEl, mode) {
	if (!imgEl) return;
	imgEl.onerror = null;

	/* ĐÚNG Discord (js-web, hàm render layer effect):
	     mỗi layer là <img> position:absolute
	     style.top  = (layer.position.y ?? 0) - bannerAdjustment
	     style.left = (layer.position.x ?? 0)
	   Canvas gốc 450×880. Container là THẺ HỒ SƠ, và phải có một hệ số
	   scale để 450 map vào bề rộng thẻ:
	     scale = cardWidth / 450
	   Ta để CSS lo phần scale qua biến --pe-scale; JS chỉ gán vị trí gốc.
	   `bannerAdjustment` = 0 với hero (effect phủ cả thẻ, không cắt theo banner). */

	const pe = profileEffect;
	const layers = pe && Array.isArray(pe.effects) ? pe.effects.slice() : [];
	// zIndex tăng dần = vẽ sau lên trên (đúng thứ tự Discord sort).
	layers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

	const anySrc =
		layers.some((l) => l && l.src) || pe?.staticFrameSrc || pe?.reducedMotionSrc || '';
	if (!anySrc) {
		/* DỌN SẠCH (Waves 50): không chỉ ẩn — phải gỡ cả lưới lát ô và các biến
		   hình học, nếu không lần render sau (đổi tài khoản) sẽ dùng lại rác cũ. */
		imgEl.hidden = true;
		imgEl.classList.remove('is-looping', 'pe-tiled', 'pe-intermittent');
		imgEl.dataset.peTiled = '';
		imgEl.__peCols = 0;
		imgEl.__peRows = 0;
		imgEl.removeAttribute('data-pe-tiled');
		for (const p of [
			'--pe-box-h', '--pe-tile-w', '--pe-tile-h', '--pe-cols', '--pe-rows',
			'--pe-s', '--pe-cx', '--pe-ty', '--pe-canvas-w', '--pe-canvas-h',
		]) {
			imgEl.style.removeProperty(p);
		}
		imgEl.innerHTML = '';
		return;
	}

	// Canvas chuẩn của mọi profile effect.
	const CANVAS_W = 450;
	const CANVAS_H = 880;

	// Dựng lại các layer mỗi lần render (dữ liệu user đổi khi đổi tài khoản).
	imgEl.innerHTML = '';
	const frag = document.createDocumentFragment();
	const make = (src, pos, z, cls, loop) => {
		const im = document.createElement('img');
		im.className = cls;
		im.alt = '';
		im.draggable = false;
		im.decoding = 'async';
		im.loading = 'eager';
		im.setAttribute('aria-hidden', 'true');
		im.src = src;
		const x = pos && typeof pos.x === 'number' ? pos.x : 0;
		const y = pos && typeof pos.y === 'number' ? pos.y : 0;
		im.style.setProperty('--pe-x', `${x}px`);
		im.style.setProperty('--pe-y', `${y}px`);
		im.style.setProperty('--pe-z', String(z || 0));
		if (loop) im.dataset.peLoop = '1';
		im.onerror = () => {
			im.remove();
		};
		return im;
	};

	if (layers.length) {
		for (let i = 0; i < layers.length; i += 1) {
			const l = layers[i];
			if (!l || !l.src) continue;
			frag.appendChild(
				make(l.src, l.position, l.zIndex ?? i, 'pe-layer', !!l.loop),
			);
		}
	} else {
		// Không có layer rời → dùng ảnh tĩnh/chuyển động rút gọn.
		const src = pe.staticFrameSrc || pe.reducedMotionSrc || '';
		if (src) frag.appendChild(make(src, { x: 0, y: 0 }, 0, 'pe-layer', false));
	}

	imgEl.appendChild(frag);
	imgEl.style.setProperty('--pe-canvas-w', String(CANVAS_W));
	imgEl.style.setProperty('--pe-canvas-h', String(CANVAS_H));
	imgEl.hidden = false;
	imgEl.classList.add(isReducedMotion() ? 'pe-static' : 'is-looping');

	// Vài profile effect là INTERMITTENT (animationType 2) → chạy rồi nghỉ.
	if (pe && pe.animationType === 2) imgEl.classList.add('pe-intermittent');

	/* HỆ SỐ SCALE + VỊ TRÍ NEO — HAI CHẾ ĐỘ KHÁC NHAU (bro chốt):

	   (A) POPOUT (profiles TRÁI): "ướm vừa khung và để gọi hiệu ứng từ đầu
	       đến dưới khung dọc một cách gọn gàng". Thẻ popout CHÂN DUNG (221×205)
	       gần khớp canvas 450×880 về tỉ lệ, nên chỉ cần fit vừa theo CHIỀU CAO
	       và kéo giãn nhẹ cho phủ hết chiều dọc. Canh vào TÂM thẻ.

	   (B) HERO (profiles CHÍNH GIỮA): "nhân đôi nó ra thành 4 phần rồi ướm vào
	       đó từng phần cho nó vừa khít khung chữ nhật". Thẻ hero NẰM NGANG
	       4:1 còn canvas 0.51 → không thể phủ kín bằng 1 lần vẽ. Nên LÁT 2×2:
	       mỗi ô là canvas đã scale vừa `cardH`, rồi lặp ngang/dọc để phủ kín
	       hình chữ nhật. Nhờ vậy hiệu ứng trải đều khắp thẻ thay vì một lát cắt
	       dọc ở giữa.

	   Neo vẫn tính theo AVATAR cho popout (chủ thể), còn hero thì lát kín thẻ.
	   Cả hai đều suy từ dữ liệu thật của TỪNG user — không hardcode gì. */
	const applyScale = () => {
		const card = imgEl.closest('.hero-card, .up-pop, .profile-hero');
		const av = card
			? card.querySelector('.ph-avatar, .dp-avatar, .up-pop-avatarwrap, .up-pop-avatar')
			: null;
		const hostRect = imgEl.getBoundingClientRect();
		const avRect = av ? av.getBoundingClientRect() : null;
		const isHero = mode === 'hero' || imgEl.classList.contains('ph-effect');

		if (isHero && hostRect.width > 0 && hostRect.height > 0) {
			/* --- CHẾ ĐỘ LÁT 2×2 CHO PROFILES CHÍNH GIỮA ---
			   Bro chốt ĐÚNG 4 PHẦN: "nhân đôi nó ra thành 4 phần rồi ướm vào
			   đó từng phần cho nó vừa khít khung chữ nhật".

			   HAI điều phải đúng cùng lúc:
			   1) KHUNG CHỮ NHẬT = khung BANNER (752×168), KHÔNG phải cả thẻ
			      (752×270). Trùm cả thẻ thì hiệu ứng tràn xuống dải tên/id
			      và che chữ — đúng là "lỗi trầm trọng" bro thấy.
			   2) Lưới 2×2 CỐ ĐỊNH. Bản trước tự nới thành 11×2 = 22 ô, mỗi ô
			      chỉ 68px ⇒ hiệu ứng bị chặt thành sợi chỉ.

			   Mỗi ô = nửa rộng × nửa cao THẬT của khung banner, vẽ trọn
			   canvas bằng `object-fit: cover` ⇒ 4 phần ghép kín hình chữ
			   nhật và co giãn theo MỌI cỡ thẻ/cửa sổ/cỡ chữ — không hardcode. */
			const bannerEl = card
				? card.querySelector('.ph-banner, .dp-banner, .up-pop-banner')
				: null;
			const bannerRect = bannerEl ? bannerEl.getBoundingClientRect() : null;
			const boxW = bannerRect && bannerRect.width > 0 ? bannerRect.width : hostRect.width;
			const boxH = bannerRect && bannerRect.height > 0 ? bannerRect.height : hostRect.height;
			/* Banner luôn ở mép trên của thẻ nên hộp effect bám `top: 0`.
			   Ghi chiều cao THẬT xuống CSS để khung khớp từng theme/cỡ. */
			imgEl.style.setProperty('--pe-box-h', `${boxH}px`);

			const cols = 2;
			const rows = 2;
			const realTileW = boxW / cols;
			const realTileH = boxH / rows;
			imgEl.dataset.peTiled = '1';
			imgEl.style.setProperty('--pe-tile-w', `${realTileW}px`);
			imgEl.style.setProperty('--pe-tile-h', `${realTileH}px`);
			imgEl.style.setProperty('--pe-cols', String(cols));
			imgEl.style.setProperty('--pe-rows', String(rows));
			imgEl.style.setProperty('--pe-s', '1');
			imgEl.style.removeProperty('--pe-cx');
			imgEl.style.removeProperty('--pe-ty');
			if (imgEl.__peCols !== cols || imgEl.__peRows !== rows) {
				imgEl.__peCols = cols;
				imgEl.__peRows = rows;
				buildEffectTiles(imgEl, cols, rows);
			}
			return;
		}

		/* --- CHẾ ĐỘ POPOUT: MỘT bản vẽ, phủ KÍN thẻ (cover), KHÔNG lát ô ---

		   Bro: *"MÀY ĐANG RENDER 10 CÁI HIỆU ỨNG AVT NHÉT NÓ TRONG KHUNG ???"*.

		   Bản trước quét lưới (r 1..3 × c 1..6) chọn ô gần tỉ lệ canvas nhất ⇒
		   thẻ 223×194 rơi vào **5×2 = 10 ô ⇒ 30 ảnh** ⇒ hiệu ứng lặp 10 lần,
		   trông như 10 cái hiệu ứng nhét trong khung. SAI HOÀN TOÀN.

		   Bro chốt từ đầu: *"chỉ việc ướm vừa khung và để gọi hiệu ứng từ đầu
		   đến dưới khung dọc một cách gọn gàng"* ⇒ ĐÚNG MỘT bản vẽ, scale
		   `max(cardW/450, cardH/880)` = COVER ⇒ phủ kín cả ngang lẫn dọc; phần
		   thừa của canvas bị cắt ra ngoài (clip-path của hộp), KHÔNG lặp lại.
		   Canh TÂM thẻ theo cả 2 chiều. */
		imgEl.dataset.peTiled = '';
		imgEl.style.removeProperty('--pe-box-h');
		if (imgEl.__peCols) {
			imgEl.__peCols = 0;
			imgEl.__peRows = 0;
			untileEffect(imgEl);
		}
		if (hostRect.width > 0 && hostRect.height > 0) {
			const s = Math.max(hostRect.width / 450, hostRect.height / 880);
			imgEl.style.setProperty('--pe-s', String(s));
			imgEl.style.setProperty('--pe-cx', `${hostRect.width / 2}px`);
			imgEl.style.setProperty('--pe-ty', `${hostRect.height / 2}px`);
		} else {
			imgEl.style.setProperty('--pe-s', '1');
			imgEl.style.setProperty('--pe-cx', '50%');
			imgEl.style.setProperty('--pe-ty', '50%');
		}
	};
	applyScale();
	imgEl.__relayoutExtra = applyScale;
	scheduleFrameRelayout(imgEl, mode, applyScale);
}

/** Lát hiệu ứng thành `cols × rows` ô phủ kín hộp effect.
 *  Mỗi ô là một BẢN SAO của cùng bộ layer (mọi tài khoản đều đi qua đường này,
 *  số ô suy từ kích thước thẻ thật nên co giãn linh hoạt theo từng user/cỡ
 *  cửa sổ). Bản gốc (col 0, row 0) đã có sẵn trong DOM — chỉ nhân thêm phần
 *  còn lại để không dựng trùng. */
function buildEffectTiles(imgEl, cols, rows) {
	const total = cols * rows;
	/* Bản gốc (`.pe-layer` là con TRỰC TIẾP của hộp) được GOM vào ô số 0 dưới
	   dạng `.pe-tile-slot` để MỌI ô dùng chung một công thức định vị. Không gom
	   thì ô 0 nằm rời rạc và lệch khỏi lưới. */
	const loose = Array.from(imgEl.querySelectorAll(':scope > .pe-layer'));
	if (!loose.length) return;
	let slot0 = imgEl.querySelector(':scope > .pe-tile-slot[data-pe-slot="0"]');
	if (!slot0) {
		slot0 = document.createElement('div');
		slot0.className = 'pe-tile-slot';
		slot0.dataset.peSlot = '0';
		for (const el of loose) slot0.appendChild(el);
		imgEl.appendChild(slot0);
	}
	// Xoá các ô nhân bản cũ (giữ ô 0).
	for (const dup of imgEl.querySelectorAll('.pe-tile-slot:not([data-pe-slot="0"])')) dup.remove();

	const basePos = Array.from(slot0.querySelectorAll('.pe-layer')).map((el) => ({
		src: el.getAttribute('src') || '',
		cls: el.className,
	}));
	if (!basePos.some((b) => b.src)) return;

	for (let r = 0; r < rows; r += 1) {
		for (let c = 0; c < cols; c += 1) {
			const idx = r * cols + c;
			if (idx === 0) continue;
			const slot = document.createElement('div');
			slot.className = 'pe-tile-slot';
			slot.dataset.peSlot = String(idx);
			slot.style.setProperty('--pe-tile-c', String(c));
			slot.style.setProperty('--pe-tile-r', String(r));
			for (const bp of basePos) {
				if (!bp.src) continue;
				const im = document.createElement('img');
				im.className = bp.cls;
				im.alt = '';
				im.draggable = false;
				im.decoding = 'async';
				im.loading = 'eager';
				im.setAttribute('aria-hidden', 'true');
				im.src = bp.src;
				im.onerror = () => im.remove();
				slot.appendChild(im);
			}
			imgEl.appendChild(slot);
		}
	}
	// Ô 0 cũng phải nằm đúng góc lưới + mang cỡ ô.
	setupTileSlot(slot0, cols, rows, 0);
	imgEl.classList.add('pe-tiled');
	imgEl.dataset.peTiled = '1';
}

/** Gán cỡ + vị trí cho một ô lát. `idx` = chỉ số ô trong lưới `cols × rows`. */
function setupTileSlot(slot, cols, rows, idx) {
	const c = idx % cols;
	const r = Math.floor(idx / cols);
	slot.style.setProperty('--pe-tile-c', String(c));
	slot.style.setProperty('--pe-tile-r', String(r));
}

/** GỠ chế độ lát: trả các `.pe-layer` về con TRỰC TIẾP của hộp và xoá mọi ô,
 *  để chế độ popout (không lát) dùng lại đúng các layer gốc. */
function untileEffect(imgEl) {
	const slot0 = imgEl.querySelector(':scope > .pe-tile-slot[data-pe-slot="0"]');
	if (slot0) {
		for (const el of Array.from(slot0.querySelectorAll(':scope > .pe-layer'))) {
			imgEl.appendChild(el);
		}
		slot0.remove();
	}
	for (const dup of imgEl.querySelectorAll('.pe-tile-slot')) dup.remove();
	imgEl.classList.remove('pe-tiled');
}


/** Dựng bảng "dims" cho từng layer từ metadata thật, dùng đúng công thức
 *  computeFrameVars của Discord. Trả về { innerWidth, overflowTop,
 *  overflowBottom, overflowHorizontal } hoặc null nếu không có gì. */
function computeFrameVars(layers) {
	const INNER_WIDTH = 1200;
	const OVERFLOW_TOP = 304;
	const OVERFLOW_BOTTOM = 212;
	const OVERFLOW_HORIZONTAL = 56;
	const list = (layers || []).filter((l) => l && l.dims && l.dims.width > 0);
	if (!list.length) return null;
	const maxTo = (arr, ref, off) => (arr.length ? Math.max(...arr.map((h) => Math.max(0, h - (ref - off)))) : 0);
	const horiz = list.map((l) => Math.round(Math.max(0, (l.dims.width - INNER_WIDTH) / 2)));
	const topStaples = list.filter((l) => l.type === 'staple' && l.anchor === 'top').map((l) => l.dims.height);
	const botStaples = list.filter((l) => l.type === 'staple' && l.anchor === 'bottom').map((l) => l.dims.height);
	return {
		innerWidth: INNER_WIDTH,
		overflowTop: maxTo(topStaples, 716, OVERFLOW_TOP),
		overflowBottom: maxTo(botStaples, 424, OVERFLOW_BOTTOM),
		overflowHorizontal: horiz.length ? Math.max(...horiz) : 0,
		_overflowHorizontalRef: OVERFLOW_HORIZONTAL,
	};
}

/** So sánh thứ tự layer như Discord (module 597404 `E`): FRONT trước BACK,
 *  cùng order thì theo index. */
function compareFrameLayer(a, b) {
	const rank = { front: 0, back: 1 };
	const d = (rank[a.order] ?? 0) - (rank[b.order] ?? 0);
	return d !== 0 ? d : (a.index || 0) - (b.index || 0);
}

/** Render profile frame — dựng ĐÚNG cụm layer Discord (staple/rail/border,
 *  neo top/bottom/center, thứ tự front/back) và ôm sát khung bo tròn avatar.
 *
 *  Nhận vào `frameData` = { sku, layers:[{id,type,anchor,order}] } trích từ
 *  `profile.collectibles.profile_frame`. Ảnh layer tải bằng route chuẩn
 *  `media/v1/collectibles-shop/{sku}/{layerId}/static`; đủ naturalWidth mới
 *  hiện (lazy→eager) để không bị "chỉ có chữ". */
function renderProfileFrame(frameData, frameEl, mode) {
	if (!frameEl) return;
	frameEl.innerHTML = '';
	frameEl.classList.remove('custom-profile-frame');
	for (const v of [
		'--custom-profile-frame-container-width',
		'--custom-profile-frame-overflow-top',
		'--custom-profile-frame-overflow-bottom',
		'--custom-profile-frame-overflow-horizontal',
	]) {
		frameEl.style.removeProperty(v);
	}
	if (!frameData || !frameData.sku || !Array.isArray(frameData.layers) || !frameData.layers.length) {
		frameEl.hidden = true;
		return;
	}
	const sku = frameData.sku;
	// Waves 49b — SHAPE THẬT (đo từ tài khoản thật):
	//   layer = { id, type:"rail"|"staple"|"border", order:"front"|"back",
	//             anchor:"top"|"bottom"|null, responsive:bool }
	// KHÔNG có `src`. URL tài sản là route chuẩn:
	//   ${CDN}/media/v1/collectibles-shop/{sku}/{layerId}/static
	// (đã verify 200 với layer thật). Vẫn nhận `src` nếu API bản khác trả kèm.
	const resolveSrc = (l) => {
		const s = l.src;
		if (s) {
			if (/^(https?:)?\/\//.test(s)) return s;
			if (s.startsWith('/')) return CDN + s;
			if (s.includes('/media/')) return CDN + '/' + s.replace(/^\/+/, '');
		}
		return collectibleAssetUrl(sku, 'static', l.id);
	};
	const layers = frameData.layers
		.map((l, i) => {
			const parsed = parseFrameLayerFilename(l.src || '') || {};
			return {
				id: l.id,
				type: l.type || parsed.type || 'staple',
				anchor: l.anchor || parsed.anchor || 'center',
				order: l.order || parsed.order || 'front',
				responsive: l.responsive ?? parsed.responsive ?? false,
				index: typeof l.index === 'number' ? l.index : (parsed.index ?? i),
				src: resolveSrc(l),
			};
		})
		.filter((l) => l.src)
		.sort(compareFrameLayer);
	if (!layers.length) {
		frameEl.hidden = true;
		return;
	}

	// Waves 49d — KHUNG PHẢI PHỦ CẢ THẺ HỒ SƠ (đúng Discord: `.profileFrameContainer`
	// có `inset:0; width:100%; height:100%` của THẺ, không phải ô avatar).
	// Trong HTML #dpFrame/#phFrame đang nằm trong avatarwrap → phải CHUYỂN nó lên
	// làm con trực tiếp của thẻ (ngay sau banner) để `100%` = bề rộng/cao thẻ.
	const card = frameEl.closest('.up-pop, .profile-hero, .hero-card') || null;
	if (card && frameEl.parentElement !== card) {
		const banner = card.querySelector(':scope > .up-pop-banner, :scope > .ph-banner');
		if (banner && banner.nextSibling) card.insertBefore(frameEl, banner.nextSibling);
		else card.appendChild(frameEl);
	}

	// Waves 49: cấu trúc y hệt Discord (module 940622, hàm `I`):
	//   <div class="custom-profile-frame">            ← nhận CSS vars
	//     <div class="pf-frame-inner">               ← vùng chứa layer
	//       <div class="pf-frame-layer …">…</div>    ← từng layer
	//     </div>
	//   </div>
	const inner = document.createElement('div');
	inner.className = 'pf-frame-inner';

	// Tạo 1 ảnh layer (eager bắt buộc — lazy trong vùng cuộn không bao giờ nạp).
	const makeImg = (layer, cls) => {
		const img = document.createElement('img');
		img.className = cls;
		img.alt = '';
		img.draggable = false;
		img.loading = 'eager';
		img.decoding = 'async';
		img.src = layer.src;
		return img;
	};

	let pending = 0;
	const checkDone = () => {
		pending -= 1;
		if (pending <= 0) doCompute();
	};

	for (const layer of layers) {
		const flags = [
			'pf-frame-layer',
			`pf-${layer.type}`,
			`pf-anchor-${layer.anchor}`,
			`pf-order-${layer.order}`,
			layer.responsive ? 'pf-responsive' : '',
		]
			.filter(Boolean)
			.join(' ');
		const el = document.createElement('div');
		el.className = flags;
		el.setAttribute('role', 'img');
		el.setAttribute('aria-hidden', 'true');
		layer._el = el;
		layer._img = null;

		if (layer.type === 'staple') {
			// ĐÚNG Discord: <div class="spacer"/><img src=…/>
			el.appendChild(document.createElement('div'));
			const img = makeImg(layer, 'pf-frame-staple-img');
			el.appendChild(img);
			layer._img = img;
			pending += 1;
			img.addEventListener('load', checkDone, { once: true });
			img.addEventListener('error', checkDone, { once: true });
		} else if (layer.type === 'rail') {
			// ĐÚNG Discord: 1 div, nền là ảnh, canh theo anchor (CSS lo).
			el.style.backgroundImage = `url("${layer.src}")`;
			// Ảnh đo tỉ lệ (không hiển thị) — cần cho computeFrameVars.
			const probe = makeImg(layer, 'pf-frame-probe');
			probe.style.cssText = 'position:absolute;width:100%;height:auto;visibility:hidden;pointer-events:none';
			el.appendChild(probe);
			layer._img = probe;
			pending += 1;
			probe.addEventListener('load', checkDone, { once: true });
			probe.addEventListener('error', checkDone, { once: true });
		} else {
			// border: khối lặp ảnh; số lần lặp tính theo container thật (đúng Discord).
			el.className += ' pf-border';
		}
		inner.appendChild(el);
	}

	/* Lặp ảnh cho border: Discord dùng
	   count = ceil(containerHeight / (containerWidth * natH/natW)) + 1.
	   `containerWidth/Height` = bề rộng/cao THẬT của `.pf-frame-inner`. */
	const fillBorderTiles = () => {
		const innerRect = inner.getBoundingClientRect();
		for (const layer of layers) {
			if (layer.type !== 'border') continue;
			const img = layer._img;
			const cw = innerRect.width;
			const ch = innerRect.height;
			let count = 5;
			if (img && img.naturalWidth > 0 && cw > 0 && ch > 0) {
				const tileH = cw * (img.naturalHeight / img.naturalWidth);
				count = tileH > 0 ? Math.ceil(ch / tileH) + 1 : 5;
			}
			layer._el.innerHTML = '';
			for (let i = 0; i < count; i += 1) layer._el.appendChild(makeImg(layer, 'pf-frame-tile'));
		}
	};

	// Đo ảnh gốc → tính overflow (đúng computeFrameVars) rồi gán các CSS var THẬT
	// mà CSS Discord cần: layer-scale + 3 scaled-overflow.
	const doCompute = () => {
		const withDims = [];
		for (const layer of layers) {
			const img = layer._img;
			if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
				withDims.push({
					type: layer.type,
					anchor: layer.anchor,
					dims: { width: img.naturalWidth, height: img.naturalHeight },
				});
				layer._el.style.setProperty('--cf-ar', `${img.naturalWidth} / ${img.naturalHeight}`);
			}
		}
		const vars = computeFrameVars(withDims) || {
			innerWidth: 1200,
			overflowTop: 0,
			overflowBottom: 0,
			overflowHorizontal: 56,
		};
		frameEl.style.setProperty('--custom-profile-frame-container-width', String(vars.innerWidth));
		frameEl.style.setProperty('--custom-profile-frame-overflow-top', String(vars.overflowTop));
		frameEl.style.setProperty('--custom-profile-frame-overflow-bottom', String(vars.overflowBottom));
		frameEl.style.setProperty('--custom-profile-frame-overflow-horizontal', String(vars.overflowHorizontal));

		const hostRect = frameEl.getBoundingClientRect();
		const hostW = hostRect.width || 0;
		const hostH = hostRect.height || 0;
		const innerW = vars.innerWidth || 1200;

		/* CỠ KHUNG — BÁM ĐÚNG MÔ HÌNH DISCORD: bề rộng tác phẩm = BỀ RỘNG THẺ.

		   Lịch sử (để không lặp lại sai lầm):
		   - Bản 49d: `width: calc(100% + soh*2)`, `layer-scale = hostW/1200`.
		     Trên thẻ hero NẰM NGANG 1102×272 ⇒ cánh staple render `1172×625`
		     ⇒ đáy tới y=466, tràn dưới 174px. Bro: "che cụ hết phía dưới".
		   - Bản 49e: tôi thu bề rộng tác phẩm theo CHIỀU CAO thẻ (`artW =
		     hostH*(PF_FIT-1)/(oT+oB) * 1200`) rồi bám chủ thể. Hết tràn dưới
		     NHƯNG khung co còn ~45% bề rộng thẻ và nằm lệch ở mép trái, phần
		     còn lại của thẻ trống trơn ⇒ bro: "lỗi trầm trọng ở khung chính giữa".

		   KẾT LUẬN ĐÚNG: KHÔNG được thu bề rộng. Discord luôn cho tác phẩm rộng
		   bằng thẻ — đó là điều làm nó "ôm" thẻ. Thứ duy nhất được phép điều
		   chỉnh là PHẦN TRÀN DỌC (`overflowTop/Bottom`), vì chúng được thiết kế
		   cho thẻ CHÂN DUNG ~300×(424..716) còn thẻ hero của mình NẰM NGANG.
		   Nên: giữ `artW = hostW`, và KẸP riêng phần tràn dọc theo chiều cao thẻ.
		   Nhờ vậy khung LUÔN phủ hết bề ngang thẻ (không còn mảng trống) mà vẫn
		   không trùm xuống dưới — đúng cả hai yêu cầu của bro. */
		const artW = hostW;
		const scale = innerW > 0 ? artW / innerW : 0;

		/* KẸP PHẦN TRÀN DỌC.
		   Tổng cao tác phẩm = hostH + (oT+oB)·s. Muốn nó không vượt quá
		   `hostH · PF_FIT`, phần tràn phải được co lại theo cùng tỉ lệ:
		     overflowFit = min(1, hostH·(PF_FIT−1) / ((oT+oB)·s))
		   Áp hệ số này LÊN sc-(overflow-*) chứ KHÔNG lên `scale` — nhờ vậy bề
		   ngang giữ nguyên 100% thẻ, chỉ cánh dọc ngắn lại.
		   PF_FIT = 1 ⇒ tổng cao đúng bằng thẻ; >1 ⇒ tràn đều hai phía. */
		const PF_FIT = (() => {
			const raw = getComputedStyle(frameEl).getPropertyValue('--pf-fit').trim();
			const n = parseFloat(raw);
			return Number.isFinite(n) && n > 0 ? n : 1.25;
		})();
		const overflowSum = (vars.overflowTop || 0) + (vars.overflowBottom || 0);
		let overflowFit = 1;
		if (overflowSum > 0 && scale > 0 && hostH > 0) {
			const natural = overflowSum * scale;
			/* `allowed` có thể = 0 (PF_FIT = 1 ⇒ khung cao ĐÚNG bằng thẻ).
			   Điều kiện cũ `allowed > 0` khiến trường hợp này rơi xuống nhánh
			   else và giữ overflowFit = 1 ⇒ cánh vẫn thò ra. Phải cho phép 0. */
			const allowed = Math.max(0, hostH * (PF_FIT - 1));
			if (natural > allowed) overflowFit = allowed / natural;
		}
		const scTop = (vars.overflowTop || 0) * scale * overflowFit;
		const scBottom = (vars.overflowBottom || 0) * scale * overflowFit;
		/* KẸP CẢ PHẦN TRÀN NGANG (Waves 50).
		   Bro: khung popout "vẫn chưa bo sát vào viền khung, thừa một khoảng
		   trống". Discord cho tác phẩm rộng hơn thẻ `soh` mỗi bên (để cánh
		   staple ôm trọn mép). Với popout ta KẸP về đúng bề rộng thẻ để khung
		   chạm sát viền. `--pf-fit-x: 1` ⇒ bỏ hẳn phần tràn ngang. */
		const PF_FIT_X = (() => {
			const raw = getComputedStyle(frameEl).getPropertyValue('--pf-fit-x').trim();
			const n = parseFloat(raw);
			return Number.isFinite(n) && n > 0 ? n : 999;
		})();
		let scHoriz = (vars.overflowHorizontal || 0) * scale;
		if (PF_FIT_X <= 1) scHoriz = 0;
		// Bề rộng thiết kế mà khung được vẽ cho (300, hoặc 304 khi có theme).
		const hasTheme = !!frameEl.closest('.has-theme-colors');
		const designW = hasTheme ? 304 : 300;

		frameEl.style.setProperty('--custom-profile-frame-layer-scale', String(scale));
		frameEl.style.setProperty('--custom-profile-frame-width', `${artW}px`);
		/* BẮT BUỘC CÓ `px`: trong CSS Discord layer-scale là ĐỘ DÀI, nên
		   `calc(var(--x) * -1)` mới hợp lệ. Ghi số trần → calc trả <number>
		   → `top`/`width` bị COI LÀ KHÔNG HỢP LỆ và BỊ BỎ (layer 0×0). */
		frameEl.style.setProperty('--custom-profile-frame-scaled-overflow-top', `${scTop}px`);
		frameEl.style.setProperty('--custom-profile-frame-scaled-overflow-bottom', `${scBottom}px`);
		frameEl.style.setProperty('--custom-profile-frame-scaled-overflow-horizontal', `${scHoriz}px`);
		// Giữ `designW` trong biến CSS để sau này chỉnh bằng CSS được.
		frameEl.style.setProperty('--custom-profile-frame-design-width', String(designW));
		frameEl.style.setProperty('--custom-user-profile-frame-z-index', '4');

		/* NEO NGANG — KHÔNG dịch. Tác phẩm đã rộng đúng bằng thẻ (xem `artW`
		   ở trên), nên nó tự phủ kín bề ngang. Bản 49e từng bám chủ thể vì
		   khung bị thu còn ~45% bề rộng thẻ — hệ quả là nửa phải thẻ trống
		   trơn, bro gọi đúng là "lỗi trầm trọng ở khung chính giữa".
		   Bỏ hẳn phép dịch ngang: rộng = thẻ thì canh mép là đúng. */
		frameEl.style.setProperty('--custom-profile-frame-shift-x', '0px');

		/* NEO DỌC — ĐỐI XỨNG hai mép: tâm bao tác phẩm trùng tâm thẻ.

		   Lý do phải đối xứng chứ không canh theo avatar/tên: `overflowTop`
		   (288) ≠ `overflowBottom` (145). Canh theo chủ thể hay theo mép trên
		   sẽ dồn hết phần tràn xuống dưới — đúng lỗi bro báo "che cụ hết
		   phía dưới" / "lệch xuống một đoạn". Canh tâm bao ⇒ mỗi mép tràn
		   bằng nhau và nhỏ nhất có thể. */
		const layerBox = (() => {
			/* PHẢI trừ `shift-y` ĐANG áp: rect đọc được đã bị dịch bởi lần
			   doCompute TRƯỚC. Không trừ thì phép kẹp tự tham chiếu chính nó
			   và mỗi vòng lặp lại đẩy khung đi thêm. */
			const cur = parseFloat(frameEl.style.getPropertyValue('--custom-profile-frame-shift-y')) || 0;
			let top = 0;
			let bottom = 0;
			for (const layer of layers) {
				const el = layer._el;
				if (!el) continue;
				if (getComputedStyle(el).display === 'none') continue;
				const r = el.getBoundingClientRect();
				if (!(r.height > 0)) continue;
				top = Math.min(top, r.top - hostRect.top - cur);
				bottom = Math.max(bottom, r.bottom - hostRect.top - cur);
			}
			return { top, bottom };
		})();
		/* Waves 54 — `--pf-shift: 0` ⇒ TẮT phép cân tâm (xem CSS).
		   Vì sao phải tắt: `overflowTop` (288) ≠ `overflowBottom` (145). Cân tâm
		   bao tác phẩm khiến cánh TO bị đẩy tụt XUỐNG trong khi cánh NHỎ bị đẩy
		   thò RA ⇒ thanh trên lọt vào trong thẻ 27px, thanh dưới sát đáy. Đo
		   bằng diff ảnh chụp mới thấy, `getComputedStyle` không lộ ra.
		   Tắt đi thì mỗi cánh neo đúng vào mép thẻ của nó (mô hình Discord). */
		const PF_SHIFT = (() => {
			const raw = getComputedStyle(frameEl).getPropertyValue('--pf-shift').trim();
			if (!raw) return true;
			const n = parseFloat(raw);
			return Number.isFinite(n) ? n !== 0 : true;
		})();
		if (PF_SHIFT && hostRect.height > 0 && layerBox.bottom > layerBox.top) {
			const artCenter = (layerBox.top + layerBox.bottom) / 2;
			const shift = hostRect.height / 2 - artCenter;
			frameEl.style.setProperty('--custom-profile-frame-shift-y', `${Math.round(shift * 100) / 100}px`);
		} else {
			frameEl.style.setProperty('--custom-profile-frame-shift-y', '0px');
		}
		/* Đo lại số ô ảnh lặp của layer `border` — phụ thuộc bề rộng inner vừa
		   chốt ở trên, nên phải chạy SAU khi biến đã gán. */
		fillBorderTiles();
	};
	// Đo lại sau khi panel chắc chắn hiện (popout bật khi bấm avatar; hero hiện
	// sau khi đăng nhập). Không có bước này thì bề rộng thẻ = 0 → layer co về 0.
	frameEl.__relayout = doCompute;
	scheduleFrameRelayout(frameEl, mode);

	frameEl.appendChild(inner);
	frameEl.classList.add('custom-profile-frame');
	frameEl.hidden = false;
	if (pending === 0) doCompute();
}

/** Đo lại vị trí/bề rộng khung frame SAU khi panel đã hiện, và thêm vài nhịp
 *  trễ để bắt kịp khi popout/hero vừa mở (rect lúc đó mới có số thật).
 *  `extra` (tuỳ chọn) = hàm đo bổ sung, dùng chung nhịp (effect cần đo lại
 *  bề rộng thẻ để tính --pe-s). */
function scheduleFrameRelayout(frameEl, mode, extra) {
	if (!frameEl && typeof extra !== 'function') return;
	const run = () => {
		try {
			if (frameEl && typeof frameEl.__relayout === 'function') frameEl.__relayout();
		} catch {
			/* ignore */
		}
		try {
			if (typeof extra === 'function') extra();
		} catch {
			/* ignore */
		}
	};
	if (typeof extra === 'function' && frameEl) frameEl.__relayoutExtra = extra;
	if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
	for (const ms of [60, 200, 600, 1200]) setTimeout(run, ms);
}

/** Đọc type/anchor/order từ TÊN FILE layer — đúng parser Discord (module 597404).
 *  Định dạng: `{index}_{type}[_{anchor}][_responsive].ext`
 *   - type ∈ staple | rail | border
 *   - anchor ∈ top | bottom | center (border bỏ anchor ⇒ center)
 *   - order lấy từ HẬU TỐ tên file (`_back`/`_front`) nếu có, mặc định front.
 *  Trả về null nếu không khớp (khi đó dùng metadata API). */
function parseFrameLayerFilename(name) {
	if (!name || typeof name !== 'string') return null;
	const base = name.replace(/\.\w+$/, '').split('/').pop();
	const parts = base.split('_');
	if (parts.length < 2) return null;
	const nums = parts.filter((p) => /^\d+$/.test(p));
	if (!nums.length) return null;
	const index = Number(nums[0]);
	const types = ['staple', 'rail', 'border'];
	const anchors = ['top', 'bottom', 'center'];
	const type = parts.find((p) => types.includes(p));
	if (!type) return null;
	const anchor = parts.find((p) => anchors.includes(p)) || 'center';
	const order = parts.includes('back') ? 'back' : 'front';
	const responsive = parts.includes('responsive');
	return { index, type, anchor, order, responsive };
}

/** Vẽ hàng huy hiệu Discord (badges) từ /users/@me — icon từ CDN badge-icons. */
/* Waves 19: badge icon có thể là URL đầy đủ (Discord chuyển Staff/Mod/Nitro sang
 * discord.com/assets/*.svg) hoặc là hash cũ trên badge-icons CDN → resolver 2 dạng. */
function badgeIconUrl(icon) {
	if (!icon) return '';
	return /^https?:\/\//i.test(icon) ? icon : `${CDN}/badge-icons/${icon}.png?size=64`;
}

function renderBadges(holder, badges, premiumType) {
	if (!holder) return;
	holder.innerHTML = '';
	const list = Array.isArray(badges) ? badges.filter((b) => b && (b.icon || b.fallbackIcon)) : [];
	// Nitro badge nếu premium_type > 0 mà list chưa có badge premium
	if (premiumType > 0 && !list.some((b) => b.id === 'premium')) {
		list.push({ id: 'premium', description: 'Nitro', icon: 'https://cdn.discordapp.com/assets/content/f61ddf640d11d9bdfaf9de265eb862edf28986b659e545f293b54adf229433af.svg' });
	}
	for (const b of list) {
		const img = document.createElement('img');
		img.className = 'user-badge';
		img.src = badgeIconUrl(b.icon);
		img.alt = b.description || '';
		img.title = b.description || '';
		// Waves 19: ảnh lỗi (hash cũ đã bị Discord chuyển path) → thử icon dự phòng đã verify,
		// hết cứu thì ẩn badge luôn thay vì để icon vỡ.
		img.addEventListener('error', () => {
			const next = b.fallbackIcon && img.src !== badgeIconUrl(b.fallbackIcon) ? badgeIconUrl(b.fallbackIcon) : '';
			if (next) {
				img.src = next;
			} else {
				img.remove();
				if (holder && !holder.children.length) holder.hidden = true;
			}
		});
		holder.appendChild(img);
	}
	holder.hidden = !holder.children.length;
}

/* Bảng màu OFFICIAL Discord nameplate palette → hex (dùng làm màu nền dự phòng + tint viền). */
const NAMEPLATE_PALETTES = {
	crimson: '#f23f43',
	berry: '#eb459e',
	sky: '#5c9ce6',
	teal: '#23a599',
	forest: '#2d8c4e',
	bubble_gum: '#ff9ecf',
	violet: '#9b6dff',
	cobalt: '#4a72f5',
	clover: '#4fc26b',
	lemon: '#ffd649',
	white: '#eef1f8',
};

/**
 * Gắn nameplate Discord thật vào khung tên:
 * - asset dạng "nameplates/nameplates/twilight/" → CDN /assets/collectibles/nameplates/nameplates/twilight/static.png
 *   (chọn webm nếu có; webm tự play muted loop như Discord client)
 * - palette → màu nền fallback + màu chữ tự tương phản nếu asset lỗi/đang load.
 */
/**
 * Waves 28b: TẠO <video> nameplate dùng CHUNG cho mọi vị trí (pill profile + khung chip).
 *
 * Gốc rễ "1 cái chạy 1 cái dead" (đã ĐO bằng tools/np-diag.js):
 *   video bên khung chip chạy (paused=false, readyState=4) NHƯNG khung `.up-frame`
 *   còn `opacity:0` ~2.6s vì transition chỉ khởi động sau khi append + class trễ nhịp.
 *   ⇒ Phải: (1) gắn class TRƯỚC khi append, (2) bỏ transition khi vừa dựng để hiện NGAY,
 *      (3) ép `play()` ngay khi có `loadeddata` chứ không chờ `canplay`.
 */
function makeNameplateVideo(np, holder) {
	const base = `${CDN}/assets/collectibles/${np.asset.replace(/\/+$/, '')}`;
	const media = document.createElement('video');
	media.className = 'np-media';
	media.autoplay = true;
	media.muted = true;
	media.defaultMuted = true;
	media.loop = true;
	media.playsInline = true;
	media.preload = 'auto';
	media.setAttribute('muted', '');
	media.setAttribute('playsinline', '');
	media.setAttribute('aria-hidden', 'true');
	media.src = `${base}/asset.webm`;

	// Fallback: webm lỗi (404/không hỗ trợ) → thử static.png; ảnh cũng lỗi → bỏ media.
	media.addEventListener('error', () => {
		media.remove();
		const img = document.createElement('img');
		img.className = 'np-media';
		img.alt = '';
		img.setAttribute('aria-hidden', 'true');
		img.src = `${base}/static.png`;
		img.addEventListener('error', () => img.remove());
		holder.prepend(img);
	});

	// Phát NGAY khi có đủ khung hình đầu (loadeddata sớm hơn canplay).
	const kick = () => {
		if (media.isConnected && media.paused) media.play().catch(() => {});
	};
	media.addEventListener('loadeddata', kick);
	media.addEventListener('canplay', kick);
	// Lưới an toàn: 2 nhịp thử lại nếu autoplay bị trì hoãn.
	setTimeout(kick, 300);
	setTimeout(kick, 1200);
	return media;
}

/**
 * Wave#134 — MÀU CHỮ NẰM TRÊN BẢNG TÊN, TÍNH TỪ NỀN THẬT (không hardcode trắng).
 *
 * ĐO BẰNG TÁCH PNG THẬT của Discord (tools phân tích .tmpqa/pngscan.js, asset
 * `nameplates/falling_stars`): ảnh bảng tên GẦN NHƯ TRONG SUỐT đúng chỗ chữ
 * ngồi — alpha vùng giữa 0.30, vùng trái-giữa (nơi tên bắt đầu) chỉ 0.038.
 * ⇒ NỀN THẬT DƯỚI CHỮ gần như chính mặt thẻ:
 *   • theme Tối  (thẻ #0f1219): nền L≈0.01 → trắng đạt 17.7:1  ✔
 *   • theme Sáng (thẻ #ffffff): nền L≈0.97 → trắng chỉ 1.03:1 ✘ = tên BIẾN MẤT
 * Đây chính là lỗi bro báo: "chuyển theme trắng là chữ nó vẫn trắng".
 *
 * Vì CDN Discord KHÔNG trả `Access-Control-Allow-Origin` (chỉ `Vary: Origin`)
 * nên không được sampling ảnh bằng canvas (sẽ tổ màu, kết luận sai). Ở đây lấy
 * nền THẬT của phần tử (`--card`, qua dnsSurface — nền thật từng chỗ: hero vs
 * popout vs chip) rồi chọn MỰC TRẮNG hay MỰC ĐẬM theo tương phản WCAG.
 * Không đụng gì tới pipeline font tùy biến Nitro (AQDisplayName/dnsFont/
 * applyDisplayNameStyle) — màu chữ Nitro vẫn do --theme-fg/.dns-active lo.
 */
const NP_INK_LIGHT_BG = '#0b0d14';
/**
 * Quầng chữ. LUẬT DÀI HẠN (Wave#54, bro chốt): *"KO CÓ AURA HOÀN QUANG"* — bản
 * cũ đắp quầng TRẮNG cho tên ở theme Sáng và bro gọi thẳng là "AURA TRẮNG RẤT
 * XẤU" ⇒ mực ĐẬM không được quầng gì cả (tương phản đã ≥19:1, không cần đỡ).
 * Chỉ mực TRẮNG (nền tối / dải Nitro tối) mới giữ quầng tối mảnh để tách khỏi
 * artwork bảng tên, đúng như cũ.
 */
function npShadowFor(hex) {
	return dnsRelLum(dnsHexToRgb(hex)) > 0.5 ? '0 1px 6px rgba(0, 0, 0, 0.6)' : 'none';
}
function npInkFor(holder) {
	if (!holder) return NP_INK_LIGHT_BG;
	const cs = getComputedStyle(holder);
	/* BƯỚC 1 — có dải Nitro? Khi user có theme_colors, CẢ MẶT THẺ được sơn bằng
	   dải đó (đo thật: chữ nằm ở y=142px trong khi `--theme-banner-h`=168px) ⇒
	   nền dưới tên KHÔNG phải `--card` mà là gradient Nitro. `--theme-fg` đã được
	   applyThemeColors chọn đúng theo ĐIỂM XẤU NHẤT của dải (Wave#53) → dùng nó,
	   không tự tính lại kẻo đè màu chuẩn của user. */
	const nitro = String(cs.getPropertyValue('--theme-fg') || '').trim();
	if (nitro) {
		holder.style.setProperty('--np-shadow', npShadowFor(nitro));
		holder.dataset.npInkRatio = 'nitro';
		return nitro;
	}
	/* BƯỚC 2 — không Nitro: nền thật là mặt thẻ (`--card` của đúng holder này). */
	const surface = dnsSurface(holder);
	const onWhite = dnsContrast([255, 255, 255], surface);
	const onInk = dnsContrast(dnsHexToRgb(NP_INK_LIGHT_BG), surface);
	const base = onWhite >= onInk ? '#ffffff' : NP_INK_LIGHT_BG;
	const fixed = dnsAdjustContrast(base, surface, 4.5);
	holder.style.setProperty('--np-shadow', npShadowFor(fixed.hex));
	// Ghi số ĐO ĐƯỢC để probe đọc được (cùng cách làm với data-dns-worst).
	holder.dataset.npInkRatio = fixed.ratio.toFixed(2);
	return fixed.hex;
}

/** Áp/màu lại mực cho MỌI holder đang có bảng tên (dùng khi đổi theme). */
function refreshNameplateInk() {
	document.querySelectorAll('.has-plate').forEach((h) => {
		h.style.setProperty('--np-fg', npInkFor(h));
	});
}

function applyNameplate(np, holder) {
	if (!holder) return;
	// Dọn lớp cũ
	holder.querySelectorAll('.np-media').forEach((n) => n.remove());
	if (!np || !np.asset) {
		holder.classList.remove('has-plate', 'has-media');
		holder.removeAttribute('data-np-real'); // Wave#96: không palette thật ⇒ không khung
		holder.style.removeProperty('--np');
		holder.style.removeProperty('--np-fg');
		holder.style.removeProperty('--np-shadow');
		delete holder.dataset.npInkRatio;
		/* Waves 55 — KHÔNG xoá `--np-ring`: khi user không có bảng tên, viền
		   phải rơi về màu Nitro (`--theme-b`) do CSS lo. Xoá đi sẽ thành
		   "không viền" dù user vẫn có theme_colors. */
		holder.style.removeProperty('--np-ring');
		return;
	}
	/* Waves 55 — BRO: *"mày đã cắt mất luôn khung bo tròn hiệu ứng ở tên và
	   logo rồi"*. Khôi phục viền, nhưng màu PHẢI đến từ dữ liệu Discord THẬT
	   của TỪNG user: `np.palette` (bảng tên thật) → `--np-ring`.
	   Bỏ hẳn fallback tím `#8b5cf6` (nguồn của "khung xanh xanh" Waves 54):
	   không có palette hợp lệ ⇒ KHÔNG set `--np-ring`, để CSS rơi về màu Nitro. */
	const hex = NAMEPLATE_PALETTES[np.palette];
	// Waves 28b: gắn class TRƯỚC khi chèn media → CSS định vị/kích thước sẵn sàng,
	// tránh 1 nhịp layout làm video hiện chậm hơn phần còn lại.
	holder.classList.add('has-plate');
	if (hex) {
		holder.style.setProperty('--np', hex);
		holder.style.setProperty('--np-ring', hex);
		/* Wave#96 (bro lệnh): CHỈ khi có palette THẬT mới cho phép vẽ viền/quầng
		   quanh profile. CSS gate bằng `[data-np-real='1']` ⇒ hết "khung bo tròn
		   xanh xanh" do fallback về --brand. */
		holder.setAttribute('data-np-real', '1');
	} else {
		holder.style.removeProperty('--np');
		holder.style.removeProperty('--np-ring');
		holder.removeAttribute('data-np-real');
	}
	/* Wave#134 — MÀU CHỮ CHO NHỮNG GÌ NẰM TRÊN BẢNG TÊN.
	   Tiền đề cũ ("artwork bảng tên LUÔN tối, nên chữ LUÔN trắng") là SAI:
	   tách PNG thật cho thấy ảnh bảng tên trong suốt gần hết đúng vùng chữ
	   (alpha 0.038 ở nơi tên bắt đầu) → theme Sáng chữ trắng trôi trên thẻ
	   trắng, tương phản đo được 1.03:1 = VÔ HÌNH. Nay suy ra từ nền THẬT. */
	holder.style.setProperty('--np-fg', npInkFor(holder));

	const media = makeNameplateVideo(np, holder);
	media.addEventListener('loadeddata', () => holder.classList.add('has-media'), { once: true });
	holder.prepend(media);
	holder.classList.add('has-media');
}

/**
 * Waves 21: hiệu ứng bảng tên phủ LÊN KHUNG BO TRÒN NGOÀI của chip tài khoản sidebar.
 * Khác applyNameplate (webm nằm BÊN TRONG pill tên) — ở đây webm là nền của cả khung,
 * viền + quầng sáng lấy màu palette nameplate.
 */
function applyChipNameplate(nameplate) {
	if (!ui.upFrame || !ui.upRow) return;
	ui.upFrame.innerHTML = '';
	ui.upRow.classList.remove('has-np', 'has-media');
	ui.upRow.removeAttribute('data-np-real'); // Wave#96
	ui.upRow.style.removeProperty('--np');
	if (!nameplate || !nameplate.asset) return;

	/* Wave#96 (bro lệnh): XOÁ fallback tím `'#8b5cf6'`. Đây chính là nguồn
	   "khung bo tròn xanh xanh" quanh profile mà bro báo CHƯA hết — khi user
	   không có palette hợp lệ, `|| '#8b5cf6'` vẫn vẽ viền + quầng TÍM/XANH.
	   Luật dài hạn: CẤM fallback màu brand cho khung nameplate.
	   ⇒ Không có palette THẬT thì KHÔNG set `--np`, KHÔNG gắn `data-np-real`
	   ⇒ CSS không vẽ viền/quầng. */
	const hex = NAMEPLATE_PALETTES[nameplate.palette];
	if (hex) {
		ui.upRow.style.setProperty('--np', hex);
		ui.upRow.setAttribute('data-np-real', '1');
	}

	// Waves 28b: GẮN CLASS + ép hiện NGAY, KHÔNG chờ transition 0.35s.
	// Đo cũ (tools/np-diag.js): khung chip đứng ở opacity:0 suốt ~2.6s trong khi
	// video đã chạy ⇒ nhìn như "hiệu ứng chết". Nay bật hiện tức thì.
	const frame = ui.upFrame;
	frame.style.transition = 'none';
	ui.upRow.classList.add('has-np');
	frame.style.opacity = '0.85';

	const media = makeNameplateVideo(nameplate, frame);
	frame.appendChild(media);
	ui.upRow.classList.add('has-media');

	// Nhả transition để các lần đổi sau vẫn mượt (double-rAF: qua 1 nhịp paint).
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			frame.style.transition = '';
		}),
	);
}

/** Token lưu trong user object (do authCheck trả về kèm token) hoặc ô token hiện tại. */
function tokenOf(user) {
	return (user && user.token) || ui.token.value.trim();
}

/**
 * Waves 28: VIỀN KHUNG PROFILE CHÍNH GIỮA — lấy màu theo BẢNG TÊN user đang dùng.
 *   - Có nameplate  → viền đúng màu palette (vd palette 'crimson' = #f23f43 → viền đỏ),
 *     kèm quầng sáng cùng màu. KHÔNG dùng rainbow.
 *   - Không có      → viền mặc định xanh thương hiệu (--np bị xoá).
 * Đây là điều bro yêu cầu: "user dùng hiệu ứng bảng tên gì thì cấp ngay khung màu đó".
 */
function applyProfileAura(nameplate) {
	if (!ui.heroProfile) return;
	if (!nameplate || !nameplate.asset) {
		ui.heroProfile.classList.remove('has-aura');
		ui.heroProfile.removeAttribute('data-np-real'); // Wave#96
		ui.heroProfile.style.removeProperty('--np');
		return;
	}
	/* Wave#96 (bro lệnh): XOÁ fallback tím lại một lần nữa — cùng gốc "khung
	   xanh xanh". Chỉ gắn aura khi có palette THẬT. */
	const hex = NAMEPLATE_PALETTES[nameplate.palette];
	if (!hex) {
		ui.heroProfile.classList.remove('has-aura');
		ui.heroProfile.removeAttribute('data-np-real');
		ui.heroProfile.style.removeProperty('--np');
		return;
	}
	ui.heroProfile.style.setProperty('--np', hex);
	ui.heroProfile.setAttribute('data-np-real', '1');
	ui.heroProfile.classList.add('has-aura');
}

function linearGradientFromHex(hex) {
	// Gradient dọc từ màu accent → đậm dần (giống Discord khi user không có banner)
	return `linear-gradient(180deg, ${hex} 0%, #1e1f22 130%)`;
}

/**
 * Waves 21: cập nhật card SỐ DƯ KHẢ DỤNG + hiệu ứng nảy số & lướt sáng 1 lượt.
 * source: 'wallet' = ví thật Discord (chính xác), 'claimed-list' = fallback cộng dồn lịch sử.
 */
function balanceHintText(pendingClaim, source) {
	const en = currentLang === 'en';
	if (pendingClaim > 0) {
		return en
			? `+${pendingClaim} Orbs completed, awaiting claim`
			: `+${pendingClaim} Orbs hoàn thành, chờ nhận thưởng`;
	}
	if (source === 'claimed-list') {
		return en
			? 'Total available Orbs from claimed quests on this account.'
			: 'Tổng Orb khả dụng từ mission đã claim trên account.';
	}
	return en
		? 'Available Orb balance in your Discord wallet.'
		: 'Số Orb khả dụng hiện tại trong ví Discord.';
}

function updateBalanceHint() {
	if (!ui.sideBalance || !ui.orbPending) return;
	const pending = Number(ui.sideBalance.dataset.pending) || 0;
	const source = ui.sideBalance.dataset.source || 'wallet';
	ui.orbPending.textContent = balanceHintText(pending, source);
}

function setSideBalance(balance, pendingClaim, source) {
	if (!ui.sideBalance || !ui.orbBalance) return;
	ui.orbBalance.textContent = String(balance);
	ui.sideBalance.dataset.pending = String(Number(pendingClaim) || 0);
	ui.orbPending.textContent = balanceHintText(Number(pendingClaim) || 0, source);
	ui.sideBalance.dataset.state = 'live';
	ui.sideBalance.dataset.source = source || 'wallet';

	// Nảy số + quét sáng đúng 1 lượt (restart animation bằng reflow)
	ui.sideBalance.classList.remove('is-pop', 'is-sweep');
	void ui.sideBalance.offsetWidth;
	ui.sideBalance.classList.add('is-pop', 'is-sweep');
	clearTimeout(setSideBalance._t);
	setSideBalance._t = setTimeout(() => {
		ui.sideBalance.classList.remove('is-pop', 'is-sweep');
	}, 1500);

	const srcLabel =
		currentLang === 'en'
			? source === 'claimed-list'
				? 'claimed list'
				: 'Discord wallet'
			: source === 'claimed-list'
				? 'claimed list'
				: 'ví Discord';
	appendLog(
		currentLang === 'en'
			? `[System] Available Orbs (${srcLabel}): ${balance}${
					pendingClaim > 0 ? ` · ${pendingClaim} Orbs awaiting claim` : ''
				}`
			: `[Hệ thống] Số Orb khả dụng (${srcLabel}): ${balance}${
					pendingClaim > 0 ? ` · Còn ${pendingClaim} Orbs chờ claim` : ''
				}`,
		'system',
	);
}

/**
 * Trích xuất SỐ ORB KHẢ DỤNG thật ngay lúc đăng nhập / mở app.
 * Waves 21: main process ưu tiên GET /users/@me/virtual-currency/balance (ví thật),
 * chỉ fallback về claimed list khi endpoint ví không khả dụng.
 */
async function fetchOrbBalance(token) {
	try {
		const res = await api.fetchOrbs(token);
		if (res && res.ok && typeof res.balance === 'number') {
			setSideBalance(res.balance, res.pendingClaim || 0, res.source);
		} else {
			ui.orbBalance.textContent = '—';
			ui.orbPending.textContent = res?.message || 'Không lấy được số dư Orb từ Discord.';
			ui.sideBalance.dataset.state = 'guest';
		}
	} catch {
		ui.orbBalance.textContent = '—';
		ui.orbPending.textContent = 'Lỗi kết nối khi trích xuất Orb.';
		ui.sideBalance.dataset.state = 'guest';
	}
}

/** Về trạng thái guest cho card số dư ORB. */
function resetSideBalance() {
	ui.sideBalance.dataset.state = 'guest';
	ui.sideBalance.classList.remove('is-pop', 'is-sweep');
	ui.orbBalance.textContent = '—';
	ui.orbPending.textContent = 'Đăng nhập để trích xuất Orb từ account';
}

function resetDiscordProfile() {
	currentUser = null; // Waves 17: dọn user cho modal logout
	ui.dprofile.dataset.state = 'guest';
	// Waves 44 — TRẠNG THÁI CHƯA ĐĂNG NHẬP = thẻ CỘNG ĐỒNG "ZoZ Community".
	// Bro yêu cầu: "nếu user không có ảnh bìa và avt thì để MẶC ĐỊNH" và
	// thay nội dung cũ bằng ZoZ Community. Đây là nội dung hiển thị khi KHÔNG
	// có token: không phải profile Discord mà là thương hiệu cộng đồng.
	ui.dpDisplay.textContent = ZOZ_NAME;
	ui.dpUsername.textContent = ZOZ_TAG;
	ui.upName.textContent = ZOZ_NAME;
	ui.upSub.textContent = 'Bấm để dán token tài khoản';
	/* Wave#89: guest ⇒ KHÔNG còn token của ai — xoá sạch để thẻ Cài đặt không
	   giữ lại hint token cũ (bẫy: hint "MTAxNTky…" còn sót sau logout). */
	ui.token.value = '';
	lastAuthedToken = '';
	ui.dpBanner.innerHTML = '';
	ui.dpBanner.style.background = '';
	ui.dpBanner.classList.add('default');
	// Waves 49: dọn profile effect + frame + theme colors (cả 2 panel).
	if (ui.dpEffect) { ui.dpEffect.hidden = true; ui.dpEffect.src = ''; ui.dpEffect.classList.remove('is-looping'); }
	if (ui.phEffect) { ui.phEffect.hidden = true; ui.phEffect.src = ''; ui.phEffect.classList.remove('is-looping'); }
	for (const fr of [ui.dpFrame, ui.phFrame]) {
		if (!fr) continue;
		fr.innerHTML = '';
		fr.hidden = true;
		fr.classList.remove('custom-profile-frame');
		fr.__relayout = null;
		for (const v of [
			'--custom-profile-frame-container-width',
			'--custom-profile-frame-overflow-top',
			'--custom-profile-frame-overflow-bottom',
			'--custom-profile-frame-overflow-horizontal',
			'--cf-card',
			'--cf-av-x',
			'--cf-av-y',
		]) {
			fr.style.removeProperty(v);
		}
	}
	for (const b of [ui.dpBanner, ui.phBanner]) {
		if (!b) continue;
		b.style.removeProperty('--theme-a');
		b.style.removeProperty('--theme-b');
		b.style.removeProperty('--theme-gradient');
		b.style.removeProperty('--theme-active');
		b.style.removeProperty('--theme-banner-h');
		delete b.dataset.bannerImage;
	}
	for (const c of [ui.upPop, ui.heroProfile]) {
		if (!c) continue;
		c.style.removeProperty('--theme-a');
		c.style.removeProperty('--theme-b');
		c.style.removeProperty('--theme-gradient');
		c.style.removeProperty('--theme-active');
		c.style.removeProperty('--theme-banner-h');
		if (c.__themeMeasure) delete c.__themeMeasure;
		delete c.dataset.bannerImage;
	}
	ui.dpAvatar.innerHTML = defaultAvatarSvg(30);
	ui.upAvatar.innerHTML = defaultAvatarSvg(20);
	ui.dpDecoration.innerHTML = '';
	ui.dpClanBadge.hidden = true;
	ui.dpClanTag.hidden = true;
	ui.dpBadgeText.textContent = 'Đăng nhập';
	ui.dpBadge.hidden = false;
	// Về trạng thái guest: đóng pop
	ui.upPop.hidden = true;
	ui.upRow.setAttribute('aria-expanded', 'false');
	// Hero giữa trang → HIỆN thẻ ZoZ Community (Waves 44: trước đây ẩn hẳn).
	ui.heroProfile.hidden = false;
	ui.heroProfile.dataset.state = 'guest';
	ui.phDisplay.textContent = ZOZ_NAME;
	// Waves 47: khách không có style → trả tên về mặc định của app.
	clearDisplayNameStyle();
	ui.phUsername.textContent = ZOZ_TAG;
	ui.phUserId.hidden = true;
	ui.phUserIdValue.textContent = '—';
	ui.phAvatar.innerHTML = '';
	/* Wave#87: guest = avatar Discord MẶC ĐỊNH (nền #5865f2 do CSS
	   `.profile-hero.is-discord-guest .ph-avatar`), KHÔNG phải logo ORB.
	   Class phải nằm trên THẺ HERO (#heroProfile) — đúng như selector CSS —
	   KHÔNG phải trên chính .ph-avatar (bẫy: đặt sai chỗ ⇒ CSS không khớp). */
	ui.heroProfile.classList.add('is-discord-guest');
	ui.phAvatar.classList.remove('is-discord-guest');
	ui.phAvatar.insertAdjacentHTML('beforeend', defaultAvatarSvg(34));
	ui.phAvatar.classList.remove('has-photo');
	if (ui.phLoginHint) ui.phLoginHint.hidden = false;
	/* Wave#87: khách TUYỆT ĐỐI không ORB — "mặt" thẻ là avatar Discord xanh.
	   KHÔNG gọi syncHeroOrb() ở nhánh guest: nó sẽ bật lại class `has-orb`
	   (ảnh orb-logo-big.png vẫn nằm trong DOM) ⇒ orb lộ ra sau nền xanh. */
	heroOrbOk = false;
	ui.phAvatar.classList.remove('has-orb');
	/* Wave#88/89: trả thẻ tài khoản trong Cài đặt về guest + ẩn 4 nút tài khoản. */
	refreshCfgCard(null);
	applyAccountButtons();
	ui.phDecoration.innerHTML = '';
	ui.phClanBadge.hidden = true;
	ui.phClanTag.hidden = true;
	ui.phBanner.innerHTML = '';
	ui.phBanner.style.background = '';
	ui.phBanner.classList.add('default');
	// Waves 49: dọn hero effect + frame
	if (ui.phEffect) { ui.phEffect.hidden = true; ui.phEffect.src = ''; }
	if (ui.phFrame) ui.phFrame.innerHTML = '';
	// Waves 18: dọn huy hiệu + hiệu ứng avatar
	ui.phBadges.innerHTML = '';
	ui.phBadges.hidden = true;
	ui.dpBadges.innerHTML = '';
	ui.dpBadges.hidden = true;
	ui.phAvatarwrap.classList.remove('has-effect');
	// Waves 28: bỏ viền màu bảng tên khi đăng xuất → về viền mặc định
	applyProfileAura(null);
	// Waves 21: dọn chip tài khoản sidebar (decoration + khung nameplate + tag)
	ui.upDeco.style.backgroundImage = '';
	ui.upAvatarwrap.classList.remove('has-deco');
	ui.upFrame.innerHTML = '';
	ui.upRow.classList.remove('has-np');
	ui.upRow.style.removeProperty('--np');
	ui.upClanTag.hidden = true;
	ui.upClanTag.textContent = '';
	// Số dư ORB → guest
	resetSideBalance();
	renderQueueChip();
	renderStats();
}

/** Đăng nhập: xác thực token rồi vẽ profile chuẩn Discord. */
async function loginChip() {
	const token = cleanTokenClient(ui.token.value);
	if (!token) {
		toast('Dán token Discord ở trang Cài đặt trước đã.', true);
		switchPage('settings');
		ui.token.focus();
		return;
	}
	ui.token.value = token;
	ui.dpBadgeText.textContent = 'Đang kiểm tra…';
	lastAuthedToken = ''; // bấm tay thì luôn kiểm tra lại
	await autoLoginFromToken();
}

// Bấm hàng user panel: guest → mở popup "Đổi tài khoản"; logged-in → mở/đóng khung profile
ui.upRow.addEventListener('click', (e) => {
	// Wave#88/#90: 2 nút trong hàng có handler riêng, không cho bubble vào đây
	if (e.target.closest('#btnLogout') || e.target.closest('#btnSwitchAccountRow')) return;
	if (ui.dprofile.dataset.state === 'guest') {
		openAccSw(); // Wave#88: guest bấm → popup Dán Token + Tài khoản
		return;
	}
	const willShow = ui.upPop.hidden;
	ui.upPop.hidden = !willShow;
	ui.upRow.setAttribute('aria-expanded', String(willShow));
	/* `hidden` ⇒ mọi rect = 0, nên `doCompute` chạy lúc panel còn ẩn đã chốt
	   `--custom-profile-frame-width: 0px` và KHÔNG tự chạy lại (đã đo được
	   popout: scale 0, inner 0×205 → khung tàng hình). Panel vừa hiện thì
	   phải đo lại ngay, và thêm vài nhịp vì layout còn đang ổn định. */
	if (willShow) {
		const fr = ui.dpFrame;
		const eff = ui.dpEffect;
		const kick = () => {
			try {
				if (fr && typeof fr.__relayout === 'function') fr.__relayout();
			} catch {
				/* ignore */
			}
			try {
				if (eff && typeof eff.__relayoutExtra === 'function') eff.__relayoutExtra();
			} catch {
				/* ignore */
			}
			/* Nền màu Nitro bắt đầu từ MÉP DƯỚI banner. Lúc panel còn `hidden`
			   banner đo ra 0 nên `--theme-banner-h` chưa được ghi ⇒ lớp ::after
			   phủ ngược lên ảnh bìa. Đo lại ngay khi panel đã hiện. */
			try {
				if (typeof ui.upPop.__themeMeasure === 'function') ui.upPop.__themeMeasure();
			} catch {
				/* ignore */
			}
		};
		if (typeof requestAnimationFrame === 'function') requestAnimationFrame(kick);
		for (const ms of [40, 140, 400, 900]) setTimeout(kick, ms);
	}
});

// Nút ĐĂNG XUẤT: KHÔNG thoát ngay — mở modal xác nhận (Waves 15, thẻ tài khoản Waves 17)
let currentUser = null; // user object từ auth:check (để modal logout hiển thị avatar + ID)

function openLogoutModal() {
	const name = ui.upName.textContent.trim();
	const en = currentLang === 'en';
	ui.logoutDesc.textContent =
		name && name !== (en ? 'Not signed in' : 'Chưa đăng nhập')
			? en
				? `The token for "${name}" will be removed from this device. You can sign in again anytime.`
				: `Token của "${name}" sẽ bị xoá khỏi thiết bị. Bạn có thể đăng nhập lại bất cứ lúc nào.`
			: t('logout.desc');
	// Waves 17: thẻ tài khoản (avatar + tên + ID thật từ Discord)
	if (currentUser && currentUser.id) {
		ui.logoutAccName.textContent = currentUser.displayName || currentUser.username || name;
		ui.logoutAccId.textContent = `ID: ${currentUser.id}`;
		ui.logoutAccAvatar.innerHTML = '';
		if (currentUser.avatar) {
			const ext = currentUser.avatar.startsWith('a_') ? 'gif' : 'png';
			const img = document.createElement('img');
			img.src = `${CDN}/avatars/${currentUser.id}/${currentUser.avatar}.${ext}?size=64`;
			img.alt = '';
			ui.logoutAccAvatar.appendChild(img);
		} else {
			ui.logoutAccAvatar.innerHTML =
				'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 12c2.7 0 4.8-2.2 4.8-4.9S14.7 2.3 12 2.3 7.2 4.4 7.2 7.1 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.9v2.4h19.2v-2.4c0-3.3-6.4-4.9-9.6-4.9z"/></svg>';
		}
		ui.logoutAccount.hidden = false;
	} else {
		ui.logoutAccount.hidden = true;
	}
	ui.logoutModal.hidden = false;
	ui.btnLogoutConfirm.focus();
}
function closeLogoutModal() {
	ui.logoutModal.hidden = true;
}
async function confirmLogout() {
	closeLogoutModal();
	try {
		await api.saveConfig({ token: '', remember: false, loopMode: ui.loopMode.checked, loopInterval: parseInt(ui.loopInterval.value, 10) || 30 });
	} catch { /* ignore */ }
	ui.token.value = '';
	lastAuthedToken = '';
	setTokenStatus('');
	resetDiscordProfile();
	toast(
		currentLang === 'en'
			? 'Signed out of the app. The token was removed from this device.'
			: 'Đã đăng xuất khỏi app. Token đã xoá khỏi thiết bị.',
	);
	appendLog(
		currentLang === 'en'
			? '[System] Signed out — token removed from local storage.'
			: '[Hệ thống] Đã đăng xuất — token xoá khỏi người dùng cục bộ.',
		'system',
	);
}
ui.btnLogout.addEventListener('click', (e) => {
	e.stopPropagation();
	openLogoutModal();
});
/* Wave#90 — nút ĐĂNG XUẤT thứ hai trong popout (icon đỏ) + nút ĐỔI TÀI KHOẢN. */
if (ui.btnLogout2) {
	ui.btnLogout2.addEventListener('click', (e) => {
		e.stopPropagation();
		ui.upPop.hidden = true;
		ui.upRow.setAttribute('aria-expanded', 'false');
		openLogoutModal();
	});
}
/* Wave#88 — "Đổi tài khoản" (trong popout + trong hàng panel + trong Cài đặt). */
for (const btn of [ui.btnSwitchAccount, ui.btnSwitchAccountRow, ui.btnAccCfgSwitch]) {
	if (!btn) continue;
	btn.addEventListener('click', (e) => {
		e.stopPropagation();
		ui.upPop.hidden = true;
		ui.upRow.setAttribute('aria-expanded', 'false');
		openAccSw();
	});
	if (btn.tagName === 'SPAN') {
		btn.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				e.stopPropagation();
				openAccSw();
			}
		});
	}
}
/* Wave#87 — nút "Đăng nhập tài khoản Discord" ở hero guest. */
if (ui.phLoginHint) {
	ui.phLoginHint.addEventListener('click', () => openAccSw());
}
/* Wave#88 — popup "Đổi tài khoản": dán / hiện-ẩn / hướng dẫn / copy script / thêm. */
if (ui.accSwitchModal) {
	ui.accSwitchModal.addEventListener('click', (e) => {
		if (e.target === ui.accSwitchModal) closeAccSw();
	});
}
if (ui.btnAccSwitchCancel) ui.btnAccSwitchCancel.addEventListener('click', closeAccSw);
if (ui.accswToken) {
	ui.accswToken.addEventListener('paste', () => {
		setTimeout(() => {
			const t = cleanTokenClient(ui.accswToken.value);
			if (t) ui.accswToken.value = t;
		}, 0);
	});
	ui.accswToken.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addAccountFromToken();
		}
	});
}
if (ui.accswPaste) {
	ui.accswPaste.addEventListener('click', async () => {
		try {
			const raw = await api.readClipboard();
			const t = cleanTokenClient(raw);
			if (t) {
				ui.accswToken.value = t;
				toast('Đã dán token từ clipboard.');
			} else {
				toast('Clipboard không có token Discord hợp lệ.', true);
			}
		} catch {
			toast('Không đọc được clipboard.', true);
		}
	});
}
if (ui.accswToggle) {
	ui.accswToggle.addEventListener('click', () => {
		const t = ui.accswToken;
		if (!t) return;
		const show = t.type === 'password';
		t.type = show ? 'text' : 'password';
		if (ui.accswToggleText) ui.accswToggleText.textContent = show ? 'Ẩn' : 'Hiện';
	});
}
if (ui.accswGuideToggle) ui.accswGuideToggle.addEventListener('click', () => {
	const open = ui.accswGuideToggle.getAttribute('aria-expanded') === 'true';
	ui.accswGuideToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
	if (ui.accswGuideBody) ui.accswGuideBody.hidden = open;
});
if (ui.accswCopyScript) {
	ui.accswCopyScript.addEventListener('click', async () => {
		try {
			await api.writeClipboard(CONSOLE_TOKEN_SCRIPT);
			toast('Đã copy lệnh lấy Token! Dán vào Console Discord (F12) rồi Enter.');
		} catch {
			toast('Không thể copy tự động, vui lòng thử lại.', true);
		}
	});
}
if (ui.accswAdd) ui.accswAdd.addEventListener('click', () => addAccountFromToken());
/* Wave#88 — modal xác nhận đổi tài khoản. */
if (ui.accConfirmSwitchModal) {
	ui.accConfirmSwitchModal.addEventListener('click', (e) => {
		if (e.target === ui.accConfirmSwitchModal) ui.accConfirmSwitchModal.hidden = true;
	});
}
if (ui.btnAccSwitchConfirmCancel) {
	ui.btnAccSwitchConfirmCancel.addEventListener('click', () => {
		ui.accConfirmSwitchModal.hidden = true;
	});
}
if (ui.btnAccSwitchConfirmOk) {
	ui.btnAccSwitchConfirmOk.addEventListener('click', confirmSwitchAccount);
}
document.addEventListener('keydown', (e) => {
	if (e.key !== 'Escape') return;
	if (ui.accConfirmSwitchModal && !ui.accConfirmSwitchModal.hidden) {
		ui.accConfirmSwitchModal.hidden = true;
		return;
	}
	if (ui.accSwitchModal && !ui.accSwitchModal.hidden) closeAccSw();
});
/* Wave#89 — token drawer trong Cài đặt (ẩn/hiện + copy). */
if (ui.btnTokenDrawer) {
	ui.btnTokenDrawer.addEventListener('click', () => {
		const open = ui.btnTokenDrawer.getAttribute('aria-expanded') === 'true';
		ui.btnTokenDrawer.setAttribute('aria-expanded', open ? 'false' : 'true');
		if (ui.accCfgTokenBody) ui.accCfgTokenBody.hidden = open;
	});
}
if (ui.btnTokenEye) {
	ui.btnTokenEye.addEventListener('click', () => {
		tokenVisibleCfg = !tokenVisibleCfg;
		if (ui.btnTokenEyeText) ui.btnTokenEyeText.textContent = tokenVisibleCfg ? 'Ẩn' : 'Hiện';
		syncCfgToken();
	});
}
if (ui.btnTokenCopy) {
	ui.btnTokenCopy.addEventListener('click', async () => {
		const t = (lastAuthedToken || ui.token.value || '').trim();
		if (!t) {
			toast('Chưa có token để copy.', true);
			return;
		}
		try {
			await api.writeClipboard(t);
			toast('Đã copy token Discord.');
		} catch {
			toast('Không copy được token.', true);
		}
	});
}
ui.btnLogout.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' || e.key === ' ') {
		e.preventDefault();
		e.stopPropagation();
		openLogoutModal();
	}
});
ui.btnLogoutCancel.addEventListener('click', closeLogoutModal);
ui.btnLogoutConfirm.addEventListener('click', confirmLogout);
// Bấm ra ngoài / Escape để huỷ
ui.logoutModal.addEventListener('click', (e) => {
	if (e.target === ui.logoutModal) closeLogoutModal();
});
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && !ui.logoutModal.hidden) closeLogoutModal();
});

// Nút trong khung profile: guest → mở popup "Đổi tài khoản"; logged-in → nhắc nơi đổi token
ui.dpBadge.addEventListener('click', () => {
	if (ui.dprofile.dataset.state === 'guest') openAccSw(); // Wave#88
	else {
		switchPage('settings');
		toast('Đổi token trong trang Cài đặt rồi đăng nhập lại.');
	}
});

/* ---------------- Page Navigation (Auto Quest / Cài đặt / Giới thiệu) ---------------- */

const pages = {
	quest: { btn: ui.navQuest, page: ui.pageQuest },
	settings: { btn: ui.navSettings, page: ui.pageSettings },
	stats: { btn: ui.navStats, page: ui.pageStats },
	about: { btn: ui.navAbout, page: ui.pageAbout },
};

function switchPage(name) {
	currentPageName = name;
	for (const [key, { btn, page }] of Object.entries(pages)) {
		if (!btn || !page) continue;
		const on = key === name;
		btn.classList.toggle('active', on);
		btn.setAttribute('aria-selected', String(on));
		page.hidden = !on;
		page.classList.toggle('active', on);
	}
	/* Wave#133: CSS "1080p không cuộn" chỉ ĐÚNG với trang nhiệm vụ (danh sách tự
	   cuộn bên trong). Áp cho Thống kê / Cài đặt / Giới thiệu là nội dung dài bị
	   CẮT KHÔNG KÉO XUỐNG ĐƯỢC → bro bấm Thống kê mà không vào được. Đánh dấu
	   trang hiện tại để CSS chỉ siết scroll ở trang nhiệm vụ. */
	document.body.dataset.page = name;
	// Đổi trang mà giữ nguyên vị trí cuộn cũ thì nội dung trông như "lệch xuống".
	const scroller = document.getElementById('appScroll');
	if (scroller) scroller.scrollTop = 0;
	// Thanh công cụ chọn chỉ thuộc trang Auto Quest
	if (name !== 'quest') {
		ui.selectTools.hidden = true;
	} else {
		renderQuests(); // vẽ lại để tính lại select-tools hiển thị
	}
	if (name === 'stats') renderStats();
	// Đóng drawer mobile sau khi chọn trang
	closeDrawer();
}

ui.navQuest.addEventListener('click', () => switchPage('quest'));
ui.navSettings.addEventListener('click', () => switchPage('settings'));
ui.navStats.addEventListener('click', () => switchPage('stats'));
ui.navAbout.addEventListener('click', () => switchPage('about'));

/* ---------------- Drawer mobile (sidebar trượt trên màn hẹp) ---------------- */

function openDrawer() {
	ui.sidebar.classList.add('open');
	ui.drawerOverlay.classList.add('show');
}
function closeDrawer() {
	ui.sidebar.classList.remove('open');
	ui.drawerOverlay.classList.remove('show');
}
ui.btnDrawer.addEventListener('click', openDrawer);
ui.drawerOverlay.addEventListener('click', closeDrawer);

/* ---------------- User Actions ---------------- */

function validate() {
	const token = ui.token.value.trim();
	if (!token) {
		toast('Vui lòng nhập Token Discord.', true);
		ui.token.focus();
		return false;
	}
	if (token.split('.').length < 3) {
		ui.token.classList.add('invalid');
		toast('Token không đúng định dạng (cần dạng xxx.yyy.zzz).', true);
		return false;
	}
	ui.token.classList.remove('invalid');
	return true;
}

/* ============================================================================
   WAVES 48 — DÁN TOKEN LÀ ĐĂNG NHẬP NGAY
   ----------------------------------------------------------------------------
   Bro: "chỉ cần user dán token vào ô là lập tức login acc luôn, đéo cần chờ đợi,
   cứ dán token hợp lệ cái đúng user trích các thứ ra là được, không hợp lệ báo ngay".

   Vì sao trước đây "ấn Lưu vẫn đéo hiện account":
     • Ô token chỉ có listener `input` để bật/tắt nút Quét — Ctrl+V KHÔNG kích hoạt
       đăng nhập (chỉ nút "Dán" mới gọi loginChip).
     • `saveTokenDirectly` chỉ lưu config rồi toast "Đã lưu token" — không hề xác
       thực, nên không có hồ sơ nào được vẽ.
   Nay: nghe `input` + `paste` + Enter, khớp định dạng là tự xác thực ngay.
   ============================================================================ */

/** Bóc rác quanh token ở phía renderer (main vẫn làm lại lần nữa cho chắc). */
function cleanTokenClient(raw) {
	let t = String(raw || '')
		.trim()
		.replace(/^["'`]+|["'`]+$/g, '')
		.trim();
	t = t.replace(/^(?:Bearer|Bot|Token)\s+/i, '').trim();
	const m = t.match(/[\w-]{20,}\.[\w-]{5,}\.[\w-]{20,}/);
	return m ? m[0] : t.replace(/\s+/g, '');
}

/** Đúng định dạng token Discord: ba phần ngăn bằng dấu chấm. */
function looksLikeToken(v) {
	return /^[\w-]{20,}\.[\w-]{5,}\.[\w-]{20,}$/.test(String(v || '').trim());
}

let tokenAuthTimer = null;
let tokenAuthSeq = 0;
let lastAuthedToken = '';

function setTokenStatus(msg, kind) {
	const el = ui.tokenStatus;
	if (!el) return;
	el.textContent = msg || '';
	el.hidden = !msg;
	el.dataset.kind = kind || '';
}

function signedInLabel(username, id) {
	return currentLang === 'en'
		? `Signed in: @${username} — ID ${id}`
		: `Đã đăng nhập: @${username} — ID ${id}`;
}

/**
 * Xác thực token hiện tại rồi vẽ hồ sơ. KHÔNG chờ người dùng bấm Lưu.
 * Có số thứ tự để lần gọi mới hơn luôn thắng (tránh kết quả cũ đè kết quả mới).
 */
async function autoLoginFromToken() {
	const raw = String(ui.token.value || '').trim();
	const token = cleanTokenClient(raw);
	if (!token) return;
	if (!looksLikeToken(token)) {
		ui.token.classList.add('invalid');
		setTokenStatus(
			dataSay(
				'Token chưa đúng định dạng (cần dạng xxx.yyy.zzz).',
				'Token format looks wrong (expected xxx.yyy.zzz).',
			),
			'err',
		);
		return;
	}
	if (token === lastAuthedToken) return;

	const seq = ++tokenAuthSeq;
	setTokenStatus(dataSay('Đang kiểm tra token…', 'Checking token…'), 'pending');
	try {
		const r = await api.authCheck(token);
		if (seq !== tokenAuthSeq) return; // đã có lần mới hơn → bỏ kết quả này
		if (r && r.ok && r.user) {
			lastAuthedToken = token;
			ui.token.classList.remove('invalid');
			// Lưu lại token SẠCH (không kèm dấu nháy / tiền tố) để lần sau tự đăng nhập.
			ui.token.value = token;
			try {
				await api.saveConfig(collectConfig());
			} catch {
				/* lưu lỗi không chặn đăng nhập */
			}
			renderDiscordProfile(r.user);
			setTokenStatus(signedInLabel(r.user.username, r.user.id), 'ok');
			appendLog(
				currentLang === 'en'
					? `[System] Signed in: @${r.user.username} (ID ${r.user.id})`
					: `[Hệ thống] Đăng nhập thành công: @${r.user.username} (ID ${r.user.id})`,
				'ok',
			);
			toast(
				currentLang === 'en'
					? `Signed in: @${r.user.username}`
					: `Đăng nhập thành công: @${r.user.username}`,
			);
			warmUpCaptcha();
			// renderDiscordProfile() đã gọi fetchOrbBalance → không gọi lần 2
			// (hai request sát nhau từng làm Discord trả 429 cho ví Orb).
		} else {
			lastAuthedToken = '';
			ui.token.classList.add('invalid');
			resetDiscordProfile();
			const msg = (r && r.message) || dataSay('Token không hợp lệ.', 'Invalid token.');
			setTokenStatus(msg, 'err');
			appendLog(
				currentLang === 'en' ? `[ERROR] Invalid token: ${msg}` : `[LỖI] Token không hợp lệ: ${msg}`,
				'stderr',
			);
			toast(msg, true);
		}
	} catch (e) {
		if (seq === tokenAuthSeq)
			setTokenStatus(
				dataSay('Không kết nối được Discord: ', 'Could not reach Discord: ') +
					(e?.message || dataSay('lỗi mạng', 'network error')),
				'err',
			);
	}
}

/** Hẹn giờ tự đăng nhập — 350ms để không bắn request theo từng ký tự. */
function scheduleAutoLogin(delay = 350) {
	clearTimeout(tokenAuthTimer);
	const v = cleanTokenClient(ui.token.value);
	if (!looksLikeToken(v)) return;
	if (v === lastAuthedToken) return;
	tokenAuthTimer = setTimeout(() => autoLoginFromToken(), delay);
}

ui.token.addEventListener('input', () => {
	ui.token.classList.remove('invalid');
	ui.btnScan.disabled = state !== 'idle' || !ui.token.value.trim();
	scheduleAutoLogin();
});

/* Ctrl+V dán thẳng vào ô: đọc lại giá trị sau khi trình duyệt chèn xong. */
ui.token.addEventListener('paste', () => {
	setTimeout(() => {
		const cleaned = cleanTokenClient(ui.token.value);
		if (cleaned && cleaned !== ui.token.value) ui.token.value = cleaned;
		scheduleAutoLogin(0);
	}, 0);
});

ui.token.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		e.preventDefault();
		clearTimeout(tokenAuthTimer);
		autoLoginFromToken();
	}
});

function collectConfig() {
	// Wave#88: LUÔN kèm danh sách tài khoản — config:save ghi lại cả 2 trường;
	// nếu bỏ qua (undefined) main sẽ lưu lại accounts = undefined ⇒ danh sách
	// tài khoản BỊ XÓA sạch mỗi lần saveConfig (đổi theme, lưu config…).
	return {
		token: ui.token.value.trim(),
		remember: true,
		loopMode: ui.loopMode.checked,
		loopInterval: parseInt(ui.loopInterval.value, 10) || 30,
		theme: currentTheme, // Waves 28
		lang: currentLang, // Wave#126
		liteMode: liteModeOn, // Wave#129
		autoLockMin, // Wave#127
		accounts: accountsCache,
		activeIdx: activeIdxCache,
	};
}

/* ═══════════════════════════════════════════════════════════════════
   WAVES #117–#131 — HÀNH VI
   Tất cả trạng thái phụ (lịch sử, hàng đợi, bản lưu nhiệm vụ) nằm trong
   localStorage theo TỪNG tài khoản; không bao giờ chứa token.
   ═══════════════════════════════════════════════════════════════════ */

const INVENTORY_KEY = 'autoquest.lastInventory.v1';
let inventoryStore = loadJsonLocal(INVENTORY_KEY, {});

function isOnline() {
	return navigator.onLine !== false;
}

/* ---------------- Wave#117: viên tiến trình nhận thưởng ---------------- */

let claimPillRefs = 0;
let claimPillHideTimer = null;

function pillStart(text) {
	claimPillRefs += 1;
	clearTimeout(claimPillHideTimer);
	if (!ui.claimPill) return;
	ui.claimPill.hidden = false;
	if (text) pillSetText(text);
}

function pillSetText(text) {
	if (ui.claimPillText) ui.claimPillText.textContent = text || '';
}

function pillSetCount(done, total) {
	if (!ui.claimPillCount) return;
	if (total > 0) {
		ui.claimPillCount.hidden = false;
		ui.claimPillCount.textContent = `${done}/${total}`;
	} else {
		ui.claimPillCount.hidden = true;
		ui.claimPillCount.textContent = '0';
	}
}

function pillEnd() {
	claimPillRefs = Math.max(0, claimPillRefs - 1);
	if (claimPillRefs > 0) return;
	clearTimeout(claimPillHideTimer);
	claimPillHideTimer = setTimeout(() => {
		if (claimPillRefs !== 0) return;
		if (ui.claimPill) ui.claimPill.hidden = true;
		pillSetCount(0, 0);
	}, 420);
}

/* ---------------- Wave#118: hàng đợi nhận thưởng chờ xác minh ---------------- */

function queueRows() {
	const scope = accountScope();
	const rows = queueStore[scope];
	return Array.isArray(rows) ? rows : [];
}

function queuePersist() {
	queueStore[accountScope()] = queueRows();
	saveJsonLocal(QUEUE_KEY, queueStore);
	renderQueueChip();
}

function queueAddMany(ids) {
	const scope = accountScope();
	if (!Array.isArray(queueStore[scope])) queueStore[scope] = [];
	const at = Date.now();
	for (const rawId of ids) {
		const id = String(rawId || '');
		if (!id) continue;
		const q = quests.get(id);
		if (!q || q.status !== 'claimable' || q.flag === 'gone') continue;
		if (queueStore[scope].some((row) => row.id === id)) continue;
		queueStore[scope].push({ id, name: q.name || '', orbs: Number(q.orbs) || 0, at });
	}
	queuePersist();
}

function queueRemove(id) {
	const scope = accountScope();
	const rows = queueStore[scope];
	if (!Array.isArray(rows)) return;
	const next = rows.filter((row) => row.id !== String(id || ''));
	if (next.length === rows.length) return;
	queueStore[scope] = next;
	queuePersist();
}

/** Bỏ mục quá hạn / không còn nhận được. Mục chưa có trong danh sách hiện tại
 *  được GIỮ LẠI (có thể chỉ là chưa quét), tránh xoá oan sau khi reload. */
function queuePrune() {
	const scope = accountScope();
	const rows = queueStore[scope];
	if (!Array.isArray(rows) || !rows.length) return;
	const now = Date.now();
	const next = rows.filter((row) => {
		if (!row || !row.id) return false;
		if (now - (Number(row.at) || 0) > QUEUE_TTL_MS) return false;
		const q = quests.get(row.id);
		if (q && (q.status !== 'claimable' || q.flag === 'gone' || q.claimBusy)) return false;
		return true;
	});
	if (next.length !== rows.length) {
		queueStore[scope] = next;
		queuePersist();
	}
}

function renderQueueChip() {
	if (!ui.claimQueueChip) return;
	const n = queueRows().length;
	ui.claimQueueChip.hidden = n === 0;
	if (n > 0) {
		ui.claimQueueChip.textContent =
			currentLang === 'en' ? `Pending verification: ${n}` : `Chờ xác minh: ${n}`;
	}
}

/** Wave#118: tiếp tục nhận các nhiệm vụ còn trong hàng đợi sau khi đã xử lý
 *  xong captcha / rate-limit. Không bao giờ tự vượt xác minh. */
async function continueClaimQueue() {
	if (bulkClaimBusy || state !== 'idle') return;
	if (!isOnline()) return;
	if (!tokenOf(currentUser)) return;
	if (ui.captchaModal && !ui.captchaModal.hidden) return;
	const ids = queueRows()
		.map((row) => row.id)
		.filter((id) => {
			const q = quests.get(id);
			return q && q.status === 'claimable' && !q.claimBusy && q.flag !== 'gone';
		});
	if (!ids.length) {
		if (queueRows().length) {
			toast('Các nhiệm vụ đang chờ không còn trong danh sách — quét lại để cập nhật.', true);
		}
		return;
	}
	await claimSequence(ids, 'queue');
}

if (ui.claimQueueChip) {
	ui.claimQueueChip.addEventListener('click', () => {
		if (bulkClaimBusy) return;
		continueClaimQueue();
	});
}

/* ---------------- Wave#121: lịch sử nhận thưởng + thống kê ---------------- */

function statsEntries() {
	const scope = accountScope();
	const rows = historyStore[scope];
	return Array.isArray(rows) ? rows : [];
}

function dayKey(ts) {
	const d = new Date(Number(ts) || Date.now());
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${m}-${day}`;
}

function recordClaim(name, orbs, id) {
	const scope = accountScope();
	if (!Array.isArray(historyStore[scope])) historyStore[scope] = [];
	const list = historyStore[scope];
	const last = list[list.length - 1];
	// Cùng một quest có thể đi qua cả sự kiện engine lẫn hàm claim UI —
	// chống ghi trùng trong 5 giây.
	if (last && id && last.id === String(id) && Date.now() - last.at < 5000) return;
	list.push({
		at: Date.now(),
		name: String(name || 'Nhiệm vụ').slice(0, 120),
		orbs: Number(orbs) || 0,
		id: id ? String(id) : '',
	});
	if (list.length > HISTORY_MAX) list.splice(0, list.length - HISTORY_MAX);
	saveJsonLocal(HISTORY_KEY, historyStore);
	if (ui.pageStats && !ui.pageStats.hidden) renderStats();
}

function shortWeekday(ts) {
	const namesVi = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
	const namesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return (currentLang === 'en' ? namesEn : namesVi)[new Date(ts).getDay()];
}

function renderStats() {
	if (!ui.pageStats) return;
	const entries = statsEntries();
	const display = currentUser && currentUser.username ? `@${currentUser.username}` : currentLang === 'en' ? 'Guest' : 'Khách';
	if (ui.statsScope) ui.statsScope.textContent = display;

	let totalOrbs = 0;
	const dayMap = new Map();
	for (const row of entries) {
		const orbs = Number(row.orbs) || 0;
		totalOrbs += orbs;
		const key = dayKey(row.at);
		const day = dayMap.get(key) || { orbs: 0, claims: 0 };
		day.orbs += orbs;
		day.claims += 1;
		dayMap.set(key, day);
	}

	const dayKeys = Array.from(dayMap.keys()).sort().reverse();
	let streak = 0;
	if (dayKeys.length) {
		const today = dayKey(Date.now());
		const yesterday = dayKey(Date.now() - 86400000);
		if (dayKeys[0] === today || dayKeys[0] === yesterday) {
			const cursor = new Date(`${dayKeys[0]}T00:00:00`);
			while (dayMap.has(dayKey(cursor.getTime()))) {
				streak += 1;
				cursor.setDate(cursor.getDate() - 1);
			}
		}
	}

	const last7 = [];
	for (let i = 6; i >= 0; i -= 1) {
		const ts = Date.now() - i * 86400000;
		const key = dayKey(ts);
		last7.push({ key, ts, day: dayMap.get(key) || { orbs: 0, claims: 0 } });
	}
	const total7 = last7.reduce((sum, item) => sum + item.day.orbs, 0);

	if (ui.statsOrbs) ui.statsOrbs.textContent = String(totalOrbs);
	if (ui.statsClaims) ui.statsClaims.textContent = String(entries.length);
	if (ui.statsStreak) ui.statsStreak.textContent = String(streak);
	if (ui.statsAvg) ui.statsAvg.textContent = String(Math.round((total7 / 7) * 10) / 10);

	if (ui.statsBars) {
		ui.statsBars.innerHTML = '';
		ui.statsBars.setAttribute(
			'aria-label',
			currentLang === 'en' ? 'Orbs claimed chart by day' : 'Biểu đồ Orb theo ngày',
		);
		const max = Math.max(1, ...last7.map((item) => item.day.orbs));
		const todayKey = dayKey(Date.now());
		for (const item of last7) {
			const bar = document.createElement('div');
			bar.className =
				'stats-bar' +
				(item.day.orbs === 0 ? ' is-empty' : '') +
				(item.key === todayKey ? ' is-today' : '');
			bar.title = `${item.key}: ${item.day.orbs} Orbs · ${item.day.claims} ${currentLang === 'en' ? 'quests' : 'nhiệm vụ'}`;
			const value = document.createElement('span');
			value.className = 'stats-bar-value';
			value.textContent = item.day.orbs > 0 ? String(item.day.orbs) : '';
			const fill = document.createElement('span');
			fill.className = 'stats-bar-fill';
			fill.style.height = `${Math.max(4, Math.round((item.day.orbs / max) * 84))}px`;
			const label = document.createElement('span');
			label.className = 'stats-bar-label';
			label.textContent = shortWeekday(item.ts);
			bar.append(value, fill, label);
			ui.statsBars.appendChild(bar);
		}
	}

	if (ui.statsRecent) {
		ui.statsRecent.innerHTML = '';
		const recent = entries.slice(-10).reverse();
		for (const row of recent) {
			const li = document.createElement('li');
			li.className = 'stats-recent-item';
			const name = document.createElement('span');
			name.className = 'stats-recent-name';
			name.textContent = row.name || (currentLang === 'en' ? 'Quest' : 'Nhiệm vụ');
			const time = document.createElement('span');
			time.className = 'stats-recent-time';
			time.textContent = new Date(row.at).toLocaleString(currentLang === 'en' ? 'en-US' : 'vi-VN', {
				day: '2-digit',
				month: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			});
			const orbs = document.createElement('span');
			orbs.className = 'stats-recent-orbs mono';
			orbs.textContent = `+${Number(row.orbs) || 0}`;
			li.append(name, time, orbs);
			ui.statsRecent.appendChild(li);
		}
	}
	if (ui.statsEmpty) ui.statsEmpty.hidden = entries.length > 0;
}

function exportStatsCsv() {
	const entries = statsEntries();
	if (!entries.length) {
		toast(currentLang === 'en' ? 'No history to export yet.' : 'Chưa có lịch sử để xuất.', true);
		return;
	}
	const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
	const lines = [currentLang === 'en' ? 'Time,Quest,Orbs' : 'Thời gian,Nhiệm vụ,Orbs'];
	const locale = currentLang === 'en' ? 'en-US' : 'vi-VN';
	for (const row of entries) {
		lines.push(
			[esc(new Date(row.at).toLocaleString(locale)), esc(row.name || ''), String(Number(row.orbs) || 0)].join(','),
		);
	}
	const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `autoquest-history-${dayKey(Date.now())}.csv`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1500);
	toast(
		currentLang === 'en'
			? `Exported ${entries.length} history rows.`
			: `Đã xuất ${entries.length} dòng lịch sử.`,
	);
}

function clearStatsHistory() {
	const rows = statsEntries();
	if (!rows.length) {
		toast(currentLang === 'en' ? 'History is empty.' : 'Lịch sử đang trống.');
		return;
	}
	const ask =
		currentLang === 'en'
			? 'Clear all claim history for this account?'
			: 'Xoá toàn bộ lịch sử nhận thưởng của tài khoản này?';
	if (!window.confirm(ask)) return;
	historyStore[accountScope()] = [];
	saveJsonLocal(HISTORY_KEY, historyStore);
	renderStats();
	toast(currentLang === 'en' ? 'Claim history cleared.' : 'Đã xoá lịch sử nhận thưởng.');
}

/* ---------------- Wave#126: ngôn ngữ giao diện (VI/EN) ---------------- */

function langSet(selector, key, root) {
	const node = (root || document).querySelector(selector);
	if (node) node.textContent = t(key);
}

function langSetTab(btn, key) {
	if (!btn) return;
	for (const child of btn.childNodes) {
		if (child.nodeType === 3 && child.nodeValue.trim()) {
			child.nodeValue = ` ${t(key)} `;
			return;
		}
	}
	btn.insertBefore(document.createTextNode(` ${t(key)} `), btn.firstChild);
}

/** Đổi nhãn chữ của nút có icon SVG, giữ nguyên icon. */
function btnText(btn, key) {
	if (!btn) return;
	const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
	let last = null;
	let node = walker.nextNode();
	while (node) {
		if (node.nodeValue.trim()) last = node;
		node = walker.nextNode();
	}
	if (last) last.nodeValue = ` ${t(key)} `;
	else btn.appendChild(document.createTextNode(` ${t(key)} `));
}

function applyLang(lang, persist = true) {
	currentLang = lang === 'en' ? 'en' : 'vi';
	document.documentElement.lang = currentLang;
	if (ui.langSelect) ui.langSelect.value = currentLang;

	langSet('#navQuest .nav-text', 'nav.quest');
	langSet('#navSettings .nav-text', 'nav.settings');
	langSet('#navStats .nav-text', 'nav.stats');
	langSet('#navAbout .nav-text', 'nav.about');
	langSetTab(ui.tabActive, 'tab.active');
	langSetTab(ui.tabNew, 'tab.new');
	langSetTab(ui.tabDone, 'tab.done');
	if (ui.btnScan) langSet('#btnScan .side-act-text', 'act.scan');
	if (ui.btnStart) langSet('#btnStart .side-act-text', 'act.start');
	if (ui.btnStop) langSet('#btnStop .side-act-text', 'act.stop');
	if (ui.questSearch) ui.questSearch.placeholder = t('act.search');
	if (ui.selectAllLabel) ui.selectAllLabel.textContent = currentLang === 'en' ? 'Select all' : 'Chọn tất cả';
	if (ui.selectedLabel) ui.selectedLabel.textContent = currentLang === 'en' ? 'Selected:' : 'Đã chọn:';
	if (ui.btnClaimAll) ui.btnClaimAll.textContent = t('act.claimAll');
	if (ui.questFilter) {
		const opts = [['all', 'filter.all'], ['orbs', 'filter.orbs'], ['manual', 'filter.manual'], ['urgent', 'filter.urgent']];
		for (const [value, key] of opts) {
			const opt = ui.questFilter.querySelector(`option[value="${value}"]`);
			if (opt) opt.textContent = t(key);
		}
	}
	langSet('#consoleCard .log-title', 'log.title');
	if (ui.btnClearLog) ui.btnClearLog.textContent = t('log.clear');
	langSet('#sideBalance .sb-label', 'balance.label');

	langSet('#pageStats .card-title', 'stats.title');
	const statLabels = document.querySelectorAll('#pageStats .stats-tile-label');
	const statKeys = ['stats.orbs', 'stats.claims', 'stats.streak', 'stats.avg'];
	statLabels.forEach((node, i) => {
		if (statKeys[i]) node.textContent = t(statKeys[i]);
	});
	const statSubs = document.querySelectorAll('#pageStats .stats-subtitle');
	statSubs.forEach((node, i) => {
		node.textContent = i === 0 ? t('stats.week') : t('stats.recent');
	});
	if (ui.btnStatsCsv) ui.btnStatsCsv.textContent = t('stats.csv');
	if (ui.btnStatsClear) ui.btnStatsClear.textContent = t('stats.clear');
	if (ui.statsEmpty) ui.statsEmpty.textContent = t('stats.empty');

	const settingsTitles = document.querySelectorAll('#pageSettings .config-card .card-title');
	const settingKeys = ['settings.account', 'settings.appearance', 'settings.optimize', 'settings.version'];
	settingsTitles.forEach((node, i) => {
		if (settingKeys[i]) node.textContent = t(settingKeys[i]);
	});
	langSet('#themeDark span', 'settings.themeDark');
	langSet('#themeLight span', 'settings.themeLight');
	if (ui.langSelect) {
		const label = ui.langSelect.closest('.setting-row')?.querySelector('.setting-label');
		if (label) label.textContent = t('settings.lang');
	}
	if (ui.liteMode) {
		const label = ui.liteMode.closest('.loop-check')?.querySelector('.loop-title');
		if (label) label.textContent = t('settings.lite');
	}
	if (ui.autoLockSelect) {
		const label = ui.autoLockSelect.closest('.setting-row')?.querySelector('.setting-label');
		if (label) label.textContent = t('settings.lock');
		const lockOpts = ui.autoLockSelect.querySelectorAll('option');
		if (lockOpts[0]) lockOpts[0].textContent = t('settings.lockOff');
		if (lockOpts[1]) lockOpts[1].textContent = currentLang === 'en' ? 'After 5 minutes' : 'Sau 5 phút';
		if (lockOpts[2]) lockOpts[2].textContent = currentLang === 'en' ? 'After 15 minutes' : 'Sau 15 phút';
		if (lockOpts[3]) lockOpts[3].textContent = currentLang === 'en' ? 'After 30 minutes' : 'Sau 30 phút';
	}
	const optLabels = document.querySelectorAll('#langSelect option');
	if (optLabels[0]) optLabels[0].textContent = 'Tiếng Việt';
	if (optLabels[1]) optLabels[1].textContent = 'English';

	btnText(ui.btnAccCfgSwitch, 'settings.switchAcc');
	langSet('#btnTokenDrawer strong', 'settings.token');
	langSet('#pageSettings .loop-check .loop-title', 'settings.loop');
	langSet('#pageSettings .loop-box > .hint', 'settings.loopHint');
	langSet('#loopIntervalRow > span', 'settings.interval');
	const loopOpts = ui.loopInterval ? ui.loopInterval.querySelectorAll('option') : [];
	const loopKeys = ['settings.interval15', 'settings.interval30', 'settings.interval45', 'settings.interval60'];
	loopOpts.forEach((opt, i) => {
		if (loopKeys[i]) opt.textContent = t(loopKeys[i]);
	});
	btnText(ui.btnOpenFolder, 'settings.folder');
	btnText(ui.btnDataPanel, 'settings.data');
	const versionLabels = document.querySelectorAll('#pageSettings .version-label');
	if (versionLabels[0]) versionLabels[0].textContent = t('settings.versionApp');
	if (versionLabels[1]) versionLabels[1].textContent = t('settings.versionSw');
	if (ui.liteMode) {
		const liteCard = ui.liteMode.closest('.config-card');
		const liteHint = liteCard && liteCard.querySelector('.hint');
		if (liteHint) liteHint.textContent = t('settings.liteHint');
	}
	if (ui.autoLockSelect) {
		const lockHint = ui.autoLockSelect.closest('.setting-row')?.nextElementSibling;
		if (lockHint && lockHint.classList.contains('hint')) lockHint.textContent = t('settings.lockHint');
	}

	if (ui.updateBar) ui.updateBarText.textContent = t('update.available');
	if (ui.btnUpdateReload) ui.btnUpdateReload.textContent = t('update.now');
	if (ui.btnUpdateDismiss) ui.btnUpdateDismiss.textContent = t('update.later');
	langSet('#lockTitle', 'lock.title');
	langSet('#lockVeil .lock-desc', 'lock.desc');
	if (ui.btnUnlock) ui.btnUnlock.textContent = t('lock.unlock');
	langSet('#logoutTitle', 'logout.title');
	if (ui.logoutDesc) ui.logoutDesc.textContent = t('logout.desc');
	langSet('#btnLogoutCancel', 'logout.cancel');
	langSet('#btnLogoutConfirm', 'logout.confirm');
	const dataHeads = document.querySelectorAll('#dataModal .accsw-h4');
	const dataKeys = ['data.backup', 'data.diag', 'data.reqlog', 'data.integrity', 'data.danger'];
	dataHeads.forEach((node, i) => {
		if (dataKeys[i]) node.textContent = t(dataKeys[i]);
	});
	langSet('#btnRunDiagnostics', 'data.runDiag');
	if (ui.btnExportCfg) ui.btnExportCfg.textContent = t('data.exportCfg');
	if (ui.btnReqLogCopy) ui.btnReqLogCopy.textContent = t('data.copyReq');
	if (ui.btnReqLogClear) ui.btnReqLogClear.textContent = t('data.clearReq');
	if (ui.btnRunIntegrity) ui.btnRunIntegrity.textContent = t('data.checkIntegrity');
	if (ui.btnWipeData) ui.btnWipeData.textContent = t('data.wipe');
	if (ui.btnDataClose) ui.btnDataClose.textContent = t('data.close');
	langSet('#dataTitle', 'data.title');
	if (ui.btnCheckUpdate) ui.btnCheckUpdate.textContent = t('common.checkUpdate');

	const dataIntro = document.getElementById('dataIntro');
	if (dataIntro) dataIntro.textContent = t('data.intro');
	const dataPassLabel = document.getElementById('dataPassLabel');
	if (dataPassLabel) dataPassLabel.textContent = t('data.passLabel');
	if (ui.dataPassword) ui.dataPassword.placeholder = t('data.passPlaceholder');
	if (ui.btnDataToggleText && ui.dataPassword) {
		ui.btnDataToggleText.textContent = t(ui.dataPassword.type === 'password' ? 'data.show' : 'data.hide');
	}
	if (ui.btnDataToggle) ui.btnDataToggle.title = t('data.toggleTitle');
	if (ui.btnBackupExport) ui.btnBackupExport.textContent = t('data.backupExport');
	if (ui.btnBackupImport) ui.btnBackupImport.textContent = t('data.backupImport');
	if (ui.btnBackupApply) ui.btnBackupApply.textContent = t('data.applyRestore');
	if (ui.btnBackupCancel) ui.btnBackupCancel.textContent = t('data.cancel');
	const backupHint = document.getElementById('dataBackupHint');
	if (backupHint) backupHint.textContent = t('data.backupHint');
	const reqLogHint = document.getElementById('reqLogHint');
	if (reqLogHint) reqLogHint.textContent = t('data.reqlogHint');
	const dangerHint = document.getElementById('dataDangerHint');
	if (dangerHint) dangerHint.textContent = t('data.dangerHint');
	if (ui.tamperWarn) ui.tamperWarn.textContent = t('data.integrityWarn');

	langSet('#pageAbout .card-title', 'about.title');
	const aboutBanner = document.getElementById('aboutBanner');
	if (aboutBanner) aboutBanner.innerHTML = t('about.banner');
	const aboutList = document.getElementById('aboutList');
	if (aboutList) aboutList.innerHTML = t('about.list');
	const aboutHint = document.getElementById('aboutHint');
	if (aboutHint) aboutHint.textContent = t('about.hint');

	renderQuests();
	renderQueueChip();
	renderStats();
	updateBalanceHint();

	if (persist) {
		api.saveConfig(collectConfig()).catch(() => {});
	}
}

/* ---------------- Wave#129: chế độ nhẹ cho máy yếu ---------------- */

function applyLiteMode(on, persist = true) {
	liteModeOn = on === true;
	document.body.classList.toggle('lite', liteModeOn);
	if (ui.liteMode) ui.liteMode.checked = liteModeOn;
	if (persist) api.saveConfig(collectConfig()).catch(() => {});
}

/* ---------------- Wave#127: tự khoá màn hình khi rảnh ---------------- */

let lockTimer = null;
let locked = false;

function lockScreen() {
	if (locked || !ui.lockVeil) return;
	if (ui.captchaModal && !ui.captchaModal.hidden) {
		resetLockTimer();
		return;
	}
	locked = true;
	ui.lockVeil.hidden = false;
	document.body.classList.add('is-locked');
	if (ui.btnUnlock) ui.btnUnlock.focus();
}

function unlockScreen() {
	if (!locked) return;
	locked = false;
	if (ui.lockVeil) ui.lockVeil.hidden = true;
	document.body.classList.remove('is-locked');
	resetLockTimer();
}

function resetLockTimer() {
	clearTimeout(lockTimer);
	if (!autoLockMin || locked) return;
	lockTimer = setTimeout(lockScreen, autoLockMin * 60000);
}

function setAutoLock(minutes, persist = true) {
	const n = Number(minutes);
	autoLockMin = [0, 5, 15, 30].includes(n) ? n : 0;
	if (ui.autoLockSelect) ui.autoLockSelect.value = String(autoLockMin);
	resetLockTimer();
	if (persist) api.saveConfig(collectConfig()).catch(() => {});
}

if (ui.langSelect) {
	ui.langSelect.addEventListener('change', () => {
		applyLang(ui.langSelect.value === 'en' ? 'en' : 'vi');
		toast(currentLang === 'en' ? 'Interface language: English' : 'Ngôn ngữ giao diện: Tiếng Việt');
	});
}
if (ui.liteMode) {
	ui.liteMode.addEventListener('change', () => {
		applyLiteMode(ui.liteMode.checked);
		toast(
			liteModeOn
				? currentLang === 'en'
					? 'Lite mode on — effects reduced.'
					: 'Đã bật chế độ nhẹ — giảm hiệu ứng.'
				: currentLang === 'en'
					? 'Lite mode off.'
					: 'Đã tắt chế độ nhẹ.',
		);
	});
}
if (ui.autoLockSelect) {
	ui.autoLockSelect.addEventListener('change', () => {
		setAutoLock(ui.autoLockSelect.value);
	});
}
if (ui.btnUnlock) ui.btnUnlock.addEventListener('click', unlockScreen);
for (const evName of ['pointerdown', 'keydown', 'mousemove', 'touchstart', 'wheel']) {
	window.addEventListener(
		evName,
		() => {
			if (!locked) resetLockTimer();
		},
		{ passive: true },
	);
}
document.addEventListener('visibilitychange', () => {
	if (!document.hidden && !locked) resetLockTimer();
});

/* ---------------- Wave#128: ngoại tuyến + bản lưu nhiệm vụ ---------------- */

function updateNetBadge() {
	if (!ui.netBadge) return;
	ui.netBadge.hidden = isOnline();
	ui.netBadge.textContent = currentLang === 'en' ? 'Offline' : 'Ngoại tuyến';
}

function stripInventoryItem(item) {
	return {
		id: item.id,
		name: item.name,
		task: item.task,
		taskLabel: item.taskLabel,
		application: item.application,
		secondsNeeded: item.secondsNeeded,
		secondsDone: item.secondsDone,
		orbs: item.orbs || 0,
		automatable: item.automatable !== false,
		status: item.status,
		hero: item.hero || '',
		gameTile: item.gameTile || '',
		logotype: item.logotype || '',
		appId: item.appId || '',
		appIcon: item.appIcon || '',
		publisher: item.publisher || '',
		gameTitle: item.gameTitle || '',
		expiresAt: item.expiresAt || null,
		colorPrimary: item.colorPrimary || '',
		colorSecondary: item.colorSecondary || '',
		rewardKind: item.rewardKind || 'orbs',
		rewardTitle: item.rewardTitle || '',
		rewardAsset: item.rewardAsset || '',
		rewardIsVideo: item.rewardIsVideo === true,
		rewardName: item.rewardName || '',
		claimedAt: item.claimedAt || null,
		platform: typeof item.platform === 'number' ? item.platform : 0,
	};
}

function saveInventoryCache(list) {
	try {
		inventoryStore[accountScope()] = {
			at: Date.now(),
			quests: list.slice(0, 300).map(stripInventoryItem),
		};
		localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventoryStore));
	} catch {
		/* localStorage đầy — bản lưu ngoại tuyến là tuỳ chọn */
	}
}

function hydrateOfflineInventory() {
	if (isOnline()) return;
	const rec = inventoryStore[accountScope()];
	if (!rec || !Array.isArray(rec.quests) || !rec.quests.length) return;
	const when = new Date(rec.at || Date.now()).toLocaleString(currentLang === 'en' ? 'en-US' : 'vi-VN');
	appendLog(
		currentLang === 'en'
			? `[Offline] Showing cached quests from ${when}. Scan again when online.`
			: `[Ngoại tuyến] Đang hiển thị bản lưu nhiệm vụ lúc ${when} — quét lại khi có mạng.`,
		'warn',
	);
	handleEvent({ type: 'quest:inventory', data: { quests: rec.quests } });
	setState('idle');
}

window.addEventListener('online', () => {
	updateNetBadge();
	toast(currentLang === 'en' ? 'Back online.' : 'Đã có mạng trở lại.');
	appendLog(
		currentLang === 'en' ? '[System] Network restored.' : '[Hệ thống] Đã có mạng trở lại.',
		'system',
	);
});
window.addEventListener('offline', () => {
	updateNetBadge();
	toast(
		currentLang === 'en'
			? 'Offline — claims need a network connection.'
			: 'Đã mất mạng — cần kết nối để nhận thưởng.',
		true,
	);
	appendLog(
		currentLang === 'en'
			? '[Warning] Offline. Scanning/claiming is paused until the network returns.'
			: '[Cảnh báo] Đã mất mạng. Quét/nhận thưởng tạm dừng đến khi có kết nối.',
		'warn',
	);
});

/* ---------------- Wave#119: nhật ký yêu cầu (đã che token) ---------------- */

async function refreshRequestLog() {
	if (!ui.reqLogOut) return;
	try {
		const text = await api.requestLogText();
		ui.reqLogOut.textContent = text || dataSay('Chưa có yêu cầu nào.', 'No requests in this session yet.');
		ui.reqLogOut.hidden = false;
	} catch {
		ui.reqLogOut.textContent = dataSay(
			'Không đọc được nhật ký yêu cầu.',
			'Could not read the request log.',
		);
		ui.reqLogOut.hidden = false;
	}
}

if (ui.btnReqLogCopy) {
	ui.btnReqLogCopy.addEventListener('click', async () => {
		try {
			const text = (await api.requestLogText()) || '';
			if (!text) {
				setDataStatus(dataSay('Nhật ký yêu cầu đang trống.', 'The request log is empty.'), true);
				return;
			}
			await api.writeClipboard(text);
			setDataStatus(
				dataSay(
					'Đã sao chép nhật ký yêu cầu (token đã được che).',
					'Request log copied (tokens are masked).',
				),
			);
		} catch (err) {
			setDataStatus(dataSay('Không sao chép được: ', 'Copy failed: ') + (err?.message || err), true);
		}
	});
}
if (ui.btnReqLogClear) {
	ui.btnReqLogClear.addEventListener('click', () => {
		try {
			api.clearRequestLog();
		} catch {
			/* ignore */
		}
		refreshRequestLog();
		setDataStatus(dataSay('Đã xoá nhật ký yêu cầu.', 'Request log cleared.'));
	});
}

/* ---------------- Wave#127: kiểm tra toàn vẹn ứng dụng ---------------- */

function bytesToB64(bytes) {
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

async function checkIntegrity() {
	if (!ui.btnRunIntegrity || !ui.integrityOut) return;
	const en = currentLang === 'en';
	ui.btnRunIntegrity.disabled = true;
	ui.integrityOut.hidden = false;
	ui.integrityOut.textContent = dataSay('Đang kiểm tra…', 'Checking…');
	if (ui.tamperWarn) ui.tamperWarn.hidden = true;
	try {
		const manifestRes = await fetch(new URL('integrity.json', document.baseURI).href, { cache: 'no-store' });
		if (!manifestRes.ok) {
			ui.integrityOut.textContent = dataSay(
				'Chưa có integrity.json (bản dev). Hãy chạy "npm run integrity" trước khi phát hành.',
				'No integrity.json yet (dev build). Run "npm run integrity" before shipping.',
			);
			return;
		}
		const manifest = await manifestRes.json();
		const files = manifest && manifest.files && typeof manifest.files === 'object' ? manifest.files : {};
		const entries = Object.entries(files);
		if (!entries.length) {
			ui.integrityOut.textContent = dataSay(
				'integrity.json không có tệp nào để kiểm tra.',
				'integrity.json lists no files to verify.',
			);
			return;
		}
		const lines = [`AUTO-QUEST ${APP_VERSION} · ${new Date().toLocaleString(en ? 'en-US' : 'vi-VN')}`, ''];
		const bad = [];
		const missing = [];
		for (const [file, expected] of entries) {
			let response;
			try {
				response = await fetch(new URL(file, document.baseURI).href, { cache: 'no-store' });
			} catch {
				missing.push(file);
				continue;
			}
			if (!response.ok) {
				missing.push(file);
				continue;
			}
			const buffer = await response.arrayBuffer();
			const digest = await crypto.subtle.digest('SHA-256', buffer);
			const actual = bytesToB64(new Uint8Array(digest));
			if (actual !== expected) bad.push(file);
		}
		const okCount = entries.length - bad.length - missing.length;
		lines.push(`${en ? 'Files matching' : 'Tệp khớp'}      : ${okCount}/${entries.length}`);
		if (bad.length) lines.push(`${en ? 'Modified files' : 'Tệp bị sửa'}    : ${bad.join(', ')}`);
		if (missing.length) lines.push(`${en ? 'Missing files' : 'Tệp thiếu'}     : ${missing.join(', ')}`);
		lines.push('');
		lines.push(
			bad.length === 0 && missing.length === 0
				? en
					? 'Result: intact — every file matches the released build.'
					: 'Kết quả: toàn vẹn — mọi tệp khớp bản phát hành.'
				: en
					? 'Result: MISMATCH — continue only if you edited the source yourself.'
					: 'Kết quả: KHÔNG khớp — chỉ tiếp tục nếu bạn tự sửa mã nguồn.',
		);
		ui.integrityOut.textContent = lines.join('\n');
		if (ui.tamperWarn) ui.tamperWarn.hidden = bad.length === 0 && missing.length === 0;
	} catch (err) {
		ui.integrityOut.textContent = dataSay('Không kiểm tra được: ', 'Could not verify: ') + (err?.message || err);
	} finally {
		ui.btnRunIntegrity.disabled = false;
	}
}
if (ui.btnRunIntegrity) ui.btnRunIntegrity.addEventListener('click', checkIntegrity);

/* ---------------- Wave#127: xoá toàn bộ dữ liệu (bấm 2 lần) ---------------- */

let wipeArmedUntil = 0;
if (ui.btnWipeData) {
	ui.btnWipeData.addEventListener('click', async () => {
		const now = Date.now();
		if (now > wipeArmedUntil) {
			wipeArmedUntil = now + 5000;
			const original = ui.btnWipeData.textContent;
			ui.btnWipeData.textContent = dataSay('Bấm lần nữa để xoá hẳn', 'Click again to erase');
			setDataStatus(
				dataSay(
					'Cảnh báo: thao tác này xoá token, tài khoản, lịch sử và cài đặt. Bấm lần nữa trong 5 giây.',
					'Warning: this erases tokens, accounts, history and settings. Click again within 5 seconds.',
				),
				true,
			);
			setTimeout(() => {
				if (Date.now() > wipeArmedUntil) ui.btnWipeData.textContent = t('data.wipe');
			}, 5200);
			return;
		}
		wipeArmedUntil = 0;
		ui.btnWipeData.disabled = true;
		setDataStatus(dataSay('Đang xoá toàn bộ dữ liệu cục bộ…', 'Erasing all local data…'));
		try {
			await api.wipeAllData();
			setDataStatus(dataSay('Đã xoá toàn bộ dữ liệu. Đang tải lại…', 'All data erased. Reloading…'));
			setTimeout(() => location.reload(), 900);
		} catch (err) {
			setDataStatus(dataSay('Xoá thất bại: ', 'Erase failed: ') + (err?.message || err), true);
			ui.btnWipeData.disabled = false;
		}
	});
}

/* ---------------- Wave#123: PWA update + phiên bản ---------------- */

let swRegistration = null;
let swReloading = false;
let updateDismissed = false;

function setUpdateStatus(text) {
	if (!ui.updateStatus) return;
	ui.updateStatus.textContent = text || '';
}

function showUpdateBar() {
	if (!ui.updateBar) return;
	updateDismissed = false;
	ui.updateBarText.textContent = t('update.available');
	ui.updateBar.hidden = false;
}

function hideUpdateBar() {
	if (ui.updateBar) ui.updateBar.hidden = true;
}

async function showSwVersion() {
	if (!ui.swVersion) return;
	let version = '';
	try {
		const keys = await caches.keys();
		const shells = keys.filter((key) => key.startsWith('autoquest-shell-')).sort();
		if (shells.length) version = shells[shells.length - 1].replace('autoquest-shell-', '');
	} catch {
		/* ignore */
	}
	ui.swVersion.textContent = version || '—';
	if (navigator.serviceWorker && navigator.serviceWorker.controller) {
		try {
			navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
		} catch {
			/* ignore */
		}
	}
}

async function setupServiceWorker() {
	if (ui.appVersion) ui.appVersion.textContent = APP_VERSION;
	if (
		!('serviceWorker' in navigator) ||
		!(location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost')
	) {
		setUpdateStatus('Service Worker chỉ hoạt động trên HTTPS hoặc localhost.');
		return;
	}
	navigator.serviceWorker.addEventListener('message', (event) => {
		const data = event.data || {};
		if (data.type === 'SW_VERSION' && ui.swVersion) ui.swVersion.textContent = data.version || '—';
	});
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		if (!swReloading) return;
		location.reload();
	});
	try {
		swRegistration = await navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href, {
			updateViaCache: 'none',
		});
		if (swRegistration.waiting && navigator.serviceWorker.controller) showUpdateBar();
		swRegistration.addEventListener('updatefound', () => {
			const worker = swRegistration && swRegistration.installing;
			if (!worker) return;
			worker.addEventListener('statechange', () => {
				if (worker.state === 'installed' && navigator.serviceWorker.controller && !updateDismissed) {
					showUpdateBar();
					setUpdateStatus('Đã có bản cập nhật mới — bấm "Cập nhật" để nạp.');
				}
			});
		});
		setUpdateStatus('');
		showSwVersion();
	} catch {
		setUpdateStatus('Không đăng ký được Service Worker (không ảnh hưởng chức năng chính).');
	}
}

if (ui.btnUpdateReload) {
	ui.btnUpdateReload.addEventListener('click', () => {
		const waiting = swRegistration && swRegistration.waiting;
		if (!waiting) {
			location.reload();
			return;
		}
		swReloading = true;
		setUpdateStatus('Đang áp dụng bản cập nhật…');
		try {
			waiting.postMessage({ type: 'SKIP_WAITING' });
		} catch {
			/* ignore */
		}
		setTimeout(() => {
			if (swReloading) location.reload();
		}, 2600);
	});
}
if (ui.btnUpdateDismiss) {
	ui.btnUpdateDismiss.addEventListener('click', () => {
		updateDismissed = true;
		hideUpdateBar();
		setUpdateStatus('Sẽ cập nhật ở lần mở tiếp theo.');
	});
}
if (ui.btnCheckUpdate) {
	ui.btnCheckUpdate.addEventListener('click', async () => {
		ui.btnCheckUpdate.disabled = true;
		setUpdateStatus('Đang kiểm tra bản mới…');
		try {
			if (!swRegistration) {
				setUpdateStatus('Service Worker chưa sẵn sàng trên trang này.');
				return;
			}
			await swRegistration.update();
			await new Promise((resolve) => setTimeout(resolve, 700));
			if (swRegistration.waiting && navigator.serviceWorker.controller) {
				showUpdateBar();
				setUpdateStatus('Đã có bản cập nhật mới.');
			} else {
				setUpdateStatus('Bạn đang dùng phiên bản mới nhất.');
			}
			showSwVersion();
		} catch (err) {
			setUpdateStatus('Không kiểm tra được: ' + (err?.message || err));
		} finally {
			ui.btnCheckUpdate.disabled = false;
		}
	});
}

/* ---------------- Wave#131: nhịp tim + tự phục hồi engine ---------------- */

let heartbeatTimer = null;
let healTimer = null;
let healAttempts = 0;
let lastAutoHeal = 0;
let userStopped = false;

function stopHeartbeat() {
	clearInterval(heartbeatTimer);
	heartbeatTimer = null;
}

function startHeartbeat() {
	stopHeartbeat();
	if (typeof api.pingEngine !== 'function') return;
	heartbeatTimer = setInterval(async () => {
		if (!['running', 'starting', 'scanning'].includes(state)) {
			stopHeartbeat();
			return;
		}
		let result = null;
		try {
			result = await api.pingEngine(2200);
		} catch {
			result = { ok: false };
		}
		if (result && result.ok) {
			if (ui.btnRecover) ui.btnRecover.hidden = true;
			return;
		}
		if (!['running', 'starting', 'scanning'].includes(state)) return;
		if (ui.btnRecover) ui.btnRecover.hidden = false;
		appendLog(
			currentLang === 'en'
				? '[Warning] Engine missed its heartbeat. Press "Recover" or stop and start again.'
				: '[Cảnh báo] Engine không phản hồi nhịp tim. Bấm "Khôi phục" hoặc dừng rồi chạy lại.',
			'warn',
		);
		scheduleSelfHeal();
	}, 15000);
}

function scheduleSelfHeal() {
	if (healTimer || userStopped || !isOnline()) return;
	if (Date.now() - lastAutoHeal < 120000) return;
	if (healAttempts >= 3) return;
	healTimer = setTimeout(async () => {
		healTimer = null;
		if (userStopped || !isOnline()) return;
		if (!['running', 'starting', 'scanning', 'error'].includes(state)) return;
		const cfg = typeof api.getLastRunConfig === 'function' ? api.getLastRunConfig() : null;
		if (!cfg) return;
		healAttempts += 1;
		lastAutoHeal = Date.now();
		appendLog(
			currentLang === 'en'
				? '[System] Engine is unresponsive — auto-recovering the run…'
				: '[Hệ thống] Engine không phản hồi — đang tự khôi phục phiên chạy…',
			'system',
		);
		await recoverRun(true);
	}, 2500);
}

async function recoverRun(auto = false) {
	if (bulkClaimBusy) return;
	if (!isOnline()) {
		toast(
			currentLang === 'en'
				? 'A network connection is required to recover the run.'
				: 'Cần mạng để khôi phục tiến trình.',
			true,
		);
		return;
	}
	const cfg = typeof api.getLastRunConfig === 'function' ? api.getLastRunConfig() : null;
	if (!cfg) {
		toast(
			currentLang === 'en'
				? 'There is no previous run to recover.'
				: 'Không có phiên chạy trước để khôi phục.',
			true,
		);
		return;
	}
	if (ui.btnRecover) ui.btnRecover.hidden = true;
	if (!auto) {
		appendLog(
			currentLang === 'en'
				? '[System] Recovering the run from the latest configuration…'
				: '[Hệ thống] Đang khôi phục phiên chạy từ cấu hình gần nhất…',
			'system',
		);
	}
	userStopped = false;
	startHeartbeat();
	await startRun(cfg.mode || 'run', {
		selectedQuests: Array.isArray(cfg.selectedQuests) ? cfg.selectedQuests : [],
		loopMode: cfg.loopMode,
		loopInterval: cfg.loopInterval,
	});
}
if (ui.btnRecover) ui.btnRecover.addEventListener('click', () => recoverRun(false));

/* ---------------- Wave#125: bẫy focus + phím tắt modal ---------------- */

function visibleModal() {
	if (ui.lockVeil && !ui.lockVeil.hidden) return ui.lockVeil;
	const modals = document.querySelectorAll('.modal-veil');
	for (const modal of modals) {
		if (!modal.hidden) return modal;
	}
	return null;
}

document.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && locked) {
		e.preventDefault();
		unlockScreen();
		return;
	}
	if (e.key !== 'Tab') return;
	const modal = visibleModal();
	if (!modal) return;
	const nodes = Array.from(
		modal.querySelectorAll(
			'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
		),
	).filter((node) => node.offsetParent !== null || node === document.activeElement);
	if (!nodes.length) return;
	const first = nodes[0];
	const last = nodes[nodes.length - 1];
	if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
		e.preventDefault();
		first.focus();
	}
});

/* ---------------- Wave#124: vuốt ngang đổi trang trên mobile ---------------- */

let currentPageName = 'quest';
let swipeStart = null;

const appScroll = document.getElementById('appScroll');
const SWIPE_ORDER = ['quest', 'settings', 'stats', 'about'];

function swipeBlocked(target) {
	if (!target || !target.closest) return true;
	if (target.closest('input, select, textarea, video, iframe, .lock-veil, .claim-pill, .modal-veil')) return true;
	if (ui.sidebar && ui.sidebar.classList.contains('open')) return true;
	if (visibleModal()) return true;
	return false;
}

if (appScroll) {
	appScroll.addEventListener(
		'touchstart',
		(e) => {
			if (e.touches.length !== 1) {
				swipeStart = null;
				return;
			}
			if (swipeBlocked(e.target)) {
				swipeStart = null;
				return;
			}
			const touch = e.touches[0];
			swipeStart = { x: touch.clientX, y: touch.clientY, at: Date.now() };
		},
		{ passive: true },
	);
	appScroll.addEventListener(
		'touchend',
		(e) => {
			if (!swipeStart) return;
			const start = swipeStart;
			swipeStart = null;
			const touch = e.changedTouches && e.changedTouches[0];
			if (!touch) return;
			const dx = touch.clientX - start.x;
			const dy = touch.clientY - start.y;
			if (Date.now() - start.at > 800) return;
			if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
			const idx = SWIPE_ORDER.indexOf(currentPageName);
			if (idx < 0) return;
			const next = dx < 0 ? idx + 1 : idx - 1;
			if (next < 0 || next >= SWIPE_ORDER.length) return;
			switchPage(SWIPE_ORDER[next]);
		},
		{ passive: true },
	);
}

updateNetBadge();

/* ---------------- Waves 28: Chế độ Sáng / Tối ---------------- */
let currentTheme = 'dark';

function applyTheme(theme, persist = true) {
	currentTheme = theme === 'light' ? 'light' : 'dark';
	document.documentElement.dataset.theme = currentTheme;
	const isLight = currentTheme === 'light';
	if (ui.themeDark) ui.themeDark.setAttribute('aria-checked', String(!isLight));
	if (ui.themeLight) ui.themeLight.setAttribute('aria-checked', String(isLight));
	/* Wave#134: mực trên bảng tên PHẢI tính lại ngay khi đổi theme — nó phụ thuộc
	   nền thật (--card) vừa đổi, không phụ thuộc theme lúc renderProfile chạy. */
	refreshNameplateInk();
	/* cùng lý do cho KIỂU TÊN NITRO: màu do dnsBuildVars chỉnh theo --card tại
	   lúc áp. Đổi theme mà không chỉnh lại thì tên vẫn mang màu tính cho nền
	   TỐI → sang theme Sáng bị chìm đúng chỗ bro cấm chìm. Không đổi font/màu
	   gốc của user — chỉ chỉnh lại độ sáng theo nền mới. */
	if (dnsApplied) applyDisplayNameStyle(dnsApplied);
	refreshOpenCaptchaTheme();
	if (persist) {
		// Lưu lại cùng config (không phá token/loop đang có)
		api.saveConfig(collectConfig()).catch(() => {});
	}
}

if (ui.themeDark) ui.themeDark.addEventListener('click', () => applyTheme('dark'));
if (ui.themeLight) ui.themeLight.addEventListener('click', () => applyTheme('light'));

async function saveTokenDirectly() {
	const token = cleanTokenClient(ui.token.value);
	if (!token) {
		toast('Bạn chưa nhập token để lưu.', true);
		ui.token.focus();
		return;
	}
	ui.token.value = token;
	/* Waves 48: LƯU phải ĐĂNG NHẬP LUÔN. Trước đây chỉ lưu config nên bro bấm Lưu
	   mà hồ sơ vẫn trống — đúng lỗi bro báo. */
	const result = await api.saveConfig(collectConfig());
	if (result && result.ok === false) {
		toast(`Lỗi khi lưu token: ${result.message}`, true);
		return;
	}
	await autoLoginFromToken();
}

ui.btnSaveToken.addEventListener('click', saveTokenDirectly);

/* Quét nhiệm vụ: chạy bot ở MODE=scan, chỉ lấy danh sách rồi thoát. */
ui.btnScan.addEventListener('click', async () => {
	if (bulkClaimBusy) {
		toast('Đang nhận thưởng hàng loạt — đợi xong rồi quét lại.', true);
		return;
	}
	if (!isOnline()) {
		toast('Đang ngoại tuyến — cần mạng để quét nhiệm vụ.', true);
		return;
	}
	if (!validate()) return;
	// Wave#116: quét xong thường sẽ claim — nạp sẵn hCaptcha ngay từ đây.
	warmUpCaptcha();

	// Waves 27: vào TRẠNG THÁI QUÉT NGAY — không chờ saveConfig/start.
	// Wave#96 (bro: "ấn quét nhiệm vụ phải nạp luôn nhé, hơi chậm đấy"):
	//   ĐẢO THỨ TỰ — bật loader + % NGAY (đồng bộ), rồi mới await saveConfig.
	//   Trước đây `await api.saveConfig(...)` (IPC, tốn vài chục–trăm ms trên máy
	//   yếu) nằm TRƯỚC setScanning ⇒ % đứng im ⇒ bro cảm nhận "chậm".
	//   Nay: reset state (đồng bộ, rẻ) → setScanning(true) → await saveConfig.
	// Reset danh sách & lựa chọn cũ
	questOrder.length = 0;
	quests.clear();
	selected.clear();
	doneSeen.clear();
	ui.console.innerHTML = '';
	logText = '';
	sessionOrbsBonus = 0;
	sessionClaimCount = 0;
	sessionClaimOrbs = 0;
	// Waves 27: buffer RAM — quest nhận trong lúc nạp KHÔNG render ngay, gom vào
	// scanBuffer rồi mới đổ ra 1 lượt khi nạp xong (hiệu ứng trôi + mờ dần).
	scanBuffer.length = 0;
	renderQuests();

	// Bật loader/scanning NGAY (loader tự bò, không đứng chờ).
	setScanning(true, 0);
	setState('scanning');
	switchPage('quest');
	appendLog('Đang kết nối Discord và quét nhiệm vụ…', 'system');

	// Giờ mới ghi config + gọi bot (await sau khi UI đã phản hồi).
	await api.saveConfig(collectConfig());
	const cfg = collectConfig();
	cfg.mode = 'scan';
	const result = await api.start(cfg);
	if (!result.ok) {
		toast(result.message, true);
		dropLoader();
		setState('idle');
	}
});

/* Auto ORBs: chạy các nhiệm vụ đã tích chọn. */
async function startRun(mode, extra = {}) {
	if (bulkClaimBusy) {
		toast('Đang nhận thưởng hàng loạt — đợi xong rồi chạy Auto ORBs.', true);
		return;
	}
	if (!isOnline()) {
		toast('Đang ngoại tuyến — cần mạng để chạy Auto Quest.', true);
		return;
	}
	if (!validate()) return;
	await api.saveConfig(collectConfig());

	ui.console.innerHTML = '';
	logText = '';
	userStopped = false;
	if (ui.btnRecover) ui.btnRecover.hidden = true;

	const cfg = collectConfig();
	cfg.mode = mode;
	Object.assign(cfg, extra);
	lastRunConfig = {
		mode,
		loopMode: cfg.loopMode,
		loopInterval: cfg.loopInterval,
		selectedQuests: Array.isArray(cfg.selectedQuests) ? cfg.selectedQuests : [],
	};
	const result = await api.start(cfg);
	if (!result.ok) {
		toast(result.message, true);
		setState('idle');
	} else {
		setState('starting');
		switchPage('quest'); // chạy thì hiện ngay trang Auto Quest để theo dõi console
		startHeartbeat();
		toast(`Đang chạy ${extra.selectedQuests?.length || 0} nhiệm vụ đã chọn...`);
	}
}

ui.btnStart.addEventListener('click', () => {
	if (selected.size === 0) {
		toast('Chưa chọn nhiệm vụ nào.', true);
		return;
	}
	healAttempts = 0;
	lastAutoHeal = 0;
	startRun('run', { selectedQuests: Array.from(selected) });
});

ui.btnStop.addEventListener('click', () => {
	ui.btnStop.disabled = true; // chống double-click ngay lập tức
	userStopped = true;
	stopHeartbeat();
	clearTimeout(healTimer);
	healTimer = null;
	if (ui.btnRecover) ui.btnRecover.hidden = true;
	setState('stopping');
	// Waves 42: đánh dấu DỪNG cho MỌI nhiệm vụ đang chạy NGAY LẬP TỨC (UI phản hồi
	// tức thì) — thẻ đổi từ "Đang chạy" sang "Dừng" (ĐỎ). Bot dừng nền sau đó.
	handleEvent({ type: 'quest:stop-all', data: {} });
	api.stop();
	toast('Đang dừng tiến trình...');
});

ui.btnPaste.addEventListener('click', async () => {
	const text = (await api.readClipboard()) || '';
	const match = text.match(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{20,}/);
	ui.token.value = match ? match[0] : cleanTokenClient(text);
	if (ui.token.value) {
		toast('Đã dán Token Discord.');
		ui.token.classList.remove('invalid');
		ui.btnScan.disabled = state !== 'idle';
		// Waves 48: dán là đăng nhập ngay (không cần bấm Lưu).
		lastAuthedToken = '';
		clearTimeout(tokenAuthTimer);
		await autoLoginFromToken();
	}
});

ui.btnToggleToken.addEventListener('click', () => {
	const isPassword = ui.token.type === 'password';
	ui.token.type = isPassword ? 'text' : 'password';
	ui.btnToggleTokenText.textContent = isPassword ? 'Ẩn' : 'Hiện';
});

// Nút Copy mã script Console
const CONSOLE_TOKEN_SCRIPT = `window.webpackChunkdiscord_app.push([
	[Symbol()],
	{},
	req => {
		if (!req.c) return;
		for (let m of Object.values(req.c)) {
			try {
				if (!m.exports || m.exports === window) continue;
				if (m.exports?.getToken) return copy(m.exports.getToken());
				for (let ex in m.exports) {
					if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
				}
			} catch {}
		}
	},
]);
window.webpackChunkdiscord_app.pop();
console.log('%cDA COPY TOKEN DISCORD THANH CONG!', 'color: #a78bfa; font-size: 22px; font-weight: bold; background: #05060b; padding: 10px; border-radius: 8px;');`;

ui.btnCopyScript.addEventListener('click', async () => {
	try {
		await api.writeClipboard(CONSOLE_TOKEN_SCRIPT);
		toast('Đã copy lệnh lấy Token! Dán vào Console Discord (F12) và ấn Enter.');
	} catch {
		toast('Không thể copy tự động, vui lòng thử lại.', true);
	}
});

/* ---------------- Waves 44: HƯỚNG DẪN LẤY TOKEN có MŨI TÊN SỔ RA ----------------
   Bro: "phần hướng dẫn lấy token trong 5s bro làm một cái mũi tên ấy khi người
   dùng click vào nó sẽ sổ ra tutorial; còn phương thức thứ 2 là đăng nhập bằng
   discord, tôi sẽ tạo một con bot và cho phép nó quyền đọc ảnh đại diện".
   → Mũi tên lớn: mở/đóng cả hộp hướng dẫn.
   → Mũi tên nhỏ (trong Cách 2): mở/đóng hướng dẫn TẠO BOT. */
function bindDisclosure(btn, panel) {
	if (!btn || !panel) return;
	btn.addEventListener('click', () => {
		const open = btn.getAttribute('aria-expanded') === 'true';
		btn.setAttribute('aria-expanded', open ? 'false' : 'true');
		panel.hidden = open;
	});
}
bindDisclosure(ui.btnGuideToggle, ui.guideBody);
/* Waves 46 — ĐÃ XOÁ chức năng mời bot vào server (bro yêu cầu).
   Không còn 2 tab nên không cần hàm chuyển tab nữa; chỉ giữ pane Console. */
if (ui.guidePaneConsole) ui.guidePaneConsole.hidden = false;

/* ============================================================================
   WAVES 48 — KIỂU TÊN HIỂN THỊ (Discord Display Name Styles)
   ----------------------------------------------------------------------------
   Bro: "trích đúng innerContainer… của F12 luôn bất kể user nào… font không mặc
   định mà trích 100% từ server… PHẢI CHECK THẬT KĨ KHI CHUYỂN SANG CHẾ ĐỘ TỐI,
   SÁNG NÓ CÓ BỊ CHÌM MÀU KHÔNG".

   Bản 47 đọc qua CDP nên KHÔNG có Discord mở là không có gì (kể cả font). Bản 48
   lấy dữ liệu từ API Discord (`display_name_styles`) + bảng font/effect/hiệu ứng
   chép từ chính server Discord → chạy được kể cả khi Discord đóng.

   Phần dưới đây KHÔNG tự nghĩ ra công thức nào:
     • `dnsDerivePalette`  = hàm `$0`  (module 945096 trong web.js của Discord)
     • `dnsAdjustContrast` = hàm `lZ`  (module 998304) — Discord TỰ nâng sáng màu
       cho đủ tương phản; ta dùng đúng vòng lặp 10 bước × 0.05 của họ.
     • Cách dựng biến `--custom-display-name-styles-*` = hàm `H` (chunk 836545).
   ============================================================================ */

let dnsApplied = null; // descriptor đang áp
let dnsFontFamily = ''; // family đã đăng ký @font-face
let dnsBaseText = ''; // chữ gốc (để khôi phục sau khi tách chữ hiệu ứng gummy)

/* --- Chuyển đổi màu --- */
function dnsHexToRgb(hex) {
	const h = String(hex || '').replace('#', '');
	const s = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h.slice(0, 6);
	const n = parseInt(s, 16);
	if (!Number.isFinite(n)) return [255, 255, 255];
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function dnsRgbToHex(c) {
	const p = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
	return '#' + p(c[0]) + p(c[1]) + p(c[2]);
}
function dnsRelLum(c) {
	const f = (v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}
function dnsContrast(a, b) {
	const l1 = dnsRelLum(a),
		l2 = dnsRelLum(b);
	const hi = Math.max(l1, l2),
		lo = Math.min(l1, l2);
	return (hi + 0.05) / (lo + 0.05);
}

/* --- HSL: đổi ĐỘ SÁNG mà GIỮ NGUYÊN hue/saturation ---
   Đây là cách "designer lại" khi chìm màu: vẫn đúng sắc của user, chỉ nâng/hạ
   sáng cho đọc được. Không đổi sang màu khác. */
function dnsRgbToHsl(c) {
	const r = c[0] / 255,
		g = c[1] / 255,
		b = c[2] / 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0,
		s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
		else if (max === g) h = ((b - r) / d + 2) / 6;
		else h = ((r - g) / d + 4) / 6;
	}
	return { h, s, l };
}
function dnsHslToRgb(h, s, l) {
	const hue = (p, q, t) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	let r, g, b;
	if (s === 0) r = g = b = l;
	else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue(p, q, h + 1 / 3);
		g = hue(p, q, h);
		b = hue(p, q, h - 1 / 3);
	}
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Discord `$0(color)` — suy ra 7 sắc từ MỘT màu chính (module 945096).
 * Chép nguyên công thức: light1 = 1.2L, light2 = 1.6L, dark1 = 0.6L,
 * dark2 = 0.2L, toonStroke = max(.12, .4L), neonStroke = (S*1.2, min(.6, L+.1)).
 */
function dnsDerivePalette(hex) {
	const rgb = dnsHexToRgb(hex);
	const { h, s, l } = dnsRgbToHsl(rgb);
	const at = (ss, ll) => dnsRgbToHex(dnsHslToRgb(h, Math.max(0, Math.min(1, ss)), Math.max(0, Math.min(1, ll))));
	return {
		main: dnsRgbToHex(rgb),
		light1: at(s, Math.min(1, 1.2 * l)),
		light2: at(s, Math.min(1, 1.6 * l)),
		dark1: at(s, Math.max(0, 0.6 * l)),
		dark2: at(s, Math.max(0, 0.2 * l)),
		toonStroke: at(s, Math.max(0.12, 0.4 * l)),
		neonStroke: at(Math.min(1, 1.2 * s), Math.min(0.6, l + 0.1)),
	};
}

/**
 * Discord `lZ({foreground, background, ratio})` — nâng/hạ ĐỘ SÁNG từng bước 0.05,
 * tối đa 10 bước, cho tới khi đạt `ratio`. Chính Discord dùng hàm này để tên
 * không chìm màu trên nền của nó; ta dùng lại y nguyên, chỉ đổi nền sang nền thật
 * của app.
 */
function dnsAdjustContrast(hex, surface, ratio) {
	const bgDark = dnsRelLum(surface) <= 0.5;
	const rgb0 = dnsHexToRgb(hex);
	const { h, s } = dnsRgbToHsl(rgb0);
	let l = dnsRgbToHsl(rgb0).l;
	let rgb = rgb0;
	let c = dnsContrast(rgb, surface);
	for (let i = 0; i < 10 && c < ratio; i++) {
		if (bgDark) {
			if (l < 0.95) l += 0.05;
			else break;
		} else if (l > 0.05) l -= 0.05;
		else break;
		rgb = dnsHslToRgb(h, s, l);
		c = dnsContrast(rgb, surface);
	}
	return { hex: dnsRgbToHex(rgb), ratio: c };
}

/** Nền quy ước để TÍNH TRƯỚC xem tên có chìm hay không (token --card). */
function dnsSurface(el) {
	// Waves 49b: nền THẬT của từng chỗ hiện tên khác nhau (hero card vs popout vs
	// chip sidebar). Đọc `--card` tại chính phần tử nếu có, mới rơi về :root.
	let raw = '';
	try {
		if (el) raw = getComputedStyle(el).getPropertyValue('--card').trim();
	} catch {
		/* bỏ qua */
	}
	if (!raw) raw = getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
	const c = dnsExtractColors(raw);
	return c.length ? c[0] : [255, 255, 255];
}
/** Rút màu đầu tiên khỏi một chuỗi CSS (dùng cho token --card). */
function dnsExtractColors(css) {
	const out = [];
	const s = String(css || '');
	let m;
	const re = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/g;
	while ((m = re.exec(s))) out.push([+m[1], +m[2], +m[3]]);
	const reHex = /#([0-9a-f]{6})\b/gi;
	while ((m = reHex.exec(s))) {
		const v = m[1];
		out.push([parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]);
	}
	return out;
}

/**
 * Dựng biến CSS y như hàm `H` của Discord (chunk 836545).
 * Trả `{ vars, colors, worst }` — `worst` là tương phản THẤP NHẤT sau khi chỉnh,
 * ghi ra `data-dns-worst` để probe đọc được (không phải suy đoán).
 */
function dnsBuildVars(desc, surface) {
	const eff = desc.effect || 'solid';
	/* Ngưỡng: Discord dùng 2.5 cho gradient/prism, 3 cho phần còn lại. Nhưng nền
	   nameplate của app có thêm lớp phủ brand 16% nên nền THẬT sáng hơn --card một
	   chút → lấy max(Discord, 3.4) để kết quả ĐO ĐƯỢC luôn ≥ 3.0. */
	const need = Math.max(Number(desc.minRatio) || 3, 3.4);

	const colors = [];
	let worst = 99;
	for (const c of desc.colors || []) {
		const a = dnsAdjustContrast(c, surface, need);
		colors.push(a.hex);
		worst = Math.min(worst, a.ratio);
	}

	const vars = {
		'--custom-display-name-styles-wrap': 'nowrap',
		'--custom-display-name-styles-font-opacity': '1',
	};

	if (!colors.length) {
		/* Không có màu (Solid + màu mặc định) → dùng màu chữ thường của app. */
		return { vars, colors, worst: 99 };
	}

	if (eff === 'gradient') {
		vars['--custom-display-name-styles-gradient-stops'] =
			colors.length === 1
				? `${colors[0]}, ${colors[0]}`
				: colors.map((c, i) => `${c} ${(10 + (80 * i) / (colors.length - 1)).toFixed(3)}%`).join(', ');
		vars['--custom-display-name-styles-main-color'] = colors[0];
	} else if (eff === 'prism') {
		const n = colors.length;
		const stops = Array.from({ length: n + 1 }, (_, i) => `${colors[i % n]} ${((100 * i) / n).toFixed(3)}%`).join(', ');
		vars['--custom-display-name-styles-prism-stops'] = stops;
		vars['--custom-display-name-styles-prism-cycle'] = `max(${Math.max(1, (desc.text || '').length)}ch, 64px)`;
		vars['--custom-display-name-styles-main-color'] = colors[0];
	} else {
		const p = dnsDerivePalette(colors[0]);
		/* NEON: màu TÔ là trắng (Discord quy định), nét chữ do VIỀN quyết định.
		   Viền neon sáng hơn màu chính (L+0.1) nên trên nền Sáng nó là thứ dễ chìm
		   nhất → phải cho viền đi qua đúng bộ chỉnh tương phản. */
		p.neonStroke = dnsAdjustContrast(p.neonStroke, surface, need).hex;
		vars['--custom-display-name-styles-main-color'] = p.main;
		vars['--custom-display-name-styles-light-1-color'] = p.light1;
		vars['--custom-display-name-styles-light-2-color'] = p.light2;
		vars['--custom-display-name-styles-dark-1-color'] = p.dark1;
		vars['--custom-display-name-styles-dark-2-color'] = p.dark2;
		vars['--custom-display-name-styles-toon-stroke-color'] = p.toonStroke;
		vars['--custom-display-name-styles-neon-stroke-color'] = p.neonStroke;
	}

	return { vars, colors, worst };
}

/* Danh sách ĐẦY ĐỦ biến của tính năng này. Phải xoá HẾT trước khi áp kiểu mới,
   nếu không biến của hiệu ứng CŨ còn nằm lại inline (ví dụ `--prism-stops` của
   lần trước) và làm hỏng màu của hiệu ứng MỚI. Đây là lỗi thật đã đo được:
   đổi từ Prism (nền tối) sang Solid (nền sáng) vẫn đọc ra 8 màu cũ → 2.22:1. */
const DNS_VARS = [
	'--custom-display-name-styles-main-color',
	'--custom-display-name-styles-gradient-stops',
	'--custom-display-name-styles-prism-stops',
	'--custom-display-name-styles-prism-cycle',
	'--custom-display-name-styles-light-1-color',
	'--custom-display-name-styles-light-2-color',
	'--custom-display-name-styles-dark-1-color',
	'--custom-display-name-styles-dark-2-color',
	'--custom-display-name-styles-toon-stroke-color',
	'--custom-display-name-styles-neon-stroke-color',
	'--custom-display-name-styles-wrap',
	'--custom-display-name-styles-font-opacity',
];

/** Đăng ký ĐÚNG file font Discord đã tải về (data URL) dưới tên family thật. */
function dnsRegisterFont(family, dataUrl, weight) {
	if (!family || !dataUrl) return;
	let el = document.getElementById('dnsFontFace');
	if (!el) {
		el = document.createElement('style');
		el.id = 'dnsFontFace';
		document.head.appendChild(el);
	}
	const w = Number(weight) || 400;
	el.textContent =
		`@font-face{font-family:"${String(family).replace(/"/g, '')}";` +
		`src:url("${dataUrl}") format("woff2");font-weight:${w};font-style:normal;font-display:swap;}`;
	dnsFontFamily = family;
}

/** Mọi chỗ hiển thị TÊN người dùng — phải ĐỒNG BỘ cùng một kiểu.
 *  Waves 49b: bro báo khung profiles TRÁI giữ font cũ, không khớp profile CHÍNH.
 *  Nguyên nhân: `applyDisplayNameStyle` cứng `ui.phDisplay`. Nay áp cho cả 3:
 *    ui.phDisplay  — tên lớn giữa trang (hero)
 *    ui.dpDisplay  — tên trong khung popout/sidebar
 *    ui.upName     — tên trên chip user ở đáy sidebar
 *  Bỏ phần tử không tồn tại; giữ thứ tự để hiệu ứng gummy tách chữ đúng. */
function dnsTargets() {
	const list = [ui.phDisplay, ui.dpDisplay, ui.upName].filter(Boolean);
	// Khử trùng (phòng khi 2 id trỏ cùng một node).
	return [...new Set(list)];
}

/** Gỡ mọi thứ đã áp (khi đăng xuất / không có style). */
function clearDisplayNameStyle() {
	dnsApplied = null;
	dnsBaseText = '';
	for (const el of dnsTargets()) {
		if (el.querySelector('.dns-gummy-letter')) el.textContent = el.dataset.dnsText || '';
		el.removeAttribute('style');
		el.removeAttribute('data-dns');
		el.removeAttribute('data-dns-effect');
		el.removeAttribute('data-username-with-effects');
		el.removeAttribute('data-dns-worst');
		el.removeAttribute('data-dns-text');
		el.classList.remove('dns-active');
	}
}

/** Hiệu ứng Gummy: Discord tách từng ký tự và tô màu xoay vòng. */
function dnsApplyGummyText(el, text, colors) {
	el.textContent = '';
	const chars = Array.from(String(text || ''));
	chars.forEach((ch, i) => {
		const sp = document.createElement('span');
		sp.className = 'dns-gummy-letter';
		sp.style.setProperty('--dns-letter-index', String(i));
		if (colors.length) sp.style.color = colors[i % colors.length];
		sp.textContent = ch;
		el.appendChild(sp);
	});
}

/**
 * ÁP descriptor lên MỌI chỗ hiện tên người dùng.
 * Chỉ chép lại những gì Discord đã định nghĩa — không sáng tác hiệu ứng nào.
 *
 * Waves 49b: áp cho cả hero + khung popout + chip sidebar (xem dnsTargets).
 * Mỗi phần tử tự đo `surface` riêng vì nền (card/popup) khác nhau → màu/độ
 * tương phản điều chỉnh đúng cho từng nền, không dùng chung một bảng.
 */
function applyDisplayNameStyle(desc) {
	const targets = dnsTargets();
	if (!targets.length) return;
	if (!desc || !desc.ok) {
		clearDisplayNameStyle();
		return;
	}
	dnsApplied = desc;
	const baseText = String(desc.text || '');
	dnsBaseText = baseText;

	for (const el of targets) {
		const surface = dnsSurface(el);
		const built = dnsBuildVars(desc, surface);

		/* Xoá biến cũ TRƯỚC khi đặt biến mới — nếu không sẽ lẫn màu kiểu trước. */
		for (const k of DNS_VARS) el.style.removeProperty(k);

		el.classList.add('dns-active');
		el.setAttribute('data-dns', '1');
		el.setAttribute('data-dns-effect', desc.effect || 'solid');

		/* --- Font: dùng ĐÚNG family Discord khai báo --- */
		const f = desc.font || {};
		if (f.family) el.style.fontFamily = `"${f.family}", var(--font-sans)`;
		if (f.weight) el.style.fontWeight = String(f.weight);
		if (f.letterSpacing) el.style.letterSpacing = f.letterSpacing;

		/* --- Biến CSS riêng của Discord --- */
		for (const [k, v] of Object.entries(built.vars)) el.style.setProperty(k, v);

		/* --- Gummy: tách ký tự (Discord cũng làm vậy) --- */
		const text = baseText || el.textContent || '';
		el.dataset.dnsText = text;
		if (desc.effect === 'gummy') {
			el.setAttribute('data-username-with-effects', text);
			dnsApplyGummyText(el, text, built.colors);
		} else {
			el.textContent = text;
			el.setAttribute('data-username-with-effects', text);
		}

		/* Ghi lại số đo để probe/kiểm chứng đọc được (không phải suy đoán). */
		el.dataset.dnsWorst = built.worst === 99 ? 'n/a' : built.worst.toFixed(2);
	}
}

/**
 * Đọc style thật từ Discord (main process) rồi áp.
 * Im lặng nếu không đọc được — thà hiện tên thường còn hơn chặn đăng nhập.
 */
async function loadDisplayNameStyle(name, userId) {
	try {
		if (!api || typeof api.dnsRead !== 'function') return;
		const token = ui.token ? String(ui.token.value || '').trim() : '';
		const r = await api.dnsRead({
			displayName: String(name || ''),
			userId: userId != null ? String(userId) : '',
			token,
		});
		if (!r || !r.ok || !r.style) {
			clearDisplayNameStyle();
			return;
		}
		const st = r.style;
		/* Tải ĐÚNG file font Discord dùng (cache lại sau lần đầu). */
		if (st.font && st.font.family && st.font.hasFile && typeof api.dnsFont === 'function') {
			try {
				const fr = await api.dnsFont(st.font.family);
				if (fr && fr.ok && fr.dataUrl) dnsRegisterFont(st.font.family, fr.dataUrl, fr.weight);
			} catch {
				/* không tải được font → vẫn áp màu/hiệu ứng */
			}
		}
		applyDisplayNameStyle(st);
	} catch {
		clearDisplayNameStyle();
	}
}

/** Dựng profile từ dữ liệu user Discord trả về (dùng chung cho bot & token). */
function applyBotProfile(u) {
	if (!u || !u.id) return;
	currentUser = u;
	ui.dprofile.dataset.state = 'ready';
	const name = u.global_name || u.username || 'Discord';
	ui.dpDisplay.textContent = name;
	ui.dpUsername.textContent = u.username ? `@${u.username}` : '';
	ui.upName.textContent = name;
	ui.upSub.textContent = u.bot ? 'Bot (chỉ đọc)' : (u.username ? `@${u.username}` : 'Đã kết nối');
	if (u.avatar) {
		const ext = String(u.avatar).startsWith('a_') ? 'gif' : 'png';
		const src = `${CDN}/avatars/${u.id}/${u.avatar}.${ext}?size=128`;
		ui.dpAvatar.innerHTML = `<img class="dp-avatar-img" src="${src}" alt="" />`;
		ui.upAvatar.innerHTML = `<img src="${src}" alt="" />`;
	} else {
		ui.dpAvatar.innerHTML = defaultAvatarSvg(30);
		ui.upAvatar.innerHTML = defaultAvatarSvg(20);
	}
	ui.dpDecoration.innerHTML = '';
	ui.dpClanBadge.hidden = true;
	ui.dpClanTag.hidden = true;
	ui.dpBadge.hidden = false;
	ui.dpBadgeText.textContent = 'Đổi tài khoản';
	// Hero giữa trang: hiện ở chế độ "bot" (không có banner cá nhân → nền mặc định).
	ui.heroProfile.hidden = false;
	ui.heroProfile.dataset.state = 'bot';
	ui.phDisplay.textContent = name;
	// Waves 48: bot cũng có thể có kiểu tên hiển thị riêng.
	loadDisplayNameStyle(name, u.id);
	ui.phUsername.textContent = u.username ? `@${u.username}` : 'Hồ sơ bot';
	ui.phUserId.hidden = false;
	ui.phUserIdValue.textContent = u.id;
	if (u.avatar) {
		const ext = String(u.avatar).startsWith('a_') ? 'gif' : 'png';
		ui.phAvatar.innerHTML = `<img class="ph-avatar-img" src="${CDN}/avatars/${u.id}/${u.avatar}.${ext}?size=160" alt="" />`;
	} else {
		ui.phAvatar.innerHTML = defaultAvatarSvg(34);
	}
	ui.phDecoration.innerHTML = '';
	ui.phClanBadge.hidden = true;
	ui.phClanTag.hidden = true;
	ui.phBanner.innerHTML = '';
	ui.phBanner.style.background = '';
	ui.phBanner.classList.add('default');
	ui.phBadges.innerHTML = '';
	ui.phBadges.hidden = true;
}

/* ============================================================================
   Waves 45b/46 — NẠP TOKEN TÀI KHOẢN TỪ FILE .txt (ĐĂNG NHẬP THẬT).
   ----------------------------------------------------------------------------
   Đây là đường DUY NHẤT đăng nhập được tài khoản Discord. Token thuộc về chính
   bro nên app mới gọi được /quests/@me và nhận thưởng thay bro. Khác hoàn toàn
   bot_token (đã bỏ cùng chức năng "Mời bot vào server" ở Waves 46).
   Bảo mật: main chỉ trả token ĐÚNG MỘT LẦN qua usertoken:take rồi xoá khỏi RAM;
   còn lại chỉ trả độ dài, không bao giờ trả giá trị.
   ============================================================================ */
function setUserTokNote(msg, isErr) {
	if (!ui.userTokNote) return;
	ui.userTokNote.textContent = msg || '';
	ui.userTokNote.hidden = !msg;
	ui.userTokNote.classList.toggle('warn', !!isErr);
}

if (ui.btnUserTokImport) {
	ui.btnUserTokImport.addEventListener('click', async () => {
		ui.btnUserTokImport.disabled = true;
		try {
			const res = await api.userTokenImportTxt();
			if (res?.canceled) return;
			if (!res?.ok) {
				setUserTokNote(res?.message || 'Không nạp được file.', true);
				toast(res?.message || 'Không nạp được token từ file.', true);
				return;
			}
			const take = await api.userTokenTake();
			if (!take?.ok || !take.token) {
				setUserTokNote('Không lấy được token vừa nạp.', true);
				toast('Không lấy được token vừa nạp.', true);
				return;
			}
			// Đổ vào ô token rồi lưu như người dùng tự dán — kích hoạt luồng cũ.
			ui.token.value = take.token;
			ui.token.dispatchEvent(new Event('input', { bubbles: true }));
			const saved = await api.saveConfig(collectConfig());
			if (saved && saved.ok === false) {
				setUserTokNote(saved?.message || 'Đã đọc token nhưng chưa lưu được.', true);
				return;
			}
			setUserTokNote(
				`Đã nạp & lưu token tài khoản từ "${res.source}" (${res.length} ký tự). Bấm Đăng nhập để vào tài khoản.`,
				false,
			);
			appendLog(`[Hệ thống] Đã nạp token tài khoản từ ${res.source} — bấm Đăng nhập để hoàn tất.`, 'system');
			if (typeof api.authCheck === 'function') api.authCheck(take.token).catch(() => {});
		} catch (err) {
			setUserTokNote(err?.message || 'Lỗi khi nạp token.', true);
		} finally {
			ui.btnUserTokImport.disabled = false;
		}
	});
}

ui.btnClearLog.addEventListener('click', () => {
	ui.console.innerHTML = '';
	logText = '';
	dropLoader();
	setLogCount('—');
});

/* ---------------- Wave#108/#109: Dữ liệu & chẩn đoán ---------------- */

function setDataStatus(text, isErr) {
	if (!ui.dataStatus) return;
	ui.dataStatus.textContent = text || '';
	ui.dataStatus.classList.toggle('is-err', !!isErr);
	ui.dataStatus.hidden = !text;
}

/* Câu thông báo ngắn trong panel dữ liệu, theo ngôn ngữ đang chọn. */
function dataSay(vi, en) {
	return currentLang === 'en' ? en : vi;
}

function clearBackupPreview() {
	if (ui.dataImportPreview) ui.dataImportPreview.hidden = true;
	if (ui.dataImportMeta) ui.dataImportMeta.textContent = '—';
	try {
		if (typeof api.backupDiscard === 'function') api.backupDiscard();
	} catch {
		/* ignore */
	}
}

function isRunBusy() {
	return state === 'starting' || state === 'running' || state === 'stopping' || state === 'scanning' || scanning;
}

function openDataPanel() {
	if (!ui.dataModal) return;
	clearBackupPreview();
	setDataStatus('');
	if (ui.dataPassword) {
		ui.dataPassword.value = '';
		ui.dataPassword.type = 'password';
	}
	if (ui.btnDataToggleText) ui.btnDataToggleText.textContent = t('data.show');
	if (ui.dataDiagOut) {
		ui.dataDiagOut.hidden = true;
		ui.dataDiagOut.textContent = '';
	}
	if (ui.integrityOut) {
		ui.integrityOut.hidden = true;
		ui.integrityOut.textContent = '';
	}
	if (ui.tamperWarn) ui.tamperWarn.hidden = true;
	refreshRequestLog();
	ui.dataModal.hidden = false;
	if (ui.dataPassword) ui.dataPassword.focus();
}

function closeDataPanel() {
	if (!ui.dataModal) return;
	ui.dataModal.hidden = true;
	clearBackupPreview();
	setDataStatus('');
	if (ui.dataPassword) ui.dataPassword.value = '';
}

function formatDiagnostics(d) {
	const en = currentLang === 'en';
	const yes = (v) => (v ? (en ? 'yes' : 'có') : en ? 'no' : 'không');
	const L = [];
	L.push(`AUTO-QUEST web ${d.version}  ·  ${d.time}`);
	L.push('');
	L.push(en ? '[Environment]' : '[Môi trường]');
	L.push(`  ${en ? 'Origin' : 'Nguồn'}       : ${d.origin}`);
	L.push(
		`  ${en ? 'Secure HTTPS' : 'HTTPS bảo mật'} : ${d.secureContext ? (en ? 'YES' : 'CÓ') : en ? 'NO — tokens may leak in transit!' : 'KHÔNG — token có thể bị lộ trên đường truyền!'}`,
	);
	L.push(
		`  ${en ? 'Network' : 'Mạng'}      : ${d.online ? 'online' : 'offline'} · ${en ? 'tab' : 'tab'} ${d.visibility}`,
	);
	L.push(`  ${en ? 'Language' : 'Ngôn ngữ'}     : ${d.language || '—'}`);
	L.push(`  UA            : ${d.userAgent || '—'}`);
	L.push('');
	L.push(en ? '[Storage]' : '[Lưu trữ]');
	L.push(`  ${en ? 'Mode' : 'Chế độ'}         : ${d.storageMode}`);
	L.push(`  IndexedDB     : ${yes(d.indexedDb)} · localStorage: ${yes(d.localStorage)}`);
	L.push(`  WebCrypto     : ${yes(d.cryptoSubtle)}`);
	L.push(`  Persistent    : ${yes(d.persisted)}`);
	L.push(`  ${en ? 'Usage' : 'Dung lượng'}       : ${d.usageMB == null ? '—' : d.usageMB + ' MB / ' + d.quotaMB + ' MB'}`);
	L.push(
		`  ${en ? 'Token saved' : 'Token đã lưu'}  : ${d.tokenStored ? (en ? 'YES (encrypted, never shown)' : 'CÓ (đã mã hoá, không hiển thị)') : en ? 'no' : 'không'} · ${d.accounts} ${en ? 'accounts' : 'tài khoản'}`,
	);
	L.push(`  ${en ? 'Account #' : 'Tài khoản #'}   : ${d.activeIdx} · ${en ? 'remember' : 'ghi nhớ'}: ${yes(d.remember)}`);
	L.push('');
	L.push(en ? '[Browser features]' : '[Tính năng trình duyệt]');
	L.push(`  Web Locks     : ${yes(d.webLocks)}`);
	L.push(`  Wake Lock     : ${yes(d.wakeLockSupported)}${d.wakeLockHeld ? (en ? ' (held)' : ' (đang giữ)') : ''}`);
	L.push(`  Notifications : ${d.notifications}`);
	L.push(`  ServiceWorker : ${yes(d.serviceWorker)} · controlled: ${yes(d.swControlled)} · ${d.swRegistrations} registration`);
	L.push(`  hCaptcha      : ${yes(d.hcaptchaLoaded)}`);
	L.push('');
	L.push('[Engine]');
	L.push(
		`  ${en ? 'State' : 'Trạng thái'}       : ${d.engineState} · worker: ${yes(d.workerAlive)} · lock: ${yes(d.runLock)}`,
	);
	L.push(
		`  ${en ? 'Config' : 'Cấu hình'}       : ${en ? 'loop' : 'treo'} ${yes(d.loopMode)} · ${d.loopInterval} ${en ? 'min' : 'phút'} · theme ${d.theme} · autoScroll ${yes(d.autoScroll)}`,
	);
	L.push('');
	L.push(
		en
			? '(Diagnostics never include tokens. Tokens live only in the browser IndexedDB.)'
			: '(Chẩn đoán không chứa token. Token chỉ nằm trong IndexedDB của trình duyệt.)',
	);
	return L.join('\n');
}

async function runDiagnostics() {
	if (!ui.dataDiagOut) return;
	if (typeof api.appDiagnostics !== 'function') {
		setDataStatus(dataSay('Bản bridge này không hỗ trợ chẩn đoán.', 'This bridge does not support diagnostics.'), true);
		return;
	}
	ui.btnRunDiagnostics.disabled = true;
	ui.dataDiagOut.hidden = false;
	ui.dataDiagOut.textContent = dataSay('Đang thu thập…', 'Collecting…');
	try {
		const r = await api.appDiagnostics();
		if (!r || r.ok === false) {
			ui.dataDiagOut.textContent = dataSay(
				'Không chạy được chẩn đoán: ',
				'Could not run diagnostics: ',
			) + ((r && r.message) || dataSay('lỗi không xác định', 'unknown error'));
			setDataStatus(dataSay('Chẩn đoán thất bại.', 'Diagnostics failed.'), true);
			return;
		}
		ui.dataDiagOut.textContent = formatDiagnostics(r.diagnostics);
		setDataStatus(dataSay('Đã chạy chẩn đoán.', 'Diagnostics complete.'));
	} catch (err) {
		ui.dataDiagOut.textContent = dataSay('Lỗi chẩn đoán: ', 'Diagnostics error: ') + (err?.message || err);
		setDataStatus(dataSay('Chẩn đoán thất bại.', 'Diagnostics failed.'), true);
	} finally {
		ui.btnRunDiagnostics.disabled = false;
	}
}

async function doBackupExport() {
	const pass = ui.dataPassword ? ui.dataPassword.value : '';
	if (pass.length < 8) {
		setDataStatus(
			dataSay('Mật khẩu sao lưu cần ít nhất 8 ký tự.', 'Backup password must be at least 8 characters.'),
			true,
		);
		if (ui.dataPassword) ui.dataPassword.focus();
		return;
	}
	if (typeof api.backupExport !== 'function') {
		setDataStatus(dataSay('Bản bridge này không hỗ trợ sao lưu.', 'This bridge does not support backups.'), true);
		return;
	}
	ui.btnBackupExport.disabled = true;
	setDataStatus(dataSay('Đang mã hoá bản sao lưu…', 'Encrypting backup…'));
	try {
		const r = await api.backupExport(pass);
		if (!r || r.ok === false) {
			setDataStatus((r && r.message) || dataSay('Sao lưu thất bại.', 'Backup failed.'), true);
			return;
		}
		const done = dataSay(
			`Đã xuất bản sao lưu mã hoá (${r.accounts} tài khoản). Giữ file và mật khẩu cẩn thận.`,
			`Encrypted backup exported (${r.accounts} accounts). Keep the file and password safe.`,
		);
		setDataStatus(done);
		toast(done);
	} catch (err) {
		setDataStatus(dataSay('Sao lưu thất bại: ', 'Backup failed: ') + (err?.message || err), true);
	} finally {
		ui.btnBackupExport.disabled = false;
	}
}

async function doBackupPick() {
	const en = currentLang === 'en';
	if (isRunBusy()) {
		setDataStatus(
			dataSay(
				'Hãy DỪNG Auto Quest trước khi khôi phục để tránh ghi đè giữa chừng.',
				'STOP Auto Quest before restoring to avoid a partial overwrite.',
			),
			true,
		);
		return;
	}
	const pass = ui.dataPassword ? ui.dataPassword.value : '';
	if (!pass) {
		setDataStatus(dataSay('Nhập mật khẩu đã đặt khi sao lưu.', 'Enter the password you set for this backup.'));
		if (ui.dataPassword) ui.dataPassword.focus();
		return;
	}
	if (typeof api.backupPick !== 'function') {
		setDataStatus(dataSay('Bản bridge này không hỗ trợ khôi phục.', 'This bridge does not support restores.'), true);
		return;
	}
	clearBackupPreview();
	ui.btnBackupImport.disabled = true;
	setDataStatus(dataSay('Đang đọc & giải mã file sao lưu…', 'Reading and decrypting backup…'));
	try {
		const r = await api.backupPick(pass);
		if (!r || r.ok === false) {
			setDataStatus(
				r && r.canceled ? '' : (r && r.message) || dataSay('Khôi phục thất bại.', 'Restore failed.'),
				!r || !r.canceled,
			);
			return;
		}
		const p = r.preview || {};
		if (ui.dataImportMeta) {
			const names = Array.isArray(p.names) && p.names.length ? ' · ' + p.names.join(', ') + (p.accounts > 5 ? '…' : '') : '';
			const when = p.createdAt ? new Date(p.createdAt).toLocaleString(en ? 'en-US' : 'vi-VN') : '—';
			const bits = [
				en ? `Backup v${p.version || 1}` : `Bản sao lưu v${p.version || 1}`,
				when,
				en ? `${p.accounts} accounts` : `${p.accounts} tài khoản`,
				en ? `token ${p.hasToken ? 'yes' : 'no'}` : `token ${p.hasToken ? 'có' : 'không'}`,
			];
			if (Number(p.version) >= 2) {
				bits.push(
					p.checksumOk
						? en
							? 'checksum OK'
							: 'checksum OK'
						: en
							? 'checksum MISMATCH'
							: 'checksum KHÔNG khớp',
				);
			}
			if (p.hasExtras) bits.push(en ? 'includes history & queue' : 'kèm lịch sử & hàng đợi');
			ui.dataImportMeta.textContent = bits.join(' · ') + names;
		}
		if (ui.dataImportPreview) ui.dataImportPreview.hidden = false;
		const checksumBad = Number(p.version) >= 2 && p.checksumOk === false;
		if (checksumBad) {
			setDataStatus(
				dataSay(
					'CẢNH BÁO: checksum KHÔNG khớp — file có thể đã hỏng hoặc bị sửa. Chỉ khôi phục nếu bạn chắc chắn.',
					'WARNING: checksum mismatch — the file may be corrupted or modified. Restore only if you are sure.',
				),
				true,
			);
			toast(
				dataSay(
					'Checksum không khớp — kiểm tra kỹ trước khi ghi đè.',
					'Checksum mismatch — review carefully before overwriting.',
				),
				true,
			);
		} else {
			setDataStatus(
				dataSay(
					'Đã giải mã. Bấm "Ghi đè & khôi phục" để áp dụng — thao tác này THAY THẾ toàn bộ tài khoản hiện tại.',
					'Decrypted. Press "Overwrite & restore" to apply — this REPLACES all current accounts.',
				),
			);
			toast(dataSay('Đã đọc bản sao lưu — xác nhận để ghi đè.', 'Backup loaded — confirm to overwrite.'));
		}
	} catch (err) {
		setDataStatus(dataSay('Khôi phục thất bại: ', 'Restore failed: ') + (err?.message || err), true);
	} finally {
		ui.btnBackupImport.disabled = false;
	}
}

async function doBackupApply() {
	if (isRunBusy()) {
		setDataStatus(dataSay('Hãy DỪNG Auto Quest trước khi khôi phục.', 'STOP Auto Quest before restoring.'), true);
		return;
	}
	ui.btnBackupApply.disabled = true;
	setDataStatus(dataSay('Đang khôi phục…', 'Restoring…'));
	try {
		const r = await api.backupApply();
		if (!r || r.ok === false) {
			setDataStatus((r && r.message) || dataSay('Khôi phục thất bại.', 'Restore failed.'), true);
			return;
		}
		clearBackupPreview();
		setDataStatus(
			dataSay(
				`Đã khôi phục ${r.accounts} tài khoản. Đang tải lại giao diện…`,
				`Restored ${r.accounts} accounts. Reloading the interface…`,
			),
		);
		toast(dataSay(`Đã khôi phục ${r.accounts} tài khoản.`, `Restored ${r.accounts} accounts.`));
		setTimeout(() => location.reload(), 900);
	} catch (err) {
		setDataStatus(dataSay('Khôi phục thất bại: ', 'Restore failed: ') + (err?.message || err), true);
	} finally {
		ui.btnBackupApply.disabled = false;
	}
}

if (ui.btnDataPanel) ui.btnDataPanel.addEventListener('click', openDataPanel);
if (ui.btnDataClose) ui.btnDataClose.addEventListener('click', closeDataPanel);
if (ui.dataModal) {
	ui.dataModal.addEventListener('click', (e) => {
		if (e.target === ui.dataModal) closeDataPanel();
	});
}
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && ui.dataModal && !ui.dataModal.hidden) closeDataPanel();
});
if (ui.btnDataToggle) {
	ui.btnDataToggle.addEventListener('click', () => {
		const show = ui.dataPassword.type === 'password';
		ui.dataPassword.type = show ? 'text' : 'password';
		if (ui.btnDataToggleText) ui.btnDataToggleText.textContent = t(show ? 'data.hide' : 'data.show');
	});
}
if (ui.btnBackupExport) ui.btnBackupExport.addEventListener('click', doBackupExport);
if (ui.btnBackupImport) ui.btnBackupImport.addEventListener('click', doBackupPick);
if (ui.btnBackupApply) ui.btnBackupApply.addEventListener('click', doBackupApply);
if (ui.btnBackupCancel) ui.btnBackupCancel.addEventListener('click', () => {
	clearBackupPreview();
	setDataStatus('Đã huỷ bản sao lưu đang chờ.');
});
if (ui.btnRunDiagnostics) ui.btnRunDiagnostics.addEventListener('click', runDiagnostics);
if (ui.btnExportCfg) {
	ui.btnExportCfg.addEventListener('click', async () => {
		try {
			const r = await api.openDataFolder();
			if (r && r.ok === false) setDataStatus(r.message || 'Không xuất được cấu hình.', true);
			else setDataStatus('Đã xuất cấu hình (không kèm token).');
		} catch (err) {
			setDataStatus('Không xuất được cấu hình: ' + (err?.message || err), true);
		}
	});
}

ui.btnOpenFolder.addEventListener('click', () => api.openDataFolder());

/* ---------------- Initialization (Fast startup) ---------------- */

/* Waves 24: KHÔNG đổ stdout của bot ra nhật ký nữa — đó chính là kiểu "sổ một đống
   chữ" mà bro chê. Tiến độ đã có loader riêng + thẻ nhiệm vụ tự cập nhật vòng %.
   Chỉ giữ lại dòng LỖI / CẢNH BÁO để còn manh mối khi hỏng. */
const LOG_KEEP = /(\[LỖI\]|❌|⚠|cảnh báo|lỗi |thất bại|rate.?limit|bị chặn|không thể)/i;

api.onLog((payload) => {
	const raw = String(payload.line ?? '').replace(/\u001b\[[0-9;]*m/g, '');
	const line = raw.replace(/\s+$/, '');
	if (!line.trim()) return;
	if (!LOG_KEEP.test(line)) return; // bỏ toàn bộ log tiến độ ồn ào
	appendLog(line.trim(), payload.stream === 'stderr' ? 'stderr' : 'warn');
});
api.onEvent(handleEvent);
api.onState((payload) => {
	// Wave#103: tiến trình kết thúc (idle/error) mà loader vẫn quay = lỗi câm.
	if ((payload.state === 'idle' || payload.state === 'error') && scanning) {
		setScanning(false, scanDone);
		dropProgress();
	}
	setState(payload.state, payload);
	if (payload.state === 'idle' || payload.state === 'error') {
		stopHeartbeat();
		if (payload.state === 'error' && !userStopped) {
			if (ui.btnRecover) ui.btnRecover.hidden = false;
			scheduleSelfHeal();
		}
	} else if (payload.state === 'running' || payload.state === 'starting') {
		startHeartbeat();
	}
});

/* #105: cảnh báo trình duyệt khi đóng tab lúc engine đang chạy. */
window.addEventListener('beforeunload', (e) => {
	if (state === 'running') {
		e.preventDefault();
		e.returnValue = '';
	}
});

/* #106/#123: PWA — chỉ cache vỏ ứng dụng, không đụng API Discord.
   setupServiceWorker() (Wave#123) lo đăng ký, phiên bản và thanh cập nhật. */
if (ui.skipLink) {
	ui.skipLink.addEventListener('click', (event) => {
		event.preventDefault();
		switchPage('quest');
		const target = document.getElementById('pageQuest');
		if (target) {
			target.setAttribute('tabindex', '-1');
			target.focus({ preventScroll: false });
		}
	});
}

/**
 * Waves 28b: HOOK CHẨN ĐOÁN (dev-only) — cho phép harness gọi trực tiếp để đo
 * trạng thái nameplate (video paused/readyState/videoWidth) trong DOM thật.
 * Không ảnh hưởng UX; chỉ đọc/áp thử.
 */
window.__aqDiag = {
	renderProfile: (user) => renderDiscordProfile(user),
	/** User object đang hiển thị (để harness đo lại mà không gọi mạng). */
	current: () => currentUser,
	/** Đăng nhập lại bằng token ở ô nhập, không cần bấm tay. */
	reauth: () => {
		const t = ui.token ? ui.token.value.trim() : '';
		if (!t) return Promise.resolve({ ok: false, message: 'no token in field' });
		lastAuthedToken = '';
		return api.authCheck(t);
	},
	applyAura: (np) => applyProfileAura(np),
	nameplateState: () => {
		const out = [];
		for (const sel of ['.ph-nameplate', '.up-row']) {
			const host = document.querySelector(sel);
			const v = host && host.querySelector('video.np-media');
			const i = host && host.querySelector('img.np-media');
			out.push({
				host: sel,
				hasPlate: host ? host.classList.contains('has-plate') || host.classList.contains('has-np') : null,
				hasMedia: host ? host.classList.contains('has-media') : null,
				video: v
					? {
							paused: v.paused,
							readyState: v.readyState,
							videoW: v.videoWidth,
							videoH: v.videoHeight,
							loop: v.loop,
							muted: v.muted,
							src: v.currentSrc ? v.currentSrc.slice(-40) : null,
						}
					: null,
				img: i ? { src: i.src.slice(-32), complete: i.complete, w: i.naturalWidth } : null,
			});
		}
		return out;
	},
};

(async function init() {
	try {
		// Khởi tạo profile guest trước (nền gradient mặc định)
		resetDiscordProfile();
		// #109: cảnh báo khi trang chạy HTTP thường — token có thể bị nghe lén.
		if (!window.isSecureContext) {
			appendLog(
				'[Cảnh báo] Trang chạy qua HTTP KHÔNG bảo mật — token có thể bị lộ trên đường truyền. Hãy dùng HTTPS hoặc http://127.0.0.1.',
				'warn',
			);
			toast('Cảnh báo: trang chạy HTTP không bảo mật — token có thể bị lộ. Dùng HTTPS hoặc 127.0.0.1.', true);
		}
		const cfg = await api.getConfig();
		// Wave#88: nạp cache tài khoản đã lưu (cho popup "Đổi tài khoản").
		await loadAccountsCache();
		// Waves 28: áp chế độ Sáng/Tối đã lưu TRƯỚC khi vẽ (tránh nháy sáng/tối)
		applyTheme(cfg.theme === 'light' ? 'light' : 'dark', false);
		// Waves #126/#129/#127: ngôn ngữ, chế độ nhẹ, tự khoá — áp trước khi vẽ.
		applyLang(cfg.lang === 'en' ? 'en' : 'vi', false);
		applyLiteMode(cfg.liteMode === true, false);
		setAutoLock(cfg.autoLockMin, false);
		if (ui.appVersion) ui.appVersion.textContent = APP_VERSION;
		setupServiceWorker();
		renderQueueChip();
		renderStats();
		if (cfg.token) {
			ui.token.value = cleanTokenClient(cfg.token);
			// Waves 48: dùng CHUNG một đường đăng nhập với lúc dán token — tự vẽ hồ
			// sơ, tự nạp số dư Orb, tự báo lỗi nếu token đã hết hạn.
			await autoLoginFromToken();
			renderQueueChip();
			renderStats();
		}
		ui.loopMode.checked = cfg.loopMode !== false;
		if (cfg.loopInterval) {
			ui.loopInterval.value = String(cfg.loopInterval);
		}
		ui.loopIntervalRow.style.display = ui.loopMode.checked ? 'flex' : 'none';
		setState(cfg.state || 'idle');
		// Waves 24: log khởi động gọn 1 dòng, không hướng dẫn dài dòng.
		appendLog(
			currentLang === 'en'
				? 'Ready — press Scan quests to begin.'
				: 'Sẵn sàng — bấm Quét nhiệm vụ để bắt đầu.',
			'system',
		);
		setLogCount('—');
		setListsLoading(false); // chưa quét → 3 tab ở trạng thái RỖNG, không xoay vòng
		// Waves 40 (C): dò CDP trong im lặng — CHỈ ghi 1 dòng log, KHÔNG thêm UI.
		// Đây là "cửa" để Discord tự gửi request (captcha native) như repo tham chiếu.
		probeCdpQuietly();

		// #105: xin trình duyệt giữ dữ liệu cục bộ (tránh bị dọn khi máy thiếu chỗ).
		try {
			const p = await api.storagePersist();
			if (p && p.ok && p.persisted) {
				appendLog('[Hệ thống] Trình duyệt đã cam kết giữ dữ liệu cục bộ (persistent storage).', 'system');
			}
		} catch {
			/* trình duyệt cũ — bỏ qua */
		}

		// #105: tự chạy lại phiên treo nếu tab trước bị đóng/reload.
		try {
			if (tokenOf(currentUser)) {
				const intent = await api.resumeIntentTake();
				if (intent && intent.active) {
					appendLog('[Hệ thống] Phát hiện phiên treo trước đó — tự chạy lại…', 'system');
					toast('Đang tự chạy lại phiên treo trước đó…');
					await startRun(intent.config.mode || 'full', {
						loopMode: true,
						loopInterval: intent.config.loopInterval || 30,
						selectedQuests: Array.isArray(intent.config.selectedQuests)
							? intent.config.selectedQuests
							: [],
					});
				}
			}
		} catch {
			/* resume là tuỳ chọn */
		}
	} catch {
		/* ignore */
	}
})();

/**
 * Waves 40 (C) — Dò CDP một lần lúc khởi động. Không thay đổi UI, chỉ ghi log.
 * Nếu Discord đang mở kèm `--remote-debugging-port` → báo có; ngược lại nhắc cách bật.
 */
async function probeCdpQuietly() {
	try {
		if (!api.cdpStatus) return;
		const st = await api.cdpStatus();
		cdpReady = !!(st && st.ok && st.available);
		if (cdpReady) {
			appendLog(
				currentLang === 'en'
					? `[System] CDP ready (port ${st.port}) — Discord can run quests itself (native captcha).`
					: `[Hệ thống] CDP sẵn sàng (cổng ${st.port}) — có thể để chính Discord thực hiện nhiệm vụ (captcha chạy native).`,
				'system',
			);
		} else {
			appendLog(
				currentLang === 'en'
					? '[System] CDP not open — the app will call the API itself. To let Discord do it, launch Discord with "--remote-debugging-port=9223".'
					: '[Hệ thống] CDP chưa mở — app sẽ tự gọi API như trước. Muốn Discord tự làm, mở Discord kèm "--remote-debugging-port=9223".',
				'system',
			);
		}
	} catch {
		/* ignore */
	}
}
