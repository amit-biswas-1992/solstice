import type { StoreSnapshot } from './models';

export interface StoreSummary {
  entryCount: number;
  lastOpenedMonth: string;
  lastSelectedDate: string;
  projectCount: number;
}

export interface StoreBootstrap {
  auth: {
    hasPin: boolean;
    isLocked: boolean;
  };
  summary: StoreSummary;
  store?: StoreSnapshot;
}

export type UnlockResult =
  | {
      ok: true;
      store: StoreSnapshot;
    }
  | {
      ok: false;
      message: string;
    };

export interface DailyNotesDesktopApi {
  readonly version: string;
  loadStore: () => Promise<StoreBootstrap>;
  unlock: (pin: string) => Promise<UnlockResult>;
}
