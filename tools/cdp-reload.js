/* Reload renderer qua CDP rồi chờ app tự đăng nhập lại.
   Dùng: node tools/cdp-reload.js [thời-gian-chờ-ms] */
const WebSocket = require('ws');

const PORT = process.env.AQ_REMOTE_DEBUG || '9333';
const WAIT = Number(process.argv[2] || 9000);

(async () => {
	const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
	const page = list.find((t) => t.type === 'page');
	if (!page) {
		console.error('không thấy page trong CDP');
		process.exit(1);
	}
	const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
	let id = 0;
	const send = (method, params) =>
		new Promise((res) => {
			const my = ++id;
			const onMsg = (raw) => {
				const m = JSON.parse(raw);
				if (m.id === my) {
					ws.off('message', onMsg);
					res(m);
				}
			};
			ws.on('message', onMsg);
			ws.send(JSON.stringify({ id: my, method, params }));
		});
	await new Promise((r) => ws.on('open', r));
	console.log('đã nối CDP:', page.url);
	await send('Page.enable');
	await send('Page.reload', { ignoreCache: true });
	console.log('đã gửi Page.reload; chờ', WAIT, 'ms cho app đăng nhập lại…');
	setTimeout(() => {
		ws.close();
		process.exit(0);
	}, WAIT);
})();
