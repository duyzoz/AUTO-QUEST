import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from './Theme';

interface StatCardsProps {
	baseOrbs: number | string;
	bonusOrbs: number;
	completedQuests: number;
	totalQuests: number;
	isLoopMode: boolean;
	loopInterval: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
	baseOrbs,
	bonusOrbs,
	completedQuests,
	totalQuests,
	isLoopMode,
	loopInterval,
}) => {
	return (
		<View style={styles.container}>
			{/* Card 1: Discord Orbs */}
			<View style={[styles.card, styles.cardOrbs]}>
				<View style={styles.cardHeader}>
					<Text style={styles.cardIcon}>🌟</Text>
					<Text style={styles.cardLabel}>DISCORD ORBS</Text>
				</View>
				<View style={styles.orbsValueRow}>
					<Text style={styles.orbsValue}>{baseOrbs}</Text>
					{bonusOrbs > 0 && (
						<View style={styles.bonusBadge}>
							<Text style={styles.bonusText}>+{bonusOrbs}</Text>
						</View>
					)}
				</View>
				<Text style={styles.subtext}>
					{bonusOrbs > 0 ? `Tích lũy phiên: +${bonusOrbs} Orbs` : 'Số dư tài khoản'}
				</Text>
			</View>

			{/* Card 2: Quests Count */}
			<View style={styles.card}>
				<View style={styles.cardHeader}>
					<Text style={styles.cardIcon}>📋</Text>
					<Text style={styles.cardLabel}>NHIỆM VỤ</Text>
				</View>
				<View style={styles.valueRow}>
					<Text style={styles.valueMain}>{completedQuests}</Text>
					<Text style={styles.valueTotal}>/{totalQuests}</Text>
				</View>
				<Text style={styles.subtext}>
					{totalQuests > 0
						? `${Math.round((completedQuests / totalQuests) * 100)}% hoàn thành`
						: 'Chưa nạp'}
				</Text>
			</View>

			{/* Card 3: Mode */}
			<View style={styles.card}>
				<View style={styles.cardHeader}>
					<Text style={styles.cardIcon}>⚡</Text>
					<Text style={styles.cardLabel}>CHẾ ĐỘ</Text>
				</View>
				<View style={styles.valueRow}>
					<Text style={[styles.valueMain, isLoopMode && { color: Theme.colors.primary }]}>
						{isLoopMode ? 'Treo AFK' : '1 Lần'}
					</Text>
				</View>
				<Text style={styles.subtext}>
					{isLoopMode ? `Lặp mỗi ${loopInterval}p` : 'Tự dừng khi xong'}
				</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: 8,
		marginHorizontal: Theme.spacing.lg,
		marginTop: Theme.spacing.md,
	},
	card: {
		flex: 1,
		backgroundColor: Theme.colors.surface,
		borderRadius: Theme.radius.lg,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		padding: Theme.spacing.sm,
		justifyContent: 'space-between',
	},
	cardOrbs: {
		borderColor: Theme.colors.surfaceBorder,
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	cardIcon: {
		fontSize: 12,
		marginRight: 4,
	},
	cardLabel: {
		fontSize: 9,
		fontWeight: '800',
		color: Theme.colors.textMuted,
		letterSpacing: 0.5,
	},
	orbsValueRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: 4,
		marginVertical: 2,
	},
	orbsValue: {
		fontSize: 18,
		fontWeight: '900',
		color: Theme.colors.gold,
	},
	bonusBadge: {
		backgroundColor: Theme.colors.successGlow,
		paddingHorizontal: 5,
		paddingVertical: 1,
		borderRadius: Theme.radius.pill,
		borderWidth: 1,
		borderColor: Theme.colors.success,
	},
	bonusText: {
		fontSize: 10,
		fontWeight: '800',
		color: Theme.colors.success,
	},
	valueRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
		marginVertical: 2,
	},
	valueMain: {
		fontSize: 18,
		fontWeight: '900',
		color: Theme.colors.text,
	},
	valueTotal: {
		fontSize: 13,
		fontWeight: '600',
		color: Theme.colors.textMuted,
		marginLeft: 2,
	},
	subtext: {
		fontSize: 9,
		color: Theme.colors.textSecondary,
		marginTop: 2,
	},
});
