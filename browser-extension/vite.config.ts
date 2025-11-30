import path from 'node:path'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import manifest from './manifest.config.js'
import { name, version } from './package.json'
import { loadProjectEnv } from '../configs/loadProjectEnv.mjs'

export default defineConfig(() => {
  const projectEnv = loadProjectEnv()
  const runtimeConfig = {
    serverOrigin: projectEnv.api.origin,
    supabase: {
      url: projectEnv.supabase.url,
      anonKey: projectEnv.supabase.anonKey,
      redirectTo: projectEnv.supabase.redirectExtension || undefined,
    },
  }

  if (!runtimeConfig.serverOrigin || !runtimeConfig.supabase.url) {
    console.warn(
      `Missing runtime config from ${projectEnv.file}. Using available values.`,
    )
  }

  return {
    resolve: {
      alias: {
        '@': `${path.resolve(__dirname, 'src')}`,
        '@public': `${path.resolve(__dirname, 'public')}`,
      },
    },
    plugins: [
      react(),
      crx({ manifest }),
      zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
    ],
    server: {
      cors: {
        origin: [
          /chrome-extension:\/\//,
        ],
      },
    },
    define: {
      __APP_CONFIG__: JSON.stringify(runtimeConfig),
    },
  }
})
