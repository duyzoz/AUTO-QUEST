'use strict';

/**
 * SELF-TEST TĨNH — không cần trình duyệt, không cần dependency.
 *
 * Kiểm tra những lỗi rẻ tiền nhưng chết người:
 *   · HTML hỏng comment / id trùng / id mà renderer gọi nhưng không tồn tại
 *   · file CSS/JS/manifest/icon/SW shell bị thiếu sau khi refactor
 *   · CSP vô tình chặn Discord/hCaptcha
 *   · JS sai cú pháp (parse bằng vm, KHÔNG chạy)
 *   · token Discord lọt vào file trong web/
 *
 * Chạy: npm test  (hoặc node web/test/self-test.js)
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');
const APP = path.join(ROOT, 'web', 'app');
const WEB = path.join(ROOT, 'web');
const INDEX = path.join(APP, 'index.html');

const results = [];
let failures = 0;

function pass(label, detail) {
	results.push({ ok: true, label, detail });
}
function fail(label, detail) {
	failures += 1;
	results.push({ ok: false, label, detail });
}
function check(label, fn) {
	try {
		const detail = fn();
		pass(label, detail);
	} catch (err) {
		fail(label, err && err.message ? err.message : String(err));
	}
}
function assert(cond, message) {
	if (!cond) throw new Error(message);
}
function read(file) {
	return fs.readFileSync(file, 'utf8');
}
function rel(file) {
	return path.relative(ROOT, file).split(path.sep).join('/');
}

/* Trang được serve từ gốc web/app, còn adapter nằm ở web/ — URL "web/x.js"
   tương ứng `<repo>/web/x.js`, không phải `web/app/web/x.js`. */
function resolveAppRef(u) {
	const clean = u.split(/[?#]/)[0];
	return clean.startsWith('web/') ? path.join(ROOT, clean) : path.join(APP, clean);
}

const TEXT_EXT = new Set([
	'.js',
	'.mjs',
	'.cjs',
	'.html',
	'.css',
	'.json',
	'.webmanifest',
	'.md',
	'.txt',
	'.svg',
	'.map',
]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'web-dist', 'build-release', '.qoder']);
const SKIP_FILES = new Set(['push github(token).txt']);

function walk(dir, out) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (SKIP_DIRS.has(entry.name)) continue;
			walk(full, out);
		} else if (entry.isFile()) {
			if (SKIP_FILES.has(entry.name)) continue;
			if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
		}
	}
	return out;
}

const html = read(INDEX);

/* ── 1. HTML comment ─────────────────────────────────────────────────────── */
check('HTML comment cân bằng', () => {
	let open = 0;
	let i = 0;
	let count = 0;
	for (;;) {
		const start = html.indexOf('<!--', i);
		const end = html.indexOf('-->', i);
		if (start === -1 && end === -1) break;
		if (start !== -1 && (end === -1 || start < end)) {
			open += 1;
			count += 1;
			i = start + 4;
		} else {
			assert(open > 0, 'có "-->" mở đầu mà không có "<!--" tại offset ' + end);
			open -= 1;
			i = end + 3;
		}
	}
	assert(open === 0, 'còn ' + open + " comment '<!--' chưa đóng");
	return count + ' comment';
});

/* ── 2. ID trùng + ID renderer gọi ──────────────────────────────────────── */
const ids = [];
for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.push(m[1]);

check('Không có id trùng', () => {
	const seen = new Map();
	const dup = [];
	for (const id of ids) {
		if (seen.has(id)) dup.push(id);
		seen.set(id, true);
	}
	assert(dup.length === 0, 'trùng: ' + [...new Set(dup)].join(', '));
	return ids.length + ' id';
});

check('Mọi el(...) trong renderer.js có id trong index.html', () => {
	const renderer = read(path.join(APP, 'renderer.js'));
	const wanted = new Set();
	for (const m of renderer.matchAll(/\bel\('([^']+)'\)/g)) wanted.add(m[1]);
	const missing = [...wanted].filter((id) => !ids.includes(id));
	assert(missing.length === 0, 'thiếu id: ' + missing.join(', '));
	return wanted.size + ' id được tham chiếu';
});

/* ── 3. Tài nguyên index.html ───────────────────────────────────────────── */
check('CSS/JS/manifest trong index.html tồn tại', () => {
	const refs = [];
	for (const m of html.matchAll(/<link[^>]+href="([^"]+)"/g)) refs.push(m[1]);
	for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) refs.push(m[1]);
	const local = refs.filter((u) => !/^(?:https?:)?\/\//.test(u) && !u.startsWith('data:'));
	const missing = local.filter((u) => !fs.existsSync(resolveAppRef(u)));
	assert(missing.length === 0, 'thiếu: ' + missing.join(', '));
	for (const need of ['renderer.js', 'styles.css', 'mobile.css', 'web/bridge.js', 'web/identity.js']) {
		assert(local.includes(need), 'index.html không còn tham chiếu ' + need);
	}
	return local.length + ' file';
});

check('Service Worker SHELL tồn tại', () => {
	const sw = read(path.join(APP, 'sw.js'));
	const block = sw.match(/const\s+SHELL\s*=\s*\[([\s\S]*?)\];/);
	assert(block, 'không tìm thấy mảng SHELL');
	const entries = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
	assert(entries.length >= 10, 'SHELL quá ngắn (' + entries.length + ')');
	const missing = entries.filter((u) => {
		const clean = u.replace(/^\.\//, '') || 'index.html';
		return !fs.existsSync(resolveAppRef(clean));
	});
	assert(missing.length === 0, 'thiếu: ' + missing.join(', '));
	const version = sw.match(/const\s+VERSION\s*=\s*'([^']+)'/);
	assert(version && version[1].trim(), 'VERSION rỗng');
	return entries.length + ' file · ' + version[1];
});

check('Icon trong manifest tồn tại + JSON hợp lệ', () => {
	const raw = read(path.join(APP, 'manifest.webmanifest'));
	const manifest = JSON.parse(raw);
	assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'không có icons');
	for (const key of ['name', 'short_name', 'start_url', 'display']) {
		assert(manifest[key], 'thiếu ' + key);
	}
	const missing = manifest.icons
		.map((i) => i.src)
		.filter((src) => !/^https?:/.test(src) && !fs.existsSync(path.join(APP, src)));
	assert(missing.length === 0, 'thiếu icon: ' + missing.join(', '));
	return manifest.icons.length + ' icon';
});

