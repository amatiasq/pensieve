import { AsyncStore } from '../AsyncStore';
import { patternToRegex } from '../helpers/patternToRegex';

export class SyncLocalStore {
  private get storedKeys() {
    const keys = [];
    const prefix = `${this.prefix}:`;

    for (let i = 0, len = localStorage.length; i < len; i++) {
      const key = localStorage.key(i)!;
      if (key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    return keys;
  }

  constructor(readonly prefix: string) {}

  keys() {
    return this.storedKeys;
  }

  has(key: string) {
    return key in this.storedKeys;
  }

  read(key: string) {
    return localStorage.getItem(`${this.prefix}:${key}`);
  }

  write(key: string, value: string) {
    localStorage.setItem(`${this.prefix}:${key}`, value);
  }

  delete(key: string) {
    localStorage.removeItem(`${this.prefix}:${key}`);
  }
}

export class LocalStore implements AsyncStore {
  private syncStore = new SyncLocalStore(this.prefix);

  constructor(readonly prefix: string) {}

  has(key: string): Promise<boolean> {
    return Promise.resolve(this.syncStore.has(key));
  }

  readAll(pattern: string) {
    const regex = patternToRegex(pattern);
    const keys = this.syncStore.keys();
    const match = keys.filter(x => regex.test(x));
    const entries = match.map(x => [x, this.syncStore.read(x)] as const);
    const result = entries.filter(Boolean) as [string, string][];
    return Promise.resolve(Object.fromEntries(result));
  }

  read(key: string) {
    return Promise.resolve(this.syncStore.read(key));
  }

  write(key: string, value: string) {
    this.syncStore.write(key, value);
    return Promise.resolve();
  }

  delete(key: string) {
    this.syncStore.delete(key);
    return Promise.resolve();
  }
}
