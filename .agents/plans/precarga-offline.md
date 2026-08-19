# Plan — Precarga: que *todas* las notas estén offline

**Status:** ⬜ propuesta con diseño, sin empezar.
**Blocker:** ninguno.

Hoy sólo funcionan offline las notas que se abrieron alguna vez. La PWA guarda lo
visitado, así que un portátil recién abierto sin red no tiene las notas viejas.

## La cola

Al listar notas se encolan las que traen `modified` nuevo, ordenadas por fecha, y
se descargan despacio (~1/s) para no gastar el rate limit de GitHub. Abrir una
nota la saca de la cola: ya se descargó.

El ritmo sigue una curva `__/‾‾`: mucho esfuerzo en lo reciente, poco en lo
viejo. Lo de hace dos años se precarga al final o no se precarga.

## El enganche

`MixedStore` (`src/4-storage/middleware/MixedStore.ts`) ya ve las claves nuevas
al reconciliar en `readAllRemote`. De ahí sale la cola: o el precargador se
engancha ahí, o `MixedStore` emite un evento y el precargador lo escucha. Lo
segundo si no se quiere que el store sepa que existe un precargador.

## Criterios de aceptación

- Con la red apagada tras un rato de uso, una nota que nunca se abrió se lee.
- La precarga no dispara el rate limit de GitHub en una sesión normal.
- Abrir una nota encolada no la descarga dos veces.
