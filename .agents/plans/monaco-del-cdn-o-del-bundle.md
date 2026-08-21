# Monaco: del CDN o del bundle, pero una de las dos

**Status:** ⚪ decidido, sin hacer (2026-08-20)

Sale de partir
[`2026-08-20 deuda-tecnica-de-pensieve.md`](../decisions/2026-08-20%20deuda-tecnica-de-pensieve.md),
punto 6.

**Decidido: del CDN** (2026-08-20). Es lo que ya pasa en runtime, así que el
trabajo es que el bundle deje de mentir.

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

## Lo que hay que hacer

**Monaco sale del bundle.** La app adelgaza 3,7 MB, subir de versión deja de tocar
el precache, y `vite.config.ts` deja de precachear una copia que nadie ejecuta.

1. Sacar `monaco-editor` del bundle — que `@monaco-editor/react` se quede con su
   `loader` por defecto, que ya apunta a jsdelivr, y que el build no arrastre la
   copia local.
2. Subir Monaco a la última, que es lo que esto desbloquea.
3. Comprobar que `bun run build` no necesita ninguna excepción al
   `maximumFileSizeToCacheInBytes`.

**El editor no abre sin internet, y eso se acepta con la decisión.** Pensieve es
una PWA con escrituras offline, así que hay que saber qué se pierde exactamente:
abrir la app sin red y abrir una nota. Si ya estaba roto —Monaco ya venía del CDN
antes de esto— la decisión no pierde nada y sólo lo hace visible. Si abrir una nota
sin red deja de funcionar por esto, es un plan aparte y va en
[`precarga-offline.md`](precarga-offline.md), no aquí.

## Criterios de aceptación

- Monaco sale del CDN y **sólo** del CDN: no queda copia en el bundle. Nada de
  una cosa en `vite.config.ts` y otra en runtime.
- `bun run build` pasa con la versión de Monaco al día, sin excepciones al límite
  del precache que nadie pueda explicar.
- Se sabe, porque se ha probado, qué hace la app sin red al abrir una nota.
