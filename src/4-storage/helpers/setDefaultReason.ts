import { WriteOptions } from './WriteOptions.ts';

export function setDefaultReason(
  options: WriteOptions | undefined,
  reason: string,
) {
  return {
    urgent: (options && options.urgent) || false,
    reason: (options && options.reason) || reason,
  };
}
