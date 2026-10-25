/* Waves 31: đo layout nút trạng thái + modal captcha (không cần nhìn ảnh). */
const { app, BrowserWindow } = require('electron');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'ui-preview');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'harness-api.js'), `(function(){
  const h={log:null,event:null,state:null}; window.__h=h;
  const a=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return f=>{h.log=f}; if(k==='onEvent')return f=>{h.event=f}; if(k==='onState')return f=>{h.state=f};
    if(k==='authCheck')return()=>Promise.resolve({ok:false}); if(k==='saveLog')return()=>Promise.resolve({ok:true});
    if(k==='fetchOrbs')return()=>Promise.resolve({ok:true,balance:24850,pendingClaim:0,source:'wallet'});
    if(k==='claimQuest')return p=>{window.__c=(window.__c||0)+1;window.__p=p;if(!p.captchaKey)return Promise.resolve({ok:false,captchaRequired:true,captcha:{sitekey:'10000000-ffff-ffff-ffff-000000000001',service:'hcaptcha',sessionId:'s',rqdata:'r',rqtoken:'t'}});return Promise.resolve({ok:true,orbs:750});};
    if(k==='openUrl'||k==='openDataFolder'||k==='writeClipboard')return()=>Promise.resolve();
    return a;}});
})();`, 'utf8');
const list = [
  {id:'q1',name:'Todo Quest',task:'PLAY_ON_DESKTOP',taskLabel:'Chơi trên PC',orbs:700,status:'todo',secondsNeeded:900,secondsDone:300,publisher:'EA',gameTitle:'EA FC',colorPrimary:'#5865f2',colorSecondary:'#1b1e3a'},
  {id:'q2',name:'Claimable Quest',task:'PLAY_ON_DESKTOP',taskLabel:'Chơi trên PC',orbs:750,status:'claimable',secondsNeeded:900,secondsDone:900,publisher:'2K',gameTitle:'Risk',colorPrimary:'#2d7d46',colorSecondary:'#12331f'},
  {id:'q3',name:'Claimed Quest',task:'PLAY_ON_DESKTOP',taskLabel:'Chơi trên PC',orbs:800,status:'claimed',secondsNeeded:900,secondsDone:900,publisher:'NetEase',gameTitle:'WWM',colorPrimary:'#8b5cf6',colorSecondary:'#2a1f4a'},
];
fs.writeFileSync(path.join(ROOT,'harness-data.js'),'window.__LIST='+JSON.stringify(list)+';\n','utf8');
const tmp = path.join(ROOT,'.measure.html');
fs.writeFileSync(tmp, html.replace('<script src="renderer.js"></script>','<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>'),'utf8');
app.whenReady().then(async () => {
  const win = new BrowserWindow({width:1920,height:1080,show:true,backgroundColor:'#05060b',webPreferences:{contextIsolation:false,nodeIntegration:false,backgroundThrottling:false}});
  win.webContents.on('console-message',(_e,l,m)=>{ if(l>=2) console.log('[r]',m); });
  await win.loadFile(tmp); await new Promise(r=>setTimeout(r,700));
  await win.webContents.executeJavaScript(`(function(){const t=document.getElementById('token');if(t){t.value='HARNESS.TOKEN';t.dispatchEvent(new Event('input',{bubbles:true}));}window.__h.event({type:'quest:inventory',data:{quests:window.__LIST}});window.__h.event({type:'scan:complete',data:{}});})()`,true);
  await new Promise(r=>setTimeout(r,700));
  const btns = await win.webContents.executeJavaScript(`(function(){
    const out=[];
    document.querySelectorAll('.qcard').forEach(c=>{
      const b=c.querySelector('.qcard-act'); const r=b.getBoundingClientRect();
      out.push({id:c.dataset.questId,act:b.dataset.act,label:b.textContent.trim(),disabled:b.disabled,
        h:Math.round(r.height),w:Math.round(r.width),overflowY:Math.round(r.bottom-c.getBoundingClientRect().bottom)});
    });
    const card=document.querySelector('.qcard'); const cb=card.getBoundingClientRect();
    return {cardH:Math.round(cb.height), btns:out};
  })()`,true);
  console.log('FOOT_BUTTONS:', JSON.stringify(btns,null,1));
  await win.webContents.executeJavaScript("document.getElementById('tabNew').click()",true);
  await new Promise(r=>setTimeout(r,200));
  await win.webContents.executeJavaScript(`document.querySelector('#questListNew .qcard-act[data-act="claim"]').click()`,true);
  await new Promise(r=>setTimeout(r,4500));
  const modal = await win.webContents.executeJavaScript(`(function(){
    const c=document.querySelector('.capture-card'); const r=c.getBoundingClientRect();
    const slot=document.querySelector('.captcha-slot'); const sr=slot.getBoundingClientRect();
    const ifr=document.querySelector('#hcaptchaWidget iframe');
    const ir=ifr?ifr.getBoundingClientRect():null;
    const btns=[...document.querySelectorAll('.capture-card .btn')].map(b=>({t:b.textContent.trim(),dis:b.disabled}));
    return {card:{w:Math.round(r.width),h:Math.round(r.height)}, slot:{w:Math.round(sr.width),h:Math.round(sr.height)},
      iframe: ir?{w:Math.round(ir.width),h:Math.round(ir.height),overflow: Math.round(ir.right-sr.right), overflowY: Math.round(ir.bottom-sr.bottom)}:null,
      title:document.getElementById('captchaTitle').textContent, target:document.getElementById('captchaTargetName').textContent, btns};
  })()`,true);
  console.log('MODAL_MEASURE:', JSON.stringify(modal,null,1));
  // Đo theme sáng
  await win.webContents.executeJavaScript("document.getElementById('btnCaptchaCancel').click()",true);
  app.quit();
});
