import { NotesStorage } from './NotesStorage';

export class AppStorage extends NotesStorage {
  constructor(
    readonly username: string,
    ...rest: ConstructorParameters<typeof NotesStorage>
  ) {
    super(...rest);
  }
}
