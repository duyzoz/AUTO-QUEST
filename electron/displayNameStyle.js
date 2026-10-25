'use strict';

/**
 * Waves 48 — KIỂU TÊN HIỂN THỊ (Discord Display Name Styles) — BẢN DÙNG BẢNG THẬT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VÌ SAO PHẢI VIẾT LẠI (bản Waves 47 hỏng ở đâu)
 * ─────────────────────────────────────────────────────────────────────────────
 * Bản 47 đọc style bằng cách chạy JS trong client Discord qua CDP rồi bóc URL
 * font từ `@font-face`. Hai chỗ chết:
 *   1. Không có Discord mở kèm cổng debug → không đọc được GÌ CẢ (kể cả font).
 *   2. Bóc `@font-face` trong `document.styleSheets` — nhưng CSS của Discord
 *      nhét font vào stylesheet riêng, và cách ánh xạ fontId → class nằm ở JS,
 *      nên đường đó mong manh.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BẢN NÀY LẤY DỮ LIỆU TỪ ĐÂU (đã kiểm chứng trực tiếp trên server Discord)
 * ─────────────────────────────────────────────────────────────────────────────
 * a) `https://discord.com/app` → 318 file CSS công khai. Trong đó có đúng 48
 *    khối `@font-face`, bao gồm CẢ 12 font kiểu tên hiển thị. Đây là nguồn file
 *    font thật (xem FONT_FILES bên dưới) — không đoán, không dùng Google Fonts.
 * b) Chunk JS `836545` (nạp khi mở hồ sơ) chứa nguyên hàm dựng biến CSS
 *    `--custom-display-name-styles-*`; chunk `web.js` chứa 2 enum số:
 *      • fontId  (module 559949): CHERRY_BOMB=3 … HEXAGON=17, DEFAULT=11
 *      • effectId(module 508425): SOLID=1 GRADIENT=2 NEON=3 TOON=4 POP=5
 *                                 GLOW=6 PRISM=7 GUMMY=8
 * c) API `/users/@me` trả `display_name_styles: { font_id, effect_id, colors }`
 *    (module 945096 hàm `mT` chuyển đúng shape này sang camelCase).
 *    ⇒ Đọc được style mà KHÔNG cần Discord đang mở.
 *
 * Mọi con số dưới đây đều chép từ dữ liệu thật ở trên. Sai một số là lệch màu.
 */

const fs = require('node:fs');
const path = require('node:path');

/* ═══════════════════════════════════════════════════════════════════════════
   1. BẢNG FONT — fontId → class CSS / tên family / độ đậm / file woff2
   Nguồn: CSS `/assets/327545.93dfcb8f85f7cbc8.css` (class → family + letter-spacing)
          JS  chunk 836545 module 73392 (fontId → class)
          CSS 48 khối @font-face (family → file .woff2)
   ═══════════════════════════════════════════════════════════════════════════ */

const FONTS = {
	3: { className: 'cherryBomb', family: 'Sakura', weight: 400, letterSpacing: '0.04em', file: '33d4f12a85e1f736' },
	4: { className: 'chicle', family: 'Jellybean', weight: 400, letterSpacing: '', file: 'e6f5f44abb520735' },
	6: { className: 'museoModerno', family: 'Modern', weight: 500, letterSpacing: '0.01em', file: 'c560709c3470bb66' },
	7: { className: 'neoCastel', family: 'Medieval', weight: 400, letterSpacing: '0.02em', file: '52b541f86401a5b6' },
	8: { className: 'pixelify', family: '8Bit', weight: 400, letterSpacing: '0.02em', file: '69c735ca5c604de7' },
	10: { className: 'sinistre', family: 'Vampyre', weight: 400, letterSpacing: '0.01em', file: '8f20cb550d739cea' },
	12: { className: 'zillaSlab', family: 'Tempo', weight: 600, letterSpacing: '0.03em', file: '27b34a77ba5d693e' },
	13: { className: 'playpenSans', family: 'Monkey Bars', weight: 700, letterSpacing: '', file: '45ef50dce38a931a' },
	14: { className: 'orbitron', family: 'Mainframe', weight: 700, letterSpacing: '0.03em', file: '4841dace333e9054' },
	15: { className: 'newRocker', family: 'Headbang', weight: 400, letterSpacing: '', file: 'c00df4f25667809b' },
	16: { className: 'kalam', family: 'Journal', weight: 700, letterSpacing: '', file: 'aa59ae54ce7e540a' },
	17: { className: 'pricedown', family: 'Pricedown', weight: 700, letterSpacing: '', file: 'a7bafac436428e6c' },
	/* 11 = DEFAULT (gg sans) — không có file riêng, app dùng font sẵn có. */
};

