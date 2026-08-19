# Plan — `amq pensieve view <id>` y `amq pensieve edit <id>`

**Status:** ⬜ sin empezar. Continúa lo que
[`amq pensieve search`](../decisions/2026-08-20%20amq-pensieve-search.md) dejó
listo: el clon en caché y los ids que imprime.
**Blocker:** ninguno.

`search` da ids y no hay forma de leer la nota sin abrir la web. Dos comandos:
`view` la escribe por stdout, `edit` la abre en `$EDITOR` y la guarda de vuelta.

## Lo que hay que saber del almacén

Una nota son **dos ficheros** en `pensieve-data`:

| Fichero | Qué es |
|---|---|
| `note/{id}` | el contenido, sin extensión en el nombre |
| `meta/{id}.json` | `id`, `title`, `favorite`, `group`, `created`, `modified`, `bumped` |

**El título y el grupo están en los dos sitios**: en `meta/` como campos, y en el
contenido como su primera línea. La app los deriva del contenido con
`getMetadataFromContent` (`src/2-entities/Note.ts`), así que **editar la primera
línea cambia el título de la nota** y el `meta/` tiene que seguirla — si no, la
app lista un nombre y el fichero dice otro.

Las fechas son `YYYY-MM-DD HH:mm:ss` en hora local (`datestr` en
`src/util/serialization.ts`), y el JSON se escribe con `JSON.stringify(x, null,
2)`. Al leerlo la app usa JSON5 y tolera comas colgando y comentarios; **al
escribirlo, JSON normal**, que es lo que ella genera.

## `view <id>`

`cat` del fichero, más el clon en caché que ya hace `search`. Nada más: no
formatea, no colorea, no pagina — quien quiera un pager lo encañona.

- Un id que no existe: mensaje con el id y salida 1, no un `cat` vacío.
- Acepta el id tal cual lo imprime `search`, sin más ceremonia.

## `edit <id>`

1. Abrir `note/{id}` en `$EDITOR` y esperar.
2. Si el contenido no cambió, salir sin tocar nada.
3. Recalcular título y grupo de la primera línea, **con la misma lógica que
   `getMetadataFromContent`**: quitar el marcador de comentario según la
   extensión, partir por la última `/`, y lo de la izquierda es el grupo.
4. Reescribir `meta/{id}.json` con el `title` y el `group` nuevos si cambiaron, y
   el `modified` siempre. **`created`, `favorite` y `bumped` se copian tal cual**:
   este comando no los decide.
5. Comitear los dos ficheros juntos y empujar.

### Las tres decisiones que este plan tiene que tomar

- **Dónde se edita.** El clon de `search` es caché con `pull --ff-only` y no se
  edita a propósito. `edit` necesita comitear y empujar, así que o el clon deja de
  ser sólo-lectura —y entonces `--ff-only` estorba el día que haya conflicto— o
  `edit` usa un clon propio. **Lo segundo**, salvo que se demuestre molesto: un
  comando que escribe no debería compartir directorio con uno que asume que nadie
  escribe.
- **Qué pasa si la app tiene la nota abierta.** Pensieve escribe desde el
  navegador por la API de GitHub y no sabe de este clon: dos ediciones a la vez
  son un conflicto en el `push`. Con `--ff-only` antes de editar y un mensaje
  claro si el push rebota es suficiente; **no se intenta fusionar contenido**.
- **La lógica duplicada.** `getMetadataFromContent` está en TypeScript y esto es
  bash. Duplicarla es aceptable para la parte visible —`search` ya lo hace— pero
  aquí se **escribe** metadata, y una divergencia corrompe el `meta/`. Antes de
  escribir el bash, decidir si merece salir a un script de node que importe la
  función de verdad.

## Criterios de aceptación

- `amq pensieve view <id>` escribe la nota; un id inexistente sale 1 con un
  mensaje que nombra el id.
- `amq pensieve edit <id>` sin cambios no crea ningún commit.
- Cambiar sólo el cuerpo actualiza `modified` y deja `title` y `group` igual.
- Cambiar la primera línea a `otro grupo/otro título.md` deja `meta/{id}.json`
  con ese `title` y ese `group`, y `created` intacto.
- Una nota cuya primera línea es un comentario (`// x.ts`) mantiene el comentario
  en el contenido y guarda el título sin él.
- El commit lleva los dos ficheros, y la nota se ve cambiada en la web.
