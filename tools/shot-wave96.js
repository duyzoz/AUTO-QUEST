/* Wave#96 — CHỤP ẢNH THẬT từ app đang chạy (CDP 9333).
 * Mở rộng: brand (logo cạnh tên + vòng), nút Đăng xuất 2 theme, acc list,
 * và màn "Đang đăng nhập".
 * Dùng: env -u ELECTRON_RUN_AS_NODE npx electron tools/shot-wave96.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'shots-wave96');
fs.mkdirSync(OUT, { recursive: true });

const CDP = 'http://127.0.0.1:9333';

function getJson(url) {
	return new Promise((res, rej) => {
		http.get(url, (r) => {
			let d = '';
			r.on('data', (c) => (d += c));
			r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
		}).on('error', rej);
	});
}

app();
async function app() {
	const list = await getJson(CDP + '/json/list');
	const page = list.find((t) => t.type === 'page');
	if (!page) { console.log('không có page'); process.exit(1); }
	const wsUrl = page.webSocketDebuggerUrl;
	console.log('page:', page.title, '\nws:', wsUrl);

	const WebSocket = require('ws');
	const ws = new WebSocket(wsUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
	let id = 0;
	const pend = new Map();
	ws.on('message', (raw) => {
		const m = JSON.parse(raw);
		if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
	});
	const send = (method, params) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
	await new Promise((r) => ws.on('open', r));

	// Envelope: r.result.result.value
	const evaluate = async (expr) => {
		const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
		if (r.result && r.result.exceptionDetails) {
			throw new Error('EVAL: ' + JSON.stringify(r.result.exceptionDetails.exception || r.result.exceptionDetails));
		}
		return r.result && r.result.result ? r.result.result.value : undefined;
	};
	const shot = async (name) => {
		const r = await send('Page.captureScreenshot', { format: 'png' });
		const b64 = r.result && r.result.data;
		if (!b64) { console.log('  ✘ không chụp được', name); return; }
		const p = path.join(OUT, name + '.png');
		fs.writeFileSync(p, Buffer.from(b64, 'base64'));
		console.log('  ✔', p, (fs.statSync(p).size / 1024).toFixed(0) + 'KB');
	};

	await send('Page.enable');
	await send('Runtime.enable');
	// Chụp 1 lần bỏ (surface cũ)
	await shot('warmup');

	// ---------- Tối ----------
	await evaluate(`document.documentElement.setAttribute('data-theme','dark');'ok'`);
	await new Promise((r) => setTimeout(r, 700));
	await shot('dark-full');

	// Brand cận cảnh
	const box = await evaluate(`(function(){
		const b=document.querySelector('.side-brand');
		if(!b) return null;
		const r=b.getBoundingClientRect();
		return JSON.stringify({x:Math.round(r.x)-8,y:Math.round(r.y)-8,w:Math.round(r.width)+16,h:Math.round(r.height)+16});
	})()`);
	if (box) {
		const b = JSON.parse(box);
		const r = await send('Page.captureScreenshot', {
			format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 4 },
		});
		if (r.result && r.result.data) {
			fs.writeFileSync(path.join(OUT, 'dark-brand.png'), Buffer.from(r.result.data, 'base64'));
			console.log('  ✔ dark-brand.png (vùng logo+tên, zoom 4x)');
		}
	}

	// Nút Đăng xuất trong hàng panel
	const lb = await evaluate(`(function(){
		const el=document.getElementById('btnLogout');
		if(!el||el.hidden) return null;
		const r=el.getBoundingClientRect();
		return JSON.stringify({x:Math.round(r.x)-26,y:Math.round(r.y)-26,w:Math.round(r.width)+52,h:Math.round(r.height)+52});
	})()`);
	if (lb) {
		const b = JSON.parse(lb);
		const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 4 } });
		if (r.result && r.result.data) { fs.writeFileSync(path.join(OUT, 'dark-logout.png'), Buffer.from(r.result.data, 'base64')); console.log('  ✔ dark-logout.png'); }
	} else { console.log('  (btnLogout đang ẩn — bỏ qua)'); }

	// ---------- Sáng ----------
	await evaluate(`document.documentElement.setAttribute('data-theme','light');'ok'`);
	await new Promise((r) => setTimeout(r, 700));
	await shot('light-full');
	if (lb) {
		const b = JSON.parse(lb);
		const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 4 } });
		if (r.result && r.result.data) { fs.writeFileSync(path.join(OUT, 'light-logout.png'), Buffer.from(r.result.data, 'base64')); console.log('  ✔ light-logout.png'); }
	}
	if (box) {
		const b = JSON.parse(box);
		const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 4 } });
		if (r.result && r.result.data) { fs.writeFileSync(path.join(OUT, 'light-brand.png'), Buffer.from(r.result.data, 'base64')); console.log('  ✔ light-brand.png'); }
	}

	// ---------- Màn "Đang đăng nhập" ----------
	await evaluate(`(function(){
		const v=document.getElementById('loginVeil');
		if(v){ v.hidden=false; }
		return 'ok';
	})()`);
	await new Promise((r) => setTimeout(r, 500));
	await shot('login-veil-dark');
	await evaluate(`document.documentElement.setAttribute('data-theme','light');'ok'`);
	await new Promise((r) => setTimeout(r, 400));
	await shot('login-veil-light');
	await evaluate(`(function(){const v=document.getElementById('loginVeil'); if(v) v.hidden=true; return 'ok';})()`);

	console.log('\nXong. Ảnh ở', OUT);
	ws.close();
	process.exit(0);
}
