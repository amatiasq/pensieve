/* eslint-disable @typescript-eslint/no-explicit-any */

import { Emitter, emitter } from '@amatiasq/emitter';

const emitters: Record<string, Emitter<any>> = {};

window.addEventListener('message', (event: MessageEvent<any>) => {
  const emitter = emitters[event.data.type];

  if (typeof emitter === 'function') {
    emitter(event.data.data);
  }
});

export function messageBus<Data = undefined>(key: string) {
  const emit = emitter<Data>();
  emitters[key] = emit;

  const notify = (data: Data) => {
    setTimeout(() => postMessage({ type: key, data }, location.origin), 10);
  };

  return [notify, emit.subscribe] as const;
}
