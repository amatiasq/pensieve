import { fileExists, getAllFiles, getFileContent } from './fs';

export class Repository {
  get path() {
    return `/${this.user}/${this.name}`;
  }

  get url() {
    return `https://github.com${this.path}`;
  }

  constructor(public readonly user: string, public readonly name: string) {}

  getFiles() {
    return getAllFiles(this.path);
  }

  hasFile(path: string) {
    return fileExists(`${this.path}/${path}`);
  }

  getFileContent(path: string) {
    return getFileContent(`${this.path}/${path}`);
  }
}
