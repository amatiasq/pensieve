import { Observable, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  mergeWith,
  startWith
} from 'rxjs/operators';

import { messageBus } from '../../1-core/messageBus';
import { AsyncStore } from '../AsyncStore';

export class RemoteString<ReadOptions, WriteOptions> {
  private readonly changed: (data: string) => void;
  private readonly subject: Subject<string>;

  constructor(
    private readonly store: AsyncStore<ReadOptions, WriteOptions>,
    private readonly key: string,
    private readonly defaultValue: string,
  ) {
    const [changed, onChange] = messageBus<string>(`change:${key}`);

    this.changed = changed;
    this.subject = new Subject<string>();

    onChange(x => this.subject.next(x));
  }

  read(options?: ReadOptions) {
    return this.store.read(this.key, options).pipe(
      startWith(this.defaultValue),
      map(x => x || this.defaultValue),
      catchError(() => this.defaultValue),
      mergeWith(this.subject),
      distinctUntilChanged(),
    );
  }

  write(value: string, options?: WriteOptions) {
    this.changed(value);
    return this.store.write(this.key, value, options);
  }

  delete() {
    this.changed('');
    return this.store.delete(this.key);
  }
}
