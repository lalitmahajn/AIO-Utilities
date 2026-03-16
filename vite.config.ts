import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/AIO-Utilities/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdf-lib') || id.includes('pdf-decrypt')) {
            return 'pdf-vendor';
          }
          if (id.includes('qrcode')) {
            return 'qr-vendor';
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }
        }
      }
    }
  }
})
