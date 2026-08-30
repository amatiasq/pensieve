# 2026-08-24 — `amq pensieve view` y `amq pensieve edit`

Cierra `.agents/plans/amq-pensieve-view-edit.md`. `search` daba ids y leer la
nota seguía pidiendo abrir la web: **`view <id>` la escribe por stdout y `edit
<id>` la abre en `$EDITOR` y la guarda de vuelta, con su commit.**

- Cada comando con su clon: `view` lee el de `search` (`PENSIEVE_CACHE`, sólo
  lectura) y `edit` clona aparte en `PENSIEVE_EDIT_CLONE`
  (`/tmp/pensieve-data-edit`); clonar y actualizar es de
  `amq/lib/pensieve-data.sh`.
- Si la web guarda esa misma nota mientras el editor está abierto, el push rebota
  y ahí se para: sale 1, el commit se queda en el clon y no se fusiona contenido.
- La metadata la escribe la función de la app, no una copia en bash:
  `amq/lib/write-note-meta.ts` importa `getMetadataFromContent` y `datestr`, que
  salieron a `src/2-entities/` y `src/util/` para cargarse sin `node_modules`
  (`bun --no-install`).
- `modified` se actualiza siempre y la app no lo hace: su `update` compara
  ignorando la fecha, así que un cambio de sólo el cuerpo no reescribe el meta.
- `amq/amq-tests/test-pensieve-view-edit.sh` monta un almacén de mentira y cubre
  los seis casos, el push rebotado incluido.
