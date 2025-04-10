import { messageBus } from '../../1-core/messageBus.ts';
import { deserialize, serialize } from '../../util/serialization.ts';
import { MixedStore } from '../middleware/MixedStore.ts';
import { RemoteValue } from './RemoteValue.ts';
import { setDefaultReason } from './setDefaultReason.ts';
import { WriteOptions } from './WriteOptions.ts';

export class RemoteJson<T> extends RemoteValue {
  private readonly emitChange: (data: T) => void;
  readonly onChange: (listener: (data: T) => void) => () => void;

  constructor(store: MixedStore, key: string, readonly defaultJson: T) {
    super(store, key, serialize(defaultJson));

    const [emitChange, onChange] = messageBus<T>(`json:changed:${key}`);
    this.emitChange = emitChange;
    this.onChange = onChange;
  }

  get(): Promise<T> {
    return this.read()
      .then(content => (content ? deserialize<T>(content) : this.defaultJson))
      .catch(() => this.defaultJson);
  }

  set(value: T, options?: WriteOptions): Promise<void> {
    const content = serialize(value);
    const opts = setDefaultReason(options, `Set ${this.key}`);
    return this.write(content, opts);
  }

  async write(value: string, options?: WriteOptions) {
    this.emitChange(deserialize(value));
    await super.write(value, options);
  }
}
