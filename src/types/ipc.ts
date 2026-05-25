export const STORAGE_IPC_CHANNELS = {
  loadStore: 'storage:loadStore',
  unlock: 'auth:unlock'
} as const;

export type StorageIpcChannel =
  (typeof STORAGE_IPC_CHANNELS)[keyof typeof STORAGE_IPC_CHANNELS];
