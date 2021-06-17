import { Scheduler } from '@amatiasq/scheduler';

import { GHRepositoryApi, StagedFiles } from '../../3-github/GHRepositoryApi';
import { fromPromise } from '../../util/rxjs-extensions';
import { AsyncStore, NoOptions } from '../AsyncStore';

const uniq = <T>(list: T[]) => Array.from(new Set(list));

interface PendingCommit {
  message: string;
  files: StagedFiles;
  resolve(): void;
  reject(reason: Error): void;
}

interface GHRepoWriteOptions {
  urgent?: boolean;
}

export class GHRepoStore implements AsyncStore<NoOptions, GHRepoWriteOptions> {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  read(key: string, options?: NoOptions) {
    return fromPromise(
      key === 'README.md' ? this.repo.getReadme() : this.repo.readFile(key),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  write(key: string, value: string, { urgent }: GHRepoWriteOptions = {}) {
    // if (urgent) {
    //   return this.repo.writeFile(key, value, `Urgently write: ${key}`);
    // }

    return this.commit(`Update ${key}`, { [key]: value });
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
    if (this.repo.isCommiting) {
      this.scheduler.restart();
      return;
    }

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
