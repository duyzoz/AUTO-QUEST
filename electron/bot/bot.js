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
 * - KHÔNG tự đăng ký (enroll) nhiệm vụ nào cả — đăng ký chỉ xảy ra khi người dùng bấm chạy.
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
            preview: quest.preview === true,
        };
    });
    // Chỉ nạp nhiệm vụ THẬT: loại preview (nhiệm vụ nội bộ Discord chưa công khai)
    const realInventory = inventory.filter((q) => !q.preview);
    (0, events_1.report)('quest:inventory', { quests: realInventory });
    const pending = realInventory.filter((q) => q.status !== 'done');
    console.log(`📋 Quét xong: ${realInventory.length} nhiệm vụ thật (${pending.length} chưa hoàn thành, ${realInventory.length - pending.length} đã xong).`);
    return questManager;
}
/**
 * Cày danh sách quest người dùng đã chọn.
 * QUY TẮC BẮT BUỘC: TUYỆT ĐỐI KHÔNG tự đăng ký (enroll) nhiệm vụ.
 * Chỉ cày những nhiệm vụ đã được người dùng nhận sẵn trong app Discord.
 */
async function runSelectedQuests(questManager, quests) {
    if (quests.length === 0)
        return;
    const runnable = [];
    for (const quest of quests) {
        if (isStopping)
            return;
        if (!quest.isEnrolledQuest()) {
            const questName = quest.config.messages.quest_name;
            console.log(`⏭ Bỏ qua "${questName}": chưa nhận nhiệm vụ. App KHÔNG tự nhận — hãy mở Discord bấm "Nhận nhiệm vụ".`);
            (0, events_1.report)('quest:skip', {
                id: questManager_1.QuestManager.getQuestId(quest),
                name: questName,
                reason: 'Chưa nhận nhiệm vụ trong Discord (app không tự nhận)',
            });
            continue;
        }
        runnable.push(quest);
    }
    if (runnable.length === 0) {
        console.log('⚠️ Không có nhiệm vụ nào đã nhận để cày. Hãy mở app Discord bấm "Nhận nhiệm vụ" rồi quét lại.');
        return;
    }
    console.log(`\n--- Cày ${runnable.length} nhiệm vụ ĐÃ NHẬN (chậm rãi, tránh rate-limit) ---`);
    const tasks = runnable.map(async (quest, index) => {
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
        if (runMode === 'scan') {
            // QUY TRÌNH CHUẨN: quét xong dừng ngay, KHÔNG tự nhận nhiệm vụ,
            // KHÔNG tự đăng ký. Chờ người dùng tích chọn rồi bấm chạy.
            console.log('🧭 Quét xong — dừng tại đây, chờ người dùng chọn nhiệm vụ.');
            (0, events_1.report)('scan:complete', { total: questManager.size });
            (0, events_1.report)('finish', { scanned: true });
            return;
        }
        // MODE 'run': chỉ chạy danh sách người dùng tích chọn (id từ UI).
        // MODE 'full' (mặc định cũ): tự chạy tất cả nhiệm vụ khả dụng KHÔNG đăng ký hộ nhiệm vụ ngoài danh sách.
        let questsValid = questManager.filterQuestsValidToDo();
        if (runMode === 'run') {
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
