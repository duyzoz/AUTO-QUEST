import React, { useEffect, useState } from 'react';
import {
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

interface OledSaverModalProps {
	visible: boolean;
	onClose: () => void;
	bonusOrbs: number;
	statusText: string;
}

export const OledSaverModal: React.FC<OledSaverModalProps> = ({
	visible,
	onClose,
	bonusOrbs,
	statusText,
}) => {
	const [timeStr, setTimeStr] = useState('');

	useEffect(() => {
		if (!visible) return;
		const updateTime = () => {
			const now = new Date();
			const h = String(now.getHours()).padStart(2, '0');
			const m = String(now.getMinutes()).padStart(2, '0');
			setTimeStr(`${h}:${m}`);
		};
		updateTime();
		const timer = setInterval(updateTime, 5000);
		return () => clearInterval(timer);
	}, [visible]);

	return (
		<Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent>
			<TouchableOpacity
				style={styles.container}
				activeOpacity={1}
				onPress={onClose}
			>
				<View style={styles.centerBox}>
					<Text style={styles.clock}>{timeStr}</Text>
					<View style={styles.badge}>
						<Text style={styles.pulseDot}>●</Text>
						<Text style={styles.badgeText}>TREO ORB TIẾT KIỆM PIN</Text>
					</View>

					{bonusOrbs > 0 && (
						<Text style={styles.orbsText}>+{bonusOrbs} Orbs đã nhận</Text>
					)}

					<Text style={styles.statusText} numberOfLines={1}>
						{statusText}
					</Text>
				</View>

				<Text style={styles.hint}>Chạm bất kỳ đâu trên màn hình để mở khóa</Text>
			</TouchableOpacity>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	centerBox: {
		alignItems: 'center',
	},
	clock: {
		fontSize: 54,
		fontWeight: '200',
		color: '#444444',
		letterSpacing: 2,
		fontFamily: 'Courier',
	},
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#0d0d0d',
		borderWidth: 1,
		borderColor: '#1a1a1a',
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 999,
		marginTop: 12,
	},
	pulseDot: {
		color: '#10b981',
		fontSize: 10,
		marginRight: 6,
	},
	badgeText: {
		fontSize: 10,
		fontWeight: '700',
		color: '#666666',
		letterSpacing: 1,
	},
	orbsText: {
		fontSize: 15,
		fontWeight: '800',
		color: '#ff9e64',
		marginTop: 16,
	},
	statusText: {
		fontSize: 11,
		color: '#333333',
		marginTop: 6,
	},
	hint: {
		position: 'absolute',
		bottom: 30,
		fontSize: 10,
		color: '#262626',
		letterSpacing: 0.5,
	},
});
