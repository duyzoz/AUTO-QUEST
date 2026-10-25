'use strict';

/**
 * Waves 48 — KIỂM CHỨNG "KIỂU TÊN HIỂN THỊ" + LUỒNG ĐĂNG NHẬP BẰNG TOKEN.
 *
 * Bro báo 3 lỗi:
 *   1. "dán token vào nó không nhận account, ấn Lưu cũng đéo hiện account"
 *   2. "chỉ cần dán token hợp lệ là lập tức login; không hợp lệ báo ngay"
 *   3. "phần font style vẫn chưa được"
 *
 * Probe này KHÔNG tin vào lời khai trong code. Nó:
 *   A. Gõ/paste token vào ô thật → đo xem hồ sơ có được vẽ và có báo lỗi đúng.
 *   B. Đăng ký ĐÚNG file font Discord rồi hỏi `document.fonts` xem đã nạp chưa.
 *   C. Áp đủ 8 hiệu ứng × 2 theme, đo TƯƠNG PHẢN THẬT của từng màu đã vẽ với
 *      NỀN THẬT lấy từ pixel của nameplate (ngưỡng 3:1 — chữ lớn đậm).
 *
 * Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-dns-48.js
 */

const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const FONT_FILE = path.join(__dirname, 'fixtures', 'headbang.woff2');

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

/* ---------- 8 hiệu ứng, màu CỐ TÌNH XẤU để thử chống chìm ---------- */
const EFFECTS = [
	{ key: 'solid', id: 1, colors: ['#1b1030'], min: 3 },
	{ key: 'gradient', id: 2, colors: ['#2a0d4a', '#120a20'], min: 2.5 },
	{ key: 'neon', id: 3, colors: ['#3a1b6e'], min: 3 },
	{ key: 'toon', id: 4, colors: ['#241040'], min: 3 },
	{ key: 'pop', id: 5, colors: ['#2b0f4f'], min: 3 },
	{ key: 'prism', id: 7, colors: ['#1a0b2e', '#3d1466', '#120a20'], min: 2.5 },
	{ key: 'gummy', id: 8, colors: ['#301350'], min: 3 },
];

/* Màu sáng (dễ chìm trên nền Sáng) để thử chiều ngược lại */
const BRIGHT = ['#fff3a0', '#ffe066', '#ffd1f0'];

