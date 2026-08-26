# 2026-08-20 — Pensieve sale de Cloudflare, en el repo

Cierra `pensieve/.agents/plans/pensieve-al-vps.md`. Las tres fases se escribieron
y se probaron enteras en local con Docker; **soltarlas fue el
[`2026-08-21`](2026-08-21%20pensieve-el-corte.md)**.

Objetivo: **pensieve depende de un solo sistema, y ese sistema es el VPS.** Antes
dependía de cuatro en cadena, y cada uno era un sitio donde caerse sin que los
otros se enteren:

```
DNS (Cloudflare)  →  VPS (nginx)  →  github.io          (la app)
navegador  ─────────────────────→  Cloudflare Worker    (/auth y /commit)
                                          └──────────→  GitHub API
```

## Lo que se encontró al hacerlo, contra servidores de verdad

- **Producción lleva nueve meses congelada.** `pensieve.amatiasq.com` sirve la
  rama `gh-pages` de `amatiasq/pensieve`, y su último commit es del
  **2025-11-19**. El mirror empuja a `main`; Pages publica desde `gh-pages`, y
  nadie las une. Esto deja de ser una reforma cosmética: **el despliegue al VPS es
  lo que descongela la app.**
- **Un `proxy_pass` con el nombre del contenedor escrito literal tira la app
  entera si la API no está.** nginx lo resuelve al cargar y **se niega a arrancar**
  si el nombre no resuelve; y si arranca, se queda con la IP que tenía la API, que
  cambia al recrearla. La cura es el `resolver` de Docker más el nombre en una
  variable — que es exactamente lo que le faltaba al `proxy_pass` a Cloudflare de
  antes: la variable estaba, el `resolver` no.
- **Devolver la respuesta de GitHub tal cual da 502.** `/auth` proxeaba el
  `Response` entero, cabeceras incluidas, y son tantas que nginx contesta
  «upstream sent too big header». Ahora se devuelve sólo el cuerpo y el
  content-type, que además deja de pasar al navegador las cookies y el CSP de
  GitHub.

## La app, servida desde el VPS

- `compose.yml` monta `./www:/www:ro` y el `nginx.conf` sirve `root /www` con
  `try_files $uri $uri/ /index.html`.
- **`index.html` y `sw.js` van con `no-cache` y `/assets/` con `immutable`**, que
  es lo que impide que un service worker viejo esconda el despliegue nuevo.
  `manifest.webmanifest` lleva su `default_type`: nginx no conoce la extensión y
  sin eso el navegador no instala la PWA.
- `amq pensieve deploy` hace el trabajo entero: build en Lorelei (el VPS no puede
  con Bun), estampar `dist/version.txt` con el commit y el sufijo `-dirty`,
  imprimir cuánto pesa `dist/` (7,9 MB hoy), imagen de la API, `rsync --delete`
  del build, `amq vps deploy` de la infra y recrear el stack.
- **Se recrea el stack en vez de `nginx -s reload`**: el despliegue trae imagen
  nueva de la API y un reload no la recogería.

## La API, en el VPS

`pensieve/api/`: Deno + Hono, tres ficheros, sin estado. Segundo servicio del
mismo compose, en la red `internal` y sin `VIRTUAL_HOST`.

- Los `CLIENT_ID` salen del mismo `src/config.json` que lee el cliente, para que
  no puedan divergir; por eso el contexto de build es `pensieve/`, no `api/`.
- **Sin los `CLIENT_SECRET_*` el contenedor no arranca, a propósito**: si el login
  falla la app no carga, y eso es mejor verlo al desplegar.
- `API_ORIGIN` ya no existe: el cliente pide `/auth` y `/commit` en rutas
  relativas. **El CORS entero se ha borrado**, `isValidOrigin` incluida.
- **Un `/commit` que falla ahora falla.** El worker se comía los errores de GitHub
  y contestaba 200, así que un guardado que no se guardaba parecía guardado; ahora
  devuelve 500 y el outbox lo reintenta.
- No se ha tocado la OAuth App: el `redirect_uri` lo sigue mandando el cliente.

## Wrangler fuera del repo

No queda `wrangler.jsonc`, ni `wrangler.toml`, ni `wrangler` en
`devDependencies`, ni el `package-lock.json` que lo arrastraba. El `account_id` de
la cuenta, que sólo vivía en ese `wrangler.toml`, está ahora en
[`cloudflare.md`](../../../infra/cloudflare.md).

**Consecuencia: ya no hay vuelta atrás por comando.** Los dos Workers siguen en pie
pero no se pueden redesplegar desde aquí. Un arreglo urgente antes del corte es
`git revert`, no `wrangler deploy`.

## Dos decisiones que se toman aquí y no se rediscuten

**Los datos se quedan en GitHub.** `amatiasq/pensieve-data` es un repo de GitHub,
así que «un solo sistema» vale para *servir la app*, no para *guardar el
contenido*. Forgejo ya corre en el VPS y podría alojarlo, pero expone API de
Gitea, no de GitHub —`commit.ts` habría que reescribirlo— y sobre todo **perdería
lo que hace útil ese repo: que está fuera de casa**. Es la copia off-site de las
notas, y las notas son lo que hace falta para arreglar el VPS cuando el VPS se
rompe. Un servicio con un solo punto de fallo operativo y los datos replicados
fuera es mejor que la pureza de tenerlo todo en una caja.

**Se acepta perder el Worker como refugio.** Hoy, si el VPS se apaga, el dominio
deja de responder pero el Worker sigue atendiendo la API; después no habrá ese
sitio al que ir. El mitigante ya está montado: **es una PWA con escrituras
offline** — visitada una vez, las notas se leen y se editan sin red, y el contenido
se lee en GitHub sin pasar por aquí.

## Trampas que siguen vivas

- **La carpeta compose se llama `pensieve`** y no puede cambiar, o el VPS se queda
  con el stack anterior huérfano.
- **`dist/stats.html`** —el informe de tamaños del bundle— se despliega con todo lo
  demás. Es inofensivo y no se ha tocado.
- **`VALID_ORIGINS` no incluye `pensieve.amq.im`** aunque el compose sirva ese
  dominio, así que entrar por ahí lanza «Invalid origin». Es de antes y no se ha
  tocado.
- Los e2e contra el servidor de dev de vite fallaban enteros, y con ellos tres
  specs de `mobile.spec.ts` en el viewport de Pixel 7. Las dos cosas eran de los
  selectores de emotion, no de aquí, y ya están arregladas:
  [`2026-08-20 selectores-de-componente-de-emotion.md`](2026-08-20%20selectores-de-componente-de-emotion.md).
