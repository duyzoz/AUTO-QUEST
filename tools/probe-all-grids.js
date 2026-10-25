/* Waves 46b — ĐO CẢ 3 LƯỚI (Chưa làm / Chưa nhận / Đã làm) ở nhiều kích thước
   cửa sổ: xác nhận KHÔNG còn cặp hàng nào gap âm (xếp chồng). */
const { app, BrowserWindow } = require('electron');
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..','electron','renderer');
function buildHtml(){
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const list=[];
  for(let i=1;i<=26;i++) list.push({id:String(i),name:'Quest '+i+' a name long enough to wrap',description:'d'+i,
    status: i<=12?'claimed':(i<=18?'claimable':'todo'), progress: i<=12?100:40, orbs:5*i, kind:'video',
    gameTitle:'Game '+i, appId:'12345678901234567'+(i%10), appIcon:'icon'+i});
  fs.writeFileSync(path.join(ROOT,'harness-data.js'),'window.__LIST = '+JSON.stringify(list)+';\n','utf8');
  fs.writeFileSync(path.join(ROOT,'harness-api.js'),`(function(){const h={log:null,event:null,state:null};window.__h=h;const a=()=>Promise.resolve({ok:true,state:'idle',config:{}});window.autoquest=new Proxy({},{get(_t,k){if(k==='onLog')return f=>{h.log=f;};if(k==='onEvent')return f=>{h.event=f;};if(k==='onState')return f=>{h.state=f;};return a;}});})();`,'utf8');
  return html.replace('<script src="renderer.js"></script>','<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>');
}
const MEASURE=`(function(id){
  const l=document.querySelector(id);
  if(!l) return JSON.stringify({id:id, missing:true});
  if(l.hidden) return JSON.stringify({id:id, hidden:true, tileCount:0, badGaps:[], minGap:null});
  const cs=getComputedStyle(l);
  const items=Array.from(l.querySelectorAll('.qcard, .qdone'));
  if(!items.length) return JSON.stringify({id:id, tileCount:0, badGaps:[], minGap:null, note:'empty'});
  const rs=items.map(t=>t.getBoundingClientRect());
  const rows={}; rs.forEach((r,i)=>{const k=Math.round(r.top); (rows[k]=rows[k]||[]).push(i);});
  const keys=Object.keys(rows).map(Number).sort((a,b)=>a-b);
  const gaps=[]; for(let i=1;i<keys.length;i++) gaps.push(Math.round(keys[i]-(keys[i-1]+rs[rows[keys[i-1]][0]].height)));
  const bad=gaps.filter(g=>g<0);
  const st=l.querySelector('.qstate');
  return JSON.stringify({
    id:id, tileCount:items.length, rowCount:keys.length,
    autoRows:cs.gridAutoRows, rowGap:cs.rowGap, colGap:cs.columnGap,
    gaps:gaps, badGaps:bad, minGap: gaps.length?Math.min.apply(null,gaps):null,
    stateDisplay: st?getComputedStyle(st).display:null,
    tileH:Math.round(rs[0].height), tileW:Math.round(rs[0].width),
    scrolls: l.scrollHeight>l.clientHeight,
  });
})`;
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{contextIsolation:false,nodeIntegration:false,webSecurity:false}});
  win.webContents.on('console-message',()=>{});
  const tmp=path.join(ROOT,'__allgrids.html'); fs.writeFileSync(tmp,buildHtml(),'utf8');
  await win.loadFile(tmp); await new Promise(r=>setTimeout(r,1600));
  await win.webContents.executeJavaScript(`(async function(){
    await new Promise(r=>setTimeout(r,500));
    window.__h.event({type:'quest:inventory',data:{quests:window.__LIST}});
    await new Promise(r=>setTimeout(r,600));
  })()`,true);

  const sizes=[[1920,1080],[1600,900],[1366,768],[1280,800]];
  let fails=0;
  for(const [w,h] of sizes){
    win.setSize(w,h);
    await new Promise(r=>setTimeout(r,500));
    console.log(`\n===== VIEWPORT ${w}x${h} =====`);
    for(const id of ['#questListActive','#questListNew','#questListDone']){
      // reveal each panel one at a time
      await win.webContents.executeJavaScript(`(function(){
        ['#questListActive','#questListNew','#questListDone'].forEach(x=>{document.querySelector(x).hidden = (x!=='${id}');});
        void document.body.offsetHeight;
      })()`,true);
      await new Promise(r=>setTimeout(r,350));
      const raw=await win.webContents.executeJavaScript(MEASURE+'("'+id+'")',true);
      const r=JSON.parse(raw);
      const bad = r.badGaps && r.badGaps.length;
      if(bad) fails++;
      console.log(`  ${id.padEnd(20)} tiles=${String(r.tileCount).padStart(2)} rows=${String(r.rowCount||0).padStart(2)} autoRows=${(r.autoRows||'-')} minGap=${r.minGap===null?'-':r.minGap}  ${bad?'FAIL gaps='+r.badGaps.join(','):'OK'}`);
    }
  }
  console.log(`\nWAVES 46b GRID STACK: ${fails} fail`);
  try{fs.unlinkSync(tmp);fs.unlinkSync(path.join(ROOT,'harness-api.js'));fs.unlinkSync(path.join(ROOT,'harness-data.js'));}catch{}
  app.quit();
});
