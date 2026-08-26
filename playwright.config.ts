import { defineConfig, devices } from '@playwright/test';

// El 1234 es el puerto de siempre, pero es un puerto popular —LM Studio escucha
// ahí— y con `--strictPort` un puerto ocupado para la suite en vez de dejarla
// correr contra lo que hubiera al otro lado.
const port = Number(process.env.PENSIEVE_E2E_PORT ?? 1234);

// El de `idb-store.spec.ts`, que importa `/src/1-core/idb.ts` en el navegador:
// eso lo sirve el grafo de módulos de vite, y en el build no existe.
const sourcesPort = port + 1;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Los mocks de la suite son `page.route`, y a lo que pide el service worker
    // no llegan: con él al mando, la segunda navegación de un test iba a la API
    // de GitHub de verdad y la lista de notas volvía vacía. Bloquearlo deja el
    // build bajo prueba y las peticiones bajo control; que el worker sirva la
    // app sin red se comprueba a mano, no aquí
    // (`.agents/decisions/2026-08-24 monaco-del-cdn-o-del-bundle.md`).
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1920, height: 1080 } },
      testIgnore: 'idb-store.spec.ts',
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: 'mobile.spec.ts',
    },
    {
      name: 'sources',
      use: { baseURL: `http://localhost:${sourcesPort}` },
      testMatch: 'idb-store.spec.ts',
    },
  ],
  // Contra el build, no contra el dev server: el build es lo que se despliega, y
  // es donde el CSS muerto de emotion pasó cuatro meses sin que nadie lo viera.
  // El build va dentro del comando porque un `dist/` rancio deja la suite verde
  // contra código que ya no existe, que es justo la ceguera que esto cierra.
  //
  // Sin `reuseExistingServer`: reutilizar lo que haya en el puerto es correr
  // contra el servidor de dev cuando `amq pensieve local` está levantado.
  webServer: [
    {
      command: `bun run build && bunx vite preview --port ${port} --strictPort`,
      port,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `bunx vite --port ${sourcesPort} --strictPort`,
      port: sourcesPort,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
