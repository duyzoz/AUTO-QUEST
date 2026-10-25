/* Waves 31: harness riêng cho NÚT TRẠNG THÁI + MODAL hCAPTCHA.
   Mục đích: chụp ảnh 3 trạng thái nút (Chưa làm / Nhận / Đã nhận) và modal captcha
   với widget hCaptcha THẬT được render (sitekey thử của hCaptcha). Chạy:
     ./node_modules/electron/dist/electron.exe tools/claim-shot.js   (đã unset ELECTRON_RUN_AS_NODE)
*/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'ui-preview');

function buildTestHtml(list) {
	const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	fs.writeFileSync(path.join(ROOT, 'harness-data.js'), 'window.__LIST = ' + JSON.stringify(list) + ';\n', 'utf8');
	const stubFile = path.join(ROOT, 'harness-api.js');
	fs.writeFileSync(
		stubFile,
		`(function(){
    const handlers = { log: null, event: null, state: null };
    window.__h = handlers;
    const asyncFn = () => Promise.resolve({ ok: true, state: 'idle', config: {} });
    window.autoquest = new Proxy({}, {
      get(_t, k) {
        if (k === 'onLog') return (fn) => { handlers.log = fn; };
        if (k === 'onEvent') return (fn) => { handlers.event = fn; };
        if (k === 'onState') return (fn) => { handlers.state = fn; };
        if (k === 'authCheck') return () => Promise.resolve({ ok: false });
        if (k === 'saveLog') return () => Promise.resolve({ ok: true });
        if (k === 'fetchOrbs') return () => Promise.resolve({ ok: true, balance: 24850, pendingClaim: 0, source: 'wallet' });
        // claimQuest: giả lập Discord trả captcha cho lần đầu, thành công cho lần sau.
        if (k === 'claimQuest') return (p) => {
          window.__claimCalls = (window.__claimCalls || 0) + 1;
          window.__lastClaim = p;
          if (!p.captchaKey) {
            return Promise.resolve({ ok: false, captchaRequired: true, captcha: {
              sitekey: '10000000-ffff-ffff-ffff-000000000001',
              service: 'hcaptcha', sessionId: 'sess-abc', rqdata: 'rq-xyz', rqtoken: 'rqtok-123',
            }, message: 'Captcha required' });
          }
          return Promise.resolve({ ok: true, orbs: 750 });
        };
        if (k === 'openUrl' || k === 'openDataFolder' || k === 'writeClipboard') return () => Promise.resolve();
        return asyncFn;
      }
    });
  })();`,
		'utf8',
	);
	return html.replace(
		'<script src="renderer.js"></script>',
		`<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>`,
	);
}

