# Patrones de las notas de Pensieve

Radiografía del almacén real, medida sobre el clon de `pensieve-data` que hay en
`/tmp/pensieve-data` (24 de agosto de 2026). **3.680 notas**, 3.669 metadatos,
132 MB, 64.661 commits desde julio de 2021. Todos los números salen de contar
los ficheros con un script, no de leerlos por encima.

El documento va en dos mitades: **la forma** (cómo está guardado) y **el
contenido** (qué hay escrito dentro y con qué convenciones).

---

# Parte 1 — La forma

## Los números de un vistazo

| Cosa | Valor |
| --- | --- |
| Notas (`note/`) | 3.680 |
| Metadatos (`meta/`) | 3.669 |
| Tamaño de nota, mediana | 918 bytes (32 líneas) |
| Tamaño, p90 / máximo | 4,2 KB / 538 KB |
| Notas vacías | 2 |
| Grupos distintos | 239 |
| Favoritas | 1.145 (31%) |
| Commits del repo | 64.661 |

## La primera línea manda, y los datos lo confirman

`AGENTS.md` dice que la primera línea de la nota es su nombre y que `meta/` es un
derivado. **En 3.635 de 3.669 notas (99%) la primera línea reconstruye exacto el
`group` y el `title` del meta.** El formato real es:

```
<prefijo de comentario> <Grupo> / <Título>.<ext>
```

- **Prefijo**: `#` en 3.204 notas, `//` en 374, ninguno en 84, `<!--` en 9,
  `##` en 5, `--` en 4. El prefijo es el del lenguaje de la nota, para que la
  primera línea no rompa el fichero si lo copias fuera.
- **Separador**: 2.767 notas usan `Grupo / Título` con espacios, 558 usan
  `Grupo/Título` sin ellos, 355 no llevan grupo. La app normaliza los espacios,
  así que las dos formas conviven sin problema.
- **Sin grupo pero con barra**: cientos de notas empiezan por `/ nombre.md`, con
  el grupo vacío delante de la barra. Es lo que deja el editor al quitar el grupo
  sin borrar el separador.

Las 34 notas que no cuadran son cuatro casos concretos, y todos son fallos de
parseo reales:

1. **Comentario con cierre**: `<!-- Snippets / Semantic address.html -->` mete
   el ` -->` dentro del título. 9 notas.
2. **Mermaid**: `%% Mermaid / states.mmd`. El `%%` no está en la lista de
   prefijos, así que entra en el título.
3. **Gists importados**: `// Gist created by https://gist.amatiasq.com to store
   settings` parte por la barra de la URL y deja el grupo en
   `gist.amatiasq.com to store settings`.
4. **Deriva a mano**: `# YEGO - 2025-07-07` con guion en vez de barra, o
   `## YEGO / 2025-01-13` con dos almohadillas, que deja la segunda en el título.

## El meta es una caché de seis campos

Cuatro formas, y la diferencia entre ellas es sólo qué campos opcionales hay:

| Campos | Notas |
| --- | --- |
| `created` `favorite` `group` `id` `modified` `title` | 3.102 |
| sin `group` | 291 |
| con `bumped` | 223 |
| con `bumped`, sin `group` | 53 |

- **`favorite`**: 2.450 `false`, 1.145 `true`, 74 `null`. El `null` es de notas
  viejas escritas antes de que el campo existiera; el código tiene que tratarlo
  como `false`.
- **`bumped`**: sólo 276 notas lo llevan, con fecha propia. Es el "súbeme arriba"
  manual, separado de `modified`.
- **`group`**: cuando falta, es lo mismo que `''`. Las dos representaciones del
  "sin grupo" están vivas a la vez.
- **Fechas**: `YYYY-MM-DD HH:MM:SS`, hora local, sin zona horaria ni `T`. No es
  ISO 8601 y no se puede pasar a `new Date()` en Safari sin tocarlo.

## Dos generaciones de identificadores

- **2.636 notas** con id UUID v4. Es lo actual.
- **1.044 notas** con id `<md5 de 32 hex>__<nombre de fichero>`, herencia de la
  importación desde gists. El md5 es el gist y el sufijo el fichero dentro, así
  que **un mismo md5 se repite**: 683 gists distintos, y uno de ellos aporta 29
  notas. Cualquier código que asuma "id = un solo fichero" o que valide el id
  contra un regex de UUID se lleva por delante el 28% del almacén.
- Extensiones en los ids antiguos: 773 `.md`, 66 `.js`, 44 `.ts`, 35 sin
  extensión, 23 `.json`, 19 `.txt`, 19 `.sh`, 17 `.sql`, 11 `.html`.

