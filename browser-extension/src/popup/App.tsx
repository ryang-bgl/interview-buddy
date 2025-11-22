import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { UserPrincipal } from "@/lib/api";
import AuthPrompt from "./components/AuthPrompt";
import MainContent from "./components/MainContent";
import { clearPendingAuthEmail } from "./utils/storage";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserPrincipal | null>(null);

  const handleAuthenticated = useCallback((principal: UserPrincipal) => {
    setCurrentUser(principal);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("[leetstack] Failed to sign out", error);
    } finally {
      await clearPendingAuthEmail();
      setCurrentUser(null);
    }
  }, []);

  if (currentUser) {
    return <MainContent user={currentUser} onSignOut={handleSignOut} />;
  }

  return <AuthPrompt onAuthenticated={handleAuthenticated} />;
}
