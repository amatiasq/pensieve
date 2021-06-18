import { Observable } from 'rxjs';
import { distinctUntilChanged, map, mergeWith } from 'rxjs/operators';

import { FinalReadOptions, FinalStore } from '../';
import { fromPromise } from '../../util/rxjs-extensions';
import { FinalWriteOptions } from '../index';

export class RemoteValue<Type> {
  constructor(
    private readonly store: FinalStore,
    private readonly key: string,
    private readonly defaultValue: Type,
    private readonly serialize: (x: Type) => string,
    private readonly deserialize: (x: string) => Type,
  ) {}

  watch(): Observable<Type | null>;
  watch(ifNull: Type): Observable<Type>;
  watch(ifNull?: Type) {
    const changes = this.store
      .onChange(this.key)
      .pipe(map(x => (x ? this.deserialize(x) : ifNull || null)));

    return fromPromise(this.read()).pipe(
      mergeWith(changes),
      distinctUntilChanged(),
    );
  }

  read(options: FinalReadOptions = {}) {
    return this.store.read(this.key, { ...options, notifyChanges: false }).then(
      x => (x ? this.deserialize(x) : this.defaultValue),
      () => this.defaultValue,
    );
  }

  write(value: Type, options?: FinalWriteOptions) {
    return this.store.write(this.key, this.serialize(value), options);
  }
}
