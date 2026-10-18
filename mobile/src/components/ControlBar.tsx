import React from 'react';
import {
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { Theme } from './Theme';

interface ControlBarProps {
	isRunning: boolean;
	onStart: () => void;
	onStop: () => void;
	isLoopMode: boolean;
	onToggleLoopMode: (val: boolean) => void;
	loopInterval: number;
	onChangeInterval: (val: number) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
	isRunning,
	onStart,
	onStop,
	isLoopMode,
	onToggleLoopMode,
	loopInterval,
	onChangeInterval,
}) => {
	const intervals = [15, 30, 60];

	return (
		<View style={styles.card}>
			<View style={styles.buttonRow}>
				{!isRunning ? (
					<TouchableOpacity
						style={[styles.mainBtn, styles.btnStart]}
						onPress={onStart}
						activeOpacity={0.8}
					>
						<Text style={styles.btnStartIcon}>🚀</Text>
						<Text style={styles.btnStartText}>BẮT ĐẦU CHẠY NHIỆM VỤ</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={[styles.mainBtn, styles.btnStop]}
						onPress={onStop}
						activeOpacity={0.8}
					>
						<Text style={styles.btnStopIcon}>⏹️</Text>
						<Text style={styles.btnStopText}>DỪNG TIẾN TRÌNH</Text>
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.loopRow}>
				<View style={styles.loopLeft}>
					<Text style={styles.loopIcon}>🔄</Text>
					<View>
						<Text style={styles.loopTitle}>Treo Orb Tự Động (AFK Loop)</Text>
						<Text style={styles.loopSubtitle}>Tự động quét và cày nhiệm vụ mới</Text>
					</View>
				</View>
				<Switch
					value={isLoopMode}
					onValueChange={onToggleLoopMode}
					trackColor={{ false: Theme.colors.surfaceElevated, true: Theme.colors.primary }}
					thumbColor={isLoopMode ? '#000000' : Theme.colors.textMuted}
					disabled={isRunning}
				/>
			</View>

			{isLoopMode && (
				<View style={styles.intervalRow}>
					<Text style={styles.intervalLabel}>Chu kỳ quét lại:</Text>
					<View style={styles.intervalPills}>
						{intervals.map((mins) => (
							<TouchableOpacity
								key={mins}
								style={[
									styles.pill,
									loopInterval === mins && styles.pillActive,
								]}
								onPress={() => onChangeInterval(mins)}
								disabled={isRunning}
								activeOpacity={0.7}
							>
								<Text
									style={[
										styles.pillText,
										loopInterval === mins && styles.pillTextActive,
									]}
								>
									{mins} phút
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: Theme.colors.surface,
		borderRadius: Theme.radius.lg,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		padding: Theme.spacing.md,
		marginHorizontal: Theme.spacing.lg,
		marginTop: Theme.spacing.md,
	},
	buttonRow: {
		marginBottom: Theme.spacing.sm,
	},
	mainBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 13,
		borderRadius: Theme.radius.md,
	},
	btnStart: {
		backgroundColor: Theme.colors.primary,
		shadowColor: Theme.colors.primary,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 8,
	},
	btnStartIcon: {
		fontSize: 16,
		marginRight: 8,
	},
	btnStartText: {
		fontSize: 14,
		fontWeight: '900',
		color: '#000000',
		letterSpacing: 0.5,
	},
	btnStop: {
		backgroundColor: Theme.colors.errorGlow,
		borderWidth: 1.5,
		borderColor: Theme.colors.error,
	},
	btnStopIcon: {
		fontSize: 16,
		marginRight: 8,
	},
	btnStopText: {
		fontSize: 14,
		fontWeight: '900',
		color: Theme.colors.error,
		letterSpacing: 0.5,
	},
	loopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: Theme.spacing.sm,
		borderTopWidth: 1,
		borderTopColor: Theme.colors.surfaceBorder,
	},
	loopLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	loopIcon: {
		fontSize: 16,
		marginRight: 8,
	},
	loopTitle: {
		fontSize: 12,
		fontWeight: '700',
		color: Theme.colors.text,
	},
	loopSubtitle: {
		fontSize: 10,
		color: Theme.colors.textMuted,
		marginTop: 1,
	},
	intervalRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: Theme.spacing.sm,
		paddingTop: Theme.spacing.sm,
		borderTopWidth: 1,
		borderTopColor: Theme.colors.surfaceBorder,
	},
	intervalLabel: {
		fontSize: 11,
		color: Theme.colors.textSecondary,
		fontWeight: '600',
	},
	intervalPills: {
		flexDirection: 'row',
		gap: 6,
	},
	pill: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: Theme.radius.sm,
		backgroundColor: Theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
	},
	pillActive: {
		backgroundColor: Theme.colors.primaryGlow,
		borderColor: Theme.colors.primary,
	},
	pillText: {
		fontSize: 11,
		fontWeight: '600',
		color: Theme.colors.textMuted,
	},
	pillTextActive: {
		color: Theme.colors.primary,
		fontWeight: '700',
	},
});
