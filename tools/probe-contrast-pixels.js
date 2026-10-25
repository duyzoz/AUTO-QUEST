/* Waves 46e — RÀ SOÁT "CHÌM MÀU" BẰNG PIXEL THẬT (cả 2 theme).
 *
 * VÌ SAO CẦN PROBE NÀY (bro: "rà soát lại toàn bộ từng ngóc ngách cấm cái nào
 * chìm màu"): các audit cũ chỉ so MÀU KHAI BÁO trong CSS với nền gần nhất tìm
 * được bằng cách đi ngược cây DOM. Cách đó SAI khi phía sau chữ là ẢNH (banner
 * hồ sơ) hoặc gradient: nó tưởng nền là màu của thẻ cha, trong khi thực tế là
 * ảnh sáng → bro thấy "@duyoz" trắng trên nền sáng (1.0:1) mà audit vẫn báo OK.
 *
 * Probe này đo ĐÚNG THỨ ĐÃ VẼ RA MÀN HÌNH:
 *   1) chụp ảnh toàn trang (capturePage)
 *   2) với từng phần tử có chữ: cắt đúng vùng của nó từ ảnh (nativeImage.crop)
 *   3) nền = TRUNG VỊ màu các pixel trong vùng (chữ chỉ chiếm thiểu số nên trung
 *      vị chính là nền — kể cả khi nền là ảnh/gradient)
 *   4) tương phản = màu chữ thật (getComputedStyle) vs nền pixel đó
 * → không thể "đoán sai" nền nữa.
 *
 * Ngưỡng: chữ thường ≥ 4.5:1 · chữ lớn (≥24px, hoặc ≥18.66px bold) ≥ 3:1.
 * Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-contrast-pixels.js
 */
const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const PY = 'C:/Users/Admin/.workbuddy-ai/binaries/python/envs/default/Scripts/python.exe';
const TMP = path.join(require('os').tmpdir(), 'w46e-sweep');

/* Banner SÁNG — đúng ca bro gửi ảnh (chữ trắng trên nền sáng = chìm). */
function ensureBanner() {
	fs.mkdirSync(TMP, { recursive: true });
	const f = path.join(TMP, 'banner-light.png');
	if (fs.existsSync(f)) return fs.readFileSync(f);
	const { execFileSync } = require('child_process');
	execFileSync(
		PY,
		[
			'-c',
			`
from PIL import Image, ImageDraw, ImageFilter
W,H = 900, 300
im = Image.new('RGB', (W,H), (247,248,251))
d = ImageDraw.Draw(im)
for i in range(0, W, 3):
    t = i / float(W)
    d.line([(i,0),(i,H)], fill=(int(242+12*t), int(244+10*t), int(249+6*t)))
d.ellipse([-120, 150, 420, 520], fill=(255,255,255))
d.ellipse([520, -60, 980, 300], fill=(252,252,254))
im.filter(ImageFilter.GaussianBlur(9)).save(r'${f.split(String.fromCharCode(92)).join('/')}')
`,
		],
		{ stdio: 'ignore' },
	);
	return fs.readFileSync(f);
}

