import { isLeader } from '../1-core/tabLeader.ts';
import { MixedStore } from './middleware/MixedStore.ts';

const TICK_MS = 1_000;

// GitHub da 5000 llamadas por hora a la cuenta entera y precargar es lo menos
// urgente que hace la app: se lleva un octavo de esa cuenta y para. Lo que no
// entre lo coge la sesión siguiente, que empieza por lo que siga faltando.
const SESSION_BUDGET = 600;

/**
 * Baja a local, una por segundo, las claves que no estén ya ahí. Sin esto sólo
 * se lee sin red lo que se abrió alguna vez, así que un portátil recién abierto
 * en un avión no tiene las notas viejas.
 *
 * Devuelve `preload`, que reemplaza la cola, de la clave más prioritaria a la
 * menos.
 */
export function createPreloader(store: MixedStore): (keys: string[]) => void {
  let queue: string[] = [];
  let budget = SESSION_BUDGET;
  let timer: ReturnType<typeof setInterval> | null = null;
  let downloading = false;

  return function preload(keys: string[]) {
    if (!budget) return;

    queue = keys;
    timer ??= setInterval(tick, TICK_MS);
  };

  function tick() {
    // Sólo la pestaña líder baja: N pestañas serían N veces el rate limit.
    if (downloading || !navigator.onLine || !isLeader()) return;

    downloading = true;
    downloadNext().finally(() => (downloading = false));
  }

  async function downloadNext() {
    while (queue.length && budget) {
      const key = queue.shift()!;

      // Abrir una nota la deja en local, así que sale de la cola sola.
      if (await store.localHas(key)) continue;

      budget--;

      // Un fallo no se reintenta aquí: la sincronización periódica vuelve a
      // encolar lo que siga faltando.
      await store.readRemote(key).catch(() => {});
      return;
    }

    stop();
  }

  function stop() {
    if (!timer) return;

    clearInterval(timer);
    timer = null;
  }
}
