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
        importScripts: [],
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