let BANNER = null;
const server = http.createServer((req, res) => {
	const url = req.url.split('?')[0];
	if (url === '/banner-light.png') {
		res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': BANNER.length });
		res.end(BANNER);
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
		res.writeHead(200, {
			'Content-Type': ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'application/octet-stream',
			'Content-Length': buf.length,
		});
		res.end(buf);
		return;
	}
	const file = path.join(ROOT, url === '/' ? 'harness46e-sweep.html' : decodeURIComponent(url));
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

/* ---------- Gom mọi phần tử CÓ CHỮ đang hiển thị ---------- */
const COLLECT = `(function(){
  function vis(el){
    const cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden')return false;
    if(+cs.opacity<0.15)return false;
    const r=el.getBoundingClientRect();
    if(r.width<2||r.height<2)return false;
    if(r.bottom<0||r.top>innerHeight)return false;
    // phần tử nằm trong khung bị ẩn
    let n=el; while(n&&n!==document.body){ if(n.hidden) return false; n=n.parentElement; }
    return true;
  }
  function path(el){
    const bits=[]; let n=el;
    while(n&&n!==document.body&&bits.length<5){
      let s=n.tagName.toLowerCase();
      if(n.id){s+='#'+n.id;bits.unshift(s);break;}
      if(n.classList.length){s+='.'+[...n.classList].slice(0,2).join('.');}
      bits.unshift(s); n=n.parentElement;
    }
    return bits.join('>');
  }
  const out=[];
  const all=document.querySelectorAll('body *');
  // Khi có modal mở, CHỈ đo phần tử NẰM TRONG modal. Mọi thứ phía sau lớp phủ
  // bị veil làm tối CÓ CHỦ Ý (đó là thiết kế), đo qua lớp phủ là báo "chìm" GIẢ.
  const scope=window.__scopeSel||null;
  for(const el of all){
    if(scope && !el.closest(scope)) continue;
    // chỉ lấy phần tử có TEXT TRỰC TIẾP (không phải chỉ bọc con)
    let direct='';
    for(const n of el.childNodes){ if(n.nodeType===3) direct+=n.nodeValue; }
    direct=direct.replace(/\\s+/g,' ').trim();
    if(!direct) continue;
    if(!vis(el)) continue;
    const cs=getComputedStyle(el);
    const fill=cs.webkitTextFillColor||cs.color;
    // chữ cắt theo gradient (cầu vồng) → không đo bằng màu, đo bằng điểm dừng
    const clipped=/text/.test(cs.webkitBackgroundClip||cs.backgroundClip||'') && /gradient/.test(cs.backgroundImage||'');
    const r=el.getBoundingClientRect();
    out.push({
      sel: path(el),
      text: direct.slice(0,42),
      color: cs.color,
      fill: fill,
      size: parseFloat(cs.fontSize),
      weight: +cs.fontWeight || 400,
      clipped: clipped,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    });
  }
  return JSON.stringify(out);
})()`;

/* ---------- Đo màu nền bằng TRUNG VỊ pixel ---------- */
function medianBg(img, rect, scale) {
	const x = Math.max(0, Math.round(rect.x * scale));
	const y = Math.max(0, Math.round(rect.y * scale));
	const w = Math.max(1, Math.round(rect.w * scale));
	const h = Math.max(1, Math.round(rect.h * scale));
	const size = img.getSize();
	if (x >= size.width || y >= size.height) return null;
	const cw = Math.min(w, size.width - x);
	const ch = Math.min(h, size.height - y);
	let crop;
	try {
		crop = img.crop({ x, y, width: cw, height: ch });
	} catch (e) {
		return null;
	}
	const bmp = crop.getBitmap(); // BGRA
	const rs = [];
	const gs = [];
	const bs = [];
	const step = Math.max(1, Math.floor((cw * ch) / 4000)) * 4;
	for (let i = 0; i + 3 < bmp.length; i += step) {
		const a = bmp[i + 3];
		if (a < 40) continue;
		bs.push(bmp[i]);
		gs.push(bmp[i + 1]);
		rs.push(bmp[i + 2]);
	}
	if (!rs.length) return null;
	const med = (arr) => {
		arr.sort((p, q) => p - q);
		return arr[Math.floor(arr.length / 2)];
	};
	return [med(rs), med(gs), med(bs)];
}

function parseColor(s) {
	const m = String(s).match(/rgba?\(([^)]+)\)/);
	if (!m) return null;
	const p = m[1].split(',').map(parseFloat);
	if (p.length > 3 && p[3] < 0.15) return null; // trong suốt
	return [p[0], p[1], p[2]];
}
function relLum(c) {
	const f = (v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}
function contrast(a, b) {
	const l1 = relLum(a),
		l2 = relLum(b);
	const hi = Math.max(l1, l2),
		lo = Math.min(l1, l2);
	return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}

app.whenReady().then(async () => {
	BANNER = ensureBanner();
	await new Promise((r) => server.listen(0, '127.0.0.1', r));
	const port = server.address().port;

	let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	fs.writeFileSync(
		path.join(ROOT, 'harness46e-sweep-api.js'),
		`(function(){const h={log:null,event:null,state:null};window.__h=h;
    const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
    window.autoquest=new Proxy({},{get(_t,k){
      if(k==='onLog')return x=>{h.log=x;};
      if(k==='onEvent')return x=>{h.event=x;};
      if(k==='onState')return x=>{h.state=x;};
      if(k==='authCheck')return ()=>Promise.resolve({ok:false});
      return f;}});})();`,
		'utf8',
	);
	html = html.replace(
		'<script src="renderer.js"></script>',
		'<script src="harness46e-sweep-api.js"></script>\n<script src="renderer.js"></script>',
	);
	html = html.replace(
		/img-src 'self' https:\/\/cdn\.discordapp\.com/,
		`img-src 'self' http://127.0.0.1:${port} https://cdn.discordapp.com`,
	);
	fs.writeFileSync(path.join(ROOT, 'harness46e-sweep.html'), html, 'utf8');

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
		for (const f of ['harness46e-sweep-api.js', 'harness46e-sweep.html']) {
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

		/* Modal có animation MỞ (`veilIn` 0.16s, `upPopIn` 0.2s). Trong cửa sổ ẨN,
		   Chromium không chạy animation → veil kẹt ở opacity:0 và thẻ ở scale .98.
		   Hậu quả: ảnh chụp ra modal MỜ, thấy cả trang phía sau "xuyên qua", và
		   mọi phép đo màu bên trong modal đều SAI (đã bị báo 46 lỗi GIẢ).
		   Tắt animation/transition CHỈ trong 2 modal → trạng thái cuối, đo đúng. */
		await win.webContents.executeJavaScript(
			`(function(){
        const s=document.createElement('style'); s.id='probe-noanim';
        s.textContent='#logoutModal,#logoutModal *,#captchaModal,#captchaModal *{animation:none !important;transition:none !important;}';
        document.head.appendChild(s);
        return 1;
      })()`,
			true,
		);

		// Hồ sơ có banner ẢNH SÁNG (ca bro báo chìm) + nhật ký đủ loại dòng.
		await win.webContents.executeJavaScript(
			`(function(){
        const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
        const hero=document.getElementById('heroProfile'); if(hero) hero.hidden=false;
        set('phDisplay','Hsin'); set('phUsername','@duyoz'); set('phUserIdValue','1815924981466669116');
        const uid=document.getElementById('phUserId'); if(uid) uid.hidden=false;
        const np=document.getElementById('phNameplate'); if(np) np.style.setProperty('--np','#e0416a');
        const b=document.getElementById('phBanner');
        if(b){ b.classList.remove('default'); b.style.background="center / cover no-repeat url('/banner-light.png')"; }
        if (typeof appendLog === 'function') {
          appendLog('[Hệ thống] Đã đăng nhập Discord: @duyoz', 'system');
          appendLog('Đã nạp 69 nhiệm vụ (7.3s)', 'ok');
          appendLog('[Hệ thống] Số Orb khả dụng (ví dụ Discord): 3580', 'system');
          appendLog('[OK] Đã nhận "ROR2 Hallowed Concepts" (+15 Orbs) — Discord xác nhận.', 'ok');
          appendLog('[Cảnh báo] Nhận "A Very Long Quest Name That Goes On" bị giới hạn tốc độ (429) — thử lại sau 12 giây.', 'warn');
          appendLog('[Lỗi] Nhận "Zenless Zone Zero" thất bại: Discord trả lỗi không xác định.', 'stderr');
        }
        return 'ok';
      })()`,
			true,
		);
		await new Promise((r) => setTimeout(r, 5000));

		const vw = await win.webContents.executeJavaScript('innerWidth', true);
		const results = {};
		for (const theme of ['dark', 'light']) {
			await win.webContents.executeJavaScript(
				`document.getElementById(${theme === 'light' ? "'themeLight'" : "'themeDark'"}).click()`,
				true,
			);
			await new Promise((r) => setTimeout(r, 900));

			const rows = [];
			/* Bro: "rà soát TỪNG NGÓC NGÁCH" → đi hết MỌI trang trên sidebar,
			   cộng thêm tab "Đã làm" (lưới ô vuông khác hẳn).
			   QUAN TRỌNG: phải CHỤP LẠI ẢNH SAU MỖI LẦN CHUYỂN TRANG. Nếu chỉ
			   chụp một lần rồi đo mọi trang, toạ độ của trang Settings/About
			   không khớp với ảnh đã chụp → đọc pixel của trang khác → báo
			   "chìm màu" GIẢ (đã mắc đúng lỗi này ở lần chạy đầu). */
			const views = [
				{ label: 'Quest', open: `q()`, },
				{ label: 'Settings', open: `s()`, },
				{ label: 'About', open: `a()`, },
				{ label: 'Done', open: `q(); t()`, },
				/* Bro: "từng ngóc ngách" → 2 MODAL cũng phải đo. Đây là chỗ dễ chìm
				   nhất vì modal dùng bề mặt riêng + nút disabled (nút disabled từng
				   bị `opacity:.4` làm tương phản không kiểm soát được). */
				{
					label: 'ModalLogout',
					scope: '#logoutModal .modal-card',
					open: `q(); (function(){
            var m=document.getElementById('logoutModal'); if(m) m.hidden=false;
            var acc=document.getElementById('logoutAccount'); if(acc) acc.hidden=false;
            var n=document.getElementById('logoutAccName'); if(n) n.textContent='duyoz';
            var i=document.getElementById('logoutAccId'); if(i) i.textContent='ID: 1815924981466669116';
          })()`,
				},
				{
					label: 'ModalCaptcha',
					scope: '#captchaModal .modal-card',
					/* Trạng thái THẬT lúc mới mở: đã có thông tin quest + đang tải
					   widget + nút "Gửi xác minh ngay" ĐANG DISABLED. */
					open: `q(); (function(){
            var m=document.getElementById('captchaModal'); if(m) m.hidden=false;
            var t=document.getElementById('captchaTarget'); if(t) t.hidden=false;
            var tn=document.getElementById('captchaTargetName'); if(tn) tn.textContent='ROR2 Hallowed Concepts';
            var ts=document.getElementById('captchaTargetSub'); if(ts) ts.textContent='Risk of Rain 2';
            var ld=document.getElementById('captchaLoading'); if(ld) ld.hidden=false;
            var bt=document.getElementById('btnCaptchaRetry'); if(bt) bt.disabled=true;
          })()`,
				},
			];
			for (const view of views) {
				await win.webContents.executeJavaScript(
					`(function(){
            var q=function(){var e=document.getElementById('navQuest'); if(e) e.click();};
            var s=function(){var e=document.getElementById('navSettings'); if(e) e.click();};
            var a=function(){var e=document.getElementById('navAbout'); if(e) e.click();};
            var t=function(){var e=document.getElementById('tabDone'); if(e) e.click();};
            // đóng modal trước mỗi lượt để không đo nhầm lớp phủ
            ['logoutModal','captchaModal'].forEach(function(id){
              var m=document.getElementById(id); if(m) m.hidden=true;
            });
            ${view.open};
            return 1;
          })()`,
					true,
				);
				await new Promise((r) => setTimeout(r, 420));
				// Ấm máy: lần chụp đầu sau mỗi thay đổi trả surface CŨ.
				await win.webContents.capturePage();
				await new Promise((r) => setTimeout(r, 200));
				const img = await win.webContents.capturePage();
				fs.writeFileSync(path.join(TMP, `sweep-${theme}-${view.label}.png`), img.toPNG());
				const scale = img.getSize().width / vw;
				const items = JSON.parse(
					await win.webContents.executeJavaScript(
						`window.__scopeSel=${JSON.stringify(view.scope || null)};` + COLLECT,
						true,
					),
				);
				for (const it of items) {
					const tag = `${view.label} ${it.sel}`;
					if (it.clipped) {
						rows.push({ ...it, sel: tag, bg: null, ratio: null, skip: 'gradient' });
						continue;
					}
					const fg = parseColor(it.fill) || parseColor(it.color);
					const bg = medianBg(img, it.rect, scale);
					if (!fg || !bg) {
						rows.push({ ...it, sel: tag, bg, ratio: null, skip: 'no-color' });
						continue;
					}
					const ratio = contrast(fg, bg);
					const large = it.size >= 24 || (it.size >= 18.66 && it.weight >= 700);
					rows.push({ ...it, sel: tag, fg, bg, ratio, large, need: large ? 3 : 4.5 });
				}
			}
			results[theme] = rows;
		}

		let failTotal = 0;
		for (const theme of ['dark', 'light']) {
			const rows = results[theme];
			const checked = rows.filter((r) => r.ratio != null);
			const bad = checked.filter((r) => r.ratio < r.need).sort((a, b) => a.ratio - b.ratio);
			failTotal += bad.length;
			console.log(`\n=== THEME ${theme.toUpperCase()} — đo ${checked.length} phần tử chữ bằng PIXEL THẬT ===`);
			console.log(`  bỏ qua (chữ gradient cắt nền): ${rows.filter((r) => r.skip === 'gradient').length}`);
			console.log(`  THẤP NHẤT: ${checked.length ? Math.min(...checked.map((r) => r.ratio)) : '—'}:1`);
			const byView = {};
			for (const r of checked) {
				const v = r.sel.split(' ')[0];
				byView[v] = (byView[v] || 0) + 1;
			}
			console.log(
				'  phủ: ' +
					Object.entries(byView)
						.map(([v, n]) => `${v}=${n}`)
						.join(' · '),
			);
			if (!bad.length) console.log('  ✅ KHÔNG có phần tử nào dưới ngưỡng');
			for (const b of bad.slice(0, 24)) {
				console.log(
					`  ✘ ${String(b.ratio).padStart(5)}:1 (cần ${b.need}) ${b.sel}  "${b.text}"  fg=rgb(${b.fg}) bg=rgb(${b.bg})`,
				);
			}
		}

		console.log(`\n=== RÀ SOÁT CHÌM MÀU (pixel thật, 2 theme): ${failTotal === 0 ? 'PASS ✅' : `FAIL ❌ (${failTotal})`} ===`);
		cleanup();
		app.exit(failTotal === 0 ? 0 : 1);
	} catch (e) {
		console.log('SWEEP ERROR:', e && e.stack ? e.stack : String(e));
		cleanup();
		app.exit(2);
	}
});
