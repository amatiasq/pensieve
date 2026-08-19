# Plan — El filtro devuelve las notas en orden errático

**Status:** ⬜ causa localizada, sin arreglar.
**Blocker:** ninguno. Es un umbral en una línea.

Buscando "Pensieve" salen primero las notas buenas, después casi todas las
demás, y luego otra vez buenas. Parece que ordena al azar.

La causa está en `src/util/StringComparer.ts`: `matchesList` pasa
`threshold: matchSorter.rankings.ACRONYM`, uno de los umbrales más permisivos de
`match-sorter`. Con eso entra en la lista cualquier nota cuyas iniciales encajen
con las letras del término, y esas coincidencias flojas se intercalan con las
buenas. No es el orden lo que está roto: es **qué se admite**.

## El arreglo

Subir el umbral a `CONTAINS` o `WORD_STARTS_WITH` y mirar el resultado con una
búsqueda real, de las que hoy salen mal. Es una línea; lo que cuesta es elegir
cuál de los dos, y eso se decide viendo la lista.

## Criterios de aceptación

- Buscando un término que aparece en pocos títulos, la lista sólo trae esos.
- Buscar por grupo sigue funcionando.
- Ninguna búsqueda devuelve casi todas las notas.
