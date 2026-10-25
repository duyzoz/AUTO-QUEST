/**
 * Waves 49b — TẢI CSS THẬT chứa `custom-profile-frame` từ Discord.
 * Đây là mảnh cuối cùng quyết định HÌNH HỌC khung. Không đoán được nữa.
 */
'use strict';
const { app, safeStorage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
app.setPath('userData', path.join(process.env.APPDATA, 'AUTO-QUEST'));

async function main() {
	const cfg = path.join(process.env.APPDATA, 'AUTO-QUEST', 'autoquest_config.json');
	const obj = JSON.parse(fs.readFileSync(cfg, 'utf8'));
	const token = safeStorage.decryptString(Buffer.from(obj.tokenEnc, 'base64'));
	const heads = {
		Authorization: token,
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9178 Chrome/128.0.6613.186 Electron/32.2.7 Safari/537.36',
	};

	// 1) lấy index HTML của app Discord để biết danh sách chunk
	const ctlRes = await fetch('https://discord.com/app', { headers: heads, signal: AbortSignal.timeout(15000) }).catch((e) => null);
	let html = '';
	if (ctlRes && ctlRes.ok) html = await ctlRes.text();
	console.log('/app status', ctlRes && ctlRes.status, 'len', html.length);

	// 2) tìm các URL css trong HTML
	const cssUrls = [...new Set([...html.matchAll(/\/assets\/[0-9]+\.[0-9a-f]{16}\.css/g)].map((m) => m[0]))];
	console.log('css urls in html:', cssUrls.length);

	// 3) thử tải từng css và grep
	const base = 'https://discord.com';
	let found = 0;
	const outDir = path.join(__dirname, '..', '.tmp', 'framecss');
	fs.mkdirSync(outDir, { recursive: true });
	for (const u of cssUrls.slice(0, 400)) {
		try {
			const r = await fetch(base + u, { headers: heads, signal: AbortSignal.timeout(10000) });
			if (!r.ok) continue;
			const t = await r.text();
			if (t.includes('custom-profile-frame')) {
				console.log('>>> HIT', u, 'len', t.length);
				fs.writeFileSync(path.join(outDir, u.split('/').pop()), t);
				found += 1;
			}
		} catch {
			/* ignore */
		}
	}
	console.log('found css files with frame rules:', found);
	app.quit();
}
app.whenReady().then(main);
