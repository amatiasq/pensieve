# 2026-08-21 — El corte: pensieve ya se sirve desde el VPS

Parte `pensieve-el-corte.md`, del que aquí queda lo que era ejecutable. Lo que
falta son clics con una sesión de verdad, y va en
[`retirar-cloudflare-y-pages.md`](../plans/retirar-cloudflare-y-pages.md).

**`pensieve.amatiasq.com` sirve el build de hoy desde el nginx del VPS**, y con
eso se acaban los nueve meses de la rama `gh-pages` que no escribía nadie desde
el 2025-11-19. El stack no tenía `.env` en el servidor, así que `amq pensieve
secrets` lo escribió por primera vez y `amq pensieve deploy` subió el `dist/`
(7,4 M) y la imagen de la API.

## Lo que se comprobó sin cuenta real

- **El `client_secret` de producción es el bueno.** Un `POST /auth` con un `code`
  inventado vuelve con `bad_verification_code` y no con
  `incorrect_client_credentials`, así que la cadena navegador → nginx → API →
  GitHub está entera de pie.
- **Un `/commit` que falla ya falla**: con un token inválido devuelve 500 y la
  API deja el error en el log. El Worker contestaba 200.
- `index.html` y `sw.js` salen `no-cache`, `/assets/` `immutable` y el manifest
  con su `application/manifest+json`. El `index.html` servido es byte a byte el
  del `dist/` local.
- Un Chrome headless en `/halt` arranca la app, registra el service worker y no
  suelta ningún error de consola.

**`/halt` devolvía un 200 vacío**, heredado del nginx que proxeaba a Cloudflare:
la única ruta que existe para llegar a la app con un token roto llegaba sin
JavaScript, o sea sin nada con lo que arreglar el token. Se borra el bloque,
porque `try_files` ya la resuelve a `index.html`.

**`/version.txt` nombra el commit de la rama del PR**, que el squash no conserva;
el próximo `amq pensieve deploy` lo vuelve a estampar.

## Lo que sigue sin comprobarse, y por qué

El login real, con la cuenta real, **desde una pestaña que ya tuviera pensieve
abierta**. Abrirlo desde aquí registraría el service worker nuevo y destruiría la
condición que hay que probar, que es un service worker viejo escondiendo el
despliegue nuevo. Es el primer paso del plan que queda.
