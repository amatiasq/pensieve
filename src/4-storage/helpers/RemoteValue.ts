import { MixedStore } from '../middleware/MixedStore.ts';
import { fetchAndUpdate } from './fetchAndUpdate.ts';
import { setDefaultReason } from './setDefaultReason.ts';
import { WriteOptions } from './WriteOptions.ts';

export class RemoteValue {
  get isCached() {
    return this.store.localHas(this.key);
  }

  constructor(
    private readonly store: MixedStore,
    readonly key: string,
    readonly defaultValue: string,
  ) {}

  read() {
    return this.store.read(this.key).then(
      x => x || this.defaultValue,
      () => this.defaultValue,
    );
  }

  readAsap(callback: (updated: string) => void) {
    const def = (x: string | null) => x || this.defaultValue;

    return fetchAndUpdate(
      this.store.readLocal(this.key).then(def),
      this.store.readRemote(this.key).then(def),
      callback,
    );
  }

  readCache() {
    return this.store.readLocal(this.key);
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
