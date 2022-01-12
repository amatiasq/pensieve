import localforage from 'localforage';
import { GHRepository } from '../3-github/GHRepository';
import { GithubToken } from '../3-github/GithubAuth';
import { AppStorage } from './AppStorage';
import { CachedStore } from './middleware/CachedStore';
import { ForageStore } from './middleware/ForageStore';
import { GHRepoStore } from './middleware/GHRepoStore';
import { MixedStore } from './middleware/MixedStore';
import { ResilientOnlineStore } from './middleware/ResilientOnlineStore';

Object.assign(window, { localforage });

export async function createStore(
  token: GithubToken,
  username: string,
  repoName: string,
) {
  const repo = new GHRepository(token, username, repoName);

  if (navigator.onLine) {
    const isNewRepository = repo
      .createIfNecessary('Database for notes', true)
      // We don't want the app to crash if this doesn't work
      .catch(() => false);

    if (await isNewRepository) {
      window.location.reload();
    }
  }

  // const local = new LocalStore(repoName);
  const local = new ForageStore(localforage.createInstance({ name: repoName }));
  const repoStore = new GHRepoStore(repo);

  // Handles offline
  // - throws when reading
  // - queues write methods until online
  const resilient = new ResilientOnlineStore(repoStore);

  // Reads from remote, sends result to local
  // Writes are sent to both
  const mixed = new MixedStore(
    new CachedStore(local, 5, 'local'),
    new CachedStore(resilient, 30, 'remote'),
  );

  return new AppStorage(username, mixed);
}
