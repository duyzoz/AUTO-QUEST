'use strict';
Object.defineProperty(exports, '__esModule', { value: true });

/**
 * CARDV2 — Gateway presence cho quest choi tren PC (PLAY_ON_DESKTOP).
 *
 * Vi sao can: engine web truoc day CHI goi REST (fetch shim, khong co
 * phien gateway nao, khong bao gio bao cao game dang chay). Trong khi
 * client Discord that chi ghi nhan tien do PLAY_ON_DESKTOP khi game
 * duoc bao cao la dang chay (desktop phat hien process -> presence).
 * Cac cong cu cong dong deu xac nhan: quest choi game khong chay
 * duoc tu phien trinh duyet vi trinh duyet khong bao cao game dang
 * chay; cach lam cua ho la gia lap game dang chay (process gia hoac
 * RPC SET_ACTIVITY). Day la nghi van so 1 cho 401/40001 keo dai o
 * Roblox + Arknights trong khi video/scan/claim (khong can game
 * dang chay) van OK voi cung token + header.
 *
 * Cach lam o day (trong kha nang cua trinh duyet): mo mot WebSocket
 * gateway that (wss://gateway.discord.gg) bang token cua user, identify
 * voi properties tu AQIdentity, va gui presence activity {type: 0,
 * application_id} cho game dang cày — dung tin hieu client that gui
 * khi game mo. Khong dung RPC socket (chi co tren desktop), khong
 * dung process gia (khong lam duoc trong trinh duyet).
 *
 * Phong thu tuyet doi: moi loi o day chi lam presence xuong cap ve
 * hanh vi cu (van goi REST heartbeat binh thuong), KHONG BAO GIO
 * nem loi vao luong quest. Khong log token — chi log appId, ten
 * game (da co trong log quest) va trang thai phien.
 */

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const OP_DISPATCH = 0;
const OP_HEARTBEAT = 1;
const OP_IDENTIFY = 2;
const OP_PRESENCE = 3;
const OP_HELLO = 10;
const MAX_RECONNECTS = 5;
const RECONNECT_DELAY_MS = 5000;
/* HBCAP (2026-11-01): presence-ready gate — nhip heartbeat dau tien
   chi gui SAU KHI gateway READY + op 3 activity cua dung game do
   da gui xong. Timeout gioi han (mac dinh 10s): qua han van chay
   heartbeat REST cu va log presence=timeout, khong treo luong quest.
   Ly do: ban CARDV2 chi doi Identify GUI XONG (sendIdentify tu set
   state='ready'), nen nhip 1 van co the chay khi phien moi chi o
   'connecting' — dung nhu log live cua Ethan (presence=connecting
   o tick 1/5). */
const PRESENCE_GATE_TIMEOUT_MS = 10000;
/* ANYACCT (2026-11-01): marker phien ban code presence-gate — in vao
   dong chan doan heartbeat cua engine + dong marker Auto-start cua
   renderer, de lan chay live sau chung minh duoc dang chay code moi
   (khong phai bundle cache cu — dung mo ho cua lan chay 13:31). */
const PRESENCE_BUILD_MARKER = 'presence-gate-v2';

let WsCtorOverride = null;
function setWebSocketCtor(fn) {
	WsCtorOverride = typeof fn === 'function' ? fn : null;
}
function getWsCtor() {
	if (WsCtorOverride) return WsCtorOverride;
	try {
		return typeof WebSocket !== 'undefined' ? WebSocket : null;
	} catch (e) {
		return null;
	}
}

