import { RawGistFileDetails, RawGistFile } from '../contracts/RawGistFile';
import { updateGist } from '../services/github_api';
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

  constructor(
    private readonly gist: Gist,
    private raw: RawGistFile | RawGistFileDetails,
  ) {}

  setData(raw: RawGistFile | RawGistFileDetails) {
    this.checkNotDisposed();
    this.raw = raw;
    return this;
  }

  rename(newName: string) {
    this.checkNotDisposed();

    if (this.name === newName) {
      console.log(`File name is already "${newName}"`);
      return Promise.reject(`File name is already "${newName}"`);
    }

    return updateGist(this.gist.id, {
      files: {
        [this.name]: { filename: newName },
      },
    }).then(() => this.update());
  }

  setContent(content: string) {
    this.checkNotDisposed();

    if (this.content === content) {
      console.log(`File content is already "${content}"`);
      return Promise.reject(`File content is already "${content}"`);
    }

    return updateGist(this.gist.id, {
      files: {
        [this.name]: { content },
      },
    }).then(() => this.update());
  }

  dispose() {
    this.isDisposed = true;
  }

  private update() {
    this.gist.fetch();
  }

  private checkNotDisposed() {
    if (this.isDisposed) {
      throw new Error(`File ${this.name} is already disposed`);
    }
  }
}
