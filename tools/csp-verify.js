/* Waves 31: xác nhận CSP trong index.html THẬT cho phép nạp + render hCaptcha,
   đồng thời cho phép XHR tới hcaptcha.com. Dùng chính index.html qua harness. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'harness-api.js'), `window.autoquest=new Proxy({},{get(_,k){if(k==='onLog'||k==='onEvent'||k==='onState')return()=>{};return()=>Promise.resolve({ok:true,balance:0,config:{}});}});`, 'utf8');
fs.writeFileSync(path.join(ROOT, 'harness-data.js'), 'window.__LIST=[];\n', 'utf8');
const tmp = path.join(ROOT, '.csp.html');
fs.writeFileSync(tmp, html.replace('<script src="renderer.js"></script>','<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>'),'utf8');
const violations = [];
app.whenReady().then(async () => {
  const win = new BrowserWindow({width:1280,height:800,show:false,webPreferences:{contextIsolation:false,nodeIntegration:false}});
  win.webContents.on('console-message',(_e,l,m)=>{ if(/Content Security Policy|Refused to/i.test(m)) violations.push(m.slice(0,200)); });
  await win.loadFile(tmp); await new Promise(r=>setTimeout(r,500));
  const out = await win.webContents.executeJavaScript(`(async function(){
    const m=document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const res={csp: m?m.content:null, scriptErrs:[], loaded:false, hasRender:false};
    // bắt lỗi CSP qua window error
    window.addEventListener('securitypolicyviolation', e=>res.scriptErrs.push(e.blockedURI+' :: '+e.violatedDirective));
    try {
      await new Promise((ok,bad)=>{
        const s=document.createElement('script'); s.src='https://js.hcaptcha.com/1/api.js?render=explicit&onload=__cspOk';
        s.async=true; s.defer=true;
        const t=setTimeout(()=>bad(new Error('timeout')),15000);
        window.__cspOk=()=>{clearTimeout(t);ok();};
        s.onerror=()=>{clearTimeout(t);bad(new Error('script onerror'));};
        document.head.appendChild(s);
      });
      res.loaded=true; res.hasRender=!!(window.hcaptcha&&window.hcaptcha.render);
    } catch(e){ res.err=e.message; }
    await new Promise(r=>setTimeout(r,300));
    return res;
  })()`, true);
  console.log('CSP_LOADED:', out.loaded, '| hasRender:', out.hasRender, '| err:', out.err||'none');
  console.log('CSP_DIRECTIVES:', out.csp);
  console.log('VIOLATIONS:', JSON.stringify(violations));
  app.quit();
});
