/* Waves 46b — KIỂM CHỨNG giả thuyết: lưới "Đã làm" cao cố định (flex 1 1 auto)
   + ô aspect-ratio 1/1 -> hàng bị nén, row-gap biến mất -> các hàng dính nhau.
   Đo: chiều cao container, chiều cao ô thực, gap thực giữa 2 hàng, scrollHeight. */
const { app, BrowserWindow } = require('electron');
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..','electron','renderer');
function buildHtml(){
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const list=[];
  for(let i=1;i<=24;i++) list.push({id:String(i),name:'Quest '+i+' something',description:'d'+i,status:'claimed',progress:100,orbs:5*i,kind:'video',gameTitle:'Game '+i,appId:'12345678901234567'+(i%10),appIcon:'icon'+i});
  fs.writeFileSync(path.join(ROOT,'harness-data.js'),'window.__LIST = '+JSON.stringify(list)+';\n','utf8');
  fs.writeFileSync(path.join(ROOT,'harness-api.js'),`(function(){const h={log:null,event:null,state:null};window.__h=h;const a=()=>Promise.resolve({ok:true,state:'idle',config:{}});window.autoquest=new Proxy({},{get(_t,k){if(k==='onLog')return f=>{h.log=f;};if(k==='onEvent')return f=>{h.event=f;};if(k==='onState')return f=>{h.state=f;};return a;}});})();`,'utf8');
  return html.replace('<script src="renderer.js"></script>','<script src="harness-api.js"></script>\n<script src="harness-data.js"></script>\n<script src="renderer.js"></script>');
}
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{contextIsolation:false,nodeIntegration:false,webSecurity:false}});
  win.webContents.on('console-message',()=>{});
  const tmp=path.join(ROOT,'__gapc.html'); fs.writeFileSync(tmp,buildHtml(),'utf8');
  await win.loadFile(tmp); await new Promise(r=>setTimeout(r,1600));
  await win.webContents.executeJavaScript(`(async function(){
    await new Promise(r=>setTimeout(r,500));
    window.__h.event({type:'quest:inventory',data:{quests:window.__LIST}});
    await new Promise(r=>setTimeout(r,500));
    const d=document.querySelector('#questListDone'); d.hidden=false; d.style.display='';
    document.querySelector('#questListNew').hidden=true;
    document.querySelector('#questListActive').hidden=true;
    await new Promise(r=>setTimeout(r,500));
  })()`,true);
  const out=await win.webContents.executeJavaScript(`(function(){
    const l=document.querySelector('#questListDone');
    const card=l.closest('.quests-card');
    const lcs=getComputedStyle(l), ccs=getComputedStyle(card);
    const tiles=Array.from(l.querySelectorAll('.qdone'));
    const ts=tiles.map(t=>t.getBoundingClientRect());
    // group rows by top
    const rows={}; ts.forEach((r,i)=>{const k=Math.round(r.top); (rows[k]=rows[k]||[]).push(i);});
    const keys=Object.keys(rows).map(Number).sort((a,b)=>a-b);
    const rowH=keys.map(k=>Math.round(ts[rows[k][0]].height));
    const gaps=[]; for(let i=1;i<keys.length;i++) gaps.push(Math.round(keys[i]-(keys[i-1]+ts[rows[keys[i-1]][0]].height)));
    return JSON.stringify({
      cardH: Math.round(card.getBoundingClientRect().height),
      cardDisplay: ccs.display, cardFlexDir: ccs.flexDirection,
      listH: Math.round(l.getBoundingClientRect().height),
      listScrollH: l.scrollHeight, listClientH: l.clientHeight,
      listOverflowY: lcs.overflowY, listAlignContent: lcs.alignContent,
      listRowGap: lcs.rowGap, listColGap: lcs.columnGap,
      listFlex: lcs.flexGrow+' '+lcs.flexShrink+' '+lcs.flexBasis,
      tileCount: tiles.length,
      rowCount: keys.length,
      rowHeights: rowH,
      actualRowGaps: gaps,
      colPitch: Math.round(ts[1].left-ts[0].left),
      tileW: Math.round(ts[0].width), tileH: Math.round(ts[0].height),
      scrolls: l.scrollHeight > l.clientHeight,
    });
  })()`,true);
  const r=JSON.parse(out);
  console.log('=== ĐÃ LÀM grid — chẩn đoán nén hàng ===');
  for(const k of Object.keys(r)) console.log('  '+k+':', JSON.stringify(r[k]));
  console.log('\n  >>> row heights:', r.rowHeights.join(', '));
  console.log('  >>> row gaps   :', r.actualRowGaps.join(', '), '(CSS rowGap =', r.listRowGap + ')');
  console.log('  >>> list', r.listH + 'px tall, content', r.listScrollH + 'px, scrolls =', r.scrolls);
  try{fs.unlinkSync(tmp);fs.unlinkSync(path.join(ROOT,'harness-api.js'));fs.unlinkSync(path.join(ROOT,'harness-data.js'));}catch{}
  app.quit();
});
