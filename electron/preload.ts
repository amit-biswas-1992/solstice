import { contextBridge, ipcRenderer } from 'electron';
import type { DailyNotesDesktopApi } from '../src/types/desktopBridge';
import { STORAGE_IPC_CHANNELS } from './ipc/storageIpc';

const api: DailyNotesDesktopApi = {
  version: '0.1.0',
  loadStore: () => ipcRenderer.invoke(STORAGE_IPC_CHANNELS.loadStore),
  unlock: (pin) => ipcRenderer.invoke(STORAGE_IPC_CHANNELS.unlock, pin)
};

contextBridge.exposeInMainWorld('dailyNotesDesktop', api);
