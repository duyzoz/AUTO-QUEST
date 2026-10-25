/**
 * Waves 46 — ĐO THẺ "CHƯA LÀM" để tìm lỗi XẾP CHỒNG.
 * Bro báo: các thẻ nhiệm vụ trong tab "Chưa làm" xếp chồng lên nhau.
 *
 * Probe dựng harness giống contrast-audit.js (bơm quest qua event
 * 'quest:inventory'), rồi đo chiều cao THẬT của từng khối trong thẻ
 * và kiểm tra các con có tràn ra ngoài / 2 thẻ có chồng nhau không.
 *
 * Chạy: env -u ELECTRON_RUN_AS_NODE npx electron tools/probe-quest-stack.js
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const RENDERER = path.join(__dirname, '..', 'electron', 'renderer');

const QUESTS = [
	{ id: '1', name: 'Play a game on your PC', description: 'Choi game 15 phut', status: 'todo', progress: 0, orbs: 100, kind: 'game', publisher: 'Riot Games', expiresAt: null },
	{ id: '2', name: 'Watch a stream for 10 minutes', description: 'Xem 10 phut stream', status: 'todo', progress: 0, orbs: 250, kind: 'stream', publisher: 'Twitch', expiresAt: null },
	{ id: '3', name: 'Join a voice channel', description: 'Vao voice 5 phut', status: 'todo', progress: 0, orbs: 400, kind: 'voice', publisher: 'Discord', expiresAt: null },
	{ id: '4', name: 'Play 3 matches', description: 'Dau 3 tran', status: 'todo', progress: 0, orbs: 700, kind: 'game', publisher: 'Steam', expiresAt: null },
	{ id: '5', name: 'Complete the tutorial', description: 'Hoan thanh huong dan', status: 'todo', progress: 0, orbs: 50, kind: 'game', publisher: 'Epic', expiresAt: null },
	{ id: '6', name: 'Daily check-in reward', description: 'Diem danh hang ngay', status: 'todo', progress: 0, orbs: 30, kind: 'game', publisher: 'Genshin Impact', expiresAt: null },
	// Waves 46 — dữ liệu THẬT khó: tên dài, publisher dài, có asset hero + icon.
	{
		id: '7',
		name: 'Play Ragnarok Online 2 for 30 minutes on your PC to earn a reward',
		description: 'Choi game 30 phut de nhan thuong',
		status: 'todo',
		progress: 0,
		orbs: 1200,
		kind: 'game',
		publisher: 'Ragnarok Online 2 Hallowed Concepts',
		expiresAt: null,
		assets: { hero: 'https://cdn.discordapp.com/x/hero.png', icon: 'https://cdn.discordapp.com/x/icon.png' },
	},
	{
		id: '8',
		name: 'Very long quest title that will definitely wrap onto multiple lines and push things around',
		description: 'Another long description here',
		status: 'todo',
		progress: 0,
		orbs: 999999,
		kind: 'game',
		publisher: 'Some Extremely Long Publisher Name That Overflows',
		expiresAt: null,
		assets: { icon: 'https://cdn.discordapp.com/x/icon2.png' },
	},
	{
		id: '9',
		name: 'Short',
		description: '',
		status: 'todo',
		progress: 0,
		orbs: 1,
		kind: 'game',
		publisher: '',
		expiresAt: null,
	},
];

function buildHtml() {
	const html = fs.readFileSync(path.join(RENDERER, 'index.html'), 'utf8');
	fs.writeFileSync(path.join(RENDERER, 'harness-data.js'), 'window.__LIST = ' + JSON.stringify(QUESTS) + ';\n', 'utf8');
	fs.writeFileSync(
		path.join(RENDERER, 'harness-api.js'),
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

app.whenReady().then(async () => {
	const win = new BrowserWindow({
		width: 1500,
		height: 950,
		show: false,
		webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false },
	});
	const errs = [];
	win.webContents.on('console-message', (_e, lvl, msg) => {
		if (lvl >= 2) errs.push(msg);
	});

	const tmp = path.join(RENDERER, '__stack.html');
	fs.writeFileSync(tmp, buildHtml(), 'utf8');
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1400));

	const built = await win.webContents.executeJavaScript(`(() => {
		const ev = window.__h && window.__h.event;
		if (!ev) return { err: 'khong co handler event' };
		ev({ type: 'quest:inventory', data: { quests: window.__LIST } });
		const ids = ['questListActive','questListNew','questListDone'];
		const counts = {};
		ids.forEach(i => { const el = document.getElementById(i); counts[i] = el ? el.querySelectorAll('.qcard,.qdone').length : -1; });
		return { counts };
	})()`);
	console.log('\n[setup] so the moi danh sach:', JSON.stringify(built.counts));

	const m = await win.webContents.executeJavaScript(`(() => {
		const all = ['questListActive','questListNew','questListDone']
			.map(i => document.getElementById(i)).filter(Boolean);
		const list = all.find(el => el.querySelector('.qcard')) || document.getElementById('questListActive');
		const cs = getComputedStyle(list);
		const cards = [...list.querySelectorAll('.qcard')];
		const out = {
			listId: list.id,
			gridCols: cs.gridTemplateColumns.split(' ').length,
			gridGap: cs.gap,
			listH: Math.round(list.getBoundingClientRect().height),
			listScrollH: list.scrollHeight,
			overflowY: cs.overflowY,
			display: cs.display,
			cards: [],
		};
		for (const c of cards) {
			const cr = c.getBoundingClientRect();
			const parts = ['.qcard-banner', '.qcard-body', '.qcard-foot']
				.map(s => c.querySelector(s)).filter(Boolean);
			const sumParts = parts.reduce((s, p) => s + p.getBoundingClientRect().height, 0);
			let overflow = 0;
			for (const p of parts) {
				const pr = p.getBoundingClientRect();
				overflow = Math.max(overflow, pr.bottom - cr.bottom, cr.top - pr.top);
			}
			const get = (s) => { const e = c.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : 0; };
			out.cards.push({
				id: c.dataset.questId,
				cardH: Math.round(cr.height),
				top: Math.round(cr.top),
				bottom: Math.round(cr.bottom),
				left: Math.round(cr.left),
				cssH: getComputedStyle(c).height,
				banner: get('.qcard-banner'),
				body: get('.qcard-body'),
				foot: get('.qcard-foot'),
				act: get('.qcard-act'),
				title: get('.qcard-title'),
				sumParts: Math.round(sumParts),
				overflow: Math.round(overflow),
				scrollH: c.scrollHeight,
			});
		}
		return out;
	})()`);

	console.log('\n=== LUOI ===');
	console.log(`  list=${m.listId} display=${m.display} cot=${m.gridCols} gap=${m.gridGap} overflowY=${m.overflowY}`);
	console.log(`  list height=${m.listH}  scrollHeight=${m.listScrollH}`);
	console.log('\n=== TUNG THE ===');
	for (const c of m.cards) {
		console.log(
			`  card#${c.id}: cao=${c.cardH} (css=${c.cssH}) | banner=${c.banner} body=${c.body} foot=${c.foot} | ` +
				`tong=${c.sumParts} | tran=${c.overflow} | scrollH=${c.scrollH} | nut=${c.act} title=${c.title}`,
		);
	}

	let pass = 0;
	let fail = 0;
	const ok = (n, c, x) => {
		if (c) {
			pass++;
			console.log(`  OK   ${n}${x ? ' — ' + x : ''}`);
		} else {
			fail++;
			console.log(`  FAIL ${n}${x ? ' — ' + x : ''}`);
		}
	};

	console.log('\n=== KET LUAN ===');
	const cards = m.cards;
	ok('Co the de do', cards.length > 0, `${cards.length} the`);

	const overflows = cards.filter((c) => c.overflow > 1);
	ok(
		'Khong con nao tran ra ngoai the',
		overflows.length === 0,
		overflows.length ? `tran toi da ${Math.max(...overflows.map((c) => c.overflow))}px` : 'overflow=0',
	);

	const squeezed = cards.filter((c) => c.sumParts > c.cardH + 2);
	ok(
		'banner+body+foot <= chieu cao the',
		squeezed.length === 0,
		squeezed.length ? `vuot ${Math.max(...squeezed.map((c) => c.sumParts - c.cardH))}px` : 'vua khit',
	);

	const sorted = [...cards].sort((a, b) => a.top - b.top);
	// Chỉ so 2 thẻ CÙNG CỘT (left trùng) — thẻ cùng hàng có top bằng nhau nên
	// so thô sẽ báo chồng giả. Lấy cột từ vị trí trái.
	let overlaps = 0;
	const cols = [];
	for (const c of sorted) {
		const col = cols.find((x) => Math.abs(x.left - c.left) < 4);
		if (col) {
			for (const prev of col.items) {
				if (c.top < prev.bottom - 1) overlaps++;
			}
			col.items.push(c);
		} else {
			cols.push({ left: c.left, items: [c] });
		}
	}
	ok('Khong co 2 the chong nhau doc (cung cot)', overlaps === 0, overlaps ? `${overlaps} cap chong` : 'khong cap nao');

	// Kiểm tra hình học: các thẻ cùng hàng phải top bằng nhau, khác hàng phải
	// cách nhau ít nhất bằng cardH.
	const rows = [...new Set(sorted.map((c) => c.top))].sort((a, b) => a - b);
	const rowGaps = rows.slice(1).map((t, i) => t - rows[i]);
	ok('Khoang cach giua cac hang >= chieu cao the', rowGaps.every((g) => g >= (cards[0].cardH - 1)), `gap=${JSON.stringify(rowGaps)} cardH=${cards[0].cardH}`);

	const cutAct = cards.filter((c) => c.act < 20);
	ok(
		'Nut hanh dong hien du (>=20px)',
		cutAct.length === 0,
		cutAct.length ? `co the chi ${Math.min(...cutAct.map((c) => c.act))}px` : `cao ${cards[0] && cards[0].act}px`,
	);

	const scrolled = cards.filter((c) => c.scrollH > c.cardH + 2);
	ok(
		'The khong bi nen (scrollHeight <= cardH)',
		scrolled.length === 0,
		scrolled.length ? `can ${Math.max(...scrolled.map((c) => c.scrollH))}px nhung chi co ${cards[0] && cards[0].cardH}px` : 'khong bi nen',
	);

	const withTitle = cards.filter((c) => c.title > 0);
	ok('Tieu de nhien vu hien ra', withTitle.length === cards.length, `${withTitle.length}/${cards.length} the co tieu de`);

	// Waves 46 — TRẠNG THÁI ĐANG QUÉT: đây là lúc bro thấy "xếp chồng".
	// setScanning(true) giữ ô rỗng HIỆN trong khi thẻ đã vào lưới.
	const scanChk = await win.webContents.executeJavaScript(`(() => {
		const list = document.getElementById('questListActive');
		const st = document.getElementById('stateActive');
		const cards = [...list.querySelectorAll('.qcard')];
		const before = {
			cards: cards.length,
			firstTop: cards[0] ? Math.round(cards[0].getBoundingClientRect().top) : null,
		};
		// Bật đúng trạng thái quét của app.
		if (typeof setScanning === 'function') setScanning(true, 9);
		const sr = st.getBoundingClientRect();
		const cs = getComputedStyle(st);
		const first = cards[0] ? cards[0].getBoundingClientRect() : null;
		const last = cards[cards.length - 1] ? cards[cards.length - 1].getBoundingClientRect() : null;
		const out = {
			before,
			scanning: typeof scanning !== 'undefined' ? scanning : 'n/a',
			stateHidden: st.hidden,
			stateDisplay: cs.display,
			stateH: Math.round(sr.height),
			stateTop: Math.round(sr.top),
			stateBottom: Math.round(sr.bottom),
			firstTop: first ? Math.round(first.top) : null,
			lastBottom: last ? Math.round(last.bottom) : null,
			// ô rỗng có ĐÈ lên bất kỳ thẻ nào không
			overlapsAnyCard: cards.some((c) => {
				const r = c.getBoundingClientRect();
				return sr.top < r.bottom - 1 && sr.bottom > r.top + 1;
			}),
			// ô rỗng có đẩy thẻ xuống không — đo LỆCH TƯƠNG ĐỐI trong lưới
			// (không dùng top tuyệt đối, vì setScanning đổi chiều cao panel log
			// ở trên làm cả trang dịch chuyển, gây sai số giả).
			cardOffsetInList: cards[0]
				? Math.round(cards[0].getBoundingClientRect().top - list.getBoundingClientRect().top)
				: null,
		};
		if (typeof setScanning === 'function') setScanning(false, 9);
		return out;
	})()`);
	console.log('\n=== DANG QUET (luc hay bi xep chong) ===');
	console.log('  ' + JSON.stringify(scanChk));
	ok(
		'Dang quet: o rong KHONG de len the',
		scanChk.overlapsAnyCard === false,
		scanChk.overlapsAnyCard ? `o rong top=${scanChk.stateTop} bottom=${scanChk.stateBottom} nam trong khoang the` : 'khong de',
	);
	ok(
		'Dang quet: o rong cao 0px (khong chiem cho luoi)',
		scanChk.stateH === 0,
		`o rong cao ${scanChk.stateH}px, the dau cach dinh luoi ${scanChk.cardOffsetInList}px (= padding luoi, khong phai o rong)`,
	);
	const emptyChk = await win.webContents.executeJavaScript(`(() => {
		const list = document.getElementById('questListActive');
		const st = document.getElementById('stateActive');
		const cards = [...list.querySelectorAll('.qcard')];
		const sr = st.getBoundingClientRect();
		const cs = getComputedStyle(st);
		// thẻ đầu tiên
		const first = cards[0] ? cards[0].getBoundingClientRect() : null;
		return {
			stateHidden: st.hidden,
			stateDisplay: cs.display,
			stateH: Math.round(sr.height),
			stateTop: Math.round(sr.top),
			stateBottom: Math.round(sr.bottom),
			gridColumn: cs.gridColumnStart + ' / ' + cs.gridColumnEnd,
			firstCardTop: first ? Math.round(first.top) : null,
			// ô rỗng có nằm ĐÈ lên thẻ không
			overlapsCards: first ? (sr.top < first.bottom && sr.bottom > first.top) : false,
			// vị trí trong DOM
			domIndex: [...list.children].indexOf(st),
			totalChildren: list.children.length,
		};
	})()`);
	console.log('\n=== O RONG (.qstate) ===');
	console.log('  ' + JSON.stringify(emptyChk));
	ok(
		'O rong KHONG de len the nao',
		emptyChk.overlapsCards === false,
		emptyChk.overlapsCards ? `o rong top=${emptyChk.stateTop} bottom=${emptyChk.stateBottom} de len the top=${emptyChk.firstCardTop}` : 'khong de',
	);
	ok(
		'Khi co the thi o rong KHONG chiem cho (display:none hoac hidden)',
		cards.length === 0 || emptyChk.stateH === 0,
		`co ${cards.length} the, o rong hidden=${emptyChk.stateHidden} display=${emptyChk.stateDisplay} cao=${emptyChk.stateH}px`,
	);

	console.log(`\n=== KET QUA: ${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} pass / ${fail} fail ===\n`);
	for (const f of [tmp, path.join(RENDERER, 'harness-api.js'), path.join(RENDERER, 'harness-data.js')]) {
		try {
			fs.unlinkSync(f);
		} catch (e) {}
	}
	setTimeout(() => app.exit(fail === 0 ? 0 : 1), 300);
});
