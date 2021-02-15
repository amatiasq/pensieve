import { ClientStorage } from '@amatiasq/client-storage';

import { GistId } from '../contracts/type-aliases';
import { fetchStarredGists, starGist, unstarGist } from './github_api';

const storage = new ClientStorage<GistId[]>('gists.starred', {
  default: [],
});

const read = () => new Set(storage.get()!);

export function isGistStarred(id: GistId) {
  return read().has(id);
}

export function setGistStarred(id: GistId, isStarred: boolean) {
  const all = read();
  const currentlyStarred = all.has(id);

  if (currentlyStarred === isStarred) {
    return Promise.resolve();
  }

  let operation: (id: GistId) => Promise<unknown>;

  if (isStarred) {
    all.add(id);
    operation = starGist;
  } else {
    all.delete(id);
    operation = unstarGist;
  }

  storage.set([...all]);
  return operation(id);
}

export function featchStarred() {
  return fetchStarredGists().then(response => {
    storage.set(response.map(x => x.id));
    return response;
  });
}
