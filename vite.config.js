import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/audio': {
        target: 'https://localhost:7030',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://localhost:7030',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
