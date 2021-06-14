import { messageBus } from '../../1-core/messageBus';
import { AsyncStore } from '../AsyncStore';

type Listener<T> = (listener: (data: T) => void) => () => void;

export class RemoteValue<Type, ReadOptions, WriteOptions> {
  private readonly changed: (data: Type) => void;
  readonly onChange: Listener<Type>;

  constructor(
    private readonly store: AsyncStore<ReadOptions, WriteOptions>,
    private readonly key: string,
    private readonly defaultValue: Type,
  ) {
    const [changed, onChange] = messageBus<Type>(`change:${key}`);
    this.changed = changed;
    this.onChange = onChange as Listener<Type>;

    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
  }

  async get() {
    try {
      const json = await this.store.read(this.key);
      const result = json && (JSON.parse(json) as Type);
      return result || this.defaultValue;
    } catch (error) {
      return this.defaultValue;
    }
  }

  set(value: Type) {
    this.store.write(this.key, JSON.stringify(value, null, 2));
    this.changed(value);
  }
}
