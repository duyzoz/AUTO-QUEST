/* Waves 46e — PROBE THẬT cho NHẬT KÝ (viết lại theo yêu cầu mới của bro).
 *
 * Bro yêu cầu:
 *   1) "mỗi phần [] này bắt buộc phải có phác hoạ ra một cái logo gì đó thông
 *      minh chạy luôn sau text" → mỗi nhóm có LOGO HUY HIỆU riêng, đặt NGAY SAU
 *      nhãn `[ … ]`, không chen vào giữa câu, không làm gãy dòng chữ.
 *   2) "chữ chính đổi màu đỏ … text thường để xanh hay gì tuỳ", "màu không quá
 *      sặc sỡ" → 2 vai trò màu: chữ thường (trung tính) + chữ CHÍNH (đỏ).
 *   3) "1 dòng text nếu quá dài thì chỉ nên gói gọn lại trong 2 dòng" → clamp 2.
 *   4) "lúc nhận thành công ORBS text log phải đổi màu kiểu rainbow … không
 *      phải 7 màu cầu vồng ngẫu nhiên" → gradient 13 điểm dừng hue đều 30°, chạy
 *      vòng quanh chữ, MỌI điểm dừng vẫn ≥ 4.5:1.
 *
 * Probe đo từ DOM thật + parse CSS thật (không tin code):
 *   · thứ tự DOM: tag → logo → body (logo SAU nhãn, TRƯỚC nội dung)
 *   · ≥ 4 kiểu logo khác nhau (mỗi nhóm một logo)
 *   · ≥ 2 màu chữ: chữ thường + chữ chính, cả hai ≥ 4.5:1 trên cả 2 theme
 *   · body bị clamp đúng 2 dòng với dòng rất dài
 *   · dòng nhận ORBS có gradient + animation + màu trong suốt
 *   · không còn nhãn bị lặp `[ hệ thống ] [Hệ thống] …`
 *   · mọi điểm dừng cầu vồng ≥ 4.5:1 (tính từ CSS, cả 2 theme)
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, '__lc-data.js'), 'window.__LIST=[];\n', 'utf8');
fs.writeFileSync(
	path.join(ROOT, '__lc-api.js'),
	`(function(){const h={log:null,event:null,state:null};window.__h=h;
  const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return x=>{h.log=x;};
    if(k==='onEvent')return x=>{h.event=x;};
    if(k==='onState')return x=>{h.state=x;};
    return f;}});})();`,
	'utf8',
);
const tmp = path.join(ROOT, '__lc.html');
fs.writeFileSync(
	tmp,
	html.replace(
		'<script src="renderer.js"></script>',
		'<script src="__lc-api.js"></script>\n<script src="__lc-data.js"></script>\n<script src="renderer.js"></script>',
	),
	'utf8',
);

const MEASURE = `(function(){
  function rgb(s){const m=String(s).match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(parseFloat);return[p[0],p[1],p[2],p[3]===undefined?1:p[3]];}
  function lum(c){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]);}
  function ratio(a,b){const l1=lum(a),l2=lum(b);const hi=Math.max(l1,l2),lo=Math.min(l1,l2);return +((hi+0.05)/(lo+0.05)).toFixed(2);}
  function effBg(el){let n=el;while(n){const c=rgb(getComputedStyle(n).backgroundColor);if(c&&c[3]>0.02)return c;n=n.parentElement;}return[255,255,255,1];}
  const c=document.getElementById('console');
  const lines=[...c.querySelectorAll('.u229-line')];

  const perLine = lines.map(function(l){
    const tag=l.querySelector('.u229-tag');
    const ico=l.querySelector('.u229-ico');
    const body=l.querySelector('.u229-body');
    const svg=ico?ico.querySelector('svg'):null;
    const paths=svg?[...svg.querySelectorAll('path')].map(p=>p.getAttribute('d')).join('|'):'';
    const kids=[...l.children].map(k=>k.className);
    const key=l.querySelector('.u229-key');
    const bs=getComputedStyle(body||l);
    const bg=effBg(body||l);
    const lineH=parseFloat(bs.lineHeight)||16;
    // Thứ tự DOM: nhãn → logo → nội dung (logo NGAY SAU nhãn).
    const order = kids.map(k=>k.indexOf('u229-tag')>=0?'tag':k.indexOf('u229-ico')>=0?'ico':k.indexOf('u229-body')>=0?'body':'?').join('>');
    return {
      cls:(l.className||'').replace('u229-line','').trim(),
      order: order,
      hasLogo: !!svg,
      logoPaths: paths,
      logoW: ico?Math.round(ico.getBoundingClientRect().width):0,
      logoH: ico?Math.round(ico.getBoundingClientRect().height):0,
      tag: tag?tag.textContent.trim():'',
      bodyText: body?(body.textContent||'').trim():'',
      bodyColor: bs.color,
      bodyRatio: ratio(rgb(bs.color)||[0,0,0], bg),
      keyColor: key?getComputedStyle(key).color:null,
      keyRatio: key?ratio(rgb(getComputedStyle(key).color)||[0,0,0], bg):null,
      hasKey: !!key,
      clamp: bs.webkitLineClamp || bs.getPropertyValue('-webkit-line-clamp'),
      renderedLines: body?Math.round(body.clientHeight/lineH):0,
      clip: bs.backgroundClip || bs.webkitBackgroundClip,
      bgImage: bs.backgroundImage,
      fill: bs.webkitTextFillColor,
      anim: bs.animationName,
      startsWithBracket: body?/^\\s*\\[/.test(body.textContent||''):false,
    };
  });

  const base = {};
  const keys = {};
  perLine.forEach(r=>{ if(!r.cls.includes('is-orbwin')) base[r.bodyColor]=1; if(r.keyColor) keys[r.keyColor]=1; });
  const distinctLogo = {};
  perLine.forEach(r=>{ if(r.logoPaths) distinctLogo[r.logoPaths]=1; });
  const txt=c.textContent||'';
  // Dòng cầu vồng cố tình để color:transparent (màu do gradient cắt theo chữ)
  // nên KHÔNG được tính vào tương phản chữ thường. Tương phản của gradient được
  // kiểm riêng bằng cách đọc từng điểm dừng trong CSS.
  const numeric = perLine.filter(r=>r.bodyRatio!=null && r.cls.indexOf('is-orbwin')<0).map(r=>r.bodyRatio);
  const keyNums = perLine.filter(r=>r.keyRatio!=null && r.cls.indexOf('is-orbwin')<0).map(r=>r.keyRatio);

  return JSON.stringify({
    theme: document.documentElement.getAttribute('data-theme'),
    lineCount: lines.length,
    perLine: perLine,
    logoCount: perLine.filter(r=>r.hasLogo).length,
    orderOk: perLine.filter(r=>r.order==='tag>ico>body').length,
    distinctLogo: Object.keys(distinctLogo).length,
    baseColours: Object.keys(base).length,
    keyColours: Object.keys(keys).length,
    minBodyRatio: numeric.length?Math.min.apply(null,numeric):null,
    minKeyRatio: keyNums.length?Math.min.apply(null,keyNums):null,
    duplicatedTag: perLine.filter(r=>r.startsWithBracket).length,
    clampOk: perLine.filter(r=>String(r.clamp)==='2').length,
    maxRenderedLines: Math.max.apply(null, perLine.map(r=>r.renderedLines||0)),
    // Dòng bị cắt gọn phải kết thúc bằng "…" để người đọc biết còn nữa.
    ellipsisLines: perLine.filter(r=>/\\u2026$/.test((r.bodyText||'').trim())).length,
    orbwin: perLine.filter(r=>r.cls.indexOf('is-orbwin')>=0),
    hasBlockGlyph: /[\\u2588\\u2593\\u2591\\u258B\\u25A0\\u25CF]/.test(txt),
    arrowSanitised: txt.indexOf('\\u2192')<0,
    anyEmoji: /[\\u{1F000}-\\u{1FAFF}\\u2600-\\u27BF]/u.test(txt),
    sample: txt.replace(/\\s+/g,' ').slice(0,140),
  });
})()`;

/* ---------- Kiểm tương phản từng điểm dừng cầu vồng (đọc CSS thật) ---------- */
const CSS = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
function hslToRgb(h, s, l) {
	h = ((h % 360) + 360) % 360;
	s /= 100;
	l /= 100;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0,
		g = 0,
		b = 0;
	if (h < 60) [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];
	return [r + m, g + m, b + m].map((v) => Math.round(v * 255));
}
function hexToRgb(hex) {
	const h = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
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
/** Lấy danh sách điểm dừng `--rb` của một theme từ CSS.
 *  `--rb` xuất hiện đúng 2 lần trong styles.css: bản DARK trong khối `.u229`
 *  và bản LIGHT trong khối `[data-theme="light"] .u229`. Không dò theo tên khối
 *  (dễ trượt vì khoảng trắng/xuống dòng) mà lấy theo THỨ TỰ xuất hiện. */
function rbStops(isLight) {
	const all = [];
	let i = CSS.indexOf('--rb:');
	while (i >= 0) {
		const semi = CSS.indexOf(';', i);
		all.push(CSS.slice(i, semi));
		i = CSS.indexOf('--rb:', semi);
	}
	const block = all[isLight ? 1 : 0];
	if (!block) return [];
	return block
		.replace('--rb:', '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s) => {
			const hsl = s.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
			if (hsl) return hslToRgb(+hsl[1], +hsl[2], +hsl[3]);
			if (s.startsWith('#')) return hexToRgb(s);
			return null;
		})
		.filter(Boolean);
}

