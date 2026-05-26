// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    '2026-04-25': {
      notes: [
        {
          id: 'note-0',
          text: 'Archive review',
          projectId: 'project-alpha',
          createdAt: '2026-04-25T08:00:00.000Z',
          updatedAt: '2026-04-25T08:00:00.000Z'
        }
      ],
      tasks: []
    },
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
    },
    '2026-06-25': {
      notes: [
        {
          id: 'note-2',
          text: 'Release notes ready',
          projectId: 'project-alpha',
          createdAt: '2026-06-25T08:00:00.000Z',
          updatedAt: '2026-06-25T08:00:00.000Z'
        }
      ],
      tasks: [
        {
          id: 'task-2',
          text: 'Prepare June wrap-up',
          projectId: 'project-alpha',
          done: true,
          createdAt: '2026-06-25T08:00:00.000Z',
          updatedAt: '2026-06-25T08:00:00.000Z'
        }
      ]
    }
  }
};

describe('Workspace month grid', () => {
  it('renders all three workspace columns and updates selected-day state from the grid', async () => {
    const user = userEvent.setup();

    render(<WorkspaceShell appVersion="0.1.0" store={store} />);

    expect(screen.getByRole('heading', { name: /daily notes workspace/i })).toBeInTheDocument();
    expect(screen.getAllByText('Selected date: 2026-05-25')[0]).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /day detail/i })).toBeInTheDocument();

    const selectedDay = screen.getByRole('button', {
      name: /may 25, 2026\./i
    });
    const nextActiveDay = screen.getByRole('button', {
      name: /may 26, 2026\./i
    });
    const emptyDay = screen.getByRole('button', {
      name: /may 24, 2026\. no entries/i
    });

    expect(selectedDay).toHaveAttribute('data-active', 'true');
    expect(selectedDay).toHaveAttribute('data-selected', 'true');
    expect(nextActiveDay).toHaveAttribute('data-active', 'true');
    expect(emptyDay).toHaveAttribute('data-empty', 'true');

    await user.click(nextActiveDay);

    expect(screen.getAllByText('Selected date: 2026-05-26')[0]).toBeInTheDocument();
    expect(nextActiveDay).toHaveAttribute('data-selected', 'true');
    expect(selectedDay).toHaveAttribute('data-selected', 'false');
    expect(screen.getByText(/review active day styling/i)).toBeInTheDocument();
  });

  it('navigates between months and carries shell selection state with the visible month', async () => {
    const user = userEvent.setup();

    render(<WorkspaceShell appVersion="0.1.0" store={store} />);

    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next month/i }));

    expect(screen.getByRole('grid', { name: 'June 2026' })).toBeInTheDocument();
    expect(screen.getAllByText('Selected date: 2026-06-25')[0]).toBeInTheDocument();
    expect(screen.getByText(/release notes ready/i)).toBeInTheDocument();

    const juneDay = screen.getByRole('button', {
      name: /june 25, 2026\./i
    });
    expect(juneDay).toHaveAttribute('data-selected', 'true');
    expect(juneDay).toHaveAttribute('data-active', 'true');

    await user.click(screen.getByRole('button', { name: /previous month/i }));

    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeInTheDocument();
    expect(screen.getAllByText('Selected date: 2026-05-25')[0]).toBeInTheDocument();
  });

  it('resyncs local month and selected-day state when the parent store snapshot changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<WorkspaceShell appVersion="0.1.0" store={store} />);

    await user.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByRole('grid', { name: 'June 2026' })).toBeInTheDocument();
    expect(screen.getAllByText('Selected date: 2026-06-25')[0]).toBeInTheDocument();

    rerender(
      <WorkspaceShell
        appVersion="0.1.0"
        store={{
          ...store,
          settings: {
            lastOpenedMonth: '2026-04',
            lastSelectedDate: '2026-04-25'
          }
        }}
      />
    );

    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
    expect(screen.getAllByText('Selected date: 2026-04-25')[0]).toBeInTheDocument();
    expect(screen.getByText(/archive review/i)).toBeInTheDocument();
  });

  it('creates project-organized work from the organizer bar and filters the month grid by project', async () => {
    const user = userEvent.setup();
    const onPersistStore = vi.fn<(snapshot: UnlockedStoreSnapshot) => Promise<UnlockedStoreSnapshot>>().mockImplementation(
      async (snapshot) => snapshot
    );

    render(<WorkspaceShell appVersion="0.1.0" onPersistStore={onPersistStore} store={store} />);

    await user.type(
      screen.getByLabelText('Organizer command'),
      'add task Plan launch assets for Project Gamma on 2026-05-27'
    );
    await user.click(screen.getByRole('button', { name: 'Organize' }));

    expect(screen.getAllByText('Selected date: 2026-05-27')[0]).toBeInTheDocument();
    expect(screen.getByText(/plan launch assets/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /project gamma/i })).toBeInTheDocument();

    const savedSnapshot = onPersistStore.mock.calls.at(-1)?.[0];
    expect(savedSnapshot?.projects.some((project) => project.name === 'Project Gamma')).toBe(true);
    expect(savedSnapshot?.entries['2026-05-27']?.tasks[0]?.text).toBe('Plan launch assets');

    await user.click(screen.getByRole('button', { name: /project gamma/i }));

    expect(screen.getByText('Filter: Project Gamma')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /may 25, 2026\./i })).toHaveAttribute(
      'data-filtered-dim',
      'true'
    );
    expect(screen.getByRole('button', { name: /may 27, 2026\./i })).toHaveAttribute(
      'data-filter-match',
      'true'
    );
  });

  it('collapses and expands the left project sidebar', async () => {
    const user = userEvent.setup();

    render(<WorkspaceShell appVersion="0.1.0" store={store} />);

    const collapseButton = screen.getByRole('button', { name: /collapse projects sidebar/i });
    await user.click(collapseButton);

    expect(screen.queryByLabelText('Quick project name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expand projects sidebar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /project gamma|alpha/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /expand projects sidebar/i }));

    expect(screen.getByLabelText('Quick project name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse projects sidebar/i })).toBeInTheDocument();
  });
});
