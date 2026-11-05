'use strict';

/**
 * Dựng `web/engine-bundle.js` từ engine đã biên dịch trong `web/engine/`.
 *
 * Vì sao làm vậy: engine quest là ~1.800 dòng đã chạy đúng (scan → doing →
 * finish → redeem). Viết lại = port lỗi sang nền tảng thứ hai. Ở đây ta chỉ
 * bọc từng file thành một factory CommonJS và thay 4 phụ thuộc Node:
 *
 *   ./src/client      → ClientQuest dùng fetch (không Gateway, không undici)
 *   ./src/constants   → danh tính lấy từ AQIdentity (UA thật của trình duyệt)
 *   node:crypto       → crypto.randomUUID
 *   undici            → fetch của trình duyệt
 *
 * Chạy: node web/build-engine.js
 *
 * Waves#139 — SOURCE OF TRUTH (đọc trước khi sửa engine):
 *   1. web/engine/bot.js + web/engine/src/*.js  = MÃ NGUỒN WEB THẬT.
 *      Đây là thứ được đóng gói vào bundle và chạy trong Web Worker.
 *   2. web/engine-bundle.js = FILE SINH RA, KHÔNG SỬA TAY. Luôn chạy
 *      `npm run build:engine` (hoặc `npm run check:bundle` để kiểm tra)
 *      sau khi sửa (1), rồi mới commit bundle mới.
 *   3. engine-src/*.ts = BẢN THAM CHIẾU THIẾT KẾ (Node/Gateway). Nó KHÔNG
 *      được biên dịch vào bundle này. Sửa TS mà không sửa (1) + build lại
 *      thì bản web vẫn chạy code cũ — đó là lỗi đã từng xảy ra.
 *   4. web/engine/src/client.js và constants.js (Node/Gateway) KHÔNG nằm
 *      trong REAL_MODULES: client được thay bằng shim fetch, constants
 *      được thay bằng AQIdentity trong bundle. Đừng sửa chúng rồi tưởng
 *      bản web sẽ đổi theo.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BOT_DIR = path.join(ROOT, 'web', 'engine');
const OUT = path.join(__dirname, 'engine-bundle.js');

const REAL_MODULES = [
	'bot.js',
	'src/events.js',
	'src/interface.js',
	'src/quest.js',
	'src/questManager.js',
	'src/security.js',
	'src/taskTypes.js',
	'src/utils.js',
];

const TEXT_ENCODER_OK = true;

function readModule(rel) {
	const p = path.join(BOT_DIR, rel);
	const src = fs.readFileSync(p, 'utf8');
	if (/\bimport\s+.*\bfrom\b|\bexport\s+(const|function|class|default)\b/.test(src)) {
		throw new Error('Module ' + rel + ' dùng ESM — loader này chỉ hỗ trợ CommonJS.');
	}
	return src;
}

const PARAMS =
	'require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, ' +
	'setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob';

const factories = REAL_MODULES.map((rel) => {
	const src = readModule(rel);
	return `__factories[${JSON.stringify(rel)}] = function (${PARAMS}) {\n${src}\n};`;
}).join('\n\n');

const out = `'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   ENGINE BUNDLE — TỰ SINH, ĐỪNG SỬA TAY.
   Nguồn: web/engine/bot.js + web/engine/src/*.js
   Sinh lại: node web/build-engine.js
   Chạy trong Web Worker (xem web/engine-worker.js). Không có Node, không eval.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
	var __factories = Object.create(null);

${factories}

/* ───────── shim 1: ClientQuest (fetch thay @discordjs/rest + bỏ Gateway) ───────── */
function makeClientShim(env, require) {
	var QuestManager = require('./questManager').QuestManager;

	function createRest(token) {
		var BASE = 'https://discord.com/api/v10';

		function discordError(status, data) {
			var err = new Error(
				(data && data.message) || 'Discord trả lỗi ' + status + '.',
			);
			err.status = status;
			err.code = data && data.code != null ? data.code : undefined;
			err.rawError = data || {};
			err.body = data || {};
			return err;
		}

		async function request(method, route, init) {
			init = init || {};
			var url = BASE + route;
			if (init.query) {
				var q = init.query instanceof URLSearchParams ? init.query : new URLSearchParams(init.query);
				var qs = q.toString();
				if (qs) url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
			}
			var extra = new Headers(init.headers || {});
			var android = String(extra.get('AndroidRequest') || '') === 'true';
			extra.delete('AndroidRequest');
			var headers = env.identity.headers(token, { json: init.body !== undefined, android: android });
			extra.forEach(function (value, key) {
				headers[key] = value;
			});
			var body;
			if (init.body !== undefined) body = JSON.stringify(init.body);

			async function once() {
				var res = await fetch(url, {
					method: method,
					headers: headers,
					body: body,
					signal: env.timeoutSignal(30000),
				});
				var data = null;
				try { data = await res.json(); } catch (e) { data = null; }
				return { res: res, data: data };
			}

			var out = await once();
			if (out.res.status === 429) {
				// Waves#142 — unified 429 policy: wait the FULL retry_after
				// Discord gave (no 5s/10s cap, no early retry), then retry
				// once. An invalid retry_after falls back to 2s. The user
				// can still Stop the worker at any time to terminate.
				var wait = Number(out.data && out.data.retry_after);
				if (!isFinite(wait) || wait < 0) wait = 2;
				await new Promise(function (r) { setTimeout(r, Math.ceil(wait * 1000) + 250); });
				out = await once();
			}
			if (!out.res.ok) throw discordError(out.res.status, out.data);
			if (out.res.status === 204) return null;
			return out.data;
		}

		return {
			token: token,
			get: function (route, init) { return request('GET', route, init); },
			post: function (route, init) { return request('POST', route, init); },
			put: function (route, init) { return request('PUT', route, init); },
			patch: function (route, init) { return request('PATCH', route, init); },
			delete: function (route, init) { return request('DELETE', route, init); },
			on: function () { return this; },
			setToken: function (t) { token = t; return this; },
		};
	}

	function ClientQuest(token) {
		if (!token) throw new Error('Cần có token Discord để khởi tạo client.');
		this.token = token;
		this.rest = createRest(token);
		this.questManager = null;
		this.__readyHandlers = [];
	}
	ClientQuest.prototype.once = function (_event, handler) {
		this.__readyHandlers.push(handler);
		return this;
	};
	ClientQuest.prototype.on = function () { return this; };
	ClientQuest.prototype.connect = async function () {
		// Gateway chỉ dùng để biết "đã đăng nhập"; /users/@me cho đúng dữ liệu đó.
		var me = await this.rest.get('/users/@me');
		var payload = { data: { user: me } };
		for (var i = 0; i < this.__readyHandlers.length; i++) {
			await this.__readyHandlers[i](payload);
		}
	};
	ClientQuest.prototype.destroy = async function () {
		env.destroy();
	};
	ClientQuest.prototype.fetchQuests = function (fetchExcluded) {
		var self = this;
		return this.rest
			.get('/quests/@me')
			.then(function (response) {
				return QuestManager.fromResponse(self, response, fetchExcluded !== false);
			})
			.then(function (manager) {
				self.questManager = manager;
				return manager;
			});
	};

	return { ClientQuest: ClientQuest };
}