app.whenReady().then(async () => {
	const win = new BrowserWindow({
		width: 1500,
		height: 950,
		show: false,
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false, backgroundThrottling: false },
	});
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1200));
	/* BẮT BUỘC: Chromium trong môi trường headless báo prefers-reduced-motion:
	   "reduce" → CSS của app tắt animation cầu vồng (đúng luật accessibility),
	   khiến probe đọc ra `animation: none` và kết luận SAI là "cầu vồng không
	   chạy". Ép về "no-preference" để đo đúng trạng thái người dùng thường thấy;
	   sau đó ép lại "reduce" để kiểm nhánh tĩnh. */
	let dbgOk = false;
	try {
		win.webContents.debugger.attach('1.3');
		await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
			features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
		});
		dbgOk = true;
	} catch (e) {
		console.log('  (không ép được prefers-reduced-motion:', e.message, ')');
	}
	const setMotion = async (v) => {
		if (!dbgOk) return;
		await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
			features: [{ name: 'prefers-reduced-motion', value: v }],
		});
	};
	await win.webContents.executeJavaScript(
		`(function(){
      const ev=window.__h.event;
      ev({type:'scan:start', data:{total:10}});
      ev({type:'quest:scan-progress', data:{done:5, total:10}});
      return 'ok';})()`,
		true,
	);
	await win.webContents.executeJavaScript(
		`(function(){
      if (typeof appendLog !== 'function') return 'nofn';
      appendLog('[Hệ thống] Đã đăng nhập Discord: @duyoz', 'system');
      appendLog('Đã nạp 69 nhiệm vụ (7.3s)', 'ok');
      appendLog('[Hệ thống] Số Orb khả dụng (ví dụ Discord): 3580', 'system');
      appendLog('[OK] Đã nhận "ROR2 Hallowed Concepts" (+15 Orbs) — Discord xác nhận.', 'ok');
      appendLog('Orbs hiện có 4200', 'stdout');
      appendLog('[Cảnh báo] Nhận "A Very Long Quest Name That Goes On" bị giới hạn tốc độ (429) — thử lại sau 12 giây.', 'warn');
      appendLog('[Lỗi] Nhận "Zenless Zone Zero" thất bại: Discord trả về lỗi không xác định, cần kiểm tra kết nối mạng, thử lại sau ít phút, nếu vẫn lỗi thì đăng xuất rồi đăng nhập lại token, kiểm tra cả phiên bản Discord đang dùng và thời gian hệ thống trước khi báo lỗi cho quản trị viên.', 'stderr');
      appendLog('token hết hạn \\u2192 thử lại \\u2588\\u2593 emoji \\uD83C\\uDFAE xong', 'warn');
      return 'direct';
    })()`,
		true,
	);
	await new Promise((r) => setTimeout(r, 9000));
	const dark = JSON.parse(await win.webContents.executeJavaScript(MEASURE, true));
	await win.webContents.executeJavaScript(`document.getElementById('themeLight').click()`, true);
	await new Promise((r) => setTimeout(r, 1000));
	const light = JSON.parse(await win.webContents.executeJavaScript(MEASURE, true));
	// Nhánh giảm chuyển động: gradient GIỮ (đó là thông tin) nhưng ĐỨNG YÊN.
	await setMotion('reduce');
	await new Promise((r) => setTimeout(r, 450));
	const reduced = JSON.parse(await win.webContents.executeJavaScript(MEASURE, true));
	await setMotion('no-preference');

	const show = (label, o) => {
		console.log(`\n--- ${label} (theme=${o.theme}) ---`);
		console.log(
			`  dòng: ${o.lineCount} · có logo: ${o.logoCount} · đúng thứ tự tag>logo>body: ${o.orderOk}`,
		);
		console.log(`  số LOGO khác nhau: ${o.distinctLogo} · màu chữ thường: ${o.baseColours} · màu chữ chính: ${o.keyColours}`);
		console.log(`  tương phản thấp nhất — chữ thường ${o.minBodyRatio}:1 · chữ chính ${o.minKeyRatio}:1`);
		console.log(`  dòng có dấu … (cắt gọn): ${o.ellipsisLines} · clamp 2 dòng: ${o.clampOk}/${o.lineCount} · số dòng vẽ ra nhiều nhất: ${o.maxRenderedLines}`);
		console.log(`  nhãn bị LẶP trong câu: ${o.duplicatedTag} · glyph khối: ${o.hasBlockGlyph} · mũi tên: ${!o.arrowSanitised} · emoji: ${o.anyEmoji}`);
		o.perLine.forEach((r) =>
			console.log(
				`    ${r.cls.padEnd(18)} ${r.order.padEnd(13)} logo=${r.logoW}x${r.logoH} chữ=${r.bodyColor} ${r.bodyRatio}:1` +
					` key=${r.hasKey ? r.keyColor + ' ' + r.keyRatio + ':1' : '—'} clamp=${r.clamp} vẽ=${r.renderedLines}d`,
			),
		);
		const ow = o.orbwin[0];
		if (ow)
			console.log(
				`  ORBWIN: clip=${ow.clip} fill=${ow.fill} anim=${ow.anim} grad=${String(ow.bgImage).slice(0, 46)}…`,
			);
		console.log(`  mẫu: ${o.sample}`);
	};
	show('DARK', dark);
	show('LIGHT', light);

	const fails = [];
	for (const [label, o] of [
		['DARK', dark],
		['LIGHT', light],
	]) {
		if (o.lineCount < 6) fails.push(`${label}: chỉ có ${o.lineCount} dòng`);
		if (o.logoCount !== o.lineCount) fails.push(`${label}: ${o.lineCount - o.logoCount} dòng THIẾU logo`);
		if (o.orderOk !== o.lineCount) fails.push(`${label}: logo không nằm NGAY SAU nhãn (tag>logo>body)`);
		if (o.distinctLogo < 5) fails.push(`${label}: chỉ ${o.distinctLogo} kiểu logo (cần ≥5 — mỗi nhóm một logo)`);
		if (o.baseColours !== 1) fails.push(`${label}: chữ thường phải dùng ĐÚNG 1 màu (đang ${o.baseColours})`);
		if (o.keyColours < 1) fails.push(`${label}: không có chữ CHÍNH (số / tên / @user) được tô màu`);
		if (o.minBodyRatio < 4.5) fails.push(`${label}: chữ thường ${o.minBodyRatio}:1 < 4.5`);
		if (o.minKeyRatio != null && o.minKeyRatio < 4.5) fails.push(`${label}: chữ chính ${o.minKeyRatio}:1 < 4.5`);
		if (o.duplicatedTag > 0) fails.push(`${label}: ${o.duplicatedTag} dòng còn lặp nhãn trong câu`);
		if (o.clampOk !== o.lineCount) fails.push(`${label}: ${o.lineCount - o.clampOk} dòng không clamp 2 dòng`);
		if (o.maxRenderedLines > 2) fails.push(`${label}: có dòng vẽ ra ${o.maxRenderedLines} dòng (>2)`);
		if (o.ellipsisLines < 1) fails.push(`${label}: dòng dài KHÔNG có dấu … (bị cắt cụt)`);
		if (!o.orbwin.length) fails.push(`${label}: không có dòng nhận ORBS để kiểm cầu vồng`);
		else {
			const ow = o.orbwin[0];
			if (!/text/.test(String(ow.clip))) fails.push(`${label}: cầu vồng thiếu background-clip:text`);
			if (!/gradient/.test(String(ow.bgImage))) fails.push(`${label}: cầu vồng thiếu gradient`);
			if (!ow.anim || ow.anim === 'none') fails.push(`${label}: cầu vồng không chạy (thiếu animation)`);
			if (!/rgba\(0, 0, 0, 0\)|transparent/.test(String(ow.fill)))
				fails.push(`${label}: cầu vồng chưa trong suốt (${ow.fill})`);
		}
		if (o.hasBlockGlyph) fails.push(`${label}: còn glyph khối gây "??"`);
		if (!o.arrowSanitised) fails.push(`${label}: mũi tên U+2192 lọt ra (tofu)`);
		if (o.anyEmoji) fails.push(`${label}: còn emoji trong log`);
	}

	// Cầu vồng: mọi điểm dừng phải đủ tương phản trên nền khung của theme đó.
	const rb = { dark: rbStops(false), light: rbStops(true) };
	const bgDark = [8, 10, 16]; // --well 65% trên --card #090b13
	const bgLight = [255, 255, 255];
	console.log(`\n--- CẦU VỒNG: số điểm dừng ---`);
	console.log(`  DARK ${rb.dark.length} · LIGHT ${rb.light.length}  (cần 13 — quang phổ liên tục, không phải 7 màu)`);
	for (const [k, stops, bg] of [
		['DARK', rb.dark, bgDark],
		['LIGHT', rb.light, bgLight],
	]) {
		if (stops.length < 13) fails.push(`CẦU VỒNG ${k}: chỉ ${stops.length} điểm dừng (cần 13)`);
		const worst = stops
			.map((c, i) => ({ i, r: contrast(c, bg), c }))
			.sort((a, b) => a.r - b.r)[0];
		console.log(`  ${k}: thấp nhất ${worst.r}:1 ở điểm dừng #${worst.i} rgb(${worst.c.join(',')})`);
		if (worst.r < 4.5) fails.push(`CẦU VỒNG ${k}: điểm dừng #${worst.i} chỉ ${worst.r}:1 < 4.5`);
	}

	// Nhánh giảm chuyển động: gradient GIỮ (đó là thông tin) nhưng ĐỨNG YÊN.
	const rw = reduced.orbwin[0];
	console.log(
		`\n--- GIẢM CHUYỂN ĐỘNG ---\n  anim=${rw ? rw.anim : '—'} · vẫn còn gradient=${rw ? /gradient/.test(String(rw.bgImage)) : false}`,
	);
	if (!rw) fails.push('REDUCE: không có dòng nhận ORBS');
	else {
		if (rw.anim !== 'none') fails.push(`REDUCE: vẫn chạy animation (${rw.anim}) — phải đứng yên`);
		if (!/gradient/.test(String(rw.bgImage))) fails.push('REDUCE: mất gradient (mất thông tin thành công)');
	}

	const ok = fails.length === 0;
	console.log('\n=== WAVE 46e LOG (logo + màu chữ + clamp + cầu vồng):', ok ? 'PASS ✅' : 'FAIL ❌', '===');
	if (!ok) fails.forEach((f) => console.log('   ✘ ' + f));
	for (const f of ['__lc.html', '__lc-api.js', '__lc-data.js']) {
		try {
			fs.unlinkSync(path.join(ROOT, f));
		} catch (e) {
			/* đã xoá */
		}
	}
	app.exit(ok ? 0 : 1);
});
