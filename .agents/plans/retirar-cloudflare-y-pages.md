# Plan — Retirar Cloudflare y Pages de pensieve

**Status:** 👨‍💻 tres pasos de clics, en este orden (2026-08-21). Sale de partir
[`2026-08-21 pensieve-el-corte.md`](../decisions/2026-08-21%20pensieve-el-corte.md).
**Blocker:** ninguno. Hacen falta una sesión de verdad en el navegador, el panel
de Cloudflare y el de GitHub.

`pensieve.amatiasq.com` ya lo sirve el VPS. Siguen en pie los dos sitios de los
que la app ya no depende, y mientras estén ahí nadie sabe si el corte fue de
verdad.

## El orden, que importa

1. **Un login y un guardado de verdad, con la cuenta real**, que aparezca como
   commit en `pensieve-data`, y **desde una pestaña que ya tuviera pensieve
   abierta**: la primera carga tras el cambio llega con el service worker viejo
   registrado, y ése es justo el caso que puede fallar.
2. **Sólo entonces**, borrar los dos Workers de Cloudflare, por nombre:
   `pensieve-api` (la API) y `pensieve` (unos assets que no usa nadie). El
   `account_id` está en [`cloudflare.md`](../../../infra/machines/cloudflare.md).
3. Retirar Pages en `amatiasq/pensieve`: es la rama `gh-pages`, que el mirror no
   toca. Basta con desactivar Pages y borrar la rama; el workflow de mono se
   queda como está.

## Antes de empezar

**No hay vuelta atrás por comando.** Los dos Workers siguen en pie pero ya no se
pueden redesplegar desde aquí: no queda config de wrangler en el repo. Si algo
sale mal en el paso 1, el arreglo es `git revert` del nginx.conf y `amq pensieve
deploy`, no `wrangler deploy` — y por eso el paso 3 va el último, mientras
`gh-pages` siga siendo un sitio al que volver.

## Criterios de aceptación

- Un login y un guardado con la cuenta real, que sale como commit en
  `pensieve-data`, desde una pestaña que ya tuviera pensieve abierta.
- Con la red apagada la app abre y se puede escribir; al volver, sincroniza.
- No queda ningún Worker en pie, ni Pages sirviendo `gh-pages`.
