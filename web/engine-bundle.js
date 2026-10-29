'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   ENGINE BUNDLE — TỰ SINH, ĐỪNG SỬA TAY.
   Nguồn: web/engine/bot.js + web/engine/src/*.js
   Sinh lại: node web/build-engine.js
   Chạy trong Web Worker (xem web/engine-worker.js). Không có Node, không eval.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
	var __factories = Object.create(null);

__factories["bot.js"] = function (require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob) {
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

};

__factories["src/events.js"] = function (require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = report;
exports.isEventLine = isEventLine;
exports.parseEventLine = parseEventLine;
const MARKER = '\u0001AQEVENT\u0001';
function report(type, data = {}) {
    try {
        // Mỗi event luôn kèm id để renderer dedupe (tránh cộng Orbs ảo khi quét lại).
        const payload = {
            id: `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
            type,
            data,
        };
        process.stdout.write(MARKER + JSON.stringify(payload) + '\n');
    }
    catch {
        /* ignore */
    }
}
function isEventLine(line) {
    return line.startsWith(MARKER);
}
function parseEventLine(line) {
    try {
        return JSON.parse(line.slice(MARKER.length));
    }
    catch {
        return null;
    }
}

};

__factories["src/interface.js"] = function (require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestTaskConfigType = void 0;
var QuestTaskConfigType;
(function (QuestTaskConfigType) {
    QuestTaskConfigType["STREAM_ON_DESKTOP"] = "STREAM_ON_DESKTOP";
    QuestTaskConfigType["PLAY_ON_DESKTOP"] = "PLAY_ON_DESKTOP";
    QuestTaskConfigType["PLAY_ON_DESKTOP_V2"] = "PLAY_ON_DESKTOP_V2";
    QuestTaskConfigType["PLAY_ON_XBOX"] = "PLAY_ON_XBOX";
    QuestTaskConfigType["PLAY_ON_PLAYSTATION"] = "PLAY_ON_PLAYSTATION";
    QuestTaskConfigType["PLAY_ON_NINTENDO"] = "PLAY_ON_NINTENDO";
    QuestTaskConfigType["PLAY_ON_MOBILE"] = "PLAY_ON_MOBILE";
    QuestTaskConfigType["PLAY_SOCIAL_GAME"] = "PLAY_SOCIAL_GAME";
    QuestTaskConfigType["WATCH_VIDEO"] = "WATCH_VIDEO";
    QuestTaskConfigType["WATCH_VIDEO_ON_MOBILE"] = "WATCH_VIDEO_ON_MOBILE";
    QuestTaskConfigType["WATCH_STREAM"] = "WATCH_STREAM";
    QuestTaskConfigType["PLAY_ACTIVITY"] = "PLAY_ACTIVITY";
    QuestTaskConfigType["FOLLOW_SOCIAL"] = "FOLLOW_SOCIAL";
    QuestTaskConfigType["SHARE_CONTENT"] = "SHARE_CONTENT";
    QuestTaskConfigType["JOIN_COMMUNITY"] = "JOIN_COMMUNITY";
    QuestTaskConfigType["COMPLETE_SURVEY"] = "COMPLETE_SURVEY";
    QuestTaskConfigType["REDEEM_CODE"] = "REDEEM_CODE";
    QuestTaskConfigType["MAKE_PURCHASE"] = "MAKE_PURCHASE";
    QuestTaskConfigType["ACHIEVEMENT_IN_GAME"] = "ACHIEVEMENT_IN_GAME";
    QuestTaskConfigType["ACHIEVEMENT_IN_ACTIVITY"] = "ACHIEVEMENT_IN_ACTIVITY";
})(QuestTaskConfigType || (exports.QuestTaskConfigType = QuestTaskConfigType = {}));

};

__factories["src/quest.js"] = function (require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quest = void 0;
class Quest {
    data;
    constructor(data) {
        this.data = data;
    }
    static create(data) {
        return new Quest(data);
    }
    get id() {
        return this.data.id;
    }
    get config() {
        return this.data.config;
    }
    get userStatus() {
        return this.data.user_status;
    }
    get targetedContent() {
        return this.data.targeted_content;
    }
    get preview() {
        return this.data.preview;
    }
    get raw() {
        return this.data;
    }
    isExpired(reference = new Date()) {
        if (!this.data.config?.expires_at)
            return false;
        return reference.getTime() > new Date(this.data.config.expires_at).getTime();
    }
    isStarted(reference = new Date()) {
        if (!this.data.config?.starts_at)
            return true;
        return reference.getTime() >= new Date(this.data.config.starts_at).getTime();
    }
    isCompleted() {
        return Boolean(this.userStatus?.completed_at);
    }
    isEnrolledQuest() {
        return Boolean(this.userStatus?.enrolled_at);
    }
    hasClaimedRewards() {
        return Boolean(this.userStatus?.claimed_at);
    }
    updateUserStatus(userStatus) {
        this.data.user_status = userStatus;
    }
}
exports.Quest = Quest;

};

