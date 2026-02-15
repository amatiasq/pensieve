# Pensieve - Resumen funcional

## Qué es Pensieve

Pensieve es una aplicación web de notas orientada a la privacidad. Las notas se almacenan en un **repositorio privado de GitHub** del usuario, lo que garantiza que el usuario mantiene control total sobre sus datos. La app funciona offline como PWA y sincroniza con GitHub cuando hay conexión.

## El editor

El editor de texto es **Monaco Editor** (el mismo motor de VS Code). Esto proporciona:

- Cursores múltiples
- Syntax highlighting automático según la extensión del archivo
- Minimap (activado cuando la nota supera las 100 líneas)
- Configuración de tab size, word wrap, rulers e indent guides
- Highlighting personalizado mediante regex (configurado en Settings)
- Detección de links personalizados mediante regex
- Soporte para Mermaid (diagramas)

En móvil, Monaco se reemplaza por un `<textarea>` simple como fallback.

### Auto-guardado

El editor guarda automáticamente tras un periodo de inactividad (por defecto 5 segundos, configurable). También guarda de forma urgente cuando el usuario sale de la pestaña. Antes de guardar, formatea el contenido (elimina espacios al final de línea y asegura newline final).

## La sidebar

La barra lateral contiene:

1. **Cabecera**: campo de búsqueda (filtro) y botón para crear nota nueva.
2. **Lista de notas**: agrupadas por carpetas, con favoritos siempre arriba.

La lista se renderiza de forma virtualizada: carga 50 notas inicialmente y añade 50 más al hacer scroll hacia abajo. Se puede ocultar/mostrar con un atajo de teclado. El ancho es ajustable con un resizer arrastrable.

## Organización de notas: primera línea = nombre

El sistema de nombrado y carpetas se basa en la **primera línea** del contenido de cada nota:

```
// carpeta/nombre-del-archivo.js
```

La primera línea se interpreta así:

1. Se detecta la **extensión** del archivo a partir de la primera línea (`.js`, `.py`, `.md`, etc.).
2. Se elimina el **comentario** del lenguaje correspondiente (`//` para JS/TS, `#` para Python/Shell/YAML/Markdown, `--` para SQL, `<!--` `-->` para HTML, `%%` para Mermaid).
3. El texto limpio se divide por `/`:
   - Si hay una barra: la parte izquierda es el **grupo (carpeta)** y la derecha es el **título**.
   - Si no hay barra: todo es el **título** y la nota no pertenece a ningún grupo.

### Ejemplos

| Primera línea | Extensión | Carpeta | Título |
|---|---|---|---|
| `// utils/helpers.js` | `.js` | `utils` | `helpers.js` |
| `# recetas/bizcocho.md` | `.md` | `recetas` | `bizcocho.md` |
| `-- queries/users.sql` | `.sql` | `queries` | `users.sql` |
| `// mi-nota.ts` | `.ts` | *(ninguna)* | `mi-nota.ts` |
| `# ideas.md` | `.md` | *(ninguna)* | `ideas.md` |

La extensión detectada determina el **syntax highlighting** en Monaco. Si no se reconoce extensión, se usa Markdown por defecto.

### Lenguajes soportados

| Extensión | Comentario |
|---|---|
| `.js`, `.ts`, `.cs`, `.fs` | `//` |
| `.md`, `.py`, `.sh`, `.yaml`, `.yml` | `#` |
| `.sql` | `--` |
| `.html` | `<!-- -->` |
| `.mermaid`, `.mmd` | `%%` |

## Almacenamiento y persistencia

### Arquitectura de capas

El almacenamiento sigue un patrón de middlewares encadenados:

```
Aplicación (hooks)
    │
    ▼
MixedStore ─── combina lectura/escritura local y remota
    │
    ├── Local:  CachedStore (5s) → ForageStore (IndexedDB)
    │
    └── Remoto: CachedStore (30s) → ResilientOnlineStore → GHRepoStore (GitHub API)
```

