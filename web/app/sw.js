'use strict';

/* Service Worker: chỉ cache VỎ ỨNG DỤNG (cùng origin).
   Tuyệt đối KHÔNG đụng request Discord/hCaptcha: mọi request khác origin đi thẳng.
   Web deploy thẳng qua Cloudflare mỗi khi main đổi nên KHÔNG còn popup cập nhật:
   SW mới tự kích hoạt ngay (skipWaiting), file app lấy network-first để reload
   sau deploy là bản mới nhất, cache chỉ là dự phòng khi ngoại tuyến. */

const VERSION = 'autoquest-shell-v16';
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
			})
			.then(() => self.skipWaiting()),
		// Không còn popup cập nhật: SW mới tự kích hoạt ngay khi cài xong.
		// Trang đang mở không tự reload giữa lúc đang cày; lần reload sau
		// deploy sẽ lấy file mới nhờ network-first ở dưới.
	);
});

const ALLOWED_ORIGIN = self.location.origin;

self.addEventListener('message', (event) => {
	// Chỉ còn một lệnh duy nhất: xóa cache CDN (dọn ảnh/video Discord đã cache).
	// Không còn lệnh cập nhật thủ công nào vì không còn khái niệm
	// phiên bản cập nhật — SW mới tự kích hoạt ở install.
	const data = event.data;
	if (!data || typeof data !== 'object' || Array.isArray(data)) return;
	if (data.type !== 'CLEAR_CDN_CACHE') return;
	if (event.origin && event.origin !== ALLOWED_ORIGIN) return;
	const src = event.source;
	if (!src || typeof src.postMessage !== 'function') return;
	if (!String(src.url || '').startsWith(ALLOWED_ORIGIN)) return;
	caches.delete(CDN_CACHE).then(() => { try { event.source.postMessage({ type: 'CDN_CACHE_CLEARED' }); } catch {} }).catch(() => {});
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

	// Network-first cho file app: reload sau deploy Cloudflare là bản mới nhất.
	// Chỉ khi mất mạng mới dùng bản cache (dự phòng ngoại tuyến, không phải "cập nhật").
	event.respondWith(
		fetch(req)
			.then((res) => {
				if (res && res.ok) {
					const copy = res.clone();
					caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
				}
				return res;
			})
			.catch(() => caches.match(req)),
	);
});
