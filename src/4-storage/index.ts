import localforage from 'localforage';

import { GHRepositoryApi } from '../3-github/GHRepositoryApi';
import { GithubToken } from '../3-github/GithubAuth';
import { AppStorage } from './AppStorage';
import { CachedStore } from './middleware/CachedStore';
import { ForageStore } from './middleware/ForageStore';
import { GHRepoStore } from './middleware/GHRepoStore';
// import { LocalStore } from './middleware/LocalStore';
import { MixedStore } from './middleware/MixedStore';
import { ResilientOnlineStore } from './middleware/ResilientOnlineStore';

Object.assign(window, { localforage });

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
  const store = new CachedStore(notes);

  const storage = new AppStorage(store);

  if (await repo.createIfNecessary('Database for notes', true)) {
    // repo.commit('Initial commit', storage.getInitialData());
  }

  return storage;
}
