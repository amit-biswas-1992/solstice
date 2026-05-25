import { app, ipcMain } from 'electron';
import { bootstrapStore } from '../storage/fileStore';
import { resolveAppDataStorePaths } from '../storage/appPaths';
import type { StoreBootstrap, StoreSummary, UnlockResult } from '../../src/types/desktopBridge';
import type { StoreSnapshot } from '../../src/types/models';

export const STORAGE_IPC_CHANNELS = {
  loadStore: 'storage:loadStore',
  unlock: 'auth:unlock'
} as const;

const createStoreSummary = (store: StoreSnapshot): StoreSummary => ({
  entryCount: Object.keys(store.entries).length,
  lastOpenedMonth: store.settings.lastOpenedMonth,
  lastSelectedDate: store.settings.lastSelectedDate,
  projectCount: store.projects.length
});

const hasPin = (store: StoreSnapshot) => store.settings.pin.trim().length > 0;

const loadBootstrapState = async (): Promise<StoreBootstrap> => {
  const rootDir = resolveAppDataStorePaths(app.getPath('userData')).rootDir;
  const store = await bootstrapStore(rootDir);
  const pinRequired = hasPin(store);

  return {
    auth: {
      hasPin: pinRequired,
      isLocked: pinRequired
    },
    summary: createStoreSummary(store),
    store: pinRequired ? undefined : store
  };
};

const unlockStore = async (pin: string): Promise<UnlockResult> => {
  const rootDir = resolveAppDataStorePaths(app.getPath('userData')).rootDir;
  const store = await bootstrapStore(rootDir);

  if (!hasPin(store) || store.settings.pin === pin) {
    return {
      ok: true,
      store
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

  ipcMain.handle(STORAGE_IPC_CHANNELS.loadStore, () => loadBootstrapState());
  ipcMain.handle(STORAGE_IPC_CHANNELS.unlock, (_event, pin: string) => unlockStore(pin));
};
