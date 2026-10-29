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
/**
 * Lấy số dư Orb THẬT của account.
 * Waves 20: ưu tiên VÍ THẬT `GET /users/@me/virtual-currency/balance` — đúng con số
 * Discord hiển thị trong Kho quà. Nếu endpoint lỗi mới fallback cách cũ
 * (tổng orb_quantity_claimed từ /quests/@me/claimed).
 * - balance: số Orb khả dụng thật.
 * - pendingClaim: quest đã hoàn thành nhưng CHƯA claim (tính từ list hiện hành).
 * - source: nguồn số liệu ('wallet' | 'claimed-list') để UI/log biết độ tin cậy.
 */
async function fetchOrbBalance(questManager) {
    // pendingClaim luôn tính từ list hiện hành — độc lập với nguồn số dư.
    let pendingClaim = 0;
    for (const q of questManager.list()) {
        if (q.preview === true || !q.isCompleted() || q.hasClaimedRewards())
            continue;
        pendingClaim += questManager_1.QuestManager.getQuestOrbs(q);
    }
    const wallet = await questManager.fetchWalletBalance();
    if (wallet !== null) {
        return { balance: wallet, pendingClaim, source: 'wallet' };
    }
    try {
        const claimedRes = (await client.rest.get('/quests/@me/claimed'));
        const claimedQuests = Array.isArray(claimedRes?.quests) ? claimedRes.quests : [];
        let balance = 0;
        for (const q of claimedQuests) {
            if (!q)
                continue;
            const claimedOrbs = q.user_status?.orb_quantity_claimed;
            if (typeof claimedOrbs === 'number') {
                balance += claimedOrbs;
                continue;
            }
            const rewards = q.config?.rewards;
            if (Array.isArray(rewards)) {
                for (const r of rewards) {
                    if (typeof r.orb_quantity === 'number')
                        balance += r.orb_quantity;
                }
            }
        }
        return { balance, pendingClaim, source: 'claimed-list' };
    }
    catch (err) {
        console.warn('Không lấy được số dư Orb:', err?.message);
        return null;
    }
}
/**
 * Quét danh sách nhiệm vụ và báo về UI.
 * Waves 20: nhận diện CHUẨN từng nhiệm vụ — loại nhiệm vụ (task), nhóm xử lý (kind),
 * số Orb thưởng, tiến độ cần/đã đạt. Đọc cả task_config_v2 và task_config (v1).
 * - quest:inventory: toàn bộ trạng thái (chưa làm / đã làm) — UI tự phân tab theo id.
 * - KHÔNG phát quest:done ảo cho quest đã xong từ trước (nguyên nhân orbs cộng ảo).
 * - KHÔNG tự đăng ký (enroll) nhiệm vụ nào cả.
 */
