import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from './Theme';

interface HeaderProps {
	status: 'idle' | 'running' | 'waiting' | 'error';
	statusText: string;
	onToggleOledSaver: () => void;
	isLoopMode: boolean;
	countdown: number | null;
}

export const Header: React.FC<HeaderProps> = ({
	status,
	statusText,
	onToggleOledSaver,
	isLoopMode,
	countdown,
}) => {
	const getStatusColor = () => {
		switch (status) {
			case 'running':
				return Theme.colors.success;
			case 'waiting':
				return Theme.colors.warning;
			case 'error':
				return Theme.colors.error;
			default:
				return Theme.colors.primary;
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.titleRow}>
				<View style={styles.badgeOrb}>
					<Text style={styles.badgeOrbIcon}>⚡</Text>
				</View>
				<View style={styles.titleTextContainer}>
					<View style={styles.nameRow}>
						<Text style={styles.title}>AUTO-QUEST</Text>
						<View style={styles.proBadge}>
							<Text style={styles.proText}>PRO</Text>
						</View>
					</View>
					<Text style={styles.subtitle}>iOS Edition • 100% Native Safe</Text>
				</View>
				<TouchableOpacity
					style={styles.oledBtn}
					onPress={onToggleOledSaver}
					activeOpacity={0.7}
				>
					<Text style={styles.oledBtnIcon}>🌙</Text>
					<Text style={styles.oledBtnText}>Treo Pin</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.statusBar}>
				<View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
				<Text style={[styles.statusLabel, { color: getStatusColor() }]} numberOfLines={1}>
					{status === 'waiting' && countdown !== null
						? `Chờ lặp: còn ${countdown}s`
						: statusText}
				</Text>
				{isLoopMode && (
					<View style={styles.loopPill}>
						<Text style={styles.loopPillText}>AFK Loop ON</Text>
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: Theme.spacing.lg,
		paddingTop: Theme.spacing.sm,
		paddingBottom: Theme.spacing.md,
		backgroundColor: Theme.colors.background,
		borderBottomWidth: 1,
		borderBottomColor: Theme.colors.surfaceBorder,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: Theme.spacing.sm,
	},
	badgeOrb: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: Theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: Theme.spacing.sm,
	},
	badgeOrbIcon: {
		fontSize: 22,
	},
	titleTextContainer: {
		flex: 1,
	},
	nameRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	title: {
		fontSize: 18,
		fontWeight: '800',
		color: Theme.colors.text,
		letterSpacing: 0.5,
	},
	proBadge: {
		marginLeft: 6,
		backgroundColor: Theme.colors.primary,
		paddingHorizontal: 6,
		paddingVertical: 1,
		borderRadius: 6,
	},
	proText: {
		fontSize: 10,
		fontWeight: '900',
		color: '#000000',
	},
	subtitle: {
		fontSize: 11,
		color: Theme.colors.textSecondary,
		marginTop: 1,
	},
	oledBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: Theme.radius.pill,
	},
	oledBtnIcon: {
		fontSize: 13,
		marginRight: 4,
	},
	oledBtnText: {
		fontSize: 11,
		fontWeight: '600',
		color: Theme.colors.gold,
	},
	statusBar: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Theme.colors.surface,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		borderRadius: Theme.radius.sm,
		paddingHorizontal: Theme.spacing.md,
		paddingVertical: 6,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8,
	},
	statusLabel: {
		flex: 1,
		fontSize: 12,
		fontWeight: '600',
	},
	loopPill: {
		backgroundColor: Theme.colors.primaryGlow,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: Theme.radius.pill,
		borderWidth: 1,
		borderColor: Theme.colors.primary,
	},
	loopPillText: {
		fontSize: 10,
		fontWeight: '700',
		color: Theme.colors.primary,
	},
});
