// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import WorkspaceShell from '../components/layout/WorkspaceShell';
import type { UnlockedStoreSnapshot } from '../types/desktopBridge';

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

describe('Workspace month grid', () => {
  it('renders active and empty day cards with the selected day represented in shell state', async () => {
    const user = userEvent.setup();

    render(<WorkspaceShell appVersion="0.1.0" store={store} />);

    expect(screen.getByRole('heading', { name: /daily notes workspace/i })).toBeInTheDocument();
    expect(screen.getByText('Selected date: 2026-05-25')).toBeInTheDocument();

    const selectedDay = screen.getByRole('button', {
      name: /may 25, 2026\./i
    });
    const nextActiveDay = screen.getByRole('button', {
      name: /may 26, 2026\./i
    });
    const emptyDay = screen.getByRole('button', {
      name: /may 24, 2026\. no entries/i
    });

    expect(selectedDay).toHaveClass('day-card--active', 'day-card--selected');
    expect(nextActiveDay).toHaveClass('day-card--active');
    expect(emptyDay).toHaveClass('day-card--empty');

    await user.click(nextActiveDay);

    expect(screen.getByText('Selected date: 2026-05-26')).toBeInTheDocument();
    expect(nextActiveDay).toHaveClass('day-card--selected');
    expect(selectedDay).not.toHaveClass('day-card--selected');
  });
});
