import { Scheduler } from '@amatiasq/scheduler';

import { debugMethods } from '../../util/debugMethods';
import { AsyncStore } from '../AsyncStore';

interface Command<T extends keyof AsyncStore = keyof AsyncStore> {
  method: T;
  params: Parameters<AsyncStore[T]>;
}

export class StoreOfflineError extends Error {}

export class ResilientOnlineStore<ReadOptions, WriteOptions>
  implements AsyncStore<ReadOptions, WriteOptions>
{
  private readonly reading = new Map<string, Promise<string | null>>();
  private readonly pending: Command[] = [];
  private readonly reconnect = new Scheduler(1000, () => this.executePending());

  get isOffline() {
    return !navigator.onLine;
  }

  constructor(private readonly remote: AsyncStore<ReadOptions, WriteOptions>) {
    window.addEventListener('online', () => this.executePending());
    debugMethods(this, ['has', 'keys', 'read', 'write', 'delete']);
  }

  keys() {
    return this.rejectIfOffline() || this.remote.keys();
  }

  has(key: string) {
    return this.rejectIfOffline() || this.remote.has(key);
  }

  read(key: string, options?: ReadOptions) {
    if (this.reading.has(key)) {
      return this.reading.get(key)!;
    }

    if (this.isOffline) {
      return Promise.reject(() => new StoreOfflineError());
    }

    const promise = this.remote.read(key, options);
    this.reading.set(key, promise);
    return promise.finally(() => this.reading.delete(key));
  }

  write(key: string, value: string, options?: WriteOptions) {
    return this.command('write', [
      key,
      value,
      options as Record<string, never>,
    ]);
  }

  delete(key: string) {
    return this.command('delete', [key]);
  }

  private rejectIfOffline() {
    if (this.isOffline) {
      return Promise.reject(new StoreOfflineError());
    }
  }

  private command<Method extends keyof AsyncStore>(
    method: Method,
    params: Parameters<AsyncStore[Method]>,
  ) {
    if (this.isOffline) {
      this.pending.push({ method, params });
      return Promise.reject(new StoreOfflineError());
    }

    // TS doesn't recognize params as valid parameters for method
    const promise: Promise<void> = (this.remote[method] as any)(...params);

    return promise.catch(reason => {
      console.log('error detected ');
      this.pending.push({ method, params });
      this.reconnect.restart();
      throw reason;
    });
  }

  private executePending() {
    if (this.isOffline) {
      this.reconnect.restart();
      return;
    }

    const copy = [...this.pending];
    this.pending.length = 0;

    for (const { method, params } of copy) {
      (this[method] as any)(...params);
    }
  }
}
