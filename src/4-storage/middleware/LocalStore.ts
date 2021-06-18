import { AsyncStore } from '../AsyncStore';

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

  keys() {
    return Promise.resolve(this.syncStore.keys());
  }

  has(key: string) {
    return Promise.resolve(this.syncStore.has(key));
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
