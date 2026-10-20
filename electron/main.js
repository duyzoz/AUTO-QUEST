'use strict';

const {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	shell,
	Menu,
	safeStorage,
	clipboard,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const EVENT_MARKER = '\u0001AQEVENT\u0001';
const MAX_LOG_BUFFER = 2 * 1024 * 1024;

let mainWindow = null;
let child = null;
let childState = 'idle';
let logBuffer = '';

const configPath = () => path.join(app.getPath('userData'), 'autoquest_config.json');

function readConfig() {
	const base = { token: '', remember: true, loopMode: true, loopInterval: 30, autoScroll: true };
	try {
		const raw = fs.readFileSync(configPath(), 'utf8');
		const parsed = JSON.parse(raw);
		let token = '';
		if (parsed.tokenEnc) {
			try {
				const buf = Buffer.from(parsed.tokenEnc, 'base64');
				token = safeStorage.isEncryptionAvailable()
					? safeStorage.decryptString(buf)
					: buf.toString('utf8');
			} catch {
				token = '';
			}
		}
		return {
			token,
			remember: parsed.remember !== false,
			loopMode: parsed.loopMode !== false,
			loopInterval: typeof parsed.loopInterval === 'number' ? parsed.loopInterval : 30,
			autoScroll: parsed.autoScroll !== false,
		};
	} catch {
		return base;
	}
}

function writeConfig({ token, remember, loopMode, loopInterval, autoScroll }) {
	const payload = {
		remember: remember !== false,
		loopMode: loopMode !== false,
		loopInterval: typeof loopInterval === 'number' ? loopInterval : 30,
		autoScroll: autoScroll !== false,
	};
	if (remember && token) {
		const buf = safeStorage.isEncryptionAvailable()
			? safeStorage.encryptString(token)
			: Buffer.from(token, 'utf8');
		payload.tokenEnc = buf.toString('base64');
	}
	fs.mkdirSync(path.dirname(configPath()), { recursive: true });
	fs.writeFileSync(configPath(), JSON.stringify(payload, null, 2), 'utf8');
}

function send(channel, payload) {
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send(channel, payload);
	}
}

function setState(state, extra = {}) {
	childState = state;
	send('state', { state, ...extra });
}

function pushLog(stream, line) {
	const stamped = `[${new Date().toLocaleTimeString('vi-VN')}] ${line}`;
	logBuffer += `${stamped}\n`;
	if (logBuffer.length > MAX_LOG_BUFFER) {
		logBuffer = logBuffer.slice(-MAX_LOG_BUFFER);
	}
	send('log', { stream, line: stamped });
}

function handleLine(stream, raw) {
	const line = raw.replace(/\u0007/g, '').replace(/\s+$/, '');
	if (!line) return;
	if (line.includes(EVENT_MARKER)) {
		const payload = line.slice(line.indexOf(EVENT_MARKER) + EVENT_MARKER.length);
		try {
			const parsed = JSON.parse(payload);
			if (parsed.type === 'login') {
				setState('running', { username: parsed.data.username });
			}
			if (parsed.type === 'fatal') {
				setState('error', { message: parsed.data.message });
			}
			send('event', parsed);
			return;
		} catch {
			/* fall through to raw log */
		}
	}
	pushLog(stream, line);
}

function attachPipe(pipe, stream) {
	let buffer = '';
	pipe.setEncoding('utf8');
	pipe.on('data', (chunk) => {
		buffer += chunk;
		let idx;
		while ((idx = buffer.indexOf('\n')) !== -1) {
			handleLine(stream, buffer.slice(0, idx));
			buffer = buffer.slice(idx + 1);
		}
	});
	pipe.on('end', () => {
		if (buffer.trim()) handleLine(stream, buffer);
		buffer = '';
	});
}

