import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any because the 'Process' type definition might be missing 'cwd' in this context
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [react()],
    // Critical for GitHub Pages: usually '/repo-name/' but './' works for non-routed apps
    base: './', 
    define: {
      // This allows 'process.env.API_KEY' to work in the browser by replacing it with the actual value during build
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY)
    }
  }
})