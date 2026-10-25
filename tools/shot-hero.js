/* Chụp vùng thẻ hero rồi lưu PNG để soi bằng PIL (Read không xem được ảnh).
   Chụp TOÀN trang (clip có thể lỗi khi vượt viewport), rồi để PIL cắt.
   Dùng: node tools/shot-hero.js [out.png] */
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || path.join(__dirname, '..', '.tmp', 'shot-hero.png');
const PORT = process.env.AQ_REMOTE_DEBUG || '9333';

(async () => {
	const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
	const page = list.find((t) => t.type === 'page');
	const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
	let id = 0;
	const send = (method, params) =>
		new Promise((res) => {
			const my = ++id;
			const on = (raw) => {
				const m = JSON.parse(raw);
				if (m.id === my) {
					ws.off('message', on);
					res(m);
				}
			};
			ws.on('message', on);
			ws.send(JSON.stringify({ id: my, method, params }));
		});
	await new Promise((r) => ws.on('open', r));
	await send('Page.enable');

	const expr = `(()=>{
    const rect=(el)=>{if(!el)return null;const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};};
    return JSON.stringify({
      hero: rect(document.querySelector('.profile-hero, .hero-card')),
      pop: rect(document.querySelector('.up-pop')),
      theme: document.documentElement.dataset.theme || '',
      dpr: window.devicePixelRatio || 1,
      vw: innerWidth, vh: innerHeight,
    });
  })()`;
	const e = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
	const geo = JSON.parse(e.result.result.value);

	// Chụp 2 lần, lấy lần sau (bẫy surface cũ của capturePage).
	await send('Page.captureScreenshot', { format: 'png' });
	await new Promise((r) => setTimeout(r, 450));
	const cap = await send('Page.captureScreenshot', { format: 'png' });
	if (!cap.result || !cap.result.data) throw new Error('capture thất bại: ' + JSON.stringify(cap).slice(0, 300));

	fs.mkdirSync(path.dirname(OUT), { recursive: true });
	fs.writeFileSync(OUT, Buffer.from(cap.result.data, 'base64'));
	console.log('SHOT', OUT);
	console.log('GEO', JSON.stringify(geo));
	ws.close();
	process.exit(0);
})().catch((err) => {
	console.error('ERR', err.message);
	process.exit(1);
});
