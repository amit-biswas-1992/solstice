import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadBootstrapStateFromRoot, unlockStoreAtRoot } from '../../electron/ipc/storageIpc';
import { resolveStorePaths } from '../../electron/storage/appPaths';

const testRoots: string[] = [];

const createRoot = async (name: string) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), `daily-notes-storage-ipc-${name}-`));
  testRoots.push(root);
  return root;
};

const seedLegacyStoreFiles = async (rootDir: string) => {
  const paths = resolveStorePaths(rootDir);

  await fs.mkdir(rootDir, { recursive: true });
  await fs.writeFile(
    paths.settingsFile,
    JSON.stringify(
      {
        pin: '4321',
        lastOpenedMonth: '2026-05',
        lastSelectedDate: '2026-05-25'
      },
      null,
      2
    ),
    'utf8'
  );
  await fs.writeFile(
    paths.projectsFile,
    JSON.stringify(
      [
        {
          id: 'project-alpha',
          name: 'Alpha',
          createdAt: '2026-05-25T10:00:00.000Z',
          updatedAt: '2026-05-25T10:00:00.000Z'
        }
      ],
      null,
      2
    ),
    'utf8'
  );
  await fs.writeFile(
    paths.entriesFile,
    JSON.stringify(
      {
        '2026-05-25': {
          notes: [],
          tasks: []
        }
      },
      null,
      2
    ),
    'utf8'
  );
};

afterEach(async () => {
  await Promise.all(
    testRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))
  );
});

describe('storageIpc auth bootstrap contract', () => {
  it('does not rewrite store files during ordinary bootstrap reads', async () => {
    const root = await createRoot('bootstrap-read');
    const paths = resolveStorePaths(root);
    await seedLegacyStoreFiles(root);

    const bootstrap = await loadBootstrapStateFromRoot(root);

    expect(bootstrap.auth).toEqual({
      hasPin: true,
      isLocked: true
    });
    expect(bootstrap.store).toBeUndefined();
    await expect(fs.access(paths.currentFile)).rejects.toThrow();
    await expect(fs.access(paths.snapshotsDir)).rejects.toThrow();
  });

  it('keeps failed unlock reads non-mutating and strips the PIN on success', async () => {
    const root = await createRoot('unlock');
    const paths = resolveStorePaths(root);
    await seedLegacyStoreFiles(root);

    await expect(unlockStoreAtRoot(root, '1111')).resolves.toEqual({
      ok: false,
      message: 'Incorrect PIN. Try again.'
    });
    await expect(fs.access(paths.currentFile)).rejects.toThrow();
    await expect(fs.access(paths.snapshotsDir)).rejects.toThrow();

    const unlocked = await unlockStoreAtRoot(root, '4321');

    expect(unlocked.ok).toBe(true);
    if (unlocked.ok) {
      expect(unlocked.store.settings.lastOpenedMonth).toBe('2026-05');
      expect(unlocked.store.settings.lastSelectedDate).toBe('2026-05-25');
      expect('pin' in unlocked.store.settings).toBe(false);
    }
  });
});
