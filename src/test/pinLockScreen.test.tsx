// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

interface StoreBootstrap {
  auth: {
    hasPin: boolean;
    isLocked: boolean;
  };
  summary: {
    entryCount: number;
    lastOpenedMonth: string;
    lastSelectedDate: string;
    projectCount: number;
  };
}

interface UnlockResult {
  ok: boolean;
  message?: string;
  store?: {
    settings: {
      lastOpenedMonth: string;
      lastSelectedDate: string;
    };
    projects: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>;
    entries: Record<string, unknown>;
  };
}

describe('PinLockScreen bootstrap flow', () => {
  beforeEach(() => {
    const loadStore = vi.fn<() => Promise<StoreBootstrap>>().mockResolvedValue({
      auth: {
        hasPin: true,
        isLocked: true
      },
      summary: {
        entryCount: 1,
        lastOpenedMonth: '2026-05',
        lastSelectedDate: '2026-05-25',
        projectCount: 1
      }
    });

    const unlock = vi
      .fn<(pin: string) => Promise<UnlockResult>>()
      .mockResolvedValueOnce({
        ok: false,
        message: 'Incorrect PIN. Try again.'
      })
      .mockResolvedValueOnce({
        ok: true,
        store: {
          settings: {
            lastOpenedMonth: '2026-05',
            lastSelectedDate: '2026-05-25'
          },
          projects: [
            {
              id: 'project-alpha',
              name: 'Alpha',
              createdAt: '2026-05-25T10:00:00.000Z',
              updatedAt: '2026-05-25T10:00:00.000Z'
            }
          ],
          entries: {
            '2026-05-25': {
              notes: [],
              tasks: []
            }
          }
        }
      });

    Object.defineProperty(window, 'dailyNotesDesktop', {
      configurable: true,
      value: {
        version: '0.1.0',
        loadStore,
        unlock
      }
    });
  });

  it('shows the lock screen until the correct PIN unlocks the workspace', async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(window.dailyNotesDesktop.loadStore).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole('heading', { name: /unlock daily notes/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/last opened month/i)).toHaveTextContent('2026-05');

    await user.type(screen.getByLabelText(/pin code/i), '1111');
    await user.click(screen.getByRole('button', { name: /unlock workspace/i }));

    expect(window.dailyNotesDesktop.unlock).toHaveBeenCalledWith('1111');
    expect(await screen.findByText(/incorrect pin\. try again\./i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/pin code/i));
    await user.type(screen.getByLabelText(/pin code/i), '4321');
    await user.click(screen.getByRole('button', { name: /unlock workspace/i }));

    expect(window.dailyNotesDesktop.unlock).toHaveBeenCalledWith('4321');
    expect(
      await screen.findByRole('heading', { name: /daily notes workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/1 project loaded/i)).toBeInTheDocument();
    expect(screen.getByText(/selected date: 2026-05-25/i)).toBeInTheDocument();
  });
});
