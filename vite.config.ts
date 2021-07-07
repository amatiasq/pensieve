import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import reactRefresh from '@vitejs/plugin-react-refresh';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), VitePWA()],
  server: {
    port: 1234,
  },
});
