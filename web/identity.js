'use strict';

/* Danh tính Discord dùng CHUNG cho bridge và engine trên web.
   UA/XSP lấy từ chính trình duyệt nên khớp tuyệt đối, không giả lập. */
(function (root) {
	function b64Utf8(str) {
		const bytes = new TextEncoder().encode(String(str));
		let bin = '';
		for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
		return btoa(bin);
	}

	function cleanToken(raw) {
		let t = String(raw || '').trim();
		if (!t) return '';
		t = t.replace(/^["'`]+|["'`]+$/g, '').trim();
		t = t.replace(/^(?:Bearer|Bot|Token)\s+/i, '').trim();
		const m = t.match(/[\w-]{20,}\.[\w-]{5,}\.[\w-]{20,}/);
		if (m) return m[0];
		return t.replace(/\s+/g, '');
	}

	const ua = navigator.userAgent || '';
	const chrome = ua.match(/Chrome\/(\d+)\./);
	const chromeMajor = chrome ? chrome[1] : '0';
	const platform = navigator.userAgentData && navigator.userAgentData.platform
		? navigator.userAgentData.platform
		: (ua.indexOf('Windows') >= 0 ? 'Windows' : ua.indexOf('Mac') >= 0 ? 'Mac OS X' : 'Linux');
	const platformVersion = navigator.userAgentData && navigator.userAgentData.platformVersion
		? navigator.userAgentData.platformVersion
		: '10.0.0';
	const locale = navigator.language || 'en-US';
	const timeZone = (function () {
		try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
	})();

	/* BUILD_NUMBER của Discord web tại thời điểm port (curl discord.com/app).
	   Không cần luôn mới — REST quest không xác thực build, chỉ cần "trông như client thật". */
	const WEB_BUILD_NUMBER = 653945;

	function sessionId() {
		try { return crypto.randomUUID(); } catch (e) {
			const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
			return h() + h() + '-' + h() + '-4' + h().slice(1) + '-a' + h().slice(1) + '-' + h() + h() + h();
		}
	}

	/* Mỗi token có installation id riêng (FNV-1a → UUID dạng ổn định).
	   Tránh dùng chung một id cho mọi account như bản Electron cũ. */
	function installationId(token) {
		let h1 = 0x811c9dc5, h2 = 0x01000193;
		const s = String(token || '');
		for (let i = 0; i < s.length; i++) {
			h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 0x01000193) >>> 0;
			h2 ^= s.charCodeAt((i * 7 + 3) % (s.length || 1)); h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
		}
		const a = h1.toString(16).padStart(8, '0');
		const b = h2.toString(16).padStart(8, '0');
		const c = (h1 ^ 0x9e3779b9).toString(16).padStart(8, '0');
		const d = (h2 ^ 0x7f4a7c15).toString(16).padStart(8, '0');
		return a + '-' + b.slice(0, 4) + '-4' + b.slice(4, 7) + '-a' + c.slice(0, 3) + '-' + c.slice(3) + d.slice(0, 4);
	}

	const SESSION_HEARTBEAT = sessionId();
	const SESSION_LAUNCH = sessionId();

	function superProperties(browserVersion) {
		return {
			os: platform,
			browser: 'Chrome',
			release_channel: 'stable',
			client_version: '0.0.0',
			os_version: platformVersion,
			os_arch: 'x64',
			app_arch: 'x64',
			system_locale: locale,
			has_client_mods: false,
			browser_user_agent: ua,
			browser_version: browserVersion,
			client_build_number: WEB_BUILD_NUMBER,
			client_event_source: null,
		};
	}

	const XSP = b64Utf8(JSON.stringify(superProperties(chromeMajor + '.0.0.0')));
	const ANDROID_PROPS = {
		os: 'Android',
		browser: 'Discord Android',
		device: 'b0q',
		system_locale: locale,
		has_client_mods: false,
		client_version: '316.11 - rn',
		release_channel: 'googleRelease',
		device_vendor_id: installationId('android-device'),
		design_id: 2,
		browser_user_agent: 'Discord-Android/316011;RNA',
		browser_version: '',
		os_version: '28',
		client_build_number: 5169,
		client_event_source: null,
		client_launch_id: SESSION_LAUNCH,
		launch_signature: '1771754995045142953',
		client_app_state: 'active',
		client_heartbeat_session_id: SESSION_HEARTBEAT,
	};

	const ANDROID_XSP = b64Utf8(JSON.stringify(ANDROID_PROPS));

	function headers(token, opts) {
		opts = opts || {};
		const h = {
			Authorization: token,
			'X-Super-Properties': opts.android ? ANDROID_XSP : XSP,
			'X-Discord-Locale': locale,
			'X-Discord-Timezone': timeZone,
			'X-Installation-Id': installationId(token),
			'X-Debug-Options': 'bugReporterEnabled',
			Accept: '*/*',
			'Accept-Language': locale + ',en;q=0.9',
		};
		if (opts.android) {
			h['Accept-Language'] = 'en-US';
			h['User-Agent'] = 'Discord-Android/316011;RNA';
		}
		if (opts.json) h['Content-Type'] = 'application/json';
		if (opts.questRoute) h.Referer = 'https://discord.com/quest-home';
		return h;
	}

	function timeoutSignal(ms) {
		try { return AbortSignal.timeout(ms); } catch (e) {
			const c = new AbortController();
			setTimeout(() => c.abort(new Error('timeout')), ms);
			return c.signal;
		}
	}

	root.AQIdentity = {
		cleanToken: cleanToken,
		headers: headers,
		superProperties: superProperties,
		androidProperties: function () { return JSON.parse(JSON.stringify(ANDROID_PROPS)); },
		timeoutSignal: timeoutSignal,
		base64: b64Utf8,
		installationId: installationId,
		userAgent: ua,
		sessionHeartbeatId: SESSION_HEARTBEAT,
		sessionLaunchId: SESSION_LAUNCH,
	};
})(typeof window !== 'undefined' ? window : self);
