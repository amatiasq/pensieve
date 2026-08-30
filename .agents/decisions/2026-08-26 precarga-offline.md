# 2026-08-26 — Todas las notas, no sólo las visitadas

Cierra `pensieve/.agents/plans/precarga-offline.md`. Sin red sólo se leían las
notas que se habían abierto alguna vez. **`Preloader`
(`src/4-storage/Preloader.ts`) baja una nota por segundo**, de la lista entera
que le pasa `NotesStorage` en cada reconciliación, ordenada de la más reciente a
la más vieja.

- La cola son las notas que faltan en local, no las que cambiaron: el diff de
  `MixedStore.readAllRemote` es de metadatos, y una nota vieja que nadie toca no
  aparecería nunca. Por eso `MixedStore` no se ha tocado.
- El freno son tres cosas: una por segundo, sólo la pestaña líder (`isLeader()`)
  y 600 llamadas por sesión, un octavo de las 5000 por hora de la cuenta. Lo que
  no entra lo coge la sesión siguiente.
- `ForageStore.has` guarda un conjunto, no una lista: preguntarlo por cada nota
  del repo convertía su caché de 3 s en miles de búsquedas lineales.
- Sin probar con la cuenta real y sus miles de notas; `e2e/preload.spec.ts` sólo
  cubre los criterios contra el repo simulado.
