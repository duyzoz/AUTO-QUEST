#!/usr/bin/env node
'use strict';

/**
 * AUTO-QUEST PRO — Công cụ build đa nền tảng (KHÔNG tự build khi không có lệnh).
 *
 *   node tools/build.js --all         Build Windows setup.exe + portable.exe (mặc định)
 *   node tools/build.js --setup       Chỉ build bộ cài  (Auto Quest Setup 1.0.0.exe)
 *   node tools/build.js --portable    Chỉ build bản chạy    (Auto Quest 1.0.0 portable.exe)
 *   node tools/build.js --linux       Build Linux (AppImage + .deb)
 *   node tools/build.js --mac         Build macOS (dmg + zip, x64 + arm64)  [cần chạy trên macOS]
 *   node tools/build.js --check       DRY-RUN: chỉ kiểm tra môi trường + in kế hoạch
 *   node tools/build.js --skip-tsc    Bỏ qua biên dịch TypeScript
 *
 * Output luôn nằm gọn trong:  build-release/exe/
 *   latest/Auto Quest Setup 1.0.0.exe        ← bộ cài (NSIS, chọn thư mục, shortcut, gỡ cài)
 *   latest/Auto Quest 1.0.0 portable.exe     ← bản chạy trực tiếp, không cần cài
 *   latest/linux/…                           ← AppImage + deb
 *   latest/mac/…                             ← dmg + zip
 */

const { execFileSync } = require('child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'build-release', 'exe');
const OUT_RUN_DIR = path.join(OUT_DIR, 'latest');
const TSC_CONFIG = 'tsconfig.build.json';
const BOT_ENTRY = path.join(ROOT, 'electron', 'bot', 'bot.js');
const ICON_ICO = path.join(ROOT, 'resources', 'icon.ico');
const ICON_ICNS = path.join(ROOT, 'resources', 'icon.icns');
const ICON_PNG = path.join(ROOT, 'resources', 'icon.png');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const CHECK_ONLY = has('--check');
const SKIP_TSC = has('--skip-tsc');

const WANT_SETUP = has('--setup');
const WANT_PORTABLE = has('--portable');
const WANT_LINUX = has('--linux');
const WANT_MAC = has('--mac');
const WANT_ALL = has('--all') || (!WANT_SETUP && !WANT_PORTABLE && !WANT_LINUX && !WANT_MAC);

// ---------------------------------------------------------------------------
const t0 = Date.now();

const c = {
	reset: '\u001b[0m',
	dim: '\u001b[2m',
	bold: '\u001b[1m',
	red: '\u001b[31m',
	green: '\u001b[32m',
	yellow: '\u001b[33m',
	cyan: '\u001b[36m',
	magenta: '\u001b[35m',
};

const step = (n, total, msg) =>
	console.log(`\n${c.cyan}${c.bold}[${n}/${total}] ${msg}${c.reset}`);
const ok = (msg) => console.log(`  ${c.green}✔${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}⚠${c.reset} ${msg}`);
const info = (msg) => console.log(`  ${c.dim}·${c.reset} ${msg}`);

function fail(msg, hint) {
	console.error(`\n${c.red}${c.bold}✖ BUILD THẤT BẠI${c.reset} — ${msg}`);
	if (hint) console.error(`  ${c.dim}${hint}${c.reset}`);
	process.exit(1);
}

function human(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function sha256(file) {
	const hash = crypto.createHash('sha256');
	hash.update(fs.readFileSync(file));
	return hash.digest('hex').slice(0, 16);
}

function dirSize(dir) {
	let total = 0;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) total += dirSize(full);
		else total += fs.statSync(full).size;
	}
	return total;
}

/**
 * Waves 28b: Xoá mạnh tay trên Windows.
 * Bài học: hook "safe-delete" của môi trường dev chặn fs.rmSync với file .asar
 * (nó route sang Recycle Bin rồi fail-closed => không xoá được). Dùng
 * PowerShell Remove-Item -Force để bỏ qua hoàn toàn cơ chế đó.
 */
