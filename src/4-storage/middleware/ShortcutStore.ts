import { emitterWithChannels } from '@amatiasq/emitter';

import { debugMethods } from '../../util/debugMethods';
import { fromEmitterWithChannels } from '../../util/rxjs-extensions';
import { AsyncStore } from '../AsyncStore';

type P<T> = Partial<T>;

export class ShortcutStore<ReadOptions, WriteOptions>
  implements AsyncStore<ReadOptions, WriteOptions>
{
  private readonly subject = emitterWithChannels<string | null>();

  constructor(private readonly store: AsyncStore<ReadOptions, WriteOptions>) {
    debugMethods(this, ['has', 'keys', 'read', 'write', 'delete']);
  }

  onChange(key: string) {
    return fromEmitterWithChannels(this.subject, key);
  }

  keys() {
    return this.store.keys();
  }

  has(key: string) {
    return this.store.has(key);
  }

  read(key: string, options?: P<ReadOptions>) {
    return this.store.read(key, options);
  }

  write(key: string, value: string, options?: P<WriteOptions>): Promise<void> {
    this.subject(key, value);
    return this.store.write(key, value, options);
  }

  delete(key: string): Promise<void> {
    this.subject(key, null);
    return this.store.delete(key);
  }
}
