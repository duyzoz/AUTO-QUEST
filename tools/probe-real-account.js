/**
 * Waves 49b — ĐỌC SỰ THẬT từ tài khoản THẬT của bro.
 *
 * Vì sao: probe-wave49 chỉ dùng fixture STUB nên 18/18 OK mà app thật vẫn trắng
 * trơn. Phải hỏi thẳng Discord: /users/@me trả `collectibles` gì, /users/@me/profile
 * trả `profile_effect`/`theme_colors` gì, và storefront trả `layers` gì.
 *
 * Không đoán. In RAW JSON.
 */
'use strict';

const { app, safeStorage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

function configPath() {
	const dir = path.join(process.env.APPDATA || app.getPath('appData'), 'AUTO-QUEST');
	return path.join(dir, 'autoquest_config.json');
}

// safeStorage giải mã được ciphertext CHỈ khi cùng userData profile với app
// (main.js pin userData = %APPDATA%/AUTO-QUEST). Phải ghim y hệt trước whenReady.
app.setPath('userData', path.join(process.env.APPDATA || app.getPath('appData'), 'AUTO-QUEST'));

async function main() {
	const cfg = configPath();
	console.log('[cfg] ' + cfg + ' exists=' + fs.existsSync(cfg));
	if (!fs.existsSync(cfg)) return;

	const raw = fs.readFileSync(cfg, 'utf8');
	const obj = JSON.parse(raw);
	console.log('[cfg] keys = ' + Object.keys(obj).join(','));

	let token = null;
	if (obj.token && typeof obj.token === 'string') {
		token = obj.token;
	}
	if (!token && obj.tokenEnc) {
		try {
			const buf = Buffer.from(obj.tokenEnc, 'base64');
			token = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : null;
		} catch (e) {
			console.log('[cfg] decrypt ERR ' + e.message);
		}
	}
	if (!token || token.length < 20) {
		console.log('[cfg] NO TOKEN FOUND — in toàn bộ object (đã che):');
		console.log(JSON.stringify(obj, (k, v) => (typeof v === 'string' && v.length > 40 ? v.slice(0, 12) + '…' : v), 1));
		return;
	}
	console.log('[token] len=' + token.length + ' head=' + token.slice(0, 8) + '…');

	const heads = {
		Authorization: token,
		'Content-Type': 'application/json',
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9178 Chrome/128.0.6613.186 Electron/32.2.7 Safari/537.36',
	};

	const j = async (url) => {
		try {
			const r = await fetch(url, { headers: heads, signal: AbortSignal.timeout(12000) });
			const t = await r.text();
			let body = null;
			try {
				body = JSON.parse(t);
			} catch {
				body = t.slice(0, 300);
			}
			return { status: r.status, body };
		} catch (e) {
			return { status: 'ERR', body: e.message };
		}
	};

	// ---------- 1) /users/@me ----------
	const me = await j('https://discord.com/api/v10/users/@me');
	console.log('\n===== /users/@me  (' + me.status + ') =====');
	if (me.body && typeof me.body === 'object') {
		console.log('[me] id=' + me.body.id + ' username=' + me.body.username);
		console.log('[me] has collectibles? ' + Array.isArray(me.body.collectibles));
		console.log('[me] collectibles RAW = ' + JSON.stringify(me.body.collectibles, null, 1));
		console.log('[me] nameplate = ' + JSON.stringify(me.body.nameplate));
		console.log('[me] avatar_decoration_data = ' + JSON.stringify(me.body.avatar_decoration_data));
		console.log('[me] top-level keys = ' + Object.keys(me.body).join(','));
	} else {
		console.log('[me] ' + JSON.stringify(me.body));
	}

	// ---------- 2) /users/@me/profile ----------
	const prof = await j('https://discord.com/api/v10/users/@me/profile');
	console.log('\n===== /users/@me/profile  (' + prof.status + ') =====');
	if (prof.body && typeof prof.body === 'object') {
		console.log('[prof] top-level keys = ' + Object.keys(prof.body).join(','));
		console.log('[prof] profile_effect = ' + JSON.stringify(prof.body.profile_effect));
		console.log('[prof] profile_effect_id = ' + JSON.stringify(prof.body.profile_effect_id));
		console.log('[prof] theme_colors = ' + JSON.stringify(prof.body.theme_colors));
		console.log('[prof] banner = ' + JSON.stringify(prof.body.banner));
		console.log('[prof] user.collectibles = ' + JSON.stringify(prof.body.user?.collectibles, null, 1));
		console.log('[prof] collectibles = ' + JSON.stringify(prof.body.collectibles, null, 1));
	} else {
		console.log('[prof] ' + JSON.stringify(prof.body));
	}

	// ---------- 3) user profile (the real "full profile" endpoint) ----------
	const uid = me.body && me.body.id;
	if (uid) {
		const up = await j('https://discord.com/api/v10/users/' + uid + '/profile?with_mutual_guilds=false');
		console.log('\n===== /users/{id}/profile  (' + up.status + ') =====');
		if (up.body && typeof up.body === 'object') {
			console.log('[up] top-level keys = ' + Object.keys(up.body).join(','));
			console.log('[up] user.collectibles = ' + JSON.stringify(up.body.user?.collectibles, null, 1));
			console.log('[up] user.nameplate = ' + JSON.stringify(up.body.user?.nameplate));
			console.log('[up] profile_effect = ' + JSON.stringify(up.body.profile_effect));
			console.log('[up] theme_colors = ' + JSON.stringify(up.body.theme_colors));
			console.log('[up] user_profile keys = ' + JSON.stringify(Object.keys(up.body.user_profile || {})));
			console.log('[up] user_profile FULL = ' + JSON.stringify(up.body.user_profile, null, 1));
			console.log('[up] user FULL keys = ' + JSON.stringify(Object.keys(up.body.user || {})));
		} else {
			console.log('[up] ' + JSON.stringify(up.body));
		}
	}

	// ---------- 4) storefront product cho từng sku tìm được ----------
	const skus = new Set();
	const harvest = (o) => {
		if (!o) return;
		if (Array.isArray(o))
			for (const it of o) {
				if (it && typeof it === 'object' && (it.sku_id || it.skuId)) skus.add(it.sku_id || it.skuId);
			}
	};
	harvest(me.body?.collectibles);
	harvest(prof.body?.user?.collectibles);
	harvest(prof.body?.collectibles);

	console.log('\n===== SKUS tìm được: ' + [...skus].join(', ') + ' =====');
	for (const sku of skus) {
		const p = await j('https://discord.com/api/v10/storefront/products/sku/' + encodeURIComponent(sku));
		console.log('\n----- product ' + sku + ' (' + p.status + ') -----');
		const item = p.body?.items?.[0];
		if (item) {
			console.log('[prod] keys = ' + Object.keys(item).join(','));
			console.log('[prod] type = ' + item.type + ' | label = ' + item.label);
			console.log('[prod] inner_width=' + item.inner_width + ' overflow_top=' + item.overflow_top +
				' overflow_bottom=' + item.overflow_bottom + ' overflow_horizontal=' + item.overflow_horizontal);
			console.log('[prod] layers RAW = ' + JSON.stringify(item.layers, null, 1));
		} else {
			console.log('[prod] ' + JSON.stringify(p.body).slice(0, 400));
		}
	}

	console.log('\n[done]');
	app.quit();
}

app.whenReady().then(main);
