import { messageBus } from '../../1-core/messageBus.ts';
import { isLeader } from '../../1-core/tabLeader.ts';
import { debugMethods } from '../../util/debugMethods.ts';
import { AsyncStore } from '../AsyncStore.ts';
import { WriteOptions } from '../helpers/WriteOptions.ts';

const PERIODIC_SYNC_MS = 60_000;

const [notifySyncResults, onSyncResults] =
  messageBus<Record<string, string>>('sync:results');

export class MixedStore implements AsyncStore {
  private syncPattern: string | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private onSyncCallback: ((data: Record<string, string>) => void) | null =
    null;

  constructor(
    private readonly local: AsyncStore,
    private readonly remote: AsyncStore,
  ) {
    debugMethods(this, ['readAll', 'read', 'write', 'delete']);

    // Follower tabs receive sync results broadcast by the leader
    onSyncResults(data => this.onSyncCallback?.(data));
  }

  startPeriodicSync(
    pattern: string,
    onSync?: (data: Record<string, string>) => void,
  ) {
    this.syncPattern = pattern;
    this.onSyncCallback = onSync ?? null;

    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (document.hidden || !navigator.onLine || !this.syncPattern) return;
      // Only the leader tab polls the remote
      if (!isLeader()) return;

      this.readAllRemote(this.syncPattern)
        .then(data => {
          this.onSyncCallback?.(data);
          notifySyncResults(data);
        })
        .catch(() => {});
    }, PERIODIC_SYNC_MS);
  }

  has(key: string): Promise<boolean> {
    throw new Error('Do not use me');
  }

  localHas(key: string) {
    return this.local.has(key);
  }

  readAll(key: string) {
    return this.readAllRemote(key).catch(() => this.readAllLocal(key));
  }

  async readAllRemote(key: string) {
    const [local, remote] = await Promise.all([
      this.local.readAll(key),
      this.remote.readAll(key),
    ]);

    const deleted = Object.keys(local)
      .filter(x => !(x in remote))
      .map(x => this.local.delete(x));

    const promises = Object.keys(remote)
      .filter(x => remote[x] !== local[x])
      .map(key => this.local.write(key, remote[key]));

    Promise.all([...deleted, ...promises])
      .then(() =>
        console.log(
          `${deleted.length} notes removed from local and ${promises.length} updated`,
        ),
      )
      .catch(error =>
        console.error('Failed to sync local cache:', error),
      );

    return remote;
  }

  readAllLocal(key: string) {
    return this.local.readAll(key);
  }

  read(key: string) {
    return this.remote.read(key).then(
      x => this.updateOffline(key, x),
      () => this.local.read(key),
    );
  }

  readRemote(key: string) {
    return this.remote.read(key).then(x => this.updateOffline(key, x));
  }

  readLocal(key: string) {
    return this.local.read(key);
  }

  async write(key: string, value: string, options?: WriteOptions) {
    await Promise.race([
      this.local.write(key, value, options),
      this.remote.write(key, value, options),
    ]);
  }

  async delete(key: string, options?: WriteOptions) {
    await Promise.race([
      this.local.delete(key, options),
      this.remote.delete(key, options),
    ]);
  }

  deleteLocal(key: string) {
    this.local.delete(key);
  }

  private updateOffline(key: string, value: string | null) {
    if (value == null) this.local.delete(key);
    else this.local.write(key, value);
    return value;
  }
}
