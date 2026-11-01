'use strict';

/**
 * MOCK HEARTBEAT TESTS — FIX64-P0 (2026-10-31).
 *
 * No token, no network, no live Discord. The REAL QuestManager
 * (web/engine/src/questManager.js) runs against a scripted REST client:
 * every heartbeat/claim call is answered from a local script, and the
 * engine's stdout event markers (quest:progress / quest:error /
 * quest:heartbeat-blocked / quest:claim / quest:skip) are captured.
 * Timeouts are stubbed to return immediately (but they RECORD the
 * requested wait, so backoff can be asserted without sleeping).
 *
 * Covered:
 *   (a) 401 on task appId + success on quest appId = progress advances,
 *       errors reset, no blocked/error event.
 *   (b) 401 on BOTH appIds = quest enters 'quest:heartbeat-blocked'
 *       (NOT generic quest:error), heartbeat stops after 5 ticks
 *       (10 calls: 2 per tick), next-tick wait backs off to 40s.
 *   (c) Isolation: a blocked quest does not stop a second quest running
 *       concurrently (that quest still claims).
 *   (d) Pre-check: an expired quest is skipped with a clear reason and
 *       sends ZERO heartbeats.
 *   (e) Non-401 errors still failQuest at 5/5 and never enter the
 *       blocked state (blocked is 401-specific).
 *   (i) HBCAP presence-ready gate: no heartbeat tick before gateway
 *       READY + op 3 for this game; transitions logged.
 *   (j) HBCAP gate timeout: never-READY gateway still proceeds with
 *       REST heartbeat and logs presence=timeout.
 *
 * Run: node web/test/mock-heartbeat.test.js (also wired into `npm test`)
 */

const path = require('node:path');
/* utils.js requires 'undici' (replaced by a browser-fetch shim in the real
   bundle, and never touched by heartbeat paths). Stub it so the test can
   load the real QuestManager in plain Node without installing anything. */
const Module = require('node:module');
const origLoad = Module._load;
Module._load = function (request, ...args) {
	if (request === 'undici') {
		return { fetch: async () => { throw new Error('mock: undici fetch not available'); } };
	}
	return origLoad.call(this, request, ...args);
};
const { QuestManager } = require('../engine/src/questManager');
const { Quest } = require('../engine/src/quest');
const { isEventLine, parseEventLine } = require('../engine/src/events');
const { setWebSocketCtor, PresenceSession, PRESENCE_BUILD_MARKER } = require('../engine/src/presence');

const TASK_APP = '111111111111111111';
const QUEST_APP = '222222222222222222';

let failures = 0;
let passes = 0;
function ok(label, detail) {
	passes += 1;
	console.log(`[PASS] ${label} — ${detail}`);
}
function fail(label, detail) {
	failures += 1;
	console.log(`[FAIL] ${label} — ${detail}`);
}
function assert(cond, message) {
	if (!cond) throw new Error(message);
}

/* Capture engine stdout events without hiding normal console output. */
const events = [];
const diagLines = [];
const presenceLines = [];
const origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...rest) => {
	for (const line of String(chunk).split('\n')) {
		if (isEventLine(line)) {
			const parsed = parseEventLine(line);
			if (parsed) events.push(parsed);
		}
		if (line.includes('[Chẩn đoán heartbeat]')) diagLines.push(line);
		if (line.includes('[Presence]')) presenceLines.push(line);
	}
	return origWrite(chunk, ...rest);
};
const eventsOf = (type, id) =>
	events.filter((e) => e.type === type && (!id || e.data.id === id));

