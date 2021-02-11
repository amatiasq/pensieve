import { useEffect, useState } from 'react';

import { GistId } from '../contracts/type-aliases';
import { Gist } from '../model/Gist';
import { onGistChanged } from '../services/cache-invalidation';
import { fetchGist } from '../services/github_api';
import { onPageVisibilityChange as onVisibility } from '../util/page-visibility';
import { Stopwatch } from '../util/Stopwatch';

export function useGist(id: GistId) {
  const stored = Gist.getById(id);

  const stopwatch = new Stopwatch();
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

  useEffect(() => {
    const unsubscribe = onVisibility(isVisible => {
      if (!isVisible) {
        stopwatch.start();
        return;
      }

      if (stopwatch.stop('seconds') > 5) {
        return cache?.reload().then(updated => {
          if (!updated.isIdentical(cache)) {
            setCache(updated);
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  });

  return cache;
}
