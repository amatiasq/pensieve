import { MixedStore } from '../middleware/MixedStore';
import { WriteOptions } from './WriteOptions';

export class RemoteValue {
  constructor(
    private readonly store: MixedStore,
    readonly key: string,
    readonly defaultValue: string,
  ) {}

  read() {
    return this.store.read(this.key);
  }

  write(value: string, options?: WriteOptions) {
    return this.store.write(this.key, value, options);
  }

  delete(options?: WriteOptions) {
    return this.store.delete(this.key, options);
  }
}
