import { History } from 'history';

import { createGist } from '../2-github/github_api';
import { getSetting } from '../5-app/settings';
import { Gist } from './Gist';

export async function createAndNavigateToGist(history: History) {
  const raw = await createGist();
  const gist = new Gist(raw);

  if (getSetting('starNewGists')) {
    await gist.toggleStar();
  }

  history.push(gist.defaultFile.path);
  return gist;
}
