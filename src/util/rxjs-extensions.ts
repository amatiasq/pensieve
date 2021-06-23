import { Observable } from 'rxjs';

import { Emitter } from '@amatiasq/emitter';

export function fromEmitter<Value>(emitter: Emitter<Value>) {
  return new Observable<Value>(observer =>
    emitter.subscribe(x => observer.next(x)),
  );
}
