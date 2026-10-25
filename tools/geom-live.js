'use strict';
const PORT = Number(process.env.AQ_REMOTE_DEBUG || 9333);
const HTTP = `http://127.0.0.1:${PORT}`;

function cdp(target, method, params) {
	const WebSocket = require('ws');
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
		let id = 0;
		const pending = new Map();
		ws.on('open', () => send(method, params));
		function send(m, p) { const mid = ++id; pending.set(mid, 1); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }
		ws.on('message', (raw) => {
			let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
			if (msg.id && pending.has(msg.id)) { pending.delete(msg.id); ws.close();
				if (msg.error) return reject(new Error(JSON.stringify(msg.error)));
				const r = msg.result;
				if (r && r.exceptionDetails) return reject(new Error(r.exceptionDetails.exception?.description || 'eval err'));
				resolve(r && r.result ? r.result.value : r);
			}
		});
		ws.on('error', reject);
		setTimeout(() => { try { ws.close(); } catch {} reject(new Error('timeout')); }, 25000);
	});
}

const EXPR = `
(function(){
  const R = (el) => { if(!el) return null; const r = el.getBoundingClientRect();
    return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2)}; };
  const q = (s) => document.querySelector(s);
  const out = {};
  // hero
  out.heroCard = R(q('#heroProfile'));
  out.phAvatar = R(q('#phAvatar'));
  out.phAvatarwrap = R(q('#phAvatarwrap'));
  out.phFrameHost = R(q('#phFrame'));
  out.phFrameInner = R(q('#phFrame .pf-frame-inner'));
  const inner = q('#phFrame .pf-frame-inner');
  if (inner) {
    out.innerVars = {
      cfCard: getComputedStyle(inner).getPropertyValue('--cf-card').trim(),
      cfAvX: getComputedStyle(inner).getPropertyValue('--cf-av-x').trim(),
      cfAvY: getComputedStyle(inner).getPropertyValue('--cf-av-y').trim(),
    };
    out.frameVars = {
      w: getComputedStyle(q('#phFrame')).getPropertyValue('--custom-profile-frame-container-width').trim(),
      ot: getComputedStyle(q('#phFrame')).getPropertyValue('--custom-profile-frame-overflow-top').trim(),
      ob: getComputedStyle(q('#phFrame')).getPropertyValue('--custom-profile-frame-overflow-bottom').trim(),
      oh: getComputedStyle(q('#phFrame')).getPropertyValue('--custom-profile-frame-overflow-horizontal').trim(),
    };
    out.layerRects = [...q('#phFrame').querySelectorAll('.pf-frame-layer')].map(l=>({cls:l.className, r:R(l)}));
  }
  // popout
  out.pop = R(q('.up-pop'));
  out.popVisible = q('.up-pop') ? getComputedStyle(q('.up-pop')).display + '/' + getComputedStyle(q('.up-pop')).visibility : null;
  out.dpAvatarwrap = R(q('#dpAvatarwrap') || q('.up-pop-avatarwrap'));
  out.dpAvatar = R(q('#dpAvatar'));
  out.dpFrameHost = R(q('#dpFrame'));
  out.dpFrameInner = R(q('#dpFrame .pf-frame-inner'));
  out.phEffect = R(q('#phEffect'));
  out.dpEffect = R(q('#dpEffect'));
  return out;
})()
`;

async function main() {
	const list = await (await fetch(`${HTTP}/json/list`)).json();
	const page = list.find((t) => t.type === 'page' && !/devtools/.test(t.url));
	const out = await cdp(page, 'Runtime.evaluate', { expression: EXPR, returnByValue: true, awaitPromise: true });
	console.log(JSON.stringify(out, null, 1));
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
