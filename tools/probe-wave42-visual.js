/* Waves 42 — ĐO MÀU THẬT của thẻ "Dừng" (đỏ) + lưới "Đã làm" ở CẢ 2 chế độ.
   Không đọc ảnh: đo computed style + độ tương phản WCAG thật trong Chromium. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const list = [
  { id:'q1', name:'Watch video', status:'todo', orbs:15, appId:'111122223333444455', appIcon:'a_abc123', secondsNeeded:900, secondsDone:0 },
  { id:'q2', name:'Play game', status:'claimable', orbs:30, appId:'222233334444555566', appIcon:'def456', secondsNeeded:600, secondsDone:600 },
  { id:'q3', name:'Done quest', status:'claimed', orbs:50, appId:'333344445555666677', appIcon:'ghi789', rewardKind:'orbs' },
  { id:'q4', name:'Quest 4', status:'claimed', orbs:40, appId:'444455556666777788', appIcon:'jkl012' },
  { id:'q5', name:'Quest 5', status:'claimed', orbs:20, appId:'555566667777888899', appIcon:'mno345' },
  { id:'q6', name:'Quest 6', status:'claimed', orbs:60, appId:'666677778888999900', appIcon:'pqr678' },
];
fs.writeFileSync(path.join(ROOT,'__v42-data.js'),'window.__LIST='+JSON.stringify(list)+';\n','utf8');
fs.writeFileSync(path.join(ROOT,'__v42-api.js'),`(function(){const h={log:null,event:null,state:null};window.__h=h;
  const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return x=>{h.log=x;};
    if(k==='onEvent')return x=>{h.event=x;};
    if(k==='onState')return x=>{h.state=x;};
    return f;}});})();`,'utf8');
const tmp = path.join(ROOT,'__v42.html');
fs.writeFileSync(tmp, html.replace('<script src="renderer.js"></script>','<script src="__v42-api.js"></script>\n<script src="__v42-data.js"></script>\n<script src="renderer.js"></script>'),'utf8');

const MEASURE = `(function(){
  function rgb(s){ const m=String(s).match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    const p=m[1].split(',').map(x=>parseFloat(x)); return [p[0],p[1],p[2],p[3]===undefined?1:p[3]]; }
  function lum(c){ const f=v=>{v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4);};
    return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); }
  function ratio(a,b){ const l1=lum(a), l2=lum(b); const hi=Math.max(l1,l2), lo=Math.min(l1,l2);
    return +((hi+0.05)/(lo+0.05)).toFixed(2); }
  function effBg(el){ let n=el; while(n){ const c=rgb(getComputedStyle(n).backgroundColor);
    if(c && c[3]>0.02) return c; n=n.parentElement; } return [255,255,255,1]; }
  const stop = document.querySelector('.qcard[data-status="stop"]');
  const sState = stop ? stop.querySelector('.qcard-state') : null;
  const tile = document.querySelector('.qdone');
  const tName = tile ? tile.querySelector('.qdone-name') : null;
  const grid = document.getElementById('questListDone');
  const tpl = grid ? getComputedStyle(grid).gridTemplateColumns : '';
  const rep = tpl.match(/repeat\\(\\s*(\\d+)/);
  const out = {
    theme: document.documentElement.getAttribute('data-theme') || 'dark',
    stopCardFound: !!stop,
    stopStateText: sState ? sState.textContent.trim() : null,
    stopStateColor: sState ? getComputedStyle(sState).color : null,
    stopBorderColor: stop ? getComputedStyle(stop).borderTopColor : null,
    doneTiles: document.querySelectorAll('.qdone').length,
    doneCols: rep ? Number(rep[1]) : (tpl? tpl.split(' ').length : 0),
    doneAspect: tile ? getComputedStyle(tile).aspectRatio : null,
  };
  if (sState) out.stopContrast = ratio(rgb(getComputedStyle(sState).color), effBg(sState));
  if (tName) out.doneNameContrast = ratio(rgb(getComputedStyle(tName).color), effBg(tName));
  return JSON.stringify(out);
})()`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({width:1500,height:950,show:false,webPreferences:{contextIsolation:false,nodeIntegration:false,webSecurity:false}});
  await win.loadFile(tmp);
  await new Promise(r=>setTimeout(r,1200));
  await win.webContents.executeJavaScript(`(function(){
    const ev=window.__h.event;
    ev({type:'quest:inventory', data:{quests: window.__LIST}});
    ev({type:'quest:start', data:{id:'q2',name:'Play game'}});
    return 'ok';})()`, true);
  await new Promise(r=>setTimeout(r,400));
  await win.webContents.executeJavaScript(`document.getElementById('btnStop').click()`, true);
  await new Promise(r=>setTimeout(r,700));
  const dark = await win.webContents.executeJavaScript(MEASURE, true);
  await win.webContents.executeJavaScript(`document.documentElement.setAttribute('data-theme','light')`, true);
  await new Promise(r=>setTimeout(r,700));
  const light = await win.webContents.executeJavaScript(MEASURE, true);
  console.log('DARK :', dark);
  console.log('LIGHT:', light);
  const d = JSON.parse(dark), l = JSON.parse(light);
  const redish = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if(!m) return false;
    const p = m[1].split(',').map(Number); return p[0] > p[1] + 40 && p[0] > p[2] + 40; };
  const ok = d.stopCardFound && l.stopCardFound
    && d.stopStateText === 'Dừng' && l.stopStateText === 'Dừng'
    && redish(d.stopStateColor) && redish(l.stopStateColor)
    && d.doneCols === 6 && l.doneCols === 6
    && d.doneAspect === '1 / 1' && l.doneAspect === '1 / 1'
    && (d.stopContrast||0) >= 4.5 && (l.stopContrast||0) >= 4.5;
  console.log('\\n=== WAVE 42 VISUAL:', ok ? 'PASS ✅' : 'FAIL ❌', '===');
  for (const f of ['__v42.html', '__v42-api.js', '__v42-data.js']) {
    try { fs.unlinkSync(path.join(ROOT, f)); } catch (e) {}
  }
  app.quit();
});
