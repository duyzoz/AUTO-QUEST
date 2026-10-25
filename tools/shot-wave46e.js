/* Waves 46e — ẢNH CHỨNG MINH cho 2 yêu cầu của bro:
     1) NHẬT KÝ: mỗi nhãn `[ … ]` có LOGO riêng đặt ngay sau nhãn; chữ thường
        một màu trung tính, CHỮ CHÍNH màu đỏ; dòng dài gói trong 2 dòng; dòng
        NHẬN ORBS THÀNH CÔNG chạy cầu vồng.
     2) HỒ SƠ ở chế độ SÁNG: chữ không còn chìm trên ảnh banner sáng.

   Vì sao phải có HTTP server nội bộ: ảnh banner là ảnh THẬT (cùng origin mới
   nạp được — `file://` → `http://127.0.0.1` bị Chromium chặn bởi Private
   Network Access). Ảnh banner được sinh bằng PIL: một tấm SÁNG (đúng ca bro
   gửi ảnh) và một tấm TỐI, để thấy chữ đọc được trên CẢ HAI.

   Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/shot-wave46e.js */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'wave46e');
const PY = 'C:/Users/Admin/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe';

/* ---- Sinh 2 ảnh banner (SÁNG / TỐI) bằng PIL, giống ảnh chụp của bro ---- */
function makeBanner(file, kind) {
	if (fs.existsSync(file)) return fs.readFileSync(file);
	const { execFileSync } = require('child_process');
	const code =
		kind === 'light'
			? `
from PIL import Image, ImageDraw, ImageFilter
W,H = 900, 300
im = Image.new('RGB', (W,H), (246,247,250))
d = ImageDraw.Draw(im)
for i in range(0, W, 3):
    t = i / float(W)
    c = (int(240 + 12*t), int(242 + 10*t), int(247 + 8*t))
    d.line([(i,0),(i,H)], fill=c)
d.ellipse([-120, 150, 420, 520], fill=(255,255,255))
d.ellipse([520, -60, 980, 300], fill=(250,250,252))
im = im.filter(ImageFilter.GaussianBlur(9))
im.save(r'${file}')
`
			: `
from PIL import Image, ImageDraw, ImageFilter
W,H = 900, 300
im = Image.new('RGB', (W,H), (26,30,46))
d = ImageDraw.Draw(im)
for i in range(0, W, 3):
    t = i / float(W)
    c = (int(24 + 30*t), int(28 + 26*t), int(44 + 40*t))
    d.line([(i,0),(i,H)], fill=c)
d.ellipse([-140, 120, 460, 560], fill=(60,66,110))
d.ellipse([560, -80, 1000, 320], fill=(44,48,86))
im = im.filter(ImageFilter.GaussianBlur(11))
im.save(r'${file}')
`;
	execFileSync(PY, ['-c', code], { stdio: 'ignore' });
	return fs.readFileSync(file);
}

const BANNERS = {};
const server = http.createServer((req, res) => {
	const url = req.url.split('?')[0];
	if (/^\/banner-(light|dark)\.png$/.test(url)) {
		const buf = BANNERS[url.slice(1)] || BANNERS['banner-light.png'];
		res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': buf.length });
		res.end(buf);
		return;
	}
	if (/\.(png|jpe?g|svg|woff2?)$/i.test(url)) {
		let buf;
		try {
			buf = fs.readFileSync(path.join(ROOT, decodeURIComponent(url)));
		} catch {
			res.writeHead(404);
			res.end('404');
			return;
		}
		const ext = path.extname(url).toLowerCase();
		const type = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'application/octet-stream';
		res.writeHead(200, { 'Content-Type': type, 'Content-Length': buf.length });
		res.end(buf);
		return;
	}
	const file = path.join(ROOT, url === '/' ? 'harness46e.html' : decodeURIComponent(url));
	let body;
	try {
		body = fs.readFileSync(file);
	} catch {
		res.writeHead(404);
		res.end('404');
		return;
	}
	const ext = path.extname(file).toLowerCase();
	const type =
		ext === '.css'
			? 'text/css'
			: ext === '.js'
				? 'text/javascript'
				: ext === '.html' || ext === '.htm'
					? 'text/html'
					: 'application/octet-stream';
	res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
	res.end(body);
});

