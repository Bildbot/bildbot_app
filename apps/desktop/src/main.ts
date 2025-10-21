import { app, BrowserWindow, ipcMain, session } from 'electron';
import type { HeadersReceivedResponse, OnHeadersReceivedListenerDetails } from 'electron/main';
import { join } from 'node:path';
import { PingSchema, IPC_CHANNELS, type PingResponse } from '@bildbot/shared';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const rendererDevServerUrl = process.env.BB_RENDERER_URL ?? 'http://localhost:5173';
const isDev = !app.isPackaged;

const applyContentSecurityPolicy = (): void => {
  const listener = (
    details: OnHeadersReceivedListenerDetails,
    callback: (headersReceivedResponse: HeadersReceivedResponse) => void,
  ): void => {
    const csp =
      "default-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'";
    const responseHeaders = {
      ...details.responseHeaders,
      'Content-Security-Policy': [csp],
    };
    callback({ responseHeaders });
  };

  session.defaultSession.webRequest.onHeadersReceived(listener);
};

const createWindow = async (): Promise<BrowserWindow> => {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
    },
    show: false,
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  if (isDev) {
    await window.loadURL(rendererDevServerUrl);
  } else {
    await window.loadFile(join(__dirname, 'renderer', 'index.html'));
  }

  return window;
};

ipcMain.handle(IPC_CHANNELS.PING, async (_event, payload): Promise<PingResponse> => {
  const parsed = PingSchema.parse(payload);
  return { ok: true, echo: parsed.message } satisfies PingResponse;
});

app
  .whenReady()
  .then(() => {
    applyContentSecurityPolicy();
    return createWindow();
  })
  .catch((error) => {
    const reason = error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(`Не удалось создать главное окно: ${reason}\n`);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
