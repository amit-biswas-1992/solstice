import { formatLongDateLabel } from '../../lib/date';
import type { DayEntry } from '../../types/models';

interface DayCardProps {
  activeProjectId?: string | null;
  dateKey: string;
  dayNumber: number;
  entry?: DayEntry;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (dateKey: string) => void;
}

export default function DayCard({
  activeProjectId,
  dateKey,
  dayNumber,
  entry,
  isCurrentMonth,
  isSelected,
  isToday,
  onSelect
}: DayCardProps) {
  const noteCount = entry?.notes.length ?? 0;
  const taskCount = entry?.tasks.length ?? 0;
  const openTaskCount = entry?.tasks.filter((t) => !t.done).length ?? 0;
  const doneTaskCount = taskCount - openTaskCount;
  const activityCount = noteCount + taskCount;
  const hasActivity = activityCount > 0;
  const hasProjectMatch = Boolean(
    activeProjectId &&
      entry &&
      [...entry.notes, ...entry.tasks].some((item) => item.projectId === activeProjectId)
  );
  const filteredOut = Boolean(activeProjectId) && hasActivity && !hasProjectMatch;

  const activityLabel = hasActivity
    ? `${noteCount} note${noteCount === 1 ? '' : 's'}, ${taskCount} task${taskCount === 1 ? '' : 's'}`
    : 'No entries';

  return (
    <button
      type="button"
      className={[
        'group relative aspect-square min-w-0 rounded-[16px] border p-2.5 text-left transition-all',
        'flex flex-col justify-between outline-none',
        isCurrentMonth
          ? 'border-[color:var(--color-line)]'
          : 'border-transparent opacity-40',
        isCurrentMonth && !isSelected ? 'bg-white' : '',
        isSelected
          ? 'border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white shadow-[0_8px_24px_rgba(20,20,19,0.15)]'
          : '',
        isToday && !isSelected
          ? 'border-[color:var(--color-ink)] bg-[color:var(--color-paper-muted)]'
          : '',
        hasProjectMatch && !isSelected ? 'ring-1 ring-[color:var(--color-line-strong)]' : '',
        filteredOut ? 'opacity-30' : '',
        !isSelected ? 'hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(20,20,19,0.06)]' : '',
        'focus-visible:ring-2 focus-visible:ring-[color:var(--color-line-strong)]'
      ].join(' ')}
      aria-label={`${formatLongDateLabel(dateKey)}. ${activityLabel}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(dateKey)}
    >
      {/* Day number + today dot */}
      <span className="flex items-center gap-1">
        <span className={[
          'text-base font-semibold',
          isSelected ? 'text-white' : 'text-[color:var(--color-ink)]'
        ].join(' ')}>
          {dayNumber}
        </span>
        {isToday && !isSelected && (
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-ink)]" aria-label="Today" />
        )}
      </span>

      {/* Activity indicators */}
      <span className="flex items-end justify-between">
        {hasActivity ? (
          <span className="flex items-center gap-1" aria-hidden="true">
            {/* Activity dots */}
            {Array.from({ length: Math.min(activityCount, 5) }).map((_, i) => (
              <span
                key={i}
                className={[
                  'h-1.5 w-1.5 rounded-full',
                  isSelected ? 'bg-white/70' : 'bg-[color:var(--color-ink)]/30'
                ].join(' ')}
              />
            ))}
            {activityCount > 5 && (
              <span className={[
                'text-[9px] font-medium',
                isSelected ? 'text-white/60' : 'text-[color:var(--color-copy-muted)]'
              ].join(' ')}>
                +{activityCount - 5}
              </span>
            )}
          </span>
        ) : (
          <span />
        )}
        {/* Completion indicator for tasks */}
        {taskCount > 0 && (
          <span className={[
            'text-[9px] font-medium tabular-nums',
            isSelected ? 'text-white/60' : 'text-[color:var(--color-copy-muted)]',
            doneTaskCount === taskCount ? 'opacity-50' : ''
          ].join(' ')}>
            {doneTaskCount}/{taskCount}
          </span>
        )}
      </span>
    </button>
  );
}