/* Ấm máy trước khi đo (lần chụp ĐẦU sau một thay đổi trả về surface CŨ). */
async function shot(win, name) {
	await win.webContents.capturePage();
	await new Promise((r) => setTimeout(r, 220));
	const img = await win.webContents.capturePage();
	fs.writeFileSync(path.join(OUT, name), img.toPNG());
	console.log('  saved:', name);
}

/* Cắt một vùng từ ảnh TOÀN TRANG (capturePage(rect) trả frame cũ — đã gặp thật). */
async function shotRegion(win, selector, name, pad) {
	const rect = await win.webContents.executeJavaScript(
		`(function(){const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;
      const r=el.getBoundingClientRect();
      return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};})()`,
		true,
	);
	if (!rect || rect.w <= 0) {
		console.log('  BỎ QUA', name, '(không thấy', selector, ')');
		return;
	}
	await win.webContents.capturePage();
	await new Promise((r) => setTimeout(r, 220));
	const full = await win.webContents.capturePage();
	const tmp = path.join(require('os').tmpdir(), 'w46e-full.png');
	fs.writeFileSync(tmp, full.toPNG());
	const { execFileSync } = require('child_process');
	const pad2 = pad || 10;
	const outFile = path.join(OUT, name).split(String.fromCharCode(92)).join('/');
	const code = `
from PIL import Image
im = Image.open(r'${tmp.split(String.fromCharCode(92)).join('/')}')
scale = im.width / 1920.0
box = tuple(int(v*scale) for v in (${rect.x - pad2}, ${rect.y - pad2}, ${rect.x + rect.w + pad2}, ${rect.y + rect.h + pad2}))
box = (max(0,box[0]), max(0,box[1]), min(im.width,box[2]), min(im.height,box[3]))
c = im.crop(box)
c.resize((int(c.width*2), int(c.height*2)), Image.LANCZOS).save(r'${outFile}')
`;
	execFileSync(PY, ['-c', code], { stdio: 'ignore' });
	console.log('  saved:', name);
}

const LOG_LINES = [
	['[Hệ thống] Đã đăng nhập Discord: @duyoz', 'system'],
	['Đã nạp 69 nhiệm vụ (7.3s)', 'ok'],
	['[Hệ thống] Số Orb khả dụng (ví dụ Discord): 3580', 'system'],
	['[OK] Đã nhận "ROR2 Hallowed Concepts" (+15 Orbs) — Discord xác nhận.', 'ok'],
	['[Cảnh báo] Nhận "A Very Long Quest Name That Goes On" bị giới hạn tốc độ (429) — thử lại sau 12 giây.', 'warn'],
	['[Lỗi] Nhận "Zenless Zone Zero" thất bại: Discord trả lỗi không xác định, cần thử lại sau khi kiểm tra kết nối mạng.', 'stderr'],
];

