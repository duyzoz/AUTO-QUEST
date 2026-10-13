import { GatewayDispatchEvents } from 'discord-api-types/v10';
import { ClientQuest } from './src/client';
import { report } from './src/events';
import { SecurityGuard } from './src/security';
import { QuestManager } from './src/questManager';

const token = (process.env.TOKEN || '').trim();
const isLoopMode = process.env.LOOP_MODE === '1';
const loopIntervalMinutes = parseInt(process.env.LOOP_INTERVAL || '30', 10) || 30;

if (!token) {
	report('fatal', { message: 'Thiếu Token Discord. Vui lòng nhập token trên giao diện.' });
	process.exit(1);
}

let finished = false;
let isStopping = false;

const client = new ClientQuest(token);

async function shutdown(code: number) {
	if (finished) return;
	finished = true;
	isStopping = true;
	try {
		await client.destroy();
	} catch {
		/* ignore */
	}
	setTimeout(() => process.exit(code), 200);
}

async function runQuestCycle(): Promise<void> {
	if (isStopping) return;

	try {
		console.log('\n========================================');
		console.log('🔍 [BẢO MẬT] Kết nối an toàn 100% trực tiếp tới Discord API.');
		console.log('📡 Đang quét toàn bộ danh sách nhiệm vụ trên tài khoản...');

		// Nạp toàn bộ nhiệm vụ (bao gồm excluded_quests để không xót nhiệm vụ nào)
		await client.fetchQuests(true);

		const questManager = client.questManager!;

		// Đẩy toàn bộ các nhiệm vụ đã hoàn thành trước đó vào Tab "Đã làm"
		for (const completedQuest of questManager.getCompleted()) {
			report('quest:done', {
				name: completedQuest.config.messages.quest_name,
				orbs: QuestManager.getQuestOrbs(completedQuest),
				rewardName: QuestManager.getQuestRewardName(completedQuest),
			});
		}

		// Bước 1: Nhận thưởng cho các nhiệm vụ đã xong trước đó nhưng chưa nhận quà
		const questsToRedeem = questManager.filterQuestsValidToRedeem();
		if (questsToRedeem.length > 0) {
			console.log(
				`🎁 Phát hiện ${questsToRedeem.length} nhiệm vụ đã hoàn thành nhưng chưa nhận thưởng. Đang tự động nhận...`,
			);
			for (const quest of questsToRedeem) {
				if (isStopping) return;
				await questManager.redeemQuest(quest);
				await new Promise((resolve) => setTimeout(resolve, 1500));
			}
		}

		// Bước 2: Lọc các nhiệm vụ cần thực hiện
		const questsValid = questManager.filterQuestsValidToDo();

		// Đẩy danh sách nhiệm vụ cần làm vào Tab "Đang làm"
		for (const pendingQuest of questsValid) {
			const taskConfig = pendingQuest.config.task_config_v2;
			const taskName = [
				'WATCH_VIDEO',
				'PLAY_ON_DESKTOP',
				'PLAY_ON_XBOX',
				'PLAY_ON_PLAYSTATION',
				'STREAM_ON_DESKTOP',
				'PLAY_ACTIVITY',
				'WATCH_VIDEO_ON_MOBILE',
				'ACHIEVEMENT_IN_ACTIVITY',
			].find((x) => (taskConfig.tasks as any)[x] != null) || 'Nhiệm vụ Discord';

			const secondsNeeded = (taskConfig.tasks as any)[taskName]?.target || 0;
			const secondsDone = pendingQuest.userStatus?.progress?.[taskName]?.value ?? 0;

			report('quest:start', {
				name: pendingQuest.config.messages.quest_name,
				task: taskName,
				application: pendingQuest.config.application.name,
				secondsNeeded,
				secondsDone,
				orbs: QuestManager.getQuestOrbs(pendingQuest),
				rewardName: QuestManager.getQuestRewardName(pendingQuest),
			});
		}

		report('quests', {
			total: questsValid.length,
		});
		console.log(`📋 Tổng cộng có ${questsValid.length} nhiệm vụ khả dụng cần thực hiện.`);

		if (questsValid.length === 0) {
			console.log('✅ Tất cả nhiệm vụ hiện tại đã hoàn thành!');
			report('finish', { message: 'Đã hoàn thành tất cả nhiệm vụ.' });
			return;
		}

		// Giai đoạn 1: Đăng ký các nhiệm vụ chưa nhận (tuần tự, tránh rate-limit)
		console.log('\n--- [Giai đoạn 1] Đăng ký nhận các nhiệm vụ ---');
		let hasRateLimit = false;

		for (const quest of questsValid) {
			if (isStopping) return;
			const questName = quest.config.messages.quest_name;

			if (!quest.isEnrolledQuest()) {
				const isAndroid =
					Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO_ON_MOBILE) &&
					!Boolean(quest.config.task_config_v2.tasks.WATCH_VIDEO);

				console.log(
					`Đang đăng ký: "${questName}" (${isAndroid ? 'Android' : 'Desktop'})...`,
				);

				try {
					await questManager.acceptQuest(quest, isAndroid);
					console.log(`Đã đăng ký thành công: "${questName}".`);
					await new Promise((resolve) => setTimeout(resolve, 2500));
				} catch (err: any) {
					const message = err?.message || String(err);
					if (message.toLowerCase().includes('ratelimit') || err?.status === 429) {
						hasRateLimit = true;
						console.warn(
							`[Giới hạn Discord] Tài khoản đang bị Discord giới hạn nhận nhiệm vụ mới qua API (~45 phút).`,
						);
						console.log(
							`💡 Mẹo: Bạn có thể mở app Discord bấm "Nhận nhiệm vụ" ("Accept Quest") thủ công cho "${questName}", app sẽ cày ngay!`,
						);
						report('quest:skip', {
							name: questName,
							reason: 'Giới hạn API Discord (bấm Nhận trên app Discord hoặc đợi đợt quét kế)',
						});
					} else {
						console.warn(`Không thể nhận nhiệm vụ "${questName}": ${message}`);
						report('quest:error', { name: questName, message });
					}
				}
			} else {
				console.log(`Nhiệm vụ "${questName}" đã được nhận trước đó.`);
			}
		}

		// Lọc các nhiệm vụ đã sẵn sàng thực hiện
		const executableQuests = questsValid.filter((q) => q.isEnrolledQuest());

		if (executableQuests.length === 0) {
			if (hasRateLimit) {
				console.log(
					'⏳ Các nhiệm vụ còn lại đang bị giới hạn nhận tự động qua API.',
				);
				console.log(
					'👉 Hãy mở Discord bấm "Nhận nhiệm vụ", hoặc giữ app ở chế độ Treo Orb để tự thử lại sau.',
				);
			} else {
				console.log('Không còn nhiệm vụ nào cần thực hiện.');
			}
			report('finish', {});
			return;
		}

		// Giai đoạn 2: Tiến hành cày đồng thời các nhiệm vụ
		console.log(
			`\n--- [Giai đoạn 2] Bắt đầu thực hiện ${executableQuests.length} nhiệm vụ ---`,
		);

		const tasks = executableQuests.map(async (quest, index) => {
			if (isStopping) return;
			if (index > 0) {
				await new Promise((resolve) => setTimeout(resolve, index * 1500));
			}
			return questManager.doingQuest(quest);
		});

		await Promise.allSettled(tasks);

		// Cập nhật lại thống kê Orb sau khi hoàn thành
		const updatedOrbStats = questManager.getOrbsSummary();
		report('orb:summary', updatedOrbStats);
		console.log(
			`🎉 Hoàn thành đợt cày nhiệm vụ! Tổng Orb đã đạt: ${updatedOrbStats.completedOrbs} Orbs.`,
		);
		report('finish', {});

	} catch (err: any) {
		const message = err?.message || String(err);
		report('fatal', { message });
		console.error('Lỗi khi thực hiện nhiệm vụ:', message);
	}
}

