# Pensieve - Mejoras propuestas

## 1. Dependencias sin usar (eliminar)

Estas dependencias aparecen en `package.json` pero no se importan en ningún fichero fuente:

| Paquete | Motivo |
|---|---|
| `express` | Backend legacy, no se usa |
| `body-parser` | Middleware de Express, no se usa |
| `cors` | Middleware de Express, no se usa |
| `axios` | Toda la HTTP se hace con `fetch` nativo en `http.ts` |

Eliminarlas reduce el tamaño de `node_modules` y simplifica auditorías de seguridad.

---

## 2. Actualización de dependencias

### React: 17.0.1 → 19 (último: 19.2.4)

Migración en dos pasos:

**Paso 1 — React 18.3** (versión con warnings de deprecación):
- `ReactDOM.render()` → `ReactDOM.createRoot().render()`.
- Batching automático de state updates (puede cambiar timings).
- Strict Mode hace doble mount en dev.
- Nuevos hooks disponibles: `useTransition`, `useDeferredValue`.

**Paso 2 — React 19:**
- `ReactDOM.render()` eliminado completamente.
- `forwardRef` ya no es necesario — `ref` es una prop normal.
- `defaultProps` en componentes función eliminado — usar parámetros por defecto.
- `propTypes` ignorado silenciosamente.
- String refs y Legacy Context API eliminados.

### React Router: 5.2.0 → 7 (último: 7.13.0)

Migración en dos pasos:

**Paso 1 — v6** (el cambio grande):
- `<Switch>` → `<Routes>`.
- `<Route component={Foo}>` → `<Route element={<Foo />}>`.
- `useHistory()` → `useNavigate()`.
- Rutas anidadas con `<Outlet />`.
- Paquete de compatibilidad `react-router-dom-v5-compat` para migrar gradualmente.

**Paso 2 — v7** (mínimo si se usan future flags):
- Todo se importa de `react-router` (sin `react-router-dom` separado).
- Sin breaking changes si se activan future flags en v6 primero.

### Monaco Editor: 0.25.2 → 0.55.1

Salto grande (30 minor versions) pero Monaco mantiene compatibilidad para uso básico del editor. `@monaco-editor/react` pasa de 4.3.1 a 4.7.0 (hay RC para React 19).

### ESLint: 7.19.0 → 10.0.0

Tres saltos major:
- **v8**: menor, limpieza de reglas deprecadas.
- **v9**: flat config (`eslint.config.js`) por defecto. Herramienta de migración oficial disponible.
- **v10** (febrero 2026): `.eslintrc.*` eliminado completamente, solo flat config.

### Wrangler: @cloudflare/wrangler 1.20.0 → wrangler 4.x

`@cloudflare/wrangler` (v1, escrito en Rust) está **archivado y deprecado**. El reemplazo es el paquete `wrangler` (sin scope), actualmente en v4. Escrito en JS/TS, con soporte para D1, R2, modo local con Miniflare.

### Cypress: 9.1.1 → Playwright

Cypress está en 15.10.0, pero **Playwright** es la alternativa recomendada:
- Soporte Safari + emulación móvil.
- Paralelización nativa y gratuita (Cypress requiere Cloud de pago).
- ~46% más rápido en CI.
- Multi-tab y cross-origin sin limitaciones.
- Ya se usa en soliluna v3 del mismo monorepo.

### Otras dependencias menores

| Paquete | Actual | Último | Notas |
|---|---|---|---|
| `vite-plugin-pwa` | 1.0.0 | 1.2.0 | Upgrade directo, sin breaking changes |
| `rxjs` | 7.1.0 | 7.8+ | Minor updates, sin breaking changes |
| `@emotion/react` | 11.9.3 | 11.14+ | Minor updates |

---

## 3. Dependencias reemplazables por APIs nativas

### `uuid` → `crypto.randomUUID()`

`crypto.randomUUID()` tiene soporte en el 95% de navegadores (Chrome 92+, Firefox 95+, Safari 15.4+). Requiere HTTPS (o localhost). Genera UUID v4 idénticos al paquete `uuid`. Se puede eliminar la dependencia por completo.

```ts
// Antes
import { v4 as uuid } from 'uuid';
const id = uuid();

// Después
const id = crypto.randomUUID();
```

### `localforage` → `idb-keyval` o `idb`

