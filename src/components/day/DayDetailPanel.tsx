import { useEffect, useMemo, useState } from 'react';
import { formatLongDateLabel } from '../../lib/date';
import type { EntriesByDate, Note, Project, Task } from '../../types/models';
import StatusToast from '../common/StatusToast';
import EntryPopupEditor from './EntryPopupEditor';
import NotesSection from './NotesSection';
import TasksSection from './TasksSection';
import { createNote, createTask, updateEntriesForDate } from './dayDetailUtils';

interface DayDetailPanelProps {
  entries: EntriesByDate;
  onEntriesChange: (entries: EntriesByDate) => void;
  projects: Project[];
  selectedDate: string;
}

type PopupState =
  | {
      entryId: string;
      initialText: string;
      kind: 'note';
      label: string;
    }
  | {
      entryId: string;
      initialText: string;
      kind: 'task';
      label: string;
    };

export default function DayDetailPanel({
  entries,
  onEntriesChange,
  projects,
  selectedDate
}: DayDetailPanelProps) {
  const [popupState, setPopupState] = useState<PopupState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedEntry = entries[selectedDate];
  const notes = selectedEntry?.notes ?? [];
  const tasks = selectedEntry?.tasks ?? [];
  const openTaskCount = tasks.filter((task) => !task.done).length;
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );
  const linkedProjects = useMemo(() => {
    const linkedProjectIds = new Set(
      [...notes, ...tasks]
        .map((item) => item.projectId)
        .filter((projectId): projectId is string => Boolean(projectId))
    );

    return Array.from(linkedProjectIds)
      .map((projectId) => projectById.get(projectId))
      .filter((project): project is Project => Boolean(project));
  }, [notes, projectById, tasks]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  useEffect(() => {
    setPopupState(null);
  }, [selectedDate]);

  const commitEntries = (updater: (currentEntries: EntriesByDate) => EntriesByDate, message: string) => {
    onEntriesChange(updater(entries));
    setStatusMessage(message);
  };

  const handleAddNote = (text: string) => {
    commitEntries(
      (currentEntries) =>
        updateEntriesForDate(currentEntries, selectedDate, (entry) => ({
          ...entry,
          notes: [...entry.notes, createNote(text)]
        })),
      'Note added to the selected day.'
    );
  };

  const handleUpdateNote = (noteId: string, text: string) => {
    commitEntries(
      (currentEntries) =>
        updateEntriesForDate(currentEntries, selectedDate, (entry) => ({
          ...entry,
          notes: entry.notes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  text,
                  updatedAt: new Date().toISOString()
                }
              : note
          )
        })),
      'Note updated.'
    );
  };

  const handleAddTask = (text: string) => {
    commitEntries(
      (currentEntries) =>
        updateEntriesForDate(currentEntries, selectedDate, (entry) => ({
          ...entry,
          tasks: [...entry.tasks, createTask(text)]
        })),
      'Task added to the selected day.'
    );
  };

  const handleUpdateTask = (taskId: string, text: string) => {
    commitEntries(
      (currentEntries) =>
        updateEntriesForDate(currentEntries, selectedDate, (entry) => ({
          ...entry,
          tasks: entry.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  text,
                  updatedAt: new Date().toISOString()
                }
              : task
          )
        })),
      'Task updated.'
    );
  };

  const handleToggleTask = (taskId: string) => {
    const nextTask = tasks.find((task) => task.id === taskId);

    commitEntries(
      (currentEntries) =>
        updateEntriesForDate(currentEntries, selectedDate, (entry) => ({
          ...entry,
          tasks: entry.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  done: !task.done,
                  updatedAt: new Date().toISOString()
                }
              : task
          )
        })),
      nextTask?.done ? 'Task marked open again.' : 'Task completed.'
    );
  };

  const handleSavePopup = (text: string) => {
    if (!popupState) {
      return;
    }

    if (popupState.kind === 'note') {
      handleUpdateNote(popupState.entryId, text);
    } else {
      handleUpdateTask(popupState.entryId, text);
    }

    setPopupState(null);
  };

  const openPopupForNote = (note: Note) => {
    setPopupState({
      entryId: note.id,
      initialText: note.text,
      kind: 'note',
      label: 'Selected note'
    });
  };

  const openPopupForTask = (task: Task) => {
    setPopupState({
      entryId: task.id,
      initialText: task.text,
      kind: 'task',
      label: task.done ? 'Completed task' : 'Open task'
    });
  };

  return (
    <aside className="workspace-panel selected-day-panel" aria-labelledby="selected-day-panel-title">
      <header className="workspace-panel__header">
        <div>
          <p className="workspace-panel__eyebrow">Selected day</p>
          <h2 id="selected-day-panel-title">Day detail</h2>
        </div>
        <div className="workspace-panel__meta">
          <span>{notes.length} notes</span>
          <span>{tasks.length} tasks</span>
        </div>
      </header>

      <section className="selected-day-panel__hero">
        <p className="selected-day-panel__date">{formatLongDateLabel(selectedDate)}</p>
        <p className="selected-day-panel__summary">
          {notes.length} note{notes.length === 1 ? '' : 's'}, {tasks.length} task
          {tasks.length === 1 ? '' : 's'}, and {openTaskCount} still open.
        </p>
      </section>

      <NotesSection
        notes={notes}
        onAddNote={handleAddNote}
        onOpenPopup={openPopupForNote}
        onUpdateNote={handleUpdateNote}
      />

      <TasksSection
        tasks={tasks}
        onAddTask={handleAddTask}
        onOpenPopup={openPopupForTask}
        onToggleTask={handleToggleTask}
        onUpdateTask={handleUpdateTask}
      />

      <EntryPopupEditor
        entryLabel={popupState?.label ?? ''}
        initialText={popupState?.initialText ?? ''}
        isOpen={popupState !== null}
        kind={popupState?.kind ?? 'note'}
        onClose={() => setPopupState(null)}
        onSave={handleSavePopup}
      />

      <StatusToast message={statusMessage} />

      <section className="selected-day-panel__section" aria-label="Linked projects">
        <div className="selected-day-panel__section-header">
          <h3>Linked projects</h3>
          <span>{linkedProjects.length}</span>
        </div>
        {linkedProjects.length === 0 ? (
          <p className="selected-day-panel__empty">No project associations on the selected day.</p>
        ) : (
          <ul className="selected-day-panel__project-list">
            {linkedProjects.map((project) => (
              <li key={project.id}>
                <span
                  className="selected-day-panel__project-dot"
                  style={{ backgroundColor: project.color ?? '#1f4e79' }}
                  aria-hidden="true"
                />
                <span className="selected-day-panel__project-name">{project.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
