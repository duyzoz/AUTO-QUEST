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
	session,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
// Waves 40: danh tính Discord nhất quán (X-Super-Properties + User-Agent + locale/route).
const { discordHeaders, identitySummary } = require('./discordIdentity');
// Waves 40 (C): lớp CDP — nói chuyện với Discord THẬT để Discord tự gửi request/heartbeat.
const cdp = require('./discordCdp');
const displayNameStyle = require('./displayNameStyle');

const EVENT_MARKER = '\u0001AQEVENT\u0001';
const MAX_LOG_BUFFER = 2 * 1024 * 1024;

// Waves 49b — CỔNG GỠ LỖI CDP cho chính app này (chỉ khi dev).
// Bro yêu cầu: "mỗi khi làm phải tự npm run dev lên rồi test tính năng, đừng code
// trong mù mắt". Đặt `AQ_REMOTE_DEBUG=9333` → cửa sổ mở cổng DevTools thật để agent
// nối vào đọc DOM/CSS/computed style ĐANG CHẠY (không phải đoán).
// Phải appendSwitch TRƯỚC app.whenReady().
if (!app.isPackaged) {
	const rdPort = Number(process.env.AQ_REMOTE_DEBUG || 0);
	if (rdPort > 0) {
		app.commandLine.appendSwitch('remote-debugging-port', String(rdPort));
		app.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1');
		console.log(`[app] Remote debugging: http://127.0.0.1:${rdPort}`);
	}
}

/**
 * Waves 48 — LÀM SẠCH TOKEN trước khi gửi Discord.
 *
 * Bro dán token từ clipboard/Console nên rất hay dính: xuống dòng, dấu nháy,
 * tiền tố `Bearer ` / `Bot `, hoặc cả câu lệnh Console. Discord trả 401 cho
 * những thứ đó dù token bên trong HOÀN TOÀN HỢP LỆ → app báo "token không hợp lệ"
 * oan. Hàm này chỉ bóc rác, KHÔNG sửa nội dung token.
 */
function cleanToken(raw) {
	let t = String(raw || '').trim();
	if (!t) return '';
	// Bóc dấu nháy bao ngoài: "abc" / 'abc' / `abc`
	t = t.replace(/^["'`]+|["'`]+$/g, '').trim();
	// Bóc tiền tố header nếu người dùng copy cả chuỗi Authorization
	t = t.replace(/^(?:Bearer|Bot|Token)\s+/i, '').trim();
	// Nếu dán cả dòng code kiểu `localStorage.getItem('token')` thì lấy cụm token
	// đúng định dạng ba phần ngăn bằng dấu chấm.
	const m = t.match(/[\w-]{20,}\.[\w-]{5,}\.[\w-]{20,}/);
	if (m) return m[0];
	// Bỏ mọi khoảng trắng/xuống dòng lọt vào giữa.
	return t.replace(/\s+/g, '');
}

/**
 * Waves 34 — GỐC RỄ của "yêu cầu không được phép": ORIGIN `file://`.
 *
 * hCaptcha (và mọi captcha thật) xác minh người thật dựa trên COOKIE/STORAGE.
 * Trên `file://`, Chromium KHÔNG lưu cookie (chính hCaptcha đã cảnh báo trong console:
 * "Cookies will not actually be stored for file:// URLs"). Hệ quả: widget render ra
 * trông bình thường, nhưng token sinh ra KHÔNG hợp lệ với Discord → 400 "yêu cầu
 * không được phép" mãi không qua.
 *
 * Cách sửa ĐÚNG (không bypass, không hạ bảo mật): phục vụ renderer qua một HTTP
 * SERVER LOOPBACK thật (127.0.0.1, cổng ngẫu nhiên). Origin `http://127.0.0.1:port`
 * là origin web đầy đủ → cookie jar + storage hoạt động y như trên trình duyệt,
 * hCaptcha chạy đúng. Server CHỈ bind 127.0.0.1 (không ra mạng ngoài), chỉ phục vụ
 * file trong thư mục renderer, chặn path traversal.
 */
const http = require('node:http');
const RENDERER_DIR = path.join(__dirname, 'renderer');
let appServer = null;
let appOrigin = '';

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.map': 'application/json',
};

/**
 * Dựng HTTP server loopback phục vụ thư mục renderer.
 * Trả về Promise<origin> ví dụ 'http://127.0.0.1:53124'.
 */
function startRendererServer() {
	return new Promise((resolve, reject) => {
		const server = http.createServer((req, res) => {
			try {
				const url = new URL(req.url, 'http://127.0.0.1');
				let rel = decodeURIComponent(url.pathname);
				if (!rel || rel === '/') rel = '/index.html';
				const target = path.normalize(path.join(RENDERER_DIR, rel));
				// Chặn tuyệt đối path traversal ra ngoài thư mục renderer.
				if (!target.startsWith(RENDERER_DIR)) {
					res.writeHead(403).end('Forbidden');
					return;
				}
				fs.readFile(target, (err, buf) => {
					if (err) {
						res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
						return;
					}
					const ext = path.extname(target).toLowerCase();
					res.writeHead(200, {
						'Content-Type': MIME[ext] || 'application/octet-stream',
						// Cho phép hCaptcha nhúng iframe từ origin loopback này.
						'Cache-Control': 'no-store',
					});
					res.end(buf);
				});
			} catch (e) {
				res.writeHead(500, { 'Content-Type': 'text/plain' }).end(String(e.message));
			}
		});
		server.on('error', reject);
		// Cổng 0 = hệ điều hành tự cấp cổng trống; bind CHỈ 127.0.0.1.
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address();
			appServer = server;
			resolve(`http://127.0.0.1:${port}`);
		});
	});
}


let mainWindow = null;
let child = null;
let childState = 'idle';
let logBuffer = '';
// Waves 45b — token TÀI KHOẢN người dùng nạp từ .txt, chờ renderer bấm Đăng nhập.
// Chỉ sống trong RAM của main process; KHÔNG bao giờ trả về renderer.
let pendingUserToken = '';

const configPath = () => path.join(app.getPath('userData'), 'autoquest_config.json');

/**
 * Wave#88 (Multiaccount) — giải mã token từng tài khoản.
 * Token của mỗi account được giữ DÔÍ RIÊNG (tokenEnc) trong file config,
 * mã hoá bằng safeStorage/DPAPI y như token chính. Trả về '' nếu không đọc được.
 */
function accountsFromPayload(parsed) {
	const list = Array.isArray(parsed.accounts) ? parsed.accounts : [];
	const idx = typeof parsed.activeIdx === 'number' && parsed.activeIdx >= 0 && parsed.activeIdx < list.length
		? parsed.activeIdx
		: 0;
	const accounts = list.map((acc) => {
		let token = '';
		if (acc && acc.tokenEnc) {
			try {
				const buf = Buffer.from(acc.tokenEnc, 'base64');
				token = safeStorage.isEncryptionAvailable()
					? safeStorage.decryptString(buf)
					: buf.toString('utf8');
			} catch {
				token = '';
			}
		}
		return {
			id: acc && typeof acc.id === 'string' ? acc.id : '',
			username: acc && typeof acc.username === 'string' ? acc.username : '',
			displayName: acc && typeof acc.displayName === 'string' ? acc.displayName : '',
			avatar: acc && typeof acc.avatar === 'string' ? acc.avatar : '',
			token,
		};
	});
	return { accounts, activeIdx: idx };
}

function readConfig() {
	const base = { token: '', remember: true, loopMode: true, loopInterval: 30, autoScroll: true, theme: 'dark', accounts: [], activeIdx: 0 };
	let parsed = {};
	try {
		const raw = fs.readFileSync(configPath(), 'utf8');
		parsed = JSON.parse(raw) || {};
	} catch {
		parsed = {};
	}
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
	const { accounts, activeIdx } = accountsFromPayload(parsed);
	return {
		token,
		remember: parsed.remember !== false,
		loopMode: parsed.loopMode !== false,
		loopInterval: typeof parsed.loopInterval === 'number' ? parsed.loopInterval : 30,
		autoScroll: parsed.autoScroll !== false,
		theme: parsed.theme === 'light' ? 'light' : 'dark',
		accounts,
		activeIdx,
	};
}

function encryptTokenPayload(token) {
	const buf = safeStorage.isEncryptionAvailable()
		? safeStorage.encryptString(token)
		: Buffer.from(token, 'utf8');
	return buf.toString('base64');
}

