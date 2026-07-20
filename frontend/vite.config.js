import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isDocker = process.env.CI === 'true';

export default defineConfig({
  plugins: [react()],

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    port: 5173,
    strictPort: isDocker,
    host: isDocker ? '0.0.0.0' : 'localhost',
    open: !isDocker,
    watch: isDocker ? {
      usePolling: true,
      interval: 1000
    } : undefined
  }
})