/* ───────── shim 2: Constants lấy danh tính từ AQIdentity ───────── */
function makeConstantsShim(env) {
	var p = env.identity.superProperties();
	p.client_launch_id = env.identity.sessionLaunchId;
	p.launch_signature = env.identity.sessionLaunchId;
	p.client_heartbeat_session_id = env.identity.sessionHeartbeatId;
	p.client_app_state = 'focused';

	return {
		Constants: {
			USER_AGENT: env.identity.userAgent,
			Properties: p,
			ANDROID_USER_AGENT: 'Discord-Android/316011;RNA',
			ANDROID_Properties: env.identity.androidProperties(),
		},
	};
}

/* ───────── shim 3: module lõi của Node ───────── */
function makeCryptoShim() {
	return {
		randomUUID: function () {
			try { return crypto.randomUUID(); } catch (e) {}
			var h = function () { return Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0'); };
			return h() + h() + '-4' + h().slice(1) + '-a' + h().slice(1) + '-' + h() + h() + h();
		},
	};
}
function makeUndiciShim() {
	return {
		fetch: function (input, init) { return fetch(input, init); },
	};
}
function makeDiscordApiTypesShim() {
	return {
		GatewayDispatchEvents: { Ready: 'READY' },
		GatewayOpcodes: { Identify: 2, Heartbeat: 1 },
	};
}

var __shims = Object.create(null);
__shims['src/client.js'] = makeClientShim;
__shims['src/constants.js'] = makeConstantsShim;
__shims['node:crypto'] = makeCryptoShim;
__shims['undici'] = makeUndiciShim;
__shims['discord-api-types/v10'] = makeDiscordApiTypesShim;

/* ───────── resolver ───────── */
function normalizeId(id) {
	var parts = id.split('/');
	var stack = [];
	for (var i = 0; i < parts.length; i++) {
		var seg = parts[i];
		if (!seg || seg === '.') continue;
		if (seg === '..') { stack.pop(); continue; }
		stack.push(seg);
	}
	return stack.join('/');
}

function resolveId(fromId, spec) {
	if (spec.charAt(0) !== '.') return spec;
	var dir = fromId.indexOf('/') === -1 ? '' : fromId.slice(0, fromId.lastIndexOf('/'));
	var base = dir ? dir + '/' + spec : spec;
	var id = normalizeId(base);
	if (!/\\.js$/.test(id)) id += '.js';
	return id;
}

function createRuntime(env) {
	var cache = Object.create(null);
	var shimCache = Object.create(null);

	function makeRequire(fromId) {
		return function (spec) {
			var id = resolveId(fromId, spec);
			if (__shims[id]) {
				if (!shimCache[id]) shimCache[id] = __shims[id](env, makeRequire(id));
				return shimCache[id];
			}
			if (cache[id]) return cache[id].exports;
			var factory = __factories[id];
			if (!factory) throw new Error('AQ engine: thiếu module "' + id + '"');
			var mod = { exports: {} };
			cache[id] = mod;
			factory(
				makeRequire(id),
				mod,
				mod.exports,
				env,
				env.process,
				env.Buffer,
				env.console,
				setTimeout,
				clearTimeout,
				setInterval,
				clearInterval,
				URL,
				URLSearchParams,
				Headers,
				fetch,
				AbortController,
				TextEncoder,
				btoa,
				atob,
			);
			return mod.exports;
		};
	}

	return { load: makeRequire('bot.js') };
}

/* ───────── Buffer tối thiểu (chỉ dùng cho XSP base64) ───────── */
var BufferShim = {
	from: function (input) {
		var str = typeof input === 'string' ? input : String(input);
		return {
			toString: function (encoding) {
				if (encoding === 'base64') {
					var bytes = new TextEncoder().encode(str);
					var bin = '';
					for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
					return btoa(bin);
				}
				return str;
			},
		};
	},
};

function ExitSignal(code) {
	this.code = code;
}

/**
 * Chạy engine một lần. Trả về { stop } ngay lập tức; engine tự chạy nền.
 *
 * @param {object} config  { token, loopMode, loopInterval, mode, selectedQuests }
 * @param {object} hooks   { emit(type,data), log(stream,line), exit(code) }
 */
function run(config, hooks) {
	var identity = global.AQIdentity;
	if (!identity) throw new Error('Thiếu AQIdentity (nạp web/identity.js trước).');

	var env = {
		identity: identity,
		timeoutSignal: identity.timeoutSignal,
		phase: 'init',
		destroyed: false,
	};

	env.emit = function (type, data) {
		try { hooks.emit(type, data); } catch (e) {}
	};
	env.log = function (stream, text) {
		try { hooks.log(stream, text); } catch (e) {}
	};
	env.exit = function (code) {
		var n = Number(code) || 0;
		if (env.phase === 'init') throw new ExitSignal(n);
		if (!env.exited) {
			env.exited = true;
			env.log('system', 'Tiến trình engine kết thúc (mã ' + n + ').');
			try { hooks.exit(n); } catch (e) {}
		}
	};
	env.destroy = function () { env.destroyed = true; };

	env.process = {
		env: {
			TOKEN: String(config.token || '').trim(),
			LOOP_MODE: config.loopMode ? '1' : '0',
			LOOP_INTERVAL: String(config.loopInterval || 30),
			MODE: config.mode || 'full',
			SELECTED_QUESTS: Array.isArray(config.selectedQuests) ? config.selectedQuests.join(',') : '',
		},
		platform: 'win32',
		stdout: {
			write: function (chunk) {
				var text = String(chunk == null ? '' : chunk);
				var lines = text.split('\\n');
				for (var i = 0; i < lines.length; i++) {
					var line = lines[i].replace(/\\u0007/g, '').replace(/\\s+$/, '');
					if (!line) continue;
					var marker = line.indexOf('\\u0001AQEVENT\\u0001');
					if (marker !== -1) {
						try {
							var payload = JSON.parse(line.slice(marker + 9));
							env.emit(payload.type, payload.data || {});
						} catch (e) {
							env.log('stdout', line);
						}
					} else {
						env.log('stdout', line);
					}
				}
			},
		},
		stderr: { write: function (chunk) { env.log('stderr', String(chunk == null ? '' : chunk)); } },
		exit: function (code) { env.exit(code); },
		on: function () {},
		once: function () {},
		nextTick: function (fn) { setTimeout(fn, 0); },
	};

	function fmt(args) {
		var out = [];
		for (var i = 0; i < args.length; i++) {
			var a = args[i];
			if (typeof a === 'string') out.push(a);
			else {
				try { out.push(JSON.stringify(a)); } catch (e) { out.push(String(a)); }
			}
		}
		return out.join(' ');
	}
	env.console = {
		log: function () { env.log('stdout', fmt(arguments)); },
		info: function () { env.log('stdout', fmt(arguments)); },
		debug: function () { env.log('stdout', fmt(arguments)); },
		warn: function () { env.log('stderr', fmt(arguments)); },
		error: function () { env.log('stderr', fmt(arguments)); },
	};
	env.Buffer = BufferShim;

	var runtime = createRuntime(env);
	try {
		runtime.load('bot.js');
	} catch (err) {
		if (err instanceof ExitSignal) {
			env.exited = true;
			try { hooks.exit(err.code); } catch (e) {}
			return { stop: function () {} };
		}
		env.emit('fatal', { message: (err && err.message) || String(err) });
		env.log('stderr', 'Lỗi khởi động engine: ' + ((err && err.stack) || err));
		env.exited = true;
		try { hooks.exit(1); } catch (e) {}
		return { stop: function () {} };
	}
	env.phase = 'running';

	return {
		stop: function () {
			// Bridge chủ động terminate worker; đây chỉ là lối thoát mềm nếu cần.
			env.destroyed = true;
		},
	};
}

global.AQEngineBundle = { run: run };
})(typeof self !== 'undefined' ? self : window);
`;

fs.writeFileSync(OUT, out, 'utf8');
const bytes = Buffer.byteLength(out, 'utf8');
console.log('Đã sinh ' + path.relative(ROOT, OUT) + ' (' + (bytes / 1024).toFixed(1) + ' KB)');