LocalForage lleva **4+ años sin release** (última: v1.10.0). Su propósito original — abstracción sobre IndexedDB/WebSQL/localStorage con fallback — ya no es relevante porque IndexedDB es universal.

Alternativas:
- **`idb-keyval`** (~600 bytes): API key-value simple, ideal para este caso de uso. Mantenido por Jake Archibald (equipo Chrome).
- **`idb`**: wrapper más completo con acceso a toda la API de IndexedDB.

### `rxjs` → patrones nativos

RxJS (72KB gzipped) se usa solo en 3 ficheros:
- `page-lifecycle.ts`: observables de visibilidad de página.
- `rxjs-extensions.ts`: utilidad para wrappear emitters.
- `Editor.tsx`: debounce + merge de señales de guardado.

Todo esto se puede reemplazar con:
- `AbortController` + `addEventListener` para ciclo de vida.
- `setTimeout`/`clearTimeout` para debounce.
- `Promise.race()` para merge de señales.

---

## 4. Mejoras de plataforma web

### `navigator.storage.persist()`

Solicitar almacenamiento persistente al navegador para que no borre IndexedDB bajo presión de memoria:

```ts
if (navigator.storage?.persist) {
  const granted = await navigator.storage.persist();
  console.log('Persistent storage:', granted);
}
```

### `navigator.storage.estimate()`

Mostrar al usuario cuánto espacio usa la caché local:

```ts
const { usage, quota } = await navigator.storage.estimate();
```

### Background Sync API

Reemplazar la cola manual de `ResilientOnlineStore` con la Background Sync API del Service Worker. Permite que las escrituras pendientes se ejecuten incluso si el usuario cierra la pestaña:

```ts
// En el Service Worker
self.addEventListener('sync', event => {
  if (event.tag === 'pending-writes') {
    event.waitUntil(flushPendingWrites());
  }
});
```

### BroadcastChannel API

Para sincronización multi-pestaña. Actualmente `messageBus` usa `window.postMessage()`. `BroadcastChannel` es más limpio y está diseñado para comunicación same-origin entre tabs:

```ts
const channel = new BroadcastChannel('pensieve');
channel.postMessage({ type: 'note:changed', id });
channel.onmessage = event => handleSync(event.data);
```

### `AbortSignal.timeout()`

Para timeouts en fetch requests, más limpio que el patrón `setTimeout` + `AbortController`:

```ts
fetch(url, { signal: AbortSignal.timeout(5000) });
```

### `URLSearchParams`

En `GithubAuth.ts` se construyen query strings con concatenación de strings. Se puede usar la API nativa:

```ts
// Antes
const params = withParams(url, { client_id, state });

// Después
const params = new URLSearchParams({ client_id, state });
```

### `structuredClone()`

Para deep copy de objetos en lugar de `JSON.parse(JSON.stringify())` (si se usa en algún sitio).

---

## 5. Bugs y deuda técnica

### `Math.random()` para OAuth state

En `GithubAuth.ts` se usa `Math.random().toString().substr(2)` para generar el state de OAuth. Dos problemas:
1. `Math.random()` no es criptográficamente seguro — usar `crypto.randomUUID()`.
2. `.substr()` está deprecado — usar `.slice()`.

### Fire-and-forget en MixedStore

En `MixedStore.ts` hay un `Promise.all(promises).then(...)` sin `.catch()`. Si falla silenciosamente, las escrituras se pierden sin aviso.

### Sin límite en cola offline

`ResilientOnlineStore` encola comandos sin límite cuando está offline. Si el usuario está offline mucho tiempo, la cola puede crecer indefinidamente. Añadir un máximo (ej. 100 comandos) y avisar al usuario.

### Retry sin backoff exponencial

El reintento usa un intervalo fijo de 1 segundo. Implementar backoff exponencial para no saturar una conexión inestable.

### ForageStore carga todas las keys

`readAll()` lee todas las keys de IndexedDB y filtra por patrón en JS. Para datasets grandes, sería más eficiente usar cursores de IndexedDB con key ranges.

### MemoryCache sin limpieza automática

Las entradas expiradas solo se limpian cuando se accede a ellas (`has()` check). Pueden acumularse en memoria. Añadir un `setTimeout` para limpieza periódica o un `FinalizationRegistry`.

### `console.debug` desactivado globalmente

