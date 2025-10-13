import devConfig from './appConfig.dev.json'
import prodConfig from './appConfig.prod.json'

type AppConfig = {
  serverOrigin: string
}

const normalizedEnv = (import.meta.env.VITE_APP_ENV ?? '').toString().trim().toLowerCase()
const config: AppConfig = normalizedEnv === 'dev' ? devConfig : prodConfig

export default config
