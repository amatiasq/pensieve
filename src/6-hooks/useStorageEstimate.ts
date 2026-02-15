import { useEffect, useState } from 'react';

export function useStorageEstimate(): string | null {
  const [estimate, setEstimate] = useState<string | null>(null);

  useEffect(() => {
    navigator.storage?.estimate().then(({ usage }) => {
      if (usage != null) {
        setEstimate(formatBytes(usage));
      }
    });
  }, []);

  return estimate;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
