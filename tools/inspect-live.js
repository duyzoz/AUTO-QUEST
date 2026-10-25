/**
 * Waves 49b — NỐI VÀO APP ĐANG CHẠY (bro's real session) qua CDP, đọc DOM THẬT.
 * Không đoán: in ra chính xác class/src/computed-style đang có trên máy bro.
 */
'use strict';

const PORT = Number(process.env.AQ_REMOTE_DEBUG || 9333);
const HTTP = `http://127.0.0.1:${PORT}`;

async function evalIn(target, expr) {
	const WebSocket = require('ws');
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
		let id = 0;
		const pending = new Map();
		ws.on('open', () => {
			send('Runtime.evaluate', {
				expression: expr,
				returnByValue: true,
				awaitPromise: true,
				userGesture: true,
			});
		});
		function send(method, params) {
			const mid = ++id;
			pending.set(mid, true);
			ws.send(JSON.stringify({ id: mid, method, params }));
		}
		ws.on('message', (raw) => {
			let msg;
			try {
				msg = JSON.parse(raw.toString());
			} catch {
				return;
			}
			if (msg.id && pending.has(msg.id)) {
				pending.delete(msg.id);
				ws.close();
				if (msg.error) return reject(new Error(JSON.stringify(msg.error)));
				const r = msg.result;
				if (r && r.exceptionDetails) {
					return reject(new Error(r.exceptionDetails.exception?.description || 'eval error'));
				}
				resolve(r && r.result ? r.result.value : r);
			}
		});
		ws.on('error', reject);
		setTimeout(() => {
			try {
				ws.close();
			} catch {
				/* ignore */
			}
			reject(new Error('timeout'));
		}, 20000);
	});
}

const MEASURE = `
(function () {
  const q = (id) => document.getElementById(id);
  const info = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      hidden: !!el.hidden,
      display: cs.display,
      rect: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) },
      cls: el.className,
      src: el.src ? el.src.slice(0, 110) : null,
      bgImage: cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 110) : null,
      filter: cs.filter !== 'none' ? cs.filter : null,
      opacity: cs.opacity,
      text: (el.textContent || '').trim().slice(0, 40),
      textShadow: cs.textShadow !== 'none' ? cs.textShadow.slice(0, 60) : null,
      fontFamily: (cs.fontFamily || '').slice(0, 45),
      fontWeight: cs.fontWeight,
      fontSize: cs.fontSize,
      color: cs.color,
      dataDns: el.getAttribute('data-dns'),
      dataDnsEffect: el.getAttribute('data-dns-effect'),
      kids: el.children.length,
    };
  };
  const cs = (el) => getComputedStyle(el);
  const frameLayers = [];
  for (const fid of ['dpFrame','phFrame']) {
    const f = q(fid);
    if (!f) { frameLayers.push({ id: fid, missing: true }); continue; }
    const ls = [...f.querySelectorAll('.pf-frame-layer')].map((l) => {
      const cs = getComputedStyle(l);
      const rr = l.getBoundingClientRect();
      const img = l.querySelector('img');
      return {
        cls: l.className,
        w: Math.round(rr.width), h: Math.round(rr.height),
        ar: cs.aspectRatio,
        hasImg: !!img,
        imgSrc: img ? (img.src||'').slice(0,100) : null,
        imgNW: img ? img.naturalWidth : null,
        imgNH: img ? img.naturalHeight : null,
        bg: cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0,90) : null,
      };
    });
    frameLayers.push({
      id: fid,
      cls: f.className,
      hidden: !!f.hidden,
      cfCard: cs(f).getPropertyValue('--cf-card'),
      rect: (() => { const r=f.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height)}; })(),
      layers: ls,
    });
  }
  return {
    theme: document.documentElement.dataset.theme,
    upName: info(q('upName')),
    dpDisplay: info(q('dpDisplay')),
    phDisplay: info(q('phDisplay')),
    dpEffect: info(q('dpEffect')),
    phEffect: info(q('phEffect')),
    dpBanner: q('dpBanner') ? { cls: q('dpBanner').className, bannerImage: q('dpBanner').dataset.bannerImage, themeActive: cs(q('dpBanner')).getPropertyValue('--theme-active'), bg: cs(q('dpBanner')).background.slice(0,90) } : null,
    phBanner: q('phBanner') ? { cls: q('phBanner').className, bannerImage: q('phBanner').dataset.bannerImage, themeActive: cs(q('phBanner')).getPropertyValue('--theme-active') } : null,
    heroHidden: q('heroProfile') ? q('heroProfile').hidden : null,
    frames: frameLayers,
  };
})()
`;

async function main() {
	const list = await (await fetch(`${HTTP}/json/list`)).json();
	const page = list.find((t) => t.type === 'page' && !/devtools/.test(t.url));
	if (!page) {
		console.log('NO PAGE TARGET. targets:', list.map((t) => t.type + ':' + t.url).join('\n'));
		return;
	}
	console.log('TARGET:', page.url);
	const out = await evalIn(page, MEASURE);
	console.log(JSON.stringify(out, null, 1));
}

main().catch((e) => {
	console.error('ERR', e.message);
	process.exit(1);
});
