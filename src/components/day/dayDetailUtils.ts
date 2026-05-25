import type { DayEntry, EntriesByDate, Note, Task } from '../../types/models';

export const createEmptyDayEntry = (): DayEntry => ({
  notes: [],
  tasks: []
});

export const updateEntriesForDate = (
  entries: EntriesByDate,
  dateKey: string,
  updater: (entry: DayEntry) => DayEntry
): EntriesByDate => ({
  ...entries,
  [dateKey]: updater(entries[dateKey] ?? createEmptyDayEntry())
});

const createEntryId = (prefix: 'note' | 'task') => `${prefix}-${crypto.randomUUID()}`;

export const createNote = (text: string): Note => {
  const timestamp = new Date().toISOString();

  return {
    id: createEntryId('note'),
    text: text.trim(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export const createTask = (text: string): Task => {
  const timestamp = new Date().toISOString();

  return {
    id: createEntryId('task'),
    text: text.trim(),
    done: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};
