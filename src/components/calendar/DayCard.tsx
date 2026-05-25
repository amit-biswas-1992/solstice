import { formatLongDateLabel } from '../../lib/date';
import type { DayEntry } from '../../types/models';

interface DayCardProps {
  dateKey: string;
  dayNumber: number;
  entry?: DayEntry;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (dateKey: string) => void;
}

export default function DayCard({
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
  const activityCount = noteCount + taskCount;
  const hasActivity = activityCount > 0;

  const className = [
    'day-card',
    isCurrentMonth ? 'day-card--current' : 'day-card--outside',
    hasActivity ? 'day-card--active' : 'day-card--empty',
    isSelected ? 'day-card--selected' : '',
    isToday ? 'day-card--today' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const activityLabel = hasActivity
    ? `${noteCount} note${noteCount === 1 ? '' : 's'}, ${taskCount} task${taskCount === 1 ? '' : 's'}`
    : 'No entries';

  return (
    <button
      type="button"
      className={className}
      aria-label={`${formatLongDateLabel(dateKey)}. ${activityLabel}`}
      aria-pressed={isSelected}
      data-active={hasActivity}
      data-current-month={isCurrentMonth}
      data-date={dateKey}
      data-empty={!hasActivity}
      data-selected={isSelected}
      onClick={() => onSelect(dateKey)}
    >
      <span className="day-card__header">
        <span className="day-card__number">{dayNumber}</span>
        {isToday ? <span className="day-card__tag">Today</span> : null}
      </span>
      <span className="day-card__summary">{activityLabel}</span>
    </button>
  );
}
