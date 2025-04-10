import localforage from 'localforage';
import { GHRepository } from '../3-github/GHRepository.ts';
import { GithubToken } from '../3-github/GithubAuth.ts';
import { GithubUsername } from '../3-github/models/GHApiUser.ts';
import { AppStorage } from './AppStorage.ts';
import { CachedStore } from './middleware/CachedStore.ts';
import { ForageStore } from './middleware/ForageStore.ts';
import { GHRepoStore } from './middleware/GHRepoStore.ts';
import { MixedStore } from './middleware/MixedStore.ts';
import { ResilientOnlineStore } from './middleware/ResilientOnlineStore.ts';

Object.assign(window, { localforage });

export async function createStore(
  token: GithubToken,
  username: GithubUsername,
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
