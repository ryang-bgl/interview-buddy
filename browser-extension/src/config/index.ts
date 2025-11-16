import devConfig from './appConfig.dev.json'
import prodConfig from './appConfig.prod.json'

type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  appId?: string
  actionCodeSettings?: {
    url: string
    handleCodeInApp?: boolean
  }
}

type AppConfig = {
  serverOrigin: string
  firebase: FirebaseConfig
}

const normalizedEnv = (import.meta.env.VITE_APP_ENV ?? '').toString().trim().toLowerCase()
const config: AppConfig = normalizedEnv === 'dev' ? devConfig : prodConfig

export default config
