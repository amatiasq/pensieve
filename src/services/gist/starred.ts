import localforage from 'localforage';
import { useEffect, useState } from 'react';

import { ClientStorage, ClientStore } from '@amatiasq/client-storage';

import { RawGist } from '../../contracts/RawGist';
import { GistId } from '../../contracts/type-aliases';
import { Gist } from '../../model/Gist';
import { mergeSortedLists } from '../../util/mergeSortedLists';
import { updateArrayItem } from '../../util/updateArrayItem';
import {
  fetchStarredGists,
  onGistChanged,
  onGistListchanged,
  onGistStarChanged,
  starGist,
  unstarGist
} from '../github_api';

const storedIds = new ClientStorage<GistId[]>('bg.starred', {
  default: [],
  store: localforage as ClientStore<GistId[]>,
});

const storage = storedIds.transform<Gist[]>({
  default: [],
  transform: list => Gist.getAllById(list),
  revert: list => list.map(x => x.id),
});

const ids = () => new Set(storedIds.cache);

export const isGistStarred = (id: GistId) => ids().has(id);

export function useStar(id: GistId) {
  const [isStarred, setIsStarred] = useState(isGistStarred(id));
  const update = () => setIsStarred(isGistStarred(id));

  useEffect(update, [id]);

  useEffect(() =>
    onGistStarChanged(changedId => {
      if (changedId === id) {
        update();
      }
    }),
  );

  return isStarred;
}

export function useStarredGists() {
  const [list, setList] = useState<Gist[]>([]);

  const fetch = () =>
    featchStarred().then(list => setList(list.map(x => new Gist(x))));

  useEffect(() => updateStorage(list), [list]);
  useEffect(() => onGistChanged(updateSingleGist));
  useEffect(() => onGistListchanged(() => fetch()));
  useEffect(() => onGistStarChanged(() => fetch()));

  // Initial request
  useEffect(fetch as () => void, []);

  return list || storage.cache;

  function updateSingleGist(raw: RawGist) {
    setList(updateArrayItem(list, new Gist(raw), Gist.comparer));
  }

  function updateStorage(incoming: Gist[]) {
    if (storedIds.isLoading) {
      return;
    }

    const result = mergeSortedLists(storage.cache, incoming, Gist.comparer);

    if (result !== storage.cache) {
      storage.set(result);
    }
  }
}

function featchStarred() {
  return fetchStarredGists().then(response => {
    storedIds.set(response.map(x => x.id));
    return response;
  });
}

export function setGistStarred(id: GistId, isStarred: boolean) {
  const all = ids();
  const currentlyStarred = all.has(id);

  console.log({ all });

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

  storedIds.set([...all]);
  return operation(id);
}
