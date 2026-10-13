import React, { useState } from 'react';
import {
	Alert,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Theme } from './Theme';

export const TokenGuideCard: React.FC = () => {
	const [expanded, setExpanded] = useState(false);

	const scriptCode = `window.webpackChunkdiscord_app.push([[Symbol()],{},req=>{if(!req.c)return;for(let m of Object.values(req.c)){try{if(!m.exports||m.exports===window)continue;if(m.exports?.getToken)return copy(m.exports.getToken());for(let ex in m.exports){if(m.exports?.[ex]?.getToken&&m.exports[ex][Symbol.toStringTag]!=='IntlMessagesProxy')return copy(m.exports[ex].getToken());}}catch{}}}]);window.webpackChunkdiscord_app.pop();console.log('%c🎉 ĐÃ COPY TOKEN DISCORD THÀNH CÔNG! 🎉', 'color: #10b981; font-size: 22px; font-weight: bold; background: #000; padding: 10px; border-radius: 8px;');alert('🎉 ĐÃ COPY TOKEN DISCORD THÀNH CÔNG! Hãy dán vào AUTO-QUEST nhé!');`;

	const handleCopyScript = async () => {
		try {
			await Clipboard.setStringAsync(scriptCode);
			Alert.alert(
				'🎉 ĐÃ COPY SCRIPT THÀNH CÔNG!',
				'Script lấy token đã nằm trong bộ nhớ tạm!\n\n👉 Cách dùng trên điện thoại:\n1. Mở Safari/Chrome vào discord.com/app đăng nhập\n2. Mở Console (hoặc tạo Bookmark dán javascript:...) và dán lệnh vào chạy\n3. Quay lại app bấm DÁN là xong!',
			);
		} catch {
			Alert.alert('Lỗi', 'Không thể copy script.');
		}
	};

	return (
		<View style={styles.card}>
			<TouchableOpacity
				style={styles.header}
				onPress={() => setExpanded(!expanded)}
				activeOpacity={0.7}
			>
				<View style={styles.headerLeft}>
					<Text style={styles.headerIcon}>📱</Text>
					<Text style={styles.headerTitle}>Cách Lấy Token Trên Điện Thoại (iOS)</Text>
				</View>
				<Text style={styles.expandIcon}>{expanded ? '▲ Thu gọn' : '▼ Hướng dẫn'}</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.copyBtn}
				onPress={handleCopyScript}
				activeOpacity={0.8}
			>
				<Text style={styles.copyBtnIcon}>📋</Text>
				<Text style={styles.copyBtnText}>COPY SCRIPT LẤY TOKEN DISCORD</Text>
			</TouchableOpacity>

			{expanded && (
				<View style={styles.content}>
					<View style={styles.step}>
						<View style={styles.stepNum}>
							<Text style={styles.stepNumText}>1</Text>
						</View>
						<Text style={styles.stepText}>
							Mở <Text style={styles.bold}>Safari hoặc Chrome</Text> trên iPhone, truy cập{' '}
							<Text style={styles.code}>discord.com/app</Text> và đăng nhập nick của bạn.
						</Text>
					</View>

					<View style={styles.step}>
						<View style={styles.stepNum}>
							<Text style={styles.stepNumText}>2</Text>
						</View>
						<Text style={styles.stepText}>
							Bấm nút <Text style={styles.bold}>"COPY SCRIPT LẤY TOKEN"</Text> màu cam ở trên.
						</Text>
					</View>

					<View style={styles.step}>
						<View style={styles.stepNum}>
							<Text style={styles.stepNumText}>3</Text>
						</View>
						<Text style={styles.stepText}>
							Mở Console trên Web Inspector hoặc thanh địa chỉ: gõ{' '}
							<Text style={styles.code}>javascript:</Text> rồi dán script vào bấm Enter. Script sẽ tự trích xuất token vào Clipboard và hiện thông báo Popup!
						</Text>
					</View>

					<View style={styles.step}>
						<View style={styles.stepNum}>
							<Text style={styles.stepNumText}>4</Text>
						</View>
						<Text style={styles.stepText}>
							Quay lại app <Text style={styles.bold}>AUTO-QUEST PRO</Text>, bấm{' '}
							<Text style={styles.bold}>Dán</Text> rồi bấm{' '}
							<Text style={styles.bold}>Lưu Token</Text> là xong, app sẽ ghi nhớ mãi mãi!
						</Text>
					</View>

					<View style={styles.tipBox}>
						<Text style={styles.tipText}>
							💡 <Text style={styles.bold}>Mẹo TrollStore:</Text> App lưu token offline 100% trong máy bạn và chỉ kết nối trực tiếp đến Discord API, không hề gửi token ra bất kỳ server trung gian nào.
						</Text>
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
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: Theme.spacing.sm,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	headerIcon: {
		fontSize: 16,
		marginRight: 6,
	},
	headerTitle: {
		fontSize: 12,
		fontWeight: '700',
		color: Theme.colors.gold,
	},
	expandIcon: {
		fontSize: 11,
		fontWeight: '600',
		color: Theme.colors.textMuted,
	},
	copyBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Theme.colors.primary,
		paddingVertical: 10,
		borderRadius: Theme.radius.md,
		shadowColor: Theme.colors.primary,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	copyBtnIcon: {
		fontSize: 14,
		marginRight: 6,
	},
	copyBtnText: {
		fontSize: 12,
		fontWeight: '800',
		color: '#000000',
		letterSpacing: 0.3,
	},
	content: {
		marginTop: Theme.spacing.md,
		paddingTop: Theme.spacing.md,
		borderTopWidth: 1,
		borderTopColor: Theme.colors.surfaceBorder,
	},
	step: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: Theme.spacing.sm,
	},
	stepNum: {
		width: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: Theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: Theme.colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 8,
		marginTop: 2,
	},
	stepNumText: {
		fontSize: 10,
		fontWeight: '700',
		color: Theme.colors.primary,
	},
	stepText: {
		flex: 1,
		fontSize: 11,
		color: Theme.colors.textSecondary,
		lineHeight: 16,
	},
	bold: {
		fontWeight: '700',
		color: Theme.colors.text,
	},
	code: {
		color: Theme.colors.gold,
		fontFamily: 'Courier',
	},
	tipBox: {
		backgroundColor: Theme.colors.surfaceElevated,
		borderRadius: Theme.radius.sm,
		padding: Theme.spacing.sm,
		marginTop: Theme.spacing.xs,
		borderLeftWidth: 3,
		borderLeftColor: Theme.colors.gold,
	},
	tipText: {
		fontSize: 10,
		color: Theme.colors.textMuted,
		lineHeight: 14,
	},
});
