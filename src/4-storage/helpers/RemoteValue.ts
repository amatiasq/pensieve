import { firstValueFrom, ObservableInput, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  mergeWith,
  skip,
  startWith,
  tap
} from 'rxjs/operators';

import { messageBus } from '../../1-core/messageBus';
import { deserialize } from '../../util/serialization';
import { AsyncStore } from '../AsyncStore';

export class RemoteValue<Type, ReadOptions, WriteOptions> {
  private readonly changed: (data: Type) => void;
  private readonly subject: Subject<Type>;

  constructor(
    private readonly store: AsyncStore<ReadOptions, WriteOptions>,
    private readonly key: string,
    private readonly defaultValue: Type,
  ) {
    const [changed, onChange] = messageBus<Type>(`change:${key}`);

    this.changed = changed;
    this.subject = new Subject<Type>();

    onChange(x => this.subject.next(x));
  }

  get() {
    return this.store.read(this.key).pipe(
      map(x => (x ? deserialize<Type>(x) : this.defaultValue)),
      startWith(this.defaultValue),
      catchError(() => of(this.defaultValue)),
      mergeWith(this.subject),
      distinctUntilChanged(),
    );
  }

  set(value: Type) {
    this.store.write(this.key, JSON.stringify(value, null, 2));
    this.changed(value);
  }

  asPromise() {
    return firstValueFrom(this.get().pipe(skip(1)));
  }
}
