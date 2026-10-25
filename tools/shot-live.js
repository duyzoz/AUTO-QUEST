'use strict';
const fs = require('node:fs');
const path = require('node:path');
const PORT = Number(process.env.AQ_REMOTE_DEBUG || 9333);
const HTTP = `http://127.0.0.1:${PORT}`;

function cdp(target, method, params) {
	const WebSocket = require('ws');
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
		let id = 0;
		const pending = new Map();
		ws.on('open', () => send(method, params));
		function send(m, p) {
			const mid = ++id;
			pending.set(mid, true);
			ws.send(JSON.stringify({ id: mid, method: m, params: p }));
		}
		ws.on('message', (raw) => {
			let msg;
			try {
				msg = JSON.parse(raw.toString());
			} catch {
				return;
			}
			if (msg.id && pending.has(msg.id)) {
				pending.delete(msg.id);
				ws.close();
				if (msg.error) return reject(new Error(JSON.stringify(msg.error)));
				resolve(msg.result);
			}
		});
		ws.on('error', reject);
		setTimeout(() => { try { ws.close(); } catch {} reject(new Error('timeout')); }, 30000);
	});
}

async function main() {
	const list = await (await fetch(`${HTTP}/json/list`)).json();
	const page = list.find((t) => t.type === 'page' && !/devtools/.test(t.url));
	if (!page) throw new Error('no page');
	await cdp(page, 'Page.enable');
	// chụp 2 lần, lấy lần sau (bẫy surface cũ)
	await cdp(page, 'Page.captureScreenshot', { format: 'png' });
	await new Promise((r) => setTimeout(r, 400));
	const shot = await cdp(page, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
	const out = path.join(process.cwd(), 'build-release', 'wave49b');
	fs.mkdirSync(out, { recursive: true });
	const f = path.join(out, `live-${Date.now()}.png`);
	fs.writeFileSync(f, Buffer.from(shot.data, 'base64'));
	console.log('SHOT ' + f);
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
