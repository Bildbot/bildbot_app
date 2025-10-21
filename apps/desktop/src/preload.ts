import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type PingResponse } from '@bildbot/shared';

type BridgeApi = {
  ping: (message: string) => Promise<PingResponse>;
};

const api: BridgeApi = {
  ping: (message) => ipcRenderer.invoke(IPC_CHANNELS.PING, { message }),
};

contextBridge.exposeInMainWorld('bb', api);
