import { buildMonthGrid, formatDateLabel, formatMonthLabel, WEEKDAY_LABELS } from '../../lib/date';
import type { EntriesByDate } from '../../types/models';
import DayCard from './DayCard';

interface MonthGridProps {
  entries: EntriesByDate;
  monthKey: string;
  onNavigateMonth: (offset: number) => void;
  onSelectDate: (dateKey: string) => void;
  selectedDate: string;
  todayDateKey?: string;
}

export default function MonthGrid({
  entries,
  monthKey,
  onNavigateMonth,
  onSelectDate,
  selectedDate,
  todayDateKey
}: MonthGridProps) {
  const days = buildMonthGrid(monthKey, { todayDateKey });
  const activeDayCount = days.filter((day) => {
    const entry = entries[day.dateKey];
    return day.isCurrentMonth && Boolean(entry) && entry.notes.length + entry.tasks.length > 0;
  }).length;

  return (
    <section className="workspace-panel month-grid-panel" aria-labelledby="month-grid-title">
      <header className="workspace-panel__header">
        <div>
          <p className="workspace-panel__eyebrow">Open month</p>
          <h2 id="month-grid-title">{formatMonthLabel(monthKey)}</h2>
        </div>
        <div className="month-grid__toolbar">
          <div className="workspace-panel__meta">
            <span>{activeDayCount} active days</span>
            <span>{formatDateLabel(selectedDate)}</span>
          </div>
          <div className="month-grid__controls" aria-label="Month navigation">
            <button
              type="button"
              className="month-grid__nav-button"
              aria-label="Previous month"
              onClick={() => onNavigateMonth(-1)}
            >
              Prev
            </button>
            <button
              type="button"
              className="month-grid__nav-button"
              aria-label="Next month"
              onClick={() => onNavigateMonth(1)}
            >
              Next
            </button>
          </div>
        </div>
      </header>

      <div className="month-grid__weekday-row" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="month-grid__weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="month-grid" role="grid" aria-label={formatMonthLabel(monthKey)}>
        {days.map((day) => (
          <DayCard
            key={day.dateKey}
            dateKey={day.dateKey}
            dayNumber={day.dayNumber}
            entry={entries[day.dateKey]}
            isCurrentMonth={day.isCurrentMonth}
            isSelected={day.dateKey === selectedDate}
            isToday={day.isToday}
            onSelect={onSelectDate}
          />
        ))}
      </div>
    </section>
  );
}