app.whenReady().then(async () => {
	const fontBuf = fs.readFileSync(FONT_FILE);
	const fontDataUrl = 'data:font/woff2;base64,' + fontBuf.toString('base64');

	const server = http.createServer((req, res) => {
		const url = req.url.split('?')[0];
		const file = path.join(ROOT, url === '/' ? 'harness48-dns.html' : decodeURIComponent(url));
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
	await new Promise((r) => server.listen(0, '127.0.0.1', r));
	const port = server.address().port;

	const VALID = 'AAAAAAAAAAAAAAAAAAAAAAAA.BBBBBB.CCCCCCCCCCCCCCCCCCCCCCCC';
	const INVALID = 'ZZZZZZZZZZZZZZZZZZZZZZZZ.ZZZZZZ.ZZZZZZZZZZZZZZZZZZZZZZZZ';

	/* ---- Stub API: mô phỏng main process ---- */
	fs.writeFileSync(
		path.join(ROOT, 'harness48-api.js'),
		`(function(){
  const calls = { authCheck: [], saveConfig: [], dnsRead: [], dnsFont: [] };
  window.__calls = calls;
  const VALID = ${JSON.stringify(VALID)};
  const USER = { id: '1815924981466669116', username: 'duyoz', globalName: 'Hsin', displayName: 'Hsin', avatar: null, premiumType: 2, badges: [] };
  const listeners = {};
  const noop = () => Promise.resolve({ ok: true });
  window.autoquest = new Proxy({}, { get(_t, k) {
    if (k === 'onLog') return (f) => { listeners.log = f; };
    if (k === 'onEvent') return (f) => { listeners.event = f; };
    if (k === 'onState') return (f) => { listeners.state = f; };
    if (k === 'getConfig') return () => Promise.resolve({ token: '', theme: 'dark', loopMode: true, loopInterval: 30 });
    if (k === 'saveConfig') return (c) => { calls.saveConfig.push(c); return Promise.resolve({ ok: true }); };
    if (k === 'authCheck') return (t) => {
      calls.authCheck.push(t);
      if (t === VALID) return Promise.resolve({ ok: true, user: USER });
      return Promise.resolve({ ok: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    };
    if (k === 'fetchOrbs') return () => Promise.resolve({ ok: true, balance: 358, claimed: 0, pending: 0 });
    if (k === 'dnsRead') return (p) => { calls.dnsRead.push(p); return Promise.resolve(window.__dnsReply || { ok: false }); };
    if (k === 'dnsFont') return (f) => { calls.dnsFont.push(f); return Promise.resolve({ ok: true, dataUrl: window.__fontUrl, weight: 400, family: f }); };
    if (k === 'readClipboard') return () => Promise.resolve('');
    return noop;
  }});
  window.__fontUrl = ${JSON.stringify(fontDataUrl)};
})();`,
		'utf8',
	);

	let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
	html = html.replace(
		'<script src="renderer.js"></script>',
		'<script src="harness48-api.js"></script>\n<script src="renderer.js"></script>',
	);
	html = html.replace(/img-src 'self' https:\/\/cdn\.discordapp\.com/, `img-src 'self' http://127.0.0.1:${port} https://cdn.discordapp.com data:`);
	fs.writeFileSync(path.join(ROOT, 'harness48-dns.html'), html, 'utf8');

	const win = new BrowserWindow({
		width: 1600,
		height: 1000,
		show: false,
		backgroundColor: '#0b0d12',
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false, backgroundThrottling: false },
	});

	const cleanup = () => {
		for (const f of ['harness48-api.js', 'harness48-dns.html']) {
			try {
				fs.unlinkSync(path.join(ROOT, f));
			} catch {
				/* ignore */
			}
		}
		server.close();
	};

	const js = (code) => win.webContents.executeJavaScript(code);

	try {
		await win.loadURL(`http://127.0.0.1:${port}/`);
		await new Promise((r) => setTimeout(r, 1500));

		/* Headless báo prefers-reduced-motion: reduce → CSS tắt animation (đúng thiết kế).
		   Ép no-preference để đo nhánh CHUYỂN ĐỘNG. */
		try {
			win.webContents.debugger.attach('1.3');
			await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
				features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
			});
		} catch {
			/* vẫn đo được phần tĩnh */
		}

		/* ═══════════════ A. LUỒNG ĐĂNG NHẬP ═══════════════ */
		console.log('\n=== A. DÁN TOKEN LÀ ĐĂNG NHẬP NGAY ===');

		/* A1: gõ/paste token HỢP LỆ rồi bắn sự kiện `input` (giống Ctrl+V). */
		await js(`(function(){
      const t = document.getElementById('token');
      t.value = ${JSON.stringify(VALID)};
      t.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
		await new Promise((r) => setTimeout(r, 1400));

		const a1 = await js(`(function(){
      const st = document.getElementById('tokenStatus');
      return {
        status: st ? st.textContent : '',
        kind: st ? st.dataset.kind : '',
        state: document.getElementById('dprofile').dataset.state,
        name: document.getElementById('phDisplay').textContent,
        authCalls: window.__calls.authCheck.length,
        saved: window.__calls.saveConfig.length,
        tokenInConfig: (window.__calls.saveConfig.slice(-1)[0] || {}).token || '',
      };
    })()`);
		check('A1 gõ token hợp lệ → tự gọi xác thực (không cần bấm Lưu)', a1.authCalls >= 1, `authCheck×${a1.authCalls}`);
		check('A1 hồ sơ được vẽ ngay', a1.state === 'logged-in' && a1.name === 'Hsin', `${a1.state} / "${a1.name}"`);
		check('A1 dòng trạng thái báo đăng nhập OK', a1.kind === 'ok' && /Đã đăng nhập/.test(a1.status), a1.status);
		check('A1 token được lưu lại', a1.saved >= 1 && a1.tokenInConfig === VALID, `saveConfig×${a1.saved}`);

		/* A2: token KHÔNG hợp lệ → phải báo lỗi rõ ràng, không im lặng. */
		await js(`(function(){
      const t = document.getElementById('token');
      t.value = ${JSON.stringify(INVALID)};
      t.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
		await new Promise((r) => setTimeout(r, 1400));

		const a2 = await js(`(function(){
      const st = document.getElementById('tokenStatus');
      const t = document.getElementById('token');
      return {
        status: st ? st.textContent : '',
        kind: st ? st.dataset.kind : '',
        invalid: t.classList.contains('invalid'),
        state: document.getElementById('dprofile').dataset.state,
      };
    })()`);
		check('A2 token sai → báo lỗi ngay', a2.kind === 'err' && /không hợp lệ/i.test(a2.status), a2.status);
		check('A2 token sai → ô token đánh dấu invalid', a2.invalid === true);
		check('A2 token sai → hồ sơ quay về khách (không hiện acc ma)', a2.state === 'guest', a2.state);

		/* A3: bấm nút LƯU cũng phải đăng nhập. */
		await js(`(function(){
      const t = document.getElementById('token');
      t.value = ${JSON.stringify(VALID)};
      document.getElementById('btnSaveToken').click();
      return true;
    })()`);
		await new Promise((r) => setTimeout(r, 1400));
		const a3 = await js(`(function(){
      return { state: document.getElementById('dprofile').dataset.state, name: document.getElementById('phDisplay').textContent };
    })()`);
		check('A3 bấm Lưu → đăng nhập luôn (lỗi bro báo)', a3.state === 'logged-in', `${a3.state} / "${a3.name}"`);

		/* A4: dnsRead phải nhận đủ displayName + userId + token. */
		const a4 = await js(`window.__calls.dnsRead`);
		const lastRead = Array.isArray(a4) && a4.length ? a4[a4.length - 1] : null;
		check(
			'A4 dnsRead nhận đủ {displayName, userId, token}',
			!!lastRead && lastRead.displayName === 'Hsin' && !!lastRead.userId && !!lastRead.token,
			lastRead ? JSON.stringify({ d: lastRead.displayName, u: lastRead.userId, t: lastRead.token ? 'có' : 'không' }) : 'không gọi',
		);

		/* ═══════════════ B. FONT THẬT CỦA DISCORD ═══════════════ */
		console.log('\n=== B. FONT LẤY TỪ SERVER DISCORD ===');
		const b1 = await js(`(async function(){
      if (typeof dnsRegisterFont !== 'function') return { err: 'không có dnsRegisterFont' };
      dnsRegisterFont('Headbang', window.__fontUrl, 400);
      try { await document.fonts.load('40px "Headbang"'); } catch(e) {}
      const ok = document.fonts.check('40px "Headbang"');
      const el = document.getElementById('phDisplay');
      el.style.fontFamily = '"Headbang", sans-serif';
      await new Promise(r => setTimeout(r, 300));
      const cs = getComputedStyle(el);
      return { ok, family: cs.fontFamily, faces: document.fonts.size };
    })()`);
		check('B1 file font Discord nạp được vào app', b1.ok === true, JSON.stringify(b1));

		/* ═══════════════ C. 8 HIỆU ỨNG × 2 THEME ═══════════════ */
		console.log('\n=== C. CHỐNG CHÌM MÀU (8 hiệu ứng × 2 theme) ===');

		for (const theme of ['dark', 'light']) {
			await js(`(function(){
        document.getElementById('${theme === 'light' ? 'themeLight' : 'themeDark'}').click();
        return true;
      })()`);
			await new Promise((r) => setTimeout(r, 500));
			/* Chụp 2 lần: lần đầu sau khi đổi theme trả SURFACE CŨ (bẫy đã biết). */
			await win.webContents.capturePage();
			await new Promise((r) => setTimeout(r, 260));

			for (const eff of EFFECTS) {
				const colors = theme === 'light' ? BRIGHT : eff.colors;
				const set = await js(`(function(){
          const el = document.getElementById('phDisplay');
          if (!el) return { err: 'không có phDisplay' };
          window.applyDisplayNameStyle({
            ok: true,
            text: 'Hsin',
            effect: ${JSON.stringify(eff.key)},
            effectId: ${eff.id},
            minRatio: ${eff.min},
            colors: ${JSON.stringify(colors)},
            font: { id: 15, family: 'Headbang', weight: 400, letterSpacing: '', hasFile: true },
          });
          const r = el.getBoundingClientRect();
          const plate = el.closest('.ph-nameplate') || el.parentElement;
          const pr = plate ? plate.getBoundingClientRect() : r;
          return {
            attr: el.getAttribute('data-dns-effect'),
            worst: el.getAttribute('data-dns-worst'),
            anim: getComputedStyle(el).animationName,
            main: el.style.getPropertyValue('--custom-display-name-styles-main-color'),
            grad: el.style.getPropertyValue('--custom-display-name-styles-gradient-stops'),
            prism: el.style.getPropertyValue('--custom-display-name-styles-prism-stops'),
            light1: el.style.getPropertyValue('--custom-display-name-styles-light-1-color'),
            neon: el.style.getPropertyValue('--custom-display-name-styles-neon-stroke-color'),
            toon: el.style.getPropertyValue('--custom-display-name-styles-toon-stroke-color'),
            dark2: el.style.getPropertyValue('--custom-display-name-styles-dark-2-color'),
            plate: { x: pr.x, y: pr.y, w: pr.width, h: pr.height },
            rect: { x: r.x, y: r.y, w: r.width, h: r.height },
          };
        })()`);

				if (!set || set.err) {
					check(`C ${theme}/${eff.key}`, false, set && set.err);
					continue;
				}

				const shot = await win.webContents.capturePage();
				/* Nền thật: dải bên TRÁI nameplate, cao bằng tên (vùng đệm, không có chữ). */
				const padX = Math.max(0, set.rect.x - set.plate.x - 26);
				const bg =
					padX > 6
						? medianColor(shot, { x: set.plate.x + 6, y: set.rect.y + 2, w: padX, h: Math.max(4, set.rect.h - 4) })
						: null;
				const bgc = bg || (theme === 'dark' ? [24, 27, 34] : [246, 247, 250]);

				/* Gom ĐÚNG những màu tạo nên NÉT CHỮ (không phải màu trang trí).
				   • solid/gummy/gradient/prism: các màu này ĐƯỢC VẼ ĐỒNG THỜI → TẤT CẢ phải đạt.
				   • neon/toon/pop: Discord luôn cho chữ MỘT MÀU TÔ và MỘT MÀU VIỀN tương
				     phản nhau (ví dụ Pop: tô trắng + viền tím đậm). Nét chữ đọc được nhờ
				     CẶP đó, nên chỉ cần MỘT trong hai đạt — bắt cả hai là bắt sai thiết kế. */
				const hexes = (raw) =>
					[...String(raw || '').matchAll(/#([0-9a-f]{6})/gi)].map((m) => [
						parseInt(m[1].slice(0, 2), 16),
						parseInt(m[1].slice(2, 4), 16),
						parseInt(m[1].slice(4, 6), 16),
					]);
				const WHITE = [255, 255, 255];
				let painted = [];
				let anyMode = false; // true = chỉ cần MỘT màu đạt
				if (eff.key === 'solid' || eff.key === 'gummy') painted = hexes(set.main);
				else if (eff.key === 'gradient') painted = hexes(set.grad);
				else if (eff.key === 'prism') painted = hexes(set.prism);
				else if (eff.key === 'neon') {
					painted = [WHITE].concat(hexes(set.neon)).concat(hexes(set.main));
					anyMode = true;
				} else if (eff.key === 'toon') {
					painted = hexes(set.toon).concat([WHITE]).concat(hexes(set.main));
					anyMode = true;
				} else if (eff.key === 'pop') {
					painted = hexes(set.dark2).concat([WHITE]);
					anyMode = true;
				}

				const ratios = painted.map((c) => contrast(c, bgc));
				const worst = ratios.length ? Math.min(...ratios) : 0;
				const best = ratios.length ? Math.max(...ratios) : 0;
				const got = anyMode ? best : worst;
				const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
				check(
					`C ${theme}/${eff.key}: tương phản ≥ 3.0${anyMode ? ' (cặp tô/viền)' : ''}`,
					got >= 3 && set.attr === eff.key,
					`${got.toFixed(2)}:1 trên nền ${rgb(bgc)} · ${painted.length} màu`,
				);
			}
		}

		/* ═══════════════ D. ANIMATION ═══════════════ */
		console.log('\n=== D. HIỆU ỨNG CHUYỂN ĐỘNG ===');
		await js(`(function(){
      window.applyDisplayNameStyle({
        ok: true, text: 'Hsin', effect: 'prism', effectId: 7, minRatio: 2.5,
        colors: ['#ff2d95', '#7a5cff', '#22d3ee'],
        font: { id: 15, family: 'Headbang', weight: 400, letterSpacing: '', hasFile: true },
      });
      return true;
    })()`);
		await new Promise((r) => setTimeout(r, 300));
		const d1 = await js(`(function(){
      const el = document.getElementById('phDisplay');
      const cs = getComputedStyle(el);
      return { anim: cs.animationName, dur: cs.animationDuration, iter: cs.animationIterationCount };
    })()`);
		check('D1 prism chạy animation như Discord', d1.anim === 'dns-prism-scroll' && d1.iter === 'infinite', JSON.stringify(d1));

		/* Gỡ style → phải sạch */
		const d2 = await js(`(function(){
      window.clearDisplayNameStyle();
      const el = document.getElementById('phDisplay');
      return { attr: el.getAttribute('data-dns'), effect: el.getAttribute('data-dns-effect'), text: el.textContent };
    })()`);
		check('D2 gỡ style → sạch thuộc tính, giữ nguyên chữ', d2.attr === null && d2.effect === null && d2.text === 'Hsin', JSON.stringify(d2));
	} catch (e) {
		console.log('\nLỖI PROBE:', e && e.message);
		fail++;
	} finally {
		cleanup();
		console.log(`\n=== WAVES 48: ${fail === 0 ? 'PASS ✅' : 'FAIL ❌'} (${pass} pass / ${fail} fail) ===`);
		app.exit(fail === 0 ? 0 : 1);
	}
});