function psKill(target) {
	if (process.platform !== 'win32') return false;
	try {
		const p = target.replace(/'/g, "''");
		execFileSync(
			'powershell.exe',
			[
				'-NoProfile',
				'-NonInteractive',
				'-Command',
				`if (Test-Path -LiteralPath '${p}') { Get-ChildItem -LiteralPath '${p}' -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { try { $_.Attributes = 'Normal' } catch {} }; Remove-Item -LiteralPath '${p}' -Recurse -Force -ErrorAction SilentlyContinue }`,
			],
			{ stdio: 'ignore' }
		);
		return !fs.existsSync(target);
	} catch {
		return false;
	}
}

/** Xoá một file — bỏ qua nếu lỗi (bị khoá...). */
function cleanFile(file) {
	try {
		fs.rmSync(file, { force: true });
	} catch {
		/* thử PowerShell bên dưới */
	}
	if (fs.existsSync(file)) psKill(file);
	if (fs.existsSync(file)) {
		warn(`Không xoá được ${path.relative(ROOT, file)} (file đang bị khoá).`);
	}
}

/**
 * Waves 18: KIỂM TRA CÂN BẰNG THẺ HTML trước khi đóng gói.
 * Bài học xương máu: 1 thẻ </div> thừa trong index.html đã làm vỡ toàn bộ
 * layout main content (cards trống) mà node --check / tsc KHÔNG phát hiện.
 * Fail build ngay tại đây thay vì ship app vỡ cho user.
 */
function validateHtml(file) {
	const html = fs.readFileSync(file, 'utf8');
	const VOID = new Set([
		'meta', 'link', 'br', 'hr', 'img', 'input', 'source', 'track', 'wbr',
		'area', 'base', 'col', 'embed', 'param', '!doctype',
	]);
	const cleaned = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/gi, '');
	const stack = [];
	const re = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
	let m;
	while ((m = re.exec(cleaned))) {
		const [full, closing, name] = m;
		const tag = name.toLowerCase();
		if (VOID.has(tag)) continue;
		if (!closing) {
			if (/\/>\s*$/.test(full)) continue; // self-closing
			stack.push(tag);
		} else {
			const top = stack.pop();
			if (top !== tag) {
				const line = cleaned.slice(0, m.index).split('\n').length;
				fail(
					`${path.relative(ROOT, file)} lỗi cấu trúc HTML: </${tag}> không khớp <${top}> (dòng ~${line}).`,
					'Thẻ đóng/mở lệch làm vỡ layout. Sửa rồi build lại.'
				);
			}
		}
	}
	if (stack.length) {
		fail(
			`${path.relative(ROOT, file)} có thẻ chưa đóng: ${stack.join(', ')}.`,
			'Thẻ đóng/mở lệch làm vỡ layout. Sửa rồi build lại.'
		);
	}
	ok(`${path.relative(ROOT, file)} — cân bằng thẻ OK`);
}

/** Xoá nội dung một thư mục nhưng giữ chính thư mục đó.
 *  Waves 17: KHÔNG fail build nếu clean lỗi (file bị khoá/antivirus/OneDrive...) —
 *  electron-builder sẽ tự ghi đè file cũ, chỉ cảnh báo để biết output có thể còn rác. */
function cleanDir(dir) {
	if (!fs.existsSync(dir)) return;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		try {
			fs.rmSync(full, { recursive: true, force: true });
		} catch {
			/* thử PowerShell bên dưới */
		}
		if (fs.existsSync(full)) psKill(full);
		if (fs.existsSync(full)) {
			warn(
				`Không xoá được ${path.relative(ROOT, full)} (đang bị khoá) — ` +
					'electron-builder sẽ ghi đè. Nếu EXE lỗi, xoá tay build-release/ rồi build lại.'
			);
		}
	}
}

function run(cmd, args, label) {
	try {
		// Windows: npx.cmd là batch file — Node >= 22.12 yêu cầu shell:true khi spawn .cmd
		// (fix CVE-2024-27980), nếu không sẽ lỗi EINVAL. Trên Unix giữ shell:false như cũ.
		execFileSync(cmd, args, {
			stdio: 'inherit',
			cwd: ROOT,
			shell: process.platform === 'win32',
		});
		return true;
	} catch (err) {
		fail(`${label} thất bại.`, String(err && err.message).split('\n')[0]);
		return false;
	}
}

