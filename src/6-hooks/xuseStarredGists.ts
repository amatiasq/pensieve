import { useEffect, useState } from 'react';

import {
  onGistChanged,
  onGistListchanged,
  onGistStarChanged
} from '../2-github/github_api';
import {
  fetchAndSaveStarredGists,
  getStarredGistIds
} from '../2-github/github_star';
import { RawGist } from '../2-github/RawGist';
import { Gist } from '../3-gist/Gist';
import { getExistingGistsFromStorage } from '../3-gist/gist-storage';
import { gistComparer } from '../3-gist/gistComparer';
import { updateArrayItem } from '../util/updateArrayItem';

const stored: Gist[] | null = null;

getExistingGistsFromStorage(getStarredGistIds()).then(stored);

export function useStarredGists() {
  const [list, setList] = useState<Gist[]>([]);

  useEffect(() => onGistChanged(updateSingleGist));
  useEffect(() => onGistListchanged(fetch));
  useEffect(() => onGistStarChanged(fetch));

  // Initial request
  useEffect(fetch as () => void, []);

  return list || stored;

  function updateSingleGist(raw: RawGist) {
    setList(updateArrayItem(list, new Gist(raw), gistComparer));
  }

  function fetch() {
    fetchAndSaveStarredGists().then(list =>
      setList(list.map(x => new Gist(x))),
    );
  }
}
