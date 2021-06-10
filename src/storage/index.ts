import localforage from 'localforage';

import { AppStorage } from './AppStorage';
import { GHRepositoryApi } from './gh/GHRepositoryApi';
import { GithubToken } from './gh/GithubApi';
import { CachedStore } from './middleware/CachedStore';
import { ForageStore } from './middleware/ForageStore';
import { GHRepoStore } from './middleware/GHRepoStore';
// import { LocalStore } from './middleware/LocalStore';
import { MixedStore } from './middleware/MixedStore';
import { ResilientOnlineStore } from './middleware/ResilientOnlineStore';

Object.assign(window, { localforage });

export function createStore(token: GithubToken, username: string, repoName: string) {
  const repo = new GHRepositoryApi(token, username, repoName);

  // const local = new LocalStore(repoName);
  const local = new ForageStore(localforage.createInstance({ name: repoName }));
  const repoStore = new GHRepoStore(repo);
  const resilient = new ResilientOnlineStore(repoStore);
  const notes = new MixedStore(local, resilient);
  const store = new CachedStore(notes);

  return new AppStorage(store);
}
