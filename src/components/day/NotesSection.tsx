import { useState } from 'react';
import type { Note } from '../../types/models';

interface NotesSectionProps {
  notes: Note[];
  onAddNote: (text: string) => void;
  onOpenPopup: (note: Note) => void;
  onUpdateNote: (noteId: string, text: string) => void;
}

export default function NotesSection({
  notes,
  onAddNote,
  onOpenPopup,
  onUpdateNote
}: NotesSectionProps) {
  const [draftText, setDraftText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const resetInlineState = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const handleAddNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = draftText.trim();
    if (!normalized) {
      return;
    }

    onAddNote(normalized);
    setDraftText('');
    setIsAdding(false);
  };

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingNoteId) {
      return;
    }

    const normalized = editingText.trim();
    if (!normalized) {
      return;
    }

    onUpdateNote(editingNoteId, normalized);
    resetInlineState();
  };

  return (
    <section className="selected-day-panel__section" aria-label="Notes">
      <div className="selected-day-panel__section-header">
        <h3>Notes</h3>
        <span>{notes.length}</span>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsAdding((current) => !current);
          resetInlineState();
        }}
      >
        {isAdding ? 'Close note composer' : 'Add note'}
      </button>

      {isAdding ? (
        <form onSubmit={handleAddNote}>
          <label>
            <span>New note</span>
            <input
              aria-label="New note"
              placeholder="Capture a quick note"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
          </label>
          <div>
            <button type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
            <button type="submit" disabled={draftText.trim().length === 0}>
              Save note
            </button>
          </div>
        </form>
      ) : null}

      {notes.length === 0 ? (
        <p className="selected-day-panel__empty">No notes for this day yet.</p>
      ) : (
        <ul className="selected-day-panel__list">
          {notes.map((note) => (
            <li key={note.id}>
              {editingNoteId === note.id ? (
                <form onSubmit={handleSaveEdit}>
                  <label>
                    <span>Edit note</span>
                    <input
                      aria-label={`Edit note ${note.text}`}
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
                  <button
                    type="button"
                    className="selected-day-panel__item-text"
                    aria-label={`Inline edit note ${note.text}`}
                    onClick={() => {
                      setIsAdding(false);
                      setEditingNoteId(note.id);
                      setEditingText(note.text);
                    }}
                  >
                    {note.text}
                  </button>
                  <div>
                    <button type="button" onClick={() => onOpenPopup(note)}>
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
