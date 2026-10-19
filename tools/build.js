#!/usr/bin/env node
'use strict';

/**
 * AUTO-QUEST PRO — Công cụ build EXE portable (KHÔNG tự build khi không có lệnh).
 *
 *   node tools/build.js              Build thật (tsc -> electron-builder -> verify)
 *   node tools/build.js --check      DRY-RUN: chỉ kiểm tra môi trường + in kế hoạch
 *   node tools/build.js --skip-tsc   Bỏ qua biên dịch TypeScript
 *
 * Output luôn nằm gọn trong:  build-release/exe/
 */

const { execFileSync, execSync } = require('child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'build-release', 'exe');
const TSC_CONFIG = 'tsconfig.build.json';
const BOT_ENTRY = path.join(ROOT, 'electron', 'bot', 'bot.js');
const ICON = path.join(ROOT, 'resources', 'icon.ico');

const CHECK_ONLY = process.argv.includes('--check');
const SKIP_TSC = process.argv.includes('--skip-tsc');

const t0 = Date.now();

const c = {
	reset: '\u001b[0m',
	dim: '\u001b[2m',
	bold: '\u001b[1m',
	red: '\u001b[31m',
	green: '\u001b[32m',
	yellow: '\u001b[33m',
	cyan: '\u001b[36m',
};

const step = (n, total, msg) =>
	console.log(`\n${c.cyan}${c.bold}[${n}/${total}] ${msg}${c.reset}`);
const ok = (msg) => console.log(`  ${c.green}✔${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}⚠${c.reset} ${msg}`);

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

/** Xoá nội dung một thư mục nhưng giữ chính thư mục đó. */
function cleanDir(dir) {
	if (!fs.existsSync(dir)) return;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		fs.rmSync(path.join(dir, entry.name), { recursive: true, force: true });
	}
}

function run(cmd, args, label) {
	try {
		execFileSync(cmd, args, { stdio: 'inherit', cwd: ROOT, shell: false });
		return true;
	} catch (err) {
		fail(`${label} thất bại.`, String(err && err.message).split('\n')[0]);
		return false;
	}
}

/** npx trên Windows là npx.cmd; trên macOS/Linux là npx. */
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// ---------------------------------------------------------------------------
// Pre-flight
// ---------------------------------------------------------------------------
const TOTAL = CHECK_ONLY ? 2 : 4;

console.log(
	`${c.bold}🔨 AUTO-QUEST — ${CHECK_ONLY ? 'KIỂM TRA BUILD (dry-run)' : 'BUILD EXE PORTABLE'}${c.reset}`
);
if (CHECK_ONLY) {
	console.log(`${c.dim}   Chế độ kiểm tra: KHÔNG tạo file EXE, KHÔNG chạy electron-builder.${c.reset}`);
}

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
];
const missing = requiredFields.filter(([, v]) => !v).map(([k]) => k);
if (missing.length) fail('package.json thiếu field: ' + missing.join(', '));

for (const mod of ['electron', 'electron-builder', 'typescript']) {
	if (!fs.existsSync(path.join(ROOT, 'node_modules', mod))) {
		fail(`Thiếu thư mục node_modules/${mod}.`, 'Chạy: npm install');
	}
}
ok('node_modules đầy đủ (electron, electron-builder, typescript)');

if (!fs.existsSync(ICON)) fail('Không tìm thấy icon: ' + path.relative(ROOT, ICON));
ok(`Icon hợp lệ (${human(fs.statSync(ICON).size)})`);

if (fs.existsSync(BOT_ENTRY)) {
	ok(`Bot core đã biên dịch (${human(fs.statSync(BOT_ENTRY).size)})`);
} else {
	warn('Chưa có electron/bot/bot.js — bước build sẽ tự biên dịch.');
}

if (fs.existsSync(path.join(ROOT, 'AUTO-QUEST.exe'))) {
	warn(
		'Phát hiện AUTO-QUEST.exe cũ ở GỐC repo (do phiên bản build cũ để lại). File này đã cũ — hãy dùng bản trong build-release/exe/.'
	);
}
if (fs.existsSync(path.join(ROOT, 'release')) && fs.readdirSync(path.join(ROOT, 'release')).length) {
	warn('Thư mục release/ cũ vẫn còn dữ liệu — có thể xoá thủ công (output mới nằm ở build-release/exe/).');
}

ok(`Thư mục xuất: ${path.relative(ROOT, OUT_DIR)}/`);

// ---------------------------------------------------------------------------
// Dry-run: chỉ in kế hoạch rồi dừng
// ---------------------------------------------------------------------------
if (CHECK_ONLY) {
	step(2, TOTAL, 'Kế hoạch build (chưa chạy)...');
	console.log(
		`  ${c.dim}1.${c.reset} tsc -p ${TSC_CONFIG}   ${c.dim}→ electron/bot/${c.reset}`
	);
	console.log(
		`  ${c.dim}2.${c.reset} electron-builder --win portable --config.directories.output=${path
			.relative(ROOT, OUT_DIR)
			.replace(/\\/g, '/')}`
	);
	console.log(`  ${c.dim}3.${c.reset} verify artifact + sha256`);
	console.log(
		`\n${c.green}${c.bold}✔ DRY-RUN PASS${c.reset} — môi trường sẵn sàng. Chạy \`node tools/build.js\` (không có --check) để build thật.`
	);
	process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. Biên dịch TypeScript
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

// ---------------------------------------------------------------------------
// 3. electron-builder
// ---------------------------------------------------------------------------
step(3, TOTAL, 'Dọn output cũ & đóng gói Portable EXE...');
fs.mkdirSync(OUT_DIR, { recursive: true });
cleanDir(OUT_DIR);
ok(`Đã dọn ${path.relative(ROOT, OUT_DIR)}/`);

const outArg = OUT_DIR.replace(/\\/g, '/');
run(
	npx,
	[
		'electron-builder',
		'--win',
		'portable',
		'--publish',
		'never',
		`--config.directories.output=${outArg}`,
		'--config.forceCodeSigning=false',
	],
	'electron-builder'
);

// ---------------------------------------------------------------------------
// 4. Verify
// ---------------------------------------------------------------------------
step(4, TOTAL, 'Xác minh kết quả...');

const produced = [];
(function walk(dir, depth) {
	if (depth > 3) return;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, depth + 1);
		else if (/\.exe$/i.test(entry.name)) produced.push(full);
	}
})(OUT_DIR, 0);

if (!produced.length) {
	fail(
		`electron-builder không sinh ra file .exe trong ${path.relative(ROOT, OUT_DIR)}/`,
		'Thử chạy: npx electron-builder --win portable để xem log lỗi chi tiết.'
	);
}

const exe = produced[0];
const size = fs.statSync(exe).size;
if (size < 1024 * 1024) fail(`File EXE bất thường (chỉ ${human(size)}) — build có thể lỗi.`);
ok(`EXE: ${path.relative(ROOT, exe)}  ·  ${human(size)}  ·  sha256:${sha256(exe)}`);
ok(`Tổng trọng lượng output: ${human(dirSize(OUT_DIR))}`);

const mins = ((Date.now() - t0) / 1000).toFixed(1);
console.log(
	`\n${c.green}${c.bold}🎉 BUILD THÀNH CÔNG${c.reset} trong ${mins}s`
);
console.log(`👉 ${exe}`);
console.log(
	`${c.dim}   Ghi chú: file chạy portable (không cần cài đặt). Token lưu tại %APPDATA%\\AUTO-QUEST.${c.reset}`
);
