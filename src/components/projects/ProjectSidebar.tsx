import { useMemo, useState } from 'react';
import type { EntriesByDate, Project } from '../../types/models';

interface ProjectSidebarProps {
  collapsed: boolean;
  activeProjectId: string | null;
  entries: EntriesByDate;
  onCreateProject: (name: string) => Promise<boolean>;
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
  onSelectProject,
  onToggleCollapsed,
  projects
}: ProjectSidebarProps) {
  const [projectName, setProjectName] = useState('');
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
    }
  };

  return (
    <aside
      className={[
        'grid min-h-full rounded-[24px] border border-[color:var(--color-line)] bg-white',
        collapsed
          ? 'grid-rows-[auto_minmax(0,1fr)] px-[10px] pb-3 pt-[14px]'
          : 'grid-rows-[auto_auto_minmax(0,1fr)_auto] px-4 pb-4 pt-[18px]'
      ].join(' ')}
      aria-labelledby="project-sidebar-title"
    >
      <div className={collapsed ? 'grid gap-3 px-1 py-0' : 'grid gap-[10px] px-1.5 pt-1'}>
        <div>
          {!collapsed ? (
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-copy-muted)]">
              Projects
            </p>
          ) : null}
          <h2
            id="project-sidebar-title"
            className={collapsed ? 'sr-only' : 'text-[22px] leading-[26px] font-[330] text-[color:var(--color-ink)]'}
          >
            Projects
          </h2>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center self-start rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-muted)] text-base text-[color:var(--color-ink)] transition hover:bg-white"
          aria-label={collapsed ? 'Expand projects sidebar' : 'Collapse projects sidebar'}
          aria-pressed={collapsed}
          onClick={onToggleCollapsed}
        >
          {collapsed ? '»' : '«'}
        </button>
        {!collapsed ? (
          <p className="text-sm leading-5 text-[color:var(--color-copy-muted)]">
            {projects.length} loaded · {activeDays} active days
          </p>
        ) : null}
      </div>

      {!collapsed ? (
        <form className="mt-4 grid gap-3" onSubmit={handleCreateProject}>
          <label className="grid gap-2">
            <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-[color:var(--color-copy-muted)]">
              New project
            </span>
            <input
              aria-label="Quick project name"
              placeholder="Add a project"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="h-11 rounded-[10px] border border-[color:var(--color-line)] bg-white px-3 text-base text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-line-strong)] focus:ring-2 focus:ring-[color:var(--color-line-strong)]"
            />
          </label>
          <button
            type="submit"
            disabled={projectName.trim().length === 0}
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[color:var(--color-ink)] px-5 text-base font-medium text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add
          </button>
        </form>
      ) : null}

      <div className={collapsed ? 'mt-4 grid content-start gap-2' : 'mt-5 grid content-start gap-2'} role="list" aria-label="Projects">
        <button
          type="button"
          className={[
            'inline-flex min-h-11 items-center rounded-full border px-4 text-left text-sm leading-5 transition',
            activeProjectId === null
              ? 'border-[color:var(--color-ink)] bg-[color:var(--color-paper-muted)] text-[color:var(--color-ink)]'
              : 'border-[color:var(--color-line)] bg-white text-[color:var(--color-copy-muted)] hover:text-[color:var(--color-ink)]',
            collapsed ? 'justify-center px-0' : ''
          ].join(' ')}
          onClick={() => onSelectProject(null)}
        >
          {collapsed ? 'All' : 'All projects'}
        </button>
        {projects.length === 0 ? (
          <p className={collapsed ? 'px-1 text-center text-xs leading-4 text-[color:var(--color-copy-muted)]' : 'text-sm leading-5 text-[color:var(--color-copy-muted)]'}>
            {collapsed ? 'No projects' : 'No projects yet. Add one to start organizing days.'}
          </p>
        ) : (
          projects.map((project, index) => {
            const linkedItems = projectUsageById.get(project.id) ?? 0;
            const isActiveFilter = activeProjectId === project.id;

            return (
              <button
                key={project.id}
                type="button"
                aria-label={project.name}
                className={[
                  'flex min-h-14 items-start gap-3 rounded-[16px] border px-3 py-3 text-left transition',
                  isActiveFilter
                    ? 'border-[color:var(--color-ink)] bg-[color:var(--color-paper-muted)]'
                    : 'border-[color:var(--color-line)] bg-white hover:bg-[color:var(--color-paper-muted)]/60',
                  collapsed ? 'justify-center px-2' : ''
                ].join(' ')}
                onClick={() => onSelectProject(isActiveFilter ? null : project.id)}
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: project.color ?? FALLBACK_SWATCHES[index % FALLBACK_SWATCHES.length]
                  }}
                  aria-hidden="true"
                />
                <div className={collapsed ? 'hidden' : 'min-w-0 flex-1'}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-base font-medium text-[color:var(--color-ink)]">
                      {project.name}
                    </h3>
                    {isActiveFilter ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[color:var(--color-copy-muted)]">
                        Open
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[color:var(--color-copy-muted)]">
                    {linkedItems} item{linkedItems === 1 ? '' : 's'}
                  </p>
                </div>
                {collapsed ? (
                  <span className="text-base font-medium text-[color:var(--color-ink)]">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {!collapsed ? (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[color:var(--color-line)] pt-4 text-[12px] uppercase tracking-[0.08em] text-[color:var(--color-copy-muted)]">
          <span>{unassignedItems} unassigned items</span>
          <span>Local JSON</span>
        </div>
      ) : null}
    </aside>
  );
}
