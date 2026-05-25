import { app, BrowserWindow } from 'electron';
import path from 'node:path';

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron/preload.js')
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && devUrl) {
    await window.loadURL(devUrl);
    window.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  await window.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
};

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
