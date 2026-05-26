import { useEffect, useMemo, useState } from 'react';
import type { Note, Project } from '../../types/models';

interface NoteDraft {
  projectId?: string;
  text: string;
}

interface NotesSectionProps {
  defaultProjectId?: string;
  notes: Note[];
  onAddNote: (draft: NoteDraft) => Promise<boolean>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
  onOpenPopup: (note: Note) => void;
  onUpdateNote: (noteId: string, draft: NoteDraft) => Promise<boolean>;
  projects: Project[];
  selectedDate: string;
}

const normalizeProjectId = (projectId: string) => (projectId.length > 0 ? projectId : undefined);

const fieldClass =
  'h-10 rounded-[10px] border border-[color:var(--color-line)] bg-white px-3 text-sm text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-line-strong)] focus:ring-2 focus:ring-[color:var(--color-line-strong)]';
const sectionClass = 'rounded-[24px] border border-[color:var(--color-line)] bg-white px-5 py-5';

export default function NotesSection({
  defaultProjectId,
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
    setDraftProjectId(defaultProjectId ?? '');
    setIsAdding(false);
  };

  useEffect(() => {
    resetInlineState();
    resetComposer();
  }, [defaultProjectId, selectedDate]);

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

  const renderLinkifiedText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[color:var(--color-line-strong)] underline-offset-2 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part.replace(/^https?:\/\//, '').slice(0, 40)}
          {part.replace(/^https?:\/\//, '').length > 40 ? '...' : ''}
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <section className={sectionClass} aria-label="Notes">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg leading-6 font-medium text-[color:var(--color-ink)]">Notes</h3>
        <div className="flex items-center gap-2">
          {notes.length > 0 && (
            <span className="rounded-full bg-[color:var(--color-paper-muted)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-copy-muted)]">
              {notes.length}
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
                Add note
              </>
            )}
          </button>
        </div>
      </div>

      {isAdding && (
        <form className="mt-3 grid gap-2" onKeyDown={handleEscape} onSubmit={handleAddNote}>
          <textarea
            aria-label="New note"
            autoFocus
            className="min-h-[72px] rounded-[10px] border border-[color:var(--color-line)] bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-line-strong)] focus:ring-2 focus:ring-[color:var(--color-line-strong)]"
            placeholder="Write a note..."
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
          />
          <div className="flex items-center gap-2">
            <select
              aria-label="New note project tag"
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
            <button type="submit" className="h-10 rounded-[10px] bg-[color:var(--color-ink)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60" disabled={draftText.trim().length === 0}>
              Add
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="mt-3 text-sm leading-5 text-[color:var(--color-copy-muted)]">
          No notes for this day yet.
        </p>
      ) : (
        <ul className="mt-3 grid gap-1">
          {notes.map((note) => (
            <li key={note.id} className="group rounded-[12px] p-2.5 transition hover:bg-[color:var(--color-paper-muted)]/40">
              {editingNoteId === note.id ? (
                <form className="grid gap-2" onKeyDown={handleEscape} onSubmit={handleSaveEdit}>
                  <textarea
                    aria-label={`Edit note ${note.text}`}
                    autoFocus
                    className="min-h-[60px] rounded-[10px] border border-[color:var(--color-line)] bg-white px-3 py-2 text-sm text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-line-strong)] focus:ring-2 focus:ring-[color:var(--color-line-strong)]"
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <select
                      aria-label={`Edit project tag for ${note.text}`}
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
              ) : (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-copy-muted)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="text-left text-sm leading-5 text-[color:var(--color-ink)]"
                      onClick={() => {
                        setIsAdding(false);
                        setEditingNoteId(note.id);
                        setEditingText(note.text);
                        setEditingProjectId(note.projectId ?? '');
                      }}
                    >
                      {renderLinkifiedText(note.text)}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {note.projectId && (
                        <span className="inline-flex items-center rounded-full bg-[color:var(--color-paper-muted)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-copy-muted)]">
                          {projectById.get(note.projectId) ?? 'Unknown'}
                        </span>
                      )}
                      {note.tags && note.tags.length > 0 && note.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full bg-[color:var(--color-paper-muted)] px-2 py-0.5 text-[10px] text-[color:var(--color-copy-muted)]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button type="button" className="rounded-md p-1 text-[color:var(--color-copy-muted)] transition hover:bg-[color:var(--color-paper-muted)] hover:text-[color:var(--color-ink)]" onClick={() => onOpenPopup(note)} title="Edit">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button type="button" className="rounded-md p-1 text-[color:var(--color-copy-muted)] transition hover:bg-red-50 hover:text-[color:var(--color-error)]" onClick={() => void onDeleteNote(note.id)} title="Delete">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
