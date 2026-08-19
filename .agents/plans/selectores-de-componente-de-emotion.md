# Plan — Fuera los selectores de componente, y los e2e a CI

**Status:** ⬜ decidido, sin hacer (2026-08-20). Sale de partir
[`2026-08-20 deuda-tecnica-de-pensieve.md`](../decisions/2026-08-20%20deuda-tecnica-de-pensieve.md),
punto 5.
**Blocker:** el refactor de pensieve, dentro del cual caen estos seis trozos.
Mientras no caiga, **los e2e no pueden entrar en CI**.

**`@emotion/babel-plugin` no se ejecuta desde el 2026-07-16.** Un PR de
Dependabot subió `vite` 6→8 y `@vitejs/plugin-react` 4→6, y **la 6 no tiene
opción `babel`**: transforma con oxc. El `babel: { plugins:
['@emotion/babel-plugin'] }` de `vite.config.ts` lleva desde entonces sin
ejecutarlo nadie, y no se enteró nadie porque el CI sólo corría `typecheck`.

## Qué rompe, exactamente

Los **selectores de componente** de emotion, los seis:

```
src/5-app/App.tsx:45                            ${GridResizer}
src/7-components/atoms/Loader.tsx:44            ${Ripple}
src/7-components/atoms/Disclosure.tsx:19        ${AnimatedIcon}
src/7-components/NotesList/NoteItem.tsx:29,33   ${StyledActions}, ${StyledFavouriteButton}
src/7-components/NotesList/NoteGroup.tsx:54     ${Content}
```

- **En dev lanza** `Component selectors can only be used in conjunction with
  @emotion/babel-plugin` y la app no arranca. De ahí que fallen los 10 specs e2e
  antes de la primera aserción.
- **En producción no lanza: se traga el selector y pierde esas reglas.** O sea que
  hay **CSS muerto en la app en uso desde julio**, y nadie lo ha echado de menos.

## Lo decidido, que no se vuelve a discutir

**Se quitan los seis selectores de componente**, dándole a cada uno una clase
estable. **El babel no vuelve**: devolverlo pedía o una dependencia nueva
(`vite-plugin-babel`) o migrar el toolchain hacia atrás a vite 7 + plugin-react 4,
y las dos chocan con el `AGENTS.md` raíz para comprar una pieza que ya sobra.

El `babel:` de `vite.config.ts` se va con ellos. Quitarlo antes no arregla nada.

## Y entonces los e2e entran en CI

Es la mitad del valor de este plan y por eso está aquí y no en otro: hoy meterlos
en CI es meter un job rojo. La suite se ejecuta con `amq pensieve test`.

**Dos cosas que ya fallaban antes y no son de aquí**, para no confundirlas con una
regresión al meterlos:

- Los e2e **contra el servidor de dev de vite fallan enteros**; se corren contra
  `vite preview`, que sí pasa.
- **Tres specs de `mobile.spec.ts` fallan** en el viewport de Pixel 7.

## Criterios de aceptación

- No queda ningún `${Componente}` dentro de un template de emotion, y `grep` lo
  demuestra.
- Las seis reglas que hoy se pierden en producción **se aplican**: se ve mirando
  la app, no el build.
- `vite.config.ts` ya no menciona `babel` ni `@emotion/babel-plugin`, y el paquete
  sale de las dependencias.
- Los 10 specs e2e pasan contra `vite preview`.
- `ci-pensieve.yml` corre los e2e y el job está verde.
