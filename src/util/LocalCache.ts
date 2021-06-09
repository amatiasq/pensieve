import localforage from 'localforage';

export class LocalCache<T> {
  static as<T>(key: string) {
    const store = localforage.createInstance({ name: key });
    return new LocalCache<T>(store);
  }

  constructor(private readonly store: LocalForage) {}

  has(key = '') {
    return this.store.getItem<T>(key) !== null;
  }

  get(key = '') {
    return this.store.getItem<T>(key);
  }

  set(value: T): Promise<T>;
  set(key: string, value: T): Promise<T>;
  set(keyOrValue: string | T, value?: T) {
    let key;

    if (arguments.length === 1) {
      value = keyOrValue as T;
      key = '';
    } else {
      key = keyOrValue as string;
    }

    return this.store.setItem(key, value);
  }

  child(key: string) {
    return new LocalCache(this.store.createInstance({ name: key }));
  }
}
