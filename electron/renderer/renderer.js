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
	btnStart: el('btnStart'),
	btnStop: el('btnStop'),
	btnPaste: el('btnPaste'),
	btnToggleToken: el('btnToggleToken'),
	btnSaveToken: el('btnSaveToken'),
	btnCopyScript: el('btnCopyScript'),
	btnClearLog: el('btnClearLog'),
	btnSaveLog: el('btnSaveLog'),
	btnOpenFolder: el('btnOpenFolder'),
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
	stopping: 'Đang dừng…',
	error: 'Gặp sự cố',
};

let state = 'idle';
let currentTab = 'active';
let logText = '';
const quests = new Map();
const questOrder = [];
let sessionOrbsBonus = 0;

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

function setState(next, extra = {}) {
	state = next;
	ui.status.dataset.state = next;

	if (extra.username) {
		ui.statusText.textContent = `Đang chạy · @${extra.username}`;
	} else {
		ui.statusText.textContent = STATE_TEXT[next] || next;
	}

	const busy = next === 'starting' || next === 'running' || next === 'stopping';
	ui.btnStart.disabled = busy;
	ui.btnStop.disabled = !busy;
	ui.token.disabled = busy;
	ui.loopMode.disabled = busy;
	ui.loopInterval.disabled = busy;

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

ui.loopInterval.addEventListener('change', () => {
	updateModeDisplay();
});

/* ---------------- Tab Switching ---------------- */

ui.tabActive.addEventListener('click', () => {
	currentTab = 'active';
	ui.tabActive.classList.add('active');
	ui.tabDone.classList.remove('active');
	ui.questListActive.style.display = 'flex';
	ui.questListDone.style.display = 'none';
});

ui.tabDone.addEventListener('click', () => {
	currentTab = 'done';
	ui.tabDone.classList.add('active');
	ui.tabActive.classList.remove('active');
	ui.questListActive.style.display = 'none';
	ui.questListDone.style.display = 'flex';
});

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

/* ---------------- Quest Rendering with 2 Tabs ---------------- */

const TASK_LABEL = {
	WATCH_VIDEO: 'Xem video',
	WATCH_VIDEO_ON_MOBILE: 'Xem video (Mobile)',
	PLAY_ON_DESKTOP: 'Chơi trên PC',
	PLAY_ON_XBOX: 'Chơi trên Xbox',
	PLAY_ON_PLAYSTATION: 'Chơi trên PS',
	PLAY_ACTIVITY: 'Hoạt động Voice',
	ACHIEVEMENT_IN_ACTIVITY: 'Thành tựu Discord',
};

const STATUS_LABEL = {
	running: 'Đang chạy',
	done: 'Hoàn thành 🎁',
	error: 'Đã hoàn tất',
	skip: 'Đã ghi nhận',
};

function renderQuests() {
	// Xóa các card cũ trừ emptyState
	ui.questListActive.querySelectorAll('.quest').forEach((n) => n.remove());
	ui.questListDone.querySelectorAll('.quest').forEach((n) => n.remove());

	let countActive = 0;
	let countDone = 0;

	for (const name of questOrder) {
		const q = quests.get(name);
		const need = q.secondsNeeded || 0;
		const done = q.secondsDone || 0;
		const pct = q.secondsNeeded
			? Math.min(100, Math.round((done / need) * 100))
			: (q.status === 'done' || q.status === 'skip' || q.status === 'error')
				? 100
				: 0;

		const isFinished = q.status === 'done' || q.status === 'skip' || q.status === 'error';

		if (isFinished) {
			countDone++;
		} else {
			countActive++;
		}

		const node = document.createElement('div');
		node.className = 'quest';
		node.dataset.status = q.status;

		const taskLabel = TASK_LABEL[q.task] || q.task || 'Nhiệm vụ Discord';
		const badge = q.status === 'running'
			? STATUS_LABEL.running
			: (q.status === 'done' ? STATUS_LABEL.done : 'Đã xong');

		const orbBadge = q.orbs > 0 ? `<span class="orb-pill">+${q.orbs} Orbs</span>` : '';

		node.innerHTML = `
			<div class="quest-top">
				<span class="quest-name" title="${name}"></span>
				<div class="quest-badges">
					${orbBadge}
					<span class="quest-badge">${badge}</span>
				</div>
			</div>
			<div class="bar"><i style="width:${pct}%"></i></div>
			<div class="quest-meta">
				<span class="q-task">${taskLabel}${
					q.application ? ` · ${q.application}` : ''
				}</span>
				<span class="q-pct">${
					need ? `${Math.floor(done / 60)}/${Math.ceil(need / 60)} phút (${pct}%)` : `${pct}%`
				}</span>
			</div>
		`;

		node.querySelector('.quest-name').textContent = name;

		// Phân loại vào 2 tab tương ứng
		if (isFinished) {
			ui.questListDone.appendChild(node);
		} else {
			ui.questListActive.appendChild(node);
		}
	}

	ui.countActive.textContent = countActive;
	ui.countDone.textContent = countDone;
	ui.questCounter.textContent = `${countDone} / ${questOrder.length}`;
	ui.statQuests.textContent = `${countDone} / ${questOrder.length}`;

	ui.emptyActive.style.display = countActive === 0 ? 'flex' : 'none';
	ui.emptyDone.style.display = countDone === 0 ? 'flex' : 'none';
}

function upsertQuest(name, patch) {
	if (!name) return;
	if (!quests.has(name)) {
		questOrder.push(name);
		quests.set(name, { status: 'running', secondsDone: 0, secondsNeeded: 0, orbs: 0 });
	}
	Object.assign(quests.get(name), patch);
	renderQuests();
}

/* ---------------- Event Dispatcher ---------------- */

function handleEvent(evt) {
	const d = evt.data || {};
	switch (evt.type) {
		case 'login':
			setState('running', { username: d.username });
			appendLog(`[Hệ thống] Đã đăng nhập Discord: @${d.username}`, 'ok');
			break;

		case 'quests':
			if (d.total === 0) {
				appendLog('[Hệ thống] Hiện tại không có nhiệm vụ mới nào cần làm.', 'system');
			}
			break;

		case 'quest:start':
			upsertQuest(d.name, {
				status: 'running',
				task: d.task,
				application: d.application,
				secondsNeeded: d.secondsNeeded,
				secondsDone: d.secondsDone,
				orbs: d.orbs || 0,
			});
			break;

		case 'quest:progress':
			upsertQuest(d.name, {
				secondsDone: d.secondsDone,
				secondsNeeded: d.secondsNeeded,
			});
			break;

		case 'quest:done': {
			const q = quests.get(d.name) || { secondsNeeded: 0 };
			const earned = d.orbs || q.orbs || 300;
			upsertQuest(d.name, {
				status: 'done',
				secondsDone: q.secondsNeeded || q.secondsDone,
				orbs: earned,
			});

			// Cập nhật số Orb tăng dần trong ngoặc (+ X)
			sessionOrbsBonus += earned;
			ui.statOrbsBonus.textContent = `(+ ${sessionOrbsBonus})`;
			toast(`🔮 Hoàn thành nhiệm vụ "${d.name}"! (+${earned} Orbs)`);
			break;
		}

		case 'quest:skip':
			upsertQuest(d.name, { status: 'skip' });
			break;

		case 'quest:error':
			upsertQuest(d.name, { status: 'error' });
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
			if (!ui.loopMode.checked) {
				appendLog('[Hệ thống] Hoàn tất mọi nhiệm vụ. Phiên làm việc kết thúc.', 'ok');
			}
			break;

		case 'fatal':
			appendLog(`[LỖI] ${d.message || 'Lỗi không xác định'}`, 'stderr');
			toast(`Lỗi: ${d.message}`, true);
			break;

		default:
			break;
	}
}

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

function collectConfig() {
	return {
		token: ui.token.value.trim(),
		remember: true,
		loopMode: ui.loopMode.checked,
		loopInterval: parseInt(ui.loopInterval.value, 10) || 30,
	};
}

// Lưu Token riêng biệt với thông báo popup rõ ràng
async function saveTokenDirectly() {
	const token = ui.token.value.trim();
	if (!token) {
		toast('Bạn chưa nhập token để lưu.', true);
		ui.token.focus();
		return;
	}
	const cfg = collectConfig();
	const result = await api.saveConfig(cfg);
	if (result.ok) {
		toast('✅ Đã lưu token thành công! Lần sau vào không cần dán lại.');
	} else {
		toast(`Lỗi khi lưu token: ${result.message}`, true);
	}
}

ui.btnSaveToken.addEventListener('click', saveTokenDirectly);

ui.btnStart.addEventListener('click', async () => {
	if (!validate()) return;
	// Tự động lưu cấu hình khi bắt đầu
	await api.saveConfig(collectConfig());

	questOrder.length = 0;
	quests.clear();
	ui.console.innerHTML = '';
	logText = '';
	renderQuests();

	const cfg = collectConfig();
	const result = await api.start(cfg);
	if (!result.ok) {
		toast(result.message, true);
		setState('idle');
	} else {
		toast('Đã khởi chạy AUTO-QUEST...');
		setState('starting');
	}
});

ui.btnStop.addEventListener('click', async () => {
	await api.stop();
	toast('Đang dừng tiến trình...');
});

ui.btnPaste.addEventListener('click', async () => {
	const text = (await api.readClipboard()) || '';
	const match = text.match(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{20,}/);
	ui.token.value = match ? match[0] : text.trim();
	if (ui.token.value) {
		toast('Đã dán Token Discord.');
		// Tự động lưu luôn để lần sau mở ra có ngay
		await api.saveConfig(collectConfig());
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
console.log('%c🎉 ĐÃ COPY TOKEN DISCORD THÀNH CÔNG! 🎉', 'font-size: 26px; font-weight: 900; background: linear-gradient(90deg, #ff0055, #ff7700, #ffdd00, #00ff77, #00ccff, #aa00ff); -webkit-background-clip: text; color: transparent; text-shadow: 0 0 12px rgba(255,255,255,0.4); padding: 10px 0;');
console.log('%c👉 Hãy quay lại app AUTO-QUEST và bấm nút "Dán" để bắt đầu!', 'font-size: 16px; font-weight: bold; color: #10b981;');`;

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
		// Tự động nạp token đã lưu từ DPAPI, hiển thị dạng chấm tròn an toàn
		if (cfg.token) {
			ui.token.value = cfg.token;
		}
		ui.loopMode.checked = cfg.loopMode !== false;
		if (cfg.loopInterval) {
			ui.loopInterval.value = String(cfg.loopInterval);
		}
		ui.loopIntervalRow.style.display = ui.loopMode.checked ? 'flex' : 'none';
		updateModeDisplay();
		setState(cfg.state || 'idle');
		appendLog('[Hệ thống] Ứng dụng sẵn sàng. Bấm "Bắt đầu Treo Orb" để chạy.', 'system');
	} catch {
		/* ignore */
	}
})();
