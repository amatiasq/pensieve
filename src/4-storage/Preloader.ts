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
 */
export class Preloader {
  private queue: string[] = [];
  private budget = SESSION_BUDGET;
  private timer: ReturnType<typeof setInterval> | null = null;
  private downloading = false;

  constructor(private readonly store: MixedStore) {}

  /** Reemplaza la cola, de la clave más prioritaria a la menos. */
  preload(keys: string[]) {
    if (!this.budget) return;

    this.queue = keys;
    this.timer ??= setInterval(() => this.tick(), TICK_MS);
  }

  private tick() {
    // Sólo la pestaña líder baja: N pestañas serían N veces el rate limit.
    if (this.downloading || !navigator.onLine || !isLeader()) return;

    this.downloading = true;
    this.downloadNext().finally(() => (this.downloading = false));
  }

  private async downloadNext() {
    while (this.queue.length && this.budget) {
      const key = this.queue.shift()!;

      // Abrir una nota la deja en local, así que sale de la cola sola.
      if (await this.store.localHas(key)) continue;

      this.budget--;

      // Un fallo no se reintenta aquí: la sincronización periódica vuelve a
      // encolar lo que siga faltando.
      await this.store.readRemote(key).catch(() => {});
      return;
    }

    this.stop();
  }

  private stop() {
    if (!this.timer) return;

    clearInterval(this.timer);
    this.timer = null;
  }
}
