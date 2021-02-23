import { RawGistFileDetails, RawGistFileItem } from '../2-github/RawGistFile';
import { unhandledErrorAsWarning } from '../util/unhandledErrorAsWarning';
import { Gist } from './Gist';

@unhandledErrorAsWarning
class UnmodifiedFileError extends Error {}

export class GistFile {
  get name() {
    return this.raw.filename;
  }
  get language() {
    return this.raw.language;
  }
  get path() {
    return `/gist/${this.gist.id}/${this.name}`;
  }
  private get isOnlyFile() {
    return this.gist.files.length === 1;
  }

  get hasContent() {
    return 'content' in this.raw;
  }
  get content() {
    if (!('content' in this.raw)) {
      throw new Error(`Accessing ${this.name} before fetching it's data`);
    }

    // DEFAULT_FILE_CONTENT
    return this.raw.content;
  }

  constructor(
    private readonly gist: Gist,
    private raw: RawGistFileItem | RawGistFileDetails,
  ) {}

  isIdentical(other: GistFile) {
    return this.name === other.name && this.content === other.content;
  }

  async rename(newName: string) {
    if (this.name === newName) {
      throw new UnmodifiedFileError(`File name is already "${newName}"`);
    }

    const newGist = await this.gist.renameFile(this, newName);
    return newGist.getFileByName(newName) as GistFile;
  }

  async setContent(content: string) {
    if (this.content === content) {
      throw new UnmodifiedFileError(
        `File content is already "${content.slice(0, 100)}..."`,
      );
    }

    const newGist = await this.gist.setFileContent(this, content);
    return newGist.getFileByName(this.name);
  }

  remove() {
    return this.gist.removeFile(this);
  }

  async removeWithConfirm() {
    const message = this.isOnlyFile
      ? 'PERMANENTLY DELETE THE GIST?'
      : `Remove ${this.name}?`;

    if (!confirm(message)) {
      return Promise.reject();
    }

    const newGist = await this.remove();
    return newGist == null ? '/' : newGist.defaultFile.path;
  }

  toJSON() {
    return this.raw;
  }
}
