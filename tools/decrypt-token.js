const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

const pinnedUserData = path.join(process.env.APPDATA || app.getPath('appData'), 'AUTO-QUEST');
app.setPath('userData', pinnedUserData);

app.whenReady().then(() => {
  const configPath = path.join(app.getPath('userData'), 'autoquest_config.json');
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const buf = Buffer.from(cfg.tokenEnc, 'base64');
    const token = safeStorage.decryptString(buf);
    console.log('TOKEN=' + token);
  } catch (e) {
    console.log('ERR=' + e.message);
  }
  app.quit();
});
