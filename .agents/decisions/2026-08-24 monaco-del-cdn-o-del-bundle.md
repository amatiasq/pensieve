# 2026-08-24 — Monaco sale del CDN, y el bundle deja de mentir

**Review:** ⚠️ pendiente — mirar en el próximo deploy que el editor abre en la
app instalada; se borra en cuanto se haya usado un día sin sorpresas.

Cierra `pensieve/.agents/plans/monaco-del-cdn-o-del-bundle.md`, el punto 6 de
[`2026-08-20 deuda-tecnica-de-pensieve.md`](2026-08-20%20deuda-tecnica-de-pensieve.md).

Monaco ya se bajaba de jsdelivr en runtime, así que los 3,7 MB que iban en el
bundle no los ejecutaba nadie. Ahora no van: **el bundle pasa de 3,7 MB a 460
kB** y el precache de 94 entradas (5,2 MB) a 9 (714 KiB). Con eso, el
`maximumFileSizeToCacheInBytes` de 5 MB sobra y se ha ido: ningún fichero se
acerca al límite por defecto de workbox.

## Lo que arrastraba la copia eran dos líneas

Todos los imports de `monaco-editor` eran de tipos menos dos: `new Range(...)`
en `getMatchesForRegex` y `Uri.parse(...)` en `extendMonacoLinks`. El primero es
ahora un literal `IRange` —que es lo que `provideLinks` pide— y el segundo sale
del `monaco` que la función ya recibía. El resto pasó a `import type`, y
`monaco-editor` a `devDependencies`: sigue dando los tipos, ya no se empaqueta.

## La versión vive en un sitio

`vite.config.ts` lee la versión de la dependencia instalada y la inyecta como
`__MONACO_VERSION__`; `loadMonacoFromCdn` construye con ella la URL de jsdelivr.
Subir la dependencia mueve el CDN y los tipos a la vez, que es lo que evita que
lo que compila y lo que se ejecuta se separen. De **0.52.2 a 0.56.0**, que es lo
que desbloqueaba sacarlo del bundle: ya no hay chunk de 6,9 MB que quepa o no.

## El editor sí abre sin red

El service worker cachea el CDN de Monaco con `CacheFirst`. Probado sobre el
build de producción: primera visita el worker se instala, segunda ya manda y
deja 24 entradas en `monaco-cdn`, y a la tercera, con la red apagada, la app
arranca de cero y abre una nota en el editor. Antes esto dependía de que la
caché HTTP del navegador tuviera suerte, porque lo precacheado no era lo que se
ejecutaba.

## `editContext: false`, a propósito

Monaco cambió el textarea por el EditContext de Chrome y pierde ráfagas de
teclas mientras se engancha: la suite escribe «new line added» y llega «new
ldded», reproducible en tres pasadas y verde en cuanto se apaga. Un editor de
notas no puede comerse letras, así que se queda en el textarea, que es el camino
que ya usaba la 0.52. La suite pasa 71/71.
