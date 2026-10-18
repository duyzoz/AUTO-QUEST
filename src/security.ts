/**
 * Module bảo mật: Đảm bảo cắt đứt 100% mọi kết nối ra ngoài ngoài máy chủ chính thức của Discord.
 * Ngăn chặn tuyệt đối mọi hành vi rò rỉ token hoặc gửi dữ liệu tới server bên ngoài/webhook/telemetry.
 */

const ALLOWED_DOMAINS = [
	'discord.com',
	'gateway.discord.gg',
	'discordsays.com',
];

export class SecurityGuard {
	/**
	 * Kiểm tra xem URL đích có phải là server chính thức của Discord hay không.
	 * Nếu phát hiện kết nối tới bất kỳ IP hoặc domain nào khác, lập tức chặn đứng.
	 */
	public static isUrlAllowed(rawUrl: string): boolean {
		try {
			const parsed = new URL(rawUrl);
			const hostname = parsed.hostname.toLowerCase();

			// Kiểm tra domain hoặc subdomain của discord.com, discordsays.com, gateway.discord.gg
			const isAllowed = ALLOWED_DOMAINS.some(
				(allowed) => hostname === allowed || hostname.endsWith('.' + allowed)
			);

			return isAllowed;
		} catch {
			return false;
		}
	}

	/**
	 * Xác thực URL trước khi gửi request. Nếu vi phạm, quăng lỗi bảo mật.
	 */
	public static assertSafeUrl(rawUrl: string): void {
		if (!this.isUrlAllowed(rawUrl)) {
			const msg = `[BẢO MẬT] ĐÃ CHẶN KẾT NỐI KHẢ NGHI: "${rawUrl}". Chỉ cho phép kết nối trực tiếp đến máy chủ chính thức của Discord!`;
			console.error(msg);
			throw new Error(msg);
		}
	}

	/**
	 * Ẩn token trong chuỗi log để tránh vô tình in token thô ra màn hình/nhật ký.
	 */
	public static sanitizeLog(text: string, token?: string): string {
		if (!text) return text;
		let clean = text;
		if (token && token.length > 10) {
			clean = clean.split(token).join('***TOKEN_PROTECTED***');
		}
		// Che các chuỗi token dạng Discord: xxx.yyy.zzz
		clean = clean.replace(/([a-zA-Z0-9_-]{24,}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{25,})/g, '***TOKEN_PROTECTED***');
		return clean;
	}
}
