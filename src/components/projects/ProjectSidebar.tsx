import { useMemo, useState } from 'react';
import type { EntriesByDate, Project } from '../../types/models';

interface ProjectSidebarProps {
  collapsed: boolean;
  activeProjectId: string | null;
  entries: EntriesByDate;
  onCreateProject: (name: string) => Promise<boolean>;
  onLock: () => void;
  onSelectProject: (projectId: string | null) => void;
  onToggleCollapsed: () => void;
  projects: Project[];
}

const FALLBACK_SWATCHES = ['#1f4e79', '#8c5e34', '#2f6b5f', '#905a2a', '#5b4d9d'];

export default function ProjectSidebar({
  collapsed,
  activeProjectId,
  entries,
  onCreateProject,
  onLock,
  onSelectProject,
  onToggleCollapsed,
  projects
}: ProjectSidebarProps) {
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { activeDays, projectUsageById, unassignedItems } = useMemo(() => {
    const usageById = new Map<string, number>();
    let nextActiveDays = 0;
    let nextUnassignedItems = 0;

    Object.values(entries).forEach((entry) => {
      const items = [...entry.notes, ...entry.tasks];

      if (items.length > 0) {
        nextActiveDays += 1;
      }

      items.forEach((item) => {
        if (!item.projectId) {
          nextUnassignedItems += 1;
          return;
        }

        usageById.set(item.projectId, (usageById.get(item.projectId) ?? 0) + 1);
      });
    });

    return {
      activeDays: nextActiveDays,
      projectUsageById: usageById,
      unassignedItems: nextUnassignedItems
    };
  }, [entries]);

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await onCreateProject(projectName);
    if (saved) {
      setProjectName('');
      setIsCreating(false);
    }
  };

  return (
    <aside
      className={[
        'flex h-full flex-col',
        collapsed ? 'w-[52px] items-center py-3' : 'py-4 pr-2'
      ].join(' ')}
      aria-labelledby="project-sidebar-title"
    >
      {/* Top: Toggle + Title */}
      <div className={collapsed ? 'flex flex-col items-center gap-3' : 'flex items-center gap-3 px-3'}>
        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8b8680] transition hover:bg-[#ece8e1] hover:text-[#1a1a1a]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapsed}
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            ) : (
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </>
            )}
          </svg>
        </button>
        {!collapsed && (
          <h2
            id="project-sidebar-title"
            className="text-sm font-medium text-[#1a1a1a]"
          >
            Projects
          </h2>
        )}
      </div>

      {/* New project button */}
      {!collapsed && (
        <div className="mt-3 px-2">
          {isCreating ? (
            <form className="grid gap-2" onSubmit={handleCreateProject}>
              <input
                aria-label="Project name"
                autoFocus
                placeholder="Project name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setIsCreating(false);
                    setProjectName('');
                  }
                }}
                className="h-9 rounded-lg border border-[#e8e2db] bg-white px-3 text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#c5bfb8] focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              />
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={projectName.trim().length === 0}
                  className="h-8 flex-1 rounded-lg bg-[#1a1a1a] text-xs font-medium text-white transition hover:bg-[#333] disabled:opacity-40"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setProjectName(''); }}
                  className="h-8 rounded-lg px-3 text-xs text-[#8b8680] transition hover:bg-[#ece8e1]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-[#8b8680] transition hover:bg-[#ece8e1] hover:text-[#1a1a1a]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
              </svg>
              New project
            </button>
          )}
        </div>
      )}

      {collapsed && (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8b8680] transition hover:bg-[#ece8e1] hover:text-[#1a1a1a]"
          title="New project"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Stats */}
      {!collapsed && (
        <p className="mt-3 px-5 text-[11px] text-[#b5afa8]">
          {projects.length} projects · {activeDays} active days
        </p>
      )}

      {/* Project list */}
      <div
        className={[
          'flex-1 overflow-y-auto',
          collapsed ? 'mt-3 flex flex-col items-center gap-1' : 'mt-2 flex flex-col gap-0.5 px-2'
        ].join(' ')}
        role="list"
        aria-label="Projects"
      >
        {/* All projects filter */}
        <button
          type="button"
          className={[
            'rounded-lg text-left text-sm transition',
            collapsed
              ? 'flex h-8 w-8 items-center justify-center'
              : 'flex items-center gap-2.5 px-3 py-2',
            activeProjectId === null
              ? collapsed
                ? 'bg-[#ece8e1] text-[#1a1a1a]'
                : 'bg-[#ece8e1] text-[#1a1a1a]'
              : 'text-[#8b8680] hover:bg-[#f0ece7] hover:text-[#1a1a1a]'
          ].join(' ')}
          onClick={() => onSelectProject(null)}
          title={collapsed ? 'All projects' : undefined}
        >
          <svg className={collapsed ? 'h-4 w-4' : 'h-3.5 w-3.5 shrink-0'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          {!collapsed && <span>All projects</span>}
        </button>

        {/* Project items */}
        {projects.length === 0 ? (
          !collapsed ? (
            <p className="px-3 py-2 text-xs text-[#b5afa8]">
              No projects yet
            </p>
          ) : null
        ) : (
          projects.map((project, index) => {
            const linkedItems = projectUsageById.get(project.id) ?? 0;
            const isActiveFilter = activeProjectId === project.id;
            const dotColor = project.color ?? FALLBACK_SWATCHES[index % FALLBACK_SWATCHES.length];

            return (
              <button
                key={project.id}
                type="button"
                aria-label={project.name}
                className={[
                  'rounded-lg text-left transition',
                  collapsed
                    ? 'flex h-8 w-8 items-center justify-center'
                    : 'flex items-center gap-2.5 px-3 py-2',
                  isActiveFilter
                    ? 'bg-[#ece8e1] text-[#1a1a1a]'
                    : 'text-[#8b8680] hover:bg-[#f0ece7] hover:text-[#1a1a1a]'
                ].join(' ')}
                onClick={() => onSelectProject(isActiveFilter ? null : project.id)}
                title={collapsed ? `${project.name} (${linkedItems})` : undefined}
              >
                <span
                  className={collapsed ? 'h-2.5 w-2.5 rounded-full' : 'h-2 w-2 shrink-0 rounded-full'}
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{project.name}</span>
                    <span className="text-[11px] text-[#b5afa8]">
                      {linkedItems} item{linkedItems === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Bottom section */}
      <div className={collapsed ? 'mt-auto flex flex-col items-center gap-1 pt-3' : 'mt-auto pt-3'}>
        {!collapsed && (
          <p className="mb-2 px-5 text-[11px] text-[#b5afa8]">
            {unassignedItems} unassigned · Local
          </p>
        )}
        <button
          type="button"
          onClick={onLock}
          className={[
            'rounded-lg text-[#8b8680] transition hover:bg-[#ece8e1] hover:text-[#1a1a1a]',
            collapsed
              ? 'flex h-8 w-8 items-center justify-center'
              : 'flex w-full items-center gap-2.5 px-3 py-2 text-sm'
          ].join(' ')}
          title="Log out"
        >
          <svg className={collapsed ? 'h-4 w-4' : 'h-3.5 w-3.5 shrink-0'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