## Desajustes entre `meta/` y `note/`

- **13 notas sin meta.** La app tiene que saber pintarlas sacando el título de la
  primera línea, que es de donde salía de todas formas.
- **2 metas sin nota.** Fantasmas del listado: aparecen en la barra lateral y al
  abrirlos no hay nada.

## Los grupos son un cementerio por eras

239 grupos, pero **886 notas (24%) no tienen ninguno** y el top 10 se lleva
2.304 de 3.669. La cola es larguísima: **67 grupos con una sola nota, 127 con
tres o menos**.

| Grupo | Notas | Vida | Pico |
| --- | --- | --- | --- |
| *(sin grupo)* | 886 | 2017-2026 | 2019 |
| YEGO | 445 | 2024-2026 | 2025 |
| Job Search | 292 | 2022-2023 | 2023 |
| Primer | 127 | 2022-2023 | 2023 |
| Snippets | 123 | 2018-2026 | 2021 |
| Search 2 | 123 | 2024 | 2024 |
| Katch | 117 | 2023-2024 | 2024 |
| Articles | 73 | 2021-2026 | 2025 |

Cada trabajo abre un grupo, lo llena un año o dos y lo deja muerto. Sólo
`Snippets` y `Articles` cruzan las eras. Y como el grupo sale de la primera
línea, **hay grupos duplicados por mayúsculas**: `YEGO`/`Yego`,
`Katch`/`KATCH`, `Industry cloud`/`Industry Cloud`, `Casalet del
bosc`/`Casalet del Bosc`. También hay duplicados por idioma que la app no puede
detectar: `Selection Process`, `Proceso selección` y `Selection process
(Heydoc)` son tres grupos distintos para lo mismo.

`settings.json` sólo declara dos carpetas (`YEGO`, `Mermaid`) frente a los 239
grupos reales: ese campo no es el índice de grupos, es otra cosa.

## Los títulos son sobre todo fechas

De 3.669 títulos:

- **1.397 empiezan por una fecha** (`YYYY-MM-DD`): 484 son sólo la fecha y 908
  llevan fecha más texto. Es el 38% del almacén.
- **328 son standups** (`2020-06-29 StandUp.md`), concentrados en 2019-2021.
- **740 parecen nombres de fichero** con extensión.
- **1.531 son texto libre.**
- **1 está vacío.**

O sea: la nota diaria es el uso principal. `YEGO - Today` es la nota más editada
de todo el repo con diferencia: **6.922 commits de edición**, catorce veces más
que la segunda (`Matias`, 474).

Títulos repetidos, que existen porque el título no es único: `notes.md` (31
veces), `email.md` (13), `Fin de semana.md` (8), `People` (4). Y hay **10 pares
de notas con contenido byte a byte idéntico** (20 notas), duplicados de verdad.

## El ritmo, por años

Notas creadas por año: 2017 (4), 2018 (24), 2019 (430), 2020 (240), 2021 (517),
2022 (448), 2023 (652), 2024 (455), 2025 (586), 2026 (313 hasta agosto). Nueve
años de uso continuo sin ningún hueco.

**238 notas tienen `created == modified`**: se escribieron de una vez y no se
tocaron nunca más. Sólo el 6%; el resto se reedita.

## El historial de git es el historial de la app

64.661 commits, todos generados por la app, con seis mensajes tipo:

| Mensaje | Veces (últimos 20.000) |
| --- | --- |
| `Update note "X"` | 16.228 |
| `Create note "X"` | 799 |
| `Bump note to top "X"` | 452 |
| `Toggle "X" favorite` | 380 |
| `Set settings.json` | 180 |
| `Delete note "X"` | 70 |
| `Write settings.json` | 42 |

Hay dos variantes más que importan: `Update note "X" renamed "Y"` (23 veces),
que es como se registra un cambio de primera línea, y `Multiple: - Create note
... - Update note ...` (16), que es el outbox vaciando varias escrituras en un
commit. El primer commit del historial es `Removed sensitive data` (julio de
2021): el repo se reescribió entero en ese punto y no hay nada anterior.

Veinte ediciones por cada creación. La app no es un archivo donde se deposita:
es un cuaderno que se reescribe.

---

# Parte 2 — El contenido

## Seis arquetipos de nota

Clasificando las 3.680 notas por su forma interna:

