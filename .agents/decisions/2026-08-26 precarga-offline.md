# 2026-08-26 — Todas las notas, no sólo las visitadas

**Review:** ⚠️ pendiente — el presupuesto de 600 llamadas por sesión sale de un
cálculo, no de una medición. Mira `X-RateLimit-Remaining` tras un día normal de
uso con la cuenta real y borra esta línea si sobra cuota.

Cierra `pensieve/.agents/plans/precarga-offline.md`. Sin red sólo se leían las
notas que se habían abierto alguna vez, así que un portátil recién abierto no
tenía las viejas.

## La cola

`Preloader` (`src/4-storage/Preloader.ts`) baja a local una nota por segundo,
saltándose las que ya están ahí. `NotesStorage` le pasa la lista entera cada vez
que reconcilia —al cargar y en cada sincronización—, ordenada de la más reciente
a la más vieja: eso es el `__/‾‾` del plan, mucho esfuerzo en lo reciente y lo de
hace dos años al final o nunca.

**La cola son las notas que faltan en local, no las que cambiaron.** El plan
apuntaba al diff de `MixedStore.readAllRemote`, pero ese diff es de metadatos: una
nota vieja que nadie toca nunca aparecería ahí, y nunca se precargaría. Con
«¿está en local?» la cola se vacía sola sesión a sesión hasta tenerlo todo.

Por eso `MixedStore` no se ha tocado: la reconciliación sigue siendo suya y el
store sigue sin saber que existe un precargador, que era lo que el plan quería.

## El freno

Precargar es pedir un fichero por nota, justo lo que el tarball existe para no
hacer. El freno son tres cosas: una por segundo, sólo la pestaña líder
(`isLeader()`, como el polling) y **600 llamadas por sesión** — un octavo de las
5000 por hora de la cuenta. Lo que no entra lo coge la sesión siguiente.

## Lo suelto

- **`ForageStore.has` guarda un conjunto, no una lista.** Preguntarlo por cada
  nota del repo convertía su caché de 3 s en miles de búsquedas lineales.
- El buscador gana de rebote: `useFilteredNotes` sólo mira el cuerpo de las notas
  que están en caché, y ahora acaban estándolo todas.

## Lo que no se pudo comprobar

`e2e/preload.spec.ts` cubre los tres criterios del plan contra el repo simulado.
Con la cuenta real y sus miles de notas no se ha probado: hace falta una sesión
de verdad, y es lo que mira la línea de review.
