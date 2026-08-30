# 2026-08-26 — Los e2e de pensieve entran en CI

Cierra `e2e-de-pensieve-en-ci.md`: `ci-pensieve.yml` tiene un job `e2e`, hermano
de `check`, que llama a `amq pensieve test`. **El plan decía que la suite pasaba
contra el build, y no**: fallaban 9 de 71, porque aquella frase era de cuando la
suite tenía 63 tests y los añadidos después no habían corrido nunca contra él.
Hoy corren los 71 en cada push y cada PR.

- El service worker se come los mocks: `page.route` no intercepta lo que pide un
  service worker, así que al tomar el mando las llamadas iban a la API de GitHub
  de verdad y la lista volvía vacía. La suite lo bloquea (`serviceWorkers:
  'block'`), y que sirva la app sin red se sigue comprobando a mano.
- `idb-store.spec.ts` importa `/src/1-core/idb.ts` en el navegador, que lo sirve
  el grafo de módulos de vite y en el build no existe: se queda en su propio
  proyecto `sources`, contra un dev server en el puerto de al lado.
- El build va dentro del `webServer` y `reuseExistingServer` se va: un `dist/`
  rancio deja la suite verde contra código que ya no existe, y reutilizar lo que
  haya en el puerto es correr contra el dev server de `amq pensieve local`.
- Ctrl+B era un bug de la app, no flakiness: `useSettings` comparaba cada cambio
  contra el `value` congelado del primer render, así que la vuelta coincidía, se
  descartaba por idéntica y la sidebar escondida no volvía nunca.
- `retries: 1` se queda como red bajo el único riesgo aceptado: Monaco se baja de
  `cdn.jsdelivr.net` y la suite depende de la red del runner.
