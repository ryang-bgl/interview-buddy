import { createClient } from '@supabase/supabase-js'
import config from '@/config'

const url = config.supabase.url
const anonKey = config.supabase.anonKey

if (!url || !anonKey) {
  throw new Error('Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
