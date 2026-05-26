import { useEffect, useMemo, useRef, useState } from 'react';
import { formatLongDateLabel } from '../../lib/date';
import type { EntriesByDate, Project } from '../../types/models';

interface SearchPanelProps {
  entries: EntriesByDate;
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (dateKey: string) => void;
  projects: Project[];
}

interface SearchResult {
  dateKey: string;
  id: string;
  matchText: string;
  projectName?: string;
  type: 'note' | 'task';
}

export default function SearchPanel({ entries, isOpen, onClose, onSelectDate, projects }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchResult[] = [];
    const sortedDates = Object.keys(entries).sort().reverse();

    for (const dateKey of sortedDates) {
      const entry = entries[dateKey];
      for (const note of entry.notes) {
        if (note.text.toLowerCase().includes(q)) {
          matches.push({
            id: note.id,
            dateKey,
            type: 'note',
            matchText: note.text,
            projectName: note.projectId ? projectMap.get(note.projectId) : undefined
          });
        }
      }
      for (const task of entry.tasks) {
        const taskText = [task.text, 'description' in task ? task.description : ''].join(' ');
        if (taskText.toLowerCase().includes(q)) {
          matches.push({
            id: task.id,
            dateKey,
            type: 'task',
            matchText: task.text,
            projectName: task.projectId ? projectMap.get(task.projectId) : undefined
          });
        }
      }
      if (matches.length >= 50) break;
    }

    return matches;
  }, [entries, projectMap, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectDate(results[selectedIndex].dateKey);
      onClose();
    }
  };

  if (!isOpen) return null;

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.dateKey]) acc[r.dateKey] = [];
    acc[r.dateKey].push(r);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[12vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-[600px] overflow-hidden rounded-[20px] border border-[color:var(--color-line)] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-3 border-b border-[color:var(--color-line)] px-5 py-4">
          <svg className="h-5 w-5 shrink-0 text-[color:var(--color-copy-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-base text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-copy-muted)]"
            placeholder="Search notes and tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-paper-muted)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-copy-muted)]">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-[color:var(--color-copy-muted)]">
              No results found for "{query}"
            </div>
          )}

          {Object.entries(grouped).map(([dateKey, items]) => (
            <div key={dateKey}>
              <div className="sticky top-0 bg-[color:var(--color-paper-muted)]/80 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-copy-muted)] backdrop-blur-sm">
                {formatLongDateLabel(dateKey)}
              </div>
              {items.map((item) => {
                flatIndex++;
                const isSelected = flatIndex === selectedIndex;
                const currentIdx = flatIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={[
                      'flex w-full items-center gap-3 px-5 py-2.5 text-left transition',
                      isSelected ? 'bg-[color:var(--color-paper-muted)]' : 'hover:bg-[color:var(--color-paper-muted)]/50'
                    ].join(' ')}
                    onClick={() => {
                      onSelectDate(item.dateKey);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(currentIdx)}
                  >
                    <span className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase',
                      item.type === 'task'
                        ? 'bg-[color:var(--color-ink)] text-white'
                        : 'border border-[color:var(--color-line)] text-[color:var(--color-copy-muted)]'
                    ].join(' ')}>
                      {item.type === 'task' ? 'T' : 'N'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--color-ink)]">
                      {item.matchText}
                    </span>
                    {item.projectName && (
                      <span className="shrink-0 rounded-full bg-[color:var(--color-paper-muted)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-copy-muted)]">
                        {item.projectName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {!query.trim() && (
            <div className="px-5 py-8 text-center text-sm text-[color:var(--color-copy-muted)]">
              Type to search across all your daily notes and tasks
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[color:var(--color-line)] px-5 py-2.5 text-[11px] text-[color:var(--color-copy-muted)]">
          <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
          <span className="flex gap-3">
            <span><kbd className="rounded border border-[color:var(--color-line)] px-1">↑↓</kbd> navigate</span>
            <span><kbd className="rounded border border-[color:var(--color-line)] px-1">↵</kbd> open</span>
          </span>
        </div>
      </div>
    </div>
  );
}
