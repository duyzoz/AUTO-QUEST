/* Waves 46c — CHỤP ẢNH KIỂM CHỨNG cho 3 yêu cầu bro nêu lần 3:
     1) "cho cái logo orb to ra tí nữa vẫn bé quá"   -> orb hero 120px, orb trong ô 53px.
     2) "nhiều cái ko hiện logo orbs"                -> badge Orb hiện trên MỌI ô.
     3) "chưa hiện được logo riêng của từng nhiệm vụ ... cả logo chữ quest
         từng nhiệm vụ"                               -> mỗi ô có LOGO GAME + CHỮ TÊN.

   KHÁC BIỆT so với shot-wave46b: ở đây ta chạy một HTTP SERVER NỘI BỘ phục vụ
   ảnh PNG thật và nạp trang TỪ CHÍNH server đó (cùng origin). Nhờ vậy logo game
   nạp được THẬT và ảnh chụp phản ánh đúng thứ bro sẽ thấy khi có mạng — nếu
   nạp bằng file:// thì ảnh CDN không tải được và mọi ô chỉ còn chữ.

   Xuất PNG vào build-release/wave46c/. Chạy:
     env -u ELECTRON_RUN_AS_NODE npx electron tools/shot-wave46c.js */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const ASSETS = path.join(ROOT, 'assets');
const OUT = path.join(__dirname, '..', 'build-release', 'wave46c');

const PNG = fs.readFileSync(path.join(ASSETS, 'orb-logo-big.png'));

/* Ảnh GIẢ LẬP cho harness — để ảnh chụp phản ánh ĐÚNG hình dạng thật:
   · logotype Discord là wordmark NGANG (tỉ lệ ~1200×360) → ta vẽ chữ trắng
     trên nền trong suốt, đúng tỉ lệ đó.
   · app icon là ảnh VUÔNG nhỏ.
   Nếu trả cùng một ảnh orb cho mọi URL thì ô sẽ trông như "hai logo orb" —
   sai bản chất và làm ta đánh giá sai kết quả. */
function makeWordmarkPng(text) {
	const { execFileSync } = require('child_process');
	const py = 'C:/Users/Admin/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe';
	const out = path.join(require('os').tmpdir(), `wm-${Buffer.from(text).toString('hex').slice(0, 24)}.png`);
	if (fs.existsSync(out)) return fs.readFileSync(out);
	const code = `
from PIL import Image, ImageDraw, ImageFont
W,H = 600, 180
im = Image.new('RGBA', (W,H), (0,0,0,0))
d = ImageDraw.Draw(im)
try:
    f = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 62)
except Exception:
    f = ImageFont.load_default()
t = ${JSON.stringify(text)}
bb = d.textbbox((0,0), t, font=f)
tw, th = bb[2]-bb[0], bb[3]-bb[1]
d.text(((W-tw)//2 - bb[0], (H-th)//2 - bb[1]), t, font=f, fill=(255,255,255,255))
im.save(r'${out.split(String.fromCharCode(92)).join('/')}')
`;
	execFileSync(py, ['-c', code], { stdio: 'ignore' });
	return fs.readFileSync(out);
}

function makeIconPng(seed) {
	const { execFileSync } = require('child_process');
	const py = 'C:/Users/Admin/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe';
	const out = path.join(require('os').tmpdir(), `ic-${seed}.png`);
	if (fs.existsSync(out)) return fs.readFileSync(out);
	const hue = (seed * 47) % 360;
	const code = `
from PIL import Image, ImageDraw
import colorsys
h = ${hue}/360.0
r,g,b = colorsys.hsv_to_rgb(h, 0.55, 0.95)
im = Image.new('RGBA', (256,256), (0,0,0,0))
d = ImageDraw.Draw(im)
d.rounded_rectangle([8,8,247,247], radius=56, fill=(int(r*255),int(g*255),int(b*255),255))
im.save(r'${out.split(String.fromCharCode(92)).join('/')}')
`;
	execFileSync(py, ['-c', code], { stdio: 'ignore' });
	return fs.readFileSync(out);
}

