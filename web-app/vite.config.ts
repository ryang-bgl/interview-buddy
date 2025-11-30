import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { loadProjectEnv } from '../configs/loadProjectEnv.mjs'

// https://vite.dev/config/
export default defineConfig(() => {
  const projectEnv = loadProjectEnv()
  const runtimeConfig = {
    serverOrigin: projectEnv.api.origin,
    supabase: {
      url: projectEnv.supabase.url,
      anonKey: projectEnv.supabase.anonKey,
    },
  }

  if (!runtimeConfig.serverOrigin || !runtimeConfig.supabase.url) {
    console.warn(
      `Missing runtime config from ${projectEnv.file}. Using available values.`,
    )
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      __APP_CONFIG__: JSON.stringify(runtimeConfig),
    },
  }
})
