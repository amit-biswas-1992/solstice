import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseCommand } from '../../lib/commandParser';
import { createDateKey, createMonthKey, isDateInMonth, moveDateKeyToMonth, shiftMonthKey } from '../../lib/date';
import MonthGrid from '../calendar/MonthGrid';
import DayDetailPanel from '../day/DayDetailPanel';
import { createEmptyDayEntry, createNote, createTask, upsertItemInEntries } from '../day/dayDetailUtils';
import GraphView from '../graph/GraphView';
import ActivityHeatmap from '../heatmap/ActivityHeatmap';
import ProjectSidebar from '../projects/ProjectSidebar';
import SearchPanel from '../search/SearchPanel';
import type { UnlockedStoreSnapshot } from '../../types/desktopBridge';
import type { EntriesByDate, Note, Project, Task } from '../../types/models';

interface WorkspaceShellProps {
  appVersion: string;
  onPersistStore?: (store: UnlockedStoreSnapshot) => Promise<UnlockedStoreSnapshot>;
  store: UnlockedStoreSnapshot;
}

interface PersistEntriesResult {
  error?: string;
  ok: boolean;
}

type ViewMode = 'calendar' | 'graph' | 'heatmap';

const todayKey = () => createDateKey(new Date());
const todayMonthKey = () => createMonthKey(new Date());

