import { useEffect, useMemo, useState } from 'react';
import type { Note, Project } from '../../types/models';

interface NoteDraft {
  projectId?: string;
  text: string;
}

interface NotesSectionProps {
  notes: Note[];
  onAddNote: (draft: NoteDraft) => Promise<boolean>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
  onOpenPopup: (note: Note) => void;
  onUpdateNote: (noteId: string, draft: NoteDraft) => Promise<boolean>;
  projects: Project[];
  selectedDate: string;
}

const normalizeProjectId = (projectId: string) => (projectId.length > 0 ? projectId : undefined);

export default function NotesSection({
  notes,
  onAddNote,
  onDeleteNote,
  onOpenPopup,
  onUpdateNote,
  projects,
  selectedDate
}: NotesSectionProps) {
  const [draftText, setDraftText] = useState('');
  const [draftProjectId, setDraftProjectId] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingProjectId, setEditingProjectId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  );

  const resetInlineState = () => {
    setEditingNoteId(null);
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

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedText = draftText.trim();
    if (!normalizedText) {
      return;
    }

    const saved = await onAddNote({
      text: normalizedText,
      projectId: normalizeProjectId(draftProjectId)
    });
    if (saved) {
      resetComposer();
    }
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingNoteId) {
      return;
    }

    const normalizedText = editingText.trim();
    if (!normalizedText) {
      return;
    }

    const saved = await onUpdateNote(editingNoteId, {
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
    if (editingNoteId) {
      resetInlineState();
      return;
    }

    if (isAdding) {
      resetComposer();
    }
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
        <form className="selected-day-panel__inline-form" onKeyDown={handleEscape} onSubmit={handleAddNote}>
          <label className="selected-day-panel__field">
            <span>New note</span>
            <input
              aria-label="New note"
              placeholder="Capture a quick note"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
          </label>
          <label className="selected-day-panel__field">
            <span>Project tag</span>
            <select
              aria-label="New note project tag"
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
            <li key={note.id} className="selected-day-panel__list-item">
              {editingNoteId === note.id ? (
                <form
                  className="selected-day-panel__inline-form"
                  onKeyDown={handleEscape}
                  onSubmit={handleSaveEdit}
                >
                  <label className="selected-day-panel__field">
                    <span>Edit note</span>
                    <input
                      aria-label={`Edit note ${note.text}`}
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                    />
                  </label>
                  <label className="selected-day-panel__field">
                    <span>Project tag</span>
                    <select
                      aria-label={`Edit project tag for ${note.text}`}
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
                    <button
                      type="button"
                      className="selected-day-panel__item-text selected-day-panel__item-text-button"
                      aria-label={`Inline edit note ${note.text}`}
                      onClick={() => {
                        setIsAdding(false);
                        setEditingNoteId(note.id);
                        setEditingText(note.text);
                        setEditingProjectId(note.projectId ?? '');
                      }}
                    >
                      {note.text}
                    </button>
                    <span className="selected-day-panel__project-pill">
                      {projectById.get(note.projectId ?? '') ?? 'No project'}
                    </span>
                  </div>
                  <div className="selected-day-panel__actions selected-day-panel__actions--row">
                    <button type="button" onClick={() => onOpenPopup(note)}>
                      Open editor
                    </button>
                    <button type="button" onClick={() => void onDeleteNote(note.id)}>
                      Delete note
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
