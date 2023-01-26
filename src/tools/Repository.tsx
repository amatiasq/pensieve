import { getCredentials, key } from '../hooks/useGitRepo';
import { clone } from './git';
import { getAllFiles, mkdirRecursive } from './git.fs';

export class Repository {
  get path() {
    return key(this.user, this.name);
  }

  constructor(public readonly user: string, public readonly name: string) {}

  async clone() {
    console.log('Create dir', this.path);
    await mkdirRecursive(this.path);

    console.log('Clone', this.path, `https://github.com${this.path}`);
    await clone({
      dir: this.path,
      url: `https://github.com${this.path}`,
      singleBranch: true,
      depth: 1,
      onAuth: (url) => getCredentials(this.user) ?? { cancel: true },
    });

    console.log('Done', this.path);
  }

  getFiles() {
    return getAllFiles(this.path);
  }
}
