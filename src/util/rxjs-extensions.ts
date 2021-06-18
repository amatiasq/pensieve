import { Observable } from 'rxjs';

import { Emitter, EmitterWithChannels } from '@amatiasq/emitter';

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

export function fromEmitter<Value>(emitter: Emitter<Value>) {
  return new Observable<Value>(observer =>
    emitter.subscribe(x => observer.next(x)),
  );
}

export function fromEmitterWithChannels<Channel, Value>(
  emitter: EmitterWithChannels<Channel, Value>,
  channel: Channel,
) {
  return new Observable<Value>(observer =>
    emitter.subscribe(channel, x => observer.next(x)),
  );
}
