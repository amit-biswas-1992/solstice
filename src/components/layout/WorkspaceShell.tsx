import { useState } from 'react';
import MonthGrid from '../calendar/MonthGrid';
import ProjectSidebar from '../projects/ProjectSidebar';
import type { UnlockedStoreSnapshot } from '../../types/desktopBridge';

interface WorkspaceShellProps {
  appVersion: string;
  store: UnlockedStoreSnapshot;
}

export default function WorkspaceShell({ appVersion, store }: WorkspaceShellProps) {
  const [selectedDate, setSelectedDate] = useState(store.settings.lastSelectedDate);

  const selectedEntry = store.entries[selectedDate];
  const selectedNotes = selectedEntry?.notes.length ?? 0;
  const selectedTasks = selectedEntry?.tasks.length ?? 0;
  const projectLabel = `${store.projects.length} project${store.projects.length === 1 ? '' : 's'} loaded.`;

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
            monthKey={store.settings.lastOpenedMonth}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        </div>
      </section>
    </main>
  );
}