class PresenceSession {
	constructor(opts) {
		opts = opts || {};
		this.token = String(opts.token || '');
		this.properties = opts.properties || null;
		this.log = typeof opts.log === 'function' ? opts.log : function () {};
		this.ws = null;
		this.activities = new Map();
		this.state = 'off';
		this.seq = null;
		this.hbIntervalMs = 0;
		this.hbTimer = null;
		this.reconnects = 0;
		this.wantActivities = false;
		/* HBCAP: nguoi doi gate — moi muc { appId, resolve }. Chi giai
		   quyet khi READY (ke ca reconnect), khi phien chet, hoac khi
		   timeout rieng cua tung waiter het han. */
		this._activityWaiters = [];
		/* HBCAP: true chi khi READY cua phien HIEN TAI da den va op 3
		   da gui xong. Reset moi lan connect()/close() — READY cua
		   phien cu khong duoc chung minh cho phien moi. */
		this.presenceConfirmed = false;
		/* ANYACCT: ly do gateway that bai gan nhat { kind, code,
		   detail } — null khi chua co loi. kind: 'timeout' (gate het
		   han), 'close' (gateway dong, kem code), 'transport-error'
		   (loi WebSocket), 'connect-error' (khong mo duoc socket).
		   Chi ma/ly do gateway tra — khong bao gio token. Xoa o
		   add() khi bat dau phien moi va o READY khi phien song. */
		this.lastFailure = null;
		this._reconnectTimer = null;
		/* CARDV2: chet that sau close() cuoi — tin nhan gateway den
		   muon (vi du READY den sau khi quest xong trong tich tac)
		   khong duoc phep khoi dong lai timer heartbeat hay gui op 3
		   nua. connect() moi se reset co nay. */
		this.dead = false;
	}

	describe() {
		return { state: this.state, apps: Array.from(this.activities.keys()) };
	}

	describeShort() {
		const base = 'presence=' + this.state + ' apps=[' + Array.from(this.activities.keys()).join(',') + ']';
		if (!this.lastFailure) return base;
		const code = this.lastFailure.code != null ? ':' + this.lastFailure.code : '';
		return base + ' fail=' + this.lastFailure.kind + code;
	}

	buildActivities() {
		const out = [];
		this.activities.forEach((name, appId) => {
			out.push({ name: name || 'Game', type: 0, application_id: appId });
		});
		return out;
	}

	/* HBCAP — presence-ready gate. Chi resolve 'ready' khi phien HIEN
	   TAI da READY, op 3 da gui, va appId nay co trong activities.
	   Cac trang thai cuoi (unavailable/closed/off) resolve ngay, khong
	   doi. Dang connecting/identifying thi doi toi da timeoutMs, het
	   han resolve 'timeout' (nguoi goi van chay heartbeat REST cu).
	   Khong bao gio treo, khong bao gio nem loi. */
	waitForActivity(appId, timeoutMs) {
		const self = this;
		appId = String(appId || '');
		const timeout = typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : PRESENCE_GATE_TIMEOUT_MS;
		return new Promise((resolve) => {
			if (self.state === 'ready' && self.presenceConfirmed && self.activities.has(appId)) {
				resolve('ready');
				return;
			}
			if (self.state === 'unavailable' || self.state === 'closed' || self.state === 'off') {
				resolve(self.state);
				return;
			}
			const waiter = { appId: appId, resolve: resolve, timer: null };
			waiter.timer = setTimeout(() => {
				const i = self._activityWaiters.indexOf(waiter);
				if (i !== -1) self._activityWaiters.splice(i, 1);
				/* ANYACCT: gate het han phai de lai dau vet — truoc day
				   chi log presence=timeout o questManager, con cac dong
				   warn nhip sau van chi noi presence=connecting mai
				   ma khong noi gate da bo cuoc. */
				if (self.state !== 'ready') self.lastFailure = { kind: 'timeout', code: null, detail: null };
				resolve('timeout');
			}, timeout);
			self._activityWaiters.push(waiter);
		});
	}

	_notifyActivityWaiters(result) {
		const waiters = this._activityWaiters;
		this._activityWaiters = [];
		for (let i = 0; i < waiters.length; i++) {
			try {
				if (waiters[i].timer) clearTimeout(waiters[i].timer);
			} catch (e) {}
			try {
				waiters[i].resolve(result);
			} catch (e) {}
		}
	}

