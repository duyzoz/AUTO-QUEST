'use strict';

/* #106 — Service Worker: chỉ cache VỎ ỨNG DỤNG (cùng origin).
   Tuyệt đối KHÔNG đụng request Discord/hCaptcha: mọi request khác origin đi thẳng.
   Chiến lược: stale-while-revalidate cho tài nguyên tĩnh; network-first cho
   điều hướng (để bản mới lên ngay khi có mạng, offline vẫn mở được vỏ). */

const VERSION = 'autoquest-shell-v15';
/* Waves#158: cache riêng cho ảnh/video CDN Discord (không đụng API
 * discord.com, không đụng token/code — chỉ GET ảnh/video từ CDN). */
const CDN_CACHE = 'autoquest-cdn-v1';
const CDN_MAX_ENTRIES = 200;
const SHELL = [
	'./',
	'index.html',
	'renderer.js',
	'styles.css',
	'mobile.css',
	'fonts.css',
	'web/identity.js',
	'web/display-name-style.js',
	'web/bridge.js',
	'web/engine-worker.js',
	'web/engine-bundle.js',
	'assets/orb-logo.png',
	'assets/orb-logo-big.png',
	'assets/zoZ-logo.png',
	'assets/zoZ-logo-ico.png',
	'assets/zoZ-logo-round.png',
	'manifest.webmanifest',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(VERSION)
			.then((cache) => cache.addAll(SHELL))
			.catch(() => {
				/* thiếu file nào đó không được làm chết SW */
			}),
		// Wave#123: bản mới CHỜ người dùng bấm "Cập nhật" (postMessage SKIP_WAITING)
		// thay vì tự nhảy — tránh reload giữa lúc đang cày nhiệm vụ.
	);
});

const ALLOWED_ORIGIN = self.location.origin;

/* Waves#183: verify the waiting bundle against integrity.json before
   activating. Returns SW_VERIFIED + skipWaiting only on a full match;
   on any fetch/hash mismatch it reports SW_VERIFY_FAILED and does NOT
   activate, so a corrupt bundle can never be forced in mid-run. */
async function verifyAndActivate(event) {
	try {
		const integRes = await fetch(new URL('integrity.json', self.location.href), { cache: 'no-store' });
		if (!integRes.ok) throw new Error('integrity fetch failed');
		const manifest = await integRes.json();
		const files = (manifest && manifest.files) || {};
		const targets = ['renderer.js', 'web/engine-bundle.js'];
		for (const name of targets) {
			const expected = files[name];
			if (!expected) continue;
			// Waves#229: one manifest key can resolve to different URLs in the
			// dev layout and the web-dist layout (SW served from the app root
			// in both, but the engine bundle path differs by host setup).
			// Try each candidate in order and accept ONLY on a hash match;
			// if every candidate fails, fall through to the fail-safe below
			// (no activation). A 404 on one candidate is never a pass.
			const candidates = [name];
			if (name.startsWith('web/')) candidates.push(name.slice(4));
			if (!name.includes('/')) candidates.push('web/' + name);
			let buf = null;
			let fetched = false;
			for (const cand of candidates) {
				const res = await fetch(new URL(cand, self.location.href), { cache: 'no-store' }).catch(() => null);
				if (res && res.ok) { buf = await res.arrayBuffer(); fetched = true; break; }
			}
			if (!fetched || buf === null) throw new Error('bundle fetch failed: ' + name);
			const digest = await crypto.subtle.digest('SHA-256', buf);
			let bin = '';
			const bytes = new Uint8Array(digest);
			for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
			const actual = btoa(bin);
			if (actual !== expected) throw new Error('hash mismatch: ' + name);
		}
		try { event.source.postMessage({ type: 'SW_VERIFIED' }); } catch {}
		self.skipWaiting();
	} catch (err) {
		try { event.source.postMessage({ type: 'SW_VERIFY_FAILED', message: String((err && err.message) || err) }); } catch {}
	}
}

