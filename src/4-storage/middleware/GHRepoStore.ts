import { Scheduler } from '@amatiasq/scheduler';

import { GHRepositoryApi, StagedFiles } from '../../3-github/GHRepositoryApi';
import { AsyncStore } from '../AsyncStore';

const uniq = <T>(list: T[]) => Array.from(new Set(list));

interface PendingCommit {
  message: string;
  files: StagedFiles;
  resolve(): void;
  reject(reason: Error): void;
}

export class GHRepoStore implements AsyncStore {
  private readonly scheduler = new Scheduler(100, () => this.push());
  private readonly pending: PendingCommit[] = [];

  constructor(private readonly repo: GHRepositoryApi) {}

  async keys() {
    const files = await this.repo.fetchStructure();
    return files
      .filter(x => x.type === 'blob' || x.type === 'file')
      .map(x => x.path);
  }

  has(key: string) {
    return this.repo.hasFile(key);
  }

  async readText(key: string) {
    const file = await this.repo.readFile(key);
    return file.content;
  }

  async read<T>(key: string) {
    // FIXME: regular files have a 1mb limit
    const file =
      key === 'notes.json'
        ? await this.repo.getReadme()
        : await this.repo.readFile(key);

    const value = JSON.parse(file.content);
    return value as T;
  }

  writeText(key: string, value: string) {
    return this.commit(`Update ${key}`, { [key]: value });
  }

  write<T>(key: string, value: T) {
    const json = JSON.stringify(value, null, 2);
    // FIXME: regular files have a 1mb limit
    const filename = key === 'notes.json' ? 'README.md' : key;
    return this.commit(`Update ${key}`, { [filename]: json });
  }

  async delete(key: string) {
    await this.commit(`Remove ${key}`, { [key]: null });
  }

  private commit(message: string, files: StagedFiles) {
    if (!Object.keys(files).length) {
      throw new Error('NO FILES TO COMMIT');
    }

    return new Promise<void>((resolve, reject) => {
      this.pending.push({ message, files, resolve, reject });
      this.scheduler.restart();
    });
  }

  private push() {
    if (!this.pending.length) return;

    const copy = [...this.pending];
    this.pending.length = 0;

    const staged = copy.reduce(
      (all, current) => ({ ...all, ...current.files }),
      {},
    );
    const messages = uniq(copy.map(x => x.message));
    const message =
      messages.length > 1
        ? `Multiple:\n- ${messages.join('\n- ')}`
        : messages[0];

    this.repo.commit(message, staged).then(
      () => copy.forEach(x => x.resolve()),
      reason => copy.forEach(x => x.reject(reason)),
    );
  }
}
