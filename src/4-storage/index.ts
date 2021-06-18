import localforage from 'localforage';

import { GHRepositoryApi } from '../3-github/GHRepositoryApi';
import { GithubToken } from '../3-github/GithubAuth';
import { AsyncStore } from './AsyncStore';
import { CachedStore } from './middleware/CachedStore';
import { ForageStore } from './middleware/ForageStore';
import { GHRepoStore } from './middleware/GHRepoStore';
import { MixedStore } from './middleware/MixedStore';
import { ResilientOnlineStore } from './middleware/ResilientOnlineStore';
import { ShortcutStore } from './middleware/ShortcutStore';

Object.assign(window, { localforage });

type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export type FinalStore = UnPromisify<ReturnType<typeof createStore>>;
export type FinalReadOptions = FinalStore extends AsyncStore<infer R, unknown>
  ? R
  : never;

export type FinalWriteOptions = FinalStore extends AsyncStore<unknown, infer W>
  ? W
  : never;

export async function createStore(
  token: GithubToken,
  username: string,
  repoName: string,
) {
  const repo = new GHRepositoryApi(token, username, repoName);

  if (await repo.createIfNecessary('Database for notes', true)) {
    // repo.commit('Initial commit', storage.getInitialData());
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

  // Adds onChange method triggered on every write
  const shortcut = new ShortcutStore(mixed);

  return shortcut;
}
