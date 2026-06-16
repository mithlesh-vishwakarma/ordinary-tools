import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables. Empty prefix parameter lets us load NEXT_PUBLIC_ values.
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.NEXT_PUBLIC_API_URL || env.VITE_API_URL || '';

  return {
    plugins: [react()],
    define: {
      'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(apiUrl),
    },
    server: {
      proxy: {
        '/api': {
          target: apiUrl || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})

