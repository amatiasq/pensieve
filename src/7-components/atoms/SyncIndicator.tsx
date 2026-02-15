import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useStorageEstimate } from '../../6-hooks/useStorageEstimate.ts';
import { useSyncStatus } from '../../6-hooks/useSyncStatus.ts';
import type { SyncStatus } from '../../4-storage/syncStatus.ts';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const STATUS_CONFIG: Record<SyncStatus, { color: string; label: string }> = {
  synced: { color: '#4caf50', label: 'Synchronized' },
  saving: { color: '#2196f3', label: 'Saving...' },
  pending: { color: '#ff9800', label: 'Changes pending' },
  offline: { color: '#9e9e9e', label: 'Offline' },
  error: { color: '#f44336', label: 'Sync error' },
  conflict: { color: '#ff9800', label: 'Conflict detected' },
};

const Dot = styled.span<{ status: SyncStatus }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ status }) => STATUS_CONFIG[status].color};
  ${({ status }) =>
    (status === 'saving' || status === 'pending') &&
    css`
      animation: ${pulse} 1.5s ease-in-out infinite;
    `}
`;

export function SyncIndicator() {
  const status = useSyncStatus();
  const storage = useStorageEstimate();
  const { label } = STATUS_CONFIG[status];
  const title = storage ? `${label} — ${storage} used` : label;

  return <Dot status={status} title={title} aria-label={label} />;
}
