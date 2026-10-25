/**
 * Waves 49b — kiểm tra product thật của effect sku 1282820582408192061
 * và frame sku 1489399523238477855 bằng TOKEN THẬT.
 */
'use strict';
const { app, safeStorage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.setPath('userData', path.join(process.env.APPDATA || app.getPath('appData'), 'AUTO-QUEST'));

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
	const j = async (u) => {
		const r = await fetch(u, { headers: heads, signal: AbortSignal.timeout(12000) });
		return { status: r.status, body: await r.json().catch(() => null) };
	};

	for (const sku of ['1282820582408192061', '1489399523238477855']) {
		const p = await j('https://discord.com/api/v10/storefront/products/sku/' + sku);
		console.log('\n===== PRODUCT ' + sku + ' (' + p.status + ') =====');
		const item = p.body?.items?.[0];
		if (!item) { console.log(JSON.stringify(p.body).slice(0, 500)); continue; }
		console.log('type=' + item.type + '  label=' + item.label + '  name=' + item.name);
		console.log('inner_width=' + item.inner_width + ' overflow_top=' + item.overflow_top +
			' overflow_bottom=' + item.overflow_bottom + ' overflow_horizontal=' + item.overflow_horizontal);
		console.log('items[0] keys = ' + Object.keys(item).join(','));
		console.log('tenant_metadata.collectibles = ' + JSON.stringify(item.tenant_metadata?.collectibles, null, 1));
		console.log('layers=' + JSON.stringify(item.layers, null, 1));
		console.log('FULL items[0] = ' + JSON.stringify(item).slice(0, 3000));
	}

	// Thử tải asset của effect
	console.log('\n===== EFFECT ASSET =====');
	const cdn = 'https://cdn.discordapp.com';
	for (const fmt of ['static', 'animated', 'video']) {
		const u = `${cdn}/media/v1/collectibles-shop/1282820582408192061/${fmt}`;
		const r = await fetch(u, { headers: heads, signal: AbortSignal.timeout(12000) }).catch((e) => ({ status: 'ERR:' + e.message }));
		console.log(u + '  -> ' + r.status + (r.headers ? '  ' + r.headers.get('content-type') + '  ' + r.headers.get('content-length') : ''));
	}

	console.log('\n[done]');
	app.quit();
}
app.whenReady().then(main);
