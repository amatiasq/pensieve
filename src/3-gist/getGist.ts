import { fetchGist, notifyGistChanged } from '../2-github/github_api';
import { RawGistDetails } from '../2-github/RawGist';
import { GistId } from '../2-github/type-aliases';
import { PromiseStatus } from '../util/PromiseStatus';
import { Gist } from './Gist';
import { getGistFromStorage } from './gist-storage';

export function getGist(id: GistId) {
  return new Promise<Gist | null>((resolve, reject) => {
    let result: Gist | null = null;

    const fetch = new PromiseStatus(
      fetchGist(id).then(raw => resolveWith(new Gist(raw)), reject),
    );

    getGistFromStorage(id).then(value => {
      if (value && fetch.isPending) {
        resolveWith(value);
      }
    });

    function resolveWith(value: Gist | null) {
      if (!result) {
        result = value;
        resolve(value);
        return;
      }

      if (!value) {
        console.warn(`Gist "${id}" was null second time`);
        return;
      }

      if (!result.isIdentical(value)) {
        notifyGistChanged(value.toJSON() as RawGistDetails);
      }
    }
  });
}
