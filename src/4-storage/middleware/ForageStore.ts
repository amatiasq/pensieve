import { del, get, keys, set, type UseStore } from 'idb-keyval';
import { createStore as createIdbStore } from '../../1-core/idb.ts';
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

  readAll(pattern: string) {
    const regex = patternToRegex(pattern);
    const range = prefixRangeFor(pattern);

    return this.store('readonly', store => {
      const result: Record<string, string> = {};
      const request = store.openCursor(range);

      return new Promise<Record<string, string>>((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return resolve(result);

          const key = String(cursor.key);
          if (regex.test(key) && cursor.value) result[key] = cursor.value;
          cursor.continue();
        };
      });
    });
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

// Un patrón `prefijo*` es un rango de claves: el cursor se salta las que no
// empiezan por ahí en vez de leerlas todas para descartarlas en JS después.
function prefixRangeFor(pattern: string) {
  const [prefix] = pattern.split('*');
  if (!prefix || pattern.startsWith('*')) return undefined;
  return IDBKeyRange.bound(prefix, `${prefix}\uffff`);
}
