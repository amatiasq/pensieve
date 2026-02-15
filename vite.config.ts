import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const manifest = JSON.parse(
  readFileSync('./src/manifest.webmanifest').toString(),
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePWA({
      strategies: 'generateSW',
      manifest,
      workbox: {
        importScripts: ['/sw-background-sync.js'],
        maximumFileSizeToCacheInBytes: 5 * 1024 ** 2, // 5MB
        navigateFallback: 'index.html',
        runtimeCaching: [
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
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    visualizer({
      filename: 'dist/stats.html',
    }),
  ],
  server: {
    port: 1234,
  },
});
