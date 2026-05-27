import { app, dialog, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { bootstrapStore, inspectStore, writeStore } from '../storage/fileStore.js';
import { resolveAppDataStorePaths } from '../storage/appPaths.js';
import type {
  ImportedNoteFile,
  StoreBootstrap,
  StoreSummary,
  UnlockResult,
  UnlockedStoreSnapshot
} from '../../src/types/desktopBridge';
import type { StoreSnapshot } from '../../src/types/models';
import { IPC, pinPayloadSchema, unlockedStoreSnapshotSchema } from '../../src/types/ipc';

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

export const pickNoteFileFromSystem = async (): Promise<ImportedNoteFile | null> => {
  const result = await dialog.showOpenDialog({
    title: 'Import note from file',
    properties: ['openFile'],
    filters: [
      { name: 'Text files', extensions: ['txt', 'md', 'markdown', 'json', 'csv', 'log'] },
      { name: 'All files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  const fileBuffer = await fs.readFile(selectedPath, 'utf8');
  const text = fileBuffer.trim();

  if (!text) {
    throw new Error('The selected file is empty.');
  }

  return {
    fileName: path.basename(selectedPath),
    path: selectedPath,
    text
  };
};

export const registerStorageIpc = () => {
  ipcMain.removeHandler(IPC.LOAD_STORE);
  ipcMain.removeHandler(IPC.PICK_NOTE_FILE);
  ipcMain.removeHandler(IPC.SAVE_STORE);
  ipcMain.removeHandler(IPC.UNLOCK);

  ipcMain.handle(IPC.LOAD_STORE, () =>
    loadBootstrapStateFromRoot(resolveAppDataStorePaths(app.getPath('userData')).rootDir)
  );
  ipcMain.handle(IPC.PICK_NOTE_FILE, () => pickNoteFileFromSystem());
  ipcMain.handle(IPC.SAVE_STORE, (_event, snapshot: unknown) =>
    saveUnlockedStoreAtRoot(
      resolveAppDataStorePaths(app.getPath('userData')).rootDir,
      unlockedStoreSnapshotSchema.parse(snapshot)
    )
  );
  ipcMain.handle(IPC.UNLOCK, (_event, pin: unknown) =>
    unlockStoreAtRoot(
      resolveAppDataStorePaths(app.getPath('userData')).rootDir,
      pinPayloadSchema.parse(pin)
    )
  );
};
