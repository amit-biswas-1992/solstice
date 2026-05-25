import { app, ipcMain } from 'electron';
import { readStore } from '../storage/fileStore';
import { resolveAppDataStorePaths } from '../storage/appPaths';
import type {
  StoreBootstrap,
  StoreSummary,
  UnlockResult,
  UnlockedStoreSnapshot
} from '../../src/types/desktopBridge';
import { STORAGE_IPC_CHANNELS } from '../../src/types/ipc';
import type { StoreSnapshot } from '../../src/types/models';

const createStoreSummary = (store: StoreSnapshot): StoreSummary => ({
  entryCount: Object.keys(store.entries).length,
  lastOpenedMonth: store.settings.lastOpenedMonth,
  lastSelectedDate: store.settings.lastSelectedDate,
  projectCount: store.projects.length
});

const hasPin = (store: StoreSnapshot) => store.settings.pin.trim().length > 0;

const createUnlockedStoreSnapshot = (store: StoreSnapshot): UnlockedStoreSnapshot => ({
  settings: {
    lastOpenedMonth: store.settings.lastOpenedMonth,
    lastSelectedDate: store.settings.lastSelectedDate
  },
  projects: store.projects,
  entries: store.entries
});

export const loadBootstrapStateFromRoot = async (rootDir: string): Promise<StoreBootstrap> => {
  const store = await readStore(rootDir);
  const pinRequired = hasPin(store);

  return {
    auth: {
      hasPin: pinRequired,
      isLocked: pinRequired
    },
    summary: createStoreSummary(store),
    store: pinRequired ? undefined : createUnlockedStoreSnapshot(store)
  };
};

export const unlockStoreAtRoot = async (
  rootDir: string,
  pin: string
): Promise<UnlockResult> => {
  const store = await readStore(rootDir);

  if (!hasPin(store) || store.settings.pin === pin) {
    return {
      ok: true,
      store: createUnlockedStoreSnapshot(store)
    };
  }

  return {
    ok: false,
    message: 'Incorrect PIN. Try again.'
  };
};

export const registerStorageIpc = () => {
  ipcMain.removeHandler(STORAGE_IPC_CHANNELS.loadStore);
  ipcMain.removeHandler(STORAGE_IPC_CHANNELS.unlock);

  ipcMain.handle(STORAGE_IPC_CHANNELS.loadStore, () =>
    loadBootstrapStateFromRoot(resolveAppDataStorePaths(app.getPath('userData')).rootDir)
  );
  ipcMain.handle(STORAGE_IPC_CHANNELS.unlock, (_event, pin: string) =>
    unlockStoreAtRoot(resolveAppDataStorePaths(app.getPath('userData')).rootDir, pin)
  );
};
