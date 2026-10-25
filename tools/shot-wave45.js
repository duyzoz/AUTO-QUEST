/* Waves 45 — Chụp ảnh THẬT giao diện để tự kiểm tra bằng mắt (thay cho việc
   bro phải gửi ảnh chụp màn hình).
   Chụp 3 khung:
     1) Trang Auto Quest ở trạng thái KHÁCH (kiểm tra profile căn giữa + nhật ký
        có dấu tích ở đầu dòng).
     2) Trang Cài đặt → hướng dẫn → tab "Cách 2" (khung đăng nhập Discord).
     3) Chế độ Sáng, cùng 2 khung trên.
   Ảnh lưu vào build-release/ui-preview/. */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'electron', 'renderer');
const OUT = path.join(__dirname, '..', 'build-release', 'ui-preview');
fs.mkdirSync(OUT, { recursive: true });

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, '__shot-api.js'), `(function(){const h={};window.__h=h;
  const f=()=>Promise.resolve({ok:true,state:'idle',config:{}});
  window.autoquest=new Proxy({},{get(_t,k){
    if(k==='onLog')return x=>{h.log=x;};
    if(k==='onEvent')return x=>{h.event=x;};
    if(k==='onState')return x=>{h.state=x;};
    if(k==='appTokenStatus')return ()=>Promise.resolve({ok:true,hasBotToken:false,hasClientSecret:false,appId:'',path:'%APPDATA%\\\\AUTO-QUEST\\\\app_secrets.json',encrypted:true});
    return f;}});})();`, 'utf8');
const tmp = path.join(ROOT, '__shot.html');
fs.writeFileSync(tmp, html.replace('<script src="renderer.js"></script>', '<script src="__shot-api.js"></script>\n<script src="renderer.js"></script>'), 'utf8');

const SEED = `(function(){
  const ev=window.__h.event, lg=window.__h.log;
  // Nạp vài dòng nhật ký ĐỦ 5 loại để thấy dấu tích + màu.
  if (typeof appendLog === 'function') {
    appendLog('Sẵn sàng — bấm Quét nhiệm vụ để bắt đầu.', 'system');
    appendLog('Nạp nhiệm vụ thành công', 'stdout');
    appendLog('Đã nhận thưởng quest ROR2', 'stdout');
    appendLog('Orbs hiện có 4200', 'stdout');
    appendLog('Cảnh báo: phiên captcha hết hạn', 'warn');
    appendLog('Lỗi mạng tạm thời', 'stderr');
  }
  return 'ok';
})()`;

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('in-process-gpu');

async function shoot(win, name) {
  // Đợi 2 nhịp paint để tránh khung đen do compositor chưa kịp vẽ (headless + GPU off).
  await new Promise(r => setTimeout(r, 600));
  await win.webContents.executeJavaScript(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`, true);
  await new Promise(r => setTimeout(r, 400));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUT, name), img.toPNG());
  console.log('  đã lưu', name);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440, height: 940, show: false,
    webPreferences: { contextIsolation: false, nodeIntegration: false, webSecurity: false, offscreen: false },
  });
  await win.loadFile(tmp);
  await new Promise(r => setTimeout(r, 1600));
  await win.webContents.executeJavaScript(SEED, true);
  await new Promise(r => setTimeout(r, 2200));
  // Buộc vẽ lại toàn trang rồi mới chụp.
  await win.webContents.executeJavaScript(`(function(){ document.body.style.opacity='0.999'; void document.body.offsetHeight; document.body.style.opacity=''; return 'ok';})()`, true);

  console.log('--- chụp chế độ TỐI ---');
  await shoot(win, 'w45-1-quest-guest-dark.png');

  // Trang Cài đặt → mở hướng dẫn → tab Cách 2
  await win.webContents.executeJavaScript(`(function(){
    document.getElementById('navSettings').click();
    const g=document.getElementById('btnGuideToggle');
    if(g.getAttribute('aria-expanded')!=='true') g.click();
    const tb=document.getElementById('gTabBot'); if(tb) tb.click();
    const bg=document.getElementById('btnBotGuideToggle');
    if(bg && bg.getAttribute('aria-expanded')!=='true') bg.click();
    document.getElementById('oauthAppId').value='1234567890123456789';
    document.getElementById('oauthAppId').dispatchEvent(new Event('input',{bubbles:true}));
    return 'ok';})()`, true);
  await new Promise(r => setTimeout(r, 900));
  await shoot(win, 'w45-2-oauth-dark.png');

  console.log('--- chụp chế độ SÁNG ---');
  await win.webContents.executeJavaScript(`document.getElementById('themeLight').click()`, true);
  await new Promise(r => setTimeout(r, 900));
  await shoot(win, 'w45-3-oauth-light.png');
  await win.webContents.executeJavaScript(`(function(){
    document.getElementById('navQuest').click(); return 'ok';})()`, true);
  await new Promise(r => setTimeout(r, 700));
  await shoot(win, 'w45-4-quest-guest-light.png');

  for (const f of ['__shot.html', '__shot-api.js']) { try { fs.unlinkSync(path.join(ROOT, f)); } catch {} }
  console.log('XONG — ảnh ở build-release/ui-preview/');
  app.quit();
});
