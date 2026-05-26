import { buildMonthGrid, formatDateLabel, formatMonthLabel, WEEKDAY_LABELS } from '../../lib/date';
import type { EntriesByDate } from '../../types/models';
import DayCard from './DayCard';

interface MonthGridProps {
  activeProjectId?: string | null;
  entries: EntriesByDate;
  monthKey: string;
  onNavigateMonth: (offset: number) => void;
  onSelectDate: (dateKey: string) => void;
  selectedDate: string;
  todayDateKey?: string;
}

export default function MonthGrid({
  activeProjectId,
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
    if (!day.isCurrentMonth || !entry) {
      return false;
    }

    const items = [...entry.notes, ...entry.tasks];
    if (!activeProjectId) {
      return items.length > 0;
    }

    return items.some((item) => item.projectId === activeProjectId);
  }).length;

  return (
    <section
      className="rounded-[24px] border border-[color:var(--color-line)] bg-white"
      aria-labelledby="month-grid-title"
    >
      <header className="flex items-center justify-between px-6 pt-5 pb-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-line)] text-sm text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-paper-muted)]"
            aria-label="Previous month"
            onClick={() => onNavigateMonth(-1)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 id="month-grid-title" className="text-xl leading-7 font-medium text-[color:var(--color-ink)]">
            {formatMonthLabel(monthKey)}
          </h2>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--color-line)] text-sm text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-paper-muted)]"
            aria-label="Next month"
            onClick={() => onNavigateMonth(1)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="text-right text-xs text-[color:var(--color-copy-muted)]">
          <span>{activeDayCount} active</span>
          <span className="mx-1.5">·</span>
          <span>{formatDateLabel(selectedDate)}</span>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-7 gap-1 px-5" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="pb-1 text-center text-[11px] font-medium uppercase tracking-[0.06em] text-[color:var(--color-copy-muted)]"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 p-5 pt-2" role="grid" aria-label={formatMonthLabel(monthKey)}>
        {days.map((day) => (
          <DayCard
            activeProjectId={activeProjectId}
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
