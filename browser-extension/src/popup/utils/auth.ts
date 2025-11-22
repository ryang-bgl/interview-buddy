import { supabase } from "@/lib/supabaseClient";
import { UserPrincipal } from "@/lib/api";

export async function buildPrincipalFromSupabase() {
  try {
    const { data } = await supabase.auth.getUser();
    const supaUser = data.user;
    if (!supaUser) {
      return null;
    }

    return {
      id: supaUser.id,
      email: supaUser.email ?? null,
      firstName:
        (supaUser.user_metadata?.first_name as string | undefined) ?? null,
      lastName:
        (supaUser.user_metadata?.last_name as string | undefined) ?? null,
      leetstackUsername:
        (supaUser.user_metadata?.username as string | undefined) ?? null,
      createdDate: supaUser.created_at ?? null,
      lastUpdatedDate: supaUser.last_sign_in_at ?? null,
    } satisfies UserPrincipal;
  } catch (e) {
    console.error("==failed to find principal", e);
    return null;
  }
}