app.whenReady().then(async () => {
	fs.mkdirSync(OUT, { recursive: true });
	const tmp = path.join(ROOT, '.claim-harness.html');

	const realFile = path.join(OUT, 'real-quests.json');
	let list = null;
	if (fs.existsSync(realFile)) {
		try {
			list = JSON.parse(fs.readFileSync(realFile, 'utf8'));
		} catch {}
	}
	if (!Array.isArray(list) || !list.length) {
		list = [
			{ id: 'q1', name: 'Demo 1', status: 'todo', orbs: 750, task: 'PLAY_ON_DESKTOP' },
			{ id: 'q2', name: 'Demo 2', status: 'claimable', orbs: 750, task: 'PLAY_ON_DESKTOP' },
			{ id: 'q3', name: 'Demo 3', status: 'claimed', orbs: 750, task: 'PLAY_ON_DESKTOP' },
		];
	}
	fs.writeFileSync(tmp, buildTestHtml(list), 'utf8');

	const win = new BrowserWindow({
		width: 1920,
		height: 1080,
		show: true,
		backgroundColor: '#05060b',
		webPreferences: { contextIsolation: false, nodeIntegration: false, backgroundThrottling: false },
	});
	win.webContents.on('console-message', (_e, lvl, msg) => console.log('[renderer]', lvl, msg));
	win.showInactive();
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 700));

	// Bơm dữ liệu quest (todo + claimable + claimed) rồi chốt về tab "Chưa nhận".
	await win.webContents.executeJavaScript(`(function(){
    const list = window.__LIST.slice();
    // Ép có đủ 3 trạng thái để chụp
    if (list[0]) list[0].status = 'todo';
    if (list[1]) { list[1].status = 'claimable'; list[1].orbs = 750; }
    if (list[2]) { list[2].status = 'claimed'; }
    window.__LIST = list;
    // Giả lập đã đăng nhập: điền token vào ô input để tokenOf() trả về giá trị.
    const tok = document.getElementById('token');
    if (tok) { tok.value = 'HARNESS.FAKE.TOKEN'; tok.dispatchEvent(new Event('input', { bubbles: true })); }
    window.__h.event({ type: 'quest:inventory', data: { quests: list } });
    window.__h.event({ type: 'scan:complete', data: {} });
    return { n: list.length, token: tok ? tok.value : null };
  })()`, true);
	await new Promise((r) => setTimeout(r, 900));

	// 1) Chụp lưới thẻ tab "Chưa nhận" (thấy nút Nhận)
	await win.webContents.executeJavaScript("document.getElementById('tabNew').click()", true);
	await new Promise((r) => setTimeout(r, 300));
	fs.writeFileSync(path.join(OUT, 'claim-foot.png'), (await win.webContents.capturePage()).toPNG());

	// 2) Bấm nút "Nhận" → phải mở modal captcha với widget THẬT
	const clicked = await win.webContents.executeJavaScript(`(function(){
    const btn = document.querySelector('#questListNew .qcard-act[data-act="claim"]');
    if (!btn) return {ok:false, reason:'no-claim-button'};
    btn.click();
    return {ok:true, label: btn.textContent.trim()};
  })()`, true);
	console.log('CLICK:', JSON.stringify(clicked));
	await new Promise((r) => setTimeout(r, 4500)); // chờ js.hcaptcha.com tải + render iframe

	const modalState = await win.webContents.executeJavaScript(`(function(){
    const m = document.getElementById('captchaModal');
    const slot = document.getElementById('hcaptchaWidget');
    const iframes = slot ? slot.querySelectorAll('iframe') : [];
    const loaderHidden = document.getElementById('captchaLoading').hidden;
    return {
      modalOpen: m && !m.hidden,
      iframes: iframes.length,
      iframeSrc: iframes.length ? iframes[0].src.slice(0, 60) : null,
      loaderHidden,
      err: document.getElementById('captchaErr').hidden ? null : document.getElementById('captchaErr').textContent,
      claimCalls: window.__claimCalls || 0,
      lastPayload: window.__lastClaim ? { questId: window.__lastClaim.questId, hasCaptcha: !!window.__lastClaim.captchaKey } : null,
    };
  })()`, true);
	console.log('MODAL:', JSON.stringify(modalState));
	fs.writeFileSync(path.join(OUT, 'captcha-modal.png'), (await win.webContents.capturePage()).toPNG());

	// Zoom vào modal
	const rect = await win.webContents.executeJavaScript(
		"(()=>{const c=document.querySelector('.capture-card');if(!c)return null;const b=c.getBoundingClientRect();return {x:Math.round(b.x)-6,y:Math.round(b.y)-6,width:Math.round(b.width)+12,height:Math.round(b.height)+12};})()",
		true,
	);
	if (rect) fs.writeFileSync(path.join(OUT, 'captcha-zoom.png'), (await win.webContents.capturePage(rect)).toPNG());

	// 3) Giả lập người dùng giải xong → callback → claim lại (2A)
	const solved = await win.webContents.executeJavaScript(`(function(){
    // Gọi thẳng callback nội bộ mà renderer gắn cho hcaptcha (mô phỏng người thật giải xong)
    return typeof onCaptchaSolved === 'function';
  })()`, true);
	console.log('HAS_SOLVED_FN:', solved);
	await win.webContents.executeJavaScript(
		"onCaptchaSolved('P0_eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.fake-human-token')",
		true,
	);
	await new Promise((r) => setTimeout(r, 1200));
	const after = await win.webContents.executeJavaScript(`(function(){
    const card = document.querySelector('#questListDone .qdone');
    const anyAct = document.querySelector('.qcard-act[data-act="claimed"]');
    return {
      modalClosed: document.getElementById('captchaModal').hidden,
      modalOpen: !document.getElementById('captchaModal').hidden,
      claimCalls: window.__claimCalls || 0,
      lastPayloadHasCaptcha: window.__lastClaim ? !!window.__lastClaim.captchaKey : null,
      claimedButtons: document.querySelectorAll('.qcard-act[data-act="claimed"]').length,
      doneTiles: document.querySelectorAll('.qdone').length,
      orbsText: document.getElementById('orbBalance').textContent,
    };
  })()`, true);
	console.log('AFTER_SOLVE:', JSON.stringify(after));
	await win.webContents.executeJavaScript("document.getElementById('tabDone').click()", true);
	await new Promise((r) => setTimeout(r, 300));
	fs.writeFileSync(path.join(OUT, 'claimed.png'), (await win.webContents.capturePage()).toPNG());

	app.quit();
});
