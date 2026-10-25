/* Waves 42 — AUDIT MÀU CẢ 2 CHẾ ĐỘ (Sáng + Tối).
   Mục tiêu bro nêu: "các text khi chuyển sang chế độ sáng không đổi màu",
   "cả chế độ tối nữa vẫn là màu mặc định", nhật ký phải TRẮNG trên nền đen,
   ĐEN trên nền sáng — CẤM CHÌM MÀU.
   Cách đo: dựng DOM thật, bật từng theme, tính WCAG ratio cho MỌI phần tử có chữ
   ở trang Cài đặt + Giới thiệu + nhật ký + tab Đã làm. In ra mục nào < 4.5:1. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');

function buildHtml() {
	const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	const list = [
		{ id: '1', name: 'Watch 15 min', description: 'x', status: 'todo', progress: 0, orbs: 15, kind: 'video' },
		{ id: '2', name: 'Play a game', description: 'y', status: 'claimable', progress: 100, orbs: 30, kind: 'game' },
		{ id: '3', name: 'Deco', description: 'z', status: 'claimed', progress: 100, orbs: 50, kind: 'item', appId: '123456789012345678', appIcon: 'abc123' },
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

const AUDIT = `(async function(){
  function parse(c){
    const m = c.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    const p = m[1].split(',').map(s=>parseFloat(s.trim()));
    return { r:p[0], g:p[1], b:p[2], a: p.length>3 ? p[3] : 1 };
  }
  function over(fg,bg){ return { r: fg.r*fg.a+bg.r*(1-fg.a), g: fg.g*fg.a+bg.g*(1-fg.a), b: fg.b*fg.a+bg.b*(1-fg.a) }; }
  function lum(c){ const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}; return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); }
  function ratio(a,b){ const la=lum(a), lb=lum(b); const hi=Math.max(la,lb), lo=Math.min(la,lb); return (hi+0.05)/(lo+0.05); }
  function solidBg(el){
    let e = el;
    while(e && e !== document.documentElement){
      const c = parse(getComputedStyle(e).backgroundColor);
      if(c && c.a >= 0.999) return c;
      e = e.parentElement;
    }
    const rb = parse(getComputedStyle(document.body).backgroundColor);
    return (rb && rb.a>=0.999) ? rb : { r:255,g:255,b:255,a:1 };
  }
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  await new Promise(r=>setTimeout(r, 1600));

  // Quét MỌI phần tử có text hiển thị (không ẩn hẳn) — không chỉ vài selector chọn tay.
  const out = [];
  const skip = new Set(['SCRIPT','STYLE','SVG','PATH','CIRCLE','POLYLINE','LINE','RECT','POLYGON','IMG','INPUT','SELECT','TEXTAREA','OPTION']);
  const all = document.querySelectorAll('body *');
  for(const el of all){
    if(skip.has(el.tagName)) continue;
    // Chỉ lấy node có text TRỰC TIẾP
    let hasText = false;
    for(const n of el.childNodes){ if(n.nodeType===3 && n.textContent.trim()){ hasText=true; break; } }
    if(!hasText) continue;
    const cs = getComputedStyle(el);
    if(cs.visibility==='hidden' || cs.display==='none') continue;
    // bỏ phần tử có cha đang display:none (getComputedStyle con vẫn ra giá trị)
    let p=el, visible=true;
    while(p && p!==document.body){
      const pcs=getComputedStyle(p);
      if(pcs.display==='none'||pcs.visibility==='hidden'){ visible=false; break; }
      p=p.parentElement;
    }
    if(!visible) continue;
    const fg0 = parse(cs.color); if(!fg0) continue;
    const bg = solidBg(el);
    const fg = fg0.a>=0.999 ? fg0 : over(fg0,bg);
    const r = ratio(fg,bg);
    const id = (el.id? '#'+el.id : '') + (el.className && typeof el.className==='string' ? '.'+el.className.trim().split(/\\s+/).slice(0,2).join('.') : '');
    out.push({ tag: el.tagName.toLowerCase(), sel: id, text: el.textContent.trim().slice(0,28), ratio: Math.round(r*100)/100, fg: cs.color, bg:'rgb('+Math.round(bg.r)+','+Math.round(bg.g)+','+Math.round(bg.b)+')' });
  }
  return out;
})()`;

async function runTheme(win, theme) {
	/* Waves 46c — ĐỔI THEME BẰNG CÁCH BẤM NÚT THẬT, không poke attribute.
	   Vì sao: renderer có `applyTheme()` và nó bị gọi lại trong lúc app refresh
	   trạng thái (khi harness bắn quest:inventory / scan:*). Khi đó `data-theme`
	   bị kéo về giá trị `currentTheme` cũ → probe đọc được ẢNH CHỤP HỖN HỢP:
	   màu chữ của theme Mới nhưng nền của theme Cũ ⇒ báo "chìm màu" GIẢ
	   (đo được 13 mục, toàn `bg=rgb(9,11,19)` tức nền TỐI trong lượt đo SÁNG).
	   Bấm nút thật thì `currentTheme` nội bộ cũng đổi theo → không còn bị kéo về. */
	await win.webContents.executeJavaScript(
		`(function(){
      const id = ${JSON.stringify(theme)} === 'light' ? 'themeLight' : 'themeDark';
      const btn = document.getElementById(id);
      if (btn) btn.click();
      return document.documentElement.dataset.theme;
    })()`,
		true,
	);
	await win.webContents.executeJavaScript(
		`(function(){
      const ev = window.__h && window.__h.event;
      const logs = window.__h && window.__h.log;
      if(ev){ ev({type:'quest:inventory', data:{quests: window.__LIST}}); }
      if(ev){ ev({type:'scan:start', data:{total:3}}); }
      if(ev){ ev({type:'quest:scan-progress', data:{done:2, total:3}}); }
      if(logs){ logs('Sẵn sàng — bấm Quét nhiệm vụ', 'system'); logs('Đã nhận 15 Orb', 'orb'); logs('Lỗi token hết hạn', 'stderr'); logs('Hoàn thành nhiệm vụ', 'ok'); }
      return 'ok';
    })()`,
		true,
	);
	/* Rào chắn: chờ tới khi data-theme ĐÚNG như yêu cầu và ổn định qua 2 frame
	   liên tiếp — tránh đọc phải trạng thái đang chuyển. */
	const settled = await win.webContents.executeJavaScript(
		`(async function(){
      const want = ${JSON.stringify(theme)};
      for (let i = 0; i < 40; i++) {
        await new Promise(r=>requestAnimationFrame(r));
        if (document.documentElement.dataset.theme !== want) continue;
        const a = document.documentElement.dataset.theme;
        await new Promise(r=>requestAnimationFrame(r));
        if (document.documentElement.dataset.theme === a) return a;
      }
      return document.documentElement.dataset.theme;
    })()`,
		true,
	);
	if (settled !== theme) {
		console.log(`  ! CẢNH BÁO: theme không ổn định (muốn ${theme}, đang ${settled})`);
	}
	const res = await win.webContents.executeJavaScript(`(async () => JSON.stringify(await (${AUDIT})))()`, true);
	return JSON.parse(res);
}

