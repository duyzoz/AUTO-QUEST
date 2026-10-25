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
const E = `(function(){
  const R = (x) => { if(!x) return null; const b = x.getBoundingClientRect();
    return {x:Math.round(b.x), y:Math.round(b.y), w:Math.round(b.width), h:Math.round(b.height),
            bottom:Math.round(b.bottom), right:Math.round(b.right)}; };
  const cs = (x) => x ? getComputedStyle(x) : null;
  const out = {};

  // ---------- HERO ----------
  const hero = document.getElementById('heroProfile');
  const phFrame = document.getElementById('phFrame');
  const phInner = document.querySelector('#phFrame .pf-frame-inner');
  const phEffect = document.getElementById('phEffect');
  const phAvatar = document.querySelector('.ph-avatar');
  const phBanner = document.getElementById('phBanner');
  const phBody = document.querySelector('.ph-body');
  out.hero = {
    card: R(hero),
    cardOverflow: cs(hero) ? cs(hero).overflow : null,
    avatar: R(phAvatar),
    banner: R(phBanner),
    body: R(phBody),
    frameHost: R(phFrame),
    frameInner: R(phInner),
    frameLayers: [...document.querySelectorAll('#phFrame .pf-frame-layer')].map(l => ({
      cls: l.className.replace('pf-frame-layer','').trim(),
      r: R(l), top: cs(l).top, bottom: cs(l).bottom, disp: cs(l).display,
    })),
    effectHost: R(phEffect),
    effectLayers: [...document.querySelectorAll('#phEffect > .pe-layer')].map(i => ({
      r: R(i), src: (i.src||'').slice(-14), ok: i.complete && i.naturalWidth > 0,
    })),
    peScale: phEffect ? phEffect.style.getPropertyValue('--pe-s') : null,
    vars: phFrame ? {
      cw: cs(phFrame).getPropertyValue('--custom-profile-frame-container-width'),
      ls: cs(phFrame).getPropertyValue('--custom-profile-frame-layer-scale'),
      sot: cs(phFrame).getPropertyValue('--custom-profile-frame-scaled-overflow-top'),
      sob: cs(phFrame).getPropertyValue('--custom-profile-frame-scaled-overflow-bottom'),
      soh: cs(phFrame).getPropertyValue('--custom-profile-frame-scaled-overflow-horizontal'),
    } : null,
  };
  // frame có tràn ra ngoài thẻ không (khoảng vượt)
  if (phFrame && hero) {
    const f = phFrame.getBoundingClientRect(), h = hero.getBoundingClientRect();
    out.hero.frameOverhang = {
      top: Math.round(h.top - f.top), left: Math.round(h.left - f.left),
      right: Math.round(f.right - h.right), bottom: Math.round(f.bottom - h.bottom),
    };
  }

  // ---------- POPOUT ----------
  const pop = document.getElementById('upPop');
  const dpFrame = document.getElementById('dpFrame');
  const dpInner = document.querySelector('#dpFrame .pf-frame-inner');
  const dpEffect = document.getElementById('dpEffect');
  out.pop = {
    open: pop && !pop.hidden,
    card: R(pop),
    frameHost: R(dpFrame),
    frameInner: R(dpInner),
    frameLayers: [...document.querySelectorAll('#dpFrame .pf-frame-layer')].map(l => ({
      cls: l.className.replace('pf-frame-layer','').trim(),
      r: R(l), top: cs(l).top, bottom: cs(l).bottom, disp: cs(l).display,
    })),
    avatar: R(document.getElementById('dpAvatar')),
    effectHost: R(dpEffect),
    effectLayers: [...document.querySelectorAll('#dpEffect > .pe-layer')].map(i => ({
      r: R(i), ok: i.complete && i.naturalWidth > 0,
    })),
    peScale: dpEffect ? dpEffect.style.getPropertyValue('--pe-s') : null,
  };
  if (dpFrame && pop) {
    const f = dpFrame.getBoundingClientRect(), c = pop.getBoundingClientRect();
    out.pop.frameOverhang = {
      top: Math.round(c.top - f.top), left: Math.round(c.left - f.left),
      right: Math.round(f.right - c.right), bottom: Math.round(f.bottom - c.bottom),
    };
  }
  return out;
})()`;
(async () => {
  const l = await (await fetch(`${HTTP}/json/list`)).json();
  const pg = l.find(t => t.type === 'page' && !/devtools/.test(t.url));
  console.log(JSON.stringify(await cdp(pg, 'Runtime.evaluate', { expression: E, returnByValue: true }), null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
