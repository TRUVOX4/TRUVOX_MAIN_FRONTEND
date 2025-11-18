import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      "/kgis": {
        target: "https://kgis.ksrsac.in",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/kgis/, ""),
      },
    }
  }
})
