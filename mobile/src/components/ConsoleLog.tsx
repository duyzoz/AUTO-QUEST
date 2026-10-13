import React, { useRef } from 'react';
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { LogEntry } from '../types';
import { Theme } from './Theme';

interface ConsoleLogProps {
	logs: LogEntry[];
	onClear: () => void;
}

export const ConsoleLog: React.FC<ConsoleLogProps> = ({ logs, onClear }) => {
	const scrollViewRef = useRef<ScrollView>(null);

	const getLogColor = (type: LogEntry['type']) => {
		switch (type) {
			case 'success':
				return Theme.colors.success;
			case 'warn':
				return Theme.colors.warning;
			case 'error':
				return Theme.colors.error;
			default:
				return Theme.colors.textSecondary;
		}
	};

	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<View style={styles.dots}>
						<View style={[styles.dot, { backgroundColor: '#ff5f56' }]} />
						<View style={[styles.dot, { backgroundColor: '#ffbd2e' }]} />
						<View style={[styles.dot, { backgroundColor: '#27c93f' }]} />
					</View>
					<Text style={styles.headerTitle}>Nhật ký hoạt động</Text>
				</View>
				<TouchableOpacity
					style={styles.clearBtn}
					onPress={onClear}
					activeOpacity={0.7}
				>
					<Text style={styles.clearBtnText}>Xóa log</Text>
				</TouchableOpacity>
			</View>

			<ScrollView
				ref={scrollViewRef}
				style={styles.logContainer}
				contentContainerStyle={styles.logContent}
				nestedScrollEnabled
				onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
			>
				{logs.length === 0 ? (
					<Text style={styles.emptyLog}>Chưa có thông tin ghi nhận...</Text>
				) : (
					logs.map((log) => (
						<View key={log.id} style={styles.logRow}>
							<Text style={styles.logTime}>[{log.time}]</Text>
							<Text style={[styles.logText, { color: getLogColor(log.type) }]}>
								{log.text}
							</Text>
						</View>
					))
				)}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: Theme.colors.consoleBg,
		borderRadius: Theme.radius.lg,
		borderWidth: 1,
		borderColor: Theme.colors.consoleBorder,
		marginHorizontal: Theme.spacing.lg,
		marginTop: Theme.spacing.md,
		marginBottom: Theme.spacing.xl,
		overflow: 'hidden',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: Theme.spacing.md,
		paddingVertical: 8,
		backgroundColor: Theme.colors.surface,
		borderBottomWidth: 1,
		borderBottomColor: Theme.colors.surfaceBorder,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	dots: {
		flexDirection: 'row',
		gap: 5,
		marginRight: 10,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	headerTitle: {
		fontSize: 11,
		fontWeight: '700',
		color: Theme.colors.textMuted,
		fontFamily: 'Courier',
	},
	clearBtn: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: Theme.radius.xs,
		backgroundColor: Theme.colors.surfaceElevated,
	},
	clearBtnText: {
		fontSize: 10,
		color: Theme.colors.textMuted,
	},
	logContainer: {
		height: 180,
		paddingHorizontal: Theme.spacing.md,
		paddingVertical: Theme.spacing.sm,
	},
	logContent: {
		paddingBottom: 8,
	},
	emptyLog: {
		fontSize: 11,
		color: Theme.colors.textMuted,
		fontStyle: 'italic',
		fontFamily: 'Courier',
	},
	logRow: {
		flexDirection: 'row',
		marginBottom: 3,
	},
	logTime: {
		fontSize: 10,
		color: Theme.colors.textMuted,
		marginRight: 6,
		fontFamily: 'Courier',
	},
	logText: {
		flex: 1,
		fontSize: 11,
		lineHeight: 15,
		fontFamily: 'Courier',
	},
});
