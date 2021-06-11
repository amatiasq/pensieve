import { Scheduler } from '@amatiasq/scheduler';

import { AsyncStore } from '../AsyncStore';

interface Command<T extends keyof AsyncStore = keyof AsyncStore> {
  method: T;
  params: Parameters<AsyncStore[T]>;
}

export class ResilientOnlineStore implements AsyncStore {
  private readonly pending: Command[] = [];
  private readonly reconnect = new Scheduler(1000, () => this.executePending());

  get isOffline() {
    return !navigator.onLine;
  }

  constructor(private readonly remote: AsyncStore) {
    window.addEventListener('online', () => this.executePending());
  }
  keys() {
    return this.rejectIfOffline() || this.remote.keys();
  }

  has(key: string) {
    return this.rejectIfOffline() || this.remote.has(key);
  }

  readText(key: string): Promise<string | null> {
    return this.rejectIfOffline() || this.remote.readText(key);
  }

  read<T>(key: string): Promise<T | null> {
    return this.rejectIfOffline() || this.remote.read<T>(key);
  }

  writeText(key: string, value: string): Promise<void> {
    return this.command('writeText', [key, value]);
  }

  write<T>(key: string, value: T): Promise<void> {
    return this.command('write', [key, value]);
  }

  delete(key: string): Promise<void> {
    return this.command('delete', [key]);
  }

  private rejectIfOffline() {
    if (this.isOffline) {
      return Promise.reject('OFFLINE');
    }
  }

  private command<Method extends keyof AsyncStore>(
    method: Method,
    params: Parameters<AsyncStore[Method]>,
  ) {
    if (this.isOffline) {
      this.pending.push({ method, params });
      return Promise.reject('OFFLINE');
    }

    // TS doesn't recognize params as valid parameters for method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promise: Promise<void> = (this.remote[method] as any)(...params);

    return promise.catch(reason => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this[method] as any)(params);
    }
  }
}
