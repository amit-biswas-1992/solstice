import { useEffect, useMemo, useState } from 'react';
import type { Project, Task } from '../../types/models';

interface TaskDraft {
  projectId?: string;
  text: string;
}

interface TasksSectionProps {
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

export default function TasksSection({
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
  const [draftProjectId, setDraftProjectId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingProjectId, setEditingProjectId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  );

  const resetInlineState = () => {
    setEditingTaskId(null);
    setEditingText('');
    setEditingProjectId('');
  };

  const resetComposer = () => {
    setDraftText('');
    setDraftProjectId('');
    setIsAdding(false);
  };

  useEffect(() => {
    resetInlineState();
    resetComposer();
  }, [selectedDate]);

  const handleAddTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedText = draftText.trim();
    if (!normalizedText) {
      return;
    }

    const saved = await onAddTask({
      text: normalizedText,
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

  return (
    <section className="selected-day-panel__section" aria-label="Tasks">
      <div className="selected-day-panel__section-header">
        <h3>Tasks</h3>
        <span>{tasks.length}</span>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsAdding((current) => !current);
          resetInlineState();
        }}
      >
        {isAdding ? 'Close task composer' : 'Add task'}
      </button>

      {isAdding ? (
        <form className="selected-day-panel__inline-form" onKeyDown={handleEscape} onSubmit={handleAddTask}>
          <label className="selected-day-panel__field">
            <span>New task</span>
            <input
              aria-label="New task"
              placeholder="Capture a quick task"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
          </label>
          <label className="selected-day-panel__field">
            <span>Project tag</span>
            <select
              aria-label="New task project tag"
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
          </label>
          <div className="selected-day-panel__actions">
            <button type="button" onClick={resetComposer}>
              Cancel
            </button>
            <button type="submit" disabled={draftText.trim().length === 0}>
              Save task
            </button>
          </div>
        </form>
      ) : null}

      {tasks.length === 0 ? (
        <p className="selected-day-panel__empty">No tasks linked to this day.</p>
      ) : (
        <ul className="selected-day-panel__list">
          {tasks.map((task) => (
            <li key={task.id} className="selected-day-panel__list-item">
              {editingTaskId === task.id ? (
                <form
                  className="selected-day-panel__inline-form"
                  onKeyDown={handleEscape}
                  onSubmit={handleSaveEdit}
                >
                  <label className="selected-day-panel__field">
                    <span>Edit task</span>
                    <input
                      aria-label={`Edit task ${task.text}`}
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                    />
                  </label>
                  <label className="selected-day-panel__field">
                    <span>Project tag</span>
                    <select
                      aria-label={`Edit project tag for ${task.text}`}
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
                  </label>
                  <div className="selected-day-panel__actions">
                    <button type="button" onClick={resetInlineState}>
                      Cancel
                    </button>
                    <button type="submit" disabled={editingText.trim().length === 0}>
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="selected-day-panel__item-main">
                    <label className="selected-day-panel__checkbox-row">
                      <input
                        type="checkbox"
                        aria-label={task.text}
                        checked={task.done}
                        onChange={() => void onToggleTask(task.id)}
                      />
                      <button
                        type="button"
                        className="selected-day-panel__item-text selected-day-panel__item-text-button"
                        aria-label={`Inline edit task ${task.text}`}
                        onClick={() => {
                          setIsAdding(false);
                          setEditingTaskId(task.id);
                          setEditingText(task.text);
                          setEditingProjectId(task.projectId ?? '');
                        }}
                      >
                        {task.text}
                      </button>
                    </label>
                    <div className="selected-day-panel__item-meta">
                      <strong className="selected-day-panel__item-status">
                        {task.done ? 'Done' : 'Open'}
                      </strong>
                      <span className="selected-day-panel__project-pill">
                        {projectById.get(task.projectId ?? '') ?? 'No project'}
                      </span>
                    </div>
                  </div>
                  <div className="selected-day-panel__actions selected-day-panel__actions--row">
                    <button type="button" onClick={() => onOpenPopup(task)}>
                      Open editor
                    </button>
                    <button type="button" onClick={() => void onDeleteTask(task.id)}>
                      Delete task
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
