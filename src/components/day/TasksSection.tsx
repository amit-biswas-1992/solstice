import { useEffect, useMemo, useState } from 'react';
import type { Project, Task } from '../../types/models';

interface TaskDraft {
  description?: string;
  projectId?: string;
  text: string;
  url?: string;
}

interface TasksSectionProps {
  defaultProjectId?: string;
  onAddTask: (draft: TaskDraft) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  onOpenPopup: (task: Task) => void;
  onToggleTask: (taskId: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, draft: TaskDraft) => Promise<boolean>;
  projects: Project[];
  selectedDate: string;
  tasks: Task[];
}

const normalizeProjectId = (projectId: string) => (projectId.length > 0 ? projectId : undefined);

const fieldClass =
  'h-10 rounded-[10px] border border-[color:var(--color-line)] bg-white px-3 text-sm text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-line-strong)] focus:ring-2 focus:ring-[color:var(--color-line-strong)]';
const sectionClass = 'rounded-[24px] border border-[color:var(--color-line)] bg-white px-5 py-5';

export default function TasksSection({
  defaultProjectId,
  onAddTask,
  onDeleteTask,
  onOpenPopup,
  onToggleTask,
  onUpdateTask,
  projects,
  selectedDate,
  tasks
}: TasksSectionProps) {
  const [draftText, setDraftText] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftUrl, setDraftUrl] = useState('');
  const [draftProjectId, setDraftProjectId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingProjectId, setEditingProjectId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  );

  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  const resetInlineState = () => {
    setEditingTaskId(null);
    setEditingText('');
    setEditingProjectId('');
  };

  const resetComposer = () => {
    setDraftText('');
    setDraftDescription('');
    setDraftUrl('');
    setDraftProjectId(defaultProjectId ?? '');
    setIsAdding(false);
    setShowAdvanced(false);
  };

  useEffect(() => {
    resetInlineState();
    resetComposer();
  }, [defaultProjectId, selectedDate]);

  const handleAddTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedText = draftText.trim();
    if (!normalizedText) {
      return;
    }

    const saved = await onAddTask({
      text: normalizedText,
      description: draftDescription.trim() || undefined,
      url: draftUrl.trim() || undefined,
      projectId: normalizeProjectId(draftProjectId)
    });
    if (saved) {
      resetComposer();
    }
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingTaskId) {
      return;
    }

    const normalizedText = editingText.trim();
    if (!normalizedText) {
      return;
    }

    const saved = await onUpdateTask(editingTaskId, {
      text: normalizedText,
      projectId: normalizeProjectId(editingProjectId)
    });
    if (saved) {
      resetInlineState();
    }
  };

  const handleEscape = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    if (editingTaskId) {
      resetInlineState();
      return;
    }

    if (isAdding) {
      resetComposer();
    }
  };

  const renderTaskItem = (task: Task) => {
    if (editingTaskId === task.id) {
      return (
        <form className="grid gap-2" onKeyDown={handleEscape} onSubmit={handleSaveEdit}>
          <input
            aria-label={`Edit task ${task.text}`}
            className={fieldClass}
            value={editingText}
            onChange={(event) => setEditingText(event.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <select
              aria-label={`Edit project tag for ${task.text}`}
              className={`${fieldClass} flex-1`}
              value={editingProjectId}
              onChange={(event) => setEditingProjectId(event.target.value)}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button type="button" className="h-10 rounded-[10px] border border-[color:var(--color-line)] px-3 text-sm text-[color:var(--color-copy-muted)] transition hover:bg-[color:var(--color-paper-muted)]" onClick={resetInlineState}>
              Cancel
            </button>
            <button type="submit" className="h-10 rounded-[10px] bg-[color:var(--color-ink)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60" disabled={editingText.trim().length === 0}>
              Save
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className="group flex items-start gap-3">
        <button
          type="button"
          aria-label={task.done ? `Mark "${task.text}" as open` : `Mark "${task.text}" as done`}
          className={[
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition',
            task.done
              ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white'
              : 'border-[color:var(--color-line)] hover:border-[color:var(--color-ink)]'
          ].join(' ')}
          onClick={() => void onToggleTask(task.id)}
        >
          {task.done && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M2.5 6l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              className={[
                'text-left text-sm leading-5 transition',
                task.done ? 'text-[color:var(--color-copy-muted)] line-through' : 'text-[color:var(--color-ink)]'
              ].join(' ')}
              onClick={() => {
                setIsAdding(false);
                setEditingTaskId(task.id);
                setEditingText(task.text);
                setEditingProjectId(task.projectId ?? '');
              }}
            >
              {task.text}
            </button>
            <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
              <button type="button" className="rounded-md p-1 text-[color:var(--color-copy-muted)] transition hover:bg-[color:var(--color-paper-muted)] hover:text-[color:var(--color-ink)]" onClick={() => onOpenPopup(task)} title="Edit">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                </svg>
              </button>
              <button type="button" className="rounded-md p-1 text-[color:var(--color-copy-muted)] transition hover:bg-red-50 hover:text-[color:var(--color-error)]" onClick={() => void onDeleteTask(task.id)} title="Delete">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="mt-1 text-xs leading-4 text-[color:var(--color-copy-muted)]">
              {task.description}
            </p>
          )}

          {/* URL */}
          {task.url && (
            <a
              href={task.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-[color:var(--color-line-strong)] underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
              </svg>
              <span className="max-w-[200px] truncate">{task.url.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {/* Meta badges */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {task.projectId && (
              <span className="inline-flex items-center rounded-full bg-[color:var(--color-paper-muted)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-copy-muted)]">
                {projectById.get(task.projectId) ?? 'Unknown'}
              </span>
            )}
            {task.priority && (
              <span className={[
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                task.priority === 'high' ? 'bg-red-50 text-[color:var(--color-error)]' :
                task.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                'bg-gray-50 text-[color:var(--color-copy-muted)]'
              ].join(' ')}>
                {task.priority}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={sectionClass} aria-label="Tasks">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg leading-6 font-medium text-[color:var(--color-ink)]">Tasks</h3>
        <div className="flex items-center gap-2">
          {openTasks.length > 0 && (
            <span className="rounded-full bg-[color:var(--color-ink)] px-2 py-0.5 text-[10px] font-bold text-white">
              {openTasks.length}
            </span>
          )}
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[color:var(--color-line)] px-3 text-xs font-medium text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-paper-muted)]"
            onClick={() => {
              setIsAdding((current) => !current);
              resetInlineState();
              setDraftProjectId(defaultProjectId ?? '');
            }}
          >
            {isAdding ? (
              'Cancel'
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
                </svg>
                Add task
              </>
            )}
          </button>
        </div>
      </div>

      {isAdding && (
        <form className="mt-3 grid gap-2" onKeyDown={handleEscape} onSubmit={handleAddTask}>
          <input
            aria-label="New task"
            autoFocus
            className={fieldClass}
            placeholder="What needs to be done?"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
          />
          {showAdvanced && (
            <>
              <input
                aria-label="Task description"
                className={fieldClass}
                placeholder="Add a description (optional)"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
              />
              <input
                aria-label="Task link"
                className={fieldClass}
                placeholder="Add a link (optional)"
                type="url"
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
              />
            </>
          )}
          <div className="flex items-center gap-2">
            <select
              aria-label="New task project tag"
              className={`${fieldClass} flex-1`}
              value={draftProjectId}
              onChange={(event) => setDraftProjectId(event.target.value)}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="h-10 rounded-[10px] border border-[color:var(--color-line)] px-3 text-xs text-[color:var(--color-copy-muted)] transition hover:bg-[color:var(--color-paper-muted)]"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? 'Less' : 'More'}
            </button>
            <button type="submit" className="h-10 rounded-[10px] bg-[color:var(--color-ink)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60" disabled={draftText.trim().length === 0}>
              Add
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <p className="mt-3 text-sm leading-5 text-[color:var(--color-copy-muted)]">
          No tasks for this day yet.
        </p>
      ) : (
        <div className="mt-3 grid gap-1">
          {openTasks.map((task) => (
            <div key={task.id} className="rounded-[12px] p-2.5 transition hover:bg-[color:var(--color-paper-muted)]/40">
              {renderTaskItem(task)}
            </div>
          ))}
          {doneTasks.length > 0 && openTasks.length > 0 && (
            <div className="my-1 border-t border-[color:var(--color-line)]/50" />
          )}
          {doneTasks.map((task) => (
            <div key={task.id} className="rounded-[12px] p-2.5 opacity-60 transition hover:bg-[color:var(--color-paper-muted)]/40 hover:opacity-100">
              {renderTaskItem(task)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
