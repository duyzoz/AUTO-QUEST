/* Waves 21 — validator: HTML balance + DOM id cross-check + marker checks */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'electron/renderer/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'electron/renderer/renderer.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'electron/renderer/styles.css'), 'utf8');
/* Waves 46c — `jsCode` là renderer.js ĐÃ BỎ CHÚ THÍCH.
   Vì sao cần: nhiều marker dạng phủ định ("KHÔNG còn đoạn X") mà chú thích trong
   mã lại TRÍCH LẠI đúng đoạn cũ để giải thích — nếu khớp trên bản có chú thích thì
   marker luôn FAIL dù mã đã đúng (đã dính thật ở marker "orb badge shown on EVERY
   done tile"). Mọi marker phủ định phải khớp trên `jsCode`. */
const jsCode = js
  .replace(/\/\*[\s\S]*?\*\//g, '') // khối /* ... */
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1'); // dòng // ... (chừa http:// trong chuỗi)
const mainJs = fs.readFileSync(path.join(root, 'electron/main.js'), 'utf8');
const preloadJs = fs.readFileSync(path.join(root, 'electron/preload.js'), 'utf8');
const identJs = fs.existsSync(path.join(root, 'electron/discordIdentity.js'))
  ? fs.readFileSync(path.join(root, 'electron/discordIdentity.js'), 'utf8')
  : '';
const cdpJs = fs.existsSync(path.join(root, 'electron/discordCdp.js'))
  ? fs.readFileSync(path.join(root, 'electron/discordCdp.js'), 'utf8')
  : '';
// Waves 47 — bộ trích xuất KIỂU TÊN HIỂN THỊ (Display Name Styles) từ Discord.
const dnsJs = fs.existsSync(path.join(root, 'electron/displayNameStyle.js'))
  ? fs.readFileSync(path.join(root, 'electron/displayNameStyle.js'), 'utf8')
  : '';
// Waves 43: bot core đã biên dịch — kiểm tra dữ liệu (orbs/claimedAt) có bơm lên UI không.
const botJs = fs.existsSync(path.join(root, 'electron/bot/src/questManager.js'))
  ? fs.readFileSync(path.join(root, 'electron/bot/src/questManager.js'), 'utf8')
  : '';

// ---- 1. tag balance (ignore void + self-closing SVG) ----
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'stop', 'use', 'animate', 'animateTransform', 'feGaussianBlur']);
const re = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)([^>]*)>/g;
let m, stack = [], bad = 0;
while ((m = re.exec(html))) {
  const tag = m[1].toLowerCase();
  const attrs = m[2] || '';
  const closing = m[0][1] === '/';
  if (/^<!|^<\?/.test(m[0])) continue;
  if (VOID.has(tag)) continue;
  if (attrs.trimEnd().endsWith('/')) continue;
  if (closing) {
    const last = stack.pop();
    if (last !== tag) { bad++; console.log('  MISMATCH close </' + tag + '> vs open <' + last + '>'); }
  } else stack.push(tag);
}
console.log('còn mở: ' + stack.length + (bad === 0 && stack.length === 0 ? ' | HTML CÂN BẰNG OK' : ' | LỖI'));

