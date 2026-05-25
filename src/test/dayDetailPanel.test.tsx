// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import WorkspaceShell from '../components/layout/WorkspaceShell';
import type { StoreBootstrap, UnlockedStoreSnapshot } from '../types/desktopBridge';

afterEach(() => {
  cleanup();
});

const createStore = (): UnlockedStoreSnapshot => ({
  settings: {
    lastOpenedMonth: '2026-05',
    lastSelectedDate: '2026-05-25'
  },
  projects: [
    {
      id: 'project-alpha',
      name: 'Alpha',
      color: '#1f4e79',
      createdAt: '2026-05-01T08:00:00.000Z',
      updatedAt: '2026-05-25T08:00:00.000Z'
    },
    {
      id: 'project-beta',
      name: 'Beta',
      color: '#8c5e34',
      createdAt: '2026-05-02T08:00:00.000Z',
      updatedAt: '2026-05-25T08:00:00.000Z'
    }
  ],
  entries: {
    '2026-05-25': {
      notes: [
        {
          id: 'note-1',
          text: 'Ship shell layout',
          projectId: 'project-alpha',
          createdAt: '2026-05-25T08:00:00.000Z',
          updatedAt: '2026-05-25T08:00:00.000Z'
        }
      ],
      tasks: [
        {
          id: 'task-0',
          text: 'Draft release checklist',
          projectId: 'project-alpha',
          done: false,
          createdAt: '2026-05-25T09:00:00.000Z',
          updatedAt: '2026-05-25T09:00:00.000Z'
        }
      ]
    },
    '2026-05-26': {
      notes: [],
      tasks: [
        {
          id: 'task-1',
          text: 'Review active day styling',
          projectId: 'project-alpha',
          done: false,
          createdAt: '2026-05-26T08:00:00.000Z',
          updatedAt: '2026-05-26T08:00:00.000Z'
        }
      ]
    }
  }
});

const createBootstrap = (store: UnlockedStoreSnapshot): StoreBootstrap => ({
  auth: {
    hasPin: false,
    isLocked: false
  },
  summary: {
    entryCount: Object.keys(store.entries).length,
    lastOpenedMonth: store.settings.lastOpenedMonth,
    lastSelectedDate: store.settings.lastSelectedDate,
    projectCount: store.projects.length
  },
  store
});

const renderShell = () => {
  const store = createStore();
  const onPersistStore = vi
    .fn<(snapshot: UnlockedStoreSnapshot) => Promise<UnlockedStoreSnapshot>>()
    .mockImplementation(async (snapshot) => snapshot);

  render(<WorkspaceShell appVersion="0.1.0" onPersistStore={onPersistStore} store={store} />);

  return {
    onPersistStore,
    user: userEvent.setup()
  };
};