self.addEventListener('message', (event) => {
	/* Waves#184: accept only well-formed, same-origin messages. Anything
	   else (wrong origin, no source, unknown type, non-object payload)
	   is rejected silently — no state change, no activation. */
	const data = event.data;
	if (!data || typeof data !== 'object' || Array.isArray(data)) return;
	if (typeof data.type !== 'string') return;
	const ALLOWED_TYPES = ['SKIP_WAITING', 'GET_VERSION', 'CLEAR_CDN_CACHE', 'VERIFY_AND_ACTIVATE'];
	if (!ALLOWED_TYPES.includes(data.type)) return;
	/* Wave#134 (audit): trước đây LỆNH SKIP_WAITING chấp nhận từ mọi nguồn ⇒ bất kỳ
	   script nào chạy trong trang (kể cả SDK bên thứ ba) đều ép kích hoạt bản SW đang
	   chờ giữa lúc người dùng đang thao tác. Nay chỉ nhận message từ client thật, đúng
	   origin của chính app. Nút "Áp dụng bản cập nhật" vẫn chạy vì nó gửi từ page. */
	if (event.origin && event.origin !== ALLOWED_ORIGIN) return;
	const src = event.source;
	if (!src || typeof src.postMessage !== 'function') return;
	if (!String(src.url || '').startsWith(ALLOWED_ORIGIN)) return;
	if (data.type === 'CLEAR_CDN_CACHE') {
		caches.delete(CDN_CACHE).then(() => { try { event.source.postMessage({ type: 'CDN_CACHE_CLEARED' }); } catch {} }).catch(() => {});
		return;
	}
	if (data.type === 'VERIFY_AND_ACTIVATE') {
		verifyAndActivate(event);
		return;
	}
	if (data.type === 'SKIP_WAITING') {
		self.skipWaiting();
		return;
	}
	if (data.type === 'GET_VERSION') {
		try {
			event.source.postMessage({ type: 'SW_VERSION', version: VERSION });
		} catch {
			/* ignore */
		}
	}
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== CDN_CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;

	let url;
	try {
		url = new URL(req.url);
	} catch {
		return;
	}
	// Waves#158: ảnh/video từ CDN Discord → stale-while-revalidate,
	// tối đa 200 mục. API discord.com KHÔNG qua đây (không cache
	// phản hồi có thể chứa token/code). hCaptcha cũng đi thẳng.
	if (
		(url.hostname === 'cdn.discordapp.com' ||
			url.hostname.endsWith('.cdn.discordapp.com') ||
			url.hostname === 'cdn.discord.com') &&
		(req.destination === 'image' || req.destination === 'video' || /\.(png|jpe?g|gif|webp|avif|mp4)(\?|$)/i.test(url.pathname))
	) {
		event.respondWith(
			caches.open(CDN_CACHE).then(async (cache) => {
				const hit = await cache.match(req);
				const network = fetch(req)
					.then(async (res) => {
						/* Waves#179: validate before caching — only real images/
						   videos, <= 20 MB, 2xx. Odd responses are returned
						   to the page but NEVER cached permanently. */
						if (res && res.ok) {
							const ct = (res.headers.get('content-type') || '').toLowerCase();
							const len = Number(res.headers.get('content-length'));
							const okType = ct.startsWith('image/') || ct.startsWith('video/');
							const okSize = !Number.isFinite(len) || len <= 20 * 1024 * 1024;
							if (okType && okSize) {
								cache.put(req, res.clone()).catch(() => {});
								const keys = await cache.keys().catch(() => []);
								if (keys.length > CDN_MAX_ENTRIES) {
									await Promise.all(keys.slice(0, keys.length - CDN_MAX_ENTRIES).map((k) => cache.delete(k))).catch(() => {});
								}
							}
						}
						return res;
					})
					.catch(() => hit);
				return hit || network;
			}),
		);
		return;
	}
	// Chỉ xử lý cùng origin — Discord/hCaptcha/cdn đi thẳng ra mạng.
	if (url.origin !== self.location.origin) return;

	// Wave#127: manifest toàn vẹn phải luôn là bản MỚI NHẤT, không qua cache.
	if (url.pathname.endsWith('/integrity.json')) {
		event.respondWith(
			fetch(req).catch(
				() =>
					new Response('{"files":{}}', {
						status: 503,
						headers: { 'Content-Type': 'application/json; charset=utf-8' },
					}),
			),
		);
		return;
	}

	if (req.mode === 'navigate') {
		event.respondWith(
			fetch(req)
				.then((res) => {
					if (res && res.ok) {
						const copy = res.clone();
						caches.open(VERSION).then((c) => c.put('index.html', copy)).catch(() => {});
					}
					return res;
				})
				.catch(() =>
					caches.match('index.html').then(
						(hit) =>
							hit ||
							// Waves#221: no cache and no network — a real offline
							// page with a retry button, never a blank page or
							// a plain-text 503. Contains no token or quest data.
							new Response('<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Auto Quest — Ngoại tuyến</title><style>body{font-family:system-ui,sans-serif;background:#0b0e18;color:#e6e8f0;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}button{margin-top:16px;padding:12px 20px;border-radius:10px;border:1px solid #3a4157;background:#1a2138;color:#fff;font-size:16px;cursor:pointer}</style></head><body><main><h1>Bạn đang ngoại tuyến</h1><p>Auto Quest cần mạng để tải lần đầu. Kiểm tra kết nối rồi thử lại.</p><button onclick="location.reload()">Thử lại</button></main></body></html>', {
								status: 503,
								headers: { 'Content-Type': 'text/html; charset=utf-8' },
							}),
					),
				),
		);
		return;
	}

	event.respondWith(
		caches.match(req).then((hit) => {
			const network = fetch(req)
				.then((res) => {
					if (res && res.ok) {
						const copy = res.clone();
						caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
					}
					return res;
				})
				.catch(() => hit);
			return hit || network;
		}),
	);
});