| Arquetipo | Notas | % |
| --- | --- | --- |
| Cajón desastre (sin patrón claro) | 1.498 | 40% |
| Nota diaria (título con fecha) | 563 | 15% |
| Snippet de código | 516 | 14% |
| Standup / acta de reunión | 606 | 16% |
| Recorte de oferta de trabajo | 351 | 10% |
| Recorte de lectura (Search 2, Articles) | 181 | 5% |
| Sólo enlaces | 63 | 2% |

Los recortes de oferta se contaron aparte, buscando la línea `via @`, así que
solapan un poco con el cajón desastre y los porcentajes suman algo más de 100.

Los cuatro primeros son el 85%. Dicho de otra forma: **esto no es una wiki, es un
cuaderno de trabajo**. La mayoría de las notas registran un día, una reunión o
una cosa que hay que recordar hacer, no un tema.

## Cómo se escribe de verdad

De las 3.680 notas:

| Marca | Notas | % |
| --- | --- | --- |
| Encabezados markdown `#` | 3.176 | 86% |
| URL suelta (sin corchetes) | 2.133 | 57% |
| Lista con guion | 1.875 | 50% |
| Bloque de código ` ``` ` | 807 | 21% |
| Enlace markdown `[x](y)` | 429 | 11% |
| Tachado `~~hecho~~` | 428 | 11% |
| Ticket de Jira en el cuerpo | 394 | 10% |
| `[[nextstep]]` | 86 | 2% |
| `TODO` / `FIXME` | 45 | 1% |
| Tabla markdown | 34 | 1% |
| Checkbox `- [ ]` | 6 | 0% |

Dos cosas que se leen entre líneas:

- **El tachado es la casilla de verificación de esta app.** 428 notas usan
  `~~texto~~` y sólo 6 usan `- [ ]`. `settings.json` pinta el tachado en gris,
  así que tachar *es* marcar como hecho. Cualquier vista de tareas debe leer
  `~~`, no checkboxes.
- **Los enlaces se pegan crudos.** 2.133 notas con URL suelta contra 429 con
  sintaxis markdown: el renderizador tiene que autoenlazar o más de la mitad de
  las notas se ven mal.

Lenguajes declarados en los bloques de código, por si hay que cargar gramáticas:
css (233), js (211), sh (151), bash (90), ts (83), html (75), csharp (71), json
(66), sql (40), shell (39), javascript (33), md (29), rust (27), tsx (24). Los
alias sin unificar (`js`/`javascript`, `sh`/`bash`/`shell`, `ts`/`typescript`,
`rs`/`rust`, `yml`/`yaml`) hay que normalizarlos antes de resaltar.

## La sangría es la sintaxis, no el guion

El markdown se usa para el título (86% de notas con `#`) y poco más. La
estructura interna se escribe con **sangría desnuda, sin guiones**:

```
@dmitrijs [YAP-541]
checking AEROPOLIS
  what should be done
```

- 1.875 notas usan guiones de lista; **1.357 usan sangría sin guion**, y
  **732 usan sólo sangría**.
- La sangría va de dos en dos: 24.758 líneas con 2 espacios, 14.365 con 4, 5.528
  con 6, 4.566 con 8. Cuatro niveles de profundidad reales.
- El 43% de las líneas de una nota media están estructuradas. Repartidas: 905
  notas son esquema puro (>70% de líneas con estructura), 1.094 son prosa
  (<20%), 1.349 mezclan.

Un renderizador que trate la sangría como bloque de código (que es lo que dice
markdown que es) rompe un tercio del almacén. Aquí la sangría es un árbol.

## `[[marcador]]` es el sistema de estado

Los dobles corchetes marcan estado dentro del texto:

| Marcador | Veces |
| --- | --- |
| `[[nextstep]]` | 227 |
| `[[next step]]` | 80 |
| `[[TASK]]` | 25 |
| `[[BLOCKED]]` | 22 |
| `[[ACTION]]` | 19 |
| `[[NEXT]]` | 12 |
| `[[current goal]]` | 10 |

**`settings.json` sólo pinta en rojo `\[\[nextstep\]\]`.** Las otras 168
apariciones — incluidas las 80 de `[[next step]]` con espacio, repartidas en 30
notas — son invisibles. Es el mismo concepto escrito de cinco maneras, y cuatro
no se ven. Un regex de `\[\[\s*next\s*steps?\s*\]\]` recuperaría 309 de golpe.

Ojo al chocar con la otra regla de `settings.json`: `\[\[([a-f0-9]+)\]\]` enlaza
a Notion. Cualquier marcador que sólo tenga letras de la `a` a la `f` se
convierte en un enlace roto.

