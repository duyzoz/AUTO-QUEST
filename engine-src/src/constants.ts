import { randomUUID } from 'node:crypto';

// Waves#140 — REFERENCE ONLY. These numbers are NOT used for web requests:
// the web bundle replaces this module with web/identity.js (AQIdentity).
// Treat client_version / build numbers here as placeholders to be refreshed
// from a real client; do not copy them into web code.
export class Constants extends null {
	static readonly USER_AGENT =
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9259 Chrome/148.0.7778.280 Electron/42.11.4 Safari/537.36';

	static readonly Properties = {
		os: 'Windows',
		browser: 'Discord Client',
		release_channel: 'stable',
		client_version: '1.0.9259',
		os_version: '10.0.26200',
		os_arch: 'x64',
		app_arch: 'x64',
		system_locale: 'en-US',
		has_client_mods: false,
		client_launch_id: randomUUID(),
		browser_user_agent: Constants.USER_AGENT,
		browser_version: '42.11.4',
		os_sdk_version: '26200',
		client_build_number: 621195,
		native_build_number: 91497,
		client_event_source: null,
		launch_signature: randomUUID(),
		client_heartbeat_session_id: randomUUID(),
		client_app_state: 'focused',
	};

	// Android Properties for mobile quests
	static readonly ANDROID_USER_AGENT = 'Discord-Android/316011;RNA';
	static readonly ANDROID_Properties = {
		os: 'Android',
		browser: 'Discord Android',
		device: 'b0q',
		system_locale: 'en-US',
		has_client_mods: false,
		client_version: '316.11 - rn',
		release_channel: 'googleRelease',
		device_vendor_id: randomUUID(),
		design_id: 2,
		browser_user_agent: '',
		browser_version: '',
		os_version: '28',
		client_build_number: 5169,
		client_event_source: null,
		client_launch_id: randomUUID(),
		// Waves#140: was a constant shared by every account/session;
		// now generated per process run, like the other session ids.
		launch_signature: randomUUID(),
		client_app_state: 'active',
		client_heartbeat_session_id: randomUUID(),
	};
}