function stopChild(silent = false) {
	if (!child) return;
	const proc = child;
	child = null;
	try {
		if (process.platform === 'win32') {
			spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], {
				windowsHide: true,
			});
		} else {
			proc.kill('SIGKILL');
		}
		// Fallback: nếu taskkill không có tác dụng, kill trực tiếp.
		setTimeout(() => {
			try {
				if (proc.exitCode === null && !proc.killed) proc.kill('SIGKILL');
			} catch {
				/* ignore */
			}
		}, 1500);
	} catch {
		try {
			proc.kill('SIGKILL');
		} catch {
			/* ignore */
		}
	}
	if (!silent) setState('stopping');
}

function startChild(config) {
	if (child) return { ok: false, message: 'Ứng dụng đang trong quá trình chạy.' };
	const entry = path.join(__dirname, 'bot', 'bot.js');
	if (!fs.existsSync(entry)) {
		return {
			ok: false,
			message: 'Không tìm thấy file thực thi bot. Vui lòng kiểm tra bản build.',
		};
	}
	const token = (config.token || '').trim();
	if (!token) {
		return { ok: false, message: 'Bạn chưa nhập Token Discord.' };
	}
	if (token.split('.').length < 3) {
		return {
			ok: false,
			message: 'Token không hợp lệ. Token Discord có dạng: xxx.yyy.zzz',
		};
	}

	logBuffer = '';
	pushLog('system', '==================================================');
	pushLog('system', '🛡️ KHỞI ĐỘNG AUTO-QUEST (BẢO MẬT 100% LOCAL)');
	pushLog('system', '🛡️ Đã ngắt toàn bộ endpoint ngoài & webhook. An toàn tuyệt đối.');
	pushLog('system', '==================================================');
	setState('starting');

	const env = {
		...process.env,
		ELECTRON_RUN_AS_NODE: '1',
		ELECTRON_NO_ATTACH_CONSOLE: '1',
		TOKEN: token,
		LOOP_MODE: config.loopMode ? '1' : '0',
		LOOP_INTERVAL: String(config.loopInterval || 30),
		MODE: config.mode || 'full',
		SELECTED_QUESTS: Array.isArray(config.selectedQuests)
			? config.selectedQuests.join(',')
			: '',
	};

	try {
		child = spawn(process.execPath, [entry], {
			env,
			windowsHide: true,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
	} catch (err) {
		child = null;
		setState('error', { message: err.message });
		return { ok: false, message: `Không thể khởi chạy: ${err.message}` };
	}

	attachPipe(child.stdout, 'stdout');
	attachPipe(child.stderr, 'stderr');

	child.on('error', (err) => {
		pushLog('stderr', `Lỗi tiến trình bot: ${err.message}`);
	});

	child.on('exit', (code, signal) => {
		child = null;
		if (childState === 'stopping') {
			pushLog('system', '⏹️ Đã dừng tiến trình thủ công.');
			setState('idle');
			return;
		}
		pushLog(
			'system',
			`Tiến trình hoàn tất (Mã ${code ?? '0'}${signal ? `, tín hiệu ${signal}` : ''}).`,
		);
		setState(code === 0 ? 'idle' : 'error', {
			message: code === 0 ? undefined : `Tiến trình kết thúc với mã ${code}.`,
		});
	});

	return { ok: true };
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1080,
		height: 800,
		minWidth: 520,
		minHeight: 520,
		show: false,
		backgroundColor: '#000000',
		autoHideMenuBar: true,
		title: 'AUTO-QUEST PRO · Treo Orb Discord',
		icon: app.isPackaged
			? path.join(process.resourcesPath, 'icon.ico')
			: path.join(__dirname, '..', 'resources', 'icon.ico'),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			spellcheck: false,
			backgroundThrottling: false,
		},
	});

	Menu.setApplicationMenu(null);
	mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

	mainWindow.once('ready-to-show', () => mainWindow.show());
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.webContents.setWindowOpenHandler(() => {
		return { action: 'deny' };
	});
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
	app.quit();
} else {
	app.on('second-instance', () => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
	});

	app.whenReady().then(() => {
		createWindow();
		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	});

	app.on('window-all-closed', () => app.quit());
	app.on('before-quit', () => stopChild(true));
}