## `@` es un actor, no una persona

Se pinta de azul y se usa para todo lo que actúa:

- **Personas**: `@alexis` (478), `@marc` (412), `@daniele` (362), `@marti`
  (361), `@alba` (357), `@matias` (344).
- **Plataformas y empresas**: `@otta` (226), `@reed`, `@linkedin`, `@arc.dev`,
  `@jobleads`, `@workshub`. Aparecen en el patrón `via @otta`, que es la primera
  línea del cuerpo de 351 ofertas recortadas.
- **Ruido de código**: `@property` (136), `@media`, decoradores. Inevitable
  porque el 21% de las notas llevan código.

El patrón fuerte es el **acta de reunión**: línea que empieza por `@persona`
seguida de tickets, y debajo lo que dijo, sangrado.

```
@coco prepare [RANG-115] todo [RANG-184]
yesterday working on power ranger
documentation to do for the filter for the map
  have to polish it
```

686 líneas empiezan por `@`; 70 notas son actas de verdad (tres o más bloques),
con 556 bloques entre todas.

Y el `#`, que `settings.json` pinta igual de azul, **casi no se usa como
etiqueta**: `#shorts` (154, más `#Shorts` 32), `#bug-report` (40), `#channel`
(26). El resto es ruido — colores hex (`#fff`, `#d6d6d6`), selectores CSS
(`#amq-button-container`) y entidades HTML (`#x27`). Un buscador de etiquetas
basado en `#` tiene que filtrar hex y selectores o devuelve basura.

## `[etiqueta]` es el tema

Corchetes simples, delante de la línea, agrupan por asunto sin crear carpeta:
`[BUG]` (63), `[casa]` (50), `[jarvis]` (46), `[RFC]` (39), `[E2E Ranger]` (33),
`[pokemon]` (25), `[TS Migration]` (25), `[pensieve]` (23), `[ACTION]` (23),
`[libros]` (18), `[IT]` (18). Conviven en la misma línea con los tickets
(`[YUA-515]`), que ya se enlazan solos.

Es una taxonomía paralela a los grupos, dentro del texto, y nadie la indexa.

## `[fecha] estado` es una máquina de estados a mano

382 líneas en 239 notas siguen el patrón `[YYYY-MM-DD] qué pasó`. Casi todas son
la búsqueda de trabajo:

| Estado | Veces |
| --- | --- |
| `rejected via email` | 138 |
| `applied` | 45 |
| `rejected` (a secas) | 11 |
| `rejected via otta` / `linkedin` / `infojobs` | 12 |
| `first` / `second` / `third interview` | 11 |

Una oferta recortada completa es: primera línea `Job Search / Empresa`, luego
`via @otta`, luego una línea `[fecha] estado` por cada movimiento. Hay 351 así,
y están repartidas en **seis grupos distintos para la misma actividad**: `Job
Search` (192), `Search 2` (105), `Selection Process` (35), `Search` (12), `Bolsa
de trabajo` (5) y hasta una en `Citas`. Cada temporada de búsqueda estrenó
carpeta. **El
seguimiento de candidaturas está implementado en texto plano**, y el balance de
138 rechazos contra 45 solicitudes registradas dice que el estado se apunta
cuando pasa algo malo, no cuando se envía.

Otras notas reutilizan el mismo patrón para la vida: `[fecha] email incidencia
con el …`, `[fecha] contacté para pedir cita`, `[fecha] goteras`. La sintaxis se
inventó para el trabajo y se coló en el resto.

## Plantillas de reunión que se repiten sin plantilla

Encabezados `##` que salen una y otra vez: `standup` (81), `projects` (60),
`personal` (44), `stand up` (39), `all hands` (29), `summary` (23), `overview`
(20), `questions` (17), `tasks` (15), `conclusion` (15), `someday` (13), `nice
to have` (12).

Y el esqueleto de la nota diaria, en 219 notas:

```
yesterday
  …
today
  …
tomorrow
```

Nadie lo copia de ningún sitio: se reescribe a mano cada vez. Por eso hay
`standup` y `stand up`, `[[nextstep]]` y `[[next step]]`. **Cualquier
funcionalidad de plantillas tiene una demanda ya demostrada de 600 notas.**

## Notas vivas contra notas fechadas

Hay dos modos y conviven mal:

- **Nota fechada**: título `2024-12-19 Thu`, se escribe una vez, se archiva
  sola. 1.397 notas empiezan por fecha.
