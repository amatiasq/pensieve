# Plan — El corte: pensieve sale de Cloudflare

**Status:** 🟡 el código está listo y probado en local, **sin desplegar**; el
paso 1 hecho. Sale de partir
[`2026-08-20 pensieve-desacoplado-de-cloudflare.md`](../decisions/2026-08-20%20pensieve-desacoplado-de-cloudflare.md).
**Blocker:** ninguno. Los dos `client_secret` ya están en 1Password y
`amq-pensieve-secrets` los lee; lo que queda empieza por `amq pensieve deploy`.

**Producción lleva sin desplegar desde el 2025-11-19**: lo que sirve hoy es de hace
nueve meses. Este plan es lo que la descongela.

Los pasos 3, 4 y 5 son clics —una sesión de verdad en el navegador, el panel de
Cloudflare y el de GitHub—, y por eso este plan estuvo marcado 👨‍💻. Pero el que
lo desatasca, el 2, es un comando: se ejecuta y luego se piden los clics.

## El orden, que importa

1. **Regenerar los dos `client_secret`** ✅ (2026-08-20). El ítem
   `Pensieve / .env` existe en el vault `Projects` con los dos campos con valor, y
   su id está dentro de `amq-pensieve-secrets`, así que ya no hace falta
   `PENSIEVE_OP_ITEM`.

   El id que llevaba el script era el del ítem **`Pensieve`** —el login de la web,
   que no tiene estos campos—, no el de `Pensieve / .env`. Se veía porque falla
   cerrado y lo dice, pero se veía al desplegar; corregido.
2. `amq pensieve deploy`, que llama a `secrets` él solo.
3. **Un login y un guardado de verdad, con la cuenta real**, que aparezca como
   commit en `pensieve-data`, y **desde una pestaña que ya tuviera pensieve
   abierta**: la primera carga tras el cambio llega con el service worker viejo
   registrado, y ese es justo el caso que puede fallar.
4. **Sólo entonces**, `wrangler delete` de `pensieve-api` y de `pensieve`.
5. Retirar Pages en `amatiasq/pensieve`: es la rama `gh-pages`, que el mirror no
   toca. Basta con desactivar Pages y borrar la rama; el workflow de mono se queda
   como está.

## Antes de empezar

**No hay vuelta atrás por comando.** Los dos Workers siguen en pie pero ya no se
pueden redesplegar desde aquí: no queda config de wrangler en el repo. Si algo sale
mal, el arreglo urgente es `git revert`, no `wrangler deploy`.

Y **sin los `CLIENT_SECRET_*` el contenedor de la API no arranca**, a propósito: si
el login falla la app no carga, y es mejor verlo al desplegar.

## Criterios de aceptación

- `pensieve.amatiasq.com` sirve la app **desde el VPS**, sin `github.io`.
- Un login y un guardado de verdad con la cuenta real, que sale como commit en
  `pensieve-data`.
- **Desde una pestaña que ya tuviera pensieve abierta**, no sólo en una nueva.
- No queda ningún Worker en pie, ni Pages sirviendo `gh-pages`.
- Con la red apagada la app abre y se puede escribir; al volver, sincroniza.
- `amq-pensieve-secrets` nombra su ítem por id y ya no pide `PENSIEVE_OP_ITEM`. ✅
