import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,   // required for Docker volume mounts on macOS
      interval: 500,
    },
    hmr: {
      port: 5173,         // HMR websocket through the mapped port
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
