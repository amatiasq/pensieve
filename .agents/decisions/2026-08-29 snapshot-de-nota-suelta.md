# 2026-08-29 — El snapshot conserva el prefijo `Carpeta - nombre`

**Review:** ⚠️ pendiente — el prefijo se corta por el **primer** ` - `, así que
`A - B - nombre` da `A - <hoy>`. Borra esta línea si ése es el corte que querías.

Cierra `.agents/plans/snapshot-de-nota-suelta.md`. `Carpeta - nombre` es cómo se
saca una nota de su carpeta para verla con la carpeta cerrada, así que **su
snapshot se llama `Carpeta - <hoy>`** y queda al lado de la original. Lo demás no
cambia: con grupo, `# grupo / <hoy>`; sin nada, sólo la fecha.

- Lo pone `snapshotContent` (`2-entities/`), que ya era la única autoridad sobre
  el nombre de la copia; el separador es ` - `, con sus dos espacios.
- Grupo y prefijo se acumulan: `# grupo / Carpeta - <hoy>`.
- `e2e/snapshot.spec.ts` cubre el caso con la nota `travel - japan.md` que se
  añade a las fixtures; la suite entera en verde, 80 tests, y `amq pensieve
  check` también.
