'use strict';

const api = window.autoquest;

const el = (id) => document.getElementById(id);

const ui = {
	token: el('token'),
	remember: el('remember'),
	loopMode: el('loopMode'),
	loopInterval: el('loopInterval'),
	loopIntervalRow: el('loopIntervalRow'),
	autoScroll: el('autoScroll'),
	btnStop: el('btnStop'),
	btnScan: el('btnScan'),
	btnPaste: el('btnPaste'),
	btnToggleToken: el('btnToggleToken'),
	btnSaveToken: el('btnSaveToken'),
	btnCopyScript: el('btnCopyScript'),
	btnClearLog: el('btnClearLog'),
	btnSaveLog: el('btnSaveLog'),
	btnOpenFolder: el('btnOpenFolder'),
	btnScrollBottom: el('btnScrollBottom'),
	btnRunSelected: el('btnRunSelected'),
	selectAll: el('selectAll'),
	selectTools: el('selectTools'),
	selectedCount: el('selectedCount'),
	accountChip: el('accountChip'),
	chipName: el('chipName'),
	chipBadge: el('chipBadge'),
	chipAvatar: el('chipAvatar'),
	status: el('status'),
	statusText: el('statusText'),
	statOrbs: el('statOrbs'),
	statOrbsBonus: el('statOrbsBonus'),
	statQuests: el('statQuests'),
	statMode: el('statMode'),
	console: el('console'),
	tabActive: el('tabActive'),
	tabDone: el('tabDone'),
	countActive: el('countActive'),
	countDone: el('countDone'),
	questListActive: el('questListActive'),
	questListDone: el('questListDone'),
	emptyActive: el('emptyActive'),
	emptyDone: el('emptyDone'),
	questCounter: el('questCounter'),
	toast: el('toast'),
};

const STATE_TEXT = {
	idle: 'Sẵn sàng',
	starting: 'Đang kết nối…',
	running: 'Đang cày nhiệm vụ',
	scanning: 'Đang quét nhiệm vụ…',
	stopping: 'Đang dừng…',
	error: 'Gặp sự cố',
};

let state = 'idle';
let currentTab = 'active';
let logText = '';
let sessionOrbsBonus = 0;
let accountUserId = null;

/* Quest store: khóa theo quest id ổn định (từ Discord API). */
const quests = new Map(); // id -> quest object
const questOrder = []; // id theo thứ tự quét
const selected = new Set(); // id người dùng tích chọn
const doneSeen = new Set(); // id đã phát thưởng (dedupe chống cộng orbs ảo)

/* ---------------- Toast Notification ---------------- */

let toastTimer = null;
function toast(message, isError = false) {
	ui.toast.textContent = message;
	ui.toast.classList.toggle('error', isError);
	ui.toast.classList.add('show');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2800);
}

/* ---------------- State Management ---------------- */

function setBusyFlags() {
	const busy = state === 'starting' || state === 'running' || state === 'stopping' || state === 'scanning';
	ui.btnStop.disabled = !busy;
	ui.btnScan.disabled = busy || !ui.token.value.trim();
	ui.token.disabled = busy;
	ui.loopMode.disabled = busy;
	ui.loopInterval.disabled = busy;
	ui.btnRunSelected.disabled = busy || selected.size === 0;
}

function setState(next, extra = {}) {
	state = next;
	ui.status.dataset.state = next;

	if (next === 'running' && extra.username) {
		ui.statusText.textContent = `Đang chạy · @${extra.username}`;
	} else {
		ui.statusText.textContent = STATE_TEXT[next] || next;
	}

	setBusyFlags();

	if (next === 'idle') {
		ui.statusText.textContent = STATE_TEXT.idle;
		updateModeDisplay();
	}
}

function updateModeDisplay() {
	if (ui.loopMode.checked) {
		ui.statMode.textContent = `Treo tự động (${ui.loopInterval.value}m)`;
	} else {
		ui.statMode.textContent = 'Chạy 1 lần';
	}
}

ui.loopMode.addEventListener('change', () => {
	ui.loopIntervalRow.style.display = ui.loopMode.checked ? 'flex' : 'none';
	updateModeDisplay();
});

ui.loopInterval.addEventListener('change', updateModeDisplay);

