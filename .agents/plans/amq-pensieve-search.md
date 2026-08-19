# Plan — `amq pensieve search`: buscar notas desde la terminal

**Status:** ⬜ propuesta, sin empezar (2026-08-19).
**Blocker:** ninguno. Sólo hay que fijar de qué repo se lee: el enunciado decía
`pensieve-dev`, y ese repo es un fork viejo de la *app* (tiene `.github/`,
`.gitignore`, no tiene `note/`). El almacén de notas es **`pensieve-data`**
(`meta/{id}.json` + `note/{id}`, el mismo que usa `amq pensieve backup`), y es
el que este comando lee salvo que se diga lo contrario.

Hoy para leer una nota hay que abrir la web. La app ya no es la única forma
posible de mirar las notas: **una nota es un fichero de `pensieve-data` cuya
primera línea es su nombre**, así que con el repo clonado la búsqueda por título
es un `grep` de primeras líneas. Este plan añade un único comando, `amq pensieve
search <término>`, y deja la puerta abierta a los que vengan después.

## Fase 1 — El comando

`pensieve/amq/amq-pensieve-search`, en la forma que ya tienen los demás
(`amq-pensieve-backup` es la referencia): pocas líneas, un `print-help`, sin
parseo de flags.

1. **Asegurar el clon.** Si no está, clonar `pensieve-data` en
   `/tmp/pensieve-data`; si está, `git -C … pull --ff-only`. `/tmp` porque es
   caché, no backup — `backups/pensieve-data.git` es de `amq pensieve backup` y
   este comando no lo toca ni lo ensucia. Un clon normal, no `--mirror`: hacen
   falta los ficheros en disco, no sólo el historial.
   - La ruta sale de `PENSIEVE_CACHE` con `/tmp/pensieve-data` por defecto, y el
     repo de `PENSIEVE_DATA_REPO`, la **misma variable** que ya lee
     `amq-pensieve-backup`. Con eso, apuntar a `pensieve-dev` u otro almacén es
     una variable de entorno y no un flag.
2. **Buscar.** Por cada fichero de `note/`, su primera línea; filtrar las que
   casan con el término (`grep -i`, sin distinguir mayúsculas).
3. **Imprimir** una línea por nota: el título tal cual está en la primera línea,
   con el id detrás y en tenue. El id es lo que permite el siguiente comando
   (`amq pensieve show <id>`) y lo que enlaza con la web
   (`https://github.com/amatiasq/pensieve-data/blob/main/note/{id}`).

Detalles que la implementación no puede ignorar, porque están en el código:

- La primera línea **puede venir comentada** (`// grupo/título.ts`, `# …`):
  `getMetadataFromContent` en `src/2-entities/Note.ts` quita el comentario y de
  ahí saca extensión, y parte por `/` en grupo y título. El comando no
  reimplementa esa lógica entera; para buscar basta la línea cruda, pero **al
  imprimir sí conviene quitar el prefijo de comentario**, o media lista sale con
  `//` delante.
- El **grupo es la parte izquierda de la `/`** y no existe como carpeta. Buscar
  por grupo es entonces gratis: el término casa contra la línea completa.

## Fase 2 — Lo que no entra ahora

`show`, `edit`, `info` y buscar en el cuerpo de la nota (no sólo en el título)
son comandos aparte, cada uno con su verbo, y ninguno hace falta para que
`search` sirva. Se añaden cuando se echen de menos, no antes. Lo que sí deja
listo esta fase 1 es la pieza compartida: el clon en caché. Cuando haya un
segundo comando que lo necesite, sale a `pensieve/amq/lib/` — misma convención
que [`amq-paths-lib.md`](../../../.agents/plans/amq-paths-lib.md).

## Criterios de aceptación

- `amq pensieve search <término>` funciona **sin clon previo**: lo crea y busca.
- Corriéndolo dos veces seguidas, la segunda no vuelve a clonar.
- Un término que casa con un grupo devuelve las notas de ese grupo.
- Una nota cuya primera línea es un comentario sale con el título limpio.
- `amq pensieve search` sin argumentos imprime la ayuda y no clona nada.
