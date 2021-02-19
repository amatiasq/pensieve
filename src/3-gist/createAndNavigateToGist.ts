import { History } from 'history';

import { createGist } from '../2-github/github_api';
import { Gist } from './Gist';

export async function createAndNavigateToGist(history: History) {
  const raw = await createGist();
  const gist = new Gist(raw);
  history.push(gist.defaultFile.path);
  return gist;
}
