import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Janus-Protocol/',
  build: {
    // Usa pasta dedicada de build para não misturar com documentação.
    outDir: 'build',
    // Limpa a pasta dedicada a cada build.
    emptyOutDir: true,
    assetsDir: 'assets'
  },
  define: {
    // Garante que as variáveis do Vite sejam sempre acessíveis
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
      process.env.VITE_GOOGLE_CLIENT_ID || ''
    ),
    'import.meta.env.VITE_LINKEDIN_CLIENT_ID': JSON.stringify(
      process.env.VITE_LINKEDIN_CLIENT_ID || ''
    )
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://janus-protocol-production.up.railway.app',
        changeOrigin: true
      }
    }
  }
});
