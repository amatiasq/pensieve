import { debugMethods } from '../../util/debugMethods';
import { AsyncStore } from '../AsyncStore';
import { WriteOptions } from '../helpers/WriteOptions';

export class MixedStore implements AsyncStore {
  constructor(
    private readonly local: AsyncStore,
    private readonly remote: AsyncStore,
  ) {
    debugMethods(this, ['readAll', 'read', 'write', 'delete']);
  }

  readAll(key: string) {
    return this.readAllRemote(key).catch(() => this.readAllLocal(key));
  }

  async readAllRemote(key: string) {
    const record = await this.remote.readAll(key);
    Object.entries(record).forEach(([key, value]) =>
      this.local.write(key, value),
    );
    return record;
  }

  readAllLocal(key: string) {
    return this.remote.readAll(key);
  }

  read(key: string) {
    return this.remote.read(key).then(
      x => this.updateOffline(key, x),
      () => this.local.read(key),
    );
  }

  readRemote(key: string) {
    return this.remote.read(key).then(x => this.updateOffline(key, x));
  }

  readLocal(key: string) {
    return this.local.read(key);
  }

  async write(key: string, value: string, options?: WriteOptions) {
    await Promise.race([
      this.local.write(key, value, options),
      this.remote.write(key, value, options),
    ]);
  }

  async delete(key: string, options?: WriteOptions) {
    await Promise.race([
      this.local.delete(key, options),
      this.remote.delete(key, options),
    ]);
  }

  private updateOffline(key: string, value: string | null) {
    if (value == null) this.local.delete(key);
    else this.local.write(key, value);
    return value;
  }
}
