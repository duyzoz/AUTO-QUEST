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
    setTimeout(() => { try { ws.close(); } catch {} rej(new Error('timeout')); }, 30000);
  });
}
const E = `(async function(){
  const r = await window.__aqDiag.reauth();
  if(!r || !r.ok || !r.user) return {err:(r&&r.message)||'reauth failed'};
  const user = r.user;
  await new Promise(z=>setTimeout(z,1200));
  const R=x=>{if(!x)return null;const b=x.getBoundingClientRect();return{x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}};
  const e=document.getElementById('phEffect');
  return {
    effectSku: user.profileEffect && user.profileEffect.sku,
    frameSku: user.profileFrame && user.profileFrame.sku,
    frameLayerCount: user.profileFrame ? (user.profileFrame.layers||[]).length : 0,
    themeColors: user.themeColors,
    peScale: e.style.getPropertyValue('--pe-s'),
    peHost: R(e),
    peLayers: [...e.querySelectorAll('.pe-layer')].map(i=>({
      z:i.style.getPropertyValue('--pe-z'), x:i.style.getPropertyValue('--pe-x'), y:i.style.getPropertyValue('--pe-y'),
      src:(i.src||'').slice(-26), nat:i.naturalWidth+'x'+i.naturalHeight, r:R(i) })),
    frameHost: R(document.getElementById('phFrame')),
    frameInner: R(document.querySelector('#phFrame .pf-frame-inner')),
    avatarRing: getComputedStyle(document.querySelector('.ph-avatar')).borderColor,
    avatarShadow: getComputedStyle(document.querySelector('.ph-avatar')).boxShadow.slice(0,60),
  };
})()`;
(async () => {
  const l = await (await fetch(`${HTTP}/json/list`)).json();
  const pg = l.find(t => t.type === 'page' && !/devtools/.test(t.url));
  console.log(JSON.stringify(await cdp(pg, 'Runtime.evaluate', { expression: E, returnByValue: true, awaitPromise: true }), null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
