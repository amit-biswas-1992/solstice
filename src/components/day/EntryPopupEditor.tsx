import { useEffect, useState } from 'react';

interface EntryPopupEditorProps {
  entryLabel: string;
  initialText: string;
  isOpen: boolean;
  kind: 'note' | 'task';
  onClose: () => void;
  onSave: (text: string) => void;
}

export default function EntryPopupEditor({
  entryLabel,
  initialText,
  isOpen,
  kind,
  onClose,
  onSave
}: EntryPopupEditorProps) {
  const [draftText, setDraftText] = useState(initialText);

  useEffect(() => {
    if (isOpen) {
      setDraftText(initialText);
    }
  }, [initialText, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = draftText.trim();
    if (!normalized) {
      return;
    }

    onSave(normalized);
  };

  return (
    <section
      className="selected-day-panel__section"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-popup-editor-title"
    >
      <div className="selected-day-panel__section-header">
        <h3 id="entry-popup-editor-title">{kind === 'note' ? 'Note editor' : 'Task editor'}</h3>
        <span>{entryLabel}</span>
      </div>
      <p className="selected-day-panel__summary">
        Use the expanded editor for multi-line details and quick text cleanup.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          <span>{kind === 'note' ? 'Note details' : 'Task details'}</span>
          <textarea
            aria-label={kind === 'note' ? 'Note details' : 'Task details'}
            rows={5}
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
          />
        </label>
        <div>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={draftText.trim().length === 0}>
            Save details
          </button>
        </div>
      </form>
    </section>
  );
}
