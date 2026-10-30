import { Constants } from './constants';
import { fetch } from 'undici';
import type { ClientQuest } from './client';
import { SecurityGuard } from './security';

export class Utils extends null {
	public static makeHeaders(
		init: Record<string, string> | [string, string][] | undefined,
	) {
		let myHeaders = new Headers(init);
		const isAndroidRequest = myHeaders.get('AndroidRequest') === 'true';
		myHeaders.delete('AndroidRequest');
		myHeaders.set(
			'Authorization',
			myHeaders.get('Authorization')!.replace('Bot ', ''),
		);
		myHeaders.append('accept-language', 'en-US');
		myHeaders.append('x-debug-options', 'bugReporterEnabled');
		myHeaders.append('x-discord-locale', 'en-US');
		// Waves#140: timezone from the system, not a hardcoded Asia/Saigon.
		// The web identity already uses the browser timezone; the Node
		// reference layer should follow the same rule.
		try {
			myHeaders.append('x-discord-timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Saigon');
		} catch {
			myHeaders.append('x-discord-timezone', 'Asia/Saigon');
		}
		if (isAndroidRequest) {
			myHeaders = Utils.mergeHeaders(
				myHeaders,
				Utils.makeAndroidHeaders(true),
			);
		} else {
			myHeaders = Utils.mergeHeaders(
				myHeaders,
				Utils.makeDesktopHeaders(true, true),
			);
		}
		return myHeaders;
	}

	public static makeDesktopHeaders(
		withDiscordClientProperties = true,
		withOriginAndReferer = true,
	) {
		const myHeaders = new Headers();
		myHeaders.append('accept-language', 'vi');
		myHeaders.append('User-Agent', Constants.USER_AGENT);
		if (withOriginAndReferer) {
			myHeaders.append('origin', 'https://discord.com');
			myHeaders.append('referer', 'https://discord.com/channels/@me');
		}
		myHeaders.append('pragma', 'no-cache');
		myHeaders.append('priority', 'u=1, i');
		// Waves#140: sec-ch-ua must match the Chrome major in USER_AGENT
		// (148 at the time of writing). A hardcoded 138 while the UA
		// claimed 148 is exactly the kind of drift Discord risk-scoring
		// can notice. Derive it; do not hardcode a new number here.
		const chromeMajor =
			Constants.USER_AGENT.match(/Chrome\/(\d+)\./)?.[1] ?? '0';
		myHeaders.append(
			'sec-ch-ua',
			'"Not)A;Brand";v="8", "Chromium";v="' + chromeMajor + '"',
		);
		myHeaders.append('sec-ch-ua-mobile', '?0');
		myHeaders.append('sec-ch-ua-platform', '"Windows"');
		myHeaders.append('sec-fetch-dest', 'empty');
		myHeaders.append('sec-fetch-mode', 'cors');
		myHeaders.append('sec-fetch-site', 'same-origin');
		if (withDiscordClientProperties) {
			myHeaders.append(
				'x-super-properties',
				Buffer.from(JSON.stringify(Constants.Properties)).toString(
					'base64',
				),
			);
		}
		return myHeaders;
	}

	public static makeAndroidHeaders(withDiscordClientProperties = true) {
		const myHeaders = new Headers();
		myHeaders.append('accept-language', 'vi');
		myHeaders.append('User-Agent', Constants.ANDROID_USER_AGENT);
		if (withDiscordClientProperties) {
			myHeaders.append(
				'x-super-properties',
				Buffer.from(
					JSON.stringify(Constants.ANDROID_Properties),
				).toString('base64'),
			);
		}
		return myHeaders;
	}

	public static mergeHeaders(a: Headers, b: Headers) {
		const result = new Headers(a);
		b.forEach((value, key) => {
			result.set(key, value);
		});
		return result;
	}

	public static async getProxyTicket(
		applicationId: string,
		client: ClientQuest,
	): Promise<string> {
		const ticket = (await client.rest.post(
			`/applications/${applicationId}/proxy-tickets`,
			{
				body: {},
			},
		)) as {
			ticket: string;
			expires_at: string;
			application_id: string;
			user_id: string;
		};
		return ticket.ticket;
	}

