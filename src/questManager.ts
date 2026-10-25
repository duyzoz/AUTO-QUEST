import { APIApplication } from 'discord-api-types/v10';
import { randomUUID } from 'node:crypto';
import { ClientQuest } from './client';
import { report } from './events';
import type { AllQuestsResponse, QuestTaskConfigType } from './interface';
import { Quest } from './quest';
import { isAutomatableKind, pickTaskName, taskKindOf, taskLabelOf } from './taskTypes';
import { Utils } from './utils';

export class QuestManager implements Iterable<Quest> {
	private readonly quests = new Map<string, Quest>();
	public readonly client: ClientQuest;

	constructor(client: ClientQuest, quests: Quest[] = []) {
		this.client = client;
		quests.forEach((quest) => this.quests.set(quest.id, quest));
	}

	static async fromResponse(
		client: ClientQuest,
		response: AllQuestsResponse,
		fetchExcludedQuests = true,
	): Promise<QuestManager> {
		if (response.quest_enrollment_blocked_until !== null) {
			console.warn(
				`[Thông báo] Việc nhận nhiệm vụ bị tạm khóa đến: ${response.quest_enrollment_blocked_until}.`,
			);
		}

		const questManager = new QuestManager(
			client,
			response.quests.map((quest) => Quest.create(quest)),
		);

		// Quét toàn bộ nhiệm vụ phụ / excluded_quests để không xót bất kỳ nhiệm vụ nào
		if (fetchExcludedQuests && Array.isArray(response.excluded_quests) && response.excluded_quests.length > 0) {
			console.log(
				`Tìm thấy ${response.excluded_quests.length} nhiệm vụ phụ/bổ sung. Đang nạp chi tiết để không xót nhiệm vụ...`,
			);
			for (const quest of response.excluded_quests) {
				if (quest.id && !questManager.hasQuest(quest.id)) {
					await questManager.addExcludedQuest(quest.id);
				}
			}
		}

		return questManager;
	}

	protected async addExcludedQuest(questId: string) {
		try {
			const response = await this.client.rest.get(`/quests/${questId}`);
			const quest = Quest.create({
				id: questId,
				config: response as any,
				user_status: null,
				targeted_content: 0,
				preview: false,
			});
			console.log(
				`Đã nạp thành công nhiệm vụ bổ sung: "${quest.config.messages.quest_name}".`,
			);
			this.quests.set(quest.id, quest);
		} catch (err: any) {
			console.warn(
				`KHONG THE lay chi tiet nhiem vu bo sung "${questId}": ${err.message}`,
			);
		}
	}

	[Symbol.iterator](): IterableIterator<Quest> {
		return this.quests.values();
	}

	get size(): number {
		return this.quests.size;
	}

	list(): Quest[] {
		return Array.from(this.quests.values());
	}

	get(id: string): Quest | undefined {
		return this.quests.get(id);
	}

	upsert(quest: Quest): void {
		this.quests.set(quest.id, quest);
	}

	remove(id: string): boolean {
		return this.quests.delete(id);
	}

	clear(): void {
		this.quests.clear();
	}

	getExpired(date: Date = new Date()): Quest[] {
		return this.list().filter((quest) => quest.isExpired(date));
	}

	getCompleted(): Quest[] {
		return this.list().filter((quest) => quest.isCompleted());
	}

	getClaimable(): Quest[] {
		return this.list().filter(
			(quest) => quest.isCompleted() && !quest.hasClaimedRewards(),
		);
	}

	hasQuest(id: string): boolean {
		return this.quests.has(id);
	}

	filterQuestsValidToDo(reference: Date = new Date()) {
		return this.list().filter(
			(quest) =>
				!quest.isCompleted() &&
				!quest.isExpired(reference) &&
				quest.isStarted(reference) &&
				!quest.preview,
		);
	}

	filterQuestsValidToRedeem(
		allowed?: (quest: Quest) => boolean,
	): Quest[] {
		return this.list().filter(
			(quest) =>
				quest.isCompleted() &&
				!quest.hasClaimedRewards() &&
				(!allowed || allowed(quest)),
		);
	}

	/**
	 * Id ổn định của quest — dùng làm khóa dedupe trên UI.
	 */
	public static getQuestId(quest: Quest): string {
		try {
			return String(quest.id ?? quest.raw?.id ?? '');
		} catch {
			return '';
		}
	}

	/**
	 * Waves 20: gộp tasks từ task_config_v2 (mới) và task_config (cũ).
	 * Nhiều quest chỉ trả một trong hai → thiếu fallback là bỏ sót quest.
	 */
	public static getTasks(quest: Quest): Record<string, any> | null {
		try {
			const cfg = quest.raw?.config as any;
			const v2 = cfg?.task_config_v2?.tasks;
			const v1 = cfg?.task_config?.tasks;
			if (v2 && typeof v2 === 'object') return v2 as Record<string, any>;
			if (v1 && typeof v1 === 'object') return v1 as Record<string, any>;
			return null;
		} catch {
			return null;
		}
	}

	/** Chọn event_name của nhiệm vụ theo thứ tự ưu tiên (null = không xác định). */
	public static resolveTaskName(quest: Quest): string | null {
		return pickTaskName(QuestManager.getTasks(quest));
	}

	/** Nhãn tiếng Việt của loại nhiệm vụ. */
	public static getTaskLabel(quest: Quest): string {
		return taskLabelOf(QuestManager.resolveTaskName(quest));
	}

	/** Nhóm nhiệm vụ (video/desktop/console/mobile/stream/activity/social/passive). */
	public static getTaskKind(quest: Quest): string {
		return taskKindOf(QuestManager.resolveTaskName(quest));
	}

