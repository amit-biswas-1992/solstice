import { useMemo } from 'react';
import type { EntriesByDate, Project } from '../../types/models';

interface ProjectSidebarProps {
  entries: EntriesByDate;
  projects: Project[];
  selectedDate: string;
}

const FALLBACK_SWATCHES = ['#1f4e79', '#8c5e34', '#2f6b5f', '#905a2a', '#5b4d9d'];

export default function ProjectSidebar({ entries, projects, selectedDate }: ProjectSidebarProps) {
  const selectedEntry = entries[selectedDate];
  const selectedProjectIds = useMemo(
    () =>
      new Set(
        [...(selectedEntry?.notes ?? []), ...(selectedEntry?.tasks ?? [])]
          .map((item) => item.projectId)
          .filter((projectId): projectId is string => Boolean(projectId))
      ),
    [selectedEntry]
  );
  const { activeDays, projectUsageById } = useMemo(() => {
    const usageById = new Map<string, number>();
    let nextActiveDays = 0;

    Object.values(entries).forEach((entry) => {
      const items = [...entry.notes, ...entry.tasks];

      if (items.length > 0) {
        nextActiveDays += 1;
      }

      items.forEach((item) => {
        if (!item.projectId) {
          return;
        }

        usageById.set(item.projectId, (usageById.get(item.projectId) ?? 0) + 1);
      });
    });

    return {
      activeDays: nextActiveDays,
      projectUsageById: usageById
    };
  }, [entries]);
  const selectedNotes = selectedEntry?.notes.length ?? 0;
  const selectedTasks = selectedEntry?.tasks.length ?? 0;

  return (
    <aside className="workspace-panel project-sidebar" aria-labelledby="project-sidebar-title">
      <div className="workspace-panel__header">
        <div>
          <p className="workspace-panel__eyebrow">Projects</p>
          <h2 id="project-sidebar-title">Studio index</h2>
        </div>
      </div>

      <div className="project-sidebar__stats">
        <StatCard label="Loaded" value={`${projects.length}`} />
        <StatCard label="Active days" value={`${activeDays}`} />
        <StatCard label="Selected" value={selectedDate} />
      </div>

      <section className="project-sidebar__focus" aria-label="Selected day summary">
        <p className="project-sidebar__focus-label">Selected day summary</p>
        <p className="project-sidebar__focus-date">{selectedDate}</p>
        <p className="project-sidebar__focus-copy">
          {selectedNotes} note{selectedNotes === 1 ? '' : 's'} and {selectedTasks} task
          {selectedTasks === 1 ? '' : 's'} linked to this day.
        </p>
      </section>

      <div className="project-sidebar__list" role="list" aria-label="Projects">
        {projects.length === 0 ? (
          <p className="project-sidebar__empty">No projects yet. Add one to start organizing days.</p>
        ) : (
          projects.map((project, index) => {
            const linkedItems = projectUsageById.get(project.id) ?? 0;
            const isSelected = selectedProjectIds.has(project.id);

            return (
              <article
                key={project.id}
                className={`project-sidebar__item${isSelected ? ' project-sidebar__item--selected' : ''}`}
                role="listitem"
              >
                <span
                  className="project-sidebar__swatch"
                  style={{ backgroundColor: project.color ?? FALLBACK_SWATCHES[index % FALLBACK_SWATCHES.length] }}
                  aria-hidden="true"
                />
                <div className="project-sidebar__content">
                  <div className="project-sidebar__row">
                    <h3 className="project-sidebar__title">{project.name}</h3>
                    {isSelected ? <span className="project-sidebar__pill">Selected day</span> : null}
                  </div>
                  <p className="project-sidebar__meta">
                    {linkedItems} linked item{linkedItems === 1 ? '' : 's'}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="project-sidebar__stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