function writeConfig({ token, remember, loopMode, loopInterval, autoScroll, theme, accounts, activeIdx }) {
	const payload = {
		remember: remember !== false,
		loopMode: loopMode !== false,
		loopInterval: typeof loopInterval === 'number' ? loopInterval : 30,
		autoScroll: autoScroll !== false,
		theme: theme === 'light' ? 'light' : 'dark',
	};
	if (remember && token) {
		payload.tokenEnc = encryptTokenPayload(token);
	}
	// Multiaccount: danh sách tài khoản (mỗi token tự mã hoá riêng).
	if (Array.isArray(accounts)) {
		const saved = [];
		for (const acc of accounts) {
			if (!acc) continue;
			const a = {
				id: acc.id || '',
				username: acc.username || '',
				displayName: acc.displayName || '',
				avatar: acc.avatar || '',
			};
			if (acc.token) a.tokenEnc = encryptTokenPayload(acc.token);
			saved.push(a);
		}
		payload.accounts = saved;
		payload.activeIdx = typeof activeIdx === 'number' ? activeIdx : 0;
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
	pushLog('system', 'KHỞI ĐỘNG AUTO-QUEST (BẢO MẬT 100% LOCAL)');
	pushLog('system', 'Đã ngắt toàn bộ endpoint ngoài & webhook. An toàn tuyệt đối.');
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
			pushLog('system', 'Đã dừng tiến trình thủ công.');
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

/**
 * Waves 37 — Dựng HTTPS server phục vụ __probe2.html DƯỚI hostname discord.com.
 * Mục đích: kiểm chứng "chạy hCaptcha trên origin discord.com thật" có làm hCaptcha
 * bung thử thách (token pd>0) hay không. Chỉ dùng khi dev, chỉ bind 127.0.0.1.
 * Kết hợp với --host-resolver-rules=MAP discord.com 127.0.0.1 trong dev.js.
 */
function startDiscordProbeServer() {
	const https = require('node:https');
	const certDir = path.join(__dirname, '..', '.tmp', 'cert');
	let key;
	let cert;
	try {
		key = fs.readFileSync(path.join(certDir, 'discord.key'));
		cert = fs.readFileSync(path.join(certDir, 'discord.crt'));
	} catch {
		return Promise.resolve(null);
	}
	return new Promise((resolve) => {
		const server = https.createServer({ key, cert }, (req, res) => {
			try {
				const url = new URL(req.url, 'https://discord.com');
				if (url.pathname.startsWith('/__aq_probe')) {
					const buf = fs.readFileSync(path.join(RENDERER_DIR, '__probe2.html'));
					res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
					res.end(buf);
					return;
				}
				// Mọi đường dẫn khác: trả trang trống để không tải gì thêm.
				res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				res.end('<!doctype html><meta charset="utf-8"><title>discord probe</title>');
			} catch (e) {
				res.writeHead(500).end(String(e.message));
			}
		});
		server.on('error', () => resolve(null));
		server.listen(443, '127.0.0.1', () => {
			console.log('[probe2] HTTPS server discord.com giả lập trên 127.0.0.1:443');
			resolve(server);
		});
	});
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1080,
		height: 800,
		minWidth: 520,
		minHeight: 520,
		show: false,
		backgroundColor: '#05060b',
		autoHideMenuBar: true,
		title: 'AUTO QUEST · Treo Orb Discord',
		icon: app.isPackaged
			? path.join(process.resourcesPath, 'icon.ico')
			: path.join(__dirname, '..', 'resources', 'icon.ico'),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			// Waves 35: PHẢI tắt sandbox. hCaptcha chạy nhân xác minh trong
			// Web Worker/Service Worker (`hsw.js`). Ở `sandbox: true`, worker đó
			// crash với "iD[Re(...)] is not a function" → widget KHÔNG mở được ô
			// thử thách và token sinh ra vô hiệu (Discord trả 'invalid-response').
			// Tắt sandbox chỉ ảnh hưởng tiến trình renderer nội bộ (app không tải
			// nội dung lạ); contextIsolation + nodeIntegration:false vẫn giữ nguyên
			// nên trang web KHÔNG chạm được Node API.
			sandbox: false,
			webSecurity: true,
			spellcheck: false,
			backgroundThrottling: false,
		},
	});

	Menu.setApplicationMenu(null);
	// Waves 36: AQ_PROBE=<sitekey>[&rqdata=...] → mở trang thử hCaptcha TÁCH BIỆT
	// (không IPC, không UI app) để cô lập xem lỗi nằm ở hCaptcha hay ở Electron.
	// Kèm AQ_PROBE_DUMP=<ms> để in trạng thái probe ra terminal.
	const probe = process.env.AQ_PROBE;
	// Waves 37: AQ_PROBE_DISCORD=<sitekey>[&rqdata=...] → thử hCaptcha trên
	// ORIGIN discord.com THẬT. Dùng webRequest chặn 1 URL giả thuộc discord.com
	// rồi trả nội dung __probe2.html. Mục đích: kiểm chứng giả thuyết hCaptcha
	// bắt buộc hostname nằm trong allowlist của Discord mới chịu bung thử thách.
	const probeDiscord = process.env.AQ_PROBE_DISCORD;
	if (probeDiscord && !app.isPackaged) {
		startDiscordProbeServer().then((srv) => {
			if (!srv) {
				console.error('[probe2] Không dựng được HTTPS server (thiếu cert?). Chạy tools/make-cert.sh trước.');
				return;
			}
			mainWindow.loadURL(`https://discord.com/__aq_probe?${probeDiscord}`);
			console.log(`[probe2] Mở probe trên origin discord.com: ${probeDiscord.slice(0, 80)}…`);
			const p2dump = Number(process.env.AQ_PROBE_DUMP || 0);
			if (p2dump > 0) {
				setTimeout(async () => {
					try {
						const state = await mainWindow.webContents.executeJavaScript(
							'JSON.stringify({ origin: location.origin, host: location.hostname, log: window.__probeLog || [], state: window.__aqProbeState || {} })',
							true,
						);
						console.log('AQ_PROBE_DISCORD_DUMP ' + state);
					} catch (e) {
						console.error('[probe2] dump lỗi: ' + e.message);
					}
				}, p2dump);
			}
		});
	} else if (probe && !app.isPackaged) {
		mainWindow.loadURL(`${appOrigin}/__probe.html?${probe}`);
		console.log(`[probe] Mở trang thử hCaptcha: ${appOrigin}/__probe.html?${probe}`);
		const probeDump = Number(process.env.AQ_PROBE_DUMP || 0);
		if (probeDump > 0) {
			setTimeout(async () => {
				try {
					const state = await mainWindow.webContents.executeJavaScript(
						'JSON.stringify({ log: window.__probeLog || [], state: window.__aqProbeState || {} })',
						true,
					);
					console.log('AQ_PROBE_DUMP ' + state);
				} catch (e) {
					console.error('[probe] dump lỗi: ' + e.message);
				}
			}, probeDump);
		}
	} else {
		// Waves 34: nạp qua `http://127.0.0.1:<port>` (origin web thật) thay vì file:// —
		// đây là điều kiện để hCaptcha lưu cookie và sinh token HỢP LỆ với Discord.
		mainWindow.loadURL(`${appOrigin}/index.html`);
	}

	mainWindow.once('ready-to-show', () => mainWindow.show());

	// Waves 32: KHÔNG để lỗi khởi động chết im lặng. Nếu nạp UI thất bại, in rõ
	// mã lỗi + URL để biết ngay chuyện gì xảy ra thay vì cửa sổ trắng/không mở.
	mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
		console.error(`[renderer] Nạp UI thất bại (${code} ${desc}) tại ${url}`);
	});
	mainWindow.webContents.on('render-process-gone', (_e, details) => {
		console.error(`[renderer] Tiến trình render dừng: ${details.reason} (exitCode=${details.exitCode})`);
	});
	mainWindow.webContents.on('preload-error', (_e, preloadPath, err) => {
		console.error(`[preload] Lỗi preload ${preloadPath}: ${err && err.message}`);
	});
	// Cửa sổ trắng/nghẽn JS → in lỗi console của renderer ra terminal khi dev.
	// Waves 37b: CHUYỂN HẾT mọi cấp độ ra terminal khi bật AQ_VERBOSE=1 — cần cho
	// việc đo hCaptcha trong trang __probe*.html (log bằng console.log cấp 0, trước
	// đây bị lọc `level >= 2` nên không thấy gì, tưởng probe không chạy).
	if (!app.isPackaged) {
		const verbose = process.env.AQ_VERBOSE === '1';
		mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
			// Waves 41: hCaptcha service worker (hsw.js) đôi lúc ném TypeError nội bộ
			// (`Xb[Sg(...)] is not a function`) khi worker tự khởi động lại. Đây là
			// ồn KHÔNG gây chết app, KHÔNG làm hỏng quest (claim vẫn HTTP 200 sau đó).
			// Gắn nhãn rõ để không ai tưởng đó là lỗi nhận thưởng.
			const hswNoise = /hsw\.js/i.test(String(sourceId || '')) || /is not a function/i.test(String(message || ''));
			if (hswNoise) {
				if (verbose) console.log(`[renderer:captcha-worker] (vô hại) ${message}`);
				return;
			}
			if (level >= 2) console.error(`[renderer] ${message} (${sourceId}:${line})`);
			else if (verbose) console.log(`[renderer:${level}] ${message}`);
		});
	}

	// Waves 32: AQ_DEBUG_PORT / AQ_DUMP_* — chẩn đoán khi dev (guard !app.isPackaged)
	// Waves 49b: SỬA CRASH. `webContents.debugger.attach()` trong Electron 38 KHÔNG
	// trả Promise (nó callback/đồng bộ) → `.attach('1.3').catch(...)` ném
	// "Cannot read properties of undefined (reading 'catch')" ngay trong createWindow,
	// làm cả hàm dựng cửa sổ chết giữa chừng. Nay: bọc try/catch và dùng callback.
	const debugPort = Number(process.env.AQ_DEBUG_PORT || 0);
	if (debugPort > 0) {
		try {
			const wc = mainWindow.webContents;
			if (!wc.debugger.isAttached()) {
				// Gọi dạng callback (Electron ≤ 38) lẫn dạng Promise (Electron mới hơn).
				const maybe = wc.debugger.attach('1.3', (err) => {
					if (err) console.error('[debug] Không gắn được debugger:', err.message || err);
				});
				if (maybe && typeof maybe.catch === 'function') {
					maybe.catch((err) => console.error('[debug] Không gắn được debugger:', err.message || err));
				}
			}
			console.log(`[debug] AQ_DEBUG_PORT=${debugPort} — cửa sổ đã bật chế độ gỡ lỗi.`);
		} catch (err) {
			console.error('[debug] Bỏ qua chế độ gỡ lỗi:', err.message || err);
		}
	}

	// Waves 32: AQ_DUMP_RAW_QUESTS=1 → khi renderer báo đã quét xong, gọi main đọc thẳng
	// Discord /quests/@me (giải mã token bằng safeStorage) và in PHÂN TÍCH từng quest:
	// có orb không, platforms, hết hạn chưa, đã completed/claimed chưa, HTTP nào khi claim.
	const dumpRaw = process.env.AQ_DUMP_RAW_QUESTS === '1';
	if (!app.isPackaged && dumpRaw) {
		// Waves 32: lấy token đã giải mã từ config (đọc qua readConfig sẵn có).
		const getTokenForDebug = () => {
			const t = readConfig().token;
			return t && t.trim() ? t.trim() : null;
		};
		ipcMain.handle('debug:raw-quests', async () => {
			try {
				const token = await getTokenForDebug();
				if (!token) return { ok: false, message: 'Không giải mã được token.' };
				const r = await fetch('https://discord.com/api/v10/quests/@me', {
					headers: discordHeaders(token),
				});
				const j = await r.json().catch(() => null);
				const all = [...(j?.quests || []), ...(j?.excluded_quests || [])];
				const rows = all.map((x) => {
					const cfg = x.config || {};
					const rr = cfg.rewards_config || {};
					const rewards = Array.isArray(rr.rewards) ? rr.rewards : [];
					const orb = rewards.find((v) => (v.orb_quantity || 0) > 0);
					return {
						id: x.id,
						name: cfg.messages?.quest_name,
						task: Object.keys(cfg.task_config?.tasks || {})[0] || 'UNKNOWN',
						platforms: rr.platforms || [],
						orb: orb?.orb_quantity || 0,
						rewards: rewards.length,
						expiresAt: cfg.expires_at || null,
						expired: cfg.expires_at ? new Date(cfg.expires_at) < new Date() : null,
						completedAt: x.user_status?.completed_at || null,
						claimedAt: x.user_status?.claimed_at || null,
						enrolledAt: x.user_status?.enrolled_at || null,
						preview: x.preview === true,
						trafficRaw: x.traffic_metadata_raw ?? null,
						trafficSealed: x.traffic_metadata_sealed ?? null,
					};
				});
				return { ok: true, status: r.status, total: all.length, rows };
			} catch (err) {
				return { ok: false, message: err.message };
			}
		});
		ipcMain.handle('debug:claim-one', async (_e, questId, variant) => {
			try {
				const token = await getTokenForDebug();
				if (!token) return { ok: false, message: 'Không giải mã được token.' };
				// Waves 33: thử NHIỀU biến thể body để tìm đúng cái Discord chấp nhận.
				//  - 'empty'  : {} — đúng theo client Discord thật (skill §2 ghi vậy)
				//  - 'full'   : body cũ (platform/location/is_targeted/metadata_*)
				//  - 'minimal': { location: 11, is_targeted: false }
				const variants = {
					empty: {},
					full: {
						platform: 0,
						location: 11,
						is_targeted: false,
						metadata_raw: null,
						metadata_sealed: null,
						traffic_metadata_raw: null,
						traffic_metadata_sealed: null,
					},
					minimal: { location: 11, is_targeted: false },
				};
				const body = variants[variant] || variants.empty;
				const r = await fetch(
					`https://discord.com/api/v10/quests/${encodeURIComponent(questId)}/claim-reward`,
					{
						method: 'POST',
						headers: discordHeaders(token, { json: true }),
						body: JSON.stringify(body),
					},
				);
				const j = await r.json().catch(() => null);
				return { ok: r.ok, status: r.status, variant: variant || 'empty', sent: body, data: j };
			} catch (err) {
				return { ok: false, message: err.message };
			}
		});
		// Waves 33: dò ĐÚNG giá trị `platform` Discord chấp nhận.
		// Discord trả BASE_TYPE_REQUIRED cho platform==0 → phải thử các enum thật.
		// 0=Desktop, 1=Xbox, 2=PlayStation, 3=?, 4=?, 5=?, 11=unknown.
		ipcMain.handle('debug:probe-platform', async (_e, questId, platform) => {
			try {
				const token = await getTokenForDebug();
				if (!token) return { ok: false, message: 'Không giải mã được token.' };
				const body = {
					platform,
					location: 11,
					is_targeted: false,
					metadata_raw: null,
					metadata_sealed: null,
					traffic_metadata_raw: null,
					traffic_metadata_sealed: null,
				};
				const r = await fetch(
					`https://discord.com/api/v10/quests/${encodeURIComponent(questId)}/claim-reward`,
					{
						method: 'POST',
						headers: discordHeaders(token, { json: true }),
						body: JSON.stringify(body),
					},
				);
				const j = await r.json().catch(() => null);
				return { ok: r.ok, status: r.status, platformSent: platform, data: j };
			} catch (err) {
				return { ok: false, message: err.message };
			}
		});
	}

	// Waves 36: lấy captcha_* THẬT từ Discord để nạp thẳng vào trang thử
	// __probe.html. In ra terminal dạng query-string dùng được ngay.
	// KHÔNG đặt trong guard AQ_DUMP_RAW_QUESTS — hook này chạy độc lập.
	if (!app.isPackaged) {
		const getTokenForProbe = () => {
			const t = readConfig().token;
			return t && t.trim() ? t.trim() : null;
		};
		ipcMain.handle('debug:captcha-probe', async (_e, questId) => {
			try {
				const token = getTokenForProbe();
				if (!token) return { ok: false, message: 'Không giải mã được token.' };
				const body = { platform: 0, location: 11, is_targeted: false };
				const r = await fetch(
					`https://discord.com/api/v10/quests/${encodeURIComponent(questId)}/claim-reward`,
					{
						method: 'POST',
						headers: discordHeaders(token, { json: true }),
						body: JSON.stringify(body),
					},
				);
				const j = await r.json().catch(() => null);
				if (j && j.captcha_sitekey) {
					const qs =
						`sitekey=${encodeURIComponent(j.captcha_sitekey)}` +
						`&rqdata=${encodeURIComponent(j.captcha_rqdata || '')}` +
						`&rqtoken=${encodeURIComponent(j.captcha_rqtoken || '')}`;
					console.log('AQ_CAPTCHA_QS ' + qs);
				}
				return { ok: r.ok, status: r.status, data: j };
			} catch (err) {
				return { ok: false, message: err.message };
			}
		});
		// Waves 36: gửi captcha_key ĐÃ CÓ (từ trang probe riêng) tới Discord.
		// Cho biết token do hCaptcha tách-biệt sinh ra có được Discord chấp nhận
		// không — tách bạch lỗi "sinh token" vs lỗi "gửi request" của app.
		ipcMain.handle('debug:submit-captcha', async (_e, questId, captcha) => {			try {
				const token = getTokenForProbe();
				if (!token) return { ok: false, message: 'Không giải mã được token.' };
				// Waves 40: header ĐẦY ĐỦ + NHẤT QUÁN qua discordHeaders. Bài học Wave 37:
				// thêm UA/XSP lẻ loi, không khớp → edge trả thẳng 404. Nay cả bộ đi cùng nhau.
				const heads = discordHeaders(token, { json: true, questRoute: true });
				const variants = {
					keyOnly: { platform: 0, location: 11, is_targeted: false, captcha_key: captcha.key },
					keyAndRq: {
						platform: 0,
						location: 11,
						is_targeted: false,
						captcha_key: captcha.key,
						captcha_rqdata: captcha.rqdata || undefined,
						captcha_rqtoken: captcha.rqtoken || undefined,
					},
					keyAndSession: {
						platform: 0,
						location: 11,
						is_targeted: false,
						captcha_key: captcha.key,
						captcha_session_id: captcha.sessionId || undefined,
					},
				};
				const want = captcha.variant || 'keyOnly';
				const body = variants[want] || variants.keyOnly;
				const r = await fetch(
					`https://discord.com/api/v10/quests/${encodeURIComponent(questId)}/claim-reward`,
					{ method: 'POST', headers: heads, body: JSON.stringify(body) },
				);
				const j = await r.json().catch(() => null);
				console.log(
					`AQ_SUBMIT[${want}] HTTP ${r.status} → ` +
						`${j && j.captcha_key ? 'captcha:' + JSON.stringify(j.captcha_key) : JSON.stringify(j).slice(0, 300)}`,
				);
				return { ok: r.ok, status: r.status, variant: want, sent: Object.keys(body), data: j };
			} catch (err) {
				return { ok: false, message: err.message };
			}
		});
	}

	// Waves 38: nhận trace widget hCaptcha từ renderer → in ra terminal.
	// Chẩn đoán "hộp hoàn toàn trắng, không có gì để bấm" mà bro báo.
	ipcMain.on('debug:captcha-trace', (_e, info) => {
		try {
			console.log('AQ_CAPTCHA_TRACE ' + JSON.stringify(info));
		} catch {
			/* ignore */
		}
	});

	// Waves 36: AQ_CAPTCHA_PROBE_ID=<questId> → claim 1 quest rồi in query-string
	// captcha để nạp vào __probe.html (đo hCaptcha tách biệt khỏi UI app).
	// Đặt NGOÀI guard AQ_DUMP_AFTER để chạy độc lập.
	const probeIdEnv = process.env.AQ_CAPTCHA_PROBE_ID;
	if (!app.isPackaged && probeIdEnv) {
		mainWindow.webContents.once('did-finish-load', () => {
			setTimeout(async () => {
				try {
					const res = await mainWindow.webContents.executeJavaScript(
						`window.autoquest.captchaProbe(${JSON.stringify(probeIdEnv)})`,
						true,
					);
					console.log('AQ_CAPTCHA_PROBE_RESULT ' + JSON.stringify(res));
				} catch (e) {
					console.error('[probe] captchaProbe lỗi: ' + e.message);
				}
			}, Number(process.env.AQ_CAPTCHA_PROBE_WAIT || 2000));
		});
	}

	// Waves 32: AQ_DUMP_AFTER=<ms> → sau khi UI nạp xong, in trạng thái DOM ra terminal
	// (dùng để tự chẩn đoán khi bro báo lỗi mà không nhìn được ảnh). Chỉ chạy khi dev.
	const dumpAfter = Number(process.env.AQ_DUMP_AFTER || 0);
	if (!app.isPackaged && dumpAfter > 0) {
		const snapshot = async () => {
			const snap = await mainWindow.webContents.executeJavaScript(
				`(function(){
					const g = (id) => { const e=document.getElementById(id); return e ? {text:(e.textContent||'').trim().slice(0,400), hidden:e.hidden} : null; };
					return {
						title: document.title,
						origin: location.origin,
						protocol: location.protocol,
						cookieEnabled: navigator.cookieEnabled,
						cookieWritable: (function(){ try { document.cookie = 'aq_probe=1; path=/'; return document.cookie.indexOf('aq_probe=1') !== -1; } catch(e) { return 'ERR:'+e.message; } })(),
						localStorageOk: (function(){ try { localStorage.setItem('aq_probe','1'); const v = localStorage.getItem('aq_probe'); localStorage.removeItem('aq_probe'); return v === '1'; } catch(e) { return 'ERR:'+e.message; } })(),
						toast: g('toast'),
						modalOpen: [...document.querySelectorAll('.modal-veil')].filter(m=>!m.hidden).map(m=>m.id),
						captchaErr: g('captchaErr'),
						captchaWidget: (function(){
							const slot = document.getElementById('hcaptchaWidget');
							if (!slot) return null;
							const ifr = slot.querySelectorAll('iframe');
							const rect = slot.getBoundingClientRect();
							return {
								slotChildren: slot.children.length,
								slotRect: {w: Math.round(rect.width), h: Math.round(rect.height)},
								slotVisible: !!(rect.width && rect.height),
								iframes: ifr.length,
								iframeSrc: ifr.length ? ifr[0].src.slice(0, 80) : null,
								iframeSize: ifr.length ? {w: Math.round(ifr[0].getBoundingClientRect().width), h: Math.round(ifr[0].getBoundingClientRect().height)} : null,
								loadingHidden: (document.getElementById('captchaLoading')||{}).hidden,
								hasHcaptchaGlobal: !!(window.hcaptcha && window.hcaptcha.render),
								// Waves 35: kiểm tra widget có bị kẹt ở trạng thái chưa render không.
								widgetId: (typeof captchaCtx !== 'undefined' && captchaCtx) ? captchaCtx.widgetId : null,
								rqdataLen: (typeof captchaCtx !== 'undefined' && captchaCtx && captchaCtx.captcha) ? String(captchaCtx.captcha.rqdata||'').length : null,
								// Waves 36: đo khung chứa để chắc chắn bảng thử thách KHÔNG bị cắt.
								slotOverflow: (function(){ const e=document.getElementById('hcaptchaWidget'); if(!e) return null; const s=getComputedStyle(e.parentElement||e); return s.overflow; })(),
								cardOverflowY: (function(){ const e=document.querySelector('.capture-card'); return e ? getComputedStyle(e).overflowY : null; })(),
								cardRect: (function(){ const e=document.querySelector('.capture-card'); if(!e) return null; const r=e.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height),scrollH:e.scrollHeight}; })(),
								targetName: (document.getElementById('captchaTargetName')||{}).textContent,
							};
						})(),
						logLines: [...document.querySelectorAll('.log-line')].slice(-18).map(e=>e.textContent.trim().slice(0,240)),
						dprofile: document.getElementById('dprofile') ? document.getElementById('dprofile').dataset.state : null,
						token: (document.getElementById('token')||{}).value ? 'HAS_TOKEN' : 'EMPTY',
						orb: (document.getElementById('orbBalance')||{}).textContent,
						cards: document.querySelectorAll('.qcard').length,
						doneCards: document.querySelectorAll('.qdone').length,
						acts: [...document.querySelectorAll('.qcard-act')].map(b=>b.dataset.act),
						bodyText: document.body.innerText.replace(/\\s+/g,' ').slice(0,700),
					};
				})()`,
				true,
			);
			console.log('AQ_DUMP ' + JSON.stringify(snap));
			return snap;
		};
		mainWindow.webContents.once('did-finish-load', () => {
			setTimeout(async () => {
				try {
					await snapshot();
					// AQ_AUTO_SCAN=1 → tự bấm "Quét nhiệm vụ" để kiểm tra luồng thật.
					if (process.env.AQ_AUTO_SCAN === '1') {
						console.log('[dump] Tự bấm Quét nhiệm vụ…');
						await mainWindow.webContents.executeJavaScript(
							"document.getElementById('btnScan').click()",
							true,
						);
						setTimeout(async () => {
							try {
								console.log('[dump] Sau khi quét:');
								await snapshot();
								// AQ_DUMP_RAW_QUESTS=1 → gọi main đọc thẳng Discord + claim thử
								// từng quest "claimable" để biết CHÍNH XÁC quest nào 404/400/OK.
								if (dumpRaw) {
									console.log('[dump] Phân tích quest thật từ Discord…');
									const raw = await mainWindow.webContents.executeJavaScript(
										'window.autoquest.debugRawQuests()',
										true,
									);
									if (!raw || !raw.ok) {
										console.error('[dump] raw-quests lỗi:', raw && raw.message);
									} else {
										console.log(`[dump] Discord trả ${raw.total} quest (HTTP ${raw.status}).`);
										const now = Date.now();
										for (const r of raw.rows) {
											const flags = [
												r.expired ? 'HẾT HẠN' : '',
												r.claimedAt ? 'ĐÃ CLAIM' : '',
												!r.completedAt ? 'CHƯA XONG' : '',
												r.preview ? 'PREVIEW' : '',
												r.platforms.length === 0 ? 'NO_PLATFORM' : `plat=${r.platforms}`,
												`orb=${r.orb}`,
												`rewards=${r.rewards}`,
											]
												.filter(Boolean)
												.join(' ');
											console.log(`[raw] ${r.id} | ${r.name} | ${r.task} | ${flags}`);
										}
										// Claim thử từng quest đã xong & chưa claim để so HTTP.
										const tryClaim = raw.rows.filter(
											(r) => r.completedAt && !r.claimedAt,
										);
										console.log(
											`[dump] Claim thử ${tryClaim.length} quest · so 3 biến thể body (empty/full/minimal)…`,
										);
										// Chỉ thử 3 quest đầu để không spam captcha.
										for (const r of tryClaim.slice(0, 3)) {
											for (const variant of ['empty', 'full', 'minimal']) {
												const res = await mainWindow.webContents.executeJavaScript(
													`window.autoquest.debugClaimOne(${JSON.stringify(r.id)}, ${JSON.stringify(variant)})`,
													true,
												);
												const short = res.data?.captcha_key
													? `captcha:${JSON.stringify(res.data.captcha_key)}`
													: JSON.stringify(res.data);
												console.log(
													`[try] ${r.id} | ${r.name} | variant=${variant} | HTTP ${res.status} | ${short}`,
												);
											}
										}
										// Waves 33: dò giá trị `platform` hợp lệ (chỉ quest đầu, cách 1.2s/req).
										if (tryClaim.length > 0) {
											const probeQuest = tryClaim[0];
											console.log(
												`[probe] Dò platform hợp lệ trên quest "${probeQuest.name}"…`,
											);
											for (const p of [0, 1, 2, 3, 4, 5, 6, 7]) {
												const res = await mainWindow.webContents.executeJavaScript(
													`window.autoquest.debugProbePlatform(${JSON.stringify(probeQuest.id)}, ${p})`,
													true,
												);
												const short = res.data?.captcha_key
													? `captcha-required (✅ CHẤP NHẬN)`
													: res.data?.errors
														? JSON.stringify(res.data.errors).slice(0, 160)
														: JSON.stringify(res.data);
												console.log(
													`[probe] platform=${p} | HTTP ${res.status} | ${short}`,
												);
												// Discord siết ~1 req/s cho claim-reward. Giãn 4s để
												// không bị 429 che mất kết quả thật của enum.
												await new Promise((rr) => setTimeout(rr, 4000));
											}
										}
									}
								}
							} catch (e2) {
								console.error('[dump] lỗi 2:', e2.message);
							}
						}, Number(process.env.AQ_SCAN_WAIT || 25000));
					}
					// Waves 33: AQ_TEST_CLAIM_UI=<questId> → chạy ĐÚNG luồng UI (runClaim trong
					// renderer) với quest thật, để tự kiểm chứng xử lý 404/429/captcha.
					// Chờ đủ lâu cho lần quét đầu xong (AQ_CLAIM_WAIT, mặc định 14s) rồi mới ép.
					const testClaimId = process.env.AQ_TEST_CLAIM_UI;
					if (testClaimId) {
						setTimeout(async () => {
							try {
								// Đợi store có quest thật (tối đa 60s) trước khi ép claim,
								// tránh test chạy khi danh sách còn trống.
								for (let i = 0; i < 40; i++) {
									const ready = await mainWindow.webContents.executeJavaScript(
										`(typeof quests !== 'undefined' && quests.size > 0)`,
										true,
									);
									if (ready) break;
									await new Promise((r) => setTimeout(r, 1500));
								}
								console.log(`[uitest] Ép runClaim("${testClaimId}") trong renderer…`);
								const out = await mainWindow.webContents.executeJavaScript(
									`(async function(){
										try {
											const map = (typeof quests !== 'undefined') ? quests : null;
											if (!map || typeof runClaim !== 'function') return { ok:false, why:'no runClaim/quests' };
											const q = map.get(${JSON.stringify(testClaimId)});
											if (!q) return { ok:false, why:'quest không có trong store' };
											const before = { name:q.name, status:q.status, orbs:q.orbs };
											await runClaim(q);
											await new Promise(r=>setTimeout(r,4000));
											const after = map.get(${JSON.stringify(testClaimId)});
											const modal = [...document.querySelectorAll('.modal-veil')].filter(m=>!m.hidden).map(m=>m.id);
											const slot = document.getElementById('hcaptchaWidget');
											const ifr = slot ? slot.querySelectorAll('iframe') : [];
											return { ok:true, before, flag: after.flag, status: after.status, err: after.claimError, busy: after.claimBusy,
												modalOpen: modal, captchaIframes: ifr.length,
												captchaSrc: ifr.length ? String(ifr[0].src).slice(0,70) : null,
												captchaSize: ifr.length ? {w:Math.round(ifr[0].getBoundingClientRect().width), h:Math.round(ifr[0].getBoundingClientRect().height)} : null };
										} catch (e) { return { ok:false, why: String(e && e.message) }; }
									})()`,
									true,
								);
								console.log('[uitest] kết quả:', JSON.stringify(out));
								await snapshot();
							} catch (e3) {
								console.error('[uitest] lỗi:', e3.message);
							}
						}, Number(process.env.AQ_CLAIM_WAIT || 14000));
					}
				} catch (err) {
					console.error('[dump] lỗi:', err.message);
				}
			}, dumpAfter);
		});
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.webContents.setWindowOpenHandler(() => {
		return { action: 'deny' };
	});
}

