# Plan — Pensieve entero en el VPS

**Status:** ⬜ propuesta, sin empezar (2026-08-06). **Blocker:** se gana
superficie y se pierde disponibilidad; decidir si compensa. Pensieve funciona y
se usa a diario: esto no arregla una avería.

Objetivo: **pensieve depende de un solo sistema, y ese sistema es el VPS.** Hoy
depende de cuatro en cadena, y cada uno es un sitio donde puede caerse sin que
los otros se enteren:

```
DNS (Cloudflare)  →  VPS (nginx)  →  github.io          (la app)
navegador  ─────────────────────→  Cloudflare Worker    (/auth y /commit)
                                          └──────────→  GitHub API
```

El `AAAA` apunta al VPS, cuyo nginx hace `proxy_pass` a
`amatiasq.github.io/pensieve/`. **La API la llama el navegador directamente**,
no el nginx: `API_ORIGIN` de `src/config.json` es
`pensieve-api.amatiasq.workers.dev`. Y existe un cuarto despliegue,
`pensieve.amatiasq.workers.dev` (`wrangler.jsonc`), que sirve el mismo build sin
que nadie lo use.

## Lo que está muerto pero no roto

**Los `location /auth` y `/commit` del `nginx.conf` no los usa nadie** — son de
cuando la API era del mismo origen — y además dan **502** (comprobado
2026-08-06). La causa: el `upstream` es un host público y el `proxy_pass` va a
través de una variable, así que nginx resuelve en runtime y necesita un
`resolver` que ahí no existe; sin variable resolvería al cargar y se quedaría con
una IP de Cloudflare que rota. El `# TODO: remove set instruction` del fichero es
de cuando alguien peleó con esto. **No las arregles: bórralas.**

Lo que este plan sí gana: **la API es cross-origin hoy y dejará de serlo.** Por
eso el Worker tiene `Access-Control-Allow-Origin: '*'` y una `isValidOrigin` que
no valida nada — con la API en el mismo origen, el CORS entero desaparece en vez
de tener que estar bien.

## Fase 1 — servir la app desde el VPS

Copiar lo que `amatiasq.com` ya hace en producción:

- `compose.yml` gana `./www:/www:ro`, y el `nginx.conf` cambia el `proxy_pass`
  por `root /www; try_files $uri $uri/ /index.html;` — el fallback es
  obligatorio, es una SPA con `react-router-dom`.
- `amq pensieve deploy` pasa a: build → estampar `dist/version.txt` con el commit
  → `rsync -az --delete dist/ → vps/docker/pensieve/www/` → `amq deploy-infra
  pensieve` → `nginx -s reload`. **Con `--delete`**: todo es generado, y una ruta
  que dejó de construirse debe dejar de servirse.
- Los `location /gist` y `/note` desaparecen: con la SPA local son rutas del
  router y las resuelve el `try_files`. `/halt` se queda, lo sirve nginx.
- **El build se hace en Lorelei**, no en el VPS: es Bun + Vite y el VPS no puede
  ejecutar Bun (CPU sin AVX2). Al servidor sólo llega `dist/`.

## Fase 2 — la API en el VPS

Los dos endpoints son diminutos y **sin estado**: `auth.js` cambia un `code` por
un token, `commit.js` construye un commit. Ni KV, ni D1, ni Durable Objects.

- **Runtime: Deno**, como `meme` y `conta` (Node con `--strip-types` es la
  alternativa; Bun no, por el AVX2). Vive en `pensieve/api/` con su Dockerfile y
  un segundo servicio en el mismo compose, **en la red `internal` y sin
  `VIRTUAL_HOST`**: sólo lo alcanza el nginx de al lado.
- El `proxy_pass` va a `http://pensieve-api:8080` — **nombre de servicio de
  Docker**, que es lo que mata el 502 de hoy.
- **Los secretos son lo único delicado.** `CLIENT_SECRET_DEV`/`_PROD` son hoy
  secretos de Cloudflare; pasan a un `.env` gitignorado en el servidor. **Es el
  secreto de una OAuth App: no puede tocar el bundle del cliente jamás**, y por
  eso `/auth` necesita servidor.
- `API_ORIGIN` pasa a ser el propio origen (rutas relativas) y `VALID_ORIGINS`
  pierde las entradas de `workers.dev`.
- **No hay que tocar la OAuth App.** El `redirect_uri` lo manda el cliente y
  sigue siendo `pensieve.amatiasq.com`; sólo se mueve dónde se intercambia el
  token.

## Fase 3 — apagar lo que sobra

En este orden, comprobando entre pasos:

