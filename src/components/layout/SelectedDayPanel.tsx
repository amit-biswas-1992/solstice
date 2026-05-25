import { useMemo } from 'react';
import { formatLongDateLabel } from '../../lib/date';
import type { EntriesByDate, Project } from '../../types/models';

interface SelectedDayPanelProps {
  entries: EntriesByDate;
  projects: Project[];
  selectedDate: string;
}

export default function SelectedDayPanel({
  entries,
  projects,
  selectedDate
}: SelectedDayPanelProps) {
  const selectedEntry = entries[selectedDate];
  const notes = selectedEntry?.notes ?? [];
  const tasks = selectedEntry?.tasks ?? [];
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );
  const linkedProjects = useMemo(() => {
    const linkedProjectIds = new Set(
      [...notes, ...tasks]
        .map((item) => item.projectId)
        .filter((projectId): projectId is string => Boolean(projectId))
    );

    return Array.from(linkedProjectIds)
      .map((projectId) => projectById.get(projectId))
      .filter((project): project is Project => Boolean(project));
  }, [notes, tasks, projectById]);

  return (
    <aside className="workspace-panel selected-day-panel" aria-labelledby="selected-day-panel-title">
      <header className="workspace-panel__header">
        <div>
          <p className="workspace-panel__eyebrow">Selected day</p>
          <h2 id="selected-day-panel-title">Day detail</h2>
        </div>
        <div className="workspace-panel__meta">
          <span>{notes.length} notes</span>
          <span>{tasks.length} tasks</span>
        </div>
      </header>

      <section className="selected-day-panel__hero">
        <p className="selected-day-panel__date">{formatLongDateLabel(selectedDate)}</p>
        <p className="selected-day-panel__summary">
          {notes.length} note{notes.length === 1 ? '' : 's'} and {tasks.length} task
          {tasks.length === 1 ? '' : 's'} in the current workspace slice.
        </p>
      </section>

      <section className="selected-day-panel__section" aria-label="Notes scaffold">
        <div className="selected-day-panel__section-header">
          <h3>Notes scaffold</h3>
          <span>{notes.length}</span>
        </div>
        {notes.length === 0 ? (
          <p className="selected-day-panel__empty">No notes for this day yet.</p>
        ) : (
          <ul className="selected-day-panel__list">
            {notes.map((note) => (
              <li key={note.id}>
                <span className="selected-day-panel__item-text">{note.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="selected-day-panel__section" aria-label="Tasks scaffold">
        <div className="selected-day-panel__section-header">
          <h3>Task scaffold</h3>
          <span>{tasks.length}</span>
        </div>
        {tasks.length === 0 ? (
          <p className="selected-day-panel__empty">No tasks linked to this day.</p>
        ) : (
          <ul className="selected-day-panel__list">
            {tasks.map((task) => (
              <li key={task.id}>
                <span className="selected-day-panel__item-text">{task.text}</span>
                <strong className="selected-day-panel__item-status">{task.done ? 'Done' : 'Open'}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="selected-day-panel__section" aria-label="Linked projects scaffold">
        <div className="selected-day-panel__section-header">
          <h3>Linked projects</h3>
          <span>{linkedProjects.length}</span>
        </div>
        {linkedProjects.length === 0 ? (
          <p className="selected-day-panel__empty">No project associations on the selected day.</p>
        ) : (
          <ul className="selected-day-panel__project-list">
            {linkedProjects.map((project) => (
              <li key={project.id}>
                <span
                  className="selected-day-panel__project-dot"
                  style={{ backgroundColor: project.color ?? '#1f4e79' }}
                  aria-hidden="true"
                />
                <span className="selected-day-panel__project-name">{project.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
