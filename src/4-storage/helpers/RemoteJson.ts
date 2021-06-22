import { messageBus } from '../../1-core/messageBus';
import { deserialize, serialize } from '../../util/serialization';
import { MixedStore } from '../middleware/MixedStore';
import { RemoteValue } from './RemoteValue';
import { WriteOptions } from './WriteOptions';

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
    return this.write(content, options);
  }

  async write(value: string, options?: WriteOptions) {
    this.emitChange(deserialize(value));
    await super.write(value, options);
  }
}
