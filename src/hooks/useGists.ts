import { RawGist } from './../contracts/RawGist';
import { useEffect, useState } from 'react';

import { ClientStorage } from '@amatiasq/client-storage';

import { GistId } from '../contracts/type-aliases';
import { Gist } from '../model/Gist';
import {
  onGistChanged,
  onGistListchanged,
} from '../services/cache-invalidation';
import { fetchGists } from '../services/github_api';

const storage = new ClientStorage<GistId[]>('np.gist-order', {
  version: 2,
  default: [],
});

function getStored() {
  return storage.get() as GistId[];
}

export function useGists(loadMore: boolean) {
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
  useEffect(updateStorage, [cache]);

  // Update single gist when changes
  useEffect(() => onGistChanged(updateSingleGist));

  // Re-initialize list when gist are added / removed
  useEffect(() => onGistListchanged(() => fetch(1, [])));

  // If we have data then return it, otherwise return what's in local Storage
  return cache.length
    ? cache
    : (getStored()
        .map(x => Gist.getById(x))
        .filter(Boolean) as Gist[]);

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
      setCache([...prev, ...list.map(x => new Gist(x))]);
    });
  }

  function updateStorage() {
    const stored = getStored();
    let isObsolete = false;

    for (let i = 0; i < cache.length; i++) {
      if (stored[i] !== cache[i].id) {
        isObsolete = true;
        break;
      }
    }

    if (isObsolete) {
      storage.set(cache.map(x => x.id));
    }
  }
}
