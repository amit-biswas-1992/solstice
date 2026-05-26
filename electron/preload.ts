import { contextBridge, ipcRenderer } from 'electron';
import type { DailyNotesDesktopApi } from '../src/types/desktopBridge';

const IPC_CHANNELS = {
  LOAD_STORE: 'storage:loadStore',
  SAVE_STORE: 'storage:saveStore',
  UNLOCK: 'auth:unlock'
} as const;

const api: DailyNotesDesktopApi = {
  version: '0.1.0',
  loadStore: () => ipcRenderer.invoke(IPC_CHANNELS.LOAD_STORE),
  saveStore: (store) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_STORE, store),
  unlock: (pin) => ipcRenderer.invoke(IPC_CHANNELS.UNLOCK, pin)
};

contextBridge.exposeInMainWorld('dailyNotesDesktop', api);
