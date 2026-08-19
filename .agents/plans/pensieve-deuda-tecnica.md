# Plan — deuda técnica de pensieve

**Status:** 🟡 a medias (2026-08-19). Hechos el lint, el CI, la regla de capas y
casi todo lo suelto; quedan vivos dos puntos, cada uno esperando a algo distinto.
**Blocker:** el CORS espera a que se decida [`pensieve-al-vps.md`](pensieve-al-vps.md),
que lo borraría entero en vez de arreglarlo. Los e2e esperan al punto 5, que es
nuevo y no lo cubría este plan.

## 1. El Worker valida un origen que no es el del cliente

⬜ **Pendiente, y a propósito: depende de
[`pensieve-al-vps.md`](pensieve-al-vps.md).** Su fase 2 pone la API en el mismo
origen que la app y el CORS desaparece entero, así que arreglarlo antes de
decidir ese plan es trabajo que se tira. Reverificado el 2026-08-19: sigue tal
cual.

`src/api/index.js` saca el origen de `new URL(request.url).origin` — el del
**propio worker**, que está en la whitelist. `isValidOrigin` siempre pasa, y la
respuesta lleva `Access-Control-Allow-Origin: '*'`, así que `VALID_ORIGINS` no
filtra nada. El impacto es acotado (`/commit` exige el token del usuario en el
body, inalcanzable cross-origin), pero una barrera que no filtra es peor que
ninguna: da falsa confianza.

Arreglo: leer `request.headers.get('Origin')`, validarlo, reflejar **ese** origen
y añadir `Vary: Origin`.

También: el worker loguea el origen en cada request y `owner/repo/branch` en cada
commit — deja escrito a qué repos commitea el usuario.

## 2. El CI mira una décima parte de la red

🟡 **A medias.** `amq pensieve check` corre ahora `lint` + `typecheck` + `build`,
y `ci-pensieve.yml` lo llama igual que antes, así que los tres entran en CI. Los
**10 errores de lint están arreglados** y el job pasa de nombre `typecheck` a
`check`, que es lo que hace.

Los e2e **siguen fuera**, y ya no por el OAuth: fallan los 10 specs en `main`
antes de la primera aserción, por el punto 5. Meterlos en CI hoy es meter un job
rojo. La suite se ejecuta con `amq pensieve test`, que es el verbo canónico y
existe precisamente para que el fallo se vea sin tener que recordar el comando.

## 3. La regla de capas no la comprueba nadie

✅ **Hecho.** `eslint.config.js` trae el plugin local `layers` con la regla
`no-upward-import`: saca el número de capa del primer segmento bajo `src/`,
resuelve el import relativo y reporta si apunta más arriba. Cubre `import`,
`import()` y los re-export. Cero dependencias nuevas, ~40 líneas.

Encontró una violación real: `0-dom/tooltip.ts` importaba `1-core/mouse.ts`, y
`1-core/keyboard.ts` importa `0-dom/isMobile.ts` — un ciclo entre las dos capas
de abajo. `mouse.ts` es DOM puro (`document.addEventListener`, `clientX`), así
que se ha movido a `0-dom/mouse.ts`.

**`5-app` queda declarada como raíz de composición** y exenta como *origen* de
imports: monta hooks y componentes a propósito, así que su número miente. Sigue
siendo destino comprobado, o sea que el ejemplo del plan original — un import de
`2-entities` a `5-app` — salta igual. La alternativa era renumerarla por encima
de `7-components`, que mueve carpetas y no gana nada, porque por encima de 7 no
hay capa a la que pudiera saltar.

## 4. Suelto

- ~~**Dos lockfiles en git.**~~ ✅ hecho: `package-lock.json` fuera, sólo
  `bun.lock`. `bun install --frozen-lockfile` pasa limpio.
- ~~**El filtro sólo busca por título y grupo.**~~ ✅ ya estaba: la afirmación
  era falsa. `useFilteredNotes` filtra por título y grupo al instante y luego
  `searchInContent` recorre el contenido, primero lo cacheado y después hasta 100
  notas de GitHub. Lo que sí chirría es *cómo*: un `setTimeout` en el cuerpo del
  render, un contador de iteración en el módulo y un resultado por pasada. Eso es
  otro plan, no éste.
