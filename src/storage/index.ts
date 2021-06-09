import localforage from 'localforage';

import { CachedStore } from './CachedStore';
import { ForageStore } from './ForageStore';
import { GHRepositoryApi } from './gh/GHRepositoryApi';
import { GithubToken } from './gh/GithubApi';
import { GHRepoStore } from './GHRepoStore';
// import { LocalStore } from './LocalStore';
import { MixedStore } from './MixedStore';
import { ResilientOnlineStore } from './ResilientOnlineStore';

Object.assign(window, { localforage });

export function createStore(token: GithubToken, username: string, repoName: string) {
  const repo = new GHRepositoryApi(token, username, repoName);

  // const local = new LocalStore(repoName);
  const local = new ForageStore(localforage.createInstance({ name: repoName }));
  const repoStore = new GHRepoStore(repo);
  const resilient = new ResilientOnlineStore(repoStore);
  const notes = new MixedStore(local, resilient);
  const store = new CachedStore(notes);

  return store;
}