async function scanQuests(opts = {}) {
    const silent = opts.silent === true;
    console.log('\n========================================');
    console.log('[BẢO MẬT] Kết nối an toàn 100% trực tiếp tới Discord API.');
    console.log('Đang quét toàn bộ danh sách nhiệm vụ trên tài khoản...');
    // Waves 22: báo UI NGAY khi bắt đầu quét → 3 tab xoay vòng, không đợi fetch xong.
    // Waves 24: khi chạy Auto (mode 'run') thì quét IM LẶNG — không đẩy UI về trạng thái
    // "đang quét" lần nữa, nếu không người dùng thấy nó quét lại thay vì chạy.
    if (!silent)
        (0, events_1.report)('scan:start', { total: 0 });
    // Waves 26: fetchQuests(FALSE) — KHÔNG nạp `excluded_quests`.
    // Discord trả thêm ~32 quest "excluded" (bị ẩn với user: hết hạn/khu vực/không
    // target). Nạp chúng làm UI phình 26 → 58-90 nhiệm vụ, trùng tên lặp lại, và
    // chậm 4-5s vì mỗi quest là 1 request riêng. UI phải phản ánh ĐÚNG cái Discord
    // hiển thị → chỉ lấy `quests`.
    await client.fetchQuests(false);
    const questManager = client.questManager;
    const all = questManager.list();
    // Đã có tổng thật → cập nhật lại mốc đếm
    if (!silent)
        (0, events_1.report)('scan:start', { total: all.length });
    const inventory = [];
    // Waves 26: dedupe theo ID — Discord có thể trả cùng quest 2 lần (excluded + normal).
    const seenIds = new Set();
    for (let i = 0; i < all.length; i++) {
        const quest = all[i];
        const qid = questManager_1.QuestManager.getQuestId(quest);
        // Bỏ qua ngay nếu ID đã gặp — không tính tiến độ, không render.
        if (seenIds.has(qid))
            continue;
        seenIds.add(qid);
        const taskName = questManager_1.QuestManager.resolveTaskName(quest);
        const taskLabel = questManager_1.QuestManager.getTaskLabel(quest);
        const kind = questManager_1.QuestManager.getTaskKind(quest);
        const secondsNeeded = questManager_1.QuestManager.getTaskTarget(quest, taskName);
        const secondsDone = questManager_1.QuestManager.getTaskProgress(quest, taskName);
        const isDone = quest.isCompleted();
        const isClaimed = quest.hasClaimedRewards();
        // Waves 24: nhiệm vụ "dead" — Discord cũng không hiển thị, đừng đẩy lên UI:
        //  · preview: nhiệm vụ nội bộ chưa công khai
        //  · chưa tới starts_at
        //  · đã hết hạn mà chưa hoàn thành (không thể làm, không thể nhận) — đây chính là
        //    đám "chưa nhận" ảo mà bro thấy đầy trong app.
        const expired = quest.isExpired();
        const preview = quest.preview === true;
        const dead = preview || !quest.isStarted() || (expired && !isDone);
        if (!dead) {
            // Waves 22: dữ liệu THẬT để dựng thẻ kiểu Discord (banner, NPH, hạn, phần thưởng)
            const card = questManager_1.QuestManager.getQuestCardData(quest);
            const item = {
                ...card,
                id: qid,
                name: quest.config.messages.quest_name,
                task: taskName || 'UNKNOWN',
                taskLabel,
                kind,
                application: quest.config.application?.name || '',
                secondsNeeded,
                secondsDone,
                orbs: questManager_1.QuestManager.getQuestOrbs(quest),
                rewardName: questManager_1.QuestManager.getQuestRewardName(quest),
                // Waves 25: 3 nhóm ĐÚNG theo Discord — dựa trên completed_at / claimed_at
                // (y hệt repo gốc Discord-Auto-Quests/src/engine.ts).
                //   todo      = chưa completed_at  → tab "Chưa làm"
                //   claimable = completed_at && !claimed_at → tab "Chưa nhận"
                //   claimed   = completed_at && claimed_at  → tab "Đã làm"
                status: isDone ? (isClaimed ? 'claimed' : 'claimable') : 'todo',
                claimable: isDone && !quest.hasClaimedRewards(),
                automatable: questManager_1.QuestManager.isAutomatable(quest),
                expired,
                preview,
            };
            inventory.push(item);
        }
        // Đếm tiến độ theo SỐ QUEST ĐÃ NẠP THẬT (không phải index vòng lặp thô).
        // Waves 26: inventory.length = quest thật đã lọc dead + dedupe; all.length = tổng
        // quest Discord trả về. Thanh chạy đúng tỷ lệ quest hợp lệ / tổng.
        if (!silent) {
            (0, events_1.report)('quest:scan-progress', { done: inventory.length, total: all.length });
            await new Promise((r) => setTimeout(r, 24));
        }
        else if (i % 12 === 11) {
            await new Promise((r) => setTimeout(r, 0));
        }
    }
    // Waves 27: nhiều quest TRÙNG TÊN nhưng KHÁC ID (event theo mùa: "Bản 2.3 Hải Đại
    // Bằng Lai" có bản đã nhận và bản chưa làm). Discord phân biệt bằng id, nhưng UI
    // nhìn như lặp. → Thêm hậu tố theo NGÀY HẾT HẠN để phân biệt rõ ràng.
    const nameCount = new Map();
    for (const q of inventory)
        nameCount.set(q.name, (nameCount.get(q.name) || 0) + 1);
    for (const q of inventory) {
        if ((nameCount.get(q.name) || 0) > 1 && q.expiresAt) {
            const d = new Date(q.expiresAt);
            const tag = `đợt ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            q.name = `${q.name} · ${tag}`;
        }
    }
    // Waves 27: SAU khi đã dedupe + phân biệt tên → mới stream từng quest sang UI
    // (stream sớm sẽ gửi tên chưa phân biệt). UI gom vào RAM, render 1 lượt khi xong.
    if (!silent)
        for (const item of inventory)
            (0, events_1.report)('quest:item', item);
    // Chỉ nạp nhiệm vụ THẬT (đã lọc dead ở trên).
    const realInventory = inventory;
    if (!silent)
        (0, events_1.report)('quest:inventory', { quests: realInventory });
    // Log nhận diện từng nhiệm vụ: loại · số Orb · tiến độ.
    const pending = realInventory.filter((q) => q.status === 'todo');
    const claimable = realInventory.filter((q) => q.claimable);
    const totalOrbs = realInventory.reduce((s, q) => s + (q.orbs || 0), 0);
    const pendingOrbs = pending.reduce((s, q) => s + (q.orbs || 0), 0);
    console.log(`Quét xong: ${realInventory.length} nhiệm vụ thật · ${pending.length} chưa xong · ${realInventory.length - pending.length} đã xong · ${claimable.length} chờ nhận thưởng.`);
    console.log(`Tổng Orb theo danh sách: ${totalOrbs} (chưa xong: ${pendingOrbs} Orb).`);
    for (const q of realInventory) {
        const pct = q.secondsNeeded > 0
            ? Math.min(100, Math.round((q.secondsDone / q.secondsNeeded) * 100))
            : 0;
        const flags = [
            q.status === 'claimed' ? 'ĐÃ NHẬN' : q.status === 'claimable' ? 'CHỜ NHẬN' : 'CHƯA LÀM',
            q.claimable ? 'CHỜ CLAIM' : '',
            q.automatable ? '' : 'THỦ CÔNG',
        ]
            .filter(Boolean)
            .join(' · ');
        console.log(`  · [${q.taskLabel}] ${q.name} — ${q.orbs} Orbs — ${q.secondsDone}/${q.secondsNeeded} (${pct}%) — ${flags}`);
    }
    // SỐ DƯ ORB: ví thật trước, fallback claimed list.
    const orbBalanceInfo = await fetchOrbBalance(questManager);
    if (orbBalanceInfo) {
        (0, events_1.report)('orbs:balance', orbBalanceInfo);
        const src = orbBalanceInfo.source === 'wallet' ? 'ví Discord' : 'claimed list';
        console.log(`Số dư Orb khả dụng (${src}): ${orbBalanceInfo.balance}` +
            (orbBalanceInfo.pendingClaim > 0
                ? ` · chờ claim: ${orbBalanceInfo.pendingClaim} Orbs`
                : ''));
    }
    else {
        // Fallback cuối: tính từ list hiện hành (completed + claimed)
        console.warn('Fallback tính số dư từ /quests/@me.');
        let orbBalance = 0;
        let orbPendingClaim = 0;
        for (const q of realInventory) {
            if (q.status === 'todo')
                continue;
            const quest = questManager.list().find((raw) => questManager_1.QuestManager.getQuestId(raw) === q.id);
            if (!quest)
                continue;
            if (quest.hasClaimedRewards())
                orbBalance += q.orbs;
            else
                orbPendingClaim += q.orbs;
        }
        (0, events_1.report)('orbs:balance', { balance: orbBalance, pendingClaim: orbPendingClaim, source: 'local' });
        console.log(`Số dư Orb (đã claim từ nhiệm vụ): ${orbBalance}` +
            (orbPendingClaim > 0 ? ` · chờ claim: ${orbPendingClaim} Orbs` : ''));
    }
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
            console.log(`⏭ Bỏ qua "${questName}": chưa nhận được nhiệm vụ (Discord từ chối enroll).`);
            (0, events_1.report)('quest:skip', {
                id: questManager_1.QuestManager.getQuestId(quest),
                name: questName,
                reason: 'Không nhận được nhiệm vụ trong Discord',
            });
            continue;
        }
        runnable.push(quest);
    }
    if (runnable.length === 0) {
        console.log('CẢNH BÁO: Không có nhiệm vụ nào đã nhận để cày. Hãy mở app Discord bấm "Nhận nhiệm vụ" rồi quét lại.');
        return;
    }
    const totalOrbs = runnable.reduce((sum, q) => sum + questManager_1.QuestManager.getQuestOrbs(q), 0);
    console.log(`\n--- Cày ${runnable.length} nhiệm vụ ĐÃ NHẬN · tổng ${totalOrbs} Orbs (chậm rãi, tránh rate-limit) ---`);
    for (const q of runnable) {
        console.log(`  ▸ [${questManager_1.QuestManager.getTaskLabel(q)}] ${q.config.messages.quest_name} — ${questManager_1.QuestManager.getQuestOrbs(q)} Orbs — tiến độ ${Math.floor(questManager_1.QuestManager.getTaskProgress(q))}/${questManager_1.QuestManager.getTaskTarget(q)}`);
    }
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
    console.log(`Hoàn thành đợt cày! Tổng Orb đã đạt: ${updatedOrbStats.completedOrbs} Orbs.`);
    // Cập nhật lại số dư Orb khả dụng sau khi claim thưởng xong — hỏi lại Discord ví thật.
    const freshBalanceInfo = await fetchOrbBalance(questManager);
    if (freshBalanceInfo) {
        (0, events_1.report)('orbs:balance', freshBalanceInfo);
        console.log(`Số dư Orb khả dụng sau claim (claimed list): ${freshBalanceInfo.balance}` +
            (freshBalanceInfo.pendingClaim > 0
                ? ` · chờ claim: ${freshBalanceInfo.pendingClaim} Orbs`
                : ''));
    }
    else {
        // Fallback: tính từ list hiện hành như cũ
        let freshBalance = 0;
        let freshPending = 0;
        for (const q of questManager.list()) {
            const orbs = questManager_1.QuestManager.getQuestOrbs(q);
            if (!q.isCompleted())
                continue;
            if (q.hasClaimedRewards())
                freshBalance += orbs;
            else
                freshPending += orbs;
        }
        (0, events_1.report)('orbs:balance', { balance: freshBalance, pendingClaim: freshPending });
    }
}
async function runQuestCycle() {
    if (isStopping)
        return;
    try {
        // Waves 24: mode 'run' (bấm Auto ORBs) → quét IM LẶNG, không đẩy UI về
        // trạng thái "đang quét" lần nữa. Trước đây quét lại làm người dùng tưởng
        // app lặp lại bước quét thay vì chạy.
        const questManager = await scanQuests({ silent: runMode === 'run' });
        if (runMode === 'scan') {
            // QUY TRÌNH CHUẨN: quét xong dừng ngay, KHÔNG tự nhận nhiệm vụ,
            // KHÔNG tự đăng ký. Chờ người dùng tích chọn rồi bấm chạy.
            console.log('Quét xong — dừng tại đây, chờ người dùng chọn nhiệm vụ.');
            (0, events_1.report)('scan:complete', { total: questManager.size });
            (0, events_1.report)('finish', { scanned: true });
            return;
        }
        // MODE 'run': chỉ chạy danh sách người dùng tích chọn (id từ UI).
        // MODE 'full' (mặc định cũ): tự chạy tất cả nhiệm vụ khả dụng KHÔNG đăng ký hộ nhiệm vụ ngoài danh sách.
        // STARTUP (Waves 20): nhận thưởng cho quest đã hoàn thành nhưng chưa claim,
        // giống pha khởi động của Discord client — chỉ claim thưởng đã kiếm được,
        // KHÔNG nhận nhiệm vụ mới nên không phá quy tắc "không tự enroll".
        const claimed = await questManager.claimAllClaimable();
        if (claimed.attempted > 0) {
            console.log(`[Startup] Đã nhận thưởng ${claimed.attempted} nhiệm vụ (~${claimed.orbs} Orbs).`);
            const afterClaim = await fetchOrbBalance(questManager);
            if (afterClaim)
                (0, events_1.report)('orbs:balance', afterClaim);
        }
        let questsValid;
        if (runMode === 'run') {
            // Chỉ chạy đúng những nhiệm vụ người dùng ĐÃ TÍCH. Nếu nhiệm vụ đó chưa
            // được nhận trong Discord thì đăng ký hộ — CHỈ danh sách này, không đụng
            // quest nào khác (đây là hành động do người dùng chủ động chọn).
            const picked = questManager
                .list()
                .filter((q) => selectedIds.has(questManager_1.QuestManager.getQuestId(q)))
                .filter((q) => !q.isCompleted() && !q.isExpired() && q.isStarted() && !q.preview);
            for (const q of picked) {
                if (isStopping)
                    break;
                if (q.isEnrolledQuest())
                    continue;
                try {
                    await questManager.acceptQuest(q);
                    console.log(`✓ Đã nhận nhiệm vụ "${q.config.messages.quest_name}".`);
                }
                catch (err) {
                    console.log(`Không nhận được "${q.config.messages.quest_name}": ${err?.message || err}`);
                }
            }
            questsValid = picked.filter((q) => q.isEnrolledQuest());
            console.log(`Chế độ chạy theo lựa chọn: ${questsValid.length}/${picked.length} nhiệm vụ sẵn sàng.`);
        }
        else {
            questsValid = questManager.filterQuestsValidToDo();
        }
        (0, events_1.report)('quests', { total: questsValid.length });
        if (questsValid.length === 0) {
            console.log('Không có nhiệm vụ nào cần thực hiện trong đợt này.');
            (0, events_1.report)('finish', {
                note: runMode === 'run'
                    ? 'Không chạy được nhiệm vụ nào: chưa chọn, đã xong, đã hết hạn hoặc Discord từ chối nhận nhiệm vụ.'
                    : 'Không có nhiệm vụ nào cần thực hiện trong đợt này.',
            });
            return;
        }
        await runSelectedQuests(questManager, questsValid);
        (0, events_1.report)('finish', {});
    }
    catch (err) {
        const message = err?.message || String(err);
        // Wave#104: lỗi của MỘT lượt (mạng chập chờn, Discord 5xx) không được
        // giết cả chế độ treo. Chỉ token chết (401) mới dừng hẳn.
        if (err?.status === 401) {
            (0, events_1.report)('fatal', { message: 'Token Discord không hợp lệ hoặc đã hết hạn (401).' });
            console.error('Token hết hiệu lực:', message);
            void shutdown(1);
            return;
        }
        (0, events_1.report)('cycle:error', { message });
        console.error('Lỗi trong lượt chạy (sẽ thử lại lượt sau):', message);
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
        console.log(`ĐÃ BẬT CHẾ ĐỘ TREO ORB TỰ ĐỘNG (Quét lại mỗi ${loopIntervalMinutes} phút).`);
        while (!isStopping) {
            await runQuestCycle();
            if (isStopping)
                break;
            console.log(`\nĐang treo Orb... Tự động quét lại sau ${loopIntervalMinutes} phút.`);
            // Wave#104: đếm ngược bằng MỐC THỜI GIAN TUYỆT ĐỐI. Trình duyệt bóp
            // setTimeout ở tab nền (có khi 1 phút/lần) → đếm `remaining--` sẽ trôi
            // vô hạn. Dùng deadline: quay lại tab là biết đã trễ bao nhiêu và chạy tiếp.
            const deadline = Date.now() + loopIntervalMinutes * 60 * 1000;
            let lastReported = -1;
            while (!isStopping) {
                const remainingMs = deadline - Date.now();
                if (remainingMs <= 0)
                    break;
                const remaining = Math.ceil(remainingMs / 1000);
                if (lastReported === -1 ||
                    lastReported - remaining >= 30 ||
                    (remaining <= 10 && remaining !== lastReported)) {
                    (0, events_1.report)('cycle:wait', { remainingSeconds: remaining });
                    lastReported = remaining;
                }
                await sleep(Math.min(1000, remainingMs));
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
// Wave#104: kết nối lại có backoff. Mạng chập chờn lúc mở app không còn
// biến thành "chết ngay" — thử 3 lần (2s/5s/10s) rồi mới báo lỗi thật.
const CONNECT_RETRY_DELAYS_MS = [2000, 5000, 10000];
async function connectWithRetry() {
    for (let attempt = 0; attempt <= CONNECT_RETRY_DELAYS_MS.length; attempt++) {
        if (isStopping)
            return;
        try {
            await client.connect();
            return;
        }
        catch (err) {
            const message = err?.message || String(err);
            console.error(`Lỗi kết nối Discord (lần ${attempt + 1}):`, message);
            if (attempt >= CONNECT_RETRY_DELAYS_MS.length) {
                (0, events_1.report)('fatal', { message });
                void shutdown(1);
                return;
            }
            const delayMs = CONNECT_RETRY_DELAYS_MS[attempt];
            (0, events_1.report)('reconnect', { attempt: attempt + 1, delayMs, message });
            await sleep(delayMs);
        }
    }
}
void connectWithRetry();
