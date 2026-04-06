import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "node:path"
import { execSync } from 'node:child_process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  let gitVersion = 'dev'
  try {
    gitVersion = execSync('git rev-list --count HEAD').toString().trim()
  } catch (e) {
    console.warn('Could not get git version:', e)
  }

  const version = env.VITE_APP_VERSION || gitVersion

  return {
    base: '/dpv-ui/',
    plugins: [react()],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(version)
    },
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
  }
})
