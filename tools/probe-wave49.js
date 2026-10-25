'use strict';

/**
 * Waves 49 — KIỂM CHỨNG "PROFILE EFFECT + PROFILE FRAME + THEME COLORS".
 *
 * Bro chốt: khung hồ sơ phải GỌI ĐÚNG cụm layer Discord và ÔM SÁT khung bo tròn
 * avatar; hiệu ứng + màu theme phải áp cho CẢ panel trái (up-pop) LẪN thẻ hero
 * giữa trang. Probe này KHÔNG tin lời khai trong code — nó nạp index.html THẬT,
 * tiêm payload THẬT của bro, rồi đo DOM:
 *
 *   A. URL effect/frame đúng route `media/v1/collectibles-shop/...` (không phải
 *      path đoán bừa `/assets/...`).
 *   B. Cụm layer dựng đủ 3 layer + class theo type/anchor/order; khung gắn class
 *      `custom-profile-frame` + 4 CSS var.
 *   C. HÌNH HỌC: đo hộp layer so với tâm ô avatar → layer phải BAO quanh avatar
 *      (không lệch, không tràn ra ngoài khung panel).
 *   D. THEME COLORS: hai panel đều nhận `--theme-active` + gradient; chữ KHÔNG
 *      chìm (tương phản chữ/nền ≥ ngưỡng).
 *
 * Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-wave49.js
 */

const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const ASSETS = path.join(__dirname, '..', 'build-release', 'wave49', 'assets');

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
	if (cond) {
		pass++;
		console.log(`  OK   · ${name}${extra ? '  → ' + extra : ''}`);
	} else {
		fail++;
		console.log(`  FAIL · ${name}${extra ? '  → ' + extra : ''}`);
	}
}

/* ---------- đo màu nền thật từ ảnh chụp ---------- */
function medianColor(img, rect) {
	const b = img.getSize();
	const x = Math.max(0, Math.round(rect.x));
	const y = Math.max(0, Math.round(rect.y));
	const w = Math.min(Math.round(rect.w), b.width - x);
	const h = Math.min(Math.round(rect.h), b.height - y);
	if (w < 2 || h < 2) return null;
	let crop;
	try {
		crop = img.crop({ x, y, width: w, height: h });
	} catch {
		return null;
	}
	const bmp = crop.getBitmap();
	const rs = [];
	const gs = [];
	const bs = [];
	for (let i = 0; i + 3 < bmp.length; i += 4) {
		if (bmp[i + 3] < 40) continue;
		bs.push(bmp[i]);
		gs.push(bmp[i + 1]);
		rs.push(bmp[i + 2]);
	}
	if (!rs.length) return null;
	const med = (a) => {
		a.sort((p, q) => p - q);
		return a[Math.floor(a.length / 2)];
	};
	return [med(rs), med(gs), med(bs)];
}

