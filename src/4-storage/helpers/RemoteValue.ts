import { MixedStore } from '../middleware/MixedStore';
import { fetchAndUpdate } from './fetchAndUpdate';
import { setDefaultReason } from './setDefaultReason';
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

  readAsap(callback: (updated: string) => void) {
    const def = (x: string | null) => x || '';

    return fetchAndUpdate(
      this.store.readLocal(this.key).then(def),
      this.store.readRemote(this.key).then(def),
      callback,
    );
  }

  write(value: string, options?: WriteOptions) {
    const opts = setDefaultReason(options, `Write ${this.key}`);
    return this.store.write(this.key, value, opts);
  }

  delete(options?: WriteOptions) {
    const opts = setDefaultReason(options, `Delete ${this.key}`);
    return this.store.delete(this.key, opts);
  }
}
