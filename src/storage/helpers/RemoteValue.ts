import { AsyncStore } from '../../storage/AsyncStore';

export class RemoteValue<T> {
  constructor(private readonly store: AsyncStore, private readonly key: string, private readonly defaultValue: T) {}

  async get() {
    return (await this.store.read<T>(this.key)) || this.defaultValue;
  }

  set(value: T) {
    this.store.write(this.key, value);
  }
}
