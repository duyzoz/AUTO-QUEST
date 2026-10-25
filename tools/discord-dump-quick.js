(async () => {
  const u = new Set();
  const re = /url\("?([^")]+)"?\)/g;
  for (const el of document.querySelectorAll('*')) {
    let bg = '';
    try { bg = getComputedStyle(el).backgroundImage; } catch (e) {}
    if (bg && bg.indexOf('none') === -1) { let m; while ((m = re.exec(bg))) u.add(m[1]); }
    if (el.tagName === 'IMG') { if (el.currentSrc) u.add(el.currentSrc); if (el.src) u.add(el.src); }
    if (el.tagName === 'SOURCE') { if (el.src) u.add(el.src); if (el.srcset) u.add(el.srcset); }
    if (el.tagName === 'VIDEO') { if (el.currentSrc) u.add(el.currentSrc); if (el.poster) u.add(el.poster); }
  }
  const list = [...u].filter(x => /cdn\.discordapp\.com|media\.discordapp\.net/.test(x))
    .map(x => x.replace(/^https:\/\/[^/]+/, '')).sort();
  const dns = [];
  for (const el of document.querySelectorAll('[style*="--custom-display-name-styles"], [class*="dnsFont"], [data-username-with-effects]')) {
    dns.push({ cls: el.className, style: el.getAttribute('style') });
  }
  const modal = document.querySelector('[class*="userProfileModal"], [class*="profileModal"], [role="dialog"]');
  const murls = [];
  if (modal) for (const el of modal.querySelectorAll('img, video, [style*="url("]')) {
    if (el.currentSrc) murls.push(el.currentSrc);
    if (el.src) murls.push(el.src);
    const st = el.getAttribute('style') || '';
    const m = st.match(/url\("?([^")]+)"?\)/);
    if (m) murls.push(m[1]);
  }
  const text = JSON.stringify({ href: location.href, urls: list, modalUrls: murls.map(x => x.replace(/^https:\/\/[^/]+/, '')), dns: dns }, null, 2);
  const w = document.createElement('div');
  w.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.9);padding:12px';
  const t = document.createElement('textarea');
  t.value = text;
  t.style.cssText = 'width:100%;height:94%;background:#111;color:#0f0;font:12px monospace;border:2px solid red';
  w.appendChild(t);
  document.body.appendChild(w);
  t.focus(); t.select(); t.setSelectionRange(0, text.length);
})();