// Waves 44 — GHIM ĐƯỜNG DẪN userData TRƯỚC KHI requestSingleInstanceLock().
// Đổi productName 'AUTO-QUEST' → 'Auto Quest' (bro yêu cầu đổi thương hiệu) khiến
// Electron mặc định đổi thư mục userData theo tên mới → token đã lưu (DPAPI) và
// cấu hình sẽ "biến mất" khi bro mở bản mới. Ghim cứng về đúng thư mục cũ
// (%APPDATA%\AUTO-QUEST) để token/cấu hình giữ nguyên, không cần dán lại token.
// Phải đặt TRƯỚC requestSingleInstanceLock() để khoá 1-phiên-cùng nằm đúng chỗ.
try {
	const pinnedUserData = path.join(process.env.APPDATA || app.getPath('appData'), 'AUTO-QUEST');
	if (app.getPath('userData') !== pinnedUserData) app.setPath('userData', pinnedUserData);
} catch {
	/* không ghim được thì giữ mặc định — không làm rơi app vì việc này */
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

	app.whenReady().then(async () => {
		// Waves 37: ĐẶT User-Agent giống Chrome thật. Mặc định Electron gửi UA có
		// chuỗi "Electron/xx" + tên app → hCaptcha nhận diện client không chuẩn và
		// KHÔNG bung bảng thử thách (chỉ trả token "passive" P1_ với pd:0). Discord
		// từ chối token passive → luôn báo captcha-required. Dùng UA Chrome chuẩn
		// để hCaptcha chạy đúng luồng xác minh người thật như trên trình duyệt.
		const CHROME_UA =
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
			'(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
		try {
			session.defaultSession.setUserAgent(CHROME_UA);
		} catch (err) {
			console.warn('[app] Không đặt được User-Agent:', err.message);
		}
		// Waves 34: dựng server loopback TRƯỚC khi mở cửa sổ (origin web thật cho hCaptcha).
		try {
			appOrigin = await startRendererServer();
			console.log(`[app] Renderer origin: ${appOrigin}`);
		} catch (err) {
			console.error('[app] Không dựng được server renderer:', err.message);
		}
		createWindow();
		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	});

	app.on('window-all-closed', () => app.quit());
	app.on('before-quit', () => {
		stopChild(true);
		if (appServer) {
			try {
				appServer.close();
			} catch {
				/* ignore */
			}
			appServer = null;
		}
	});
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
			theme: config.theme, // Waves 28: 'dark' | 'light'
			// Giữ NGUYÊN danh sách multi-account + activeIdx (config:save không
			// được phép xoá danh sách tài khoản — bro muốn token giữ lại).
			accounts: config.accounts,
			activeIdx: config.activeIdx,
		});
		return { ok: true };
	} catch (err) {
		return { ok: false, message: err.message };
	}
});