__factories["src/questManager.js"] = function (require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestManager = void 0;
const node_crypto_1 = require("node:crypto");
const events_1 = require("./events");
const quest_1 = require("./quest");
const taskTypes_1 = require("./taskTypes");
const utils_1 = require("./utils");
class QuestManager {
    quests = new Map();
    client;
    constructor(client, quests = []) {
        this.client = client;
        quests.forEach((quest) => this.quests.set(quest.id, quest));
    }
    static async fromResponse(client, response, fetchExcludedQuests = true) {
        if (response.quest_enrollment_blocked_until !== null) {
            console.warn(`[Thông báo] Việc nhận nhiệm vụ bị tạm khóa đến: ${response.quest_enrollment_blocked_until}.`);
        }
        const questManager = new QuestManager(client, response.quests.map((quest) => quest_1.Quest.create(quest)));
        // Quét toàn bộ nhiệm vụ phụ / excluded_quests để không xót bất kỳ nhiệm vụ nào
        if (fetchExcludedQuests && Array.isArray(response.excluded_quests) && response.excluded_quests.length > 0) {
            console.log(`Tìm thấy ${response.excluded_quests.length} nhiệm vụ phụ/bổ sung. Đang nạp chi tiết để không xót nhiệm vụ...`);
            for (const quest of response.excluded_quests) {
                if (quest.id && !questManager.hasQuest(quest.id)) {
                    await questManager.addExcludedQuest(quest.id);
                }
            }
        }
        return questManager;
    }
    async addExcludedQuest(questId) {
        try {
            const response = await this.client.rest.get(`/quests/${questId}`);
            const quest = quest_1.Quest.create({
                id: questId,
                config: response,
                user_status: null,
                targeted_content: 0,
                preview: false,
            });
            console.log(`Đã nạp thành công nhiệm vụ bổ sung: "${quest.config.messages.quest_name}".`);
            this.quests.set(quest.id, quest);
        }
        catch (err) {
            console.warn(`KHONG THE lay chi tiet nhiem vu bo sung "${questId}": ${err.message}`);
        }
    }
    [Symbol.iterator]() {
        return this.quests.values();
    }
    get size() {
        return this.quests.size;
    }
    list() {
        return Array.from(this.quests.values());
    }
    get(id) {
        return this.quests.get(id);
    }
    upsert(quest) {
        this.quests.set(quest.id, quest);
    }
    remove(id) {
        return this.quests.delete(id);
    }
    clear() {
        this.quests.clear();
    }
    getExpired(date = new Date()) {
        return this.list().filter((quest) => quest.isExpired(date));
    }
    getCompleted() {
        return this.list().filter((quest) => quest.isCompleted());
    }
    getClaimable() {
        return this.list().filter((quest) => quest.isCompleted() && !quest.hasClaimedRewards());
    }
    hasQuest(id) {
        return this.quests.has(id);
    }
    filterQuestsValidToDo(reference = new Date()) {
        return this.list().filter((quest) => !quest.isCompleted() &&
            !quest.isExpired(reference) &&
            quest.isStarted(reference) &&
            !quest.preview);
    }
    filterQuestsValidToRedeem(allowed) {
        return this.list().filter((quest) => quest.isCompleted() &&
            !quest.hasClaimedRewards() &&
            (!allowed || allowed(quest)));
    }
    /**
     * Id ổn định của quest — dùng làm khóa dedupe trên UI.
     */
    static getQuestId(quest) {
        try {
            return String(quest.id ?? quest.raw?.id ?? '');
        }
        catch {
            return '';
        }
    }
    /**
     * Waves 20: gộp tasks từ task_config_v2 (mới) và task_config (cũ).
     * Nhiều quest chỉ trả một trong hai → thiếu fallback là bỏ sót quest.
     */
    static getTasks(quest) {
        try {
            const cfg = quest.raw?.config;
            const v2 = cfg?.task_config_v2?.tasks;
            const v1 = cfg?.task_config?.tasks;
            if (v2 && typeof v2 === 'object')
                return v2;
            if (v1 && typeof v1 === 'object')
                return v1;
            return null;
        }
        catch {
            return null;
        }
    }
    /** Chọn event_name của nhiệm vụ theo thứ tự ưu tiên (null = không xác định). */
    static resolveTaskName(quest) {
        return (0, taskTypes_1.pickTaskName)(QuestManager.getTasks(quest));
    }
    /** Nhãn tiếng Việt của loại nhiệm vụ. */
    static getTaskLabel(quest) {
        return (0, taskTypes_1.taskLabelOf)(QuestManager.resolveTaskName(quest));
    }
    /** Nhóm nhiệm vụ (video/desktop/console/mobile/stream/activity/social/passive). */
    static getTaskKind(quest) {
        return (0, taskTypes_1.taskKindOf)(QuestManager.resolveTaskName(quest));
    }
    /** Có tự cày được bằng API không. */
    static isAutomatable(quest) {
        return (0, taskTypes_1.isAutomatableKind)((0, taskTypes_1.taskKindOf)(QuestManager.resolveTaskName(quest)));
    }
    /**
     * Số giây/điểm cần đạt của nhiệm vụ.
     * Đọc từ đúng task đã chọn (không đoán), fallback 900 như Discord client.
     */
    static getTaskTarget(quest, taskName) {
        const name = taskName ?? QuestManager.resolveTaskName(quest);
        if (!name)
            return 900;
        try {
            const tasks = QuestManager.getTasks(quest);
            const target = Number(tasks?.[name]?.target);
            if (Number.isFinite(target) && target > 0)
                return target;
        }
        catch {
            /* ignore */
        }
        return 900;
    }
    /** Tiến độ hiện tại của nhiệm vụ (giây/điểm). */
    static getTaskProgress(quest, taskName) {
        const name = taskName ?? QuestManager.resolveTaskName(quest);
        if (!name)
            return 0;
        const value = Number(quest.userStatus?.progress?.[name]?.value);
        if (Number.isFinite(value) && value > 0)
            return value;
        // Waves 41 (học từ repo discord-quest-helper / discord_api.rs):
        // Discord KHÔNG phải lúc nào cũng trả `user_status.progress` (một số quest
        // chỉ trả `stream_progress_seconds`). Nếu progress rỗng, đọc thẳng
        // `stream_progress_seconds` để tiến độ "Chưa làm" KHÔNG bị hiển thị 0% sai.
        const sps = Number(quest.userStatus?.stream_progress_seconds);
        if (Number.isFinite(sps) && sps > 0)
            return sps;
        return 0;
    }
    /**
     * application_id để gửi heartbeat.
     * Ưu tiên app khai trong task (game đích), fallback app của quest.
     */
    static getTaskApplicationId(quest, taskName) {
        const name = taskName ?? QuestManager.resolveTaskName(quest);
        try {
            const tasks = QuestManager.getTasks(quest);
            const fromTask = tasks?.[name]?.applications?.[0]?.id;
            if (fromTask)
                return String(fromTask);
        }
        catch {
            /* ignore */
        }
        return String(quest.config?.application?.id ?? '');
    }
    /** Nhận thưởng công khai (bot.ts gọi trực tiếp thay vì đụng redeemQuest private flow). */
    claimReward(quest) {
        return this.redeemQuest(quest);
    }
    /**
     * Waves 20: SỐ DƯ ORB THẬT từ ví Discord.
     * GET /users/@me/virtual-currency/balance → { balance }
     * Đây là con số Discord hiển thị trong Kho quà — chính xác tuyệt đối,
     * không phải suy ra từ danh sách quest đã claim như cách cũ.
     * Trả về null nếu endpoint lỗi/không tồn tại (caller tự fallback).
     */
    async fetchWalletBalance() {
        try {
            const res = (await this.client.rest.get('/users/@me/virtual-currency/balance'));
            if (typeof res?.balance === 'number' && Number.isFinite(res.balance)) {
                return res.balance;
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Waves 20: Tự nhận thưởng cho MỌI quest đã hoàn thành nhưng chưa claim.
     * Chạy ở pha "startup" (giống source tham khảo) — chỉ claim thưởng đã kiếm được,
     * KHÔNG nhận nhiệm vụ mới, nên không đụng quy tắc "không tự enroll".
     */
    async claimAllClaimable() {
        const list = this.getClaimable().filter((q) => !q.preview);
        let attempted = 0;
        let orbs = 0;
        for (const quest of list) {
            try {
                // Wave#102: postClaim trả true/false. Trước đây hàm này nuốt lỗi nên
                // claimAllClaimable cộng "đã nhận" cả khi Discord từ chối (orbs ảo).
                const ok = await this.redeemQuest(quest);
                if (ok) {
                    attempted++;
                    orbs += QuestManager.getQuestOrbs(quest);
                }
            }
            catch {
                /* redeemQuest đã tự bắt lỗi */
            }
        }
        if (attempted > 0) {
            (0, events_1.report)('quest:claim', { count: attempted, orbs });
        }
        return { attempted, orbs };
    }
    /**
     * Trích xuất số lượng Orb Discord từ cấu hình phần thưởng của quest
     */
    static getQuestOrbs(quest) {
        try {
            const rewards = quest.raw.config.rewards_config?.rewards;
            if (!Array.isArray(rewards))
                return 0;
            let totalOrbs = 0;
            for (const r of rewards) {
                if (typeof r.orb_quantity === 'number') {
                    totalOrbs += r.orb_quantity;
                }
            }
            return totalOrbs;
        }
        catch {
            return 0;
        }
    }
    /**
     * Lấy tên phần thưởng tiêu biểu của quest (Orb, Nitro, hoặc tên vật phẩm)
     */
    static getQuestRewardName(quest) {
        try {
            const rewards = quest.raw.config.rewards_config?.rewards;
            if (!Array.isArray(rewards) || rewards.length === 0)
                return 'Phần thưởng Discord';
            const orbs = QuestManager.getQuestOrbs(quest);
            if (orbs > 0) {
                return `${orbs} Discord Orbs`;
            }
            const first = rewards[0];
            if (first.messages?.name) {
                return first.messages.name;
            }
            return 'Phần thưởng Discord';
        }
        catch {
            return 'Phần thưởng Discord';
        }
    }
    /**
     * Waves 23: Dữ liệu THẬT để render thẻ nhiệm vụ y hệt Discord quest card.
     * Lấy trực tiếp từ `config.assets` / `config.messages` / `config.colors` /
     * `config.rewards_config.rewards` — KHÔNG bịa, KHÔNG hardcode.
     *
     * QUAN TRỌNG (đã verify bằng probe thật trên API):
     * `config.assets.*` KHÔNG phải hash — nó là **đường dẫn tương đối** dạng
     * `quests/<quest_id>/<snowflake>.<ext>`. URL thật = `https://cdn.discordapp.com/`
     * + đường dẫn đó (trả 200 image/jpeg|png). Vì vậy không cần dò đuôi file.
     * Giá trị `"PLACEHOLDER"` nghĩa là asset không tồn tại → phải bỏ qua.
     *
     * - `hero`/`gameTile`/`logotype`: đường dẫn tương đối (renderer ghép CDN).
     * - `rewardKind`: 'orbs' khi có orb_quantity, ngược lại 'item' (avatar decoration...).
     * - `rewardAsset`: asset ảnh/video của phần thưởng (chỉ có với reward dạng vật phẩm).
     */
    static getQuestCardData(quest) {
        const cfg = quest.config;
        const assets = cfg?.assets;
        const messages = cfg?.messages;
        const rewards = cfg?.rewards_config?.rewards;
        const list = Array.isArray(rewards) ? rewards : [];
        const orbReward = list.find((r) => typeof r.orb_quantity === 'number' && (r.orb_quantity ?? 0) > 0);
        const itemReward = list.find((r) => !(typeof r.orb_quantity === 'number' && (r.orb_quantity ?? 0) > 0));
        const orbCount = QuestManager.getQuestOrbs(quest);
        const itemName = itemReward?.messages?.name_with_article || itemReward?.messages?.name || 'phần thưởng Discord';
        // Waves 23: ưu tiên biến thể _dark vì UI của app là theme tối (Discord đặt tên theo
        // theme ĐÍCH: logotype_dark = bản dành cho nền tối, tức là chữ sáng). Bỏ qua
        // "PLACEHOLDER" — đó là giá trị giả Discord trả về khi không có asset.
        const pick = (...vals) => {
            for (const v of vals) {
                if (typeof v === 'string' && v.trim() && v.trim().toUpperCase() !== 'PLACEHOLDER')
                    return v.trim();
            }
            return '';
        };
        const rewardAsset = pick(itemReward?.asset, itemReward?.asset_video);
        const rewardIsVideo = /\.mp4$/i.test(rewardAsset);
        return {
            hero: pick(assets?.hero, assets?.quest_bar_hero, assets?.hero_video),
            heroVideo: pick(assets?.hero_video) || null,
            gameTile: pick(assets?.game_tile_dark, assets?.game_tile_light, assets?.game_tile),
            logotype: pick(assets?.logotype_dark, assets?.logotype_light, assets?.logotype),
            publisher: messages?.game_publisher || '',
            gameTitle: messages?.game_title || '',
            // Waves 42 — LOGO CHUẨN THEO TỪNG NHIỆM VỤ.
            // `assets.logotype`/`game_tile` hay là "PLACEHOLDER" (Discord không có)
            // → UI rơi về logo Orb, trông như "nhiệm vụ nào cũng 1 logo".
            // `application.icon` LUÔN có cho mọi quest (hash ảnh app/game) → đây là
            // phương án dự phòng ĐÚNG, cho ra logo THẬT của từng game.
            appId: cfg?.application?.id ? String(cfg.application.id) : '',
            appIcon: pick(cfg?.application?.icon) || '',
            expiresAt: cfg?.expires_at || null,
            colorPrimary: cfg?.colors?.primary || '',
            colorSecondary: cfg?.colors?.secondary || '',
            rewardKind: orbCount > 0 ? 'orbs' : 'item',
            rewardTitle: orbCount > 0 ? `Nhận ${orbCount} Orbs` : `Nhận ${itemName}`,
            rewardAsset,
            rewardIsVideo,
            rewardName: orbCount > 0 ? `${orbCount} Discord Orbs` : itemName,
            // Waves 32: platform THẬT từ rewards_config (Discord yêu cầu đúng giá trị này
            // khi claim; gửi sai/0 có thể bị từ chối). Gửi kèm lên UI để claim dùng đúng.
            platform: cfg?.rewards_config?.platforms?.[0] ?? 0,
            // Waves 43: số Orb + thời điểm NHẬN THẬT (claimed_at của Discord) để ô
            // "Đã làm" hiện đúng "nhận bao nhiêu, lúc nào" khi rê chuột.
            orbs: orbCount,
            claimedAt: quest.userStatus?.claimed_at || null,
            // Wave#102: payload claim của UI phải giống engine — gửi nguyên trạng
            // traffic metadata (undefined thì JSON bỏ field, KHÔNG đổi thành null).
            traffic_metadata_raw: quest.raw?.traffic_metadata_raw,
            traffic_metadata_sealed: quest.raw?.traffic_metadata_sealed,
        };
    }
    /**
     * Tổng hợp thống kê Orb của tất cả nhiệm vụ
     */
    getOrbsSummary() {
        let totalOrbs = 0;
        let completedOrbs = 0;
        let pendingOrbs = 0;
        for (const q of this.list()) {
            const orbs = QuestManager.getQuestOrbs(q);
            totalOrbs += orbs;
            if (q.isCompleted()) {
                completedOrbs += orbs;
            }
            else {
                pendingOrbs += orbs;
            }
        }
        return { totalOrbs, completedOrbs, pendingOrbs };
    }
    /**
     * Đăng ký tham gia một quest
     */
    acceptQuest(quest, isAndroid = false) {
        if (quest.isEnrolledQuest()) {
            return Promise.resolve(quest);
        }
        const enrollPromise = this.client.rest
            .post(`/quests/${quest.id}/enroll`, {
            body: {
                location: isAndroid ? 12 : 11, // 12: mobile, 11: desktop
                is_targeted: false,
                metadata_sealed: null,
                traffic_metadata_raw: quest.raw.traffic_metadata_raw,
                traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
            },
            headers: {
                AndroidRequest: isAndroid ? 'true' : 'false',
            },
        })
            .then((r) => {
            const q = this.get(quest.id) || quest;
            q.updateUserStatus(r);
            return q;
        })
            .catch((err) => {
            const msg = (err?.message || String(err)).toLowerCase();
            if (msg.includes('already enrolled') ||
                msg.includes('already_enrolled') ||
                err?.code === 50035) {
                const q = this.get(quest.id) || quest;
                if (q.raw.user_status) {
                    q.raw.user_status.enrolled_at =
                        q.raw.user_status.enrolled_at || new Date().toISOString();
                }
                else {
                    q.updateUserStatus({
                        enrolled_at: new Date().toISOString(),
                        completed_at: null,
                        claimed_at: null,
                        progress: {},
                    });
                }
                return q;
            }
            throw err;
        });
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Hết thời gian chờ phản hồi đăng ký từ Discord (quá 15 giây).')), 15000);
        });
        return Promise.race([enrollPromise, timeoutPromise]);
    }
    async timeout(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async redeemQuest(quest) {
        if (quest.hasClaimedRewards()) {
            return true;
        }
        return this.postClaim(quest);
    }
    /**
     * Waves 31 — CLAIM THẬT với hCaptcha (dựng lại đúng luồng client Discord).
     *
     * Luồng ĐẦY ĐỦ (không bypass — user thật tự giải captcha):
     *   1. POST /quests/{id}/claim-reward  (không captcha)
     *   2. Discord trả 400 + `captcha_key`/`captcha_sitekey`/`captcha_session_id`/
     *      `captcha_rqdata`/`captcha_rqtoken` → KHÔNG phải lỗi, là yêu cầu xác minh.
     *   3. App render hCaptcha widget với ĐÚNG sitekey Discord trả (service 'hcaptcha').
     *   4. User giải → app nhận `captcha_key` (token) → POST lại claim-reward
     *      kèm `captcha_key` + `captcha_rqdata` + `captcha_rqtoken` + `captcha_session_id`.
     *   5. Discord xác minh token hợp lệ (do người thật tạo) → cấp thưởng.
     *
     * `postClaim(quest, captcha?)`: nếu `captcha` có giá trị thì nhét thêm 5 trường
     * captcha vào body đúng như client Discord làm.
     */
    async postClaim(quest, captcha) {
        const name = quest.config.messages.quest_name;
        const orbs = QuestManager.getQuestOrbs(quest);
        const rewardName = QuestManager.getQuestRewardName(quest);
        try {
            const platform = quest.raw.config.rewards_config?.platforms?.[0] ?? 0;
            const body = {
                platform,
                location: 11,
                is_targeted: false,
                metadata_raw: null,
                metadata_sealed: null,
                traffic_metadata_raw: quest.raw.traffic_metadata_raw,
                traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
            };
            // Khi có token captcha do user giải → gửi kèm đúng các trường Discord yêu cầu.
            if (captcha?.captcha_key) {
                body.captcha_key = captcha.captcha_key;
                if (captcha.captcha_rqdata)
                    body.captcha_rqdata = captcha.captcha_rqdata;
                if (captcha.captcha_rqtoken)
                    body.captcha_rqtoken = captcha.captcha_rqtoken;
                if (captcha.captcha_session_id)
                    body.captcha_session_id = captcha.captcha_session_id;
            }
            const res = (await this.client.rest.post(`/quests/${quest.id}/claim-reward`, { body }));
            // Discord trả user_status (một số phiên bản bọc trong { user_status }).
            const status = res && res.user_status ? res.user_status : res;
            quest.updateUserStatus(status);
            const claimedAt = quest.userStatus?.claimed_at;
            if (!claimedAt) {
                console.warn(`[Cảnh báo] Discord trả 2xx cho "${name}" nhưng chưa thấy claimed_at — sẽ xác nhận lại khi quét.`);
            }
            console.log(`ĐÃ NHẬN THƯỞNG: "${name}" -> Nhận: ${rewardName}!`);
            // Nhận thưởng xong → event riêng 'quest:claim' (UI chuyển tab "Đã làm").
            (0, events_1.report)('quest:claim', {
                id: QuestManager.getQuestId(quest),
                name,
                orbs,
                rewardName,
                confirmed: Boolean(claimedAt),
            });
            return true;
        }
        catch (err) {
            this.handleClaimError(quest, err, name, orbs, rewardName);
            return false;
        }
    }
    /**
     * Phân loại lỗi claim và report cho UI.
     *  - CAPTCHA: Discord yêu cầu xác minh → gửi `quest:captcha` kèm ĐỦ dữ liệu để
     *    UI render hCaptcha widget (sitekey + session + rqdata + rqtoken).
     *  - Lỗi khác: log thật + report `quest:error` (KHÔNG giả vờ thành công).
     */
    handleClaimError(quest, err, name, orbs, rewardName) {
        const message = err?.message || String(err);
        // @discordjs/rest: DiscordAPIError có .rawError (body JSON Discord trả).
        // Một số phiên bản để ở .body / .data → gộp cả 3 cho chắc.
        const rawError = err?.rawError || err?.body || err?.data || {};
        const captchaData = err?.captcha ?? rawError;
        const isCaptcha = !!rawError.captcha_key ||
            !!captchaData?.captcha_sitekey ||
            message.includes('No Description') ||
            message.toLowerCase().includes('captcha');
        if (isCaptcha) {
            // Trích ĐÚNG các trường Discord trả (xem interface CaptchaDataFromRequest).
            const captcha = {
                sitekey: captchaData?.captcha_sitekey ||
                    rawError?.captcha_sitekey ||
                    '',
                service: captchaData?.captcha_service ||
                    rawError?.captcha_service ||
                    'hcaptcha',
                sessionId: captchaData?.captcha_session_id ||
                    rawError?.captcha_session_id ||
                    '',
                rqdata: captchaData?.captcha_rqdata ||
                    rawError?.captcha_rqdata ||
                    '',
                rqtoken: captchaData?.captcha_rqtoken ||
                    rawError?.captcha_rqtoken ||
                    '',
            };
            if (captcha.sitekey) {
                console.log(`CAPTCHA: "${name}" cần xác minh người thật (hCaptcha sitekey=${captcha.sitekey.slice(0, 12)}...). Đang mở trình xác minh...`);
                (0, events_1.report)('quest:captcha', {
                    id: QuestManager.getQuestId(quest),
                    name,
                    orbs,
                    rewardName,
                    captcha,
                });
                return;
            }
            // Có cờ captcha nhưng Discord không kèm sitekey → báo để mở Kho quà thủ công.
            console.log(`Nhiệm vụ "${name}" đã hoàn thành 100% nhưng Discord yêu cầu xác minh (không kèm sitekey).`);
            (0, events_1.report)('quest:done', {
                id: QuestManager.getQuestId(quest),
                name,
                orbs,
                rewardName,
                note: 'Discord yêu cầu xác minh — mở Kho quà để nhận thủ công',
            });
            return;
        }
        console.warn(`Không thể tự nhận thưởng cho "${name}":`, message);
        (0, events_1.report)('quest:error', {
            id: QuestManager.getQuestId(quest),
            name,
            orbs,
            rewardName,
            message,
            phase: 'claim',
        });
    }
    /**
     * Điểm vào thực thi một nhiệm vụ.
     * Waves 20: phủ ĐỦ mọi loại nhiệm vụ Discord (20 event_name) thay vì 7 loại như trước,
     * và chọn đúng endpoint theo `kind` thay vì bỏ qua nhiệm vụ không hỗ trợ.
     */
    async doingQuest(quest, heartbeatIntervalS = 20) {
        const questName = quest.config.messages.quest_name;
        const orbs = QuestManager.getQuestOrbs(quest);
        const rewardName = QuestManager.getQuestRewardName(quest);
        const questId = QuestManager.getQuestId(quest);
        // QUY TẮC: KHÔNG tự nhận nhiệm vụ. Chỉ cày quest người dùng đã nhận trong Discord.
        if (!quest.isEnrolledQuest()) {
            console.log(`⏭ Bỏ qua "${questName}": chưa nhận nhiệm vụ. Hãy mở Discord bấm "Nhận nhiệm vụ" rồi quét lại.`);
            (0, events_1.report)('quest:skip', {
                id: questId,
                name: questName,
                reason: 'Chưa nhận nhiệm vụ trong Discord (app không tự nhận)',
            });
            return;
        }
        const taskName = QuestManager.resolveTaskName(quest);
        const kind = (0, taskTypes_1.taskKindOf)(taskName);
        const taskLabel = (0, taskTypes_1.taskLabelOf)(taskName);
        if (!taskName || kind === 'unknown') {
            console.warn(`Nhiệm vụ "${questName}" không có loại nhiệm vụ tự động tương thích.`);
            (0, events_1.report)('quest:skip', {
                id: questId,
                name: questName,
                reason: 'Cấu hình nhiệm vụ không được hỗ trợ',
            });
            return;
        }
        const secondsNeeded = QuestManager.getTaskTarget(quest, taskName);
        const secondsDone = QuestManager.getTaskProgress(quest, taskName);
        const applicationName = quest.config.application?.name || '';
        const appId = QuestManager.getTaskApplicationId(quest, taskName);
        console.log(`▶ "${questName}" · ${taskLabel} (${taskName}) · ${orbs} Orbs · ${Math.floor(secondsDone)}/${secondsNeeded}`);
        (0, events_1.report)('quest:start', {
            id: questId,
            name: questName,
            task: taskName,
            taskLabel,
            kind,
            application: applicationName,
            secondsNeeded,
            secondsDone,
            orbs,
            rewardName,
        });
        switch (kind) {
            case 'video': {
                await this.doingWatchVideoQuest(quest, questName, secondsNeeded, secondsDone);
                return;
            }
            case 'desktop': {
                await this.doingPlayOnPlatformQuest(quest, questName, secondsNeeded, taskName, applicationName, appId, heartbeatIntervalS);
                return;
            }
            case 'console': {
                await this.doingConsoleQuest(quest, questName, secondsNeeded, taskName, applicationName, appId, Math.max(heartbeatIntervalS, 60));
                return;
            }
            case 'mobile': {
                await this.doingMobileQuest(quest, questName, secondsNeeded, taskName, applicationName, appId);
                return;
            }
            case 'stream': {
                await this.doingWatchStreamQuest(quest, questName, secondsNeeded, secondsDone);
                return;
            }
            case 'activity': {
                if (taskName === 'ACHIEVEMENT_IN_ACTIVITY' ||
                    taskName === 'ACHIEVEMENT_IN_GAME') {
                    await this.doingAchievementInActivityQuest(quest, questName);
                }
                else {
                    await this.doingPlayActivityQuest(quest, questName, secondsNeeded, taskName, applicationName, heartbeatIntervalS);
                }
                return;
            }
            case 'social': {
                await this.doingSocialQuest(quest, questName, taskName);
                return;
            }
            case 'passive': {
                await this.doingPassiveProgressQuest(quest, questName, taskName);
                return;
            }
            default: {
                (0, events_1.report)('quest:skip', {
                    id: questId,
                    name: questName,
                    reason: 'Loại nhiệm vụ chưa xác định',
                });
            }
        }
    }
    /** Báo hoàn thành + tự nhận thưởng — dùng chung cho mọi loại nhiệm vụ. */
    async finishQuest(quest, questName) {
        console.log(`ĐÃ HOÀN THÀNH NHIỆM VỤ: "${questName}"!`);
        (0, events_1.report)('quest:done', {
            id: QuestManager.getQuestId(quest),
            name: questName,
            orbs: QuestManager.getQuestOrbs(quest),
            rewardName: QuestManager.getQuestRewardName(quest),
        });
        await this.redeemQuest(quest);
    }
    /** Báo lỗi dừng nhiệm vụ (dùng chung). */
    failQuest(quest, questName, message) {
        console.error(`Dừng nhiệm vụ "${questName}": ${message}`);
        (0, events_1.report)('quest:error', {
            id: QuestManager.getQuestId(quest),
            name: questName,
            message,
        });
    }
    async doingWatchVideoQuest(quest, questName, secondsNeeded, secondsDone) {
        // Bám đúng tốc độ thời gian thực: mỗi giây trôi qua mới được cộng tối đa 7 giây,
        // biên +10s. Đẩy nhanh hơn = Discord đánh dấu bất thường.
        const maxFuture = 10, speed = 7, interval = 7;
        const enrolledAt = new Date(quest.userStatus?.enrolled_at).getTime();
        let completed = false;
        console.log(`Đang giả lập xem video nhiệm vụ: "${questName}" (${secondsNeeded} giây)...`);
        while (true) {
            const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
            const diff = maxAllowed - secondsDone;
            const timestamp = secondsDone + speed;
            if (diff >= speed) {
                const res = (await this.client.rest.post(`/quests/${quest.id}/video-progress`, {
                    body: {
                        timestamp: Math.min(secondsNeeded, timestamp + Math.random()),
                    },
                }));
                completed = res.completed_at != null;
                quest.updateUserStatus(res);
                secondsDone = Math.min(secondsNeeded, timestamp);
                (0, events_1.report)('quest:progress', {
                    id: QuestManager.getQuestId(quest),
                    name: questName,
                    secondsDone,
                    secondsNeeded,
                });
            }
            if (timestamp >= secondsNeeded) {
                break;
            }
            await this.timeout(interval * 1000);
        }
        if (!completed) {
            const finalRes = await this.client.rest.post(`/quests/${quest.id}/video-progress`, {
                body: { timestamp: secondsNeeded },
            });
            quest.updateUserStatus(finalRes);
        }
        console.log(`ĐÃ HOÀN THÀNH VIDEO: "${questName}"!`);
        (0, events_1.report)('quest:done', {
            id: QuestManager.getQuestId(quest),
            name: questName,
            orbs: QuestManager.getQuestOrbs(quest),
            rewardName: QuestManager.getQuestRewardName(quest),
        });
        await this.redeemQuest(quest);
    }
    /**
     * Nhiệm vụ chơi/stream trên PC: POST /quests/{id}/heartbeat với application_id.
     * Waves 20: dùng application_id của ĐÚNG task (game đích) thay vì app của quest,
     * và nhận luôn STREAM_ON_DESKTOP / PLAY_ON_DESKTOP_V2 (trước đây bị bỏ qua).
     */
    async doingPlayOnPlatformQuest(quest, questName, secondsNeeded, taskName, applicationName, appId, heartbeatIntervalS = 20) {
        const applicationId = appId || QuestManager.getTaskApplicationId(quest, taskName);
        const interval = Math.max(5, heartbeatIntervalS);
        const maxTicks = Math.ceil(secondsNeeded / interval) + 60;
        console.log(`Đang giả lập chơi "${applicationName}" cho "${questName}" (Thời gian yêu cầu: ${Math.ceil(secondsNeeded / 60)} phút, heartbeat ${interval}s)...`);
        let consecutiveErrors = 0;
        let tick = 0;
        while (!quest.isCompleted() && tick < maxTicks) {
            tick++;
            try {
                const res = await this.client.rest.post(`/quests/${quest.id}/heartbeat`, {
                    body: {
                        application_id: applicationId,
                        terminal: false,
                    },
                });
                quest.updateUserStatus(res);
                consecutiveErrors = 0;
                const currentDone = QuestManager.getTaskProgress(quest, taskName);
                console.log(`  [Heartbeat: ${applicationName}] Tiến độ: ${Math.floor(currentDone / 60)}/${Math.ceil(secondsNeeded / 60)} phút.`);
                (0, events_1.report)('quest:progress', {
                    id: QuestManager.getQuestId(quest),
                    name: questName,
                    secondsDone: currentDone,
                    secondsNeeded,
                });
            }
            catch (err) {
                consecutiveErrors++;
                const msg = err?.message || String(err);
                console.warn(`[Cảnh báo] Lỗi gửi tín hiệu heartbeat "${applicationName}" (${consecutiveErrors}/5): ${msg}`);
                if (consecutiveErrors >= 5) {
                    this.failQuest(quest, questName, `Mất tín hiệu liên tục: ${msg}`);
                    return;
                }
            }
            await this.timeout(interval * 1000);
        }
        if (!quest.isCompleted()) {
            this.failQuest(quest, questName, `Quá ${maxTicks} nhịp heartbeat mà Discord chưa ghi nhận hoàn thành.`);
            return;
        }
        try {
            const res = await this.client.rest.post(`/quests/${quest.id}/heartbeat`, {
                body: {
                    application_id: applicationId,
                    terminal: true,
                },
            });
            quest.updateUserStatus(res);
        }
        catch {
            /* ignore terminal heartbeat error */
        }
        await this.finishQuest(quest, questName);
    }
    /**
     * Nhiệm vụ chơi trên console: POST /quests/{id}/console-heartbeat.
     * Waves 20: MỚI — Xbox / PlayStation / Nintendo trước đây không cày được.
     */
    async doingConsoleQuest(quest, questName, secondsNeeded, taskName, applicationName, appId, heartbeatIntervalS = 60) {
        const applicationId = appId || QuestManager.getTaskApplicationId(quest, taskName);
        const platform = taskName.replace('PLAY_ON_', '');
        const interval = Math.max(30, heartbeatIntervalS);
        const maxTicks = Math.ceil(secondsNeeded / interval) + 60;
        console.log(`Đang giả lập chơi trên ${platform} "${applicationName}" cho "${questName}" (${Math.ceil(secondsNeeded / 60)} phút)...`);
        let consecutiveErrors = 0;
        let tick = 0;
        while (!quest.isCompleted() && tick < maxTicks) {
            tick++;
            try {
                const res = await this.client.rest.post(`/quests/${quest.id}/console-heartbeat`, {
                    body: {
                        application_id: applicationId,
                        platform,
                        terminal: false,
                    },
                });
                quest.updateUserStatus(res);
                consecutiveErrors = 0;
                const currentDone = QuestManager.getTaskProgress(quest, taskName);
                console.log(`  [Console ${platform}] Tiến độ: ${Math.floor(currentDone / 60)}/${Math.ceil(secondsNeeded / 60)} phút.`);
                (0, events_1.report)('quest:progress', {
                    id: QuestManager.getQuestId(quest),
                    name: questName,
                    secondsDone: currentDone,
                    secondsNeeded,
                });
            }
            catch (err) {
                consecutiveErrors++;
                const msg = err?.message || String(err);
                console.warn(`[Cảnh báo] Lỗi console-heartbeat (${consecutiveErrors}/5): ${msg}`);
                if (consecutiveErrors >= 5) {
                    this.failQuest(quest, questName, `Console heartbeat lỗi liên tục: ${msg}`);
                    return;
                }
            }
            await this.timeout(interval * 1000);
        }
        if (!quest.isCompleted()) {
            this.failQuest(quest, questName, `Console: quá ${maxTicks} nhịp mà chưa hoàn thành.`);
            return;
        }
        try {
            await this.client.rest.post(`/quests/${quest.id}/console-heartbeat`, {
                body: {
                    application_id: applicationId,
                    platform,
                    terminal: true,
                },
            });
        }
        catch {
            /* ignore */
        }
        await this.finishQuest(quest, questName);
    }
    /**
     * Nhiệm vụ mobile / social game: POST /quests/{id}/mobile-heartbeat.
     * Waves 20: MỚI — PLAY_ON_MOBILE và PLAY_SOCIAL_GAME trước đây không cày được.
     */
    async doingMobileQuest(quest, questName, secondsNeeded, taskName, applicationName, appId) {
        const applicationId = appId || QuestManager.getTaskApplicationId(quest, taskName);
        const sessionId = (0, node_crypto_1.randomUUID)();
        const interval = 45;
        const maxTicks = Math.ceil(secondsNeeded / interval) + 60;
        console.log(`Đang giả lập chơi mobile "${applicationName}" cho "${questName}" (${Math.ceil(secondsNeeded / 60)} phút)...`);
        let consecutiveErrors = 0;
        let tick = 0;
        while (!quest.isCompleted() && tick < maxTicks) {
            tick++;
            try {
                const res = await this.client.rest.post(`/quests/${quest.id}/mobile-heartbeat`, {
                    body: {
                        application_id: applicationId,
                        session_id: sessionId,
                    },
                });
                quest.updateUserStatus(res);
                consecutiveErrors = 0;
                const currentDone = QuestManager.getTaskProgress(quest, taskName);
                console.log(`  [Mobile] Tiến độ: ${Math.floor(currentDone / 60)}/${Math.ceil(secondsNeeded / 60)} phút.`);
                (0, events_1.report)('quest:progress', {
                    id: QuestManager.getQuestId(quest),
                    name: questName,
                    secondsDone: currentDone,
                    secondsNeeded,
                });
            }
            catch (err) {
                consecutiveErrors++;
                const msg = err?.message || String(err);
                console.warn(`[Cảnh báo] Lỗi mobile-heartbeat (${consecutiveErrors}/5): ${msg}`);
                if (consecutiveErrors >= 5) {
                    this.failQuest(quest, questName, `Mobile heartbeat lỗi liên tục: ${msg}`);
                    return;
                }
            }
            await this.timeout(interval * 1000);
        }
        if (!quest.isCompleted()) {
            this.failQuest(quest, questName, `Mobile: quá ${maxTicks} nhịp mà chưa hoàn thành.`);
            return;
        }
        await this.finishQuest(quest, questName);
    }
    /**
     * Nhiệm vụ xem stream: POST /quests/{id}/stream-progress { timestamp, elapsed }.
     * Waves 20: MỚI — WATCH_STREAM trước đây không cày được.
     * `elapsed` phải bám thời gian thật đã trôi qua kể từ lúc nhận nhiệm vụ.
     */
    async doingWatchStreamQuest(quest, questName, secondsNeeded, secondsDone) {
        const enrolledAt = new Date(quest.userStatus?.enrolled_at).getTime() || Date.now();
        let done = secondsDone;
        let completed = quest.isCompleted();
        const maxTicks = Math.ceil(secondsNeeded / 30) + 60;
        let tick = 0;
        let consecutiveErrors = 0;
        console.log(`Đang giả lập xem stream cho "${questName}" (${Math.ceil(secondsNeeded / 60)} phút)...`);
        while (done < secondsNeeded && tick < maxTicks && !completed) {
            tick++;
            const elapsed = Math.max(0, Math.floor((Date.now() - enrolledAt) / 1000));
            // Không được vượt quá thời gian thực đã trôi qua (+10s biên an toàn).
            const allowed = Math.min(secondsNeeded, elapsed + 10);
            const next = Math.max(done, Math.min(done + 30, allowed));
            if (next > done) {
                try {
                    const res = (await this.client.rest.post(`/quests/${quest.id}/stream-progress`, { body: { timestamp: next, elapsed } }));
                    quest.updateUserStatus(res);
                    completed = res?.completed_at != null;
                    done = next;
                    consecutiveErrors = 0;
                    (0, events_1.report)('quest:progress', {
                        id: QuestManager.getQuestId(quest),
                        name: questName,
                        secondsDone: done,
                        secondsNeeded,
                    });
                    console.log(`  [Stream] Tiến độ: ${Math.floor(done / 60)}/${Math.ceil(secondsNeeded / 60)} phút.`);
                }
                catch (err) {
                    consecutiveErrors++;
                    console.warn(`[Cảnh báo] Lỗi stream-progress (${consecutiveErrors}/3): ${err?.message || err}`);
                    // Endpoint không tồn tại với token user → dừng ngay, không treo 30 phút.
                    if (consecutiveErrors >= 3) {
                        this.failQuest(quest, questName, `stream-progress lỗi liên tục: ${err?.message || err}`);
                        return;
                    }
                }
            }
            if (completed)
                break;
            await this.timeout(30_000);
        }
        if (!completed) {
            const elapsed = Math.max(0, Math.floor((Date.now() - enrolledAt) / 1000));
            try {
                const res = await this.client.rest.post(`/quests/${quest.id}/stream-progress`, { body: { timestamp: secondsNeeded, elapsed } });
                quest.updateUserStatus(res);
            }
            catch {
                /* ignore */
            }
        }
        if (!quest.isCompleted()) {
            this.failQuest(quest, questName, `Stream: chưa đạt ${secondsNeeded} giây sau ${tick} nhịp.`);
            return;
        }
        await this.finishQuest(quest, questName);
    }
    /**
     * Nhiệm vụ social: POST /quests/{id}/social-action.
     * Waves 20: MỚI — Follow / Share / Join community trước đây không cày được.
     */
    async doingSocialQuest(quest, questName, taskName) {
        const action = taskName === 'FOLLOW_SOCIAL'
            ? 'follow'
            : taskName === 'SHARE_CONTENT'
                ? 'share'
                : 'join';
        const platform = taskName === 'JOIN_COMMUNITY' ? 'community' : 'social';
        console.log(`Đang thực hiện hành động "${action}" cho "${questName}"...`);
        try {
            const res = await this.client.rest.post(`/quests/${quest.id}/social-action`, { body: { action, platform } });
            quest.updateUserStatus(res);
        }
        catch (err) {
            this.failQuest(quest, questName, `social-action lỗi: ${err?.message || err}`);
            return;
        }
        await this.finishQuest(quest, questName);
    }
    /**
     * Nhiệm vụ passive (khảo sát / nhập mã / mua hàng): chỉ theo dõi GET /quests/{id}/progress.
     * Waves 20: MỚI — không tự hoàn thành được, nhưng vẫn poll để bắt trạng thái nếu
     * Discord cập nhật (VD: người dùng tự làm trên app).
     */
    async doingPassiveProgressQuest(quest, questName, taskName) {
        const maxAttempts = 60;
        let attempts = 0;
        let consecutiveErrors = 0;
        console.log(`Theo dõi nhiệm vụ "${questName}" (${(0, taskTypes_1.taskLabelOf)(taskName)}) — loại này phải làm thủ công trên Discord.`);
        while (!quest.isCompleted() && attempts < maxAttempts) {
            attempts++;
            try {
                const res = await this.client.rest.get(`/quests/${quest.id}/progress`);
                quest.updateUserStatus(res);
                consecutiveErrors = 0;
            }
            catch (err) {
                // Endpoint không tồn tại với token user → dừng ngay, không treo 10 phút.
                consecutiveErrors++;
                if (consecutiveErrors >= 3) {
                    (0, events_1.report)('quest:skip', {
                        id: QuestManager.getQuestId(quest),
                        name: questName,
                        reason: `${(0, taskTypes_1.taskLabelOf)(taskName)} — cần thao tác thủ công trên Discord`,
                    });
                    return;
                }
            }
            if (quest.isCompleted())
                break;
            await this.timeout(10_000);
        }
        if (!quest.isCompleted()) {
            (0, events_1.report)('quest:skip', {
                id: QuestManager.getQuestId(quest),
                name: questName,
                reason: `${(0, taskTypes_1.taskLabelOf)(taskName)} — cần thao tác thủ công trên Discord`,
            });
            return;
        }
        await this.finishQuest(quest, questName);
    }
    async doingPlayActivityQuest(quest, questName, secondsNeeded, taskName, applicationName, heartbeatIntervalS = 20) {
        const interval = Math.max(5, heartbeatIntervalS);
        const streamKey = 'call:1:1';
        const maxTicks = Math.ceil(secondsNeeded / interval) + 60;
        console.log(`Đang giả lập hoạt động voice/activity "${applicationName}" cho "${questName}" (${Math.ceil(secondsNeeded / 60)} phút)...`);
        let consecutiveErrors = 0;
        let tick = 0;
        while (!quest.isCompleted() && tick < maxTicks) {
            tick++;
            try {
                const res = await this.client.rest.post(`/quests/${quest.id}/heartbeat`, {
                    body: { stream_key: streamKey, terminal: false },
                });
                quest.updateUserStatus(res);
                consecutiveErrors = 0;
                const currentDone = QuestManager.getTaskProgress(quest, taskName);
                console.log(`  [Hoạt động: ${applicationName}] Tiến độ: ${Math.floor(currentDone / 60)}/${Math.ceil(secondsNeeded / 60)} phút.`);
                (0, events_1.report)('quest:progress', {
                    id: QuestManager.getQuestId(quest),
                    name: questName,
                    secondsDone: currentDone,
                    secondsNeeded,
                });
            }
            catch (err) {
                consecutiveErrors++;
                const msg = err?.message || String(err);
                console.warn(`[Cảnh báo] Lỗi gửi tín hiệu hoạt động "${applicationName}" (${consecutiveErrors}/5): ${msg}`);
                if (consecutiveErrors >= 5) {
                    this.failQuest(quest, questName, `Lỗi tín hiệu liên tục: ${msg}`);
                    return;
                }
            }
            await this.timeout(interval * 1000);
        }
        if (!quest.isCompleted()) {
            this.failQuest(quest, questName, `Activity: quá ${maxTicks} nhịp mà chưa hoàn thành.`);
            return;
        }
        try {
            const res = await this.client.rest.post(`/quests/${quest.id}/heartbeat`, {
                body: { stream_key: streamKey, terminal: true },
            });
            quest.updateUserStatus(res);
        }
        catch {
            /* ignore terminal heartbeat error */
        }
        await this.finishQuest(quest, questName);
    }
    async doingAchievementInActivityQuest(quest, questName) {
        const applicationId = quest.config.application.id;
        const applicationName = quest.config.application.name;
        const taskName = QuestManager.resolveTaskName(quest);
        const questTarget = QuestManager.getTaskTarget(quest, taskName);
        console.log(`Đang xử lý thành tựu ứng dụng: "${applicationName}" cho "${questName}"...`);
        const query = new URLSearchParams({
            response_type: 'code',
            client_id: applicationId,
            scope: 'identify applications.commands applications.entitlements',
            state: '',
        });
        const res2 = (await this.client.rest.post(`/oauth2/authorize`, {
            query,
            body: {
                permissions: '0',
                authorize: true,
                integration_type: 1,
                location_context: {
                    guild_id: '10000',
                    channel_id: '10000',
                    channel_type: 10000,
                },
            },
        }));
        const location = res2?.location;
        let authCode = null;
        if (location) {
            authCode = new URL(location).searchParams.get('code');
        }
        if (!authCode) {
            const message = `Không lấy được mã xác thực cho ứng dụng ${applicationName}.`;
            console.error(message);
            (0, events_1.report)('quest:error', { id: QuestManager.getQuestId(quest), name: questName, message });
            return;
        }
        const { token, error: authError, activityReferrer } = await utils_1.Utils.authorizeDiscordSays(applicationId, quest.id, authCode, this.client);
        if (authError || !token) {
            const message = `Không cấp được token từ Discord Says cho ứng dụng ${applicationName}.`;
            console.error(message, authError);
            (0, events_1.report)('quest:error', { id: QuestManager.getQuestId(quest), name: questName, message });
            return;
        }
        const { success, error: progressError } = await utils_1.Utils.progressDiscordSays(applicationId, quest.id, token, questTarget, activityReferrer);
        if (progressError || !success) {
            const message = `Không gửi được tiến độ tới Discord Says cho ứng dụng ${applicationName}.`;
            console.error(message, progressError);
            (0, events_1.report)('quest:error', { id: QuestManager.getQuestId(quest), name: questName, message });
            return;
        }
        // Thu hồi quyền ứng dụng sau khi hoàn thành
        try {
            const res3 = (await this.client.rest.get(`/oauth2/tokens`));
            const tokenInfo = res3.find((t) => t.application.id === applicationId);
            if (tokenInfo) {
                await this.client.rest.delete(`/oauth2/tokens/${tokenInfo.id}`);
            }
        }
        catch {
            /* ignore revoke error */
        }
        if (quest.raw.user_status) {
            quest.raw.user_status.completed_at =
                quest.raw.user_status.completed_at || new Date().toISOString();
        }
        else {
            quest.updateUserStatus({
                enrolled_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
                claimed_at: null,
                progress: {},
            });
        }
        await this.finishQuest(quest, questName);
    }
}
exports.QuestManager = QuestManager;

};

__factories["src/security.js"] = function (require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob) {
"use strict";
/**
 * Module bảo mật: Đảm bảo cắt đứt 100% mọi kết nối ra ngoài ngoài máy chủ chính thức của Discord.
 * Ngăn chặn tuyệt đối mọi hành vi rò rỉ token hoặc gửi dữ liệu tới server bên ngoài/webhook/telemetry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityGuard = void 0;
const ALLOWED_DOMAINS = [
    'discord.com',
    'gateway.discord.gg',
    'discordsays.com',
];
class SecurityGuard {
    /**
     * Kiểm tra xem URL đích có phải là server chính thức của Discord hay không.
     * Nếu phát hiện kết nối tới bất kỳ IP hoặc domain nào khác, lập tức chặn đứng.
     */
    static isUrlAllowed(rawUrl) {
        try {
            const parsed = new URL(rawUrl);
            const hostname = parsed.hostname.toLowerCase();
            // Kiểm tra domain hoặc subdomain của discord.com, discordsays.com, gateway.discord.gg
            const isAllowed = ALLOWED_DOMAINS.some((allowed) => hostname === allowed || hostname.endsWith('.' + allowed));
            return isAllowed;
        }
        catch {
            return false;
        }
    }
    /**
     * Xác thực URL trước khi gửi request. Nếu vi phạm, quăng lỗi bảo mật.
     */
    static assertSafeUrl(rawUrl) {
        if (!this.isUrlAllowed(rawUrl)) {
            const msg = `[BẢO MẬT] ĐÃ CHẶN KẾT NỐI KHẢ NGHI: "${rawUrl}". Chỉ cho phép kết nối trực tiếp đến máy chủ chính thức của Discord!`;
            console.error(msg);
            throw new Error(msg);
        }
    }
    /**
     * Ẩn token trong chuỗi log để tránh vô tình in token thô ra màn hình/nhật ký.
     */
    static sanitizeLog(text, token) {
        if (!text)
            return text;
        let clean = text;
        if (token && token.length > 10) {
            clean = clean.split(token).join('***TOKEN_PROTECTED***');
        }
        // Che các chuỗi token dạng Discord: xxx.yyy.zzz
        clean = clean.replace(/([a-zA-Z0-9_-]{24,}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{25,})/g, '***TOKEN_PROTECTED***');
        return clean;
    }
}
exports.SecurityGuard = SecurityGuard;

};

__factories["src/taskTypes.js"] = function (require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob) {
"use strict";
/**
 * Waves 20: Bảng metadata nhiệm vụ Discord.
 *
 * Tham chiếu logic từ Discord-Auto-Quests (engine.ts) nhưng mở rộng:
 * - Phủ ĐỦ 20 event_name (source gốc chỉ 17) — gồm cả PLAY_ON_DESKTOP_V2 và ACHIEVEMENT_IN_*.
 * - Ưu tiên theo thứ tự: Gameplay > Streaming > Video > Social > Passive.
 *   Lý do: một quest có thể khai nhiều task, phải chọn task "nặng" nhất để chạy đúng.
 * - Mỗi task map sang `kind` — quyết định ENDPOINT sẽ gọi:
 *     video    → POST /quests/{id}/video-progress
 *     desktop  → POST /quests/{id}/heartbeat        (application_id)
 *     console  → POST /quests/{id}/console-heartbeat (application_id + platform)
 *     mobile   → POST /quests/{id}/mobile-heartbeat  (application_id + session_id)
 *     stream   → POST /quests/{id}/stream-progress   (timestamp + elapsed)
 *     activity → POST /quests/{id}/heartbeat         (stream_key) hoặc OAuth flow
 *     social   → POST /quests/{id}/social-action     (action + platform)
 *     passive  → GET  /quests/{id}/progress          (poll tới khi xong)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_META = exports.TASK_PRIORITY = void 0;
exports.taskLabelOf = taskLabelOf;
exports.taskKindOf = taskKindOf;
exports.isAutomatableKind = isAutomatableKind;
exports.pickTaskName = pickTaskName;
/**
 * Thứ tự ưu tiên khi một quest khai nhiều task.
 * Task đứng trước được chọn để cày.
 */
exports.TASK_PRIORITY = [
    // Gameplay — nhóm phổ biến nhất
    'PLAY_ON_DESKTOP',
    'PLAY_ON_DESKTOP_V2',
    'PLAY_ON_XBOX',
    'PLAY_ON_PLAYSTATION',
    'PLAY_ON_NINTENDO',
    'PLAY_ON_MOBILE',
    'PLAY_SOCIAL_GAME',
    'PLAY_ACTIVITY',
    'ACHIEVEMENT_IN_ACTIVITY',
    'ACHIEVEMENT_IN_GAME',
    // Streaming
    'STREAM_ON_DESKTOP',
    'WATCH_STREAM',
    // Video
    'WATCH_VIDEO',
    'WATCH_VIDEO_ON_MOBILE',
    // Social
    'FOLLOW_SOCIAL',
    'SHARE_CONTENT',
    'JOIN_COMMUNITY',
    'COMPLETE_SURVEY',
    // Passive (không tự cày được — chỉ theo dõi)
    'REDEEM_CODE',
    'MAKE_PURCHASE',
];
exports.TASK_META = {
    WATCH_VIDEO: { label: 'Xem video', kind: 'video' },
    WATCH_VIDEO_ON_MOBILE: { label: 'Xem video (mobile)', kind: 'video' },
    WATCH_STREAM: { label: 'Xem stream', kind: 'stream' },
    PLAY_ON_DESKTOP: { label: 'Chơi game trên PC', kind: 'desktop' },
    PLAY_ON_DESKTOP_V2: { label: 'Chơi game trên PC', kind: 'desktop' },
    STREAM_ON_DESKTOP: { label: 'Stream trên PC', kind: 'desktop' },
    PLAY_ON_XBOX: { label: 'Chơi trên Xbox', kind: 'console' },
    PLAY_ON_PLAYSTATION: { label: 'Chơi trên PlayStation', kind: 'console' },
    PLAY_ON_NINTENDO: { label: 'Chơi trên Nintendo', kind: 'console' },
    PLAY_ON_MOBILE: { label: 'Chơi trên mobile', kind: 'mobile' },
    PLAY_SOCIAL_GAME: { label: 'Chơi game social', kind: 'mobile' },
    PLAY_ACTIVITY: { label: 'Hoạt động voice/activity', kind: 'activity' },
    ACHIEVEMENT_IN_ACTIVITY: { label: 'Thành tựu trong activity', kind: 'activity' },
    ACHIEVEMENT_IN_GAME: { label: 'Thành tựu trong game', kind: 'activity' },
    FOLLOW_SOCIAL: { label: 'Theo dõi mạng xã hội', kind: 'social' },
    SHARE_CONTENT: { label: 'Chia sẻ nội dung', kind: 'social' },
    JOIN_COMMUNITY: { label: 'Tham gia cộng đồng', kind: 'social' },
    COMPLETE_SURVEY: { label: 'Hoàn thành khảo sát', kind: 'passive' },
    REDEEM_CODE: { label: 'Nhập mã quà', kind: 'passive' },
    MAKE_PURCHASE: { label: 'Mua hàng trong game', kind: 'passive' },
};
/** Lấy nhãn tiếng Việt của loại nhiệm vụ. */
function taskLabelOf(taskName) {
    if (!taskName)
        return 'Không xác định';
    return exports.TASK_META[taskName]?.label ?? taskName;
}
/** Lấy nhóm (kind) của loại nhiệm vụ — quyết định endpoint sẽ gọi. */
function taskKindOf(taskName) {
    if (!taskName)
        return 'unknown';
    return exports.TASK_META[taskName]?.kind ?? 'unknown';
}
/** Kind có tự cày được bằng API không (passive = chỉ theo dõi, unknown = bó tay). */
function isAutomatableKind(kind) {
    return kind !== 'passive' && kind !== 'unknown';
}
/**
 * Chọn event_name của quest theo thứ tự ưu tiên.
 * `tasks` là object gộp từ task_config_v2.tasks (fallback task_config.tasks).
 */
function pickTaskName(tasks) {
    if (!tasks)
        return null;
    for (const name of exports.TASK_PRIORITY) {
        if (tasks[name] != null)
            return name;
    }
    // Quest lạ: vẫn lấy key đầu tiên để không bỏ sót hoàn toàn.
    const firstKey = Object.keys(tasks)[0];
    return firstKey ?? null;
}

};

__factories["src/utils.js"] = function (require, module, exports, env, process, Buffer, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, URLSearchParams, Headers, fetch, AbortController, TextEncoder, btoa, atob) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const constants_1 = require("./constants");
const undici_1 = require("undici");
const security_1 = require("./security");
class Utils extends null {
    static makeHeaders(init) {
        let myHeaders = new Headers(init);
        const isAndroidRequest = myHeaders.get('AndroidRequest') === 'true';
        myHeaders.delete('AndroidRequest');
        myHeaders.set('Authorization', myHeaders.get('Authorization').replace('Bot ', ''));
        myHeaders.append('accept-language', 'en-US');
        myHeaders.append('x-debug-options', 'bugReporterEnabled');
        myHeaders.append('x-discord-locale', 'en-US');
        myHeaders.append('x-discord-timezone', 'Asia/Saigon');
        if (isAndroidRequest) {
            myHeaders = Utils.mergeHeaders(myHeaders, Utils.makeAndroidHeaders(true));
        }
        else {
            myHeaders = Utils.mergeHeaders(myHeaders, Utils.makeDesktopHeaders(true, true));
        }
        return myHeaders;
    }
    static makeDesktopHeaders(withDiscordClientProperties = true, withOriginAndReferer = true) {
        const myHeaders = new Headers();
        myHeaders.append('accept-language', 'vi');
        myHeaders.append('User-Agent', constants_1.Constants.USER_AGENT);
        if (withOriginAndReferer) {
            myHeaders.append('origin', 'https://discord.com');
            myHeaders.append('referer', 'https://discord.com/channels/@me');
        }
        myHeaders.append('pragma', 'no-cache');
        myHeaders.append('priority', 'u=1, i');
        myHeaders.append('sec-ch-ua', '"Not)A;Brand";v="8", "Chromium";v="138"');
        myHeaders.append('sec-ch-ua-mobile', '?0');
        myHeaders.append('sec-ch-ua-platform', '"Windows"');
        myHeaders.append('sec-fetch-dest', 'empty');
        myHeaders.append('sec-fetch-mode', 'cors');
        myHeaders.append('sec-fetch-site', 'same-origin');
        if (withDiscordClientProperties) {
            myHeaders.append('x-super-properties', Buffer.from(JSON.stringify(constants_1.Constants.Properties)).toString('base64'));
        }
        return myHeaders;
    }
    static makeAndroidHeaders(withDiscordClientProperties = true) {
        const myHeaders = new Headers();
        myHeaders.append('accept-language', 'vi');
        myHeaders.append('User-Agent', constants_1.Constants.ANDROID_USER_AGENT);
        if (withDiscordClientProperties) {
            myHeaders.append('x-super-properties', Buffer.from(JSON.stringify(constants_1.Constants.ANDROID_Properties)).toString('base64'));
        }
        return myHeaders;
    }
    static mergeHeaders(a, b) {
        const result = new Headers(a);
        b.forEach((value, key) => {
            result.set(key, value);
        });
        return result;
    }
    static async getProxyTicket(applicationId, client) {
        const ticket = (await client.rest.post(`/applications/${applicationId}/proxy-tickets`, {
            body: {},
        }));
        return ticket.ticket;
    }
    static async getActivityReferrer(applicationId, client) {
        const proxyTicket = await Utils.getProxyTicket(applicationId, client);
        const referrerUrl = `https://${applicationId}.discordsays.com/`;
        security_1.SecurityGuard.assertSafeUrl(referrerUrl);
        const referrer = new URL(referrerUrl);
        referrer.searchParams.set('instance_id', 'example-cl-instance');
        referrer.searchParams.set('platform', 'desktop');
        referrer.searchParams.set('discord_proxy_ticket', proxyTicket);
        return referrer.toString();
    }
    static getActivityHeaders(questId, authToken = '', activityReferrer) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken,
            'X-Discord-Quest-ID': questId,
        };
        if (activityReferrer) {
            headers.Referer = activityReferrer;
        }
        return headers;
    }
    static async authorizeDiscordSays(applicationId, questId, authCode, client) {
        let error = null;
        const headers = Utils.makeDesktopHeaders(false, false);
        const activityReferrer = await Utils.getActivityReferrer(applicationId, client);
        const discordSaysHeaders = Utils.getActivityHeaders(questId, '', activityReferrer);
        for (const [key, value] of Object.entries(discordSaysHeaders)) {
            headers.append(key, value);
        }
        const targetUrl = `https://${applicationId}.discordsays.com/.proxy/acf/authorize`;
        security_1.SecurityGuard.assertSafeUrl(targetUrl);
        const token = await (0, undici_1.fetch)(targetUrl, {
            body: JSON.stringify({ code: authCode }),
            method: 'POST',
            headers,
        })
            .then((res) => res.json())
            .then((data) => data.token)
            .catch((e) => {
            console.error('Lỗi xác thực với Discord Says:', e);
            error = e instanceof Error ? e.message : String(e);
            return '';
        });
        return { token, error, activityReferrer };
    }
    static async progressDiscordSays(applicationId, questId, token, questTarget, activityReferrer) {
        let error = null;
        const headers = Utils.makeDesktopHeaders(false, false);
        const discordSaysHeaders = Utils.getActivityHeaders(questId, token, activityReferrer);
        for (const [key, value] of Object.entries(discordSaysHeaders)) {
            headers.append(key, value);
        }
        const targetUrl = `https://${applicationId}.discordsays.com/.proxy/acf/quest/progress`;
        security_1.SecurityGuard.assertSafeUrl(targetUrl);
        const success = await (0, undici_1.fetch)(targetUrl, {
            headers,
            body: JSON.stringify({ progress: questTarget }),
            method: 'POST',
        })
            .then((res) => res.ok)
            .catch((e) => {
            error = e instanceof Error ? e.message : String(e);
            return false;
        });
        return { success, error };
    }
    static async updateLatestBuildVersion() {
        try {
            const appUrl = 'https://discord.com/app';
            security_1.SecurityGuard.assertSafeUrl(appUrl);
            const response = await (0, undici_1.fetch)(appUrl, {
                headers: { 'User-Agent': constants_1.Constants.USER_AGENT },
            });
            if (!response.ok) {
                return;
            }
            const html = await response.text();
            let scripts = Array.from(html.match(/\/assets\/web.([a-f0-9]+)\.js/g) || []);
            if (!scripts || scripts.length === 0) {
                return;
            }
            for (const scriptPath of scripts) {
                try {
                    const assetUrl = `https://discord.com${scriptPath}`;
                    security_1.SecurityGuard.assertSafeUrl(assetUrl);
                    const assetResponse = await (0, undici_1.fetch)(assetUrl, {
                        headers: { 'User-Agent': constants_1.Constants.USER_AGENT },
                    });
                    if (!assetResponse.ok)
                        continue;
                    const jsContent = await assetResponse.text();
                    const match = jsContent.match(/buildNumber["\s:]+["\s]*(\d{5,7})/);
                    if (match) {
                        const buildNumber = parseInt(match[1], 10);
                        constants_1.Constants.Properties.client_build_number = buildNumber;
                        console.log(`[Hệ thống] Cập nhật Discord Build Number mới nhất: ${buildNumber}`);
                        return;
                    }
                }
                catch {
                    continue;
                }
            }
        }
        catch {
            // Giữ build number mặc định an toàn
        }
    }
}
exports.Utils = Utils;

};

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
				var wait = Number(out.data && out.data.retry_after);
				if (!isFinite(wait) || wait < 0) wait = 2;
				wait = Math.min(wait, 5);
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
	if (!/\.js$/.test(id)) id += '.js';
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
				var lines = text.split('\n');
				for (var i = 0; i < lines.length; i++) {
					var line = lines[i].replace(/\u0007/g, '').replace(/\s+$/, '');
					if (!line) continue;
					var marker = line.indexOf('\u0001AQEVENT\u0001');
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
