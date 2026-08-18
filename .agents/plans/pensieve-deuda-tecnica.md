# Plan — deuda técnica de pensieve

**Status:** ⬜ sin empezar (2026-08-07). Lo de `docs/implement.md` que seguía
vivo; el resto (React 19, router 6, Monaco 0.52, ESLint 9, wrangler 4,
idb-keyval, Playwright, outbox, circuit breaker, leader tab, indicador de sync,
runtime caching del SW) ya está hecho.
**Blocker:** el CORS depende de `pensieve-al-vps.md` — su fase 2 borra el CORS
entero, así que antes de arreglar `isValidOrigin` hay que decidir ese plan. El
resto (lint en 10 errores, los 10 specs e2e fuera de CI) no tiene blocker.

## 1. El Worker valida un origen que no es el del cliente

`src/api/index.js` saca el origen de `new URL(request.url).origin` — el del
**propio worker**, que está en la whitelist. `isValidOrigin` siempre pasa, y la
respuesta lleva `Access-Control-Allow-Origin: '*'`, así que `VALID_ORIGINS` no
filtra nada. El impacto es acotado (`/commit` exige el token del usuario en el
body, inalcanzable cross-origin), pero una barrera que no filtra es peor que
ninguna: da falsa confianza.

Arreglo: leer `request.headers.get('Origin')`, validarlo, reflejar **ese** origen
y añadir `Vary: Origin`. **Antes decidir si compensa**: la fase 2 de
[`pensieve-al-vps.md`](pensieve-al-vps.md) pone la API en el mismo origen que la
app y el CORS desaparece entero en vez de tener que estar bien.

También: el worker loguea el origen en cada request y `owner/repo/branch` en cada
commit — deja escrito a qué repos commitea el usuario.

## 2. El CI mira una décima parte de la red

`ci-pensieve.yml` corre sólo `typecheck` vía `amq pensieve check`. Existen
`lint` (**10 errores** acumulados, reverificados el 2026-08-17, todos triviales:
variables sin usar, expresiones sin efecto), `build`, y **10 specs de Playwright**
— nada de eso se ejecuta. La red existe y es buena; sin correrla se degrada en silencio, que es
justo lo que le pasó al lint.

Los e2e **ya no están bloqueados por el OAuth**: `e2e/fixtures.ts` intercepta el
endpoint `/auth` y monta un repo mock en memoria. Orden: arreglar el lint, meter
`lint`+`build` en el job existente, y los e2e en un job aparte (necesitan
navegadores, no deben frenar el feedback rápido).

## 3. La regla de capas no la comprueba nadie

Las carpetas están numeradas `0-dom` … `7-components` para que cada una sólo
importe de capas de número igual o inferior, pero es una convención de honor: un
import de `2-entities` a `5-app` se descubre por casualidad meses después.

Se hace con un plugin local en la flat config (~25 líneas, cero dependencias):
el número de capa es el primer segmento bajo `src/`, se compara el del fichero
con el del import resuelto y se reporta si apunta más arriba. Lo fino es resolver
los `../`; si da guerra, `eslint-plugin-boundaries` hace esto mismo de forma
declarativa a cambio de una devDependency.

## 4. Suelto

- **Dos lockfiles en git** (`bun.lock` y `package-lock.json`): dos fuentes de
  verdad de las versiones. El proyecto corre con Bun; sobra el otro.
- **El filtro sólo busca por título y grupo.** Con las notas ya en IndexedDB, la
  búsqueda full-text es local y no cuesta llamadas a GitHub.
- `ForageStore.readAll` lee todas las claves y filtra en JS; con miles de notas
  toca cursores con key ranges.
- `MemoryCache` sólo caduca entradas cuando alguien las toca, así que las que
  nadie vuelve a pedir se quedan en memoria.
- `src/api/.eslintrc` es formato viejo y `eslint.config.js` ignora `src/api/**`:
  ese código no lo linta nadie.
- Actualizaciones menores pendientes: react-router 6→7 (sin breaking changes si
  se activan los future flags), Monaco 0.52→0.55, ESLint 9→10.

## Lo que no se toca

El token de GitHub vive en `localStorage` y da escritura al repo: un XSS se lo
lleva. Es el modelo estándar de una SPA y sacarlo de ahí exige que el token no
toque el JS del cliente (cookie httpOnly gestionada por el worker), lo que cambia
el flujo entero. Queda escrito como decisión consciente, no como pendiente.
