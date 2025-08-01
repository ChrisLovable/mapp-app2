import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    // 🔧 FIX: Disable HTTPS for now - will use alternative approach
    proxy: {
      '/api': {
        target: 'http://192.168.101.105:3000', // Use network IP instead of localhost
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
