import { expect, test } from '@playwright/test';

// La base la creó localforage con su store `keyvaluepairs`, y a idb-keyval se le
// pide `keyval` sobre esa misma base: como la abre sin versión, su upgrade no
// salta y el store no se crea nunca. Cada lectura y cada escritura de lo local
// tiraban `NotFoundError` y la app iba a GitHub por todo, en silencio.
test.describe('createStore sobre una base que ya existe', () => {
  test('crea el object store que falta en vez de fallar para siempre', async ({
    page,
  }) => {
    // `/halt` es la app sin el redirect de OAuth: sirve para tener el origen y
    // los módulos de vite sin que la carga se lleve la pestaña a GitHub.
    await page.goto('/halt');

    const result = await page.evaluate(async () => {
      const dbName = `legacy-forage-${Math.random().toString(36).slice(2)}`;
      const request = <T>(req: IDBRequest<T>) =>
        new Promise<T>((resolve, reject) => {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

      // La base tal y como la dejó localforage.
      const legacy = indexedDB.open(dbName);
      legacy.onupgradeneeded = () =>
        legacy.result.createObjectStore('keyvaluepairs');
      (await request(legacy)).close();

      const { createStore } = await import('/src/1-core/idb.ts');
      const store = createStore(dbName, 'keyval');

      await store('readwrite', s =>
        request(s.put('{"id":"una-nota"}', 'meta/una-nota.json')),
      );
      const read = await store('readonly', s =>
        request(s.get('meta/una-nota.json')),
      );

      // El store viejo sigue ahí: subir la versión no se lleva nada por delante.
      const reopened = await request(indexedDB.open(dbName));
      const stores = [...reopened.objectStoreNames].sort();
      reopened.close();

      return { read, stores, version: reopened.version };
    });

    expect(result.read).toBe('{"id":"una-nota"}');
    expect(result.stores).toEqual(['keyval', 'keyvaluepairs']);
    expect(result.version).toBe(2);
  });
});
