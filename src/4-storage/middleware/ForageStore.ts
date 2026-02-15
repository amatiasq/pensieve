import {
  createStore as createIdbStore,
  del,
  get,
  keys,
  set,
  type UseStore,
} from 'idb-keyval';
import { debugMethods } from '../../util/debugMethods.ts';
import { AsyncStore } from '../AsyncStore.ts';
import { patternToRegex } from '../helpers/patternToRegex.ts';

export class ForageStore implements AsyncStore {
  private cachedKeys: string[] | null = null;

  constructor(private readonly store: UseStore) {
    debugMethods(this, ['readAll', 'read', 'write', 'delete']);
  }

  async has(key: string): Promise<boolean> {
    const allKeys = this.cachedKeys || (await keys(this.store)) as string[];

    if (!this.cachedKeys) {
      this.cachedKeys = allKeys;
      setTimeout(() => (this.cachedKeys = null), 3000);
    }

    return allKeys.includes(key);
  }

  async readAll(pattern: string) {
    const regex = patternToRegex(pattern);
    const allKeys = (await keys(this.store)) as string[];
    const match = allKeys.filter(x => regex.test(x));

    const promises = match.map(async key => {
      const content = await this.read(key);
      return [key, content] as const;
    });

    const entries = await Promise.all(promises);
    const result = entries.filter(x => x[1]) as Array<[string, string]>;
    return Object.fromEntries(result);
  }

  read(key: string) {
    return get<string | null>(key, this.store).then(v => v ?? null);
  }

  async write(key: string, value: string) {
    await set(key, value, this.store);
  }

  async delete(key: string) {
    await del(key, this.store);
  }
}

export function createForageStore(name: string) {
  return new ForageStore(createIdbStore(name, 'keyval'));
}
