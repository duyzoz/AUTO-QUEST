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
const ADD_TIMEOUT_MS = 5000;
const MAX_RECONNECTS = 5;
const RECONNECT_DELAY_MS = 5000;

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
		this._identifyWaiters = [];
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
		return 'presence=' + this.state + ' apps=[' + Array.from(this.activities.keys()).join(',') + ']';
	}

	buildActivities() {
		const out = [];
		this.activities.forEach((name, appId) => {
			out.push({ name: name || 'Game', type: 0, application_id: appId });
		});
		return out;
	}

	waitIdentify() {
		const self = this;
		return new Promise((resolve) => {
			if (self.state === 'ready') {
				resolve(self.state);
				return;
			}
			self._identifyWaiters.push(resolve);
			setTimeout(() => {
				const i = self._identifyWaiters.indexOf(resolve);
				if (i !== -1) self._identifyWaiters.splice(i, 1);
				resolve(self.state);
			}, ADD_TIMEOUT_MS);
		});
	}

	flushIdentifyWaiters() {
		const waiters = this._identifyWaiters;
		this._identifyWaiters = [];
		for (let i = 0; i < waiters.length; i++) {
			try {
				waiters[i](this.state);
			} catch (e) {}
		}
	}

	add(appId, name) {
		appId = String(appId || '');
		if (!appId) return Promise.resolve(this.state);
		this.activities.set(appId, String(name || ''));
		this.wantActivities = true;
		if (this.state === 'ready') {
			this.sendPresence();
			return Promise.resolve(this.state);
		}
		if (this.state === 'connecting') return this.waitIdentify();
		if (!this.token) {
			this.state = 'unavailable';
			return Promise.resolve(this.state);
		}
		const Ctor = getWsCtor();
		if (!Ctor) {
			this.state = 'unavailable';
			return Promise.resolve(this.state);
		}
		this.connect(Ctor);
		return this.waitIdentify();
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
		this.state = 'connecting';
		this.seq = null;
		let ws;
		try {
			ws = new Ctor(GATEWAY_URL);
		} catch (e) {
			this.state = 'closed';
			this.log('[Presence] khong mo duoc gateway: ' + (e && e.message ? e.message : String(e)));
			this.flushIdentifyWaiters();
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
					self.state = 'ready';
					self.startHeartbeat();
					self.sendPresence();
					self.flushIdentifyWaiters();
				}
			} else if (msg.op === OP_HEARTBEAT) {
				self.sendGatewayHeartbeat();
			}
		};
		ws.onerror = function () {
			/* onclose se xu ly tiep; khong log token, khong nem loi */
		};
		ws.onclose = function () {
			self.clearHeartbeat();
			self.ws = null;
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
						self.flushIdentifyWaiters();
					}
				}, RECONNECT_DELAY_MS);
			} else {
				self.state = self.wantActivities ? 'closed' : 'off';
				self.flushIdentifyWaiters();
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
		/* Identify da mang activity theo — coi nhu da gui xong ke ca
		   khi READY den muon: khong doi READY moi cho heartbeat chay. */
		this.state = 'ready';
		this.startHeartbeat();
		this.flushIdentifyWaiters();
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
