import { from } from 'rxjs';
import { distinctUntilChanged, mergeWith } from 'rxjs/operators';

import { AsyncStore } from '../AsyncStore';
import { subjectWithChannels } from '../helpers/subjectWithChannels';

type NotifyOption = { notifyChanges?: boolean };

export class ShortcutStore<ReadOptions, WriteOptions>
  implements AsyncStore<ReadOptions & NotifyOption, WriteOptions>
{
  private readonly subject = subjectWithChannels<string | null>();

  constructor(private readonly store: AsyncStore<ReadOptions, WriteOptions>) {}

  keys() {
    return this.store.keys();
  }

  has(key: string) {
    return this.store.has(key);
  }

  read(
    key: string,
    {
      notifyChanges = true,
      ...rest
    }: ReadOptions & NotifyOption = {} as unknown as ReadOptions & NotifyOption,
  ) {
    const observable = this.store.read(key, rest as unknown as ReadOptions);

    if (!notifyChanges) {
      return observable;
    }

    return observable.pipe(
      mergeWith(from(this.subject(key))),
      distinctUntilChanged(),
    );
  }

  write(key: string, value: string, options?: WriteOptions): Promise<void> {
    this.subject(key).next(value);
    return this.store.write(key, value, options);
  }

  delete(key: string): Promise<void> {
    this.subject(key).next(null);
    return this.store.delete(key);
  }
}
