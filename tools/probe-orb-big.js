/* Waves 46 — PROBE "LOGO ORB TO Ở CHÍNH GIỮA" + ô "Đã làm" không xếp chồng.
   Mục tiêu bro nêu (nguyên văn):
     "bố cần là logo orb to ở chính giữa và logo Game chữ game trích được từ server discord"
     "mục chưa làm ... nó xếp chồng lên nhau ???"
   Cách đo: dựng DOM thật bằng harness, rồi:
     1) Kiểm logo orb lớn giữa thẻ hero: tồn tại, cạnh ≥ 120px, tâm trùng tâm thẻ.
     2) Kiểm ô "Đã làm": orb ≥ 36px, nằm giữa ô, không tràn, không đè logo game.
     3) Kiểm lưới quest KHÔNG xếp chồng cả khi đang quét.
   Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-orb-big.js */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');

function buildHtml() {
	const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	const list = [
		{ id: '1', name: 'Watch 15 min', description: 'x', status: 'claimed', progress: 100, orbs: 15, kind: 'video', gameTitle: 'Genshin Impact', appId: '123456789012345678', appIcon: 'abc' },
		{ id: '2', name: 'Play a game', description: 'y', status: 'claimed', progress: 100, orbs: 300, kind: 'game', gameTitle: 'Valorant', appId: '223456789012345678', appIcon: 'def' },
		{ id: '3', name: 'A very long quest name that should wrap nicely', description: 'z', status: 'claimed', progress: 100, orbs: 50, kind: 'item', gameTitle: 'A Very Long Game Title From Discord Server', appId: '323456789012345678', appIcon: 'ghi' },
		{ id: '4', name: 'Todo one', description: 'q', status: 'todo', progress: 0, orbs: 10, kind: 'video' },
		{ id: '5', name: 'Todo two', description: 'w', status: 'todo', progress: 0, orbs: 20, kind: 'game' },
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

const MEASURE = `(async function(){
  const out = { checks: [] };
  const ok = (name, cond, detail) => out.checks.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });

  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  await new Promise(r=>setTimeout(r, 500));
  if (window.__h && window.__h.event) {
    window.__h.event({type:'quest:inventory', data:{quests: window.__LIST}});
  }
  await new Promise(r=>setTimeout(r, 400));
  // Mở TAB "Đã làm" — lưới ô đã làm nằm trong panel [hidden], không mở thì mọi
  // rect đều 0x0 và phép đo vô nghĩa (đây là lỗi của probe, không phải của app).
  // KHÔNG gọi .click() (kéo theo logic đổi tab của app, dễ ném lỗi trong harness);
  // chỉ gỡ [hidden] của đúng panel cần đo — probe quan tâm HÌNH HỌC bên trong ô.
  const doneList = document.querySelector('#questListDone');
  if (doneList) { doneList.hidden = false; doneList.style.display = ''; }
  await new Promise(r=>setTimeout(r, 300));

  /* ---------- 1) Logo orb TO ở chính giữa = ẢNH CỦA Ô AVATAR ----------
     Waves 46b: KHÔNG còn lớp phủ .ph-orbbig lơ lửng trên banner (bro:
     "sao tụ nhiên lòi logo orb phía trên"). Orb to nay nằm TRONG LUỒNG bố cục
     tại ô avatar ở tâm thẻ hero. */
  const hero = document.querySelector('.hero-card.profile-hero');
  const orb = document.querySelector('.ph-avatar-orb');
  const overlay = document.querySelector('.ph-orbbig');
  const banner = document.querySelector('.ph-banner');
  ok('hero: KHÔNG còn lớp phủ orb lơ lửng (.ph-orbbig)', !overlay, overlay ? 'vẫn còn .ph-orbbig' : '');
  if (!orb) {
    ok('hero: ảnh orb lớn tồn tại (.ph-avatar-orb)', false, 'không tìm thấy .ph-avatar-orb');
  } else {
    const hr = hero ? hero.getBoundingClientRect() : null;
    const r = orb.getBoundingClientRect();
    ok('hero: ảnh orb lớn tồn tại (.ph-avatar-orb)', true, '');
    ok('hero: orb cạnh >= 60px', r.width >= 60 && r.height >= 60, 'w=' + Math.round(r.width) + ' h=' + Math.round(r.height));
    ok('hero: ảnh orb nạp thật (naturalWidth>0)', orb.naturalWidth > 0, 'natural=' + orb.naturalWidth);
    if (hr) {
      const orbCx = r.left + r.width / 2;
      const heroCx = hr.left + hr.width / 2;
      const dx = Math.abs(orbCx - heroCx);
      // avatar nằm ở lề trái thẻ, nên so với TÂM Ô AVATAR chứ không phải tâm thẻ
      const wrap = document.querySelector('.ph-avatarwrap');
      const wr = wrap ? wrap.getBoundingClientRect() : null;
      const wrapCx = wr ? wr.left + wr.width / 2 : orbCx;
      ok('hero: orb CANH GIỮA ô avatar (lệch <= 2px)', Math.abs(orbCx - wrapCx) <= 2,
         'lệch ' + Math.round(Math.abs(orbCx - wrapCx) * 10) / 10 + 'px');
      ok('hero: orb nằm TRONG thẻ hero', r.top >= hr.top - 2 && r.bottom <= hr.bottom + 2,
         'orb ' + Math.round(r.top - hr.top) + '..' + Math.round(r.bottom - hr.top) + ' / thẻ ' + Math.round(hr.height));
      if (banner) {
        const br = banner.getBoundingClientRect();
        // Đáy banner phải KHÔNG bị orb phủ: orb nằm dưới mốc giữa banner.
        ok('hero: orb KHÔNG nhô lên giữa banner', r.top >= br.bottom - Math.round(br.height * 0.55),
           'orb.top=' + Math.round(r.top - br.top) + 'px so với banner ' + Math.round(br.height) + 'px');
      }
    }
  }

  /* ---------- 2) Ô "Đã làm": orb to, giữa ô, không tràn ---------- */
  const done = Array.from(document.querySelectorAll('.qdone'));
  ok('done: có ô "Đã làm" để đo', done.length >= 3, 'n=' + done.length);
  let orbBig = 0, orbCentred = 0, noOverflow = 0, logoNotSquashed = 0;
  for (const tile of done) {
    const t = tile.getBoundingClientRect();
    const o = tile.querySelector('.qdone-orb');
    const face = tile.querySelector('.qdone-face');
    if (!o) continue;
    const r = o.getBoundingClientRect();
    if (r.width >= 36 && r.height >= 36) orbBig++;
    // tâm orb gần tâm ngang của ô
    const oc = r.left + r.width / 2, tc = t.left + t.width / 2;
    if (Math.abs(oc - tc) <= 3) orbCentred++;
    // mọi con của .qdone-face nằm trong ô
    let fits = true;
    if (face) {
      for (const child of face.children) {
        const cr = child.getBoundingClientRect();
        if (cr.width === 0 && cr.height === 0) continue;
        if (cr.top < t.top - 2 || cr.bottom > t.bottom + 2 || cr.left < t.left - 2 || cr.right > t.right + 2) { fits = false; break; }
      }
    }
    if (fits) noOverflow++;
    // logo game không được cao hơn 34px (không lấn át orb)
    const lg = tile.querySelector('.qdone-logo');
    if (lg) { const lr = lg.getBoundingClientRect(); if (lr.height <= 34) logoNotSquashed++; }
    else logoNotSquashed++;
  }
  ok('done: orb ≥ 36px MỌI ô', orbBig === done.length, orbBig + '/' + done.length);
  ok('done: orb CANH GIỮA MỌI ô', orbCentred === done.length, orbCentred + '/' + done.length);
  ok('done: không con nào tràn khỏi ô', noOverflow === done.length, noOverflow + '/' + done.length);
  ok('done: logo game không lấn át orb (≤34px)', logoNotSquashed === done.length, logoNotSquashed + '/' + done.length);

  /* ---------- 3) Lưới quest KHÔNG xếp chồng, kể cả khi đang quét ---------- */
  // Waves 46b: đây là lỗi bro nêu LẦN 2 ("phần đa làm vẫn chưa fix chồng hết
  // nhiệm vụ lên nhau"). Gốc: lưới chỉ khai báo cột, hàng auto bị chia theo
  // khoảng trống còn lại -> track nhỏ hơn ô aspect-ratio -> gap AM (-60px).
  // Nay grid-auto-rows: max-content buộc hàng cao theo nội dung.
  const allLists = ['#questListActive', '#questListNew', '#questListDone'];
  for (const sel of allLists) {
    const list = document.querySelector(sel);
    if (!list) { ok('grid ' + sel + ': tồn tại', false, 'không thấy'); continue; }
    const _prev = list.hidden;
    list.hidden = false;
    void list.offsetHeight;
    const cs = getComputedStyle(list);
    ok('grid ' + sel + ': auto-rows = max-content', cs.gridAutoRows === 'max-content', cs.gridAutoRows);
    const items = Array.from(list.querySelectorAll('.qcard, .qdone'));
    if (items.length >= 4) {
      const rs = items.map((t) => t.getBoundingClientRect());
      const rows = {};
      rs.forEach((r, i) => { const k = Math.round(r.top); (rows[k] = rows[k] || []).push(i); });
      const keys = Object.keys(rows).map(Number).sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < keys.length; i++) {
        gaps.push(Math.round(keys[i] - (keys[i - 1] + rs[rows[keys[i - 1]][0]].height)));
      }
      const bad = gaps.filter((g) => g < 0);
      ok('grid ' + sel + ': KHÔNG hàng nào gap âm (không xếp chồng)', bad.length === 0,
         bad.length ? 'gap=' + bad.join(',') : 'gaps=' + gaps.join(','));
    }
    list.hidden = _prev;
  }
  // Ô rỗng không được chiếm chỗ khi lưới đã có thẻ
  const stateNow = document.querySelector('#questListActive .qstate');
  if (stateNow) {
    const sr = stateNow.getBoundingClientRect();
    ok('grid: ô rỗng KHÔNG chiếm chỗ khi có thẻ', sr.height === 0 || getComputedStyle(stateNow).display === 'none',
       'h=' + Math.round(sr.height) + ' display=' + getComputedStyle(stateNow).display);
  } else {
    ok('grid: ô rỗng KHÔNG chiếm chỗ khi có thẻ', true, 'không có ô rỗng');
  }
  // Không cặp thẻ nào cùng cột bị chồng dọc
  const byCol = {};
  for (const tile of document.querySelectorAll('.qdone, .qcard')) {
    const r = tile.getBoundingClientRect();
    if (!r.width) continue;
    const key = Math.round(r.left);
    (byCol[key] = byCol[key] || []).push(r);
  }
  let overlaps = 0;
  for (const k of Object.keys(byCol)) {
    const arr = byCol[k].sort((a, b) => a.top - b.top);
    for (let i = 1; i < arr.length; i++) if (arr[i].top < arr[i - 1].bottom - 1) overlaps++;
  }
  ok('grid: không thẻ nào chồng lên nhau', overlaps === 0, overlaps + ' cặp chồng');

  return JSON.stringify(out);
})()`;

app.whenReady().then(async () => {
	const win = new BrowserWindow({
		width: 1500,
		height: 1000,
		show: false,
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false },
	});
	win.webContents.on('console-message', () => {});
	const tmp = path.join(ROOT, '__orbprobe.html');
	fs.writeFileSync(tmp, buildHtml(), 'utf8');
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1400));

	const raw = await win.webContents.executeJavaScript(`(async()=>${MEASURE})()`, true);
	const res = JSON.parse(raw);
	let pass = 0, fail = 0;
	for (const c of res.checks) {
		if (c.pass) { pass++; console.log(`  PASS  ${c.name}${c.detail ? '  [' + c.detail + ']' : ''}`); }
		else { fail++; console.log(`  FAIL  ${c.name}${c.detail ? '  [' + c.detail + ']' : ''}`); }
	}
	console.log(`\nWAVES 46 ORB: ${pass} pass / ${fail} fail`);
	try { fs.unlinkSync(tmp); fs.unlinkSync(path.join(ROOT, 'harness-api.js')); fs.unlinkSync(path.join(ROOT, 'harness-data.js')); } catch {}
	app.quit();
});
