"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestManager = void 0;
const events_1 = require("./events");
const quest_1 = require("./quest");
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
            console.log(`🔍 Tìm thấy ${response.excluded_quests.length} nhiệm vụ phụ/bổ sung. Đang nạp chi tiết để không xót nhiệm vụ...`);
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
            console.log(`  + Đã nạp thành công nhiệm vụ bổ sung: "${quest.config.messages.quest_name}".`);
            this.quests.set(quest.id, quest);
        }
        catch (err) {
            console.warn(`  ! Không thể lấy chi tiết nhiệm vụ bổ sung "${questId}": ${err.message}`);
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
    /** Id ổn định của quest — dùng làm khóa dedupe trên UI. */
    static getQuestId(quest) {
        try {
            return String(quest.id ?? quest.raw?.id ?? '');
        }
        catch {
            return '';
        }
    }
    /** Nhận thưởng công khai (bot.ts gọi trực tiếp thay vì đụng redeemQuest private flow). */
    claimReward(quest) {
        return this.redeemQuest(quest);
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
            return;
        }
        const name = quest.config.messages.quest_name;
        const orbs = QuestManager.getQuestOrbs(quest);
        const rewardName = QuestManager.getQuestRewardName(quest);
        try {
            const platform = quest.raw.config.rewards_config?.platforms?.[0] ?? 0;
            const res = (await this.client.rest.post(`/quests/${quest.id}/claim-reward`, {
                body: {
                    platform,
                    location: 11,
                    is_targeted: false,
                    metadata_raw: null,
                    metadata_sealed: null,
                    traffic_metadata_raw: quest.raw.traffic_metadata_raw,
                    traffic_metadata_sealed: quest.raw.traffic_metadata_sealed,
                },
            }));
            console.log(`🎁 ĐÃ NHẬN THƯỞNG: "${name}" -> Nhận: ${rewardName}!`);
            quest.updateUserStatus(res);
            (0, events_1.report)('quest:done', { id: QuestManager.getQuestId(quest), name, orbs, rewardName });
        }
        catch (err) {
            const message = err?.message || String(err);
            const rawError = err?.rawError || {};
            if (rawError.captcha_key ||
                message.includes('No Description') ||
                message.toLowerCase().includes('captcha')) {
                console.log(`✅ Nhiệm vụ "${name}" đã hoàn thành 100%! (Discord yêu cầu captcha khi nhận thưởng: bạn mở Kho quà trên Discord bấm Nhận nhé).`);
                (0, events_1.report)('quest:done', { id: QuestManager.getQuestId(quest), name, orbs, rewardName, note: 'Yêu cầu mở Kho quà nhận thủ công (Captcha)' });
            }
            else {
                console.warn(`Không thể tự nhận thưởng cho "${name}":`, message);
            }
        }
    }
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
        console.log(`Nhiệm vụ "${questName}" đã sẵn sàng.`);
        const applicationName = quest.config.application.name;
        const taskConfig = quest.config.task_config_v2;
        const taskName = [
            'WATCH_VIDEO',
            'PLAY_ON_DESKTOP',
            'PLAY_ON_XBOX',
            'PLAY_ON_PLAYSTATION',
            'STREAM_ON_DESKTOP',
            'PLAY_ACTIVITY',
            'WATCH_VIDEO_ON_MOBILE',
            'ACHIEVEMENT_IN_ACTIVITY',
        ].find((x) => taskConfig.tasks[x] != null);
        if (!taskName || !taskConfig.tasks[taskName]) {
            console.warn(`Nhiệm vụ "${questName}" không có loại nhiệm vụ tự động tương thích.`);
            (0, events_1.report)('quest:skip', {
                id: QuestManager.getQuestId(quest),
                name: questName,
                reason: 'Cấu hình nhiệm vụ không được hỗ trợ',
            });
            return;
        }
        const secondsNeeded = taskConfig.tasks[taskName].target;
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
        (0, events_1.report)('quest:start', {
            id: questId,
            name: questName,
            task: taskName,
            application: applicationName,
            secondsNeeded,
            secondsDone,
            orbs,
            rewardName,
        });
        switch (taskName) {
            case 'WATCH_VIDEO':
            case 'WATCH_VIDEO_ON_MOBILE': {
                await this.doingWatchVideoQuest(quest, questName, secondsNeeded, secondsDone);
                break;
            }
            case 'PLAY_ON_XBOX':
            case 'PLAY_ON_PLAYSTATION':
            case 'PLAY_ON_DESKTOP': {
                await this.doingPlayOnPlatformQuest(quest, questName, secondsNeeded, taskName, applicationName, heartbeatIntervalS);
                break;
            }
            case 'PLAY_ACTIVITY': {
                await this.doingPlayActivityQuest(quest, questName, secondsNeeded, taskName, applicationName, heartbeatIntervalS);
                break;
            }
            case 'STREAM_ON_DESKTOP': {
                console.log(`[Lưu ý] Nhiệm vụ "${questName}" yêu cầu livestream trong voice channel Discord với bạn bè. Vui lòng mở app Discord để stream màn hình nhé!`);
                (0, events_1.report)('quest:skip', {
                    id: QuestManager.getQuestId(quest),
                    name: questName,
                    reason: 'Yêu cầu Stream trong voice call Discord',
                });
                break;
            }
            case 'ACHIEVEMENT_IN_ACTIVITY': {
                await this.doingAchievementInActivityQuest(quest, questName);
                break;
            }
            default: {
                (0, events_1.report)('quest:skip', {
                    name: questName,
                    reason: 'Loại nhiệm vụ chưa xác định',
                });
            }
        }
    }
    async doingWatchVideoQuest(quest, questName, secondsNeeded, secondsDone) {
        const maxFuture = 10, speed = 7, interval = 7;
        const enrolledAt = new Date(quest.userStatus?.enrolled_at).getTime();
        let completed = false;
        console.log(`▶ Đang giả lập xem video nhiệm vụ: "${questName}" (${secondsNeeded} giây)...`);
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
        console.log(`🎉 ĐÃ HOÀN THÀNH VIDEO: "${questName}"!`);
        (0, events_1.report)('quest:done', {
            id: QuestManager.getQuestId(quest),
            name: questName,
            orbs: QuestManager.getQuestOrbs(quest),
            rewardName: QuestManager.getQuestRewardName(quest),
        });
        await this.redeemQuest(quest);
    }
    async doingPlayOnPlatformQuest(quest, questName, secondsNeeded, taskName, applicationName, heartbeatIntervalS = 20) {
        const interval = heartbeatIntervalS;
        console.log(`🎮 Đang giả lập chơi game "${applicationName}" cho "${questName}" (Thời gian yêu cầu: ${Math.ceil(secondsNeeded / 60)} phút)...`);
        let consecutiveErrors = 0;
        while (!quest.isCompleted()) {
            const secondsDone = quest.userStatus?.progress?.[taskName]?.value || 0;
            try {
                const res = await this.client.rest.post(`/quests/${quest.id}/heartbeat`, {
                    body: {
                        application_id: quest.config.application.id,
                        terminal: false,
                    },
                });
                quest.updateUserStatus(res);
                consecutiveErrors = 0;
                const currentDone = quest.userStatus?.progress?.[taskName]?.value ||
                    secondsDone;
                console.log(`  [Tín hiệu game: ${applicationName}] Tiến độ: ${Math.floor(currentDone / 60)}/${Math.ceil(secondsNeeded / 60)} phút.`);
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
                    console.error(`Dừng nhiệm vụ "${questName}" do mất kết nối tín hiệu liên tục.`);
                    (0, events_1.report)('quest:error', {
                        name: questName,
                        message: `Mất tín hiệu liên tục: ${msg}`,
                    });
                    return;
                }
            }
            await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        }
        try {
            const res = await this.client.rest.post(`/quests/${quest.id}/heartbeat`, {
                body: {
                    application_id: quest.config.application.id,
                    terminal: true,
                },
            });
            quest.updateUserStatus(res);
        }
        catch {
            /* ignore terminal heartbeat error */
        }
        console.log(`🎉 ĐÃ HOÀN THÀNH NHIỆM VỤ GAME: "${questName}"!`);
        (0, events_1.report)('quest:done', {
            id: QuestManager.getQuestId(quest),
            name: questName,
            orbs: QuestManager.getQuestOrbs(quest),
            rewardName: QuestManager.getQuestRewardName(quest),
        });
        await this.redeemQuest(quest);
    }
    async doingPlayActivityQuest(quest, questName, secondsNeeded, taskName, applicationName, heartbeatIntervalS = 20) {
        const interval = heartbeatIntervalS;
        const streamKey = 'call:1:1';
        console.log(`🎯 Đang giả lập hoạt động voice/activity "${applicationName}" cho "${questName}" (${Math.ceil(secondsNeeded / 60)} phút)...`);
        let consecutiveErrors = 0;
        while (!quest.isCompleted()) {
            const secondsDone = quest.userStatus?.progress?.[taskName]?.value || 0;
            try {
                const res = await this.client.rest.post(`/quests/${quest.id}/heartbeat`, {
                    body: { stream_key: streamKey, terminal: false },
                });
                quest.updateUserStatus(res);
                consecutiveErrors = 0;
                const currentDone = quest.userStatus?.progress?.[taskName]?.value ||
                    secondsDone;
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
                    console.error(`Dừng hoạt động "${questName}" do lỗi liên tục quá 5 lần.`);
                    (0, events_1.report)('quest:error', {
                        name: questName,
                        message: `Lỗi tín hiệu liên tục: ${msg}`,
                    });
                    return;
                }
            }
            await new Promise((resolve) => setTimeout(resolve, interval * 1000));
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
        console.log(`🎉 ĐÃ HOÀN THÀNH HOẠT ĐỘNG: "${questName}"!`);
        (0, events_1.report)('quest:done', {
            id: QuestManager.getQuestId(quest),
            name: questName,
            orbs: QuestManager.getQuestOrbs(quest),
            rewardName: QuestManager.getQuestRewardName(quest),
        });
        await this.redeemQuest(quest);
    }
    async doingAchievementInActivityQuest(quest, questName) {
        const applicationId = quest.config.application.id;
        const applicationName = quest.config.application.name;
        const questTarget = quest.config.task_config_v2.tasks.ACHIEVEMENT_IN_ACTIVITY.target;
        console.log(`🏆 Đang xử lý thành tựu ứng dụng: "${applicationName}" cho "${questName}"...`);
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
        console.log(`🎉 ĐÃ HOÀN THÀNH THÀNH TỰU: "${questName}"!`);
        (0, events_1.report)('quest:done', {
            id: QuestManager.getQuestId(quest),
            name: questName,
            orbs: QuestManager.getQuestOrbs(quest),
            rewardName: QuestManager.getQuestRewardName(quest),
        });
        await this.redeemQuest(quest);
    }
}
exports.QuestManager = QuestManager;
