import { GithubUsername } from '../3-github/models/GHApiUser';
import { NotesStorage } from './NotesStorage';

export class AppStorage extends NotesStorage {
  constructor(
    readonly username: GithubUsername,
    ...rest: ConstructorParameters<typeof NotesStorage>
  ) {
    super(...rest);
  }
}
