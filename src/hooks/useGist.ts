import { useEffect, useState } from 'react';

import { GistId } from '../contracts/type-aliases';
import { Gist } from '../model/Gist';
import { onGistChanged } from '../services/cache-invalidation';
import { fetchGist } from '../services/github_api';

export function useGist(id: GistId) {
  const stored = Gist.getById(id);

  const [cache, setCache] = useState<Gist | null>(
    stored?.hasContent ? stored : null,
  );

  useEffect(() => {
    fetchGist(id).then(x => setCache(new Gist(x)));

    return onGistChanged(raw => {
      if (raw.id === id) {
        setCache(new Gist(raw));
      }
    });
  }, [id]);

  return cache;
}
