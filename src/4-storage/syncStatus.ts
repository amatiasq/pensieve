import { emitter } from '@amatiasq/emitter';

export type SyncStatus =
  | 'synced'
  | 'saving'
  | 'pending'
  | 'offline'
  | 'error'
  | 'conflict';

const emit = emitter<SyncStatus>();

export const onSyncStatusChange = emit.subscribe;

export function setSyncStatus(status: SyncStatus) {
  emit(status);
}
