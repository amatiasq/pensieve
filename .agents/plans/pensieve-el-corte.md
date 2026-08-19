# Plan — El corte: pensieve sale de Cloudflare

**Status:** 👨‍💻 el código está listo y probado en local, **sin desplegar**. Sale de
partir [`2026-08-20 pensieve-desacoplado-de-cloudflare.md`](../decisions/2026-08-20%20pensieve-desacoplado-de-cloudflare.md).
**Blocker:** el `client_secret` de la OAuth App. Es un secreto de Cloudflare y de
ahí no se lee de vuelta: hay que regenerarlo en GitHub y meterlo en 1Password
antes de que `amq pensieve deploy` pueda correr.

**Producción lleva sin desplegar desde el 2025-11-19**: lo que sirve hoy es de hace
nueve meses. Este plan es lo que la descongela.

Los pasos con los clics, en `.agents/finish.md`.

## El orden, que importa

1. **Regenerar los dos `client_secret`** en las OAuth Apps de GitHub y crear el
   ítem `Pensieve / .env` en 1Password (vault `Projects`) con los campos
   `CLIENT_SECRET_DEV` y `CLIENT_SECRET_PROD`. **No se pueden copiar de donde
   están**: son secretos de Cloudflare y de ahí no se leen de vuelta.
2. `PENSIEVE_OP_ITEM=<id> amq pensieve secrets` y `amq pensieve deploy`. Cuando el
   ítem exista, **meter su id dentro de `amq-pensieve-secrets`** como hacen los
   demás `secrets`: la variable de entorno sólo existe porque el ítem no existía.
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
- `amq-pensieve-secrets` nombra su ítem por id y ya no pide `PENSIEVE_OP_ITEM`.
