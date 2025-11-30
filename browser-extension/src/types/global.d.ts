type ExtensionSupabaseConfig = {
  url: string
  anonKey: string
  redirectTo?: string
}

type ExtensionAppConfig = {
  serverOrigin: string
  supabase: ExtensionSupabaseConfig
}

declare const __APP_CONFIG__: ExtensionAppConfig
