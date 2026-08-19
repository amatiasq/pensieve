# Plan — Monaco: del CDN o del bundle, pero una de las dos

**Status:** ⬜ sin decidir (2026-08-20). Sale de partir
[`2026-08-20 deuda-tecnica-de-pensieve.md`](../decisions/2026-08-20%20deuda-tecnica-de-pensieve.md),
punto 6.
**Blocker:** ninguno. Es una decisión, y hasta que se tome Monaco se queda en la
0.52.

**Monaco no puede subir de 0.52.** Probado con 0.55 y con 0.56: las dos parten un
chunk `assets/ts.worker-*.js` de **6,9 MB**, por encima del
`maximumFileSizeToCacheInBytes` de 5 MB de `vite.config.ts`, y **el build falla**.
En 0.52 ese chunk no existe.

## Por qué subir el límite no es la respuesta

Serían 6,9 MB precacheados **muertos**. `@monaco-editor/react` **no está
configurado con `loader.config()`**, así que en tiempo de ejecución Monaco se
descarga del CDN de jsdelivr y **la copia que va en el bundle (3,7 MB hoy) no la
ejecuta nadie**. Hoy ya se está pagando ese peso para nada; subir el límite sería
pagar el doble.

O sea que la pregunta no es «¿cuánto subo el límite?» sino **de dónde sale
Monaco**. Contestada esa, el límite del precache se decide solo.

## Las dos salidas

- **Del CDN** (lo que pasa hoy de facto). Entonces **Monaco sale del bundle**: la
  app adelgaza 3,7 MB y subir de versión deja de tocar el precache. A cambio, la
  app **no abre el editor sin internet**, y eso choca con que pensieve es una PWA
  con escrituras offline: hay que mirar qué pasa exactamente hoy sin red, porque
  puede que ya esté roto y nadie lo sepa.
- **Del bundle.** Entonces `loader.config()` apuntando a la copia local, y el
  límite del precache sube a lo que ocupe el worker. La app pesa ~7 MB más y la
  primera visita los descarga.

**Medir antes de elegir**: qué hace hoy la app sin red al abrir una nota. Si el
editor ya no funciona offline, la primera opción no pierde nada y es la barata.

## Criterios de aceptación

- Está escrito de dónde sale Monaco y por qué, y el código hace eso — no una cosa
  en `vite.config.ts` y otra en runtime.
- `bun run build` pasa con la versión de Monaco al día, sin excepciones al límite
  del precache que nadie pueda explicar.
- Se sabe, porque se ha probado, qué hace la app sin red al abrir una nota.
