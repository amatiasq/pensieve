import { GHRepository } from '../3-github/GHRepository.ts';
import { GithubToken } from '../3-github/GithubAuth.ts';
import { GithubUsername } from '../3-github/models/GHApiUser.ts';
import { CachedStore } from './middleware/CachedStore.ts';
import { createIdbStore } from './middleware/IdbStore.ts';
import { GHRepoStore } from './middleware/GHRepoStore.ts';
import { MixedStore } from './middleware/MixedStore.ts';
import { ResilientOnlineStore } from './middleware/ResilientOnlineStore.ts';
import { NotesStorage } from './NotesStorage.ts';

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

  const local = createIdbStore(repoName);
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

  return new NotesStorage(mixed, username);
}
