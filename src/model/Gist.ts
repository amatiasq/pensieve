import localforage from 'localforage';

import { RawGist } from '../contracts/RawGist';
import { GistId, UserName } from '../contracts/type-aliases';
import { isGistStarred, setGistStarred } from '../services/gist/starred';
import {
  addGileToGist,
  createGist,
  DEFAULT_FILE_CONTENT,
  fetchGist,
  removeFileFromGist,
  removeGist,
  renameGistFile,
  setFileContent
} from '../services/github_api';
import { GistFile } from './GistFile';
import { mergeGist } from './mergeGist';

const storage = localforage.createInstance({ name: 'gists.cache' });

function saveToStorage(raw: RawGist) {
  return storage.getItem<RawGist>(raw.id).then(existing => {
    const newEntry = existing ? mergeGist(existing, raw) : raw;
    return storage.setItem(raw.id, compress(newEntry));
  });
}

export const DEFAULT_FILE_NAME = 'Filename.md';

export class Gist {
  static create() {
    return createGist().then(wrap);
  }

  static getById(id: GistId) {
    return storage.getItem<RawGist>(id).then(x => x && new Gist(x, true));
  }

  static getAllById(ids: GistId[]) {
    return Promise.all(ids.map(Gist.getById)).then(
      x => x.filter(Boolean) as Gist[],
    );
  }

  static comparer(a: Gist, b: Gist) {
    return a.id === b.id;
  }

  static getNewer(...gists: Gist[]) {
    let best = gists[0];

    gists.slice(1).forEach(x => {
      if (x.updatedAt > best.updatedAt) {
        best = x;
      }
    });

    return best;
  }

  private _files: GistFile[] = [];

  get id() {
    return this.raw.id;
  }
  get url() {
    return this.raw.url;
  }
  get htmlUrl() {
    return this.raw.html_url;
  }
  get commentCount() {
    return this.raw.comments;
  }
  get commentsUrl() {
    return `${this.raw.html_url}#new_comment_field`;
  }
  get isPublic() {
    return this.raw.public;
  }
  get createdAt() {
    return new Date(this.raw.created_at);
  }
  get updatedAt() {
    return new Date(this.raw.updated_at);
  }
  get description() {
    return this.raw.description;
  }
  get files() {
    return this._files;
  }
  get defaultFile() {
    return this._files[0];
  }
  get date() {
    return this.raw.created_at.split('T')[0];
  }
  get hasContent() {
    return this._files.every(x => x.isContentLoaded);
  }
  get isStarred() {
    return isGistStarred(this.id);
  }
  get createFilePath() {
    return `/gist/${this.id}/${DEFAULT_FILE_NAME}`;
  }

  constructor(private readonly raw: RawGist, skipStorage?: boolean) {
    if (!skipStorage) {
      saveToStorage(raw);
    }

    this._files = Object.values(raw.files).map(x => new GistFile(this, x));
  }

  isSameGist(other: Gist) {
    return this.id === other.id;
  }

  isIdentical(other: Gist) {
    if (
      this.isSameGist(other) ||
      this.isPublic !== other.isPublic ||
      this.updatedAt !== other.updatedAt
    ) {
      return false;
    }

    for (let i = 0; i < this.files.length; i++) {
      if (!this.files[i].isIdentical(other.files[i])) {
        return false;
      }
    }

    return true;
  }

  isOwner(username: UserName) {
    return this.raw.owner?.login === username;
  }

  hasFile(name: string) {
    return name in this.raw.files;
  }

  getFileByName(name: string) {
    return this._files.find(x => x.name === name);
  }

  reload() {
    return fetchGist(this.id).then(wrap);
  }

  addFile(name: string, content = DEFAULT_FILE_CONTENT) {
    return addGileToGist(this.id, name, content).then(wrap);
  }

  removeFile(file: GistFile): Promise<null | Gist> {
    this.ensureFileIsMine(file);

    return this.files.length === 1
      ? removeGist(this.id).then(() => null)
      : removeFileFromGist(this.id, file.name).then(wrap);
  }

  renameFile(file: GistFile, newName: string) {
    this.ensureFileIsMine(file);
    return renameGistFile(this.id, file.name, newName).then(wrap);
  }

  setFileContent(file: GistFile, content = DEFAULT_FILE_CONTENT) {
    this.ensureFileIsMine(file);
    return setFileContent(this.id, file.name, content).then(wrap);
  }

  toggleStar() {
    return setGistStarred(this.id, !this.isStarred);
  }

  toJSON() {
    return this.raw;
  }

  private ensureFileIsMine(file: GistFile) {
    if (!(file.name in this.raw.files)) {
      throw new Error(`File ${file.name} doesn't belong to ${this.id}`);
    }
  }
}

function wrap(raw: RawGist) {
  return new Gist(raw);
}

function compress<T extends RawGist>({
  description,
  files,
  id,
  public: p,
  created_at,
  html_url,
  comments,
  owner,
}: T) {
  return {
    description,
    files,
    id,
    public: p,
    created_at,
    html_url,
    comments,
    owner: { login: owner?.login },
  } as T;
}
