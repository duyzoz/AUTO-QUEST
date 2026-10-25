/* Waves 31: test 2 nhiệm vụ liên tiếp đều gặp captcha — widget phải reuse sạch. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'harness-api.js'), `(function(){
  const h={event:null,log:null,state:null}; window.__h=h;
  const a=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onEvent')return f=>{h.event=f}; if(k==='onLog')return f=>{h.log=f}; if(k==='onState')return f=>{h.state=f};
    if(k==='authCheck')return()=>Promise.resolve({ok:false}); if(k==='saveLog')return()=>Promise.resolve({ok:true});
    if(k==='fetchOrbs')return()=>Promise.resolve({ok:true,balance:1000,pendingClaim:0,source:'wallet'});
    if(k==='claimQuest')return p=>{window.__calls=(window.__calls||[]).concat(p.questId+(p.captchaKey?'+cap':''));if(!p.captchaKey)return Promise.resolve({ok:false,captchaRequired:true,captcha:{sitekey:'10000000-ffff-ffff-ffff-000000000001',service:'hcaptcha',sessionId:'s',rqdata:'r',rqtoken:'t'}});return Promise.resolve({ok:true,orbs:500});};
    if(k==='openUrl'||k==='openDataFolder'||k==='writeClipboard')return()=>Promise.resolve();
    return a;}});
})();`, 'utf8');
const list=[
 {id:'qA',name:'Quest A',task:'PLAY_ON_DESKTOP',orbs:500,status:'claimable',secondsNeeded:900,secondsDone:900,gameTitle:'A'},
 {id:'qB',name:'Quest B',task:'PLAY_ON_DESKTOP',orbs:500,status:'claimable',secondsNeeded:900,secondsDone:900,gameTitle:'B'},
];
fs.writeFileSync(path.join(ROOT,'harness-data.js'),'window.__LIST='+JSON.stringify(list)+';\n','utf8');
const tmp=path.join(ROOT,'.seq.html');
fs.writeFileSync(tmp, html.replace('<script src="renderer.js"></script>','<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>'),'utf8');
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:1600,height:900,show:false,webPreferences:{contextIsolation:false,nodeIntegration:false,backgroundThrottling:false}});
  await win.loadFile(tmp); await new Promise(r=>setTimeout(r,600));
  await win.webContents.executeJavaScript(`(function(){const t=document.getElementById('token');if(t){t.value='T';t.dispatchEvent(new Event('input',{bubbles:true}));}window.__h.event({type:'quest:inventory',data:{quests:window.__LIST}});window.__h.event({type:'scan:complete',data:{}});})()`,true);
  await new Promise(r=>setTimeout(r,600));
  // claim A
  await win.webContents.executeJavaScript(`document.querySelector('.qcard[data-quest-id="qA"] .qcard-act').click()`,true);
  await new Promise(r=>setTimeout(r,4000));
  const s1=await win.webContents.executeJavaScript(`({open:!document.getElementById('captchaModal').hidden, iframes:document.querySelectorAll('#hcaptchaWidget iframe').length, ctx: document.getElementById('captchaTargetName').textContent})`,true);
  console.log('A_MODAL:', JSON.stringify(s1));
  await win.webContents.executeJavaScript("onCaptchaSolved('TOKEN_A')",true);
  await new Promise(r=>setTimeout(r,1200));
  // claim B
  await win.webContents.executeJavaScript(`document.querySelector('.qcard[data-quest-id="qB"] .qcard-act').click()`,true);
  await new Promise(r=>setTimeout(r,4000));
  const s2=await win.webContents.executeJavaScript(`({open:!document.getElementById('captchaModal').hidden, iframes:document.querySelectorAll('#hcaptchaWidget iframe').length, ctx: document.getElementById('captchaTargetName').textContent, err:document.getElementById('captchaErr').hidden?null:document.getElementById('captchaErr').textContent})`,true);
  console.log('B_MODAL:', JSON.stringify(s2));
  await win.webContents.executeJavaScript("onCaptchaSolved('TOKEN_B')",true);
  await new Promise(r=>setTimeout(r,1200));
  const fin=await win.webContents.executeJavaScript(`({calls:window.__calls, done:document.querySelectorAll('.qdone').length, claimedBtns:document.querySelectorAll('.qcard-act[data-act=\\"claimed\\"]').length, modalHidden:document.getElementById('captchaModal').hidden})`,true);
  console.log('FINAL:', JSON.stringify(fin));
  // Waves 45: DỌN tệp harness — trước đây test này để rác harness-api.js /
  // harness-data.js trong electron/renderer/ sau mỗi lần chạy.
  for (const f of ['harness-api.js','harness-data.js','harness-seq.html','__seq.html']) {
    try { fs.unlinkSync(path.join(ROOT, f)); } catch {}
  }
  app.quit();
});
