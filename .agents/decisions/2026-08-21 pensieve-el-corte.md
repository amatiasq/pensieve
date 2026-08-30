# 2026-08-21 — El corte: pensieve ya se sirve desde el VPS

Parte `pensieve-el-corte.md`: aquí queda lo ejecutable, y los clics con una
sesión de verdad van en
[`retirar-cloudflare-y-pages.md`](../plans/retirar-cloudflare-y-pages.md).
**`pensieve.amatiasq.com` sirve el build de hoy desde el nginx del VPS**, y con
eso se acaban los nueve meses de la rama `gh-pages`, que no escribía nadie desde
el 2025-11-19.

- Sin cuenta real: un `POST /auth` con un `code` inventado vuelve
  `bad_verification_code` y no `incorrect_client_credentials`, o sea que la
  cadena navegador → nginx → API → GitHub está entera de pie.
- `/halt` devolvía un 200 vacío, heredado del nginx que proxeaba a Cloudflare: la
  única ruta que existe para llegar a la app con un token roto llegaba sin
  JavaScript. Se borra el bloque, que `try_files` ya la resuelve a `index.html`.
- `/version.txt` nombra el commit de la rama del PR, que el squash no conserva.
- Falta el login real desde una pestaña que ya tuviera pensieve abierta: abrirla
  desde aquí registra el service worker nuevo y destruye la condición a probar.
