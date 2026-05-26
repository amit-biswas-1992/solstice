import { useMemo } from 'react';
import { createDateKey } from '../../lib/date';
import type { EntriesByDate } from '../../types/models';

interface ActivityHeatmapProps {
  entries: EntriesByDate;
  onSelectDate: (dateKey: string) => void;
  selectedDate: string;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getActivityLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

const LEVEL_COLORS = [
  '#ebedf0',
  '#d4c5a9',
  '#b8a07a',
  '#8c7653',
  '#5c4d35'
];

interface DayCell {
  count: number;
  dateKey: string;
  level: number;
}

function buildYearGrid(entries: EntriesByDate): { cells: DayCell[][]; monthPositions: { label: string; x: number }[] } {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: DayCell[][] = [];
  const monthPositions: { label: string; x: number }[] = [];
  let currentDate = new Date(startDate);
  let lastMonth = -1;

  while (currentDate <= today || weeks.length < 53) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateKey = createDateKey(currentDate);
      const entry = entries[dateKey];
      const count = entry ? entry.notes.length + entry.tasks.length : 0;

      if (currentDate.getMonth() !== lastMonth) {
        lastMonth = currentDate.getMonth();
        monthPositions.push({ label: MONTH_LABELS[lastMonth], x: weeks.length });
      }

      week.push({
        dateKey,
        count,
        level: getActivityLevel(count)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 53) break;
  }

  return { cells: weeks, monthPositions };
}

export default function ActivityHeatmap({ entries, onSelectDate, selectedDate }: ActivityHeatmapProps) {
  const { cells, monthPositions } = useMemo(() => buildYearGrid(entries), [entries]);

  const totalActivity = useMemo(() => {
    let total = 0;
    cells.forEach((week) => week.forEach((cell) => { total += cell.count; }));
    return total;
  }, [cells]);

  const activeDays = useMemo(() => {
    let count = 0;
    cells.forEach((week) => week.forEach((cell) => { if (cell.count > 0) count++; }));
    return count;
  }, [cells]);

  const longestStreak = useMemo(() => {
    let maxStreak = 0;
    let currentStreak = 0;
    cells.forEach((week) => week.forEach((cell) => {
      if (cell.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }));
    return maxStreak;
  }, [cells]);

  const cellSize = 13;
  const gap = 3;
  const leftPad = 32;
  const topPad = 24;
  const svgWidth = leftPad + cells.length * (cellSize + gap);
  const svgHeight = topPad + 7 * (cellSize + gap) + 8;

  return (
    <section className="rounded-[24px] border border-[color:var(--color-line)] bg-white">
      <header className="flex flex-col gap-4 px-6 pt-6 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-[12px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-copy-muted)]">
            Activity
          </p>
          <h2 className="text-[24px] leading-8 font-[330] text-[color:var(--color-ink)]">
            {totalActivity} contributions in the last year
          </h2>
        </div>
        <div className="flex gap-6 text-sm text-[color:var(--color-copy-muted)]">
          <div className="text-center">
            <div className="text-lg font-medium text-[color:var(--color-ink)]">{activeDays}</div>
            <div className="text-[11px] uppercase tracking-wide">Active days</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-[color:var(--color-ink)]">{longestStreak}</div>
            <div className="text-[11px] uppercase tracking-wide">Best streak</div>
          </div>
        </div>
      </header>
      <div className="overflow-x-auto px-4 pb-5 pt-2">
        <svg width={svgWidth} height={svgHeight} className="block">
          {/* Month labels */}
          {monthPositions.map((mp, i) => (
            <text
              key={`month-${i}`}
              x={leftPad + mp.x * (cellSize + gap)}
              y={14}
              className="fill-[color:var(--color-copy-muted)]"
              fontSize="10"
              fontFamily="Inter, sans-serif"
            >
              {mp.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) => (
            label ? (
              <text
                key={`day-${i}`}
                x={0}
                y={topPad + i * (cellSize + gap) + cellSize - 2}
                className="fill-[color:var(--color-copy-muted)]"
                fontSize="10"
                fontFamily="Inter, sans-serif"
              >
                {label}
              </text>
            ) : null
          ))}

          {/* Cells */}
          {cells.map((week, wi) =>
            week.map((cell, di) => {
              const isSelected = cell.dateKey === selectedDate;
              return (
                <rect
                  key={cell.dateKey}
                  x={leftPad + wi * (cellSize + gap)}
                  y={topPad + di * (cellSize + gap)}
                  width={cellSize}
                  height={cellSize}
                  rx={3}
                  fill={LEVEL_COLORS[cell.level]}
                  stroke={isSelected ? '#1b67b2' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => onSelectDate(cell.dateKey)}
                >
                  <title>{`${cell.dateKey}: ${cell.count} item${cell.count === 1 ? '' : 's'}`}</title>
                </rect>
              );
            })
          )}
        </svg>
        <div className="mt-2 flex items-center justify-end gap-2 pr-2 text-[11px] text-[color:var(--color-copy-muted)]">
          <span>Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <span
              key={i}
              className="inline-block h-[10px] w-[10px] rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
