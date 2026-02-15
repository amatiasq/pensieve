import { Scheduler } from '@amatiasq/scheduler';
import {
  createStore as createIdbStore,
  del,
  get,
  set,
} from 'idb-keyval';
import { isLeader } from '../../1-core/tabLeader.ts';
import { debugMethods } from '../../util/debugMethods.ts';
import { AsyncStore } from '../AsyncStore.ts';
import { WriteOptions } from '../helpers/WriteOptions.ts';
import { setSyncStatus } from '../syncStatus.ts';

const MAX_ATTEMPTS = 5;
const MAX_QUEUE_SIZE = 100;
const BASE_RETRY_MS = 1000;

interface Command<T extends keyof AsyncStore = keyof AsyncStore> {
  method: T;
  params: Parameters<AsyncStore[T]>;
  attempts: number;
}

export class StoreOfflineError extends Error {}

const outboxStore = createIdbStore('pensieve-outbox', 'commands');

async function addToPending(comm: Command) {
  const queue = (await get<Command[]>('queue', outboxStore)) ?? [];

  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn(
      `Offline queue full (${MAX_QUEUE_SIZE}). Dropping oldest command.`,
    );
    queue.shift();
  }

  queue.push(comm);
  await set('queue', queue, outboxStore);
  registerBackgroundSync();
}

function registerBackgroundSync() {
  navigator.serviceWorker?.ready.then(reg => {
    // @ts-expect-error — SyncManager not in all TS lib typings
    reg.sync?.register('outbox-flush').catch(() => {
      // Background Sync not supported or permission denied — ignore
    });
  });
}

async function retrievePending(): Promise<Command[]> {
  const queue = (await get<Command[]>('queue', outboxStore)) ?? [];
  await del('queue', outboxStore);
  return queue;
}

export class ResilientOnlineStore implements AsyncStore {
  private readonly reading = new Map<string, Promise<string | null>>();
  private retryDelay = BASE_RETRY_MS;
  private reconnect = new Scheduler(this.retryDelay, () =>
    this.executePending(),
  );

  get isOffline() {
    return !navigator.onLine;
  }

  constructor(private readonly remote: AsyncStore) {
    window.addEventListener('online', () => {
      this.retryDelay = BASE_RETRY_MS;
      this.executePending();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isOffline) {
        this.executePending();
      }
    });

    // Listen for Background Sync API messages from service worker
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'flush-outbox') {
        this.executePending();
      }
    });

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
      return addToPending({ method, params, attempts }).then(() => {
        setSyncStatus('pending');
        throw new StoreOfflineError();
      });
    }

    // TS doesn't recognize params as valid parameters for method
    const promise: Promise<void> = (this.remote[method] as any)(...params);

    return promise.catch(async reason => {
      await addToPending({ method, params, attempts: attempts + 1 });
      setSyncStatus('pending');
      this.scheduleRetryWithBackoff();
      throw reason;
    });
  }

  private scheduleRetryWithBackoff() {
    this.reconnect = new Scheduler(this.retryDelay, () =>
      this.executePending(),
    );
    this.reconnect.restart();
    const jitter = Math.random() * 1000;
    this.retryDelay = Math.min(this.retryDelay * 2 + jitter, 30_000);
  }

  private async executePending() {
    if (this.isOffline) {
      this.scheduleRetryWithBackoff();
      return;
    }

    // Only the leader tab flushes the shared outbox
    if (!isLeader()) return;

    this.retryDelay = BASE_RETRY_MS;

    for (const { method, params, attempts } of await retrievePending()) {
      if (attempts < MAX_ATTEMPTS) {
        this.command(method, params, attempts);
      } else {
        console.warn(`Command ${method} failed ${attempts} times`, ...params);
      }
    }
  }
}