export default function WorkspaceShell({ appVersion, onPersistStore, store }: WorkspaceShellProps) {
  const storeSelection = useMemo(
    () => ({
      visibleMonth: store.settings.lastOpenedMonth,
      selectedDate: isDateInMonth(store.settings.lastSelectedDate, store.settings.lastOpenedMonth)
        ? store.settings.lastSelectedDate
        : moveDateKeyToMonth(store.settings.lastSelectedDate, store.settings.lastOpenedMonth)
    }),
    [store.settings.lastOpenedMonth, store.settings.lastSelectedDate]
  );
  const [visibleMonth, setVisibleMonth] = useState(storeSelection.visibleMonth);
  const [selectedDate, setSelectedDate] = useState(storeSelection.selectedDate);
  const [workspaceStore, setWorkspaceStore] = useState(store);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isProjectSidebarCollapsed, setIsProjectSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setVisibleMonth(storeSelection.visibleMonth);
    setSelectedDate(storeSelection.selectedDate);
  }, [storeSelection.selectedDate, storeSelection.visibleMonth]);

  useEffect(() => {
    setWorkspaceStore(store);
  }, [store]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement ||
                      e.target instanceof HTMLTextAreaElement ||
                      e.target instanceof HTMLSelectElement;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((o) => !o);
        return;
      }

      if (isInput) return;

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleGoToToday();
        return;
      }

      if (e.key === '1') { e.preventDefault(); setViewMode('calendar'); return; }
      if (e.key === '2') { e.preventDefault(); setViewMode('graph'); return; }
      if (e.key === '3') { e.preventDefault(); setViewMode('heatmap'); return; }

      if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleNavigateMonth(-1);
        return;
      }
      if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleNavigateMonth(1);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visibleMonth, selectedDate]);

  const entries = workspaceStore.entries;
  const projects = workspaceStore.projects;
  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects]
  );

  const isToday = selectedDate === todayKey();

  const totalNotes = useMemo(() => Object.values(entries).reduce((sum, e) => sum + e.notes.length, 0), [entries]);
  const totalTasks = useMemo(() => Object.values(entries).reduce((sum, e) => sum + e.tasks.length, 0), [entries]);
  const activeDays = useMemo(() => Object.values(entries).filter((e) => e.notes.length + e.tasks.length > 0).length, [entries]);

  const createProjectId = (name: string) =>
    `project-${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  const ensureProjectByName = (
    currentProjects: Project[],
    name: string
  ): { nextProjects: Project[]; projectId: string } => {
    const existing = currentProjects.find((project) => project.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return {
        nextProjects: currentProjects,
        projectId: existing.id
      };
    }

    const timestamp = new Date().toISOString();
    const nextProject: Project = {
      id: createProjectId(name),
      name,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    return {
      nextProjects: [...currentProjects, nextProject],
      projectId: nextProject.id
    };
  };

  const persistWorkspace = async (
    nextStore: UnlockedStoreSnapshot,
    options?: {
      selectedDate?: string;
      visibleMonth?: string;
    }
  ) => {
    const previousStore = workspaceStore;
    setWorkspaceStore(nextStore);

    if (!onPersistStore) {
      return {
        ok: true as const,
        store: nextStore
      };
    }

    try {
      const savedStore = await onPersistStore({
        settings: {
          lastOpenedMonth: options?.visibleMonth ?? visibleMonth,
          lastSelectedDate: options?.selectedDate ?? selectedDate
        },
        projects: nextStore.projects,
        entries: nextStore.entries
      });
      setWorkspaceStore(savedStore);
      return {
        ok: true as const,
        store: savedStore
      };
    } catch (error) {
      setWorkspaceStore(previousStore);
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Unable to save the workspace.'
      };
    }
  };

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDate(dateKey);
    if (!isDateInMonth(dateKey, visibleMonth)) {
      setVisibleMonth(dateKey.slice(0, 7));
    }
    setViewMode('calendar');
  }, [visibleMonth]);

  const handleNavigateMonth = (offset: number) => {
    setVisibleMonth((currentMonth) => {
      const nextMonth = shiftMonthKey(currentMonth, offset);
      setSelectedDate((currentDate) => moveDateKeyToMonth(currentDate, nextMonth));
      return nextMonth;
    });
  };

  const handleGoToToday = () => {
    const today = todayKey();
    setSelectedDate(today);
    setVisibleMonth(todayMonthKey());
  };

  const handleCreateProject = async (name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return false;
    }

    const ensured = ensureProjectByName(projects, normalizedName);
    const result = await persistWorkspace(
      {
        ...workspaceStore,
        projects: ensured.nextProjects
      },
      {
        selectedDate,
        visibleMonth
      }
    );

    if (result.ok) {
      setActiveProjectId(ensured.projectId);
    }

    return result.ok;
  };

  const persistEntries = async (
    nextEntries: typeof entries,
    options?: {
      selectedDate?: string;
      visibleMonth?: string;
    }
  ): Promise<PersistEntriesResult> => {
    const result = await persistWorkspace(
      {
        ...workspaceStore,
        entries: nextEntries
      },
      options
    );

    return result.ok ? { ok: true } : { ok: false, error: result.error };
  };

  const findEntryByText = (bucket: 'notes' | 'tasks', text: string) => {
    const exactText = text.trim().toLowerCase();
    const selectedItems = (entries[selectedDate]?.[bucket] ?? []).find(
      (item) => item.text.trim().toLowerCase() === exactText
    );
    if (selectedItems) {
      return {
        dateKey: selectedDate,
        item: selectedItems
      };
    }

    for (const [dateKey, entry] of Object.entries(entries)) {
      const item = entry[bucket].find((candidate) => candidate.text.trim().toLowerCase() === exactText);
      if (item) {
        return { dateKey, item };
      }
    }

    return null;
  };

  const handleCommand = async (input: string) => {
    const parsed = parseCommand(input);
    let nextProjects = projects;
    let nextEntries: EntriesByDate = entries;
    let nextSelectedDate = selectedDate;

    const resolveProjectId = (projectName?: string) => {
      if (!projectName) {
        return activeProjectId ?? undefined;
      }

      const ensured = ensureProjectByName(nextProjects, projectName);
      nextProjects = ensured.nextProjects;
      return ensured.projectId;
    };

    switch (parsed.type) {
      case 'add-note': {
        const targetDate = parsed.date ?? selectedDate;
        nextSelectedDate = targetDate;
        nextEntries = {
          ...nextEntries,
          [targetDate]: {
            ...(nextEntries[targetDate] ?? createEmptyDayEntry()),
            notes: [
              ...(nextEntries[targetDate]?.notes ?? []),
              createNote(parsed.text, resolveProjectId(parsed.projectName))
            ],
            tasks: nextEntries[targetDate]?.tasks ?? []
          }
        };
        break;
      }
      case 'add-task': {
        const targetDate = parsed.date ?? selectedDate;
        nextSelectedDate = targetDate;
        nextEntries = {
          ...nextEntries,
          [targetDate]: {
            ...(nextEntries[targetDate] ?? createEmptyDayEntry()),
            notes: nextEntries[targetDate]?.notes ?? [],
            tasks: [
              ...(nextEntries[targetDate]?.tasks ?? []),
              createTask(parsed.text, resolveProjectId(parsed.projectName))
            ]
          }
        };
        break;
      }
      case 'move-note': {
        const located = findEntryByText('notes', parsed.text);
        if (!located) {
          throw new Error(`Could not find note "${parsed.text}".`);
        }
        nextSelectedDate = parsed.date;
        nextEntries = upsertItemInEntries(
          nextEntries,
          located.dateKey,
          'notes',
          located.item.id,
          parsed.date,
          (note: Note) => ({
            ...note,
            updatedAt: new Date().toISOString()
          })
        );
        break;
      }
      case 'move-task': {
        const located = findEntryByText('tasks', parsed.text);
        if (!located) {
          throw new Error(`Could not find task "${parsed.text}".`);
        }
        nextSelectedDate = parsed.date;
        nextEntries = upsertItemInEntries(
          nextEntries,
          located.dateKey,
          'tasks',
          located.item.id,
          parsed.date,
          (task: Task) => ({
            ...task,
            updatedAt: new Date().toISOString()
          })
        );
        break;
      }
      case 'tag-note': {
        const located = findEntryByText('notes', parsed.text);
        if (!located) {
          throw new Error(`Could not find note "${parsed.text}".`);
        }
        const projectId = resolveProjectId(parsed.projectName);
        nextSelectedDate = located.dateKey;
        nextEntries = upsertItemInEntries(
          nextEntries,
          located.dateKey,
          'notes',
          located.item.id,
          located.dateKey,
          (note: Note) => ({
            ...note,
            projectId,
            updatedAt: new Date().toISOString()
          })
        );
        setActiveProjectId(projectId ?? null);
        break;
      }
      case 'tag-task': {
        const located = findEntryByText('tasks', parsed.text);
        if (!located) {
          throw new Error(`Could not find task "${parsed.text}".`);
        }
        const projectId = resolveProjectId(parsed.projectName);
        nextSelectedDate = located.dateKey;
        nextEntries = upsertItemInEntries(
          nextEntries,
          located.dateKey,
          'tasks',
          located.item.id,
          located.dateKey,
          (task: Task) => ({
            ...task,
            projectId,
            updatedAt: new Date().toISOString()
          })
        );
        setActiveProjectId(projectId ?? null);
        break;
      }
    }

    const result = await persistWorkspace(
      {
        settings: workspaceStore.settings,
        projects: nextProjects,
        entries: nextEntries
      },
      {
        selectedDate: nextSelectedDate,
        visibleMonth: createMonthKey(new Date(`${nextSelectedDate}T12:00:00`))
      }
    );

    if (result.ok) {
      setSelectedDate(nextSelectedDate);
      setVisibleMonth(createMonthKey(new Date(`${nextSelectedDate}T12:00:00`)));
      return {
        ok: true as const,
        message:
          parsed.type === 'add-note' || parsed.type === 'add-task'
            ? 'Command saved to the selected workspace.'
            : 'Command applied to the selected workspace.'
      };
    }

    return {
      ok: false as const,
      error: result.error
    };
  };

  const viewButtons: { icon: string; label: string; mode: ViewMode }[] = [
    { mode: 'calendar', label: 'Calendar', icon: '▦' },
    { mode: 'graph', label: 'Graph', icon: '◉' },
    { mode: 'heatmap', label: 'Activity', icon: '▤' }
  ];

  return (
    <main className="flex min-h-screen items-stretch justify-center p-4 lg:p-7">
      <section
        className="min-h-[calc(100vh-56px)] w-full max-w-[1480px] rounded-[32px] border border-[color:var(--color-line)] bg-[rgba(248,248,246,0.92)] p-5 shadow-[0_24px_72px_rgba(20,20,19,0.07)] lg:p-8"
        aria-labelledby="workspace-title"
      >
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-5">
            <div>
              <h1
                id="workspace-title"
                className="font-[var(--font-serif)] text-[clamp(1.8rem,4vw,3rem)] leading-[1] font-[330] text-[color:var(--color-ink)]"
              >
                Daily Notes
              </h1>
              <p className="mt-2 text-sm text-[color:var(--color-copy-muted)]">
                {activeDays} days &middot; {totalNotes} notes &middot; {totalTasks} tasks
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View switcher */}
            <div className="inline-flex rounded-[12px] border border-[color:var(--color-line)] bg-white p-1">
              {viewButtons.map((vb) => (
                <button
                  key={vb.mode}
                  type="button"
                  className={[
                    'inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-sm font-medium transition',
                    viewMode === vb.mode
                      ? 'bg-[color:var(--color-ink)] text-white'
                      : 'text-[color:var(--color-copy-muted)] hover:text-[color:var(--color-ink)]'
                  ].join(' ')}
                  onClick={() => setViewMode(vb.mode)}
                  title={`${vb.label} (${vb.mode === 'calendar' ? '1' : vb.mode === 'graph' ? '2' : '3'})`}
                >
                  <span aria-hidden="true">{vb.icon}</span>
                  <span className="hidden sm:inline">{vb.label}</span>
                </button>
              ))}
            </div>

            {/* Today button */}
            <button
              type="button"
              className={[
                'inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-4 text-sm font-medium transition',
                isToday
                  ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white'
                  : 'border-[color:var(--color-line)] bg-white text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-muted)]'
              ].join(' ')}
              onClick={handleGoToToday}
              title="Go to today (T)"
            >
              Today
            </button>

            {/* Search button */}
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[color:var(--color-line)] bg-white px-3 text-sm text-[color:var(--color-copy-muted)] transition hover:bg-[color:var(--color-paper-muted)] hover:text-[color:var(--color-ink)]"
              onClick={() => setIsSearchOpen(true)}
              title="Search (⌘K)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border border-[color:var(--color-line)] bg-[color:var(--color-paper-muted)] px-1.5 py-0.5 text-[10px] font-medium sm:inline">
                ⌘K
              </kbd>
            </button>
          </div>
        </header>

        {/* Main content grid */}
        <div
          className={[
            'grid items-stretch gap-4 lg:gap-6',
            viewMode === 'calendar'
              ? [
                  '2xl:grid-cols-[minmax(200px,240px)_minmax(0,1fr)_minmax(320px,380px)]',
                  'xl:grid-cols-[minmax(200px,240px)_minmax(0,1fr)] xl:[&>*:last-child]:col-span-2',
                  'md:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]',
                  isProjectSidebarCollapsed
                    ? '2xl:grid-cols-[72px_minmax(0,1fr)_minmax(320px,380px)] xl:grid-cols-[72px_minmax(0,1fr)] md:grid-cols-[72px_minmax(0,1fr)]'
                    : ''
                ].join(' ')
              : 'grid-cols-1'
          ].join(' ')}
        >
          {viewMode === 'calendar' && (
            <>
              <ProjectSidebar
                collapsed={isProjectSidebarCollapsed}
                activeProjectId={activeProjectId}
                entries={entries}
                onCreateProject={handleCreateProject}
                onSelectProject={setActiveProjectId}
                onToggleCollapsed={() => setIsProjectSidebarCollapsed((current) => !current)}
                projects={projects}
              />
              <MonthGrid
                activeProjectId={activeProjectId}
                entries={entries}
                monthKey={visibleMonth}
                onNavigateMonth={handleNavigateMonth}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
              />
              <DayDetailPanel
                activeProjectId={activeProjectId}
                activeProjectName={activeProject?.name}
                entries={entries}
                onCommand={handleCommand}
                onPersistEntries={persistEntries}
                onSelectDate={handleSelectDate}
                projects={projects}
                selectedDate={selectedDate}
              />
            </>
          )}

          {viewMode === 'graph' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
              <div className="min-h-[500px]">
                <GraphView
                  entries={entries}
                  onSelectDate={handleSelectDate}
                  projects={projects}
                  selectedDate={selectedDate}
                />
              </div>
              <DayDetailPanel
                activeProjectId={activeProjectId}
                activeProjectName={activeProject?.name}
                entries={entries}
                onCommand={handleCommand}
                onPersistEntries={persistEntries}
                onSelectDate={handleSelectDate}
                projects={projects}
                selectedDate={selectedDate}
              />
            </div>
          )}

          {viewMode === 'heatmap' && (
            <div className="grid gap-6">
              <ActivityHeatmap
                entries={entries}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
              />
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
                <MonthGrid
                  activeProjectId={activeProjectId}
                  entries={entries}
                  monthKey={visibleMonth}
                  onNavigateMonth={handleNavigateMonth}
                  onSelectDate={handleSelectDate}
                  selectedDate={selectedDate}
                />
                <DayDetailPanel
                  activeProjectId={activeProjectId}
                  activeProjectName={activeProject?.name}
                  entries={entries}
                  onCommand={handleCommand}
                  onPersistEntries={persistEntries}
                  onSelectDate={handleSelectDate}
                  projects={projects}
                  selectedDate={selectedDate}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--color-line)]/50 pt-4 text-[11px] text-[color:var(--color-copy-muted)]">
          <span>Daily Notes Desktop v{appVersion}</span>
          <div className="flex flex-wrap gap-4">
            <span><kbd className="rounded border border-[color:var(--color-line)] px-1.5">T</kbd> today</span>
            <span><kbd className="rounded border border-[color:var(--color-line)] px-1.5">⌘K</kbd> search</span>
            <span><kbd className="rounded border border-[color:var(--color-line)] px-1.5">1</kbd><kbd className="ml-0.5 rounded border border-[color:var(--color-line)] px-1.5">2</kbd><kbd className="ml-0.5 rounded border border-[color:var(--color-line)] px-1.5">3</kbd> views</span>
          </div>
        </footer>
      </section>

      <SearchPanel
        entries={entries}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectDate={(dateKey) => {
          handleSelectDate(dateKey);
          setIsSearchOpen(false);
        }}
        projects={projects}
      />
    </main>
  );
}
