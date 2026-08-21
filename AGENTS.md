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
  lado; el cliente pide `/auth`, `/commit` y `/tarball` en rutas relativas.
  Volver a separarlos trae de vuelta un CORS que hay que acertar.

- **El arranque en frío se lee de un tarball, no fichero a fichero.** Las notas
  son miles de ficheros y la cuenta tiene 5000 llamadas por hora: pedir una por
  nota agota el rate limit de la hora entera antes de acabar de cargar, y la app
  se queda sin lista. Por eso existe `/tarball` —el navegador no puede pedirlo
  él, porque `api.github.com` redirige a `codeload.github.com`, que no permite
  el origen de la app— y por eso `readDirViaTree` se rinde y se lo pide al
  tarball en vez de seguir: rendirse deja la app leyendo lo local, que es mucho
  mejor que gastar la hora en una carga que no va a terminar.

- **Un object store que falta se crea; no se da por hecho que esté.** El
  `createStore` de idb-keyval abre la base sin versión, así que su upgrade sólo
  salta cuando la base no existe: si existe y le falta su store, cada lectura y
  cada escritura tiran `NotFoundError` para siempre. Le pasó a lo local —
  localforage había creado `pensieve-data` con el store `keyvaluepairs`, y a
  idb-keyval se le pedía `keyval` sobre esa misma base—, y la caché quedó muerta
  sin que nada lo dijera: la app tapó el agujero yendo a GitHub por todo, que es
  lo que agotaba el rate limit. Las bases se abren por
  [`1-core/idb.ts`](src/1-core/idb.ts), que sube la versión para crear el store
  que falte. Lo que hubiera en el store viejo no se migra: es una caché, y el
  repo la rellena entera en una petición.

- **Lo que el tarball baja se lee del disco cuando GitHub no contesta.** El
  tarball trae el contenido de **todas** las notas, no sólo la lista, y lo deja
  en `pensieve-dir-cache`. Si al abrir una nota se pidiera otra vez a la API y la
  API dijera que no —rate limit agotado, token caducado, sin red—, la app tendría
  la nota en disco y aun así abriría el editor vacío. Por eso `readFile` cae a la
  caché de directorios cuando la petición falla. `readDirViaTree` **no** pasa por
  ahí, usa `requestFile`: lo que guarda queda apuntado con el SHA nuevo, y con
  contenido viejo bajo un SHA nuevo la nota se queda desactualizada para siempre.

- **Un editor vacío nunca sustituye a una lectura que falló.** No estar en caché
  no es «la nota está vacía»: si lo local gana la carrera con un valor por
  defecto, el fallo del remoto no aparece en ninguna parte y guardar encima se
  lleva la nota por delante. `fetchAndUpdate` sólo contesta con lo local si
  `isValid` lo acepta, y si no puede ni lo local ni el remoto **falla**;
  `EditNoteFromUrl` enseña el error en vez del editor.

- **Lo que la caché guarda de cada fichero es su SHA de git**, o sea
  `sha1("blob " + tamaño + "\0" + contenido)`, que es el mismo que trae
  `git/trees`. Es lo único que hace comparable el tarball con la sincronización
  siguiente: con un hash cualquiera nada coincide y el repo se vuelve a pedir
  entero, nota a nota.
- **Las capas `src/0-dom` … `src/7-components` sólo importan de capas de número
  igual o inferior.** Es lo que mantiene el storage y GitHub fuera de la UI, y
  lo comprueba `layers/no-upward-import`, en `eslint.config.js`.
- **Las notas son la copia off-site de todo lo demás.** Son lo que hace falta
  para arreglar el VPS cuando el VPS se rompe, así que pensieve no puede
  acabar dependiendo de aquello que sus notas sirven para reparar: los datos
  viven en un repo de GitHub (`amatiasq/pensieve-data`) y la app es una PWA
  con escrituras offline, así que con el VPS caído las notas se leen y se
  editan.
- **El layout de la página se deriva del render, no del evento
  `onNavigate`.** En móvil cada página tiene su propio `grid-template-areas`, y
  quien lo elige es la clase `page-*` de `App`. Si esa clase saliera de un
  `useState` alimentado por `navigator.onNavigate`, nunca cambiaría: los efectos
  de los hijos corren antes que los del padre, así que `Router` emite la
  navegación antes de que `App` haya vuelto a suscribirse, y el grid se queda en
  la página anterior hasta el siguiente refresh —header de la sidebar sobre la
  nota, pantalla en blanco al volver atrás—. En escritorio no se ve porque home
  y note comparten el mismo grid.

- **El camino crítico se usa a diario.** Cualquier cambio en auth, guardado o
  service worker se prueba con la cuenta real y con una pestaña que ya tenga
  pensieve abierto — un service worker viejo esconde el despliegue nuevo.

- **Respaldar un repo es clonarlo, y por eso `restore` se para en el clon.**
  `amq pensieve backup` deja un espejo y un bundle; `amq pensieve restore` lo
  abre y cuenta commits y ficheros. Devolverlo a GitHub es `git push --mirror`,
  que reescribe el repo remoto entero: el comando lo imprime y no lo ejecuta,
  porque un restore que publica solo no se puede ensayar.
- **La copia de fuera no la hace este comando: la baja Cereza**, con una llave de
  despliegue de sólo lectura, y su ensayo diario clona ese espejo. Aquí sólo queda
  la copia de Lorelei — dos caminos copiando los mismos 97 M ocupan el doble.

Planes en [`.agents/plans/`](.agents/plans/).
