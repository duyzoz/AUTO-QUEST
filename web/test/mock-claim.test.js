'use strict';

/**
 * MOCK CLAIM TESTS — Waves#147.
 *
 * No token, no network, no live Discord. The REAL bridge claim code
 * (web/bridge.js claimQuest) is loaded in a Node vm sandbox with a mocked
 * global fetch that only answers discord.com URLs with scripted responses.
 * A fake token string is passed in the payload (never sent anywhere real —
 * the mock fetch intercepts every request and asserts the host).
 *
 * Covered:
 *   · 2xx without claimed_at → confirmed:false (never count Orbs) (#135)
 *   · 2xx without claimed_at + verify says claimed → confirmed:true
 *   · 2xx with claimed_at → confirmed:true, no extra verify fetch
 *   · 400 captcha-required (structured sitekey) → captchaRequired (#136)
 *   · 400 captcha fields but NO sitekey → captchaBlocked, not a modal (#136)
 *   · 400 message merely containing "captcha" but NO structured fields
 *     → NOT classified as captcha (#136 strict classification)
 *   · 403 code 10008 → status 403, code 10008
 *   · 429 → rateLimited + full retryAfter, and the NEXT claim in the same
 *     bridge waits out the full block instead of retrying early (#142)
 *   · 404 → notFound
 *
 * Run: node web/test/mock-claim.test.js  (also wired into `npm test`)
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');
const WEB = path.join(ROOT, 'web');

const FAKE_TOKEN = 'mock-token-for-tests-only';
const QUEST = { id: '123456789012345678', config: { rewards_config: { platforms: [0] } } };

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

/** Build a mock fetch from an ordered script: [{match, status, body}]. */
function mockFetchFactory(script, calls) {
	return async (url, init) => {
		const u = String(url);
		if (!u.startsWith('https://discord.com/api/v10/')) {
			throw new Error('mock fetch refused non-Discord URL: ' + u);
		}
		calls.push({ url: u, method: (init && init.method) || 'GET' });
		const step = script.shift();
		assert(step, 'mock fetch ran out of scripted responses for ' + u);
		if (step.match && !step.match(u, init)) {
			throw new Error('mock fetch step did not match URL: ' + u);
		}
		const status = step.status;
		return {
			status,
			ok: status >= 200 && status < 300,
			json: async () => JSON.parse(JSON.stringify(step.body === undefined ? null : step.body)),
		};
	};
}

function loadBridge(fetchImpl) {
	const sandbox = {
		console,
		setTimeout,
		clearTimeout,
		URL,
		TextEncoder,
		AbortController,
		AbortSignal,
		crypto: globalThis.crypto,
		btoa: globalThis.btoa,
		performance: { now: () => Date.now() },
		location: { href: 'http://localhost/' },
		navigator: {
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
			language: 'en-US',
		},
		document: {
			addEventListener: () => {},
			baseURI: 'http://localhost/',
			visibilityState: 'visible',
		},
		fetch: fetchImpl,
	};
	sandbox.window = sandbox;
	sandbox.self = sandbox;
	vm.createContext(sandbox);
	for (const file of ['identity.js', 'display-name-style.js', 'bridge.js']) {
		vm.runInContext(fs.readFileSync(path.join(WEB, file), 'utf8'), sandbox, { filename: file });
	}
	assert(sandbox.window.autoquest && typeof sandbox.window.autoquest.claimQuest === 'function', 'bridge did not expose window.autoquest.claimQuest');
	return sandbox.window.autoquest;
}

const isClaim = (u) => u.includes('/claim-reward');
const isQuestsMe = (u) => u.endsWith('/quests/@me');

async function runCase(label, fn) {
	try {
		await fn();
	} catch (err) {
		fail(label, err && err.message ? err.message : String(err));
	}
}

