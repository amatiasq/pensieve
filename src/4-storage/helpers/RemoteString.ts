import { messageBus } from '../../1-core/messageBus';
import { AsyncStore } from '../AsyncStore';

export class RemoteString<ReadOptions, WriteOptions> {
  private readonly changed: (data: string) => void;
  readonly onChange: (listener: (data: string) => void) => () => void;

  constructor(
    private readonly store: AsyncStore<ReadOptions, WriteOptions>,
    private readonly key: string,
    private readonly defaultValue: string,
  ) {
    const [changed, onChange] = messageBus<string>(`change:${key}`);
    this.changed = changed;
    this.onChange = onChange;
  }

  async read(options?: ReadOptions) {
    try {
      const result = await this.store.read(this.key, options);
      return result || this.defaultValue;
    } catch (error) {
      return this.defaultValue;
    }
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
