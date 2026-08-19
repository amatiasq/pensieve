# 2026-08-20 — La deuda técnica de pensieve, salvo dos puntos

Cierra `pensieve/.agents/plans/pensieve-deuda-tecnica.md`. Cuatro de sus seis
puntos están hechos; los dos que quedan salen como planes propios y están al
final.

## El CORS entero dejó de existir

El Worker validaba un origen que no era el del cliente. **No se arregló
`isValidOrigin`: se borró todo.** La API pasó a ser del mismo origen que la app
([`2026-08-20 pensieve-desacoplado-de-cloudflare.md`](2026-08-20%20pensieve-desacoplado-de-cloudflare.md)),
así que la
whitelist, el `Access-Control-Allow-Origin: '*'` y la barrera que no filtraba
dejaron de existir en vez de tener que estar bien. Los logs que dejaban escrito a
qué repos commitea el usuario se fueron con ellos.

## El CI mira `check`, no `typecheck`

`amq pensieve check` corre `lint` + `typecheck` + `build`, y `ci-pensieve.yml` lo
llama igual que antes, así que los tres entran en CI. Los **10 errores de lint
están arreglados** y el job pasa de llamarse `typecheck` a `check`, que es lo que
hace.

**El build entra en el check a propósito**: `typecheck` solo miraba una décima
parte de la red, y esa ceguera es la que dejó pasar cuatro meses de
`@emotion/babel-plugin` sin ejecutarse.

Los e2e siguen fuera, y eso es lo que arregla el plan de los selectores.

## La regla de capas la comprueba eslint

`eslint.config.js` trae el plugin local `layers` con la regla `no-upward-import`:
saca el número de capa del primer segmento bajo `src/`, resuelve el import
relativo y reporta si apunta más arriba. Cubre `import`, `import()` y los
re-export. **Cero dependencias nuevas, ~40 líneas.**

Encontró una violación real: `0-dom/tooltip.ts` importaba `1-core/mouse.ts` y
`1-core/keyboard.ts` importa `0-dom/isMobile.ts` — un ciclo entre las dos capas de
abajo. `mouse.ts` es DOM puro (`document.addEventListener`, `clientX`), así que se
movió a `0-dom/mouse.ts`.

**`5-app` queda declarada como raíz de composición** y exenta como *origen* de
imports: monta hooks y componentes a propósito, así que su número miente. Sigue
siendo destino comprobado, o sea que un import de `2-entities` a `5-app` salta
igual. La alternativa era renumerarla por encima de `7-components`, que mueve
carpetas y no gana nada: por encima de 7 no hay capa a la que pudiera saltar.

## Lo suelto

- **Un solo lockfile**: `package-lock.json` fuera, sólo `bun.lock`.
- **`ForageStore.readAll`** es ahora un cursor con `IDBKeyRange` sobre el prefijo
  del patrón, en una sola transacción. Antes leía todas las claves, filtraba en JS
  y pedía cada valor por separado: N+1 transacciones.
- **`src/api/.eslintrc` borrado**: ese código ya no es del Worker ni es JS — es
  `api/`, Deno, y lo comprueban `deno check` y `deno lint`.
- **ESLint 9→10 y react-router 6→7.** Los future flags eran el trabajo y en la 7
  ya son el defecto; el uso es `Routes`/`Route`/`Link`/`useParams`/`useNavigate`,
  intacto.

Y **dos afirmaciones del plan que eran falsas**: el filtro *sí* busca en el
contenido (`useFilteredNotes` filtra título y grupo al instante y `searchInContent`
recorre el cuerpo), y `MemoryCache` *sí* caduca sola, con un `setInterval` de 60 s.
Lo que chirría del filtro es *cómo* —un `setTimeout` en el cuerpo del render, un
contador de iteración en el módulo y un resultado por pasada—, y eso es otro plan.

## Lo que no se toca, a propósito

**El token de GitHub vive en `localStorage` y da escritura al repo: un XSS se lo
lleva.** Es el modelo estándar de una SPA, y sacarlo de ahí exige que el token no
toque el JS del cliente —cookie httpOnly gestionada por el servidor—, lo que cambia
el flujo entero. Queda escrito como decisión consciente, no como pendiente.

## Lo que falta, en dos planes

- [`selectores-de-componente-de-emotion.md`](../plans/selectores-de-componente-de-emotion.md)
  — el punto 5, que es lo que tiene los e2e fuera de CI.
- [`monaco-del-cdn-o-del-bundle.md`](../plans/monaco-del-cdn-o-del-bundle.md) — el
  punto 6, que es una decisión antes que un trabajo.
