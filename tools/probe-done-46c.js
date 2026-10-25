/* Waves 46c — PROBE "ô Đã làm hiện ĐỦ logo orb + logo game + chữ game", orb TO hơn.
   Bro nêu (nguyên văn):
     "làm ơn cho cái logo orb to ra tí nữa vẫn bé quá to ra ??"
     "và nhiều cái ko hiện logo orbs"
     "NÓ VẪN CHƯA HIỆN ĐƯỢC LOGO riêng của từng nhiệm vụ ... y như trên discord cơ
      mà ... không chỉ riêng hiện mỗi logo orb to đâu cả logo chữ quest từng nhiệm vụ"

   ĐIỂM KHÁC BIỆT so với các probe trước: probe cũ chạy OFFLINE nên ảnh CDN không
   nạp được → mọi ô rơi về chữ tên game, và phép đo "tilesWithLogo: 0" KHÔNG phản
   ánh app thật. Ở đây ta dựng một HTTP SERVER NỘI BỘ phục vụ ảnh PNG thật, rồi
   trỏ `QCDN` của renderer vào server đó (chặn bằng `session.protocol`... đơn giản
   hơn: ta chèn trước một script ghi đè `questAssetUrl`/`appIconUrl`? Không — ta
   chỉ cần trỏ CDN: xem `patchCdn`). Nhờ vậy chuỗi leo thang
   logotype → game_tile → app-icon CHẠY THẬT và ta đo được:

     1) MỌI ô đều có badge logo Orb (kể cả nhiệm vụ thưởng vật phẩm, orbs = 0).
     2) Ô có asset → hiện ĐỒNG THỜI logo game VÀ chữ tên game (không loại trừ nhau).
     3) Logo orb TO hơn: ô hero ≥ 100px, orb trong ô "Đã làm" ≥ 48px.
     4) Không ô nào tràn chữ / đè lên nhau.

   Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-done-46c.js */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const ASSETS = path.join(ROOT, 'assets');

/* ---------- Server nội bộ phục vụ CẢ trang harness LẪN ảnh ----------
   Lý do phải cùng origin: Chromium chặn `file://` gọi `http://127.0.0.1`
   (Private Network Access / mixed-origin), nên nếu nạp trang bằng `loadFile`
   rồi trỏ ảnh sang 127.0.0.1 thì request TREO MÃI (`complete=false`) — probe
   trước đã bị đúng bẫy này và cho ra "ô nào cũng thiếu logo" sai sự thật.
   Nay trang được phục vụ từ chính server đó → ảnh cùng origin, nạp bình thường. */
const PNG = fs.readFileSync(path.join(ASSETS, 'orb-logo-big.png'));
let reqHits = 0;
const server = http.createServer((req, res) => {
	const url = req.url.split('?')[0];
	// Ảnh của Discord (mọi đường dẫn khác) → trả PNG thật.
	if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif')) {
		reqHits++;
		res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': PNG.length });
		res.end(PNG);
		return;
	}
	// Trang harness + JS/CSS + assets tĩnh.
	const isIndex = url === '/';
	const file = path.join(ROOT, isIndex ? 'harness-index.html' : decodeURIComponent(url));
	let body;
	try {
		body = fs.readFileSync(file);
	} catch {
		res.writeHead(404);
		res.end('404');
		return;
	}
	/* MIME phải SUY TỪ TÊN FILE THẬT: đường dẫn `/` không có đuôi nên nếu chỉ
	   xét `url.endsWith('.html')` thì trang chủ bị trả về `application/octet-stream`
	   → Chromium từ chối dựng HTML và `loadURL` ném ERR_FAILED (-2). */
	const ext = path.extname(file).toLowerCase();
	const type =
		ext === '.css'
			? 'text/css'
			: ext === '.js'
				? 'text/javascript'
				: ext === '.html' || ext === '.htm'
					? 'text/html'
					: ext === '.png'
						? 'image/png'
						: ext === '.json'
							? 'application/json'
							: 'application/octet-stream';
	if (process.env.AQ_PROBE_DEBUG) console.log('[probe-srv]', type, url, body.length);
	res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
	res.end(body);
});

