import localforage from 'localforage';

import { ClientStorage, ClientStore } from '@amatiasq/client-storage';

import { fetchStarredGists, starGist, unstarGist } from './github_api';
import { GistId } from './type-aliases';

const storedIds = new ClientStorage<GistId[]>('bg.starred', {
  default: [],
  store: localforage as ClientStore<GistId[]>,
});

const ids = () => new Set(storedIds.cache);

export const getStarredGistIds = () => storedIds.cache;

export async function fetchAndSaveStarredGists() {
  const response = await fetchStarredGists();
  storedIds.set(response.map(x => x.id));
  return response;
}

export const isGistStarred = (id: GistId) => ids().has(id);

export async function setGistStarred(id: GistId, isStarred: boolean) {
  const all = ids();
  const currentlyStarred = all.has(id);

  if (currentlyStarred === isStarred) {
    return;
  }

  let operation: (id: GistId) => Promise<unknown>;

  if (isStarred) {
    all.add(id);
    operation = starGist;
  } else {
    all.delete(id);
    operation = unstarGist;
  }

  storedIds.set([...all]);
  return operation(id);
}
