/* Waves 44 — PROBE THẬT cho 4 hạng mục bro yêu cầu:
   1) Thương hiệu: tiêu đề "Auto Quest" + khẩu hiệu nền tảng; KHÔNG còn chữ cũ.
   2) Chưa đăng nhập → thẻ "ZoZ Community" + avatar/bìa MẶC ĐỊNH (không trống).
   3) Hướng dẫn token: MŨI TÊN bấm mới sổ ra + 2 tab (Console / Bot) + mũi tên
      phụ sổ hướng dẫn TẠO BOT.
   4) Khối "Cấu hình tài khoản" dùng TÔNG ĐEN NÂU, tương phản ≥ 4.5:1 cả 2 chế độ.
   Mọi kết luận lấy từ DOM/computed style THẬT trong Chromium. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT,'__w4-api.js'),`(function(){const h={log:null,event:null,state:null};window.__h=h;
  const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return x=>{h.log=x;};
    if(k==='onEvent')return x=>{h.event=x;};
    if(k==='onState')return x=>{h.state=x;};
    return f;}});})();`,'utf8');
fs.writeFileSync(path.join(ROOT,'__w4-data.js'),'window.__LIST=[];\n','utf8');
const tmp = path.join(ROOT,'__w4.html');
fs.writeFileSync(tmp, html.replace('<script src="renderer.js"></script>','<script src="__w4-api.js"></script>\n<script src="__w4-data.js"></script>\n<script src="renderer.js"></script>'),'utf8');

const M = `(function(){
  function rgb(s){const m=String(s).match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(parseFloat);return[p[0],p[1],p[2],p[3]===undefined?1:p[3]];}
  function lum(c){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]);}
  function ratio(a,b){const l1=lum(a),l2=lum(b);const hi=Math.max(l1,l2),lo=Math.min(l1,l2);return +((hi+0.05)/(lo+0.05)).toFixed(2);}
  function effBg(el){let n=el;while(n){const c=rgb(getComputedStyle(n).backgroundColor);if(c&&c[3]>0.02)return c;n=n.parentElement;}return[255,255,255,1];}
  const q=s=>document.querySelector(s);
  const g=s=>q(s);
  // (1) Thương hiệu
  const brand={
    title: document.title,
    topbar: (q('.topbar-brand')||{}).textContent||null,
    sideBrand: (q('.brand-name')||{}).textContent||null,
    sideTag: (q('.brand-tag')||{}).textContent||null,
    topbarTag: (q('.topbar-tag')||{}).textContent||null,
    aboutTitle: (q('#pageAbout .card-title')||{}).textContent||null,
    fullText: (document.body.innerText||''),
  };
  // (2) Guest = ZoZ Community + avatar/bìa mặc định
  const hb=q('#phBanner'), hero=q('#heroProfile'), phAv=q('#phAvatar');
  const guest={
    state: q('#dprofile').dataset.state,
    dpDisplay: (q('#dpDisplay')||{}).textContent||null,
    upName: (q('#upName')||{}).textContent||null,
    heroHidden: hero?hero.hidden:null,
    heroState: hero?hero.dataset.state:null,
    phDisplay: (q('#phDisplay')||{}).textContent||null,
    phUsername: (q('#phUsername')||{}).textContent||null,
    bannerHasDefault: hb?hb.classList.contains('default'):null,
    bannerBg: hb?getComputedStyle(hb).backgroundImage:null,
    avatarHasSvg: phAv?phAv.innerHTML.indexOf('<svg')>=0:null,
    avatarHtmlLen: phAv?phAv.innerHTML.trim().length:0,
    dpAvatarHasSvg: q('#dpAvatar')?q('#dpAvatar').innerHTML.indexOf('<svg')>=0:null,
  };
  // (3) Hướng dẫn token
  const gb=q('#guideBody'), tg=q('#btnGuideToggle');
  const guide={
    toggleExists: !!tg,
    toggleIsButton: tg?tg.tagName==='BUTTON':null,
    bodyHiddenDefault: gb?gb.hidden:null,
    ariaExpanded: tg?tg.getAttribute('aria-expanded'):null,
    chevronExists: !!q('.guide-chev'),
    tabConsole: !!q('#gTabConsole'),
    tabBot: !!q('#gTabBot'),
    paneBotHidden: q('#guidePaneBot')?q('#guidePaneBot').hidden:null,
    // Waves 45: tab Cách 2 nay là KHUNG ĐĂNG NHẬP DISCORD (OAuth2) + khối .txt.
    oauthAppId: !!q('#oauthAppId'),
    oauthPermChips: q('#oauthPerms') ? q('#oauthPerms').querySelectorAll('input[type=checkbox]').length : 0,
    oauthInviteBtn: !!q('#btnOAuthInvite'),
    oauthIdentifyBtn: !!q('#btnOAuthIdentify'),
    oauthUrlPreview: !!q('#oauthUrlPreview'),
    appTokImportBtn: !!q('#btnAppTokImport'),
    botGuideToggle: !!q('#btnBotGuideToggle'),
    botGuideBodyHidden: q('#botGuideBody')?q('#botGuideBody').hidden:null,
    botGuideSteps: q('#botGuideBody')?q('#botGuideBody').querySelectorAll('.step-item').length:0,
    botGuideText: q('#botGuideBody')?q('#botGuideBody').innerText.replace(/\\s+/g,' ').slice(0,2000):null,
  };
  // (4) Tông nâu cấu hình
  const cc=q('#pageSettings .config-card');
  const hint=q('#pageSettings .config-card .hint');
  const loop=q('#pageSettings .config-card .loop-box');
  const brown={
    cardFound: !!cc,
    cardBg: cc?getComputedStyle(cc).backgroundImage.slice(0,80):null,
    cardBgColor: cc?getComputedStyle(cc).backgroundColor:null,
    hintColor: hint?getComputedStyle(hint).color:null,
    hintBg: hint?effBg(hint):null,
    hintRatio: hint?ratio(rgb(getComputedStyle(hint).color), effBg(hint)):null,
    loopBg: loop?getComputedStyle(loop).backgroundColor:null,
    brownToken: getComputedStyle(document.documentElement).getPropertyValue('--brown-accent').trim(),
  };
  return JSON.stringify({theme:document.documentElement.getAttribute('data-theme')||'dark',brand,guest,guide,brown});
})()`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({width:1500,height:950,show:false,webPreferences:{contextIsolation:false,nodeIntegration:false,webSecurity:false}});
  await win.loadFile(tmp);
  await new Promise(r=>setTimeout(r,1400));

  const dark = JSON.parse(await win.webContents.executeJavaScript(M, true));

  // Mở tab "Cách 2 · Bot" + mở mũi tên hướng dẫn tạo bot (hành vi THẬT).
  const guideOpen = JSON.parse(await win.webContents.executeJavaScript(`(function(){
    function rgb(s){const m=String(s).match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(parseFloat);return[p[0],p[1],p[2],p[3]===undefined?1:p[3]];}
    const tg=document.getElementById('btnGuideToggle');
    tg.click();
    const body=document.getElementById('guideBody');
    const afterOpen={bodyHidden:body.hidden, ariaExpanded:tg.getAttribute('aria-expanded')};
    document.getElementById('gTabBot').click();
    const afterTab={paneBotHidden:document.getElementById('guidePaneBot').hidden, paneConsoleHidden:document.getElementById('guidePaneConsole').hidden,
      tabBotSelected:document.getElementById('gTabBot').getAttribute('aria-selected'), tabConsoleSelected:document.getElementById('gTabConsole').getAttribute('aria-selected')};
    const bgT=document.getElementById('btnBotGuideToggle');
    bgT.click();
    const afterBotGuide={botGuideHidden:document.getElementById('botGuideBody').hidden, ariaExpanded:bgT.getAttribute('aria-expanded')};
    // Đóng lại
    bgT.click(); tg.click();
    return JSON.stringify({afterOpen,afterTab,afterBotGuide});
  })()`, true));

  await win.webContents.executeJavaScript(`document.documentElement.setAttribute('data-theme','light')`, true);
  await new Promise(r=>setTimeout(r,700));
  const light = JSON.parse(await win.webContents.executeJavaScript(M, true));

  console.log('--- DARK  brand:', JSON.stringify(dark.brand));
  console.log('--- DARK  guest:', JSON.stringify(dark.guest));
  console.log('--- DARK  guide:', JSON.stringify(dark.guide));
  console.log('--- DARK  brown:', JSON.stringify(dark.brown));
  console.log('--- LIGHT brown:', JSON.stringify(light.brown));
  console.log('--- GUIDE behaviour:', JSON.stringify(guideOpen));

  const ckBrand = (o) => o.title==='Auto Quest · Nền tảng ALL IN ONE DISCORD'
    && o.topbar==='Auto Quest'
    && o.sideBrand==='Auto Quest'
    && o.sideTag==='Nền tảng ALL IN ONE DISCORD by NgDuy'
    && o.topbarTag==='ALL IN ONE DISCORD · by NgDuy'
    && o.aboutTitle==='Về Auto Quest'
    && o.fullText.indexOf('AUTO QUEST')<0
    && o.fullText.indexOf('THỐNG KÊ THU NHẬP VƯỢT LINK')<0;

  const ckGuest = (o) => o.state==='guest'
    && o.dpDisplay==='ZoZ Community'
    && o.upName==='ZoZ Community'
    && o.heroHidden===false
    && o.heroState==='guest'
    && o.phDisplay==='ZoZ Community'
    && o.bannerHasDefault===true
    && o.avatarHasSvg===true
    && o.dpAvatarHasSvg===true
    && o.avatarHtmlLen>50;

  const ckGuide = (o) => o.toggleExists && o.toggleIsButton
    && o.bodyHiddenDefault===true          // mặc định ĐÓNG
    && o.ariaExpanded==='false'
    && o.chevronExists
    && o.tabConsole && o.tabBot
    && o.paneBotHidden===true              // Cách 2 ẩn lúc đầu
    // Waves 45: tab Cách 2 = khung đăng nhập Discord + nạp token .txt.
    && o.oauthAppId && o.oauthPermChips>=4
    && o.oauthInviteBtn && o.oauthIdentifyBtn && o.oauthUrlPreview
    && o.appTokImportBtn
    && o.botGuideToggle
    && o.botGuideBodyHidden===true
    && o.botGuideSteps>=5
    && /developers/.test(o.botGuideText) && /applications/.test(o.botGuideText)
    && /SERVER MEMBERS INTENT/.test(o.botGuideText);

  const ckGuideBehaviour = (o) => o.afterOpen.bodyHidden===false
    && o.afterOpen.ariaExpanded==='true'
    && o.afterTab.paneBotHidden===false
    && o.afterTab.paneConsoleHidden===true
    && o.afterTab.tabBotSelected==='true'
    && o.afterTab.tabConsoleSelected==='false'
    && o.afterBotGuide.botGuideHidden===false
    && o.afterBotGuide.ariaExpanded==='true';

  // Gradient PHẢI là tông nâu: tối = rgb(23,17,13)..rgb(18,13,10);
  // sáng = rgb(253,247,239)..rgb(246,236,224). Đo bằng giá trị render thật.
  const ckBrown = (o) => o.cardFound
    && (/linear-gradient/.test(o.cardBg) && /rgb\(\s*23,\s*17,\s*13\)/.test(o.cardBg)
        || /rgb\(\s*253,\s*247,\s*239\)/.test(o.cardBg))
    && o.brownToken==='#d9a441'
    && (o.hintRatio||0)>=4.5;
  const ckDarkBrown = (o) => ckBrown(o) && /rgb\(\s*23,\s*17,\s*13\)/.test(o.cardBg);
  const ckLightBrown = (o) => ckBrown(o) && /rgb\(\s*253,\s*247,\s*239\)/.test(o.cardBg);

  const ok = ckBrand(dark.brand)
    && ckGuest(dark.guest)
    && ckGuide(dark.guide)
    && ckGuideBehaviour(guideOpen)
    && ckDarkBrown(dark.brown)
    && ckLightBrown(light.brown);

  console.log('\\n=== WAVE 44 FEATURES:', ok ? 'PASS ✅' : 'FAIL ❌', '===');
  if(!ok){
    console.log('  brand:', ckBrand(dark.brand));
    console.log('  guest:', ckGuest(dark.guest));
    console.log('  guide:', ckGuide(dark.guide));
    console.log('  guideBehaviour:', ckGuideBehaviour(guideOpen));
    console.log('  brown dark:', ckDarkBrown(dark.brown), 'light:', ckLightBrown(light.brown));
  }
  for (const f of ['__w4.html','__w4-api.js','__w4-data.js']) { try{fs.unlinkSync(path.join(ROOT,f));}catch(e){} }
  app.quit();
});
