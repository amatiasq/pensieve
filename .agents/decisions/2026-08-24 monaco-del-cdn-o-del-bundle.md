# 2026-08-24 — Monaco sale del CDN, y el bundle deja de mentir

Cierra `monaco-del-cdn-o-del-bundle.md`, el punto 6 de
[`2026-08-20 deuda-tecnica-de-pensieve.md`](2026-08-20%20deuda-tecnica-de-pensieve.md).
Monaco ya se bajaba de jsdelivr en runtime, así que los 3,7 MB que iban en el
bundle no los ejecutaba nadie. **El bundle pasa de 3,7 MB a 460 kB** y el
precache de 94 entradas (5,2 MB) a 9 (714 KiB), con lo que sobra el
`maximumFileSizeToCacheInBytes` de 5 MB y se ha ido.

- Lo que arrastraba la copia eran dos líneas, `new Range(...)` y `Uri.parse(...)`;
  el resto de imports ya eran de tipos y `monaco-editor` es hoy devDependency.
- La versión vive en un sitio: `vite.config.ts` la lee de la dependencia
  instalada y la inyecta como `__MONACO_VERSION__`, y con ella se construye la
  URL de jsdelivr. De 0.52.2 a 0.56.0, que es lo que desbloqueaba sacarlo.
- El service worker cachea el CDN con `CacheFirst`: probado sobre el build, a la
  tercera visita y con la red apagada la app arranca de cero y abre el editor.
- `editContext: false`, a propósito: el EditContext de Chrome pierde ráfagas de
  teclas mientras se engancha —la suite escribe «new line added» y llega «new
  ldded»—. A mano (2026-08-25) no se reproduce, pero se queda: no cuesta nada y
  el riesgo es comerse letras.
