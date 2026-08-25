# Los e2e de pensieve entran en CI

**Status:** ⚪ sin empezar (2026-08-20)

Sale de partir
[`2026-08-20 selectores-de-componente-de-emotion.md`](../decisions/2026-08-20%20selectores-de-componente-de-emotion.md).
La suite pasa entera, 63 tests.

`ci-pensieve.yml` corre `amq pensieve check` —lint, typecheck, build, y el `deno
check`/`deno test` de la API— y nada más. **Los 10 specs de `amq pensieve test`
no los mira nadie**, y esa ceguera es la que dejó pasar cuatro meses de CSS
muerto en producción.

## Por qué estaban fuera, y por qué ya no

Estaban rojos: los seis selectores de componente de emotion lanzaban al arrancar
y cada spec fallaba antes de su primera aserción. Eso ya no pasa. Hoy, en un
portátil, la suite pasa entera contra `vite preview` y contra el servidor de dev.

## Lo que queda por hacer

Un job `e2e` en `ci-pensieve.yml`, hermano del de `check`, que llame a `amq
pensieve test`. **Contra `vite preview`, no contra el dev server**: el build es
lo que se despliega y es donde el bug de emotion no se veía.

## Tres trampas antes de darlo por verde

- **`playwright.config.ts` levanta `npm start`**, o sea vite en modo dev. Para
  correr contra el build hay que cambiar ese `webServer` a `npm run serve` y
  construir antes, o dejar el servidor levantado desde el workflow.
- **`bunx playwright install --with-deps chromium` tarda minutos** en un runner
  limpio. Merece caché, y merece ser un job aparte del de `check` para que un
  fallo de lint no espere a un navegador.
- **Monaco entero viene de `cdn.jsdelivr.net`**, así que la suite depende de la
  red del runner. Lo tolera —los tests pasan igual—, pero es un fallo
  intermitente esperando su día, y ya no hay copia local a la que caer:
  [`2026-08-24 monaco-del-cdn-o-del-bundle.md`](../decisions/2026-08-24%20monaco-del-cdn-o-del-bundle.md).

Y una advertencia: `keyboard.spec.ts` «Ctrl+B toggles sidebar visibility» falló
una vez en local y pasó al reintento. `retries: 1` lo tapa; si vuelve a asomar en
CI, es un test que arregla antes que un reintento que sube.

## Criterios de aceptación

- `ci-pensieve.yml` corre los e2e contra el build, y el job está verde.
- Un fallo de un spec pone el run en rojo — comprobado rompiendo uno a propósito.
- El comentario de `amq/amq-pensieve-test` ya no dice que la suite está fuera.
