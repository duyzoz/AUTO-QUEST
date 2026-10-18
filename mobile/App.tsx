import React, { useEffect, useRef, useState } from 'react';
import {
	Alert,
	Dimensions,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { Header } from './src/components/Header';
import { TokenCard } from './src/components/TokenCard';
import { TokenGuideCard } from './src/components/TokenGuideCard';
import { StatCards } from './src/components/StatCards';
import { ControlBar } from './src/components/ControlBar';
import { QuestTabs } from './src/components/QuestTabs';
import { ConsoleLog } from './src/components/ConsoleLog';
import { OledSaverModal } from './src/components/OledSaverModal';
import { Theme } from './src/components/Theme';

import { DiscordApi } from './src/core/discordApi';
import { QuestEngine } from './src/core/questEngine';
import { LogEntry, QuestProgressItem, UserProfile } from './src/types';

const STORAGE_TOKEN_KEY = '@autoquest_token_v2';
const STORAGE_LOOP_KEY = '@autoquest_loop_key';
const STORAGE_INTERVAL_KEY = '@autoquest_interval_key';

export default function App() {
	const [token, setToken] = useState('');
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

	const [isRunning, setIsRunning] = useState(false);
	const [status, setStatus] = useState<'idle' | 'running' | 'waiting' | 'error'>('idle');
	const [statusText, setStatusText] = useState('Sẵn sàng làm nhiệm vụ');

	const [baseOrbs, setBaseOrbs] = useState<number | string>('--');
	const [bonusOrbs, setBonusOrbs] = useState(0);

	const [activeQuests, setActiveQuests] = useState<QuestProgressItem[]>([]);
	const [doneQuests, setDoneQuests] = useState<
		Array<{ id: string; name: string; orbs: number; rewardName: string; note?: string }>
	>([]);

	const [logs, setLogs] = useState<LogEntry[]>([]);

	const [isLoopMode, setIsLoopMode] = useState(false);
	const [loopInterval, setLoopInterval] = useState(30);
	const [countdown, setCountdown] = useState<number | null>(null);

	const [showOledSaver, setShowOledSaver] = useState(false);

	const engineRef = useRef<QuestEngine | null>(null);
	const countdownTimerRef = useRef<any>(null);
	const isLoopRef = useRef(isLoopMode);
	const isRunningRef = useRef(isRunning);

	isLoopRef.current = isLoopMode;
	isRunningRef.current = isRunning;

	const addLog = (text: string, type: LogEntry['type'] = 'info') => {
		const now = new Date();
		const time = `${String(now.getHours()).padStart(2, '0')}:${String(
			now.getMinutes(),
		).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
		const entry: LogEntry = {
			id: `${Date.now()}-${Math.random()}`,
			time,
			text,
			type,
		};
		setLogs((prev: LogEntry[]) => [...prev.slice(-120), entry]);
	};

	// Nạp cấu hình đã lưu
	useEffect(() => {
		(async () => {
			try {
				const savedToken = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
				if (savedToken) {
					setToken(savedToken);
					addLog('✓ Đã tải token đã lưu từ bộ nhớ máy', 'success');
				}
				const savedLoop = await AsyncStorage.getItem(STORAGE_LOOP_KEY);
				if (savedLoop !== null) {
					setIsLoopMode(savedLoop === 'true');
				}
				const savedInterval = await AsyncStorage.getItem(STORAGE_INTERVAL_KEY);
				if (savedInterval) {
					setLoopInterval(parseInt(savedInterval, 10) || 30);
				}
			} catch {}
		})();
	}, []);

	const handleSaveToken = async () => {
		if (!token.trim()) {
			Alert.alert('Cảnh báo', 'Vui lòng nhập hoặc dán token trước khi lưu!');
			return;
		}
		try {
			await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token.trim());
			addLog('💾 Đã lưu token thành công vào bộ nhớ máy.', 'success');
			Alert.alert('Thành công', 'Đã lưu token thành công! Lần sau vào app bạn sẽ không cần nhập lại.');
		} catch (err: any) {
			Alert.alert('Lỗi', 'Không thể lưu token: ' + err.message);
		}
	};

	const handleToggleLoopMode = async (val: boolean) => {
		setIsLoopMode(val);
		await AsyncStorage.setItem(STORAGE_LOOP_KEY, String(val)).catch(() => {});
	};

	const handleChangeInterval = async (val: number) => {
		setLoopInterval(val);
		await AsyncStorage.setItem(STORAGE_INTERVAL_KEY, String(val)).catch(() => {});
	};

	const handleStart = async () => {
		const cleanToken = token.trim();
		if (!cleanToken) {
			Alert.alert('Thiếu Token', 'Vui lòng dán Token Discord của bạn trước khi bắt đầu.');
			return;
		}

		setIsRunning(true);
		setStatus('running');
		setStatusText('Đang kiểm tra tài khoản Discord...');
		addLog('========================================');
		addLog('🚀 Bắt đầu phiên làm việc Discord AutoQuest...', 'info');

		// Kích hoạt giữ sáng màn hình
		activateKeepAwakeAsync().catch(() => {});

		try {
			const api = new DiscordApi(cleanToken);
			const me = await api.getCurrentUser();
			setUserProfile({
				id: me.id,
				username: me.username,
			});
			addLog(`✓ Xác thực thành công: @${me.username} (ID: ${me.id})`, 'success');
			setStatusText(`Đang xử lý nhiệm vụ cho @${me.username}`);
		} catch (err: any) {
			setIsRunning(false);
			setStatus('error');
			setStatusText('Token không hợp lệ hoặc lỗi mạng');
			addLog(`❌ Không thể xác thực Token: ${err.message}`, 'error');
			Alert.alert('Lỗi Token', `Không thể kết nối Discord:\n${err.message}`);
			deactivateKeepAwake();
			return;
		}

		runFullCycle();
	};

	const runFullCycle = async () => {
		const cleanToken = token.trim();
		setStatus('running');
		setStatusText('Đang quét và thực hiện nhiệm vụ...');

		const engine = new QuestEngine(cleanToken, {
			onLog: addLog,
			onQuestStart: (item: QuestProgressItem) => {
				setActiveQuests((prev: QuestProgressItem[]) => {
					const existing = prev.find((q: QuestProgressItem) => q.id === item.id);
					if (existing) {
						return prev.map((q: QuestProgressItem) => (q.id === item.id ? { ...q, ...item } : q));
					}
					return [...prev, item];
				});
			},
			onQuestProgress: (id: string, done: number, target: number) => {
				setActiveQuests((prev: QuestProgressItem[]) =>
					prev.map((q: QuestProgressItem) => {
						if (q.id === id) {
							const pct = target > 0 ? Math.round((done / target) * 100) : 0;
							return {
								...q,
								secondsDone: done,
								secondsNeeded: target,
								percent: pct,
								statusText: `${Math.floor(done / 60)}/${Math.ceil(target / 60)} phút`,
							};
						}
						return q;
					}),
				);
			},
			onQuestDone: (id: string, name: string, orbs: number, rewardName: string, note?: string) => {
				// Xóa khỏi active, thêm vào done
				setActiveQuests((prev: QuestProgressItem[]) => prev.filter((q: QuestProgressItem) => q.id !== id));
				setDoneQuests((prev: Array<{ id: string; name: string; orbs: number; rewardName: string; note?: string }>) => {
					if (prev.some((d) => d.id === id)) return prev;
					return [{ id, name, orbs, rewardName, note }, ...prev];
				});
			},
			onQuestSkip: (id: string, name: string, reason: string) => {
				setActiveQuests((prev: QuestProgressItem[]) => prev.filter((q: QuestProgressItem) => q.id !== id));
				setDoneQuests((prev: Array<{ id: string; name: string; orbs: number; rewardName: string; note?: string }>) => {
					if (prev.some((d) => d.id === id)) return prev;
					return [{ id, name, orbs: 0, rewardName: 'Bỏ qua', note: reason }, ...prev];
				});
			},
			onQuestError: (id: string, name: string, error: string) => {
				setActiveQuests((prev: QuestProgressItem[]) => prev.filter((q: QuestProgressItem) => q.id !== id));
				setDoneQuests((prev: Array<{ id: string; name: string; orbs: number; rewardName: string; note?: string }>) => {
					if (prev.some((d) => d.id === id)) return prev;
					return [{ id, name, orbs: 0, rewardName: 'Lỗi', note: error }, ...prev];
				});
			},
			onOrbBonus: (addedOrbs: number) => {
				setBonusOrbs((prev: number) => prev + addedOrbs);
			},
		});

		engineRef.current = engine;

		try {
			await engine.run();
		} catch (err: any) {
			addLog(`Lỗi xử lý nhiệm vụ: ${err.message}`, 'error');
		}

		if (!isRunningRef.current) return;

		// Kiểm tra chế độ lặp
		if (!isLoopRef.current) {
			setIsRunning(false);
			setStatus('idle');
			setStatusText('Đã hoàn thành toàn bộ nhiệm vụ');
			deactivateKeepAwake();
			addLog('✅ Tất cả nhiệm vụ hoàn tất! Tự động ngắt kết nối an toàn.', 'success');
		} else {
			// Vào chế độ chờ AFK
			setStatus('waiting');
			const waitSec = loopInterval * 60;
			setCountdown(waitSec);
			addLog(`💤 Bật chế độ Treo Orb AFK. Sẽ quét lại sau ${loopInterval} phút...`, 'info');

			let remaining = waitSec;
			countdownTimerRef.current = setInterval(() => {
				remaining -= 1;
				setCountdown(remaining);
				if (remaining <= 0) {
					clearInterval(countdownTimerRef.current);
					countdownTimerRef.current = null;
					if (isRunningRef.current) {
						addLog('🔄 Bắt đầu chu kỳ quét nhiệm vụ mới...', 'info');
						runFullCycle();
					}
				}
			}, 1000);
		}
	};

	const handleStop = () => {
		if (engineRef.current) {
			engineRef.current.stop();
			engineRef.current = null;
		}
		if (countdownTimerRef.current) {
			clearInterval(countdownTimerRef.current);
			countdownTimerRef.current = null;
		}
		setIsRunning(false);
		setStatus('idle');
		setStatusText('Đã dừng bởi người dùng');
		setCountdown(null);
		deactivateKeepAwake();
		addLog('⏹️ Đã dừng tiến trình AutoQuest.', 'warn');
	};

	const totalQuestsCount = activeQuests.length + doneQuests.length;

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="light-content" backgroundColor="#000000" />
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.keyboardContainer}
			>
				<Header
					status={status}
					statusText={statusText}
					onToggleOledSaver={() => setShowOledSaver(true)}
					isLoopMode={isLoopMode}
					countdown={countdown}
				/>

				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					{/* Token Input Card */}
					<TokenCard
						token={token}
						onTokenChange={setToken}
						onSaveToken={handleSaveToken}
						isRunning={isRunning}
						userProfile={userProfile}
					/>

					{/* Hướng dẫn lấy Token Mobile */}
					<TokenGuideCard />

					{/* 3 Thẻ thống kê */}
					<StatCards
						baseOrbs={baseOrbs}
						bonusOrbs={bonusOrbs}
						completedQuests={doneQuests.length}
						totalQuests={totalQuestsCount}
						isLoopMode={isLoopMode}
						loopInterval={loopInterval}
					/>

					{/* Thanh điều khiển Chạy / Dừng / Treo */}
					<ControlBar
						isRunning={isRunning}
						onStart={handleStart}
						onStop={handleStop}
						isLoopMode={isLoopMode}
						onToggleLoopMode={handleToggleLoopMode}
						loopInterval={loopInterval}
						onChangeInterval={handleChangeInterval}
					/>

					{/* 2 Tabs: Đang làm / Đã làm */}
					<QuestTabs activeQuests={activeQuests} doneQuests={doneQuests} />

					{/* Console Log */}
					<ConsoleLog logs={logs} onClear={() => setLogs([])} />
				</ScrollView>

				{/* OLED Battery Saver Modal */}
				<OledSaverModal
					visible={showOledSaver}
					onClose={() => setShowOledSaver(false)}
					bonusOrbs={bonusOrbs}
					statusText={statusText}
				/>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Theme.colors.background,
	},
	keyboardContainer: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 30,
	},
});
