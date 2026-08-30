# 2026-08-20 — Fuera los seis selectores de componente de emotion

Cierra la mitad de `selectores-de-componente-de-emotion.md`; la otra mitad, los
e2e en CI, cayó aparte ([`2026-08-26`](2026-08-26%20e2e-de-pensieve-en-ci.md)).
**`@vitejs/plugin-react` 6 no tiene opción `babel`, así que desde el 2026-07-16
no ejecutaba nadie `@emotion/babel-plugin`**: sin él un `${Componente}` dentro de
un template de emotion serializa como `.undefined`, y eso en dev lanza pero en
producción se traga la regla en silencio. Cuatro meses de CSS muerto.

- Cinco de los seis apuntaban a un descendiente y ahora van por clase estable en
  el DOM; los dos envoltorios vacíos de `NoteItem.tsx` existían sólo para ser
  selector y se han borrado.
- El sexto, `Ripple2` interpolando `${Ripple}`, nunca funcionó ni con el plugin
  —un selector suelto dentro de un bloque no es una declaración—, así que el
  loader llevaba desde siempre girando una sola bola. Es `styled(Ripple)`.
- El babel no vuelve: pedía una dependencia nueva o migrar el toolchain hacia
  atrás. `@emotion/babel-plugin` sale de `devDependencies` y sigue instalado
  porque `@emotion/react` y `@emotion/styled` dependen de él.
- Comprobado contra `vite preview`, no contra el dev server: ninguna hoja de
  estilo contiene ya una regla `.undefined`, y los 63 e2e pasan.
