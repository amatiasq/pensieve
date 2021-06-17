import { lastValueFrom, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  mergeWith,
  startWith
} from 'rxjs/operators';

import { FinalReadOptions, FinalStore } from '../';
import { messageBus } from '../../1-core/messageBus';
import { FinalWriteOptions } from '../index';

export class RemoteValue<Type> {
  private readonly changed: (data: Type) => void;
  private readonly subject: Subject<Type>;

  constructor(
    private readonly store: FinalStore,
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

  notifyChange(newValue: Type) {
    this.subject.next(newValue);
  }

  watch() {
    return this.read().pipe(mergeWith(this.subject), distinctUntilChanged());
  }

  read(options: FinalReadOptions = {}) {
    return this.store.read(this.key, { ...options, notifyChanges: false }).pipe(
      map(x => (x ? this.deserialize(x) : this.defaultValue)),
      startWith(this.defaultValue),
      catchError(() => of(this.defaultValue)),
      distinctUntilChanged(),
    );
  }

  write(value: Type, options?: FinalWriteOptions) {
    this.changed(value);

    return this.store.write(
      this.key,
      this.serialize(value),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options as any,
    );
  }

  asPromise() {
    return lastValueFrom(this.read());
  }
}
