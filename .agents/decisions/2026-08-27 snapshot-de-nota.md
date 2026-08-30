# 2026-08-27 — Snapshot de una nota

Cierra `.agents/plans/snapshot-de-nota.md`. **El menú de cada nota tiene una
opción Snapshot: crea una nota con el mismo contenido y la primera línea cambiada
a `# <grupo de la original> / <hoy>`**, sólo la fecha si no hay grupo. No navega
a la copia — archivar un estado no es irse a otro sitio.

- Copiar y renombrar es una sola operación de texto, porque el nombre de una nota
  es su primera línea: `snapshotContent`, en `2-entities/`, pura.
- El contenido sale de `RemoteNote.read()`, o sea lo guardado y no el buffer del
  editor. Si esa lectura falla no se crea nada y se avisa: un snapshot vacío
  pasaría por copia buena de una nota que no se pudo leer.
- `e2e/snapshot.spec.ts` cubre los dos criterios; la suite entera en verde, 79
  tests, y `amq pensieve check` también.
