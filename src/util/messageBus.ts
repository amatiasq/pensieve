/* eslint-disable @typescript-eslint/no-explicit-any */

import { Emitter, emitter } from '@amatiasq/emitter';

const emitters: Record<string, Emitter<any>> = {};

window.addEventListener('message', (event: MessageEvent<any>) => {
  const emitter = emitters[event.data.type];

  if (typeof emitter === 'function') {
    emitter(event.data);
  }
});

// const [notifySettingsChanged, onSettingsChanged] = messageBus(
//   'SETTINGS_CHANGED',
//   () => ({
//     type: 'SETTINGS_CHANGED' as const,
//     data: undefined,
//   }),
// );

export function messageBus<Data = undefined>(key: string) {
  const emit = emitter<Data>();
  emitters[key] = emit;

  const notify = (data: Data) => {
    setTimeout(() => postMessage({ type: key, data }, location.origin), 10);
  };

  return [
    notify as RemoveUndefinedArguments<typeof notify>,
    emit.subscribe as (
      listener: RemoveUndefinedArguments<(data: Data) => void>,
    ) => () => void,
  ] as const;
}

type RemoveUndefinedArguments<
  T extends (x: any) => U,
  U = ReturnType<T>
> = T extends (x: undefined) => U ? () => U : T;
