import { fromAsync } from '../../util/rxjs-extensions';
import { AsyncStore } from '../AsyncStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GithubGists = any;

// THIS IS JUST PLACEHOLDER
export class GHGistStore implements AsyncStore {
  constructor(private readonly gists: GithubGists) {}

  async keys() {
    return this.gists.listAll();
  }

  has(key: string): Promise<boolean> {
    return this.gists.exists(key);
  }

  read(key: string) {
    return fromAsync(async () => {
      const file = await this.gists.read(key);
      return file.content;
    });
  }

  write(key: string, value: string) {
    return this.gists.write(key, value);
  }

  async delete(key: string) {
    return this.gists.delete(key);
  }
}
