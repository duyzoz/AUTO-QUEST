'use strict';

/**
 * MOCK REWARD TESTS — Waves#151/#153/#155.
 *
 * No token, no network, no live Discord. Loads the REAL web engine
 * questManager (web/engine/src/questManager.js) in Node with an
 * 'undici' stub (the browser build shims undici to fetch; the stub
 * throws if any network is attempted, so a test can never touch
 * the network). Cases are synthetic payloads shaped like Discord
 * quest configs — including a synthetic code field, because no
 * code field is confirmed in real Discord payloads in this codebase.
 * The code case therefore proves the plumbing, NOT that Discord
 * returns such a field; the app falls back to the Discord link
 * when no code is present.
 *
 * Run: node web/test/mock-reward.test.js (also wired into `npm test`)
 */

const Module = require('node:module');
const path = require('node:path');

const origLoad = Module._load;
Module._load = function (request, ...args) {
	if (request === 'undici') {
		return {
			fetch: async () => {
				throw new Error('network disabled in mock reward tests');
			},
			Agent: function () {},
			setGlobalDispatcher: () => {},
		};
	}
	return origLoad.call(this, request, ...args);
};

const { QuestManager } = require(path.join(__dirname, '..', 'engine', 'src', 'questManager.js'));

let passes = 0;
let failures = 0;
function ok(label, detail) {
	passes += 1;
	console.log(`[PASS] ${label} — ${detail}`);
}
function fail(label, detail) {
	failures += 1;
	console.log(`[FAIL] ${label} — ${detail}`);
}
function check(label, cond, detail) {
	if (cond) ok(label, detail);
	else fail(label, detail);
}
function card(rewards, assets = {}) {
	const cfg = {
		assets,
		messages: { game_title: 'Test Game', quest_name: 'Test Quest' },
		rewards_config: { rewards, platforms: [0] },
		application: { id: '123456789012345678', icon: 'abcdefabcdefabcdefabcdefabcdefab' },
	};
	return { raw: { config: cfg }, config: cfg, userStatus: { claimed_at: '2026-10-30T00:00:00Z' } };
}

// 1. Orb quest
{
	const d = QuestManager.getQuestCardData(card([{ orb_quantity: 200 }], { logotype_dark: 'quests/1/dark.png', logotype_light: 'quests/1/light.png' }));
	check('orb quest type', d.rewardType === 'orbs' && d.rewardKind === 'orbs' && d.orbs === 200, `type=${d.rewardType} orbs=${d.orbs}`);
	check('theme variants kept', d.logotypeDark === 'quests/1/dark.png' && d.logotypeLight === 'quests/1/light.png', `dark=${d.logotypeDark} light=${d.logotypeLight}`);
	check('orb quest has no code', d.rewardCode === '' && d.rewardCodeSource === '', 'code empty');
}
// 2. Avatar/item quest
{
	const d = QuestManager.getQuestCardData(
		card([{ asset: 'quests/2/avatar.png', messages: { name: 'Cool Avatar' } }]),
	);
	check('avatar quest type', d.rewardType === 'avatar' && d.rewardKind === 'item' && d.rewardAsset === 'quests/2/avatar.png', `type=${d.rewardType} asset=${d.rewardAsset}`);
	check('avatar quest has no code', d.rewardCode === '', 'code empty');
}
// 3. Synthetic code quest (plumbing only — see header)
{
	const d = QuestManager.getQuestCardData(card([{ reward_code: 'ABC-1234-XYZ', messages: { name: 'Game Code' } }]));
	check('code quest type', d.rewardType === 'code' && d.rewardCode === 'ABC-1234-XYZ' && d.rewardCodeSource === 'reward_code', `type=${d.rewardType} source=${d.rewardCodeSource}`);
}
// 4. Nested metadata code
{
	const d = QuestManager.getQuestCardData(card([{ metadata: { gift_code: 'GIFT-999' } }]));
	check('nested code found', d.rewardCode === 'GIFT-999' && d.rewardCodeSource === 'metadata.gift_code', `source=${d.rewardCodeSource}`);
}
// 5. No-reward quest
{
	const d = QuestManager.getQuestCardData(card([]));
	check('no-reward quest', d.rewardType === 'other' && d.rewardCode === '' && d.orbs === 0, `type=${d.rewardType}`);
}
// 6. PLACEHOLDER variants ignored
{
	const d = QuestManager.getQuestCardData(
		card([{ orb_quantity: 50 }], { logotype_dark: 'PLACEHOLDER', logotype_light: 'quests/9/light.png', game_tile_dark: 'PLACEHOLDER' }),
	);
	check('PLACEHOLDER ignored', d.logotypeDark === '' && d.logotypeLight === 'quests/9/light.png' && d.gameTileDark === '', `light=${d.logotypeLight}`);
}
// 7. Extractor edge cases
{
	const e = QuestManager.extractRewardCode;
	check('extractor null', e(null).code === '', 'null -> empty');
	check('extractor spaced code rejected', e({ code: 'AB CD' }).code === '', 'space rejected');
	check('extractor short code rejected', e({ code: 'AB' }).code === '', 'too short rejected');
}

console.log(`\nKẾT QUẢ MOCK REWARD: ${passes} pass, ${failures} fail.`);
process.exit(failures ? 1 : 0);
