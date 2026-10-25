/* Wave#96 — PROBE THẬT cho 7 hạng mục bro yêu cầu (STUB renderer).
 * Đo từ DOM THẬT + CSS THẬT, không tin code:
 *   1) Logo nằm CẠNH tên (không absolute xa), CÓ vòng bao quanh.
 *   2) Tên app CHỈ "ZoZ Development" — KHÔNG còn tiền tố "Nền tảng ALL IN ONE DISCORD".
 *   3) KHÔNG còn khung xanh quanh profile khi user KHÔNG có nameplate
 *      (đọc data-np-real + box-shadow computed của .up-frame).
 *   4) Nút Đăng xuất có NỀN ĐẶC ở CẢ 2 theme (trắng ở Sáng / tối ở Tối),
 *      giống nút Đổi tài khoản (so sánh trực tiếp 2 nút).
 *   5) Nhịp bò % chạy NGAY khi bắt đầu quét (đo % sau ~300ms > 0%).
 *   6) .accsw-item KHÔNG dịch chuyển khi hover + KHÔNG có scrollbar.
 *   7) Veil "Đang đăng nhập" phủ ĐẶC, chỉ chứa 2 phần tử (chữ + vòng xoay),
 *      và resetQuestSessionForSwitch() dọn sạch nhiệm vụ phiên cũ.
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

fs.writeFileSync(
	path.join(ROOT, '__w96-api.js'),
	`(function(){const h={log:null,event:null,state:null};window.__h=h;
  const f=()=>Promise.resolve({ok:true,state:'idle',config:{},token:'a.b.c',accounts:[],activeIdx:0});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return x=>{h.log=x;};
    if(k==='onEvent')return x=>{h.event=x;};
    if(k==='onState')return x=>{h.state=x;};
    if(k==='getConfig')return ()=>Promise.resolve({token:'a.b.c',accounts:[],activeIdx:0});
    return f;}});})();`,
	'utf8',
);
const tmp = path.join(ROOT, '__w96.html');
fs.writeFileSync(
	tmp,
	html.replace(
		'<script src="renderer.js"></script>',
		'<script src="__w96-api.js"></script>\n<script src="renderer.js"></script>',
	),
	'utf8',
);

const MEASURE = `(function(){
  function rgb(s){const m=String(s).match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(parseFloat);return[p[0],p[1],p[2],p[3]===undefined?1:p[3]];}
  const out={};
  out.theme=document.documentElement.getAttribute('data-theme');

  /* ---- (1)+(2) BRAND ---- */
  const brand=document.querySelector('.side-brand');
  const logoWrap=document.querySelector('.brand-logo-wrap');
  const logo=document.querySelector('.brand-logo');
  const name=document.querySelector('.brand-name');
  out.brand={
    exists:!!brand,
    nameText:name?name.textContent.trim():null,
    tagCount:document.querySelectorAll('.brand-tag').length,
    titleText:document.title,
    // logo phải là flex-row SIBLING của tên (không absolute ra xa)
    logoPos:logo?getComputedStyle(logo).position:null,
    logoWrapW:logoWrap?Math.round(logoWrap.offsetWidth):0,
    logoWrapH:logoWrap?Math.round(logoWrap.offsetHeight):0,
    wrapBorder:logoWrap?getComputedStyle(logoWrap).borderTopWidth:null,
    wrapRadius:logoWrap?getComputedStyle(logoWrap).borderTopLeftRadius:null,
    // khoảng cách logo → tên (cạnh phải logoWrap → cạnh trái tên)
    gapPx:(logoWrap&&name)?Math.round(name.getBoundingClientRect().left-logoWrap.getBoundingClientRect().right):null,
  };

  /* ---- (3) KHUNG XANH quanh profile ---- */
  const upRow=document.getElementById('upRow');
  const upFrame=document.getElementById('upFrame');
  out.npGate={
    hasNpClass: upRow?upRow.classList.contains('has-np'):null,
    dataNpReal: upRow?upRow.getAttribute('data-np-real'):null,
    frameShadow: upFrame?getComputedStyle(upFrame).boxShadow:null,
    npVar: upRow?upRow.getAttribute('style'):null,
  };
  /* Quét TÍM CHỈ trong NGỮ CẢNH KHUNG PROFILE (bro phàn nàn đúng chỗ này):
     .up-frame / .up-avatarwrap / .hero-card / .ph-avatar — KHÔNG tính màu brand
     hợp lệ ở nút/nav/logo (đó là thiết kế, không phải "khung xanh"). */
  // Nhận diện TÍM bằng 2 mẫu KHÔNG chứa backslash (tránh bẫy escape trong
  // template literal của probe): hex thường + "rgb(139" đầu màu.
  function isViolet(v){
    const s=String(v);
    return s.indexOf('8b5cf6')>=0 || s.indexOf('rgb(139')>=0 || s.indexOf('139, 92, 246')>=0;
  }
  let violet=0, violetEls=[];
  document.querySelectorAll('.up-frame,.up-avatarwrap,.up-avatar,.up-row,.hero-card,.ph-avatar,.profile-hero').forEach(function(el){
    const cs=getComputedStyle(el);
    ['boxShadow','borderTopColor','outlineColor','backgroundImage'].forEach(function(p){
      const v=cs[p];
      if(v&&isViolet(v)&&!/gradient/.test(String(v))){violet++;violetEls.push((el.className||el.id)+':'+p+'='+String(v).slice(0,44));}
    });
  });
  out.violetCount=violet;
  out.violetEls=violetEls.slice(0,6);

  /* ---- (4) NÚT ĐĂNG XUẤT có NỀN ĐẶC, GIỐNG nút Đổi tài khoản ---- */
  const logout=document.getElementById('btnLogout');
  const logout2=document.getElementById('btnLogout2');
  const sw=document.getElementById('btnSwitchAccount');
  const bgOf=el=>el?{bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderTopColor,color:getComputedStyle(el).color}:null;
  out.logoutRow=bgOf(logout);
  out.logoutPop=bgOf(logout2);
  out.switchPop=bgOf(sw);

  /* ---- (5) NHỊP BÒ % ---- */
  // bật scanning rồi đo sau ~320ms
  out.creep={
    pctAt0: null,
    pctAfter: null,
    barAfter: null,
  };
  if(typeof setScanning==='function'){
    setScanning(true,0);
    const el=document.querySelector('.u229-prog-pct');
    out.creep.pctAt0=el?el.textContent:null;
    out.creep.barAt0=document.querySelector('.u229-prog-bar')?document.querySelector('.u229-prog-bar').textContent:null;
  }

  /* ---- (6) ACC LIST hover + scrollbar ---- */
  // Tạo 1 item THẬT để đo transform (list có thể rỗng trong stub).
  const list=document.getElementById('accswList');
  let item=document.querySelector('.accsw-item');
  if(!item && list){
    const li=document.createElement('button');
    li.className='accsw-item';
    li.innerHTML='<span class="accsw-av"></span><span class="accsw-meta"><span class="accsw-name">Test</span></span>';
    list.appendChild(li);
    item=li;
  }
  const itemCs=item?getComputedStyle(item):null;
  out.acc={
    itemTransform: itemCs?itemCs.transform:'NO_ITEM',
    itemTransition: itemCs?itemCs.transitionProperty:'NO_ITEM',
    listMaxH: list?getComputedStyle(list).maxHeight:null,
    listOverflowY: list?getComputedStyle(list).overflowY:null,
    listScrollH: list?list.scrollHeight:0,
    listClientH: list?list.clientHeight:0,
  };
  // Mô phỏng HOVER THẬT: gắn lớp .is-hover-probe? Không có — dùng mouseover KHÔNG
  // đổi được :hover trong headless. Thay vào đó đọc CSS nguồn đã kiểm ở Node.

  /* ---- (7) VEIL ---- */
  const veil=document.getElementById('loginVeil');
  if(veil){
    veil.hidden=false;
    const vcs=getComputedStyle(veil);
    out.veil={
      children: veil.children.length,
      innerChildren: veil.querySelector('.login-veil-inner')?veil.querySelector('.login-veil-inner').children.length:0,
      childClasses: [...veil.querySelector('.login-veil-inner').children].map(c=>c.className).join('|'),
      display:vcs.display,
      zIndex:vcs.zIndex,
      bg:vcs.backgroundColor,
      blur:vcs.backdropFilter||vcs.webkitBackdropFilter,
      pointerEvents:vcs.pointerEvents,
      text: veil.querySelector('.login-veil-text')?veil.querySelector('.login-veil-text').textContent:null,
      dots: veil.querySelectorAll('.login-veil-dot').length,
      spinAnim: veil.querySelector('.login-veil-spin')?getComputedStyle(veil.querySelector('.login-veil-spin')).animationName:null,
      // phủ đặc: opacity nền >= 0.95
      width: veil.getBoundingClientRect().width,
      height: veil.getBoundingClientRect().height,
    };
    veil.hidden=true;
  }

  /* ---- (7b) resetQuestSessionForSwitch dọn sạch ---- */
  try{
    if(typeof upsertQuest==='function'){
      upsertQuest('test-1',{name:'A',status:'claimed'});
      upsertQuest('test-2',{name:'B',status:'claimable'});
    }
    if(typeof renderQuests==='function') renderQuests();
    const before={order:questOrder.length, claimed:document.querySelectorAll('#questListDone .quest-card').length, new:document.querySelectorAll('#questListNew .quest-card').length};
    if(typeof resetQuestSessionForSwitch==='function') resetQuestSessionForSwitch();
    const after={order:questOrder.length, claimed:document.querySelectorAll('#questListDone .quest-card').length, new:document.querySelectorAll('#questListNew .quest-card').length};
    out.reset={before:before, after:after};
  }catch(e){ out.reset={err:String(e.message||e)}; }

  return JSON.stringify(out);
})()`;

app.whenReady().then(async () => {
	const win = new BrowserWindow({
		width: 1440,
		height: 900,
		show: false,
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false, backgroundThrottling: false },
	});
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1400));

	let dbgOk = false;
	try {
		win.webContents.debugger.attach('1.3');
		await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
			features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
		});
		dbgOk = true;
	} catch (e) { /* ignore */ }

	// DARK
	const dark = JSON.parse(await win.webContents.executeJavaScript(MEASURE, true));
	await new Promise((r) => setTimeout(r, 420));
	const creepDark = JSON.parse(await win.webContents.executeJavaScript(
		`JSON.stringify({pct:(document.querySelector('.u229-prog-pct')||{}).textContent||null,bar:(document.querySelector('.u229-prog-bar')||{}).textContent||null})`, true));

	// LIGHT
	await win.webContents.executeJavaScript(`document.getElementById('themeLight').click()`, true);
	await new Promise((r) => setTimeout(r, 500));
	const light = JSON.parse(await win.webContents.executeJavaScript(MEASURE, true));

	const show = (label, o) => {
		console.log(`\n===== ${label} (theme=${o.theme}) =====`);
		console.log(`(1)(2) BRAND: name="${o.brand.nameText}" · .brand-tag còn lại=${o.brand.tagCount} · title="${o.brand.titleText}"`);
		console.log(`        logo position=${o.brand.logoPos} · wrap=${o.brand.logoWrapW}x${o.brand.logoWrapH} · border=${o.brand.wrapBorder} · radius=${o.brand.wrapRadius} · gap logo→tên=${o.brand.gapPx}px`);
		console.log(`(3) NP GATE: has-np=${o.npGate.hasNpClass} · data-np-real=${o.npGate.dataNpReal} · frameShadow=${o.npGate.frameShadow}`);
		console.log(`        phần tử còn màu TÍM #8b5cf6 = ${o.violetCount} ${JSON.stringify(o.violetEls)}`);
		console.log(`(4) LOGOUT row : bg=${o.logoutRow.bg} border=${o.logoutRow.border} color=${o.logoutRow.color}`);
		console.log(`        LOGOUT pop: bg=${o.logoutPop.bg} border=${o.logoutPop.border}`);
		console.log(`        SWITCH pop: bg=${o.switchPop.bg} border=${o.switchPop.border}`);
		console.log(`(5) CREEP: % lúc bắt đầu=${o.creep.pctAt0} · bar=${o.creep.barAt0}`);
		console.log(`(6) ACC: item transform=${o.acc.itemTransform} · transition=${o.acc.itemTransition}`);
		console.log(`        list maxH=${o.acc.listMaxH} overflowY=${o.acc.listOverflowY} scrollH=${o.acc.listScrollH} clientH=${o.acc.listClientH}`);
		console.log(`(7) VEIL: children=${o.veil.children} innerChildren=${o.veil.innerChildren} [${o.veil.childClasses}]`);
		console.log(`        display=${o.veil.display} z=${o.veil.zIndex} bg=${o.veil.bg} blur=${o.veil.blur} pointer=${o.veil.pointerEvents}`);
		console.log(`        text="${o.veil.text}" dots=${o.veil.dots} spinAnim=${o.veil.spinAnim} size=${o.veil.width}x${o.veil.height}`);
		console.log(`(7b) RESET: before=${JSON.stringify(o.reset.before)} after=${JSON.stringify(o.reset.after)}`);
	};
	show('DARK', dark);
	console.log(`  CREEP sau ~420ms: %=${creepDark.pct} bar=${creepDark.bar}`);
	show('LIGHT', light);

	const fails = [];
	const check = (cond, msg) => { if (!cond) fails.push(msg); };

	// (1)+(2) brand
	check(dark.brand.exists, 'không có .side-brand');
	check(dark.brand.nameText === 'ZoZ Development', `tên app phải là "ZoZ Development" (đang "${dark.brand.nameText}")`);
	check(dark.brand.tagCount === 0, `còn ${dark.brand.tagCount} .brand-tag (tiền tố phải bị xoá sạch)`);
	check(!/ALL IN ONE/i.test(dark.brand.titleText), `title còn tiền tố "ALL IN ONE": "${dark.brand.titleText}"`);
	check(dark.brand.logoPos !== 'absolute', `logo vẫn position:absolute (phải là static/flex) — đang ${dark.brand.logoPos}`);
	check(dark.brand.logoWrapW > 0 && dark.brand.logoWrapW === dark.brand.logoWrapH, `vòng logo không vuông: ${dark.brand.logoWrapW}x${dark.brand.logoWrapH}`);
	check(parseFloat(dark.brand.wrapBorder) >= 1, `vòng logo MẤT VIỀN (border=${dark.brand.wrapBorder})`);
	check(dark.brand.gapPx !== null && dark.brand.gapPx >= 0 && dark.brand.gapPx <= 20, `khoảng cách logo→tên bất thường: ${dark.brand.gapPx}px`);

	// (3) khung xanh
	for (const [label, o] of [['DARK', dark], ['LIGHT', light]]) {
		check(o.violetCount === 0, `${label}: còn ${o.violetCount} phần tử màu TÍM #8b5cf6`);
		check(o.npGate.dataNpReal === null, `${label}: data-np-real còn set khi user KHÔNG có nameplate`);
		const sh = String(o.npGate.frameShadow || '');
		check(sh === 'none' || sh === '', `${label}: .up-frame còn box-shadow khi không có nameplate: ${sh}`);
	}

	// (4) logout — đọc kênh alpha ĐÚNG (rgb 3 phần ⇒ alpha = 1)
	const solid = (bgStr) => {
		const m = String(bgStr).match(/rgba?\(([^)]+)\)/);
		if (!m) return null;
		const p = m[1].split(',').map((x) => parseFloat(x.trim()));
		return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
	};
	for (const [label, o] of [['DARK', dark], ['LIGHT', light]]) {
		const lb = solid(o.logoutRow.bg);
		const sb = solid(o.switchPop.bg);
		check(lb && lb.a > 0.9, `${label}: nút Đăng xuất (hàng) KHÔNG có nền đặc (bg=${o.logoutRow.bg})`);
		check(sb && sb.a > 0.9, `${label}: nút Đổi tài khoản không có nền đặc để so (bg=${o.switchPop.bg})`);
		if (label === 'LIGHT') {
			// Nền sáng (gần trắng) và PHẢI khác nền hàng panel (#ffffff) để nổi.
			check(lb && lb.r > 200 && lb.g > 200 && lb.b > 200, `LIGHT: nút Đăng xuất phải NỀN SÁNG (bg=${o.logoutRow.bg})`);
			check(lb && !(lb.r > 252 && lb.g > 252 && lb.b > 252), `LIGHT: nút Đăng xuất TRÙNG nền trắng của hàng panel (bg=${o.logoutRow.bg})`);
		} else {
			// Nền TỐI nhưng KHÁC nền popout/hàng panel để thực sự nổi.
			check(lb && lb.r < 60 && lb.g < 60 && lb.b < 60, `DARK: nút Đăng xuất phải NỀN TỐI (bg=${o.logoutRow.bg})`);
			check(lb && (lb.r + lb.g + lb.b) > 40, `DARK: nút Đăng xuất TRÙNG nền hàng panel (bg=${o.logoutRow.bg})`);
		}
	}

	// (5) creep chạy ngay
	const creepPct = parseFloat(String(creepDark.pct).replace('%', ''));
	check(!Number.isNaN(creepPct) && creepPct > 0, `nhịp bò KHÔNG chạy: % sau 420ms = ${creepDark.pct}`);

	// (6) acc — nếu list RỖNG thì không có item để đo (bỏ qua, không tính FAIL)
	if (dark.acc.itemTransform !== 'NO_ITEM') {
		check(dark.acc.itemTransform === 'none', `accsw-item còn transform khi không hover: ${dark.acc.itemTransform}`);
	}
	check(dark.acc.listOverflowY !== 'auto' && dark.acc.listOverflowY !== 'scroll', `accsw-list vẫn cuộn (overflowY=${dark.acc.listOverflowY})`);

	// (6b) Kiểm CSS NGUỒN: rule :hover của .accsw-item KHÔNG được có transform,
	//      và .accsw-list KHÔNG được có max-height/overflow-y (headless không
	//      kích được :hover nên phải đọc thẳng CSS thật).
	const CSS96 = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
	const hoverRule = (CSS96.match(/\.accsw-item:hover\s*\{[^}]*\}/g) || []).join(' ');
	check(hoverRule.length > 0, 'không tìm thấy rule .accsw-item:hover');
	check(!/transform/.test(hoverRule), `.accsw-item:hover vẫn còn transform: ${hoverRule}`);
	const listRule = (CSS96.match(/\.accsw-list\s*\{[^}]*\}/g) || []).join(' ');
	check(!/max-height\s*:\s*\d/.test(listRule), `.accsw-list vẫn kẹp max-height: ${listRule}`);
	check(!/overflow-y\s*:\s*(auto|scroll)/.test(listRule), `.accsw-list vẫn overflow-y auto/scroll: ${listRule}`);
	// (2b) CSS/HTML không còn .brand-tag; HTML không còn chuỗi ALL IN ONE
	const HTML96 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	check(!/class="brand-tag"/.test(HTML96), 'index.html còn .brand-tag');
	check(!/class="topbar-tag"/.test(HTML96), 'index.html còn .topbar-tag');
	check(!/ALL IN ONE/i.test(HTML96.replace(/<!--[\s\S]*?-->/g, '')), 'index.html còn chuỗi "ALL IN ONE" (ngoài comment)');
	check(!/ALL IN ONE/i.test(CSS96.replace(/\/\*[\s\S]*?\*\//g, '')), 'styles.css còn chuỗi "ALL IN ONE" (ngoài comment)');
	const JSS96 = fs.readFileSync(path.join(ROOT, 'renderer.js'), 'utf8');
	const zt = (JSS96.match(/const ZOZ_TAG\s*=\s*['"]([^'"]*)['"]/) || [])[1];
	check(zt === 'ZoZ Development', `ZOZ_TAG phải là "ZoZ Development" (đang "${zt}")`);

	// (7) veil
	for (const [label, o] of [['DARK', dark], ['LIGHT', light]]) {
		check(o.veil && o.veil.innerChildren === 2, `${label}: veil phải có ĐÚNG 2 phần tử (chữ + xoay), đang ${o.veil && o.veil.innerChildren}`);
		check(o.veil && /login-veil-text/.test(o.veil.childClasses) && /login-veil-spin/.test(o.veil.childClasses), `${label}: veil thiếu chữ hoặc vòng xoay`);
		check(o.veil && o.veil.dots === 8, `${label}: vòng xoay phải 8 điểm (đang ${o.veil && o.veil.dots})`);
		check(o.veil && o.veil.spinAnim && o.veil.spinAnim !== 'none', `${label}: vòng xoay không chạy (anim=${o.veil && o.veil.spinAnim})`);
		check(o.veil && /blur/.test(String(o.veil.blur)), `${label}: veil thiếu blur (bg=${o.veil && o.veil.blur})`);
		check(o.veil && parseFloat(o.veil.zIndex) >= 1000, `${label}: veil z-index quá thấp (${o.veil && o.veil.zIndex})`);
		const vbg = String(o.veil.bg).match(/rgba?\(([^)]+)\)/);
		const va = vbg ? parseFloat(vbg[1].split(',')[3] || '1') : 1;
		check(va >= 0.9, `${label}: veil KHÔNG đủ đặc (alpha=${va}) — phiên cũ sẽ lộ ra`);
		check(o.veil && o.veil.width >= 1400, `${label}: veil không phủ hết bề ngang (${o.veil && o.veil.width})`);
	}

	// (7b) reset
	check(dark.reset.after && dark.reset.after.order === 0, `reset không dọn questOrder (còn ${dark.reset.after && dark.reset.after.order})`);
	check(dark.reset.after && dark.reset.after.claimed === 0, `reset không dọn tab Đã làm (còn ${dark.reset.after && dark.reset.after.claimed})`);
	check(dark.reset.after && dark.reset.after.new === 0, `reset không dọn tab Chưa nhận (còn ${dark.reset.after && dark.reset.after.new})`);

	const ok = fails.length === 0;
	console.log('\n=== WAVE#96 (7 hạng mục):', ok ? 'PASS ✅' : 'FAIL ❌', '===');
	if (!ok) fails.forEach((f) => console.log('   ✘ ' + f));
	for (const f of ['__w96.html', '__w96-api.js']) {
		try { fs.unlinkSync(path.join(ROOT, f)); } catch (e) { /* đã xoá */ }
	}
	app.exit(ok ? 0 : 1);
});
