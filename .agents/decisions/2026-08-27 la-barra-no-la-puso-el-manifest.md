# 2026-08-27 — La barra del navegador no la puso el manifest

**Review:** ⚠️ pendiente — la barra es en **desktop**, no en el móvil, y
reinstalar no la quitó. Sigue en
[2026-08-28 la-barra-es-la-de-standalone.md](2026-08-28%20la-barra-es-la-de-standalone.md);
se borra cuando ese plan diga qué era.

Parte `pensieve/.agents/plans/volver-a-fullscreen.md`: aquí queda lo que se
comprueba con `curl`. Pages sigue en pie, así que el build congelado se puede
pedir: **el `manifest.webmanifest` de `amatiasq.github.io/pensieve/` y el de
`pensieve.amatiasq.com` son byte a byte el mismo**, y sus `index.html` sólo
difieren en los nombres de asset con hash. El corte al VPS no tocó el manifest.

- Nunca fue `fullscreen`: el manifest dice `standalone` desde que se importó el
  proyecto, y la ventana sin barra es justo lo que da `standalone`. Poner
  `fullscreen` no repondría nada y encima se comería la barra de estado.
- Descartados de paso: `start_url: "../"` resuelve a `/`, dentro de `scope: "/"`
  —feo, no roto—; y el generador único de service workers es de lulas, flocking y
  sanremo ([`2026-08-24`](../../../.agents/decisions/2026-08-24%20un-solo-generador-de-service-workers.md)),
  que pensieve usa VitePWA y nunca tuvo `build-sw`.
- Instalable, por parte del servidor: HTTPS, manifest con su
  `application/manifest+json`, iconos de 192 y 512 en 200 y `sw.js` con su fetch
  handler. Y el login entra por los dos orígenes, que `VALID_ORIGINS` lleva.
