import { useEffect, useState } from 'react';

import { GistId } from '../contracts/type-aliases';
import { onGistStarChanged } from '../services/cache-invalidation';
import { isGistStarred } from '../services/starred-gists';

export function useStar(id: GistId) {
  const [isStarred, setIsStarred] = useState(isGistStarred(id));
  const update = () => setIsStarred(isGistStarred(id));

  useEffect(
    () =>
      onGistStarChanged(changedId => {
        if (changedId === id) {
          update();
        }
      }) as () => void,
  );

  useEffect(() => {
    update();
  }, [id]);

  return isStarred;
}
