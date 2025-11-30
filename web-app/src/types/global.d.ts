type WebSupabaseConfig = {
  url: string
  anonKey: string
}

type WebAppConfig = {
  serverOrigin: string
  supabase: WebSupabaseConfig
}

declare const __APP_CONFIG__: WebAppConfig