(async () => {
	// 1. 2xx without claimed_at, verify says NOT claimed → confirmed:false.
	await runCase('2xx without claimed_at stays unconfirmed', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 200, body: { user_status: { completed_at: '2026-01-01T00:00:00Z' } } },
			{ match: isQuestsMe, status: 200, body: { quests: [{ id: QUEST.id, user_status: { completed_at: '2026-01-01T00:00:00Z' } }] } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.ok === true, 'expected ok:true, got ' + JSON.stringify(res));
		assert(res.confirmed === false, '2xx without claimed_at must NOT be confirmed, got ' + JSON.stringify(res));
		assert(!res.claimedAt, 'claimedAt must be empty, got ' + res.claimedAt);
		ok('2xx without claimed_at stays unconfirmed', 'confirmed:false, verify fetch ran');
	});

	// 2. 2xx without claimed_at, verify says claimed → confirmed:true.
	await runCase('2xx without claimed_at + wallet/quests verify confirms', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 200, body: {} },
			{ match: isQuestsMe, status: 200, body: { quests: [{ id: QUEST.id, user_status: { completed_at: '2026-01-01T00:00:00Z', claimed_at: '2026-01-01T00:01:00Z', orb_quantity_claimed: 50 } }] } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.confirmed === true && res.claimedAt === 'verified', 'expected verified confirmation, got ' + JSON.stringify(res));
		assert(res.orbs === 50, 'expected verified orbs 50, got ' + res.orbs);
		ok('2xx without claimed_at + wallet/quests verify confirms', 'confirmed:true via verify, orbs 50');
	});

	// 3. 2xx with claimed_at in the response → confirmed, no verify fetch.
	await runCase('2xx with claimed_at is confirmed without verify', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 200, body: { user_status: { claimed_at: '2026-01-01T00:01:00Z', orb_quantity_claimed: 25 } } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.confirmed === true, 'expected confirmed:true, got ' + JSON.stringify(res));
		assert(calls.length === 1, 'expected exactly 1 fetch (no verify), got ' + calls.length);
		ok('2xx with claimed_at is confirmed without verify', 'confirmed:true, 1 fetch');
	});

	// 4. 400 captcha-required with structured sitekey.
	await runCase('400 captcha-required with sitekey', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 400, body: { message: 'You need to verify', captcha_sitekey: 'sitekey-mock', captcha_service: 'hcaptcha' } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.captchaRequired === true, 'expected captchaRequired:true, got ' + JSON.stringify(res));
		assert(res.captcha && res.captcha.sitekey === 'sitekey-mock', 'expected sitekey in captcha, got ' + JSON.stringify(res));
		ok('400 captcha-required with sitekey', 'captchaRequired:true, sitekey present');
	});

	// 5. 400 captcha fields but NO sitekey → blocked, not a modal.
	await runCase('400 captcha fields without sitekey is blocked', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 400, body: { message: 'captcha required', captcha_key: 'key-mock', captcha_session_id: 'sess-mock' } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.captchaBlocked === true, 'expected captchaBlocked:true, got ' + JSON.stringify(res));
		assert(!res.captchaRequired, 'must NOT be captchaRequired when sitekey is missing');
		ok('400 captcha fields without sitekey is blocked', 'captchaBlocked:true');
	});

	// 6. Message merely containing "captcha" with NO structured fields → not captcha.
	await runCase('message mentioning captcha without structured fields is not captcha', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 400, body: { message: 'captcha check failed, No Description' } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.ok === false, 'expected ok:false');
		assert(!res.captchaRequired && !res.captchaBlocked, 'must NOT classify as captcha without structured fields, got ' + JSON.stringify(res));
		ok('message mentioning captcha without structured fields is not captcha', 'generic 400 error');
	});

	// 7. 403 code 10008.
	await runCase('403 code 10008', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 403, body: { code: 10008, message: 'Unknown Message' } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.status === 403 && res.code === 10008, 'expected 403/10008, got ' + JSON.stringify(res));
		ok('403 code 10008', 'status 403, code 10008');
	});

	// 8. 429 returns full retryAfter.
	await runCase('429 returns full retry_after', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 429, body: { retry_after: 30, message: 'You are being rate limited.' } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.rateLimited === true && res.retryAfter === 30, 'expected rateLimited with retryAfter 30, got ' + JSON.stringify(res));
		ok('429 returns full retry_after', 'rateLimited:true, retryAfter 30 (not capped)');
	});

	// 9. 429 blocks the NEXT claim for the full retry_after (#142).
	await runCase('429 blocks next claim for full retry_after', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 429, body: { retry_after: 1 } },
			{ match: isClaim, status: 200, body: { user_status: { claimed_at: '2026-01-01T00:01:00Z', orb_quantity_claimed: 10 } } },
		], calls));
		const first = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(first.rateLimited === true, 'first claim must be rateLimited');
		const started = Date.now();
		const second = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		const elapsed = Date.now() - started;
		assert(second.confirmed === true, 'second claim must succeed after block, got ' + JSON.stringify(second));
		assert(elapsed >= 1000, `second claim must wait out the 1s block (+250ms), only waited ${elapsed}ms — early retry bug`);
		ok('429 blocks next claim for full retry_after', `second claim waited ${elapsed}ms, confirmed:true`);
	});

	// 10. Diagnostics after a claim: masked id, no secrets.
	await runCase('claimDiagnostics records last claim without secrets', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 400, body: { message: 'verify', captcha_sitekey: 'sitekey-mock', captcha_session_id: 'session-secret-value-123456' } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.captchaRequired === true, 'expected captchaRequired');
		const diag = await api.claimDiagnostics();
		assert(diag && diag.lastClaim, 'expected lastClaim record');
		assert(diag.lastClaim.status === 400, 'expected status 400, got ' + JSON.stringify(diag.lastClaim));
		assert(diag.lastClaim.questId !== QUEST.id, 'quest id must be masked, got full id');
		assert(diag.lastClaim.questId.includes('…'), 'masked quest id must contain ellipsis');
		assert(typeof diag.lastClaim.captchaSessionAgeSec === 'number', 'expected captcha session age in seconds');
		const blob = JSON.stringify(diag);
		assert(!blob.includes(FAKE_TOKEN), 'diagnostics leaked the token');
		assert(!blob.includes('session-secret-value-123456'), 'diagnostics leaked the captcha session id');
		ok('claimDiagnostics records last claim without secrets', 'status 400, masked id, session age present, no secrets');
	});

	// 11. 404 → notFound.
	await runCase('404 quest gone', async () => {
		const calls = [];
		const api = loadBridge(mockFetchFactory([
			{ match: isClaim, status: 404, body: { code: 10007, message: 'Unknown Quest' } },
		], calls));
		const res = await api.claimQuest({ token: FAKE_TOKEN, quest: QUEST, questId: QUEST.id });
		assert(res.notFound === true && res.status === 404, 'expected notFound 404, got ' + JSON.stringify(res));
		ok('404 quest gone', 'notFound:true, status 404');
	});

	console.log(`\nKẾT QUẢ MOCK CLAIM: ${passes} pass, ${failures} fail.`);
	if (failures) process.exit(1);
})().catch((err) => {
	console.error('mock-claim test crashed:', err);
	process.exit(1);
});