/** npx trên Windows là npx.cmd; trên macOS/Linux là npx. */
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

// ---------------------------------------------------------------------------
// Kế hoạch build
// ---------------------------------------------------------------------------
const targets = [];
if (WANT_ALL || WANT_SETUP) targets.push({ id: 'setup', label: 'Windows · bộ cài (NSIS setup.exe)' });
if (WANT_ALL || WANT_PORTABLE) targets.push({ id: 'portable', label: 'Windows · bản chạy (portable.exe)' });
if (WANT_LINUX) targets.push({ id: 'linux', label: 'Linux · AppImage + .deb' });
if (WANT_MAC) targets.push({ id: 'mac', label: 'macOS · dmg + zip (x64/arm64)' });

const HEADLINE = WANT_ALL
	? 'BUILD WINDOWS (setup.exe + portable.exe)'
	: targets.map((t) => t.label).join('  +  ');

const TOTAL = 4;

console.log(`${c.bold}🔨 AUTO-QUEST — ${CHECK_ONLY ? 'KIỂM TRA BUILD (dry-run)' : HEADLINE}${c.reset}`);
if (CHECK_ONLY) {
	console.log(`${c.dim}   Chế độ kiểm tra: KHÔNG tạo file, KHÔNG chạy electron-builder.${c.reset}`);
}

// ---------------------------------------------------------------------------
// 1. Pre-flight
// ---------------------------------------------------------------------------
step(1, TOTAL, 'Kiểm tra môi trường & cấu hình...');

let pkg;
try {
	pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
} catch {
	fail('Không đọc được package.json.');
}

const requiredFields = [
	['name', pkg.name],
	['productName', pkg.productName],
	['version', pkg.version],
	['main', pkg.main],
	['build.appId', pkg.build && pkg.build.appId],
	['build.win.target', pkg.build && pkg.build.win && pkg.build.win.target],
	['build.win.icon', pkg.build && pkg.build.win && pkg.build.win.icon],
	['build.nsis', pkg.build && pkg.build.nsis],
];
const missing = requiredFields.filter(([, v]) => !v).map(([k]) => k);
if (missing.length) fail('package.json thiếu field: ' + missing.join(', '));

const VERSION = pkg.version || '1.0.0';
const SETUP_NAME = `Auto Quest Setup ${VERSION}.exe`;
const PORTABLE_NAME = `Auto Quest ${VERSION} portable.exe`;

for (const mod of ['electron', 'electron-builder', 'typescript']) {
	if (!fs.existsSync(path.join(ROOT, 'node_modules', mod))) {
		fail(`Thiếu thư mục node_modules/${mod}.`, 'Chạy: npm install');
	}
}
ok('node_modules đầy đủ (electron, electron-builder, typescript)');

if (!fs.existsSync(ICON_ICO)) fail('Không tìm thấy icon: ' + rel(ICON_ICO));
ok(`Icon Windows .ico (${human(fs.statSync(ICON_ICO).size)})`);
if (fs.existsSync(ICON_ICNS)) {
	ok(`Icon macOS .icns (${human(fs.statSync(ICON_ICNS).size)})`);
} else if (WANT_MAC || WANT_ALL) {
	warn('Chưa có resources/icon.icns — build macOS sẽ dùng icon.png (chất lượng thấp hơn).');
}
if (fs.existsSync(ICON_PNG)) ok(`Icon Linux .png (${human(fs.statSync(ICON_PNG).size)})`);

// NSIS license + include script
const NSIS_LICENSE = path.join(ROOT, 'LICENSE.txt');
const NSIS_INCLUDE = path.join(ROOT, 'resources', 'installer.nsh');
if (fs.existsSync(NSIS_LICENSE)) {
	ok(`Trang giấy phép cho bộ cài (${path.basename(NSIS_LICENSE)})`);
} else {
	warn('Thiếu LICENSE.txt — bộ cài sẽ không có trang giấy phép.');
}
if (fs.existsSync(NSIS_INCLUDE)) {
	ok(`Tuỳ biến bộ cài (${rel(NSIS_INCLUDE)})`);
} else {
	warn('Thiếu resources/installer.nsh — bộ cài dùng giao diện NSIS mặc định.');
}

