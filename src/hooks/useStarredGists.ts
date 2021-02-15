import { useEffect, useState } from 'react';

import { RawGist } from '../contracts/RawGist';
import { Gist } from '../model/Gist';
import {
  onGistChanged,
  onGistListchanged,
  onGistStarChanged
} from '../services/cache-invalidation';
import { featchStarred } from '../services/starred-gists';

export function useStarredGists() {
  const [cache, setCache] = useState<Gist[]>([]);

  useEffect(() => onGistChanged(updateSingleGist) as () => void);
  useEffect(() => onGistListchanged(() => fetch()) as () => void);
  useEffect(() => onGistStarChanged(() => fetch()) as () => void);

  // Initial request
  useEffect(fetch as () => void, []);

  return cache;

  function fetch() {
    return featchStarred().then(list => setCache(list.map(x => new Gist(x))));
  }

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
}