app.whenReady().then(async () => {
	fs.mkdirSync(OUT, { recursive: true });
	BANNERS['banner-light.png'] = makeBanner(path.join(OUT, 'banner-light.png'), 'light');
	BANNERS['banner-dark.png'] = makeBanner(path.join(OUT, 'banner-dark.png'), 'dark');
	await new Promise((r) => server.listen(0, '127.0.0.1', r));
	const port = server.address().port;

	let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	fs.writeFileSync(path.join(ROOT, 'harness46e-api.js'), `(function(){
    const h={log:null,event:null,state:null};window.__h=h;
    const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
    window.autoquest=new Proxy({},{get(_t,k){
      if(k==='onLog')return x=>{h.log=x;};
      if(k==='onEvent')return x=>{h.event=x;};
      if(k==='onState')return x=>{h.state=x;};
      if(k==='authCheck')return ()=>Promise.resolve({ok:false});
      return f;}});})();`, 'utf8');
	html = html.replace(
		'<script src="renderer.js"></script>',
		'<script src="harness46e-api.js"></script>\n<script src="renderer.js"></script>',
	);
	html = html.replace(
		/img-src 'self' https:\/\/cdn\.discordapp\.com/,
		`img-src 'self' http://127.0.0.1:${port} https://cdn.discordapp.com`,
	);
	fs.writeFileSync(path.join(ROOT, 'harness46e.html'), html, 'utf8');

	const win = new BrowserWindow({
		width: 1920,
		height: 1080,
		show: false,
		backgroundColor: '#0b0d12',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: false,
			webSecurity: false,
			backgroundThrottling: false,
		},
	});
	win.webContents.on('console-message', () => {});
	const cleanup = () => {
		for (const f of ['harness46e-api.js', 'harness46e.html']) {
			try {
				fs.unlinkSync(path.join(ROOT, f));
			} catch {
				/* đã xoá */
			}
		}
		server.close();
	};
	try {
		await win.loadURL(`http://127.0.0.1:${port}/`);
		await new Promise((r) => setTimeout(r, 1500));
		// Ép prefers-reduced-motion: no-preference để thấy cầu vồng CHẠY.
		try {
			win.webContents.debugger.attach('1.3');
			await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
				features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
			});
		} catch (e) {
			console.log('  (không ép được reduced-motion:', e.message, ')');
		}

		// Hồ sơ thật: chữ + ID + banner (banner ghi đè bằng ảnh nội bộ).
		await win.webContents.executeJavaScript(
			`(function(){
        const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
        const hero=document.getElementById('heroProfile');
        if(hero) hero.hidden=false;
        set('phDisplay','Hsin');
        set('phUsername','@duyoz');
        set('phUserIdValue','1815924981466669116');
        const uid=document.getElementById('phUserId'); if(uid) uid.hidden=false;
        const np=document.getElementById('phNameplate');
        if(np) np.style.setProperty('--np','#e0416a');
        const b=document.getElementById('phBanner');
        if(b){ b.classList.remove('default'); b.style.background="center / cover no-repeat url('/banner-light.png')"; }
        return 'ok';
      })()`,
			true,
		);
		await new Promise((r) => setTimeout(r, 900));

		// Nhật ký
		await win.webContents.executeJavaScript(
			`(function(){
        if (typeof appendLog !== 'function') return 'nofn';
        ${LOG_LINES.map(([l, s]) => `appendLog(${JSON.stringify(l)}, ${JSON.stringify(s)});`).join('\n        ')}
        return 'ok';
      })()`,
			true,
		);
		await new Promise((r) => setTimeout(r, 2600));

		const dark = async () => win.webContents.executeJavaScript(`document.getElementById('themeDark').click()`, true);
		const light = async () => win.webContents.executeJavaScript(`document.getElementById('themeLight').click()`, true);

		await dark();
		await new Promise((r) => setTimeout(r, 800));
		await shotRegion(win, '.log-card, #console', '1-log-dark.png', 12);

		await light();
		await new Promise((r) => setTimeout(r, 800));
		await shotRegion(win, '.log-card, #console', '2-log-light.png', 12);

		// Cận cảnh dòng cầu vồng (ảnh lớn để soi màu).
		await shotRegion(win, '.u229-line.is-orbwin', '3-rainbow-light.png', 6);
		await dark();
		await new Promise((r) => setTimeout(r, 700));
		await shotRegion(win, '.u229-line.is-orbwin', '4-rainbow-dark.png', 6);

		// Hồ sơ trên banner SÁNG ở cả 2 theme (đúng ca bro báo chìm màu).
		await light();
		await new Promise((r) => setTimeout(r, 700));
		await shotRegion(win, '#heroProfile', '5-hero-light-on-light-banner.png', 8);
		await dark();
		await new Promise((r) => setTimeout(r, 700));
		await shotRegion(win, '#heroProfile', '6-hero-dark-on-light-banner.png', 8);

		// Hồ sơ trên banner TỐI (ca ngược lại — phải đọc được ở cả hai).
		await win.webContents.executeJavaScript(
			`(function(){const b=document.getElementById('phBanner');
        if(b) b.style.background="center / cover no-repeat url('/banner-dark.png')"; return 1;})()`,
			true,
		);
		await new Promise((r) => setTimeout(r, 700));
		await shotRegion(win, '#heroProfile', '7-hero-dark-on-dark-banner.png', 8);
		await light();
		await new Promise((r) => setTimeout(r, 700));
		await shotRegion(win, '#heroProfile', '8-hero-light-on-dark-banner.png', 8);

		cleanup();
		app.exit(0);
	} catch (e) {
		console.log('SHOT ERROR:', e && e.stack ? e.stack : String(e));
		cleanup();
		app.exit(2);
	}
});
