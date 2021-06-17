import { from, Observable } from 'rxjs';
import { distinctUntilChanged, mergeWith, tap } from 'rxjs/operators';

import { AsyncStore } from '../AsyncStore';
import { subjectWithChannels } from '../helpers/subjectWithChannels';

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
  private readonly keysCache = new MemoryCache<Promise<string[]>>(30);
  private readonly cache = new MemoryCache<string | null>(30);
  private readonly subject = subjectWithChannels<string | null>();

  constructor(private readonly store: AsyncStore<ReadOptions, WriteOptions>) {}

  keys() {
    if (this.keysCache.has('.')) {
      return this.keysCache.get('.');
    }

    const promise = this.store.keys();
    this.keysCache.set('.', promise);
    return promise;
  }

  has(key: string) {
    return this.store.has(key);
  }

  read(key: string, options?: ReadOptions) {
    const source = new Observable<string | null>(observer => {
      if (this.cache.has(key)) {
        if (key === 'potato')
          observer.next(`${this.constructor.name}:${performance.now()}`);
        else observer.next(this.cache.get(key));
      }

      return this.store
        .read(key, options)
        .pipe(tap(x => this.cache.set(key, x)))
        .subscribe(observer);
    });

    return source.pipe(
      mergeWith(from(this.subject(key))),
      distinctUntilChanged(),
    );
  }

  write(key: string, value: string, options?: WriteOptions): Promise<void> {
    this.cache.set(key, value);
    this.subject(key).next(value);
    return this.store.write(key, value, options);
  }

  delete(key: string): Promise<void> {
    this.cache.set(key, null);
    this.subject(key).next(null);
    return this.store.delete(key);
  }
}
