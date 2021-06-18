import { AsyncStore } from '../AsyncStore';

// THIS IS JUST PLACEHOLDER
// CODE NOT IN USE
export type GithubGists = any;

export class GHGistStore implements AsyncStore {
  constructor(private readonly gists: GithubGists) {}

  async keys() {
    return this.gists.listAll();
  }

  has(key: string): Promise<boolean> {
    return this.gists.exists(key);
  }

  async read(key: string) {
    const file = await this.gists.read(key);
    return file.content;
  }

  write(key: string, value: string) {
    return this.gists.write(key, value);
  }

  async delete(key: string) {
    return this.gists.delete(key);
  }
}