- ~~`ForageStore.readAll`~~ ✅ hecho: un cursor con `IDBKeyRange` sobre el
  prefijo del patrón, en una sola transacción. Antes leía todas las claves,
  filtraba en JS y pedía cada valor por separado: N+1 transacciones.
- ~~`MemoryCache` sólo caduca al tocarla.~~ ✅ ya estaba: tiene un
  `setInterval` de 60 s que barre las entradas vencidas.
- ~~`src/api/.eslintrc` no lo linta nadie.~~ ✅ hecho: `.eslintrc` borrado,
  `src/api/**` fuera de los `ignores` y con los globals del Worker declarados —
  los dos secretos que inyecta wrangler incluidos, que es donde se ve que existen.
- Actualizaciones menores: ✅ ESLint 9→10 y react-router 6→7 (los future flags
  eran el trabajo y en 7 ya son el defecto; el uso es `Routes`/`Route`/`Link`/
  `useParams`/`useNavigate`, intacto). ⬜ **Monaco 0.52 se queda**: ver punto 6.

## 5. `@emotion/babel-plugin` no corre desde julio

⬜ **Nuevo, y es lo que tiene los e2e en rojo.** Un PR de Dependabot del
2026-07-16 subió `vite` 6→8 y `@vitejs/plugin-react` 4→6, y **la 6 no tiene
opción `babel`**: transforma con oxc. El
`babel: { plugins: ['@emotion/babel-plugin'] }` de `vite.config.ts` lleva desde
el 2026-07-16 sin ejecutarse y nadie se enteró, porque el CI sólo corría
`typecheck`. Es literalmente el síntoma que describe el punto 2.

Rompe los **selectores de componente** de emotion, los seis:

```
src/5-app/App.tsx:45                      ${GridResizer}
src/7-components/atoms/Loader.tsx:44      ${Ripple}
src/7-components/atoms/Disclosure.tsx:19  ${AnimatedIcon}
src/7-components/NotesList/NoteItem.tsx:29,33  ${StyledActions}, ${StyledFavouriteButton}
src/7-components/NotesList/NoteGroup.tsx:54    ${Content}
```

En dev lanza `Component selectors can only be used in conjunction with
@emotion/babel-plugin` y la app no arranca — de ahí los 10 specs. **En
producción no lanza: se traga el selector y pierde esas reglas**, así que hay
CSS muerto en la app en uso desde julio.

Dos caminos, y son incompatibles:

1. **Devolver el babel**: `vite-plugin-babel` (dependencia nueva) o volver a
   vite 7 + plugin-react 4 (migrar el toolchain hacia atrás). Las dos chocan con
   el `AGENTS.md` raíz — «ask before adding dependencies», «don't migrate a
   toolchain unasked».
2. **Quitar los seis selectores de componente**, dándole a cada uno una clase
   estable. Sin dependencias ni toolchain, pero toca CSS de cinco componentes de
   una app de uso diario y el cambio no se valida con los tests: se valida
   mirándola.

## 6. Monaco 0.52→0.55 rompe el precache del PWA

⬜ **Nuevo.** Probado con 0.55 y con 0.56: las dos parten un chunk
`assets/ts.worker-*.js` de **6,9 MB**, por encima del
`maximumFileSizeToCacheInBytes` de 5 MB de `vite.config.ts`, y el build falla. En
0.52 ese chunk no existe.

Subir el límite significa precachear 6,9 MB **muertos**: `@monaco-editor/react`
no está configurado con `loader.config()`, así que en runtime Monaco se carga del
CDN de jsdelivr y la copia del bundle (3,7 MB hoy) no la ejecuta nadie. Antes de
tocar la versión hay que decidir de dónde sale Monaco; entonces el límite del
precache se decide solo. Mientras tanto, 0.52.

## Lo que no se toca

El token de GitHub vive en `localStorage` y da escritura al repo: un XSS se lo
lleva. Es el modelo estándar de una SPA y sacarlo de ahí exige que el token no
toque el JS del cliente (cookie httpOnly gestionada por el worker), lo que cambia
el flujo entero. Queda escrito como decisión consciente, no como pendiente.
