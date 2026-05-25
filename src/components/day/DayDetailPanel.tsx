import { useEffect, useMemo, useState } from 'react';
import { formatLongDateLabel } from '../../lib/date';
import type { EntriesByDate, Note, Project, Task } from '../../types/models';
import StatusToast from '../common/StatusToast';
import EntryPopupEditor from './EntryPopupEditor';
import NotesSection from './NotesSection';
import TasksSection from './TasksSection';
import {
  createNote,
  createTask,
  removeItemFromEntries,
  upsertItemInEntries,
  updateEntriesForDate
} from './dayDetailUtils';

interface DayDetailPanelProps {
  entries: EntriesByDate;
  onPersistEntries: (
    entries: EntriesByDate,
    options?: {
      selectedDate?: string;
      visibleMonth?: string;
    }
  ) => Promise<{ error?: string; ok: boolean }>;
  onSelectDate: (dateKey: string) => void;
  projects: Project[];
  selectedDate: string;
}

type PopupState =
  | {
      entryId: string;
      initialProjectId?: string;
      initialText: string;
      kind: 'note';
      label: string;
    }
  | {
      entryId: string;
      initialProjectId?: string;
      initialText: string;
      kind: 'task';
      label: string;
    };

type StatusTone = 'error' | 'success';

interface EntryDraft {
  projectId?: string;
  text: string;
}

interface PopupDraft extends EntryDraft {
  targetDate: string;
}

export default function DayDetailPanel({
  entries,
  onPersistEntries,
  onSelectDate,
  projects,
  selectedDate
}: DayDetailPanelProps) {
  const [popupState, setPopupState] = useState<PopupState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>('success');

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

    const timeoutId = window.setTimeout(
      () => {
        setStatusMessage(null);
      },
      statusTone === 'error' ? 4200 : 2400
    );

    return () => window.clearTimeout(timeoutId);
  }, [statusMessage, statusTone]);

  useEffect(() => {
    setPopupState(null);
  }, [selectedDate]);

  const persistEntries = async (
    nextEntries: EntriesByDate,
    successMessage: string,
    options?: {
      errorMessage?: string;
      selectedDate?: string;
    }
  ) => {
    const nextSelectedDate = options?.selectedDate;
    const result = await onPersistEntries(nextEntries, {
      selectedDate: nextSelectedDate ?? selectedDate,
      visibleMonth: (nextSelectedDate ?? selectedDate).slice(0, 7)
    });

    if (!result.ok) {
      setStatusTone('error');
      setStatusMessage(result.error ?? options?.errorMessage ?? 'Unable to save the current changes.');
      throw new Error(result.error ?? options?.errorMessage ?? 'Unable to save the current changes.');
    }

    if (nextSelectedDate && nextSelectedDate !== selectedDate) {
      onSelectDate(nextSelectedDate);
    }

    setStatusTone('success');
    setStatusMessage(successMessage);
  };

  const handleAddNote = async ({ projectId, text }: EntryDraft) => {
    await persistEntries(
      updateEntriesForDate(entries, selectedDate, (entry) => ({
        ...entry,
        notes: [...entry.notes, createNote(text, projectId)]
      })),
      'Note added to the selected day.'
    );
  };

  const handleUpdateNote = async (noteId: string, { projectId, text }: EntryDraft) => {
    await persistEntries(
      upsertItemInEntries(entries, selectedDate, 'notes', noteId, selectedDate, (note: Note) => ({
        ...note,
        projectId,
        text,
        updatedAt: new Date().toISOString()
      })),
      'Note updated.'
    );
  };

  const handleDeleteNote = async (noteId: string) => {
    await persistEntries(
      removeItemFromEntries(entries, selectedDate, 'notes', noteId),
      'Note deleted from the selected day.'
    );
  };

  const handleAddTask = async ({ projectId, text }: EntryDraft) => {
    await persistEntries(
      updateEntriesForDate(entries, selectedDate, (entry) => ({
        ...entry,
        tasks: [...entry.tasks, createTask(text, projectId)]
      })),
      'Task added to the selected day.'
    );
  };

  const handleUpdateTask = async (taskId: string, { projectId, text }: EntryDraft) => {
    await persistEntries(
      upsertItemInEntries(entries, selectedDate, 'tasks', taskId, selectedDate, (task: Task) => ({
        ...task,
        projectId,
        text,
        updatedAt: new Date().toISOString()
      })),
      'Task updated.'
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    await persistEntries(
      removeItemFromEntries(entries, selectedDate, 'tasks', taskId),
      'Task deleted from the selected day.'
    );
  };

  const handleToggleTask = async (taskId: string) => {
    const nextTask = tasks.find((task) => task.id === taskId);

    await persistEntries(
      upsertItemInEntries(entries, selectedDate, 'tasks', taskId, selectedDate, (task: Task) => ({
        ...task,
        done: !task.done,
        updatedAt: new Date().toISOString()
      })),
      nextTask?.done ? 'Task marked open again.' : 'Task completed.'
    );
  };

  const handleSavePopup = async ({ projectId, targetDate, text }: PopupDraft) => {
    if (!popupState) {
      return;
    }

    if (popupState.kind === 'note') {
      await persistEntries(
        upsertItemInEntries(entries, selectedDate, 'notes', popupState.entryId, targetDate, (note: Note) => ({
          ...note,
          projectId,
          text,
          updatedAt: new Date().toISOString()
        })),
        targetDate === selectedDate ? 'Note updated.' : `Note moved to ${formatLongDateLabel(targetDate)}.`,
        {
          selectedDate: targetDate
        }
      );
    } else {
      await persistEntries(
        upsertItemInEntries(entries, selectedDate, 'tasks', popupState.entryId, targetDate, (task: Task) => ({
          ...task,
          projectId,
          text,
          updatedAt: new Date().toISOString()
        })),
        targetDate === selectedDate ? 'Task updated.' : `Task moved to ${formatLongDateLabel(targetDate)}.`,
        {
          selectedDate: targetDate
        }
      );
    }

    setPopupState(null);
  };

  const openPopupForNote = (note: Note) => {
    setPopupState({
      entryId: note.id,
      initialProjectId: note.projectId,
      initialText: note.text,
      kind: 'note',
      label: 'Selected note'
    });
  };

  const openPopupForTask = (task: Task) => {
    setPopupState({
      entryId: task.id,
      initialProjectId: task.projectId,
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
        onDeleteNote={handleDeleteNote}
        onOpenPopup={openPopupForNote}
        onUpdateNote={handleUpdateNote}
        projects={projects}
      />

      <TasksSection
        tasks={tasks}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onOpenPopup={openPopupForTask}
        onToggleTask={handleToggleTask}
        onUpdateTask={handleUpdateTask}
        projects={projects}
      />

      <EntryPopupEditor
        entryLabel={popupState?.label ?? ''}
        initialDate={selectedDate}
        initialProjectId={popupState?.initialProjectId}
        initialText={popupState?.initialText ?? ''}
        isOpen={popupState !== null}
        kind={popupState?.kind ?? 'note'}
        onClose={() => setPopupState(null)}
        onSave={handleSavePopup}
        projects={projects}
      />

      <StatusToast message={statusMessage} tone={statusTone} />

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