/* ---------------- Tab Switching ---------------- */

function switchTab(tab) {
	currentTab = tab;
	ui.tabActive.classList.toggle('active', tab === 'active');
	ui.tabDone.classList.toggle('active', tab === 'done');
	ui.questListActive.style.display = tab === 'active' ? 'flex' : 'none';
	ui.questListDone.style.display = tab === 'done' ? 'flex' : 'none';
	ui.selectTools.style.display = tab === 'active' && ui.questListActive.querySelector('.quest') ? 'flex' : 'none';
}

ui.tabActive.addEventListener('click', () => switchTab('active'));
ui.tabDone.addEventListener('click', () => switchTab('done'));

/* ---------------- Log Formatter ---------------- */

function appendLog(line, stream) {
	logText += `${line}\n`;
	if (logText.length > 2 * 1024 * 1024) logText = logText.slice(-1024 * 1024);

	const div = document.createElement('div');
	div.className = 'log-line';

	if (stream === 'stderr') {
		div.classList.add('stderr');
	} else if (stream === 'system') {
		div.classList.add('system');
	} else if (/orb|orbs/i.test(line)) {
		div.classList.add('orb');
	} else if (/hoàn thành|thành công|đã nhận thưởng|đăng nhập thành công/i.test(line)) {
		div.classList.add('ok');
	} else if (/cảnh báo|bỏ qua|ratelimit|giới hạn/i.test(line)) {
		div.classList.add('warn');
	}

	div.textContent = line;
	ui.console.appendChild(div);

	while (ui.console.childElementCount > 1500) {
		ui.console.removeChild(ui.console.firstChild);
	}

	if (ui.autoScroll.checked) {
		ui.console.scrollTop = ui.console.scrollHeight;
	}
}

// Tự tắt "Tự cuộn" khi người dùng cuộn lên đọc log.
ui.console.addEventListener('scroll', () => {
	const atBottom = ui.console.scrollHeight - ui.console.scrollTop - ui.console.clientHeight < 40;
	if (!atBottom && ui.autoScroll.checked) {
		ui.autoScroll.checked = false;
	}
});

ui.btnScrollBottom.addEventListener('click', () => {
	ui.console.scrollTop = ui.console.scrollHeight;
	ui.autoScroll.checked = true;
});

/* ---------------- Quest Rendering (node-level update) ---------------- */

const TASK_LABEL = {
	WATCH_VIDEO: 'Xem video',
	WATCH_VIDEO_ON_MOBILE: 'Xem video (Mobile)',
	PLAY_ON_DESKTOP: 'Chơi trên PC',
	PLAY_ON_XBOX: 'Chơi trên Xbox',
	PLAY_ON_PLAYSTATION: 'Chơi trên PS',
	PLAY_ACTIVITY: 'Hoạt động Voice',
	STREAM_ON_DESKTOP: 'Stream voice',
	ACHIEVEMENT_IN_ACTIVITY: 'Thành tựu Discord',
};

