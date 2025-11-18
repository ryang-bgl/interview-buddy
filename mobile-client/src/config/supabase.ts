import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase environment variables are not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabase;
}

export function getSupabaseRedirectUrl(path: string = ""): string {
  return "";
  const scheme = process.env.EXPO_PUBLIC_DEEP_LINK_SCHEME || "leetcodereviewer";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // expo-linking is not available outside components, so we create the URL manually
  return `${scheme}://${normalizedPath.replace(/^\//, "")}`;
}
