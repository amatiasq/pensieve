import { useEffect, useState } from 'react';

import { GistId } from '../contracts/type-aliases';
import { onPageVisibilityChange as onVisibility } from '../dom/page-visibility';
import { Gist } from '../model/Gist';
import { onGistChanged } from '../services/cache-invalidation';
import { fetchGist } from '../services/github_api';
import { Stopwatch } from '../util/Stopwatch';
import { useSetting } from './useSetting';

export function useGist(id: GistId) {
  const [value, setValue] = useState<Gist | null>(null);

  const [reloadAfter] = useSetting('reloadIfAwayForSeconds');
  const away = new Stopwatch();

  useEffect(() => {
    let cached: Gist | null = null;
    let fetched: Gist | null = null;
    const onData = () => setValue(fetched || cached);

    Gist.getById(id).then(x => {
      cached = x;
      onData();
    });

    fetchGist(id).then(x => {
      fetched = new Gist(x);
      onData();
    });

    return onGistChanged(raw => {
      if (raw.id === id) {
        setValue(new Gist(raw));
      }
    });
  }, [id]);

  useEffect(() =>
    onVisibility(isVisible => {
      if (!isVisible) {
        away.start();
        return;
      }

      if (reloadAfter && away.seconds > reloadAfter) {
        value?.reload().then(updated => {
          if (!updated.isIdentical(value)) {
            setValue(updated);
          }
        });
      }

      away.stop();
    }),
  );

  return value;
}
