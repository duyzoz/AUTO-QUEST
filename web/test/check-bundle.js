'use strict';
/**
 * Waves#139 — bundle freshness check (no network, no token).
 *
 * The committed web/engine-bundle.js must match a fresh build from
 * web/engine sources. If a source file in web/engine/ is edited without
 * regenerating the bundle, the shipped app silently runs the old engine.
 *
 * How it works: back up the committed bundle, run web/build-engine.js,
 * compare the fresh output with the backup, then restore the backup.
 * Exit 0 only when they are identical. It never leaves a regenerated
 * bundle behind on failure — run `npm run build:engine` yourself to fix it.
 *
 * Run: node web/test/check-bundle.js  (also run in CI, see .github/workflows/web-ci.yml)
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const BUNDLE = path.join(ROOT, 'web', 'engine-bundle.js');
const BUILDER = path.join(ROOT, 'web', 'build-engine.js');

function main() {
	if (!fs.existsSync(BUNDLE)) {
		console.error('FAIL: web/engine-bundle.js is missing — run: npm run build:engine');
		process.exit(1);
	}
	const committed = fs.readFileSync(BUNDLE, 'utf8');
	try {
		execFileSync(process.execPath, [BUILDER], { cwd: ROOT, stdio: 'pipe' });
	} catch (err) {
		fs.writeFileSync(BUNDLE, committed);
		console.error('FAIL: web/build-engine.js did not run:', err.message);
		process.exit(1);
	}
	const fresh = fs.readFileSync(BUNDLE, 'utf8');
	if (fresh !== committed) {
		fs.writeFileSync(BUNDLE, committed);
		console.error('FAIL: web/engine-bundle.js is stale — it does not match a fresh build from web/engine sources.');
		console.error('Fix: run `npm run build:engine` and commit the regenerated bundle.');
		process.exit(1);
	}
	console.log('PASS: web/engine-bundle.js matches a fresh build from web/engine sources.');
}

main();