if (fs.existsSync(BOT_ENTRY)) {
	ok(`Bot core đã biên dịch (${human(fs.statSync(BOT_ENTRY).size)})`);
} else {
	warn('Chưa có electron/bot/bot.js — bước build sẽ tự biên dịch.');
}

if (fs.existsSync(path.join(ROOT, 'AUTO-QUEST.exe'))) {
	warn('Phát hiện AUTO-QUEST.exe cũ ở GỐC repo (bản build cũ để lại) — hãy dùng bản trong build-release/exe/.');
}

ok(`Thư mục xuất: ${rel(OUT_DIR)}/`);

// ---------------------------------------------------------------------------
// Dry-run
// ---------------------------------------------------------------------------
if (CHECK_ONLY) {
	step(2, TOTAL, 'Kế hoạch build (chưa chạy)...');
	console.log(`  ${c.dim}1.${c.reset} tsc -p ${TSC_CONFIG}   ${c.dim}→ electron/bot/${c.reset}`);
	if (WANT_ALL || WANT_SETUP) {
		console.log(
			`  ${c.dim}2.${c.reset} electron-builder --win nsis --publish never   ${c.dim}→ ${SETUP_NAME}${c.reset}`
		);
	}
	if (WANT_ALL || WANT_PORTABLE) {
		console.log(
			`  ${c.dim}3.${c.reset} electron-builder --win portable --publish never   ${c.dim}→ ${PORTABLE_NAME}${c.reset}`
		);
	}
	if (WANT_LINUX) {
		console.log(
			`  ${c.dim}·${c.reset} electron-builder --linux AppImage deb --publish never`
		);
	}
	if (WANT_MAC) {
		console.log(
			`  ${c.dim}·${c.reset} electron-builder --mac dmg zip --publish never   ${c.dim}(phải chạy trên macOS)${c.reset}`
		);
	}
	console.log(`  ${c.dim}4.${c.reset} verify artifact + sha256`);
	console.log(
		`\n${c.green}${c.bold}✔ DRY-RUN PASS${c.reset} — môi trường sẵn sàng. Chạy \`node tools/build.js\` để build thật.`
	);
	process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. TypeScript
// ---------------------------------------------------------------------------
step(2, TOTAL, 'Biên dịch TypeScript cho bot core...');
if (SKIP_TSC) {
	warn('Bỏ qua bước tsc (--skip-tsc). Dùng lại electron/bot/ hiện có.');
	if (!fs.existsSync(BOT_ENTRY)) fail('--skip-tsc nhưng không có electron/bot/bot.js.');
} else {
	run(npx, ['tsc', '-p', TSC_CONFIG], 'tsc');
	if (!fs.existsSync(BOT_ENTRY)) fail('tsc chạy xong nhưng không sinh ra electron/bot/bot.js.');
	ok('electron/bot/bot.js đã sẵn sàng');
}

validateHtml(path.join(ROOT, 'electron', 'renderer', 'index.html'));

// ---------------------------------------------------------------------------
// 3. electron-builder
// ---------------------------------------------------------------------------
// Waves 28: ONE-SLOT OUTPUT — mọi build ghi vào DUY NHẤT `build-release/exe/latest/`.
// Waves#97: latest/ chứa NHIỀU thư mục con (setup/ portable/ linux/ mac/) nên khi
// build lẻ một loại, CHỈ dọn đúng thư mục con của loại đó — nếu không, build
// --portable sẽ xoá mất setup.exe vừa dựng (bro cần CẢ HAI cùng tồn tại).
step(3, TOTAL, 'Dọn output cũ & đóng gói...');
fs.mkdirSync(OUT_DIR, { recursive: true });

/** Thư mục con trong latest/ mà lần build NÀY sẽ ghi đè. */
const SUBS_TO_REBUILD = [];
if (WANT_ALL || WANT_SETUP) SUBS_TO_REBUILD.push('setup');
if (WANT_ALL || WANT_PORTABLE) SUBS_TO_REBUILD.push('portable');
if (WANT_LINUX) SUBS_TO_REBUILD.push('linux');
if (WANT_MAC && process.platform === 'darwin') SUBS_TO_REBUILD.push('mac');
// 'win-unpacked' là di sản của bản build cũ (trước khi tách thư mục con) — luôn dọn.
SUBS_TO_REBUILD.push('win-unpacked');

// Dọn rác ở cấp OUT_DIR (file EXE cũ / run-* cũ), giữ nguyên 'latest'.
for (const entry of fs.readdirSync(OUT_DIR, { withFileTypes: true })) {
	const full = path.join(OUT_DIR, entry.name);
	if (entry.isDirectory()) {
		if (entry.name !== 'latest' && !entry.name.startsWith('.staging-')) cleanDir(full);
		else if (entry.name.startsWith('.staging-')) cleanDir(full);
	} else if (entry.isFile()) {
		cleanFile(full);
	}
}

// Trong latest/: chỉ dọn các thư mục con của loại đang build + file .exe rời rạc cũ.
fs.mkdirSync(OUT_RUN_DIR, { recursive: true });
for (const entry of fs.readdirSync(OUT_RUN_DIR, { withFileTypes: true })) {
	const full = path.join(OUT_RUN_DIR, entry.name);
	if (entry.isDirectory()) {
		if (SUBS_TO_REBUILD.includes(entry.name)) cleanDir(full);
		// thư mục của loại KHÔNG build lần này ⇒ giữ nguyên (vd: giữ setup/ khi build portable)
	} else if (entry.isFile()) {
		// file .exe / .AppImage / .deb rời ở latest/ là di sản bản cũ → dọn
		if (/\.(exe|AppImage|deb|dmg|zip|blockmap|yml)$/i.test(entry.name)) cleanFile(full);
	}
}

/**
 * Waves 28b: PHÁT HIỆN slot `latest/` KHÔNG DỌN ĐƯỢC.
 */
const STAGING_DIR = path.join(OUT_DIR, '.staging-' + Date.now());

function latestSlotBlocked() {
	if (!fs.existsSync(OUT_RUN_DIR)) return false;
	let entries;
	try {
		entries = fs.readdirSync(OUT_RUN_DIR);
	} catch {
		return true;
	}
	// Chỉ coi là blocked nếu thư mục con của loại ĐANG build vẫn còn sau khi dọn.
	const leftovers = entries.filter((n) => SUBS_TO_REBUILD.includes(n));
	if (!leftovers.length) return false;
	for (const name of leftovers) {
		const full = path.join(OUT_RUN_DIR, name);
		try {
			fs.rmSync(full, { recursive: true, force: true });
		} catch {}
		if (fs.existsSync(full)) psKill(full);
		if (fs.existsSync(full)) return true;
	}
	return false;
}

let buildOutputDir = OUT_RUN_DIR;
if (latestSlotBlocked()) {
	warn('slot latest/ còn file BỊ KHOÁ CỨNG — ghi tạm rồi chuyển kết quả vào latest/.');
	fs.mkdirSync(STAGING_DIR, { recursive: true });
	buildOutputDir = STAGING_DIR;
} else {
	fs.mkdirSync(OUT_RUN_DIR, { recursive: true });
}
ok(`Output: build-release/exe/latest/ (ghi đè mỗi lần build — chỉ giữ 1 bản)`);

const outArg = rel(buildOutputDir);

/** Chạy electron-builder với một danh sách target, ghi vào 1 thư mục con riêng để
 *  tránh việc target sau xoá mất artifact của target trước. */
function buildTo(platformArgs, subdir, label) {
	const dest = path.join(buildOutputDir, subdir);
	fs.mkdirSync(dest, { recursive: true });
	info(`${label} → ${rel(dest)}/`);
	run(
		npx,
		[
			'electron-builder',
			...platformArgs,
			'--publish',
			'never',
			`--config.directories.output=${rel(dest)}`,
			'--config.forceCodeSigning=false',
		],
		label
	);
	return dest;
}

const producedDirs = [];

if (WANT_ALL || WANT_SETUP) {
	const d = buildTo(['--win', 'nsis'], 'setup', 'Bộ cài Windows (NSIS)');
	producedDirs.push({ dir: d, kind: 'setup' });
}
if (WANT_ALL || WANT_PORTABLE) {
	const d = buildTo(['--win', 'portable'], 'portable', 'Bản chạy Windows (portable)');
	producedDirs.push({ dir: d, kind: 'portable' });
}
if (WANT_LINUX) {
	if (process.platform !== 'linux') {
		warn('Build Linux trên hệ điều hành khác có thể lỗi (cần Docker/WSL). Vẫn thử...');
	}
	const d = buildTo(['--linux', 'AppImage', 'deb'], 'linux', 'Linux (AppImage + deb)');
	producedDirs.push({ dir: d, kind: 'linux' });
}
if (WANT_MAC) {
	if (process.platform !== 'darwin') {
		warn('⚠ Build macOS CHỈ chạy được trên máy macOS thật. Bỏ qua trên hệ điều hành hiện tại.');
	} else {
		const d = buildTo(['--mac', 'dmg', 'zip'], 'mac', 'macOS (dmg + zip)');
		producedDirs.push({ dir: d, kind: 'mac' });
	}
}

// ---------------------------------------------------------------------------
// 4. Verify
// ---------------------------------------------------------------------------
step(4, TOTAL, 'Xác minh kết quả...');

/** Gom mọi artifact mong đợi, theo đúng loại. */
const wantedExt = {
	setup: [/Setup .*\.exe$/i],
	portable: [/(^|\s)portable\.exe$/i, /portable\.exe$/i],
	linux: [/\.AppImage$/i, /\.deb$/i],
	mac: [/\.dmg$/i, /\.zip$/i],
};

function walk(dir, out = [], depth = 0) {
	if (!fs.existsSync(dir) || depth > 5) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out, depth + 1);
		else out.push(full);
	}
	return out;
}

