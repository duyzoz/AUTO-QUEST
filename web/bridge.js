'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   BRIDGE WEB — thay thế electron/preload.js + phần IPC của electron/main.js.

   Renderer KHÔNG đổi một dòng nào: nó vẫn chỉ gọi `window.autoquest.<hàm>`.
   Ở đây ta cài đặt đúng bộ hàm đó bằng API trình duyệt:

     token        → IndexedDB + WebCrypto AES-GCM (khoá không xuất được)
     config/list  → IndexedDB (fallback: localStorage mã hoá base64)
     engine       → Web Worker (web/engine-worker.js) — "Dừng" = terminate
     claim/ví/hồ sơ → fetch thẳng discord.com (CORS đã đo là mở)
     font tên     → 12 file woff2 nhúng sẵn trong web/fonts/
     CDP          → không có trên web, trả available:false

   Toàn bộ dữ liệu nằm trong máy người dùng. Không có server trung gian nào
   nhìn thấy token (đúng quyết định D1 trong docs/AGENT-BRIEF.md).
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
	const identity = window.AQIdentity;
	const dnsStyle = window.AQDisplayName;
	const cleanToken = identity.cleanToken;
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

	/* ══════════════════════ 1. KHO DỮ LIỆU CỤC BỘ ══════════════════════════ */

	const DB_NAME = 'autoquest-web';
	const DB_VERSION = 1;
	const LS_KEY = 'autoquest.kv.v1';
	let dbPromise = null;
	let storageMode = 'idb';

	function openDb() {
		if (dbPromise) return dbPromise;
		dbPromise = new Promise((resolve, reject) => {
			let req;
			try {
				req = indexedDB.open(DB_NAME, DB_VERSION);
			} catch (err) {
				reject(err);
				return;
			}
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error || new Error('IndexedDB lỗi'));
			req.onblocked = () => reject(new Error('IndexedDB bị chặn'));
		}).catch((err) => {
			dbPromise = null;
			storageMode = 'local';
			throw err;
		});
		return dbPromise;
	}

	function lsRead() {
		try {
			return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {};
		} catch {
			return {};
		}
	}
	function lsWrite(obj) {
		try {
			localStorage.setItem(LS_KEY, JSON.stringify(obj));
			return true;
		} catch {
			return false;
		}
	}

	async function kvGet(key) {
		if (storageMode === 'local') return lsRead()[key];
		try {
			const db = await openDb();
			return await new Promise((resolve, reject) => {
				const tx = db.transaction('kv', 'readonly');
				const req = tx.objectStore('kv').get(key);
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			});
		} catch {
			return lsRead()[key];
		}
	}

	async function kvPut(key, value) {
		if (storageMode === 'local') {
			const all = lsRead();
			all[key] = value;
			if (!lsWrite(all)) throw new Error('Không ghi được localStorage.');
			return;
		}
		try {
			const db = await openDb();
			await new Promise((resolve, reject) => {
				const tx = db.transaction('kv', 'readwrite');
				tx.objectStore('kv').put(value, key);
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			});
		} catch (err) {
			const all = lsRead();
			all[key] = value;
			lsWrite(all);
		}
	}

	function b64FromBytes(bytes) {
		let bin = '';
		const arr = new Uint8Array(bytes);
		for (let i = 0; i < arr.length; i += 0x8000) {
			bin += String.fromCharCode.apply(null, arr.subarray(i, i + 0x8000));
		}
		return btoa(bin);
	}
	function bytesFromB64(text) {
		const bin = atob(String(text || ''));
		const out = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
		return out;
	}

	let deviceKeyPromise = null;
	function getDeviceKey() {
		if (deviceKeyPromise) return deviceKeyPromise;
		deviceKeyPromise = (async () => {
			if (!(self.crypto && crypto.subtle && storageMode === 'idb')) return null;
			try {
				const existing = await kvGet('deviceKey');
				if (existing) return existing;
				const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
					'encrypt',
					'decrypt',
				]);
				await kvPut('deviceKey', key);
				return key;
			} catch {
				return null;
			}
		})();
		return deviceKeyPromise;
	}

	/** Mã hoá token trước khi ghi xuống đĩa.
	 *  Wave#134 (audit): BỎ ĐƯỜNG GIÁNG CẤP base64. Bản cũ trả 'b64:'+b64(token) khi
	 *  crypto.subtle/IndexedDB không dùng được (chế độ ẩn danh, ETP/Firefox chặn IDB)
	 *  ⇒ token nằm trên đĩa dưới dạng đảo ngược tức thì: malware đọc profile hoặc
	 *  ai đó mở DevTools là có token. Nay không có khoá = KHÔNG lưu token; phiên chỉ
	 *  sống trong RAM và UI được báo để hiện cảnh báo. Trả null = "không lưu được". */
	let secureStorage = true;
	async function encryptToken(text) {
		if (!text) return '';
		const key = await getDeviceKey();
		if (!key) {
			secureStorage = false;
			return null;
		}
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(String(text)));
		secureStorage = true;
		return 'aes:' + b64FromBytes(iv) + ':' + b64FromBytes(new Uint8Array(ct));
	}

	async function decryptToken(payload) {
		if (!payload || typeof payload !== 'string') return '';
		/* Wave#134: vẫn ĐỌC được bản 'b64:' cũ (không làm mất tài khoản của người đã
		   lưu từ bản trước) nhưng chỉ để di chuyển sang AES ngay — xem migrateLegacy(). */
		if (payload.startsWith('b64:')) {
			try {
				return new TextDecoder().decode(bytesFromB64(payload.slice(4)));
			} catch {
				return '';
			}
		}
		if (payload.startsWith('aes:')) {
			const parts = payload.split(':');
			if (parts.length !== 3) return '';
			const key = await getDeviceKey();
			if (!key) return '';
			try {
				const pt = await crypto.subtle.decrypt(
					{ name: 'AES-GCM', iv: bytesFromB64(parts[1]) },
					key,
					bytesFromB64(parts[2]),
				);
				return new TextDecoder().decode(pt);
			} catch {
				return '';
			}
		}
		return '';
	}

	/* Một lần / phiên: nâng cấp mọi tokenEnc còn ở dạng 'b64:' sang AES-GCM rồi ghi lại.
	   Ghi bằng kvPut trực tiếp (không đi qua readConfig) để không đệ quy; hẹn ra
	   microtask sau để không lồng ghi vào lúc đang đọc trong withConfigLock. */
	let legacyMigrationDone = false;
	function scheduleLegacyMigration(parsed) {
		if (legacyMigrationDone) return;
		const dirty =
			typeof parsed?.tokenEnc === 'string' && parsed.tokenEnc.startsWith('b64:')
				|| (Array.isArray(parsed?.accounts) && parsed.accounts.some((a) => typeof a?.tokenEnc === 'string' && a.tokenEnc.startsWith('b64:')));
		if (!dirty) return;
		legacyMigrationDone = true;
		setTimeout(async () => {
			try {
				const fresh = (await kvGet('config')) || {};
				let changed = 0;
				if (typeof fresh.tokenEnc === 'string' && fresh.tokenEnc.startsWith('b64:')) {
					const pt = await decryptToken(fresh.tokenEnc);
					const enc = pt ? await encryptToken(pt) : null;
					if (enc) {
						fresh.tokenEnc = enc;
						changed++;
					}
				}
				for (const acc of Array.isArray(fresh.accounts) ? fresh.accounts : []) {
					if (typeof acc?.tokenEnc === 'string' && acc.tokenEnc.startsWith('b64:')) {
						const pt = await decryptToken(acc.tokenEnc);
						const enc = pt ? await encryptToken(pt) : null;
						if (enc) {
							acc.tokenEnc = enc;
							changed++;
						}
					}
				}
				if (changed) {
					await kvPut('config', fresh);
					pushLog('system', `Đã tự nâng cấp ${changed} token sang AES-GCM (bản cũ lưu dạng base64 không an toàn).`);
				}
			} catch {
				/* lần sau thử lại */
			}
		}, 0);
	}

	/** Wave#134 (audit):_masks mọi chuỗi trông như token Discord / GitHub / bearer
	   TRƯỚC khi dòng log rời engine. Trước đây engine-bundle có sanitizeLog() nhưng
	   KHÔNG GỌI ở đâu ⇒ token lọt vào log màn hình (and vào file log người dùng export). */
	const SECRET_PATTERNS = [
		/[\w-]{23,26}\.[\w-]{5,32}\.[\w-]{25,110}/g, // Discord user token: 3 phần cách dấu chấm
		/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
		/\b(nt|ot)[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{25,}\b/g,
		/(Authorization\s*:\s*)Bearer\s+\S+/gi,
		/("token"\s*:\s*")[^"]{20,}(")/gi,
	];
	function maskSecrets(line) {
		let out = String(line ?? '');
		for (const re of SECRET_PATTERNS) out = out.replace(re, (m, a, b) => (a && b ? `${a}***${b}` : a ? `${a}***` : '***'));
		return out;
	}

	/* ═════════════ 2b. TIẾT LỘ TOKEN THEO Ý NGƯỜI DÙNG (Wave#134) ═════════════
	   Token không còn nằm trong kết quả getConfig()/accountsList() — kẻ xâm nhập
	   thụ động (script bên thứ ba, XSS đọc config, log) không còn lấy được nó "miễn
	   phí". Ai cần thấy token thật phải gọi tokenReveal() và phải có một thao tác
	   THẬT của người dùng (isTrusted) hoặc đang trong 6 giây đầu của trang (để tự
	   đăng nhập khi mở lại). Same-origin XSS + mồi được một cú click vẫn lấy được:
	   web thuần không đóng nổi khe đó — chốt thật là CSP nghiêm + không còn sink. */
	let gestureArmed = false;
	let bootWindowUntil = Date.now() + 6000;
	function armGesture() {
		gestureArmed = true;
	}
	if (typeof document !== 'undefined') {
		for (const ev of ['pointerdown', 'keydown', 'touchstart', 'visibilitychange']) {
			document.addEventListener(ev, (e) => {
				if (ev === 'visibilitychange') {
					if (document.visibilityState === 'visible') armGesture();
					return;
				}
				if (e && e.isTrusted) armGesture();
			}, { capture: true, passive: true });
		}
	}
	function maskToken(t) {
		const s = String(t ?? '');
		if (!s) return '';
		return s.length <= 8 ? '••••' : `••••${s.slice(-4)}`;
	}

	/* ══════════════════════ 2. CONFIG / ACCOUNTS ══════════════════════════ */

	const CONFIG_DEFAULTS = {
		token: '',
		remember: true,
		loopMode: true,
		loopInterval: 30,
		autoScroll: true,
		theme: 'dark',
		lang: 'vi',
		liteMode: false,
		autoLockMin: 0,
		accounts: [],
		activeIdx: 0,
	};

	async function readConfig() {
		let parsed = {};
		try {
			parsed = (await kvGet('config')) || {};
		} catch {
			parsed = {};
		}
		let token = '';
		scheduleLegacyMigration(parsed); // Wave#134: dọn bản 'b64:' cũ sang AES
		if (parsed.tokenEnc) token = await decryptToken(parsed.tokenEnc);
		const list = Array.isArray(parsed.accounts) ? parsed.accounts : [];
		const accounts = [];
		for (const acc of list) {
			if (!acc) continue;
			let accToken = '';
			if (acc.tokenEnc) accToken = await decryptToken(acc.tokenEnc);
			accounts.push({
				id: typeof acc.id === 'string' ? acc.id : '',
				username: typeof acc.username === 'string' ? acc.username : '',
				displayName: typeof acc.displayName === 'string' ? acc.displayName : '',
				avatar: typeof acc.avatar === 'string' ? acc.avatar : '',
				token: accToken,
			});
		}
		const activeIdx =
			typeof parsed.activeIdx === 'number' && parsed.activeIdx >= 0 && parsed.activeIdx < accounts.length
				? parsed.activeIdx
				: 0;
		return {
			token,
			remember: parsed.remember !== false,
			loopMode: parsed.loopMode !== false,
			loopInterval: typeof parsed.loopInterval === 'number' ? parsed.loopInterval : 30,
			autoScroll: parsed.autoScroll !== false,
			theme: parsed.theme === 'light' ? 'light' : 'dark',
			lang: parsed.lang === 'en' ? 'en' : 'vi',
			liteMode: parsed.liteMode === true,
			autoLockMin: [0, 5, 15, 30].includes(Number(parsed.autoLockMin)) ? Number(parsed.autoLockMin) : 0,
			accounts,
			activeIdx,
		};
	}

	async function writeConfig({ token, remember, loopMode, loopInterval, autoScroll, theme, lang, liteMode, autoLockMin, accounts, activeIdx }) {
		const payload = {
			remember: remember !== false,
			loopMode: loopMode !== false,
			loopInterval: typeof loopInterval === 'number' ? loopInterval : 30,
			autoScroll: autoScroll !== false,
			theme: theme === 'light' ? 'light' : 'dark',
			lang: lang === 'en' ? 'en' : 'vi',
			liteMode: liteMode === true,
			autoLockMin: [0, 5, 15, 30].includes(Number(autoLockMin)) ? Number(autoLockMin) : 0,
		};
		/* Wave#134: encryptToken trả null khi KHÔNG mã hoá được (không crypto / IDB bị
		   chặn) ⇒ tuyệt đối không ghi token plaintext xuống localStorage. Các thiết
		   lập khác vẫn lưu bình thường; UI hỏi secureStorage() để hiện cảnh báo.
		   collectConfig() gửi token = ô nhập, mà ô nhập RỖNG khi người dùng chưa reveal
		   ⇒ nếu không giữ bản cũ thì mỗi lần đổi theme/ngôn ngữ là bay token đăng nhập.
		   Đường xoá token thật vẫn còn: đăng xuất lưu remember:false. */
		let prev = {};
		try {
			prev = (await kvGet('config')) || {};
		} catch {
			prev = {};
		}
		let droppedToken = false;
		let wroteNewToken = false;
		if (remember && token) {
			const enc = await encryptToken(token);
			if (enc) {
				payload.tokenEnc = enc;
				wroteNewToken = true;
			} else droppedToken = true;
		}
		if (!wroteNewToken && remember && prev.tokenEnc) payload.tokenEnc = prev.tokenEnc;
		const prevAccounts = Array.isArray(prev.accounts) ? prev.accounts : [];
		if (Array.isArray(accounts)) {
			/* Wave#134: accountsList() không còn trả token ⇒ khi renderer ghi lại danh sách
			   phải lấy tokenEnc của bản đang lưu (merge theo id), nếu không mỗi lần đổi
			   cài đặt là xoá sạch token multiaccount. Tài khoản bị gỡ khỏi mảng thì mất
			   tokenEnc đúng theo ý người dùng. */
			const saved = [];
			for (const acc of accounts) {
				if (!acc) continue;
				const a = {
					id: acc.id || '',
					username: acc.username || '',
					displayName: acc.displayName || '',
					avatar: acc.avatar || '',
				};
				if (acc.token) {
					const enc = await encryptToken(acc.token);
					if (enc) a.tokenEnc = enc;
					else droppedToken = true;
				} else if (acc.id) {
					const old = prevAccounts.find((p) => p && p.id === acc.id && p.tokenEnc);
					if (old) a.tokenEnc = old.tokenEnc;
				}
				saved.push(a);
			}
			payload.accounts = saved;
			payload.activeIdx = typeof activeIdx === 'number' ? activeIdx : 0;
		} else if (remember && Array.isArray(prev.accounts)) {
			/* Không gửi mảng accounts ⇒ giữ nguyên danh sách đang lưu (đừng xoá
			   chỉ vì một lần lưu chỉ đổi theme). */
			payload.accounts = prevAccounts;
			payload.activeIdx = typeof prev.activeIdx === 'number' ? prev.activeIdx : 0;
		}
		await kvPut('config', payload);
		if (droppedToken) {
			pushLog('system', 'CẢNH BÁO: trình duyệt không cho mã hoá (chế độ ẩn danh / chặn IndexedDB) nên token KHÔNG được lưu — phiên này chỉ sống trong RAM, đóng tab là mất.');
		}
		return { ok: true, secureStorage: !droppedToken };
	}

	let configChain = Promise.resolve();
	function withConfigLock(fn) {
		const run = configChain.then(fn, fn);
		configChain = run.catch(() => {});
		return run;
	}

	/** Đọc → sửa → ghi danh sách account, y như mutateAccounts bên main.js. */
	function mutateAccounts(mutator) {
		return withConfigLock(async () => {
			const cfg = await readConfig();
			const result = mutator({
				accounts: cfg.accounts.map((a) => ({ ...a })),
				activeIdx: cfg.activeIdx,
			});
			const mainToken =
				result.activeIdx >= 0 && result.accounts[result.activeIdx]
					? result.accounts[result.activeIdx].token
					: cfg.token || '';
			await writeConfig({
				token: mainToken,
				remember: cfg.remember,
				loopMode: cfg.loopMode,
				loopInterval: cfg.loopInterval,
				autoScroll: cfg.autoScroll,
				theme: cfg.theme,
				lang: cfg.lang,
				liteMode: cfg.liteMode,
				autoLockMin: cfg.autoLockMin,
				accounts: result.accounts,
				activeIdx: result.activeIdx,
			});
			return result;
		});
	}

	/* ══════════════════════ 3. LOG / STATE / EVENT ══════════════════════════ */

	const listeners = { log: new Set(), event: new Set(), state: new Set() };
	let childState = 'idle';
	let logBuffer = '';
	const MAX_LOG_BUFFER = 200000;

	function emitTo(kind, payload) {
		for (const fn of Array.from(listeners[kind])) {
			try {
				fn(payload);
			} catch {
				/* listener của renderer lỗi không được làm sập bridge */
			}
		}
	}

	function setState(state, extra = {}) {
		childState = state;
		emitTo('state', { state, ...extra });
	}

	function pushLog(stream, line) {
		const stamped = `[${new Date().toLocaleTimeString('vi-VN')}] ${line}`;
		logBuffer += `${stamped}\n`;
		if (logBuffer.length > MAX_LOG_BUFFER) logBuffer = logBuffer.slice(-MAX_LOG_BUFFER);
		emitTo('log', { stream, line: stamped });
	}

	/* ══════════════════════ 4. HTTP TỚI DISCORD ══════════════════════════ */

	function discordHeaders(token, opts) {
		return identity.headers(token, opts || {});
	}

	/* ── Wave#119: nhật ký yêu cầu (không bao giờ chứa token/body) ──
	   100 mục gần nhất sống trong RAM; mất khi tải lại trang, đúng chủ đích
	   chẩn đoán. Chỉ ghi path + status + thời gian. */
	const REQUEST_LOG_MAX = 100;
	const requestLog = [];
	let requestSeq = 0;

	function recordRequest(entry) {
		requestSeq += 1;
		requestLog.push({ n: requestSeq, ...entry });
		if (requestLog.length > REQUEST_LOG_MAX) requestLog.splice(0, requestLog.length - REQUEST_LOG_MAX);
	}

	function maskUrl(url) {
		try {
			const u = new URL(String(url), location.href);
			return u.origin + u.pathname;
		} catch {
			return String(url).split('?')[0].slice(0, 120);
		}
	}

	async function trackedFetch(url, init) {
		const started = performance.now();
		const method = String((init && init.method) || 'GET').toUpperCase();
		try {
			const res = await fetch(url, init);
			recordRequest({
				at: new Date().toISOString(),
				method,
				url: maskUrl(url),
				status: res.status,
				ok: res.ok,
				ms: Math.round(performance.now() - started),
			});
			return res;
		} catch (err) {
			recordRequest({
				at: new Date().toISOString(),
				method,
				url: maskUrl(url),
				status: 0,
				ok: false,
				ms: Math.round(performance.now() - started),
				error: String((err && err.message) || err).slice(0, 120),
			});
			throw err;
		}
	}

	function requestLogText() {
		if (!requestLog.length) return 'Chưa có yêu cầu nào trong phiên này.';
		return requestLog
			.map((e) => {
				const t = String(e.at).slice(11, 19);
				const st = e.status || 'ERR';
				return `${String(e.n).padStart(3, '0')} ${t} ${e.method.padEnd(4)} ${st} ${String(e.ms).padStart(5)}ms  ${e.url}${e.error ? '  · ' + e.error : ''}`;
			})
			.join('\n');
	}

	async function discordJson(url, init, timeoutMs) {
		const res = await trackedFetch(url, {
			...init,
			signal: identity.timeoutSignal(timeoutMs || 10000),
		});
		let data = null;
		try {
			data = await res.json();
		} catch {
			data = null;
		}
		return { res, data };
	}

	/* ── Huy hiệu: bảng chuẩn chép từ main.js (Waves 18/19). ── */
	const BADGE_ICONS = {
		staff: 'https://discord.com/assets/48d5bdcffe9e7848067c2e187f1ef951.svg',
		partner: '3f9748e53446a137a052f3454e2de41e',
		certified_moderator: 'https://discord.com/assets/c981e58b5ea4b7fedd3a643cf0c60564.svg',
		hypesquad_online_house_1: '8a88d63823d8a71cd5e390baa45efa02',
		hypesquad_online_house_2: '011940fd013da3f7fb926e4a1cd2e618',
		hypesquad_online_house_3: '3aa41de486fa12454c3761e8e223442e',
		hypesquad_brilliance: '011940fd013da3f7fb926e4a1cd2e618',
		hypesquad_bravery: '8a88d63823d8a71cd5e390baa45efa02',
		hypesquad_balance: '3aa41de486fa12454c3761e8e223442e',
		bug_hunter: '2717692c7dca7289b35297368a940dd0',
		bug_hunter_level_1: '2717692c7dca7289b35297368a940dd0',
		bug_hunter_level_2: '848f79194d4be5ff5f81505cbd0ce1e6',
		active_developer: '6bdc42827a38498929a4920da12695d9',
		early_supporter: '7060786766c9c840eb3019e725d2b358',
		premium:
			'https://cdn.discordapp.com/assets/content/f61ddf640d11d9bdfaf9de265eb862edf28986b659e545f293b54adf229433af.svg',
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

	function collectBadges(user) {
		const map = new Map();
		for (const b of Array.isArray(user.badges) ? user.badges : []) {
			if (b && (b.icon || BADGE_ICONS[b.id])) {
				map.set(b.id || b.icon, {
					id: b.id || '',
					description: b.description || BADGE_LABELS[b.id] || '',
					icon: b.icon || BADGE_ICONS[b.id] || '',
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
		const premium = typeof user.premium_type === 'number' ? user.premium_type : 0;
		if (premium > 0 && !map.has('premium')) {
			map.set('premium', {
				id: 'premium',
				description: BADGE_LABELS.premium || 'Nitro',
				icon: BADGE_ICONS.premium,
				fallbackIcon: '',
			});
		}
		return [...map.values()];
	}

	/* ══════════════════════ 5. AUTH CHECK (hồ sơ + hiệu ứng) ══════════════════════ */

	async function authCheck(rawToken) {
		const clean = cleanToken(rawToken);
		if (!clean) return { ok: false, message: 'Chưa có token.' };
		if (clean.split('.').length < 3) {
			return { ok: false, message: 'Token không đúng định dạng (cần dạng xxx.yyy.zzz).' };
		}
		try {
			const heads = discordHeaders(clean);
			const { res: meRes, data: user } = await discordJson(
				'https://discord.com/api/v10/users/@me',
				{ headers: heads },
				10000,
			);
			if (!meRes.ok || !user || !user.id) {
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

			const COLLECTIBLE_TYPE = { NONE: 0, PROFILE_EFFECT: 1, NAMEPLATE: 2, PROFILE_FRAME: 3, AVATAR_DECORATION: 8 };
			let profile = {};
			try {
				const r = await discordJson(
					`https://discord.com/api/v10/users/${encodeURIComponent(user.id)}/profile?with_mutual_guilds=false`,
					{ headers: heads },
					10000,
				);
				profile = r.res.ok ? r.data || {} : {};
			} catch {
				profile = {};
			}
			const up = profile.user_profile || {};

			const skuProductCache = new Map();
			async function fetchCollectibleItem(sku) {
				if (!sku) return null;
				const key = String(sku);
				if (skuProductCache.has(key)) return skuProductCache.get(key);
				let item = null;
				try {
					const { res, data: body } = await discordJson(
						`https://discord.com/api/v10/storefront/products/sku/${encodeURIComponent(key)}`,
						{ headers: heads },
						9000,
					);
					if (res.ok) {
						const list = Array.isArray(body?.skus)
							? body.skus
							: Array.isArray(body?.items)
								? body.items
								: body?.product?.items || [];
						const mine = list.find((s) => String(s.id) === key) || list[0] || null;
						item = mine?.tenant_metadata?.collectibles?.item || mine?.collectibles?.item || null;
					}
				} catch {
					/* renderer ẩn effect/frame nếu không lấy được */
				}
				skuProductCache.set(key, item);
				return item;
			}

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

			const frameSku =
				collectiblesList.find((c) => Number(c?.type) === COLLECTIBLE_TYPE.PROFILE_FRAME)?.sku_id || null;
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
						src: null,
					})),
					innerWidth: Number(item.inner_width) || null,
					overflowTop: Number(item.overflow_top) || null,
					overflowBottom: Number(item.overflow_bottom) || null,
					overflowHorizontal: Number(item.overflow_horizontal) || null,
				};
			})();

			const tc = Array.isArray(up.theme_colors) ? up.theme_colors : [];

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
					displayNameStyles: dnsStyle.pickStyle(user),
					profileEffect,
					profileFrame,
					themeColors: tc.length >= 2 ? [tc[0], tc[1]] : [],
					profileBanner: up.banner || null,
				},
			};
		} catch (err) {
			return { ok: false, message: `Không kết nối được Discord: ${err.message}` };
		}
	}

	/* ══════════════════════ 6. SỐ DƯ ORB ══════════════════════════ */

	async function fetchOrbs(rawToken) {
		const clean = cleanToken(rawToken);
		if (!clean) return { ok: false, message: 'Chưa có token.' };
		try {
			const opts = { headers: discordHeaders(clean) };
			const [walletRes, claimedRes, allRes] = await Promise.all([
				trackedFetch('https://discord.com/api/v10/users/@me/virtual-currency/balance', {
					...opts,
					signal: identity.timeoutSignal(15000),
				}).then(async (r) => ({ res: r, data: await r.json().catch(() => null) })).catch(() => null),
				trackedFetch('https://discord.com/api/v10/quests/@me/claimed', {
					...opts,
					signal: identity.timeoutSignal(15000),
				}).then(async (r) => ({ res: r, data: await r.json().catch(() => null) })).catch(() => null),
				trackedFetch('https://discord.com/api/v10/quests/@me', {
					...opts,
					signal: identity.timeoutSignal(15000),
				}).then(async (r) => ({ res: r, data: await r.json().catch(() => null) })).catch(() => null),
			]);

			let balance = null;
			let source = 'wallet';
			if (walletRes && walletRes.res.ok) {
				const w = walletRes.data;
				if (w && typeof w.balance === 'number' && Number.isFinite(w.balance)) balance = w.balance;
			}

			let claimedQuests = [];
			if (claimedRes && claimedRes.res.ok) {
				claimedQuests = Array.isArray(claimedRes.data?.quests) ? claimedRes.data.quests : [];
			}

			if (balance === null) {
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

			if (balance === null || (!walletRes?.res.ok && !claimedRes?.res.ok)) {
				const status = walletRes?.res.status || claimedRes?.res.status || 0;
				return {
					ok: false,
					message: status === 401 ? 'Token không hợp lệ.' : `Discord trả lỗi ${status || 'mạng'}.`,
				};
			}

			let pendingClaim = 0;
			if (allRes && allRes.res.ok) {
				const quests = Array.isArray(allRes.data?.quests) ? allRes.data.quests : [];
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
	}

	/* ══════════════════════ 7. CLAIM ══════════════════════════ */

	function buildClaimBody(quest, captcha) {
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

	async function postClaimOnce(token, questId, body) {
		const url = `https://discord.com/api/v10/quests/${encodeURIComponent(questId)}/claim-reward`;
		const send = () =>
			trackedFetch(url, {
				method: 'POST',
				headers: discordHeaders(token, { json: true, questRoute: true }),
				body: JSON.stringify(body),
				signal: identity.timeoutSignal(20000),
			}).then(async (res) => ({ res, data: await res.json().catch(() => null) }));

		let out = await send();
		if (out.res.status === 429) {
			let waitSec = Number(out.data?.retry_after);
			if (!Number.isFinite(waitSec) || waitSec < 0) waitSec = 3;
			waitSec = Math.min(waitSec, 10);
			await sleep(Math.ceil(waitSec * 1000) + 250);
			out = await send();
		}
		return out;
	}

	/**
	 * Wave#102: xác minh claim bằng dữ liệu THẬT từ Discord.
	 * Claim-reward 2xx chưa đủ (một số phản hồi không kèm user_status) →
	 * đọc lại /quests/@me và kiểm tra `claimed_at`. Chỉ khi thấy claimed_at
	 * mới coi là đã nhận, không bao giờ cộng Orb ảo.
	 */
	async function verifyQuestClaimed(token, questId) {
		try {
			const { res, data } = await discordJson(
				'https://discord.com/api/v10/quests/@me',
				{ headers: discordHeaders(token) },
				12000,
			);
			if (!res.ok) return { checked: false, claimed: false, orbs: null };
			const list = Array.isArray(data?.quests) ? data.quests : [];
			const found = list.find((q) => q && String(q.id) === String(questId));
			const st = found && found.user_status ? found.user_status : null;
			return {
				checked: true,
				claimed: Boolean(st && st.claimed_at),
				orbs: typeof st?.orb_quantity_claimed === 'number' ? st.orb_quantity_claimed : null,
			};
		} catch {
			return { checked: false, claimed: false, orbs: null };
		}
	}

	const CLAIM_MIN_GAP_MS = 1200;
	let claimChain = Promise.resolve();
	let claimBlockedUntil = 0;
	let lastClaimAt = 0;

	function enqueueClaim(task) {
		const run = claimChain.then(async () => {
			const blockedFor = claimBlockedUntil - Date.now();
			if (blockedFor > 0) await sleep(blockedFor + 250);
			// Wave#116: chỉ giữ khoảng cách giữa 2 claim LIÊN TIẾP. Trước đây
			// sleep(1200) chạy cả trước claim đầu tiên sau nhiều phút nghỉ →
			// bấm Nhận bị chậm 1,2s vô ích trước khi request đi.
			const gapFor = lastClaimAt ? CLAIM_MIN_GAP_MS - (Date.now() - lastClaimAt) : 0;
			if (gapFor > 0) await sleep(gapFor);
			const out = await task();
			lastClaimAt = Date.now();
			if (out && out.res && out.res.status === 429) {
				const sec = Number(out.data?.retry_after);
				if (Number.isFinite(sec) && sec > 0) claimBlockedUntil = Date.now() + sec * 1000;
			}
			return out;
		});
		claimChain = run.catch(() => null);
		return run;
	}

	async function claimQuest(payload) {
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
			const { res, data } = await enqueueClaim(() => postClaimOnce(token, questId, body));

			if (res.ok) {
				// Wave#102: 2xx + claimed_at (trong phản hồi hoặc xác minh lại)
				// mới là thành công THẬT. Không có bằng chứng → confirmed:false
				// để UI không cộng Orb ảo.
				const status = data && data.user_status ? data.user_status : data;
				let claimedAt = status?.claimed_at || null;
				let orbs =
					typeof data?.orb_quantity_claimed === 'number'
						? data.orb_quantity_claimed
						: typeof status?.orb_quantity_claimed === 'number'
							? status.orb_quantity_claimed
							: null;
				let confirmed = Boolean(claimedAt);
				if (!confirmed) {
					const v = await verifyQuestClaimed(token, questId);
					if (v.checked && v.claimed) {
						confirmed = true;
						claimedAt = 'verified';
						if (orbs === null) orbs = v.orbs;
					}
				}
				return { ok: true, confirmed, claimedAt, orbs, raw: data };
			}
			if (res.status === 404) {
				return {
					ok: false,
					notFound: true,
					status: 404,
					message: 'Nhiệm vụ này Discord đã gỡ — không còn tồn tại để nhận.',
				};
			}
			if (res.status === 403 && data?.code === 260004) {
				return {
					ok: false,
					wrongPlatform: true,
					status: 403,
					message: data?.message || 'Nhiệm vụ không hỗ trợ nền tảng này.',
				};
			}
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
			const captcha = extractCaptchaFromError(res.status, data);
			if (captcha) {
				return { ok: false, captchaRequired: true, captcha, message: data?.message || 'Discord yêu cầu xác minh.' };
			}
			return {
				ok: false,
				status: res.status,
				code: data?.code ?? null,
				message:
					data?.message ||
					(res.status === 401 ? 'Token không hợp lệ.' : `Discord trả lỗi ${res.status}.`),
				raw: data,
			};
		} catch (err) {
			return { ok: false, message: `Không kết nối được Discord: ${err.message}` };
		}
	}

	/* ══════════════════════ 8. ENGINE (WEB WORKER) ══════════════════════════ */

	let worker = null;
	let lastStartConfig = null; // không chứa token — chỉ mode/loop để khôi phục
	const pendingPings = new Map();
	let pingSeq = 0;

	/* ── #105: chỉ MỘT tab được chạy engine (Web Locks) ──
	   Hai tab chạy song song sẽ cùng cày/cùng claim → trùng request, dễ 429 và
	   tranh chấp trạng thái. Tab thứ hai bị từ chối với thông báo rõ ràng. */
	let lockRelease = null;

	function acquireRunLock() {
		if (!navigator.locks || typeof navigator.locks.request !== 'function') return Promise.resolve(true);
		return new Promise((resolve) => {
			navigator.locks
				.request('autoquest-engine', { ifAvailable: true }, (lock) => {
					if (!lock) {
						resolve(false);
						return undefined;
					}
					resolve(true);
					return new Promise((done) => {
						lockRelease = done;
					});
				})
				.catch(() => resolve(false));
		});
	}

	function releaseRunLock() {
		const done = lockRelease;
		lockRelease = null;
		if (done) {
			try {
				done();
			} catch {
				/* ignore */
			}
		}
	}

	/* ── #105: Wake Lock giữ màn hình/tab không bị ngủ khi đang cày ── */
	let wakeLock = null;

	async function acquireWakeLock() {
		try {
			if (!navigator.wakeLock || !navigator.wakeLock.request) return;
			wakeLock = await navigator.wakeLock.request('screen');
			wakeLock.addEventListener('release', () => {
				wakeLock = null;
			});
		} catch {
			/* trình duyệt từ chối (pin thấp/tab ẩn) — không phải lỗi chết người */
		}
	}

	async function releaseWakeLock() {
		const lock = wakeLock;
		wakeLock = null;
		if (lock) {
			try {
				await lock.release();
			} catch {
				/* ignore */
			}
		}
	}

	/* ── #105: ý định tự chạy lại sau khi tab bị đóng/reload ── */
	const RESUME_KEY = 'resumeIntent';

	async function saveResumeIntent(config) {
		try {
			if (!config || !config.loopMode) {
				await kvPut(RESUME_KEY, { active: false });
				return;
			}
			await kvPut(RESUME_KEY, {
				active: true,
				at: Date.now(),
				config: {
					loopMode: true,
					loopInterval: Number(config.loopInterval) || 30,
					mode: config.mode || 'run',
					selectedQuests: Array.isArray(config.selectedQuests) ? config.selectedQuests : [],
				},
			});
		} catch {
			/* storage đầy — bỏ qua, chỉ mất tính năng resume */
		}
	}

	async function clearResumeIntent() {
		try {
			await kvPut(RESUME_KEY, { active: false });
		} catch {
			/* ignore */
		}
	}

	document.addEventListener('visibilitychange', () => {
		// Tab quay lại foreground trong lúc engine chạy → xin lại wake lock.
		if (document.visibilityState === 'visible' && worker && !wakeLock) acquireWakeLock();
	});

	function rejectPings(reason) {
		for (const [, item] of pendingPings) {
			clearTimeout(item.timer);
			item.resolve({ ok: false, message: reason || 'Engine không phản hồi.' });
		}
		pendingPings.clear();
	}

	function handleWorkerMessage(msg) {
		if (msg.type === 'pong') {
			const item = pendingPings.get(msg.id);
			if (item) {
				pendingPings.delete(msg.id);
				clearTimeout(item.timer);
				item.resolve({ ok: true, ms: Math.round(performance.now() - item.started), at: msg.at || Date.now() });
			}
			return;
		}
		if (msg.type === 'log') {
			// Wave#134: mọi dòng từ engine đi qua maskSecrets trước khi ra log UI/file.
			pushLog(msg.stream === 'stderr' ? 'stderr' : 'stdout', maskSecrets(msg.line == null ? '' : String(msg.line)));
			return;
		}
		if (msg.type === 'event') {
			const evt = msg.event || {};
			const data = evt.data || {};
			if (evt.type === 'login') setState('running', { username: data.username });
			if (evt.type === 'fatal') setState('error', { message: data.message });
			emitTo('event', evt);
			return;
		}
		if (msg.type === 'exit') {
			rejectPings('Engine đã kết thúc.');
			const code = Number(msg.code) || 0;
			const w = worker;
			worker = null;
			try {
				if (w) w.terminate();
			} catch {
				/* ignore */
			}
			// #105: tiến trình đã kết thúc → nhả lock, tắt wake lock, huỷ ý định resume.
			releaseRunLock();
			void releaseWakeLock();
			void clearResumeIntent();
			if (childState === 'stopping') {
				pushLog('system', 'Đã dừng tiến trình thủ công.');
				setState('idle');
				return;
			}
			pushLog('system', `Tiến trình hoàn tất (Mã ${code}).`);
			setState(code === 0 ? 'idle' : 'error', code === 0 ? {} : { message: `Tiến trình kết thúc với mã ${code}.` });
		}
	}

	async function startEngine(config) {
		if (worker) {
			// Wave#104: worker còn tham chiếu nhưng tiến trình đã kết thúc (idle/error)
			// là xác chết — dọn rồi cho khởi động lại thay vì chặn người dùng.
			if (childState === 'idle' || childState === 'error') {
				try {
					worker.terminate();
				} catch {
					/* ignore */
				}
				worker = null;
			} else {
				return { ok: false, message: 'Ứng dụng đang trong quá trình chạy.' };
			}
		}
		const token = cleanToken(config && config.token);
		if (!token) return { ok: false, message: 'Bạn chưa nhập Token Discord.' };
		if (token.split('.').length < 3) {
			return { ok: false, message: 'Token không hợp lệ. Token Discord có dạng: xxx.yyy.zzz' };
		}

		// #105: chỉ một tab được chạy engine.
		const gotLock = await acquireRunLock();
		if (!gotLock) {
			return {
				ok: false,
				message: 'Một tab khác đang chạy Auto Quest. Chỉ chạy ở MỘT tab để tránh trùng request và rate-limit.',
			};
		}

		logBuffer = '';
		pushLog('system', '==================================================');
		pushLog('system', 'KHỞI ĐỘNG AUTO-QUEST (BẢO MẬT 100% LOCAL)');
		pushLog('system', 'Đã ngắt toàn bộ endpoint ngoài & webhook. An toàn tuyệt đối.');
		pushLog('system', '==================================================');
		setState('starting');

		let w;
		try {
			w = new Worker(new URL('web/engine-worker.js', document.baseURI).href);
		} catch (err) {
			releaseRunLock();
			setState('error', { message: err.message });
			return { ok: false, message: `Không thể khởi chạy engine: ${err.message}` };
		}
		worker = w;
		w.onmessage = (event) => {
			if (worker !== w) return;
			handleWorkerMessage(event.data || {});
		};
		w.onerror = (err) => {
			if (worker !== w) return;
			rejectPings('Worker engine gặp lỗi.');
			const msg = (err && err.message) || 'Worker engine gặp lỗi không xác định.';
			// Wave#104: worker chết phải được dọn hẳn — trước đây chỉ log nên
			// biến `worker` kẹt vĩnh viễn, mọi lần Start sau đều bị từ chối.
			pushLog('stderr', `Lỗi worker engine: ${msg}`);
			try {
				w.terminate();
			} catch {
				/* ignore */
			}
			worker = null;
			releaseRunLock();
			void releaseWakeLock();
			void clearResumeIntent();
			setState('error', { message: msg });
		};
		void acquireWakeLock();
		lastStartConfig = {
			loopMode: !!(config && config.loopMode),
			loopInterval: Number(config && config.loopInterval) || 30,
			mode: (config && config.mode) || 'full',
			selectedQuests: Array.isArray(config && config.selectedQuests) ? config.selectedQuests : [],
		};
		void saveResumeIntent(lastStartConfig);
		w.postMessage({
			type: 'start',
			config: {
				token,
				loopMode: !!(config && config.loopMode),
				loopInterval: Number(config && config.loopInterval) || 30,
				mode: (config && config.mode) || 'full',
				selectedQuests: Array.isArray(config && config.selectedQuests) ? config.selectedQuests : [],
			},
		});
		return { ok: true };
	}

	function stopEngine() {
		releaseRunLock();
		void releaseWakeLock();
		void clearResumeIntent();
		rejectPings('Đã dừng tiến trình.');
		if (!worker) return { ok: true };
		const w = worker;
		worker = null;
		try {
			w.terminate();
		} catch {
			/* ignore */
		}
		setState('stopping');
		pushLog('system', 'Đã dừng tiến trình thủ công.');
		setTimeout(() => {
			if (childState === 'stopping') setState('idle');
		}, 150);
		return { ok: true };
	}

	/** Wave#131: nhịp tim worker — phát hiện engine treo mà không báo lỗi. */
	function pingEngine(timeoutMs = 2500) {
		if (!worker) return Promise.resolve({ ok: false, message: 'Engine không chạy.' });
		const w = worker;
		const id = ++pingSeq;
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				pendingPings.delete(id);
				resolve({ ok: false, message: 'Engine không phản hồi nhịp tim.' });
			}, Math.max(500, Number(timeoutMs) || 2500));
			pendingPings.set(id, { resolve, timer, started: performance.now() });
			try {
				w.postMessage({ type: 'ping', id });
			} catch (err) {
				pendingPings.delete(id);
				clearTimeout(timer);
				resolve({ ok: false, message: err.message });
			}
		});
	}

	function getLastRunConfig() {
		return lastStartConfig ? { ...lastStartConfig } : null;
	}

	/* ══════════════════════ 9. KIỂU TÊN HIỂN THỊ + FONT ══════════════════════════ */

	const DNS_CACHE_PREFIX = 'autoquest.dns.style.';

	function readDnsCache(userId) {
		try {
			const raw = localStorage.getItem(DNS_CACHE_PREFIX + String(userId || ''));
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	}
	function writeDnsCache(userId, style) {
		try {
			if (!userId) return;
			localStorage.setItem(DNS_CACHE_PREFIX + String(userId), JSON.stringify(style));
		} catch {
			/* cache là phụ */
		}
	}

	async function dnsRead(payload) {
		const p = payload && typeof payload === 'object' ? payload : {};
		const displayName = typeof p.displayName === 'string' ? p.displayName : '';
		const userId = p.userId != null ? String(p.userId) : '';
		const token = typeof p.token === 'string' ? cleanToken(p.token) : '';

		if (token) {
			try {
				const { res, data: user } = await discordJson(
					'https://discord.com/api/v10/users/@me',
					{ headers: discordHeaders(token) },
					10000,
				);
				if (res.ok && user) {
					const raw = dnsStyle.pickStyle(user);
					if (raw) {
						const style = dnsStyle.buildDescriptor(raw, displayName);
						style.source = 'api';
						writeDnsCache(userId || user.id, style);
						return { ok: true, style, source: 'api' };
					}
					writeDnsCache(userId || user.id, { ok: false, at: Date.now() });
					return { ok: false, error: 'Tài khoản này không đặt kiểu tên hiển thị.' };
				}
			} catch {
				/* rơi xuống cache */
			}
		}

		const cached = readDnsCache(userId);
		if (cached && cached.ok) return { ok: true, style: cached, source: 'cache' };
		return { ok: false, error: 'Chưa đọc được kiểu tên hiển thị.' };
	}

	const fontDataCache = new Map();
	function fontFileFor(family) {
		const fam = String(family || '').trim().toLowerCase();
		const fonts = (dnsStyle && dnsStyle.FONTS) || {};
		for (const key of Object.keys(fonts)) {
			if (String(fonts[key].family).toLowerCase() === fam) return fonts[key];
		}
		return null;
	}

	async function dnsFont(family) {
		if (typeof family !== 'string' || family.length > 60) return { ok: false, error: 'Tên font không hợp lệ.' };
		const entry = fontFileFor(family);
		if (!entry || !entry.file) return { ok: false, error: 'Không có file font cho "' + family + '".' };
		const cacheKey = entry.family;
		if (fontDataCache.has(cacheKey)) return fontDataCache.get(cacheKey);
		try {
			const res = await fetch(new URL('web/fonts/' + encodeURIComponent(entry.file) + '.woff2', document.baseURI).href);
			if (!res.ok) return { ok: false, error: 'Tải font lỗi HTTP ' + res.status };
			const buf = await res.arrayBuffer();
			const bytes = new Uint8Array(buf);
			const result = {
				ok: true,
				dataUrl: 'data:font/woff2;base64,' + b64FromBytes(bytes),
				bytes: bytes.length,
				family: entry.family,
				weight: entry.weight,
			};
			fontDataCache.set(cacheKey, result);
			return result;
		} catch (err) {
			return { ok: false, error: 'Không tải được font: ' + err.message };
		}
	}

	/* ══════════════════════ 10. CLIPBOARD / FILE / LINK ══════════════════════════ */

	async function readClipboard() {
		try {
			return await navigator.clipboard.readText();
		} catch {
			return '';
		}
	}

	async function writeClipboard(text) {
		const value = String(text == null ? '' : text);
		try {
			await navigator.clipboard.writeText(value);
			return { ok: true };
		} catch {
			try {
				const ta = document.createElement('textarea');
				ta.value = value;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				ta.remove();
				return { ok: true };
			} catch (err) {
				return { ok: false, message: err.message };
			}
		}
	}

	function downloadText(filename, content, mime) {
		const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 4000);
	}

	/* ── #108: chẩn đoán môi trường — TUYỆT ĐỐI không chứa token ── */
	async function appDiagnostics() {
		try {
			const cfg = await readConfig();
			let usage = null;
			let quota = null;
			let persisted = false;
			if (navigator.storage) {
				try {
					if (navigator.storage.estimate) {
						const est = await navigator.storage.estimate();
						usage = Number(est.usage) || 0;
						quota = Number(est.quota) || 0;
					}
				} catch {
					/* ignore */
				}
				try {
					if (navigator.storage.persisted) persisted = await navigator.storage.persisted();
				} catch {
					/* ignore */
				}
			}
			let swControlled = false;
			let swRegistrations = 0;
			try {
				swControlled = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
				if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
					swRegistrations = (await navigator.serviceWorker.getRegistrations()).length;
				}
			} catch {
				/* ignore */
			}
			let localStorageOk = false;
			try {
				localStorage.setItem('aq.probe', '1');
				localStorage.removeItem('aq.probe');
				localStorageOk = true;
			} catch {
				/* ignore */
			}
			let hcaptchaLoaded = false;
			try {
				hcaptchaLoaded = !!(window.hcaptcha && typeof window.hcaptcha.render === 'function');
			} catch {
				/* ignore */
			}
			return {
				ok: true,
				diagnostics: {
					app: 'AUTO-QUEST web',
					version: '1.0.0-web',
					time: new Date().toISOString(),
					origin: location.origin,
					protocol: location.protocol,
					secureContext: !!window.isSecureContext,
					online: navigator.onLine !== false,
					visibility: document.visibilityState,
					language: navigator.language || '',
					userAgent: String(navigator.userAgent || '').slice(0, 180),
					identityUA: identity.userAgent ? String(identity.userAgent).slice(0, 80) : '',
					storageMode,
					indexedDb: 'indexedDB' in window,
					localStorage: localStorageOk,
					cryptoSubtle: !!(self.crypto && self.crypto.subtle),
					webLocks: !!(navigator.locks && navigator.locks.request),
					wakeLockSupported: !!(navigator.wakeLock && navigator.wakeLock.request),
					notifications: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
					serviceWorker: 'serviceWorker' in navigator,
					swControlled,
					swRegistrations,
					persisted,
					usageMB: usage == null ? null : Math.round((usage / 1048576) * 10) / 10,
					quotaMB: quota == null ? null : Math.round(quota / 1048576),
					hcaptchaLoaded,
					engineState: childState,
					workerAlive: !!worker,
					runLock: !!lockRelease,
					wakeLockHeld: !!wakeLock,
					tokenStored: !!cfg.token,
					accounts: cfg.accounts.length,
					activeIdx: cfg.activeIdx,
					remember: cfg.remember,
					theme: cfg.theme,
					lang: cfg.lang,
					liteMode: cfg.liteMode,
					autoLockMin: cfg.autoLockMin,
					loopMode: cfg.loopMode,
					loopInterval: cfg.loopInterval,
					autoScroll: cfg.autoScroll,
					requestsThisSession: requestLog.length,
				},
			};
		} catch (err) {
			return { ok: false, message: err.message };
		}
	}

	/* ── #109: sao lưu mã hoá — PBKDF2-SHA256 200k + AES-256-GCM ──
	   File sao lưu chứa token nhưng đã mã hoá; mật khẩu KHÔNG được lưu ở đâu cả.
	   `pendingBackup` chỉ sống trong RAM của tab, xoá ngay sau khi áp dụng/huỷ. */
	const BACKUP_FORMAT = 'autoquest-backup';
	const BACKUP_VERSION = 2;
	const BACKUP_ITERATIONS = 200000;
	const BACKUP_EXTRAS_KEYS = ['autoquest.history.v1', 'autoquest.claimQueue.v1'];
	const BACKUP_EXTRAS_MAX = 512 * 1024;
	let pendingBackup = null;

	async function sha256B64(text) {
		try {
			const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
			return b64FromBytes(new Uint8Array(buf));
		} catch {
			return '';
		}
	}

	function collectBackupExtras() {
		const extras = {};
		for (const key of BACKUP_EXTRAS_KEYS) {
			try {
				const raw = localStorage.getItem(key);
				if (raw && raw.length <= BACKUP_EXTRAS_MAX) extras[key] = raw;
			} catch {
				/* bỏ qua */
			}
		}
		return extras;
	}

	async function deriveBackupKey(password, salt, iterations) {
		const base = await crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(password),
			'PBKDF2',
			false,
			['deriveKey'],
		);
		return crypto.subtle.deriveKey(
			{ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
			base,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt'],
		);
	}

	function pickFile(accept) {
		return new Promise((resolve) => {
			let input;
			try {
				input = document.createElement('input');
				input.type = 'file';
				input.accept = accept;
				input.style.display = 'none';
				document.body.appendChild(input);
				input.addEventListener('change', () => {
					const file = input.files && input.files[0];
					input.remove();
					resolve(file || null);
				});
				input.addEventListener('cancel', () => {
					input.remove();
					resolve(null);
				});
				input.click();
			} catch {
				if (input) input.remove();
				resolve(null);
			}
		});
	}

	function normalizeBackupAccounts(list) {
		const out = [];
		if (!Array.isArray(list)) return out;
		for (const acc of list) {
			if (!acc) continue;
			out.push({
				id: typeof acc.id === 'string' ? acc.id : '',
				username: typeof acc.username === 'string' ? acc.username : '',
				displayName: typeof acc.displayName === 'string' ? acc.displayName : '',
				avatar: typeof acc.avatar === 'string' ? acc.avatar : '',
				token: typeof acc.token === 'string' ? acc.token : '',
			});
		}
		return out;
	}

	async function exportBackup(password) {
		try {
			const pass = String(password || '');
			if (pass.length < 8) return { ok: false, message: 'Mật khẩu sao lưu cần ít nhất 8 ký tự.' };
			if (!(self.crypto && crypto.subtle)) {
				return { ok: false, message: 'Trình duyệt không hỗ trợ WebCrypto nên không thể mã hoá bản sao lưu.' };
			}
			const cfg = await readConfig();
			if (!cfg.token && cfg.accounts.length === 0) {
				return { ok: false, message: 'Chưa có tài khoản nào để sao lưu.' };
			}
			const exportedAt = new Date().toISOString();
			const plain = {
				app: 'AUTO-QUEST web',
				exportedAt,
				token: cfg.token,
				config: {
					remember: cfg.remember,
					loopMode: cfg.loopMode,
					loopInterval: cfg.loopInterval,
					autoScroll: cfg.autoScroll,
					theme: cfg.theme,
					lang: cfg.lang,
					liteMode: cfg.liteMode,
					autoLockMin: cfg.autoLockMin,
					activeIdx: cfg.activeIdx,
				},
				accounts: normalizeBackupAccounts(cfg.accounts),
				extras: collectBackupExtras(),
			};
			const salt = crypto.getRandomValues(new Uint8Array(16));
			const iv = crypto.getRandomValues(new Uint8Array(12));
			const key = await deriveBackupKey(pass, salt, BACKUP_ITERATIONS);
			const ct = await crypto.subtle.encrypt(
				{ name: 'AES-GCM', iv },
				key,
				new TextEncoder().encode(JSON.stringify(plain)),
			);
			const cipherText = b64FromBytes(new Uint8Array(ct));
			const file = {
				format: BACKUP_FORMAT,
				version: BACKUP_VERSION,
				createdAt: exportedAt,
				checksum: await sha256B64(cipherText),
				kdf: {
					name: 'PBKDF2',
					hash: 'SHA-256',
					iterations: BACKUP_ITERATIONS,
					salt: b64FromBytes(salt),
				},
				cipher: { name: 'AES-GCM', iv: b64FromBytes(iv) },
				data: cipherText,
			};
			const stamp = exportedAt.replace(/[:.]/g, '-').slice(0, 19);
			downloadText(`autoquest-backup-${stamp}.json`, JSON.stringify(file, null, 2), 'application/json');
			pushLog('system', `Đã xuất bản sao lưu mã hoá (${plain.accounts.length} tài khoản).`);
			return { ok: true, accounts: plain.accounts.length, hasToken: !!cfg.token };
		} catch (err) {
			return { ok: false, message: err.message };
		}
	}

	async function backupPick(password) {
		pendingBackup = null;
		try {
			const pass = String(password || '');
			if (!pass) return { ok: false, message: 'Nhập mật khẩu đã đặt khi sao lưu.' };
			if (!(self.crypto && crypto.subtle)) {
				return { ok: false, message: 'Trình duyệt không hỗ trợ WebCrypto.' };
			}
			const file = await pickFile('.json,application/json');
			if (!file) return { ok: false, canceled: true };
			if (file.size > 2 * 1024 * 1024) return { ok: false, message: 'File sao lưu quá lớn (tối đa 2 MB).' };
			let obj;
			try {
				obj = JSON.parse(String(await file.text()));
			} catch {
				return { ok: false, message: 'File không phải JSON hợp lệ.' };
			}
			if (!obj || obj.format !== BACKUP_FORMAT) {
				return { ok: false, message: 'Đây không phải file sao lưu AUTO-QUEST.' };
			}
			const version = Number(obj.version);
			if (version !== 1 && version !== BACKUP_VERSION) {
				return { ok: false, message: `Phiên bản sao lưu không hỗ trợ (${obj.version}).` };
			}
			// Wave#122: v2 có checksum SHA-256 của phần mã hoá — phát hiện file hỏng/sửa tay.
			let checksumOk = null;
			if (version >= 2) {
				if (typeof obj.checksum !== 'string' || !obj.checksum) {
					return { ok: false, message: 'Bản sao lưu v2 thiếu checksum — từ chối để an toàn.' };
				}
				checksumOk = (await sha256B64(obj.data)) === obj.checksum;
				if (!checksumOk) return { ok: false, message: 'Checksum không khớp — file sao lưu đã bị sửa hoặc hỏng.' };
			}
			const iterations = Number(obj.kdf && obj.kdf.iterations);
			if (!(iterations >= 10000 && iterations <= 1000000)) {
				return { ok: false, message: 'Tham số KDF không hợp lệ.' };
			}
			if (!obj.kdf || obj.kdf.name !== 'PBKDF2' || obj.kdf.hash !== 'SHA-256') {
				return { ok: false, message: 'Kiểu mã hoá của file không được hỗ trợ.' };
			}
			if (!obj.cipher || obj.cipher.name !== 'AES-GCM') {
				return { ok: false, message: 'Kiểu mã hoá của file không được hỗ trợ.' };
			}
			let plain;
			try {
				const key = await deriveBackupKey(pass, bytesFromB64(obj.kdf.salt), iterations);
				const pt = await crypto.subtle.decrypt(
					{ name: 'AES-GCM', iv: bytesFromB64(obj.cipher.iv) },
					key,
					bytesFromB64(obj.data),
				);
				plain = JSON.parse(new TextDecoder().decode(pt));
			} catch {
				return { ok: false, message: 'Sai mật khẩu hoặc file sao lưu bị hỏng.' };
			}
			if (!plain || typeof plain !== 'object') {
				return { ok: false, message: 'Nội dung sao lưu không hợp lệ.' };
			}
			const token = typeof plain.token === 'string' ? plain.token : '';
			const accounts = normalizeBackupAccounts(plain.accounts);
			if (!token && accounts.length === 0) {
				return { ok: false, message: 'Bản sao lưu không có tài khoản nào.' };
			}
			const extras =
				plain.extras && typeof plain.extras === 'object' && !Array.isArray(plain.extras) ? plain.extras : {};
			pendingBackup = {
				token,
				accounts,
				config: plain.config && typeof plain.config === 'object' ? plain.config : {},
				extras,
			};
			return {
				ok: true,
				preview: {
					createdAt: typeof plain.exportedAt === 'string' ? plain.exportedAt : obj.createdAt || '',
					accounts: accounts.length,
					hasToken: !!token,
					version,
					checksumOk,
					hasExtras: Object.keys(extras).length > 0,
					names: accounts.slice(0, 5).map((a) => a.username || a.id || '—'),
				},
			};
		} catch (err) {
			return { ok: false, message: err.message || 'Không đọc được file sao lưu.' };
		}
	}

	async function backupApply() {
		const pending = pendingBackup;
		if (!pending) return { ok: false, message: 'Chưa có bản sao lưu nào được chọn.' };
		try {
			const cfg = await readConfig();
			const c = pending.config || {};
			const activeIdx =
				typeof c.activeIdx === 'number' && c.activeIdx >= 0 && c.activeIdx < pending.accounts.length
					? c.activeIdx
					: 0;
			const mainToken =
				pending.token || (pending.accounts[activeIdx] ? pending.accounts[activeIdx].token || '' : '');
			await withConfigLock(() =>
				writeConfig({
					token: mainToken,
					remember: c.remember !== false && !!mainToken,
					loopMode: c.loopMode !== false,
					loopInterval:
						typeof c.loopInterval === 'number' && c.loopInterval >= 5
							? c.loopInterval
							: cfg.loopInterval,
					autoScroll: c.autoScroll !== false,
					theme: c.theme === 'light' ? 'light' : 'dark',
					lang: c.lang === 'en' ? 'en' : cfg.lang,
					liteMode: typeof c.liteMode === 'boolean' ? c.liteMode : cfg.liteMode,
					autoLockMin: [0, 5, 15, 30].includes(Number(c.autoLockMin)) ? Number(c.autoLockMin) : cfg.autoLockMin,
					accounts: pending.accounts,
					activeIdx,
				}),
			);
			// Wave#122: khôi phục lịch sử/hàng chờ (chỉ dữ liệu cục bộ, không token).
			if (pending.extras) {
				for (const key of BACKUP_EXTRAS_KEYS) {
					const raw = pending.extras[key];
					if (typeof raw !== 'string' || raw.length > BACKUP_EXTRAS_MAX) continue;
					try {
						localStorage.setItem(key, raw);
					} catch {
						/* storage đầy — bỏ qua phần phụ */
					}
				}
			}
			pendingBackup = null;
			pushLog('system', `Đã khôi phục ${pending.accounts.length} tài khoản từ bản sao lưu.`);
			return {
				ok: true,
				accounts: pending.accounts.length,
				hasToken: !!mainToken,
				config: {
					loopMode: c.loopMode !== false,
					loopInterval:
						typeof c.loopInterval === 'number' && c.loopInterval >= 5 ? c.loopInterval : cfg.loopInterval,
					theme: c.theme === 'light' ? 'light' : 'dark',
				},
			};
		} catch (err) {
			return { ok: false, message: err.message };
		}
	}

	function backupDiscard() {
		pendingBackup = null;
		return { ok: true };
	}

	async function openDataFolder() {
		try {
			const cfg = await readConfig();
			const data = {
				app: 'AUTO-QUEST (web)',
				exportedAt: new Date().toISOString(),
				note: 'Token KHÔNG được xuất ra file. Dữ liệu token nằm trong IndexedDB của trình duyệt.',
				config: {
					remember: cfg.remember,
					loopMode: cfg.loopMode,
					loopInterval: cfg.loopInterval,
					autoScroll: cfg.autoScroll,
					theme: cfg.theme,
					lang: cfg.lang,
					liteMode: cfg.liteMode,
					autoLockMin: cfg.autoLockMin,
					activeIdx: cfg.activeIdx,
				},
				accounts: cfg.accounts.map((a) => ({
					id: a.id,
					username: a.username,
					displayName: a.displayName,
					avatar: a.avatar,
				})),
			};
			const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
			downloadText(`autoquest-data-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
			pushLog('system', 'Đã xuất dữ liệu cấu hình (không kèm token) ra file .json.');
			return { ok: true };
		} catch (err) {
			return { ok: false, message: err.message };
		}
	}

	/** Wave#127: xoá TOÀN BỘ dữ liệu cục bộ (token, tài khoản, lịch sử, cache). */
	async function wipeAllData() {
		try {
			stopEngine();
		} catch {
			/* ignore */
		}
		try {
			dbPromise = null;
			await new Promise((resolve) => {
				const req = indexedDB.deleteDatabase(DB_NAME);
				req.onsuccess = () => resolve();
				req.onerror = () => resolve();
				req.onblocked = () => resolve();
			});
		} catch {
			/* ignore */
		}
		try {
			const drop = [];
			for (let i = 0; i < localStorage.length; i += 1) {
				const key = localStorage.key(i);
				if (key && (key.startsWith('autoquest.') || key.startsWith('aq.'))) drop.push(key);
			}
			for (const key of drop) localStorage.removeItem(key);
		} catch {
			/* ignore */
		}
		try {
			const keys = await caches.keys();
			await Promise.all(keys.map((key) => caches.delete(key)));
		} catch {
			/* ignore */
		}
		try {
			const regs = navigator.serviceWorker && navigator.serviceWorker.getRegistrations
				? await navigator.serviceWorker.getRegistrations()
				: [];
			await Promise.all(regs.map((reg) => reg.unregister()));
		} catch {
			/* ignore */
		}
		pushLog('system', 'Đã xoá toàn bộ dữ liệu cục bộ.');
		return { ok: true };
	}

	async function saveLog(content) {
		const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
		try {
			downloadText(`autoquest-${stamp}.log`, content || logBuffer, 'text/plain;charset=utf-8');
			return { ok: true };
		} catch (err) {
			return { ok: false, message: err.message };
		}
	}

	function openUrl(rawUrl) {
		try {
			const parsed = new URL(String(rawUrl || ''));
			const host = parsed.hostname.toLowerCase();
			if (host !== 'discord.com' && host !== 'www.discord.com' && host !== 'ptb.discord.com') {
				return { ok: false, message: `Chặn mở liên kết không phải discord.com: ${host}` };
			}
			window.open(parsed.toString(), '_blank', 'noopener');
			return { ok: true };
		} catch (err) {
			return { ok: false, message: err.message };
		}
	}

	function openQuest(questId) {
		const id = String(questId || '').trim();
		const url = id
			? `https://discord.com/quest-home#${encodeURIComponent(id)}`
			: 'https://discord.com/quest-home';
		try {
			window.open(url, '_blank', 'noopener');
			return { ok: true, via: 'web', url };
		} catch (err) {
			return { ok: false, message: err.message };
		}
	}

	/* ══════════════════════ 11. TOKEN .TXT ══════════════════════════ */

	let pendingUserToken = '';

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

	function importTokenTxt() {
		return new Promise((resolve) => {
			let input;
			try {
				input = document.createElement('input');
				input.type = 'file';
				input.accept = '.txt,text/plain';
				input.style.display = 'none';
				document.body.appendChild(input);
				input.addEventListener('change', async () => {
					const file = input.files && input.files[0];
					input.remove();
					if (!file) {
						resolve({ ok: false, canceled: true });
						return;
					}
					try {
						let token = String(await file.text()).trim();
						if (/[\r\n]/.test(token) || token.includes('=')) {
							const map = parseKeyValue(token);
							token = (map.token || map.user_token || map.usertoken || map.discord_token || '').trim() || token;
						}
						token = token.replace(/^["']|["']$/g, '').replace(/\s+/g, '');
						if (!token || token.length < 30) {
							resolve({ ok: false, message: 'File không chứa token hợp lệ (quá ngắn).' });
							return;
						}
						if (!/^[\w-]{20,}\.[\w-]{5,}\.[\w-]{15,}$/.test(token)) {
							resolve({
								ok: false,
								message: 'Không giống token tài khoản Discord (cần 3 phần ngăn bởi dấu chấm).',
							});
							return;
						}
						pendingUserToken = token;
						pushLog('system', `Đã nạp token tài khoản từ ${file.name} — bấm "Đăng nhập" để hoàn tất.`);
						resolve({ ok: true, source: file.name, length: token.length });
					} catch (err) {
						resolve({ ok: false, message: err.message });
					}
				});
				input.addEventListener('cancel', () => {
					input.remove();
					resolve({ ok: false, canceled: true });
				});
				input.click();
			} catch (err) {
				if (input) input.remove();
				resolve({ ok: false, message: err.message });
			}
		});
	}

	/* ══════════════════════ 12. HỢP ĐỒNG window.autoquest ══════════════════════════ */

	window.autoquest = {
		getConfig: async () => {
			const cfg = await readConfig();
			/* Wave#134 (audit): config công khai KHÔNG còn mang token plaintext.
			   Bản cũ: mọi script trên trang (kể cả SDK hCaptcha mà CSP cho phép chạy
			   cùng document) chỉ cần `await window.autoquest.getConfig()` là có token.
			   Renderer muốn thấy token thật thì gọi tokenReveal() — có cổng canh. */
			const { token, accounts, ...rest } = cfg;
			return {
				...rest,
				token: '',
				hasToken: !!token,
				tokenMasked: maskToken(token),
				accounts: (accounts || []).map(({ token: t, ...a }) => a),
				state: childState,
				version: '2.0.0-web',
			};
		},

		/** Wave#134: đường DUY NHẤT trả token thật ra page. Chỉ mở khi (a) người dùng
		   đã thao tác thật với trang (isTrusted pointerdown/keydown/touch), hoặc (b)
		   trang mới mở dưới 6 giây (luồng TỰ đăng nhập lúc load lại). Một lần dùng
		   trong cửa sổ boot, rồi đóng vĩnh viễn cho tới khi có thao tác thật. */
		tokenReveal: async (opts) => {
			const why = String(opts?.reason || '').slice(0, 40);
			const inBootWindow = Date.now() < bootWindowUntil;
			if (!gestureArmed && !inBootWindow) {
				pushLog('system', `Từ chối revealed token (không có thao tác thật của người dùng) [${why || 'không rõ lý do'}].`);
				return { ok: false, message: 'Cần thao tác thật của người dùng để xem token.' };
			}
			if (!gestureArmed && inBootWindow) bootWindowUntil = 0; // chỉ 1 lần cho boot
			const cfg = await readConfig();
			return { ok: true, token: cfg.token || '' };
		},

		/** Trạng thái ổ mã hoá: cho UI biết có đang phải chạy memory-only không. */
		secureStatus: async () => ({ ok: true, secureStorage, storageMode, gestureArmed }),
		saveConfig: (config) =>
			withConfigLock(async () => {
				try {
					await writeConfig({
						token: config?.token,
						remember: config?.remember,
						loopMode: config?.loopMode,
						loopInterval: config?.loopInterval,
						autoScroll: config?.autoScroll,
						theme: config?.theme,
						lang: config?.lang,
						liteMode: config?.liteMode,
						autoLockMin: config?.autoLockMin,
						accounts: config?.accounts,
						activeIdx: config?.activeIdx,
					});
					return { ok: true };
				} catch (err) {
					return { ok: false, message: err.message };
				}
			}),

		accountsList: async () => {
			const cfg = await readConfig();
			// Wave#134: popup "Đổi tài khoản" chỉ cần metadata — bỏ hẳn token khỏi payload.
			return {
				accounts: (cfg.accounts || []).map(({ token, ...a }) => a),
				activeIdx: cfg.activeIdx,
			};
		},

		accountsAdd: async (acc) => {
			try {
				return await mutateAccounts(({ accounts, activeIdx }) => {
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
						accounts[idx] = {
							id: (acc && acc.id) || accounts[idx].id || '',
							username: (acc && acc.username) || accounts[idx].username || '',
							displayName: (acc && acc.displayName) || accounts[idx].displayName || '',
							avatar: (acc && acc.avatar) || accounts[idx].avatar || '',
							token: token || accounts[idx].token || '',
						};
					}
					return { accounts, activeIdx: acc && acc.activate ? idx : activeIdx };
				});
			} catch (err) {
				return { ok: false, message: err.message };
			}
		},

		accountsRemove: async (id) => {
			try {
				return await mutateAccounts(({ accounts, activeIdx }) => {
					const activeId = accounts[activeIdx] ? accounts[activeIdx].id : null;
					if (activeId && activeId === id) return { accounts, activeIdx, skipped: true };
					const beforeLen = accounts.length;
					accounts = accounts.filter((a) => a.id !== id);
					if (accounts.length === beforeLen) return { accounts, activeIdx, unchanged: true };
					return { accounts, activeIdx };
				});
			} catch (err) {
				return { ok: false, message: err.message };
			}
		},

		accountsSetActive: async (idx) => {
			try {
				return await mutateAccounts(({ accounts, activeIdx }) => {
					const next = typeof idx === 'number' && idx >= 0 && idx < accounts.length ? idx : 0;
					return { accounts, activeIdx: next, token: accounts[next] ? accounts[next].token : '' };
				});
			} catch (err) {
				return { ok: false, message: err.message };
			}
		},

		start: startEngine,
		stop: stopEngine,
		pingEngine,
		getLastRunConfig,
		getState: async () => ({ state: childState }),

		/** #105: lấy & xoá ý định chạy lại (chỉ dùng 1 lần mỗi lần nạp trang). */
		resumeIntentTake: async () => {
			try {
				const v = await kvGet(RESUME_KEY);
				await kvPut(RESUME_KEY, { active: false });
				if (!v || !v.active) return { active: false };
				const age = Date.now() - (Number(v.at) || 0);
				// Quá 30 phút coi như phiên cũ đã bị bỏ — không tự chạy lại.
				return { active: age >= 0 && age <= 30 * 60 * 1000, age, config: v.config || {} };
			} catch {
				return { active: false };
			}
		},

		/** #105: xin trình duyệt giữ dữ liệu (chống bị dọn khi thiếu dung lượng). */
		storagePersist: async () => {
			try {
				if (!navigator.storage || typeof navigator.storage.persist !== 'function') {
					return { ok: false, supported: false };
				}
				const persisted = await navigator.storage.persist();
				return { ok: true, supported: true, persisted };
			} catch (err) {
				return { ok: false, supported: true, message: err.message };
			}
		},

		authCheck,
		fetchOrbs,
		claimQuest,

		debugRawQuests: async () => ({ ok: false, message: 'Không hỗ trợ trên bản web.' }),
		debugClaimOne: async () => ({ ok: false, message: 'Không hỗ trợ trên bản web.' }),
		debugProbePlatform: async () => ({ ok: false, message: 'Không hỗ trợ trên bản web.' }),
		captchaProbe: async () => ({ ok: false, message: 'Không hỗ trợ trên bản web.' }),
		submitCaptcha: async () => ({ ok: false, message: 'Không hỗ trợ trên bản web.' }),
		captchaTrace: () => {},

		readClipboard,
		writeClipboard,
		openDataFolder,

		/* #108/#109 */
		appDiagnostics,
		backupExport: exportBackup,
		backupPick,
		backupApply,
		backupDiscard,

		/* Wave#119 — nhật ký yêu cầu (đã che token) */
		requestLogText,
		clearRequestLog: () => {
			requestLog.length = 0;
			return { ok: true };
		},
		/* Wave#127 — xoá toàn bộ dữ liệu cục bộ */
		wipeAllData,

		openUrl,
		openQuest,

		cdpStatus: async () => ({ ok: true, available: false, port: 0 }),
		cdpSuperProperties: async () => ({ ok: false, message: 'CDP không hỗ trợ trên web.' }),
		cdpRunningGames: async () => ({ ok: false, message: 'CDP không hỗ trợ trên web.' }),
		cdpNavigateQuest: async () => ({ ok: false, message: 'CDP không hỗ trợ trên web.' }),
		cdpEvaluate: async () => ({ ok: false, message: 'CDP không hỗ trợ trên web.' }),
		cdpLaunchDebug: async () => ({ ok: false, message: 'CDP không hỗ trợ trên web.' }),

		dnsRead,
		dnsFont,
		saveLog,

		userTokenImportTxt: importTokenTxt,
		userTokenTake: async () => {
			if (!pendingUserToken) return { ok: false, message: 'Chưa nạp token tài khoản nào.' };
			const t = pendingUserToken;
			pendingUserToken = '';
			return { ok: true, token: t };
		},
		userTokenDiscard: async () => {
			const had = !!pendingUserToken;
			pendingUserToken = '';
			return { ok: true, had };
		},
		userTokenPendingStatus: async () => ({
			ok: true,
			pending: !!pendingUserToken,
			length: pendingUserToken.length,
		}),

		onLog: (handler) => {
			listeners.log.add(handler);
			return () => listeners.log.delete(handler);
		},
		onEvent: (handler) => {
			listeners.event.add(handler);
			return () => listeners.event.delete(handler);
		},
		onState: (handler) => {
			listeners.state.add(handler);
			return () => listeners.state.delete(handler);
		},
	};

	// Chẩn đoán khi mở DevTools — không chứa token.
	try {
		console.info('[AUTO-QUEST web] bridge sẵn sàng · danh tính:', identity.userAgent.slice(0, 60) + '…');
	} catch {
		/* ignore */
	}
})();