ipcMain.handle('config:get', () => {
	const cfg = readConfig();
	return { ...cfg, state: childState, version: app.getVersion() };
});

ipcMain.handle('config:save', (_e, config) => {
	try {
		writeConfig({
			token: config.token,
			remember: config.remember,
			loopMode: config.loopMode,
			loopInterval: config.loopInterval,
			autoScroll: config.autoScroll,
		});
		return { ok: true };
	} catch (err) {
		return { ok: false, message: err.message };
	}
});

ipcMain.handle('bot:start', (_e, config) => startChild(config || {}));
ipcMain.handle('bot:stop', () => {
	stopChild();
	return { ok: true };
});
ipcMain.handle('bot:state', () => ({ state: childState }));

// Kiểm tra token Discord hợp lệ bằng cách gọi /users/@me (chỉ tới discord.com).
ipcMain.handle('auth:check', async (_e, token) => {
	const clean = String(token || '').trim();
	if (!clean) return { ok: false, message: 'Chưa có token.' };
	try {
		const res = await fetch('https://discord.com/api/v10/users/@me', {
			headers: { Authorization: clean },
			signal: AbortSignal.timeout(10000),
		});
		if (!res.ok) {
			return {
				ok: false,
				message: res.status === 401 ? 'Token không hợp lệ hoặc đã hết hạn.' : `Discord trả lỗi ${res.status}.`,
			};
		}
		const user = await res.json();
		return {
			ok: true,
			user: {
				id: user.id,
				username: user.username,
				globalName: user.global_name || user.username,
				displayName: user.global_name || user.username,
				discriminator: user.discriminator,
				avatar: user.avatar,
				// Lấy thẳng từ Discord giống web profile: banner + màu nền + hiệu ứng avt + clan badge
				banner: user.banner || null,
				accentColor: typeof user.accent_color === 'number' ? user.accent_color : null,
				avatarDecoration: user.avatar_decoration_data?.asset || null,
				clan: user.primary_guild?.identity_enabled
					? {
							tag: user.primary_guild.tag || '',
							badge: user.primary_guild.badge || null,
							guildId: user.primary_guild.identity_guild_id || null,
						}
					: null,
			},
		};
	} catch (err) {
		return { ok: false, message: `Không kết nối được Discord: ${err.message}` };
	}
});

ipcMain.handle('clipboard:read', () => clipboard.readText());
ipcMain.handle('clipboard:write', (_e, text) => {
	clipboard.writeText(String(text || ''));
	return { ok: true };
});
ipcMain.handle('shell:open-data-folder', () => {
	shell.openPath(app.getPath('userData'));
	return { ok: true };
});

// Chỉ mở các URL thuộc discord.com — chặn tuyệt đối mọi endpoint ngoài (bảo mật).
ipcMain.handle('shell:open-url', async (_e, url) => {
	try {
		const parsed = new URL(String(url || ''));
		const host = parsed.hostname.toLowerCase();
		if (host !== 'discord.com' && host !== 'www.discord.com' && host !== 'ptb.discord.com') {
			return { ok: false, message: `Chặn mở liên kết không phải discord.com: ${host}` };
		}
		await shell.openExternal(parsed.toString());
		return { ok: true };
	} catch (err) {
		return { ok: false, message: err.message };
	}
});
ipcMain.handle('log:save', async (_e, content) => {
	const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
	try {
		const result = await dialog.showSaveDialog(mainWindow, {
			title: 'Lưu nhật ký AUTO-QUEST',
			defaultPath: path.join(app.getPath('desktop'), `autoquest-${stamp}.log`),
			filters: [{ name: 'Log File', extensions: ['log', 'txt'] }],
		});
		if (result.canceled || !result.filePath) return { ok: false };
		fs.writeFileSync(result.filePath, content || logBuffer, 'utf8');
		return { ok: true, filePath: result.filePath };
	} catch (err) {
		return { ok: false, message: err.message };
	}
});