	/** Có tự cày được bằng API không. */
	public static isAutomatable(quest: Quest): boolean {
		return isAutomatableKind(taskKindOf(QuestManager.resolveTaskName(quest)) as any);
	}

	/**
	 * Số giây/điểm cần đạt của nhiệm vụ.
	 * Đọc từ đúng task đã chọn (không đoán), fallback 900 như Discord client.
	 */
	public static getTaskTarget(quest: Quest, taskName?: string | null): number {
		const name = taskName ?? QuestManager.resolveTaskName(quest);
		if (!name) return 900;
		try {
			const tasks = QuestManager.getTasks(quest);
			const target = Number((tasks as any)?.[name]?.target);
			if (Number.isFinite(target) && target > 0) return target;
		} catch {
			/* ignore */
		}
		return 900;
	}

	/** Tiến độ hiện tại của nhiệm vụ (giây/điểm). */
	public static getTaskProgress(quest: Quest, taskName?: string | null): number {
		const name = taskName ?? QuestManager.resolveTaskName(quest);
		if (!name) return 0;
		const value = Number(quest.userStatus?.progress?.[name]?.value);
		if (Number.isFinite(value) && value > 0) return value;

		// Waves 41 (học từ repo discord-quest-helper / discord_api.rs):
		// Discord KHÔNG phải lúc nào cũng trả `user_status.progress` (một số quest
		// chỉ trả `stream_progress_seconds`). Nếu progress rỗng, đọc thẳng
		// `stream_progress_seconds` để tiến độ "Chưa làm" KHÔNG bị hiển thị 0% sai.
		const sps = Number(quest.userStatus?.stream_progress_seconds);
		if (Number.isFinite(sps) && sps > 0) return sps;

		return 0;
	}

	/**
	 * application_id để gửi heartbeat.
	 * Ưu tiên app khai trong task (game đích), fallback app của quest.
	 */
	public static getTaskApplicationId(quest: Quest, taskName?: string | null): string {
		const name = taskName ?? QuestManager.resolveTaskName(quest);
		try {
			const tasks = QuestManager.getTasks(quest);
			const fromTask = (tasks as any)?.[name as string]?.applications?.[0]?.id;
			if (fromTask) return String(fromTask);
		} catch {
			/* ignore */
		}
		return String(quest.config?.application?.id ?? '');
	}

	/** Nhận thưởng công khai (bot.ts gọi trực tiếp thay vì đụng redeemQuest private flow). */
	public claimReward(quest: Quest): Promise<void> {
		return this.redeemQuest(quest);
	}

