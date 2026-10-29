'use strict';

/**
 * SERVER TĨNH LOCAL (127.0.0.1) — bản thuần web, không còn Electron.
 *
 *   1. Giao diện nằm trong `web/app/` (bản chuyển nhà từ electron/renderer,
 *      byte-identical phần CSS/asset; index.html chỉ thêm CSP + script adapter).
 *   2. Adapter web (identity/bridge/worker/bundle/fonts) nằm trong `web/`.
 *   3. Không proxy, không endpoint nào nhìn thấy token. Token chỉ nằm trong
 *      IndexedDB của trình duyệt.
 *
 * Chạy:  node web/server.js   (hoặc web/start.bat)
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'web', 'app');
const WEB_DIR = path.join(ROOT, 'web');

const HOST = process.env.AQ_HOST || '127.0.0.1';
const PORT = Number(process.env.AQ_PORT || process.argv[2] || 4173);

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.ttf': 'font/ttf',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.txt': 'text/plain; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
};

function send(res, status, body, headers) {
	res.writeHead(status, {
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'no-referrer',
		...(headers || {}),
	});
	res.end(body);
}

function safeJoin(base, urlPath) {
	let decoded;
	try {
		decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
	} catch {
		return null;
	}
	const target = path.resolve(base, '.' + decoded);
	if (target !== base && !target.startsWith(base + path.sep)) return null;
	return target;
}

function serveFile(res, filePath, cache) {
	fs.stat(filePath, (err, stat) => {
		if (err || !stat.isFile()) {
			return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
		}
		const ext = path.extname(filePath).toLowerCase();
		const type = MIME[ext] || 'application/octet-stream';
		res.writeHead(200, {
			'Content-Type': type,
			'Content-Length': stat.size,
			'Cache-Control': cache || 'no-cache',
			'X-Content-Type-Options': 'nosniff',
			'Referrer-Policy': 'no-referrer',
		});
		fs.createReadStream(filePath).pipe(res);
	});
}

const APP_ROOT_FILES = new Set([
	'/renderer.js',
	'/styles.css',
	'/mobile.css',
	'/fonts.css',
	'/manifest.webmanifest',
	'/sw.js',
	'/favicon.ico',
	'/integrity.json',
]);

const server = http.createServer((req, res) => {
	const url = req.url || '/';
	const pathname = url.split('?')[0];

	if (pathname === '/' || pathname === '/index.html') {
		return serveFile(res, path.join(APP_DIR, 'index.html'), 'no-store');
	}

	if (pathname === '/sw.js') {
		return serveFile(res, path.join(APP_DIR, 'sw.js'), 'no-store');
	}

	if (pathname === '/web/engine-worker.js') {
		return serveFile(res, path.join(WEB_DIR, 'engine-worker.js'), 'no-cache');
	}

	if (pathname.startsWith('/web/')) {
		const file = safeJoin(WEB_DIR, pathname.slice('/web'.length));
		if (!file) return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
		const cache = pathname.includes('/fonts/') ? 'public, max-age=86400' : 'no-cache';
		return serveFile(res, file, cache);
	}

	if (pathname.startsWith('/assets/') || pathname.startsWith('/icons/') || APP_ROOT_FILES.has(pathname)) {
		const file = safeJoin(APP_DIR, pathname);
		if (!file) return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
		const cache = pathname.startsWith('/assets/') || pathname.startsWith('/icons/')
			? 'public, max-age=86400'
			: 'no-cache';
		return serveFile(res, file, cache);
	}

	send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
});

server.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.error(`[AQ] Cổng ${PORT} đang bận. Đặt biến AQ_PORT rồi chạy lại.`);
	} else {
		console.error('[AQ] Lỗi server:', err);
	}
	process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
	console.log('');
	console.log('  AUTO-QUEST WEB (local, thuần web)');
	console.log('  → http://' + HOST + ':' + PORT);
	console.log('  Chỉ lắng nghe trên máy này. Token nằm trong trình duyệt, không qua server.');
	console.log('');
});
