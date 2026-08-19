# 2026-08-20 — `amq pensieve search`: buscar notas sin abrir la web

`pensieve/amq/amq-pensieve-search <término>` escribe una línea por nota: el
título limpio y su id detrás. Verificado contra el repo real, 3.675 notas: 21 s
la primera vez (el clon), 2 s las siguientes.

**Una nota es un fichero de `pensieve-data` cuya primera línea es su nombre**, así
que buscar por título es mirar primeras líneas. Y como el grupo es la parte
izquierda de la `/` en esa misma línea, buscar por grupo sale gratis, sin que el
grupo exista como carpeta.

## Lo que no es obvio

- **El repo de notas es `pensieve-data`.** `pensieve-dev` es un fork viejo de la
  *app* y no tiene `note/`. Apuntar a otro almacén es `PENSIEVE_DATA_REPO`, la
  misma variable que ya lee `amq pensieve backup`; un repo sin `note/` se rechaza
  con un mensaje que lo dice, en vez del «no such file or directory» de `find`.
- **El clon vive en `PENSIEVE_CACHE` (`/tmp/pensieve-data`) y es caché, no
  backup.** `backups/pensieve-data.git` es de `amq pensieve backup` y este comando
  no lo toca. Clon normal, no `--mirror`: hacen falta los ficheros en disco. Y
  `pull --ff-only`, porque este clon no se edita: si divergió, un merge silencioso
  taparía algo.
- **La primera línea puede venir comentada** (`// grupo/título.ts`, `# …`). Para
  buscar basta la línea cruda; al imprimir se quita el marcador, o media lista
  sale con `//` delante. Los marcadores son los de `COMMENTS_BY_LANG` en
  `src/2-entities/Note.ts`, y el comando no reimplementa
  `getMetadataFromContent` entero.
- **Una sola pasada de `awk` por lote**, no un `head` por nota: con miles de
  ficheros la diferencia son minutos.

Leer y editar una nota desde la terminal es el plan siguiente:
[`amq-pensieve-view-edit.md`](../plans/amq-pensieve-view-edit.md).
