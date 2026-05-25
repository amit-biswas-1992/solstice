import { app, ipcMain } from 'electron';
import { bootstrapStore, inspectStore, writeStore } from '../storage/fileStore';
import { resolveAppDataStorePaths } from '../storage/appPaths';
import type {
  StoreBootstrap,
  StoreSummary,
  UnlockResult,
  UnlockedStoreSnapshot
} from '../../src/types/desktopBridge';
import { STORAGE_IPC_CHANNELS } from '../../src/types/ipc';
import type { StoreSnapshot } from '../../src/types/models';

const unlockedRoots = new Set<string>();
const AUTH_REQUIRED_MESSAGE = 'Authentication required. Unlock the workspace first.';

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

const isRootUnlocked = (rootDir: string) => unlockedRoots.has(rootDir);

const markRootUnlocked = (rootDir: string) => {
  unlockedRoots.add(rootDir);
};

const clearRootSession = (rootDir: string) => {
  unlockedRoots.delete(rootDir);
};

const loadStoreForBootstrapAtRoot = async (rootDir: string): Promise<StoreSnapshot> => {
  const inspection = await inspectStore(rootDir);
  if (inspection.status === 'ready') {
    return inspection.store;
  }

  clearRootSession(rootDir);

  if (inspection.status === 'missing') {
    return bootstrapStore(rootDir);
  }

  throw new Error(inspection.message);
};

export const loadBootstrapStateFromRoot = async (rootDir: string): Promise<StoreBootstrap> => {
  const store = await loadStoreForBootstrapAtRoot(rootDir);
  const pinRequired = hasPin(store);
  const isLocked = pinRequired && !isRootUnlocked(rootDir);

  if (!pinRequired) {
    markRootUnlocked(rootDir);
  }

  return {
    auth: {
      hasPin: pinRequired,
      isLocked
    },
    summary: createStoreSummary(store),
    store: isLocked ? undefined : createUnlockedStoreSnapshot(store)
  };
};

export const requireAuthenticatedStoreSessionAtRoot = async (
  rootDir: string
): Promise<StoreSnapshot> => {
  const inspection = await inspectStore(rootDir);
  if (inspection.status === 'missing') {
    throw new Error('The local store has not been initialized yet.');
  }

  if (inspection.status === 'damaged') {
    clearRootSession(rootDir);
    throw new Error(inspection.message);
  }

  if (hasPin(inspection.store) && !isRootUnlocked(rootDir)) {
    throw new Error(AUTH_REQUIRED_MESSAGE);
  }

  if (!hasPin(inspection.store)) {
    markRootUnlocked(rootDir);
  }

  return inspection.store;
};

export const unlockStoreAtRoot = async (
  rootDir: string,
  pin: string
): Promise<UnlockResult> => {
  const store = await loadStoreForBootstrapAtRoot(rootDir);

  if (!hasPin(store) || store.settings.pin === pin) {
    markRootUnlocked(rootDir);
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

export const saveUnlockedStoreAtRoot = async (
  rootDir: string,
  snapshot: UnlockedStoreSnapshot
): Promise<UnlockedStoreSnapshot> => {
  const currentStore = await requireAuthenticatedStoreSessionAtRoot(rootDir);
  const savedStore = await writeStore(rootDir, {
    settings: {
      ...currentStore.settings,
      lastOpenedMonth: snapshot.settings.lastOpenedMonth,
      lastSelectedDate: snapshot.settings.lastSelectedDate
    },
    projects: snapshot.projects,
    entries: snapshot.entries
  });

  return createUnlockedStoreSnapshot(savedStore);
};

export const registerStorageIpc = () => {
  ipcMain.removeHandler(STORAGE_IPC_CHANNELS.loadStore);
  ipcMain.removeHandler(STORAGE_IPC_CHANNELS.saveStore);
  ipcMain.removeHandler(STORAGE_IPC_CHANNELS.unlock);

  ipcMain.handle(STORAGE_IPC_CHANNELS.loadStore, () =>
    loadBootstrapStateFromRoot(resolveAppDataStorePaths(app.getPath('userData')).rootDir)
  );
  ipcMain.handle(STORAGE_IPC_CHANNELS.saveStore, (_event, snapshot: UnlockedStoreSnapshot) =>
    saveUnlockedStoreAtRoot(resolveAppDataStorePaths(app.getPath('userData')).rootDir, snapshot)
  );
  ipcMain.handle(STORAGE_IPC_CHANNELS.unlock, (_event, pin: string) =>
    unlockStoreAtRoot(resolveAppDataStorePaths(app.getPath('userData')).rootDir, pin)
  );
};
