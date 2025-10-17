const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bb', {
  ping: (message: string) => ipcRenderer.invoke('ipc:ping', { message }),
});
