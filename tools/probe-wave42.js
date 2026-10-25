/* Waves 42 — PROBE THẬT cho các yêu cầu của bro:
   1) Cày xong 1 nhiệm vụ (quest:done/quest:captcha) → thẻ sang "Chưa nhận",
      TUYỆT ĐỐI KHÔNG tự mở modal captcha.
   2) Bấm DỪNG → mọi nhiệm vụ đang chạy đổi nhãn "Dừng" + data-status="stop".
   3) Logo nhiệm vụ = ảnh THẬT (app-icons/logotype), không phải orb; tab Đã làm
      lưới 6 cột, ô vuông.
   4) Nhật ký dùng ASCII (#/-/_) — không còn ký tự khối gây "??".
   Chạy trong Chromium THẬT (Electron), không mô phỏng. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');

function build() {
	const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	const list = [
		{ id: 'q1', name: 'Watch video', status: 'todo', orbs: 15, appId: '111122223333444455', appIcon: 'a_abc123', secondsNeeded: 900, secondsDone: 0 },
		{ id: 'q2', name: 'Play game', status: 'claimable', orbs: 30, appId: '222233334444555566', appIcon: 'def456', secondsNeeded: 600, secondsDone: 600 },
		{ id: 'q3', name: 'Done quest', status: 'claimed', orbs: 50, appId: '333344445555666677', appIcon: 'ghi789', rewardKind: 'orbs' },
	];
	fs.writeFileSync(path.join(ROOT, '__p42-data.js'), 'window.__LIST=' + JSON.stringify(list) + ';\n', 'utf8');
	fs.writeFileSync(
		path.join(ROOT, '__p42-api.js'),
		`(function(){ const h={log:null,event:null,state:null}; window.__h=h;
  window.__captchaOpened=0; window.__openQuestCalls=[];
  const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return x=>{h.log=x;};
    if(k==='onEvent')return x=>{h.event=x;};
    if(k==='onState')return x=>{h.state=x;};
    if(k==='openQuest')return (id)=>{window.__openQuestCalls.push(id);return Promise.resolve({ok:true,via:'app'});};
    return f;
  }});
  })();`,
		'utf8',
	);
	const tmp = path.join(ROOT, '__p42.html');
	fs.writeFileSync(
		tmp,
		html.replace(
			'<script src="renderer.js"></script>',
			'<script src="__p42-api.js"></script>\n<script src="__p42-data.js"></script>\n<script src="renderer.js"></script>',
		),
		'utf8',
	);
	return tmp;
}

app.whenReady().then(async () => {
	const tmp = build();
	const win = new BrowserWindow({
		width: 1500,
		height: 950,
		show: false,
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false },
	});
	win.webContents.on('console-message', () => {});
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1200));

	// ===== 1) quest:done + quest:captcha → KHÔNG được mở modal captcha =====
	await win.webContents.executeJavaScript(
		`(function(){
      const ev = window.__h.event;
      ev({type:'quest:inventory', data:{quests: window.__LIST}});
      // nhiệm vụ q1 cày xong, Discord đòi captcha
      ev({type:'quest:start', data:{id:'q1', name:'Watch video'}});
      ev({type:'quest:done', data:{id:'q1', name:'Watch video', orbs:15, note:'captcha'}});
      ev({type:'quest:captcha', data:{id:'q1', name:'Watch video', orbs:15, captcha:{sitekey:'abc', service:'hcaptcha', rqdata:'r'}}});
      return 'ok';
    })()`,
		true,
	);
	await new Promise((r) => setTimeout(r, 700));
	const step1 = await win.webContents.executeJavaScript(
		`(function(){
      const modal = document.getElementById('captchaModal');
      const newList = document.getElementById('questListNew');
      const q1 = document.querySelector('[data-quest-id="q1"]');
      return JSON.stringify({
        modalHidden: modal ? modal.hidden : null,
        q1InNewTab: !!(q1 && newList && newList.contains(q1)),
        q1Status: q1 ? q1.dataset.status : null,
        q1TabHidden: newList ? newList.hidden : null,
      });
    })()`,
		true,
	);

	// ===== 2) Bấm DỪNG → mọi quest đang chạy thành "Dừng" đỏ =====
	await win.webContents.executeJavaScript(
		`(function(){
      const ev = window.__h.event;
      ev({type:'quest:start', data:{id:'q2', name:'Play game'}});
      ev({type:'quest:start', data:{id:'q3', name:'Done quest'}});
      return 'ok';
    })()`,
		true,
	);
	await new Promise((r) => setTimeout(r, 350));
	const beforeStop = await win.webContents.executeJavaScript(
		`document.querySelectorAll('.qcard[data-status="running"]').length`,
		true,
	);
	await win.webContents.executeJavaScript(`document.getElementById('btnStop').click()`, true);
	await new Promise((r) => setTimeout(r, 500));
	const stopState = await win.webContents.executeJavaScript(
		`(function(){
      const stopped = document.querySelectorAll('.qcard[data-status="stop"]');
      const labels = [...stopped].map(n => (n.querySelector('.qcard-state')||{}).textContent || '');
      const btnLabels = [...document.querySelectorAll('.qcard[data-status="stop"] .qcard-act')].map(b => b.textContent.trim());
      return JSON.stringify({ stopCount: stopped.length, runningLeft: document.querySelectorAll('.qcard[data-status="running"]').length, labels, btnLabels });
    })()`,
		true,
	);

	// ===== 3) Logo thật + lưới Đã làm 6 cột =====
	const logos = await win.webContents.executeJavaScript(
		`(function(){
      const cardLogo = document.querySelector('.qcard .qcard-logo');
      const doneTile = document.querySelector('.qdone');
      const doneLogo = doneTile ? doneTile.querySelector('.qdone-logo') : null;
      const grid = document.getElementById('questListDone');
      // Đếm số cột THẬT: computed style trả 'repeat(6, minmax(0px, 1fr))' →
      // phải đọc số trong repeat(), KHÔNG đếm khoảng trắng (cách cũ sai).
      let cols = 0;
      if (grid) {
        const tpl = getComputedStyle(grid).gridTemplateColumns;
        const rep = tpl.match(/repeat\\(\\s*(\\d+)/);
        cols = rep ? Number(rep[1]) : tpl.split(' ').length;
      }
      const ar = doneTile ? getComputedStyle(doneTile).aspectRatio : '';
      const mid = document.querySelector('.qcard .qnodata-junk');
      return JSON.stringify({
        cardLogoSrc: cardLogo ? cardLogo.src.replace('https://cdn.discordapp.com/','') : null,
        doneLogoSrc: doneLogo ? doneLogo.src.replace('https://cdn.discordapp.com/','') : null,
        doneGridCols: cols,
        doneAspect: ar,
        orbGlyphInCard: !!document.querySelector('.qdone .orb-glyph'),
        orbGlyphInDoneTile: !!(doneTile && doneTile.querySelector('.qdone-orb')),
      });
    })()`,
		true,
	);

	// ===== 4) Nhật ký: ký tự ASCII, không khối Unicode =====
	const logCheck = await win.webContents.executeJavaScript(
		`(function(){
      const ev = window.__h.event, lg = window.__h.log;
      ev({type:'scan:start', data:{total:10}});
      ev({type:'quest:scan-progress', data:{done:5, total:10}});
      if(lg) lg('Đã nạp 10 nhiệm vụ', 'ok');
      const c = document.getElementById('console');
      const txt = c ? c.textContent : '';
      return JSON.stringify({
        hasBlockGlyph: /[▓░▋]/.test(txt),
        barAscii: /\\[#+-\\]/.test(txt) || /#/.test(txt),
        sample: txt.replace(/\\s+/g,' ').slice(0, 90),
      });
    })()`,
		true,
	);
	await new Promise((r) => setTimeout(r, 400));
	const logAfter = await win.webContents.executeJavaScript(
		`(function(){ const c=document.getElementById('console'); const t=c?c.textContent:''; return JSON.stringify({ hasBlockGlyph: /[▓░▋]/.test(t), sample: t.replace(/\\s+/g,' ').slice(0,120) }); })()`,
		true,
	);

	console.log('STEP1 (done/captcha -> Chưa nhận, KHÔNG mở captcha):', step1);
	console.log('STOP   (running before:', beforeStop, '-> after stop):', stopState);
	console.log('LOGOS  :', logos);
	console.log('LOG-BAR:', logCheck);

	const s1 = JSON.parse(step1);
	const st = JSON.parse(stopState);
	const lg2 = JSON.parse(logos);
	const lb = JSON.parse(logAfter);
	const pass =
		s1.modalHidden === true &&
		s1.q1InNewTab === true &&
		st.stopCount >= 1 &&
		st.runningLeft === 0 &&
		!lb.hasBlockGlyph &&
		lg2.doneGridCols === 6 &&
		(lg2.cardLogoSrc || '').includes('app-icons');
	console.log('\n=== KẾT LUẬN:', pass ? 'PASS ✅' : 'FAIL ❌', '===');
	cleanup();
	app.quit();
});

/** Dọn MỌI file tạm do probe sinh ra (html + js sidecar) — không để rác trong repo. */
function cleanup() {
	for (const f of ['__p42.html', '__p42-api.js', '__p42-data.js']) {
		try {
			fs.unlinkSync(path.join(ROOT, f));
		} catch (e) {}
	}
}
