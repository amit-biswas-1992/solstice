import fs from 'node:fs/promises';
import { resolveStorePaths } from './appPaths';
import type {
  DayEntry,
  EntriesByDate,
  Note,
  Project,
  Settings,
  StoreSnapshot,
  Task
} from '../../src/types/models';

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

const createBackupFilePath = (filePath: string) => {
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  return `${filePath}.bak.${timestamp}.json`;
};

const preserveMalformedFileBackup = async (filePath: string, source: string) => {
  try {
    await fs.writeFile(createBackupFilePath(filePath), source, 'utf8');
  } catch {
    // Recovery should continue even if backup creation fails.
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
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
};

const writeJsonFile = async (filePath: string, value: unknown) => {
  const tempFilePath = `${filePath}.tmp`;
  await fs.writeFile(tempFilePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await fs.rename(tempFilePath, filePath);
};

export const readStore = async (rootDir: string): Promise<StoreSnapshot> => {
  const defaults = createDefaultStoreSnapshot();
  const paths = resolveStorePaths(rootDir);
  const [settingsValue, projectsValue, entriesValue] = await Promise.all([
    parseJsonFile(paths.settingsFile),
    parseJsonFile(paths.projectsFile),
    parseJsonFile(paths.entriesFile)
  ]);

  return {
    settings: normalizeSettings(settingsValue, defaults.settings),
    projects: normalizeProjects(projectsValue),
    entries: normalizeEntries(entriesValue)
  };
};

export const writeStore = async (rootDir: string, store: StoreSnapshot): Promise<StoreSnapshot> => {
  const normalized: StoreSnapshot = {
    settings: normalizeSettings(store.settings, createDefaultStoreSnapshot().settings),
    projects: normalizeProjects(store.projects),
    entries: normalizeEntries(store.entries)
  };
  const paths = resolveStorePaths(rootDir);

  await fs.mkdir(paths.rootDir, { recursive: true });
  await Promise.all([
    writeJsonFile(paths.settingsFile, normalized.settings),
    writeJsonFile(paths.projectsFile, normalized.projects),
    writeJsonFile(paths.entriesFile, normalized.entries)
  ]);

  return normalized;
};

export const bootstrapStore = async (rootDir: string): Promise<StoreSnapshot> => {
  await fs.mkdir(rootDir, { recursive: true });

  const store = await readStore(rootDir);
  await writeStore(rootDir, store);

  return store;
};
