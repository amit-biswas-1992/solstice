import type { DayEntry, EntriesByDate, Note, Task } from '../../types/models';

export type EntryBucketKey = 'notes' | 'tasks';
type EntryItem = Note | Task;

export const createEmptyDayEntry = (): DayEntry => ({
  notes: [],
  tasks: []
});

const pruneEntries = (entries: EntriesByDate): EntriesByDate =>
  Object.fromEntries(
    Object.entries(entries).filter(([, entry]) => entry.notes.length > 0 || entry.tasks.length > 0)
  );

export const updateEntriesForDate = (
  entries: EntriesByDate,
  dateKey: string,
  updater: (entry: DayEntry) => DayEntry
): EntriesByDate =>
  pruneEntries({
    ...entries,
    [dateKey]: updater(entries[dateKey] ?? createEmptyDayEntry())
  });

const appendItemToBucket = <T extends EntryItem>(
  entries: EntriesByDate,
  dateKey: string,
  bucketKey: EntryBucketKey,
  item: T
) =>
  updateEntriesForDate(entries, dateKey, (entry) => ({
    ...entry,
    [bucketKey]: [...entry[bucketKey], item]
  }));

export const removeItemFromEntries = (
  entries: EntriesByDate,
  dateKey: string,
  bucketKey: EntryBucketKey,
  entryId: string
) =>
  updateEntriesForDate(entries, dateKey, (entry) => ({
    ...entry,
    [bucketKey]: entry[bucketKey].filter((item) => item.id !== entryId)
  }));

export const upsertItemInEntries = <T extends EntryItem>(
  entries: EntriesByDate,
  sourceDate: string,
  bucketKey: EntryBucketKey,
  entryId: string,
  targetDate: string,
  updater: (item: T) => T
): EntriesByDate => {
  const sourceEntry = entries[sourceDate] ?? createEmptyDayEntry();
  const sourceItems = sourceEntry[bucketKey] as T[];
  const currentItem = sourceItems.find((item) => item.id === entryId);

  if (!currentItem) {
    return entries;
  }

  const nextItem = updater(currentItem);

  if (targetDate === sourceDate) {
    return updateEntriesForDate(entries, sourceDate, (entry) => ({
      ...entry,
      [bucketKey]: (entry[bucketKey] as T[]).map((item) => (item.id === entryId ? nextItem : item))
    }));
  }

  const removedFromSource = removeItemFromEntries(entries, sourceDate, bucketKey, entryId);
  return appendItemToBucket(removedFromSource, targetDate, bucketKey, nextItem);
};

const createEntryId = (prefix: 'note' | 'task') => `${prefix}-${crypto.randomUUID()}`;

export const createNote = (text: string, projectId?: string): Note => {
  const timestamp = new Date().toISOString();

  return {
    id: createEntryId('note'),
    text: text.trim(),
    projectId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export const createTask = (text: string, projectId?: string): Task => {
  const timestamp = new Date().toISOString();

  return {
    id: createEntryId('task'),
    text: text.trim(),
    projectId,
    done: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};