En `main.ts` se anula `console.debug = () => {}` en producción. Esto es demasiado agresivo — mejor filtrar por namespace o usar una variable de entorno.

---

## 6. Mejoras de UX

### Búsqueda full-text

Actualmente el filtro de la sidebar solo busca por título. Implementar búsqueda full-text en el contenido de las notas usando la caché de IndexedDB.

### Indicador de estado de sincronización

Mostrar visualmente si la nota está:
- Guardada localmente
- Sincronizada con GitHub
- Pendiente de sync (offline)
- En conflicto

### Soporte multi-cursor en móvil

> NOTA DEL PROGRAMADOR: Esta mejora no es necesaria, el movil no necesita multi-cursor

El fallback móvil es un `<textarea>` plano. Monaco Editor ya funciona mejor en móviles modernos — evaluar si el fallback sigue siendo necesario o si se puede usar Monaco con configuración adaptada.

### Drag & drop para mover notas entre carpetas

> NOTA DEL PROGRAMADOR: Esta mejora no es necesaria

Permitir arrastrar notas de un grupo a otro en la sidebar, actualizando la primera línea automáticamente.

### Markdown preview

> NOTA DEL PROGRAMADOR: Esta mejora no es necesaria

Para notas `.md`, ofrecer un modo preview renderizado (o split view) además del editor de código.

---

## 7. Orden de prioridad sugerido

| Prioridad | Tarea | Esfuerzo |
|---|---|---|
| 1 | Eliminar dependencias sin usar (express, body-parser, cors, axios) | 5 min |
| 2 | Reemplazar `uuid` por `crypto.randomUUID()` | 15 min |
| 3 | Fix `Math.random()` → `crypto.randomUUID()` en OAuth state | 15 min |
| 4 | Fix `.substr()` → `.slice()` | 5 min |
| 5 | Añadir `.catch()` al fire-and-forget de MixedStore | 5 min |
| 6 | `@cloudflare/wrangler` → `wrangler` v4 | 1-2h |
| 7 | Actualizar `vite-plugin-pwa` a 1.2.0 | 10 min |
| 8 | Añadir `navigator.storage.persist()` | 30 min |
| 9 | Reemplazar `localforage` por `idb-keyval` | 1-2h |
| 10 | Eliminar RxJS, usar patrones nativos | 2-4h |
| 11 | React 17 → 18.3 (primer paso) | 2-4h |
| 12 | React Router 5 → 6 | 4-8h |
| 13 | ESLint 7 → 10 (flat config) | 2-4h |
| 14 | React 18.3 → 19 (segundo paso) | 1-2h |
| 15 | React Router 6 → 7 | 1-2h |
| 16 | Monaco Editor 0.25 → 0.55 | 2-4h |
| 17 | Cypress → Playwright | 1-2 días |
| 18 | Background Sync API | 4-8h |
| 19 | BroadcastChannel para multi-tab | 2-4h |
| 20 | Búsqueda full-text | 1-2 días |

---

## 8. Modo Offline robusto

Pensieve ya tiene una base offline (IndexedDB via `idb-keyval`, `ResilientOnlineStore` con cola en localStorage, `CachedStore`, `MixedStore` con stale-while-revalidate, BroadcastChannel, PWA con Workbox). Sin embargo, tiene varias debilidades frente a la implementación de Soliluna:

| Problema actual | Impacto |
|---|---|
| Cola offline en `localStorage` | Límite de ~5MB, no sobrevive a crash de pestaña de forma fiable |
| Sin tracking estructurado de reintentos | Comandos fallidos se pierden silenciosamente tras 5 intentos |
| `MixedStore` con fire-and-forget | Escrituras pueden fallar sin aviso |
| Sin indicador de estado de sync | El usuario no sabe si sus cambios están guardados |
| Service Worker solo cachea assets | Las respuestas de GitHub API no se cachean en SW |
| Sin reconciliación periódica | Si el sync falla, no hay retry automático posterior |
| Sin coordinación multi-tab para sync | Varias pestañas pueden intentar flush simultáneo |
| Sin `navigator.storage.persist()` | El navegador puede borrar IndexedDB bajo presión de memoria |

### Fase 1: Outbox en IndexedDB

Mover la cola de comandos pendientes de `localStorage` a IndexedDB. Esto da más capacidad de almacenamiento, persistencia ante crashes, y estructura.

