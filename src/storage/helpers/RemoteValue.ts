import { messageBus } from '../../1-core/messageBus';
import { AsyncStore } from '../../storage/AsyncStore';

type Listener<T> = (listener: (data: T) => void) => () => void;

export class RemoteValue<T> {
  private readonly changed: (data: T) => void;
  readonly onChange: Listener<T>;

  constructor(private readonly store: AsyncStore, private readonly key: string, private readonly defaultValue: T) {
    const [changed, onChange] = messageBus<T>(`change:${key}`);
    this.changed = changed;
    this.onChange = onChange as Listener<T>;

    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
  }

  async get() {
    return (await this.store.read<T>(this.key)) || this.defaultValue;
  }

  set(value: T) {
    this.store.write(this.key, value);
    this.changed(value);
  }
}