- **ForageStore**: persiste en IndexedDB del navegador (vía LocalForage).
- **GHRepoStore**: lee y escribe ficheros en el repositorio privado de GitHub. Agrupa escrituras con un scheduler de 100ms para crear commits batch.
- **ResilientOnlineStore**: detecta online/offline. Cuando está offline, encola las escrituras y las ejecuta al volver a estar online.
- **CachedStore**: caché en memoria con TTL (5s local, 30s remoto).
- **MixedStore**: orquesta local y remoto. Las lecturas prefieren remoto con fallback a local. Las escrituras van a ambos en paralelo.

### Estructura en GitHub

Cada nota se almacena como dos ficheros en el repositorio:

```
meta/{id}.json    ← metadatos (título, grupo, favorito, fechas)
note/{id}         ← contenido completo de la nota
settings.json     ← configuración global
shortcuts.json    ← atajos de teclado personalizados
```

Los IDs son UUID v4 generados en el cliente.

## Autenticación

La app usa **OAuth2 con GitHub**. El flujo:

1. El usuario autoriza la app en GitHub.
2. Un Cloudflare Worker (`/auth`) intercambia el código por un token.
3. El token se almacena en `localStorage`.
4. Con el token, la app accede al repositorio privado del usuario vía GitHub REST y GraphQL APIs.

## Funcionalidad offline (PWA)

- Service Worker con Workbox para cachear assets.
- IndexedDB como caché local de notas y metadatos.
- Las escrituras offline se encolan y se sincronizan al recuperar conexión.
- La app es instalable desde el navegador.

## Navegación (rutas)

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | *(sidebar)* | Página principal, muestra la lista de notas |
| `/new` | `CreateNote` | Crear nota nueva |
| `/settings` | `EditSettings` | Editar configuración (JSON con Monaco) |
| `/note/:id` | `EditNoteFromUrl` | Editar una nota |

En móvil, la sidebar y el editor son pantallas separadas. En desktop, se muestran lado a lado en un grid CSS.

## Configuración

La configuración se edita como JSON directamente en Monaco. Opciones disponibles:

| Clave | Tipo | Default | Descripción |
|---|---|---|---|
| `autosave` | number | `5` | Segundos de inactividad antes de guardar (0 = desactivado) |
| `tabSize` | number | `2` | Tamaño de tabulación |
| `wordWrap` | boolean | `true` | Ajuste de línea |
| `rulers` | number[] | `[]` | Líneas verticales de referencia |
| `renderIndentGuides` | boolean | `false` | Guías de indentación |
| `sidebarVisible` | boolean | `true` | Mostrar sidebar |
| `sidebarWidth` | number | `400` | Ancho de sidebar en px |
| `starNewNotes` | boolean | `true` | Marcar notas nuevas como favoritas |
| `highlight` | object | *(ver abajo)* | Regex → color para highlighting personalizado |
| `links` | object | *(ver abajo)* | Regex → URL para links personalizados |
| `folders` | object | `{ Snippets: {} }` | Aliases de carpetas |

### Highlight por defecto

```json
{
  "~~[^~]*~~": "#505050",
  "@(\\w|-)+": "#6fb9ef"
}
```

Texto tachado (`~~texto~~`) se muestra en gris y menciones (`@usuario`) en azul.

### Links por defecto

```json
{
  "\\[(\\w+/\\w+)]": "https://github.com/$1"
}
```

Texto como `[owner/repo]` se convierte en link a GitHub.

## Atajos de teclado

Los atajos son personalizables editando `shortcuts.json`. Los principales:

- **Guardar** (`Ctrl+S`): fuerza guardado inmediato
- **Settings** (`Cmd+,`): navega a configuración
- **Nueva nota** (`Cmd+N`): crea nota nueva
- **Ocultar sidebar**: toggle de la barra lateral

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 17 + Emotion (CSS-in-JS) |
| Editor | Monaco Editor 0.25.2 |
| Routing | React Router 5 |
| Reactividad | RxJS 7 |
| Build | Vite 6 + TypeScript 5 |
| Persistencia local | LocalForage (IndexedDB) |
| Backend | Cloudflare Workers |
| Almacenamiento remoto | GitHub API (REST + GraphQL) |
| PWA | vite-plugin-pwa + Workbox |
| Tests E2E | Cypress |
