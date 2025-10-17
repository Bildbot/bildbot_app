const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bb', {
  ping: (message) => ipcRenderer.invoke('ipc:ping', { message }),
});