function buildHtml(port) {
	let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

	// Dữ liệu quest: trộn đủ loại để phủ hết các nhánh.
	const list = [
		// có logotype → nấc 1
		{ id: '1', name: 'Watch 15 min', description: 'x', status: 'claimed', progress: 100, orbs: 15, kind: 'video', gameTitle: 'Genshin Impact', logotype: 'quests/1/a.png', appId: '123456789012345678', appIcon: 'abc', claimedAt: '2026-10-22T10:15:00+00:00' },
		// KHÔNG logotype, chỉ game_tile → nấc 2
		{ id: '2', name: 'Play a game', description: 'y', status: 'claimed', progress: 100, orbs: 300, kind: 'game', gameTitle: 'Valorant', gameTile: 'quests/2/b.png', appId: '223456789012345678', appIcon: 'def', claimedAt: '2026-10-20T16:15:00+00:00' },
		// KHÔNG cả hai, chỉ icon app → nấc 3
		{ id: '3', name: 'Stream for 30 min', description: 'z', status: 'claimed', progress: 100, orbs: 50, kind: 'game', gameTitle: 'League of Legends', appId: '323456789012345678', appIcon: 'ghi', claimedAt: '2026-10-18T09:00:00+00:00' },
		// Waves 46c — THƯỞNG VẬT PHẨM, orbs = 0: đây chính là nhóm "nhiều cái ko hiện
		// logo orbs" mà bro phàn nàn (bản cũ `orbRow.hidden = orbs <= 0`).
		{ id: '4', name: 'Avatar Decoration', description: 'w', status: 'claimed', progress: 100, orbs: 0, rewardKind: 'item', rewardName: 'Avatar Decoration', gameTitle: 'Discord', appId: '423456789012345678', appIcon: 'jkl', claimedAt: '2026-10-15T12:30:00+00:00' },
		// Tên game RẤT dài → phải bị clamp, không tràn ô.
		{ id: '5', name: 'Long one', description: 'v', status: 'claimed', progress: 100, orbs: 25, kind: 'game', gameTitle: 'A Very Long Game Title From Discord Server', appId: '523456789012345678', appIcon: 'mno', claimedAt: '2026-10-10T08:05:00+00:00' },
		// Không có tên game, chỉ có tên nhiệm vụ → chữ vẫn phải hiện.
		{ id: '6', name: 'Mystery Quest', description: 'u', status: 'claimed', progress: 100, orbs: 5, kind: 'video', claimedAt: '2026-10-05T20:45:00+00:00' },
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
	html = html.replace(
		'<script src="renderer.js"></script>',
		`<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>`,
	);
	/* CSP của app chỉ cho `img-src ... https://cdn.discordapp.com ...`. Server
	   nội bộ của probe chạy trên 127.0.0.1 nên BỊ CHẶN → ảnh không nạp, phép đo
	   "ô có logo" luôn 0 và trông như app hỏng (đúng cái bẫy đã gặp: kết luận sai
	   vì probe sai). Ta nới CSP CHỈ TRONG BẢN HTML CỦA PROBE, không đụng app thật:
	   thêm http://127.0.0.1:<port> vào img-src. */
	html = html.replace(
		/img-src 'self' https:\/\/cdn\.discordapp\.com/,
		`img-src 'self' http://127.0.0.1:${port} https://cdn.discordapp.com`,
	);
	if (!html.includes(`http://127.0.0.1:${port} https://cdn.discordapp.com`)) {
		throw new Error('probe: không nới được CSP img-src để phục vụ ảnh nội bộ');
	}
	void port;
	return html;
}

/* Ghi đè trước khi renderer chạy: thay hằng CDN trong nguồn renderer.js bằng
   server nội bộ. Đây là kỹ thuật "CDN rewrite" — chỉ dùng cho probe.
   Dùng so khớp CHUỖI THUẦN (không regex) để tránh lỗi thoát dấu chấm/gạch. */
function patchedRenderer(port) {
	const src = fs.readFileSync(path.join(ROOT, 'renderer.js'), 'utf8');
	const needle = "const QCDN = 'https://cdn.discordapp.com/';";
	if (!src.includes(needle)) throw new Error('probe: không tìm thấy hằng QCDN trong renderer.js');
	return src.replace(needle, `const QCDN = 'http://127.0.0.1:${port}/';`);
}

const MEASURE = `(async function(){
  const out = { checks: [], tiles: [] };
  const ok = (name, cond, detail) => out.checks.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });

  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  await new Promise(r=>setTimeout(r, 500));
  if (window.__h && window.__h.event) window.__h.event({type:'quest:inventory', data:{quests: window.__LIST}});
  await new Promise(r=>setTimeout(r, 600));

  const doneList = document.querySelector('#questListDone');
  if (doneList) { doneList.hidden = false; doneList.style.display = ''; }
  /* QUAN TRỌNG: app đặt logo.loading = 'lazy'. Trong ngữ cảnh cuộn, ảnh nằm
     ngoài khung nhìn sẽ KHÔNG BAO GIỜ được nạp → complete=false, naturalWidth=0
     và probe kết luận sai là "app không hiện logo". Ép eager TRƯỚC khi chờ. */
  for (const img of document.querySelectorAll('#questListDone .qdone-logo')) img.loading = 'eager';
  await new Promise(r=>setTimeout(r, 700));   // chờ ảnh nạp

  const tiles = Array.from(document.querySelectorAll('#questListDone .qdone'));

  for (const t of tiles) {
    const orbImg = t.querySelector('.qdone-orb');
    const logoImg = t.querySelector('.qdone-logo');
    const nameEl = t.querySelector('.qdone-name');
    const tr = t.getBoundingClientRect();
    const or = orbImg ? orbImg.getBoundingClientRect() : null;
    const lr = logoImg ? logoImg.getBoundingClientRect() : null;
    const nr = nameEl ? nameEl.getBoundingClientRect() : null;

    const orbVisible = !!(orbImg && !orbImg.hidden && or && or.width > 8 && orbImg.naturalWidth > 0);
    const logoVisible = !!(logoImg && !logoImg.hidden && lr && lr.width > 8 && logoImg.naturalWidth > 0);
    const nameVisible = !!(nameEl && !nameEl.hidden && nr && nr.height > 2 && (nameEl.textContent || '').trim());

    /* Tràn: phần tử ĐANG HIỆN vượt khỏi ô (sai số 0.6px).
       Bỏ qua phần tử 0×0: một ảnh đang hidden và chưa có src bị
       getBoundingClientRect() trả về rect suy biến ở gốc viewport
       (đo được ở ô #6: [-1438,-697 -> -1438,-697]) — đó là artefact của
       phần tử KHÔNG hiển thị, không phải nội dung tràn ra ngoài ô. */
    const E = 0.6;
    const shown = [or, lr, nr].filter(r => r && r.width > 0.5 && r.height > 0.5);
    const overflow = shown.some(r => r.left < tr.left - E || r.right > tr.right + E || r.top < tr.top - E || r.bottom > tr.bottom + E);
    if (overflow) {
      out.diag = out.diag || [];
      const who = [];
      for (const [n, r] of [['orb', or], ['logo', lr], ['name', nr]]) {
        if (!r || r.width <= 0.5 || r.height <= 0.5) continue;
        if (r.left < tr.left - E || r.right > tr.right + E || r.top < tr.top - E || r.bottom > tr.bottom + E) {
          who.push(n + '[' + Math.round(r.left - tr.left) + ',' + Math.round(r.top - tr.top) + ' -> ' + Math.round(r.right - tr.left) + ',' + Math.round(r.bottom - tr.top) + '] ô=0,0->' + Math.round(tr.width) + ',' + Math.round(tr.height));
        }
      }
      out.diag.push('#' + t.dataset.questId + ' TRÀN: ' + who.join('  '));
    }

    out.tiles.push({
      id: t.dataset.questId,
      orbVisible, logoVisible, nameVisible, overflow,
      orbW: or ? Math.round(or.width) : 0,
      logoW: lr ? Math.round(lr.width) : 0,
      logoNatW: logoImg ? logoImg.naturalWidth : 0,
      logoSrc: logoImg ? String(logoImg.currentSrc || logoImg.src).slice(-46) : '',
      nameText: nameEl ? (nameEl.textContent || '').trim().slice(0, 34) : '',
      tileW: Math.round(tr.width), tileH: Math.round(tr.height),
    });
    // Chẩn đoán CHI TIẾT: vì sao ảnh không nạp (chưa gán src / CSP chặn / lỗi mạng).
    out.diag = out.diag || [];
    if (!logoImg) {
      out.diag.push('#' + t.dataset.questId + ' không có thẻ .qdone-logo trong DOM (đã bị remove)');
    } else {
      out.diag.push('#' + t.dataset.questId + ' logo.src="' + String(logoImg.src).slice(-52) + '" complete=' + logoImg.complete + ' nat=' + logoImg.naturalWidth + 'x' + logoImg.naturalHeight + ' hidden=' + logoImg.hidden);
    }
  }
  out.cdn = String(document.querySelector('.qdone-orb') ? document.querySelector('.qdone-orb').src : '');

  /* ---- 1) MỌI ô đều có badge logo Orb ---- */
  const missingOrb = out.tiles.filter(t => !t.orbVisible);
  ok('46c: MỌI ô "Đã làm" đều hiện logo Orb (kể cả ô thưởng vật phẩm)',
     out.tiles.length > 0 && missingOrb.length === 0,
     'thiếu ở ' + missingOrb.length + '/' + out.tiles.length + ' ô: ' + missingOrb.map(t=>t.id).join(','));

  /* ---- 2) Ô CÓ asset phải hiện LOGOTYPE của game (đúng như Discord) ---- */
  const withLogo = out.tiles.filter(t => t.logoVisible);
  ok('46c: ô có asset hiện LOGOTYPE game (như Discord)',
     withLogo.length >= out.tiles.length - 1,
     'có logotype ' + withLogo.length + '/' + out.tiles.length);

  /* ---- 3) Mỗi ô phải hiện ĐƯỢC THỨ GÌ ĐÓ làm "chữ quest":
     logotype HOẶC chữ tên game — không ô nào trống trơn. ---- */
  const nothing = out.tiles.filter(t => !t.logoVisible && !t.nameVisible);
  ok('46c: KHÔNG ô nào trống (logotype hoặc chữ tên game)',
     out.tiles.length > 0 && nothing.length === 0,
     'trống ở ' + nothing.length + ' ô');

  /* ---- 3b) Tooltip phải có ĐỦ 4 thứ như Discord:
     logotype/quầng · "Nhiệm Vụ …" · "N Orbs đã được nhận vào" · dd/mm ---- */
  const infoTiles = Array.from(document.querySelectorAll('#questListDone .qdone-info'));
  const hasGlow = infoTiles.filter(i => !!i.querySelector('.qdone-info-glow')).length;
  // Ô có logotype HOẶC có chữ tên game thay thế — không ô nào trống.
  const hasInfoLogo = infoTiles.filter(i => !!i.querySelector('.qdone-info-logo') || !!i.querySelector('.qdone-info-game')).length;
  /* LƯU Ý: KHÔNG dùng regex có dấu \/ hay \d ở đây. MEASURE là một template
     literal, nên \/ bị nuốt thành / và \d thành d → regex vỡ, ném
     "SyntaxError: Unexpected token '{'" mà node --check KHÔNG bắt được
     (vì nó kiểm tra file, không kiểm tra chuỗi sau khi template giải mã).
     Vì vậy dùng so khớp chuỗi thường: startsWith / split('/'). */
  const hasQuestTitle = infoTiles.filter(i => {
    const t = i.querySelector('.qdone-info-title');
    return !!t && (t.textContent || '').trim().startsWith('Nhiệm Vụ ');
  }).length;
  const hasRewardLine = infoTiles.filter(i => {
    const r = i.querySelector('.qdone-info-reward');
    return !!r && (r.textContent || '').trim().indexOf('đã được nhận vào') >= 0;
  }).length;
  const hasDay = infoTiles.filter(i => {
    const w = i.querySelector('.qdone-info-when');
    if (!w) return false;
    const parts = (w.textContent || '').trim().split('/');
    const two = (v) => v.length === 2 && v.charCodeAt(0) >= 48 && v.charCodeAt(0) <= 57 && v.charCodeAt(1) >= 48 && v.charCodeAt(1) <= 57;
    return parts.length === 2 && two(parts[0]) && two(parts[1]);
  }).length;
  ok('46c: tooltip có quầng orb mờ', infoTiles.length > 0 && hasGlow === infoTiles.length, hasGlow + '/' + infoTiles.length);
  ok('46c: tooltip có LOGOTYPE game (hoặc chữ tên game thay thế)', infoTiles.length > 0 && hasInfoLogo === infoTiles.length, hasInfoLogo + '/' + infoTiles.length);
  ok('46c: tooltip có "Nhiệm Vụ <tên>"', infoTiles.length > 0 && hasQuestTitle === infoTiles.length, hasQuestTitle + '/' + infoTiles.length);
  ok('46c: tooltip có "<N> Orbs đã được nhận vào"', infoTiles.length > 0 && hasRewardLine === infoTiles.length, hasRewardLine + '/' + infoTiles.length);
  ok('46c: tooltip có ngày dạng dd/mm', infoTiles.length > 0 && hasDay === infoTiles.length, hasDay + '/' + infoTiles.length);

  /* ---- 4) Logo orb TO hơn: trong ô >= 48px ---- */
  const smallOrb = out.tiles.filter(t => t.orbW < 64);
  ok('46c: logo Orb trong ô >= 64px (~50% bề rộng ô, như Discord)',
     out.tiles.length > 0 && smallOrb.length === 0,
     'nhỏ nhất = ' + Math.min.apply(null, out.tiles.map(t=>t.orbW)) + 'px');

  /* ---- 5) Ô hero: orb TO >= 100px ---- */
  const heroOrb = document.querySelector('.ph-avatar-orb');
  const heroAvatar = document.querySelector('.ph-avatar');
  const hr = heroAvatar ? heroAvatar.getBoundingClientRect() : null;
  const hor = heroOrb ? heroOrb.getBoundingClientRect() : null;
  ok('46c: orb hero to hơn — ô avatar >= 100px', !!hr && hr.width >= 100, hr ? 'w=' + Math.round(hr.width) : 'không thấy');
  ok('46c: ảnh orb hero phủ gần hết ô avatar', !!hor && !!hr && hor.width >= hr.width * 0.8,
     hor && hr ? Math.round(hor.width) + '/' + Math.round(hr.width) : '');

  /* ---- 6) Không ô nào tràn / đè ---- */
  const over = out.tiles.filter(t => t.overflow);
  ok('46c: không phần tử nào tràn khỏi ô', out.tiles.length > 0 && over.length === 0,
     'tràn ở ' + over.length + ' ô: ' + over.map(t=>t.id).join(','));

  /* ---- 7) Không cặp ô nào đè lên nhau ---- */
  const R = tiles.map(t => t.getBoundingClientRect());
  let overlaps = 0;
  for (let i = 0; i < R.length; i++)
    for (let j = i + 1; j < R.length; j++)
      if (R[i].left < R[j].right - 1 && R[j].left < R[i].right - 1 && R[i].top < R[j].bottom - 1 && R[j].top < R[i].bottom - 1) overlaps++;
  ok('46c: không cặp ô nào xếp chồng', tiles.length >= 2 && overlaps === 0, 'cặp đè = ' + overlaps);

  /* ---- 8) Hàng lưới vẫn max-content (không tái phát lỗi -60px) ---- */
  const cs = doneList ? getComputedStyle(doneList) : null;
  ok('46c: lưới "Đã làm" vẫn grid-auto-rows: max-content', cs && cs.gridAutoRows === 'max-content', cs ? cs.gridAutoRows : '');

  return out;
})()`;

app.whenReady().then(async () => {
	await new Promise((r) => server.listen(0, '127.0.0.1', r));
	const port = server.address().port;

	// Ghi renderer đã rewrite CDN vào một file tạm trong ROOT để index.html nạp được.
	const patched = patchedRenderer(port);
	fs.writeFileSync(path.join(ROOT, 'harness-renderer.js'), patched, 'utf8');

	let html = buildHtml(port);
	html = html.replace('<script src="renderer.js"></script>', '<script src="harness-renderer.js"></script>');
	fs.writeFileSync(path.join(ROOT, 'harness-index.html'), html, 'utf8');

	const win = new BrowserWindow({ width: 1920, height: 1080, show: false, webPreferences: { offscreen: false } });
	// In lỗi renderer ra ngoài — nếu không, MEASURE ném lỗi chỉ hiện
	// "Script failed to execute" mà KHÔNG cho biết lỗi gì.
	win.webContents.on('console-message', (e, level, msg) => {
		if (level >= 2 && !/Security Warning|Electron Security/.test(String(msg))) console.log('[renderer]', msg);
	});
	const cleanup = () => {
		for (const f of ['harness-api.js', 'harness-data.js', 'harness-renderer.js', 'harness-index.html']) {
			try { fs.unlinkSync(path.join(ROOT, f)); } catch { /* đã xoá */ }
		}
	};
	try {
		await win.loadURL(`http://127.0.0.1:${port}/`);
		const res = await win.webContents.executeJavaScript(MEASURE, true);
		const fails = res.checks.filter((c) => !c.pass);
		console.log('\n=== WAVES 46c — Ô "ĐÃ LÀM": ORB TO + LOGO GAME + CHỮ GAME ===\n');
		for (const c of res.checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '   [' + c.detail + ']' : ''}`);
		console.log('\n--- Từng ô ---');
		for (const t of res.tiles) {
			console.log(
				`#${t.id} ${t.tileW}x${t.tileH}  orb=${t.orbVisible ? t.orbW + 'px' : 'KHÔNG'}  logo=${t.logoVisible ? t.logoW + 'px' : 'KHÔNG'}(nat ${t.logoNatW})  chữ="${t.nameText}"`,
			);
		}
		console.log('\nĐối chứng: số request ẢNH server nội bộ đã phục vụ =', reqHits);
		for (const d of res.diag || []) console.log(d);
		console.log(`\n>>> WAVES 46c: ${res.checks.length - fails.length} pass / ${fails.length} fail`);
		cleanup();
		app.exit(fails.length ? 1 : 0);
	} catch (e) {
		console.log('PROBE ERROR:', e && e.stack ? e.stack : String(e));
		cleanup();
		app.exit(2);
	}
});
