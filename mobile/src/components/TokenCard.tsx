import React, { useState } from 'react';
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Theme } from './Theme';

interface TokenCardProps {
	token: string;
	onTokenChange: (val: string) => void;
	onSaveToken: () => void;
	isRunning: boolean;
	userProfile: { username?: string; id?: string } | null;
}

export const TokenCard: React.FC<TokenCardProps> = ({
	token,
	onTokenChange,
	onSaveToken,
	isRunning,
	userProfile,
}) => {
	const [secureText, setSecureText] = useState(true);

	const handlePaste = async () => {
		try {
			const text = await Clipboard.getStringAsync();
			if (text && text.trim()) {
				const cleanToken = text.trim().replace(/^"|"$/g, '');
				onTokenChange(cleanToken);
				Alert.alert('Thành công', 'Đã dán token từ bộ nhớ tạm!');
			} else {
				Alert.alert('Thông báo', 'Bộ nhớ tạm không có nội dung.');
			}
		} catch (err: any) {
			Alert.alert('Lỗi', 'Không thể truy cập bộ nhớ tạm.');
		}
	};

	const handleClear = () => {
		onTokenChange('');
	};

	return (
		<View style={styles.card}>
			<View style={styles.headerRow}>
				<Text style={styles.headerTitle}>🔑 Token Tài Khoản Discord</Text>
				{userProfile?.username ? (
					<View style={styles.userBadge}>
						<Text style={styles.userBadgeText}>@{userProfile.username}</Text>
					</View>
				) : null}
			</View>

			<View style={styles.inputRow}>
				<TextInput
					style={styles.input}
					value={token}
					onChangeText={onTokenChange}
					placeholder="Dán token Discord của bạn vào đây..."
					placeholderTextColor={Theme.colors.textMuted}
					secureTextEntry={secureText}
					autoCapitalize="none"
					autoCorrect={false}
					editable={!isRunning}
				/>
				<TouchableOpacity
					style={styles.eyeBtn}
					onPress={() => setSecureText(!secureText)}
					activeOpacity={0.7}
				>
					<Text style={styles.eyeIcon}>{secureText ? '👁️' : '🔒'}</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.actionRow}>
				<TouchableOpacity
					style={[styles.btn, styles.btnPaste]}
					onPress={handlePaste}
					disabled={isRunning}
					activeOpacity={0.7}
				>
					<Text style={styles.btnIcon}>📋</Text>
					<Text style={styles.btnText}>Dán</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.btn, styles.btnSave]}
					onPress={onSaveToken}
					disabled={isRunning}
					activeOpacity={0.7}
				>
					<Text style={styles.btnIcon}>💾</Text>
					<Text style={[styles.btnText, styles.btnSaveText]}>Lưu Token</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.btn, styles.btnClear]}
					onPress={handleClear}
					disabled={isRunning}
					activeOpacity={0.7}
				>
					<Text style={styles.btnIcon}>✕</Text>
					<Text style={[styles.btnText, styles.btnClearText]}>Xóa</Text>
				</TouchableOpacity>
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
		padding: Theme.spacing.md,
		marginHorizontal: Theme.spacing.lg,
		marginTop: Theme.spacing.md,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: Theme.spacing.sm,
	},
	headerTitle: {
		fontSize: 13,
		fontWeight: '700',
		color: Theme.colors.text,
	},
	userBadge: {
		backgroundColor: Theme.colors.successGlow,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: Theme.radius.pill,
		borderWidth: 1,
		borderColor: Theme.colors.success,
	},
	userBadgeText: {
		fontSize: 11,
		fontWeight: '700',
		color: Theme.colors.success,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Theme.colors.background,
		borderRadius: Theme.radius.md,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
		marginBottom: Theme.spacing.sm,
	},
	input: {
		flex: 1,
		paddingHorizontal: Theme.spacing.md,
		paddingVertical: 10,
		fontSize: 13,
		color: Theme.colors.text,
	},
	eyeBtn: {
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	eyeIcon: {
		fontSize: 16,
	},
	actionRow: {
		flexDirection: 'row',
		gap: 8,
	},
	btn: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 9,
		borderRadius: Theme.radius.md,
		backgroundColor: Theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: Theme.colors.surfaceBorder,
	},
	btnPaste: {
		borderColor: Theme.colors.surfaceBorder,
	},
	btnSave: {
		backgroundColor: Theme.colors.primaryGlow,
		borderColor: Theme.colors.primary,
	},
	btnClear: {
		flex: 0.6,
		borderColor: Theme.colors.surfaceBorder,
	},
	btnIcon: {
		fontSize: 13,
		marginRight: 4,
	},
	btnText: {
		fontSize: 12,
		fontWeight: '600',
		color: Theme.colors.text,
	},
	btnSaveText: {
		color: Theme.colors.primary,
		fontWeight: '700',
	},
	btnClearText: {
		color: Theme.colors.textMuted,
	},
});
