import { contextBridge } from 'electron';
import type { DailyNotesDesktopApi } from '../src/types/desktopBridge';

const api: DailyNotesDesktopApi = {
  version: '0.1.0'
};

contextBridge.exposeInMainWorld('dailyNotesDesktop', api);
