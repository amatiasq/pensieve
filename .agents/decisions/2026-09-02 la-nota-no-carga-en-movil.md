# 2026-09-02 — La nota no cargaba sin red, no por ser móvil

**Review:** ⚠️ pendiente — no se ha probado en un teléfono ni con la PWA
instalada. Borra esta línea cuando abras sin red, desde el móvil, una nota vieja
que no hayas abierto nunca y salga.

Cierra `.agents/plans/la-nota-no-carga-en-movil.md`. **La causa no era el móvil,
era estar sin red**: con `navigator.onLine` en falso, `ResilientOnlineStore.read`
rechazaba antes de llegar a la capa que sabe leer del disco, así que una nota que
sólo había bajado el tarball no abría aunque su contenido estuviera guardado. En
escritorio no se ve porque allí nunca se está sin red.

- Reproducido con Playwright: arranque en frío por tarball, 260 notas, cortar la
  red y abrir una que nunca se abrió. `pensieve-dir-cache` tenía las 260 con su
  contenido y la app enseñaba «no se ha podido leer».
- `read` ya no se rinde sin red; `readAll` sí sigue rindiéndose, que la lista
  está en local. Y `readFile` va directo a la caché del tarball cuando no hay
  red: la petición no saldría del aparato y sólo abriría el circuit breaker 30 s
  más.
- El test vive en `e2e/mobile.spec.ts` —corre en los dos proyectos y falla en los
  dos sin el arreglo—; el mock del tarball sale de `tarball.spec.ts` a
  `e2e/tarball-mock.ts` para poder compartirlo.
- Descartados mirándolos: service worker al mando, red y CPU lentas, entrar
  directo a `/note/<id>`, una nota de 4000 líneas y 260 notas en móvil. Todos
  pintan la nota.
- Queda en pie el otro aviso del README, «abrir una nota tarda unos segundos en
  el móvil»: el tarball deja el contenido en `pensieve-dir-cache` y no en el
  store local, así que con red cada apertura espera a GitHub. Sin medir en un
  teléfono, así que no se ha tocado.
- `amq pensieve check` y los 83 e2e en verde. Sin desplegar: nadie delante.
