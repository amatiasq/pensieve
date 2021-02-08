import { RawGist, RawGistDetails } from '../contracts/RawGist';
import { fetchGist } from '../services/github_api';
import { GistFile } from './GistFile';

export class Gist {
  private _files: GistFile[] = [];

  get id() {
    return this.raw.id;
  }
  get url() {
    return this.raw.url;
  }
  get isPublic() {
    return this.raw.public;
  }
  get createdAt() {
    return new Date(this.raw.created_at);
  }
  get description() {
    return this.raw.description;
  }
  get files() {
    return this._files;
  }

  get date() {
    return this.raw.created_at.split('T')[0];
  }

  constructor(private raw: RawGist | RawGistDetails) {
    this.setData(raw);
  }

  getFile(name: string) {
    return this._files.find(x => x.name === name);
  }

  fetch() {
    return fetchGist(this.id).then(x => this.setData(x));
  }

  setData(raw: RawGist | RawGistDetails) {
    this.raw = raw;
    const old = this._files;

    this._files = Object.values(raw.files).map(file => {
      const existing = old.find(x => x.name === file.filename);
      return existing ? existing.setData(file) : new GistFile(this, file);
    });

    old.filter(x => !this._files.includes(x)).map(x => x.dispose());

    return this;
  }

  toJSON() {
    return this.raw;
  }
}
