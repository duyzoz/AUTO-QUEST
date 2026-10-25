/* Wave#96 — chụp màn "Đang đăng nhập" ĐÚNG theme (bấm NÚT theme thật của app,
 * theo luật probe). Xuất 2 ảnh cho bro xem.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const OUT = path.join(__dirname, '..', 'shots-wave96');

http.get('http://127.0.0.1:9333/json/list', (r) => {
	let d = '';
	r.on('data', (c) => (d += c));
	r.on('end', () => {
		const p = JSON.parse(d).find((t) => t.type === 'page');
		const ws = new WebSocket(p.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
		let id = 0;
		const pend = new Map();
		ws.on('message', (raw) => { const m = JSON.parse(raw); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
		ws.on('open', async () => {
			const cmd = (method, params) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
			const ev = async (e) => {
				const r = await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
				if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
				return r.result && r.result.result ? r.result.result.value : undefined;
			};
			const shot = async (name) => {
				const r = await cmd('Page.captureScreenshot', { format: 'png' });
				if (r.result && r.result.data) {
					fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64'));
					console.log('  ✔', name);
				} else console.log('  ✘', name);
			};
			await cmd('Page.enable');
			await cmd('Runtime.enable');

			// TỐI: bấm NÚT theme thật (không setAttribute trực tiếp)
			await ev("(function(){const b=document.getElementById('themeDark'); if(b) b.click(); return document.documentElement.getAttribute('data-theme');})()");
			await new Promise((r) => setTimeout(r, 800));
			console.log('theme sau khi bấm Nút Tối =', await ev("document.documentElement.getAttribute('data-theme')"));
			// mở veil
			await ev("(function(){const v=document.getElementById('loginVeil'); if(v) v.hidden=false; return 'ok';})()");
			await new Promise((r) => setTimeout(r, 600));
			await shot('final-login-veil-DARK');
			await ev("(function(){const v=document.getElementById('loginVeil'); if(v) v.hidden=true; return 'ok';})()");

			// SÁNG
			await ev("(function(){const b=document.getElementById('themeLight'); if(b) b.click(); return 'ok';})()");
			await new Promise((r) => setTimeout(r, 900));
			console.log('theme sau khi bấm Nút Sáng =', await ev("document.documentElement.getAttribute('data-theme')"));
			await ev("(function(){const v=document.getElementById('loginVeil'); if(v) v.hidden=false; return 'ok';})()");
			await new Promise((r) => setTimeout(r, 600));
			await shot('final-login-veil-LIGHT');
			await ev("(function(){const v=document.getElementById('loginVeil'); if(v) v.hidden=true; return 'ok';})()");

			// chụp toàn app 2 theme (sau khi đóng veil)
			await new Promise((r) => setTimeout(r, 400));
			await ev("(function(){const b=document.getElementById('themeDark'); if(b) b.click(); return 'ok';})()");
			await new Promise((r) => setTimeout(r, 900));
			await shot('final-app-DARK');
			await ev("(function(){const b=document.getElementById('themeLight'); if(b) b.click(); return 'ok';})()");
			await new Promise((r) => setTimeout(r, 900));
			await shot('final-app-LIGHT');
			console.log('xong.');
			process.exit(0);
		});
	});
});
