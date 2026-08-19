# Plan — Pensieve entero en el VPS

**Status:** 🟡 fases 1 y 2 escritas y probadas enteras en local con Docker,
**sin desplegar**; la fase 3, hecha en el repo y pendiente fuera (2026-08-19).
**Blocker:** el `client_secret` de la OAuth App. Es un secreto de Cloudflare y
de ahí no se lee de vuelta: hay que regenerarlo en GitHub y meterlo en
1Password antes de que `amq pensieve deploy` pueda correr.

Objetivo: **pensieve depende de un solo sistema, y ese sistema es el VPS.** Hoy
depende de cuatro en cadena, y cada uno es un sitio donde puede caerse sin que
los otros se enteren:

```
DNS (Cloudflare)  →  VPS (nginx)  →  github.io          (la app)
navegador  ─────────────────────→  Cloudflare Worker    (/auth y /commit)
                                          └──────────→  GitHub API
```

## Lo que se encontró al hacerlo (2026-08-19)

Tres cosas que el plan no sabía, todas comprobadas contra los servidores de
verdad:

- **Producción lleva nueve meses congelada.** `pensieve.amatiasq.com` sirve la
  rama `gh-pages` de `amatiasq/pensieve`, y su último commit es del
  **2025-11-19**. El mirror empuja a `main`; Pages publica desde `gh-pages`, y
  nadie las une. Esto deja de ser una reforma cosmética: el despliegue al VPS es
  lo que descongela la app.
- **Un `proxy_pass` con el nombre del contenedor escrito literal tira la app
  entera si la API no está.** nginx lo resuelve al cargar y **se niega a
  arrancar** si el nombre no resuelve; y si arranca, se queda con la IP que
  tenía la API, que cambia al recrearla. La cura es el `resolver` de Docker más
  el nombre en una variable — que es exactamente lo que le faltaba al
  `proxy_pass` a Cloudflare de antes: la variable estaba, el `resolver` no.
- **Devolver la respuesta de GitHub tal cual da 502.** `/auth` proxeaba el
  `Response` entero, cabeceras incluidas, y son tantas que nginx contesta
  «upstream sent too big header». Ahora se devuelve sólo el cuerpo y el
  content-type, que además deja de pasar al navegador las cookies y el CSP de
  GitHub.

## Fase 1 — servir la app desde el VPS ✅ (en el repo)

- `compose.yml` monta `./www:/www:ro` y el `nginx.conf` sirve `root /www` con
  `try_files $uri $uri/ /index.html`.
- `index.html` y `sw.js` van con `no-cache` y `/assets/` con `immutable`, que es
  lo que impide que un service worker viejo esconda el despliegue nuevo.
  `manifest.webmanifest` lleva su `default_type`: nginx no conoce la extensión y
  sin eso el navegador no instala la PWA.
- `amq pensieve deploy` hace el trabajo entero: build en Lorelei (el VPS no
  puede con Bun), estampar `dist/version.txt` con el commit y el sufijo
  `-dirty`, imprimir cuánto pesa `dist/` (7,9 MB hoy), imagen de la API,
  `rsync --delete` del build, `amq vps deploy` de la infra y recrear el stack.
- Los `location /gist` y `/note` han desaparecido; `/halt` se queda.

**Se recrea el stack en vez de `nginx -s reload`**: el despliegue trae imagen
nueva de la API y un reload no la recogería.

## Fase 2 — la API en el VPS ✅ (en el repo)

`pensieve/api/`: Deno + Hono, tres ficheros, sin estado. Segundo servicio del
mismo compose, en la red `internal` y sin `VIRTUAL_HOST`.

- Los `CLIENT_ID` salen del mismo `src/config.json` que lee el cliente, para
  que no puedan divergir; por eso el contexto de build es `pensieve/`, no
  `api/`.
- **Sin los `CLIENT_SECRET_*` el contenedor no arranca**, a propósito: si el
  login falla la app no carga, y eso es mejor verlo al desplegar.
  `amq pensieve secrets` escribe el `.env` del servidor desde 1Password.
- `API_ORIGIN` ya no existe: el cliente pide `/auth` y `/commit` en rutas
  relativas. **El CORS entero se ha borrado**, `isValidOrigin` incluida — con la
  API en el mismo origen no hay nada que validar. Eso cierra también el punto 1
  de [`pensieve-deuda-tecnica.md`](pensieve-deuda-tecnica.md).
- En local lo cose el proxy de `vite.config.ts`, y `amq pensieve local` levanta
  las dos mitades.
- **Un `/commit` que falla ahora falla.** El worker se comía los errores de
  GitHub y contestaba 200, así que un guardado que no se guardaba parecía
  guardado; ahora devuelve 500 y el outbox lo reintenta.

No se ha tocado la OAuth App: el `redirect_uri` lo sigue mandando el cliente.

## Fase 3 — apagar lo que sobra 🟡

