'use strict';
const HTTP = 'http://127.0.0.1:9333';
function cdp(t, m, p) {
  const W = require('ws');
  return new Promise((res, rej) => {
    const ws = new W(t.webSocketDebuggerUrl, { perMessageDeflate: false });
    let i = 0; const k = new Map();
    ws.on('open', () => s(m, p));
    function s(mm, pp) { const id = ++i; k.set(id, 1); ws.send(JSON.stringify({ id, method: mm, params: pp })); }
    ws.on('message', r => {
      let g; try { g = JSON.parse(r.toString()); } catch { return; }
      if (g.id && k.has(g.id)) {
        k.delete(g.id); ws.close();
        if (g.error) return rej(new Error(JSON.stringify(g.error)));
        const x = g.result;
        if (x && x.exceptionDetails) return rej(new Error(x.exceptionDetails.exception && x.exceptionDetails.exception.description));
        res(x && x.result ? x.result.value : x);
      }
    });
    ws.on('error', rej);
    setTimeout(() => { try { ws.close(); } catch {} rej(new Error('timeout')); }, 40000);
  });
}
const E = `(async function(){
  const out = {};
  const R=x=>{if(!x)return null;const b=x.getBoundingClientRect();return{w:Math.round(b.width),h:Math.round(b.height)}};
  const snapshot = (tag) => {
    const names = ['#upDisplay','#upName','#dpDisplay','#phDisplay']
      .map(sel => { const e=document.querySelector(sel); if(!e) return null;
        const cs=getComputedStyle(e);
        return {sel, font:cs.fontFamily.split(',')[0].replace(/"/g,''), color:cs.color,
                effect:e.getAttribute('data-dns-effect'), dns:e.classList.contains('dns-active')}; })
      .filter(Boolean);
    const frameImgs=[...document.querySelectorAll('.custom-profile-frame img')]
      .map(i=>({cls:i.className, ok:i.complete&&i.naturalWidth>0, nat:i.naturalWidth+'x'+i.naturalHeight}));
    const peLayers=[...document.querySelectorAll('.pe-layer')]
      .map(i=>({ok:i.complete&&i.naturalWidth>0, r:R(i)}));
    return {
      theme: document.documentElement.dataset.theme,
      names,
      frameCount: document.querySelectorAll('.custom-profile-frame').length,
      frameImgsTotal: frameImgs.length,
      frameImgsOk: frameImgs.filter(f=>f.ok).length,
      peLayersTotal: peLayers.length,
      peLayersOk: peLayers.filter(p=>p.ok).length,
      avatarRing: getComputedStyle(document.querySelector('.ph-avatar')).borderColor,
    };
  };
  out.light = (function(){ document.getElementById('themeLight').click(); return snapshot('light'); })();
  await new Promise(z=>setTimeout(z,900));
  out.light = snapshot('light');
  document.getElementById('themeDark').click();
  await new Promise(z=>setTimeout(z,900));
  out.dark = snapshot('dark');
  return out;
})()`;
(async () => {
  const l = await (await fetch(`${HTTP}/json/list`)).json();
  const pg = l.find(t => t.type === 'page' && !/devtools/.test(t.url));
  console.log(JSON.stringify(await cdp(pg, 'Runtime.evaluate', { expression: E, returnByValue: true, awaitPromise: true }), null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