**Cambios:**

1. **Nuevo store `outbox` en IndexedDB** (`4-storage/outbox.ts`):
   - Schema: `{ id: auto, method: string, params: any[], createdAt: number, retries: number, status: 'pending' | 'failed', lastError?: string }`
   - Operaciones: `enqueue()`, `dequeue()`, `markFailed()`, `peek()`, `count()`, `clear()`
   - Usar `idb` (ya disponible como dependencia de `idb-keyval`) para acceso tipado con stores múltiples

2. **Migrar `ResilientOnlineStore`** (`4-storage/middleware/ResilientOnlineStore.ts`):
   - Reemplazar `ClientStorage('pensieve.pending-commands')` por el nuevo outbox IndexedDB
   - Mantener la lógica de exponential backoff (1s → 30s max) y max 5 reintentos
   - Al superar reintentos: marcar como `'failed'` en vez de descartar silenciosamente
   - Añadir evento en messageBus para notificar cambios de estado del outbox

3. **`navigator.storage.persist()`** (`main.ts`):
   - Ya se solicita en el código actual — verificar que funciona correctamente
   - Añadir `navigator.storage.estimate()` para monitorizar uso de espacio

**Ficheros afectados:** `ResilientOnlineStore.ts` (refactor), nuevo `outbox.ts`, `main.ts` (verificar)

### Fase 2: Orquestación de sync

Definir un ciclo de sincronización claro y predecible, inspirado en el patrón de Soliluna: **flush outbox → fetch remoto → reconciliar**.

**Cambios:**

1. **Sync manager** (`4-storage/sync.ts`):
   - `syncAll()`: flush outbox → esperar completación → fetch all desde GitHub → reconciliar con local
   - `flushOutbox()`: procesa entradas FIFO, respeta order de creación
   - **Regla crítica**: NO precargar datos remotos hasta que el outbox esté vacío (evita sobrescribir cambios locales)

2. **Triggers de sync**:
   - Al recuperar conexión (`window.addEventListener('online')`)
   - Al activar la pestaña (`visibilitychange` cuando `!document.hidden`)
   - Periódico cada 60s (solo si online + pestaña visible)
   - Al arrancar la app (después de auth)

3. **Tracking de última sync**:
   - Guardar `lastSyncAt` en IndexedDB (store `meta`)
   - Usar para detectar si hay notas remotas más recientes sin hacer full fetch
   - GitHub API: usar `If-Modified-Since` header para reducir llamadas

4. **Integración con `MixedStore`**:
   - `readAll()` con reconciliación: comparar local vs remoto, detectar conflictos
   - Mantener el patrón stale-while-revalidate: mostrar local inmediato, actualizar con remoto

**Ficheros afectados:** nuevo `sync.ts`, `MixedStore.ts` (refactor readAll), `page-lifecycle.ts` (triggers), `index.ts` (inicialización)

### Fase 3: Resiliencia y manejo de errores

Corregir los problemas actuales de fire-and-forget y añadir protección contra GitHub API rate limits.

**Cambios:**

1. **Fix fire-and-forget en `MixedStore.ts`**:
   - Añadir `.catch()` a todas las promesas desatendidas
   - Loguear errores de escritura remota sin romper la escritura local
   - Emitir evento de error via messageBus para que la UI pueda reaccionar

2. **Circuit breaker para GitHub API**:
   - Tras N errores consecutivos (ej. 3), pausar llamadas remotas durante un periodo exponencial
   - Detectar `403 rate limit` y respetar `X-RateLimit-Reset` header
   - Detectar `401 unauthorized` y redirigir a re-auth
   - Durante circuit open: funcionar en modo 100% local

3. **Retry con jitter**:
   - Añadir jitter aleatorio al exponential backoff para evitar thundering herd
   - `delay = min(baseDelay * 2^attempt + random(0, 1000), maxDelay)`

4. **Conflict resolution para GitHub**:
   - GitHub usa SHAs para versionado — si un commit falla por SHA mismatch:
     1. Leer la versión remota actual
     2. Comparar con la versión local
     3. Si el contenido es idéntico: descartar (ya sincronizado)
     4. Si difiere: guardar ambas versiones, marcar como conflicto, notificar al usuario
   - `GHRepoStore` ya maneja SHAs parcialmente — extender con detección explícita de conflictos

