import { AsyncStore } from './AsyncStore';
import { ResilientOnlineStore } from './ResilientOnlineStore';

export class MixedStore implements AsyncStore {
  constructor(private readonly offline: AsyncStore, private readonly remote: ResilientOnlineStore) {}

  keys() {
    return this.remote.keys().catch(() => this.offline.keys());
  }

  readText(key: string) {
    return this.remote.readText(key).catch(() => this.offline.readText(key));
  }

  read<T>(key: string): Promise<T | null> {
    return this.remote.read<T>(key).catch(() => this.offline.read<T>(key));
  }

  async writeText(key: string, value: string): Promise<void> {
    await Promise.race([this.offline.writeText(key, value), this.remote.writeText(key, value)]);
  }

  async write<T>(key: string, value: T): Promise<void> {
    await Promise.race([this.offline.write<T>(key, value), this.remote.write<T>(key, value)]);
  }

  async delete(key: string): Promise<void> {
    await Promise.race([this.offline.delete(key), this.remote.delete(key)]);
  }
}
