import localforage from 'localforage';
import { useEffect, useState } from 'react';

import { ClientStorage, ClientStore } from '@amatiasq/client-storage';

import { RawGist } from '../../contracts/RawGist';
import { GistId } from '../../contracts/type-aliases';
import { useSetting } from '../../hooks/useSetting';
import { Gist } from '../../model/Gist';
import { mergeSortedLists } from '../../util/mergeSortedLists';
import { updateArrayItem } from '../../util/updateArrayItem';
import { fetchGists, onGistChanged, onGistListchanged } from '../github_api';
import { setTopGists } from '../settings';

const storage = new ClientStorage<GistId[]>('bg.list', {
  default: [],
  store: localforage as ClientStore<GistId[]>,
}).transform<Gist[]>({
  transform: list => Gist.getAllById(list),
  revert: list => list.map(x => x.id),
  default: [],
});

export function useGistList(loadMore: boolean) {
  const [page, setPage] = useState(0);
  const [list, setList] = useState<Gist[]>([]);

  const [, setUsername] = useSetting('username');

  // When asked to load more fetch more gists
  useEffect(() => {
    loadMore && fetch(page + 1, list);
  }, [loadMore]);

  useEffect(() => updateStorage(list), [list]);
  useEffect(() => onGistChanged(updateSingleGist));
  useEffect(() => onGistListchanged(() => fetch(1, [])));

  const result = list.length ? list : storage.cache;
  return setTopGists(result);

  function fetch(page: number, current: Gist[]) {
    return fetchGists(page).then(list => {
      readUsernameFrom(list);
      setPage(page);
      setList([...current, ...list.map(x => new Gist(x))]);
    });
  }

  function updateSingleGist(raw: RawGist) {
    setList(updateArrayItem(list, new Gist(raw), Gist.comparer));
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

  const result = mergeSortedLists(storage.cache, incoming, Gist.comparer);

  if (result !== storage.cache) {
    storage.set(result);
  }
}
