import { useState } from 'react';
import type { Task } from '../../types/models';

interface TasksSectionProps {
  onAddTask: (text: string) => void;
  onOpenPopup: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, text: string) => void;
  tasks: Task[];
}

export default function TasksSection({
  onAddTask,
  onOpenPopup,
  onToggleTask,
  onUpdateTask,
  tasks
}: TasksSectionProps) {
  const [draftText, setDraftText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const resetInlineState = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const handleAddTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = draftText.trim();
    if (!normalized) {
      return;
    }

    onAddTask(normalized);
    setDraftText('');
    setIsAdding(false);
  };

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingTaskId) {
      return;
    }

    const normalized = editingText.trim();
    if (!normalized) {
      return;
    }

    onUpdateTask(editingTaskId, normalized);
    resetInlineState();
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
        <form onSubmit={handleAddTask}>
          <label>
            <span>New task</span>
            <input
              aria-label="New task"
              placeholder="Capture a quick task"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
          </label>
          <div>
            <button type="button" onClick={() => setIsAdding(false)}>
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
            <li key={task.id}>
              {editingTaskId === task.id ? (
                <form onSubmit={handleSaveEdit}>
                  <label>
                    <span>Edit task</span>
                    <input
                      aria-label={`Edit task ${task.text}`}
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                    />
                  </label>
                  <div>
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
                  <label className="selected-day-panel__item-text">
                    <input
                      type="checkbox"
                      aria-label={task.text}
                      checked={task.done}
                      onChange={() => onToggleTask(task.id)}
                    />
                    <span>{task.text}</span>
                  </label>
                  <div>
                    <strong className="selected-day-panel__item-status">
                      {task.done ? 'Done' : 'Open'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setEditingTaskId(task.id);
                        setEditingText(task.text);
                      }}
                    >
                      Inline edit
                    </button>
                    <button type="button" onClick={() => onOpenPopup(task)}>
                      Open editor
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
