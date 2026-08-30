# 2026-08-20 — `amq pensieve search`: buscar notas sin abrir la web

`amq pensieve search <término>` escribe una línea por nota, título limpio e id.
**Buscar por título es mirar primeras líneas**, y buscar por grupo sale gratis:
el grupo es la parte izquierda de esa misma línea. Contra el repo real, 3.675
notas: 21 s la primera vez (el clon), 2 s las siguientes. Leer y editar vino
después:
[`2026-08-24 amq-pensieve-view-edit.md`](2026-08-24%20amq-pensieve-view-edit.md).

- El almacén es `pensieve-data`, no `pensieve-dev` —un fork viejo de la *app*,
  sin `note/`—; lo cambia `PENSIEVE_DATA_REPO` y un repo sin `note/` se rechaza
  diciéndolo, en vez del «no such file or directory» de `find`.
- El clon de `PENSIEVE_CACHE` (`/tmp/pensieve-data`) es caché, no el backup de
  `backups/pensieve-data.git`; va con `pull --ff-only`, que aquí nadie edita y un
  merge silencioso taparía algo.
- La primera línea puede venir comentada (`// grupo/título.ts`): al imprimir se
  le quita el marcador, de `COMMENTS_BY_LANG` (`src/2-entities/Note.ts`).
- Una sola pasada de `awk` por lote, no un `head` por nota: con miles de ficheros
  la diferencia son minutos.
