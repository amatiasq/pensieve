import { useEffect, useState } from 'react';

import { Gist } from '../model/Gist';
import { gists } from '../model/GistRepository';

export function useGists(loadMore: boolean) {
  const [cache, setCache] = useState<Gist[]>(gists.all);

  useEffect(() => {
    if (!loadMore) {
      return;
    }

    if (!cache.length) {
      gists.fetchAll().then(setCache);
      return;
    }

    gists.fetchMore().then(setCache);
  }, [loadMore]);

  return cache;
}