1. `wrangler delete` del Worker y del despliegue de assets — **antes**, confirmar
   que login y guardado funcionan en el dominio.
2. Quitar `wrangler.jsonc`, `src/api/wrangler.toml` y `wrangler` de
   `devDependencies`.
3. Dejar de publicar en GitHub Pages. **Ojo:** hay que averiguar qué publica hoy
   `amatiasq.github.io/pensieve/`, porque no está en este repo — hay un mirror,
   no un workflow de Pages. Si el mirror alimenta Pages, se retira allí.
4. `infra/machines/cloudflare.md` y el `AGENTS.md` raíz pierden la fila de
   pensieve.

## El único sistema que queda fuera

**Los datos son un repo de GitHub** (`amatiasq/pensieve-data`), así que «un solo
sistema» vale para *servir la app*, no para *guardar el contenido*. Forgejo ya
corre en el VPS y podría alojarlo, pero expone API de Gitea, no de GitHub —
`commit.js` habría que reescribirlo — y sobre todo **perdería lo que hace útil
ese repo: que está fuera de casa**. Es la copia off-site de las notas, y las
notas son lo que hace falta para arreglar el VPS cuando el VPS se rompe (ver
[`backups-3-2-1.md`](../../../.agents/plans/backups-3-2-1.md)).

**Recomendación: dejar los datos en GitHub.** Un servicio con un solo punto de
fallo operativo y los datos replicados fuera es mejor que la pureza de tenerlo
todo en una caja.

## Lo que se pierde al salir de Cloudflare

Pensieve está en Cloudflare **porque guarda las notas que hacen falta para
mantener todo lo demás**: para sobrevivir a la caída del VPS. Y el cambio es
real, no teórico: hoy, si el VPS se apaga, el dominio deja de responder pero el
contenido sigue en pie en `amatiasq.github.io/pensieve/` y el Worker sigue
atendiendo la API. Después no hay ese sitio al que ir.

El mitigante ya está montado: **es una PWA con escrituras offline**. Visitada una
vez, las notas se leen y se editan sin red; lo que no funciona sin servidor es el
`/commit`. Y el contenido se lee en GitHub sin pasar por pensieve.

**La ganancia no es disponibilidad, es superficie**: cuatro sistemas con cuatro
despliegues para una SPA y dos endpoints — con dos rutas de nginx muertas y en
502 sin que nadie se entere, que es exactamente el síntoma de tener más piezas
que atención. Decidirlo a la vista de esto, no en abstracto.

## Trampas

- **Service worker + nginx.** VitePWA precachea con hashes: `index.html` sin
  caché larga y `assets/*` inmutable, o un deploy queda invisible detrás del
  propio worker. Es el fallo clásico de mudar de host un PWA.
- **La primera carga tras el cambio** llega con un service worker registrado
  apuntando al viejo. Probar en un navegador que ya tenga pensieve abierto, no
  sólo en uno limpio.
- **`e2e/fixtures.ts` intercepta `pensieve-api.amatiasq.workers.dev/auth` y
  `/commit` a pelo.** Al cambiar `API_ORIGIN`, los mocks dejan de casar y los 11
  specs se quedan sin auth sin decir por qué.
- **`isValidOrigin` mira el origen equivocado**: `new URL(request.url).origin` es
  el del propio servidor, no la cabecera `Origin` del cliente. Al portarla,
  arreglarla — o borrarla, si la API pasa a ser del mismo origen.
- **`/commit` recibe el token del usuario en el body.** Ya es así hoy; que no
  acabe en los logs de nginx.
- **`dist/` está gitignorado**: sin `version.txt` no se sabe qué corre en
  producción. Copiar el estampado de `amatiasq.com`, sufijo `-dirty` incluido.
- **La carpeta compose se llama `pensieve`** y no puede cambiar, o el VPS se
  queda con el stack anterior huérfano.
- **El disco del VPS es muy pequeño** y `dist/` trae `monaco-editor`. Medir antes
  de subirlo y no dejar builds viejos.

## Criterios de aceptación

- `pensieve.amatiasq.com` sirve la app desde el VPS, sin `github.io` en el camino.
- `/auth` y `/commit` responden desde el propio dominio y `src/config.json` ya no
  nombra `workers.dev`.
- **Un login y un guardado de verdad, con la cuenta real**, que aparezca como
  commit en `pensieve-data`. Este plan toca el camino crítico de una herramienta
  en uso: no se despliega sin eso.
- `amq pensieve deploy` hace el trabajo entero: build, ship, reload.
- `wrangler` ya no es dependencia y no queda ningún Worker en pie.
- Con la red apagada la app abre y se puede escribir; al volver, sincroniza.
