import { useEffect, useState } from 'react';

import { ClientStorage } from '@amatiasq/client-storage';

import { RawGist } from '../contracts/RawGist';
import { GistId } from '../contracts/type-aliases';
import { Gist } from '../model/Gist';
import {
  onGistChanged,
  onGistListchanged
} from '../services/cache-invalidation';
import { fetchGists } from '../services/github_api';
import { setTopGists } from '../services/settings';
import { useSetting } from './useSetting';

let stored: Gist[] | null = null;
const storage = new ClientStorage<GistId[]>('gists.order', {
  default: [],
});

getStoredFromCache();

export function useGists(loadMore: boolean) {
  const [_, setUsername] = useSetting('username');
  const [page, setPage] = useState(0);
  const [cache, setCache] = useState<Gist[]>([]);

  // When asked to load more change the page to load
  useEffect(() => {
    loadMore && setPage(page + 1);
  }, [loadMore]);

  // When page to load changes fetch more gists
  useEffect(() => {
    fetch(page, cache);
  }, [page]);

  // If data in chache doesn't match what's stored overwrite storage
  useEffect(() => updateStorage(cache), [cache]);

  // Update single gist when changes
  useEffect(() => onGistChanged(updateSingleGist) as () => void);

  // Re-initialize list when gist are added / removed
  useEffect(() => onGistListchanged(() => fetch(1, [])) as () => void);

  // If we have data then return it, otherwise return what's in local Storage
  const result = cache.length ? cache : stored;

  return setTopGists(result || []);

  function updateSingleGist(raw: RawGist) {
    const index = cache.findIndex(x => x.id === raw.id);

    if (index !== -1) {
      setCache([
        ...cache.slice(0, index),
        new Gist(raw),
        ...cache.slice(index + 1),
      ]);
    }
  }

  function fetch(page: number, prev: Gist[]) {
    return fetchGists(page).then(list => {
      const [first] = list;

      if (first?.owner) {
        setUsername(first.owner.login);
      }

      setCache([...prev, ...list.map(x => new Gist(x))]);
    });
  }
}

function getStoredFromCache() {
  const ids = storage.get() as GistId[];

  return Promise.all(ids.map(x => Gist.getById(x)))
    .then(result => result.filter(Boolean) as Gist[])
    .then(result => (stored = result));
}

// merges incomming with the stored list of IDs
function updateStorage(incoming: Gist[]) {
  if (stored === null) {
    return;
  }

  const result: Gist[] = [];
  let isObsolete = false;

  // eslint-disable-next-line no-constant-condition
  for (let ii = 0, si = 0; true; ii++) {
    // end of stored
    if (si === stored.length) {
      isObsolete = true;
      result.push(...incoming.slice(ii));
      break;
    }

    // end of incoming
    if (ii === incoming.length) {
      result.push(...stored.slice(si));
      break;
    }

    result.push(incoming[ii]);

    // happy path
    if (stored[si].id === incoming[ii].id) {
      si++;
      continue;
    }

    isObsolete = true;

    // search the missing-existing entry in stored
    const exists = stored.findIndex(x => x.id === incoming[ii].id);

    // item found at ${exists}
    if (exists !== -1) {
      si = exists + 1;
    }

    // if doesn't exists then it's new
  }

  if (isObsolete) {
    storage.set(result.map(x => x.id));
    getStoredFromCache();
  }
}
