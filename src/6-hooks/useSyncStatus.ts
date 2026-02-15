import { useEffect, useState } from 'react';
import { onSyncStatusChange, SyncStatus } from '../4-storage/syncStatus.ts';

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(() =>
    navigator.onLine ? 'synced' : 'offline',
  );

  useEffect(() => {
    const unsubscribe = onSyncStatusChange(setStatus);

    const onOnline = () => setStatus('synced');
    const onOffline = () => setStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return status;
}
