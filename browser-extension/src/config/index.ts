import devConfig from './appConfig.dev.json'
import prodConfig from './appConfig.prod.json'

type SupabaseConfig = {
  url: string
  anonKey: string
  redirectTo?: string
}

type AppConfig = {
  serverOrigin: string
  supabase: SupabaseConfig
}

const normalizedEnv = (import.meta.env.VITE_APP_ENV ?? '').toString().trim().toLowerCase()
const config: AppConfig = normalizedEnv === 'dev' ? devConfig : prodConfig

export default config
