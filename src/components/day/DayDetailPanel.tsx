import { useEffect, useMemo, useState } from 'react';
import { createDateKey, formatLongDateLabel } from '../../lib/date';
import type { EntriesByDate, Note, Project, Task } from '../../types/models';
import StatusToast from '../common/StatusToast';
import CommandBar from './CommandBar';
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
  activeProjectId?: string | null;
  activeProjectName?: string;
  entries: EntriesByDate;
  onCommand: (input: string) => Promise<{ error?: string; message?: string; ok: boolean }>;
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
  description?: string;
  projectId?: string;
  text: string;
  url?: string;
}

interface PopupDraft extends EntryDraft {
  targetDate: string;
}

const sectionClass = 'rounded-[24px] border border-[color:var(--color-line)] bg-white px-5 py-5';

export default function DayDetailPanel({
  activeProjectId,
  activeProjectName,
  entries,
  onCommand,
  onPersistEntries,
  onSelectDate,
  projects,
  selectedDate
}: DayDetailPanelProps) {
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [popupState, setPopupState] = useState<PopupState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>('success');
  const [showCommandBar, setShowCommandBar] = useState(false);

  const isToday = selectedDate === createDateKey(new Date());

  const selectedEntry = entries[selectedDate];
  const notes = useMemo(
    () =>
      (selectedEntry?.notes ?? []).filter((note) => !activeProjectId || note.projectId === activeProjectId),
    [activeProjectId, selectedEntry]
  );
  const tasks = useMemo(
    () =>
      (selectedEntry?.tasks ?? []).filter((task) => !activeProjectId || task.projectId === activeProjectId),
    [activeProjectId, selectedEntry]
  );
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

  const handleCommand = async (input: string) => {
    setIsRunningCommand(true);
    try {
      const result = await onCommand(input);
      if (!result.ok) {
        setStatusTone('error');
        setStatusMessage(result.error ?? 'Unable to apply that organizer command.');
        return false;
      }

      setStatusTone('success');
      setStatusMessage(result.message ?? 'Command saved to the workspace.');
      return true;
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : 'Unable to apply that organizer command.');
      return false;
    } finally {
      setIsRunningCommand(false);
    }
  };

  const persistEntries = async (
    nextEntries: EntriesByDate,
    successMessage: string,
    options?: {
      errorMessage?: string;
      selectedDate?: string;
    }
  ): Promise<boolean> => {
    const nextSelectedDate = options?.selectedDate;
    const result = await onPersistEntries(nextEntries, {
      selectedDate: nextSelectedDate ?? selectedDate,
      visibleMonth: (nextSelectedDate ?? selectedDate).slice(0, 7)
    });

    if (!result.ok) {
      setStatusTone('error');
      setStatusMessage(result.error ?? options?.errorMessage ?? 'Unable to save the current changes.');
      return false;
    }

    if (nextSelectedDate && nextSelectedDate !== selectedDate) {
      onSelectDate(nextSelectedDate);
    }

    setStatusTone('success');
    setStatusMessage(successMessage);
    return true;
  };

  const handleAddNote = async ({ projectId, text }: EntryDraft) => {
    return persistEntries(
      updateEntriesForDate(entries, selectedDate, (entry) => ({
        ...entry,
        notes: [...entry.notes, createNote(text, projectId)]
      })),
      'Note added.'
    );
  };

  const handleUpdateNote = async (noteId: string, { projectId, text }: EntryDraft) => {
    return persistEntries(
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
    return persistEntries(
      removeItemFromEntries(entries, selectedDate, 'notes', noteId),
      'Note deleted.'
    );
  };

  const handleAddTask = async ({ projectId, text, description, url }: EntryDraft) => {
    const newTask = createTask(text, projectId);
    const enrichedTask = {
      ...newTask,
      description: description || undefined,
      url: url || undefined
    };
    return persistEntries(
      updateEntriesForDate(entries, selectedDate, (entry) => ({
        ...entry,
        tasks: [...entry.tasks, enrichedTask]
      })),
      'Task added.'
    );
  };

  const handleUpdateTask = async (taskId: string, { projectId, text }: EntryDraft) => {
    return persistEntries(
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
    return persistEntries(
      removeItemFromEntries(entries, selectedDate, 'tasks', taskId),
      'Task deleted.'
    );
  };

  const handleToggleTask = async (taskId: string) => {
    const nextTask = tasks.find((task) => task.id === taskId);

    return persistEntries(
      upsertItemInEntries(entries, selectedDate, 'tasks', taskId, selectedDate, (task: Task) => ({
        ...task,
        done: !task.done,
        updatedAt: new Date().toISOString()
      })),
      nextTask?.done ? 'Task reopened.' : 'Task completed.'
    );
  };

  const handleSavePopup = async ({ projectId, targetDate, text }: PopupDraft) => {
    if (!popupState) {
      return false;
    }

    let saved = false;

    if (popupState.kind === 'note') {
      saved = await persistEntries(
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
      saved = await persistEntries(
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

    if (saved) {
      setPopupState(null);
    }

    return saved;
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
    <aside className="grid content-start gap-3" aria-labelledby="selected-day-panel-title">
      {/* Day header */}
      <header className={sectionClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="selected-day-panel-title" className="text-xl leading-7 font-medium text-[color:var(--color-ink)]">
                {formatLongDateLabel(selectedDate)}
              </h2>
              {isToday && (
                <span className="rounded-full bg-[color:var(--color-ink)] px-2 py-0.5 text-[10px] font-bold text-white">
                  Today
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[color:var(--color-copy-muted)]">
              {notes.length} note{notes.length === 1 ? '' : 's'}, {openTaskCount} open task{openTaskCount === 1 ? '' : 's'}
              {activeProjectName ? ` · ${activeProjectName}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[color:var(--color-line)] p-1.5 text-[color:var(--color-copy-muted)] transition hover:bg-[color:var(--color-paper-muted)] hover:text-[color:var(--color-ink)]"
            onClick={() => setShowCommandBar((v) => !v)}
            title="Command bar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Linked projects pills */}
        {linkedProjects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {linkedProjects.map((project) => (
              <span key={project.id} className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-muted)]/50 px-2.5 py-1 text-[11px] text-[color:var(--color-copy-muted)]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: project.color ?? '#1f4e79' }}
                  aria-hidden="true"
                />
                {project.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Command bar (collapsible) */}
      {showCommandBar && (
        <section className={sectionClass} aria-label="Organizer bar">
          <h3 className="mb-2 text-sm font-medium text-[color:var(--color-ink)]">Quick command</h3>
          <CommandBar
            activeProjectName={activeProjectName}
            isBusy={isRunningCommand}
            onSubmit={handleCommand}
            selectedDate={selectedDate}
          />
        </section>
      )}

      <TasksSection
        defaultProjectId={activeProjectId ?? undefined}
        tasks={tasks}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onOpenPopup={openPopupForTask}
        onToggleTask={handleToggleTask}
        onUpdateTask={handleUpdateTask}
        projects={projects}
        selectedDate={selectedDate}
      />

      <NotesSection
        defaultProjectId={activeProjectId ?? undefined}
        notes={notes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onOpenPopup={openPopupForNote}
        onUpdateNote={handleUpdateNote}
        projects={projects}
        selectedDate={selectedDate}
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
    </aside>
  );
}
