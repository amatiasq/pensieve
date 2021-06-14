import { Scheduler } from '@amatiasq/scheduler';

import { AsyncStore } from '../AsyncStore';

interface Command<T extends keyof AsyncStore = keyof AsyncStore> {
  method: T;
  params: Parameters<AsyncStore[T]>;
}

export class ResilientOnlineStore<ReadOptions, WriteOptions>
  implements AsyncStore<ReadOptions, WriteOptions>
{
  private readonly pending: Command[] = [];
  private readonly reconnect = new Scheduler(1000, () => this.executePending());

  get isOffline() {
    return !navigator.onLine;
  }

  constructor(private readonly remote: AsyncStore<ReadOptions, WriteOptions>) {
    window.addEventListener('online', () => this.executePending());
  }
  keys() {
    return this.rejectIfOffline() || this.remote.keys();
  }

  has(key: string) {
    return this.rejectIfOffline() || this.remote.has(key);
  }

  read(key: string, options?: ReadOptions): Promise<string | null> {
    return this.rejectIfOffline() || this.remote.read(key, options);
  }

  write(key: string, value: string, options?: WriteOptions): Promise<void> {
    return this.command('write', [
      key,
      value,
      options as Record<string, never>,
    ]);
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
