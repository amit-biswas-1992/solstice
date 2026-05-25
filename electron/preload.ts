import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('dailyNotesDesktop', {
  version: '0.1.0'
});