**Ficheros afectados:** `MixedStore.ts`, `GHRepoStore.ts`, `ResilientOnlineStore.ts`, `http.ts` (circuit breaker)

### Fase 4: Indicador de estado de sync en UI

Dar feedback visual al usuario sobre el estado de sus notas, inspirado en el `SaveIndicator` de Soliluna.

**Cambios:**

1. **Estado de sync global** (`6-hooks/useSyncStatus.ts`):
   - Estados: `synced` | `saving` | `pending` | `offline` | `error` | `conflict`
   - Se alimenta de: estado de red (`navigator.onLine`), outbox count, errores activos
   - Exponer via React Context para acceso global

2. **Componente `SyncIndicator`** (`7-components/atoms/SyncIndicator.tsx`):
   - Icono + tooltip con estado actual
   - `synced`: ✓ verde, "Sincronizado"
   - `saving`: spinner, "Guardando..."
   - `pending`: reloj naranja, "N cambios pendientes"
   - `offline`: nube tachada, "Sin conexión — cambios guardados localmente"
   - `error`: ✗ rojo, "Error de sincronización"
   - `conflict`: ⚠ amarillo, "Conflicto detectado"
   - Posición: header de la sidebar, junto al botón de crear nota

3. **Estado por nota** en `RemoteNote`:
   - Emitir evento `note:sync-status:{id}` cuando cambia el estado de sync de una nota
   - El Editor puede mostrar un indicador sutil (ej. borde de color en la pestaña o esquina)

4. **Timestamp de última sync**:
   - Mostrar "Última sincronización: hace 2 min" en tooltip o footer

**Ficheros afectados:** nuevo `useSyncStatus.ts`, nuevo `SyncIndicator.tsx`, `SidebarHeader/` (integración), `RemoteNote.ts` (eventos)

### Fase 5: Service Worker mejorado

Cachear respuestas de GitHub API en el Service Worker para que la app funcione offline incluso en primera carga (si hay cache previa).

**Cambios:**

1. **Workbox runtime caching** para GitHub API (`vite.config.ts`):
   ```ts
   runtimeCaching: [{
     urlPattern: /^https:\/\/api\.github\.com\//,
     handler: 'NetworkFirst',
     options: {
       cacheName: 'github-api',
       networkTimeoutSeconds: 3,
       expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
       cacheableResponse: { statuses: [0, 200] }
     }
   }]
   ```

2. **Precache del shell de la app**:
   - Verificar que `generateSW` cachea todos los assets necesarios (HTML, JS, CSS, fuentes, iconos)
   - Configurar `navigateFallback` para SPA routing offline

3. **Update lifecycle**:
   - Prompt al usuario cuando hay nueva versión disponible (ya existe `onNeedRefresh`)
   - Mejorar UX: mostrar banner persistente "Nueva versión disponible — click para actualizar"

**Ficheros afectados:** `vite.config.ts` (workbox config), `main.ts` (SW lifecycle)

### Fase 6: Coordinación multi-tab

Pensieve ya tiene BroadcastChannel. Extenderlo para coordinar la sincronización entre pestañas.

**Cambios:**

1. **Leader election simple**:
   - Solo la pestaña "líder" ejecuta el flush del outbox y el polling periódico
   - Al cerrar la pestaña líder, otra asume el rol
   - Implementar con `BroadcastChannel` + `setTimeout` para heartbeat (cada 5s)
   - Si no llega heartbeat en 10s, la pestaña más antigua se auto-elige

2. **Broadcast de resultados de sync**:
   - Cuando la pestaña líder completa un sync, broadcast de los cambios a las demás
   - Las demás actualizan su caché local sin hacer llamadas API adicionales

3. **Prevención de escrituras duplicadas**:
   - Si dos pestañas editan la misma nota, ambas escriben a local
   - Solo la líder sube a GitHub — las demás ven el resultado via broadcast
   - En caso de conflicto: la última escritura local gana (la nota está abierta en esa pestaña)

**Ficheros afectados:** `messageBus.ts` (leader election), nuevo `tabLeader.ts`, `sync.ts` (integración)

---

### Orden de implementación sugerido

