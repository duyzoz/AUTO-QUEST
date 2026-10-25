/* Waves 46b — CHỤP ẢNH KIỂM CHỨNG cho 3 lỗi bro nêu lần 2:
     1) orb "lòi ra phía trên" banner  -> nay orb là ẢNH CỦA Ô AVATAR (trong luồng).
     2) "phần đa làm vẫn chưa fix chồng" -> nay grid-auto-rows:max-content, gap dương.
     3) "logo có dc add xoá nền đéo đâu" -> nay orb-logo-big.png alpha=0 thật.
   Dùng 26 nhiệm vụ (đủ tràn nhiều hàng) để nhìn rõ các hàng KHÔNG dính nhau.
   Xuất PNG vào build-release/wave46b/. Chạy:
     env -u ELECTRON_RUN_AS_NODE npx electron tools/shot-wave46b.js */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'wave46b');

function buildHtml() {
	const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	const names = [
		'Play 15 minutes of Genshin Impact',
		'Watch a video about the new season',
		'Complete 3 matches in ranked mode',
		'Join a voice channel for 30 minutes',
		'Send 5 messages in any server channel',
		'Play a game that supports Rich Presence',
		'Complete an activity in the Discord Shop',
		'Stream a game for at least 15 minutes',
		'Watch a friend play a game',
		'Play a game for 60 minutes',
		'Complete the tutorial',
		'Use an app for 10 minutes',
		'Check out the new quest board',
		'Try a new activity in a server',
		'Watch a stream for 20 minutes',
		'Complete 2 daily missions',
		'Play a round with a friend',
		'Explore the community hub',
	];
	const orbs = [5, 15, 300, 50, 100, 25, 10, 75, 200, 30, 45, 60, 35, 90, 55, 20, 40, 65];
	const list = names.map((n, i) => ({
		id: String(i + 1),
		name: n,
		description: 'Mô tả nhiệm vụ khá dài để thử sức chứa của ô vuông',
		status: i < 12 ? 'claimed' : i < 15 ? 'claimable' : 'todo',
		progress: i < 12 ? 100 : i < 15 ? 60 : 0,
		orbs: orbs[i],
		kind: i % 3 === 0 ? 'video' : i % 3 === 1 ? 'game' : 'item',
		gameTitle: 'Game Title ' + (i + 1) + ' From Discord Server',
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
	return html.replace(
		'<script src="renderer.js"></script>',
		`<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>`,
	);
}

async function shot(win, name) {
	const img = await win.webContents.capturePage();
	fs.writeFileSync(path.join(OUT, name), img.toPNG());
	console.log('  saved:', name);
}

const showOnly = (which) => `(function(){
  const ids = {active:'#questListActive', new:'#questListNew', done:'#questListDone'};
  Object.keys(ids).forEach(k => {
    const el = document.querySelector(ids[k]);
    if (!el) return;
    const on = (k === '${which}');
    el.hidden = !on;
    el.style.display = on ? '' : '';
  });
  const s = document.querySelector('#appScroll');
  if (s) s.scrollTop = ${which === 'done' ? 260 : 0};
  void document.body.offsetHeight;
  return 1;
})()`;

app.whenReady().then(async () => {
	fs.mkdirSync(OUT, { recursive: true });
	const win = new BrowserWindow({
		width: 1920,
		height: 1080,
		show: false,
		backgroundColor: '#0b0d12',
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false },
	});
	win.webContents.on('console-message', () => {});
	const tmp = path.join(ROOT, '__shot46b.html');
	fs.writeFileSync(tmp, buildHtml(), 'utf8');
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1500));

	await win.webContents.executeJavaScript(
		`(async function(){
      if (window.__h && window.__h.event) {
        window.__h.event({type:'quest:inventory', data:{quests: window.__LIST}});
      }
      await new Promise(r=>setTimeout(r, 700));
      return 'ok';
    })()`,
		true,
	);

	const dark = `(function(){document.documentElement.dataset.theme='dark';return 1;})()`;
	const light = `(function(){document.documentElement.dataset.theme='light'; return 1;})()`;

	// 1) DARK — tab "Đã làm": nhiều hàng, phải thấy KHE HỞ giữa các hàng
	await win.webContents.executeJavaScript(dark, true);
	await win.webContents.executeJavaScript(showOnly('done'), true);
	await new Promise((r) => setTimeout(r, 800));
	await shot(win, '1-dark-done-rows-no-stack.png');

	// 2) LIGHT — tab "Đã làm": cùng phép kiểm ở chế độ Sáng
	await win.webContents.executeJavaScript(light, true);
	await new Promise((r) => setTimeout(r, 700));
	await shot(win, '2-light-done-rows-no-stack.png');

	// 3) DARK — tab "Chưa làm": 3 cột, nhiều hàng, không dính
	await win.webContents.executeJavaScript(dark, true);
	await win.webContents.executeJavaScript(showOnly('active'), true);
	await new Promise((r) => setTimeout(r, 800));
	await shot(win, '3-dark-todo-rows-no-stack.png');

	// 4) LIGHT — hero: orb là ẢNH AVATAR, không lòi lên banner
	await win.webContents.executeJavaScript(light, true);
	await win.webContents.executeJavaScript(showOnly('active'), true);
	await new Promise((r) => setTimeout(r, 700));
	await shot(win, '4-light-hero-orb-in-avatar.png');

	// 5) DARK — hero
	await win.webContents.executeJavaScript(dark, true);
	await new Promise((r) => setTimeout(r, 700));
	await shot(win, '5-dark-hero-orb-in-avatar.png');

	// 6) Ảnh orb tách nền phóng to trên nền trắng — chứng minh alpha=0 thật
	await win.webContents.executeJavaScript(
		`(function(){
      document.documentElement.dataset.theme='light';
      const wrap = document.createElement('div');
      wrap.id='__orbproof';
      wrap.setAttribute('style', [
        'position:fixed','inset:0','z-index:99999','background:#ffffff',
        'display:flex','align-items:center','justify-content:center','gap:56px'
      ].join(';'));
      wrap.innerHTML =
        '<div style="text-align:center;font:600 20px system-ui;color:#111">' +
        '<img src="assets/orb-logo-big.png" style="width:360px;height:360px;object-fit:contain" />' +
        '<div style="margin-top:10px">orb-logo-big.png trên nền TRẮNG</div></div>';
      document.body.appendChild(wrap);
      return 1;
    })()`,
		true,
	);
	await new Promise((r) => setTimeout(r, 700));
	await shot(win, '6-orb-cutout-on-white.png');

	try {
		fs.unlinkSync(tmp);
		fs.unlinkSync(path.join(ROOT, 'harness-api.js'));
		fs.unlinkSync(path.join(ROOT, 'harness-data.js'));
	} catch {}
	console.log('\nXong. Ảnh ở build-release/wave46b/');
	app.quit();
});
