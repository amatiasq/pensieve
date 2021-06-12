// THIS IS JUST PLACEHOLDER

import { AsyncStore } from '../AsyncStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GithubGists = any;

export class GHGistStore implements AsyncStore {
  constructor(private readonly gists: GithubGists) {}

  async keys() {
    return this.gists.listAll();
  }

  has(key: string): Promise<boolean> {
    return this.gists.exists(key);
  }

  async readText(key: string) {
    const file = await this.gists.read(key);
    return file.content;
  }

  async read<T>(key: string) {
    const file = await this.gists.read(key);
    const value = JSON.parse(file.content);
    return value as T;
  }

  writeText(key: string, value: string) {
    return this.gists.write(key, value);
  }

  write<T>(key: string, value: T) {
    const json = JSON.stringify(value, null, 2);
    return this.gists.write(key, json);
  }

  async delete(key: string) {
    return this.gists.delete(key);
  }
}
