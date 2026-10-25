'use strict';

/**
 * Waves 48 — ẢNH CHỤP "KIỂU TÊN HIỂN THỊ" với FONT THẬT của Discord.
 *
 * Dùng font `Headbang` (newRocker) tải đúng từ `discord.com/assets` — không phải
 * font thay thế — để ảnh phản ánh đúng thứ bro sẽ thấy trên app.
 *
 * Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/shot-wave48.js
 * Ảnh ra: build-release/wave48/
 */

const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'wave48');
const FONT_FILE = path.join(__dirname, 'fixtures', 'headbang.woff2');

app.whenReady().then(async () => {
	fs.mkdirSync(OUT, { recursive: true });
	const fontDataUrl = 'data:font/woff2;base64,' + fs.readFileSync(FONT_FILE).toString('base64');

	const server = http.createServer((req, res) => {
		const url = req.url.split('?')[0];
		const file = path.join(ROOT, url === '/' ? 'harness48-shot.html' : decodeURIComponent(url));
		let body;
		try {
			body = fs.readFileSync(file);
		} catch {
			res.writeHead(404);
			res.end('404');
			return;
		}
		const ext = path.extname(file).toLowerCase();
		res.writeHead(200, {
			'Content-Type':
				(ext === '.css' ? 'text/css' : ext === '.js' ? 'text/javascript' : ext === '.html' ? 'text/html' : 'application/octet-stream') +
				'; charset=utf-8',
		});
		res.end(body);
	});
	await new Promise((r) => server.listen(0, '127.0.0.1', r));
	const port = server.address().port;

	const USER = {
		id: '1815924981466669116',
		username: 'duyoz',
		globalName: 'Hsin',
		displayName: 'Hsin',
		avatar: null,
		premiumType: 2,
		badges: [],
	};

	fs.writeFileSync(
		path.join(ROOT, 'harness48-shot-api.js'),
		`(function(){
  const noop = () => Promise.resolve({ ok: true });
  const listeners = {};
  window.autoquest = new Proxy({}, { get(_t, k) {
    if (k === 'onLog') return (f) => { listeners.log = f; };
    if (k === 'onEvent') return (f) => { listeners.event = f; };
    if (k === 'onState') return (f) => { listeners.state = f; };
    if (k === 'getConfig') return () => Promise.resolve({ token: '', theme: 'dark', loopMode: true, loopInterval: 30 });
    if (k === 'authCheck') return () => Promise.resolve({ ok: true, user: ${JSON.stringify(USER)} });
    if (k === 'fetchOrbs') return () => Promise.resolve({ ok: true, balance: 358, claimed: 0, pending: 0 });
    if (k === 'dnsRead') return () => Promise.resolve({ ok: false });
    if (k === 'dnsFont') return () => Promise.resolve({ ok: true, dataUrl: window.__fontUrl, weight: 400 });
    return noop;
  }});
  window.__fontUrl = ${JSON.stringify(fontDataUrl)};
})();`,
		'utf8',
	);

	let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	html = html.replace(
		'<script src="renderer.js"></script>',
		'<script src="harness48-shot-api.js"></script>\n<script src="renderer.js"></script>',
	);
	html = html.replace(/img-src 'self' https:\/\/cdn\.discordapp\.com/, `img-src 'self' http://127.0.0.1:${port} https://cdn.discordapp.com data:`);
	fs.writeFileSync(path.join(ROOT, 'harness48-shot.html'), html, 'utf8');

	const win = new BrowserWindow({
		width: 1100,
		height: 720,
		show: false,
		backgroundColor: '#0b0d12',
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false, backgroundThrottling: false },
	});

	const js = (code) => win.webContents.executeJavaScript(code);

	try {
		await win.loadURL(`http://127.0.0.1:${port}/`);
		await new Promise((r) => setTimeout(r, 1500));

		/* Đăng nhập để hồ sơ hiện ra */
		await js(`(function(){
      const t = document.getElementById('token');
      t.value = 'AAAAAAAAAAAAAAAAAAAAAAAA.BBBBBB.CCCCCCCCCCCCCCCCCCCCCCCC';
      t.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
		await new Promise((r) => setTimeout(r, 1500));

		/* Áp kiểu tên THẬT: font Headbang + hiệu ứng Prism (dải màu chạy) */
		await js(`(async function(){
      if (typeof dnsRegisterFont === 'function') dnsRegisterFont('Headbang', window.__fontUrl, 400);
      try { await document.fonts.load('40px "Headbang"'); } catch(e) {}
      window.applyDisplayNameStyle({
        ok: true, text: 'Hsin', effect: 'prism', effectId: 7, minRatio: 2.5,
        colors: ['#ff2d95', '#a855f7', '#22d3ee', '#ff2d95'],
        font: { id: 15, className: 'newRocker', family: 'Headbang', weight: 400, letterSpacing: '', hasFile: true },
      });
      return document.fonts.check('40px "Headbang"');
    })()`);
		await new Promise((r) => setTimeout(r, 700));

		const shots = [
			{ theme: 'dark', name: '1-hero-dark.png' },
			{ theme: 'light', name: '2-hero-light.png' },
		];
		for (const s of shots) {
			await js(`document.getElementById('${s.theme === 'light' ? 'themeLight' : 'themeDark'}').click()`);
			await new Promise((r) => setTimeout(r, 450));
			await win.webContents.capturePage(); // lần đầu trả surface cũ → bỏ
			await new Promise((r) => setTimeout(r, 300));
			const img = await win.webContents.capturePage();
			fs.writeFileSync(path.join(OUT, s.name), img.toPNG());
			console.log('  ✓', s.name);
		}

		/* Ảnh cận tên để thấy rõ font + hiệu ứng */
		for (const s of shots) {
			await js(`document.getElementById('${s.theme === 'light' ? 'themeLight' : 'themeDark'}').click()`);
			await new Promise((r) => setTimeout(r, 450));
			await win.webContents.capturePage();
			await new Promise((r) => setTimeout(r, 260));
			const rect = await js(`(function(){
        const p = document.querySelector('.ph-nameplate');
        const r = p.getBoundingClientRect();
        return { x: Math.round(r.x - 8), y: Math.round(r.y - 8), width: Math.round(r.width + 16), height: Math.round(r.height + 16) };
      })()`);
			const img = await win.webContents.capturePage(rect);
			fs.writeFileSync(path.join(OUT, s.name.replace('hero', 'name')), img.toPNG());
			console.log('  ✓', s.name.replace('hero', 'name'));
		}
	} finally {
		for (const f of ['harness48-shot-api.js', 'harness48-shot.html']) {
			try {
				fs.unlinkSync(path.join(ROOT, f));
			} catch {
				/* ignore */
			}
		}
		server.close();
		app.exit(0);
	}
});
