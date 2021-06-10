import localforage from 'localforage';
import { useEffect, useState } from 'react';

import { ClientStorage, ClientStore } from '@amatiasq/client-storage';

import {
  fetchGists,
  onGistChanged,
  onGistListchanged
} from '../2-github/github_api';
import { RawGist } from '../2-github/RawGist';
import { GistId } from '../2-github/type-aliases';
import { Gist } from '../3-gist/Gist';
import { getExistingGistsFromStorage } from '../3-gist/gist-storage';
import { gistComparer } from '../3-gist/gistComparer';
import { removeSettingsGistFrom } from '../5-app/settings';
import { mergeSortedLists } from '../util/mergeSortedLists';
import { updateArrayItem } from '../util/updateArrayItem';
import { useMemory } from './useMemory';

const storage = new ClientStorage<GistId[]>('bg.list', {
  default: [],
  store: localforage as ClientStore<GistId[]>,
}).transform<Gist[]>({
  transform: getExistingGistsFromStorage,
  revert: list => list.map(x => x.id),
  default: [],
});

export function useGistList(loadMore: boolean) {
  const [page, setPage] = useState(0);
  const [list, setList] = useState<Gist[]>([]);

  const [, setUsername] = useMemory('username');

  // When asked to load more fetch more gists
  useEffect(() => {
    loadMore && fetch(page + 1, list);
  }, [loadMore]);

  useEffect(() => updateStorage(list), [list]);
  useEffect(() => onGistChanged(updateSingleGist));
  useEffect(() => onGistListchanged(() => fetch(1, [])));

  const result = list.length ? list : storage.cache;
  return removeSettingsGistFrom(result);

  function fetch(page: number, current: Gist[]) {
    return fetchGists(page).then(list => {
      readUsernameFrom(list);
      setPage(page);
      setList([...current, ...list.map(x => new Gist(x))]);
    });
  }

  function updateSingleGist(raw: RawGist) {
    setList(updateArrayItem(list, new Gist(raw), gistComparer));
  }

  function readUsernameFrom([first]: RawGist[]) {
    if (first?.owner) {
      setUsername(first.owner.login);
    }
  }
}

function updateStorage(incoming: Gist[]) {
  if (storage.isLoading) {
    return;
  }

  const result = mergeSortedLists(storage.cache, incoming, gistComparer);

  if (result !== storage.cache) {
    storage.set(result);
  }
}
