import { Emitter } from '@amatiasq/emitter';
import { Observable } from 'rxjs';

export function fromEmitter<Value>(emitter: Emitter<Value>) {
  return new Observable<Value>(observer =>
    emitter.subscribe(x => observer.next(x)),
  );
}
