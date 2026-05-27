import type { EntriesByDate, Project } from './models';

export interface ImportedNoteFile {
  fileName: string;
  path: string;
  text: string;
}

export interface UnlockedStoreSnapshot {
  settings: {
    lastOpenedMonth: string;
    lastSelectedDate: string;
  };
  projects: Project[];
  entries: EntriesByDate;
}

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
  store?: UnlockedStoreSnapshot;
}

export type UnlockResult =
  | {
      ok: true;
      store: UnlockedStoreSnapshot;
    }
  | {
      ok: false;
      message: string;
    };

export interface DailyNotesDesktopApi {
  readonly version: string;
  loadStore: () => Promise<StoreBootstrap>;
  pickNoteFile: () => Promise<ImportedNoteFile | null>;
  saveStore: (store: UnlockedStoreSnapshot) => Promise<UnlockedStoreSnapshot>;
  unlock: (pin: string) => Promise<UnlockResult>;
}
