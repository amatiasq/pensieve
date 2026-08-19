# Plan — El repo de datos se llena de commits vacíos

**Status:** ⬜ diagnosticado, sin arreglar.
**Blocker:** ninguno. Es una guarda en `src/api/commit.js`, nada más.

**No es crítico** (2026-08-20): si al abrirlo resulta más complicado que la guarda
que promete, se descarta en vez de pelearlo.

El historial de `pensieve-data` está lleno de commits que no cambian nada.
Guardar una nota sin haberla tocado deja un commit igual.

`src/api/commit.js` no compara nada: prepara los ficheros, pide el ref, crea el
árbol con `base_tree` y crea el commit. Si el árbol nuevo es idéntico al padre,
GitHub lo acepta igual y sale un commit vacío.

## El arreglo

El árbol recién creado trae su `sha`. Si coincide con el `tree.sha` del commit
padre, no hay cambios: devolver el ref actual y **no crear commit**. Es una
comparación, no un diff, y ahorra también la llamada de escritura.

Hace falta que el cliente distinga "no hice nada" de "fallé": hoy la respuesta
es siempre un commit nuevo.

## Criterios de aceptación

- Abrir una nota, no tocarla, guardar → ningún commit nuevo en `pensieve-data`.
- Cambiar una letra y guardar → un commit, con esa letra.
- El indicador de sync no se queda colgado cuando no hubo commit.
