'use strict';
/**
 * Waves 49 — Ảnh chụp PROFILE EFFECT + FRAME + THEME COLORS.
 * Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/shot-wave49.js
 */
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'wave49');

app.whenReady().then(async () => {
	fs.mkdirSync(OUT, { recursive: true });

	const server = http.createServer((req, res) => {
		const url = req.url.split('?')[0];
		const file = path.join(ROOT, url === '/' ? 'harness49-shot.html' : decodeURIComponent(url));
		let body;
		try { body = fs.readFileSync(file); } catch { res.writeHead(404); res.end('404'); return; }
		const ext = path.extname(file).toLowerCase();
		res.writeHead(200, { 'Content-Type': (ext === '.css' ? 'text/css' : ext === '.js' ? 'text/javascript' : 'text/html') + '; charset=utf-8' });
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
		profileEffect: { id: 'test-effect', expiresAt: null },
		themeColors: [0xff3366, 0x6633ff],
		profileBanner: null,
		avatarDecoration: null,
		avatarDecorationSku: null,
	};

	fs.writeFileSync(path.join(ROOT, 'harness49-shot-api.js'),
		`(function(){
  const noop = () => Promise.resolve({ ok: true });
  const listeners = {};
  window.autoquest = new Proxy({}, { get(_t, k) {
    if (k === 'onLog') return (f) => { listeners.log = f; };
    if (k === 'onEvent') return (f) => { listeners.event = f; };
    if (k === 'onState') return (f) => { listeners.state = f; };
    if (k === 'getConfig') return () => Promise.resolve({ token: '', theme: 'dark', loopMode: true, loopInterval: 30 });
    if (k === 'authCheck') return () => Promise.resolve({ ok: true, user: ${JSON.stringify(USER)} });
    if (k === 'fetchOrbs') return () => Promise.resolve({ ok: true, balance: 3580, claimed: 0, pending: 0 });
    if (k === 'dnsRead') return () => Promise.resolve({ ok: false });
    return noop;
  }});
})();`, 'utf8');

	let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	html = html.replace('<script src="renderer.js"></script>', '<script src="harness49-shot-api.js"></script>\n<script src="renderer.js"></script>');
	html = html.replace(/img-src 'self' https:\/\/cdn\.discordapp\.com/, `img-src 'self' http://127.0.0.1:${port} https://cdn.discordapp.com data:`);
	fs.writeFileSync(path.join(ROOT, 'harness49-shot.html'), html, 'utf8');

	const win = new BrowserWindow({ width: 1100, height: 720, show: false, backgroundColor: '#0b0d12',
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false, backgroundThrottling: false },
	});

	try {
		await win.loadURL(`http://127.0.0.1:${port}/`);
		await new Promise((r) => setTimeout(r, 1500));

		await win.webContents.executeJavaScript(`(function(){
      const t = document.getElementById('token');
      t.value = 'AAAAAAAAAAAAAAAAAAAAAAAA.BBBBBB.CCCCCCCCCCCCCCCCCCCCCCCC';
      t.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
		await new Promise((r) => setTimeout(r, 1500));

		const shots = [
			{ theme: 'dark', name: '1-hero-dark.png' },
			{ theme: 'light', name: '2-hero-light.png' },
		];
		for (const s of shots) {
			await win.webContents.executeJavaScript(`document.getElementById('${s.theme === 'light' ? 'themeLight' : 'themeDark'}').click()`);
			await new Promise((r) => setTimeout(r, 600));
			await win.webContents.capturePage();
			await new Promise((r) => setTimeout(r, 400));
			const img = await win.webContents.capturePage();
			fs.writeFileSync(path.join(OUT, s.name), img.toPNG());
			console.log('  ✓', s.name);
		}
	} finally {
		for (const f of ['harness49-shot-api.js', 'harness49-shot.html']) {
			try { fs.unlinkSync(path.join(ROOT, f)); } catch { /* ignore */ }
		}
		server.close();
		app.exit(0);
	}
});
