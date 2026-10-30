"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
const node_crypto_1 = require("node:crypto");
// Waves#140 — REFERENCE ONLY in the web bundle (replaced by the AQIdentity
// shim in web/build-engine.js). Treat these numbers as placeholders.
class Constants extends null {
    static USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9259 Chrome/148.0.7778.280 Electron/42.11.4 Safari/537.36';
    static Properties = {
        os: 'Windows',
        browser: 'Discord Client',
        release_channel: 'stable',
        client_version: '1.0.9259',
        os_version: '10.0.26200',
        os_arch: 'x64',
        app_arch: 'x64',
        system_locale: 'en-US',
        has_client_mods: false,
        client_launch_id: (0, node_crypto_1.randomUUID)(),
        browser_user_agent: Constants.USER_AGENT,
        browser_version: '42.11.4',
        os_sdk_version: '26200',
        client_build_number: 621195,
        native_build_number: 91497,
        client_event_source: null,
        launch_signature: (0, node_crypto_1.randomUUID)(),
        client_heartbeat_session_id: (0, node_crypto_1.randomUUID)(),
        client_app_state: 'focused',
    };
    // Android Properties for mobile quests
    static ANDROID_USER_AGENT = 'Discord-Android/316011;RNA';
    static ANDROID_Properties = {
        os: 'Android',
        browser: 'Discord Android',
        device: 'b0q',
        system_locale: 'en-US',
        has_client_mods: false,
        client_version: '316.11 - rn',
        release_channel: 'googleRelease',
        device_vendor_id: (0, node_crypto_1.randomUUID)(),
        design_id: 2,
        browser_user_agent: '',
        browser_version: '',
        os_version: '28',
        client_build_number: 5169,
        client_event_source: null,
        client_launch_id: (0, node_crypto_1.randomUUID)(),
        // Waves#140: was a constant; now generated per run.
        launch_signature: (0, node_crypto_1.randomUUID)(),
        client_app_state: 'active',
        client_heartbeat_session_id: (0, node_crypto_1.randomUUID)(),
    };
}
exports.Constants = Constants;