Hecho en el repo: no queda `wrangler.jsonc`, ni `wrangler.toml`, ni `wrangler`
en `devDependencies`, ni el `package-lock.json` que lo arrastraba. El
`account_id` de la cuenta, que sólo vivía en ese `wrangler.toml`, está ahora en
[`cloudflare.md`](../../../infra/machines/cloudflare.md).

**Lo que ya no hay es vuelta atrás por comando**: los dos Workers siguen en pie
pero no se pueden redesplegar desde aquí. Un arreglo urgente antes del corte es
`git revert`, no `wrangler deploy`.

Queda fuera del repo, en este orden y comprobando entre pasos:

1. `wrangler delete` de `pensieve-api` (la API) y de `pensieve` (los assets que
   no usa nadie) — **antes**, confirmar que login y guardado funcionan en el
   dominio.
2. Retirar Pages en `amatiasq/pensieve`: es la rama `gh-pages`, que el mirror no
   toca. Basta con desactivar Pages y borrar la rama; el workflow de mono se
   queda como está.

## El único sistema que queda fuera

**Los datos son un repo de GitHub** (`amatiasq/pensieve-data`), así que «un solo
sistema» vale para *servir la app*, no para *guardar el contenido*. Forgejo ya
corre en el VPS y podría alojarlo, pero expone API de Gitea, no de GitHub —
`commit.ts` habría que reescribirlo — y sobre todo **perdería lo que hace útil
ese repo: que está fuera de casa**. Es la copia off-site de las notas, y las
notas son lo que hace falta para arreglar el VPS cuando el VPS se rompe (ver
[`backups-3-2-1.md`](../../../.agents/plans/backups-3-2-1.md)).

**Decidido: los datos se quedan en GitHub.** Un servicio con un solo punto de
fallo operativo y los datos replicados fuera es mejor que la pureza de tenerlo
todo en una caja.

## Lo que se pierde al salir de Cloudflare

Hoy, si el VPS se apaga, el dominio deja de responder pero el Worker sigue
atendiendo la API. Después no hay ese sitio al que ir. El mitigante ya está
montado: **es una PWA con escrituras offline** — visitada una vez, las notas se
leen y se editan sin red, y el contenido se lee en GitHub sin pasar por aquí.

Lo que **no** se pierde es el segundo sitio donde vivía la app: no existía. Ese
`amatiasq.github.io/pensieve/` llevaba nueve meses sirviendo un build viejo.

## Lo que falta para cerrar

1. Regenerar los dos `client_secret` en la OAuth App de GitHub y meterlos en un
   ítem `pensieve` de 1Password
   ([`secretos-en-1password.md`](../../../infra/.agents/plans/secretos-en-1password.md)).
2. `PENSIEVE_OP_ITEM=<id> amq pensieve secrets` y `amq pensieve deploy`.
3. **Un login y un guardado de verdad, con la cuenta real**, que aparezca como
   commit en `pensieve-data`, y **desde una pestaña que ya tuviera pensieve
   abierta**: la primera carga tras el cambio llega con un service worker
   registrado apuntando al viejo.
4. Los dos pasos de la fase 3 que están fuera del repo.

## Criterios de aceptación

- ✅ `src/config.json` ya no nombra `workers.dev`, y la app pide `/auth` y
  `/commit` en su propio origen. Los 58 specs e2e de escritorio pasan contra el
  build de producción con esas rutas.
- ✅ `amq pensieve deploy` hace el trabajo entero: build, ship, recrear.
- ✅ `wrangler` ya no es dependencia ni queda config suya en el repo.
- ✅ El stack entero levanta en local: la SPA se sirve, `/note/…` resuelve por
  `try_files`, `/auth` y `/commit` llegan a la API por el nombre del servicio, y
  con la API parada la app **sigue sirviéndose**.
- ⬜ `pensieve.amatiasq.com` sirve la app desde el VPS, sin `github.io`.
- ⬜ Un login y un guardado de verdad con la cuenta real.
- ⬜ No queda ningún Worker en pie.
- ⬜ Con la red apagada la app abre y se puede escribir; al volver, sincroniza.

## Trampas

- **Los e2e contra el servidor de dev de vite fallan enteros**, y ya fallaban
  antes de esto: el plugin de babel de Emotion no se aplica y revienta al
  pintar. Se corren contra `vite preview`, que sí pasa. Es de
  [`pensieve-deuda-tecnica.md`](pensieve-deuda-tecnica.md), no de aquí.
- **Tres specs de `mobile.spec.ts` fallan** en el viewport de Pixel 7, también
  desde antes.
- **La carpeta compose se llama `pensieve`** y no puede cambiar, o el VPS se
  queda con el stack anterior huérfano.
- **`dist/stats.html`** —el informe de tamaños del bundle— se despliega con todo
  lo demás. Es inofensivo y no se ha tocado.
- **`VALID_ORIGINS` no incluye `pensieve.amq.im`** aunque el compose sirva ese
  dominio, así que entrar por ahí lanza «Invalid origin». Es de antes y no se ha
  tocado.
