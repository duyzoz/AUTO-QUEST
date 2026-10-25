/* Debug: in light theme, walk up from .log-title / .ph-display printing each
   ancestor's computed background so we find WHICH element is still dark. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(
	path.join(ROOT, '__dbg-api.js'),
	`(function(){ const h={log:null,event:null,state:null}; window.__h=h; const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){ if(k==='onLog')return x=>{h.log=x;}; if(k==='onEvent')return x=>{h.event=x;}; if(k==='onState')return x=>{h.state=x;}; return f; }}); })();`,
	'utf8',
);
fs.writeFileSync(
	path.join(ROOT, '__dbg-data.js'),
	'window.__LIST=[];\n',
	'utf8',
);
const tmp = path.join(ROOT, '__dbg.html');
fs.writeFileSync(
	tmp,
	html.replace(
		'<script src="renderer.js"></script>',
		'<script src="__dbg-api.js"></script>\n<script src="__dbg-data.js"></script>\n<script src="renderer.js"></script>',
	),
	'utf8',
);

const TRACE = `(function(){
  const targets = ['.log-title','.chip','.qstate-text','.ph-display'];
  const out=[];
  for(const t of targets){
    const el=document.querySelector(t);
    if(!el){ out.push({t, chain:'(missing)'}); continue; }
    const chain=[]; let e=el;
    while(e && e!==document.documentElement){
      const cs=getComputedStyle(e);
      chain.push((e.tagName.toLowerCase())+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):'')+' bg='+cs.backgroundColor+' var(card)='+cs.getPropertyValue('--card').trim());
      e=e.parentElement;
    }
    out.push({t, chain});
  }
  return out;
})()`;

app.whenReady().then(async () => {
	const win = new BrowserWindow({ width: 1500, height: 950, show: false, webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false } });
	win.webContents.on('console-message', () => {});
	await win.loadFile(tmp);
	await new Promise((r) => setTimeout(r, 1000));
	await win.webContents.executeJavaScript(`document.documentElement.dataset.theme='light'`, true);
	await new Promise((r) => setTimeout(r, 400));
	const res = await win.webContents.executeJavaScript(JSON.stringify(await 0) && `JSON.stringify(${TRACE})`, true);
	const rows = JSON.parse(res);
	for (const r of rows) {
		console.log('\n### ' + r.t);
		if (typeof r.chain === 'string') { console.log('  ' + r.chain); continue; }
		for (const c of r.chain) console.log('  ' + c);
	}
	try { fs.unlinkSync(tmp); } catch (e) {}
	app.quit();
});