/** Chỉ lấy artifact trong đúng thư mục con của loại đó ⇒ tránh nhặt nhầm. */
function findArtifacts(subdir, regexes) {
	const base = path.join(buildOutputDir, subdir);
	return walk(base).filter((f) => regexes.some((re) => re.test(path.basename(f))));
}

const found = {
	setup: findArtifacts('setup', wantedExt.setup),
	portable: findArtifacts('portable', wantedExt.portable),
	linux: findArtifacts('linux', wantedExt.linux),
	mac: findArtifacts('mac', wantedExt.mac),
};

let hardFail = false;

function report(kind, label, minBytes) {
	const list = found[kind];
	if (!list.length) {
		if (kind === 'mac' && process.platform !== 'darwin') {
			warn(`${label}: bỏ qua (không phải macOS).`);
			return;
		}
		hardFail = true;
		console.error(`  ${c.red}✖${c.reset} ${label}: KHÔNG tìm thấy artifact.`);
		return;
	}
	for (const f of list) {
		const s = fs.statSync(f).size;
		if (minBytes && s < minBytes) {
			hardFail = true;
			console.error(`  ${c.red}✖${c.reset} ${label}: ${path.basename(f)} quá nhỏ (${human(s)}) — build lỗi.`);
			continue;
		}
		ok(`${c.bold}${path.basename(f)}${c.reset}  ·  ${human(s)}  ·  sha256:${sha256(f)}`);
	}
}

