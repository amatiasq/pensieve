import { useEffect, useState } from 'react';

import { Gist } from '../model/Gist';
import { gists } from '../model/GistRepository';

export function useGists(loadMore: boolean) {
  const [cache, setCache] = useState<Gist[]>(gists.getListFromCache());

  useEffect(() => {
    if (loadMore) {
      gists.fetchMore().then(setCache);
    }
  }, [loadMore]);

  return cache;
}
