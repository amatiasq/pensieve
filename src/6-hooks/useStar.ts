import { useEffect, useState } from 'react';

import { onGistStarChanged } from '../2-github/github_api';
import { isGistStarred } from '../2-github/github_star';
import { GistId } from '../2-github/type-aliases';

export function useStar(id: GistId) {
  const [isStarred, setIsStarred] = useState(isGistStarred(id));
  const update = () => setIsStarred(isGistStarred(id));

  useEffect(update, [id]);

  useEffect(() =>
    onGistStarChanged(changedId => {
      if (changedId === id) {
        update();
      }
    }),
  );

  return isStarred;
}
