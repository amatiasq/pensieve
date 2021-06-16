import { Observable } from 'rxjs';
import { distinctUntilChanged, tap } from 'rxjs/operators';

import { AsyncStore } from '../AsyncStore';

export class MixedStore<RO1, WO1, RO2, WO2>
  implements AsyncStore<RO1 & RO2, WO1 & WO2>
{
  constructor(
    private readonly offline: AsyncStore<RO1, WO1>,
    private readonly remote: AsyncStore<RO2, WO2>,
  ) {}

  keys() {
    return this.remote.keys().catch(() => this.offline.keys());
  }

  has(key: string): Promise<boolean> {
    return this.remote.has(key).catch(() => this.offline.has(key));
  }

  read(key: string, options?: RO1 & RO2) {
    return new Observable<string | null>(observer => {
      const flags = new Set<string>();

      this.offline
        .read(key, options)
        .pipe(flag(flags, 'offline'))
        .subscribe({
          next: value => !flags.has('remote:next') && observer.next(value),
          error: error => flags.has('remote:error') && observer.error(error),
          complete: () => flags.has('remote:complete') && observer.complete(),
        });

      this.remote
        .read(key, options)
        .pipe(flag(flags, 'remote'))
        .subscribe({
          next: value => observer.next(value),
          error: error => flags.has('offline:error') && observer.error(error),
          complete: () => observer.complete(),
        });
    }).pipe(distinctUntilChanged());
  }

  async write(key: string, value: string, options?: WO1 & WO2): Promise<void> {
    await Promise.race([
      this.offline.write(key, value, options),
      this.remote.write(key, value, options),
    ]);
  }

  async delete(key: string): Promise<void> {
    await Promise.race([this.offline.delete(key), this.remote.delete(key)]);
  }
}

function flag<T>(flags: Set<string>, key: string) {
  return (source: Observable<T>) =>
    source.pipe(
      tap({
        next: () => flags.add(`${key}:next`),
        error: () => flags.add(`${key}:error`),
        complete: () => flags.add(`${key}:complete`),
      }),
    );
}
