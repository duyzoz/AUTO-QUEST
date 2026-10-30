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

self.addEventListener('message', (event) => {
	const data = event.data || {};
	/* Wave#134 (audit): trước đây LỆNH SKIP_WAITING chấp nhận từ mọi nguồn ⇒ bất kỳ
	   script nào chạy trong trang (kể cả SDK bên thứ ba) đều ép kích hoạt bản SW đang
	   chờ giữa lúc người dùng đang thao tác. Nay chỉ nhận message từ client thật, đúng
	   origin của chính app. Nút "Áp dụng bản cập nhật" vẫn chạy vì nó gửi từ page. */
	if (event.origin && event.origin !== ALLOWED_ORIGIN) return;
	const src = event.source;
	if (!src || typeof src.postMessage !== 'function') return;
	if (!String(src.url || '').startsWith(ALLOWED_ORIGIN)) return;
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
						if (res && res.ok) {
							cache.put(req, res.clone()).catch(() => {});
							const keys = await cache.keys().catch(() => []);
							if (keys.length > CDN_MAX_ENTRIES) {
								await Promise.all(keys.slice(0, keys.length - CDN_MAX_ENTRIES).map((k) => cache.delete(k))).catch(() => {});
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
							new Response('Auto Quest cần mạng để tải lần đầu.', {
								status: 503,
								headers: { 'Content-Type': 'text/plain; charset=utf-8' },
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
