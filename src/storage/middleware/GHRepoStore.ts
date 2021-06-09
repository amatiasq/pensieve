import { Scheduler } from '@amatiasq/scheduler';

import { AsyncStore } from '../AsyncStore';
import { GHRepositoryApi, StagedFiles } from '../gh/GHRepositoryApi';

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
    return files.filter(x => x.type === 'blob' || x.type === 'file').map(x => x.path);
  }

  async readText(key: string) {
    const file = await this.repo.readFile(key);
    return file.content;
  }

  async read<T>(key: string) {
    const file = await this.repo.readFile(key);
    const value = JSON.parse(file.content);
    return value as T;
  }

  writeText(key: string, value: string) {
    return this.commit(`Update ${key}`, { [key]: value });
  }

  write<T>(key: string, value: T) {
    const json = JSON.stringify(value, null, 2);
    return this.commit(`Update ${key}`, { [key]: json });
  }

  async delete(key: string) {
    await this.commit(`Remove ${key}`, { [key]: null });
  }

  private commit(message: string, files: StagedFiles) {
    return new Promise<void>((resolve, reject) => {
      this.pending.push({ message, files, resolve, reject });
      this.scheduler.restart();
    });
  }

  private push() {
    if (!this.pending.length) return;

    const copy = [...this.pending];
    this.pending.length = 0;

    const staged = copy.reduce((all, current) => ({ ...all, ...current }));
    const messages = uniq(copy.map(x => x.message));
    const message = messages.length > 1 ? `Multiple:\n- ${messages.join('\n- ')}` : messages[0];

    this.repo.commit(message, staged).then(
      () => copy.forEach(x => x.resolve()),
      reason => copy.forEach(x => x.reject(reason)),
    );
  }
}