function escapeHtml(text) {
	return String(text ?? '')
		.replace(/&/g, '&')
		.replace(/</g, '<')
		.replace(/>/g, '>')
		.replace(/"/g, '"')
		.replace(/'/g, '&#39;');
}

function canSelectQuest(q) {
	// Chỉ chọn được nhiệm vụ ĐÃ NHẬN trong Discord và app hỗ trợ tự động.
	// Nhiệm vụ "chưa nhận" phải mở app Discord bấm Nhận trước (app KHÔNG tự nhận).
	return q.status !== 'done' && q.status !== 'new' && q.automatable !== false;
}

function buildQuestNode(q) {
	const node = document.createElement('div');
	node.className = 'quest';
	node.dataset.questId = q.id;

	const isDone = q.status === 'done';

	// Checkbox chọn — khoá nếu quest chưa nhận hoặc không hỗ trợ tự động
	let checkboxHtml = '';
	if (!isDone) {
		const disabled = canSelectQuest(q) ? '' : ' disabled';
		const hint = q.status === 'new'
			? 'Mở app Discord bấm "Nhận nhiệm vụ" trước'
			: q.automatable === false
				? 'Nhiệm vụ này phải làm thủ công'
				: 'Chọn nhiệm vụ này';
		checkboxHtml = `<label class="quest-check" title="${hint}"><input type="checkbox" data-quest-check="${escapeHtml(q.id)}" aria-label="Chọn ${escapeHtml(q.name)}"${disabled}/></label>`;
	}

	node.innerHTML = `
		<div class="quest-top">
			${checkboxHtml}
			<span class="quest-name" title=""></span>
			<div class="quest-badges"></div>
		</div>
		<div class="bar"><i style="width:0%"></i></div>
		<div class="quest-meta">
			<span class="q-task"></span>
			<span class="q-pct"></span>
		</div>
	`;

	updateQuestNode(node, q);
	return node;
}

/** Cập nhật nội dung node hiện có thay vì re-render toàn bộ danh sách. */
function updateQuestNode(node, q) {
	node.dataset.status = q.status;

	const need = q.secondsNeeded || 0;
	const done = q.secondsDone || 0;
	const pct = need
		? Math.min(100, Math.round((done / need) * 100))
		: q.status === 'done'
			? 100
			: 0;

	// Tên quest: textContent an toàn (chống HTML injection)
	const nameEl = node.querySelector('.quest-name');
	if (nameEl.textContent !== q.name) {
		nameEl.textContent = q.name;
		nameEl.title = q.name;
	}

	// Badges
	const badges = node.querySelector('.quest-badges');
	const orbBadge = q.orbs > 0 ? `<span class="orb-pill">+${q.orbs} Orbs</span>` : '';
	let statusBadge;
	if (q.automatable === false && q.status !== 'done') {
		statusBadge = '<span class="quest-badge">Làm thủ công</span>';
	} else {
		switch (q.status) {
			case 'running': statusBadge = '<span class="quest-badge">Đang chạy</span>'; break;
			case 'done': statusBadge = '<span class="quest-badge">Hoàn thành ✓</span>'; break;
			case 'skip': statusBadge = '<span class="quest-badge">Bỏ qua</span>'; break;
			case 'error': statusBadge = '<span class="quest-badge">Lỗi</span>'; break;
			case 'enrolled': statusBadge = '<span class="quest-badge">Sẵn sàng</span>'; break;
			case 'new': statusBadge = '<span class="quest-badge">Chưa nhận</span>'; break;
			default: statusBadge = '<span class="quest-badge">Chưa làm</span>';
		}
	}
	const badgesHtml = `${orbBadge}${statusBadge}`;
	if (badges.innerHTML !== badgesHtml) badges.innerHTML = badgesHtml;

	// Progress bar
	const barFill = node.querySelector('.bar i');
	if (barFill.style.width !== `${pct}%`) barFill.style.width = `${pct}%`;

	// Meta
	const taskLabel = TASK_LABEL[q.task] || q.task || 'Nhiệm vụ Discord';
	const taskText = `${taskLabel}${q.application ? ` · ${q.application}` : ''}`;
	const pctText = need
		? `${Math.floor(done / 60)}/${Math.ceil(need / 60)} phút (${pct}%)`
		: `${pct}%`;
	const taskEl = node.querySelector('.q-task');
	const pctEl = node.querySelector('.q-pct');
	if (taskEl.textContent !== taskText) taskEl.textContent = taskText;
	if (pctEl.textContent !== pctText) pctEl.textContent = pctText;

	// Checkbox state: đồng bộ theo trạng thái thật
	const check = node.querySelector('input[data-quest-check]');
	if (check) {
		if (q.status === 'done') {
			check.closest('.quest-check')?.remove();
			if (selected.has(q.id)) {
				selected.delete(q.id);
			}
		} else {
			check.checked = selected.has(q.id);
			check.disabled = !canSelectQuest(q);
		}
	}
}

function renderQuests() {
	// Đảm bảo mọi quest có node, gắn vào đúng tab
	for (const id of questOrder) {
		const q = quests.get(id);
		let node = ui.questListActive.querySelector(`[data-quest-id="${CSS.escape(id)}"]`)
			|| ui.questListDone.querySelector(`[data-quest-id="${CSS.escape(id)}"]`);
		if (!node) {
			node = buildQuestNode(q);
		}
		const targetList = q.status === 'done' ? ui.questListDone : ui.questListActive;
		if (node.parentElement !== targetList) {
			targetList.appendChild(node); // di chuyển, giữ nguyên node
		}
		updateQuestNode(node, q);
	}

	// Sắp xếp lại thứ tự trong từng tab theo questOrder
	for (const list of [ui.questListActive, ui.questListDone]) {
		const nodes = Array.from(list.querySelectorAll('.quest'));
		nodes.sort((a, b) => {
			const ia = questOrder.indexOf(a.dataset.questId);
			const ib = questOrder.indexOf(b.dataset.questId);
			return ia - ib;
		});
		for (const n of nodes) list.appendChild(n);
	}

	let countActive = 0;
	let countDone = 0;
	for (const id of questOrder) {
		const q = quests.get(id);
		if (q.status === 'done') countDone++;
		else countActive++;
	}

	ui.countActive.textContent = countActive;
	ui.countDone.textContent = countDone;
	ui.questCounter.textContent = `${countDone} / ${questOrder.length}`;
	ui.statQuests.textContent = `${countDone} / ${questOrder.length}`;

	ui.emptyActive.style.display = countActive === 0 ? 'flex' : 'none';
	ui.emptyDone.style.display = countDone === 0 ? 'flex' : 'none';

	// Thanh công cụ chọn: chỉ hiện khi có quest chưa làm ở tab active
	const hasPending = countActive > 0;
	ui.selectTools.style.display = currentTab === 'active' && hasPending ? 'flex' : 'none';
	updateSelectionUi();
}

function updateSelectionUi() {
	ui.selectedCount.textContent = selected.size;
	const busy = state !== 'idle';
	ui.btnRunSelected.disabled = selected.size === 0 || busy;
	const selectableIds = questOrder.filter((id) => {
		const q = quests.get(id);
		return q && canSelectQuest(q);
	});
	ui.selectAll.checked = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
	ui.selectAll.indeterminate = !ui.selectAll.checked && selectableIds.some((id) => selected.has(id));
}

/* ---------------- Selection handlers ---------------- */

ui.questListActive.addEventListener('change', (e) => {
	const check = e.target.closest('input[data-quest-check]');
	if (!check) return;
	const id = check.dataset.questCheck;
	if (check.checked) selected.add(id);
	else selected.delete(id);
	updateSelectionUi();
});

ui.selectAll.addEventListener('change', () => {
	const selectableIds = questOrder.filter((id) => {
		const q = quests.get(id);
		return q && canSelectQuest(q);
	});
	if (ui.selectAll.checked) {
		for (const id of selectableIds) selected.add(id);
	} else {
		for (const id of selectableIds) selected.delete(id);
	}
	renderQuests();
	updateSelectionUi();
});

/* ---------------- Quest store helpers ---------------- */

function upsertQuest(id, patch) {
	if (!id) return;
	if (!quests.has(id)) {
		questOrder.push(id);
		quests.set(id, {
			id,
			name: '',
			status: 'running',
			secondsDone: 0,
			secondsNeeded: 0,
			orbs: 0,
		});
	}
	Object.assign(quests.get(id), patch);
	renderQuests();
}

/* ---------------- Event Dispatcher ---------------- */

function handleEvent(evt) {
	const d = evt.data || {};
	switch (evt.type) {
		case 'login':
			setState('running', { username: d.username });
			setAccount(d.username, d.id, d.avatar);
			appendLog(`[Hệ thống] Đã đăng nhập Discord: @${d.username}`, 'ok');
			break;

		case 'quests':
			if (d.total === 0) {
				appendLog('[Hệ thống] Không có nhiệm vụ nào cần làm trong đợt này.', 'system');
			}
			break;

		case 'quest:inventory': {
			// Danh sách quét THẬT từ Discord API. KHÔNG cộng orbs, KHÔNG tự nhận nhiệm vụ.
			const list = Array.isArray(d.quests) ? d.quests : [];
			for (const item of list) {
				if (!item.id) continue;
				upsertQuest(item.id, {
					name: item.name,
					task: item.task,
					application: item.application,
					secondsNeeded: item.secondsNeeded,
					secondsDone: item.secondsDone,
					orbs: item.orbs || 0,
					automatable: item.automatable !== false,
					status: item.status === 'done' ? 'done' : item.status === 'enrolled' ? 'enrolled' : 'new',
				});
			}
			const doneCount = list.filter((x) => x.status === 'done').length;
			appendLog(
				`[Hệ thống] Đã nạp ${list.length} nhiệm vụ thật từ Discord (${doneCount} đã xong, ${
					list.length - doneCount
				} chưa xong).`,
				'system',
			);
			break;
		}

		case 'scan:complete':
			appendLog('[Hệ thống] Quét nhiệm vụ hoàn tất. Tích chọn nhiệm vụ rồi bấm Auto ORBs.', 'ok');
			if (state === 'scanning') setState('idle');
			break;

		case 'quest:start':
			upsertQuest(d.id || d.name, {
				name: d.name,
				task: d.task,
				application: d.application,
				secondsNeeded: d.secondsNeeded,
				secondsDone: d.secondsDone,
				orbs: d.orbs || 0,
				status: 'running',
			});
			break;

		case 'quest:progress':
			upsertQuest(d.id || d.name, {
				secondsDone: d.secondsDone,
				secondsNeeded: d.secondsNeeded,
			});
			break;

		case 'quest:done': {
			// Dedupe: mỗi quest chỉ cộng orbs MỘT LẦN duy nhất trong phiên.
			const key = d.id || d.name;
			if (doneSeen.has(key)) {
				upsertQuest(key, { status: 'done' });
				break;
			}
			doneSeen.add(key);
			const q = quests.get(key) || {};
			// Không fallback 300: chỉ dùng orbs thật từ API.
			const earned = d.orbs || q.orbs || 0;
			upsertQuest(key, {
				name: d.name || q.name,
				status: 'done',
				secondsDone: q.secondsNeeded || q.secondsDone,
				orbs: earned,
			});
			sessionOrbsBonus += earned;
			ui.statOrbsBonus.textContent = `(+ ${sessionOrbsBonus})`;
			if (earned > 0) toast(`🔮 Hoàn thành "${d.name || q.name}"! (+${earned} Orbs)`);
			else toast(`🔮 Hoàn thành "${d.name || q.name}"!`);
			break;
		}

		case 'quest:redeem':
			// Nhận thưởng thật (claim API) — orbs đã cộng qua quest:done, chỉ log.
			appendLog(`[Hệ thống] Đã nhận thưởng: ${d.rewardName || 'quà'} (${d.name})`, 'ok');
			break;

		case 'quest:skip':
			upsertQuest(d.id || d.name, { status: 'skip' });
			break;

		case 'quest:error':
			upsertQuest(d.id || d.name, { status: 'error' });
			break;

		case 'orb:summary':
			// Thống kê thật từ bot: tổng orb đã hoàn thành theo danh sách hiện tại.
			if (typeof d.completedOrbs === 'number') {
				ui.statOrbs.textContent = `${d.completedOrbs} Orbs`;
			}
			break;

		case 'cycle:wait': {
			const rem = d.remainingSeconds || 0;
			const m = Math.floor(rem / 60);
			const s = rem % 60;
			const pad = (n) => String(n).padStart(2, '0');
			ui.statMode.textContent = `Treo AFK: Quét lại sau ${pad(m)}:${pad(s)}`;
			break;
		}

		case 'finish':
			if (state === 'scanning' || d.scanned) {
				setState('idle');
			} else if (!ui.loopMode.checked) {
				appendLog('[Hệ thống] Hoàn tất mọi nhiệm vụ. Phiên làm việc kết thúc.', 'ok');
			}
			break;

		case 'fatal':
			appendLog(`[LỖI] ${d.message || 'Lỗi không xác định'}`, 'stderr');
			toast(`Lỗi: ${d.message}`, true);
			setState('error');
			break;

		default:
			break;
	}
}

/* ---------------- Account chip (login) ---------------- */

function setAccount(username, userId, avatar) {
	if (!username) return;
	ui.chipName.textContent = `@${username}`;
	ui.chipBadge.textContent = 'Online';
	ui.chipBadge.classList.add('online');
	ui.accountChip.classList.add('logged-in');
	if (userId) accountUserId = userId;
	// Avatar Discord CDN (hiệu ứng logo acc — tương lai mở rộng)
	if (avatar && accountUserId) {
		const ext = avatar.startsWith('a_') ? 'gif' : 'png';
		const src = `https://cdn.discordapp.com/avatars/${accountUserId}/${avatar}.${ext}?size=64`;
		const img = document.createElement('img');
		img.src = src;
		img.alt = '';
		img.className = 'chip-avatar-img';
		ui.chipAvatar.innerHTML = '';
		ui.chipAvatar.appendChild(img);
	}
}

async function loginChip() {
	const token = ui.token.value.trim();
	if (!token) {
		toast('Dán token Discord trước đã, rồi bấm đăng nhập.', true);
		ui.token.focus();
		return;
	}
	ui.chipBadge.textContent = 'Đang kiểm tra…';
	ui.chipBadge.classList.remove('online');
	const result = await api.authCheck(token);
	if (result.ok) {
		setAccount(result.user.username, result.user.id, result.user.avatar);
		toast(`✅ Đăng nhập OK: @${result.user.username}`);
		appendLog(`[Hệ thống] Xác thực token thành công: @${result.user.username}`, 'ok');
	} else {
		ui.chipBadge.textContent = 'Đăng nhập';
		ui.accountChip.classList.remove('logged-in');
		toast(result.message || 'Token không hợp lệ.', true);
		appendLog(`[LỖI] Xác thực token thất bại: ${result.message}`, 'stderr');
	}
}

ui.accountChip.addEventListener('click', loginChip);

/* ---------------- User Actions ---------------- */

function validate() {
	const token = ui.token.value.trim();
	if (!token) {
		toast('Vui lòng nhập Token Discord.', true);
		ui.token.focus();
		return false;
	}
	if (token.split('.').length < 3) {
		ui.token.classList.add('invalid');
		toast('Token không đúng định dạng (cần dạng xxx.yyy.zzz).', true);
		return false;
	}
	ui.token.classList.remove('invalid');
	return true;
}

ui.token.addEventListener('input', () => {
	ui.token.classList.remove('invalid');
	ui.btnScan.disabled = state !== 'idle' || !ui.token.value.trim();
});

function collectConfig() {
	return {
		token: ui.token.value.trim(),
		remember: true,
		loopMode: ui.loopMode.checked,
		loopInterval: parseInt(ui.loopInterval.value, 10) || 30,
	};
}

async function saveTokenDirectly() {
	const token = ui.token.value.trim();
	if (!token) {
		toast('Bạn chưa nhập token để lưu.', true);
		ui.token.focus();
		return;
	}
	const result = await api.saveConfig(collectConfig());
	if (result.ok) {
		toast('✅ Đã lưu token thành công! Lần sau vào không cần dán lại.');
	} else {
		toast(`Lỗi khi lưu token: ${result.message}`, true);
	}
}

ui.btnSaveToken.addEventListener('click', saveTokenDirectly);

/* Quét nhiệm vụ: chạy bot ở MODE=scan, chỉ lấy danh sách rồi thoát. */
ui.btnScan.addEventListener('click', async () => {
	if (!validate()) return;
	await api.saveConfig(collectConfig());

	// Reset danh sách & lựa chọn cũ
	questOrder.length = 0;
	quests.clear();
	selected.clear();
	doneSeen.clear();
	ui.console.innerHTML = '';
	logText = '';
	sessionOrbsBonus = 0;
	ui.statOrbsBonus.textContent = '(+ 0)';
	renderQuests();

	const cfg = collectConfig();
	cfg.mode = 'scan';
	const result = await api.start(cfg);
	if (!result.ok) {
		toast(result.message, true);
		setState('idle');
	} else {
		setState('scanning');
		toast('🔍 Đang quét nhiệm vụ…');
	}
});

/* Auto ORBs: chạy các nhiệm vụ đã tích chọn. */
async function startRun(mode, extra = {}) {
	if (!validate()) return;
	await api.saveConfig(collectConfig());

	ui.console.innerHTML = '';
	logText = '';

	const cfg = collectConfig();
	cfg.mode = mode;
	Object.assign(cfg, extra);
	const result = await api.start(cfg);
	if (!result.ok) {
		toast(result.message, true);
		setState('idle');
	} else {
		setState('starting');
		toast(`▶ Chạy ${extra.selectedQuests?.length || 0} nhiệm vụ đã chọn...`);
	}
}

ui.btnRunSelected.addEventListener('click', () => {
	if (selected.size === 0) {
		toast('Chưa chọn nhiệm vụ nào.', true);
		return;
	}
	startRun('run', { selectedQuests: Array.from(selected) });
});

ui.btnStop.addEventListener('click', () => {
	ui.btnStop.disabled = true; // chống double-click ngay lập tức
	setState('stopping');
	api.stop();
	toast('Đang dừng tiến trình...');
});

ui.btnPaste.addEventListener('click', async () => {
	const text = (await api.readClipboard()) || '';
	const match = text.match(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{20,}/);
	ui.token.value = match ? match[0] : text.trim();
	if (ui.token.value) {
		toast('Đã dán Token Discord.');
		ui.token.classList.remove('invalid');
		ui.btnScan.disabled = state !== 'idle';
		// Tự động lưu + kiểm tra đăng nhập ngay khi dán token
		await api.saveConfig(collectConfig());
		loginChip();
	}
});

ui.btnToggleToken.addEventListener('click', () => {
	const isPassword = ui.token.type === 'password';
	ui.token.type = isPassword ? 'text' : 'password';
	ui.btnToggleToken.textContent = isPassword ? '🙈 Ẩn' : '👁 Hiện';
});

// Nút Copy mã script Console
const CONSOLE_TOKEN_SCRIPT = `window.webpackChunkdiscord_app.push([
	[Symbol()],
	{},
	req => {
		if (!req.c) return;
		for (let m of Object.values(req.c)) {
			try {
				if (!m.exports || m.exports === window) continue;
				if (m.exports?.getToken) return copy(m.exports.getToken());
				for (let ex in m.exports) {
					if (m.exports?.[ex]?.getToken && m.exports[ex][Symbol.toStringTag] !== 'IntlMessagesProxy') return copy(m.exports[ex].getToken());
				}
			} catch {}
		}
	},
]);
window.webpackChunkdiscord_app.pop();
console.log('%c🎉 ĐÃ COPY TOKEN DISCORD THÀNH CÔNG! 🎉', 'color: #10b981; font-size: 22px; font-weight: bold; background: #000; padding: 10px; border-radius: 8px;');`;

ui.btnCopyScript.addEventListener('click', async () => {
	try {
		await api.writeClipboard(CONSOLE_TOKEN_SCRIPT);
		toast('📋 Đã copy lệnh lấy Token! Dán vào Console Discord (F12) và ấn Enter.');
	} catch {
		toast('Không thể copy tự động, vui lòng thử lại.', true);
	}
});

ui.btnClearLog.addEventListener('click', () => {
	ui.console.innerHTML = '';
	logText = '';
});

ui.btnSaveLog.addEventListener('click', async () => {
	const result = await api.saveLog(logText);
	if (result.ok) toast('Đã lưu file log thành công.');
});

ui.btnOpenFolder.addEventListener('click', () => api.openDataFolder());

/* ---------------- Initialization (Fast startup) ---------------- */

api.onLog((payload) => appendLog(payload.line, payload.stream));
api.onEvent(handleEvent);
api.onState((payload) => setState(payload.state, payload));

(async function init() {
	try {
		const cfg = await api.getConfig();
		if (cfg.token) {
			ui.token.value = cfg.token;
			// Tự kiểm tra token đã lưu khi mở app → hiện account chip luôn
			const auth = await api.authCheck(cfg.token);
			if (auth.ok) {
				setAccount(auth.user.username, auth.user.id, auth.user.avatar);
			} else {
				ui.chipBadge.textContent = 'Đăng nhập';
			}
		}
		ui.loopMode.checked = cfg.loopMode !== false;
		if (cfg.loopInterval) {
			ui.loopInterval.value = String(cfg.loopInterval);
		}
		ui.loopIntervalRow.style.display = ui.loopMode.checked ? 'flex' : 'none';
		updateModeDisplay();
		setState(cfg.state || 'idle');
		appendLog('[Hệ thống] Ứng dụng sẵn sàng. Dán token → Quét nhiệm vụ → chọn → Auto ORBs.', 'system');
	} catch {
		/* ignore */
	}
})();