describe('Day detail panel', () => {
  it('deletes notes and tasks and persists the updated entries snapshot', async () => {
    const { onPersistStore, user } = renderShell();

    await user.click(screen.getByRole('button', { name: 'Delete note' }));
    expect(screen.queryByText('Ship shell layout')).not.toBeInTheDocument();
    expect(screen.getByText('Note deleted from the selected day.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete task' }));
    expect(screen.queryByText('Draft release checklist')).not.toBeInTheDocument();
    expect(screen.getByText('Task deleted from the selected day.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /may 25, 2026\./i })).toHaveClass('day-card--empty');

    expect(onPersistStore).toHaveBeenCalledTimes(2);
    const lastSnapshot = onPersistStore.mock.calls.at(-1)?.[0];
    expect(lastSnapshot?.entries['2026-05-25']).toBeUndefined();
  });

  it('supports direct click-to-edit for tasks, project retagging, and Escape to cancel inline edits', async () => {
    const { onPersistStore, user } = renderShell();

    await user.click(screen.getByRole('button', { name: /inline edit task draft release checklist/i }));
    const editInput = screen.getByLabelText('Edit task Draft release checklist');
    await user.clear(editInput);
    await user.type(editInput, 'Draft release checklist v2');
    await user.selectOptions(
      screen.getByLabelText('Edit project tag for Draft release checklist'),
      'project-beta'
    );
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(screen.getByText('Draft release checklist v2')).toBeInTheDocument();
    expect(screen.getByText('Task updated.')).toBeInTheDocument();
    expect(screen.getAllByText('Beta')[0]).toBeInTheDocument();

    const updatedSnapshot = onPersistStore.mock.calls.at(-1)?.[0];
    expect(updatedSnapshot?.entries['2026-05-25']?.tasks[0]?.projectId).toBe('project-beta');

    await user.click(screen.getByRole('button', { name: /inline edit task draft release checklist v2/i }));
    await user.type(screen.getByLabelText('Edit task Draft release checklist v2'), ' changed');
    await user.keyboard('{Escape}');

    expect(screen.queryByLabelText('Edit task Draft release checklist v2')).not.toBeInTheDocument();
    expect(screen.getByText('Draft release checklist v2')).toBeInTheDocument();
    expect(onPersistStore).toHaveBeenCalledTimes(1);
  });

  it('moves a note to another date from the popup editor and retags it before saving', async () => {
    const { onPersistStore, user } = renderShell();

    const noteRow = screen.getByText('Ship shell layout').closest('li');
    expect(noteRow).not.toBeNull();
    await user.click(within(noteRow as HTMLElement).getByRole('button', { name: 'Open editor' }));

    expect(screen.getByRole('dialog', { name: 'Note editor' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Note details'));
    await user.type(screen.getByLabelText('Note details'), 'Ship shell layout and QA status');
    await user.selectOptions(screen.getByLabelText('Project tag'), 'project-beta');
    await user.clear(screen.getByLabelText('Move to date'));
    await user.type(screen.getByLabelText('Move to date'), '2026-05-27');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.queryByRole('dialog', { name: 'Note editor' })).not.toBeInTheDocument();
    expect(screen.getByText('Selected date: 2026-05-27')).toBeInTheDocument();
    expect(screen.getByText('Ship shell layout and QA status')).toBeInTheDocument();
    expect(screen.getByText('Note moved to May 27, 2026.')).toBeInTheDocument();

    const savedSnapshot = onPersistStore.mock.calls.at(-1)?.[0];
    expect(savedSnapshot?.settings.lastSelectedDate).toBe('2026-05-27');
    expect(savedSnapshot?.entries['2026-05-27']?.notes[0]?.projectId).toBe('project-beta');
    expect(savedSnapshot?.entries['2026-05-25']?.notes).toHaveLength(0);
  });

  it('cancels popup editing on Escape without persisting changes', async () => {
    const { onPersistStore, user } = renderShell();

    const noteRow = screen.getByText('Ship shell layout').closest('li');
    expect(noteRow).not.toBeNull();
    await user.click(within(noteRow as HTMLElement).getByRole('button', { name: 'Open editor' }));

    await user.type(screen.getByLabelText('Note details'), ' no-save');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Note editor' })).not.toBeInTheDocument();
    expect(screen.getByText('Ship shell layout')).toBeInTheDocument();
    expect(onPersistStore).not.toHaveBeenCalled();
  });

  it('routes selected-day saves through the desktop bridge when mounted from App', async () => {
    const store = createStore();
    const saveStore = vi
      .fn<(snapshot: UnlockedStoreSnapshot) => Promise<UnlockedStoreSnapshot>>()
      .mockImplementation(async (snapshot) => snapshot);

    Object.defineProperty(window, 'dailyNotesDesktop', {
      configurable: true,
      value: {
        version: '0.1.0',
        loadStore: vi.fn().mockResolvedValue(createBootstrap(store)),
        saveStore,
        unlock: vi.fn()
      }
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: /daily notes workspace/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete note' }));

    expect(saveStore).toHaveBeenCalledTimes(1);
    expect(saveStore.mock.calls[0]?.[0].entries['2026-05-25']?.notes).toEqual([]);
  });
});
