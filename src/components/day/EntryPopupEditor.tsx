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
  onSave: (payload: { projectId?: string; targetDate: string; text: string }) => Promise<boolean>;
  projects: Project[];
}

const normalizeProjectId = (projectId: string) => (projectId.length > 0 ? projectId : undefined);
const fieldClass =
  'rounded-[10px] border border-[color:var(--color-line)] bg-white px-3 py-2.5 text-base text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-line-strong)] focus:ring-2 focus:ring-[color:var(--color-line-strong)]';

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
      className="rounded-[24px] border border-[color:var(--color-line)] bg-white px-5 py-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-popup-editor-title"
      onKeyDown={handleEscape}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id="entry-popup-editor-title" className="text-[22px] leading-[26px] font-[330] text-[color:var(--color-ink)]">
          {kind === 'note' ? 'Note editor' : 'Task editor'}
        </h3>
        <span className="text-[12px] uppercase tracking-[0.08em] text-[color:var(--color-copy-muted)]">
          {entryLabel}
        </span>
      </div>
      <p className="mt-2 text-sm leading-5 text-[color:var(--color-copy-muted)]">
        Update the text, retag the item, or move it to another day without leaving the selected-day
        panel.
      </p>
      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[color:var(--color-ink)]">
            {kind === 'note' ? 'Note details' : 'Task details'}
          </span>
          <textarea
            aria-label={kind === 'note' ? 'Note details' : 'Task details'}
            className={fieldClass}
            rows={5}
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--color-ink)]">Project tag</span>
            <select
              aria-label="Project tag"
              className={`${fieldClass} h-11 py-0`}
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

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[color:var(--color-ink)]">Move to date</span>
            <input
              aria-label="Move to date"
              type="date"
              className={`${fieldClass} h-11 py-0`}
              value={draftDate}
              onChange={(event) => setDraftDate(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[color:var(--color-line)] bg-white px-4 text-sm font-medium text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-paper-muted)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[color:var(--color-ink)] px-5 text-base font-medium text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={draftText.trim().length === 0 || draftDate.trim().length === 0}
          >
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
}
