import { z } from 'zod';
import type {
  StoreBootstrap,
  UnlockResult,
  UnlockedStoreSnapshot
} from './desktopBridge';

const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM month key');
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date key');
const isoTimestampSchema = z.string().datetime({ offset: true });

export const IPC = {
  LOAD_STORE: 'storage:loadStore',
  SAVE_STORE: 'storage:saveStore',
  UNLOCK: 'auth:unlock'
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

export const pinPayloadSchema = z.string().trim().min(1).max(128);

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema
});

export const noteSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  projectId: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema
});

export const taskSchema = noteSchema.extend({
  done: z.boolean(),
  description: z.string().optional(),
  url: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

export const dayEntrySchema = z.object({
  notes: z.array(noteSchema),
  tasks: z.array(taskSchema)
});

export const unlockedStoreSnapshotSchema = z.object({
  settings: z.object({
    lastOpenedMonth: monthKeySchema,
    lastSelectedDate: dateKeySchema
  }),
  projects: z.array(projectSchema),
  entries: z.record(dateKeySchema, dayEntrySchema)
});

export type PinPayload = z.infer<typeof pinPayloadSchema>;

export interface IpcRequestMap {
  [IPC.LOAD_STORE]: void;
  [IPC.SAVE_STORE]: UnlockedStoreSnapshot;
  [IPC.UNLOCK]: PinPayload;
}

export interface IpcResponseMap {
  [IPC.LOAD_STORE]: StoreBootstrap;
  [IPC.SAVE_STORE]: UnlockedStoreSnapshot;
  [IPC.UNLOCK]: UnlockResult;
}