| Paso | Fase | Descripción | Dependencias |
|---|---|---|---|
| 1 | F1 | Outbox en IndexedDB | Ninguna |
| 2 | F3.1 | Fix fire-and-forget en MixedStore | Ninguna |
| 3 | F2 | Sync manager con triggers | F1 |
| 4 | F3.2-3 | Circuit breaker + jitter | F2 |
| 5 | F4 | Indicador de sync en UI | F2, F3 |
| 6 | F5 | Service Worker mejorado | Ninguna (paralelo) |
| 7 | F3.4 | Conflict resolution GitHub | F3.2 |
| 8 | F6 | Coordinación multi-tab | F2 |

### Consideraciones específicas de Pensieve vs Soliluna

| Aspecto | Soliluna | Pensieve |
|---|---|---|
| Backend | API propia (Hono + D1) | GitHub REST/GraphQL API |
| Real-time push | SSE via Durable Objects | No disponible — solo polling |
| Conflict detection | `updatedAt` en cada entidad | SHA de Git por fichero |
| Rate limits | Sin límite práctico | GitHub: 5000 req/hora con token |
| Latencia de escritura | ~50ms (D1 local) | ~500ms-2s (GitHub API) |
| Tamaño de datos | Decenas de recetas | Cientos/miles de notas |
| IDs | ULIDs | UUID v4 |

Estas diferencias implican:
- **Más agresivo con cache local**: las lecturas de GitHub son lentas, priorizar IndexedDB
- **Batching crítico**: las escrituras deben agruparse para reducir commits (ya lo hace GHRepoStore)
- **Rate limit awareness**: imprescindible el circuit breaker
- **Sin SSE**: depender de polling + visibilitychange para detectar cambios remotos
- **Reconciliación por SHA**: usar el SHA de cada fichero para saber si cambió, no timestamps

---

## 9. Tests E2E con Playwright

### El problema: OAuth redirect

GitHub OAuth hace un redirect completo (`window.location = 'https://github.com/login/oauth/authorize?...'`), lo que saca a Playwright del dominio de la app. No se puede interceptar porque el navegador navega fuera del sitio.

### La solución: bypass de auth via localStorage

La app comprueba `localStorage` al cargar (`useGithubAuth`). Si encuentra token + username, no redirige. El formato de `ClientStorage` es:

```json
{ "data": "valor", "version": 1, "updated": 1707907200000 }
```

**Estrategia de 3 niveles:**

1. **Auth bypass** — inyectar token falso en localStorage antes de navegar
2. **GitHub API mock** — interceptar todas las llamadas a `api.github.com` con `page.route()`
3. **Modo offline** — bloquear red para tests de offline

### Fase 1: Fixture de autenticación

**Crear `e2e/fixtures.ts`** con un fixture de Playwright que configura auth:

```ts
import { test as base } from '@playwright/test';

// Datos mock
const FAKE_TOKEN = 'ghp_test_fake_token_for_e2e';
const FAKE_USER = 'test-user';

export const test = base.extend({
  // Fixture que pre-configura localStorage con token
  authenticatedPage: async ({ page }, use) => {
    // 1. Navegar a la app para tener acceso al localStorage del dominio
    //    (usar /halt para que no haga redirect)
    await page.goto('/#/halt');

    // 2. Inyectar token y username en localStorage
    await page.evaluate(({ token, user }) => {
      const wrap = (data: unknown) =>
        JSON.stringify({ data, version: 1, updated: Date.now() });
      localStorage.setItem('notes.gh-token', wrap(token));
      localStorage.setItem('notes.gh-user', wrap(user));
    }, { token: FAKE_TOKEN, user: FAKE_USER });

    // 3. Recargar para que la app lea el token
    await page.reload();

    await use(page);
  },
});
```

**Ficheros:** nuevo `e2e/fixtures.ts`

### Fase 2: Mock de GitHub API

Interceptar las llamadas a GitHub API para que los tests no dependan de red ni de un token real.

