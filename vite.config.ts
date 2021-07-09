// import reactRefresh from '@vitejs/plugin-react-refresh';
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
  ],
  server: {
    port: 1234,
  },
});
