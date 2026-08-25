# 2026-08-24 — `amq pensieve view` y `amq pensieve edit`

Cierra `.agents/plans/amq-pensieve-view-edit.md`. `search` daba ids y leer la
nota seguía pidiendo abrir la web: ahora `view <id>` la escribe por stdout y
`edit <id>` la abre en `$EDITOR` y la guarda de vuelta, con su commit.

Las tres decisiones que el plan dejaba abiertas:

- **Cada comando con su clon.** `view` lee del de `search` (`PENSIEVE_CACHE`,
  caché de sólo lectura); `edit` clona aparte, en `PENSIEVE_EDIT_CLONE`
  (`/tmp/pensieve-data-edit`). Un comando que escribe no comparte directorio
  con dos que dan por hecho que nadie escribe. Clonar y actualizar es ya de los
  tres: `amq/lib/pensieve-data.sh`.
- **El push rebota y ahí se para.** Si la web guarda esa misma nota mientras el
  editor está abierto, el push es rechazado: se dice, se sale 1 y el commit se
  queda en el clon. No se fusiona contenido, y a la siguiente el `pull
  --ff-only` vuelve a parar hasta que alguien lo mire.
- **La metadata la escribe la función de verdad, no una copia en bash.**
  `amq/lib/write-note-meta.ts` importa `getMetadataFromContent` y `datestr` y
  hace el mismo spread que la app: cambian `title`, `group` y `modified`; `id`,
  `created`, `favorite` y `bumped` se copian con su orden intacto, y un `group`
  indefinido desaparece del JSON en vez de valer null. Para poder importarlos
  salieron a `src/2-entities/getMetadataFromContent.ts` y `src/util/datestr.ts`:
  los dos colgaban de ficheros que traen JSON5, y la terminal los carga sin las
  dependencias de la app (`bun --no-install`, sin `node_modules`). `search`
  sigue limpiando el título con awk, que eso sólo se lee.

**`modified` se actualiza siempre; la app no lo hace.** Su `update` compara
ignorando la fecha, así que un cambio de sólo el cuerpo no reescribe el meta.
Aquí se sigue el plan, que lo pedía explícito.

`amq/amq-tests/test-pensieve-view-edit.sh` monta un almacén de mentira —un repo
desnudo con una nota— y cubre los seis casos: sin cambios no hay commit; el
cuerpo solo mueve `modified`; la primera línea renombra y cambia de grupo; el
comentario se queda en la nota y no en el título; un id que no existe sale 1
nombrándolo; y el push rebotado deja publicado lo de la web.
