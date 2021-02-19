import { onGistChanged } from '../2-github/github_api';
import { GistId } from '../2-github/type-aliases';
import { Gist } from './Gist';

export function onGistWithIdChanged(
  id: GistId,
  listener: (gist: Gist) => void,
) {
  return onGistChanged(raw => {
    if (raw.id === id) {
      listener(new Gist(raw));
    }
  });
}
