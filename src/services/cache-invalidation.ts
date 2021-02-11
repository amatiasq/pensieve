import { emitter } from '@amatiasq/emitter';
import { RawGistDetails } from '../contracts/RawGist';

export const GIST_CHANGED = 'GIST_CHANGED' as const;
export const LIST_CHANGED = 'LIST_CHANGED' as const;

interface GistChangedEvent {
  type: typeof GIST_CHANGED;
  data: RawGistDetails;
}

interface GistListChangedEvent {
  type: typeof LIST_CHANGED;
  data?: never;
}

type CacheEvent = GistChangedEvent | GistListChangedEvent;

const emitters = {
  [GIST_CHANGED]: emitter<RawGistDetails>(),
  [LIST_CHANGED]: emitter<void>(),
} as const;

window.addEventListener('message', (event: MessageEvent<CacheEvent>) => {
  const emitter = emitters[event.data.type];

  if (emitter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emitter(event.data.data as any);
  }
});

const notify = (message: CacheEvent) =>
  setTimeout(() => postMessage(message, location.origin), 10);

export const notifyGistListChanged = () => notify({ type: LIST_CHANGED });

export const onGistListchanged = (listener: () => void) =>
  emitters[LIST_CHANGED].subscribe(listener);

export const notifyGistChanged = (raw: RawGistDetails) =>
  notify({ type: GIST_CHANGED, data: raw });

export const onGistChanged = (listener: (raw: RawGistDetails) => void) =>
  emitters[GIST_CHANGED].subscribe(listener);
