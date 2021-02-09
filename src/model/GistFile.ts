import { RawGistFileDetails, RawGistFileItem } from '../contracts/RawGistFile';
import { Gist } from './Gist';

export class GistFile {
  private isDisposed = false;

  get url() {
    return this.raw.raw_url;
  }
  get name() {
    return this.raw.filename;
  }
  get type() {
    return this.raw.type;
  }
  get language() {
    return this.raw.language;
  }
  get size() {
    return this.raw.size;
  }

  get truncated() {
    if (!('truncated' in this.raw)) {
      throw new Error(`Accessing ${this.name} before fetching it's data`);
    }

    return this.raw.truncated;
  }

  get content() {
    if (!('content' in this.raw)) {
      throw new Error(`Accessing ${this.name} before fetching it's data`);
    }

    return this.raw.content;
  }

  get isContentLoaded() {
    return 'content' in this.raw;
  }

  get path() {
    return `/${this.gist.id}/${this.name}`;
  }

  get isOnlyFile() {
    return this.gist.files.length === 1;
  }

  constructor(
    private readonly gist: Gist,
    private raw: RawGistFileItem | RawGistFileDetails,
  ) {}

  setData(raw: RawGistFileItem | RawGistFileDetails) {
    this.raw = { ...this.raw, ...raw };
    return this;
  }

  rename(newName: string) {
    if (this.name === newName) {
      console.log(`File name is already "${newName}"`);
      return Promise.reject(`File name is already "${newName}"`);
    }

    return this.gist
      .renameFile(this, newName)
      .then(x => x.getFileByName(newName) as GistFile);
  }

  setContent(content: string) {
    if (this.content === content) {
      console.log(`File content is already "${content}"`);
      return Promise.reject(`File content is already "${content}"`);
    }

    return this.gist
      .setFileContent(this, content)
      .then(x => x.getFileByName(this.name));
  }

  remove() {
    return this.gist.removeFile(this);
  }

  toJSON() {
    return this.raw;
  }
}