client.once(GatewayDispatchEvents.Ready, async ({ data }) => {
	report('login', {
		id: data.user.id,
		username: data.user.username,
	});
	console.log(`Đăng nhập thành công tài khoản: @${data.user.username}`);

	if (!isLoopMode) {
		// Chế độ chạy 1 lần: làm xong và đóng app
		await runQuestCycle();
		console.log('Hoàn thành toàn bộ nhiệm vụ. Đang ngắt kết nối an toàn...');
		await shutdown(0);
	} else {
		// Chế độ Treo Orb liên tục (AFK Loop Mode)
		console.log(`⚡ ĐÃ BẬT CHẾ ĐỘ TREO ORB TỰ ĐỘNG (Quét lại mỗi ${loopIntervalMinutes} phút).`);

		while (!isStopping) {
			await runQuestCycle();

			if (isStopping) break;

			console.log(
				`\n💤 Đang treo Orb... Sẽ tự động quét lại nhiệm vụ mới sau ${loopIntervalMinutes} phút.`,
			);

			// Đếm ngược theo chu kỳ
			const totalSeconds = loopIntervalMinutes * 60;
			for (let remaining = totalSeconds; remaining > 0; remaining--) {
				if (isStopping) break;
				if (remaining % 30 === 0 || remaining <= 10) {
					report('cycle:wait', { remainingSeconds: remaining });
				}
				await new Promise((resolve) => setTimeout(resolve, 1000));
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

client.connect().catch((err: any) => {
	const message = err?.message || String(err);
	report('fatal', { message });
	console.error('Lỗi kết nối Discord:', message);
	void shutdown(1);
});
