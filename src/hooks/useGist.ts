import { useEffect, useState } from 'react';
import { GistId } from '../contracts/type-aliases';
import { Gist } from '../model/Gist';
import { gists } from '../model/GistRepository';

export function useGist(id: GistId) {
  const stored = gists.getById(id);

  const [cache, setCache] = useState<Gist | null>(
    stored?.hasContent ? stored : null,
  );

  console.log({ cache });

  useEffect(() => {
    gists.fetchById(id).then(setCache);
  }, [id]);

  return cache;
}