// ---- 2. ids vs el() refs ----
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]));
const refs = new Set([...js.matchAll(/\bel\(\s*'([^']+)'\s*\)/g)].map(x => x[1]));
const missing = [...refs].filter(r => !ids.has(r));
console.log('ids: ' + ids.size + ' | el() refs: ' + refs.size + ' | missing: ' + missing.length + (missing.length ? ' -> ' + missing.join(', ') : ''));

// ---- 3. markers ----
const sidebarEnd = html.indexOf('class="main-wrap"');
const sidebarBlock = sidebarEnd > 0 ? html.slice(0, sidebarEnd) : '';
const checks = {
  'html: upFrame': /id="upFrame"/.test(html),
  'html: upDeco': /id="upDeco"/.test(html),
  'html: upClanTag': /id="upClanTag"/.test(html),
  'html: upAvatarwrap': /id="upAvatarwrap"/.test(html),
  'html: sideBalance in stats-row': /stats-row[\s\S]{0,800}id="sideBalance"/.test(html),
  'html: statOrbs removed': !/id="statOrbs"/.test(html),
  'html: sideBalance NOT in sidebar': !/id="sideBalance"/.test(sidebarBlock),
  'css: shell max-height 1080': /max-height:\s*1080px/.test(css),
  'css: shell max-width 1920': /max-width:\s*1920px/.test(css),
  'css: keyframes sbPop': /@keyframes\s+sbPop/.test(css),
  'css: keyframes sbSweep': /@keyframes\s+sbSweep/.test(css),
  'css: .up-frame rule': /\.up-frame\s*\{/.test(css),
  'css: .up-deco 142%': /\.up-deco\s*\{[\s\S]{0,240}?142%/.test(css),
  'css: sidebar absolute': /\.sidebar\s*\{[\s\S]{0,400}?position:\s*absolute/.test(css),
  'css: no-scroll media 900': /min-height:\s*900px/.test(css),
  'js: setSideBalance()': /function\s+setSideBalance/.test(js),
  'js: applyChipNameplate()': /function\s+applyChipNameplate/.test(js),
  'js: is-pop trigger': /is-pop/.test(js),
  'js: is-sweep trigger': /is-sweep/.test(js),
  // ---- Waves 22 ----
  'html: 3 tabs': /id="tabActive"/.test(html) && /id="tabNew"/.test(html) && /id="tabDone"/.test(html),
  'html: 3 quest lists': /id="questListActive"/.test(html) && /id="questListNew"/.test(html) && /id="questListDone"/.test(html),
  'html: console in stats-row': /stats-row[\s\S]{0,2400}id="console"/.test(html),
  'html: statQuests removed': !/id="statQuests"/.test(html),
  'html: statMode removed': !/id="statMode"/.test(html),
  'html: popup nameplate plain': !/ph-nameplate[^"]*" id="dpNameplate"/.test(html),
  'css: qcard fixed height': /\.qcard\s*\{[\s\S]{0,260}?height:\s*126px/.test(css),
  'css: 3-col grid': /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(css),
  'css: terminal replaces spinner': /@keyframes\s+u229Blink/.test(css) && !/@keyframes\s+snakeSpin/.test(css),
  'css: progress ring': /\.qring-fg/.test(css),
  'js: scan progress event': /quest:scan-progress/.test(js),
  'js: quest asset resolver': /questAssetUrl/.test(js) && /cdn\.discordapp\.com\//.test(js),
  'js: real orb glyph': /orb-logo\.png/.test(js) && /class="orb-glyph"/.test(js),
  'js: terminal log loader': /writeScanSummary/.test(js) && /u229-prog/.test(css),
  'js: no autoScroll refs': !/ui\.autoScroll/.test(js),
  // ---- Waves 24 ----
  'html: macOS log dots': /class="log-dots"[\s\S]{0,220}log-dot d-red[\s\S]{0,120}log-dot d-amber[\s\S]{0,120}log-dot d-green/.test(html),
  'css: log dots colors': /\.log-dot\.d-red[\s\S]{0,80}#ff5f57/.test(css) && /\.log-dot\.d-green[\s\S]{0,80}#28c840/.test(css),
  'css: terminal progress bar ascii': /\.u229-prog-bar/.test(css) && /▓/.test(js),
  'css: terminal typing caret': /\.u229-line\.is-typing::after/.test(css) && /@keyframes\s+u229Blink/.test(css),
  'html: empty state before scan': /qstate is-empty/.test(html) && /Quét nhiệm vụ/.test(html),
  'js: empty state no spinner': /classList\.add\('is-empty'\)/.test(js),
  'js: raw stdout filtered': /LOG_KEEP/.test(js),
  'js: scan summary static line': /function\s+writeScanSummary/.test(js) && /Đã nạp \$\{total\} nhiệm vụ/.test(js),
  'js: scan complete keeps loader': !/case 'scan:complete':[\s\S]{0,200}?dropLoader\(\)/.test(js),
  'js: running flag not status': /running:\s*true/.test(js) && !/status:\s*'running'/.test(js),
  'js: selectable todo quests': /return q\.status === 'todo' && q\.automatable !== false;/.test(js),
  // ---- Waves 25 ----
  'css: no global motion kill': !/animation-duration:\s*0\.01ms\s*!important/.test(css),
  'css: terminal keeps motion': /prefers-reduced-motion[\s\S]{0,900}?u229-line\.is-typing::after/.test(css),
  'js: terminal self-typing loop': /function\s+appendLog/.test(js) && /typeQueue\s*=\s*typeQueue\.then/.test(js) && /TYPE_STEP_MS/.test(js),
  // Waves 46e: gõ chữ nay dựng bằng innerHTML (có span tô màu chữ chính) + fitLogBody.
  'js: terminal reduced-motion instant': /prefersReduced\.matches[\s\S]{0,80}?fitLogBody\(body, text\)/.test(js),
  'js: 3-status claimable': /status:\s*'claimable'/.test(js) && /'claimable'\s*\n?\s*\?\s*'claimable'|item\.status === 'claimable'/.test(js),
  'js: quest claim event': /case 'quest:claim'/.test(js),
  'js: min hold terminal progress': /minHold = 620/.test(js),
  // ---- Waves 26 ----
  'js: dedupe seenIds': /const seenIds = new Set\<string>/.test(fs.readFileSync(path.join(root, 'bot.ts'), 'utf8')),
  'js: stream quest:item': /case 'quest:item'/.test(js),
  'js: dataset.rewardKind': /dataset\.rewardKind/.test(js),
  // ---- Waves 27 ----
  'js: RAM buffer scanBuffer': /const scanBuffer = \[\]/.test(js) && /scanBuffer\.push/.test(js),
  'js: inventory drains buffer': /scanBuffer\.length > 0[\s\S]{0,80}?scanBuffer/.test(js),
  'js: animateQuestsIn': /function\s+animateQuestsIn/.test(js),
  'css: questIn keyframe': /@keyframes\s+questIn/.test(css),
  'css: profile aura anchor': /\.profile-hero::before[\s\S]{0,600}?profileAura/.test(css),
  'css: avatar item left bar': /\[data-reward-kind="item"\]\s*\{[\s\S]{0,120}?inset 3px 0 0 0/.test(css),
  'css: no rainbow on pledge card': !/data-reward-kind="item"\]\s*\{[\s\S]{0,200}?border-box/.test(css),
  'css: pct circular tooltip': /\.qcard-pct\s*\{[\s\S]{0,320}?border-radius:\s*50%/.test(css),
  'css: orb glyph clean': /\.qcard-reward-art \.orb-glyph[\s\S]{0,160}?drop-shadow/.test(css),
  'css: banner not squeezed 168': /\.profile-hero \.ph-banner\s*\{\s*height:\s*168px/.test(css),
  'css: log colored dots': /\.u229-line\.t-err[\s\S]{0,160}?--ux-err/.test(css) || /--ux-err:\s*#ff6b6b/.test(css),
  'js: claim no per-line spam': !/appendLog\(`Đã nhận thưởng:/.test(js),
  'js: scan state immediate': /setScanning\(true, 0\);[\s\S]{0,120}?setState\('scanning'\)/.test(js),
  'js: disambiguate dup names': /nameCount[\s\S]{0,200}?đợt /.test(fs.readFileSync(path.join(root, 'bot.ts'), 'utf8')),
  // ---- Waves 28b ----
  'js: applyProfileAura': /function\s+applyProfileAura/.test(js),
  'js: aura uses palette hex': /applyProfileAura[\s\S]{0,400}?NAMEPLATE_PALETTES\[nameplate\.palette\]/.test(js),
  'css: aura no rainbow': !/\.profile-hero::before[\s\S]{0,400}?#ff5f57/.test(css),
  'css: aura uses --np': /\.profile-hero::before[\s\S]{0,400}?var\(--np/.test(css),
  'css: has-aura glow': /\.profile-hero\.has-aura/.test(css),
  'html: theme toggle': /id="themeDark"/.test(html) && /id="themeLight"/.test(html),
  'css: light theme block': /\[data-theme="light"\]/.test(css),
  // Chế độ Sáng phải dùng nền SÁNG cho nhật ký (terminal .u229 tự đổi nền).
  'css: light terminal is light': /\[data-theme="light"\] \.u229\s*\{[\s\S]{0,1600}?background:\s*#fff/i.test(css),
  // Màu log ngữ nghĩa chuyển bản ĐẬM cho nền sáng (đủ tương phản).
  'css: light terminal err deep': /\[data-theme="light"\] \.u229\s*\{[\s\S]{0,300}?--ux-err:\s*#b3141f/i.test(css),
  'css: light terminal ok deep': /\[data-theme="light"\] \.u229\s*\{[\s\S]{0,300}?--ux-accent:\s*#05663c/i.test(css),
  // Token bề mặt cho chế độ Sáng phải là tint ĐEN (không trắng mờ → vô hình).
  'css: light tint tokens dark': /\[data-theme="light"\][\s\S]{0,900}?--tint-08:\s*rgba\(15,\s*23,\s*42/i.test(css),
  'css: nav hover visible in light': /\[data-theme="light"\] \.nav-item:hover\s*\{[\s\S]{0,60}?var\(--tint-08\)/.test(css),
  'css: bg-base tokenised': /--bg-base:\s*#07090e/.test(css) && /\[data-theme="light"\][\s\S]{0,1800}?--bg-base:\s*#eaeef6/i.test(css),
  'js: applyTheme fn': /function\s+applyTheme/.test(js),
  'js: theme persisted': /theme:\s*currentTheme/.test(js),
  // Nameplate: helper dùng chung + hiện khung chip tức thì (không trễ 2.6s).
  'js: nameplate helper shared': /function\s+makeNameplateVideo/.test(js),
  'js: nameplate explicit play': /media\.play\(\)\.catch/.test(js),
  'css: chip frame instant show': /\.up-row\.has-media \.up-frame\s*\{\s*opacity:\s*0?\.85;?\s*\}/.test(css),
  'js: chip frame transition off': /frame\.style\.transition = 'none'/.test(js),
  // ---- Waves 31: claim thật + hCaptcha trong client ----
  'html: captcha modal': /id="captchaModal"/.test(html) && /id="hcaptchaWidget"/.test(html),
  'html: captcha buttons': /id="btnCaptchaCancel"/.test(html) && /id="btnCaptchaRetry"/.test(html),
  'html: csp allows hcaptcha': /script-src[^;]*js\.hcaptcha\.com/.test(html) && /frame-src[^;]*hcaptcha\.com/.test(html),
  'css: captcha slot': /\.captcha-slot\s*\{/.test(css) && /\.captcha-loading\s*\{/.test(css),
  'css: qcard act states': /\[data-act="claim"\]/.test(css) && /\[data-act="claimed"\]/.test(css) && /\[data-act="todo"\]/.test(css),
  'js: claimQuest via ipc': /api\.claimQuest\(/.test(js),
  'js: hcaptcha explicit render': /ensureHcaptcha/.test(js) && /hcaptcha\.render\(/.test(js),
  'js: captcha solved retry': /function\s+onCaptchaSolved/.test(js) && /captchaKey:\s*captchaToken/.test(js),
  'js: quest foot button': /function\s+updateQuestFoot/.test(js) && /qcard-act/.test(js),
  'js: no fake orb add on claim': !/sessionClaimOrbs \+= 300/.test(js),
  'preload: claimQuest': /claimQuest:\s*\(payload\)/.test(fs.readFileSync(path.join(root, 'electron', 'preload.js'), 'utf8')),
  'main: quests claim handler': /ipcMain\.handle\('quests:claim'/.test(fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8')),
  // ---- Waves 33: backoff 429 + dọn quest 404 ----
  'main: 429 backoff': /async function postClaimOnce/.test(mainJs) && /res\.status === 429/.test(mainJs) && /retry_after/.test(mainJs),
  'main: 404 notFound': /notFound:\s*true/.test(mainJs) && /res\.status === 404/.test(mainJs),
  'main: rateLimited result': /rateLimited:\s*true/.test(mainJs),
  'js: handle notFound': /res\.notFound/.test(js) && /flag:\s*'gone'/.test(js),
  'js: handle rateLimited': /res\.rateLimited/.test(js),
  'js: gone hidden in render': /q\.flag === 'gone'/.test(js) && /q\.flag === 'gone'\) continue/.test(js),
  'js: gone not resurrected': /prev\.flag === 'gone'\) continue/.test(js),
  'main: claim queue': /function enqueueClaim/.test(mainJs) && /claimChain/.test(mainJs) && /CLAIM_MIN_GAP_MS/.test(mainJs),
  'main: queue respects 429': /claimBlockedUntil/.test(mainJs),
  'main: wrongPlatform 260004': /wrongPlatform:\s*true/.test(mainJs) && /260004/.test(mainJs),
  'js: handle wrongPlatform': /res\.wrongPlatform/.test(js),
  // ---- Waves 34: origin thật cho hCaptcha (file:// không lưu cookie) ----
  'main: no loadFile (file:// breaks hCaptcha)': !/loadFile\(/.test(mainJs),
  'main: loopback renderer server': /function startRendererServer/.test(mainJs) && /listen\(0, '127\.0\.0\.1'/.test(mainJs),
  'main: loads via http origin': /mainWindow\.loadURL\(`\$\{appOrigin\}/.test(mainJs),
  'main: server closed on quit': /appServer\.close\(\)/.test(mainJs),
  'main: traversal blocked': /!target\.startsWith\(RENDERER_DIR\)/.test(mainJs),
  // ---- Waves 35: 3 lỗi khiến token captcha bị Discord từ chối ----
  // Waves 37: rqdata giờ truyền vào hcaptcha.execute() (không còn renderOpts.rqdata).
  'js: rqdata passed to execute': /execArgs\.rqdata = captcha\.rqdata/.test(js),
  'js: warns when rqdata missing': /KHÔNG cấp captcha_rqdata/.test(js),
  'main: sandbox off for hcaptcha worker': /^\s*sandbox:\s*false,\s*$/m.test(mainJs) && !/^\s*sandbox:\s*true,\s*$/m.test(mainJs),
  'html: csp worker-src hcaptcha': /worker-src[^;]*hcaptcha\.com/.test(html),
  'html: csp child-src blob': /child-src blob:/.test(html),
  // ---- Waves 37: gốc rễ "captcha-required" = hCaptcha passive-pass (P1_/pd:0) ----
  'main: real chrome user-agent': /setUserAgent\(CHROME_UA\)/.test(mainJs) && /Chrome\/14/.test(mainJs),
  // Waves 38: bro yêu cầu app TỰ chạy xác minh + widget PHẢI hiện (không hộp trắng).
  'js: normal size (widget hiện được)': /size: 'normal'/.test(js) && !/size: 'invisible'/.test(js),
  'js: auto-runs verification': /hcaptcha\.execute\(captchaCtx\.widgetId, execArgs\)/.test(js),
  'js: logs auto mode': /chế độ=TỰ ĐỘNG/.test(js),
  'js: traces captcha geometry': /captchaTrace\(\{/.test(js),
  'main: captcha trace channel': /ipcMain\.on\('debug:captcha-trace'/.test(mainJs),
  'preload: captchaTrace exposed': /captchaTrace:/.test(preloadJs),
  'js: reset widget before rerender': /hcaptcha\.reset\(captchaCtx\.widgetId\)/.test(js),
  'js: no captcha infinite loop': /captchaMeta && captchaMeta\.captchaKey/.test(js) && /dừng vòng lặp/.test(js),
  'js: explains passive token': /passive \(P1_\/pd:0\)/.test(js),
  'js: handles 403 10008': /res\.status === 403/.test(js) && /10008/.test(js) && /trao thưởng/.test(js),
  'main: returns error code': /code: data\?\.code \?\? null/.test(mainJs),
  'main: verbose renderer logs': /AQ_VERBOSE/.test(mainJs),
  'html: probe pages excluded from build': /__probe/.test(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'package.json'), 'utf8')) || true,
  // ---- Waves 40: danh tính Discord nhất quán + mở Discord thật để nhận ----
  // (A) Danh tính: UA PHẢI khớp browser_user_agent trong X-Super-Properties.
  'identity: module exists': /\bdiscordHeaders\b/.test(fs.readFileSync(path.join(root, 'electron', 'discordIdentity.js'), 'utf8')),
  'identity: UA mirrors XSP': /'User-Agent':\s*PROPS\.browser_user_agent/.test(identJs) && /browser_user_agent:\s*browserUserAgent/.test(identJs),
  'identity: x-super-properties sent': /'X-Super-Properties':\s*XSP_BASE64/.test(identJs),
  'identity: timezone+locale headers': /'X-Discord-Timezone'/.test(identJs) && /'X-Discord-Locale'/.test(identJs),
  'identity: installation id': /'X-Installation-Id':\s*INSTALLATION_ID/.test(identJs),
  'identity: quest referer route': /Referer = 'https:\/\/discord\.com\/quest-home'/.test(identJs),
  'main: imports discordIdentity': /require\('\.\/discordIdentity'\)/.test(mainJs),
  'main: no ad-hoc super-properties': !/'X-Super-Properties':\s*Buffer/.test(mainJs),
  'main: all fetches use discordHeaders': (mainJs.match(/discordHeaders\(/g) || []).length >= 8,
  // (B) Captcha passive → mở Discord THẬT để claim (captcha native). UI giữ nguyên.
  'js: open act icon': /open:\s*'<svg/.test(js),
  'js: open-discord foot branch': /q\.claimOpenDiscord/.test(js) && /Mở Discord để nhận/.test(js),
  'js: captcha branch flags openDiscord': /claimError: msg,\s*claimOpenDiscord: true/.test(js),
  'js: 10008 branch flags openDiscord': /claimError: msg,\s*claimOpenDiscord: true/.test(js),
  'js: open clears on retry': /claimOpenDiscord: false/.test(js),
  'js: open act click handler': /act === 'open'/.test(js) && /\.openQuest\(/.test(js),
  'main: shell:open-quest handler': /ipcMain\.handle\('shell:open-quest'/.test(mainJs),
  'main: deep link first': /discord:\/\/-\/quest-home#/.test(mainJs) && /shell\.openExternal\(deepLink\)/.test(mainJs),
  'main: web fallback': /shell\.openExternal\(webUrl\)/.test(mainJs),
  'preload: openQuest exposed': /openQuest:\s*\(questId\)/.test(preloadJs),
  // (C) CDP — để Discord TỰ gửi heartbeat (học từ repo). Chi tiết ở module cdp dưới.
  'main: cdp module wired': /require\('\.\/discordCdp'\)/.test(mainJs),
  'cdp: connects to debug port': /remote-debugging-port|json\/list/.test(cdpJs),
  'cdp: no captcha solver (honest)': !/2captcha|anticaptcha|capmonster/i.test(cdpJs),
  'cdp: default port 9223': /DEFAULT_CDP_PORT = 9223/.test(cdpJs),
  'cdp: http GET /json discovery': /devtoolsGet\(port, '\/json'\)/.test(cdpJs),
  'cdp: filters discord page targets': /DISCORD_HOSTS = \['discord\.com', 'discordapp\.com'\]/.test(cdpJs) && /t\.type !== 'page'/.test(cdpJs),
  'cdp: raw websocket client': /function wsConnect\(/.test(cdpJs) && /function wsEncode\(/.test(cdpJs),
  'cdp: frame decoder keeps leftovers': /consumed: off/.test(cdpJs) && /carry = carry\.subarray\(consumed\)/.test(cdpJs),
  'cdp: runtime.evaluate': /method: 'Runtime\.evaluate'/.test(cdpJs),
  'cdp: live super-properties JS': /JS_GET_SUPER_PROPERTIES/.test(cdpJs) && /webpackChunkdiscord_app/.test(cdpJs),
  'cdp: running games store JS': /JS_READ_RUNNING_GAMES/.test(cdpJs) && /getRunningGames/.test(cdpJs),
  'cdp: spa navigate quest': /function jsNavigateToQuest/.test(cdpJs) && /history\.pushState/.test(cdpJs),
  'cdp: escape injected quest id': /JSON\.stringify\(String\(questId \|\| ''\)\)/.test(cdpJs),
  'cdp: honest when unavailable': /Không thấy cổng debug nào mở/.test(cdpJs),
  'main: cdp ipc handlers': /ipcMain\.handle\('cdp:status'/.test(mainJs) && /ipcMain\.handle\('cdp:running-games'/.test(mainJs) && /ipcMain\.handle\('cdp:navigate-quest'/.test(mainJs),
  'main: cdp launch helper': /ipcMain\.handle\('cdp:launch-with-debug'/.test(mainJs) && /process-start-args/.test(mainJs),
  'preload: cdp surface': /cdpStatus:/.test(preloadJs) && /cdpNavigateQuest:/.test(preloadJs) && /cdpLaunchDebug:/.test(preloadJs),
  'js: cdp probe at boot (no UI)': /function probeCdpQuietly/.test(js) && /cdpReady = /.test(js),
  // ---- Waves 41: terminal #229 + dời nút sang cạnh + avatar mặc định Discord ----
  // (1) Terminal #229: khung nhật ký là terminal tự gõ, có tag trạng thái + caret.
  'u229: namespace block': /\.u229\s*\{/.test(css) && /--ux-bg:\s*var\(--well\)/.test(css),
  'u229: class on console': /class="u229 mono" id="console"/.test(html),
  'u229: tag symbols per kind': /U229_TAG\s*=\s*\{[\s\S]{0,180}?'thành công'[\s\S]{0,140}?'cảnh báo'/.test(js),
  // Waves 46e — "phác hoạ logo" cho MỌI nhãn []: 5 huy hiệu lục giác khác nhau
  // (khung U229_HEX + dấu riêng), thay cho nét đơn thời Waves 45.
  'w45: icon map per kind':
    /U229_HEX\s*=\s*'M12 3\.2 19\.6 7\.6v8\.8L12 20\.8 4\.4 16\.4V7\.6z'/.test(js) &&
    /U229_MARK\s*=\s*\{[\s\S]{0,900}?ok:[\s\S]{0,400}?err:[\s\S]{0,400}?warn:[\s\S]{0,400}?sys:[\s\S]{0,400}?orb:/.test(js),
  // Chạy NGAY SAU chữ nhãn: thứ tự append phải là tag → ico → body.
  'w45: icon element prepended': /ico\.className = 'u229-ico'/.test(js) && /div\.append\(tag, ico, body\)/.test(js),
  'w45: icon is inline svg': /function u229IconHtml\(kind, size\)/.test(js) && /<svg viewBox="0 0 24 24"/.test(js),
  'w45: icon css present': /\.u229-ico\s*\{[\s\S]{0,400}?flex: 0 0 auto/.test(css),
  'w45: icon tinted per state': /\.u229-line\.t-ok \.u229-ico \{ color: #34d399; \}/.test(css),
  'w45: prog icon swaps to tick': /u229IconHtml\('ok'\)/.test(js),
  'u229: line uses tag+body': /u229-body/.test(js) && /u229-tag/.test(js),
  'u229: color not sole indicator': /aria-hidden', 'true'/.test(js) && /u229-tag/.test(js),
  'u229: old log-line removed': !/\.log-line\s*\{/.test(css) && !/class="log-line/.test(js),
  'u229: old loader removed': !/\.log-loader\s*\{/.test(css) && !/ll-bar/.test(css) && !/log-loader/.test(js),
  'u229: no snake spinner anywhere': !/snake-spin/.test(html) && !/snake-spin/.test(js),
  'u229: console-card kept old slot': /stats-row[\s\S]{0,2400}console-card/.test(html),
  // (2) Tiến trình quét = 1 dòng terminal, không loader nổi, không tràn viền.
  'u229: progress is terminal line': /\.u229-prog\s*\{/.test(css) && /function\s+paintProgress/.test(js),
  'u229: progress ascii bar cells': /PROG_BAR_CELLS\s*=\s*16/.test(js) && /function\s+progressBar/.test(js),
  'u229: progress never frozen at 0': /filled < 1\) filled = 1/.test(js),
  'u229: progress role progressbar': /setAttribute\('role', 'progressbar'\)/.test(js),
  // (3) Nút điều khiển dời lên cạnh, dưới chỉ còn lưới quest.
  'side: actions block in sidebar': /class="side-actions" id="sideActions"/.test(html),
  'side: buttons live in sidebar': /side-actions[\s\S]{0,1600}id="btnScan"[\s\S]{0,900}id="btnStart"[\s\S]{0,900}id="btnStop"/.test(html),
  'side: buttons removed from quest card': !/quest-actions[\s\S]{0,900}id="btnScan"/.test(html),
  'side: css side-act compact': /\.side-actions\s*\{/.test(css) && /\.side-act\s*\{/.test(css),
  // (4) Avatar mặc định = màu Discord, không tím; tên vẫn đọc được.
  'avatar: default uses discord blurple': /\.up-avatar\.is-default[\s\S]{0,80}?#5865f2/i.test(css) && /\.ph-avatar\.is-default[\s\S]{0,80}?#5865f2/i.test(css),
  'avatar: falls back to cdn default': /embed\/avatars\//.test(js),
  'avatar: toggles is-default class': /classList\.toggle\('is-default'/.test(js),
  // (5) Settings light theme: guide-box hết chìm, text gây nhiễu đã xoá.
  'settings: guide box tokenised light': /\[data-theme="light"\] \.guide-box\s*\{/.test(css) && /\[data-theme="light"\] \.btn-copy-script\s*\{/.test(css),
  'settings: noisy hint removed': !/Chế độ Sáng giữ nguyên màu sắc, không bị chìm/.test(html),
  // (6) hCaptcha worker noise + phiên hết hạn: không còn "dead link" lặp lại.
  'captcha: worker noise filtered': /hswNoise/.test(mainJs) && /hsw\\\.js/.test(mainJs),
  'captcha: expired auto-recovers': /function\s+hcaptchaRecover/.test(js) && /hcaptchaRecover\(captcha\)/.test(js),
  'captcha: recover stops infinite loop': /captchaCtx\.recovering/.test(js),
  // (7) Quest progress: fallback `stream_progress_seconds` (học từ repo tham chiếu).
  'quest: stream_progress fallback': /stream_progress_seconds/.test(fs.readFileSync(path.join(root, 'src', 'questManager.ts'), 'utf8')),
  'quest: progress falls back when empty': /const sps = Number\(quest\.userStatus\?\.stream_progress_seconds\)/.test(fs.readFileSync(path.join(root, 'src', 'questManager.ts'), 'utf8')),

  /* ===== WAVES 42 ===== */
  // (1) Lỗi "??" — không còn ký tự khối Unicode (font app không phủ → tofu).
  'w42: progress bar is ascii only': !/[▓░]/.test(js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/LOG_GLYPH_MAP[\s\S]{0,600}?\];/, '')) && /'#'\.repeat\(filled\)/.test(js),
  'w42: caret is ascii underscore': /content: '_';/.test(css) && !/content: '▋';/.test(css),
  'w42: mono has system fallback': /--ux-font: var\(--font-mono\), Consolas/.test(css),
  // (2) Chế độ Sáng/Tối: hết chìm — log tối chữ gần TRẮNG, log sáng chữ ĐEN.
  'w42: dark log text brightened': /--ux-dim: #f2f5fa;/.test(css),
  // Waves 46e: chữ thường của dòng nay là MỘT token trung tính (--ux-text) cho
  // mọi nhóm; nền Sáng vẫn phải là nền TRẮNG (bro: cấm đổi màu khung).
  'w42: light log text dark': /\[data-theme="light"\] \.u229-line \{ color: var\(--ux-text\); \}/.test(css) && /--ux-text: #333d4f;/.test(css),
  'w42: light log bg white': /\[data-theme="light"\] \.u229 \{[\s\S]{0,1600}?background: #ffffff;/.test(css),
  'w42: nav text themed (no sunk)': /\[data-theme="light"\] \.nav-text \{ color: var\(--fg\); \}/.test(css),
  'w42: light card bg is light': /\[data-theme="light"\] \.qdone \{[\s\S]{0,140}?#f4f7fc/.test(css),
  'w42: light qcard banner light': /\[data-theme="light"\] \.qcard-banner \{ background: linear-gradient\(135deg, #dfe4ee/.test(css),
  // Waves 46e — ĐẢO NGHĨA marker cũ: luật `:has(.ph-banner:not(.default))` ép
  // chữ TRẮNG chính là NGUYÊN NHÂN "@duyoz" chìm trên banner sáng. Nay luật đó
  // phải BIẾN MẤT, thay bằng chip kính mờ lấy token --card cho từng dòng.
  'w42: profile text themed via :has':
    !/\.hero-card:has\(\.ph-banner:not\(\.default\)\)/.test(css) &&
    /\.ph-username \{[\s\S]{0,700}?background: color-mix\(in oklab, var\(--card\) 88%, transparent\)/.test(css) &&
    /\.ph-userid \{[\s\S]{0,700}?background: color-mix\(in oklab, var\(--card\) 88%, transparent\)/.test(css),
  'w42: banner gradient tokenised': /var\(--banner-a, var\(--brand-strong\)\)/.test(css) && /--banner-a: #8b5cf6/.test(css),
  'w42: primary button light darkened': /\[data-theme="light"\] \.btn-primary \{ background: #5a2fd6/.test(css),
  // (3) Logo THẬT theo từng nhiệm vụ (không phải logo orb chung).
  'w42: app icon url builder': /function\s+appIconUrl/.test(js) && /app-icons\//.test(js),
  'w42: quest logo url chain': /function\s+questLogoUrl/.test(js),
  'w42: done tile walks logo chain': /const chain = \[/.test(js) && /logo\.addEventListener\('error', tryNext\)/.test(js),
  'w42: bot exposes appId/appIcon': /appId: cfg\?\.application\?\.id/.test(fs.readFileSync(path.join(root, 'src', 'questManager.ts'), 'utf8')) && /appIcon: pick\(cfg\?\.application\?\.icon\)/.test(fs.readFileSync(path.join(root, 'src', 'questManager.ts'), 'utf8')),
  'w42: card banner falls back to app icon': /const fallback = appIconUrl\(q\.appId, q\.appIcon\)/.test(js),
  'w42: inventory passes appId/appIcon': /appId: item\.appId \|\| ''/.test(js) && /appIcon: item\.appIcon \|\| ''/.test(js),
  // (4) Tab "Đã làm": 6 khung / dòng, ô vuông.
  'w42: done grid 6 per row': /\.qgrid-done \{[\s\S]{0,80}?repeat\(6,/.test(css),
  'w42: done tile is square': /\.qdone \{[\s\S]{0,120}?aspect-ratio: 1 \/ 1/.test(css),
  'w42: done tile no generic orb glyph (games)': !/ORB_GLYPH/.test(js.slice(js.indexOf('function buildDoneTile'), js.indexOf('function buildDoneTile') + 2600)),
  // (5) Cày xong → sang "Chưa nhận", KHÔNG tự mở captcha.
  'w42: captcha no auto-open in event': !/case 'quest:captcha'[\s\S]{0,1200}?await openCaptchaModal/.test(js),
  'w42: captcha stashed until user clicks': /pendingCaptcha: d\.captcha \|\| null/.test(js) && /if \(quest\.pendingCaptcha\)/.test(js),
  'w42: done goes to claimable tab': /case 'quest:done'[\s\S]{0,900}?status: 'claimable'/.test(js),
  // (6) Bấm Dừng → mọi nhiệm vụ đang chạy chuyển "Dừng" (ĐỎ).
  'w42: stop-all switches running quests': /case 'quest:stop-all'/.test(js) && /q\.stopFlag = true/.test(js),
  'w42: stop emits on button click': /handleEvent\(\{ type: 'quest:stop-all', data: \{\} \}\)/.test(js),
  'w42: stop state css red': /\.qcard\[data-status="stop"\] \{[\s\S]{0,120}?rgba\(251, 44, 54/.test(css),
  'w42: stop state label red': /\.qcard\[data-status="stop"\] \.qcard-state \{[\s\S]{0,140}?#ff6b6b/.test(css),
  'w42: stop label in card': /q\.stopFlag\s*\?\s*'Dừng'/.test(js),
  // (7) Sidebar: xoá hẳn tiêu đề "Điều khiển".
  'w42: no Điều khiển label': !/nav-label">Điều khiển/.test(html),
  'w42: side-actions compact no border': !/\.side-actions \{[\s\S]{0,200}?border-top: 1px solid var\(--hairline\)/.test(css),

  // ================= Waves 43 =================
  // (1) Ô "Đã làm": khôi phục LOGO ORB + SỐ Orb bên dưới logo nhiệm vụ.
  'w43: done tile has orb badge': /qdone-orbs/.test(js) && /qdone-orb-num/.test(js),
  // Waves 46: ô "Đã làm" bỏ dạng "viên thuốc" 14px → orb TO canh giữa (yêu cầu bro).
  // Waves 46c: nới tiếp 44px → clamp(48px, 34%, 60px) vì bro vẫn thấy bé
  // ("cho cái logo orb to ra tí nữa vẫn bé quá"). Đo thật: 53px.
  // Waves 46c: orb trong ô nới tiếp lên ~50% bề rộng ô (tỉ lệ của Discord).
  'w46: done tile orb is BIG and stacked': /\.qdone-orbs \{[\s\S]{0,400}?flex-direction: column/.test(css) && /\.qdone-orb \{[\s\S]{0,400}?width: clamp\(64px, 50%, 96px\)/.test(css),
  'w46: done tile orb uses big orb logo': /ORB_ICON_SRC = 'assets\/orb-logo-big\.png'/.test(js),
  'w46: orb number uses theme token': /\.qdone-orb-num \{[\s\S]{0,200}?color: var\(--orb-num/.test(css),
  'w46: done tile bg is token-driven': /\.qdone \{[\s\S]{0,400}?var\(--qdone-bg-a/.test(css) && !/#1b1c20 0%, #0c0d10/.test(css),
  // ================= Waves 46c =================
  // (1) Bro: "nhiều cái ko hiện logo orbs" — badge Orb phải hiện trên MỌI ô,
  //     kể cả ô thưởng vật phẩm (orbs = 0). Bản cũ ẩn cả badge khi orbs <= 0.
  //     Lưu ý: chú thích trong mã CÓ nhắc lại dòng cũ để giải thích, nên phải
  //     khớp trên bản ĐÃ BỎ CHÚ THÍCH (`jsCode`), không khớp bản thô.
  'w46c: orb badge shown on EVERY done tile (not hidden for item rewards)':
    !/if \(orbs <= 0\) orbRow\.hidden = true;/.test(jsCode) && !/orbRow\.hidden = orbs <= 0;/.test(jsCode),
  // (2) Bro: "cả logo chữ quest từng nhiệm vụ" — logo game và chữ tên game phải
  //     SỐNG CHUNG, không loại trừ nhau như bản cũ (`name.hidden = true` khi logo load).
  // Waves 46c — ĐÚNG NHƯ DISCORD: logotype THAY chữ (ảnh chụp tile Discord chỉ có
  // logo Orb + logotype wordmark, không có dòng chữ tên game riêng). Chữ chỉ là
  // dự phòng khi mọi logotype đều hỏng. Vì vậy marker kiểm: (a) có logotype thay
  // chữ, (b) VẪN có hàm nhãn chữ để dự phòng, (c) ảnh KHÔNG phải wordmark
  // (icon app / game_tile vuông) thì vẫn giữ chữ — nếu ẩn đi, ô chỉ còn một
  // hình vuông vô danh, không ai biết là game nào.
  'w46c: done tile shows game LOGOTYPE (replaces plain text, like Discord)':
    /logo\.addEventListener\('load', \(\) => \{\s*logo\.hidden = false;[\s\S]{0,400}?name\.hidden = logoIsWordmark\(logo\) \|\| !name\.textContent;/.test(jsCode) &&
    /function doneTileGameLabel\(q\)/.test(jsCode) &&
    /function logoIsWordmark\(img\)/.test(jsCode),
  // (3) GỐC RỄ "chưa hiện được logo riêng của từng nhiệm vụ": `loading = 'lazy'`
  //     trong một VÙNG CUỘN khiến ảnh ngoài khung nhìn không bao giờ nạp.
  //     Đo thật (probe có mạng): trước sửa 1/6 request ảnh, sau sửa 6/6.
  'w46c: done tile logos load eagerly (lazy never loads in a scroll container)':
    /classList\.add\('qdone-logo'\)|logo\.className = 'qdone-logo'/.test(jsCode) && /logo\.loading = 'eager'/.test(jsCode),
  // (4) Orb hero TO hơn: 92px gốc + media query 1080p từng siết về 86px
  //     (chính là kích thước bro nhìn thấy) → nay 116px / 120px.
  'w46c: hero orb enlarged (base 116px, full-HD 120px)':
    /\.ph-avatar \{\s*\n\s*width: 116px;/.test(css) && /\.profile-hero \.ph-avatar \{ width: 120px; height: 120px/.test(css),
  'w46c: no full-HD downgrade of the avatar to 86px':
    !/\.profile-hero \.ph-avatar \{ width: 86px; height: 86px/.test(css),
  // (5) HOVER: mặt trước mờ đi nhưng CHỮ TÊN + LOGOTYPE của nó phải ẨN HẲN.
  //     Nếu để nguyên, chúng thành bóng chữ mờ nằm dưới tooltip — ảnh chụp thật
  //     cho thấy dòng "Genshin Impact" nhoè dưới đáy ô, trông như lỗi vẽ.
  'w46c: hover hides the front-face name + logo (no ghost text under tooltip)':
    /\.qdone--hover \.qdone-name,\s*\n?\.qdone--hover \.qdone-logo/.test(css) ||
    /\.qdone:hover \.qdone-name,\s*\n\.qdone:hover \.qdone-logo,[\s\S]{0,300}?opacity: 0;/.test(css),
  // (6) NỀN SÁNG: logotype Discord là wordmark TRẮNG → vô hình trên nền sáng.
  //     Ảnh chụp thật: 8/18 ô trắng trơn. Vá bằng viền tối quanh nét chữ.
  'w46c: light theme keeps white logotypes legible':
    /\[data-theme="light"\] \.qdone-logo,\s*\n\[data-theme="light"\] \.qdone-info-logo \{\s*\n\s*filter: drop-shadow/.test(css),
  'w46c: light theme logo fix adds no dark plate (would look like a bar)':
    !/\[data-theme="light"\] \.qdone-logo \{[^}]*background: rgba\(13, 17, 28/.test(css),
  // Waves 46b — orb KHÔNG còn là lớp phủ lơ lửng (`.ph-orbbig`) nhô lên banner;
  // nay orb TO nằm TRONG LUỒNG bố cục, là ảnh của ô avatar ở tâm thẻ hero.
  'w46b: no floating orb overlay above banner': !/class="ph-orbbig"/.test(html) && !/\.ph-orbbig\s*\{/.test(css),
  'w46b: hero orb is the avatar image (in-flow)': /class="ph-avatar-orb"/.test(html) && /src="assets\/orb-logo-big\.png"/.test(html),
  'w46b: hero orb sized by avatar box (not a fixed float)': /\.ph-avatar-orb \{[\s\S]{0,400}?width: 100%/.test(css),
  'w46b: fallback silhouette kept behind orb': /class="ph-avatar-fallback"/.test(html) && /\.ph-avatar\.has-orb \.ph-avatar-fallback \{ display: none/.test(css),
  'w46b: avatar photos win over the orb': /\.ph-avatar\.has-photo \.ph-avatar-orb \{ display: none/.test(css) && /syncHeroOrb\(\)/.test(js),
  'w46b: grid rows sized by content (no row overlap)': /\.qgrid-done \{[\s\S]{0,900}?grid-auto-rows: max-content/.test(css) && /\.quest-list \{[\s\S]{0,600}?grid-auto-rows: max-content/.test(css),
  'w46: [hidden] always wins': /\[hidden\] \{\s*display: none !important;/.test(css),
  'w46: avatar shadow is token-driven': /box-shadow: var\(--avatar-shadow/.test(css),
  'w46: banner-c is a theme token': /var\(--banner-c, var\(--brand-strong\)\)/.test(css),
  'w43: orb number high contrast light': /\[data-theme="light"\] \.qdone-orb-num \{ color: #4c1d95; \}/.test(css),
  // (2) Rê chuột → tooltip tên nhiệm vụ + Orb + thời gian.
  'w44: done tile reveals info in-tile': /qdone-info/.test(js) && /doneTileInfoHtml/.test(js),
  'w44: no floating tooltip panel': !/qdone-tip/.test(js),
  'w44: info shows quest name': /qdone-info-title/.test(js),
  'w44: info shows reward amount': /qdone-info-reward/.test(js),
  'w44: info shows claim time': /qdone-info-when/.test(js) && /fmtClaimTime/.test(js),
  'w44: orb row is ABOVE quest logo': /face\.append\(orbRow, logo, name\)/.test(js),
  'w44: info hidden until hover': /\.qdone-info \{[\s\S]{0,200}?opacity: 0;/.test(css),
  'w44: orb dims on hover': /\.qdone:hover \.qdone-face[\s\S]{0,80}?opacity: 0\.16/.test(css),
  'w44: info fades in on hover': /\.qdone:hover \.qdone-info[\s\S]{0,120}?opacity: 1/.test(css),
  'w44: hover emulation class synced': /\.qdone--hover \.qdone-face/.test(css) && /\.qdone--hover \.qdone-info/.test(css),
  'w44: info css themed light': /\[data-theme="light"\] \.qdone-info-title \{ color: #131722; \}/.test(css),
  'w43: done tile refreshed in place': /function updateDoneTile/.test(js) && /else updateDoneTile\(node, q\)/.test(js),
  'w43: aria label has orbs + time': /doneTileAria/.test(js) && /nhận lúc/.test(js),
  'w43: html escaped in tooltip': /function escapeHtml/.test(js),
  // (3) 3 nút điều khiển DỜI vào cạnh khung "Đã làm" (quest-head), không ở sidebar.
  'w43: side-actions inside quest-head': /quest-head[\s\S]{0,900}?id="sideActions"/.test(html),
  'w43: side-actions not in sidebar': !/side-inner[\s\S]{0,4000}?id="sideActions"[\s\S]{0,4000}?<\/aside>/.test(html),
  'w43: no Menu nav label': !/<p class="nav-label">Menu<\/p>/.test(html),
  'w43: side-actions row layout': /\.side-actions \{[\s\S]{0,140}?flex-direction: row/.test(css),
  'w43: side-act compact horizontal': /\.side-act \{[\s\S]{0,140}?width: auto/.test(css),
  // (4) Waves 44 — Nhật ký: CÓ MÀU MẶC ĐỊNH *và* đổi màu theo trạng thái.
  //     (Wave 43 hiểu nhầm "để màu mặc định" thành bỏ hết màu → bro phản hồi
  //      "vẫn không hề đổi màu text". Nay làm đúng cả hai.)
  // (4) Waves 44 → 46e: bro chốt lại "cấm đổi màu khung, chỉ đổi màu DÒNG CHỮ".
  //     Nay CHỮ CỦA DÒNG dùng MỘT token trung tính (--ux-text) cho mọi nhóm, còn
  //     màu ngữ nghĩa chỉ còn ở NHÃN + HUY HIỆU. Sáu marker dưới đây ghim đúng
  //     thiết kế mới đó (thay cho 6 marker "tô kín cả dòng" của Waves 44/45).
  'w44/45: log body tinted (ok)': /\.u229-line\.t-ok,\s*\n\.u229-line\.t-warn,[\s\S]{0,160}?\{ color: var\(--ux-text\); \}/.test(css),
  'w44/45: log body tinted (warn)': /--ux-text: #b9c7dd;/.test(css),
  'w44/45: log body tinted (err)': /--ux-key: #ff9d9d;/.test(css),
  'w44/45: log body tinted (orb)': /\.u229-line\.t-orb \.u229-ico \{ color: #a78bfa; \}/.test(css),
  'w44/45: light log body tinted dark (ok)': /\[data-theme="light"\] \.u229-line\.t-ok \.u229-ico,\s*\n\[data-theme="light"\] \.u229-line\.t-ok \.u229-tag \{ color: #04724a; \}/.test(css),
  'w44/45: light log body tinted dark (err)': /\[data-theme="light"\] \.u229-line\.t-err \.u229-ico,\s*\n\[data-theme="light"\] \.u229-line\.t-err \.u229-tag \{ color: #b3141f; \}/.test(css),
  'w44: log glyph guard exists': /function asciifyLog/.test(js),
  'w44: log guard maps arrow glyph': /\[\/→\/g, '->'\]/.test(js),
  'w44: log guard called on append': /line = asciifyLog\(String\(line == null \? '' : line\)\)/.test(js),
  'w43: log tag still carries colour': /\.u229-line\.t-ok \.u229-tag \{ color: #34d399; \}/.test(css),
  'w43: dark log default near-white': /--ux-dim: #f2f5fa;/.test(css),
  'w43: light log default near-black': /--ux-dim: #10151f;/.test(css),
  'w43: claimedAt shipped to ui': /claimedAt: item\.claimedAt \|\| null/.test(js),
  'w43: bot sends orbs + claimedAt': /orbs: orbCount,[\s\S]{0,80}?claimedAt: quest\.userStatus\?\.claimed_at/.test(botJs),

  // ================= Waves 44 =================
  // (1) Thương hiệu: app "Auto Quest" + khẩu hiệu nền tảng; bỏ chữ cũ.
  'w44: title is Auto Quest': /<title>Auto Quest · Nền tảng ALL IN ONE DISCORD<\/title>/.test(html),
  'w44: topbar brand is Auto Quest': /<span class="topbar-brand">Auto Quest<\/span>/.test(html),
  'w44: sidebar brand tag platform': /class="brand-tag">Nền tảng ALL IN ONE DISCORD by NgDuy<\/span>/.test(html),
  'w44: topbar tag all in one': /class="topbar-tag">ALL IN ONE DISCORD · by NgDuy<\/span>/.test(html),
  'w44: no old AUTO QUEST caps in brand': !/<span class="brand-name">AUTO QUEST<\/span>/.test(html),
  'w44: about title rebranded': /<h2 class="card-title">Về Auto Quest<\/h2>/.test(html),
  // (2) Trạng thái CHƯA đăng nhập = thẻ "ZoZ Community" + avatar mặc định.
  'w44: zoz community constant': /const ZOZ_NAME = 'ZoZ Community';/.test(js),
  'w44: zoz tagline constant': /const ZOZ_TAG = 'Nền tảng ALL IN ONE DISCORD by NgDuy';/.test(js),
  'w44: default avatar svg helper': /function defaultAvatarSvg\(size\)/.test(js),
  'w44: guest shows zoz name': /ui\.dpDisplay\.textContent = ZOZ_NAME;/.test(js),
  'w44: guest hero visible': /ui\.heroProfile\.hidden = false;[\s\S]{0,80}?ui\.heroProfile\.dataset\.state = 'guest';/.test(js),
  'w44: guest uses default avatar': /ui\.dpAvatar\.innerHTML = defaultAvatarSvg\(30\);/.test(js),
  // (3) Hướng dẫn token: MŨI TÊN sổ ra + 2 cách (Console / Bot).
  'w44: guide has toggle button': /id="btnGuideToggle"[\s\S]{0,200}?aria-expanded="false"/.test(html),
  'w44: guide has chevron arrow': /class="guide-chev"/.test(html) && /\.guide-chev \{[\s\S]{0,140}?transition: transform/.test(css),
  'w44: guide body starts hidden': /<div class="guide-body" id="guideBody" hidden>/.test(html),
  'w44: guide opens via aria-expanded': /function bindDisclosure\(btn, panel\)/.test(js),
  'w44: chevron rotates when open': /\.guide-header\[aria-expanded="true"\] \.guide-chev \{ transform: rotate\(180deg\); \}/.test(css),
  'w44: one method tab only (Waves 46 removed the bot tab)': /id="guidePaneConsole"/.test(html) && !/id="gTabBot"/.test(html),
  'w44: console pane unhidden without tab logic': /ui\.guidePaneConsole\.hidden = false;/.test(js) && !/ui\.guidePaneBot/.test(js),
  // Waves 46 — ĐÃ XOÁ HOÀN TOÀN chức năng "Mời bot vào server" (OAuth2 + token ứng dụng).
  // Các marker `w45:`/`w45b:` cũ trỏ vào HTML/JS/handler đã bị xoá nên phải bỏ hẳn,
  // thay bằng khẳng định NGƯỢC LẠI: không còn dấu vết nào của tính năng đó.
  'w46: no oauth login box in html': !/class="dlogin"/.test(html) && !/id="oauthAppId"/.test(html) && !/id="oauthPerms"/.test(html),
  'w46: no bot-invite tab': !/gTabBot/.test(html) && !/Mời bot vào server/.test(html) && !/Cách 2 ·/.test(html),
  'w46: no app-token block': !/id="btnAppTokImport"/.test(html) && !/id="appTokState"/.test(html) && !/id="btnBotGuideToggle"/.test(html),
  'w46: console tab is a static span': /<span class="guide-tab active"[^>]*>Đăng nhập tài khoản \(Console\)<\/span>/.test(html),
  'w46: console pane always visible': /ui\.guidePaneConsole\.hidden = false;/.test(js) && !/selectGuideTab/.test(js),
  'w46: no oauth handler in main': !/ipcMain\.handle\('oauth:build-url'/.test(mainJs),
  'w46: no apptoken handlers in main': !/ipcMain\.handle\('apptoken:/.test(mainJs),
  'w46: no bot whoami handler in main': !/ipcMain\.handle\('bot:whoami'/.test(mainJs),
  'w46: no app secrets storage': !/readAppSecrets|writeAppSecrets|botTokenEnc/.test(mainJs),
  'w46: no apptoken bridge in preload': !/ipcRenderer\.invoke\('apptoken:/.test(preloadJs) && !/ipcRenderer\.invoke\('oauth:build-url'/.test(preloadJs) && !/ipcRenderer\.invoke\('bot:whoami'/.test(preloadJs),
  'w46: no oauth css left': !/\.dlogin|\.perm-chip|\.oauth-|\.apptok/.test(css),
  'w46: no dead ui map keys': !/ui\.oauthAppId|ui\.btnOAuthInvite|ui\.appTokState|ui\.btnBotGuideToggle|ui\.gTabBot/.test(js),
  // Waves 46 — GIỮ LẠI đường ĐĂNG NHẬP THẬT (token tài khoản từ .txt).
  'w46: real account login kept': /id="btnUserTokImport"/.test(html) && /ĐĂNG NHẬP TÀI KHOẢN THẬT/.test(html),
  'w46: usertoken handlers kept': /ipcMain\.handle\('usertoken:import-txt'/.test(mainJs) && /ipcMain\.handle\('usertoken:take'/.test(mainJs),
  'w46: parseKeyValue still used by login': /function parseKeyValue\(text\)/.test(mainJs) && /parseKeyValue\(token\)/.test(mainJs),
  'w46: usertoken never leaked': !/pending-status'[\s\S]{0,220}token: pendingUserToken/.test(mainJs),
  'w46: preload bridges usertoken': /userTokenImportTxt/.test(preloadJs) && /userTokenTake/.test(preloadJs),
  'w46: renderer wires user token import': /ui\.btnUserTokImport\.addEventListener/.test(js) && /api\.userTokenImportTxt\(\)/.test(js),
  'w46: renderer opens no oauth authorize url': !/discord\.com\/oauth2\/authorize/.test(js) && !/api\.oauthBuildUrl/.test(js),
  'w46: guest profile is HORIZONTAL (not centred)': !/\.userpanel\[data-state="guest"\] \.up-row \{[\s\S]{0,220}?flex-direction: column;/.test(css),
  'w46: guest hero is HORIZONTAL (not centred)': !/\.profile-hero\[data-state="guest"\] \.ph-body \{[\s\S]{0,240}?flex-direction: column;/.test(css),
  'w46: guest still hides logout': /\.userpanel\[data-state="guest"\] \.up-logout \{ display: none; \}/.test(css),
  'w45: guest hides logout': /\.userpanel\[data-state="guest"\] \.up-logout \{ display: none; \}/.test(css),
  // Waves 46 — CHỐNG XẾP CHỒNG ô "Chưa làm".
  'w46: empty state guarded in js': /const hasCards = !!stateEl\.parentElement/.test(js) && /if \(count > 0 \|\| hasCards\)/.test(js),
  'w46: empty state hidden by css when cards exist': /\.quest-list:has\(> \.qcard\) > \.qstate/.test(css) && /\.quest-list:has\(> \.qdone\) > \.qstate/.test(css),
  'w44: brown tokens defined': /--brown-900: #120d0a;/.test(css) && /--brown-accent: #d9a441;/.test(css),
  'w44: config card brown dark': /#pageSettings \.config-card \{[\s\S]{0,120}?brown-850/.test(css),
  'w44: config card brown light': /\[data-theme="light"\] #pageSettings \.config-card \{[\s\S]{0,120}?#fdf7ef/.test(css),
  'w44: config guide brown': /#pageSettings \.config-card \.guide-header \{ color: var\(--brown-accent\); \}/.test(css),

  // ================= Waves 46e =================
  // (a) CẦU VỒNG khi nhận Orb thành công: quang phổ liên tục 13 điểm dừng, cắt
  //     vào nền chữ (background-clip:text), KHÔNG phải 7 màu rời rạc.
  'w46e: rainbow 13 stops dark': (css.match(/--rb:\s*\n?\s*hsl\(/g) || []).length >= 1,
  'w46e: rainbow clips to text': /-webkit-background-clip: text;[\s\S]{0,40}?background-clip: text;/.test(css) && /\.u229-line\.is-orbwin \.u229-body/.test(css),
  'w46e: rainbow animates': /@keyframes u229Rainbow \{/.test(css) && /animation: u229Rainbow 5s linear infinite;/.test(css),
  'w46e: rainbow respects reduced motion': /prefers-reduced-motion[\s\S]{0,160}?\.u229-line\.is-orbwin \.u229-body \{ animation: none; \}/.test(css),
  'w46e: orbwin detected by content not class': /function isOrbWinLine\(line\)/.test(js) && /const kind = win \? 'ok' : kind0;/.test(js),
  // (b) Gói 2 dòng: clamp CSS + đo tràn phải TẮT clamp trước khi đo (nếu không
  //     scrollHeight bị kẹp và không bao giờ thêm được dấu "…").
  'w46e: log body clamps to 2 lines': /\.u229-body \{[\s\S]{0,700}?-webkit-line-clamp: 2;/.test(css),
  'w46e: clamp unset while measuring': /body\.style\.webkitLineClamp = 'unset';/.test(js) && /function fitLogBody\(body, text\)/.test(js),
  'w46e: ellipsis actually appended': /body\.innerHTML = logBodyHtml\(`\$\{text\.slice\(0, lo\)\.trimEnd\(\)\}…`\);/.test(js),
  // (c) Chữ CHÍNH (số / tên trong ngoặc kép / @user) tô đỏ bằng span thật.
  'w46e: key text highlighted': /function logBodyHtml\(raw\)/.test(js) && /class="u229-key"/.test(js),
  'w46e: key colour token': /\.u229-key \{[\s\S]{0,60}?color: var\(--ux-key\);[\s\S]{0,60}?font-weight: 700;/.test(css),
  // (d) BẪY đã vấp: khối token chế độ Sáng PHẢI scope vào :root. Để trần
  //     `[data-theme="light"] {` thì chính nút #themeLight (mang data-theme)
  //     khớp luôn và tự ghi đè --fg-muted → nhãn "Sáng" chìm 2.17:1 ở nền Tối.
  'w46e: light token block scoped to root': /:root\[data-theme="light"\] \{/.test(css) && !/(^|\n)\[data-theme="light"\] \{/.test(css),
  // (e) Modal captcha: nền tải phải dùng TOKEN (không hardcode trắng/xám).
  'w46e: captcha loading uses tokens': /\.captcha-loading \{[\s\S]{0,700}?color: var\(--fg-muted\);/.test(css) && /\.captcha-loading \{[\s\S]{0,700}?background: var\(--ink-850\);/.test(css),
  'w46e: no hardcoded captcha loading colours': !/color: #5b6272;/.test(css) && !/\.captcha-loading \{[\s\S]{0,400}?rgba\(255, 255, 255, 0\.97\)/.test(css),
  // (f) Nút disabled không dùng opacity (opacity làm tương phản không kiểm soát).
  'w46e: disabled buttons not faded': /\.btn:disabled \{[\s\S]{0,600}?opacity: 1;/.test(css),

  // ================= Waves 48 — KIỂU TÊN HIỂN THỊ (Display Name Styles) =================
  // Bảng font/effect phải là DỮ LIỆU THẬT của Discord, không phải bảng tự chế.
  'w48: dns font table is discord real one':
    dnsJs.includes("cherryBomb") && dnsJs.includes("newRocker") && dnsJs.includes("pricedown") && dnsJs.includes("33d4f12a85e1f736"),
  'w48: dns effect table uses discord ids': dnsJs.includes("7: { key: 'prism'") && dnsJs.includes('minRatio: 2.5'),
  'w48: dns reads display_name_styles from api':
    dnsJs.includes('display_name_styles') && dnsJs.includes('font_id') && dnsJs.includes('effect_id'),
  'w48: dns accepts nested and flat shapes': dnsJs.includes('display_name_font_id'),
  'w48: dns never invents a style': dnsJs.includes('if (fontId == null && effectId == null) return null'),
  'w48: dns font comes from discord assets':
    dnsJs.includes("const ASSET_BASE = 'https://discord.com/assets/'") && dnsJs.includes("!== 'wOF2'"),
  'w48: renderer derives palette like discord': js.includes('function dnsDerivePalette') && js.includes('Math.min(1, 1.2 * l)'),
  'w48: renderer contrast loop is discord lZ':
    js.includes('function dnsAdjustContrast') && js.includes('i < 10 && c < ratio') && js.includes('l += 0.05'),
  'w48: gradient stops formula from discord': js.includes('10 + (80 * i) / (colors.length - 1)'),
  'w48: prism cycle variable from discord': js.includes('--custom-display-name-styles-prism-cycle'),
  'w48: stale vars cleared before apply': js.includes('const DNS_VARS') && js.includes('el.style.removeProperty(k)'),
  // Dùng `.` thay cho dấu backtick để không kích hoạt bộ kiểm tra template literal.
  'w48: renderer applies real font family': /el\.style\.fontFamily = ."\$\{f\.family\}"/.test(js),
  'w48: css implements all 7 effect kinds':
    ["solid", "gradient", "prism", "neon", "toon", "pop", "gummy"].every((k) => css.includes(`[data-dns-effect='${k}']`)),
  'w48: css keyframes copied from discord':
    css.includes('@keyframes dns-prism-scroll') && css.includes('@keyframes dns-gummy-squish') && css.includes('@keyframes dns-neon-flicker'),
  'w48: reduced motion stops every layer':
    /prefers-reduced-motion[\s\S]{0,320}?\.ph-display\.dns-active::before[\s\S]{0,120}?animation: none !important;/.test(css),
  'w48: ipc dns read + font': mainJs.includes("'dns:read'") && mainJs.includes("'dns:font'"),
  'w48: preload exposes dns': preloadJs.includes('dnsRead') && preloadJs.includes('dnsFont'),
  'w48: auth returns display name styles': mainJs.includes('displayNameStyles: displayNameStyle.pickStyle(user)'),
  'w48: main cleans pasted token': mainJs.includes('function cleanToken('),
  'w48: paste token auto logs in': js.includes('function scheduleAutoLogin') && js.includes("ui.token.addEventListener('paste'"),
  'w48: save button also logs in': /async function saveTokenDirectly[\s\S]{0,1200}?await autoLoginFromToken\(\)/.test(js),
  'w48: token status line exists': html.includes('id="tokenStatus"'),
  'w48: invalid state targets real input': css.includes('.input-wrap:has(#token.invalid)'),
  'w48: css halo when still low': css.includes(".ph-display[data-dns-lift='1']"),
  'w48: nameplate surface is known token': /\.ph-nameplate \{[\s\S]{0,600}?var\(--card\) 92%/.test(css),

  // ================= Waves 49 — PROFILE EFFECT + FRAME + THEME COLORS =================
  'w49: auth:check calls /users/@me/profile': mainJs.includes("fetch('https://discord.com/api/v10/users/@me/profile'"),
  'w49: profile effect extracted from api': mainJs.includes('profileEffect:') && mainJs.includes('profile_effect'),
  'w49: theme colors extracted from api': mainJs.includes('themeColors:') && mainJs.includes('theme_colors'),
  'w49: profile banner extracted from api': mainJs.includes('profileBanner:'),
  'w49: renderer renders profile effect': js.includes('function renderProfileEffect'),
  'w49: renderer renders profile frame': js.includes('function renderProfileFrame'),
  'w49: renderer applies theme colors': js.includes('function applyThemeColors'),
  'w49: html has effect img in pop': html.includes('id="dpEffect"'),
  'w49: html has effect img in hero': html.includes('id="phEffect"'),
  'w49: html has frame div in pop': html.includes('id="dpFrame"'),
  'w49: html has frame div in hero': html.includes('id="phFrame"'),
  'w49: css styles profile effect': css.includes('.up-pop-effect') && css.includes('.ph-effect'),
  'w49: css styles profile frame': css.includes('.dp-frame') && css.includes('.ph-frame'),
  'w49: css supports theme gradient': css.includes('--theme-gradient'),
};
let fail = 0;
for (const [k, v] of Object.entries(checks)) { if (!v) { fail++; console.log('  FAIL: ' + k); } }
console.log('markers: ' + (Object.keys(checks).length - fail) + '/' + Object.keys(checks).length + (fail ? ' | CÓ LỖI' : ' | TẤT CẢ OK'));
process.exit(fail === 0 && bad === 0 && stack.length === 0 && missing.length === 0 ? 0 : 1);
