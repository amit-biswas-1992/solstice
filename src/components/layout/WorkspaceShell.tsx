import { useEffect, useMemo, useState } from 'react';
import { isDateInMonth, moveDateKeyToMonth, shiftMonthKey } from '../../lib/date';
import MonthGrid from '../calendar/MonthGrid';
import DayDetailPanel from '../day/DayDetailPanel';
import ProjectSidebar from '../projects/ProjectSidebar';
import type { UnlockedStoreSnapshot } from '../../types/desktopBridge';

interface WorkspaceShellProps {
  appVersion: string;
  onPersistStore?: (store: UnlockedStoreSnapshot) => Promise<UnlockedStoreSnapshot>;
  store: UnlockedStoreSnapshot;
}

interface PersistEntriesResult {
  error?: string;
  ok: boolean;
}

export default function WorkspaceShell({ appVersion, onPersistStore, store }: WorkspaceShellProps) {
  const storeSelection = useMemo(
    () => ({
      visibleMonth: store.settings.lastOpenedMonth,
      selectedDate: isDateInMonth(store.settings.lastSelectedDate, store.settings.lastOpenedMonth)
        ? store.settings.lastSelectedDate
        : moveDateKeyToMonth(store.settings.lastSelectedDate, store.settings.lastOpenedMonth)
    }),
    [store.settings.lastOpenedMonth, store.settings.lastSelectedDate]
  );
  const [visibleMonth, setVisibleMonth] = useState(storeSelection.visibleMonth);
  const [selectedDate, setSelectedDate] = useState(storeSelection.selectedDate);
  const [entries, setEntries] = useState(store.entries);

  useEffect(() => {
    setVisibleMonth(storeSelection.visibleMonth);
    setSelectedDate(storeSelection.selectedDate);
  }, [storeSelection.selectedDate, storeSelection.visibleMonth]);

  useEffect(() => {
    setEntries(store.entries);
  }, [store.entries]);

  const selectedEntry = entries[selectedDate];
  const selectedNotes = selectedEntry?.notes.length ?? 0;
  const selectedTasks = selectedEntry?.tasks.length ?? 0;
  const projectLabel = `${store.projects.length} project${store.projects.length === 1 ? '' : 's'} loaded.`;

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    if (!isDateInMonth(dateKey, visibleMonth)) {
      setVisibleMonth(dateKey.slice(0, 7));
    }
  };

  const handleNavigateMonth = (offset: number) => {
    setVisibleMonth((currentMonth) => {
      const nextMonth = shiftMonthKey(currentMonth, offset);
      setSelectedDate((currentDate) => moveDateKeyToMonth(currentDate, nextMonth));
      return nextMonth;
    });
  };

  const persistEntries = async (
    nextEntries: typeof entries,
    options?: {
      selectedDate?: string;
      visibleMonth?: string;
    }
  ): Promise<PersistEntriesResult> => {
    const previousEntries = entries;

    setEntries(nextEntries);

    if (!onPersistStore) {
      return {
        ok: true
      };
    }

    try {
      const savedStore = await onPersistStore({
        settings: {
          lastOpenedMonth: options?.visibleMonth ?? visibleMonth,
          lastSelectedDate: options?.selectedDate ?? selectedDate
        },
        projects: store.projects,
        entries: nextEntries
      });
      setEntries(savedStore.entries);

      return {
        ok: true
      };
    } catch (error) {
      setEntries(previousEntries);

      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to save the current day changes.'
      };
    }
  };

  return (
    <main className="workspace-shell">
      <section className="workspace-frame" aria-labelledby="workspace-title">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Studio Workspace</p>
            <h1 id="workspace-title">Daily Notes Workspace</h1>
            <p className="lede">{projectLabel}</p>
          </div>
          <div className="workspace-header__status" aria-label="Selected day status">
            <span className="workspace-header__status-label">Selected date: {selectedDate}</span>
            <span>
              {selectedNotes} note{selectedNotes === 1 ? '' : 's'} and {selectedTasks} task
              {selectedTasks === 1 ? '' : 's'}
            </span>
            <span>Bridge v{appVersion}</span>
          </div>
        </header>

        <div className="workspace-shell__grid">
          <ProjectSidebar entries={entries} projects={store.projects} selectedDate={selectedDate} />
          <MonthGrid
            entries={entries}
            monthKey={visibleMonth}
            onNavigateMonth={handleNavigateMonth}
            onSelectDate={handleSelectDate}
            selectedDate={selectedDate}
          />
          <DayDetailPanel
            entries={entries}
            onPersistEntries={persistEntries}
            projects={store.projects}
            onSelectDate={handleSelectDate}
            selectedDate={selectedDate}
          />
        </div>
      </section>
    </main>
  );
}
