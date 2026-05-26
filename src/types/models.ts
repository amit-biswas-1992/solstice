export interface Settings {
  pin: string;
  lastOpenedMonth: string;
  lastSelectedDate: string;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  text: string;
  projectId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task extends Note {
  done: boolean;
  description?: string;
  url?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface DayEntry {
  notes: Note[];
  tasks: Task[];
}

export type EntriesByDate = Record<string, DayEntry>;

export interface StoreSnapshot {
  settings: Settings;
  projects: Project[];
  entries: EntriesByDate;
}
