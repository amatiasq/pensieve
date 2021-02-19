import localforage from 'localforage';

import { compressGist } from '../2-github/compressGist';
import { mergeGist } from '../2-github/mergeGist';
import { RawGist } from '../2-github/RawGist';
import { GistId } from '../2-github/type-aliases';
import { Gist } from './Gist';

const storage = localforage.createInstance({ name: 'bg.cache' });

let loadingFromStorage = false;

export async function saveGistToStorage(gist: RawGist | Gist) {
  if (loadingFromStorage) {
    return;
  }

  const { id } = gist;
  const raw = gist instanceof Gist ? gist.toJSON() : gist;

  const existing = await storage.getItem<RawGist>(id);
  const newEntry = existing ? mergeGist(existing, raw) : raw;

  return storage.setItem(id, compressGist(newEntry));
}

export async function getGistFromStorage(id: GistId) {
  const raw = await storage.getItem<RawGist>(id);
  if (!raw) return null;

  loadingFromStorage = true;
  const gist = new Gist(raw);
  loadingFromStorage = false;
  return gist;
}

export async function getExistingGistsFromStorage(ids: GistId[]) {
  const list = await Promise.all(ids.map(getGistFromStorage));
  return list.filter(Boolean) as Gist[];
}
