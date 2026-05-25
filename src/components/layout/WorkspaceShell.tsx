import { useEffect, useMemo, useState } from 'react';
import { isDateInMonth, moveDateKeyToMonth, shiftMonthKey } from '../../lib/date';
import MonthGrid from '../calendar/MonthGrid';
import SelectedDayPanel from './SelectedDayPanel';
import ProjectSidebar from '../projects/ProjectSidebar';
import type { UnlockedStoreSnapshot } from '../../types/desktopBridge';

interface WorkspaceShellProps {
  appVersion: string;
  store: UnlockedStoreSnapshot;
}

export default function WorkspaceShell({ appVersion, store }: WorkspaceShellProps) {
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

  useEffect(() => {
    setVisibleMonth(storeSelection.visibleMonth);
    setSelectedDate(storeSelection.selectedDate);
  }, [storeSelection.selectedDate, storeSelection.visibleMonth]);

  const selectedEntry = store.entries[selectedDate];
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
          <ProjectSidebar entries={store.entries} projects={store.projects} selectedDate={selectedDate} />
          <MonthGrid
            entries={store.entries}
            monthKey={visibleMonth}
            onNavigateMonth={handleNavigateMonth}
            onSelectDate={handleSelectDate}
            selectedDate={selectedDate}
          />
          <SelectedDayPanel entries={store.entries} projects={store.projects} selectedDate={selectedDate} />
        </div>
      </section>
    </main>
  );
}
