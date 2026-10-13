import { Client, APIGatewayBotInfo } from '@discordjs/core';
import { RequestInit } from 'undici';
import { REST, DefaultRestOptions, ResponseLike } from '@discordjs/rest';
import { WebSocketManager, WebSocketShard } from '@discordjs/ws';
import { GatewaySendPayload, GatewayOpcodes } from 'discord-api-types/v10';
import { QuestManager } from './questManager';
import { AllQuestsResponse } from './interface';
import { Constants } from './constants';
import { Utils } from './utils';
import { SecurityGuard } from './security';

async function makeRequest(
	url: string,
	init: RequestInit,
): Promise<ResponseLike> {
	// Kiểm tra bảo mật: Chặn đứng mọi request nếu không phải Discord
	SecurityGuard.assertSafeUrl(url);

	if (init.headers) {
		init.headers = Utils.makeHeaders(init.headers as any);
	}
	return DefaultRestOptions.makeRequest(url, init);
}

const originalSend = WebSocketShard.prototype.send;
WebSocketShard.prototype.send = async function (payload: GatewaySendPayload) {
	if (payload.op === GatewayOpcodes.Identify) {
		payload.d = {
			token: payload.d.token,
			properties: {
				...Constants.Properties,
				is_fast_connect: false,
				gateway_connect_reasons: 'AppSkeleton',
			},
			capabilities: 0,
			presence: payload.d.presence,
			compress: payload.d.compress,
			client_state: {
				guild_versions: {},
			},
		} as any;
	}
	return originalSend.call(this, payload);
};

export class ClientQuest extends Client {
	public questManager: QuestManager | null = null;
	public websocketManager: WebSocketManager;

	constructor(token: string) {
		if (!token) {
			throw new Error('Cần có token Discord để khởi tạo client.');
		}
		const rest = new REST({
			version: '10',
			makeRequest,
			rejectOnRateLimit: (info: any) => {
				// Hủy nếu rate limit vượt quá 20 giây để không bị đơ app
				return info.retryAfter > 20000;
			},
		}).setToken(token);

		rest.on('rateLimited', (info: any) => {
			const sec = (info.retryAfter / 1000).toFixed(1);
			console.warn(
				`[Discord RateLimit] Đạt giới hạn tần suất yêu cầu: ${info.method} ${info.route}. Tự động chờ ${sec}s...`,
			);
		});

		const gateway = new WebSocketManager({
			token: token,
			intents: 0,
			rest,
			readyTimeout: 120_000,
		});

		gateway.fetchGatewayInformation = (
			_force?: boolean,
		): Promise<APIGatewayBotInfo> => {
			return Promise.resolve({
				url: 'wss://gateway.discord.gg',
				shards: 1,
				session_start_limit: {
					total: 1000,
					remaining: 1000,
					reset_after: 14400000,
					max_concurrency: 1,
				},
			});
		};

		super({ rest, gateway });
		this.websocketManager = gateway;
		gateway.on('error', () => null);
	}

	async connect() {
		await Utils.updateLatestBuildVersion();
		return this.websocketManager.connect();
	}

	destroy() {
		return this.websocketManager.destroy();
	}

	fetchQuests(fetchExcludedQuests = true) {
		return this.rest
			.get('/quests/@me')
			.then((response) =>
				QuestManager.fromResponse(
					this,
					response as AllQuestsResponse,
					fetchExcludedQuests,
				),
			)
			.then((manager) => {
				this.questManager = manager;
				return manager;
			});
	}
}