app.whenReady().then(async () => {
	const win = new BrowserWindow({
		width: 1500,
		height: 950,
		show: false,
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false },
	});
	win.webContents.on('console-message', () => {});
	const tmp = path.join(ROOT, '__theme.html');
	fs.writeFileSync(tmp, buildHtml(), 'utf8');
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1200));

	let totalBad = 0;
	for (const theme of ['dark', 'light']) {
		const rows = await runTheme(win, theme);
		const bad = rows.filter((r) => r.ratio < 4.5);
		console.log(`\n=== THEME ${theme.toUpperCase()} — ${rows.length} mục chữ, ${bad.length} mục < 4.5:1 ===`);
		for (const r of bad.slice(0, 30)) {
			console.log(`  FAIL ${String(r.ratio).padStart(5)}:1  ${r.sel || r.tag}  "${r.text}"  fg=${r.fg} bg=${r.bg}`);
		}
		totalBad += bad.length;
		console.log(bad.length === 0 ? '  ✅ TẤT CẢ ĐẠT ≥ 4.5:1 (không chìm màu)' : `  ❌ ${bad.length} mục chìm`);
	}
	console.log(`\n=== TỔNG: ${totalBad} mục chìm trên cả 2 chế độ ===`);
	try {
		fs.unlinkSync(tmp);
	} catch (e) {}
	app.quit();
});