/** Gốc asset công khai của Discord. */
const ASSET_BASE = 'https://discord.com/assets/';

/* ═══════════════════════════════════════════════════════════════════════════
   2. BẢNG HIỆU ỨNG — effectId → khoá CSS + ngưỡng tương phản Discord dùng
   Nguồn: module 508425 (số) + module 898985 (minContrastRatio)
   ═══════════════════════════════════════════════════════════════════════════ */

const EFFECTS = {
	1: { key: 'solid', minRatio: 3 },
	2: { key: 'gradient', minRatio: 2.5 },
	3: { key: 'neon', minRatio: 3 },
	4: { key: 'toon', minRatio: 3 },
	5: { key: 'pop', minRatio: 3 },
	6: { key: 'gradient', minRatio: 2.5 }, // GLOW dùng chung CSS với GRADIENT
	7: { key: 'prism', minRatio: 2.5 },
	8: { key: 'gummy', minRatio: 3 },
};

/** Số màu tối đa mỗi hiệu ứng (module 945096 hàm `as`). */
const MAX_COLORS = { 1: 1, 2: 2, 3: 1, 4: 1, 5: 1, 6: 2, 7: 5, 8: 4 };

/* ═══════════════════════════════════════════════════════════════════════════
   3. ĐỌC STYLE TỪ ĐỐI TƯỢNG USER DISCORD
   ═══════════════════════════════════════════════════════════════════════════ */

/** 24-bit int → '#rrggbb'. */
function intToHex(n) {
	const v = Number(n);
	if (!Number.isFinite(v)) return '';
	return '#' + (v >>> 0).toString(16).padStart(6, '0').slice(-6);
}

/**
 * Bóc `display_name_styles` từ user object.
 * Chấp nhận CẢ HAI dạng Discord từng dùng:
 *   • lồng:  { display_name_styles: { font_id, effect_id, colors } }
 *   • phẳng: { display_name_font_id, display_name_effect_id, display_name_colors }
 * Trả null nếu user không đặt kiểu (tài khoản không Nitro) — KHÔNG bịa kiểu.
 */
function pickStyle(user) {
	if (!user || typeof user !== 'object') return null;
	const nested = user.display_name_styles || user.displayNameStyles || null;
	let fontId = null;
	let effectId = null;
	let colors = [];

	if (nested && typeof nested === 'object') {
		fontId = nested.font_id ?? nested.fontId ?? null;
		effectId = nested.effect_id ?? nested.effectId ?? null;
		colors = Array.isArray(nested.colors) ? nested.colors : [];
	} else if (user.display_name_font_id != null || user.display_name_effect_id != null) {
		fontId = user.display_name_font_id ?? null;
		effectId = user.display_name_effect_id ?? null;
		colors = Array.isArray(user.display_name_colors) ? user.display_name_colors : [];
	}
	if (fontId == null && effectId == null) return null;

	return {
		fontId: Number(fontId) || 0,
		effectId: Number(effectId) || 0,
		colors: colors.map((c) => (typeof c === 'number' ? intToHex(c) : String(c))).filter(Boolean),
	};
}

/**
 * Dựng descriptor hoàn chỉnh từ style thô.
 * KHÔNG tự tính màu phụ ở đây — renderer lo phần đó (nó biết nền thật của app).
 */
