# Ideas y bugs abiertos de pensieve

**Status:** ⬜ backlog, sin compromiso. Lo único con diseño es la cola de
precarga.
**Blocker:** ninguno; nada de aquí está comprometido.

Lo que quedaba vivo de `docs/notes.md`. Sin fechas.

## Bugs

- **Commits vacíos**: el historial del repo de datos está lleno de ellos. Mirar
  si la API de GitHub puede rechazarlos o si hay que comparar antes de commitear.
- **El filtro devuelve resultados en orden errático**: buscando "Pensieve"
  salen primero los buenos, luego casi todas las notas, luego otra vez los
  buenos. Es `match-sorter` puntuando algo que no queremos.

## Precarga: que *todas* las notas estén offline

Hoy sólo funcionan offline las notas abiertas alguna vez. La idea es una cola de
precarga: al listar notas se encolan las que tienen `modified` nuevo, ordenadas
por fecha, y se van descargando despacio (~1/s) para no gastar el rate limit de
GitHub; abrir una nota la saca de la cola porque ya se descargó. El ritmo debería
seguir una curva `__/‾‾`: mucho por lo reciente, poco por lo viejo.

El enganche natural es `MixedStore`, que ya ve las claves nuevas al reconciliar
`readAllRemote` — o emitir desde ahí un evento que capture el precargador.

## Nice to have

- Crear nota desde la selección (menú contextual); en una nota nueva, el texto
  por defecto debería venir ya seleccionado.
- Web Share Target API / `registerProtocolHandler`, para mandar cosas a pensieve
  desde el sistema.
- Renombrar un grupo entero (hoy es editar la primera línea de cada nota).
- Enlazar `{{otras notas}}`.
- Tema claro. Compartir como gist. Diseñar la página de settings.
