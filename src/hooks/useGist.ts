import { useEffect, useState } from 'react';
import { GistId } from '../contracts/type-aliases';
import { Gist } from '../model/Gist';
import { gists } from '../model/GistRepository';

export function useGist(id: GistId) {
  const [cache, setCache] = useState<Gist | null>(null);

  useEffect(() => {
    const sync = gists.getById(id);

    if (sync) {
      sync.fetch().then(setCache);
      return;
    }

    gists.fetchById(id).then(setCache);
  }, [id]);

  return cache;
}