function err401() {
	const e = new Error('Không được cấp phép');
	e.status = 401;
	e.code = 40001;
	return e;
}
function err500() {
	const e = new Error('Lỗi máy chủ');
	e.status = 500;
	return e;
}
function makeQuest(id, { expired = false } = {}) {
	const now = new Date().toISOString();
	return Quest.create({
		id,
		config: {
			messages: { quest_name: `Quest ${id}`, game_title: 'Game', game_publisher: 'Pub' },
			application: { id: QUEST_APP, name: 'Game' },
			expires_at: expired
				? new Date(Date.now() - 1000).toISOString()
				: new Date(Date.now() + 86400000).toISOString(),
			task_config_v2: {
				tasks: {
					PLAY_ON_DESKTOP: { applications: [{ id: TASK_APP }], target: 60 },
				},
			},
			rewards_config: { platforms: [0], rewards: [{ orb_quantity: 100 }] },
		},
		user_status: {
			enrolled_at: now,
			progress: { PLAY_ON_DESKTOP: { value: 0 } },
		},
		targeted_content: 0,
		preview: false,
	});
}
function statusDone() {
	const now = new Date().toISOString();
	return {
		enrolled_at: now,
		completed_at: now,
		progress: { PLAY_ON_DESKTOP: { value: 60 } },
	};
}
function makeManager(post) {
	const mgr = new QuestManager({ rest: { post, get: async () => ({}) } }, []);
	const waits = [];
	mgr.timeout = async (ms) => {
		waits.push(ms);
	};
	mgr._waits = waits;
	return mgr;
}

