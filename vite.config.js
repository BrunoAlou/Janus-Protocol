import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Janus-Protocol/',
  server: {
    proxy: {
      '/api': {
        target: 'https://janus-protocol-production.up.railway.app',
        changeOrigin: true
      }
    }
  }
});