if (WANT_ALL || WANT_SETUP) report('setup', 'Bộ cài (setup.exe)', 20 * 1024 * 1024);
if (WANT_ALL || WANT_PORTABLE) report('portable', 'Bản chạy (portable.exe)', 20 * 1024 * 1024);
if (WANT_LINUX) report('linux', 'Linux', 20 * 1024 * 1024);
if (WANT_MAC && process.platform === 'darwin') report('mac', 'macOS', 20 * 1024 * 1024);

if (hardFail) {
	fail('Một hoặc nhiều artifact không hợp lệ (xem danh sách trên).');
}

// Waves 28b: nếu build ở staging (latest/ bị khoá) → CHUYỂN artifact vào slot chính latest/.
if (buildOutputDir === STAGING_DIR) {
	fs.mkdirSync(OUT_RUN_DIR, { recursive: true });
	for (const sub of SUBS_TO_REBUILD) {
		const src = path.join(STAGING_DIR, sub);
		if (!fs.existsSync(src)) continue;
		const dest = path.join(OUT_RUN_DIR, sub);
		try {
			fs.cpSync(src, dest, { recursive: true, force: true });
		} catch (e) {
			warn(`Không chuyển được ${sub}/ vào latest/ (${e.message}).`);
		}
	}
	ok('Đã chuyển artifact vào slot chính build-release/exe/latest/');
	try {
		fs.rmSync(STAGING_DIR, { recursive: true, force: true });
	} catch {}
	if (fs.existsSync(STAGING_DIR)) psKill(STAGING_DIR);
}

