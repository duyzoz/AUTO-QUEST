export type QuestTaskType =
	| 'WATCH_VIDEO'
	| 'WATCH_VIDEO_ON_MOBILE'
	| 'PLAY_ON_DESKTOP'
	| 'PLAY_ON_XBOX'
	| 'PLAY_ON_PLAYSTATION'
	| 'PLAY_ACTIVITY'
	| 'STREAM_ON_DESKTOP'
	| 'ACHIEVEMENT_IN_ACTIVITY';

export interface QuestTaskConfig {
	target: number;
}

export interface QuestReward {
	orb_quantity?: number;
	sku_id?: string;
	asset?: string;
	asset_type?: number;
	messages?: {
		name?: string;
	};
}

export interface QuestData {
	id: string;
	config: {
		id: string;
		messages: {
			quest_name: string;
			game_title?: string;
		};
		application: {
			id: string;
			name: string;
			icon?: string;
		};
		task_config_v2: {
			tasks: Partial<Record<QuestTaskType, QuestTaskConfig>>;
		};
		rewards_config?: {
			rewards?: QuestReward[];
			platforms?: number[];
		};
		expires_at?: string;
		starts_at?: string;
	};
	user_status?: {
		enrolled_at?: string | null;
		completed_at?: string | null;
		claimed_at?: string | null;
		progress?: Partial<Record<QuestTaskType, { value?: number }>>;
	} | null;
	targeted_content?: number;
	preview?: boolean;
	traffic_metadata_raw?: string | null;
	traffic_metadata_sealed?: string | null;
}

export interface QuestProgressItem {
	id: string;
	name: string;
	appName: string;
	task: string;
	secondsDone: number;
	secondsNeeded: number;
	percent: number;
	orbs: number;
	rewardName: string;
	status: 'pending' | 'running' | 'completed' | 'skipped' | 'error';
	statusText: string;
}

export interface LogEntry {
	id: string;
	time: string;
	text: string;
	type: 'info' | 'success' | 'warn' | 'error';
}

export interface UserProfile {
	id: string;
	username: string;
	discriminator?: string;
	avatar?: string;
	avatarUrl?: string;
}
