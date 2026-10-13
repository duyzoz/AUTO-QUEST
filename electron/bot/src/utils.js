"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const constants_1 = require("./constants");
const undici_1 = require("undici");
const security_1 = require("./security");
class Utils extends null {
    static makeHeaders(init) {
        let myHeaders = new Headers(init);
        const isAndroidRequest = myHeaders.get('AndroidRequest') === 'true';
        myHeaders.delete('AndroidRequest');
        myHeaders.set('Authorization', myHeaders.get('Authorization').replace('Bot ', ''));
        myHeaders.append('accept-language', 'en-US');
        myHeaders.append('x-debug-options', 'bugReporterEnabled');
        myHeaders.append('x-discord-locale', 'en-US');
        myHeaders.append('x-discord-timezone', 'Asia/Saigon');
        if (isAndroidRequest) {
            myHeaders = Utils.mergeHeaders(myHeaders, Utils.makeAndroidHeaders(true));
        }
        else {
            myHeaders = Utils.mergeHeaders(myHeaders, Utils.makeDesktopHeaders(true, true));
        }
        return myHeaders;
    }
    static makeDesktopHeaders(withDiscordClientProperties = true, withOriginAndReferer = true) {
        const myHeaders = new Headers();
        myHeaders.append('accept-language', 'vi');
        myHeaders.append('User-Agent', constants_1.Constants.USER_AGENT);
        if (withOriginAndReferer) {
            myHeaders.append('origin', 'https://discord.com');
            myHeaders.append('referer', 'https://discord.com/channels/@me');
        }
        myHeaders.append('pragma', 'no-cache');
        myHeaders.append('priority', 'u=1, i');
        myHeaders.append('sec-ch-ua', '"Not)A;Brand";v="8", "Chromium";v="138"');
        myHeaders.append('sec-ch-ua-mobile', '?0');
        myHeaders.append('sec-ch-ua-platform', '"Windows"');
        myHeaders.append('sec-fetch-dest', 'empty');
        myHeaders.append('sec-fetch-mode', 'cors');
        myHeaders.append('sec-fetch-site', 'same-origin');
        if (withDiscordClientProperties) {
            myHeaders.append('x-super-properties', Buffer.from(JSON.stringify(constants_1.Constants.Properties)).toString('base64'));
        }
        return myHeaders;
    }
    static makeAndroidHeaders(withDiscordClientProperties = true) {
        const myHeaders = new Headers();
        myHeaders.append('accept-language', 'vi');
        myHeaders.append('User-Agent', constants_1.Constants.ANDROID_USER_AGENT);
        if (withDiscordClientProperties) {
            myHeaders.append('x-super-properties', Buffer.from(JSON.stringify(constants_1.Constants.ANDROID_Properties)).toString('base64'));
        }
        return myHeaders;
    }
    static mergeHeaders(a, b) {
        const result = new Headers(a);
        b.forEach((value, key) => {
            result.set(key, value);
        });
        return result;
    }
    static async getProxyTicket(applicationId, client) {
        const ticket = (await client.rest.post(`/applications/${applicationId}/proxy-tickets`, {
            body: {},
        }));
        return ticket.ticket;
    }
    static async getActivityReferrer(applicationId, client) {
        const proxyTicket = await Utils.getProxyTicket(applicationId, client);
        const referrerUrl = `https://${applicationId}.discordsays.com/`;
        security_1.SecurityGuard.assertSafeUrl(referrerUrl);
        const referrer = new URL(referrerUrl);
        referrer.searchParams.set('instance_id', 'example-cl-instance');
        referrer.searchParams.set('platform', 'desktop');
        referrer.searchParams.set('discord_proxy_ticket', proxyTicket);
        return referrer.toString();
    }
    static getActivityHeaders(questId, authToken = '', activityReferrer) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken,
            'X-Discord-Quest-ID': questId,
        };
        if (activityReferrer) {
            headers.Referer = activityReferrer;
        }
        return headers;
    }
    static async authorizeDiscordSays(applicationId, questId, authCode, client) {
        let error = null;
        const headers = Utils.makeDesktopHeaders(false, false);
        const activityReferrer = await Utils.getActivityReferrer(applicationId, client);
        const discordSaysHeaders = Utils.getActivityHeaders(questId, '', activityReferrer);
        for (const [key, value] of Object.entries(discordSaysHeaders)) {
            headers.append(key, value);
        }
        const targetUrl = `https://${applicationId}.discordsays.com/.proxy/acf/authorize`;
        security_1.SecurityGuard.assertSafeUrl(targetUrl);
        const token = await (0, undici_1.fetch)(targetUrl, {
            body: JSON.stringify({ code: authCode }),
            method: 'POST',
            headers,
        })
            .then((res) => res.json())
            .then((data) => data.token)
            .catch((e) => {
            console.error('Lỗi xác thực với Discord Says:', e);
            error = e instanceof Error ? e.message : String(e);
            return '';
        });
        return { token, error, activityReferrer };
    }
    static async progressDiscordSays(applicationId, questId, token, questTarget, activityReferrer) {
        let error = null;
        const headers = Utils.makeDesktopHeaders(false, false);
        const discordSaysHeaders = Utils.getActivityHeaders(questId, token, activityReferrer);
        for (const [key, value] of Object.entries(discordSaysHeaders)) {
            headers.append(key, value);
        }
        const targetUrl = `https://${applicationId}.discordsays.com/.proxy/acf/quest/progress`;
        security_1.SecurityGuard.assertSafeUrl(targetUrl);
        const success = await (0, undici_1.fetch)(targetUrl, {
            headers,
            body: JSON.stringify({ progress: questTarget }),
            method: 'POST',
        })
            .then((res) => res.ok)
            .catch((e) => {
            error = e instanceof Error ? e.message : String(e);
            return false;
        });
        return { success, error };
    }
    static async updateLatestBuildVersion() {
        try {
            const appUrl = 'https://discord.com/app';
            security_1.SecurityGuard.assertSafeUrl(appUrl);
            const response = await (0, undici_1.fetch)(appUrl, {
                headers: { 'User-Agent': constants_1.Constants.USER_AGENT },
            });
            if (!response.ok) {
                return;
            }
            const html = await response.text();
            let scripts = Array.from(html.match(/\/assets\/web.([a-f0-9]+)\.js/g) || []);
            if (!scripts || scripts.length === 0) {
                return;
            }
            for (const scriptPath of scripts) {
                try {
                    const assetUrl = `https://discord.com${scriptPath}`;
                    security_1.SecurityGuard.assertSafeUrl(assetUrl);
                    const assetResponse = await (0, undici_1.fetch)(assetUrl, {
                        headers: { 'User-Agent': constants_1.Constants.USER_AGENT },
                    });
                    if (!assetResponse.ok)
                        continue;
                    const jsContent = await assetResponse.text();
                    const match = jsContent.match(/buildNumber["\s:]+["\s]*(\d{5,7})/);
                    if (match) {
                        const buildNumber = parseInt(match[1], 10);
                        constants_1.Constants.Properties.client_build_number = buildNumber;
                        console.log(`[Hệ thống] Cập nhật Discord Build Number mới nhất: ${buildNumber}`);
                        return;
                    }
                }
                catch {
                    continue;
                }
            }
        }
        catch {
            // Giữ build number mặc định an toàn
        }
    }
}
exports.Utils = Utils;
