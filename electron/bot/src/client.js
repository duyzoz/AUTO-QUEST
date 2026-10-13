"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientQuest = void 0;
const core_1 = require("@discordjs/core");
const rest_1 = require("@discordjs/rest");
const ws_1 = require("@discordjs/ws");
const v10_1 = require("discord-api-types/v10");
const questManager_1 = require("./questManager");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const security_1 = require("./security");
async function makeRequest(url, init) {
    // Kiểm tra bảo mật: Chặn đứng mọi request nếu không phải Discord
    security_1.SecurityGuard.assertSafeUrl(url);
    if (init.headers) {
        init.headers = utils_1.Utils.makeHeaders(init.headers);
    }
    return rest_1.DefaultRestOptions.makeRequest(url, init);
}
const originalSend = ws_1.WebSocketShard.prototype.send;
ws_1.WebSocketShard.prototype.send = async function (payload) {
    if (payload.op === v10_1.GatewayOpcodes.Identify) {
        payload.d = {
            token: payload.d.token,
            properties: {
                ...constants_1.Constants.Properties,
                is_fast_connect: false,
                gateway_connect_reasons: 'AppSkeleton',
            },
            capabilities: 0,
            presence: payload.d.presence,
            compress: payload.d.compress,
            client_state: {
                guild_versions: {},
            },
        };
    }
    return originalSend.call(this, payload);
};
class ClientQuest extends core_1.Client {
    questManager = null;
    websocketManager;
    constructor(token) {
        if (!token) {
            throw new Error('Cần có token Discord để khởi tạo client.');
        }
        const rest = new rest_1.REST({
            version: '10',
            makeRequest,
            rejectOnRateLimit: (info) => {
                // Hủy nếu rate limit vượt quá 20 giây để không bị đơ app
                return info.retryAfter > 20000;
            },
        }).setToken(token);
        rest.on('rateLimited', (info) => {
            const sec = (info.retryAfter / 1000).toFixed(1);
            console.warn(`[Discord RateLimit] Đạt giới hạn tần suất yêu cầu: ${info.method} ${info.route}. Tự động chờ ${sec}s...`);
        });
        const gateway = new ws_1.WebSocketManager({
            token: token,
            intents: 0,
            rest,
            readyTimeout: 120_000,
        });
        gateway.fetchGatewayInformation = (_force) => {
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
        await utils_1.Utils.updateLatestBuildVersion();
        return this.websocketManager.connect();
    }
    destroy() {
        return this.websocketManager.destroy();
    }
    fetchQuests(fetchExcludedQuests = true) {
        return this.rest
            .get('/quests/@me')
            .then((response) => questManager_1.QuestManager.fromResponse(this, response, fetchExcludedQuests))
            .then((manager) => {
            this.questManager = manager;
            return manager;
        });
    }
}
exports.ClientQuest = ClientQuest;
