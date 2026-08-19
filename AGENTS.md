# pensieve — AGENTS.md

Notas en un repo privado de GitHub. Reglas del mono:
[`../AGENTS.md`](../AGENTS.md).

## Glosario

- **Nota** — un fichero de texto con id UUID v4. **Su primera línea es su
  nombre**: de ahí salen extensión, carpeta y título, y no hay ningún otro sitio
  donde se guarden. `getMetadataFromContent` es la única autoridad.
- **Grupo** — la carpeta de una nota, la parte a la izquierda de la `/` en la
  primera línea. No existe como entidad: es un derivado del texto, así que
  renombrar la primera línea mueve la nota de carpeta.
- **Repo-como-almacén** — no hay base de datos. Cada nota son dos ficheros del
  repo (`meta/{id}.json` y `note/{id}`), y cada guardado es un commit: el
  historial de la app *es* el historial de git.
- **Store** — la interfaz `AsyncStore` (`readAll`/`read`/`write`/`delete`) sobre
  claves de fichero. Todo lo demás son middlewares que la envuelven:
  `CachedStore` (TTL en memoria), `ForageStore` (IndexedDB),
  `ResilientOnlineStore` (outbox), `GHRepoStore` (GitHub), `MixedStore` (une
  local y remoto).
- **Stale-while-revalidate** — se pinta lo local al instante y se reconcilia con
  lo remoto cuando llega. `MixedStore.readAll` devuelve remoto y escribe la
  diferencia en local; `read` **prefiere remoto** y sólo cae a local si falla.
- **Outbox** — la cola de escrituras que no salieron, en IndexedDB
  (`pensieve-outbox`). Sobrevive al cierre de la pestaña; se vacía al volver la
  red, al volver el foco, o por Background Sync.
- **Leader tab** — de todas las pestañas abiertas, sólo una vacía el outbox y
  hace el polling remoto (`isLeader()`); las demás reciben el resultado por
  `BroadcastChannel`. Sin esto, N pestañas hacen N commits del mismo cambio.
- **Circuit breaker** — tras 3 fallos de servidor seguidos, las llamadas a
  GitHub fallan al instante durante 30 s (o hasta `X-RateLimit-Reset`). Degrada
  la app a modo local en vez de colgarla contra una API caída.
- **`/halt`** — ruta que carga la app **sin lanzar el redirect de OAuth**. Es la
  única forma de llegar a la página con un token roto para arreglarlo.

## Invariantes

- **El `client_secret` de la OAuth App no puede tocar el bundle del cliente.**
  Por eso `/auth` existe como endpoint de servidor: es el único
  sitio donde el intercambio del `code` por token puede ocurrir. Los secretos
  llegan a `api/auth.ts` como variables de entorno, desde un `.env` gitignorado
  —el del servidor lo escribe `amq pensieve secrets`, el de local lo lee `amq
  pensieve local`—, nunca desde `config.json`.
- **La API es del mismo origen que la app, y por eso no hay CORS.** `api/` es un
  servicio Deno en la red `internal` del stack, al que sólo llega el nginx de al
  lado; el cliente pide `/auth` y `/commit` en rutas relativas. Volver a
  separarlos trae de vuelta un CORS que hay que acertar.
- **Las capas `src/0-dom` … `src/7-components` sólo importan de capas de número
  igual o inferior.** Es lo que mantiene el storage y GitHub fuera de la UI, y
  lo comprueba `layers/no-upward-import`, en `eslint.config.js`.
- **Las notas son la copia off-site de todo lo demás.** Son lo que hace falta
  para arreglar el VPS cuando el VPS se rompe, así que pensieve no puede acabar
  dependiendo de aquello que sus notas sirven para reparar. Lo que lo sostiene
  ya no es Cloudflare: **los datos siguen en un repo de GitHub**
  (`amatiasq/pensieve-data`) y la app es una PWA con escrituras offline, así que
  con el VPS caído las notas se leen, se editan y se leen también en GitHub.
- **El camino crítico se usa a diario.** Cualquier cambio en auth, guardado o
  service worker se prueba con la cuenta real y con una pestaña que ya tenga
  pensieve abierto — un service worker viejo esconde el despliegue nuevo.

- **Respaldar un repo es clonarlo, y por eso `restore` se para en el clon.**
  `amq pensieve backup` deja un espejo y un bundle; `amq pensieve restore` lo
  abre y cuenta commits y ficheros. Devolverlo a GitHub es `git push --mirror`,
  que reescribe el repo remoto entero: el comando lo imprime y no lo ejecuta,
  porque un restore que publica solo no se puede ensayar.

Planes en [`.agents/plans/`](.agents/plans/).