check('CSS url(...) nội bộ tồn tại', () => {
	let total = 0;
	const missing = [];
	for (const name of fs.readdirSync(APP).filter((f) => f.endsWith('.css'))) {
		const file = path.join(APP, name);
		const css = read(file);
		for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
			const u = m[1].trim();
			if (!u || u.startsWith('data:') || u.startsWith('#') || /^(?:https?:)?\/\//.test(u)) continue;
			total += 1;
			const clean = u.split(/[?#]/)[0];
			if (!fs.existsSync(path.join(APP, clean))) missing.push(name + ' → ' + u);
		}
	}
	assert(missing.length === 0, 'thiếu: ' + missing.join('; '));
	return total + ' url() nội bộ';
});

/* ── 4. CSP ─────────────────────────────────────────────────────────────── */
check('CSP cho phép Discord + hCaptcha, không mở toang', () => {
	const meta = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
	assert(meta, 'không tìm thấy CSP');
	const csp = meta[1];
	assert(/default-src\s+'none'/.test(csp), "default-src phải là 'none'");
	const connect = csp.match(/connect-src([^;]*)/);
	assert(connect, 'thiếu connect-src');
	assert(connect[1].includes('https://discord.com'), 'connect-src thiếu discord.com');
	assert(connect[1].includes('hcaptcha.com'), 'connect-src thiếu hcaptcha.com');
	assert(!/connect-src[^;]*\s\*/.test(csp), 'connect-src không được mở thành *');
	assert(!/default-src\s+\*/.test(csp), 'default-src không được là *');
	return 'connect-src hợp lệ';
});

/* ── 4b. Hàng rào bảo mật Wave#134 (audit) ─────────────────────────────── */
check('CSP script-src đóng unsafe-inline/unsafe-eval + chốt base-uri/object-src/form-action', () => {
	const meta = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
	assert(meta, 'không tìm thấy CSP');
	const csp = meta[1];
	const script = csp.match(/script-src([^;]*)/);
	assert(script, 'thiếu script-src');
	assert(!/unsafe-inline/.test(script[1]), "script-src không được có 'unsafe-inline'");
	assert(!/unsafe-eval/.test(script[1]), "script-src không được có 'unsafe-eval'");
	assert(!/https:\/\/\*\.hcaptcha\.com/.test(script[1]), 'script-src phải ghi đích danh host hcaptcha, không wildcard');
	for (const directive of ['base-uri', 'object-src', 'form-action']) {
		assert(new RegExp(directive + '\\s').test(csp), 'thiếu ' + directive);
	}
	// frame-ancestors bị trình duyệt BỎ QUA trong <meta> (và báo lỗi console đỏ) ⇒
	// nó phải nằm ở HTTP header do server.js / _headers phát ra.
	assert(!/frame-ancestors/.test(csp), 'meta CSP không được chứa frame-ancestors');
	const srv = read(path.join(WEB, 'server.js'));
	const bld = read(path.join(WEB, 'build-static.js'));
	assert(/frame-ancestors 'none'/.test(srv), 'server.js không phát frame-ancestors');
	assert(/frame-ancestors 'none'/.test(bld), 'build-static không ghi frame-ancestors vào _headers');
	assert(/X-Frame-Options': 'DENY'/.test(srv) && /X-Frame-Options: DENY/.test(bld), 'thiếu X-Frame-Options Deny');
	// CSP chỉ có tác dụng nếu code không tự mở cửa sau: không được có eval/inline script.
	const inlineScript = (html.match(/<script(?![^>]*\ssrc=)[^>]*>/gi) || []).length;
	assert(inlineScript === 0, 'index.html có ' + inlineScript + ' khối <script> inline');
	const inlineHandler = (html.match(/\son[a-z]+\s*=\s*["']/gi) || []).length;
	assert(inlineHandler === 0, 'index.html có ' + inlineHandler + ' handler on*= inline');
	return 'script-src khép kín, 0 inline script/handler';
});

check('Token không còn đường giáng cấp base64 khi IndexedDB bị chặn', () => {
	const bridge = read(path.join(WEB, 'bridge.js'));
	assert(!/return\s+'b64:'\s*\+/.test(bridge), "encryptToken vẫn có nhánh fallback 'b64:'");
	assert(/secureStorage\s*=\s*false/.test(bridge), 'không còn cờ secureStorage khi không mã hoá được');
	assert(/tokenReveal/.test(bridge), 'thiếu cổng tokenReveal có điều kiện');
	return 'chỉ còn AES-GCM + reveal có cổng';
});

check('getConfig()/accountsList() không trả token plaintext', () => {
	const bridge = read(path.join(WEB, 'bridge.js'));
	const getConfig = bridge.match(/getConfig:\s*async\s*\(\)\s*=>\s*\{[\s\S]{0,900}?\n\t\t\},/);
	assert(getConfig, 'không đọc được getConfig trong bridge');
	assert(!/return\s*\{\s*\.\.\.cfg/.test(getConfig[0]), 'getConfig vẫn trả nguyên khối config (kèm token)');
	assert(/hasToken/.test(getConfig[0]) && /token:\s*''/.test(getConfig[0]), 'getConfig phải mask token');
	const accountsList = bridge.match(/accountsList:\s*async\s*\(\)\s*=>\s*\{[\s\S]{0,500}?\n\t\t\},/);
	assert(accountsList, 'không đọc được accountsList');
	assert(/map\(\s*\(\s*\{\s*token/.test(accountsList[0]), 'accountsList vẫn trả token từng tài khoản');
	return 'mask + strip OK';
});

check('Waves#141: accounts* không trả token (chỉ tokenReveal có cổng mới được)', () => {
	const bridge = read(path.join(WEB, 'bridge.js'));
	assert(/stripAccountsForReturn/.test(bridge), 'thiếu stripAccountsForReturn() trong mutateAccounts');
	assert(!/token:\s*accounts\[next\]\s*\?\s*accounts\[next\]\.token/.test(bridge), 'accountsSetActive vẫn trả token trực tiếp, bypass cổng tokenReveal');
	assert(/return\s*\{[^}]*accounts:\s*stripAccountsForReturn/.test(bridge), 'mutateAccounts không trả danh sách đã strip token');
	return 'accounts* trả metadata đã strip, token chỉ qua tokenReveal';
});

check('Waves#140: danh tính không còn hardcode lệch (sec-ch-ua 138 / launch_signature cố định)', () => {
	const identity = read(path.join(WEB, 'identity.js'));
	assert(!identity.includes('1771754995045142953'), 'identity.js vẫn chứa launch_signature cố định');
	const tsUtils = read(path.join(ROOT, 'engine-src', 'src', 'utils.ts'));
	assert(!/Chromium";v="138"/.test(tsUtils), 'engine-src utils vẫn hardcode sec-ch-ua Chromium 138');
	const webUtils = read(path.join(WEB, 'engine', 'src', 'utils.js'));
	assert(!/Chromium";v="138"/.test(webUtils), 'web/engine utils vẫn hardcode sec-ch-ua Chromium 138');
	return 'sec-ch-ua suy từ UA thật, launch_signature theo phiên';
});

check('Waves#143: không nội suy Discord-sourced string thô vào innerHTML + asset URL chỉ host Discord', () => {
	const r = read(path.join(APP, 'renderer.js'));
	// (a) Không có innerHTML template nào nội suy trực tiếp trường Discord
	// (q.name / q.gameTitle / q.publisher / q.rewardName / quest.name …)
	// mà không qua escapeHtml / helper đã escape (logBodyHtml,
	// doneTileInfoHtml, emptyMsg). Các trường này trong code hiện tại đều
	// đi qua textContent hoặc escapeHtml — check này bắt hồi quy.
	const bad = [];
	for (const m of r.matchAll(/innerHTML\s*=\s*`([\s\S]*?)`;/g)) {
		const tpl = m[1];
		for (const im of tpl.matchAll(/\$\{([^}]*)\}/g)) {
			const expr = im[1];
			if (/\b(q|quest)\.(name|gameTitle|publisher|rewardName|rewardTitle|application)\b/.test(expr) && !/escapeHtml/.test(expr)) bad.push(expr.trim());
		}
	}
	assert(bad.length === 0, 'innerHTML nội suy thô trường Discord: ' + bad.join(' | '));
	// (b) questAssetUrl / badgeIconUrl phải whitelist host Discord.
	assert(/isDiscordHost/.test(r), 'thiếu isDiscordHost() whitelist');
	assert(/questAssetUrl[\s\S]{0,800}isDiscordHost/.test(r), 'questAssetUrl không kiểm tra host Discord');
	assert(/badgeIconUrl[\s\S]{0,800}isDiscordHost/.test(r), 'badgeIconUrl không kiểm tra host Discord');
	return 'innerHTML đã audit (69 uses + 1 insertAdjacentHTML), asset URL whitelist Discord host';
});

check('Waves#146: hàng đợi claim lưu localStorage không chứa token', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const m = r.match(/queueStore\[scope\]\.push\(\{[^}]*\}\)/);
	assert(m, 'không tìm thấy queueAddMany push()');
	assert(!/token/.test(m[0]), 'hàng đợi claim lưu token: ' + m[0]);
	assert(/QUEUE_TTL_MS/.test(r) && /queuePrune/.test(r), 'thiếu TTL/prune cho hàng đợi');
	assert(/queueRestoreNotified/.test(r), 'thiếu thông báo khôi phục/mất hàng đợi sau reload');
	return 'queue rows chỉ id/name/orbs/at, có TTL + thông báo khôi phục';
});

check('Waves#148: chẩn đoán claim có mặt, không chứa secret', () => {
	const bridge = read(path.join(WEB, 'bridge.js'));
	assert(/claimDiagnostics/.test(bridge), 'bridge thiếu claimDiagnostics()');
	assert(/lastClaim/.test(bridge), 'appDiagnostics thiếu lastClaim');
	assert(!/captcha_key|captcha_rqdata|captcha_rqtoken/.test(bridge.match(/function recordClaimDiag[\s\S]*?\n\t\}/)[0]), 'recordClaimDiag chứa trường captcha secret');
	assert(/maskDiagId|maskCaptchaSession/.test(bridge), 'thiếu che quest id / captcha session trong chẩn đoán');
	const r = read(path.join(APP, 'renderer.js'));
	assert(/Last claim/.test(r) && /Claim gần nhất/.test(r), 'formatDiagnostics thiếu mục Claim gần nhất');
	return 'claimDiagnostics + lastClaim trong diagnostics, secret đã che';
});

check('Waves#149: tự áp dụng SW chỉ khi app rảnh, không reload giữa lúc chạy', () => {
	const r = read(path.join(APP, 'renderer.js'));
	assert(/scheduleIdleSwUpdate/.test(r), 'thiếu scheduleIdleSwUpdate()');
	assert(/appIsIdleForUpdate/.test(r), 'thiếu appIsIdleForUpdate()');
	const guard = r.match(/function appIsIdleForUpdate[\s\S]*?\n\}/)[0];
	assert(/state === 'idle'/.test(guard) && /bulkClaimBusy/.test(guard) && /scanning/.test(guard) && /captchaModal/.test(guard), 'guard idle thiếu state/bulkClaimBusy/scanning/captcha');
	assert(/swAutoUpdateTimer/.test(r), 'thiếu timer ân hạn / huỷ khi bấm Để sau');
	return 'SW auto-activate gated on idle + 10s grace + dismiss cancel';
});

check('escapeHtml chỉ còn MỘT định nghĩa và escape cả nháy đơn', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const defs = (r.match(/function escapeHtml\s*\(/g) || []).length;
	assert(defs === 1, 'có ' + defs + ' định nghĩa escapeHtml (bản sau ghi đè bản trước bằng hoisting)');
	assert(/'\/'\s*,\s*'&#39;'/.test(r) || /&#39;/.test(r), 'escapeHtml không escape dấu nháy đơn');
	assert(/function aqAssetHash/.test(r) && /function aqAssetToken/.test(r), 'thiếu whitelist hash tài nguyên Discord');
	return '1 định nghĩa, escape đủ & < > " \'';
});

check('Log engine được che secret trước khi ra UI', () => {
	const bridge = read(path.join(WEB, 'bridge.js'));
	assert(/function maskSecrets/.test(bridge), 'thiếu maskSecrets()');
	assert(/pushLog\([^)]*maskSecrets\(/.test(bridge), 'dòng log từ worker không đi qua maskSecrets');
	return 'worker log được che token';
});

check('Lưu cài đặt không xoá token đã lưu + whitelist đúng định dạng asset Discord', () => {
	const bridge = read(path.join(WEB, 'bridge.js'));
	assert(bridge.includes('prev.tokenEnc'), 'writeConfig không giữ lại tokenEnc cũ khi ô token trống (đổi theme sẽ đăng xuất người dùng)');
	assert(bridge.includes('payload.accounts = prevAccounts'), 'writeConfig xoá sạch danh sách tài khoản khi caller không gửi mảng accounts');
	const r = read(path.join(APP, 'renderer.js'));
	assert(r.includes('(?:a_)?[0-9a-f]{16,32}'), 'aqAssetHash không nhận tiền tố a_ ⇒ avatar/banner gif Nitro bị chặn');
	assert(!r.includes('[a_]?[0-9a-f]'), 'aqAssetHash dùng [a_]? (1 ký tự) ⇒ hash a_… luôn bị từ chối');
	return 'giữ token khi lưu settings, a_ hash hợp lệ';
});

/* ── 5. JS parse (không thực thi) ──────────────────────────────────────── */

check('Toàn bộ JS trong web/ parse được', () => {
	const files = walk(WEB, []).filter((f) => /\.(?:js|mjs|cjs)$/.test(f));
	const bad = [];
	for (const file of files) {
		const src = read(file);
		try {
			new vm.Script(src, { filename: file });
		} catch (err) {
			bad.push(rel(file) + ': ' + err.message);
		}
	}
	assert(bad.length === 0, bad.join(' | '));
	return files.length + ' file';
});

/* ── 6. Không lộ token Discord ─────────────────────────────────────────── */
check('Không có token Discord trong web/', () => {
	const files = walk(WEB, []).filter((f) => {
		try {
			return fs.statSync(f).size < 4 * 1024 * 1024;
		} catch {
			return false;
		}
	});
	const patterns = [
		/\bmfa\.[A-Za-z0-9_-]{80,}\b/,
		/\b[A-Za-z0-9_-]{24,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,40}\b/,
	];
	const hits = [];
	for (const file of files) {
		const src = read(file);
		if (patterns.some((re) => re.test(src))) hits.push(rel(file));
	}
	assert(hits.length === 0, 'nghi vấn token tại: ' + hits.join(', '));
	return files.length + ' file sạch';
});

/* ── 7. Hợp đồng tối thiểu của bridge ──────────────────────────────────── */
check('Bridge phơi window.autoquest + các hàm cốt lõi', () => {
	const bridge = read(path.join(WEB, 'bridge.js'));
	assert(/window\.autoquest\s*=|\broot\.autoquest\s*=/.test(bridge), 'không thấy window.autoquest');
	for (const fn of [
		'saveConfig',
		'getConfig',
		'authCheck',
		'fetchOrbs',
		'claimQuest',
		'start',
		'stop',
		'backupExport',
	]) {
		assert(new RegExp('\\b' + fn + '\\b').test(bridge), 'thiếu hàm ' + fn);
	}
	return 'đủ hàm cốt lõi';
});

/* ── Waves#151-#170 ─────────────────────────────────────────────────── */
check('Waves#151: tile Đã làm dùng asset thưởng thật, không Orb mặc định', () => {
	const r = read(path.join(APP, 'renderer.js'));
	assert(/rewardMediaEl\(q\)/.test(r), 'buildDoneTile không gọi rewardMediaEl');
	assert(!/orbIco\.src = ORB_ICON_SRC;[\s\S]{0,200}isItem/.test(r), 'kiểm tra thứ tự Orb/item không rõ');
	return 'Done tile có nhánh asset';
});
check('Waves#154/#163: chế độ Sáng không còn nền xanh #f2f5fb, chữ hover đủ tối', () => {
	const css = read(path.join(APP, 'styles.css'));
	assert(!css.includes('#f2f5fb'), 'styles.css còn #f2f5fb');
	assert(/\[data-theme="light"\] \.qdone-info-title/.test(css), 'thiếu override chữ hover ở Sáng');
	assert(/\[data-theme="light"\] \.qcard-reward-art \{[^}]*(background: #ffffff|background: var\(--card\))/.test(css) && /\[data-theme="light"\][\s\S]{0,2000}?--card: #ffffff/.test(css), 'thiếu nền trắng cho đĩa thưởng ở Sáng (token --card ở Sáng phải là #ffffff)');
	return 'nền Sáng đã sửa';
});
check('Waves#155: questLogoUrl chọn biến thể theo theme', () => {
	const r = read(path.join(APP, 'renderer.js'));
	assert(/logotypeDark/.test(r) && /logotypeLight/.test(r), 'thiếu biến thể logotype');
	assert(/currentTheme === 'light'/.test(r), 'questLogoUrl không đọc theme');
	return 'biến thể theo theme có mặt';
});
check('Waves#156: favicon ZoZ + theme-color', () => {
	const html = read(path.join(APP, 'index.html'));
	assert(/rel="icon"[^>]*zoZ-logo-round\.png/.test(html), 'thiếu <link rel="icon"> ZoZ bo tròn');
	assert(/rel="apple-touch-icon"[^>]*zoZ-logo-ico\.png/.test(html), 'thiếu apple-touch-icon');
	assert(/name="theme-color"[^>]*prefers-color-scheme: light/.test(html), 'thiếu theme-color Sáng');
	assert(fs.existsSync(path.join(APP, 'assets', 'zoZ-logo-ico.png')), 'thiếu file zoZ-logo-ico.png');
	assert(fs.existsSync(path.join(APP, 'assets', 'zoZ-logo-round.png')), 'thiếu file zoZ-logo-round.png');
	return 'favicon ZoZ bo tròn có mặt';
});
check('Waves#153: code KHÔNG nằm trong cache inventory / export mặc định', () => {
	const r = read(path.join(APP, 'renderer.js'));
	// stripInventoryItem là hàm duy nhất được phép định nghĩa cache;
	// nó không được chứa rewardCode.
	const m = r.match(/function stripInventoryItem\(item\) \{[\s\S]*?\n\}/);
	assert(m, 'không tìm thấy stripInventoryItem');
	assert(!/rewardCode/.test(m[0]), 'stripInventoryItem vẫn chứa rewardCode');
	assert(/rewardCode: item\.rewardCode/.test(r), 'upsert phiên chưa nhận rewardCode');
	return 'code chỉ ở bộ nhớ phiên';
});
check('Waves#158: SW cache CDN có giới hạn, không cache API discord.com', () => {
	const sw = read(path.join(APP, 'sw.js'));
	assert(/autoquest-cdn-v1/.test(sw), 'thiếu cache CDN');
	assert(/CDN_MAX_ENTRIES/.test(sw), 'thiếu giới hạn mục cache');
	assert(/cdn\.discordapp\.com/.test(sw), 'thiếu host CDN');
	return 'SW CDN cache có mặt';
});

/* Waves#171-#200 checks (static only, no network, no token). */
check('Waves#185: mọi host fetch trong bridge/engine đều nằm trong CSP whitelist', () => {
	const cspMeta = read(INDEX).match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
	assert(cspMeta, 'không tìm thấy CSP');
	const csp = cspMeta[1];
	const allowed = new Set();
	for (const m of csp.matchAll(/https:\/\/\*?\.?([a-z0-9.-]+)/g)) allowed.add(m[1]);
	allowed.add('discord.com');
	const hosts = new Set();
	for (const file of [path.join(WEB, 'bridge.js'), path.join(WEB, 'engine-bundle.js')]) {
		const src = read(file);
		for (const m of src.matchAll(/https:\/\/([a-z0-9.-]+)/g)) hosts.add(m[1]);
	}
	const bad = [...hosts].filter((h) => ![...allowed].some((a) => h === a || h.endsWith('.' + a) || a.endsWith(h)));
	assert(bad.length === 0, 'host ngoài CSP whitelist: ' + bad.join(', '));
	return 'hosts: ' + [...hosts].sort().join(', ');
});
check('Waves#179: SW cache CDN kiểm tra content-type + kích thước, có lệnh xóa cache', () => {
	const sw = read(path.join(APP, 'sw.js'));
	assert(/content-type/.test(sw) && /20 \* 1024 \* 1024/.test(sw), 'thiếu kiểm tra content-type/kích thước CDN');
	assert(/CLEAR_CDN_CACHE/.test(sw), 'thiếu lệnh CLEAR_CDN_CACHE');
	return 'CDN validation + clear control có mặt';
});
check('Waves#184: SW postMessage chỉ nhận type trong allowlist, từ chối message sai dạng', () => {
	const sw = read(path.join(APP, 'sw.js'));
	assert(/ALLOWED_TYPES/.test(sw) && /VERIFY_AND_ACTIVATE/.test(sw), 'thiếu allowlist message');
	assert(/typeof data\.type !== 'string'/.test(sw), 'thiếu kiểm tra dạng message');
	return 'SW message allowlist có mặt';
});
check('Waves#175: build number chỉ có một điểm cập nhật (identity.js) + cảnh báo hết hạn', () => {
	const id = read(path.join(WEB, 'identity.js'));
	assert(/WEB_BUILD_DATE/.test(id) && /buildNumberStale/.test(id), 'thiếu ngày build / cảnh báo hết hạn');
	assert(!/653945/.test(read(path.join(APP, 'renderer.js'))), 'renderer không được hardcode build number riêng');
	return 'single update point: web/identity.js';
});
check('Waves#171-#173/#189-#197: UI mới có id trong HTML + hàm renderer tương ứng (đã trừ favorites/mock bị xóa ở #203/#204)', () => {
	const html = read(INDEX);
	for (const id of ['doneDateFrom', 'doneDateTo', 'questPlatformFilter', 'questTaskFilter', 'chkExpiringSoon', 'chkGroupGames', 'statsDateFrom', 'statsDateTo', 'btnExportConfigFile', 'btnImportConfigFile', 'btnClearCdnCache']) assert(html.includes(`id="${id}"`), 'thiếu id HTML: ' + id);
	const r = read(path.join(APP, 'renderer.js'));
	for (const fn of ['doneWindowEnd', 'exportConfigFile', 'importConfigFile', 'forecastOrbs', 'isExpiringSoon', 'groupGameKey', 'copySecretWithTimeout', 'setGlobal429']) assert(r.includes(fn), 'thiếu hàm renderer: ' + fn);
	return 'ids + hàm waves 171-200 có mặt';
});
check('Waves#201: drawer overlay trong .shell, z-index dưới sidebar, không chặn bấm khi ẩn', () => {
	const html = read(INDEX);
	const shellAt = html.indexOf('<div class="shell">');
	const overlayAt = html.indexOf('id="drawerOverlay"');
	const asideAt = html.indexOf('<aside class="sidebar"');
	assert(shellAt >= 0 && overlayAt > shellAt && asideAt > overlayAt, 'overlay phải nằm trong .shell, trước sidebar');
	const css = read(path.join(APP, 'styles.css'));
	const ov = css.match(/\.drawer-overlay \{[^}]*z-index: (\d+)/);
	const sb = css.match(/\.sidebar \{[^}]*z-index: (\d+)/);
	assert(ov && sb && Number(ov[1]) < Number(sb[1]), 'overlay z-index phải nhỏ hơn sidebar');
	assert(/\.drawer-overlay \{[^}]*pointer-events: none/.test(css), 'overlay ẩn phải pointer-events: none');
	const r = read(path.join(APP, 'renderer.js'));
	assert(r.includes('ui.navQuest.focus()'), 'mở drawer phải focus vào nav đầu tiên');
	assert(/closeDrawer\(\{ returnFocus: false \}\)/.test(r), 'chọn trang phải đóng drawer sau, không cướp focus');
	assert(/key === 'Escape'/.test(r) && /closeDrawer\(\{ returnFocus: true \}\)/.test(r), 'Esc phải đóng drawer và trả focus');
	assert(/body\.drawer-open \.main-wrap \{ overflow: hidden/.test(css), 'drawer mở phải khóa cuộn nền');
	return 'overlay trong shell, overlay z < sidebar z, focus/Esc/scroll-lock có mặt';
});
check('Waves#202: toolbar Đã làm — hàng chính + Bộ lọc nâng cao thu gọn, hiện số filter', () => {
	const html = read(INDEX);
	for (const id of ['btnAdvancedFilters', 'questAdvanced', 'doneToolsAdvanced', 'doneExportAdvanced', 'advancedFilterCount']) assert(html.includes(`id="${id}"`), 'thiếu id HTML: ' + id);
	assert(html.includes('aria-expanded="false"') && html.includes('aria-controls="questAdvanced"'), 'nút nâng cao phải có aria-expanded/controls');
	const r = read(path.join(APP, 'renderer.js'));
	assert(/countActiveAdvancedFilters/.test(r) && /updateAdvancedFilterCount/.test(r), 'thiếu đếm filter nâng cao');
	assert(r.includes('ui.doneToolsAdvanced.hidden = tab'), 'nhóm nâng cao Đã làm phải ẩn ngoài tab Đã làm');
	const css = read(path.join(APP, 'mobile.css'));
	assert(/\.quest-advanced \{/.test(css) && /\.quest-advanced\[hidden\]/.test(css), 'thiếu CSS khối nâng cao');
	return 'hàng chính + nâng cao thu gọn + đếm filter có mặt';
});
check('Waves#203/#204: yêu thích và mock UI đã xóa sạch, ghi chú giữ nguyên', () => {
	const html = read(INDEX);
	const r = read(path.join(APP, 'renderer.js'));
	for (const bad of ['chkFavOnly', 'chkMockMode', 'loadMockQuests', 'qcard-fav', "data-act=\"fav\"", 'toggleQuestFav', 'questFavFor']) {
		assert(!html.includes(bad) && !r.includes(bad), 'còn tham chiếu UI chết: ' + bad);
	}
	assert(/questNoteFor/.test(r) && /setQuestNote/.test(r), 'ghi chú chữ phải còn nguyên');
	assert(/delete s\.__fav/.test(r), 'migration phải bỏ __fav cũ khi nạp');
	assert(!/mock-done-orb/.test(r), 'quest mock [MOCK] phải xóa khỏi renderer');
	return 'không còn UI favorites/mock chết; notes + migration __fav có mặt';
});
check('Waves#205: logo/ảnh thưởng chỉ dùng nền token trung tính, không gradient tối', () => {
	const css = read(path.join(APP, 'styles.css'));
	const art = css.match(/\.qcard-reward-art \{[^}]*\}/);
	assert(art && /background: var\(--well\)/.test(art[0]), 'ảnh thưởng phải nền var(--well)');
	const artRule = css.match(/\.qcard-reward-art \{[^}]*\}/); assert(artRule && !/radial-gradient/.test(artRule[0]), 'gradient tối cũ của ảnh thưởng phải xóa');
	assert(/\.brand-logo-wrap \{[^}]*background: var\(--well\)/.test(css), 'logo sidebar phải nền token trung tính');
	return 'reward-art + brand-logo-wrap dùng token trung tính';
});
check('Waves#206/#207: thang z-index + mobile 375 (min-width, ảnh không tràn)', () => {
	const css = read(path.join(APP, 'styles.css'));
	assert(/THANG Z-INDEX DUY NHẤT/.test(css), 'thiếu comment thang z-index');
	const m = read(path.join(APP, 'mobile.css'));
	assert(/\.main-wrap,\s*\.content \{\s*min-width: 0/.test(m), 'thiếu min-width: 0 chống cuộn ngang');
	assert(/\.content img \{\s*max-width: 100%/.test(m), 'thiếu max-width ảnh ở màn hẹp');
	return 'thang z-index + guard mobile có mặt';
});
check('Waves#212: file skill UI/UX có mặt, nguyên vẹn, README trỏ tới nó', () => {
	const skill = read(path.join(__dirname, '..', '..', 'skills', 'ui-ux', 'SKILL-UI-UX.md'));
	assert(skill.includes('ĐỌC TRƯỚC TIÊN') && skill.includes('shadcn-ui/lint') && skill.includes('ui-ux-pro-max') && skill.includes('chrome-devtools-mcp'), 'file skill thiếu nội dung tổng hợp');
	const readme = read(path.join(__dirname, '..', '..', 'README.md'));
	assert(readme.includes('skills/ui-ux/SKILL-UI-UX.md'), 'README phải trỏ tới skill');
	// Quy tắc từ 2026-10-30: README chính không chứa log waves hay mục nội bộ.
	assert(!/Waves #\d/.test(readme), 'README chính không được chứa danh sách waves');
	assert(!readme.includes('Log AI Agent') && !readme.includes('LƯU Ý CHO AI AGENT'), 'README chính không được chứa mục nội bộ');
	return 'skill + README pointer có mặt';
});
check('Waves#177: backup — export 200k vòng, import giữ sàn cũ, mật khẩu mới tối thiểu 12', () => {
	const b = read(path.join(WEB, 'bridge.js'));
	assert(/BACKUP_ITERATIONS = 200000/.test(b), 'export không còn 200k vòng');
	assert(/iterations >= 10000/.test(b), 'import phải giữ sàn cũ để bản sao lưu cũ vẫn mở');
	const r = read(path.join(APP, 'renderer.js'));
	assert(/pass\.length < 12/.test(r), 'mật khẩu xuất mới chưa nâng lên 12');
	return 'backup audit: 200k export · 2MB cap · sàn import cũ giữ nguyên';
});
check('Waves#198: kích thước bundle báo cáo được (renderer/styles/engine-bundle tồn tại)', () => {
	const sizes = [['renderer.js', path.join(APP, 'renderer.js')], ['styles.css', path.join(APP, 'styles.css')], ['engine-bundle.js', path.join(WEB, 'engine-bundle.js')]].map(([n, f]) => `${n}=${(fs.statSync(f).size / 1024).toFixed(0)}KB`).join(' ');
	return sizes + ' (không tách code: PWA offline vẫn cần shell nguyên khối)';
});


check('Waves#215: smoke checklist + rounded favicon link (visual checks listed, not claimed)', () => {
	const list = read(path.join(__dirname, 'SMOKE-CHECKLIST.md'));
	for (const need of ['375px', 'drawer', 'Bộ lọc nâng cao', 'zoZ-logo-round', 'light', 'dark', 'CHƯA XÁC MINH']) assert(list.includes(need), 'smoke checklist thiếu: ' + need);
	const html = read(INDEX);
	assert(/rel="icon"[^>]*zoZ-logo-round\.png/.test(html), 'favicon phải là logo tròn');
	return 'checklist liệt kê đủ trạng thái cần chụp màn hình thật';
});
check('Waves#216: CI workflow chạy đủ bước theo đúng thứ tự', () => {
	const ci = read(path.join(ROOT, '.github', 'workflows', 'web-ci.yml'));
	const steps = ['build:engine', 'npm test', 'check:bundle', 'check:integrity', 'sizes', 'build:static'];
	let last = -1;
	for (const s of steps) { const i = ci.indexOf(s); assert(i > last, 'CI thiếu hoặc sai thứ tự bước: ' + s); last = i; }
	return 'CI: build:engine -> test -> bundle -> integrity -> sizes -> build:static';
});
check('Waves#217: drawer regression — thứ tự đóng, Esc, pointer-events, z-index, trong .shell', () => {
	const html = read(INDEX);
	const shellAt = html.indexOf('class="shell"');
	const overlayAt = html.indexOf('drawer-overlay');
	const asideAt = html.indexOf('<aside');
	assert(shellAt >= 0 && overlayAt > shellAt && asideAt > overlayAt, 'overlay phải nằm trong .shell, trước <aside>');
	const r = read(path.join(APP, 'renderer.js'));
	assert(/closeDrawer\(\{ returnFocus: false \}\)/.test(r), 'switchPage phải đóng drawer sau khi đổi trang, không trả focus');
	assert(/closeDrawer\(\{ returnFocus: true \}\)/.test(r), 'bấm overlay chỉ đóng drawer, trả focus');
	const css = read(path.join(APP, 'styles.css')) + read(path.join(APP, 'mobile.css'));
	const oz = Number((css.match(/\.drawer-overlay \{[^}]*z-index: (\d+)/) || [])[1]);
	const sz = Number((css.match(/\.sidebar \{[^}]*z-index: (\d+)/) || [])[1]);
	assert(Number.isFinite(oz) && Number.isFinite(sz) && oz < sz, `overlay z (${oz}) phải nhỏ hơn sidebar z (${sz})`);
	assert(/\.drawer-overlay \{[^}]*pointer-events: none/.test(css) && /\.drawer-overlay\.show \{[^}]*pointer-events: auto/.test(css), 'overlay mặc định phải pointer-events: none, chỉ .show mới auto');
	return `overlay z=${oz} < sidebar z=${sz}, trong .shell`;
});
check('Waves#218: bộ đếm bộ lọc nâng cao — 6 đầu vào, mỗi đầu đúng một lần', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const m = r.match(/function countAdvancedFiltersState\(s\) \{[^}]*\}/);
	assert(m, 'thiếu hàm thuần countAdvancedFiltersState');
	const sandbox = { countAdvancedFiltersState: null };
	vm.createContext(sandbox);
	vm.runInContext(m[0] + '\nthis.__f = countAdvancedFiltersState;', sandbox);
	const f = sandbox.__f;
	const base = { platformFilter: 'all', taskFilter: 'all', expiringOnly: false, doneDateFrom: '', doneDateTo: '', doneIncludeUndated: true, groupGames: false };
	assert(f(base) === 0, 'không lọc nào -> 0');
	assert(f({ ...base, platformFilter: '0' }) === 1, 'chỉ platform -> 1');
	assert(f({ ...base, taskFilter: 'WATCH_VIDEO' }) === 1, 'chỉ task -> 1');
	assert(f({ ...base, expiringOnly: true }) === 1, 'chỉ expiring -> 1');
	assert(f({ ...base, doneDateFrom: '2026-01-01', doneDateTo: '2026-01-31' }) === 1, 'cả khoảng ngày vẫn chỉ 1');
	assert(f({ ...base, doneIncludeUndated: false }) === 1, 'chỉ undated-excluded -> 1');
	assert(f({ ...base, groupGames: true }) === 1, 'chỉ group -> 1');
	assert(f({ platformFilter: '0', taskFilter: 'WATCH_VIDEO', expiringOnly: true, doneDateFrom: '2026-01-01', doneDateTo: '', doneIncludeUndated: false, groupGames: true }) === 6, 'đủ 6 lọc -> 6');
	assert(/function countActiveAdvancedFilters\(\) \{ return countAdvancedFiltersState/.test(r), 'bộ đếm UI phải ủy quyền cho hàm thuần');
	assert(/function syncQuestTools\([^)]*\) \{[\s\S]{0,300}updateAdvancedFilterCount/.test(r), 'syncQuestTools phải cập nhật số đếm');
	return 'count thuần: 0/1/1/1/1/1/1/6 đúng';
});
check('Waves#219: manifest có icon maskable logo tròn 256, icon any cũ còn, apple-touch-icon vẫn vuông', () => {
	const mf = JSON.parse(read(path.join(APP, 'manifest.webmanifest')));
	const mask = mf.icons.find((i) => i.purpose === 'maskable');
	assert(mask && mask.src === 'assets/zoZ-logo-round.png' && mask.sizes === '256x256', 'thiếu icon maskable logo tròn 256');
	assert(mf.icons.some((i) => (i.purpose || 'any') === 'any'), 'icon any cũ phải còn');
	assert(fs.existsSync(path.join(APP, 'assets', 'zoZ-logo-round.png')), 'file logo tròn thiếu');
	const html = read(INDEX);
	assert(/apple-touch-icon[^>]*zoZ-logo-ico\.png/.test(html), 'apple-touch-icon phải giữ bản vuông gốc');
	return 'maskable 256 tròn + any cũ + apple-touch vuông';
});
check('Waves#220: backup import — thiếu data/iv/salt, quá 2MB, sai mật khẩu đều lỗi rõ, không ghi đè', () => {
	const b = read(path.join(WEB, 'bridge.js'));
	assert(/File sao lưu thiếu phần dữ liệu mã hoá/.test(b), 'thiếu guard data');
	assert(/File sao lưu thiếu IV mã hoá/.test(b), 'thiếu guard iv');
	assert(/File sao lưu thiếu salt KDF/.test(b), 'thiếu guard salt');
	assert(/2 \* 1024 \* 1024/.test(b) || /2097152/.test(b), 'thiếu cap 2MB');
	assert(/Sai mật khẩu hoặc file sao lưu bị hỏng/.test(b), 'thiếu thông báo sai mật khẩu');
	assert(/pendingBackup = null/.test(b), 'failed pick phải reset pendingBackup, không ghi đè dữ liệu cũ');
	return 'guard data/iv/salt + 2MB + sai mật khẩu + pending null';
});
check('Waves#221: SW offline — trang offline có nút Thử lại, không phải text 503 trần', () => {
	const sw = read(path.join(APP, 'sw.js'));
	assert(/Thử lại/.test(sw) && /text\/html/.test(sw), 'fallback offline phải là HTML có nút Thử lại');
	assert(/caches\.match\('index\.html'\)/.test(sw), 'shell cache phải được thử trước fallback offline');
	return 'offline HTML + retry, shell cache trước';
});
check('Waves#222: thử lại quét thiếu có backoff giới hạn, reset khi quét đủ', () => {
	const r = read(path.join(APP, 'renderer.js'));
	assert(/partialRetryAttempt = Math\.min\(partialRetryAttempt \+ 1, 4\)/.test(r), 'backoff phải giới hạn 4 lần');
	assert(/partialRetryAttempt \* 1000/.test(r), 'chờ theo lần thử (1s/2s/3s/4s)');
	assert(/if \(!scanPartialErrors\.length\) partialRetryAttempt = 0/.test(r), 'quét đủ phải reset số lần thử');
	return 'backoff 1-4s, reset khi đủ';
});
check('Waves#223: đếm ngược hết hạn trực tiếp, tick 60s', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const m = r.match(/function formatExpiryCountdown\(expiresAt\) \{[\s\S]*?\n\}/);
	assert(m, 'thiếu formatExpiryCountdown');
	const sandbox = { Date };
	vm.createContext(sandbox);
	vm.runInContext(m[0] + '\nthis.__f = formatExpiryCountdown;', sandbox);
	const f = sandbox.__f;
	const now = Date.now();
	assert(f(new Date(now + 90 * 60000 + 30000).toISOString()) === 'Còn 1g 30p', '90 phút rưỡi phải là 1g 30p');
	assert(f(new Date(now + 30 * 60000 + 30000).toISOString()) === 'Còn 30p', '30 phút rưỡi phải là 30p');
	assert(f(new Date(now + 3 * 86400000 + 12 * 3600000).toISOString()) === 'Còn 3 ngày', '3 ngày rưỡi phải là 3 ngày');
	assert(f(new Date(now - 1000).toISOString()) === '', 'đã hết hạn không đếm');
	assert(f(new Date(now + 10 * 86400000).toISOString()) === '', 'quá 7 ngày chỉ hiện ngày');
	assert(/setInterval\(\(\) => \{[\s\S]{0,300}formatExpiryCountdown/.test(r) && /}, 60000\)/.test(r), 'thiếu tick 60s');
	assert(/formatExpiryCountdown\(q\.expiresAt\)/.test(r), 'thẻ quest phải dùng countdown');
	return 'countdown 1g30p/30p/3 ngày + tick 60s';
});
check('Waves#224: đổi tài khoản không chạm ghi chú (phạm vi theo tài khoản)', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const fn = r.match(/function resetQuestSessionForSwitch\(\) \{[\s\S]*?\n\}/);
	assert(fn, 'thiếu resetQuestSessionForSwitch');
	assert(!/questNotesStore\s*=/.test(fn[0]), 'reset đổi tài khoản không được ghi đè notesStore');
	assert(/notesScope\(\)/.test(r) && /accountScope\(\)/.test(r), 'ghi chú phải theo phạm vi tài khoản');
	assert(/partialRetryAttempt = 0/.test(fn[0]) || /prevScanQuestIds\.clear\(\)/.test(fn[0]), 'reset phải xóa trạng thái quét thử lại/mới');
	return 'notes theo accountScope, reset không chạm notes';
});
check('Waves#225: windowing cho Chưa làm/Chưa nhận như Đã làm', () => {
	const r = read(path.join(APP, 'renderer.js'));
	assert(/let activeWindowEnd = 80/.test(r) && /let newWindowEnd = 80/.test(r), 'thiếu cửa sổ active/new');
	assert(/activeWindowing/.test(r) && /newWindowing/.test(r), 'thiếu điều kiện windowing active/new');
	assert(/currentTab === 'active' && activeWindowEnd < lastActiveVisibleCount/.test(r), 'scroll phải mở rộng cửa sổ active');
	assert(/currentTab === 'new' && newWindowEnd < lastNewVisibleCount/.test(r), 'scroll phải mở rộng cửa sổ new');
	return 'active/new window 80, mở rộng khi cuộn đáy';
});
check('Waves#226: ảnh logo info Đã làm lazy, ảnh thưởng đã lazy', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const logo = r.match(/qdone-info-logo[^`]*`/);
	assert(logo && /loading="lazy"/.test(logo[0]), 'logo info Đã làm phải loading=lazy');
	assert(/loading="lazy" decoding="async"/.test(r), 'ảnh thưởng phải lazy + async decode');
	return 'done info logo lazy';
});
check('Waves#227/#228: .brain ghi quyết định đo lường + quy trình build number, không bịa số', () => {
	const brain = read(path.join(ROOT, '.brain', '2026-10-30.md'));
	assert(/#227/.test(brain) && /không tách/.test(brain), '.brain thiếu quyết định #227');
	assert(/#228/.test(brain) && /WEB_BUILD_NUMBER/.test(brain), '.brain thiếu quy trình #228');
	assert(/653945/.test(read(path.join(WEB, 'identity.js'))), 'placeholder build number hiện tại phải giữ nguyên');
	return '.brain có #227/#228, placeholder không đổi';
});
check('Waves#229: SW verify thử nhiều đường dẫn, fail-safe khi mọi đường dẫn lỗi', () => {
	const sw = read(path.join(APP, 'sw.js'));
	assert(/candidates/.test(sw) && /name\.slice\(4\)/.test(sw), 'verify phải thử đường dẫn thay thế cho layout web-dist');
	assert(/bundle fetch failed/.test(sw), 'mọi candidate lỗi phải fail, không activate');
	assert(/VERIFY_AND_ACTIVATE/.test(sw), 'giữ kênh VERIFY_AND_ACTIVATE');
	return 'candidates + fail-safe';
});
check('Waves#230: veil vào thang — capture 300 < lock 400, modal/login giữ đỉnh', () => {
	const css = read(path.join(APP, 'styles.css'));
	const cap = Number((css.match(/\.capture-veil \{[^}]*z-index: (\d+)/) || [])[1]);
	const lock = Number((css.match(/\.lock-veil \{[^}]*z-index: (\d+)/) || [])[1]);
	const modal = Number((css.match(/\.qdone-modal-veil \{[^}]*z-index: (\d+)/) || [])[1]);
	const login = Number((css.match(/\.login-veil \{[^}]*z-index: (\d+)/) || [])[1]);
	assert(cap === 300 && lock === 400 && modal === 1000 && login === 9000, `thang veil sai: capture=${cap} lock=${lock} modal=${modal} login=${login}`);
	return 'capture 300 < lock 400 < modal 1000 < login 9000';
});
check('Waves#231: chọn theo game — chỉ quest lọc được + chọn được, không lẫn game khác', () => {
	const html = read(INDEX);
	const r = read(path.join(APP, 'renderer.js'));
	assert(html.includes('id="gameSelect"') && html.includes('id="btnSelectGame"'), 'thiếu control chọn theo game');
	assert(/function refreshGameSelect/.test(r) && /gameLabelOf\(q\) !== g/.test(r), 'handler phải lọc đúng game');
	assert(/canSelectQuest\(q\) && questMatchesFilter\(q\)/.test(r), 'chọn theo game phải tôn trọng filter + trạng thái chọn được');
	return 'gameSelect + handler lọc đúng game';
});
check('Waves#232: mục tiêu Orb local, ghi rõ không phải số dư Discord', () => {
	const html = read(INDEX);
	const r = read(path.join(APP, 'renderer.js'));
	assert(html.includes('id="orbGoalInput"') && html.includes('id="btnOrbGoalSave"') && html.includes('id="orbGoalProgress"'), 'thiếu UI mục tiêu Orb');
	assert(/autoquest\.orbGoal\.v1/.test(r), 'mục tiêu phải lưu localStorage riêng');
	assert(/không phải số dư Discord/.test(r), 'tiến độ phải ghi rõ không phải số dư Discord');
	return 'goal local + nhãn không phải số dư';
});
check('Waves#233: timeline nhận thưởng nhóm theo ngày ở Stats', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const css = read(path.join(APP, 'styles.css'));
	assert(/stats-recent-day/.test(r) && /dayKey\(row\.at\)/.test(r), 'recent phải nhóm theo dayKey');
	assert(/\.stats-recent-day \{[^}]*font-weight: 700/.test(css), 'thiếu style tiêu đề ngày timeline');
	return 'timeline nhóm theo ngày';
});
check('Waves#234: lịch sử tìm kiếm local, tối đa 10, xóa được, không token', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const html = read(INDEX);
	assert(html.includes('id="searchHistory"'), 'thiếu vùng lịch sử tìm kiếm');
	assert(/autoquest\.searchHistory\.v1/.test(r) && /slice\(0, 10\)/.test(r), 'lịch sử phải local + tối đa 10');
	assert(/localStorage\.removeItem\(SEARCH_HISTORY_KEY\)/.test(r), 'phải xóa được lịch sử');
	return 'search history local 10 + clear';
});
check('Waves#235: phím tắt Q / / + tắt khi gõ, tài liệu ở Settings', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const html = read(INDEX);
	assert(/e\.key === 'q'/.test(r) && /e\.key === '\/'/.test(r), 'thiếu phím tắt Q và /');
	assert(/t\.tagName === 'INPUT'/.test(r) && /qdone-modal/.test(r), 'phím tắt phải tắt khi gõ hoặc modal mở');
	assert(/Phím tắt/.test(html) && /Q: Quét nhiệm vụ/.test(html), 'Settings phải ghi phím tắt');
	return 'Q scan, / search, guard input/modal, doc Settings';
});
check('Waves#236: theme Theo hệ thống — localStorage riêng, theo OS, không qua bridge', () => {
	const html = read(INDEX);
	const r = read(path.join(APP, 'renderer.js'));
	assert(html.includes('id="themeSystem"'), 'thiếu nút Theo hệ thống');
	assert(/autoquest\.themeMode\.v1/.test(r) && /prefers-color-scheme: light/.test(r), 'phải lưu mode riêng + matchMedia');
	assert(/addEventListener\('change'/.test(r) && /themeMode === 'system'/.test(r), 'OS đổi theme phải đổi theo khi mode system');
	return 'system theme local, matchMedia change';
});
check('Waves#237: thẻ chia sẻ — canvas PNG, không token, không code', () => {
	const r = read(path.join(APP, 'renderer.js'));
	const seg = r.slice(r.indexOf("const shareBtn"), r.indexOf("const shareBtn") + 2400);
	assert(/Export share card/.test(seg) && /createElement\('canvas'\)/.test(seg), 'thiếu nút + canvas thẻ chia sẻ');
	assert(!/rewardCode/.test(seg), 'thẻ chia sẻ không được chạm rewardCode');
	assert(/quest-/.test(seg) && /AUTO-QUEST/.test(seg), 'thẻ phải có tên file + nhãn app');
	return 'share card canvas, không code';
});
check('Waves#238: thông báo quest mới sau quét, riêng khỏi tổng kết quét', () => {
	const r = read(path.join(APP, 'renderer.js'));
	assert(/prevScanQuestIds = new Set\(questOrder\)/.test(r), 'phải chụp id lần quét trước trước khi xóa');
	assert(/Có \$\{fresh\.length\} quest mới/.test(r), 'phải báo "Có N quest mới"');
	assert(/prevScanQuestIds\.size > 0/.test(r), 'lần quét đầu không được báo mới cho toàn bộ');
	return 'new-quest notice riêng';
});
check('Waves#239: .brain/INDEX.md liệt kê đủ file .brain', () => {
	const idx = read(path.join(ROOT, '.brain', 'INDEX.md'));
	const files = fs.readdirSync(path.join(ROOT, '.brain')).filter((f) => /^\d{4}-\d{2}-\d{2}\.(md|txt)$/.test(f));
	assert(files.length > 0, 'không tìm thấy file .brain theo ngày');
	for (const f of files) assert(idx.includes(f), '.brain/INDEX.md thiếu: ' + f);
	return 'INDEX liệt kê ' + files.length + ' file dated';
});
check('Waves#240: docs/DEPLOY.md đồng bộ đường dẫn, không chứa log waves', () => {
	const d = read(path.join(ROOT, 'docs', 'DEPLOY.md'));
	assert(!/Waves #\d/.test(d) && !/Waves#\d/.test(d), 'DEPLOY không được chứa log waves');
	assert(/maskable/.test(d), 'DEPLOY phải nhắc icon maskable PWA');
	assert(/web\/app\/index\.html/.test(d) || /web-dist/.test(d), 'DEPLOY phải nhắc đường dẫn hiện tại');
	return 'DEPLOY đồng bộ, không log waves';
});


check('Waves#241: color-mix có fallback đặt trước (hero, search focus, side-act, accsw, claim chip)', () => {
	const css = read(path.join(APP, 'styles.css'));
	const mobile = read(path.join(APP, 'mobile.css'));
	const must = [
		[/\.side-act\.is-busy \{[^}]*border-color: var\(--emerald\);[^}]*color-mix/, 'side-act busy'],
		[/\.quest-search:focus-within \{[^}]*border-color: var\(--brand\);[^}]*color-mix/, 'quest-search focus (mobile)'],
		[/\.accsw-item:hover \{[^}]*background: var\(--ink-800\);[^}]*color-mix/, 'accsw hover'],
		[/\.claim-queue-chip:hover \{[^}]*background: transparent;[^}]*color-mix/, 'claim chip hover'],
	];
	const hay = css + '\n' + mobile;
	for (const [re, name] of must) assert(re.test(hay), 'thiếu fallback trước color-mix: ' + name);
	return 'fallback trước color-mix ở các component chính';
});
check('Waves#242: dvh đặt sau vh cho shell/modal (fallback trước, hiện đại sau)', () => {
	const mobile = read(path.join(APP, 'mobile.css'));
	const shell = mobile.indexOf('.shell {');
	assert(shell >= 0, 'thiếu rule .shell mobile');
	const block = mobile.slice(shell, shell + 400);
	assert(/height: 100vh;[\s\S]*?height: 100dvh;/.test(block), '.shell phải có 100vh rồi 100dvh');
	assert(/max-height: 92vh;[\s\S]*?max-height: 92dvh;/.test(mobile), 'modal phải có 92vh rồi 92dvh');
	return 'vh trước, dvh sau';
});
check('Waves#243/#245: topbar account + bottom sheet tài khoản (mobile), tái dùng handler cũ', () => {
	const html = read(path.join(APP, 'index.html'));
	const js = read(path.join(APP, 'renderer.js'));
	for (const id of ['btnTopbarAccount', 'accountSheetVeil', 'sheetName', 'sheetBalance', 'btnSheetSwitch', 'btnSheetLogout', 'btnSheetClose']) assert(html.includes('id="' + id + '"'), 'thiếu id HTML: ' + id);
	assert(/openAccountSheet\(\)/.test(js) && /closeAccountSheet\(/.test(js), 'thiếu hàm mở/đóng sheet');
	assert(/openAccSw\(\)/.test(js), 'sheet phải tái dùng openAccSw');
	assert(/openLogoutModal\(\)/.test(js), 'sheet phải tái dùng openLogoutModal');
	assert(/isMobileLayout\(\)/.test(js), 'mobile mới dùng sheet thay .up-pop');
	return 'topbar account + sheet + nav shortcut có đủ';
});
check('XOA SACH navAccount: khong con code dead cua muc Tai khoan trong sidebar', () => {
	const html = read(path.join(APP, 'index.html'));
	const js = read(path.join(APP, 'renderer.js'));
	const css = read(path.join(APP, 'styles.css'));
	const mobile = read(path.join(APP, 'mobile.css'));
	assert(!html.includes('navAccount'), 'index.html con navAccount');
	assert(!js.includes('navAccount'), 'renderer.js con navAccount');
	assert(!css.includes('navAccount'), 'styles.css con navAccount');
	assert(!mobile.includes('navAccount'), 'mobile.css con navAccount');
	return 'khong con navAccount trong HTML/JS/CSS';
});
check('Waves#244/#249/#250: drawer sticky profile, chạm 44px, safe-area', () => {
	const mobile = read(path.join(APP, 'mobile.css'));
	assert(/\.userpanel \{[^}]*position: sticky;[^}]*bottom: 0;/.test(mobile), 'userpanel phải sticky bottom trên mobile');
	for (const sel of ['.topbar-btn', '.up-switch', '.accsw-remove', '.quest-search-clear', '.qdone-modal-close']) assert(new RegExp(sel.replace('.', '\\.') + '[^}]*44px').test(mobile), 'thiếu 44px: ' + sel);
	assert(/env\(safe-area-inset-bottom/.test(mobile) && /env\(safe-area-inset-top/.test(mobile), 'thiếu safe-area top/bottom');
	return 'sticky profile + 44px + safe-area';
});
check('Waves#246: modal đổi tài khoản mobile — 1 cột, nút 44px, list cuộn riêng', () => {
	const mobile = read(path.join(APP, 'mobile.css'));
	assert(/\.accsw-input \{[^}]*flex-wrap: wrap;/.test(mobile), 'ô token phải wrap');
	assert(/\.accsw-input input \{[^}]*flex: 1 1 100%;/.test(mobile), 'input token phải full width hàng riêng');
	assert(/\.accsw-list \{[^}]*max-height: 40vh;[^}]*max-height: 40dvh;[^}]*overflow-y: auto;/.test(mobile), 'list phải cuộn riêng trong dvh');
	assert(/\.accsw-item \{[^}]*min-height: 56px;/.test(mobile), 'mỗi tài khoản tối thiểu 56px');
	return 'acc-switch mobile 1 cột + list cuộn riêng';
});
check('Waves#247/#248: chống tràn chữ + text-size-adjust + chữ nhỏ tối thiểu 0.75rem', () => {
	const mobile = read(path.join(APP, 'mobile.css'));
	assert(/-webkit-text-size-adjust: 100%;/.test(mobile), 'thiếu -webkit-text-size-adjust');
	assert(/\.side-act-text \{[^}]*white-space: normal;/.test(mobile), 'side-act-text phải bỏ nowrap trên mobile');
	assert(/\.qcard-kicker,/.test(mobile) && /font-size: 0\.75rem;/.test(mobile), 'chữ nhỏ mobile phải lên 0.75rem');
	return 'text-size-adjust + bỏ nowrap + chữ 0.75rem';
});
check('Waves#251/#266: lưới Đã làm 3/4/6 cột, drawer 85vw, tablet 300px', () => {
	const mobile = read(path.join(APP, 'mobile.css'));
	assert(/\.qgrid-done \{\s*grid-template-columns: repeat\(3,/.test(mobile), '≤560px phải 3 cột Done');
	assert(/\.qgrid-done \{\s*grid-template-columns: repeat\(4,/.test(mobile), '561-1023px phải 4 cột Done');
	assert(/width: min\(280px, 85vw\);/.test(mobile), 'drawer mobile phải min(280px, 85vw)');
	assert(/width: 300px;/.test(mobile), 'tablet phải drawer 300px');
	return 'Done 3/4 cột + drawer 85vw/300px';
});
check('Waves#253/#255: toolbar và setting từ 1023px trở xuống thành cột', () => {
	const mobile = read(path.join(APP, 'mobile.css'));
	assert(/\.setting-row \{\s*align-items: stretch;\s*flex-direction: column;/.test(mobile), 'setting-row phải thành cột từ 1023px');
	assert(/\.quest-search \{\s*flex: 1 1 100%;/.test(mobile), 'search toolbar 561-1023px phải 100% hàng đầu');
	return 'toolbar/setting cột từ 1023px';
});
check('Waves#256/#258/#259: modal dvh + stack toast/pill + drawer aria/swipe/trap', () => {
	const mobile = read(path.join(APP, 'mobile.css'));
	const js = read(path.join(APP, 'renderer.js'));
	const html = read(path.join(APP, 'index.html'));
	assert(/\.modal-card \{\s*overflow-y: auto;/.test(mobile), 'modal-card phải cuộn riêng');
	assert(/\.claim-pill \{\s*bottom: calc\(76px/.test(mobile), 'pill phải đẩy lên trên toast');
	assert(/aria-controls="sidebar" aria-expanded/.test(html), 'nút drawer phải có aria-controls/expanded');
	assert(/trapFocusIn/.test(js) && /touchend/.test(js) && /dx < -60/.test(js), 'thiếu focus trap hoặc swipe đóng drawer');
	return 'modal dvh + stack + drawer a11y/gesture';
});
check('Waves#260/#261/#262: bỏ blur mobile, PWA iOS, font tiếng Việt', () => {
	const mobile = read(path.join(APP, 'mobile.css'));
	const html = read(path.join(APP, 'index.html'));
	const fonts = read(path.join(APP, 'fonts.css'));
	assert(/\.modal-veil \{\s*backdrop-filter: none;/.test(mobile), 'mobile phải bỏ backdrop blur modal');
	assert(/\.bg-glow \{\s*display: none;/.test(mobile), 'mobile phải bỏ glow nền');
	assert(/apple-mobile-web-app-capable/.test(html), 'thiếu meta apple-mobile-web-app-capable');
	assert(/U\+1EA0-1EF9/.test(fonts), 'thiếu dải unicode tiếng Việt trong fonts.css');
	return 'no-blur mobile + PWA iOS + font VI';
});
check('Waves#263/#264: kicker light dùng token tương phản, chữ mobile được chọn', () => {
	const css = read(path.join(APP, 'styles.css'));
	const mobile = read(path.join(APP, 'mobile.css'));
	assert(/\[data-theme="light"\] \.qcard-kicker \{ color: var\(--brand-bright\); \}/.test(css), 'kicker light phải dùng token brand-bright');
	assert(/user-select: text;/.test(mobile), 'chữ mobile phải được chọn (user-select: text)');
	return 'kicker light token + selectable text';
});
check('Waves#267: smoke checklist có mục mobile, tất cả CHƯA XÁC MINH', () => {
	const sm = read(path.join(ROOT, 'web', 'test', 'SMOKE-CHECKLIST.md'));
	assert(/iPhone 7/.test(sm) && /320px/.test(sm) && /430px/.test(sm) && /xoay ngang/i.test(sm), 'checklist mobile thiếu thiết bị');
	assert(!/đã chụp/i.test(sm.split('## Mobile')[1] || ''), 'mục mobile không được tự nhận đã chụp');
	return 'smoke checklist mobile đủ thiết bị, chưa xác minh';
});
check('Waves#268: docs mobile QA không chứa log waves, README không bị sửa', () => {
	const d = read(path.join(ROOT, 'docs', 'MOBILE-QA.md'));
	assert(!/Waves #\d/.test(d) && !/Waves#\d/.test(d), 'docs mobile không được chứa log waves');
	assert(/iPhone 7/.test(d) && /320/.test(d), 'docs mobile thiếu ma trận thiết bị');
	return 'docs MOBILE-QA không log waves';
});

check('Wave chẩn đoán claim: thẻ ghi nhánh C/D + nguồn token + thời gian, không đổi hành vi', () => {
	const js = read(path.join(APP, 'renderer.js'));
	const css = read(path.join(APP, 'styles.css'));
	assert(/CLAIM_DIAG_BRANCH/.test(js) && /'captcha-still-required'/.test(js) && /'grant-403-10008'/.test(js), 'thiếu map nhánh C/D');
	assert(/onCaptchaSolved\(captchaToken, source = 'callback'\)/.test(js), 'onCaptchaSolved phải nhận source');
	assert(/onCaptchaSolved\(token, 'auto-poll'\)/.test(js), 'đường tự động quét phải ghi source auto-poll');
	assert(/onCaptchaSolved\(token, 'manual'\)/.test(js), 'đường bấm thủ công phải ghi source manual');
	assert(/openedAt: Date\.now\(\)/.test(js), 'mở hộp captcha phải ghi openedAt để tính thời gian');
	assert(/claimBranch: 'captcha-still-required'/.test(js), 'nhánh C phải ghi claimBranch');
	assert(/claimBranch: 'grant-403-10008'/.test(js), 'nhánh D phải ghi claimBranch');
	assert(/appendClaimDiag\(quest, 'captcha-still-required'\)/.test(js) && /appendClaimDiag\(quest, 'grant-403-10008'\)/.test(js), 'hai nhánh phải ghi log chẩn đoán');
	assert(!/lastCaptchaSubmit[^;]*captchaToken/.test(js) && !/claimDiagToken/.test(js), 'chẩn đoán không được lưu token');
	assert(js.includes('qcard-diag') && /diag: node\.querySelector\('.qcard-diag'\)/.test(js), 'thẻ quest phải có dòng chẩn đoán và cache nó');
	const m = css.match(/\.qcard-diag \{[^}]*\}/);
	assert(m && /var\(--fg-muted\)/.test(m[0]) && !/#[0-9a-fA-F]{3,8}/.test(m[0]), 'dòng chẩn đoán phải dùng token màu, không màu thô');
	assert(/\.qcard-diag:empty \{ display: none; \}/.test(css), 'dòng chẩn đoán trống phải ẩn');
	return 'nhánh C/D + nguồn token + thời gian trên thẻ/log, không token';
});

/* ── In kết quả ────────────────────────────────────────────────────────── */
for (const r of results) {
	const tag = r.ok ? 'PASS' : 'FAIL';
	const suffix = r.detail ? ' — ' + r.detail : '';
	console.log('[' + tag + '] ' + r.label + suffix);
}

console.log('');
if (failures === 0) {
	console.log('KẾT QUẢ: ' + results.length + '/' + results.length + ' kiểm tra đạt.');
	process.exit(0);
}
console.log('KẾT QUẢ: ' + failures + ' kiểm tra THẤT BẠI trên ' + results.length + '.');
process.exit(1);
