import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/', // ✅ Isse routes aur assets ka path absolute ho jayega
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Dev ke liye local hi rakhein
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
})