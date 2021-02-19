import { useEffect, useState } from 'react';

import { GistId } from '../2-github/type-aliases';
import { getGist } from '../3-gist/getGist';
import { Gist } from '../3-gist/Gist';
import { onGistWithIdChanged } from '../3-gist/onGistIdChange';
import { onPageVisibilityChange } from '../4-dom/page-visibility';
import { Stopwatch } from '../util/Stopwatch';
import { useSetting } from './useSetting';

export function useGist(id: GistId) {
  const [value, setValue] = useState<Gist | null>(null);

  const [reloadAfterSeconds] = useSetting('reloadIfAwayForSeconds');

  useEffect(() => {
    getGist(id).then(setValue);
    return onGistWithIdChanged(id, setValue);
  }, [id]);

  useEffect(() =>
    whenBackAfterSeconds(reloadAfterSeconds, async () => {
      if (!value) return;

      const updated = await value.reload();

      if (updated && !updated.isIdentical(value)) {
        setValue(updated);
      }
    }),
  );

  return value;
}

const away = new Stopwatch();

function whenBackAfterSeconds(seconds: number, listener: () => void) {
  return onPageVisibilityChange(isVisible => {
    if (!isVisible) {
      away.start();
      return;
    }

    if (seconds && away.seconds > seconds) {
      listener();
    }

    away.stop();
  });
}