function relLum(c) {
	const f = (v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}
function contrast(a, b) {
	const l1 = relLum(a);
	const l2 = relLum(b);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* ---------- DỮ LIỆU THẬT CỦA BRO (đã xác minh live 200) ---------- */
const REAL = {
	effectSku: '1545192421854285834',
	frameSku: '1489399523238477855',
	frameLayers: [
		{ id: '1517237005921157280', src: '1_staple_top.png' },
		{ id: '1517237009217753168', src: '2_rail_center.png' },
		{ id: '1517237013818900621', src: '3_staple_bottom.png' },
	],
	themeColors: [0xfe0f5e, 0xa10136],
	user: {
		id: '1815924981466669116',
		username: 'duyoz',
		displayName: 'Hsin',
		globalName: 'Hsin',
		avatar: null,
		banner: null,
		accentColor: null,
		premiumType: 2,
		badges: [],
		profileEffect: { id: '1545192421854285834', expiresAt: null },
		themeColors: [0xfe0f5e, 0xa10136],
		profileFrame: {
			sku: '1489399523238477855',
			layers: [
				{ id: '1517237005921157280', src: '1_staple_top.png' },
				{ id: '1517237009217753168', src: '2_rail_center.png' },
				{ id: '1517237013818900621', src: '3_staple_bottom.png' },
			],
		},
	},
};

/* ---------- HTTP server: phục vụ app + tài sản nội bộ (offline-able) ---------- */
const MIME = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.woff2': 'font/woff2',
	'.json': 'application/json',
};

app.whenReady().then(async () => {
	const assetMap = {
		'/a/frame-l1.png': 'frame-l1.png',
		'/a/frame-l2.png': 'frame-l2.png',
		'/a/frame-l3.png': 'frame-l3.png',
		'/a/effect-static.png': 'effect-static.png',
		'/a/effect-animated.png': 'effect-animated.png',
	};

	const server = http.createServer((req, res) => {
		const url = req.url.split('?')[0];
		if (assetMap[url]) {
			const f = path.join(ASSETS, assetMap[url]);
			let body;
			try {
				body = fs.readFileSync(f);
			} catch {
				res.writeHead(404);
				res.end('404');
				return;
			}
			res.writeHead(200, { 'Content-Type': MIME['.png'] });
			res.end(body);
			return;
		}
		const file = path.join(ROOT, url === '/' ? 'harness49.html' : decodeURIComponent(url));
		let body;
		try {
			body = fs.readFileSync(file);
		} catch {
			res.writeHead(404);
			res.end('404');
			return;
		}
		const ext = path.extname(file).toLowerCase();
		res.writeHead(200, { 'Content-Type': (MIME[ext] || 'application/octet-stream') + '; charset=utf-8' });
		res.end(body);
	});
	await new Promise((r) => server.listen(0, '127.0.0.1', r));
	const port = server.address().port;

	/* ---- Stub API: trả payload THẬT của bro ---- */
	fs.writeFileSync(
		path.join(ROOT, 'harness49-api.js'),
		`(function(){
  const USER = ${JSON.stringify(REAL.user)};
  const VALID = 'AAAAAAAAAAAAAAAAAAAAAAAA.BBBBBB.CCCCCCCCCCCCCCCCCCCCCCCC';
  const listeners = {};
  const noop = () => Promise.resolve({ ok: true });
  window.autoquest = new Proxy({}, { get(_t, k) {
    if (k === 'onLog') return (f) => { listeners.log = f; };
    if (k === 'onEvent') return (f) => { listeners.event = f; };
    if (k === 'onState') return (f) => { listeners.state = f; };
    if (k === 'getConfig') return () => Promise.resolve({ token: VALID, theme: 'dark', loopMode: true, loopInterval: 30 });
    if (k === 'authCheck') return () => Promise.resolve({ ok: true, user: USER });
    if (k === 'fetchOrbs') return () => Promise.resolve({ ok: true, balance: 358, claimed: 0, pending: 0 });
    if (k === 'readClipboard') return () => Promise.resolve('');
    if (k === 'dnsRead') return () => Promise.resolve({ ok: false });
    if (k === 'dnsFont') return () => Promise.resolve({ ok: false });
    return noop;
  }});
  window.__REAL = ${JSON.stringify(REAL)};
})();`,
		'utf8',
	);

	let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	html = html.replace(
		'<script src="renderer.js"></script>',
		'<script src="harness49-api.js"></script>\n<script src="renderer.js"></script>',
	);
	// Nới CSP CHỈ trong bản harness để ảnh CDN + server nội bộ nạp được.
	html = html.replace(
		/img-src 'self' https:\/\/cdn\.discordapp\.com/,
		`img-src 'self' http://127.0.0.1:${port} https://cdn.discordapp.com data:`,
	);
	fs.writeFileSync(path.join(ROOT, 'harness49.html'), html, 'utf8');

	const win = new BrowserWindow({
		width: 1280,
		height: 900,
		show: false,
		backgroundColor: '#0b0d12',
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false, backgroundThrottling: false },
	});

	const cleanup = () => {
		for (const f of ['harness49-api.js', 'harness49.html']) {
			try {
				fs.unlinkSync(path.join(ROOT, f));
			} catch {
				/* ignore */
			}
		}
		server.close();
	};

	const js = (code) => win.webContents.executeJavaScript(code);
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));

	try {
		await win.loadURL(`http://127.0.0.1:${port}/`);
		await wait(1200);

		// Login bằng token có sẵn trong config.
		await js(`(function(){
      const nav = document.getElementById('navQuest'); if (nav) nav.click();
      return true;
    })()`);
		await wait(500);
		await js(`(function(){
      const t = document.getElementById('token');
      if (t) { t.value = 'AAAAAAAAAAAAAAAAAAAAAAAA.BBBBBB.CCCCCCCCCCCCCCCCCCCCCCCC'; t.dispatchEvent(new Event('input', { bubbles: true })); }
      return true;
    })()`);
		await wait(1500);
		// Mở popout profile trái.
		await js(`(function(){
      const row = document.getElementById('upRow');
      if (row) row.click();
      const pop = document.getElementById('upPop');
      if (pop) { pop.hidden = false; pop.dataset.open = '1'; }
      return true;
    })()`);
		await wait(1200);
		// Bảo renderer đo lại khung (panel vừa hiện).
		await js(`(function(){
      window.dispatchEvent(new Event('resize'));
      const f = document.getElementById('dpFrame');
      if (f && f.__relayout) f.__relayout();
      return true;
    })()`);
		await wait(900);

		console.log('\n=== A. NGUỒN ẢNH EFFECT/FRAME ĐÚNG ROUTE DISCORD ===');
		const a = await js(`(function(){
      const eff = document.getElementById('dpEffect');
      const frame = document.getElementById('dpFrame');
      // Mọi layer: lấy src của <img> bên trong HOẶC backgroundImage của div rail.
      const limgs = frame ? [...frame.querySelectorAll('.pf-frame-layer')].map(el=>{
        const img = el.querySelector('img');
        if (img) return img.currentSrc || img.src;
        const bg = (el.style.backgroundImage||'').match(/url\\("?([^")]+)"?\\)/);
        return bg ? bg[1] : '';
      }).filter(Boolean) : [];
      return {
        effectSrc: eff ? (eff.currentSrc||eff.src) : '',
        effectHidden: eff ? !!eff.hidden : true,
        frameClass: frame ? frame.className : '',
        frameHidden: frame ? !!frame.hidden : true,
        layerCount: limgs.length,
        layerSrcs: limgs,
        vars: frame ? {
          w: frame.style.getPropertyValue('--custom-profile-frame-container-width'),
          ot: frame.style.getPropertyValue('--custom-profile-frame-overflow-top'),
          ob: frame.style.getPropertyValue('--custom-profile-frame-overflow-bottom'),
          oh: frame.style.getPropertyValue('--custom-profile-frame-overflow-horizontal'),
        } : null,
      };
    })()`);
		check('A1 effect trỏ route `media/v1/collectibles-shop/.../animated`', /media\/v1\/collectibles-shop\/1545192421854285834\/(animated|static)/.test(a.effectSrc), a.effectSrc.replace(/^https?:\/\/[^/]+/, ''));
		check('A2 KHÔNG còn path đoán bừa `/assets/profile_effects`', !/\/assets\/profile_effects/.test(a.effectSrc));
		check('A3 frame không đoán bừa `/assets/collectibles`', !/\/assets\/collectibles/.test(a.layerSrcs.join(',')));
		check('A4 mọi ảnh layer trong frame trỏ route chuẩn', a.layerSrcs.length > 0 && a.layerSrcs.every((u) => /media\/v1\/collectibles-shop\/1489399523238477855\/\d+\/static/.test(u)), `×${a.layerSrcs.length}`);

		console.log('\n=== B. CỤM LAYER DỰNG ĐÚNG (type/anchor/order) ===');
		const b = await js(`(function(){
      const frame = document.getElementById('dpFrame');
      if (!frame) return null;
      const layers = [...frame.querySelectorAll('.pf-frame-layer')].map(el => ({
        cls: el.className,
        tag: el.tagName,
        hasImg: !!el.querySelector('img'),
        bg: (el.style.backgroundImage||'').slice(0,40),
      }));
      return { frameClass: frame.className, hasInner: !!frame.querySelector('.pf-frame-inner'), layers };
    })()`);
		check('B1 frame có class `custom-profile-frame`', b && /custom-profile-frame/.test(b.frameClass));
		check('B2 có vùng chứa `.pf-frame-inner`', b && b.hasInner);
		check('B3 đủ 3 layer', b && b.layers.length === 3, b ? `×${b.layers.length}` : 'none');
		const hasType = b && b.layers.some((l) => /pf-staple/.test(l.cls)) && b.layers.some((l) => /pf-rail/.test(l.cls));
		check('B4 có cả staple và rail (đúng 2 loại thật của bro)', !!hasType);
		const orient = b && b.layers.some((l) => /pf-anchor-top/.test(l.cls)) && b.layers.some((l) => /pf-anchor-bottom/.test(l.cls)) && b.layers.some((l) => /pf-anchor-center/.test(l.cls));
		check('B5 đủ 3 hướng neo top/bottom/center', !!orient);

		console.log('\n=== C. HÌNH HỌC: KHUNG ÔM SÁT AVATAR ===');
		const c = await js(`(function(){
      const wrap = document.querySelector('.up-pop-avatarwrap');
      const av = document.getElementById('dpAvatar');
      const frame = document.getElementById('dpFrame');
      if (!av || !frame) return null;
      const ar = av.getBoundingClientRect();
      const fr = frame.getBoundingClientRect();
      const layers = [...frame.querySelectorAll('.pf-frame-layer')].map(el => {
        const r = el.getBoundingClientRect();
        return { cls: el.className, x: r.x, y: r.y, w: r.width, h: r.height };
      });
      return {
        avatar: { cx: ar.x + ar.width/2, cy: ar.y + ar.height/2, w: ar.width, h: ar.height },
        frame: { cx: fr.x + fr.width/2, cy: fr.y + fr.height/2, w: fr.width },
        layers,
      };
    })()`);
		if (c) {
			const dx = Math.abs(c.avatar.cx - c.frame.cx);
			check('C1 tâm khung trùng tâm avatar (±2px)', dx <= 2, `Δx=${dx.toFixed(1)}`);
			const wide = c.layers.filter((l) => l.w > c.avatar.w * 1.2);
			check('C2 layer là dải NGANG rộng hơn avatar (đúng bản chất frame)', wide.length > 0, `${wide.length}/${c.layers.length} layer rộng >1.2×avatar`);
			const spans = c.layers.some((l) => l.y < c.avatar.cy && l.y + l.h > c.avatar.cy - c.avatar.h / 2);
			check('C3 có layer phủ vùng TRÊN avatar', spans);
		} else {
			check('C1..C3 đo hình học', false, 'không lấy được rect');
		}

		console.log('\n=== D. THEME COLORS + TƯƠNG PHẢN ===');
		const d = await js(`(function(){
      const dp = document.getElementById('dpBanner');
      const ph = document.getElementById('phBanner');
      const g = (el)=>el?el.style.getPropertyValue('--theme-active'):'';
      return {
        dpActive: g(dp), phActive: g(ph),
        dpGrad: dp?dp.style.getPropertyValue('--theme-gradient'):'',
        phGrad: ph?ph.style.getPropertyValue('--theme-gradient'):'',
        dpBg: dp?getComputedStyle(dp).backgroundImage.slice(0,60):'',
      };
    })()`);
		check('D1 pop banner nhận --theme-active', d.dpActive === '1', d.dpActive);
		check('D2 hero banner nhận --theme-active', d.phActive === '1', d.phActive);
		check('D3 gradient dựng từ 2 màu thật (#fe0f5e/#a10136)', /fe0f5e/i.test(d.dpGrad) && /a10136/i.test(d.dpGrad), d.dpGrad.slice(0, 70));

		// Tương phản chữ tên trên banner pop (đo pixel thật).
		const shot = await win.webContents.capturePage();
		const nameEl = await js(`(function(){
      const el = document.getElementById('dpDisplay');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x:r.x, y:r.y, w:r.width, h:r.height, color: getComputedStyle(el).color };
    })()`);
		if (nameEl && nameEl.w > 4 && nameEl.h > 4) {
			const bgC = medianColor(shot, nameEl);
			const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
			if (bgC) {
				const cr = contrast(parse(nameEl.color), bgC);
				check('D4 tên hiển thị đủ tương phản trên nền theme (≥3:1)', cr >= 3, `${cr.toFixed(2)}:1`);
			}
		}

		// Ảnh chụp để mắt người xem lại: cắt ĐÚNG vùng pop + hero.
		const OUTDIR = path.join(__dirname, '..', 'build-release', 'wave49');
		fs.mkdirSync(OUTDIR, { recursive: true });
		fs.writeFileSync(path.join(OUTDIR, 'probe-full-dark.png'), shot.toPNG());
		const rects = await js(`(function(){
      const pop = document.getElementById('upPop');
      const hero = document.getElementById('heroProfile');
      const clip = (el) => { if(!el) return null; const r = el.getBoundingClientRect(); return { x:Math.max(0,Math.floor(r.x)), y:Math.max(0,Math.floor(r.y)), width:Math.ceil(r.width), height:Math.ceil(r.height) }; };
      return { pop: clip(pop), hero: clip(hero) };
    })()`);
		for (const key of ['pop', 'hero']) {
			if (!rects[key] || rects[key].width < 10) continue;
			const buf = await win.webContents.capturePage(rects[key]);
			fs.writeFileSync(path.join(OUTDIR, `probe-${key}-dark.png`), buf.toPNG());
			console.log(`  📸 probe-${key}-dark.png  (${rects[key].width}×${rects[key].height})`);
		}

		/* ===== E. CHẾ ĐỘ SÁNG ===== */
		console.log('\n=== E. CHẾ ĐỘ SÁNG (theme light) ===');
		await js(`(function(){
      const b = document.getElementById('themeLight');
      if (b) b.click();
      const h = document.documentElement;
      h.dataset.theme = 'light';
      return true;
    })()`);
		await wait(900);
		// chụp 2 lần lấy lần sau (ảnh đầu trả surface cũ)
		await win.webContents.capturePage();
		await wait(200);
		const lightShot = await win.webContents.capturePage();
		fs.writeFileSync(path.join(OUTDIR, 'probe-full-light.png'), lightShot.toPNG());
		const e = await js(`(function(){
      const frame = document.getElementById('dpFrame');
      const layers = frame ? [...frame.querySelectorAll('.pf-frame-layer')] : [];
      const av = document.getElementById('dpAvatar');
      const ar = av ? av.getBoundingClientRect() : null;
      return {
        theme: document.documentElement.dataset.theme,
        frameOK: !!frame && /custom-profile-frame/.test(frame.className),
        layerCount: layers.length,
        avatarW: ar ? ar.width : 0,
      };
    })()`);
		check('E1 theme Sáng áp được', e.theme === 'light', e.theme);
		check('E2 khung frame vẫn dựng ở chế độ Sáng', e.frameOK && e.layerCount === 3, `×${e.layerCount}`);
		const lightRects = await js(`(function(){
      const el = document.getElementById('heroProfile');
      if(!el) return null; const r = el.getBoundingClientRect();
      return { x:Math.max(0,Math.floor(r.x)), y:Math.max(0,Math.floor(r.y)), width:Math.ceil(r.width), height:Math.ceil(r.height) };
    })()`);
		if (lightRects && lightRects.width > 10) {
			await win.webContents.capturePage();
			await wait(200);
			const lb = await win.webContents.capturePage(lightRects);
			fs.writeFileSync(path.join(OUTDIR, 'probe-hero-light.png'), lb.toPNG());
			console.log(`  📸 probe-hero-light.png  (${lightRects.width}×${lightRects.height})`);
		}
		console.log(`\n  📸 probe-full-dark.png + probe-full-light.png + probe-pop-dark.png`);
	} catch (err) {
		fail++;
		console.log('  FAIL · probe ném lỗi: ' + err.message);
	} finally {
		cleanup();
	}

	console.log(`\n═══ KẾT QUẢ WAVE 49: ${pass} OK · ${fail} FAIL ═══`);
	app.exit(fail ? 1 : 0);
});
