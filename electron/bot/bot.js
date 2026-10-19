"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const v10_1 = require("discord-api-types/v10");
const client_1 = require("./src/client");
const events_1 = require("./src/events");
const questManager_1 = require("./src/questManager");
const token = (process.env.TOKEN || '').trim();
const isLoopMode = process.env.LOOP_MODE === '1';
const loopIntervalMinutes = parseInt(process.env.LOOP_INTERVAL || '30', 10) || 30;
// MODE: 'full' (mặc định: tự làm hết) | 'scan' (chỉ quét danh sách) | 'run' (chạy danh sách đã chọn)
const runMode = (process.env.MODE || 'full').trim().toLowerCase();
// Danh sách quest id người dùng chọn ở UI (MODE=run). Rỗng = chạy tất cả khả dụng.
const selectedIds = new Set((process.env.SELECTED_QUESTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean));
// Pacing: chậm rãi, tránh kích thích rate-limit của Discord.
const ENROLL_DELAY_MS = 3000;
const REDEEM_DELAY_MS = 2000;
const STAGGER_MS = 2000;
const HEARTBEAT_INTERVAL_S = 25;
if (!token) {
    (0, events_1.report)('fatal', { message: 'Thiếu Token Discord. Vui lòng nhập token trên giao diện.' });
    process.exit(1);
}
let finished = false;
let isStopping = false;
const client = new client_1.ClientQuest(token);
async function shutdown(code) {
    if (finished)
        return;
    finished = true;
    isStopping = true;
    try {
        await client.destroy();
    }
    catch {
        /* ignore */
    }
    setTimeout(() => process.exit(code), 200);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function taskNameOf(quest) {
    const taskConfig = quest.config.task_config_v2;
    return ([
        'WATCH_VIDEO',
        'PLAY_ON_DESKTOP',
        'PLAY_ON_XBOX',
        'PLAY_ON_PLAYSTATION',
        'STREAM_ON_DESKTOP',
        'PLAY_ACTIVITY',
        'WATCH_VIDEO_ON_MOBILE',
        'ACHIEVEMENT_IN_ACTIVITY',
    ].find((x) => taskConfig.tasks[x] != null) ||
        'Nhiệm vụ Discord');
}
/**
 * Quét danh sách nhiệm vụ và báo về UI.
 * - quest:inventory: toàn bộ trạng thái (chưa làm / đã làm) — UI tự phân tab theo id.
 * - KHÔNG phát quest:done ảo cho quest đã xong từ trước (nguyên nhân orbs cộng ảo).
 */
async function scanQuests() {
    console.log('\n========================================');
    console.log('🔍 [BẢO MẬT] Kết nối an toàn 100% trực tiếp tới Discord API.');
    console.log('📡 Đang quét toàn bộ danh sách nhiệm vụ trên tài khoản...');
    await client.fetchQuests(true);
    const questManager = client.questManager;
    const inventory = questManager.list().map((quest) => {
        const taskName = taskNameOf(quest);
        const taskConfig = quest.config.task_config_v2;
        const secondsNeeded = taskConfig.tasks[taskName]?.target || 0;
        const secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
        const isDone = quest.isCompleted();
        const enrolled = quest.isEnrolledQuest();
        return {
            id: questManager_1.QuestManager.getQuestId(quest),
            name: quest.config.messages.quest_name,
            task: taskName,
            application: quest.config.application?.name || '',
            secondsNeeded,
            secondsDone,
            orbs: questManager_1.QuestManager.getQuestOrbs(quest),
            rewardName: questManager_1.QuestManager.getQuestRewardName(quest),
            status: (isDone ? 'done' : enrolled ? 'enrolled' : 'new'),
            claimable: isDone && !quest.hasClaimedRewards(),
            expired: quest.isExpired(),
        };
    });
    (0, events_1.report)('quest:inventory', { quests: inventory });
    const pending = inventory.filter((q) => q.status !== 'done');
    console.log(`📋 Quét xong: ${inventory.length} nhiệm vụ (${pending.length} chưa hoàn thành, ${inventory.length - pending.length} đã xong).`);
    return questManager;
}
/** Nhận thưởng cho quest đã hoàn thành nhưng chưa claim (có filter tùy chọn). */
async function redeemPending(questManager, allowed) {
    const questsToRedeem = questManager.filterQuestsValidToRedeem(allowed);
    if (questsToRedeem.length === 0)
        return;
    console.log(`🎁 Phát hiện ${questsToRedeem.length} nhiệm vụ đã hoàn thành nhưng chưa nhận thưởng. Đang tự động nhận...`);
    for (const quest of questsToRedeem) {
        if (isStopping)
            return;
        await questManager.claimReward(quest);
        (0, events_1.report)('quest:redeem', {
            id: questManager_1.QuestManager.getQuestId(quest),
            name: quest.config.messages.quest_name,
            orbs: questManager_1.QuestManager.getQuestOrbs(quest),
            rewardName: questManager_1.QuestManager.getQuestRewardName(quest),
        });
        await sleep(REDEEM_DELAY_MS);
    }
}
/** Cày một danh sách quest cụ thể — tuần tự đăng ký + stagger chậm tránh rate-limit. */
async function runSelectedQuests(questManager, quests) {
    if (quests.length === 0)
        return;
    console.log(`\n--- Bắt đầu thực hiện ${quests.length} nhiệm vụ ---`);
    // Giai đoạn 1: đăng ký tuần tự
    let hasRateLimit = false;
    for (const quest of quests) {
        if (isStopping)
            return;
        const questName = quest.config.messages.quest_name;
        if (!quest.isEnrolledQuest()) {
            const taskConfig = quest.config.task_config_v2;
            const isAndroid = Boolean(taskConfig.tasks.WATCH_VIDEO_ON_MOBILE) &&
                !Boolean(taskConfig.tasks.WATCH_VIDEO);
            console.log(`Đang đăng ký: "${questName}" (${isAndroid ? 'Android' : 'Desktop'})...`);
            try {
                await questManager.acceptQuest(quest, isAndroid);
                console.log(`Đã đăng ký thành công: "${questName}".`);
                await sleep(ENROLL_DELAY_MS);
            }
            catch (err) {
                const message = err?.message || String(err);
                if (message.toLowerCase().includes('ratelimit') || err?.status === 429) {
                    hasRateLimit = true;
                    console.warn('[Giới hạn Discord] Tạm bị giới hạn nhận nhiệm vụ qua API (~45 phút).');
                    console.log(`💡 Mẹo: Mở app Discord bấm "Nhận nhiệm vụ" cho "${questName}", app sẽ cày ngay ở đợt kế.`);
                    (0, events_1.report)('quest:skip', {
                        id: questManager_1.QuestManager.getQuestId(quest),
                        name: questName,
                        reason: 'Giới hạn API Discord — sẽ tự thử lại ở đợt quét kế',
                    });
                }
                else {
                    console.warn(`Không thể nhận nhiệm vụ "${questName}": ${message}`);
                    (0, events_1.report)('quest:error', {
                        id: questManager_1.QuestManager.getQuestId(quest),
                        name: questName,
                        message,
                    });
                }
            }
        }
        else {
            console.log(`Nhiệm vụ "${questName}" đã được nhận trước đó.`);
        }
    }
    // Giai đoạn 2: cày song song có stagger
    const executable = quests.filter((q) => q.isEnrolledQuest() && !q.isCompleted());
    if (executable.length === 0) {
        if (hasRateLimit) {
            console.log('⏳ Các nhiệm vụ còn lại đang bị giới hạn nhận tự động qua API.');
            console.log('👉 Giữ app ở chế độ Treo Orb để tự thử lại sau.');
        }
        else {
            console.log('Không còn nhiệm vụ nào cần thực hiện.');
        }
        return;
    }
    console.log(`\n--- Cày ${executable.length} nhiệm vụ (chậm rãi, tránh rate-limit) ---`);
    const tasks = executable.map(async (quest, index) => {
        if (isStopping)
            return;
        if (index > 0)
            await sleep(index * STAGGER_MS);
        return questManager.doingQuest(quest, HEARTBEAT_INTERVAL_S);
    });
    await Promise.allSettled(tasks);
    const updatedOrbStats = questManager.getOrbsSummary();
    (0, events_1.report)('orb:summary', updatedOrbStats);
    console.log(`🎉 Hoàn thành đợt cày! Tổng Orb đã đạt: ${updatedOrbStats.completedOrbs} Orbs.`);
}
async function runQuestCycle() {
    if (isStopping)
        return;
    try {
        const questManager = await scanQuests();
        // Nhận thưởng quest đã xong nhưng chưa claim.
        await redeemPending(questManager);
        if (runMode === 'scan') {
            console.log('🧭 Chế độ quét: đã trả danh sách nhiệm vụ, chờ người dùng chọn.');
            (0, events_1.report)('scan:complete', { total: questManager.size });
            (0, events_1.report)('finish', { scanned: true });
            return;
        }
        let questsValid = questManager.filterQuestsValidToDo();
        if (runMode === 'run') {
            // Chỉ chạy những quest người dùng tích chọn ở UI.
            questsValid = questsValid.filter((q) => selectedIds.has(questManager_1.QuestManager.getQuestId(q)));
            console.log(`🎯 Chế độ chạy theo lựa chọn: ${questsValid.length} nhiệm vụ khớp danh sách chọn.`);
        }
        (0, events_1.report)('quests', { total: questsValid.length });
        if (questsValid.length === 0) {
            console.log('✅ Không có nhiệm vụ nào cần thực hiện trong đợt này.');
            (0, events_1.report)('finish', {});
            return;
        }
        await runSelectedQuests(questManager, questsValid);
        (0, events_1.report)('finish', {});
    }
    catch (err) {
        const message = err?.message || String(err);
        (0, events_1.report)('fatal', { message });
        console.error('Lỗi khi thực hiện nhiệm vụ:', message);
    }
}
client.once(v10_1.GatewayDispatchEvents.Ready, async ({ data }) => {
    (0, events_1.report)('login', {
        id: data.user.id,
        username: data.user.username,
        avatar: data.user.avatar,
    });
    console.log(`Đăng nhập thành công tài khoản: @${data.user.username}`);
    if (runMode === 'scan') {
        // Quét một lần rồi thoát — UI hiển thị danh sách chờ chọn.
        await runQuestCycle();
        console.log('Hoàn tất quét. Đang ngắt kết nối an toàn...');
        await shutdown(0);
        return;
    }
    if (!isLoopMode) {
        await runQuestCycle();
        console.log('Hoàn thành toàn bộ nhiệm vụ. Đang ngắt kết nối an toàn...');
        await shutdown(0);
    }
    else {
        console.log(`⚡ ĐÃ BẬT CHẾ ĐỘ TREO ORB TỰ ĐỘNG (Quét lại mỗi ${loopIntervalMinutes} phút).`);
        while (!isStopping) {
            await runQuestCycle();
            if (isStopping)
                break;
            console.log(`\n💤 Đang treo Orb... Tự động quét lại sau ${loopIntervalMinutes} phút.`);
            const totalSeconds = loopIntervalMinutes * 60;
            for (let remaining = totalSeconds; remaining > 0; remaining--) {
                if (isStopping)
                    break;
                if (remaining % 30 === 0 || remaining <= 10) {
                    (0, events_1.report)('cycle:wait', { remainingSeconds: remaining });
                }
                await sleep(1000);
            }
        }
        await shutdown(0);
    }
});
process.on('unhandledRejection', (reason) => {
    console.error('[Lỗi nội bộ] Promise Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('[Lỗi không mong đợi]:', error.message);
});
process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));
client.connect().catch((err) => {
    const message = err?.message || String(err);
    (0, events_1.report)('fatal', { message });
    console.error('Lỗi kết nối Discord:', message);
    void shutdown(1);
});
