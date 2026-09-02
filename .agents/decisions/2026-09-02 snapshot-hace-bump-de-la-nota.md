# 2026-09-02 — El snapshot deja la original por delante de la copia

**Review:** ⚠️ pendiente — la copia ya no nace en favoritos y el empate de
fechas lo gana la nota más antigua. Borra esta línea si querías los snapshots
destacados o el empate al revés.

Cierra `.agents/plans/snapshot-hace-bump-de-la-nota.md`. **Tras un snapshot la
nota original queda por encima de su copia**: al crearla se le hace `bump()`.

- El bump solo no bastaba: la copia nacía `favorite: true` y los favoritos van
  primero, así que `store.create` acepta `{ favorite: false }` y el snapshot lo
  usa — archivar no es destacar.
- `datestr()` va al segundo, así que la copia y el bump empatan casi siempre;
  `useNoteList` rompe el empate por `created` ascendente y gana la original.
- Crear y bumpear seguido destapó una carrera vieja de `useNoteList`: sus
  eventos partían del `value` del render que los suscribió, y el segundo borraba
  la copia de la barra una de cada diez veces. Ahora todos van por
  `setValue(current => …)`, y un cambio de una nota que ya no está se ignora en
  vez de tirar.
- `e2e/snapshot.spec.ts` cubre el orden en la barra; la suite entera en verde
  tres veces seguidas (81 tests), y `amq pensieve check` también.
- Sin desplegar: la tanda corría sin nadie delante.
