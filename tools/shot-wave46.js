/* Waves 46 — CHỤP ẢNH KIỂM CHỨNG: logo Orb TO giữa thẻ + chế độ Sáng không chìm màu.
   Xuất PNG vào build-release/wave46/ để bro tự xem.
   Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/shot-wave46.js */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'wave46');

function buildHtml() {
	const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	const list = [
		{ id: '1', name: 'Watch a video for 15 minutes', status: 'claimed', progress: 100, orbs: 15, kind: 'video', gameTitle: 'Genshin Impact', appId: '123456789012345678', appIcon: 'abc' },
		{ id: '2', name: 'Play a game', status: 'claimed', progress: 100, orbs: 300, kind: 'game', gameTitle: 'Valorant', appId: '223456789012345678', appIcon: 'def' },
		{ id: '3', name: 'Stream for 30 minutes', status: 'claimed', progress: 100, orbs: 50, kind: 'item', gameTitle: 'Fortnite', appId: '323456789012345678', appIcon: 'ghi' },
		{ id: '4', name: 'Watch 5 minutes', status: 'claimed', progress: 100, orbs: 5, kind: 'video', gameTitle: 'Minecraft', appId: '423456789012345678', appIcon: 'jkl' },
		{ id: '5', name: 'Complete a quest', status: 'claimed', progress: 100, orbs: 120, kind: 'game', gameTitle: 'League of Legends', appId: '523456789012345678', appIcon: 'mno' },
		{ id: '6', name: 'Play on mobile for 10 minutes', status: 'claimed', progress: 100, orbs: 25, kind: 'video', gameTitle: 'Clash of Clans', appId: '623456789012345678', appIcon: 'pqr' },
		{ id: '7', name: 'Todo alpha', status: 'todo', progress: 0, orbs: 10, kind: 'video' },
		{ id: '8', name: 'Todo beta', status: 'todo', progress: 0, orbs: 20, kind: 'game' },
		{ id: '9', name: 'Todo gamma', status: 'todo', progress: 0, orbs: 30, kind: 'video' },
		{ id: '10', name: 'Todo delta', status: 'todo', progress: 0, orbs: 40, kind: 'game' },
	];
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

app.whenReady().then(async () => {
	fs.mkdirSync(OUT, { recursive: true });
	const win = new BrowserWindow({
		width: 1500,
		height: 1000,
		show: false,
		backgroundColor: '#eaeef6',
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false },
	});
	win.webContents.on('console-message', () => {});
	const tmp = path.join(ROOT, '__shot46.html');
	fs.writeFileSync(tmp, buildHtml(), 'utf8');
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1500));

	const prep = `(async function(){
    if (window.__h && window.__h.event) {
      window.__h.event({type:'quest:inventory', data:{quests: window.__LIST}});
    }
    const d = document.querySelector('#questListDone');
    if (d) { d.hidden = false; d.style.display=''; }
    await new Promise(r=>setTimeout(r, 500));
    return 'ok';
  })()`;

	// DARK — tab Đã làm
	await win.webContents.executeJavaScript(`(function(){document.documentElement.dataset.theme='dark';return 1;})()`, true);
	await win.webContents.executeJavaScript(prep, true);
	await new Promise((r) => setTimeout(r, 700));
	await shot(win, 'dark-done-tiles.png');

	// DARK — tab Chưa làm (kiểm tra không xếp chồng)
	await win.webContents.executeJavaScript(
		`(function(){const d=document.querySelector('#questListDone');if(d)d.hidden=true;const a=document.querySelector('#questListActive');if(a){a.hidden=false;a.style.display='';}return 1;})()`,
		true,
	);
	await new Promise((r) => setTimeout(r, 500));
	await shot(win, 'dark-todo-tiles.png');

	// LIGHT — toàn trang (kiểm tra chìm màu + orb to)
	await win.webContents.executeJavaScript(`(function(){document.documentElement.dataset.theme='light';return 1;})()`, true);
	await win.webContents.executeJavaScript(
		`(function(){const a=document.querySelector('#questListActive');if(a)a.hidden=true;const d=document.querySelector('#questListDone');if(d){d.hidden=false;d.style.display='';}return 1;})()`,
		true,
	);
	await new Promise((r) => setTimeout(r, 900));
	await shot(win, 'light-done-tiles.png');

	// LIGHT — scroll lên đầu để thấy thẻ hero + orb lớn
	await win.webContents.executeJavaScript(
		`(function(){const s=document.querySelector('#appScroll');if(s)s.scrollTop=0;window.scrollTo(0,0);return 1;})()`,
		true,
	);
	await new Promise((r) => setTimeout(r, 500));
	await shot(win, 'light-hero-orb.png');

	// DARK — hero + orb lớn
	await win.webContents.executeJavaScript(`(function(){document.documentElement.dataset.theme='dark';return 1;})()`, true);
	await new Promise((r) => setTimeout(r, 600));
	await shot(win, 'dark-hero-orb.png');

	try {
		fs.unlinkSync(tmp);
		fs.unlinkSync(path.join(ROOT, 'harness-api.js'));
		fs.unlinkSync(path.join(ROOT, 'harness-data.js'));
	} catch {}
	console.log('\nXong. Ảnh ở build-release/wave46/');
	app.quit();
});
