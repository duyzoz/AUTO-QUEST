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
  const out = {};
  const R=x=>{if(!x)return null;const b=x.getBoundingClientRect();return{x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}};
  const read = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return { missing: true };
    const cs = getComputedStyle(e);
    return { font: cs.fontFamily.split(',')[0].replace(/"/g,''), color: cs.color,
             text:(e.textContent||'').trim().slice(0,20), effect: e.getAttribute('data-dns-effect'),
             dns: e.classList.contains('dns-active'), rect: R(e) };
  };
  const row = document.getElementById('upRow');
  out.rowExists = !!row;
  const popEl0 = document.getElementById('upPop');
  out.wasOpenBefore = !popEl0.hidden;
  // #upRow là nút BẬT/TẮT: chỉ bấm khi đang đóng, tránh đóng ngược lại.
  if (popEl0.hidden) row.click();
  await new Promise(z=>setTimeout(z,800));
  const pop = document.getElementById('upPop');
  out.popHidden = pop.hidden;
  out.popDisplay = getComputedStyle(pop).display;
  out.popRect = R(pop);
  // đợi relayout xong
  await new Promise(z=>setTimeout(z,1500));
  out.dpFrame = R(document.getElementById('dpFrame'));
  out.dpFrameInner = R(document.querySelector('#dpFrame .pf-frame-inner'));
  out.dpFrameLayers = [...document.querySelectorAll('#dpFrame .pf-frame-layer')].map(l=>({cls:l.className.replace(/pf-frame-layer|pf-order-front/g,'').trim(), r:R(l), top:getComputedStyle(l).top, disp:getComputedStyle(l).display}));
  out.dpEffect = R(document.getElementById('dpEffect'));
  out.dpPeScale = document.getElementById('dpEffect').style.getPropertyValue('--pe-s');
  out.dpEffectLayers = [...document.querySelectorAll('#dpEffect > .pe-layer')].map(i=>({src:(i.src||'').slice(-18), r:R(i), nat:i.naturalWidth+'x'+i.naturalHeight}));
  out.names = { up: read('#upName'), dp: read('#dpDisplay'), ph: read('#phDisplay') };
  out.dpAvatar = R(document.querySelector('.up-pop-avatarwrap img, .up-pop-avatar'));
  return out;
})()`;
(async () => {
  const l = await (await fetch(`${HTTP}/json/list`)).json();
  const pg = l.find(t => t.type === 'page' && !/devtools/.test(t.url));
  console.log(JSON.stringify(await cdp(pg, 'Runtime.evaluate', { expression: E, returnByValue: true, awaitPromise: true }), null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
