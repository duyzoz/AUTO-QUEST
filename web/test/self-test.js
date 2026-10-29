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
