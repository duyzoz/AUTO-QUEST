'use strict';

/**
 * Waves 40 — DANH TÍNH DISCORD (X-Super-Properties + User-Agent) NHẤT QUÁN.
 *
 * Học từ repo mở `discord-quest-helper` (Masterain98):
 *   • Header phải "nhất quán như một sinh vật": User-Agent PHẢI khớp đúng
 *     `browser_user_agent` bên trong X-Super-Properties. Lệch một mảnh = cờ đỏ.
 *   • X-Super-Properties gửi kèm MỌI request tới discord.com, không thêm lẻ loi.
 *   • Kèm timezone / locale / accept-language / referer-route tương ứng.
 *
 * ⚠️ BÀI HỌC TỪ WAVE 37 CỦA CHÍNH MÌNH: tôi từng thêm User-Agent + X-Super-Properties
 * rỗng vào một request đơn lẻ → Discord trả thẳng HTTP 404 (edge từ chối). Vì vậy
 * module này sinh MỘT danh tính duy nhất và dùng cho TẤT CẢ request.
 *
 * Không có gì bí mật ở đây: các giá trị dưới đây là thông tin công khai mà chính
 * client Discord gửi lên. Mục đích là để request "trông tự nhiên" — không phải giả mạo
 * quyền hạn gì thêm.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Hằng số phiên bản client. Cập nhật cùng nhau khi Discord ra bản mới.
// Tham chiếu giá trị từ repo discord-quest-helper (cập nhật 17/10/2026).
// ─────────────────────────────────────────────────────────────────────────────
const CLIENT_VERSION = '1.0.9262';
const CHROME_VERSION = '148.0.7778.280';
const ELECTRON_VERSION = '42.11.11';
const CLIENT_BUILD_NUMBER = 641004;
const NATIVE_BUILD_NUMBER = 94186;

/** User-Agent PHẢI trùng khớp `browser_user_agent` trong X-Super-Properties. */
function discordUserAgent(clientVersion = CLIENT_VERSION) {
	return (
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
		`(KHTML, like Gecko) discord/${clientVersion} ` +
		`Chrome/${CHROME_VERSION} Electron/${ELECTRON_VERSION} Safari/537.36`
	);
}

/** Sinh id phiên dạng UUID v4 (giống client Discord sinh mỗi phiên chạy). */
function randomSessionId() {
	try {
		return require('node:crypto').randomUUID();
	} catch {
		// Fallback thủ công nếu crypto.randomUUID không có.
		const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
		return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-a${hex().slice(1)}-${hex()}${hex()}${hex()}`;
	}
}

/** Suy phiên bản OS từ host (win32 → 10.0.19045 như phần lớn máy Windows 10/11). */
function hostOsVersion() {
	const os = require('node:os');
	const rel = String(os.release() || '');
	if (process.platform === 'win32') {
		// Windows: os.release() trả "10.0.19045" hoặc "10.0.22631".
		return rel || '10.0.19045';
	}
	if (process.platform === 'darwin') {
		const major = rel.split('.')[0] || '14';
		return `Mac OS X ${major}`;
	}
	return rel || '6.5.0';
}

function hostOsSdkVersion() {
	const rel = String(require('node:os').release() || '');
	const parts = rel.split('.');
	if (process.platform === 'win32' && parts.length >= 3) return parts[2];
	return rel.replace(/\./g, '') || '19045';
}

function systemLocale() {
	const l = String(process.env.LC_ALL || process.env.LANG || '').split('.')[0];
	if (l && l.includes('_')) return l.split('@')[0].replace('_', '-').toLowerCase();
	return 'en-US';
}

function timeZone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';
	} catch {
		return 'Asia/Bangkok';
	}
}

/**
 * Danh tính tương thích trình duyệt (giả lập) — sinh MỘT LẦN cho cả phiên chạy.
 * `browser_user_agent` ở đây CHÍNH LÀ UA thật dùng trong header → bất biến vàng.
 */
function buildSuperProperties() {
	const browserUserAgent = discordUserAgent();
	return {
		os: process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'Mac OS X' : 'Linux',
		browser: 'Discord Client',
		release_channel: 'stable',
		client_version: CLIENT_VERSION,
		os_version: hostOsVersion(),
		os_arch: process.arch === 'x64' ? 'x64' : process.arch,
		app_arch: process.arch === 'x64' ? 'x64' : process.arch,
		system_locale: systemLocale(),
		has_client_mods: false,
		browser_user_agent: browserUserAgent,
		browser_version: CHROME_VERSION.split('.')[0] + '.0.0.0',
		os_sdk_version: hostOsSdkVersion(),
		client_build_number: CLIENT_BUILD_NUMBER,
		native_build_number: NATIVE_BUILD_NUMBER,
		client_event_source: null,
	};
}

// Metadata phiên: sinh 1 lần, giữ nguyên suốt phiên chạy.
const SESSION_HEARTBEAT_ID = randomSessionId();
const SESSION_LAUNCH_ID = randomSessionId();
const INSTALLATION_ID = randomSessionId();
const PROPS = buildSuperProperties();
const XSP_BASE64 = Buffer.from(JSON.stringify(PROPS), 'utf8').toString('base64');

/**
 * Trả về header đầy đủ cho 1 request tới Discord.
 *
 * @param {string} token        Authorization token (bắt buộc)
 * @param {object} [opts]
 * @param {boolean} [opts.questRoute] true → thêm Referer quest-home (route quest/ví)
 * @param {boolean} [opts.json]  true → thêm Content-Type: application/json
 * @returns {Record<string,string>}
 */
function discordHeaders(token, opts = {}) {
	const headers = {
		Authorization: token,
		'User-Agent': PROPS.browser_user_agent, // khớp đúng XSP.browser_user_agent
		'X-Super-Properties': XSP_BASE64,
		'X-Discord-Locale': PROPS.system_locale,
		'X-Discord-Timezone': timeZone(),
		'X-Installation-Id': INSTALLATION_ID,
		'X-Debug-Options': 'bugReporterEnabled',
		Accept: '*/*',
		'Accept-Language': `${PROPS.system_locale},en;q=0.9`,
		'X-Discord-Client-Heartbeat-Session-Id': SESSION_HEARTBEAT_ID,
		'X-Discord-Client-Launch-Id': SESSION_LAUNCH_ID,
	};
	if (opts.json) headers['Content-Type'] = 'application/json';
	if (opts.questRoute) headers.Referer = 'https://discord.com/quest-home';
	return headers;
}

/** Chẩn đoán (chỉ dùng khi dev) — KHÔNG chứa token. */
function identitySummary() {
	return {
		clientVersion: CLIENT_VERSION,
		browserUserAgent: PROPS.browser_user_agent,
		xspLen: XSP_BASE64.length,
		locale: PROPS.system_locale,
		timezone: timeZone(),
		os: PROPS.os,
		osVersion: PROPS.os_version,
	};
}

module.exports = {
	CLIENT_VERSION,
	discordUserAgent,
	discordHeaders,
	buildSuperProperties,
	identitySummary,
};