	/* HBCAP: add() CHI khoi dong phien va tra ve trang thai hien tai
	   ngay lap tuc — khong doi READY o day. Viec doi READY + op 3
	   thuoc ve waitForActivity() (gate o questManager) de timeout
	   cua gate la gioi han duy nhat truoc nhip heartbeat dau tien. */
	add(appId, name) {
		appId = String(appId || '');
		if (!appId) return Promise.resolve(this.state);
		this.activities.set(appId, String(name || ''));
		this.wantActivities = true;
		if (this.state === 'ready' && this.presenceConfirmed) {
			this.sendPresence();
			return Promise.resolve(this.state);
		}
		if (this.state === 'connecting' || this.state === 'identifying' || this.state === 'ready') {
			return Promise.resolve(this.state);
		}
		if (!this.token) {
			this.state = 'unavailable';
			return Promise.resolve(this.state);
		}
		const Ctor = getWsCtor();
		if (!Ctor) {
			this.state = 'unavailable';
			return Promise.resolve(this.state);
		}
		/* ANYACCT: phien moi thi dau vet loi cu het hieu luc — loi cua
		   lan chay truoc khong duoc hien tren dong chan doan cua lan
		   chay moi. Reconnect trong cung phien (onclose) giu nguyen. */
		this.lastFailure = null;
		this.connect(Ctor);
		return Promise.resolve(this.state);
	}

	remove(appId) {
		appId = String(appId || '');
		this.activities.delete(appId);
		if (this.activities.size === 0) {
			this.wantActivities = false;
			this.close();
			return;
		}
		if (this.state === 'ready') this.sendPresence();
	}

	connect(Ctor) {
		const self = this;
		this.dead = false;
		this.presenceConfirmed = false;
		this.state = 'connecting';
		this.log('[Presence] gateway: connecting');
		this.seq = null;
		let ws;
		try {
			ws = new Ctor(GATEWAY_URL);
		} catch (e) {
			this.state = 'closed';
			this.lastFailure = { kind: 'connect-error', code: null, detail: null };
			this.log('[Presence] khong mo duoc gateway: ' + (e && e.message ? e.message : String(e)));
			this._notifyActivityWaiters('closed');
			return;
		}
		this.ws = ws;
		ws.onopen = function () {};
		ws.onmessage = function (ev) {
			if (self.dead) return;
			let msg = null;
			try {
				msg = JSON.parse(ev && ev.data ? ev.data : '');
			} catch (e) {
				return;
			}
			if (!msg) return;
			if (msg.op === OP_HELLO) {
				self.hbIntervalMs = Number((msg.d && msg.d.heartbeat_interval) || 0) || 41250;
				self.sendIdentify();
			} else if (msg.op === OP_DISPATCH) {
				if (msg.s != null) self.seq = msg.s;
				if (msg.t === 'READY') {
					/* HBCAP: CHI day moi la 'ready' that — READY cua
					   phien hien tai da den, op 3 gui ngay sau do.
					   Gate (waitForActivity) chi mo khi toi day. */
					self.state = 'ready';
					self.presenceConfirmed = true;
					self.lastFailure = null;
					self.startHeartbeat();
					self.sendPresence();
					self.log('[Presence] gateway: ready (da gui op 3 activity)');
					self._notifyActivityWaiters('ready');
				}
			} else if (msg.op === OP_HEARTBEAT) {
				self.sendGatewayHeartbeat();
			}
		};
		ws.onerror = function () {
			/* ANYACCT: truoc day onerror RONG — loi transport bi nuot
			   tron, log live chi thay presence=connecting mai ma khong
			   biet vi sao. Ghi dau vet + log (khong token, khong nem
			   loi; onclose van xu ly reconnect/dong phien nhu cu). */
			if (self.state !== 'ready') self.lastFailure = { kind: 'transport-error', code: null, detail: null };
			self.log('[Presence] gateway: loi ket noi (transport error — cho onclose xu ly)');
		};
		ws.onclose = function (ev) {
			self.clearHeartbeat();
			self.ws = null;
			self.presenceConfirmed = false;
			/* ANYACCT: ghi ma dong + ly do gateway tra (chi ma/ly do,
			   khong token) — ma dong la bang chung chan doan quan
			   trong nhat khi gateway khong bao gio ready (vi du 4004
			   = identify bi tu choi, 1006 = mat ket noi bat thuong).
			   ev co the undefined o mock — phong thu day du. */
			const closeCode = ev && ev.code != null ? ev.code : null;
			const closeReason = ev && ev.reason ? String(ev.reason).slice(0, 80) : '';
			if (self.state !== 'off') self.lastFailure = { kind: 'close', code: closeCode, detail: closeReason || null };
			if (closeCode != null) self.log('[Presence] gateway: closed (code=' + closeCode + (closeReason ? ' reason=' + closeReason : '') + ')');
			if (self.wantActivities && self.reconnects < MAX_RECONNECTS) {
				self.reconnects += 1;
				self.state = 'connecting';
				self.log('[Presence] gateway mat ket noi, thu noi lai (' + self.reconnects + '/' + MAX_RECONNECTS + ')');
				self._reconnectTimer = setTimeout(() => {
					self._reconnectTimer = null;
					const Next = getWsCtor();
					if (Next && self.wantActivities) self.connect(Next);
					else {
						self.state = 'closed';
						self.log('[Presence] gateway: closed');
						self._notifyActivityWaiters('closed');
					}
				}, RECONNECT_DELAY_MS);
			} else {
				self.state = self.wantActivities ? 'closed' : 'off';
				self.log('[Presence] gateway: ' + self.state);
				self._notifyActivityWaiters(self.state);
			}
		};
	}

