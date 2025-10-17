const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('node:path');
const { PingSchema, IPC_CHANNELS } = require('@bildbot/shared');

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const isDev = !app.isPackaged;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
    },
  });

  // Security: basic CSP via headers
  session.defaultSession.webRequest.onHeadersReceived((details: any, callback: any) => {
    const csp =
      "default-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'";
    const headers = details.responseHeaders || {};
    headers['Content-Security-Policy'] = [csp];
    callback({ responseHeaders: headers });
  });

  const url = isDev
    ? 'http://localhost:5173'
    : new URL(`file://${path.join(__dirname, '../renderer/index.html')}`).toString();
  await win.loadURL(url);
}

// Minimal typed IPC example
ipcMain.handle(IPC_CHANNELS.PING, (_e: any, payload: any) => {
  const p = PingSchema.parse(payload);
  return { ok: true, echo: p.message } as const;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
