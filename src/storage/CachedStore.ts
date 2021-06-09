import { AsyncStore } from './AsyncStore';

class MemoryCache<T> {
  private readonly data = new Map<string, unknown>();
  private readonly time = new Map<string, number>();

  constructor(private readonly duration: number) {}

  has(key: string) {
    const time = this.time.get(key);
    if (time == null) return false;
    const seconds = (Date.now() - time) / 1000;
    const expired = seconds > this.duration;

    if (expired) {
      this.time.delete(key);
      this.data.delete(key);
    }

    return !expired;
  }

  get(key: string) {
    // if (!this.has(key)) {
    //   throw new Error('use HAS you idiot');
    // }

    return this.data.get(key) as T;
  }

  set(key: string, value: T) {
    this.time.set(key, Date.now());
    this.data.set(key, value);
  }
}

export class CachedStore implements AsyncStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly cache = new MemoryCache<Promise<any>>(30);

  constructor(private readonly store: AsyncStore) {}

  keys() {
    return this.fetch<string[]>('keys', '__KEYS_KEY__');
  }

  readText(key: string): Promise<string | null> {
    return this.fetch<string>('readText', key);
  }

  read<T>(key: string): Promise<T | null> {
    return this.fetch<T>('read', key);
  }

  writeText(key: string, value: string): Promise<void> {
    this.cache.set(key, Promise.resolve(value));
    return this.store.writeText(key, value);
  }

  write<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, Promise.resolve(value));
    return this.store.write<T>(key, value);
  }

  delete(key: string): Promise<void> {
    this.cache.set(key, Promise.resolve(null));
    return this.store.delete(key);
  }

  private fetch<T>(method: 'keys' | 'readText' | 'read', key: string) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const promise = this.store[method](key);
    this.cache.set(key, promise);
    return promise as Promise<T>;
  }
}
