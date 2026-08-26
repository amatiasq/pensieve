# 2026-08-26 — Los e2e de pensieve entran en CI

**Review:** ⚠️ pendiente — el workflow no se ha ejecutado nunca en GitHub; mirar
que el job `e2e` sale verde en su primer run y cuánto tarda con la caché fría.
Se borra en cuanto haya un run verde.

Cierra `e2e-de-pensieve-en-ci.md`. `ci-pensieve.yml` tiene ahora un job `e2e`,
hermano de `check`, que llama a `amq pensieve test`: los 71 tests corren contra
el build en cada push y cada PR.

## El plan decía que la suite pasaba contra el build, y no

Contra `vite preview` fallaban **9 de 71**. Aquella frase era de cuando la suite
tenía 63 tests; los que se añadieron después no habían corrido nunca contra el
build. Dos causas, ninguna de ellas del build:

- **El service worker se come los mocks.** En producción el worker se registra,
  y `page.route` no intercepta lo que pide un service worker: en cuanto tomaba
  el mando —la segunda navegación de cada test— las llamadas iban a la API de
  GitHub de verdad y la lista de notas volvía vacía. La suite lo bloquea
  (`serviceWorkers: 'block'`); que el worker sirva la app sin red se sigue
  comprobando a mano, como en
  [`2026-08-24`](2026-08-24%20monaco-del-cdn-o-del-bundle.md).
- **`idb-store.spec.ts` importa `/src/1-core/idb.ts` en el navegador**, y eso lo
  sirve el grafo de módulos de vite: en el build no existe. Se queda en su propio
  proyecto, `sources`, contra un dev server en el puerto de al lado. Sigue
  corriendo una vez; la suite sigue siendo 71.

El build va dentro del `webServer`, no en un paso aparte: un `dist/` rancio deja
la suite verde contra código que ya no existe, que es la misma ceguera que esto
cierra. Y `reuseExistingServer` se va — reutilizar lo que haya en el puerto es
correr contra el dev server cuando `amq pensieve local` está levantado.

## Ctrl+B era un bug de la app, no del test

El plan avisaba de que «Ctrl+B toggles sidebar visibility» había fallado una vez
y pasado al reintento. Falla siempre en serie, 1 de 3 en paralelo, y no era
flakiness: **esconder la sidebar con Ctrl+B y volver a pulsar la dejaba escondida
para siempre**.

`useSettings` suscribe su listener una vez, así que comparaba cada cambio que
llegaba contra el `value` del primer render, congelado. La ida (`false`) difería
y entraba; la vuelta (`true`) coincidía con ese valor viejo y se descartaba por
«idéntica», dejando el estado en `false`. Ahora compara contra el último valor
conocido. Un `useRef`, tres líneas.

El otro rojo, `mobile.spec.ts` «can create a note from mobile sidebar», sí era
del test: recargaba sin esperar al commit, y la lista volvía del repo sin la nota
nueva. Espera al commit, como ya hacía `keyboard.spec.ts`.

## Lo que se deja como estaba

- **`retries: 1` se queda.** No tapa nada conocido —los dos rojos están
  arreglados de raíz, y la suite pasó tres veces seguidas con `--retries=0`
  contra el build— y es la única red bajo el riesgo que el plan aceptaba: Monaco
  se baja de `cdn.jsdelivr.net` y la suite depende de la red del runner.
- **`mobile.spec.ts` corre también en el proyecto `desktop`**, porque `desktop`
  no lo excluye. Al viewport de escritorio esos seis tests prueban menos de lo
  que su nombre dice, pero prueban algo, y sacarlos es quitar tests: si molestan,
  es una decisión de quien los escribió.

## Lo que se comprobó

Suite entera contra el build, `--retries=0`, tres pasadas: 71/71. `amq pensieve
check` en verde. Y el camino rojo, que era criterio de aceptación: con un spec
roto a propósito, `amq pensieve test` sale con código 1 — que es lo que pone el
job en rojo.
