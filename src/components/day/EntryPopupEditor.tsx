import { useEffect, useState } from 'react';
import type { Project } from '../../types/models';

interface EntryPopupEditorProps {
  entryLabel: string;
  initialDate: string;
  initialProjectId?: string;
  initialText: string;
  isOpen: boolean;
  kind: 'note' | 'task';
  onClose: () => void;
  onSave: (payload: { projectId?: string; targetDate: string; text: string }) => Promise<void>;
  projects: Project[];
}

const normalizeProjectId = (projectId: string) => (projectId.length > 0 ? projectId : undefined);

export default function EntryPopupEditor({
  entryLabel,
  initialDate,
  initialProjectId,
  initialText,
  isOpen,
  kind,
  onClose,
  onSave,
  projects
}: EntryPopupEditorProps) {
  const [draftText, setDraftText] = useState(initialText);
  const [draftProjectId, setDraftProjectId] = useState(initialProjectId ?? '');
  const [draftDate, setDraftDate] = useState(initialDate);

  useEffect(() => {
    if (isOpen) {
      setDraftText(initialText);
      setDraftProjectId(initialProjectId ?? '');
      setDraftDate(initialDate);
    }
  }, [initialDate, initialProjectId, initialText, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedText = draftText.trim();
    const normalizedDate = draftDate.trim();
    if (!normalizedText || !normalizedDate) {
      return;
    }

    await onSave({
      text: normalizedText,
      projectId: normalizeProjectId(draftProjectId),
      targetDate: normalizedDate
    });
  };

  const handleEscape = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    onClose();
  };

  return (
    <section
      className="selected-day-panel__section selected-day-panel__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-popup-editor-title"
      onKeyDown={handleEscape}
    >
      <div className="selected-day-panel__section-header">
        <h3 id="entry-popup-editor-title">{kind === 'note' ? 'Note editor' : 'Task editor'}</h3>
        <span>{entryLabel}</span>
      </div>
      <p className="selected-day-panel__summary">
        Update the text, retag the item, or move it to another day without leaving the selected-day
        panel.
      </p>
      <form className="selected-day-panel__editor-form" onSubmit={handleSubmit}>
        <label className="selected-day-panel__field">
          <span>{kind === 'note' ? 'Note details' : 'Task details'}</span>
          <textarea
            aria-label={kind === 'note' ? 'Note details' : 'Task details'}
            rows={5}
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
          />
        </label>

        <div className="selected-day-panel__field-grid">
          <label className="selected-day-panel__field">
            <span>Project tag</span>
            <select
              aria-label="Project tag"
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

          <label className="selected-day-panel__field">
            <span>Move to date</span>
            <input
              aria-label="Move to date"
              type="date"
              value={draftDate}
              onChange={(event) => setDraftDate(event.target.value)}
            />
          </label>
        </div>

        <div className="selected-day-panel__actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={draftText.trim().length === 0 || draftDate.trim().length === 0}>
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
}
