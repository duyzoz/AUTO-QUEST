/* Waves#86 — capture full window + describe left-profile bordered elements. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = Number(process.env.AQ_REMOTE_DEBUG || 9333);
function wsSend(url, method, params) {
  return new Promise((res, rej) => {
    const WS = require('ws');
    const s = new WS(url, { perMessageDeflate: false, maxPayload: 512 * 1024 * 1024 });
    const id = 1;
    s.on('open', () => s.send(JSON.stringify({ id, method, params })));
    s.on('message', (m) => { const j = JSON.parse(m); if (j.id === id) { s.close(); res(j); } });
    s.on('error', rej);
    setTimeout(() => { try { s.close(); } catch {} rej(new Error('ws timeout')); }, 20000);
  });
}
(async () => {
  const L = await new Promise((resolve, reject) => http.get({ host: '127.0.0.1', port: PORT, path: '/json/list' }, r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve(d); } });
  }).on('error', reject));
  const page = (Array.isArray(L) ? L : []).find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) { console.log('NO PAGE'); process.exit(1); }
  const url = page.webSocketDebuggerUrl;

  // 1) describe the left user panel bordered elements
  const desc = await wsSend(url, 'Runtime.evaluate', {
    returnByValue: true, awaitPromise: true,
    expression: `(() => {
      const pick = (sel, f) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, missing: true };
        const c = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { sel, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          border: c.border, borderColor: c.borderColor, borderWidth: c.borderWidth,
          background: (c.backgroundColor || '').slice(0,30), radius: c.borderRadius, text: (el.textContent||'').trim().slice(0,24) };
      };
      const list = ['#dprofile','#upRow','.up-avatar','.up-avatarwrap','.up-frame','#upName','.up-nameplate','.up-logout','#btnLogout','#sideBalance','#logoOrb']
        .map(s => pick(s));
      const sidebar = document.querySelector('.sidebar');
      const sb = sidebar ? getComputedStyle(sidebar) : null;
      return JSON.stringify({ state: document.querySelector('#dprofile').dataset.state, list, sidebarBg: sb?sb.backgroundColor:null, userpanelFirstChildOrder: Array.from(document.querySelector('#dprofile').children).map(c=>c.className||c.id||c.tagName) });
    })()`
  });
  const dv = (desc.result && desc.result.result) || desc.result || {};
  console.log('DESC:', dv.value || JSON.stringify(desc).slice(0, 300));

  // 2) full-window screenshot
  const shot = await wsSend(url, 'Page.captureScreenshot', { format: 'png' });
  const data = shot.result && shot.result.data;
  if (data) {
    const out = path.join(process.cwd(), 'build-release', 'ui-preview', 'w86-before.png');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(data, 'base64'));
    console.log('SHOT ->', out);
  }
})().catch(e => console.log('ERR', e.message));