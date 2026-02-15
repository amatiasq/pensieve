import { Scheduler } from '@amatiasq/scheduler';
import {
  GHRepository,
  ShaConflictError,
  StagedFiles,
} from '../../3-github/GHRepository.ts';
import { debugMethods } from '../../util/debugMethods.ts';
import { AsyncStore } from '../AsyncStore.ts';
import { setDefaultReason } from '../helpers/setDefaultReason.ts';
import { WriteOptions } from '../helpers/WriteOptions.ts';
import { setSyncStatus } from '../syncStatus.ts';

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

  constructor(private readonly repo: GHRepository) {
    debugMethods(this, ['readAll', 'read', 'write', 'delete']);
  }

  has(key: string): Promise<boolean> {
    throw new Error('Do not use me');
  }

  async readAll(pattern: string) {
    const entries = await this.repo.readDir(pattern);
    return Object.fromEntries(entries);
  }

  read(key: string) {
    return this.repo.readFile(key);
  }

  write(key: string, value: string, options?: WriteOptions) {
    const { urgent, reason } = setDefaultReason(options, `Update ${key}`);
    return this.commit(reason, { [key]: value }, urgent);
  }

  async delete(key: string, options?: WriteOptions) {
    const { urgent, reason } = setDefaultReason(options, `Remove ${key}`);
    await this.commit(reason, { [key]: null }, urgent);
  }

  private commit(message: string, files: StagedFiles, isUrgent: boolean) {
    if (!Object.keys(files).length) {
      throw new Error('NO FILES TO COMMIT');
    }

    return new Promise<void>((resolve, reject) => {
      this.pending.push({ message, files, resolve, reject });

      if (isUrgent) {
        this.push(true);
      } else {
        this.scheduler.restart();
      }
    });
  }

  private push(isUrgent = false) {
    // console.log('push');

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

    setSyncStatus('saving');

    this.repo.commit(message, staged, isUrgent).then(
      () => {
        setSyncStatus('synced');
        copy.forEach(x => x.resolve());
      },
      reason => {
        if (reason instanceof ShaConflictError) {
          console.warn('SHA conflict detected, retrying commit...', reason.commitMessage);
          setSyncStatus('conflict');
          // Re-queue the individual commits for retry on next sync cycle
          copy.forEach(x => this.pending.push(x));
          this.scheduler.restart();
        } else {
          setSyncStatus('error');
          copy.forEach(x => x.reject(reason));
        }
      },
    );
  }
}
