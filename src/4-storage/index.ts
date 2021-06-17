import localforage from 'localforage';

import { GHRepositoryApi } from '../3-github/GHRepositoryApi';
import { GithubToken } from '../3-github/GithubAuth';
import { AsyncStore } from './AsyncStore';
import { CachedStore } from './middleware/CachedStore';
import { ForageStore } from './middleware/ForageStore';
import { GHRepoStore } from './middleware/GHRepoStore';
// import { LocalStore } from './middleware/LocalStore';
import { MixedStore } from './middleware/MixedStore';
import { ResilientOnlineStore } from './middleware/ResilientOnlineStore';
import { ShortcutStore } from './middleware/ShortcutStore';

Object.assign(window, { localforage });

type UnPromisify<T> = T extends Promise<infer U> ? U : T;

export type FinalStore = UnPromisify<ReturnType<typeof createStore>>;

export type FinalReadOptions = FinalStore extends AsyncStore<infer R, infer W>
  ? R
  : never;

export type FinalWriteOptions = FinalStore extends AsyncStore<infer R, infer W>
  ? W
  : never;

export async function createStore(
  token: GithubToken,
  username: string,
  repoName: string,
) {
  const repo = new GHRepositoryApi(token, username, repoName);

  // const local = new LocalStore(repoName);
  const local = new ForageStore(localforage.createInstance({ name: repoName }));
  const repoStore = new GHRepoStore(repo);
  const resilient = new ResilientOnlineStore(repoStore);
  const notes = new MixedStore(local, resilient);
  const cached = new CachedStore(notes);
  const shortcut = new ShortcutStore(cached);

  if (await repo.createIfNecessary('Database for notes', true)) {
    // repo.commit('Initial commit', storage.getInitialData());
  }

  return shortcut;
}
