# Pensieve - Arquitectura

## Estructura de carpetas

```
pensieve/
├── src/
│   ├── 0-dom/           Utilidades DOM (detección móvil, teclado virtual, clipboard)
│   ├── 1-core/          Infraestructura (HTTP, message bus, atajos de teclado)
│   ├── 2-entities/      Modelos de dominio (Note, Settings, Shortcuts)
│   ├── 3-github/        Integración con GitHub (auth, REST, GraphQL)
│   ├── 4-storage/       Capa de almacenamiento (middlewares, cache, sync)
│   ├── 5-app/           Shell de la aplicación (App, Router, theme, contextos)
│   ├── 6-hooks/         Hooks de React (useNote, useStore, useSetting, etc.)
│   ├── 7-components/    Componentes UI
│   │   ├── atoms/         Componentes base (Button, Loader, Resizer, etc.)
│   │   ├── icons/         Iconos SVG como componentes React
│   │   ├── Editor/        Editor Monaco + extensiones
│   │   ├── NotesList/     Sidebar: lista, grupos, items, favoritos
│   │   ├── SidebarHeader/ Cabecera de sidebar (filtro + crear)
│   │   └── routes/        Componentes de página (CreateNote, EditNote, EditSettings)
│   ├── api/             Backend: Cloudflare Worker (auth + commits)
│   └── util/            Utilidades (serialización, sleep, comparador de strings)
├── public/              Assets estáticos
├── dist/                Build de producción
├── vite.config.ts       Configuración Vite + PWA
└── package.json
```

Las carpetas están numeradas (`0-dom` a `7-components`) para reflejar la jerarquía de dependencias: cada capa solo importa de capas con número igual o inferior.

## Capas de la aplicación

```
┌──────────────────────────────────┐
│  7-components (UI)               │  React components, Monaco Editor
├──────────────────────────────────┤
│  6-hooks (lógica React)          │  useNote, useStore, useSetting...
├──────────────────────────────────┤
│  5-app (shell)                   │  App, Router, contextos, theme
├──────────────────────────────────┤
│  4-storage (persistencia)        │  MixedStore, ForageStore, GHRepoStore
├──────────────────────────────────┤
│  3-github (API externa)          │  Auth, REST, GraphQL
├──────────────────────────────────┤
│  2-entities (dominio)            │  Note, Settings, Shortcuts
├──────────────────────────────────┤
│  1-core (infraestructura)        │  messageBus, HTTP, keyboard
├──────────────────────────────────┤
│  0-dom (bajo nivel)              │  isMobile, clipboard, page lifecycle
└──────────────────────────────────┘
```

## Flujo de datos

```
                    ┌─────────────┐
                    │  Componente │
                    │  (Editor)   │
                    └──────┬──────┘
                           │ onChange
                    ┌──────▼──────┐
                    │    Hook     │
                    │ (useNote)   │
                    └──────┬──────┘
                           │ write
                    ┌──────▼──────┐
                    │ RemoteNote  │  ← emite eventos via messageBus
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  MixedStore │
                    └───┬─────┬───┘
                        │     │
              ┌─────────▼┐   ┌▼──────────┐
              │  Local    │   │  Remoto   │
              │(IndexedDB)│   │ (GitHub)  │
              └───────────┘   └───────────┘
```

### Lectura (stale-while-revalidate)

1. Se lee primero de la caché local (IndexedDB) para mostrar al instante.
2. En paralelo se lee de GitHub.
3. Si el dato remoto es diferente, se actualiza la caché local y se emite un evento de cambio.

### Escritura

1. Se escribe a local y remoto en paralelo (`Promise.race`).
2. GHRepoStore agrupa las escrituras en un scheduler de 100ms para hacer commits batch.
3. Si está offline, ResilientOnlineStore encola las escrituras y las reintenta al reconectar.

## Comunicación entre componentes

Se usa un **message bus** (pub/sub) basado en `@amatiasq/emitter`:

```
note:changed:{id}           → metadatos de nota actualizados
note:content-changed:{id}   → contenido de nota actualizado
note:deleted:{id}           → nota eliminada
note:title:{id}             → draft: título cambiado sin guardar
notes-created               → nuevas notas creadas
json:changed:{key}          → settings o shortcuts actualizados
```

Los hooks de React se suscriben a estos eventos para re-renderizar cuando hay cambios.

## Componentes principales

### App (`5-app/App.tsx`)

Layout principal como CSS Grid:
- **Desktop**: `[sidebar-header | resizer | editor]` / `[list | resizer | editor]`
- **Móvil**: una sola columna, intercambia entre sidebar y editor según la ruta

### Editor (`7-components/Editor/`)

- `Editor.tsx`: wrapper que gestiona auto-guardado, formateo y estado de cambios sin guardar.
- `MonacoEditor.tsx`: instancia de Monaco con configuración dinámica (idioma, theme, settings).
- `MobileFallback.tsx`: textarea plano para móvil.
- `monaco/`: extensiones de Monaco (theme, lenguaje Markdown, links, highlighting regex).

### NotesList (`7-components/NotesList/`)

- `NotesList.tsx`: lista virtualizada con agrupación por carpetas y filtrado.
- `NoteGroup.tsx`: grupo colapsable de notas (una carpeta).
- `NoteItem.tsx`: nota individual con link, botón de favorito y menú de acciones.
- `FavoriteButton.tsx`: estrella para marcar/desmarcar favorito.
- `NoteActions.tsx`: menú contextual (copiar link, bump, eliminar).

### Storage (`4-storage/`)

- `AsyncStore.ts`: interfaz abstracta de lectura/escritura.
- `MixedStore.ts`: combina local + remoto.
- `ForageStore.ts`: adaptador de LocalForage (IndexedDB).
- `GHRepoStore.ts`: adaptador de GitHub con batching de commits.
- `ResilientOnlineStore.ts`: cola offline con reintento.
- `CachedStore.ts`: caché en memoria con TTL.
- `NotesStorage.ts`: API de alto nivel para CRUD de notas.
- `RemoteNote.ts`: wrapper reactivo de una nota individual (meta + contenido + eventos).
