import { RawGistFileDetails, RawGistFileItem } from '../contracts/RawGistFile';
import { Gist } from './Gist';

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

  get content() {
    if (!('content' in this.raw)) {
      throw new Error(`Accessing ${this.name} before fetching it's data`);
    }

    /// DEFAULT_FILE_CONTENT
    return this.raw.content;
  }

  constructor(
    private readonly gist: Gist,
    private raw: RawGistFileItem | RawGistFileDetails,
  ) {}

  isIdentical(other: GistFile) {
    return this.name === other.name && this.content === other.content;
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

  removeWithConfirm() {
    const message = this.isOnlyFile
      ? 'PERMANENTLY DELETE THE GIST?'
      : `Remove ${this.name}?`;

    if (!confirm(message)) {
      return Promise.reject();
    }

    return this.remove().then(gist =>
      gist == null ? '/' : gist.files[0].path,
    );
  }

  toJSON() {
    return this.raw;
  }
}
