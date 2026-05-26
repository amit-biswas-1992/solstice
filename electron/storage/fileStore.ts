import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { resolveSnapshotPaths, resolveStorePaths } from './appPaths.js';
import type {
  DayEntry,
  EntriesByDate,
  Note,
  Project,
  Settings,
  StoreSnapshot,
  Task
} from '../../src/types/models';

interface StoreManifest {
  snapshotId: string;
}

export interface StoreInspectionReady {
  status: 'ready';
  store: StoreSnapshot;
}

export interface StoreInspectionMissing {
  status: 'missing';
}

export interface StoreInspectionDamaged {
  status: 'damaged';
  message: string;
}

export type StoreInspectionResult =
  | StoreInspectionReady
  | StoreInspectionMissing
  | StoreInspectionDamaged;

type ParsedJsonFileResult =
  | {
      status: 'missing';
    }
  | {
      status: 'parsed';
      value: unknown;
      source: string;
    }
  | {
      status: 'malformed';
      source: string;
    };

const rootWriteQueues = new Map<string, Promise<void>>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const createDefaultSettings = (now: Date = new Date()): Settings => {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return {
    pin: '1234',
    lastOpenedMonth: `${year}-${month}`,
    lastSelectedDate: `${year}-${month}-${day}`
  };
};

export const createDefaultStoreSnapshot = (now?: Date): StoreSnapshot => ({
  settings: createDefaultSettings(now),
  projects: [],
  entries: {}
});

const createSnapshotId = () => `${Date.now()}-${crypto.randomUUID()}`;

const createTempFilePath = (filePath: string) => `${filePath}.tmp.${crypto.randomUUID()}`;

const createBackupFilePath = (filePath: string) => {
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  return `${filePath}.bak.${timestamp}.${crypto.randomUUID()}.json`;
};

const waitForRootWriteTurn = async (rootDir: string) => {
  const previous = rootWriteQueues.get(rootDir);
  if (previous) {
    await previous;
  }

  let release!: () => void;
  const turn = new Promise<void>((resolve) => {
    release = resolve;
  });

  rootWriteQueues.set(rootDir, turn);

  return () => {
    if (rootWriteQueues.get(rootDir) === turn) {
      rootWriteQueues.delete(rootDir);
    }
    release();
  };
};

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error;

const normalizeSettings = (value: unknown, fallback: Settings): Settings => {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    pin: isString(value.pin) ? value.pin : fallback.pin,
    lastOpenedMonth: isString(value.lastOpenedMonth)
      ? value.lastOpenedMonth
      : fallback.lastOpenedMonth,
    lastSelectedDate: isString(value.lastSelectedDate)
      ? value.lastSelectedDate
      : fallback.lastSelectedDate
  };
};

const normalizeProject = (value: unknown): Project | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isString(value.id) ||
    !isString(value.name) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    color: isString(value.color) ? value.color : undefined,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

const normalizeNote = (value: unknown): Note | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isString(value.id) ||
    !isString(value.text) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt)
  ) {
    return null;
  }

  return {
    id: value.id,
    text: value.text,
    projectId: isString(value.projectId) ? value.projectId : undefined,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

const normalizeTask = (value: unknown): Task | null => {
  const note = normalizeNote(value);

  if (!note || !isRecord(value) || typeof value.done !== 'boolean') {
    return null;
  }

  return {
    ...note,
    done: value.done
  };
};

const normalizeDayEntry = (value: unknown): DayEntry | null => {
  if (!isRecord(value)) {
    return null;
  }

  const notes = Array.isArray(value.notes)
    ? value.notes.map(normalizeNote).filter((note): note is Note => note !== null)
    : [];
  const tasks = Array.isArray(value.tasks)
    ? value.tasks.map(normalizeTask).filter((task): task is Task => task !== null)
    : [];

  return { notes, tasks };
};

const normalizeProjects = (value: unknown): Project[] =>
  Array.isArray(value)
    ? value.map(normalizeProject).filter((project): project is Project => project !== null)
    : [];

const normalizeEntries = (value: unknown): EntriesByDate => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([date, entry]) => {
        const normalized = normalizeDayEntry(entry);
        return normalized ? [date, normalized] : null;
      })
      .filter((entry): entry is [string, DayEntry] => entry !== null)
  );
};

const assertSettings = (value: unknown, context: string): Settings => {
  if (!isRecord(value)) {
    throw new Error(`${context}: invalid settings object`);
  }
  if (!isString(value.pin)) {
    throw new Error(`${context}: invalid settings.pin`);
  }
  if (!isString(value.lastOpenedMonth)) {
    throw new Error(`${context}: invalid settings.lastOpenedMonth`);
  }
  if (!isString(value.lastSelectedDate)) {
    throw new Error(`${context}: invalid settings.lastSelectedDate`);
  }

  return {
    pin: value.pin,
    lastOpenedMonth: value.lastOpenedMonth,
    lastSelectedDate: value.lastSelectedDate
  };
};

