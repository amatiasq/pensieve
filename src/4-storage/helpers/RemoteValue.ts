import { lastValueFrom, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  mergeWith,
  startWith
} from 'rxjs/operators';

import { messageBus } from '../../1-core/messageBus';
import { AsyncStore } from '../AsyncStore';

export class RemoteValue<Type, ReadOptions, WriteOptions> {
  private readonly changed: (data: Type) => void;
  private readonly subject: Subject<Type>;

  constructor(
    private readonly store: AsyncStore<ReadOptions, WriteOptions>,
    private readonly key: string,
    private readonly defaultValue: Type,
    private readonly serialize: (x: Type) => string,
    private readonly deserialize: (x: string) => Type,
  ) {
    const [changed, onChange] = messageBus<Type>(`change:${key}`);

    this.changed = changed;
    this.subject = new Subject<Type>();

    onChange(x => this.subject.next(x));
  }

  watch() {
    return this.read().pipe(mergeWith(this.subject), distinctUntilChanged());
  }

  read(options?: ReadOptions) {
    return this.store.read(this.key, options).pipe(
      map(x => (x ? this.deserialize(x) : this.defaultValue)),
      startWith(this.defaultValue),
      catchError(() => of(this.defaultValue)),
      distinctUntilChanged(),
    );
  }

  write(value: Type, options?: WriteOptions) {
    this.store.write(this.key, this.serialize(value), options);
    this.changed(value);
  }

  asPromise() {
    return lastValueFrom(this.read());
  }
}
