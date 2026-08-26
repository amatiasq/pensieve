# 2026-08-20 — Fuera los seis selectores de componente de emotion

Cierra la mitad de `selectores-de-componente-de-emotion.md`. La otra mitad —los
e2e en CI— salió como plan aparte y ya cayó:
[`2026-08-26 e2e-de-pensieve-en-ci.md`](2026-08-26%20e2e-de-pensieve-en-ci.md).

## Qué se perdía

`@vitejs/plugin-react` 6 no tiene opción `babel`, así que desde el 2026-07-16
`@emotion/babel-plugin` no lo ejecutaba nadie. Sin él, un `${Componente}` dentro
de un template de emotion serializa como `.undefined`: en dev lanza y la app no
arranca, **en producción se traga la regla en silencio**. Cuatro meses de CSS
muerto que nadie echó de menos.

## Lo que se hizo

Cinco de los seis apuntaban a un descendiente, y cada uno tiene ahora una clase
estable en el DOM: `.resizer`, `.disclosure-caret`, `.note-actions`,
`.favorite-button`, `.group-content`. Los dos envoltorios vacíos de
`NoteItem.tsx` existían sólo para ser selector y se han borrado: el `className`
va directo a `FavoriteButton` y a `NoteActions`.

El sexto no era un selector sino composición mal escrita: `Ripple2` interpolaba
`${Ripple}` para heredar sus estilos, y eso **nunca funcionó, tampoco con el
plugin** —un selector suelto dentro de un bloque no es una declaración—, así que
el loader llevaba desde siempre girando una sola bola. Es `styled(Ripple)`.

`vite.config.ts` ya no pasa `babel` y `@emotion/babel-plugin` sale de
`devDependencies`; sigue instalado porque `@emotion/react` y `@emotion/styled`
dependen de él. **El babel no vuelve**: devolverlo pedía una dependencia nueva o
migrar el toolchain hacia atrás, y las dos chocan con el `AGENTS.md` raíz para
comprar una pieza que ya sobra.

## Lo que se comprobó

Contra `vite preview` —el build de producción, no el de dev—, con los estilos
calculados en el navegador: el resizer desaparece en el viewport móvil, el caret
gira 90°, la lista del grupo estrena `details-show`, las acciones y la estrella
pasan de ocultas a visibles al pasar el ratón, las dos bolas del loader tienen
los mismos estilos y medio segundo de desfase, y **ninguna hoja de estilo
contiene ya una regla `.undefined`**.

De regalo, la suite entera de e2e pasa —63 tests, desktop y móvil—, también
contra el servidor de dev. Las dos cosas que
[`2026-08-20 pensieve-desacoplado-de-cloudflare.md`](2026-08-20%20pensieve-desacoplado-de-cloudflare.md)
daba por ajenas a esto —los e2e en dev y tres specs de `mobile.spec.ts`— eran
esto mismo.