const assertProject = (value: unknown, index: number): Project => {
  if (!isRecord(value)) {
    throw new Error(`invalid project at index ${index}`);
  }
  if (!isString(value.id)) {
    throw new Error(`invalid project at index ${index}: missing id`);
  }
  if (!isString(value.name)) {
    throw new Error(`invalid project at index ${index}: missing name`);
  }
  if (!isString(value.createdAt)) {
    throw new Error(`invalid project at index ${index}: missing createdAt`);
  }
  if (!isString(value.updatedAt)) {
    throw new Error(`invalid project at index ${index}: missing updatedAt`);
  }
  if (value.color !== undefined && !isString(value.color)) {
    throw new Error(`invalid project at index ${index}: invalid color`);
  }

  return {
    id: value.id,
    name: value.name,
    color: value.color,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

const assertNote = (value: unknown, context: string): Note => {
  if (!isRecord(value)) {
    throw new Error(`${context}: invalid note object`);
  }
  if (!isString(value.id)) {
    throw new Error(`${context}: missing id`);
  }
  if (!isString(value.text)) {
    throw new Error(`${context}: missing text`);
  }
  if (value.projectId !== undefined && !isString(value.projectId)) {
    throw new Error(`${context}: invalid projectId`);
  }
  if (!isString(value.createdAt)) {
    throw new Error(`${context}: missing createdAt`);
  }
  if (!isString(value.updatedAt)) {
    throw new Error(`${context}: missing updatedAt`);
  }

  return {
    id: value.id,
    text: value.text,
    projectId: value.projectId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

const assertTask = (value: unknown, context: string): Task => {
  const note = assertNote(value, context);
  if (!isRecord(value) || typeof value.done !== 'boolean') {
    throw new Error(`${context}: invalid done flag`);
  }

  return {
    ...note,
    done: value.done
  };
};

const assertEntries = (value: unknown): EntriesByDate => {
  if (!isRecord(value)) {
    throw new Error('invalid entries object');
  }

  return Object.fromEntries(
    Object.entries(value).map(([date, entry]) => {
      if (!isRecord(entry)) {
        throw new Error(`invalid entry for date ${date}`);
      }

      const notes = Array.isArray(entry.notes)
        ? entry.notes.map((note, index) => assertNote(note, `invalid note ${index} for date ${date}`))
        : (() => {
            throw new Error(`invalid notes collection for date ${date}`);
          })();
      const tasks = Array.isArray(entry.tasks)
        ? entry.tasks.map((task, index) => assertTask(task, `invalid task ${index} for date ${date}`))
        : (() => {
            throw new Error(`invalid tasks collection for date ${date}`);
          })();

      return [date, { notes, tasks }];
    })
  );
};

const assertStoreSnapshot = (value: StoreSnapshot): StoreSnapshot => ({
  settings: assertSettings(value.settings, 'invalid store'),
  projects: Array.isArray(value.projects)
    ? value.projects.map((project, index) => assertProject(project, index))
    : (() => {
        throw new Error('invalid store: projects must be an array');
      })(),
  entries: assertEntries(value.entries)
});

const normalizeManifest = (value: unknown): StoreManifest | null => {
  if (!isRecord(value) || !isString(value.snapshotId)) {
    return null;
  }

  return { snapshotId: value.snapshotId };
};

const preserveMalformedFileBackup = async (filePath: string, source: string) => {
  try {
    await fs.writeFile(createBackupFilePath(filePath), source, 'utf8');
  } catch {
    // Recovery should continue even if backup creation fails.
  }
};

const preserveFileBackupIfPresent = async (filePath: string) => {
  try {
    const source = await fs.readFile(filePath, 'utf8');
    await preserveMalformedFileBackup(filePath, source);
    await fs.rm(filePath, { force: true });
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return;
    }
  }
};

const parseJsonFilePassive = async (filePath: string): Promise<ParsedJsonFileResult> => {
  try {
    const source = await fs.readFile(filePath, 'utf8');

    try {
      return {
        status: 'parsed',
        value: JSON.parse(source),
        source
      };
    } catch {
      return {
        status: 'malformed',
        source
      };
    }
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return {
        status: 'missing'
      };
    }

    throw error;
  }
};

const parseJsonFile = async (filePath: string): Promise<unknown | undefined> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');

    try {
      return JSON.parse(raw);
    } catch {
      await preserveMalformedFileBackup(filePath, raw);
      return undefined;
    }
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
};

const writeJsonFile = async (filePath: string, value: unknown) => {
  const tempFilePath = createTempFilePath(filePath);
  await fs.writeFile(tempFilePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await fs.rename(tempFilePath, filePath);
};

const inspectSettingsFile = (value: unknown, context: string): Settings => {
  try {
    return assertSettings(value, context);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : `${context}: invalid settings`
    );
  }
};

const inspectProjectsFile = (value: unknown, context: string): Project[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${context}: projects must be an array`);
  }

  return value.map((project, index) => {
    try {
      return assertProject(project, index);
    } catch (error) {
      throw new Error(
        error instanceof Error ? `${context}: ${error.message}` : `${context}: invalid project data`
      );
    }
  });
};

const inspectEntriesFile = (value: unknown, context: string): EntriesByDate => {
  try {
    return assertEntries(value);
  } catch (error) {
    throw new Error(
      error instanceof Error ? `${context}: ${error.message}` : `${context}: invalid entries data`
    );
  }
};

const inspectLegacyStore = async (
  settingsFile: string,
  projectsFile: string,
  entriesFile: string
): Promise<StoreInspectionResult> => {
  const [settingsResult, projectsResult, entriesResult] = await Promise.all([
    parseJsonFilePassive(settingsFile),
    parseJsonFilePassive(projectsFile),
    parseJsonFilePassive(entriesFile)
  ]);

  if (
    settingsResult.status === 'missing' &&
    projectsResult.status === 'missing' &&
    entriesResult.status === 'missing'
  ) {
    return {
      status: 'missing'
    };
  }

  if (settingsResult.status === 'missing') {
    return {
      status: 'damaged',
      message: 'The settings store is missing. Restore settings.json before unlocking.'
    };
  }

  if (settingsResult.status === 'malformed') {
    return {
      status: 'damaged',
      message: 'The settings store is corrupted. Restore settings.json before unlocking.'
    };
  }

  if (projectsResult.status === 'malformed') {
    return {
      status: 'damaged',
      message: 'The projects store is corrupted. Restore projects.json before continuing.'
    };
  }

  if (entriesResult.status === 'malformed') {
    return {
      status: 'damaged',
      message: 'The entries store is corrupted. Restore entries.json before continuing.'
    };
  }

  try {
    return {
      status: 'ready',
      store: {
        settings: inspectSettingsFile(settingsResult.value, 'invalid settings.json'),
        projects: projectsResult.status === 'parsed' ? inspectProjectsFile(projectsResult.value, 'invalid projects.json') : [],
        entries: entriesResult.status === 'parsed' ? inspectEntriesFile(entriesResult.value, 'invalid entries.json') : {}
      }
    };
  } catch (error) {
    return {
      status: 'damaged',
      message:
        error instanceof Error ? error.message : 'The settings store is invalid.'
    };
  }
};

const readStoreFiles = async (settingsFile: string, projectsFile: string, entriesFile: string) => {
  const defaults = createDefaultStoreSnapshot();
  const [settingsValue, projectsValue, entriesValue] = await Promise.all([
    parseJsonFile(settingsFile),
    parseJsonFile(projectsFile),
    parseJsonFile(entriesFile)
  ]);

  return {
    settings: normalizeSettings(settingsValue, defaults.settings),
    projects: normalizeProjects(projectsValue),
    entries: normalizeEntries(entriesValue)
  };
};

const readCurrentManifest = async (rootDir: string): Promise<StoreManifest | null> => {
  const manifestValue = await parseJsonFile(resolveStorePaths(rootDir).currentFile);
  return normalizeManifest(manifestValue);
};

const inspectCurrentManifest = async (
  rootDir: string
): Promise<StoreManifest | 'missing' | StoreInspectionDamaged> => {
  const currentFile = resolveStorePaths(rootDir).currentFile;
  const manifestResult = await parseJsonFilePassive(currentFile);

  if (manifestResult.status === 'missing') {
    return 'missing';
  }

  if (manifestResult.status === 'malformed') {
    return {
      status: 'damaged',
      message: 'The current snapshot manifest is corrupted. Restore current.json before continuing.'
    };
  }

  const manifest = normalizeManifest(manifestResult.value);
  if (!manifest) {
    return {
      status: 'damaged',
      message: 'The current snapshot manifest is invalid. Restore current.json before continuing.'
    };
  }

  return manifest;
};

const invalidateCurrentManifest = async (rootDir: string) => {
  await preserveFileBackupIfPresent(resolveStorePaths(rootDir).currentFile);
};

const readCommittedStore = async (rootDir: string): Promise<StoreSnapshot | null> => {
  const manifest = await readCurrentManifest(rootDir);
  if (!manifest) {
    return null;
  }

  const snapshotPaths = resolveSnapshotPaths(rootDir, manifest.snapshotId);
  const [settingsValue, projectsValue, entriesValue] = await Promise.all([
    parseJsonFile(snapshotPaths.settingsFile),
    parseJsonFile(snapshotPaths.projectsFile),
    parseJsonFile(snapshotPaths.entriesFile)
  ]);

  if (
    settingsValue === undefined ||
    projectsValue === undefined ||
    entriesValue === undefined
  ) {
    await invalidateCurrentManifest(rootDir);
    return null;
  }

  const defaults = createDefaultStoreSnapshot();
  return {
    settings: normalizeSettings(settingsValue, defaults.settings),
    projects: normalizeProjects(projectsValue),
    entries: normalizeEntries(entriesValue)
  };
};

const removeDirectoryIfExists = async (dirPath: string) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Cleanup failure should not hide the primary write result.
  }
};

export const inspectStore = async (rootDir: string): Promise<StoreInspectionResult> => {
  const manifestInspection = await inspectCurrentManifest(rootDir);
  if (manifestInspection !== 'missing') {
    if ('status' in manifestInspection) {
      return manifestInspection;
    }

    const snapshotPaths = resolveSnapshotPaths(rootDir, manifestInspection.snapshotId);
    const [settingsResult, projectsResult, entriesResult] = await Promise.all([
      parseJsonFilePassive(snapshotPaths.settingsFile),
      parseJsonFilePassive(snapshotPaths.projectsFile),
      parseJsonFilePassive(snapshotPaths.entriesFile)
    ]);

    if (settingsResult.status === 'missing') {
      return {
        status: 'damaged',
        message: 'The committed settings snapshot is missing. Restore the active snapshot before unlocking.'
      };
    }

    if (settingsResult.status === 'malformed') {
      return {
        status: 'damaged',
        message: 'The committed settings snapshot is corrupted. Restore the active snapshot before unlocking.'
      };
    }

    if (projectsResult.status !== 'parsed') {
      return {
        status: 'damaged',
        message:
          projectsResult.status === 'missing'
            ? 'The committed projects snapshot is missing. Restore the active snapshot before continuing.'
            : 'The committed projects snapshot is corrupted. Restore the active snapshot before continuing.'
      };
    }

    if (entriesResult.status !== 'parsed') {
      return {
        status: 'damaged',
        message:
          entriesResult.status === 'missing'
            ? 'The committed entries snapshot is missing. Restore the active snapshot before continuing.'
            : 'The committed entries snapshot is corrupted. Restore the active snapshot before continuing.'
      };
    }

    try {
      return {
        status: 'ready',
        store: {
          settings: inspectSettingsFile(settingsResult.value, 'invalid committed settings'),
          projects: inspectProjectsFile(projectsResult.value, 'invalid committed projects'),
          entries: inspectEntriesFile(entriesResult.value, 'invalid committed entries')
        }
      };
    } catch (error) {
      return {
        status: 'damaged',
        message:
          error instanceof Error ? error.message : 'The committed settings snapshot is invalid.'
      };
    }
  }

  const paths = resolveStorePaths(rootDir);
  return inspectLegacyStore(paths.settingsFile, paths.projectsFile, paths.entriesFile);
};

export const readStore = async (rootDir: string): Promise<StoreSnapshot> => {
  const committed = await readCommittedStore(rootDir);
  if (committed) {
    return committed;
  }

  const paths = resolveStorePaths(rootDir);
  return readStoreFiles(paths.settingsFile, paths.projectsFile, paths.entriesFile);
};

export const writeStore = async (rootDir: string, store: StoreSnapshot): Promise<StoreSnapshot> => {
  const validated = assertStoreSnapshot(store);
  const release = await waitForRootWriteTurn(rootDir);
  const paths = resolveStorePaths(rootDir);
  const previousManifest = await readCurrentManifest(rootDir);
  const snapshotId = createSnapshotId();
  const snapshotPaths = resolveSnapshotPaths(rootDir, snapshotId);

  try {
    await fs.mkdir(paths.snapshotsDir, { recursive: true });
    await fs.mkdir(snapshotPaths.rootDir, { recursive: true });

    await Promise.all([
      writeJsonFile(snapshotPaths.settingsFile, validated.settings),
      writeJsonFile(snapshotPaths.projectsFile, validated.projects),
      writeJsonFile(snapshotPaths.entriesFile, validated.entries)
    ]);

    await writeJsonFile(paths.currentFile, { snapshotId });

    if (previousManifest && previousManifest.snapshotId !== snapshotId) {
      await removeDirectoryIfExists(resolveSnapshotPaths(rootDir, previousManifest.snapshotId).rootDir);
    }

    return validated;
  } catch (error) {
    await removeDirectoryIfExists(snapshotPaths.rootDir);
    throw error;
  } finally {
    release();
  }
};

export const bootstrapStore = async (rootDir: string): Promise<StoreSnapshot> => {
  await fs.mkdir(rootDir, { recursive: true });

  const store = await readStore(rootDir);
  await writeStore(rootDir, store);

  return store;
};