- **Nota viva**: título fijo, se reescribe encima para siempre. `YEGO - Today`
  tiene **6.922 commits de edición**, catorce veces más que la siguiente
  (`Matias`, 474). Dentro lleva `yesterday / today / tomorrow`, un `---`, y
  debajo los frentes abiertos con sus enlaces.

1.098 notas usan `---` como separador, casi siempre para partir "lo de ahora" de
"el fondo de armario".

Los registros crecen **hacia abajo**: de las notas con tres o más fechas, 55
están en orden ascendente y sólo 6 descendente. Lo nuevo se añade al final, no
al principio.

## El tachado es el decaimiento

2.033 tachados `~~así~~` en 428 notas, mediana de 2 por nota y un máximo de 69.
No se borra lo hecho: se tacha y se queda. Combinado con `settings.json`, que lo
pinta gris oscuro, la nota se convierte en un sedimento donde lo vivo destaca
sobre lo muerto.

Esto explica por qué las notas no encogen: una nota de 5.000 líneas es sobre
todo historia tachada.

## Qué se enlaza

2.133 notas llevan una URL. Los dominios dicen para qué se usa esto:

| Dominio | Veces | Qué es |
| --- | --- | --- |
| github.com | 2.329 | PRs y repos del trabajo |
| youtube.com + youtu.be | 2.133 | vídeos guardados |
| app.intercom.com | 355 | soporte de YEGO |
| hackandcraft.atlassian.net | 234 | Jira de la era Hack&Craft |
| app.otta.com | 220 | ofertas de trabajo |
| notion.so | 205 | documentación de equipo |
| feedproxy.google.com | 195 | lector RSS muerto |
| dev.to / knowyourmeme | 157 / 153 | lecturas y memes |
| idealista.com | 110 | búsqueda de casa |
| 1.sedecatastro.gob.es | 56 | catastro, la misma búsqueda |

GitHub y YouTube empatan. Es a la vez un cuaderno de ingeniería y una cola de
"ver luego".

## Los tickets marcan las eras

Prefijos de Jira dentro del texto: `RANG` (525), `YAP` (388), `INFRA` (331),
`YUA` (288), `YBO` (277) — todos YEGO; `KATCHAI` (215) — Katch; `DCON` (166) y
`MCADEV`/`MCA` (90) — Hack&Craft. Los tres empleos se leen en el vocabulario sin
mirar las fechas.

`settings.json` enlaza 10 patrones de ticket. `MCADEV`, `SP`, `APGA`, `ADV` y
`UTF` no están en la lista: 148 referencias sin enlazar.

## Idioma

Por notas: **1.873 en inglés, 652 en español, 3 en catalán**, y 1.152 con
demasiado poco texto para decidir (snippets, listas de enlaces). El trabajo se
escribe en inglés y la vida en español, y se mezclan dentro de la misma nota sin
avisar — `[casa]`, `[libros]` y `contacté para pedir cita` conviven con
`yesterday` y `blockers`.

---

# Qué hacer con esto

## Lo que obliga a soportar

1. Un id puede ser un UUID **o** `md5__fichero`, y el md5 se repite.
2. `favorite` puede ser `null`; `group` puede faltar o ser `''`.
3. Las fechas no son ISO: hay que parsearlas a mano.
4. Puede haber nota sin meta (13) y meta sin nota (2).
5. La primera línea puede llevar `#`, `##`, `//`, `<!--`, `%%`, `--` o nada, y
   el cierre `-->` se cuela en el título.
6. Las URLs con `/` en la primera línea rompen la partición del grupo.
7. Los grupos chocan por mayúsculas y por idioma; unificarlos es una decisión de
   producto, no un bug del parser.
8. Tachado, no checkbox. Autoenlace, no markdown.

## Lo que sugiere construir

1. **Renderizar la sangría como árbol**, no como bloque de código.
2. **Unificar `[[nextstep]]` y sus cuatro variantes** en un solo regex: 309
   marcadores, hoy 168 invisibles.
3. **Indexar `[etiqueta]`** como segunda dimensión junto al grupo.
4. **Plantillas de nota**: standup, diaria y oferta de trabajo están demostradas
   por 606, 1.397 y 351 notas respectivamente.
5. **Distinguir nota viva de nota fechada** en la interfaz. `YEGO - Today` y una
   nota de 2019 no son el mismo objeto.
6. **Autoenlazar `MCADEV`, `SP`, `APGA`, `ADV`, `UTF`** en `settings.json`.
7. **Buscar por `@actor`**: 686 líneas empiezan por una mención, y hoy no hay
   forma de ver "todo lo de @marc".
