import React, { useState } from 'react';
import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { QuestProgressItem } from '../types';
import { Theme } from './Theme';

interface DoneQuestItem {
	id: string;
	name: string;
	orbs: number;
	rewardName: string;
	note?: string;
}

interface QuestTabsProps {
	activeQuests: QuestProgressItem[];
	doneQuests: DoneQuestItem[];
}

export const QuestTabs: React.FC<QuestTabsProps> = ({
	activeQuests,
	doneQuests,
}) => {
	const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');

	return (
		<View style={styles.card}>
			{/* Tab Switcher */}
			<View style={styles.tabBar}>
				<TouchableOpacity
					style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
					onPress={() => setActiveTab('active')}
					activeOpacity={0.7}
				>
					<Text style={styles.tabIcon}>⏳</Text>
					<Text
						style={[
							styles.tabText,
							activeTab === 'active' && styles.tabTextActive,
						]}
					>
						Đang làm ({activeQuests.length})
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.tabBtn, activeTab === 'done' && styles.tabBtnActive]}
					onPress={() => setActiveTab('done')}
					activeOpacity={0.7}
				>
					<Text style={styles.tabIcon}>✅</Text>
					<Text
						style={[
							styles.tabText,
							activeTab === 'done' && styles.tabTextActive,
						]}
					>
						Đã làm ({doneQuests.length})
					</Text>
				</TouchableOpacity>
			</View>

			{/* Tab Content */}
			<View style={styles.content}>
				{activeTab === 'active' ? (
					activeQuests.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyIcon}>🏖️</Text>
							<Text style={styles.emptyTitle}>Chưa có nhiệm vụ đang xử lý</Text>
							<Text style={styles.emptySubtitle}>
								Bấm "BẮT ĐẦU CHẠY NHIỆM VỤ" để quét các nhiệm vụ trên Discord
							</Text>
						</View>
					) : (
						<View style={styles.questList}>
							{activeQuests.map((quest) => (
								<View key={quest.id} style={styles.questItem}>
									<View style={styles.questTop}>
										<View style={styles.questMeta}>
											<Text style={styles.questName} numberOfLines={1}>
												{quest.name}
											</Text>
											<Text style={styles.questApp}>
												{quest.appName} • {quest.task.replace(/_/g, ' ')}
											</Text>
										</View>
										{quest.orbs > 0 ? (
											<View style={styles.orbPill}>
												<Text style={styles.orbPillText}>+{quest.orbs} Orbs</Text>
											</View>
										) : (
											<View style={styles.rewardPill}>
												<Text style={styles.rewardPillText} numberOfLines={1}>
													{quest.rewardName}
												</Text>
											</View>
										)}
									</View>

									{/* Progress Bar */}
									<View style={styles.progressContainer}>
										<View style={styles.progressBarBg}>
											<View
												style={[
													styles.progressBarFill,
													{ width: `${Math.min(100, Math.max(0, quest.percent))}%` },
												]}
											/>
										</View>
										<View style={styles.progressInfo}>
											<Text style={styles.progressText}>
												{quest.statusText || `${quest.percent}%`}
											</Text>
											<Text style={styles.progressPercent}>{quest.percent}%</Text>
										</View>
									</View>
								</View>
							))}
						</View>
					)
				) : (
					doneQuests.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyIcon}>📦</Text>
							<Text style={styles.emptyTitle}>Chưa có lịch sử hoàn thành</Text>
							<Text style={styles.emptySubtitle}>
								Các nhiệm vụ hoàn tất hoặc đã xong trước đó sẽ xuất hiện ở đây
							</Text>
						</View>
					) : (
						<View style={styles.questList}>
							{doneQuests.map((item, index) => (
								<View key={`${item.id}-${index}`} style={styles.doneItem}>
									<View style={styles.doneCheck}>
										<Text style={styles.doneCheckText}>✓</Text>
									</View>
									<View style={styles.doneInfo}>
										<Text style={styles.doneName} numberOfLines={1}>
											{item.name}
										</Text>
										<Text style={styles.doneReward}>
											{item.orbs > 0 ? `Đã nhận +${item.orbs} Orbs` : item.rewardName}
											{item.note ? ` • ${item.note}` : ''}
										</Text>
									</View>
									<View style={styles.doneBadge}>
										<Text style={styles.doneBadgeText}>Đã xong</Text>
									</View>
								</View>
							))}
						</View>
					)
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: Theme.colors.surface,
		borderRadius: Theme.radius.lg,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		marginHorizontal: Theme.spacing.lg,
		marginTop: Theme.spacing.md,
		overflow: 'hidden',
	},
	tabBar: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: Theme.colors.surfaceBorder,
		backgroundColor: Theme.colors.background,
	},
	tabBtn: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},
	tabBtnActive: {
		borderBottomColor: Theme.colors.primary,
		backgroundColor: Theme.colors.surface,
	},
	tabIcon: {
		fontSize: 13,
		marginRight: 6,
	},
	tabText: {
		fontSize: 12,
		fontWeight: '600',
		color: Theme.colors.textMuted,
	},
	tabTextActive: {
		color: Theme.colors.primary,
		fontWeight: '800',
	},
	content: {
		padding: Theme.spacing.md,
	},
	emptyContainer: {
		alignItems: 'center',
		paddingVertical: 24,
	},
	emptyIcon: {
		fontSize: 28,
		marginBottom: 6,
	},
	emptyTitle: {
		fontSize: 13,
		fontWeight: '700',
		color: Theme.colors.textSecondary,
		marginBottom: 2,
	},
	emptySubtitle: {
		fontSize: 11,
		color: Theme.colors.textMuted,
		textAlign: 'center',
		paddingHorizontal: 16,
	},
	questList: {
		gap: 10,
	},
	questItem: {
		backgroundColor: Theme.colors.surfaceElevated,
		borderRadius: Theme.radius.md,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		padding: Theme.spacing.md,
	},
	questTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 8,
	},
	questMeta: {
		flex: 1,
		marginRight: 8,
	},
	questName: {
		fontSize: 13,
		fontWeight: '700',
		color: Theme.colors.text,
	},
	questApp: {
		fontSize: 10,
		color: Theme.colors.textSecondary,
		marginTop: 2,
	},
	orbPill: {
		backgroundColor: Theme.colors.primaryGlow,
		paddingHorizontal: 7,
		paddingVertical: 3,
		borderRadius: Theme.radius.pill,
		borderWidth: 1,
		borderColor: Theme.colors.primary,
	},
	orbPillText: {
		fontSize: 10,
		fontWeight: '800',
		color: Theme.colors.primary,
	},
	rewardPill: {
		backgroundColor: Theme.colors.surface,
		paddingHorizontal: 7,
		paddingVertical: 3,
		borderRadius: Theme.radius.pill,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		maxWidth: 100,
	},
	rewardPillText: {
		fontSize: 10,
		color: Theme.colors.gold,
	},
	progressContainer: {
		marginTop: 4,
	},
	progressBarBg: {
		height: 6,
		backgroundColor: Theme.colors.background,
		borderRadius: 3,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: Theme.colors.primary,
		borderRadius: 3,
	},
	progressInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 4,
	},
	progressText: {
		fontSize: 10,
		color: Theme.colors.textMuted,
	},
	progressPercent: {
		fontSize: 10,
		fontWeight: '700',
		color: Theme.colors.primary,
	},
	doneItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Theme.colors.surfaceElevated,
		borderRadius: Theme.radius.md,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		padding: Theme.spacing.sm,
	},
	doneCheck: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: Theme.colors.successGlow,
		borderWidth: 1,
		borderColor: Theme.colors.success,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 8,
	},
	doneCheckText: {
		fontSize: 12,
		fontWeight: '900',
		color: Theme.colors.success,
	},
	doneInfo: {
		flex: 1,
	},
	doneName: {
		fontSize: 12,
		fontWeight: '700',
		color: Theme.colors.text,
	},
	doneReward: {
		fontSize: 10,
		color: Theme.colors.success,
		marginTop: 1,
	},
	doneBadge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: Theme.radius.pill,
		backgroundColor: Theme.colors.surface,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
	},
	doneBadgeText: {
		fontSize: 9,
		color: Theme.colors.textMuted,
		fontWeight: '600',
	},
});
