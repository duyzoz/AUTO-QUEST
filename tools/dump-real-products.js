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
		'Content-Type': 'application/json',
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9178 Chrome/128.0.6613.186 Electron/32.2.7 Safari/537.36',
	};
	const out = {};
	for (const sku of ['1282820582408192061', '1489399523238477855']) {
		const r = await fetch('https://discord.com/api/v10/storefront/products/sku/' + sku, {
			headers: heads,
			signal: AbortSignal.timeout(12000),
		});
		out[sku] = { status: r.status, body: await r.json().catch(() => null) };
	}
	fs.writeFileSync(path.join(__dirname, '..', '.tmp', 'real-products.json'), JSON.stringify(out, null, 1));
	console.log('written .tmp/real-products.json');
	app.quit();
}
app.whenReady().then(main);
