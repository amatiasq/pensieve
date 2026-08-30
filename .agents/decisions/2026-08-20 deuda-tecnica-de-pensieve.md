# 2026-08-20 — La deuda técnica de pensieve, salvo dos puntos

Cierra `pensieve/.agents/plans/pensieve-deuda-tecnica.md`, cuatro de sus seis
puntos; los otros dos salieron como planes propios y ya cayeron, los
[selectores de emotion](2026-08-20%20selectores-de-componente-de-emotion.md) y
[Monaco](2026-08-24%20monaco-del-cdn-o-del-bundle.md). **El CORS no se arregló:
se borró entero**, porque la API pasó a ser del mismo origen que la app
([`2026-08-20`](2026-08-20%20pensieve-desacoplado-de-cloudflare.md)).

- El build entra en `amq pensieve check` a propósito: `typecheck` sólo miraba una
  décima parte de la red, y esa ceguera dejó pasar cuatro meses de
  `@emotion/babel-plugin` sin ejecutarse. Los 10 errores de lint, arreglados.
- La regla de capas la comprueba `layers/no-upward-import` (`eslint.config.js`),
  ~40 líneas y cero dependencias; encontró un ciclo real, `0-dom/tooltip.ts`
  importando `1-core/mouse.ts`, que es DOM puro y se movió a `0-dom/`.
- El token de GitHub vive en `localStorage` y da escritura al repo: un XSS se lo
  lleva. Sacarlo de ahí pide una cookie httpOnly y cambia el flujo entero, así
  que queda escrito como decisión consciente, no como pendiente.
- Dos afirmaciones del plan eran falsas: el filtro sí busca en el contenido y
  `MemoryCache` sí caduca sola, con un `setInterval` de 60 s.