	/**
	 * Waves 20: SỐ DƯ ORB THẬT từ ví Discord.
	 * GET /users/@me/virtual-currency/balance → { balance }
	 * Đây là con số Discord hiển thị trong Kho quà — chính xác tuyệt đối,
	 * không phải suy ra từ danh sách quest đã claim như cách cũ.
	 * Trả về null nếu endpoint lỗi/không tồn tại (caller tự fallback).
	 */
	async fetchWalletBalance(): Promise<number | null> {
		try {
			const res = (await this.client.rest.get(
				'/users/@me/virtual-currency/balance',
			)) as { balance?: number };
			if (typeof res?.balance === 'number' && Number.isFinite(res.balance)) {
				return res.balance;
			}
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Waves 20: Tự nhận thưởng cho MỌI quest đã hoàn thành nhưng chưa claim.
	 * Chạy ở pha "startup" (giống source tham khảo) — chỉ claim thưởng đã kiếm được,
	 * KHÔNG nhận nhiệm vụ mới, nên không đụng quy tắc "không tự enroll".
	 */
	async claimAllClaimable(): Promise<{ attempted: number; orbs: number }> {
		const list = this.getClaimable().filter((q) => !q.preview);
		let attempted = 0;
		let orbs = 0;
		for (const quest of list) {
			try {
				await this.redeemQuest(quest);
				attempted++;
				orbs += QuestManager.getQuestOrbs(quest);
			} catch {
				/* redeemQuest đã tự bắt lỗi */
			}
		}
		if (attempted > 0) {
			report('quest:claim', { count: attempted, orbs });
		}
		return { attempted, orbs };
	}

	/**
	 * Trích xuất số lượng Orb Discord từ cấu hình phần thưởng của quest
	 */
	public static getQuestOrbs(quest: Quest): number {
		try {
			const rewards = quest.raw.config.rewards_config?.rewards;
			if (!Array.isArray(rewards)) return 0;
			let totalOrbs = 0;
			for (const r of rewards) {
				if (typeof r.orb_quantity === 'number') {
					totalOrbs += r.orb_quantity;
				}
			}
			return totalOrbs;
		} catch {
			return 0;
		}
	}

	/**
	 * Lấy tên phần thưởng tiêu biểu của quest (Orb, Nitro, hoặc tên vật phẩm)
	 */
	public static getQuestRewardName(quest: Quest): string {
		try {
			const rewards = quest.raw.config.rewards_config?.rewards;
			if (!Array.isArray(rewards) || rewards.length === 0) return 'Phần thưởng Discord';
			const orbs = QuestManager.getQuestOrbs(quest);
			if (orbs > 0) {
				return `${orbs} Discord Orbs`;
			}
			const first = rewards[0];
			if (first.messages?.name) {
				return first.messages.name;
			}
			return 'Phần thưởng Discord';
		} catch {
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
	public static getQuestCardData(quest: Quest): {
		hero: string;
		heroVideo: string | null;
		gameTile: string;
		logotype: string;
		publisher: string;
		gameTitle: string;
		appId: string;
		appIcon: string;
		expiresAt: string | null;
		colorPrimary: string;
		colorSecondary: string;
		rewardKind: 'orbs' | 'item';
		rewardTitle: string;
		rewardAsset: string;
		rewardIsVideo: boolean;
		rewardName: string;
		platform: number;
		orbs: number;
		claimedAt: string | null;
	} {
		const cfg = quest.config;
		const assets = cfg?.assets;
		const messages = cfg?.messages;
		const rewards = cfg?.rewards_config?.rewards;
		const list = Array.isArray(rewards) ? rewards : [];

		const orbReward = list.find(
			(r) => typeof r.orb_quantity === 'number' && (r.orb_quantity ?? 0) > 0,
		);
		const itemReward = list.find((r) => !(typeof r.orb_quantity === 'number' && (r.orb_quantity ?? 0) > 0));

		const orbCount = QuestManager.getQuestOrbs(quest);
		const itemName =
			itemReward?.messages?.name_with_article || itemReward?.messages?.name || 'phần thưởng Discord';

		// Waves 23: ưu tiên biến thể _dark vì UI của app là theme tối (Discord đặt tên theo
		// theme ĐÍCH: logotype_dark = bản dành cho nền tối, tức là chữ sáng). Bỏ qua
		// "PLACEHOLDER" — đó là giá trị giả Discord trả về khi không có asset.
		const pick = (...vals: Array<string | null | undefined>): string => {
			for (const v of vals) {
				if (typeof v === 'string' && v.trim() && v.trim().toUpperCase() !== 'PLACEHOLDER') return v.trim();
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
		};
	}

	/**
	 * Tổng hợp thống kê Orb của tất cả nhiệm vụ
	 */
	public getOrbsSummary(): { totalOrbs: number; completedOrbs: number; pendingOrbs: number } {
		let totalOrbs = 0;
		let completedOrbs = 0;
		let pendingOrbs = 0;

		for (const q of this.list()) {
			const orbs = QuestManager.getQuestOrbs(q);
			totalOrbs += orbs;
			if (q.isCompleted()) {
				completedOrbs += orbs;
			} else {
				pendingOrbs += orbs;
			}
		}

		return { totalOrbs, completedOrbs, pendingOrbs };
	}

	/**
	 * Đăng ký tham gia một quest
	 */
	acceptQuest(quest: Quest, isAndroid = false): Promise<Quest | undefined> {
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
				q.updateUserStatus(r as any);
				return q;
			})
			.catch((err) => {
				const msg = (err?.message || String(err)).toLowerCase();
				if (
					msg.includes('already enrolled') ||
					msg.includes('already_enrolled') ||
					err?.code === 50035
				) {
					const q = this.get(quest.id) || quest;
					if (q.raw.user_status) {
						q.raw.user_status.enrolled_at =
							q.raw.user_status.enrolled_at || new Date().toISOString();
					} else {
						q.updateUserStatus({
							enrolled_at: new Date().toISOString(),
							completed_at: null,
							claimed_at: null,
							progress: {},
						} as any);
					}
					return q;
				}
				throw err;
			});

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(
				() =>
					reject(
						new Error(
							'Hết thời gian chờ phản hồi đăng ký từ Discord (quá 15 giây).',
						),
					),
				15000,
			);
		});

		return Promise.race([enrollPromise, timeoutPromise]);
	}

	private async timeout(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async redeemQuest(quest: Quest): Promise<void> {
		if (quest.hasClaimedRewards()) {
			return;
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
	private async postClaim(
		quest: Quest,
		captcha?: {
			captcha_key: string;
			captcha_rqdata?: string;
			captcha_rqtoken?: string;
			captcha_session_id?: string;
		},
	): Promise<void> {
		const name = quest.config.messages.quest_name;
		const orbs = QuestManager.getQuestOrbs(quest);
		const rewardName = QuestManager.getQuestRewardName(quest);

		try {
			const platform =
				quest.raw.config.rewards_config?.platforms?.[0] ?? 0;
			const body: Record<string, unknown> = {
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
				if (captcha.captcha_rqdata) body.captcha_rqdata = captcha.captcha_rqdata;
				if (captcha.captcha_rqtoken) body.captcha_rqtoken = captcha.captcha_rqtoken;
				if (captcha.captcha_session_id) body.captcha_session_id = captcha.captcha_session_id;
			}

			const res = (await this.client.rest.post(
				`/quests/${quest.id}/claim-reward`,
				{ body },
			)) as any;

			console.log(
				`ĐÃ NHẬN THƯỞNG: "${name}" -> Nhận: ${rewardName}!`,
			);
			quest.updateUserStatus(res);
			// Nhận thưởng xong → event riêng 'quest:claim' (UI chuyển tab "Đã làm").
			report('quest:claim', {
				id: QuestManager.getQuestId(quest),
				name,
				orbs,
				rewardName,
			});
		} catch (err: any) {
			this.handleClaimError(quest, err, name, orbs, rewardName);
		}
	}

	/**
	 * Phân loại lỗi claim và report cho UI.
	 *  - CAPTCHA: Discord yêu cầu xác minh → gửi `quest:captcha` kèm ĐỦ dữ liệu để
	 *    UI render hCaptcha widget (sitekey + session + rqdata + rqtoken).
	 *  - Lỗi khác: log thật + report `quest:error` (KHÔNG giả vờ thành công).
	 */
	private handleClaimError(
		quest: Quest,
		err: any,
		name: string,
		orbs: number,
		rewardName: string,
	): void {
		const message = err?.message || String(err);
		// @discordjs/rest: DiscordAPIError có .rawError (body JSON Discord trả).
		// Một số phiên bản để ở .body / .data → gộp cả 3 cho chắc.
		const rawError = err?.rawError || err?.body || err?.data || {};
		const captchaData = err?.captcha ?? rawError;

		const isCaptcha =
			!!rawError.captcha_key ||
			!!captchaData?.captcha_sitekey ||
			message.includes('No Description') ||
			message.toLowerCase().includes('captcha');

		if (isCaptcha) {
			// Trích ĐÚNG các trường Discord trả (xem interface CaptchaDataFromRequest).
			const captcha = {
				sitekey:
					captchaData?.captcha_sitekey ||
					rawError?.captcha_sitekey ||
					'',
				service:
					captchaData?.captcha_service ||
					rawError?.captcha_service ||
					'hcaptcha',
				sessionId:
					captchaData?.captcha_session_id ||
					rawError?.captcha_session_id ||
					'',
				rqdata:
					captchaData?.captcha_rqdata ||
					rawError?.captcha_rqdata ||
					'',
				rqtoken:
					captchaData?.captcha_rqtoken ||
					rawError?.captcha_rqtoken ||
					'',
			};

			if (captcha.sitekey) {
				console.log(
					`CAPTCHA: "${name}" cần xác minh người thật (hCaptcha sitekey=${captcha.sitekey.slice(0, 12)}...). Đang mở trình xác minh...`,
				);
				report('quest:captcha', {
					id: QuestManager.getQuestId(quest),
					name,
					orbs,
					rewardName,
					captcha,
				});
				return;
			}

			// Có cờ captcha nhưng Discord không kèm sitekey → báo để mở Kho quà thủ công.
			console.log(
				`Nhiệm vụ "${name}" đã hoàn thành 100% nhưng Discord yêu cầu xác minh (không kèm sitekey).`,
			);
			report('quest:done', {
				id: QuestManager.getQuestId(quest),
				name,
				orbs,
				rewardName,
				note: 'Discord yêu cầu xác minh — mở Kho quà để nhận thủ công',
			});
			return;
		}

		console.warn(`Không thể tự nhận thưởng cho "${name}":`, message);
		report('quest:error', {
			id: QuestManager.getQuestId(quest),
			name,
			orbs,
			rewardName,
			message,
			phase: 'claim',
		});
	}

	/**
	 * Waves 31 — Claim kèm token captcha do user giải (hCaptcha).
	 * Gọi từ UI sau khi user hoàn tất xác minh. Trả kết quả THẬT:
	 *   { ok: true, orbs }            → Discord cấp thưởng thành công
	 *   { ok: false, captchaRequired } → vẫn cần xác minh (token sai/hết hạn)
	 *   { ok: false, message }         → lỗi khác từ server Discord
	 */
	public async claimWithCaptcha(
		questId: string,
		captchaKey: string,
		meta?: {
			captcha_rqdata?: string;
			captcha_rqtoken?: string;
			captcha_session_id?: string;
		},
	): Promise<{ ok: boolean; orbs?: number; message?: string; captchaRequired?: boolean }> {
		const quest = this.quests.get(questId);
		if (!quest) {
			return { ok: false, message: `Không tìm thấy nhiệm vụ ${questId}.` };
		}
		if (!captchaKey || !captchaKey.trim()) {
			return { ok: false, message: 'Token captcha trống.' };
		}

		const name = quest.config.messages.quest_name;
		const orbs = QuestManager.getQuestOrbs(quest);
		const rewardName = QuestManager.getQuestRewardName(quest);

		try {
			await this.postClaim(quest, {
				captcha_key: captchaKey.trim(),
				captcha_rqdata: meta?.captcha_rqdata,
				captcha_rqtoken: meta?.captcha_rqtoken,
				captcha_session_id: meta?.captcha_session_id,
			});
			return { ok: true, orbs };
		} catch (err: any) {
			const rawError = err?.rawError || err?.body || err?.data || {};
			const message = err?.message || String(err);
			const stillCaptcha =
				!!rawError.captcha_key ||
				message.toLowerCase().includes('captcha') ||
				message.includes('No Description');
			if (stillCaptcha) {
				return { ok: false, captchaRequired: true, message };
			}
			report('quest:error', {
				id: questId,
				name,
				orbs,
				rewardName,
				message,
				phase: 'claim-captcha',
			});
			return { ok: false, message };
		}
	}

	/**
	 * Điểm vào thực thi một nhiệm vụ.
	 * Waves 20: phủ ĐỦ mọi loại nhiệm vụ Discord (20 event_name) thay vì 7 loại như trước,
	 * và chọn đúng endpoint theo `kind` thay vì bỏ qua nhiệm vụ không hỗ trợ.
	 */
	async doingQuest(quest: Quest, heartbeatIntervalS = 20) {
		const questName = quest.config.messages.quest_name;
		const orbs = QuestManager.getQuestOrbs(quest);
		const rewardName = QuestManager.getQuestRewardName(quest);
		const questId = QuestManager.getQuestId(quest);

		// QUY TẮC: KHÔNG tự nhận nhiệm vụ. Chỉ cày quest người dùng đã nhận trong Discord.
		if (!quest.isEnrolledQuest()) {
			console.log(
				`⏭ Bỏ qua "${questName}": chưa nhận nhiệm vụ. Hãy mở Discord bấm "Nhận nhiệm vụ" rồi quét lại.`,
			);
			report('quest:skip', {
				id: questId,
				name: questName,
				reason: 'Chưa nhận nhiệm vụ trong Discord (app không tự nhận)',
			});
			return;
		}

		const taskName = QuestManager.resolveTaskName(quest);
		const kind = taskKindOf(taskName);
		const taskLabel = taskLabelOf(taskName);

		if (!taskName || kind === 'unknown') {
			console.warn(
				`Nhiệm vụ "${questName}" không có loại nhiệm vụ tự động tương thích.`,
			);
			report('quest:skip', {
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

		console.log(
			`▶ "${questName}" · ${taskLabel} (${taskName}) · ${orbs} Orbs · ${Math.floor(
				secondsDone,
			)}/${secondsNeeded}`,
		);

		report('quest:start', {
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
				await this.doingWatchVideoQuest(
					quest,
					questName,
					secondsNeeded,
					secondsDone,
				);
				return;
			}
			case 'desktop': {
				await this.doingPlayOnPlatformQuest(
					quest,
					questName,
					secondsNeeded,
					taskName,
					applicationName,
					appId,
					heartbeatIntervalS,
				);
				return;
			}
			case 'console': {
				await this.doingConsoleQuest(
					quest,
					questName,
					secondsNeeded,
					taskName,
					applicationName,
					appId,
					Math.max(heartbeatIntervalS, 60),
				);
				return;
			}
			case 'mobile': {
				await this.doingMobileQuest(
					quest,
					questName,
					secondsNeeded,
					taskName,
					applicationName,
					appId,
				);
				return;
			}
			case 'stream': {
				await this.doingWatchStreamQuest(
					quest,
					questName,
					secondsNeeded,
					secondsDone,
				);
				return;
			}
			case 'activity': {
				if (
					taskName === 'ACHIEVEMENT_IN_ACTIVITY' ||
					taskName === 'ACHIEVEMENT_IN_GAME'
				) {
					await this.doingAchievementInActivityQuest(quest, questName);
				} else {
					await this.doingPlayActivityQuest(
						quest,
						questName,
						secondsNeeded,
						taskName,
						applicationName,
						heartbeatIntervalS,
					);
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
				report('quest:skip', {
					id: questId,
					name: questName,
					reason: 'Loại nhiệm vụ chưa xác định',
				});
			}
		}
	}

	/** Báo hoàn thành + tự nhận thưởng — dùng chung cho mọi loại nhiệm vụ. */
	private async finishQuest(quest: Quest, questName: string) {
		console.log(`ĐÃ HOÀN THÀNH NHIỆM VỤ: "${questName}"!`);
		report('quest:done', {
			id: QuestManager.getQuestId(quest),
			name: questName,
			orbs: QuestManager.getQuestOrbs(quest),
			rewardName: QuestManager.getQuestRewardName(quest),
		});
		await this.redeemQuest(quest);
	}

	/** Báo lỗi dừng nhiệm vụ (dùng chung). */
	private failQuest(quest: Quest, questName: string, message: string) {
		console.error(`Dừng nhiệm vụ "${questName}": ${message}`);
		report('quest:error', {
			id: QuestManager.getQuestId(quest),
			name: questName,
			message,
		});
	}

	async doingWatchVideoQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		secondsDone: number,
	) {
		// Bám đúng tốc độ thời gian thực: mỗi giây trôi qua mới được cộng tối đa 7 giây,
		// biên +10s. Đẩy nhanh hơn = Discord đánh dấu bất thường.
		const maxFuture = 10,
			speed = 7,
			interval = 7;
		const enrolledAt = new Date(
			quest.userStatus?.enrolled_at as any,
		).getTime();
		let completed = false;

		console.log(
			`Đang giả lập xem video nhiệm vụ: "${questName}" (${secondsNeeded} giây)...`,
		);

		while (true) {
			const maxAllowed =
				Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
			const diff = maxAllowed - secondsDone;
			const timestamp = secondsDone + speed;
			if (diff >= speed) {
				const res = (await this.client.rest.post(
					`/quests/${quest.id}/video-progress`,
					{
						body: {
							timestamp: Math.min(
								secondsNeeded,
								timestamp + Math.random(),
							),
						},
					},
				)) as any;
				completed = res.completed_at != null;
				quest.updateUserStatus(res);
				secondsDone = Math.min(secondsNeeded, timestamp);
				report('quest:progress', {
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
			const finalRes = await this.client.rest.post(
				`/quests/${quest.id}/video-progress`,
				{
					body: { timestamp: secondsNeeded },
				},
			);
			quest.updateUserStatus(finalRes as any);
		}

		console.log(`ĐÃ HOÀN THÀNH VIDEO: "${questName}"!`);
		report('quest:done', {
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
	async doingPlayOnPlatformQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		taskName: string,
		applicationName: string,
		appId?: string,
		heartbeatIntervalS = 20,
	) {
		const applicationId =
			appId || QuestManager.getTaskApplicationId(quest, taskName);
		const interval = Math.max(5, heartbeatIntervalS);
		const maxTicks = Math.ceil(secondsNeeded / interval) + 60;

		console.log(
			`Đang giả lập chơi "${applicationName}" cho "${questName}" (Thời gian yêu cầu: ${Math.ceil(
				secondsNeeded / 60,
			)} phút, heartbeat ${interval}s)...`,
		);

		let consecutiveErrors = 0;
		let tick = 0;

		while (!quest.isCompleted() && tick < maxTicks) {
			tick++;
			try {
				const res = await this.client.rest.post(
					`/quests/${quest.id}/heartbeat`,
					{
						body: {
							application_id: applicationId,
							terminal: false,
						},
					},
				);
				quest.updateUserStatus(res as any);
				consecutiveErrors = 0;
				const currentDone = QuestManager.getTaskProgress(quest, taskName);
				console.log(
					`  [Heartbeat: ${applicationName}] Tiến độ: ${Math.floor(
						currentDone / 60,
					)}/${Math.ceil(secondsNeeded / 60)} phút.`,
				);
				report('quest:progress', {
					id: QuestManager.getQuestId(quest),
					name: questName,
					secondsDone: currentDone,
					secondsNeeded,
				});
			} catch (err: any) {
				consecutiveErrors++;
				const msg = err?.message || String(err);
				console.warn(
					`[Cảnh báo] Lỗi gửi tín hiệu heartbeat "${applicationName}" (${consecutiveErrors}/5): ${msg}`,
				);
				if (consecutiveErrors >= 5) {
					this.failQuest(quest, questName, `Mất tín hiệu liên tục: ${msg}`);
					return;
				}
			}
			await this.timeout(interval * 1000);
		}

		if (!quest.isCompleted()) {
			this.failQuest(
				quest,
				questName,
				`Quá ${maxTicks} nhịp heartbeat mà Discord chưa ghi nhận hoàn thành.`,
			);
			return;
		}

		try {
			const res = await this.client.rest.post(
				`/quests/${quest.id}/heartbeat`,
				{
					body: {
						application_id: applicationId,
						terminal: true,
					},
				},
			);
			quest.updateUserStatus(res as any);
		} catch {
			/* ignore terminal heartbeat error */
		}

		await this.finishQuest(quest, questName);
	}

	/**
	 * Nhiệm vụ chơi trên console: POST /quests/{id}/console-heartbeat.
	 * Waves 20: MỚI — Xbox / PlayStation / Nintendo trước đây không cày được.
	 */
	async doingConsoleQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		taskName: string,
		applicationName: string,
		appId?: string,
		heartbeatIntervalS = 60,
	) {
		const applicationId =
			appId || QuestManager.getTaskApplicationId(quest, taskName);
		const platform = taskName.replace('PLAY_ON_', '');
		const interval = Math.max(30, heartbeatIntervalS);
		const maxTicks = Math.ceil(secondsNeeded / interval) + 60;

		console.log(
			`Đang giả lập chơi trên ${platform} "${applicationName}" cho "${questName}" (${Math.ceil(
				secondsNeeded / 60,
			)} phút)...`,
		);

		let consecutiveErrors = 0;
		let tick = 0;

		while (!quest.isCompleted() && tick < maxTicks) {
			tick++;
			try {
				const res = await this.client.rest.post(
					`/quests/${quest.id}/console-heartbeat`,
					{
						body: {
							application_id: applicationId,
							platform,
							terminal: false,
						},
					},
				);
				quest.updateUserStatus(res as any);
				consecutiveErrors = 0;
				const currentDone = QuestManager.getTaskProgress(quest, taskName);
				console.log(
					`  [Console ${platform}] Tiến độ: ${Math.floor(
						currentDone / 60,
					)}/${Math.ceil(secondsNeeded / 60)} phút.`,
				);
				report('quest:progress', {
					id: QuestManager.getQuestId(quest),
					name: questName,
					secondsDone: currentDone,
					secondsNeeded,
				});
			} catch (err: any) {
				consecutiveErrors++;
				const msg = err?.message || String(err);
				console.warn(
					`[Cảnh báo] Lỗi console-heartbeat (${consecutiveErrors}/5): ${msg}`,
				);
				if (consecutiveErrors >= 5) {
					this.failQuest(quest, questName, `Console heartbeat lỗi liên tục: ${msg}`);
					return;
				}
			}
			await this.timeout(interval * 1000);
		}

		if (!quest.isCompleted()) {
			this.failQuest(
				quest,
				questName,
				`Console: quá ${maxTicks} nhịp mà chưa hoàn thành.`,
			);
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
		} catch {
			/* ignore */
		}

		await this.finishQuest(quest, questName);
	}

	/**
	 * Nhiệm vụ mobile / social game: POST /quests/{id}/mobile-heartbeat.
	 * Waves 20: MỚI — PLAY_ON_MOBILE và PLAY_SOCIAL_GAME trước đây không cày được.
	 */
	async doingMobileQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		taskName: string,
		applicationName: string,
		appId?: string,
	) {
		const applicationId =
			appId || QuestManager.getTaskApplicationId(quest, taskName);
		const sessionId = randomUUID();
		const interval = 45;
		const maxTicks = Math.ceil(secondsNeeded / interval) + 60;

		console.log(
			`Đang giả lập chơi mobile "${applicationName}" cho "${questName}" (${Math.ceil(
				secondsNeeded / 60,
			)} phút)...`,
		);

		let consecutiveErrors = 0;
		let tick = 0;

		while (!quest.isCompleted() && tick < maxTicks) {
			tick++;
			try {
				const res = await this.client.rest.post(
					`/quests/${quest.id}/mobile-heartbeat`,
					{
						body: {
							application_id: applicationId,
							session_id: sessionId,
						},
					},
				);
				quest.updateUserStatus(res as any);
				consecutiveErrors = 0;
				const currentDone = QuestManager.getTaskProgress(quest, taskName);
				console.log(
					`  [Mobile] Tiến độ: ${Math.floor(currentDone / 60)}/${Math.ceil(
						secondsNeeded / 60,
					)} phút.`,
				);
				report('quest:progress', {
					id: QuestManager.getQuestId(quest),
					name: questName,
					secondsDone: currentDone,
					secondsNeeded,
				});
			} catch (err: any) {
				consecutiveErrors++;
				const msg = err?.message || String(err);
				console.warn(
					`[Cảnh báo] Lỗi mobile-heartbeat (${consecutiveErrors}/5): ${msg}`,
				);
				if (consecutiveErrors >= 5) {
					this.failQuest(quest, questName, `Mobile heartbeat lỗi liên tục: ${msg}`);
					return;
				}
			}
			await this.timeout(interval * 1000);
		}

		if (!quest.isCompleted()) {
			this.failQuest(
				quest,
				questName,
				`Mobile: quá ${maxTicks} nhịp mà chưa hoàn thành.`,
			);
			return;
		}

		await this.finishQuest(quest, questName);
	}

	/**
	 * Nhiệm vụ xem stream: POST /quests/{id}/stream-progress { timestamp, elapsed }.
	 * Waves 20: MỚI — WATCH_STREAM trước đây không cày được.
	 * `elapsed` phải bám thời gian thật đã trôi qua kể từ lúc nhận nhiệm vụ.
	 */
	async doingWatchStreamQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		secondsDone: number,
	) {
		const enrolledAt =
			new Date(quest.userStatus?.enrolled_at as any).getTime() || Date.now();
		let done = secondsDone;
		let completed = quest.isCompleted();
		const maxTicks = Math.ceil(secondsNeeded / 30) + 60;
		let tick = 0;
		let consecutiveErrors = 0;

		console.log(
			`Đang giả lập xem stream cho "${questName}" (${Math.ceil(
				secondsNeeded / 60,
			)} phút)...`,
		);

		while (done < secondsNeeded && tick < maxTicks && !completed) {
			tick++;
			const elapsed = Math.max(
				0,
				Math.floor((Date.now() - enrolledAt) / 1000),
			);
			// Không được vượt quá thời gian thực đã trôi qua (+10s biên an toàn).
			const allowed = Math.min(secondsNeeded, elapsed + 10);
			const next = Math.max(done, Math.min(done + 30, allowed));

			if (next > done) {
				try {
					const res = (await this.client.rest.post(
						`/quests/${quest.id}/stream-progress`,
						{ body: { timestamp: next, elapsed } },
					)) as any;
					quest.updateUserStatus(res);
					completed = res?.completed_at != null;
					done = next;
					consecutiveErrors = 0;
					report('quest:progress', {
						id: QuestManager.getQuestId(quest),
						name: questName,
						secondsDone: done,
						secondsNeeded,
					});
					console.log(
						`  [Stream] Tiến độ: ${Math.floor(done / 60)}/${Math.ceil(
							secondsNeeded / 60,
						)} phút.`,
					);
				} catch (err: any) {
					consecutiveErrors++;
					console.warn(
						`[Cảnh báo] Lỗi stream-progress (${consecutiveErrors}/3): ${err?.message || err}`,
					);
					// Endpoint không tồn tại với token user → dừng ngay, không treo 30 phút.
					if (consecutiveErrors >= 3) {
						this.failQuest(
							quest,
							questName,
							`stream-progress lỗi liên tục: ${err?.message || err}`,
						);
						return;
					}
				}
			}

			if (completed) break;
			await this.timeout(30_000);
		}

		if (!completed) {
			const elapsed = Math.max(
				0,
				Math.floor((Date.now() - enrolledAt) / 1000),
			);
			try {
				const res = await this.client.rest.post(
					`/quests/${quest.id}/stream-progress`,
					{ body: { timestamp: secondsNeeded, elapsed } },
				);
				quest.updateUserStatus(res as any);
			} catch {
				/* ignore */
			}
		}

		if (!quest.isCompleted()) {
			this.failQuest(
				quest,
				questName,
				`Stream: chưa đạt ${secondsNeeded} giây sau ${tick} nhịp.`,
			);
			return;
		}

		await this.finishQuest(quest, questName);
	}

	/**
	 * Nhiệm vụ social: POST /quests/{id}/social-action.
	 * Waves 20: MỚI — Follow / Share / Join community trước đây không cày được.
	 */
	async doingSocialQuest(quest: Quest, questName: string, taskName: string) {
		const action =
			taskName === 'FOLLOW_SOCIAL'
				? 'follow'
				: taskName === 'SHARE_CONTENT'
					? 'share'
					: 'join';
		const platform = taskName === 'JOIN_COMMUNITY' ? 'community' : 'social';

		console.log(`Đang thực hiện hành động "${action}" cho "${questName}"...`);

		try {
			const res = await this.client.rest.post(
				`/quests/${quest.id}/social-action`,
				{ body: { action, platform } },
			);
			quest.updateUserStatus(res as any);
		} catch (err: any) {
			this.failQuest(
				quest,
				questName,
				`social-action lỗi: ${err?.message || err}`,
			);
			return;
		}

		await this.finishQuest(quest, questName);
	}

	/**
	 * Nhiệm vụ passive (khảo sát / nhập mã / mua hàng): chỉ theo dõi GET /quests/{id}/progress.
	 * Waves 20: MỚI — không tự hoàn thành được, nhưng vẫn poll để bắt trạng thái nếu
	 * Discord cập nhật (VD: người dùng tự làm trên app).
	 */
	async doingPassiveProgressQuest(
		quest: Quest,
		questName: string,
		taskName: string,
	) {
		const maxAttempts = 60;
		let attempts = 0;
		let consecutiveErrors = 0;

		console.log(
			`Theo dõi nhiệm vụ "${questName}" (${taskLabelOf(taskName)}) — loại này phải làm thủ công trên Discord.`,
		);

		while (!quest.isCompleted() && attempts < maxAttempts) {
			attempts++;
			try {
				const res = await this.client.rest.get(
					`/quests/${quest.id}/progress`,
				);
				quest.updateUserStatus(res as any);
				consecutiveErrors = 0;
			} catch (err: any) {
				// Endpoint không tồn tại với token user → dừng ngay, không treo 10 phút.
				consecutiveErrors++;
				if (consecutiveErrors >= 3) {
					report('quest:skip', {
						id: QuestManager.getQuestId(quest),
						name: questName,
						reason: `${taskLabelOf(taskName)} — cần thao tác thủ công trên Discord`,
					});
					return;
				}
			}
			if (quest.isCompleted()) break;
			await this.timeout(10_000);
		}

		if (!quest.isCompleted()) {
			report('quest:skip', {
				id: QuestManager.getQuestId(quest),
				name: questName,
				reason: `${taskLabelOf(taskName)} — cần thao tác thủ công trên Discord`,
			});
			return;
		}

		await this.finishQuest(quest, questName);
	}

	async doingPlayActivityQuest(
		quest: Quest,
		questName: string,
		secondsNeeded: number,
		taskName: string,
		applicationName: string,
		heartbeatIntervalS = 20,
	) {
		const interval = Math.max(5, heartbeatIntervalS);
		const streamKey = 'call:1:1';
		const maxTicks = Math.ceil(secondsNeeded / interval) + 60;
		console.log(
			`Đang giả lập hoạt động voice/activity "${applicationName}" cho "${questName}" (${Math.ceil(
				secondsNeeded / 60,
			)} phút)...`,
		);
		let consecutiveErrors = 0;
		let tick = 0;
		while (!quest.isCompleted() && tick < maxTicks) {
			tick++;
			try {
				const res = await this.client.rest.post(
					`/quests/${quest.id}/heartbeat`,
					{
						body: { stream_key: streamKey, terminal: false },
					},
				);
				quest.updateUserStatus(res as any);
				consecutiveErrors = 0;
				const currentDone = QuestManager.getTaskProgress(quest, taskName);
				console.log(
					`  [Hoạt động: ${applicationName}] Tiến độ: ${Math.floor(
						currentDone / 60,
					)}/${Math.ceil(secondsNeeded / 60)} phút.`,
				);
				report('quest:progress', {
					id: QuestManager.getQuestId(quest),
					name: questName,
					secondsDone: currentDone,
					secondsNeeded,
				});
			} catch (err: any) {
				consecutiveErrors++;
				const msg = err?.message || String(err);
				console.warn(
					`[Cảnh báo] Lỗi gửi tín hiệu hoạt động "${applicationName}" (${consecutiveErrors}/5): ${msg}`,
				);
				if (consecutiveErrors >= 5) {
					this.failQuest(quest, questName, `Lỗi tín hiệu liên tục: ${msg}`);
					return;
				}
			}
			await this.timeout(interval * 1000);
		}

		if (!quest.isCompleted()) {
			this.failQuest(
				quest,
				questName,
				`Activity: quá ${maxTicks} nhịp mà chưa hoàn thành.`,
			);
			return;
		}

		try {
			const res = await this.client.rest.post(
				`/quests/${quest.id}/heartbeat`,
				{
					body: { stream_key: streamKey, terminal: true },
				},
			);
			quest.updateUserStatus(res as any);
		} catch {
			/* ignore terminal heartbeat error */
		}

		await this.finishQuest(quest, questName);
	}

	async doingAchievementInActivityQuest(quest: Quest, questName: string) {
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
		})) as Record<string, any>;

		const location = res2?.location;
		let authCode: string | null = null;
		if (location) {
			authCode = new URL(location).searchParams.get('code');
		}
		if (!authCode) {
			const message = `Không lấy được mã xác thực cho ứng dụng ${applicationName}.`;
			console.error(message);
			report('quest:error', { id: QuestManager.getQuestId(quest), name: questName, message });
			return;
		}

		const { token, error: authError, activityReferrer } = await Utils.authorizeDiscordSays(
			applicationId,
			quest.id,
			authCode,
			this.client,
		);
		if (authError || !token) {
			const message = `Không cấp được token từ Discord Says cho ứng dụng ${applicationName}.`;
			console.error(message, authError);
			report('quest:error', { id: QuestManager.getQuestId(quest), name: questName, message });
			return;
		}

		const { success, error: progressError } =
			await Utils.progressDiscordSays(
				applicationId,
				quest.id,
				token,
				questTarget,
				activityReferrer,
			);
		if (progressError || !success) {
			const message = `Không gửi được tiến độ tới Discord Says cho ứng dụng ${applicationName}.`;
			console.error(message, progressError);
			report('quest:error', { id: QuestManager.getQuestId(quest), name: questName, message });
			return;
		}

		// Thu hồi quyền ứng dụng sau khi hoàn thành
		try {
			const res3 = (await this.client.rest.get(`/oauth2/tokens`)) as {
				id: string;
				scopes: string[];
				application: APIApplication;
				disclosures: number[];
			}[];
			const tokenInfo = res3.find((t) => t.application.id === applicationId);
			if (tokenInfo) {
				await this.client.rest.delete(`/oauth2/tokens/${tokenInfo.id}`);
			}
		} catch {
			/* ignore revoke error */
		}

		if (quest.raw.user_status) {
			quest.raw.user_status.completed_at =
				quest.raw.user_status.completed_at || new Date().toISOString();
		} else {
			quest.updateUserStatus({
				enrolled_at: new Date().toISOString(),
				completed_at: new Date().toISOString(),
				claimed_at: null,
				progress: {},
			} as any);
		}

		await this.finishQuest(quest, questName);
	}
}