/* ============================================================================
   Wave#88 (Multiaccount) — IPC quản lý danh sách tài khoản Discord.
   Mỗi account là { id, username, displayName, avatar, token }. Token được
   mã hoá riêng (DPAPI) khi ghi. Renderer (localhost loopback) được cấp token
   để hiện ở Cài đặt + tự reload khi đổi tài khoản — y như `token` chính.
   ========================================================================== */

/** Bọc từng lần đổi danh sách: đọc config → sửa → ghi lại (thread-safe bằng
 *  việc KHÔNG chia đôi read/write, tránh mất token). */
function mutateAccounts(mutator) {
	const snap = {
		remember: readCfgGlobal().remember,
		loopMode: readCfgGlobal().loopMode,
		loopInterval: readCfgGlobal().loopInterval,
		autoScroll: readCfgGlobal().autoScroll,
		theme: readCfgGlobal().theme,
	};
	const cfg = readConfig();
	const result = mutator({ accounts: cfg.accounts.map((a) => ({ ...a })), activeIdx: cfg.activeIdx });
	// Sau khi sửa: token "chính" = token của activeIdx (mã hoá 1 lần chung).
	const mainToken = result.activeIdx >= 0 && result.accounts[result.activeIdx]
		? result.accounts[result.activeIdx].token
		: (cfg.token || '');
	writeConfig({ token: mainToken, ...snap, accounts: result.accounts, activeIdx: result.activeIdx });
	return result;
}
function readCfgGlobal() { return readConfig(); }

ipcMain.handle('accounts:from-config', () => {
	const cfg = readConfig();
	return { accounts: cfg.accounts, activeIdx: cfg.activeIdx };
});

