import { RawGistDetails } from '../contracts/RawGist';

export const GIST_CHANGED = 'GIST_CHANGED' as const;
export const GIST_CREATED = 'GIST_CREATED' as const;

interface GistChangedEvent {
  type: typeof GIST_CHANGED;
  raw: RawGistDetails;
}

interface GistListChangedEvent {
  type: typeof GIST_CREATED;
}

type CacheEvent = GistChangedEvent | GistListChangedEvent;

export function notifyGistChanged(raw: RawGistDetails) {
  postMessage({ type: GIST_CHANGED, raw } as GistChangedEvent, location.origin);
}

export function notifyGistListChanged() {
  postMessage({ type: GIST_CREATED } as GistListChangedEvent, location.origin);
}

export function onGistChanged(listener: (raw: RawGistDetails) => void) {
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);

  function handler(event: MessageEvent<CacheEvent>) {
    if (event.data.type === GIST_CHANGED) {
      listener(event.data.raw);
    }
  }
}

export function onGistListchanged(listener: () => void) {
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);

  function handler(event: MessageEvent<CacheEvent>) {
    if (event.data.type === GIST_CREATED) {
      listener();
    }
  }
}
