// import reactRefresh from '@vitejs/plugin-react-refresh';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const manifest = JSON.parse(
  readFileSync('./src/manifest.webmanifest').toString(),
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // reactRefresh(),
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
  ],
  server: {
    port: 1234,
  },
});
