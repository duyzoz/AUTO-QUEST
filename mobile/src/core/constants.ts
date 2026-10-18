function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

function base64Encode(str: string): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	let output = '';
	for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || ((map = '='), i % 1); output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))) {
		charCode = str.charCodeAt((i += 3 / 4));
		if (charCode > 0xff) {
			throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
		}
		block = (block << 8) | charCode;
	}
	return output;
}

export class Constants {
	static readonly USER_AGENT =
		'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Discord/220.0';

	static readonly DESKTOP_USER_AGENT =
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9259 Chrome/148.0.7778.280 Electron/42.11.4 Safari/537.36';

	static readonly IOS_Properties = {
		os: 'iOS',
		browser: 'Discord iOS',
		device: 'iPhone9,4', // iPhone 7 Plus
		system_locale: 'vi-VN',
		has_client_mods: false,
		client_version: '220.0',
		release_channel: 'stable',
		device_vendor_id: generateUUID(),
		design_id: 2,
		browser_user_agent: '',
		browser_version: '',
		os_version: '15.8.8',
		client_build_number: 621195,
		client_event_source: null,
		client_launch_id: generateUUID(),
		client_app_state: 'active',
		client_heartbeat_session_id: generateUUID(),
	};

	static readonly DESKTOP_Properties = {
		os: 'Windows',
		browser: 'Discord Client',
		release_channel: 'stable',
		client_version: '1.0.9259',
		os_version: '10.0.26200',
		os_arch: 'x64',
		app_arch: 'x64',
		system_locale: 'en-US',
		has_client_mods: false,
		client_launch_id: generateUUID(),
		browser_user_agent: Constants.DESKTOP_USER_AGENT,
		browser_version: '42.11.4',
		os_sdk_version: '26200',
		client_build_number: 621195,
		native_build_number: 91497,
		client_event_source: null,
		launch_signature: generateUUID(),
		client_heartbeat_session_id: generateUUID(),
		client_app_state: 'focused',
	};

	static getSuperProperties(isMobile = false): string {
		const props = isMobile ? Constants.IOS_Properties : Constants.DESKTOP_Properties;
		return base64Encode(JSON.stringify(props));
	}
}