	sendIdentify() {
		if (!this.ws) return;
		const props = this.properties || { os: 'Windows', browser: 'Discord Client', device: '' };
		const payload = {
			op: OP_IDENTIFY,
			d: {
				token: this.token,
				intents: 0,
				properties: props,
				presence: {
					since: null,
					activities: this.buildActivities(),
					status: 'online',
					afk: false,
				},
			},
		};
		try {
			this.ws.send(JSON.stringify(payload));
		} catch (e) {}
		/* HBCAP: Identify CHI mang activity theo trong payload — no
		   KHONG chung minh phien da READY. Trang thai chi chuyen
		   sang 'ready' khi dispatch READY den (xem onmessage), va
		   gate chi mo o do. Truoc day dong nay tu set ready +
		   flush waiter ngay khi Identify gui xong, nen nhip heartbeat
		   dau tien van chay duoc khi phien moi o 'connecting'. */
		this.state = 'identifying';
		this.log('[Presence] gateway: identifying (da gui Identify)');
	}

	sendPresence() {
		if (!this.ws || this.ws.readyState !== 1) return;
		const payload = {
			op: OP_PRESENCE,
			d: { since: null, activities: this.buildActivities(), status: 'online', afk: false },
		};
		try {
			this.ws.send(JSON.stringify(payload));
		} catch (e) {}
	}

	sendGatewayHeartbeat() {
		if (!this.ws || this.ws.readyState !== 1) return;
		try {
			this.ws.send(JSON.stringify({ op: OP_HEARTBEAT, d: this.seq }));
		} catch (e) {}
	}

	startHeartbeat() {
		const self = this;
		if (this.dead) return;
		this.clearHeartbeat();
		if (!this.hbIntervalMs) return;
		this.hbTimer = setInterval(() => {
			self.sendGatewayHeartbeat();
		}, this.hbIntervalMs);
	}

	clearHeartbeat() {
		if (this.hbTimer) {
			try {
				clearInterval(this.hbTimer);
			} catch (e) {}
			this.hbTimer = null;
		}
	}

	close() {
		this.dead = true;
		this.presenceConfirmed = false;
		this._notifyActivityWaiters('off');
		this.clearHeartbeat();
		if (this._reconnectTimer) {
			try {
				clearTimeout(this._reconnectTimer);
			} catch (e) {}
			this._reconnectTimer = null;
		}
		const ws = this.ws;
		this.ws = null;
		if (ws) {
			try {
				ws.close();
			} catch (e) {}
		}
		if (!this.wantActivities) this.state = 'off';
	}
}

exports.PresenceSession = PresenceSession;
exports.setWebSocketCtor = setWebSocketCtor;
exports.PRESENCE_GATE_TIMEOUT_MS = PRESENCE_GATE_TIMEOUT_MS;
exports.PRESENCE_BUILD_MARKER = PRESENCE_BUILD_MARKER;
