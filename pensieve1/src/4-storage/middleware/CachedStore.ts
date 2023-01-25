import { debugMethods } from '../../util/debugMethods';
import { AsyncStore } from '../AsyncStore';
import { MemoryCache } from '../helpers/MemoryCache';
import { WriteOptions } from '../helpers/WriteOptions';

export class CachedStore implements AsyncStore {
  private readonly readAllCache = new MemoryCache<
    Promise<Record<string, string>>
  >(this.seconds);

  private readonly cache = new MemoryCache<Promise<string | null>>(
    this.seconds,
  );

  constructor(
    private readonly store: AsyncStore,
    private readonly seconds: number,
    label: string,
  ) {
    debugMethods(this, ['readAll', 'read', 'write', 'delete'], label);
  }

  has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  readAll(pattern: string) {
    if (this.readAllCache.has(pattern)) {
      return this.readAllCache.get(pattern);
    }

    const promise = this.store.readAll(pattern);
    this.readAllCache.set(pattern, promise);
    return promise;
  }

  read(key: string) {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = this.store.read(key);
    this.cache.set(key, promise);
    return promise;
  }

  write(key: string, value: string, options?: WriteOptions) {
    this.cache.set(key, Promise.resolve(value));
    return this.store.write(key, value, options);
  }

  delete(key: string, options?: WriteOptions) {
    this.cache.set(key, Promise.resolve(null));
    return this.store.delete(key, options);
  }
}
