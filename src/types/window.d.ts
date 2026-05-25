import type { DailyNotesDesktopApi } from './desktopBridge';

declare global {
  interface Window {
    dailyNotesDesktop: DailyNotesDesktopApi;
  }
}

export {};
