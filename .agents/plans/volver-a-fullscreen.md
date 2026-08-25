# La app instalada ya no va a pantalla completa

**Status:** ⚪ sin investigar (2026-08-26)

Reportado el 2026-08-26: **antes la PWA instalada era fullscreen y ahora pinta
la barra del navegador arriba.** Algo del último deploy (Monaco del CDN +
`view|edit` + el generador único de service workers) lo cambió, o la
reinstalación que trajo el cambio de nombre de caché la dejó en otro modo.

## Sospechosos, por orden

1. **El `display` del manifest.** Si el `manifest.webmanifest` que se sirve ya
   no dice `fullscreen` (o `standalone`), Chrome degrada la ventana a pestaña
   con barra. Mirar qué se sirve en producción y qué genera el build — y si el
   generador de service workers compartido con sanremo tocó el manifest o su
   `<link>`.
2. **La reinstalación.** El arreglo del hash de contenidos hizo rotar el nombre
   de caché y reinstalar los clientes una vez; si la app se reinstaló con un
   manifest a medio servir, el modo se pierde aunque el manifest de hoy esté
   bien. Se distingue rápido: desinstalar la app y volverla a instalar — si
   vuelve fullscreen, era esto y no hay nada que arreglar en el código.
3. **Un `start_url` o `scope` que ya no casan** con la URL abierta: fuera del
   `scope`, Chrome enseña la barra aunque el resto esté perfecto.

## Trabajo

1. Comparar el manifest servido en producción con el del repo (`display`,
   `scope`, `start_url`), y mirar si el deploy lo cambió.
2. Si el manifest está bien: reinstalar la app y ver si el modo vuelve.
3. Arreglar lo que sea y dejar escrito cuál de los tres era.

## Criterios de aceptación

- La app instalada abre otra vez sin barra de navegador (el modo de antes:
  fullscreen).
- Queda escrito qué lo rompió, para que el siguiente deploy no lo repita.
