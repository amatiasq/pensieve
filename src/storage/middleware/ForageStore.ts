import { AsyncStore } from '../AsyncStore';

export class ForageStore implements AsyncStore {
  constructor(private readonly forage: LocalForage) {}

  keys() {
    return this.forage.keys();
  }

  readText(key: string) {
    return this.forage.getItem<string>(key);
  }

  read<T>(key: string) {
    return this.forage.getItem<T>(key);
  }

  async writeText(key: string, value: string) {
    await this.forage.setItem(key, value);
  }

  async write<T>(key: string, value: T) {
    await this.forage.setItem(key, value);
  }

  async delete(key: string) {
    await this.forage.removeItem(key);
  }
}
