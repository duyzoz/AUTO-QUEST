/* Waves 44 — PROBE THẬT cho ô "Đã làm" (thiết kế lại theo bro):
   1) Mỗi ô: badge LOGO ORB Ở TRÊN, logo NHIỆM VỤ Ở DƯỚI (đúng thứ tự DOM).
   2) KHÔNG có panel nổi bên ngoài (.qdone-tip đã bị xoá hẳn).
   3) Rê chuột → Orb MỜ đi + chữ (tên nhiệm vụ · bao nhiêu Orb · khi nào) hiện
      NGAY TRONG ô (.qdone-info opacity 0 → 1).
   4) Áp dụng cho TẤT CẢ quest đã nhận.
   Đo computed style + DOM tươi trong Chromium, cả 2 chế độ Sáng/Tối. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const list = [
  { id:'qA', name:'ROR2 Hallowed Concepts', status:'claimed', orbs:700, appId:'111122223333444455', appIcon:'a_abc123', gameTitle:'Risk of Rain 2', claimedAt:'2026-10-20T09:15:00.000Z' },
  { id:'qB', name:'Play 15 min', status:'claimed', orbs:200, appId:'222233334444555566', appIcon:'def456', gameTitle:'Some Game', claimedAt:'2026-10-21T18:04:00.000Z' },
  { id:'qC', name:'Watch video', status:'claimed', orbs:15, appId:'333344445555666677', appIcon:'ghi789', gameTitle:'Other', claimedAt:'2026-10-22T07:30:00.000Z' },
  { id:'qD', name:'Video task', status:'claimed', orbs:50, appId:'444455556666777788', appIcon:'jkl012', gameTitle:'G4', claimedAt:'2026-10-22T11:00:00.000Z' },
  { id:'qE', name:'Orb quest 5', status:'claimed', orbs:120, appId:'555566667777888899', appIcon:'mno345', gameTitle:'G5', claimedAt:'2026-10-23T01:20:00.000Z' },
  { id:'qF', name:'Orb quest 6', status:'claimed', orbs:60, appId:'666677778888999900', appIcon:'pqr678', gameTitle:'G6', claimedAt:'2026-10-23T03:45:00.000Z' },
  { id:'qG', name:'No orbs item', status:'claimed', orbs:0, rewardKind:'item', rewardName:'Cool Sword', appId:'777788889999000011', appIcon:'stu901', gameTitle:'G7' },
];
fs.writeFileSync(path.join(ROOT,'__dt-data.js'),'window.__LIST='+JSON.stringify(list)+';\n','utf8');
fs.writeFileSync(path.join(ROOT,'__dt-api.js'),`(function(){const h={log:null,event:null,state:null};window.__h=h;
  window.__openQuestCalls=[];
  const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return x=>{h.log=x;};
    if(k==='onEvent')return x=>{h.event=x;};
    if(k==='onState')return x=>{h.state=x;};
    if(k==='openQuest')return id=>{window.__openQuestCalls.push(id);return Promise.resolve({ok:true});};
    return f;}});})();`,'utf8');
const tmp = path.join(ROOT,'__dt.html');
fs.writeFileSync(tmp, html.replace('<script src="renderer.js"></script>','<script src="__dt-api.js"></script>\n<script src="__dt-data.js"></script>\n<script src="renderer.js"></script>'),'utf8');

/* Hover THẬT bằng cách thêm class mô phỏng: dùng el.matches(':hover') không được,
   nên ta đo 2 pha: (a) trạng thái nghỉ, (b) sau khi gán :hover qua CSS media.
   Electron/Chromium cho phép sendInputEvent chuột → dùng cách đó cho chính xác. */