(async () => {
	/* (a) Fallback success: 401 task appId -> quest appId works. */
	try {
		events.length = 0;
		const calls = [];
		const mgr = makeManager(async (url, opts) => {
			const body = (opts && opts.body) || {};
			calls.push({ url, appId: body.application_id, terminal: body.terminal });
			if (url.endsWith('/claim-reward')) {
				return { user_status: { ...statusDone(), claimed_at: new Date().toISOString() } };
			}
			if (body.application_id === TASK_APP && body.terminal !== true) throw err401();
			return statusDone();
		});
		const q = makeQuest('900000000000000001');
		await mgr.doingPlayOnPlatformQuest(q, 'Quest A', 60, 'PLAY_ON_DESKTOP', 'Game', TASK_APP, 20);
		assert(calls.some((c) => c.appId === QUEST_APP), 'fallback quest appId was never tried');
		assert(
			eventsOf('quest:progress', '900000000000000001').some((e) => e.data.secondsDone === 60),
			'no quest:progress with 60s after fallback success',
		);
		assert(
			eventsOf('quest:claim', '900000000000000001').some((e) => e.data.confirmed === true),
			'quest did not reach confirmed claim after fallback success',
		);
		assert(
			eventsOf('quest:error', '900000000000000001').length === 0 &&
				eventsOf('quest:heartbeat-blocked', '900000000000000001').length === 0,
			'unexpected error/blocked event on fallback success',
		);
		ok('heartbeat fallback success', '401 task -> quest appId works, progress 60s, claim confirmed');
	} catch (e) {
		fail('heartbeat fallback success', e.message);
	}

	/* (b) Both appIds 401 -> blocked, not failQuest, stops after 5 ticks. */
	try {
		events.length = 0;
		const calls = [];
		const mgr = makeManager(async () => {
			calls.push(1);
			throw err401();
		});
		const q = makeQuest('900000000000000002');
		await mgr.doingPlayOnPlatformQuest(q, 'Quest B', 60, 'PLAY_ON_DESKTOP', 'Game', TASK_APP, 20);
		assert(
			eventsOf('quest:heartbeat-blocked', '900000000000000002').length === 1,
			'no quest:heartbeat-blocked event',
		);
		assert(
			eventsOf('quest:error', '900000000000000002').length === 0,
			'blocked quest must NOT emit generic quest:error',
		);
		assert(calls.length === 10, `expected 10 heartbeat calls (5 ticks x 2 appIds), got ${calls.length}`);
		assert(
			mgr._waits.length === 4 && mgr._waits.every((w) => w === 40000),
			`expected 4 backoff waits of 40000ms, got [${mgr._waits.join(',')}]`,
		);
		ok('heartbeat both-401 blocked', 'blocked event, no error, 10 calls then stop, 40s backoff');
	} catch (e) {
		fail('heartbeat both-401 blocked', e.message);
	}

	/* (c) Isolation: blocked quest does not stop a concurrent good quest. */
	try {
		events.length = 0;
		const mgr = makeManager(async (url, opts) => {
			const body = (opts && opts.body) || {};
			if (url.endsWith('/claim-reward')) {
				return { user_status: { ...statusDone(), claimed_at: new Date().toISOString() } };
			}
			if (url.includes('900000000000000003')) throw err401();
			return statusDone();
		});
		const blocked = makeQuest('900000000000000003');
		const good = makeQuest('900000000000000004');
		await Promise.allSettled([
			mgr.doingQuest(blocked, 20),
			mgr.doingQuest(good, 20),
		]);
		assert(
			eventsOf('quest:heartbeat-blocked', '900000000000000003').length === 1,
			'blocked quest missing blocked event',
		);
		assert(
			eventsOf('quest:claim', '900000000000000004').some((e) => e.data.confirmed === true),
			'concurrent good quest did not claim',
		);
		ok('heartbeat isolation', 'blocked quest + good quest claim concurrently');
	} catch (e) {
		fail('heartbeat isolation', e.message);
	}

	/* (d) Expired quest: skipped, zero heartbeats. */
	try {
		events.length = 0;
		let calls = 0;
		const mgr = makeManager(async () => {
			calls += 1;
			return statusDone();
		});
		const q = makeQuest('900000000000000005', { expired: true });
		await mgr.doingQuest(q, 20);
		assert(
			eventsOf('quest:skip', '900000000000000005').some((e) =>
				String(e.data.reason || '').includes('hết thời gian'),
			),
			'no skip event with expiry reason',
		);
		assert(calls === 0, `expired quest sent ${calls} heartbeat(s)`);
		ok('heartbeat expired pre-check', 'expired quest skipped, 0 heartbeats');
	} catch (e) {
		fail('heartbeat expired pre-check', e.message);
	}

	/* (e) Non-401 errors still failQuest at 5/5, never blocked. */
	try {
		events.length = 0;
		let calls = 0;
		const mgr = makeManager(async () => {
			calls += 1;
			throw err500();
		});
		const q = makeQuest('900000000000000006');
		await mgr.doingPlayOnPlatformQuest(q, 'Quest F', 60, 'PLAY_ON_DESKTOP', 'Game', TASK_APP, 20);
		assert(
			eventsOf('quest:error', '900000000000000006').length === 1,
			'non-401 error did not failQuest at 5/5',
		);
		assert(
			eventsOf('quest:heartbeat-blocked', '900000000000000006').length === 0,
			'non-401 error must NOT enter blocked state',
		);
		assert(calls === 5, `expected 5 calls for non-401, got ${calls}`);
		ok('heartbeat non-401 still fails', '500 errors failQuest at 5/5, no blocked state');
	} catch (e) {
		fail('heartbeat non-401 still fails', e.message);
	}

	/* (f) Enrolled diagnostic line at doingQuest start (ORBRING): one line
	   with enrolled flag + task + both appIds, before the 401/blocked flow. */
	try {
		events.length = 0;
		diagLines.length = 0;
		const mgr = makeManager(async () => {
			throw err401();
		});
		const q = makeQuest('900000000000000007');
		await mgr.doingQuest(q, 20);
		assert(
			eventsOf('quest:heartbeat-blocked', '900000000000000007').length === 1,
			'no blocked event after doingQuest 401 run',
		);
		assert(diagLines.length === 1, `expected exactly 1 enrolled diagnostic line, got ${diagLines.length}`);
		const line = diagLines[0];
		assert(line.includes('enrolled=yes'), `diagnostic line must say enrolled=yes, got: ${line}`);
		assert(line.includes('PLAY_ON_DESKTOP'), `diagnostic line must name the task, got: ${line}`);
		assert(line.includes(TASK_APP), `diagnostic line must carry task appId, got: ${line}`);
		assert(line.includes(QUEST_APP), `diagnostic line must carry quest appId, got: ${line}`);
		ok('heartbeat enrolled diagnostic', 'doingQuest start prints enrolled=yes + task + both appIds');
	} catch (e) {
		fail('heartbeat enrolled diagnostic', e.message);
	}

	/* (g) CARDV2 presence: desktop run opens a gateway session whose
	   Identify carries the game as a Playing activity, refreshes it with
	   op 3 on READY, and closes the socket when the quest finishes
	   (presence cleared, nothing left dangling into the next run). */
	try {
		events.length = 0;
		class FakeSocket {
			static instances = [];
			constructor(url) {
				this.url = url;
				this.sent = [];
				this.readyState = 0;
				FakeSocket.instances.push(this);
			}
			send(data) {
				this.sent.push(JSON.parse(data));
			}
			close() {
				this.readyState = 3;
				if (this.onclose) this.onclose();
			}
			simulateOpen() {
				this.readyState = 1;
				if (this.onopen) this.onopen();
			}
			simulateMessage(obj) {
				if (this.onmessage) this.onmessage({ data: JSON.stringify(obj) });
			}
			simulateHello() {
				this.simulateOpen();
				this.simulateMessage({ op: 10, d: { heartbeat_interval: 41250 } });
			}
			simulateReady() {
				this.simulateMessage({ op: 0, s: 1, t: 'READY', d: {} });
			}
		}
		setWebSocketCtor(FakeSocket);
		try {
			const mgr = makeManager(async (url, opts) => {
				if (url.endsWith('/claim-reward')) {
					return { user_status: { ...statusDone(), claimed_at: new Date().toISOString() } };
				}
				return statusDone();
			});
			mgr.client.token = 'mock-token';
			const q = makeQuest('900000000000000008');
			const run = mgr.doingQuest(q, 20);
			await new Promise((r) => setImmediate(r));
			const sock = FakeSocket.instances[FakeSocket.instances.length - 1];
			assert(sock, 'no gateway socket created for desktop run');
			assert(String(sock.url).startsWith('wss://gateway.discord.gg/'), `unexpected gateway url: ${sock.url}`);
			/* HBCAP: gate doi READY nen Hello + READY khong can den
			   lien nhau nua — loop khong the chay truoc READY. Van
			   mo phong lien nhau o day nhu hanh vi that (READY den
			   trong mili-giay), gate se mo ngay khi READY + op 3 xong. */
			sock.simulateHello();
			sock.simulateReady();
			await run;
			const identify = sock.sent.find((m) => m.op === 2);
			assert(identify, 'gateway Identify was never sent');
			assert(identify.d.intents === 0, 'gateway Identify must use intents 0');
			assert(
				Array.isArray(identify.d.presence.activities) &&
					identify.d.presence.activities.some((a) => a.application_id === TASK_APP && a.type === 0),
				`Identify presence must carry the game as Playing activity, got: ${JSON.stringify(identify.d.presence)}`,
			);
			assert(
				sock.sent.some((m) => m.op === 3),
				'no op 3 presence refresh after READY',
			);
			assert(sock.readyState === 3, 'gateway socket must close when the quest finishes');
			/* READY den muon sau khi dong phai bi bo qua hoan toan:
			   khong op 3 moi, khong timer heartbeat moi nao duoc tao. */
			const sentBefore = sock.sent.length;
			sock.simulateReady();
			await new Promise((r) => setImmediate(r));
			assert(sock.sent.length === sentBefore, 'late READY after close must not send anything');
			ok('heartbeat gateway presence', 'Identify carries game Playing activity + op 3 refresh + socket closed on finish + late READY ignored');
		} finally {
			setWebSocketCtor(null);
		}
	} catch (e) {
		setWebSocketCtor(null);
		fail('heartbeat gateway presence', e.message);
	}

	/* (h) CARDV2: every 401 warn line carries the presence state at that
	   tick (presence=... apps=[...]), so the next live run proves whether
	   the game activity was active when Discord refused the heartbeat. */
	let origErr = null;
	try {
		events.length = 0;
		const warnLines = [];
		origErr = process.stderr.write.bind(process.stderr);
		process.stderr.write = (chunk, ...rest) => {
			for (const line of String(chunk).split('\n')) {
				if (line.includes('Lỗi gửi tín hiệu heartbeat')) warnLines.push(line);
			}
			return origErr(chunk, ...rest);
		};
		const mgr = makeManager(async () => {
			throw err401();
		});
		const q = makeQuest('900000000000000009');
		await mgr.doingQuest(q, 20);
		process.stderr.write = origErr;
		assert(warnLines.length >= 5, `expected >= 5 heartbeat warn lines, got ${warnLines.length}`);
		assert(
			warnLines.every((l) => l.includes('presence=') && l.includes('apps=[')),
			`every 401 warn line must carry presence state, got: ${warnLines[0] || '(none)'}`,
		);
		ok('heartbeat 401 presence diagnostic', `${warnLines.length} warn lines, all carry presence state`);
	} catch (e) {
		try {
			if (origErr) process.stderr.write = origErr;
		} catch (_) {}
		fail('heartbeat 401 presence diagnostic', e.message);
	}

	/* (i) HBCAP presence-ready gate: nhip heartbeat dau tien doi
	   gateway READY + op 3 activity cua DUNG game nay; khi phien
	   moi o connecting/identifying thi khong co POST nao duoc gui,
	   va cac chuyen trang thai duoc log theo kenh activity log. */
	try {
		events.length = 0;
		presenceLines.length = 0;
		class FakeSocket {
			static instances = [];
			constructor(url) {
				this.url = url;
				this.sent = [];
				this.readyState = 0;
				FakeSocket.instances.push(this);
			}
			send(data) {
				this.sent.push(JSON.parse(data));
			}
			close() {
				this.readyState = 3;
				if (this.onclose) this.onclose();
			}
			simulateOpen() {
				this.readyState = 1;
				if (this.onopen) this.onopen();
			}
			simulateMessage(obj) {
				if (this.onmessage) this.onmessage({ data: JSON.stringify(obj) });
			}
			simulateHello() {
				this.simulateOpen();
				this.simulateMessage({ op: 10, d: { heartbeat_interval: 41250 } });
			}
			simulateReady() {
				this.simulateMessage({ op: 0, s: 1, t: 'READY', d: {} });
			}
		}
		setWebSocketCtor(FakeSocket);
		try {
			let op3AtFirstCall = null;
			let calls = 0;
			const mgr = makeManager(async (url) => {
				if (url.endsWith('/claim-reward')) {
					return { user_status: { ...statusDone(), claimed_at: new Date().toISOString() } };
				}
				const sock = FakeSocket.instances[FakeSocket.instances.length - 1];
				if (op3AtFirstCall === null && sock) op3AtFirstCall = sock.sent.some((m) => m.op === 3);
				calls += 1;
				return statusDone();
			});
			mgr.client.token = 'mock-token';
			const q = makeQuest('900000000000000010');
			const run = mgr.doingQuest(q, 20);
			await new Promise((r) => setImmediate(r));
			const sock = FakeSocket.instances[FakeSocket.instances.length - 1];
			assert(sock, 'no gateway socket created for desktop run');
			sock.simulateHello(); // Identify gui xong, van identifying — chua READY
			await new Promise((r) => setTimeout(r, 50));
			assert(calls === 0, `gate must hold first tick before READY, but ${calls} heartbeat call(s) already sent`);
			sock.simulateReady(); // READY + op 3 -> gate mo
			await run;
			assert(op3AtFirstCall === true, 'op 3 activity must be sent before the first heartbeat tick');
			assert(calls >= 1, 'no heartbeat call after gate opened');
			assert(
				eventsOf('quest:claim', '900000000000000010').some((e) => e.data.confirmed === true),
				'quest did not claim after gate opened',
			);
			const joined = presenceLines.join('\n');
			assert(
				joined.includes('gateway: connecting') && joined.includes('gateway: identifying') && joined.includes('gateway: ready'),
				`presence transitions missing, got: ${joined}`,
			);
			ok('heartbeat presence-ready gate', 'no tick before READY, op 3 before first tick, connecting->identifying->ready logged');
		} finally {
			setWebSocketCtor(null);
		}
	} catch (e) {
		setWebSocketCtor(null);
		fail('heartbeat presence-ready gate', e.message);
	}

	/* (j) HBCAP gate timeout: gateway khong bao gio READY -> het
	   timeout gioi han thi van chay heartbeat REST cu (khong treo)
	   va log presence=timeout de chung minh truong hop nay. */
	try {
		events.length = 0;
		presenceLines.length = 0;
		class FakeSocket {
			static instances = [];
			constructor(url) {
				this.url = url;
				this.sent = [];
				this.readyState = 0;
				FakeSocket.instances.push(this);
			}
			send(data) {
				this.sent.push(JSON.parse(data));
			}
			close() {
				this.readyState = 3;
				if (this.onclose) this.onclose();
			}
		}
		setWebSocketCtor(FakeSocket);
		try {
			let calls = 0;
			const mgr = makeManager(async (url) => {
				if (url.endsWith('/claim-reward')) {
					return { user_status: { ...statusDone(), claimed_at: new Date().toISOString() } };
				}
				calls += 1;
				return statusDone();
			});
			mgr.presenceGateTimeoutMs = 50;
			mgr.client.token = 'mock-token';
			const q = makeQuest('900000000000000011');
			await mgr.doingQuest(q, 20);
			assert(calls >= 1, 'gate timeout must still let heartbeat ticks proceed');
			assert(
				presenceLines.some((l) => l.includes('presence=timeout')),
				`gate timeout line missing, got: ${presenceLines.join(' | ')}`,
			);
			assert(
				eventsOf('quest:claim', '900000000000000011').some((e) => e.data.confirmed === true),
				'quest did not claim after gate timeout',
			);
			ok('heartbeat presence gate timeout', 'proceeds after 50ms timeout, presence=timeout logged');
		} finally {
			setWebSocketCtor(null);
		}
	} catch (e) {
		setWebSocketCtor(null);
		fail('heartbeat presence gate timeout', e.message);
	}

	/* (k) ANYACCT gate timeout ghi dau vet: session khong bao gio READY
	   -> waitForActivity het han -> describeShort mang fail=timeout
	   (truoc day cac dong warn nhip sau chi noi presence=connecting
	   mai ma khong noi gate da bo cuoc). */
	try {
		class FakeSocket {
			constructor(url) {
				this.url = url;
				this.sent = [];
				this.readyState = 0;
			}
			send(data) { this.sent.push(JSON.parse(data)); }
			close() {
				this.readyState = 3;
				if (this.onclose) this.onclose();
			}
		}
		setWebSocketCtor(FakeSocket);
		try {
			const logs = [];
			const sess = new PresenceSession({ token: 'mock-token', log: (l) => logs.push(l) });
			await sess.add(TASK_APP, 'Game');
			const state = await sess.waitForActivity(TASK_APP, 50);
			assert(state === 'timeout', `expected gate timeout, got ${state}`);
			assert(sess.describeShort().includes('fail=timeout'), `describeShort must carry fail=timeout, got: ${sess.describeShort()}`);
			assert(PRESENCE_BUILD_MARKER === 'presence-gate-v2', `build marker must be presence-gate-v2, got: ${PRESENCE_BUILD_MARKER}`);
			sess.close();
			ok('heartbeat gate timeout failure surfacing', 'waitForActivity timeout + describeShort fail=timeout + marker presence-gate-v2');
		} finally {
			setWebSocketCtor(null);
		}
	} catch (e) {
		setWebSocketCtor(null);
		fail('heartbeat gate timeout failure surfacing', e.message);
	}

	/* (l) ANYACCT close-code ghi dau vet: gateway dong voi code (vi du
	   4004 = identify bi tu choi) -> log mang code + describeShort
	   mang fail=close:4004 (truoc day onclose khong ghi code, onerror
	   rong — khong co bang chung nao ve vi sao gateway chet). */
	try {
		class FakeSocket {
			constructor(url) {
				this.url = url;
				this.sent = [];
				this.readyState = 0;
			}
			send(data) { this.sent.push(JSON.parse(data)); }
			close() {
				this.readyState = 3;
				if (this.onclose) this.onclose();
			}
		}
		setWebSocketCtor(FakeSocket);
		try {
			const logs = [];
			const sess = new PresenceSession({ token: 'mock-token', log: (l) => logs.push(l) });
			await sess.add(TASK_APP, 'Game');
			const sock = sess.ws;
			assert(sock, 'no gateway socket created');
			sock.onclose({ code: 4004, reason: 'Authentication failed' });
			assert(logs.some((l) => l.includes('code=4004')), `close log must carry code=4004, got: ${logs.join(' | ')}`);
			assert(sess.describeShort().includes('fail=close:4004'), `describeShort must carry fail=close:4004, got: ${sess.describeShort()}`);
			sess.close();
			ok('heartbeat gateway close code surfacing', 'onclose code=4004 logged + describeShort fail=close:4004');
		} finally {
			setWebSocketCtor(null);
		}
	} catch (e) {
		setWebSocketCtor(null);
		fail('heartbeat gateway close code surfacing', e.message);
	}

	process.stdout.write = origWrite;
	console.log(`KẾT QUẢ MOCK HEARTBEAT: ${passes} pass, ${failures} fail.`);
	process.exitCode = failures ? 1 : 0;
})().catch((e) => {
	process.stdout.write = origWrite;
	console.log(`[FAIL] mock heartbeat harness — ${e && e.stack ? e.stack : e}`);
	process.exitCode = 1;
});
