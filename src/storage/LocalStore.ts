import { AsyncStore } from './AsyncStore';

export class LocalStore implements AsyncStore {
  constructor(readonly prefix: string) {}

  keys() {
    const keys = [];
    const prefix = `${this.prefix}:`;

    for (let i = 0, len = localStorage.length; i < len; i++) {
      const key = localStorage.key(i)!;
      if (key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    return Promise.resolve(keys);
  }

  readText(key: string) {
    return Promise.resolve(localStorage.getItem(`${this.prefix}:${key}`));
  }

  read<T>(key: string) {
    const json = localStorage.getItem(`${this.prefix}:${key}`);
    if (json == null) return Promise.resolve(null);
    const value = JSON.parse(json);
    return Promise.resolve(value as T);
  }

  writeText(key: string, value: string) {
    localStorage.setItem(`${this.prefix}:${key}`, value);
    return Promise.resolve();
  }

  write<T>(key: string, value: T) {
    const json = JSON.stringify(value);
    localStorage.setItem(`${this.prefix}:${key}`, json);
    return Promise.resolve();
  }

  delete(key: string) {
    localStorage.removeItem(`${this.prefix}:${key}`);
    return Promise.resolve();
  }
}
