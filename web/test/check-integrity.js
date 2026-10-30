'use strict';
/* Waves#182 — fail when committed web/app/integrity.json is stale.
   Recomputes SHA-256 for the same file list as web/make-integrity.js
   (dev layout) and compares with the committed manifest, without
   writing anything. Run: node web/test/check-integrity.js
   Fix: npm run integrity (regenerates web/app/integrity.json). */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const APP = path.join(ROOT, 'web', 'app');
const FILES = ['index.html', 'renderer.js', 'styles.css', 'mobile.css', 'fonts.css', 'manifest.webmanifest', 'sw.js', 'web/identity.js', 'web/display-name-style.js', 'web/bridge.js', 'web/engine-worker.js', 'web/engine-bundle.js'];
const manifestPath = path.join(APP, 'integrity.json');
if (!fs.existsSync(manifestPath)) { console.error('FAIL: web/app/integrity.json missing — run: npm run integrity'); process.exit(1); }
const committed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const stale = [];
for (const rel of FILES) {
  const file = rel.startsWith('web/') ? path.join(ROOT, rel) : path.join(APP, rel);
  if (!fs.existsSync(file)) { stale.push(rel + ' (missing)'); continue; }
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('base64');
  if (committed.files[rel] !== hash) stale.push(rel);
}
if (stale.length) { console.error('FAIL: committed integrity.json is stale for: ' + stale.join(', ')); console.error('Fix: run `npm run integrity` and commit the regenerated file.'); process.exit(1); }
console.log('PASS: web/app/integrity.json matches current files (' + Object.keys(committed.files).length + ' files).');