```ts
// e2e/mocks/github-api.ts

// Datos de prueba
const TEST_NOTES = [
  { id: 'note-1', title: 'Test Note', group: 'tests', content: '// tests/note-1.js\nHello' },
  { id: 'note-2', title: 'Another', group: null, content: '# another.md\nWorld' },
];

export async function mockGithubApi(page: Page) {
  // Mock GraphQL (lectura de ficheros del repo)
  await page.route('https://api.github.com/graphql', async (route, request) => {
    const body = JSON.parse(request.postData() || '{}');
    // Inspeccionar la query GraphQL y devolver datos mock
    // ...
    await route.fulfill({ status: 200, json: { data: { /* ... */ } } });
  });

  // Mock REST (commits, crear ficheros, etc)
  await page.route('https://api.github.com/repos/**', async (route, request) => {
    if (request.method() === 'GET') {
      // Devolver contenido mock
      await route.fulfill({ status: 200, json: { /* ... */ } });
    } else if (request.method() === 'PUT') {
      // Simular escritura exitosa
      await route.fulfill({ status: 200, json: { content: { sha: 'fake-sha' } } });
    }
  });
}
```

**Alternativa más simple**: interceptar a nivel de `http.ts` (el wrapper de fetch interno) en vez de mock por ruta de GitHub. Depende de cuánto detalle necesiten los tests.

**Ficheros:** nuevo `e2e/mocks/github-api.ts`

### Fase 3: Tests de funcionalidad core

Tests que verifican la funcionalidad básica de la app con API mockeada:

| Spec | Tests |
|---|---|
| `sidebar.spec.ts` | Lista de notas se muestra, filtro funciona, grupos colapsan |
| `editor.spec.ts` | Abrir nota, editar, auto-save se dispara, syntax highlighting correcto |
| `create-note.spec.ts` | Crear nota nueva, aparece en sidebar, contenido editable |
| `delete-note.spec.ts` | Eliminar nota, desaparece de sidebar |
| `settings.spec.ts` | Abrir settings, editar JSON, se guarda |
| `favorites.spec.ts` | Marcar/desmarcar favorito, favoritos aparecen arriba |
| `keyboard.spec.ts` | Ctrl+S guarda, Cmd+N crea nota, toggle sidebar |
| `mobile.spec.ts` | Layout móvil, navegación entre sidebar y editor |

**Ficheros:** nuevos specs en `e2e/`

### Fase 4: Tests de offline

Tests específicos del modo offline, usando `page.route()` para bloquear red y `page.context().setOffline()`:

```ts
test('editar nota offline guarda en IndexedDB', async ({ authenticatedPage: page }) => {
  // 1. Cargar app con datos mock
  await mockGithubApi(page);
  await page.goto('/');
  await page.waitForSelector('[data-testid="notes-list"]');

  // 2. Cortar conexión
  await page.context().setOffline(true);

  // 3. Editar nota
  await page.click('text=Test Note');
  // ... editar en Monaco ...

  // 4. Verificar que el indicador muestra "offline"
  await expect(page.locator('[data-testid="sync-indicator"]'))
    .toHaveAttribute('title', /Sin conexión/);

  // 5. Restaurar conexión
  await page.context().setOffline(false);

  // 6. Verificar que se sincroniza
  await expect(page.locator('[data-testid="sync-indicator"]'))
    .toHaveAttribute('title', /Sincronizado/);
});
```

| Spec | Tests |
|---|---|
| `offline.spec.ts` | Editar offline, indicador de estado, sync al reconectar |
| `outbox.spec.ts` | Cola de comandos persiste, se vacía al reconectar, orden FIFO |
| `conflict.spec.ts` | Edición offline + cambio remoto → detección de conflicto |
| `multi-tab.spec.ts` | Cambios en una pestaña aparecen en otra via BroadcastChannel |

**Ficheros:** nuevos specs en `e2e/`

### Fase 5: Playwright config

```ts
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:5173',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1920, height: 1080 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
```

**Fichero:** actualizar `playwright.config.ts`

### Orden de implementación

| Paso | Descripción | Dependencia |
|---|---|---|
| 1 | Fixture de auth + mock básico de GitHub API | Ninguna |
| 2 | Config de Playwright (projects, webServer) | Ninguna |
| 3 | Tests de sidebar + editor (funcionalidad core) | Paso 1-2 |
| 4 | Tests de offline (requiere indicador de sync — Fase 4 de §8) | §8 Fase 4 |
| 5 | Tests de outbox + conflict + multi-tab | §8 Fases 1-6 |

### Nota sobre el approach `/halt`

La app ya tiene una ruta especial `/#/halt` que detiene el flujo de auth sin redirigir. Esto es clave para el fixture: navegar primero a `/halt`, inyectar localStorage, y luego recargar. Sin `/halt`, la app redirige a GitHub antes de que podamos tocar localStorage.
