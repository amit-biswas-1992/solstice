import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bootstrapStore,
  readStore,
  writeStore
} from '../../electron/storage/fileStore';

const testRoots: string[] = [];

const createRoot = async (name: string) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), `daily-notes-${name}-`));
  testRoots.push(root);
  return root;
};

const createStore = (overrides?: Partial<Awaited<ReturnType<typeof readStore>>>) => ({
  settings: {
    pin: '4321',
    lastOpenedMonth: '2026-05',
    lastSelectedDate: '2026-05-25'
  },
  projects: [
    {
      id: 'p1',
      name: 'Alpha',
      color: '#7BC7A6',
      createdAt: '2026-05-25T10:00:00.000Z',
      updatedAt: '2026-05-25T10:00:00.000Z'
    }
  ],
  entries: {
    '2026-05-25': {
      notes: [
        {
          id: 'n1',
          text: 'Draft launch checklist',
          projectId: 'p1',
          createdAt: '2026-05-25T10:00:00.000Z',
          updatedAt: '2026-05-25T10:00:00.000Z'
        }
      ],
      tasks: [
        {
          id: 't1',
          text: 'Ship storage layer',
          projectId: 'p1',
          done: false,
          createdAt: '2026-05-25T10:00:00.000Z',
          updatedAt: '2026-05-25T10:00:00.000Z'
        }
      ]
    }
  },
  ...overrides
});

afterEach(async () => {
  await Promise.all(
    testRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))
  );
});

describe('fileStore', () => {
  it('bootstraps missing JSON files with defaults', async () => {
    const root = await createRoot('bootstrap');

    const store = await bootstrapStore(root);

    expect(store.settings.pin).toBe('1234');
    expect(store.settings.lastOpenedMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(store.projects).toEqual([]);
    expect(store.entries).toEqual({});
  });

  it('round-trips settings, projects, and entries', async () => {
    const root = await createRoot('roundtrip');

    await writeStore(root, createStore());

    const store = await readStore(root);

    expect(store.settings.pin).toBe('4321');
    expect(store.projects[0]?.name).toBe('Alpha');
    expect(store.entries['2026-05-25']?.notes[0]?.text).toBe('Draft launch checklist');
    expect(store.entries['2026-05-25']?.tasks[0]?.done).toBe(false);
  });

  it('heals missing files by rewriting defaults for absent sections', async () => {
    const root = await createRoot('heal-missing');

    await fs.writeFile(
      path.join(root, 'settings.json'),
      JSON.stringify(
        {
          pin: '9999',
          lastOpenedMonth: '2026-06',
          lastSelectedDate: '2026-06-01'
        },
        null,
        2
      )
    );

    const store = await bootstrapStore(root);

    expect(store.settings.pin).toBe('9999');
    expect(store.projects).toEqual([]);
    expect(store.entries).toEqual({});
  });

  it('recovers from malformed JSON by preserving a backup and rewriting safe defaults', async () => {
    const root = await createRoot('malformed');
    const badSettingsSource = '{"pin":"9999",';

    await fs.writeFile(path.join(root, 'settings.json'), badSettingsSource, 'utf8');

    const readStorePromise = readStore(root);

    await expect(readStorePromise).resolves.toMatchObject({
      settings: {
        pin: '1234'
      },
      projects: [],
      entries: {}
    });

    const filesAfterRead = await fs.readdir(root);
    const backupFile = filesAfterRead.find(
      (file) => file.startsWith('settings.json.bak.') && file.endsWith('.json')
    );

    expect(backupFile).toBeDefined();
    await expect(fs.readFile(path.join(root, backupFile!), 'utf8')).resolves.toBe(badSettingsSource);

    const bootstrapped = await bootstrapStore(root);

    expect(bootstrapped.settings.pin).toBe('1234');
    const manifest = JSON.parse(await fs.readFile(path.join(root, 'current.json'), 'utf8')) as {
      snapshotId: string;
    };
    const committedSettingsPath = path.join(root, 'snapshots', manifest.snapshotId, 'settings.json');

    await expect(fs.readFile(committedSettingsPath, 'utf8')).resolves.toContain('"pin": "1234"');
  });

  it('rejects invalid in-memory data instead of silently dropping it', async () => {
    const root = await createRoot('invalid-write');

    await expect(
      writeStore(
        root,
        createStore({
          projects: [
            {
              id: 'p1',
              name: 'Broken',
              createdAt: '2026-05-25T10:00:00.000Z'
            }
          ] as never
        })
      )
    ).rejects.toThrow(/invalid project/i);

    await expect(fs.readdir(root)).resolves.toEqual([]);
  });

  it('keeps the previously committed snapshot visible when a commit fails', async () => {
    const root = await createRoot('atomic-commit');
    const initialStore = createStore();
    const nextStore = createStore({
      settings: {
        pin: '8765',
        lastOpenedMonth: '2026-06',
        lastSelectedDate: '2026-06-01'
      }
    });

    await writeStore(root, initialStore);

    const originalRename = fs.rename.bind(fs);
    const renameSpy = vi.spyOn(fs, 'rename').mockImplementation(async (source, target) => {
      if (String(target).endsWith('current.json')) {
        throw new Error('simulated commit failure');
      }

      return originalRename(source, target);
    });

    await expect(writeStore(root, nextStore)).rejects.toThrow('simulated commit failure');
    renameSpy.mockRestore();

    await expect(readStore(root)).resolves.toMatchObject(initialStore);
  });

  it('serializes overlapping writes for the same root', async () => {
    const root = await createRoot('concurrent');
    const firstStore = createStore({
      settings: {
        pin: '1111',
        lastOpenedMonth: '2026-05',
        lastSelectedDate: '2026-05-25'
      }
    });
    const secondStore = createStore({
      settings: {
        pin: '2222',
        lastOpenedMonth: '2026-06',
        lastSelectedDate: '2026-06-02'
      }
    });

    const originalWriteFile = fs.writeFile.bind(fs);
    let delayedFirstSettingsWrite = false;
    const writeSpy = vi.spyOn(fs, 'writeFile').mockImplementation(async (file, data, options) => {
      const text = typeof data === 'string' ? data : data.toString();

      if (
        !delayedFirstSettingsWrite &&
        String(file).includes('/snapshots/') &&
        String(file).endsWith('/settings.json') &&
        text.includes('"pin": "1111"')
      ) {
        delayedFirstSettingsWrite = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return originalWriteFile(file, data, options as never);
    });

    await Promise.all([writeStore(root, firstStore), writeStore(root, secondStore)]);
    writeSpy.mockRestore();

    await expect(readStore(root)).resolves.toMatchObject(secondStore);
  });
});
