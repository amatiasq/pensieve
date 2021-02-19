import { CompressedGist, compressGist } from '../2-github/compressGist';
import {
  addGileToGist,
  DEFAULT_FILE_CONTENT,
  fetchGist,
  removeFileFromGist,
  removeGist,
  renameGistFile,
  setFileContent
} from '../2-github/github_api';
import { isGistStarred, setGistStarred } from '../2-github/github_star';
import { RawGist } from '../2-github/RawGist';
import { UserName } from '../2-github/type-aliases';
import { saveGistToStorage } from './gist-storage';
import { gistComparer } from './gistComparer';
import { GistFile } from './GistFile';

export class Gist {
  private _files: GistFile[] = [];

  get id() {
    return this.raw.id;
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

  private readonly raw: CompressedGist;

  constructor(raw: RawGist) {
    saveGistToStorage(raw);
    this.raw = raw;
    this._files = Object.values(raw.files).map(x => new GistFile(this, x));
  }

  isIdentical(other: Gist) {
    if (
      !gistComparer(this, other) ||
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

  isOwner(username: UserName | null | undefined) {
    return this.raw.owner?.login === username;
  }

  hasFile(name: string) {
    return name in this.raw.files;
  }

  getFileByName(name: string) {
    return this._files.find(x => x.name === name);
  }

  async reload() {
    const raw = await fetchGist(this.id);
    return new Gist(raw);
  }

  async addFile(
    name = prompt('Name for the new file'),
    content = DEFAULT_FILE_CONTENT,
  ) {
    if (!name) {
      throw new Error(`Invalid file name: ${name}`);
    }

    const raw = await addGileToGist(
      this.id,
      name,
      content || DEFAULT_FILE_CONTENT,
    );
    const gist = new Gist(raw);

    return gist.getFileByName(name)!;
  }

  async removeFile(file: GistFile): Promise<null | Gist> {
    this.ensureFileIsMine(file);

    if (this.files.length === 1) {
      await removeGist(this.id);
      return null;
    }

    const raw = await removeFileFromGist(this.id, file.name);
    return new Gist(raw);
  }

  async renameFile(file: GistFile, newName: string) {
    this.ensureFileIsMine(file);
    const raw = await renameGistFile(this.id, file.name, newName);
    return new Gist(raw);
  }

  async setFileContent(file: GistFile, content = DEFAULT_FILE_CONTENT) {
    this.ensureFileIsMine(file);
    const raw = await setFileContent(this.id, file.name, content);
    return new Gist(raw);
  }

  toggleStar() {
    return setGistStarred(this.id, !isGistStarred(this.id));
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
