import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "node:path"

// https://vite.dev/config/
export default defineConfig({
  base: '/dpv-ui/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-slot', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
})
