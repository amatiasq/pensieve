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
    const [local, remote] = await Promise.all([
      this.local.readAll(key),
      this.remote.readAll(key),
    ]);

    const localKeys = Object.keys(local);
    const remoteKeys = new Set(Object.keys(remote));

    localKeys
      .filter(x => !remoteKeys.has(x))
      .forEach(x => this.remote.delete(x));

    remoteKeys.forEach(key => this.local.write(key, remote[key]));

    return remote;
  }

  readAllLocal(key: string) {
    return this.local.readAll(key);
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
