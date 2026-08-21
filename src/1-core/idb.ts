import type { UseStore } from 'idb-keyval';

/**
 * `createStore` de idb-keyval abre la base sin versión y su `onupgradeneeded`
 * sólo salta si la base no existe: sobre la base que dejó localforage
 * (`pensieve-data`/`keyvaluepairs`) el store `keyval` no se creaba nunca,
 * todo tiraba `NotFoundError` y la app tapaba el agujero yendo a GitHub por
 * todo. Un object store sólo se crea dentro de un `onupgradeneeded`, y eso
 * sólo pasa al subir de versión: esto sube la versión. Lo del store viejo no
 * se migra — es una caché y el repo la rellena en una petición.
 */
export function createStore(dbName: string, storeName: string): UseStore {
  let connection: Promise<IDBDatabase> | null = null;

  const db = () => (connection ??= openEnsuringStore(dbName, storeName));

  return ((
    txMode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => unknown,
  ) =>
    db().then(x =>
      callback(x.transaction(storeName, txMode).objectStore(storeName)),
    )) as UseStore;
}

async function openEnsuringStore(dbName: string, storeName: string) {
  // Una base nueva se crea ya con su store, y así no hace falta el upgrade.
  const existing = await open(dbName, undefined, db =>
    db.createObjectStore(storeName),
  );

  if (existing.objectStoreNames.contains(storeName)) {
    return existing;
  }

  // Una conexión abierta bloquea el cambio de versión, así que esta se cierra
  // antes de pedirlo.
  const version = existing.version + 1;
  existing.close();

  return open(dbName, version, db => {
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName);
    }
  });
}

function open(
  dbName: string,
  version: number | undefined,
  upgrade: (db: IDBDatabase) => void,
) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request =
      version == null
        ? indexedDB.open(dbName)
        : indexedDB.open(dbName, version);

    request.onupgradeneeded = () => upgrade(request.result);
    request.onerror = () => reject(request.error);

    // Pensieve vive en varias pestañas, y una que tenga la base abierta bloquea
    // el upgrade de las demás. Cerrarse al oírlo es lo que deja pasar al que
    // sube la versión; sin esto, la primera pestaña abierta lo bloquea hasta que
    // se cierre.
    request.onblocked = () =>
      reject(new Error(`IndexedDB ${dbName}: upgrade blocked by another tab`));

    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}
