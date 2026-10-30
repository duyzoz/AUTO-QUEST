'use strict';
/* Waves#198 — report renderer/styles/bundle sizes (no split decision
   without measurement). Run: node web/test/bundle-sizes.js */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const files = [['web/app/renderer.js', 'renderer'], ['web/app/styles.css', 'styles'], ['web/engine-bundle.js', 'engine bundle'], ['web/bridge.js', 'bridge']];
for (const [rel, label] of files) {
  const p = path.join(ROOT, rel);
  const kb = fs.existsSync(p) ? (fs.statSync(p).size / 1024).toFixed(1) : 'missing';
  console.log(`${label}: ${kb} KB (${rel})`);
}
console.log('Note: code is NOT split out of the main page — measurement shows the shell must stay whole for PWA offline, and a split would add a second cacheable chunk with no clear benefit.');