const MEASURE = `(function(){
  const tiles=[...document.querySelectorAll('#questListDone .qdone')];
  const first=tiles[0];
  const face=first?first.querySelector('.qdone-face'):null;
  const info=first?first.querySelector('.qdone-info'):null;
  const orb=first?first.querySelector('.qdone-orb'):null;
  const num=first?first.querySelector('.qdone-orb-num'):null;
  const logo=first?first.querySelector('.qdone-logo'):null;
  function rgb(s){const m=String(s).match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(parseFloat);return[p[0],p[1],p[2],p[3]===undefined?1:p[3]];}
  function lum(c){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]);}
  function ratio(a,b){const l1=lum(a),l2=lum(b);const hi=Math.max(l1,l2),lo=Math.min(l1,l2);return +((hi+0.05)/(lo+0.05)).toFixed(2);}
  function effBg(el){let n=el;while(n){const c=rgb(getComputedStyle(n).backgroundColor);if(c&&c[3]>0.02)return c;n=n.parentElement;}return[255,255,255,1];}
  // Thứ tự DOM trong .qdone-face: badge Orb phải ĐỨNG TRƯỚC logo.
  // Waves 46c: khi KHÔNG nạp được logo nào (probe offline) app GỠ luôn thẻ ảnh
  // và chỉ giữ chữ tên game -> biến logo là null. Trường hợp đó thứ tự vẫn đúng
  // theo thiết kế (Orb -> [logo] -> chữ), nên xét cả .qdone-name làm mốc dưới.
  let orbBeforeLogo=null;
  const lowerEl = logo || (first?first.querySelector('.qdone-name'):null);
  if(face&&orb&&lowerEl){
    const kids=[...face.children];
    const io=kids.indexOf(orb.closest('.qdone-orbs')||orb);
    const il=kids.indexOf(lowerEl);
    // orb có thể nằm trong .qdone-orbs; đối chiếu theo mốc dưới (logo hoặc chữ).
    orbBeforeLogo = io>=0 && il>=0 && io<il;
  }
  const title=info?info.querySelector('.qdone-info-title'):null;
  const when=info?info.querySelector('.qdone-info-when'):null;
  const reward=info?info.querySelector('.qdone-info-reward'):null;
  return JSON.stringify({
    theme: document.documentElement.getAttribute('data-theme'),
    tileCount: tiles.length,
    tilesWithOrbBadge: tiles.filter(t=>t.querySelector('.qdone-orbs') && !t.querySelector('.qdone-orbs').hidden).length,
    tilesWithLogo: tiles.filter(t=>t.querySelector('.qdone-logo') && !t.querySelector('.qdone-logo').hidden).length,
    tilesWithInfo: tiles.filter(t=>t.querySelector('.qdone-info') && t.querySelector('.qdone-info').innerHTML.trim()).length,
    legacyTipPresent: !!document.querySelector('.qdone-tip'),
    // Overflow: ô phải CẮT chữ bên trong, không tràn ra ngoài khung vuông.
    tileOverflow: first?getComputedStyle(first).overflow:null,
    tilePos: first?getComputedStyle(first).position:null,
    // Thứ tự Orb trên / logo dưới.
    orbBeforeLogo,
    firstOrbNum: num?num.textContent:null,
    firstOrbLogoSrc: orb?orb.getAttribute('src'):null,
    firstOrbIcoW: orb?getComputedStyle(orb).width:null,
    infoHasTitle: !!(title && title.textContent.trim()),
    infoTitleText: title?title.textContent.trim():null,
    infoHasReward: !!(reward && reward.textContent.trim()),
    infoRewardHasOrbIcon: !!(reward && reward.querySelector('.qdone-info-orb')),
    infoRewardText: reward?reward.textContent.replace(/\\s+/g,' ').trim():null,
    infoHasWhen: !!(when && when.textContent.trim()),
    infoWhenText: when?when.textContent.trim():null,
    infoOpacityIdle: info?+Number(getComputedStyle(info).opacity).toFixed(2):null,
    faceOpacityIdle: face?+Number(getComputedStyle(face).opacity).toFixed(2):null,
    infoTransformIdle: info?getComputedStyle(info).transform:null,
    infoContrastTitle: (function(){ if(!title) return null; const c=rgb(getComputedStyle(title).color); const b=effBg(info); return ratio(c,b); })(),
    infoContrastWhen: when?ratio(rgb(getComputedStyle(when).color), effBg(info)):null,
    orbNumContrast: num?ratio(rgb(getComputedStyle(num).color), effBg(num)):null,
    ariaFirst: first?first.getAttribute('aria-label'):null,
  });
})()`;

const MEASURE_HOVER = `(function(){
  const tiles=[...document.querySelectorAll('#questListDone .qdone')];
  const first=tiles[0];
  if(!first) return JSON.stringify({err:'no tile'});
  const info=first.querySelector('.qdone-info');
  const face=first.querySelector('.qdone-face');
  return JSON.stringify({
    infoOpacityHover: info?+Number(getComputedStyle(info).opacity).toFixed(2):null,
    faceOpacityHover: face?+Number(getComputedStyle(face).opacity).toFixed(2):null,
    faceFilterHover: face?getComputedStyle(face).filter:null,
    infoInsideTile: !!(info && first.contains(info)),
    // Ô vuông: chữ phải nằm trong hộp, không đẩy chiều cao.
    tileH: Math.round(first.getBoundingClientRect().height),
    tileW: Math.round(first.getBoundingClientRect().width),
    infoH: info?Math.round(info.getBoundingClientRect().height):null,
  });
})()`;

