# 2026-08-28 — La barra de Chrome en desktop no era un bug

**Review:** ⚠️ pendiente — no había avería: `display: standalone` en el Chromium
de escritorio siempre pinta esa barra. Quitarla es una funcionalidad nueva, no
un arreglo.

Cierra `la-barra-de-chrome-en-desktop.md`, que venía de
[`2026-08-27 la-barra-no-la-puso-el-manifest.md`](2026-08-27%20la-barra-no-la-puso-el-manifest.md).
Mirando la captura (2026-08-28), no es la franja de «fuera de scope» —ésa lleva
el origen y una **X**— ni la barra de direcciones con pestañas: es la barra de
título de la ventana de PWA, con el título de la página a la izquierda y el
escudo de Brave, las extensiones y el menú a la derecha. **Eso es exactamente lo
que hace `display: standalone` en un Chromium de escritorio**, y por eso el
manifest era correcto, era byte a byte el de Pages y reinstalar no cambió nada.
En móvil no sale porque allí no hay ventana.

Quitarla pediría `display_override: ["window-controls-overlay", "standalone"]`, y
entonces la app dibuja la suya: reservar `env(titlebar-area-height)` arriba,
marcar zona de arrastre con `-webkit-app-region: drag` y dejar libre la esquina
superior derecha, donde quedan superpuestos los botones de la ventana —hoy ahí
está el editor—. Es trabajo de UI y no un arreglo, así que no se hace de oficio.
