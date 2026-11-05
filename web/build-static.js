'use strict';

/**
 * Đóng gói bản WEB TĨNH thuần web vào `web-dist/` để deploy lên domain riêng
 * (Cloudflare Pages / Netlify / Nginx…). Không cần Node, không Electron.
 *
 * Cấu trúc xuất ra:
 *   /index.html, /renderer.js, /styles.css, /mobile.css, /fonts.css, /assets/**
 *   /manifest.webmanifest, /sw.js, /icons/**
 *   /web/**  (identity, display-name-style, bridge, engine-bundle, worker, fonts)
 *
 * Chạy: node web/build-static.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'web', 'app');
const WEB = path.join(ROOT, 'web');
const OUT = path.join(ROOT, 'web-dist');

function copy(file, dest) {
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.copyFileSync(file, dest);
}

function copyDir(src, dest) {
	fs.mkdirSync(dest, { recursive: true });
	for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
		const s = path.join(src, entry.name);
		const d = path.join(dest, entry.name);
		if (entry.isDirectory()) copyDir(s, d);
		else if (entry.isFile()) fs.copyFileSync(s, d);
	}
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

copyDir(APP, OUT);

for (const f of [
	'identity.js',
	'display-name-style.js',
	'bridge.js',
	'engine-bundle.js',
	'engine-worker.js',
]) {
	copy(path.join(WEB, f), path.join(OUT, 'web', f));
}
copyDir(path.join(WEB, 'fonts'), path.join(OUT, 'web', 'fonts'));

/* Wave#127: manifest băm SHA-256 cho bản đóng gói (ghi đè bản dev nếu có). */
const integrity = require('./make-integrity');
const manifest = integrity.distManifest();

/* Wave#134 (audit): web-dist/_headers — Cloudflare Pages / Direct Upload đọc file
   này và gắn security headers cho MỌI response. Lý do tồn tại: server.js chỉ là
   bản local, còn production (Workers/Pages) KHÔNG có server.js ⇒ nếu không có
   _headers thì site public không có CSP header, không frame-ancestors, không
   nosniff… tức là bản deploy yếu hơn đúng cái bản đã được audit. CSP lấy trực
   tiếp từ meta trong index.html để hai nơi không bao giờ lệch nhau. */
function writeSecurityHeaders() {
	let csp = '';
	try {
		const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
		const m = html.match(/http-equiv="Content-Security-Policy"\s*\n?\s*content="([^"]+)"/i);
		if (m) csp = m[1].replace(/;\s*$/, "; frame-ancestors 'none';");
	} catch {
		/* không có index.html -> chỉ ghi các header tĩnh */
	}
	const lines = [
		'/*',
		...(csp ? ['  Content-Security-Policy: ' + csp] : []),
		'  X-Content-Type-Options: nosniff',
		'  Referrer-Policy: no-referrer',
		'  X-Frame-Options: DENY',
		'  Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=(), payment=(), interest-cohort=()',
		'  Strict-Transport-Security: max-age=15552000; includeSubDomains',
		'',
		'/sw.js',
		'  Cache-Control: public, max-age=0, must-revalidate',
		'',
	].join('\n');
	fs.writeFileSync(path.join(OUT, '_headers'), lines, 'utf8');
	return Boolean(csp);
}
const headersOk = writeSecurityHeaders();

function dirSize(dir) {
	let n = 0;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		n += entry.isDirectory() ? dirSize(p) : fs.statSync(p).size;
	}
	return n;
}

const bytes = dirSize(OUT);
console.log('Đã đóng gói web-dist/ (' + (bytes / 1024 / 1024).toFixed(1) + ' MB).');
console.log('Đã tạo integrity.json cho ' + Object.keys(manifest.files).length + ' tệp · v' + manifest.version + '.');
console.log('Deploy: trỏ document root vào web-dist / . Mở qua HTTP(S), không mở file://.');
console.log(headersOk
	? 'Đã ghi _headers (CSP + nosniff + frame-deny + Permissions-Policy) — Pages/Direct Upload tự áp.'
	: 'CẢNH BÁO: không đọc được CSP từ index.html ⇒ _headers ghi thiếu Content-Security-Policy.');