/* Hover headless: CSS :hover không kích hoạt được từ executeJavaScript, cũng
   không đáng tin qua sendInputEvent khi cửa sổ ẩn. Cách CHUẨN: tiêm một class
   .qdone--hover SONG SONG với :hover trong CSS (đã khai báo), rồi đo computed
   style — phản ánh ĐÚNG các khai báo mà :hover dùng. */
const HOVER_ON = `(function(){
  const first=document.querySelector('#questListDone .qdone');
  if(!first) return 'no-tile';
  first.classList.add('qdone--hover');
  return 'ok';
})()`;
const HOVER_OFF = `(function(){
  const first=document.querySelector('#questListDone .qdone');
  if(first) first.classList.remove('qdone--hover');
  return 'ok';
})()`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({width:1500,height:950,show:true,webPreferences:{contextIsolation:false,nodeIntegration:false,webSecurity:false}});
  await win.loadFile(tmp);
  await new Promise(r=>setTimeout(r,1200));
  await win.webContents.executeJavaScript(`(function(){window.__h.event({type:'quest:inventory',data:{quests:window.__LIST}});return 'ok';})()`, true);
  await new Promise(r=>setTimeout(r,900));
  // Phải mở TAB "Đã làm" thì ô mới có layout (nếu không rect = 0x0).
  await win.webContents.executeJavaScript(`(function(){const b=document.getElementById('tabDone');if(b)b.click();return 'ok';})()`, true);
  await new Promise(r=>setTimeout(r,500));

  const dark = await win.webContents.executeJavaScript(MEASURE, true);
  await win.webContents.executeJavaScript(HOVER_ON, true);
  await new Promise(r=>setTimeout(r,450));
  const hoverDark = await win.webContents.executeJavaScript(MEASURE_HOVER, true);
  await win.webContents.executeJavaScript(HOVER_OFF, true);

  /* Waves 46c — Ép theme áp xong TRƯỚC khi đo.
     `setAttribute` trả về ngay, nhưng CSS có thể chưa được tính lại; đo sớm sẽ
     đọc phải màu cũ và cho ra contrast sai (đã gặp: đo được 1.1 trong khi giá
     trị đúng là 17.9). Ta đợi 2 frame + đọc một thuộc tính buộc recalc. */
  await win.webContents.executeJavaScript(
    `document.documentElement.setAttribute('data-theme','light'); void document.body.offsetHeight;`,
    true,
  );
  await win.webContents.executeJavaScript(
    `new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`,
    true,
  );
  await new Promise(r=>setTimeout(r,600));
  const light = await win.webContents.executeJavaScript(MEASURE, true);
  await win.webContents.executeJavaScript(HOVER_ON, true);
  await new Promise(r=>setTimeout(r,450));
  const hoverLight = await win.webContents.executeJavaScript(MEASURE_HOVER, true);
  await win.webContents.executeJavaScript(HOVER_OFF, true);

  console.log('DARK  :', dark);
  console.log('HOVER :', hoverDark);
  console.log('LIGHT :', light);
  console.log('HVLT  :', hoverLight);
  const d=JSON.parse(dark), l=JSON.parse(light), hd=JSON.parse(hoverDark), hl=JSON.parse(hoverLight);
  // tilesWithLogo: probe chạy OFFLINE nên CDN ảnh không tải được → app leo thang
  // sang tên game (đúng thiết kế fallback). Bỏ điều kiện này khỏi cổng kiểm,
  // nhưng BẮT BUỘC có tầng trên (badge Orb) và tầng thông tin.
  // Waves 46c — tilesWithOrbBadge đổi 6 → 7. Con số 6 CŨ chính là lỗi bro phàn
  // nàn ("nhiều cái ko hiện logo orbs"): ô thưởng vật phẩm (orbs = 0) bị
  // `orbRow.hidden = orbs <= 0` giấu badge. Nay MỌI ô đều có badge Orb → 7/7.
  // (Muốn đo "ô nào có logo game" thì phải dùng probe CÓ MẠNG:
  //  tools/probe-done-46c.js — probe này chạy offline nên luôn 0.)
  const ck = (o, h) => o.tileCount===7
    && o.tilesWithOrbBadge===7                     // Waves 46c: MỌI ô đều hiện logo Orb
    && o.tilesWithInfo===7                         // TẤT CẢ ô đều có khối thông tin
    && o.legacyTipPresent===false                  // KHÔNG còn panel nổi
    && o.tileOverflow==='hidden'                   // chữ bị cắt trong ô
    && o.tilePos==='relative'
    && o.orbBeforeLogo===true                      // Orb TRÊN, logo DƯỚI
    && o.firstOrbNum==='700'
    // Waves 46b: ô "Đã làm" dùng bản orb TO + ĐÃ TÁCH NỀN THẬT
    // (orb-logo-big.png). Ảnh gốc bro đưa còn màn đen alpha=128 phủ kín khung
    // -> vẽ ra ô vuông xám; nay alpha=0 ở ngoài đĩa orb.
    && o.firstOrbLogoSrc==='assets/orb-logo-big.png'
    && o.infoHasTitle && o.infoHasReward && o.infoHasWhen
    // Waves 46c — tooltip dựng lại theo ảnh chụp Discord: dòng thưởng là
    // "<N> Orbs đã được nhận vào", KHÔNG có icon orb nhỏ (ảnh Discord không có).
    && /700 Orbs đã được nhận vào/.test(o.infoRewardText||'')
    // Và ngày chỉ dd/mm (ảnh Discord: "22/10"), không kèm giờ/năm.
    && /^\d{1,2}\/\d{1,2}$/.test(o.infoWhenText||'')
    && o.infoOpacityIdle===0                       // nghỉ: chữ ẩn
    && o.faceOpacityIdle===1                       // nghỉ: mặt Orb rõ
    && (o.infoContrastTitle||0)>=4.5
    && (o.infoContrastWhen||0)>=4.5
    && (o.orbNumContrast||0)>=4.5
    && h.infoOpacityHover===1                      // hover: chữ hiện
    && h.faceOpacityHover<0.35                     // hover: Orb mờ đi
    && /blur/.test(h.faceFilterHover||'')          // hover: Orb bị blur
    && h.infoInsideTile===true                     // chữ nằm TRONG ô
    && Math.abs(h.tileH-h.tileW)<=2;               // vẫn là ô VUÔNG
  const ok = ck(d,hd) && ck(l,hl);
  if (!ok) {
    // Chẩn đoán: in rõ điều kiện nào không đạt (thay vì chỉ "FAIL" chung chung).
    for (const [tag, o, h] of [['DARK', d, hd], ['LIGHT', l, hl]]) {
      const conds = {
        tileCount: o.tileCount===7,
        orbBadge7: o.tilesWithOrbBadge===7,
        info7: o.tilesWithInfo===7,
        noLegacyTip: o.legacyTipPresent===false,
        overflowHidden: o.tileOverflow==='hidden',
        posRelative: o.tilePos==='relative',
        orbBeforeLogo: o.orbBeforeLogo===true,
        orbNum700: o.firstOrbNum==='700',
        bigOrbSrc: o.firstOrbLogoSrc==='assets/orb-logo-big.png',
        infoParts: o.infoHasTitle && o.infoHasReward && o.infoHasWhen,
        reward700: /700/.test(o.infoRewardText||''),
        rewardOrbIcon: o.infoRewardHasOrbIcon===true,
        infoIdle0: o.infoOpacityIdle===0,
        faceIdle1: o.faceOpacityIdle===1,
        cTitle: (o.infoContrastTitle||0)>=4.5,
        cWhen: (o.infoContrastWhen||0)>=4.5,
        cOrbNum: (o.orbNumContrast||0)>=4.5,
        hovInfo1: h.infoOpacityHover===1,
        hovFaceDim: h.faceOpacityHover<0.35,
        hovBlur: /blur/.test(h.faceFilterHover||''),
        hovInside: h.infoInsideTile===true,
        square: Math.abs(h.tileH-h.tileW)<=2,
      };
      const bad = Object.entries(conds).filter(([,v])=>!v).map(([k])=>k);
      console.log(`${tag} điều kiện KHÔNG đạt: ${bad.length?bad.join(', '):'(không có)'}`);
    }
  }
  console.log('\n=== WAVE 44 DONE-TILE:', ok ? 'PASS ✅' : 'FAIL ❌', '===');
  for (const f of ['__dt.html','__dt-api.js','__dt-data.js']) { try{fs.unlinkSync(path.join(ROOT,f));}catch(e){} }
  app.quit();
});
