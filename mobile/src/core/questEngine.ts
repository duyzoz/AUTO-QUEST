import { DiscordApi } from './discordApi';
import { QuestData, QuestProgressItem, QuestTaskType } from '../types';

export interface EngineCallbacks {
	onLog: (text: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
	onQuestStart: (item: QuestProgressItem) => void;
	onQuestProgress: (id: string, done: number, target: number) => void;
	onQuestDone: (id: string, name: string, orbs: number, rewardName: string, note?: string) => void;
	onQuestSkip: (id: string, name: string, reason: string) => void;
	onQuestError: (id: string, name: string, error: string) => void;
	onOrbBonus: (addedOrbs: number) => void;
}

export class QuestEngine {
	private readonly api: DiscordApi;
	private readonly callbacks: EngineCallbacks;
	private isStopping = false;

	constructor(token: string, callbacks: EngineCallbacks) {
		this.api = new DiscordApi(token);
		this.callbacks = callbacks;
	}

	public stop() {
		this.isStopping = true;
	}

	public static getQuestOrbs(quest: QuestData): number {
		try {
			const rewards = quest.config?.rewards_config?.rewards;
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

	public static getQuestRewardName(quest: QuestData): string {
		try {
			const rewards = quest.config?.rewards_config?.rewards;
			if (Array.isArray(rewards) && rewards.length > 0) {
				const orbs = QuestEngine.getQuestOrbs(quest);
				if (orbs > 0) return `${orbs} Discord Orbs`;
				const msgName = rewards[0]?.messages?.name;
				if (msgName) return msgName;
			}
			return 'Quà tặng Discord';
		} catch {
			return 'Phần thưởng Discord';
		}
	}

	public static isQuestCompleted(quest: QuestData): boolean {
		return Boolean(quest.user_status?.completed_at);
	}

	public static hasClaimedRewards(quest: QuestData): boolean {
		return Boolean(quest.user_status?.claimed_at);
	}

	public static isQuestEnrolled(quest: QuestData): boolean {
		return Boolean(quest.user_status?.enrolled_at);
	}

	public async run(): Promise<void> {
		this.isStopping = false;
		const log = this.callbacks.onLog;

		log('🔍 [BẢO MẬT] Kết nối an toàn 100% trực tiếp tới Discord API.');
		log('📡 Đang quét toàn bộ danh sách nhiệm vụ trên tài khoản...');

		let rawData: { quests: QuestData[]; excluded_quests?: { id: string }[]; quest_enrollment_blocked_until?: string | null };
		try {
			rawData = await this.api.getQuests();
		} catch (err: any) {
			log(`❌ Không thể tải danh sách nhiệm vụ: ${err.message}`, 'error');
			throw err;
		}

		if (rawData.quest_enrollment_blocked_until) {
			log(`⚠️ Việc nhận nhiệm vụ bị tạm khóa đến: ${rawData.quest_enrollment_blocked_until}`, 'warn');
		}

		const questMap = new Map<string, QuestData>();
		for (const q of rawData.quests || []) {
			questMap.set(q.id, q);
		}

		// Nạp excluded quests để không bỏ sót nhiệm vụ nào
		if (Array.isArray(rawData.excluded_quests) && rawData.excluded_quests.length > 0) {
			log(`🔍 Phát hiện ${rawData.excluded_quests.length} nhiệm vụ phụ. Đang kiểm tra...`);
			for (const eq of rawData.excluded_quests) {
				if (this.isStopping) return;
				if (eq.id && !questMap.has(eq.id)) {
					try {
						const detail = await this.api.getQuestDetail(eq.id);
						questMap.set(eq.id, {
							id: eq.id,
							config: detail,
							user_status: null,
						});
						log(`  + Đã nạp nhiệm vụ phụ: "${detail.messages?.quest_name || eq.id}"`);
					} catch {}
				}
			}
		}

		const allQuests = Array.from(questMap.values());

		// 1. Ghi nhận các nhiệm vụ đã hoàn thành trước đó -> Đẩy sang Tab Đã làm
		for (const quest of allQuests) {
			if (QuestEngine.isQuestCompleted(quest)) {
				const name = quest.config.messages.quest_name;
				const orbs = QuestEngine.getQuestOrbs(quest);
				const rewardName = QuestEngine.getQuestRewardName(quest);
				this.callbacks.onQuestDone(quest.id, name, orbs, rewardName, 'Đã xong từ trước');
			}
		}

		// 2. Tự động nhận thưởng cho nhiệm vụ đã hoàn thành nhưng chưa claim
		const questsToRedeem = allQuests.filter((q: QuestData) => QuestEngine.isQuestCompleted(q) && !QuestEngine.hasClaimedRewards(q));
		if (questsToRedeem.length > 0) {
			log(`🎁 Phát hiện ${questsToRedeem.length} nhiệm vụ đã xong chưa nhận thưởng. Đang tự động nhận...`);
			for (const quest of questsToRedeem) {
				if (this.isStopping) return;
				await this.redeemQuest(quest);
				await new Promise((r) => setTimeout(r, 1200));
			}
		}

		// 3. Lọc danh sách nhiệm vụ cần làm
		const pendingQuests = allQuests.filter((q: QuestData) => !QuestEngine.isQuestCompleted(q));
		log(`📋 Tổng cộng có ${pendingQuests.length} nhiệm vụ khả dụng cần thực hiện.`);

		if (pendingQuests.length === 0) {
			log('✅ Tất cả nhiệm vụ hiện tại trên tài khoản đã hoàn thành!', 'success');
			return;
		}

		// Đăng ký và chuẩn bị các item
		for (const quest of pendingQuests) {
			const name = quest.config.messages.quest_name;
			const appName = quest.config.application.name;
			const taskConfig = quest.config.task_config_v2;
			const taskName = (Object.keys(taskConfig.tasks || {})[0] || 'WATCH_VIDEO') as QuestTaskType;
			const secondsNeeded = taskConfig.tasks[taskName]?.target || 0;
			const secondsDone = quest.user_status?.progress?.[taskName]?.value || 0;

			this.callbacks.onQuestStart({
				id: quest.id,
				name,
				appName,
				task: taskName,
				secondsDone,
				secondsNeeded,
				percent: secondsNeeded > 0 ? Math.round((secondsDone / secondsNeeded) * 100) : 0,
				orbs: QuestEngine.getQuestOrbs(quest),
				rewardName: QuestEngine.getQuestRewardName(quest),
				status: 'pending',
				statusText: 'Đang chuẩn bị...',
			});
		}

		// Bắt đầu thực hiện từng nhiệm vụ
		for (const quest of pendingQuests) {
			if (this.isStopping) {
				log('⏹️ Đã dừng tiến trình theo yêu cầu.', 'warn');
				return;
			}
			await this.processQuest(quest);
			await new Promise((r) => setTimeout(r, 1500));
		}

		log('🎉 Hoàn thành lượt xử lý nhiệm vụ!', 'success');
	}

	private async processQuest(quest: QuestData) {
		const log = this.callbacks.onLog;
		const name = quest.config.messages.quest_name;
		const appName = quest.config.application.name;
		const taskConfig = quest.config.task_config_v2;
		const taskName = (Object.keys(taskConfig.tasks || {})[0] || 'WATCH_VIDEO') as QuestTaskType;
		const isMobileTask = taskName === 'WATCH_VIDEO_ON_MOBILE';

		// Đăng ký nhận nhiệm vụ nếu chưa nhận
		if (!QuestEngine.isQuestEnrolled(quest)) {
			log(`📝 Đang đăng ký: "${name}" (${isMobileTask ? 'Mobile' : 'Desktop'})...`);
			try {
				const enrollRes = await this.api.enrollQuest(
					quest.id,
					isMobileTask,
					quest.traffic_metadata_raw,
					quest.traffic_metadata_sealed,
				);
				quest.user_status = enrollRes;
				log(`  ✓ Đã đăng ký thành công: "${name}"`);
			} catch (err: any) {
				const msg = err.message || '';
				if (msg.includes('already enrolled') || msg.includes('50035')) {
					log(`  ✓ Nhiệm vụ đã đăng ký trước đó: "${name}"`);
				} else {
					log(`❌ Không thể đăng ký "${name}": ${msg}`, 'error');
					this.callbacks.onQuestError(quest.id, name, msg);
					return;
				}
			}
		}

		const secondsNeeded = taskConfig.tasks[taskName]?.target || 0;
		let secondsDone = quest.user_status?.progress?.[taskName]?.value || 0;

		switch (taskName) {
			case 'WATCH_VIDEO':
			case 'WATCH_VIDEO_ON_MOBILE':
				await this.doWatchVideo(quest, name, secondsNeeded, secondsDone);
				break;
			case 'PLAY_ON_DESKTOP':
			case 'PLAY_ON_XBOX':
			case 'PLAY_ON_PLAYSTATION':
				await this.doGameHeartbeat(quest, name, appName, secondsNeeded, secondsDone, taskName);
				break;
			case 'PLAY_ACTIVITY':
				await this.doActivityHeartbeat(quest, name, appName, secondsNeeded, secondsDone, taskName);
				break;
			case 'STREAM_ON_DESKTOP':
				log(`⚠️ "${name}" yêu cầu Livestream Discord Voice với bạn bè. Bỏ qua tự động.`, 'warn');
				this.callbacks.onQuestSkip(quest.id, name, 'Yêu cầu Stream trên Discord');
				break;
			default:
				log(`⚠️ "${name}" có loại nhiệm vụ không hỗ trợ (${taskName}).`, 'warn');
				this.callbacks.onQuestSkip(quest.id, name, 'Loại nhiệm vụ chưa hỗ trợ');
				break;
		}
	}

	private async doWatchVideo(quest: QuestData, name: string, target: number, initialDone: number) {
		const log = this.callbacks.onLog;
		log(`🎬 Bắt đầu xem video cho "${name}" (${target}s)...`);

		let current = initialDone;
		const step = 7; // bước nhảy giây an toàn

		while (current < target && !this.isStopping) {
			current = Math.min(target, current + step);
			try {
				const res = await this.api.sendVideoProgress(quest.id, current);
				quest.user_status = res;
				this.callbacks.onQuestProgress(quest.id, current, target);
				const percent = Math.round((current / target) * 100);
				log(`  [Video] "${name}": ${current}/${target}s (${percent}%)`);
			} catch (err: any) {
				log(`  ! Lỗi cập nhật video "${name}": ${err.message}`, 'warn');
			}
			await new Promise((r) => setTimeout(r, 1200));
		}

		if (this.isStopping) return;

		// Hoàn tất video
		try {
			await this.api.sendVideoComplete(quest.id);
		} catch {}

		await this.onFinishedQuest(quest, name);
	}

	private async doGameHeartbeat(quest: QuestData, name: string, appName: string, target: number, initialDone: number, taskName: QuestTaskType) {
		const log = this.callbacks.onLog;
		const appId = quest.config.application.id;
		log(`🎮 Đang giả lập chơi game "${appName}" (${Math.ceil(target / 60)} phút)...`);

		let done = initialDone;
		const intervalSec = 20;

		while (done < target && !this.isStopping) {
			try {
				const res = await this.api.sendHeartbeat(quest.id, appId, undefined, false);
				quest.user_status = res;
				done = quest.user_status?.progress?.[taskName]?.value || done + intervalSec;
				this.callbacks.onQuestProgress(quest.id, done, target);
				log(`  [Game: ${appName}] Tiến độ: ${Math.floor(done / 60)}/${Math.ceil(target / 60)} phút`);
			} catch (err: any) {
				log(`  ! Lỗi heartbeat: ${err.message}`, 'warn');
				done += intervalSec;
			}
			await new Promise((r) => setTimeout(r, intervalSec * 1000));
		}

		if (this.isStopping) return;

		try {
			await this.api.sendHeartbeat(quest.id, appId, undefined, true);
		} catch {}

		await this.onFinishedQuest(quest, name);
	}

	private async doActivityHeartbeat(quest: QuestData, name: string, appName: string, target: number, initialDone: number, taskName: QuestTaskType) {
		const log = this.callbacks.onLog;
		const streamKey = 'call:1:1';
		log(`🎯 Đang giả lập Discord Activity "${appName}" (${Math.ceil(target / 60)} phút)...`);

		let done = initialDone;
		const intervalSec = 20;

		while (done < target && !this.isStopping) {
			try {
				const res = await this.api.sendHeartbeat(quest.id, undefined, streamKey, false);
				quest.user_status = res;
				done = quest.user_status?.progress?.[taskName]?.value || done + intervalSec;
				this.callbacks.onQuestProgress(quest.id, done, target);
				log(`  [Activity: ${appName}] Tiến độ: ${Math.floor(done / 60)}/${Math.ceil(target / 60)} phút`);
			} catch (err: any) {
				log(`  ! Lỗi activity heartbeat: ${err.message}`, 'warn');
				done += intervalSec;
			}
			await new Promise((r) => setTimeout(r, intervalSec * 1000));
		}

		if (this.isStopping) return;

		await this.onFinishedQuest(quest, name);
	}

	private async onFinishedQuest(quest: QuestData, name: string) {
		const log = this.callbacks.onLog;
		const orbs = QuestEngine.getQuestOrbs(quest);
		const rewardName = QuestEngine.getQuestRewardName(quest);

		log(`🎉 ĐÃ HOÀN THÀNH: "${name}"!`, 'success');
		if (orbs > 0) {
			this.callbacks.onOrbBonus(orbs);
		}
		this.callbacks.onQuestDone(quest.id, name, orbs, rewardName);

		// Tự động nhận thưởng
		await this.redeemQuest(quest);
	}

	public async redeemQuest(quest: QuestData) {
		const log = this.callbacks.onLog;
		const name = quest.config.messages.quest_name;
		const orbs = QuestEngine.getQuestOrbs(quest);
		const rewardName = QuestEngine.getQuestRewardName(quest);
		const platform = quest.config.rewards_config?.platforms?.[0] || 0;

		try {
			const res = await this.api.claimReward(
				quest.id,
				platform,
				quest.traffic_metadata_raw,
				quest.traffic_metadata_sealed,
			);
			quest.user_status = res;
			log(`🎁 ĐÃ NHẬN THƯỞNG: "${name}" -> Nhận: ${rewardName}!`, 'success');
		} catch (err: any) {
			const msg = err.message || '';
			if (msg.includes('captcha') || msg.includes('No Description')) {
				log(`✅ "${name}" hoàn tất! Discord yêu cầu captcha nhận quà -> Mở Discord nhận quà thủ công nhé!`, 'warn');
			} else {
				log(`  ! Không thể tự nhận quà "${name}": ${msg}`, 'warn');
			}
		}
	}
}
