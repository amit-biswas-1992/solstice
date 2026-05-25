// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import WorkspaceShell from '../components/layout/WorkspaceShell';
import type { UnlockedStoreSnapshot } from '../types/desktopBridge';

afterEach(() => {
  cleanup();
});

const store: UnlockedStoreSnapshot = {
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
      tasks: []
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
};

describe('Day detail panel', () => {
  it('adds notes and tasks inline and syncs the selected day state across the shell', async () => {
    const user = userEvent.setup();

    render(<WorkspaceShell appVersion="0.1.0" store={store} />);

    const emptyDay = screen.getByRole('button', { name: /may 24, 2026\./i });
    await user.click(emptyDay);

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByLabelText('New note'), 'Call with finance');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(screen.getByText('Selected date: 2026-05-24')).toBeInTheDocument();
    expect(screen.getByText('1 note and 0 tasks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /may 24, 2026\./i })).toHaveClass('day-card--active');
    expect(screen.getByText('Call with finance')).toBeInTheDocument();
    expect(screen.getByText('Note added to the selected day.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add task' }));
    await user.type(screen.getByLabelText('New task'), 'Send follow-up');
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(screen.getByText('1 note and 1 task')).toBeInTheDocument();
    expect(screen.getByText('Send follow-up')).toBeInTheDocument();
    expect(screen.getByText('Task added to the selected day.')).toBeInTheDocument();
  });

  it('toggles task completion and surfaces status feedback', async () => {
    const user = userEvent.setup();

    render(<WorkspaceShell appVersion="0.1.0" store={store} />);

    await user.click(screen.getByRole('button', { name: /may 26, 2026\./i }));

    const taskToggle = screen.getByRole('checkbox', { name: 'Review active day styling' });

    expect(taskToggle).not.toBeChecked();
    expect(screen.getByText('Open')).toBeInTheDocument();

    await user.click(taskToggle);

    expect(taskToggle).toBeChecked();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Task completed.')).toBeInTheDocument();
  });

  it('opens the popup editor for richer edits and saves the updated note text', async () => {
    const user = userEvent.setup();

    render(<WorkspaceShell appVersion="0.1.0" store={store} />);

    await user.click(screen.getByRole('button', { name: 'Open editor' }));

    expect(screen.getByRole('dialog', { name: 'Note editor' })).toBeInTheDocument();

    const textarea = screen.getByLabelText('Note details');
    await user.clear(textarea);
    await user.type(textarea, 'Ship shell layout and verify toast copy');
    await user.click(screen.getByRole('button', { name: 'Save details' }));

    expect(screen.queryByRole('dialog', { name: 'Note editor' })).not.toBeInTheDocument();
    expect(screen.getByText('Ship shell layout and verify toast copy')).toBeInTheDocument();
    expect(screen.getByText('Note updated.')).toBeInTheDocument();
  });
});
