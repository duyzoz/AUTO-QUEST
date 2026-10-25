#!/usr/bin/env node
'use strict';

/**
 * AUTO-QUEST — Chuẩn bị & push lên GitHub.
 *
 *   node tools/push-github.js --check     Kiểm tra sẵn sàng (KHÔNG push)
 *   node tools/push-github.js             Push thật lên duyzoz/AUTO-QUEST
 *   node tools/push-github.js --dry-run   Chỉ in ra sẽ làm gì (KHÔNG push)
 *
 * Token được đọc từ "push github(token).txt" ở gốc repo (đã .gitignore).
 * CẤM in token ra log. CẤM commit file token.
 */

const { execFileSync } = require('child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TOKEN_FILE = path.join(ROOT, 'push github(token).txt');
const REPO_URL = 'https://github.com/duyzoz/AUTO-QUEST.git';
const BRANCH = 'main';

const CHECK_ONLY = process.argv.includes('--check');
const DRY_RUN = process.argv.includes('--dry-run');
const NO_PUSH = CHECK_ONLY || DRY_RUN;

const c = {
	reset: '\u001b[0m', dim: '\u001b[2m', bold: '\u001b[1m',
	red: '\u001b[31m', green: '\u001b[32m', yellow: '\u001b[33m', cyan: '\u001b[36m',
};
const ok = (m) => console.log(`  ${c.green}✔${c.reset} ${m}`);
const warn = (m) => console.log(`  ${c.yellow}⚠${c.reset} ${m}`);
const step = (m) => console.log(`\n${c.cyan}${c.bold}${m}${c.reset}`);
const fail = (m, h) => {
	console.error(`\n${c.red}${c.bold}✖ ${m}${c.reset}`);
	if (h) console.error(`  ${c.dim}${h}${c.reset}`);
	process.exit(1);
};

const git = (args, opts = {}) =>
	execFileSync('git', args, {
		cwd: ROOT,
		encoding: 'utf8',
		stdio: opts.inherit ? 'inherit' : 'pipe',
		env: opts.env || process.env,
	}).trim();

console.log(
	`${c.bold}🚀 AUTO-QUEST — ${NO_PUSH ? 'KIỂM TRA PUSH (không đẩy)' : 'PUSH LÊN GITHUB'}${c.reset}`
);
console.log(`${c.dim}   Đích: ${REPO_URL}  ·  nhánh: ${BRANCH}${c.reset}`);

// ---------------------------------------------------------------------------
step('1. Đọc token...');
if (!fs.existsSync(TOKEN_FILE)) {
	fail(`Không tìm thấy "${path.basename(TOKEN_FILE)}".`, 'Đặt file token ở gốc repo.');
}
const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
if (!/^gh[a-z]_[A-Za-z0-9]{20,}$/.test(token)) {
	fail('Token không đúng định dạng GitHub (phải là ghp_/gho_/ghs_...).', `Đọc được ${token.length} ký tự.`);
}
ok(`Token hợp lệ (${token.slice(0, 4)}…${token.slice(-4)} — ${token.length} ký tự)`);

// Token KHÔNG được lọt vào repo
const tracked = git(['ls-files']).split('\n').filter(Boolean);
const leaked = tracked.filter((f) => /token/i.test(f) && /\.txt$/i.test(f));
if (leaked.length) {
	fail(`File token đang được git theo dõi: ${leaked.join(', ')}`, 'Chạy: git rm --cached "push github(token).txt"');
}
ok(`File token KHÔNG bị git theo dõi`);

// ---------------------------------------------------------------------------
step('2. Kiểm tra trạng thái repo...');
const branch = git(['branch', '--show-current']);
if (branch !== BRANCH) warn(`Đang ở nhánh "${branch}" (mong đợi "${BRANCH}").`);
else ok(`Nhánh: ${branch}`);

const dirty = git(['status', '--porcelain']);
const dirtyCount = dirty ? dirty.split('\n').filter(Boolean).length : 0;
if (dirtyCount) warn(`${dirtyCount} thay đổi chưa commit.`);
else ok('Không có thay đổi chưa commit.');

// Artifact build KHÔNG được commit
if (fs.existsSync(path.join(ROOT, 'build-release', 'exe'))) {
	const inGit = tracked.filter((f) => f.startsWith('build-release/exe/'));
	if (inGit.length) fail(`Có file build lọt vào git: ${inGit.slice(0, 3).join(', ')}`, 'Kiểm tra .gitignore.');
	ok('build-release/exe/ KHÔNG bị git theo dõi (đúng).');
}

// License + hạ tầng release phải có
for (const f of ['LICENSE', 'LICENSE.txt', 'resources/installer.nsh', 'resources/icon.icns']) {
	if (fs.existsSync(path.join(ROOT, f))) ok(`Có ${f}`);
	else warn(`Thiếu ${f}`);
}

if (CHECK_ONLY) {
	step('3. Kế hoạch push (chưa chạy)...');
	console.log(`  ${c.dim}git add -A${c.reset}`);
	console.log(`  ${c.dim}git commit -m "…"${c.reset}`);
	console.log(`  ${c.dim}git push https://<token>@github.com/duyzoz/AUTO-QUEST.git ${BRANCH}${c.reset}`);
	console.log(`\n${c.green}${c.bold}✔ SẴN SÀNG PUSH${c.reset} — chờ lệnh của bro.`);
	process.exit(0);
}

// ---------------------------------------------------------------------------
step('3. Commit (nếu cần)...');
if (dirtyCount) {
	git(['add', '-A'], { inherit: true });
	const msg = process.argv.find((a) => a.startsWith('--message='))?.slice(10) ||
		`release: Auto Quest ${require(path.join(ROOT, 'package.json')).version} — setup.exe + portable + MIT license`;
	if (DRY_RUN) warn(`[dry-run] sẽ commit: ${msg}`);
	else {
		git(['-c', 'user.name=duyzoz', '-c', 'user.email=duyzoz@users.noreply.github.com',
			'commit', '-m', msg], { inherit: true });
		ok('Đã commit.');
	}
} else {
	ok('Không cần commit mới.');
}

// ---------------------------------------------------------------------------
step('4. Push...');
// Nhúng token vào URL để push, KHÔNG ghi vào remote config.
const authedUrl = REPO_URL.replace('https://', `https://${token}@`);
if (DRY_RUN) {
	warn(`[dry-run] sẽ push lên ${REPO_URL} nhánh ${BRANCH}`);
} else {
	git(['push', authedUrl, BRANCH], { inherit: true });
	ok('Push thành công!');
}

console.log(
	`\n${c.green}${c.bold}🎉 ${DRY_RUN ? 'DRY-RUN XONG' : 'ĐÃ PUSH LÊN GITHUB'}${c.reset}`
);
console.log(`👉 ${REPO_URL.replace('.git', '')}`);
