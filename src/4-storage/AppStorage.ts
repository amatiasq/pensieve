import { GithubUsername } from '../3-github/models/GHApiUser.ts';
import { NotesStorage } from './NotesStorage.ts';

export class AppStorage extends NotesStorage {
  constructor(
    readonly username: GithubUsername,
    ...rest: ConstructorParameters<typeof NotesStorage>
  ) {
    super(...rest);
  }
}
