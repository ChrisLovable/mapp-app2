import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    // HTTPS disabled for easier development - clipboard will use fallback method
    proxy: {
      '/api': {
        target: 'http://192.168.101.105:3000', // Use network IP instead of localhost
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
