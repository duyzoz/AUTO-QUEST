/**
 * SecurityGuard for iOS AutoQuest
 * Ngăn chặn tuyệt đối mọi hành vi rò rỉ token hay kết nối ngoài Discord
 */
export class SecurityGuard {
	private static readonly ALLOWED_HOSTS = new Set([
		'discord.com',
		'discordapp.com',
		'canary.discord.com',
		'ptb.discord.com',
		'cdn.discordapp.com',
		'gateway.discord.gg',
	]);

	public static assertSafeUrl(urlString: string): void {
		try {
			const parsed = new URL(urlString);
			if (parsed.protocol !== 'https:' && parsed.protocol !== 'wss:') {
				throw new Error(`[BẢO MẬT] Giao thức không an toàn: ${parsed.protocol}`);
			}
			const host = parsed.hostname.toLowerCase();
			if (!this.ALLOWED_HOSTS.has(host) && !host.endsWith('.discord.com') && !host.endsWith('.discordapp.com')) {
				throw new Error(`[BẢO MẬT] Bị chặn! URL không thuộc Discord: ${urlString}`);
			}
		} catch (err: any) {
			if (err.message && err.message.includes('[BẢO MẬT]')) {
				throw err;
			}
			throw new Error(`[BẢO MẬT] URL không hợp lệ hoặc bị chặn: ${urlString}`);
		}
	}
}
