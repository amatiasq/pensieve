/* eslint-disable @typescript-eslint/no-explicit-any */

import { Emitter, emitter } from '@amatiasq/emitter';

import { RawGistDetails } from '../contracts/RawGist';
import { GistId } from '../contracts/type-aliases';

const emitters: Record<string, Emitter<any>> = {};

export const [notifyGistListChanged, onGistListchanged] = getFunctions(
  'LIST_CHANGED',
  () => ({
    type: 'LIST_CHANGED' as const,
    data: undefined,
  }),
);

export const [notifyGistChanged, onGistChanged] = getFunctions(
  'GIST_CHANGED',
  (raw: RawGistDetails) => ({
    type: 'GIST_CHANGED' as const,
    data: raw,
  }),
);

export const [notifyGistStarChanged, onGistStarChanged] = getFunctions(
  'GIST_STAR_CHANGED',
  (id: GistId) => ({
    type: 'GIST_STAR_CHANGED' as const,
    data: id,
  }),
);

export const [notifySettingsChanged, onSettingsChanged] = getFunctions(
  'SETTINGS_CHANGED',
  () => ({
    type: 'SETTINGS_CHANGED' as const,
    data: undefined,
  }),
);

// ---

window.addEventListener('message', (event: MessageEvent<any>) => {
  const emitter = emitters[event.data.type];

  if (typeof emitter === 'function') {
    emitter(event.data.data);
  }
});

function getFunctions<Key extends string, Data>(
  key: Key,
  createEvent: (data: Data) => { type: Key; data: Data },
) {
  const emit = emitter<Data>();
  emitters[key] = emit;

  const notify = (data: Data) => {
    setTimeout(() => postMessage(createEvent(data), location.origin), 10);
  };

  return [
    notify as RemoveUndefinedArguments<typeof notify>,
    emit.subscribe,
  ] as const;
}

type RemoveUndefinedArguments<
  T extends (x: any) => U,
  U = ReturnType<T>
> = T extends (x: undefined) => U ? () => U : T;
