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

  has(key: string): Promise<boolean> {
    throw new Error('Do not use me');
  }

  localHas(key: string) {
    return this.local.has(key);
  }

  readAll(key: string) {
    return this.readAllRemote(key).catch(() => this.readAllLocal(key));
  }

  async readAllRemote(key: string) {
    const [local, remote] = await Promise.all([
      this.local.readAll(key),
      this.remote.readAll(key),
    ]);

    const deleted = Object.keys(local)
      .filter(x => !(x in remote))
      .map(x => this.local.delete(x));

    const promises = Object.keys(remote)
      .filter(x => remote[x] !== local[x])
      .map(key => this.local.write(key, remote[key]));

    Promise.all(promises).then(() =>
      console.log(
        `${deleted.length} notes removed from local and ${promises.length} updated`,
      ),
    );

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

  deleteLocal(key: string) {
    this.local.delete(key);
  }

  private updateOffline(key: string, value: string | null) {
    if (value == null) this.local.delete(key);
    else this.local.write(key, value);
    return value;
  }
}
