import { AsyncStore } from '../AsyncStore';
import { ResilientOnlineStore } from './ResilientOnlineStore';

export class MixedStore<RO1, WO1, RO2, WO2>
  implements AsyncStore<RO1 & RO2, WO1 & WO2>
{
  constructor(
    private readonly offline: AsyncStore<RO1, WO1>,
    private readonly remote: ResilientOnlineStore<RO2, WO2>,
  ) {}

  keys() {
    return this.remote.keys().catch(() => this.offline.keys());
  }

  has(key: string): Promise<boolean> {
    return this.remote.has(key).catch(() => this.offline.has(key));
  }

  read(key: string, options?: RO1 & RO2) {
    return this.remote
      .read(key, options as RO2)
      .catch(() => this.offline.read(key));
  }

  async write(key: string, value: string, options?: WO1 & WO2): Promise<void> {
    await Promise.race([
      this.offline.write(key, value, options),
      this.remote.write(key, value, options),
    ]);
  }

  async delete(key: string): Promise<void> {
    await Promise.race([this.offline.delete(key), this.remote.delete(key)]);
  }
}