	public static async getActivityReferrer(
		applicationId: string,
		client: ClientQuest,
	): Promise<string> {
		const proxyTicket = await Utils.getProxyTicket(applicationId, client);
		const referrerUrl = `https://${applicationId}.discordsays.com/`;
		SecurityGuard.assertSafeUrl(referrerUrl);

		const referrer = new URL(referrerUrl);
		referrer.searchParams.set('instance_id', 'example-cl-instance');
		referrer.searchParams.set('platform', 'desktop');
		referrer.searchParams.set('discord_proxy_ticket', proxyTicket);

		return referrer.toString();
	}

	public static getActivityHeaders(
		questId: string,
		authToken: string = '',
		activityReferrer?: string,
	): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-Discord-Quest-ID': questId,
		};
		if (activityReferrer) {
			headers.Referer = activityReferrer;
		}
		return headers;
	}

	public static async authorizeDiscordSays(
		applicationId: string,
		questId: string,
		authCode: string,
		client: ClientQuest,
	): Promise<{
		token: string | false;
		error: any;
		activityReferrer: string;
	}> {
		let error = null;
		const headers = Utils.makeDesktopHeaders(false, false);
		const activityReferrer = await Utils.getActivityReferrer(
			applicationId,
			client,
		);
		const discordSaysHeaders = Utils.getActivityHeaders(
			questId,
			'',
			activityReferrer,
		);
		for (const [key, value] of Object.entries(discordSaysHeaders)) {
			headers.append(key, value);
		}

		const targetUrl = `https://${applicationId}.discordsays.com/.proxy/acf/authorize`;
		SecurityGuard.assertSafeUrl(targetUrl);

		const token = await fetch(targetUrl, {
			body: JSON.stringify({ code: authCode }),
			method: 'POST',
			headers,
		})
			.then(
				(res) =>
					res.json() as any as {
						token: string;
					},
			)
			.then((data) => data.token)
			.catch((e) => {
				console.error('Lỗi xác thực với Discord Says:', e);
				error = e instanceof Error ? e.message : String(e);
				return '';
			});

		return { token, error, activityReferrer };
	}

	public static async progressDiscordSays(
		applicationId: string,
		questId: string,
		token: string,
		questTarget: number,
		activityReferrer: string,
	): Promise<{ success: boolean; error: any }> {
		let error = null;
		const headers = Utils.makeDesktopHeaders(false, false);
		const discordSaysHeaders = Utils.getActivityHeaders(
			questId,
			token,
			activityReferrer,
		);
		for (const [key, value] of Object.entries(discordSaysHeaders)) {
			headers.append(key, value);
		}

		const targetUrl = `https://${applicationId}.discordsays.com/.proxy/acf/quest/progress`;
		SecurityGuard.assertSafeUrl(targetUrl);

		const success = await fetch(targetUrl, {
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

	public static async updateLatestBuildVersion(): Promise<void> {
		try {
			const appUrl = 'https://discord.com/app';
			SecurityGuard.assertSafeUrl(appUrl);

			const response = await fetch(appUrl, {
				headers: { 'User-Agent': Constants.USER_AGENT },
			});
			if (!response.ok) {
				return;
			}
			const html = await response.text();
			let scripts = Array.from(
				html.match(/\/assets\/web.([a-f0-9]+)\.js/g) || [],
			);
			if (!scripts || scripts.length === 0) {
				return;
			}

			for (const scriptPath of scripts) {
				try {
					const assetUrl = `https://discord.com${scriptPath}`;
					SecurityGuard.assertSafeUrl(assetUrl);

					const assetResponse = await fetch(assetUrl, {
						headers: { 'User-Agent': Constants.USER_AGENT },
					});
					if (!assetResponse.ok) continue;
					const jsContent = await assetResponse.text();
					const match = jsContent.match(
						/buildNumber["\s:]+["\s]*(\d{5,7})/,
					);
					if (match) {
						const buildNumber = parseInt(match[1], 10);
						Constants.Properties.client_build_number = buildNumber;
						console.log(`[Hệ thống] Cập nhật Discord Build Number mới nhất: ${buildNumber}`);
						return;
					}
				} catch {
					continue;
				}
			}
		} catch {
			// Giữ build number mặc định an toàn
		}
	}
}
