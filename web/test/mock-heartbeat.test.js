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
const origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...rest) => {
	for (const line of String(chunk).split('\n')) {
		if (isEventLine(line)) {
			const parsed = parseEventLine(line);
			if (parsed) events.push(parsed);
		}
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

	process.stdout.write = origWrite;
	console.log(`KẾT QUẢ MOCK HEARTBEAT: ${passes} pass, ${failures} fail.`);
	process.exitCode = failures ? 1 : 0;
})().catch((e) => {
	process.stdout.write = origWrite;
	console.log(`[FAIL] mock heartbeat harness — ${e && e.stack ? e.stack : e}`);
	process.exitCode = 1;
});