ipcMain.handle('accounts:add', (_e, acc) => {
	try {
		return mutateAccounts(({ accounts, activeIdx }) => {
			const token = acc && acc.token ? String(acc.token).trim() : '';
			let idx = accounts.findIndex(
				(a) => (token && a.token === token) || (acc && acc.id && a.id && a.id === acc.id),
			);
			if (token && idx === -1) {
				accounts.push({
					id: acc ? String(acc.id || '') : '',
					username: acc ? String(acc.username || '') : '',
					displayName: acc ? String(acc.displayName || '') : '',
					avatar: acc ? String(acc.avatar || '') : '',
					token,
				});
				idx = accounts.length - 1;
			} else if (idx !== -1) {
				// Đã có → chỉ cập nhật thông tin hiển thị (không động token cũ).
				accounts[idx] = {
					id: (acc && acc.id) || accounts[idx].id || '',
					username: (acc && acc.username) || accounts[idx].username || '',
					displayName: (acc && acc.displayName) || accounts[idx].displayName || '',
					avatar: (acc && acc.avatar) || accounts[idx].avatar || '',
					token: token || accounts[idx].token || '',
				};
			}
			if (acc && acc.activate) idx = activeIdx; // "activate" → trỏ activeIdx về entry.
			else if (idx !== -1) {} // giữ activeIdx hiện tại (không tự nhảy).
			return { accounts, activeIdx: (acc && acc.activate) ? idx : activeIdx };
		});
	} catch (err) {
		return { ok: false, message: err.message };
	}
});

ipcMain.handle('accounts:remove', (_e, id) => {
	try {
		return mutateAccounts(({ accounts, activeIdx }) => {
			// KHÔNG cho xoá chính tài khoản đang là activeIdx (đang đăng nhập)
			// — vì bro đã nói "logout = session xoá, token GIỮ trong danh sách".
			const activeId = accounts[activeIdx] ? accounts[activeIdx].id : null;
			if (activeId && activeId === id) return { accounts, activeIdx, skipped: true };
			const beforeLen = accounts.length;
			accounts = accounts.filter((a) => a.id !== id);
			if (accounts.length === beforeLen) return { accounts, activeIdx, unchanged: true };
			// Nếu activeIdx nằm SAU điểm xoá → lệch 1; để renderer tự re-resolve.
			return { accounts, activeIdx };
		});
	} catch (err) {
		return { ok: false, message: err.message };
	}
});

