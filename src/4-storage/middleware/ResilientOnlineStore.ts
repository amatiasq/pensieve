import { ClientStorage } from '@amatiasq/client-storage';
import { Scheduler } from '@amatiasq/scheduler';
import { debugMethods } from '../../util/debugMethods';
import { AsyncStore } from '../AsyncStore';
import { WriteOptions } from '../helpers/WriteOptions';

interface Command<T extends keyof AsyncStore = keyof AsyncStore> {
  method: T;
  params: Parameters<AsyncStore[T]>;
  attempts: number;
}

export class StoreOfflineError extends Error {}

const pending = new ClientStorage<Command[]>('pensieve.pending-commands', {
  default: [],
});

const addToPending = (comm: Command) => pending.set([...pending.cache, comm]);
const retrievePending = () => {
  const result = [...pending.cache];
  pending.reset();
  return result;
};

export class ResilientOnlineStore implements AsyncStore {
  private readonly reading = new Map<string, Promise<string | null>>();
  private readonly reconnect = new Scheduler(1000, () => this.executePending());

  get isOffline() {
    return !navigator.onLine;
  }

  constructor(private readonly remote: AsyncStore) {
    window.addEventListener('online', () => this.executePending());
    debugMethods(this, ['readAll', 'read', 'write', 'delete']);
  }

  has(key: string): Promise<boolean> {
    throw new Error('Do not use me');
  }

  readAll(pattern: string) {
    return this.rejectIfOffline() || this.remote.readAll(pattern);
  }

  read(key: string) {
    if (this.reading.has(key)) {
      return this.reading.get(key)!;
    }

    if (this.isOffline) {
      return Promise.reject(() => new StoreOfflineError());
    }

    const promise = this.remote.read(key);
    this.reading.set(key, promise);
    return promise.finally(() => this.reading.delete(key));
  }

  write(key: string, value: string, options?: WriteOptions) {
    return this.command('write', [key, value, options]);
  }

  delete(key: string, options?: WriteOptions) {
    return this.command('delete', [key, options]);
  }

  private rejectIfOffline() {
    if (this.isOffline) {
      return Promise.reject(new StoreOfflineError());
    }
  }

  private command<Method extends keyof AsyncStore>(
    method: Method,
    params: Parameters<AsyncStore[Method]>,
    attempts = 0,
  ) {
    if (this.isOffline) {
      addToPending({ method, params, attempts });
      return Promise.reject(new StoreOfflineError());
    }

    // TS doesn't recognize params as valid parameters for method
    const promise: Promise<void> = (this.remote[method] as any)(...params);

    return promise.catch(reason => {
      addToPending({ method, params, attempts: attempts + 1 });
      this.reconnect.restart();
      throw reason;
    });
  }

  private executePending() {
    if (this.isOffline) {
      this.reconnect.restart();
      return;
    }

    for (const { method, params, attempts } of retrievePending()) {
      if (attempts < 5) {
        this.command(method, params, attempts);
      } else {
        console.warn(`Command ${method} failed ${attempts} times`, ...params);
      }
    }
  }
}
