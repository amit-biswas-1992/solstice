import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
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

    await writeStore(root, {
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
      }
    });

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
});
