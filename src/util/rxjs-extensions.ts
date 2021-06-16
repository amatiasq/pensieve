import { Observable } from 'rxjs';

export function fromPromise<T>(promise: Promise<T>) {
  return new Observable<T>(observer => {
    promise.then(
      value => {
        observer.next(value);
        observer.complete();
      },
      reason => observer.error(reason),
    );
  });
}

export function fromAsync<T>(fn: () => Promise<T>) {
  return fromPromise(fn());
}
