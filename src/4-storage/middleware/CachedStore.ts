import { AsyncStore } from '../AsyncStore';

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

export class CachedStore<ReadOptions, WriteOptions>
  implements AsyncStore<ReadOptions, WriteOptions>
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly cache = new MemoryCache<Promise<any>>(30);

  constructor(private readonly store: AsyncStore<ReadOptions, WriteOptions>) {}

  keys() {
    return this.fetch<string[]>('keys', '__KEYS_KEY__');
  }

  has(key: string) {
    return this.store.has(key);
  }

  read(key: string, options?: ReadOptions): Promise<string | null> {
    return this.fetch<string>('read', key, options);
  }

  write(key: string, value: string, options?: WriteOptions): Promise<void> {
    this.cache.set(key, Promise.resolve(value));
    return this.store.write(key, value, options);
  }

  delete(key: string): Promise<void> {
    this.cache.set(key, Promise.resolve(null));
    return this.store.delete(key);
  }

  private fetch<T>(
    method: 'keys' | 'has' | 'read',
    key: string,
    options?: ReadOptions | undefined,
  ) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const promise = this.store[method](key, options);
    this.cache.set(key, promise);
    return promise as unknown as Promise<T>;
  }
}
