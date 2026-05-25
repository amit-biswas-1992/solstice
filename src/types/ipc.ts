export const STORAGE_IPC_CHANNELS = {
  loadStore: 'storage:loadStore',
  saveStore: 'storage:saveStore',
  unlock: 'auth:unlock'
} as const;

export type StorageIpcChannel =
  (typeof STORAGE_IPC_CHANNELS)[keyof typeof STORAGE_IPC_CHANNELS];
