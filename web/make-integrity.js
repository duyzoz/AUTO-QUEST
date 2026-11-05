'use strict';

/**
 * WAVE#127/#130 — Tạo `integrity.json` (SHA-256 từng tệp) cho bản dev và bản
 * đóng gói. Renderer tải tệp này rồi tự băm lại các tệp đang phục vụ để phát
 * hiện chỉnh sửa ngoài ý muốn. KHÔNG chứa token, không ký số.
 *
 *   node web/make-integrity.js --dev   → web/app/integrity.json
 *   node web/make-integrity.js         → web-dist/integrity.json (nếu có)
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'web', 'app');
const OUT = path.join(ROOT, 'web-dist');

const FILES = [
	'index.html',
	'renderer.js',
	'styles.css',
	'mobile.css',
	'fonts.css',
	'manifest.webmanifest',
	'sw.js',
	'web/identity.js',
	'web/display-name-style.js',
	'web/bridge.js',
	'web/engine-worker.js',
	'web/engine-bundle.js',
];

function appVersion() {
	try {
		const src = fs.readFileSync(path.join(APP, 'renderer.js'), 'utf8');
		const match = src.match(/const\s+APP_VERSION\s*=\s*'([^']+)'/);
		if (match) return match[1];
	} catch {
		/* ignore */
	}
	return '0.0.0';
}

function sha256B64(file) {
	const bytes = fs.readFileSync(file);
	return crypto.createHash('sha256').update(bytes).digest('base64');
}

function manifestFor(resolve) {
	const files = {};
	for (const rel of FILES) {
		const file = resolve(rel);
		if (!file || !fs.existsSync(file)) continue;
		files[rel] = sha256B64(file);
	}
	return {
		schema: 1,
		version: appVersion(),
		createdAt: new Date().toISOString(),
		files,
	};
}

function writeManifest(root, resolve) {
	const manifest = manifestFor(resolve);
	fs.mkdirSync(root, { recursive: true });
	fs.writeFileSync(path.join(root, 'integrity.json'), JSON.stringify(manifest, null, 2) + '\n');
	return manifest;
}

function devManifest() {
	return writeManifest(APP, (rel) =>
		rel.startsWith('web/') ? path.join(ROOT, rel) : path.join(APP, rel),
	);
}

function distManifest() {
	return writeManifest(OUT, (rel) => path.join(OUT, rel));
}

module.exports = { devManifest, distManifest, FILES };

if (require.main === module) {
	const dev = process.argv.includes('--dev');
	if (dev) {
		const manifest = devManifest();
		console.log(`integrity.json (dev): ${Object.keys(manifest.files).length} tệp · v${manifest.version}`);
	} else if (fs.existsSync(OUT)) {
		const manifest = distManifest();
		console.log(`integrity.json (web-dist): ${Object.keys(manifest.files).length} tệp · v${manifest.version}`);
	} else {
		const manifest = devManifest();
		console.log(`integrity.json (dev): ${Object.keys(manifest.files).length} tệp · v${manifest.version}`);
	}
}
