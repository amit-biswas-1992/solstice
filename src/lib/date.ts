export interface CalendarDay {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const monthLabelFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric'
});

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});

const parseNumber = (value: string, label: string) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return parsed;
};

export const createDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const createMonthKey = (date: Date) => createDateKey(date).slice(0, 7);

export const parseMonthKey = (monthKey: string) => {
  if (!MONTH_KEY_PATTERN.test(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }

  const [yearText, monthText] = monthKey.split('-');
  const year = parseNumber(yearText, 'year');
  const monthIndex = parseNumber(monthText, 'month') - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }

  return new Date(year, monthIndex, 1, 12);
};

export const parseDateKey = (dateKey: string) => {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  const [yearText, monthText, dayText] = dateKey.split('-');
  const year = parseNumber(yearText, 'year');
  const monthIndex = parseNumber(monthText, 'month') - 1;
  const day = parseNumber(dayText, 'day');
  const date = new Date(year, monthIndex, day, 12);

  if (createDateKey(date) !== dateKey) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }

  return date;
};

export const getMonthKey = (dateKey: string) => dateKey.slice(0, 7);

export const isDateInMonth = (dateKey: string, monthKey: string) => getMonthKey(dateKey) === monthKey;

export const getDaysInMonth = (monthKey: string) => {
  const firstOfMonth = parseMonthKey(monthKey);
  return new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
};

export const shiftMonthKey = (monthKey: string, offset: number) => {
  const firstOfMonth = parseMonthKey(monthKey);
  return createMonthKey(new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + offset, 1, 12));
};

export const moveDateKeyToMonth = (dateKey: string, monthKey: string) => {
  const date = parseDateKey(dateKey);
  const month = parseMonthKey(monthKey);
  const day = Math.min(date.getDate(), getDaysInMonth(monthKey));
  return createDateKey(new Date(month.getFullYear(), month.getMonth(), day, 12));
};

export const formatMonthLabel = (monthKey: string) => monthLabelFormatter.format(parseMonthKey(monthKey));

export const formatDateLabel = (dateKey: string) => shortDateFormatter.format(parseDateKey(dateKey));

export const formatLongDateLabel = (dateKey: string) => longDateFormatter.format(parseDateKey(dateKey));

export const buildMonthGrid = (
  monthKey: string,
  options?: {
    todayDateKey?: string;
  }
) => {
  const firstOfMonth = parseMonthKey(monthKey);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  const todayDateKey = options?.todayDateKey ?? createDateKey(new Date());

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const dateKey = createDateKey(date);

    return {
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: isDateInMonth(dateKey, monthKey),
      isToday: dateKey === todayDateKey
    };
  });
};