/* Lấy tên game từ đường dẫn /quests/{id}/... dựa vào danh sách fixture. */
let FIXTURE_BY_QUEST = {};

/* Server nội bộ: ảnh → PNG thật; còn lại → file tĩnh trong electron/renderer. */
const server = http.createServer((req, res) => {
	const url = req.url.split('?')[0];
	if (/\.(png|jpe?g|gif|webp)$/i.test(url)) {
		let buf = PNG;
		const q = url.match(/^\/quests\/([^/]+)\//);
		const a = url.match(/^\/app-icons\/([^/]+)\//);
		if (q) buf = makeWordmarkPng(FIXTURE_BY_QUEST[q[1]] || 'GAME');
		else if (a) buf = makeIconPng(Number(a[1].slice(-2)) || 1);
		res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': buf.length });
		res.end(buf);
		return;
	}
	const file = path.join(ROOT, url === '/' ? 'harness-index.html' : decodeURIComponent(url));
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

/* 18 nhiệm vụ đã nhận, mỗi ô có tên game khác nhau → nhìn rõ "logo riêng từng nhiệm vụ". */
const GAMES = [
	'Genshin Impact',
	'Valorant',
	'League of Legends',
	'Fortnite',
	'Honkai: Star Rail',
	'Rocket League',
	'Minecraft',
	'Apex Legends',
	'Overwatch 2',
	'Wuthering Waves',
	'Diablo IV',
	'Zenless Zone Zero',
	'Warframe',
	'Dead by Daylight',
	'Fall Guys',
	'Clash Royale',
	'PUBG: Battlegrounds',
	'Path of Exile 2',
];

function buildHtml(port) {
	let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	const list = GAMES.map((g, i) => ({
		id: String(i + 1),
		name: `${g} — hoàn thành nhiệm vụ`,
		description: 'Mô tả nhiệm vụ',
		status: 'claimed',
		progress: 100,
		orbs: i % 5 === 0 ? 0 : [5, 15, 300, 50, 100, 25, 10, 75, 200, 30][i % 10],
		// i % 5 === 0 → thưởng vật phẩm (không có Orb): đúng nhóm "nhiều cái ko hiện logo orbs".
		rewardKind: i % 5 === 0 ? 'item' : 'orbs',
		rewardName: i % 5 === 0 ? 'Avatar Decoration' : undefined,
		gameTitle: g,
		// Discord luôn trả claimed_at khi status='claimed' → tooltip có ngày dd/mm.
		claimedAt: new Date(Date.UTC(2026, 9, 22 - i, 10, 15)).toISOString(),
		// Ba nấc leo thang khác nhau để chứng minh cả chuỗi dự phòng đều cho ra logo.
		logotype: i % 3 === 0 ? `quests/${i + 1}/logo.png` : undefined,
		gameTile: i % 3 === 1 ? `quests/${i + 1}/tile.png` : undefined,
		appId: '1234567890123456' + String(i % 10),
		appIcon: 'icon' + i,
	}));
	fs.writeFileSync(path.join(ROOT, 'harness-data.js'), 'window.__LIST = ' + JSON.stringify(list) + ';\n', 'utf8');
	fs.writeFileSync(
		path.join(ROOT, 'harness-api.js'),
		`(function(){
    const handlers = { log:null, event:null, state:null };
    window.__h = handlers;
    const asyncFn = () => Promise.resolve({ ok:true, state:'idle', config:{} });
    window.autoquest = new Proxy({}, { get(_t,k){
      if(k==='onLog') return fn=>{handlers.log=fn;};
      if(k==='onEvent') return fn=>{handlers.event=fn;};
      if(k==='onState') return fn=>{handlers.state=fn;};
      if(k==='authCheck') return () => Promise.resolve({ ok:false });
      return asyncFn;
    }});
  })();`,
		'utf8',
	);
	html = html.replace(
		'<script src="renderer.js"></script>',
		`<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>`,
	);
	/* LƯU Ý: KHÔNG sửa hằng QCDN ở đây. QCDN nằm trong renderer.js (file riêng),
	   nên replace trên chuỗi HTML là VÔ TÁC DỤNG — ảnh vẫn gọi CDN thật với đường
	   dẫn giả → 404 → mọi ô rơi về chữ. Phải ghi một renderer ĐÃ PATCH thành file
	   riêng rồi trỏ <script> sang file đó (xem patchedRenderer bên dưới). */
	void port;
	// CSP chỉ cho cdn.discordapp.com ở img-src → nới cho origin nội bộ (chỉ ở bản probe).
	html = html.replace(
		/img-src 'self' https:\/\/cdn\.discordapp\.com/,
		`img-src 'self' http://127.0.0.1:${port} https://cdn.discordapp.com`,
	);
	return html;
}

/* Ghi renderer.js ĐÃ đổi QCDN sang server nội bộ, thành file riêng để nạp. */
function writePatchedRenderer(port) {
	const src = fs.readFileSync(path.join(ROOT, 'renderer.js'), 'utf8');
	const needle = "const QCDN = 'https://cdn.discordapp.com/';";
	if (!src.includes(needle)) throw new Error('shot: không tìm thấy hằng QCDN trong renderer.js');
	fs.writeFileSync(
		path.join(ROOT, 'harness-renderer.js'),
		src.replace(needle, `const QCDN = 'http://127.0.0.1:${port}/';`),
		'utf8',
	);
}

/* capturePage() lần ĐẦU sau một thay đổi (theme, trạng thái hover) trả về
   SURFACE CŨ — bộ compositor chưa đẩy frame mới. Vì vậy luôn chụp 2 lần và
   dùng lần sau. Đã gặp thật: ảnh 2 và 4 (theme Sáng) ra TOÀN NỀN TỐI dù
   `data-theme` đã là "light", trong khi ảnh 7 (chụp 2 lần) ra đúng nền sáng. */
async function shot(win, name) {
	await win.webContents.capturePage();
	await new Promise((r) => setTimeout(r, 220));
	const img = await win.webContents.capturePage();
	fs.writeFileSync(path.join(OUT, name), img.toPNG());
	console.log('  saved:', name);
}

/* Chụp ô đang hover: capturePage() TOÀN TRANG rồi cắt bằng PIL.
   LÝ DO: capturePage(rect) trả về FRAME CŨ đã vẽ trước đó (đã gặp thật — ảnh
   vẫn là mặt trước dù opacity đã đổi). Chụp 2 lần, lấy lần sau.
   Đồng thời lưu ảnh TOÀN TRANG để soi khi nghi ngờ cắt nhầm vùng. */
async function shotHover(win, outName) {
	await win.webContents.capturePage();
	await new Promise((r) => setTimeout(r, 250));
	const full = await win.webContents.capturePage();
	const buf = full.toPNG();
	fs.writeFileSync(path.join(OUT, outName.replace('.png', '-fullpage.png')), buf);
	const tmpFull = path.join(require('os').tmpdir(), 'hover-full.png');
	fs.writeFileSync(tmpFull, buf);

	const rect = await win.webContents.executeJavaScript(
		`(function(){
      const t = document.querySelector('#questListDone .qdone--hover');
      if (!t) return null;
      const r = t.getBoundingClientRect();
      return { x: Math.round(r.x) - 8, y: Math.round(r.y) - 8, width: Math.round(r.width) + 16, height: Math.round(r.height) + 16 };
    })()`,
		true,
	);
	console.log('  hover tile rect:', JSON.stringify(rect));
	if (!rect || rect.width <= 0) return;

	const { execFileSync } = require('child_process');
	const py = 'C:/Users/Admin/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe';
	const outFile = path.join(OUT, outName).split(String.fromCharCode(92)).join('/');
	const code = `
from PIL import Image
im = Image.open(r'${tmpFull.split(String.fromCharCode(92)).join('/')}')
# ảnh capturePage có thể là 1x hoặc 2x DPR — suy tỉ lệ từ bề rộng thật
scale = im.width / float(1920)
box = tuple(int(v*scale) for v in (${rect.x}, ${rect.y}, ${rect.x + rect.width}, ${rect.y + rect.height}))
im.crop(box).resize((int((box[2]-box[0])*2.2), int((box[3]-box[1])*2.2)), Image.LANCZOS).save(r'${outFile}')
`;
	execFileSync(py, ['-c', code], { stdio: 'ignore' });
	console.log('  saved:', outName);
}

/* Bật trạng thái hover trên ô ĐẦU TIÊN: thêm lớp .qdone--hover (Chromium
   headless không bắn :hover từ script), TẮT transition để trạng thái là tức
   thì (nếu để 0.22s, ảnh chụp có thể rơi vào frame GIỮA đường), đưa ô vào giữa
   khung nhìn, rồi chờ rAF THẬT (có timeout) cho compositor đẩy frame mới. */
async function armHover(win) {
	const prep = await win.webContents.executeJavaScript(
		`(function(){
      if (!document.getElementById('__notrans')) {
        const st = document.createElement('style');
        st.id = '__notrans';
        st.textContent = '.qdone-face,.qdone-name,.qdone-info{transition:none !important;}';
        document.head.appendChild(st);
      }
      const t = document.querySelector('#questListDone .qdone');
      if (!t) return { ok:false };
      t.classList.add('qdone--hover');
      t.scrollIntoView({ block: 'center', inline: 'nearest' });
      const f = t.querySelector('.qdone-face');
      const i = t.querySelector('.qdone-info');
      const n = t.querySelector('.qdone-name');
      return {
        ok: true,
        questId: t.dataset.questId,
        face: f ? getComputedStyle(f).opacity : null,
        info: i ? getComputedStyle(i).opacity : null,
        name: n ? getComputedStyle(n).opacity : null,
        infoKids: i ? i.children.length : 0,
        infoText: i ? (i.textContent || '').replace(/\\s+/g, ' ').trim() : null
      };
    })()`,
		true,
	);
	console.log('  hover prep:', JSON.stringify(prep));
	await win.webContents.executeJavaScript(
		`new Promise(r => {
      let done = false;
      const fin = () => { if (!done) { done = true; r(1); } };
      requestAnimationFrame(() => requestAnimationFrame(fin));
      setTimeout(fin, 600);
    })`,
		true,
	);
	await new Promise((r) => setTimeout(r, 700));
	return prep;
}

const showOnly = (which) => `(function(){
  const ids = {active:'#questListActive', new:'#questListNew', done:'#questListDone'};
  Object.keys(ids).forEach(k => {
    const el = document.querySelector(ids[k]);
    if (!el) return;
    el.hidden = (k !== '${which}');
  });
  for (const s of document.querySelectorAll('#questListDone .qdone-logo')) s.loading = 'eager';
  void document.body.offsetHeight;
  return 1;
})()`;

const setTheme = (t) => `(function(){
  const id = ${JSON.stringify(t)} === 'light' ? 'themeLight' : 'themeDark';
  const b = document.getElementById(id);
  if (b) b.click();
  return document.documentElement.dataset.theme;
})()`;

app.whenReady().then(async () => {
	// Nạp map questId → tên game để server vẽ đúng wordmark cho từng ô.
	FIXTURE_BY_QUEST = {};
	GAMES.forEach((g, i) => {
		FIXTURE_BY_QUEST[String(i + 1)] = g;
	});
	/* SINH SẴN toàn bộ wordmark TRƯỚC khi mở server. Nếu vẽ lazily trong request
	   thì mỗi ảnh phải spawn Python (~0.3s) × 18 ô > thời gian chờ → ảnh chụp rơi
	   vào lúc ảnh chưa nạp xong và mọi ô trông như "không có logo". */
	{
		const { execFileSync } = require('child_process');
		const py = 'C:/Users/Admin/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe';
		const os = require('os');
		const jobs = GAMES.map((g, i) => {
			const out = path.join(os.tmpdir(), `wm-${Buffer.from(g).toString('hex').slice(0, 24)}.png`);
			return { g, out };
		});
		const pyCode = `
import json, sys
from PIL import Image, ImageDraw, ImageFont
jobs = json.loads(sys.argv[1])
try:
    f = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 62)
except Exception:
    f = ImageFont.load_default()
for t, out in jobs:
    W,H = 600, 180
    im = Image.new('RGBA', (W,H), (0,0,0,0))
    d = ImageDraw.Draw(im)
    bb = d.textbbox((0,0), t, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    d.text(((W-tw)//2 - bb[0], (H-th)//2 - bb[1]), t, font=f, fill=(255,255,255,255))
    im.save(out)
print('ok')
`;
		execFileSync(py, ['-c', pyCode, JSON.stringify(jobs.map((j) => [j.g, j.out.split(String.fromCharCode(92)).join('/')]))], {
			stdio: 'ignore',
		});
		// sinh luôn 6 icon
		const iconCode = `
import colorsys
from PIL import Image, ImageDraw
for seed in range(1, 7):
    h = ((seed*47) % 360)/360.0
    r,g,b = colorsys.hsv_to_rgb(h, 0.55, 0.95)
    im = Image.new('RGBA', (256,256), (0,0,0,0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([8,8,247,247], radius=56, fill=(int(r*255),int(g*255),int(b*255),255))
    im.save(${JSON.stringify(path.join(require('os').tmpdir(), 'ic-').split(String.fromCharCode(92)).join('/'))} + str(seed) + '.png')
`;
		execFileSync(py, ['-c', iconCode], { stdio: 'ignore' });
		console.log('  đã sinh sẵn', jobs.length, 'wordmark + 6 icon');
	}
	await new Promise((r) => server.listen(0, '127.0.0.1', r));
	const port = server.address().port;
	fs.mkdirSync(OUT, { recursive: true });

	let html = buildHtml(port);
	writePatchedRenderer(port);
	html = html.replace('<script src="renderer.js"></script>', '<script src="harness-renderer.js"></script>');
	fs.writeFileSync(path.join(ROOT, 'harness-index.html'), html, 'utf8');

	const win = new BrowserWindow({
		width: 1920,
		height: 1080,
		show: false,
		backgroundColor: '#0b0d12',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: false,
			webSecurity: false,
			/* BẮT BUỘC cho ảnh chụp trạng thái hover: cửa sổ ẩn bị Chromium bóp
			   tiến trình vẽ (background throttling) → rAF gần như không chạy và
			   bộ compositor KHÔNG đẩy frame mới. Hệ quả: capturePage() trả về
			   SURFACE CŨ (ảnh mặt trước dù computed style đã là opacity 0.16).
			   Đã gặp thật ở ảnh 6 — số đo trong JS đúng mà pixel lại sai. */
			backgroundThrottling: false,
		},
	});
	win.webContents.on('console-message', () => {});
	const cleanup = () => {
		for (const f of ['harness-api.js', 'harness-data.js', 'harness-index.html', 'harness-renderer.js']) {
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
		await win.webContents.executeJavaScript(
			`(async function(){
        if (window.__h && window.__h.event) window.__h.event({type:'quest:inventory', data:{quests: window.__LIST}});
        await new Promise(r=>setTimeout(r, 800));
        return 'ok';
      })()`,
			true,
		);
		/* Chờ ĐẾN KHI các ô thực sự có trong DOM và ảnh logotype nạp xong.
		   Không chờ thì ảnh chụp rơi vào lúc renderQuests chưa xong → tab hiện
		   "Chưa có nhiệm vụ nào" dù số đếm đã 18 (đã gặp thật ở lần chụp trước). */
		const waitTiles = `(async function(){
      const want = window.__LIST.length;
      for (let i = 0; i < 80; i++) {
        const tiles = document.querySelectorAll('#questListDone .qdone');
        if (tiles.length >= want) {
          const imgs = Array.from(document.querySelectorAll('#questListDone .qdone-logo'));
          const done = imgs.every(m => m.complete);
          if (done) return { tiles: tiles.length, imgs: imgs.length, loaded: imgs.filter(m => m.naturalWidth > 0).length };
        }
        await new Promise(r=>setTimeout(r, 100));
      }
      return { tiles: document.querySelectorAll('#questListDone .qdone').length, timeout: true };
    })()`;
		const waited = await win.webContents.executeJavaScript(waitTiles, true);
		console.log('  chờ render:', JSON.stringify(waited));

		// 1) DARK — tab "Đã làm": phải thấy MỌI ô có logo Orb + logo game + chữ tên.
		await win.webContents.executeJavaScript(setTheme('dark'), true);
		await win.webContents.executeJavaScript(showOnly('done'), true);
		await new Promise((r) => setTimeout(r, 1100));
		await shot(win, '1-dark-done-orb-and-game-logo.png');

		// 2) LIGHT — cùng tab, kiểm tra theme Sáng.
		await win.webContents.executeJavaScript(setTheme('light'), true);
		await new Promise((r) => setTimeout(r, 1000));
		await shot(win, '2-light-done-orb-and-game-logo.png');

		// 3) DARK — hero: orb TO (120px) ở tâm thẻ.
		await win.webContents.executeJavaScript(setTheme('dark'), true);
		await win.webContents.executeJavaScript(
			`(function(){ const s=document.querySelector('#appScroll'); if(s) s.scrollTop=0; void document.body.offsetHeight; return 1; })()`,
			true,
		);
		await new Promise((r) => setTimeout(r, 900));
		await shot(win, '3-dark-hero-orb-bigger.png');

		// 4) LIGHT — hero: cùng phép kiểm ở chế độ Sáng.
		await win.webContents.executeJavaScript(setTheme('light'), true);
		await new Promise((r) => setTimeout(r, 900));
		await shot(win, '4-light-hero-orb-bigger.png');

		// 5) Vùng cắt riêng khu lưới "Đã làm" (DARK) để soi từng ô thật kỹ.
		// LƯU Ý: phải setTheme('dark') Ở ĐÂY, vì ảnh 4 vừa chuyển sang Sáng —
		// quên bước này thì ảnh 5/6 chụp nhầm theme Sáng (đã gặp thật).
		await win.webContents.executeJavaScript(setTheme('dark'), true);
		await win.webContents.executeJavaScript(
			`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`,
			true,
		);
		await new Promise((r) => setTimeout(r, 900));
		const rect = await win.webContents.executeJavaScript(
			`(function(){
        const el = document.querySelector('#questListDone');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
      })()`,
			true,
		);
		if (rect && rect.width > 0) {
			// Ấm máy trước: lần chụp đầu sau khi đổi theme trả về surface cũ.
			await win.webContents.capturePage();
			await new Promise((r) => setTimeout(r, 220));
			const img = await win.webContents.capturePage({
				x: rect.x,
				y: rect.y,
				width: rect.width,
				height: Math.min(rect.height, 700),
			});
			fs.writeFileSync(path.join(OUT, '5-dark-done-grid-closeup.png'), img.toPNG());
			console.log('  saved: 5-dark-done-grid-closeup.png');
		}

		// 6) HOVER (DARK) — tooltip phải khớp ảnh chụp Discord: quầng orb +
		//    logotype + "Nhiệm Vụ …" + "N Orb đã được nhận vào" + dd/mm.
		await armHover(win);
		await shotHover(win, '6-dark-hover-tooltip.png');

		// 7) HOVER (LIGHT) — cùng phép kiểm ở chế độ Sáng, để chắc chắn chữ của
		//    tooltip không bị "chìm" trên nền sáng.
		await win.webContents.executeJavaScript(setTheme('light'), true);
		await win.webContents.executeJavaScript(
			`new Promise(r => {
        let done = false;
        const fin = () => { if (!done) { done = true; r(1); } };
        requestAnimationFrame(() => requestAnimationFrame(fin));
        setTimeout(fin, 600);
      })`,
			true,
		);
		await new Promise((r) => setTimeout(r, 600));
		await shotHover(win, '7-light-hover-tooltip.png');

		cleanup();
		app.exit(0);
	} catch (e) {
		console.log('SHOT ERROR:', e && e.stack ? e.stack : String(e));
		cleanup();
		app.exit(2);
	}
});
