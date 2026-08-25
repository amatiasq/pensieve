import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const manifest = JSON.parse(
  readFileSync('./src/manifest.webmanifest').toString(),
);

// Monaco no entra en el bundle, se baja del CDN; su versión es la de la
// dependencia de desarrollo, la misma de la que salen los tipos.
const monacoVersion = JSON.parse(
  readFileSync('./node_modules/monaco-editor/package.json').toString(),
).version;

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __MONACO_VERSION__: JSON.stringify(monacoVersion),
  },
  plugins: [
    VitePWA({
      strategies: 'generateSW',
      manifest,
      workbox: {
        importScripts: ['/sw-background-sync.js'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Monaco no va en el bundle: se baja del CDN, y sin esto el editor
            // no abriría sin red. La URL lleva la versión, así que subirla
            // estrena entrada y la vieja caduca sola.
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@/,
            handler: 'CacheFirst',
            method: 'GET',
            options: {
              cacheName: 'monaco-cdn',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache GitHub API responses (GET only) for offline support
            urlPattern: /^https:\/\/api\.github\.com\//,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'github-api',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
              },
              cacheableResponse: { statuses: [0, 200] },
              matchOptions: { ignoreSearch: true },
            },
          },
        ],
      },
    }),
    react({
      jsxImportSource: '@emotion/react',
    }),
    visualizer({
      filename: 'dist/stats.html',
    }),
  ],
  server: {
    port: 1234,
    // Mismo origen que en producción: en el servidor lo hace el nginx, aquí
    // este proxy. La API la levanta `amq pensieve local` en el 8080.
    proxy: {
      '/auth': 'http://localhost:8080',
      '/commit': 'http://localhost:8080',
      '/tarball': 'http://localhost:8080',
    },
  },
});
