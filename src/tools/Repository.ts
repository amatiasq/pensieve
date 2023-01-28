import { fileExists, getAllFiles, getFileContent } from './fs';

const join = (...paths: string[]) => paths.join('/').replace(/\/+/g, '/');

export class Repository {
  get path() {
    return '/' + join(this.user, this.name);
  }

  get url() {
    return `https://github.com${this.path}`;
  }

  constructor(public readonly user: string, public readonly name: string) {}

  getFiles() {
    return getAllFiles(this.path);
  }

  hasFile(path: string) {
    return fileExists(join(this.path, path));
  }

  getFileContent(path: string) {
    return getFileContent(join(this.path, path));
  }
}
