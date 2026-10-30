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
            // Waves#157: parallel excluded fetch, cap 4 per batch.
            const pending = response.excluded_quests.filter((quest) => quest.id && !questManager.hasQuest(quest.id));
            for (let i = 0; i < pending.length; i += 4) {
                await Promise.all(pending.slice(i, i + 4).map((quest) => questManager.addExcludedQuest(quest.id)));
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
            const usable = (tasks) => !!tasks && typeof tasks === 'object' && Object.values(tasks).some((e) => e != null && (typeof e !== 'object' || Object.keys(e).length > 0));
            if (usable(v2))
                return v2;
            if (usable(v1))
                return v1;
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
        // Waves#144: chỉ áp dụng fallback này cho đúng task stream
        // (WATCH_STREAM / STREAM_ON_DESKTOP) — task khác mà lấy
        // stream_progress_seconds thì tiến độ hiển thị sẽ là của task khác.
        if (name === 'WATCH_STREAM' || name === 'STREAM_ON_DESKTOP') {
            const sps = Number(quest.userStatus?.stream_progress_seconds);
            if (Number.isFinite(sps) && sps > 0)
                return sps;
        }
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
    // Waves#153 — defensive code-field scan (session memory only).
    // No code field is confirmed in this codebase's Discord payloads.
    // Scans a small whitelist (top level + one level of metadata/details)
    // and returns value + field name; never logs the value. Empty when
    // nothing matches, so the UI shows the Discord link, not a fake code.
    static extractRewardCode(reward) {
        const KEYS = ['code', 'redeem_code', 'reward_code', 'external_code', 'gift_code', 'voucher_code', 'promo_code', 'promotion_code', 'redemption_code', 'key'];
        const ok = (v) => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9\-_]{3,127}$/.test(v.trim());
        const scan = (obj) => {
            if (!obj || typeof obj !== 'object')
                return null;
            for (const k of KEYS) {
                if (ok(obj[k]))
                    return { code: String(obj[k]).trim(), source: k };
            }
            for (const nest of ['metadata', 'details', 'data']) {
                const inner = obj[nest];
                if (inner && typeof inner === 'object') {
                    for (const k of KEYS) {
                        if (ok(inner[k]))
                            return { code: String(inner[k]).trim(), source: `${nest}.${k}` };
                    }
                }
            }
            return null;
        };
        if (!reward)
            return { code: '', source: '' };
        return scan(reward) || { code: '', source: '' };
    }
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
        const codeFound = QuestManager.extractRewardCode(itemReward);
        const rewardType = codeFound.code ? 'code' : orbCount > 0 ? 'orbs' : itemReward ? 'avatar' : 'other';
        return {
            hero: pick(assets?.hero, assets?.quest_bar_hero, assets?.hero_video),
            heroVideo: pick(assets?.hero_video) || null,
            gameTile: pick(assets?.game_tile_dark, assets?.game_tile_light, assets?.game_tile),
            gameTileDark: pick(assets?.game_tile_dark),
            gameTileLight: pick(assets?.game_tile_light),
            logotype: pick(assets?.logotype_dark, assets?.logotype_light, assets?.logotype),
            logotypeDark: pick(assets?.logotype_dark),
            logotypeLight: pick(assets?.logotype_light),
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
            rewardType,
            rewardCode: codeFound.code,
            rewardCodeSource: codeFound.source,
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
            // Waves#135 — unified claim truth (see engine-src): 2xx without
            // claimed_at is not confirmed. Report confirmed:false, return false.
            if (!claimedAt) {
                console.warn(`[Cảnh báo] Discord trả 2xx cho "${name}" nhưng chưa thấy claimed_at — chưa tính là đã nhận, sẽ xác nhận lại khi quét.`);
                (0, events_1.report)('quest:claim', {
                    id: QuestManager.getQuestId(quest),
                    name,
                    orbs,
                    rewardName,
                    confirmed: false,
                });
                return false;
            }
            console.log(`ĐÃ NHẬN THƯỞNG: "${name}" -> Nhận: ${rewardName}!`);
            (0, events_1.report)('quest:claim', {
                id: QuestManager.getQuestId(quest),
                name,
                orbs,
                rewardName,
                confirmed: true,
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
        // Waves#136 — strict captcha classification: message text alone
        // (including "captcha" or "No Description") NEVER classifies an
        // error as captcha. Only structured captcha fields do.
        const sitekey136 = captchaData?.captcha_sitekey || rawError?.captcha_sitekey || '';
        const sessionId136 = captchaData?.captcha_session_id || rawError?.captcha_session_id || '';
        const hasCaptchaPayload136 =
            !!captchaData?.captcha_key || !!captchaData?.captcha_rqdata || !!captchaData?.captcha_rqtoken ||
            !!rawError?.captcha_key || !!rawError?.captcha_rqdata || !!rawError?.captcha_rqtoken;
        const isCaptcha = !!sitekey136 || (!!sessionId136 && hasCaptchaPayload136);
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
            // Waves#136 — structured captcha fields exist but no sitekey:
            // per-quest BLOCKED state, never a normal "done" event.
            console.log(`Nhiệm vụ "${name}" bị chặn xác minh: Discord yêu cầu xác minh nhưng không kèm sitekey.`);
            (0, events_1.report)('quest:blocked', {
                id: QuestManager.getQuestId(quest),
                name,
                orbs,
                rewardName,
                reason: 'Discord yêu cầu xác minh nhưng không cấp sitekey — mở Discord để nhận thủ công.',
                captcha,
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
        // Waves#138 — video loop guard (mirrors engine-src): fail fast on
        // missing/invalid/far-future enrolled_at instead of looping silently.
        if (!Number.isFinite(enrolledAt)) {
            this.failQuest(quest, questName, 'Không xác định được thời điểm nhận nhiệm vụ (enrolled_at thiếu hoặc không hợp lệ) — không thể tính tiến độ video.');
            return;
        }
        if (enrolledAt > Date.now() + 60000) {
            this.failQuest(quest, questName, 'Thời điểm nhận nhiệm vụ (enrolled_at) ở tương lai — không thể tính tiến độ video, hãy quét lại.');
            return;
        }
        console.log(`Đang giả lập xem video nhiệm vụ: "${questName}" (${secondsNeeded} giây)...`);
        let videoIterations = 0;
        const maxVideoIterations = Math.ceil(Math.max(secondsNeeded, 0) / speed) + 600;
        let lastMilestone = -1; // Waves#187: milestone logging only, no per-tick spam.
        let stallIterations = 0;
        const maxStallIterations = 60;
        while (true) {
            videoIterations++;
            if (videoIterations > maxVideoIterations) {
                this.failQuest(quest, questName, 'Hết thời gian chờ tiến độ video — vòng lặp đã vượt giới hạn an toàn mà chưa hoàn thành.');
                return;
            }
            const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
            const diff = maxAllowed - secondsDone;
            const timestamp = secondsDone + speed;
            if (diff < speed) {
                stallIterations++;
                if (stallIterations >= maxStallIterations) {
                    this.failQuest(quest, questName, 'Tiến độ video không tăng trong 420 giây — có thể enrolled_at hoặc giới hạn thời gian của Discord không khớp, đã dừng thay vì treo im.');
                    return;
                }
            } else {
                stallIterations = 0;
            }
            if (diff >= speed) {
                const res = (await this.client.rest.post(`/quests/${quest.id}/video-progress`, {
                    body: {
                        timestamp: Math.min(secondsNeeded, timestamp + Math.random()),
                    },
                }));
                completed = res.completed_at != null;
                quest.updateUserStatus(res);
                secondsDone = Math.min(secondsNeeded, timestamp);
                /* Waves#187: log milestones 25/50/75/100% only. Stop during
                   a video quest already terminates the worker cleanly
                   (bridge stopEngine); no in-loop flag is needed here. */
                const pct = secondsNeeded > 0 ? Math.floor((secondsDone / secondsNeeded) * 100) : 0;
                const mile = pct >= 100 ? 100 : pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : -1;
                if (mile !== lastMilestone && mile >= 0) { lastMilestone = mile; console.log(`Video "${questName}": ${mile}% (${secondsDone}/${secondsNeeded}s)`); }
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
