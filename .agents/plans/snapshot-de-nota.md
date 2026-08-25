# Snapshot de una nota

**Status:** ⚪ sin empezar (2026-08-25)

Una opción **«Snapshot»** en el menú de cada nota
(`src/7-components/NotesList/NoteActions.tsx`): copia la nota tal cual y a la
copia le cambia la primera línea a `# <carpeta de la nota> / <YYYY-MM-DD>`. La
carpeta es la del título de la original (su parte de grupo).

**El foco se queda en la nota original**: es archivar un estado, no navegar a
la copia.

## Criterios de aceptación

- Tras un Snapshot existe la nota nueva con esa primera línea y el resto del
  contenido idéntico.
- La original no cambia, y la vista no salta de nota.
