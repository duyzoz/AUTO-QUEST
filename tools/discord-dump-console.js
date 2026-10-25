/* ============================================================================
   DISCORD DATA DUMP v5 — TU BÔI ĐEN JSON, BRO CHỈ CẦN CTRL+C
   ----------------------------------------------------------------------------
   CHẠY:
   1. Vao https://discord.com/channels/@me
   2. CLICK AVATAR CUA MINH (goc duoi trai) -> popup "Ho So" hien ra. DE MO.
   3. F12 -> Console -> paste -> Enter
   4. Mot o TRANG TRANG se hien ra, JSON da duoc BOI DEN san
      -> BAM CTRL+C -> gui cho toi
   ============================================================================ */
(async () => {
  const out = {
    time: new Date().toISOString(),
    href: '',
    domCdnUrls: [],
    dnsStyleVars: [],
    profileModalUrls: [],
    api: {},
    notes: []
  };
  const g = globalThis;

  try { out.href = location.href; } catch (e) {}

  /* ---- 1. QUET DOM ---- */
  try {
    const urls = new Set();
    const re = /url\("?([^")]+)"?\)/g;
    for (const el of document.querySelectorAll('*')) {
      let bg = '';
      try { bg = getComputedStyle(el).backgroundImage; } catch (e) {}
      if (bg && bg.indexOf('none') === -1) {
        let m;
        while ((m = re.exec(bg))) urls.add(m[1]);
      }
      if (el.tagName === 'IMG') { if (el.currentSrc) urls.add(el.currentSrc); if (el.src) urls.add(el.src); }
      if (el.tagName === 'SOURCE') { if (el.src) urls.add(el.src); if (el.srcset) urls.add(el.srcset); }
      if (el.tagName === 'VIDEO') { if (el.currentSrc) urls.add(el.currentSrc); if (el.poster) urls.add(el.poster); }
    }
    out.domCdnUrls = [...urls]
      .filter(u => /cdn\.discordapp\.com|media\.discordapp\.net/.test(u))
      .map(u => u.replace(/^https:\/\/[^/]+/, ''))
      .sort();
  } catch (e) { out.notes.push('dom scan err: ' + e.message); }

  /* ---- 2. ANH TRONG POPUP HO SO ---- */
  try {
    const modal = document.querySelector('[class*="userProfileModal"], [class*="profileModal"], [role="dialog"]');
    if (modal) {
      const set = new Set();
      for (const el of modal.querySelectorAll('img, video, [style*="url("]')) {
        if (el.currentSrc) set.add(el.currentSrc);
        if (el.src) set.add(el.src);
        const st = el.getAttribute('style') || '';
        const m = st.match(/url\("?([^")]+)"?\)/);
        if (m) set.add(m[1]);
      }
      out.profileModalUrls = [...set].map(u => u.replace(/^https:\/\/[^/]+/, ''));
    } else {
      out.notes.push('CHUA MO popup ho so — hay click avatar goc duoi trai truoc');
    }
  } catch (e) { out.notes.push('modal scan err: ' + e.message); }

  /* ---- 3. CSS TEN HIEN THI ---- */
  try {
    for (const el of document.querySelectorAll(
        '[style*="--custom-display-name-styles"], [class*="dnsFont"], [data-username-with-effects]')) {
      const st = el.getAttribute('style') || '';
      const vars = {};
      st.split(';').forEach(p => {
        const i = p.indexOf(':');
        if (i > 0) vars[p.slice(0, i).trim()] = p.slice(i + 1).trim();
      });
      out.dnsStyleVars.push({ cls: el.className, vars });
    }
  } catch (e) { out.notes.push('dns err: ' + e.message); }

  /* ---- 4. TOKEN ---- */
  let token = null;
  try {
    const ls = g.localStorage;
    if (ls) {
      for (const k of ['token', 'token_v2']) {
        const raw = ls.getItem(k);
        if (!raw) continue;
        let v = raw;
        try { v = JSON.parse(raw); } catch (e) {}
        if (typeof v === 'string' && v.length > 30) { token = v; break; }
        if (v && typeof v === 'object') {
          const f = v.token || v.accessToken || v.value;
          if (typeof f === 'string' && f.length > 30) { token = f; break; }
        }
      }
    } else { out.notes.push('localStorage khong san dung'); }
  } catch (e) { out.notes.push('token err: ' + e.message); }

  /* ---- 5. API ---- */
  if (token) {
    const get = async (url) => {
      try {
        const r = await fetch(url, { headers: { Authorization: token }, credentials: 'include' });
        const t = await r.text();
        try { return { status: r.status, json: JSON.parse(t) }; }
        catch (e) { return { status: r.status, text: t.slice(0, 200) }; }
      } catch (e) { return { error: String(e) }; }
    };
    out.api.me = await get('https://discord.com/api/v10/users/@me');
    out.api.meProfile = await get('https://discord.com/api/v10/users/@me/profile');
    out.api.shop = await get('https://discord.com/api/v10/collectibles-shop/products?country_code=VN&locale=vi');
    out.api.entitlements = await get('https://discord.com/api/v10/users/@me/entitlements?include_consumed=true');
  } else {
    try {
      let apiMod = null;
      const wcc = g.webpackChunkdiscord_app;
      if (wcc) {
        wcc.push([[Date.now()], {}, (req) => {
          for (const k in req.c) {
            const m = req.c[k] && req.c[k].exports;
            if (!m) continue;
            const d = m.default || m;
            if (d && typeof d.get === 'function' && typeof d.post === 'function' && typeof d.patch === 'function') apiMod = d;
          }
        }]);
      }
      if (apiMod) {
        const r1 = await apiMod.get({ url: '/users/@me' });
        out.api.me = { status: 'ok', json: r1 && r1.body };
        const r2 = await apiMod.get({ url: '/users/@me/profile' });
        out.api.meProfile = { status: 'ok', json: r2 && r2.body };
      } else { out.notes.push('khong co apiMod noi bo'); }
    } catch (e) { out.notes.push('apiMod err: ' + e.message); }
  }

  /* ---- 6. HIEN O CHUA JSON, BÔI ĐEN SẴN ---- */
  const text = JSON.stringify(out, null, 2);
  console.log('%c=== DUMP v5 XONG — xem o mau do ben duoi ===', 'color:#fff;background:#5865F2;padding:2px 6px;border-radius:3px', out);

  try {
    const old = document.getElementById('__dump_box');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = '__dump_box';
    wrap.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;background:rgba(0,0,0,.85);padding:12px;box-sizing:border-box';
    const tip = document.createElement('div');
    tip.textContent = 'BAO GOM: Ctrl+C  ->  gui cho toi   |   Dong lai: bam Esc hoac click dup ngoai o';
    tip.style.cssText = 'color:#0f0;font:bold 14px monospace;margin-bottom:8px';
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'width:100%;height:92%;background:#111;color:#0f0;font:12px monospace;padding:8px;box-sizing:border-box;border:2px solid #f00';
    wrap.appendChild(tip);
    wrap.appendChild(ta);
    document.body.appendChild(wrap);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  } catch (e) {
    console.log('Khong hien duoc o chua — hay click chuot phai vao object ben tren -> Copy Object', e);
  }
})();