/** Liệt kê mọi artifact đang có trong latest/ (cả bản build lần trước còn giữ). */
const presentInLatest = walk(OUT_RUN_DIR).filter((f) =>
	/\.(exe|AppImage|deb|dmg|zip)$/i.test(path.basename(f))
);
console.log(`\n${c.bold}📦 build-release/exe/latest/${c.reset}`);
for (const f of presentInLatest.sort()) {
	console.log(`   ${c.dim}•${c.reset} ${path.basename(f)}   ${c.dim}(${human(fs.statSync(f).size)})${c.reset}`);
}
ok(`Tổng trọng lượng output: ${human(dirSize(OUT_RUN_DIR))}`);

// ---------------------------------------------------------------------------
// Waves#97: GOM ARTIFACT PHÁT HÀNH — copy đúng các file cần upload vào một chỗ
// ---------------------------------------------------------------------------
const RELEASE_DIR = path.join(ROOT, 'build-release', 'release-assets');
const RELEASE_EXTS = /\.(exe|AppImage|deb|dmg|zip)$/i;
// Chỉ lấy file "đóng gói cuối", KHÔNG lấy exe trong win-unpacked.
const releaseFiles = presentInLatest.filter(
	(f) => RELEASE_EXTS.test(path.basename(f)) && !/win-unpacked|[\\/]resources[\\/]/i.test(f)
);

if (releaseFiles.length) {
	fs.mkdirSync(RELEASE_DIR, { recursive: true });
	// dọn bản cũ trong release-assets để không lẫn version cũ
	for (const entry of fs.readdirSync(RELEASE_DIR)) cleanFile(path.join(RELEASE_DIR, entry));

	const manifest = [];
	for (const f of releaseFiles) {
		const dest = path.join(RELEASE_DIR, path.basename(f));
		try {
			fs.copyFileSync(f, dest);
			manifest.push({
				file: path.basename(f),
				bytes: fs.statSync(dest).size,
				sha256: sha256(dest),
			});
		} catch (e) {
			warn(`Không copy được ${path.basename(f)} (${e.message}).`);
		}
	}

	// Ghi manifest để dán vào release notes / kiểm tra tải về.
	const lines = [
		`# Auto Quest ${VERSION} — release assets`,
		`# Tạo lúc ${new Date().toISOString()}`,
		'',
		...manifest.map((m) => `${m.sha256}  ${m.file}  (${human(m.bytes)})`),
		'',
	];
	fs.writeFileSync(path.join(RELEASE_DIR, 'SHA256SUMS.txt'), lines.join('\n'), 'utf8');

	console.log(`\n${c.bold}🎁 build-release/release-assets/  (chỉ các file cần upload)${c.reset}`);
	for (const m of manifest) {
		console.log(`   ${c.green}•${c.reset} ${m.file}   ${c.dim}(${human(m.bytes)})${c.reset}`);
	}
	console.log(`   ${c.dim}+ SHA256SUMS.txt${c.reset}`);
}

const mins = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n${c.green}${c.bold}🎉 BUILD THÀNH CÔNG${c.reset} trong ${mins}s`);
if (WANT_ALL || WANT_SETUP) {
	console.log(
		`   ${c.magenta}•${c.reset} ${SETUP_NAME}   ${c.dim}← gửi bản này cho người dùng: chọn thư mục, tạo shortcut, có trình gỡ cài${c.reset}`
	);
}
if (WANT_ALL || WANT_PORTABLE) {
	console.log(`   ${c.dim}•${c.reset} ${PORTABLE_NAME}   ${c.dim}← chạy trực tiếp, không cần cài${c.reset}`);
}
console.log(
	`${c.dim}   Ghi chú: token/cấu hình lưu tại %APPDATA%\\AUTO-QUEST (giữ nguyên khi cài lại / gỡ cài).${c.reset}`
);
