import { Constants } from './constants';
import { SecurityGuard } from './security';

export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: any;
	isMobile?: boolean;
}

export class DiscordApi {
	private readonly token: string;
	private readonly baseUrl = 'https://discord.com/api/v10';

	constructor(token: string) {
		this.token = token.trim().replace(/^"|"$/g, '').replace(/^Bot\s+/i, '');
	}

	public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		const fullUrl = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
		SecurityGuard.assertSafeUrl(fullUrl);

		const isMobile = options.isMobile ?? false;
		const method = options.method || 'GET';
		const headers: Record<string, string> = {
			Authorization: this.token,
			'User-Agent': isMobile ? Constants.USER_AGENT : Constants.DESKTOP_USER_AGENT,
			'x-super-properties': Constants.getSuperProperties(isMobile),
			'accept-language': 'vi,en-US;q=0.9',
			'x-discord-locale': 'vi',
			'x-discord-timezone': 'Asia/Ho_Chi_Minh',
		};

		if (!isMobile) {
			headers['origin'] = 'https://discord.com';
			headers['referer'] = 'https://discord.com/channels/@me';
		}

		if (options.body) {
			headers['Content-Type'] = 'application/json';
		}

		const response = await fetch(fullUrl, {
			method,
			headers,
			body: options.body ? JSON.stringify(options.body) : undefined,
		});

		if (response.status === 429) {
			const data = await response.json().catch(() => ({}));
			const retryAfter = Math.ceil((data.retry_after || 5) * 1000);
			throw new Error(`[RATE_LIMIT] Discord rate limit. Vui lòng thử lại sau ${Math.ceil(retryAfter / 1000)}s`);
		}

		if (!response.ok) {
			let errorMsg = `HTTP ${response.status} ${response.statusText}`;
			try {
				const errorData = await response.json();
				if (errorData.message) {
					errorMsg = errorData.message;
				} else if (errorData.code) {
					errorMsg = `Discord error code: ${errorData.code}`;
				}
			} catch {}
			throw new Error(errorMsg);
		}

		// If 204 No Content
		if (response.status === 204) {
			return null as any;
		}

		return (await response.json()) as T;
	}

	public async getCurrentUser() {
		return this.request<{
			id: string;
			username: string;
			discriminator: string;
			avatar: string | null;
			global_name?: string;
		}>('/users/@me');
	}

	public async getQuests() {
		return this.request<{
			quests: any[];
			excluded_quests?: { id: string }[];
			quest_enrollment_blocked_until?: string | null;
		}>('/quests/@me');
	}

	public async getQuestDetail(questId: string) {
		return this.request(`/quests/${questId}`);
	}

	public async enrollQuest(questId: string, isMobile = false, metadataRaw?: string | null, metadataSealed?: string | null) {
		return this.request(`/quests/${questId}/enroll`, {
			method: 'POST',
			isMobile,
			body: {
				location: isMobile ? 12 : 11,
				is_targeted: false,
				metadata_sealed: null,
				traffic_metadata_raw: metadataRaw || null,
				traffic_metadata_sealed: metadataSealed || null,
			},
		});
	}

	public async sendHeartbeat(questId: string, applicationId?: string, streamKey?: string, terminal = false) {
		const body: any = { terminal };
		if (applicationId) body.application_id = applicationId;
		if (streamKey) body.stream_key = streamKey;

		return this.request(`/quests/${questId}/heartbeat`, {
			method: 'POST',
			body,
		});
	}

	public async sendVideoProgress(questId: string, timestamp: number) {
		return this.request(`/quests/${questId}/video-progress`, {
			method: 'POST',
			body: { timestamp },
		});
	}

	public async sendVideoComplete(questId: string) {
		return this.request(`/quests/${questId}/video-complete`, {
			method: 'POST',
			body: {},
		});
	}

	public async claimReward(questId: string, platform = 0, metadataRaw?: string | null, metadataSealed?: string | null) {
		return this.request(`/quests/${questId}/claim-reward`, {
			method: 'POST',
			body: {
				platform,
				location: 11,
				is_targeted: false,
				metadata_raw: null,
				metadata_sealed: null,
				traffic_metadata_raw: metadataRaw || null,
				traffic_metadata_sealed: metadataSealed || null,
			},
		});
	}
}
