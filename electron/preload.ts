import { contextBridge, ipcRenderer } from 'electron';
import type { DailyNotesDesktopApi } from '../src/types/desktopBridge';
import { STORAGE_IPC_CHANNELS } from '../src/types/ipc';

const api: DailyNotesDesktopApi = {
  version: '0.1.0',
  loadStore: () => ipcRenderer.invoke(STORAGE_IPC_CHANNELS.loadStore),
  saveStore: (store) => ipcRenderer.invoke(STORAGE_IPC_CHANNELS.saveStore, store),
  unlock: (pin) => ipcRenderer.invoke(STORAGE_IPC_CHANNELS.unlock, pin)
};

contextBridge.exposeInMainWorld('dailyNotesDesktop', api);