function buildDescriptor(style, displayName) {
	if (!style) return { ok: false, error: 'tài khoản không đặt kiểu tên hiển thị' };
	const effect = EFFECTS[style.effectId] || EFFECTS[1];
	const font = FONTS[style.fontId] || null;
	const maxN = MAX_COLORS[style.effectId] || 1;
	const colors = (style.colors || []).slice(0, maxN);

	return {
		ok: true,
		at: Date.now(),
		text: String(displayName || ''),
		font: font
			? {
					id: style.fontId,
					className: font.className,
					family: font.family,
					weight: font.weight,
					letterSpacing: font.letterSpacing,
					hasFile: !!font.file,
				}
			: { id: style.fontId, className: '', family: '', weight: 0, letterSpacing: '', hasFile: false },
		effect: effect.key,
		effectId: style.effectId,
		minRatio: effect.minRatio,
		colors,
		raw: style,
	};
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. TẢI FILE FONT THẬT TỪ SERVER DISCORD (cache lại)
   ═══════════════════════════════════════════════════════════════════════════ */

function cacheDir(app) {
	const d = path.join(app.getPath('userData'), 'display-name-style');
	fs.mkdirSync(d, { recursive: true });
	return d;
}

function stylePath(app) {
	return path.join(cacheDir(app), 'style.json');
}

/** Đọc style đã cache — khoá theo user id để không lẫn tài khoản. */
function readCachedStyle(app, userId) {
	try {
		const all = JSON.parse(fs.readFileSync(stylePath(app), 'utf8'));
		const key = String(userId || all.__last || '');
		return key && all[key] ? all[key] : null;
	} catch {
		return null;
	}
}

function writeCachedStyle(app, userId, style) {
	try {
		let all = {};
		try {
			all = JSON.parse(fs.readFileSync(stylePath(app), 'utf8')) || {};
		} catch {
			all = {};
		}
		const key = String(userId || '');
		if (!key) return false;
		all[key] = style;
		all.__last = key;
		fs.writeFileSync(stylePath(app), JSON.stringify(all, null, 2), 'utf8');
		return true;
	} catch {
		return false;
	}
}

/** Đường dẫn cache file font, tên theo hash file của Discord. */
function fontCachePath(app, file) {
	return path.join(cacheDir(app), 'font-' + String(file).replace(/[^0-9a-z]/gi, '') + '.woff2');
}

/**
 * Bảo đảm có file font của `family` dưới dạng data URL.
 * Tra bảng thật → tải từ `https://discord.com/assets/<hash>.woff2` → cache.
 * Trả `{ ok, dataUrl, bytes, url }`.
 */
async function ensureFontDataUrl(app, family) {
	const fam = String(family || '').trim();
	const entry = Object.values(FONTS).find((f) => f.family.toLowerCase() === fam.toLowerCase());
	if (!entry || !entry.file) return { ok: false, error: 'không có file font cho "' + fam + '"' };

	const url = ASSET_BASE + entry.file + '.woff2';
	const p = fontCachePath(app, entry.file);

	let buf = null;
	try {
		if (fs.existsSync(p)) buf = fs.readFileSync(p);
	} catch {
		buf = null;
	}

	if (!buf || buf.length < 100) {
		try {
			const res = await fetch(url, {
				headers: {
					// Discord chặn UA lạ ở một số asset → gửi UA trình duyệt.
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
					Accept: 'font/woff2,*/*',
				},
				signal: AbortSignal.timeout(15000),
			});
			if (!res.ok) return { ok: false, error: 'tải font lỗi HTTP ' + res.status, url };
			buf = Buffer.from(await res.arrayBuffer());
			if (buf.length < 100) return { ok: false, error: 'file font rỗng', url };
			// Kiểm tra chữ ký wOF2 để không cache rác HTML.
			if (buf.slice(0, 4).toString('ascii') !== 'wOF2') {
				return { ok: false, error: 'không phải file woff2', url };
			}
			fs.writeFileSync(p, buf);
		} catch (e) {
			return { ok: false, error: 'không tải được font: ' + e.message, url };
		}
	}

	return {
		ok: true,
		dataUrl: 'data:font/woff2;base64,' + buf.toString('base64'),
		bytes: buf.length,
		url,
		family: entry.family,
		weight: entry.weight,
	};
}

module.exports = {
	FONTS,
	EFFECTS,
	pickStyle,
	buildDescriptor,
	readCachedStyle,
	writeCachedStyle,
	ensureFontDataUrl,
	intToHex,
};
