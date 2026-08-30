# 2026-08-20 — Pensieve sale de Cloudflare, en el repo

Cierra `pensieve/.agents/plans/pensieve-al-vps.md`; soltarlo fue el
[`2026-08-21`](2026-08-21%20pensieve-el-corte.md). **Pensieve pasa a depender de
un solo sistema, el VPS**, donde antes eran cuatro en cadena: DNS de Cloudflare,
nginx, `github.io` con la app y un Worker con `/auth` y `/commit`. Producción
llevaba nueve meses congelada en `gh-pages` —último commit del 2025-11-19—
porque el mirror empuja a `main` y Pages publicaba de `gh-pages`.

- Un `proxy_pass` con el nombre del contenedor escrito literal tira la app entera
  si la API no está: nginx lo resuelve al cargar y se niega a arrancar. La cura
  es el `resolver` de Docker más el nombre en una variable.
- Devolver la respuesta de GitHub tal cual da 502, de tantas cabeceras («upstream
  sent too big header»); se devuelve sólo el cuerpo y el content-type.
- `index.html` y `sw.js` van `no-cache` y `/assets/` `immutable`, o un service
  worker viejo esconde el despliegue nuevo; y `manifest.webmanifest` necesita su
  `default_type` o el navegador no instala la PWA.
- La carpeta de compose se llama `pensieve` y no puede cambiar, o el VPS se queda
  con el stack anterior huérfano.
- Ya no hay vuelta atrás por comando: no queda wrangler en el repo, así que un
  arreglo urgente es `git revert`, no `wrangler deploy`. El `account_id` está en
  [`cloudflare.md`](../../../infra/cloudflare.md).
