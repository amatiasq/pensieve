import { Scheduler } from '@amatiasq/scheduler';
import { useState } from 'react';

export function useScheduler(milliseconds: number, callback: () => void) {
  const [handler] = useState<{ callback(): void }>({ callback });
  const [scheduler] = useState<Scheduler>(
    new Scheduler(milliseconds, () => handler.callback()),
  );

  handler.callback = callback;
  return scheduler;
}