ipcMain.handle('accounts:set-active', (_e, idx) => {
	try {
		return mutateAccounts(({ accounts, activeIdx }) => {
			const next = typeof idx === 'number' && idx >= 0 && idx < accounts.length ? idx : 0;
			return { accounts, activeIdx: next, token: accounts[next] ? accounts[next].token : '' };
		});
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

// Waves 18: Bảng huy hiệu Discord — API /users/@me không luôn trả kèm icon hash,
// nên map cứng theo badge-id (hash icon chuẩn từ Discord client / badge-icons CDN).
// Waves 19: 3 badge (Staff / Certified Moderator / Nitro) đã bị Discord CHUYỂN khỏi
// badge-icons/{hash}.png sang discord.com/assets/{hash}.svg — hash cũ trả 404 nên
// phải dùng URL đầy đủ đã verify (curl 200). Các badge còn lại vẫn dùng hash cũ.
const BADGE_ICONS = {
	staff: 'https://discord.com/assets/48d5bdcffe9e7848067c2e187f1ef951.svg',
	partner: '3f9748e53446a137a052f3454e2de41e',
	certified_moderator: 'https://discord.com/assets/c981e58b5ea4b7fedd3a643cf0c60564.svg',
	hypesquad_online_house_1: '8a88d63823d8a71cd5e390baa45efa02', // Bravery
	hypesquad_online_house_2: '011940fd013da3f7fb926e4a1cd2e618', // Brilliance
	hypesquad_online_house_3: '3aa41de486fa12454c3761e8e223442e', // Balance
	hypesquad_brilliance: '011940fd013da3f7fb926e4a1cd2e618',
	hypesquad_bravery: '8a88d63823d8a71cd5e390baa45efa02',
	hypesquad_balance: '3aa41de486fa12454c3761e8e223442e',
	bug_hunter: '2717692c7dca7289b35297368a940dd0',
	bug_hunter_level_1: '2717692c7dca7289b35297368a940dd0',
	bug_hunter_level_2: '848f79194d4be5ff5f81505cbd0ce1e6',
	active_developer: '6bdc42827a38498929a4920da12695d9',
	early_supporter: '7060786766c9c840eb3019e725d2b358',
	premium: 'https://cdn.discordapp.com/assets/content/f61ddf640d11d9bdfaf9de265eb862edf28986b659e545f293b54adf229433af.svg', // Nitro
	verified_developer: '6df5892e0f35b051f8b61eace34f4967',
	early_verified_bot_developer: '6df5892e0f35b051f8b61eace34f4967',
};
const BADGE_LABELS = {
	staff: 'Discord Staff',
	partner: 'Partner',
	certified_moderator: 'Moderator Programs Alumni',
	hypesquad_online_house_1: 'HypeSquad Bravery',
	hypesquad_online_house_2: 'HypeSquad Brilliance',
	hypesquad_online_house_3: 'HypeSquad Balance',
	hypesquad_brilliance: 'HypeSquad Brilliance',
	hypesquad_bravery: 'HypeSquad Bravery',
	hypesquad_balance: 'HypeSquad Balance',
	bug_hunter: 'Bug Hunter',
	bug_hunter_level_1: 'Bug Hunter',
	bug_hunter_level_2: 'Bug Hunter Gold',
	active_developer: 'Active Developer',
	early_supporter: 'Early Supporter',
	premium: 'Nitro',
	verified_developer: 'Early Verified Bot Developer',
	early_verified_bot_developer: 'Early Verified Bot Developer',
};

// Waves 18: public flags bitfield → badge-id. Endpoint /users/@me (self) KHÔNG trả
// badges[] (chỉ trả khi query user khác) nên phải SUY từ flags — nếu không sẽ
// không bao giờ hiện huy hiệu dù user có.
const FLAG_BADGES = [
	[1 << 0, 'staff'],
	[1 << 1, 'partner'],
	[1 << 3, 'bug_hunter'],
	[1 << 6, 'hypesquad_bravery'],
	[1 << 7, 'hypesquad_brilliance'],
	[1 << 8, 'hypesquad_balance'],
	[1 << 9, 'early_supporter'],
	[1 << 14, 'bug_hunter_level_2'],
	[1 << 17, 'early_verified_bot_developer'],
	[1 << 18, 'certified_moderator'],
	[1 << 22, 'active_developer'],
];

/** Gộp badges từ API (nếu có) + badges suy từ public flags + Nitro (premium_type). */
function collectBadges(user) {
	const map = new Map();
	for (const b of Array.isArray(user.badges) ? user.badges : []) {
		if (b && (b.icon || BADGE_ICONS[b.id])) {
			map.set(b.id || b.icon, {
				id: b.id || '',
				description: b.description || BADGE_LABELS[b.id] || '',
				icon: b.icon || BADGE_ICONS[b.id] || '',
				// Waves 19: API trả hash cũ (badge-icons) có thể đã bị Discord chuyển path
				// → giữ icon đã verify làm dự phòng để renderer thử lại khi ảnh lỗi.
				fallbackIcon: BADGE_ICONS[b.id] || '',
			});
		}
	}
	const flags = typeof user.flags === 'number' ? user.flags : 0;
	for (const [bit, id] of FLAG_BADGES) {
		if (flags & bit && !map.has(id)) {
			map.set(id, { id, description: BADGE_LABELS[id] || '', icon: BADGE_ICONS[id], fallbackIcon: '' });
		}
	}
	// Nitro: self endpoint không trả badges[] nên suy từ premium_type.
	const premium = typeof user.premium_type === 'number' ? user.premium_type : 0;
	if (premium > 0 && !map.has('premium')) {
		map.set('premium', { id: 'premium', description: BADGE_LABELS.premium || 'Nitro', icon: BADGE_ICONS.premium, fallbackIcon: '' });
	}
	return [...map.values()];
}

ipcMain.handle('auth:check', async (_e, token) => {
	const clean = cleanToken(token);
	if (!clean) return { ok: false, message: 'Chưa có token.' };
	if (clean.split('.').length < 3) {
		return { ok: false, message: 'Token không đúng định dạng (cần dạng xxx.yyy.zzz).' };
	}
	try {
		const heads = discordHeaders(clean);
		const meRes = await fetch('https://discord.com/api/v10/users/@me', {
			headers: heads,
			signal: AbortSignal.timeout(10000),
		});
		if (!meRes.ok) {
			return {
				ok: false,
				message:
					meRes.status === 401
						? 'Token không hợp lệ hoặc đã hết hạn.'
						: meRes.status === 403
							? 'Discord từ chối token này (403) — token có thể đã bị thu hồi.'
							: `Discord trả lỗi ${meRes.status}.`,
			};
		}
		const user = await meRes.json();

		// ────────────────────────────────────────────────────────────────────
		// Waves 49b — SỰ THẬT ĐO ĐƯỢC TỪ TÀI KHOẢN THẬT (không đoán).
		//
		// `/users/@me/profile` trả **400** với token người dùng → KHÔNG dùng.
		// Nguồn chuẩn của EFFECT / FRAME / THEME / BANNER là:
		//   GET /users/{id}/profile  →  body.user_profile
		//     user_profile.profile_effect = { sku_id, expires_at }
		//     user_profile.collectibles   = [ { sku_id, type, expires_at } ]
		//       type là SỐ (enum a.R): 0 NONE · 1 PROFILE_EFFECT · 2 NAMEPLATE ·
		//                             3 PROFILE_FRAME · 8 AVATAR_DECORATION
		//     user_profile.theme_colors   = [primaryInt, accentInt]
		//     user_profile.banner         = "<hash>"
		//
		// Metadata tài sản nằm ở storefront, và KHÔNG bọc trong `items`:
		//   GET /storefront/products/sku/{sku}
		//     body.skus[i].tenant_metadata.collectibles.item
		//       type 1 (effect): { effects:[ {src,loop,height,width,duration,
		//                          start,loopDelay,position,zIndex} ],
		//                          staticFrameSrc, reducedMotionSrc,
		//                          thumbnailPreviewSrc }
		//       type 3 (frame):  { layers:[ {id,type,order,anchor,responsive} ],
		//                          inner_width, overflow_top, overflow_bottom,
		//                          overflow_horizontal }
		//
		// URL tài sản:
		//   frame layer : ${CDN}/media/v1/collectibles-shop/{frameSku}/{layerId}/static
		//   effect layer: chính là `src` tuyệt đối (assets/content/<hash>)
		// ────────────────────────────────────────────────────────────────────
		const COLLECTIBLE_TYPE = { NONE: 0, PROFILE_EFFECT: 1, NAMEPLATE: 2, PROFILE_FRAME: 3, AVATAR_DECORATION: 8 };
		const profile = (await (async () => {
			try {
				const r = await fetch(
					`https://discord.com/api/v10/users/${encodeURIComponent(user.id)}/profile?with_mutual_guilds=false`,
					{ headers: heads, signal: AbortSignal.timeout(10000) },
				);
				return r.ok ? await r.json().catch(() => ({})) : {};
			} catch {
				return {};
			}
		})()) || {};
		const up = profile.user_profile || {};

		const skuProductCache = new Map();
		/** Lấy `tenant_metadata.collectibles.item` của một sku (có cache). */
		const fetchCollectibleItem = async (sku) => {
			if (!sku) return null;
			const key = String(sku);
			if (skuProductCache.has(key)) return skuProductCache.get(key);
			let item = null;
			try {
				const r = await fetch(
					`https://discord.com/api/v10/storefront/products/sku/${encodeURIComponent(key)}`,
					{ headers: heads, signal: AbortSignal.timeout(9000) },
				);
				if (r.ok) {
					const body = await r.json().catch(() => null);
					// Hình dạng thật: { skus:[ { id, tenant_metadata:{ collectibles:{ item } } } ] },
					// KHÔNG bọc trong `items`. Vẫn nhận thêm `items`/`product` cho an toàn.
					const list = Array.isArray(body?.skus)
						? body.skus
						: Array.isArray(body?.items)
							? body.items
							: body?.product?.items || [];
					const mine = list.find((s) => String(s.id) === key) || list[0] || null;
					item = mine?.tenant_metadata?.collectibles?.item || mine?.collectibles?.item || null;
				}
			} catch {
				/* renderer sẽ ẩn frame/effect nếu không lấy được */
			}
			skuProductCache.set(key, item);
			return item;
		};

		// ── EFFECT ────────────────────────────────────────────────────────
		// Ưu tiên user_profile.profile_effect.sku_id; dự phòng quét collectibles
		// tìm phần tử type === 1 (PROFILE_EFFECT).
		const collectiblesList = Array.isArray(up.collectibles) ? up.collectibles : [];
		const effectSku =
			up.profile_effect?.sku_id ||
			collectiblesList.find((c) => Number(c?.type) === COLLECTIBLE_TYPE.PROFILE_EFFECT)?.sku_id ||
			null;
		const profileEffect = await (async () => {
			if (!effectSku) return null;
			const item = await fetchCollectibleItem(effectSku);
			if (!item) return null;
			const effects = Array.isArray(item.effects)
				? item.effects
						.map((e) => ({
							src: e.src || null,
							loop: e.loop !== false,
							height: Number(e.height) || 0,
							width: Number(e.width) || 0,
							duration: Number(e.duration) || 0,
							start: Number(e.start) || 0,
							loopDelay: Number(e.loopDelay) || 0,
							x: e.position?.x || 0,
							y: e.position?.y || 0,
							zIndex: Number(e.zIndex) || 0,
						}))
						.filter((e) => e.src)
				: [];
			if (!effects.length && !item.staticFrameSrc) return null;
			return {
				sku: effectSku,
				title: item.title || '',
				animationType: Number(item.animationType) || 0,
				effects,
				staticFrameSrc: item.staticFrameSrc || null,
				reducedMotionSrc: item.reducedMotionSrc || null,
				thumbnailSrc: item.thumbnailPreviewSrc || null,
			};
		})();

		// ── FRAME ─────────────────────────────────────────────────────────
		// collectibles[] phần tử type === 3 (PROFILE_FRAME).
		const frameSku = collectiblesList.find((c) => Number(c?.type) === COLLECTIBLE_TYPE.PROFILE_FRAME)?.sku_id || null;
		const profileFrame = await (async () => {
			if (!frameSku) return null;
			const item = await fetchCollectibleItem(frameSku);
			if (!item || !Array.isArray(item.layers) || !item.layers.length) return null;
			return {
				sku: frameSku,
				label: item.label || '',
				layers: item.layers.map((l) => ({
					id: l.id || null,
					type: l.type || null,
					anchor: l.anchor || null,
					order: l.order || null,
					responsive: l.responsive ?? null,
					// renderer tự dựng URL từ {sku}/{id}/static
					src: null,
				})),
				innerWidth: Number(item.inner_width) || null,
				overflowTop: Number(item.overflow_top) || null,
				overflowBottom: Number(item.overflow_bottom) || null,
				overflowHorizontal: Number(item.overflow_horizontal) || null,
			};
		})();

		// ── THEME COLORS ──────────────────────────────────────────────────
		const tc = Array.isArray(up.theme_colors) ? up.theme_colors : [];

		// ── NAMEPLATE ─────────────────────────────────────────────────────
		// `user.collectibles.nameplate` (mảng/object tuỳ endpoint) là nguồn thật.
		const npSrc = (() => {
			const a = user.collectibles;
			if (a && !Array.isArray(a) && a.nameplate) return a.nameplate;
			if (Array.isArray(a)) return a.find((c) => Number(c?.type) === COLLECTIBLE_TYPE.NAMEPLATE) || null;
			const b = profile.user?.collectibles;
			if (b && !Array.isArray(b) && b.nameplate) return b.nameplate;
			if (Array.isArray(b)) return b.find((c) => Number(c?.type) === COLLECTIBLE_TYPE.NAMEPLATE) || null;
			return null;
		})();

		return {
			ok: true,
			user: {
				id: user.id,
				username: user.username,
				globalName: user.global_name || user.username,
				displayName: user.global_name || user.username,
				discriminator: user.discriminator,
				avatar: user.avatar,
				badges: collectBadges(user),
				premiumType: typeof user.premium_type === 'number' ? user.premium_type : 0,
				flags: typeof user.flags === 'number' ? user.flags : 0,
				banner: up.banner || user.banner || null,
				accentColor:
					typeof up.accent_color === 'number'
						? up.accent_color
						: typeof user.accent_color === 'number'
							? user.accent_color
							: null,
				avatarDecoration: user.avatar_decoration_data?.asset || null,
				avatarDecorationSku: user.avatar_decoration_data?.sku_id || null,
				nameplate: npSrc
					? { asset: npSrc.asset || npSrc.sku_id || '', palette: npSrc.palette || 'violet' }
					: null,
				clan: user.primary_guild?.identity_enabled
					? {
							tag: user.primary_guild.tag || '',
							badge: user.primary_guild.badge || null,
							guildId: user.primary_guild.identity_guild_id || null,
						}
					: null,
				token: clean,
				displayNameStyles: displayNameStyle.pickStyle(user),
				// Waves 49b: EFFECT / FRAME / THEME — lấy từ /users/{id}/profile
				profileEffect,
				profileFrame,
				themeColors: tc.length >= 2 ? [tc[0], tc[1]] : [],
				profileBanner: up.banner || null,
			},
		};
	} catch (err) {
		return { ok: false, message: `Không kết nối được Discord: ${err.message}` };
	}
});

// Trích xuất SỐ ORB KHẢ DỤNG THẬT từ account.
// Waves 21: nguồn CHÍNH là VÍ THẬT `GET /users/@me/virtual-currency/balance` — đúng con số
// Discord hiển thị trong Kho quà (số dư HIỆN TẠI), KHÔNG phải tổng cộng dồn lịch sử claim.
// Fallback (chỉ khi endpoint ví hỏng): cộng `orb_quantity_claimed` từ `GET /quests/@me/claimed`.
// Quest done CHƯA claim nằm ở /quests/@me (completed_at có, claimed_at null) → pendingClaim.
ipcMain.handle('orbs:fetch', async (_e, token) => {
	const clean = cleanToken(token);
	if (!clean) return { ok: false, message: 'Chưa có token.' };
	try {
		const opts = { headers: discordHeaders(clean), signal: AbortSignal.timeout(15000) };
		// Waves 21: VÍ THẬT trước — GET /users/@me/virtual-currency/balance là đúng con số
		// Discord hiển thị trong Kho quà (số dư hiện tại), KHÔNG phải tổng cộng dồn lịch sử claim.
		const [walletRes, claimedRes, allRes] = await Promise.all([
			fetch('https://discord.com/api/v10/users/@me/virtual-currency/balance', opts).catch(() => null),
			fetch('https://discord.com/api/v10/quests/@me/claimed', opts).catch(() => null),
			fetch('https://discord.com/api/v10/quests/@me', opts).catch(() => null),
		]);

		// ---- 1) SỐ DƯ: ưu tiên ví thật, fallback claimed list ----
		let balance = null;
		let source = 'wallet';
		if (walletRes && walletRes.ok) {
			const w = await walletRes.json().catch(() => null);
			if (w && typeof w.balance === 'number' && Number.isFinite(w.balance)) {
				balance = w.balance;
			}
		}

		let claimedQuests = [];
		if (claimedRes && claimedRes.ok) {
			const claimedData = await claimedRes.json().catch(() => null);
			claimedQuests = Array.isArray(claimedData?.quests) ? claimedData.quests : [];
		}

		if (balance === null) {
			// Fallback: tổng orb đã claim theo lịch sử quest
			source = 'claimed-list';
			balance = 0;
			for (const q of claimedQuests) {
				if (!q) continue;
				const claimedOrbs = q.user_status?.orb_quantity_claimed;
				if (typeof claimedOrbs === 'number') {
					balance += claimedOrbs;
					continue;
				}
				const rewards = q.config?.rewards;
				if (Array.isArray(rewards)) {
					for (const r of rewards) {
						if (typeof r.orb_quantity === 'number') balance += r.orb_quantity;
					}
				}
			}
		}

		// Cả 2 nguồn đều hỏng → báo lỗi token/mạng
		if (balance === null || (!walletRes?.ok && !claimedRes?.ok)) {
			const status = walletRes?.status || claimedRes?.status || 0;
			return {
				ok: false,
				message: status === 401 ? 'Token không hợp lệ.' : `Discord trả lỗi ${status || 'mạng'}.`,
			};
		}

		// ---- 2) PENDING: quest done chưa claim (từ list hiện hành) ----
		let pendingClaim = 0;
		if (allRes && allRes.ok) {
			const allData = await allRes.json().catch(() => null);
			const quests = Array.isArray(allData?.quests) ? allData.quests : [];
			for (const q of quests) {
				if (!q || q.preview === true) continue;
				const rewards = q.config?.rewards_config?.rewards;
				if (!Array.isArray(rewards)) continue;
				const completed = Boolean(q.user_status?.completed_at);
				const claimed = Boolean(q.user_status?.claimed_at);
				if (completed && !claimed) {
					for (const r of rewards) {
						if (typeof r.orb_quantity === 'number') pendingClaim += r.orb_quantity;
					}
				}
			}
		}

		return { ok: true, balance, pendingClaim, source, totalQuests: claimedQuests.length };
	} catch (err) {
		return { ok: false, message: `Không kết nối được Discord: ${err.message}` };
	}
});

/**
 * Waves 31 — CLAIM THẬT từ Electron main (không cần bot process sống).
 * Main đã có sẵn hạ tầng fetch tới discord.com/api/v10 (xem orbs:fetch),
 * nên claim cũng gọi trực tiếp tại đây — cùng Authorization token, cùng origin.
 *
 * Luồng (dựng lại đúng client Discord, KHÔNG bypass captcha):
 *   1. POST /quests/{id}/claim-reward  → Discord có thể trả 400 + captcha_*
 *   2. Nếu captcha: renderer mở modal hCaptcha → user giải (người thật) →
 *      renderer gọi lại quests:claim kèm captchaKey.
 *   3. Discord xác minh token do người thật tạo → cấp thưởng.
 *
 * Trả về TRUNG THỰC: { ok:true, orbs } | { ok:false, captchaRequired, captcha }
 *                  | { ok:false, message }
 */
function buildClaimBody(quest, captcha) {
	// Waves 32: ưu tiên platform THẬT do UI gửi lên (bot đã đọc từ rewards_config);
	// fallback sang quest.config nếu UI chưa có. Gửi sai platform dễ bị Discord từ chối.
	const fromQuest = quest?.platform;
	const rewardsConfig = quest?.config?.rewards_config || {};
	const platform =
		typeof fromQuest === 'number'
			? fromQuest
			: Array.isArray(rewardsConfig.platforms) && rewardsConfig.platforms.length
				? rewardsConfig.platforms[0]
				: 0;
	const body = {
		platform,
		location: 11,
		is_targeted: false,
		metadata_raw: null,
		metadata_sealed: null,
		traffic_metadata_raw: quest?.traffic_metadata_raw ?? null,
		traffic_metadata_sealed: quest?.traffic_metadata_sealed ?? null,
	};
	if (captcha?.captchaKey) {
		body.captcha_key = String(captcha.captchaKey).trim();
		if (captcha.captchaRqdata) body.captcha_rqdata = captcha.captchaRqdata;
		if (captcha.captchaRqtoken) body.captcha_rqtoken = captcha.captchaRqtoken;
		if (captcha.captchaSessionId) body.captcha_session_id = captcha.captchaSessionId;
	}
	return body;
}

function extractCaptchaFromError(status, errorBody) {
	if (!errorBody || typeof errorBody !== 'object') return null;
	// Discord trả captcha_sitekey/hcaptcha cho claim bị chặn xác minh.
	const key = errorBody.captcha_key;
	const sitekey = errorBody.captcha_sitekey;
	if (!key && !sitekey) return null;
	return {
		sitekey: sitekey || '',
		service: errorBody.captcha_service || 'hcaptcha',
		sessionId: errorBody.captcha_session_id || '',
		rqdata: errorBody.captcha_rqdata || '',
		rqtoken: errorBody.captcha_rqtoken || '',
		status,
	};
}

/**
 * Waves 33 — gọi 1 lần POST claim-reward, tự chờ & thử lại 1 lần khi bị Discord
 * giới hạn tốc độ (429 + retry_after). Trả về { res, data } đồng nhất cho caller.
 * Không retry vô hạn: tối đa 1 lần chờ lại để tránh vòng lặp khoá tài khoản.
 */
async function postClaimOnce(token, questId, body) {
	let res = await fetch(
		`https://discord.com/api/v10/quests/${encodeURIComponent(questId)}/claim-reward`,
		{
			method: 'POST',
			// Waves 40: header ĐẦY ĐỦ + NHẤT QUÁN (XSP khớp UA, referer quest-home).
			// Đây là cách client Discord thật gửi — xem electron/discordIdentity.js.
			headers: discordHeaders(token, { json: true, questRoute: true }),
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(20000),
		},
	);

	let data = null;
	try {
		data = await res.json();
	} catch {
		data = null;
	}

	if (!app.isPackaged) {
		console.log(
			`[claim] POST /quests/${questId}/claim-reward → HTTP ${res.status}` +
				(body.captcha_key ? ' (có captcha_key)' : ''),
		);
		console.log('[claim] body gửi:', JSON.stringify(body));
		console.log('[claim] Discord trả:', JSON.stringify(data));
	}

	// 429: Discord yêu cầu chờ. Đọc retry_after (giây) rồi thử lại đúng 1 lần.
	if (res.status === 429) {
		let waitSec = Number(data?.retry_after);
		if (!Number.isFinite(waitSec) || waitSec < 0) waitSec = 3;
		// Kẹp trần 10s để không treo UI; Discord thường trả 1–9s.
		waitSec = Math.min(waitSec, 10);
		if (!app.isPackaged) {
			console.log(`[claim] Bị giới hạn tốc độ — chờ ${waitSec.toFixed(2)}s rồi thử lại 1 lần…`);
		}
		await new Promise((r) => setTimeout(r, Math.ceil(waitSec * 1000) + 250));

		res = await fetch(
			`https://discord.com/api/v10/quests/${encodeURIComponent(questId)}/claim-reward`,
			{
				method: 'POST',
				headers: discordHeaders(token, { json: true, questRoute: true }),
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(20000),
			},
		);
		try {
			data = await res.json();
		} catch {
			data = null;
		}
		if (!app.isPackaged) {
			console.log(`[claim] Thử lại sau chờ → HTTP ${res.status}`);
			console.log('[claim] Discord trả:', JSON.stringify(data));
		}
	}

	return { res, data };
}

/**
 * Waves 33 — HÀNG ĐỢI CLAIM TOÀN CỤC (nối tiếp, có kỷ luật tần suất).
 *
 * Vì sao cần: Discord siết `claim-reward` quanh mức ~1 req/s theo user. Bấm nhiều
 * thẻ liên tiếp (hoặc hàng loạt) → dính 429 và bị "che" mất lỗi thật. Hàng đợi này
 * đảm bảo: mỗi thời điểm chỉ 1 claim bay, cách nhau tối thiểu CLAIM_MIN_GAP_MS,
 * và nếu Discord trả retry_after thì CẢ hàng đợi cùng chờ (không đánh thức sớm).
 */
const CLAIM_MIN_GAP_MS = 1200;
let claimChain = Promise.resolve();
let claimBlockedUntil = 0; // mốc thời gian (ms) Discord yêu cầu không gửi thêm

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

/** Xếp 1 tác vụ claim vào cuối hàng đợi, tôn trọng khoảng cách + lệnh chặn 429. */
function enqueueClaim(task) {
	const run = claimChain.then(async () => {
		// 1) Chờ lệnh chặn 429 (nếu có) — toàn bộ hàng đợi cùng tuân thủ.
		const blockedFor = claimBlockedUntil - Date.now();
		if (blockedFor > 0) await sleep(blockedFor + 250);
		// 2) Khoảng cách tối thiểu giữa 2 request liên tiếp.
		await sleep(CLAIM_MIN_GAP_MS);
		// 3) Ghi nhận lệnh chặn mới nếu Discord vừa trả retry_after.
		const { res, data } = await task();
		if (res && res.status === 429) {
			const sec = Number(data?.retry_after);
			if (Number.isFinite(sec) && sec > 0) {
				claimBlockedUntil = Date.now() + sec * 1000;
				if (!app.isPackaged) {
					console.log(`[claim] Discord yêu cầu chờ ${sec.toFixed(2)}s — khoá cả hàng đợi.`);
				}
			}
		}
		return { res, data };
	});
	// Không để 1 tác vụ lỗi làm đứt chuỗi (mọi promise sau vẫn chạy).
	claimChain = run.catch(() => null);
	return run;
}

ipcMain.handle('quests:claim', async (_e, payload) => {
	const token = String(payload?.token || '').trim();
	const quest = payload?.quest || null;
	const questId = String(payload?.questId || quest?.id || '').trim();
	if (!token) return { ok: false, message: 'Chưa có Token Discord.' };
	if (!quest || !questId) return { ok: false, message: 'Thiếu dữ liệu nhiệm vụ.' };

	try {
		const body = buildClaimBody(quest, {
			captchaKey: payload?.captchaKey,
			captchaRqdata: payload?.captchaRqdata,
			captchaRqtoken: payload?.captchaRqtoken,
			captchaSessionId: payload?.captchaSessionId,
		});

		// Waves 33: đẩy qua hàng đợi nối tiếp (xem enqueueClaim) để không dính 429
		// do bấm dồn dập. postClaimOnce vẫn tự thử lại 1 lần sau retry_after.
		const { res, data } = await enqueueClaim(() => postClaimOnce(token, questId, body));

		if (res.ok) {
			// Discord xác nhận → trả số orb nếu có (orb_quantity_claimed / balance).
			return { ok: true, orbs: data?.orb_quantity_claimed ?? null, raw: data };
		}

		// 404: quest không còn tồn tại trên Discord (thẻ cũ/đã gỡ) — KHÔNG phải lỗi mạng.
		if (res.status === 404) {
			return {
				ok: false,
				notFound: true,
				status: 404,
				message: 'Nhiệm vụ này Discord đã gỡ — không còn tồn tại để nhận.',
			};
		}

		// 403 code 260004: quest không hỗ trợ nền tảng đang gửi (sai platform).
		if (res.status === 403 && data?.code === 260004) {
			return {
				ok: false,
				wrongPlatform: true,
				status: 403,
				message: data?.message || 'Nhiệm vụ không hỗ trợ nền tảng này.',
			};
		}

		// 429 sau khi đã thử lại: trả trung thực, renderer cho bấm lại sau.
		if (res.status === 429) {
			const waitSec = Number(data?.retry_after);
			return {
				ok: false,
				rateLimited: true,
				status: 429,
				retryAfter: Number.isFinite(waitSec) ? waitSec : null,
				message: data?.message || 'Discord đang giới hạn tốc độ — thử lại sau vài giây.',
			};
		}

		// Không ok → kiểm tra captcha
		const captcha = extractCaptchaFromError(res.status, data);
		if (captcha) {
			return { ok: false, captchaRequired: true, captcha, message: data?.message || 'Discord yêu cầu xác minh.' };
		}

		return {
			ok: false,
			status: res.status,
			// Waves 37: kèm `code` để renderer phân biệt 403·10008 (đã qua captcha,
			// lỗi trao thưởng) với các 403 khác — tránh báo lỗi chung chung.
			code: data?.code ?? null,
			message:
				data?.message ||
				(res.status === 401
					? 'Token không hợp lệ.'
					: `Discord trả lỗi ${res.status}.`),
			raw: data,
		};
	} catch (err) {
		return { ok: false, message: `Không kết nối được Discord: ${err.message}` };
	}
});

ipcMain.handle('clipboard:read', () => clipboard.readText());ipcMain.handle('clipboard:write', (_e, text) => {
	clipboard.writeText(String(text || ''));
	return { ok: true };
});ipcMain.handle('shell:open-data-folder', () => {
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

/**
 * Waves 40 (B) — MỞ ĐÚNG TRANG QUEST TRONG DISCORD THẬT.
 *
 * Học từ repo discord-quest-helper: bước NHẬN THƯỞNG là bước dính captcha, và họ
 * KHÔNG tự claim — họ `navigateDiscordSpa('/quest-home#<id>')` để người dùng bấm
 * Claim NGAY TRONG Discord thật, nơi hCaptcha chạy native.
 *
 * Ta làm tương tự nhưng không cần CDP: ưu tiên DEEP LINK `discord://-/quest-home`
 * (mở app Discord cài sẵn, còn đăng nhập, captcha hợp lệ), fallback sang web.
 * KHÔNG bypass gì — chỉ đưa người dùng tới đúng nơi Discord cho phép nhận.
 */
ipcMain.handle('shell:open-quest', async (_e, questId) => {
	const id = String(questId || '').trim();
	const webUrl = id
		? `https://discord.com/quest-home#${encodeURIComponent(id)}`
		: 'https://discord.com/quest-home';
	// Deep link: Discord desktop dùng scheme `discord://-/<route>`
	const deepLink = id
		? `discord://-/quest-home#${encodeURIComponent(id)}`
		: 'discord://-/quest-home';
	try {
		// Thử mở APP TRƯỚC (captcha chạy trong Chromium của Discord → hợp lệ 100%).
		await shell.openExternal(deepLink);
		if (!app.isPackaged) console.log(`[open-quest] deep link → ${deepLink}`);
		return { ok: true, via: 'app', url: deepLink };
	} catch (err) {
		// Không có app Discord → mở web (người dùng vẫn đăng nhập được).
		try {
			await shell.openExternal(webUrl);
			if (!app.isPackaged) console.log(`[open-quest] fallback web → ${webUrl}`);
			return { ok: true, via: 'web', url: webUrl };
		} catch (err2) {
			return { ok: false, message: err2.message || err.message };
		}
	}
});

/* ───────────────────────────────────────────────────────────────────────────
 * Waves 40 (C) — CDP: nói chuyện với Discord THẬT.
 *
 * Học từ repo discord-quest-helper: thay vì tự gọi API (dính captcha passive),
 * ta nối vào chính Discord đang chạy và để NÓ gửi request — phiên thật, chữ ký
 * thật, hCaptcha native. Đây không phải bypass: vẫn để Discord tự quyết định.
 * ─────────────────────────────────────────────────────────────────────────── */

/** Trạng thái CDP: Discord có đang mở cổng debug không? */
ipcMain.handle('cdp:status', async (_e, port) => {
	try {
		return { ok: true, ...(await cdp.status(port)) };
	} catch (err) {
		return { ok: false, available: false, reason: err.message };
	}
});

/** Đọc SuperProperties SỐNG từ Discord (nguồn chân lý, thay vì dựng giả). */
ipcMain.handle('cdp:super-properties', async (_e, port) => {
	const r = await cdp.evaluate(cdp.JS_GET_SUPER_PROPERTIES, { port });
	if (!r.ok) return r;
	if (r.value && r.value.error) return { ok: false, error: r.value.error };
	return r;
});

/** Đọc RunningGameStore — Discord đang thấy "game" nào đang chạy. */
ipcMain.handle('cdp:running-games', async (_e, port) => {
	const r = await cdp.evaluate(cdp.JS_READ_RUNNING_GAMES, { port });
	if (!r.ok) return r;
	if (r.value && r.value.error) return { ok: false, error: r.value.error };
	return r;
});

/** Điều hướng SPA của Discord tới trang quest (đúng như navigateDiscordSpa). */
ipcMain.handle('cdp:navigate-quest', async (_e, questId, port) => {
	return cdp.evaluate(cdp.jsNavigateToQuest(questId), { port });
});

/**
 * Chạy JS tuỳ ý trong Discord (chỉ khi dev / có công tắc). Dùng cho chẩn đoán.
 * KHÔNG nhận input từ người dùng cuối để tránh lạm dụng.
 */
ipcMain.handle('cdp:evaluate', async (_e, expression, port) => {
	if (typeof expression !== 'string' || expression.length > 20000) {
		return { ok: false, error: 'Biểu thức không hợp lệ.' };
	}
	return cdp.evaluate(expression, { port });
});

/**
 * Waves 48 — KIỂU TÊN HIỂN THỊ (Discord Display Name Styles).
 *
 * NGUỒN: API Discord (`/users/@me` → `display_name_styles`), KHÔNG cần Discord
 * đang mở. Bảng font/effect/hiệu ứng là dữ liệu thật chép từ server Discord
 * (xem đầu file electron/displayNameStyle.js).
 *
 * Thứ tự: API → cache theo user id. Không có kiểu (tài khoản không Nitro) thì
 * trả ok:false để renderer dùng font mặc định — KHÔNG bịa kiểu.
 */
ipcMain.handle('dns:read', async (_e, payload) => {
	const p = payload && typeof payload === 'object' ? payload : {};
	const displayName = typeof p.displayName === 'string' ? p.displayName : '';
	const userId = p.userId != null ? String(p.userId) : '';
	const token = typeof p.token === 'string' ? cleanToken(p.token) : '';

	/* 1) Đọc tươi từ Discord bằng token. */
	if (token) {
		try {
			const res = await fetch('https://discord.com/api/v10/users/@me', {
				headers: discordHeaders(token),
				signal: AbortSignal.timeout(10000),
			});
			if (res.ok) {
				const user = await res.json();
				const raw = displayNameStyle.pickStyle(user);
				if (raw) {
					const style = displayNameStyle.buildDescriptor(raw, displayName);
					style.source = 'api';
					displayNameStyle.writeCachedStyle(app, userId || user.id, style);
					return { ok: true, style, source: 'api' };
				}
				/* Tài khoản không đặt kiểu → xoá cache cũ để không hiện style lạc. */
				displayNameStyle.writeCachedStyle(app, userId || user.id, { ok: false, at: Date.now() });
				return { ok: false, error: 'Tài khoản này không đặt kiểu tên hiển thị.' };
			}
		} catch {
			/* rơi xuống cache */
		}
	}

	/* 2) Cache của lần đọc thành công trước. */
	const cached = displayNameStyle.readCachedStyle(app, userId);
	if (cached && cached.ok) return { ok: true, style: cached, source: 'cache' };

	return { ok: false, error: 'Chưa đọc được kiểu tên hiển thị.' };
});

/** Tải (và cache) ĐÚNG file font Discord dùng theo TÊN FAMILY → trả data URL. */
ipcMain.handle('dns:font', async (_e, family) => {
	if (typeof family !== 'string' || family.length > 60) return { ok: false, error: 'Tên font không hợp lệ.' };
	return displayNameStyle.ensureFontDataUrl(app, family);
});

/**
 * Mở lại Discord KÈM cổng debug (điều kiện tiên quyết để CDP hoạt động).
 * Ta KHÔNG tự giết Discord của người dùng — chỉ mở thêm nếu chưa có cổng.
 */
ipcMain.handle('cdp:launch-with-debug', async (_e, port) => {
	const p = Number(port) || cdp.DEFAULT_CDP_PORT;
	// Nếu đã sẵn sàng thì không cần mở thêm.
	const st = await cdp.status(p);
	if (st.available) return { ok: true, alreadyRunning: true, port: st.port };

	if (process.platform !== 'win32') {
		return {
			ok: false,
			message:
				'Cần chạy Discord thủ công kèm cờ --remote-debugging-port=' +
				p +
				' (xem hướng dẫn trong app).',
		};
	}

	// Windows: tìm Discord.exe theo các đường dẫn cài đặt phổ biến.
	const candidates = [
		path.join(process.env.LOCALAPPDATA || '', 'Discord', 'Update.exe'),
		path.join(process.env.LOCALAPPDATA || '', 'Discord', 'app-1.0.9262', 'Discord.exe'),
	];
	// Update.exe nhận cờ --processStart để chạy client kèm tham số.
	const updateExe = candidates.find((c) => c && fs.existsSync(c) && /Update\.exe$/.test(c));
	try {
		if (updateExe) {
			spawn(updateExe, ['--processStart', 'Discord.exe', '--process-start-args', `--remote-debugging-port=${p}`], {
				detached: true,
				stdio: 'ignore',
			}).unref();
		} else {
			// Fallback: để shell mở scheme (không kèm được cờ) → báo rõ cho người dùng.
			return {
				ok: false,
				message:
					'Không tìm thấy Update.exe của Discord. Hãy đóng Discord rồi mở lại bằng lệnh:\n' +
					`"Discord.exe" --remote-debugging-port=${p}`,
			};
		}
		return { ok: true, launched: true, port: p };
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

/**
 * Waves 45b — tách nội dung file .txt `khoá = giá trị` thành map.
 * Dùng cho file token tài khoản bro tự tạo. `#` và `//` là chú thích.
 */
function parseKeyValue(text) {
	const map = {};
	for (const rawLine of String(text || '').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#') || line.startsWith('//')) continue;
		const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*[=:]\s*(.+)$/);
		if (!m) continue;
		map[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
	}
	return map;
}

/**
 * Waves 45b — NẠP TOKEN TÀI KHOẢN NGƯỜI DÙNG từ file .txt.
 * Đây là ĐĂNG NHẬP THẬT: token này thuộc về chính bro nên mới gọi được
 * /quests/@me và claim-reward. Khác hoàn toàn bot_token.
 * Trả về CHỈ {ok, length} — tuyệt đối không trả token về renderer.
 */
ipcMain.handle('usertoken:import-txt', async () => {
	try {
		const pick = await dialog.showOpenDialog(mainWindow, {
			title: 'Chọn file .txt chứa token tài khoản Discord của bạn',
			properties: ['openFile'],
			filters: [{ name: 'Text', extensions: ['txt'] }],
		});
		if (pick.canceled || !pick.filePaths || !pick.filePaths.length) {
			return { ok: false, canceled: true };
		}
		const file = pick.filePaths[0];
		// File có thể chỉ là token trần, hoặc dạng `token = ...`.
		let token = fs.readFileSync(file, 'utf8').trim();
		if (/[\r\n]/.test(token) || token.includes('=')) {
			const map = parseKeyValue(token);
			token = (map.token || map.user_token || map.userToken || map.discord_token || '').trim() || token;
		}
		token = token.replace(/^["']|["']$/g, '').replace(/\s+/g, '');
		if (!token || token.length < 30) {
			return { ok: false, message: 'File không chứa token hợp lệ (quá ngắn).' };
		}
		// Token user Discord: 3 phần ngăn bởi dấu chấm, phần đầu là base64 id.
		if (!/^[\w-]{20,}\.[\w-]{5,}\.[\w-]{15,}$/.test(token)) {
			return { ok: false, message: 'Không giống token tài khoản Discord (cần 3 phần ngăn bởi dấu chấm).' };
		}
		pendingUserToken = token;
		// TUYỆT ĐỐI không log giá trị — chỉ log đã nhận từ file nào.
		pushLog('system', `Đã nạp token tài khoản từ ${path.basename(file)} — bấm "Đăng nhập" để hoàn tất.`);
		return { ok: true, source: path.basename(file), length: token.length };
	} catch (err) {
		return { ok: false, message: err.message };
	}
});

/** Waves 45b — renderer lấy token vừa nạp để đăng nhập. Đọc MỘT LẦN rồi xoá khỏi RAM. */
ipcMain.handle('usertoken:take', () => {
	if (!pendingUserToken) return { ok: false, message: 'Chưa nạp token tài khoản nào.' };
	const t = pendingUserToken;
	pendingUserToken = '';
	return { ok: true, token: t };
});

/** Waves 45b — xoá token đang chờ (người dùng bấm huỷ). */
ipcMain.handle('usertoken:discard', () => {
	const had = !!pendingUserToken;
	pendingUserToken = '';
	return { ok: true, had };
});

/** Waves 45b — trạng thái token tài khoản: CHỈ trả độ dài, KHÔNG trả giá trị. */
ipcMain.handle('usertoken:pending-status', () => ({
	ok: true,
	pending: !!pendingUserToken,
	length: pendingUserToken.length,
}));
