import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User as SupabaseAuthUser } from "@supabase/supabase-js";

import { getSupabaseClient, getSupabaseRedirectUrl } from "@/config/supabase";
import { apiClient } from "@/services/api";

const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || "development";
const mockAuthOverride = false; //process.env.EXPO_PUBLIC_USE_MOCK_AUTH;
const USE_MOCK_AUTH = false; //mockAuthOverride
// ? mockAuthOverride === "true"
// : environment !== "production";

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

const MOCK_USER: User = {
  id: "mock-user-1",
  username: "mock.dev",
  email: "mock.dev@example.com",
  displayName: "Mock Developer",
};

const MOCK_TOKEN = "mock-token";

export interface AuthState {
  user: User | null;
  supabaseSession: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  emailForSignIn: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<boolean>;
  sendMagicLink: (email: string) => Promise<boolean>;
  completeMagicLinkSignIn: (email: string, token: string) => Promise<boolean>;
  checkForMagicLink: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  setEmailForSignIn: (email: string | null) => void;
  initialize: () => void;
}

const mapSupabaseUser = (supabaseUser: SupabaseAuthUser): User => {
  const metadata = supabaseUser.user_metadata || {};
  const displayName: string | undefined =
    metadata.full_name || metadata.display_name;
  const username = displayName || supabaseUser.email?.split("@")[0] || "User";

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    username,
    displayName: displayName || supabaseUser.email || undefined,
    photoURL: metadata.avatar_url || undefined,
  };
};

let authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      supabaseSession: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      emailForSignIn: null,

      initialize: async () => {
        if (get().isInitialized) return;

        if (USE_MOCK_AUTH) {
          apiClient.setAuthToken(MOCK_TOKEN);
          set({
            user: MOCK_USER,
            supabaseSession: null,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            emailForSignIn: null,
            error: null,
          });
          return;
        }

        set({ isLoading: true });

        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }

          if (data.session?.access_token) {
            await handleSupabaseSession(data.session, set);
          } else {
            apiClient.clearAuthToken();
            set({
              user: null,
              supabaseSession: null,
              isAuthenticated: false,
            });
          }

          if (!authSubscription) {
            const { data: listener } = supabase.auth.onAuthStateChange(
              (_event, session) => {
                if (session) {
                  handleSupabaseSession(session, set);
                } else {
                  apiClient.clearAuthToken();
                  set({
                    user: null,
                    supabaseSession: null,
                    isAuthenticated: false,
                  });
                }
              }
            );
            authSubscription = listener.subscription;
          }

          set({ isInitialized: true, isLoading: false });
        } catch (error: any) {
          console.error("Failed to initialize auth", error);
          set({
            isInitialized: true,
            isLoading: false,
            error: "Authentication unavailable. Check Supabase config.",
          });
        }
      },

      login: async (email: string, password: string) => {
        if (USE_MOCK_AUTH) {
          apiClient.setAuthToken(MOCK_TOKEN);
          set({
            user: {
              ...MOCK_USER,
              email: email || MOCK_USER.email,
              username: email.split("@")[0] || MOCK_USER.username,
            },
            supabaseSession: null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        }

        set({ isLoading: true, error: null });

        try {
          const supabase = getSupabaseClient();
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            throw error;
          }

          set({ isLoading: false });
          return true;
        } catch (error: any) {
          let errorMessage = "Login failed";
          if (error?.message?.includes("Invalid login")) {
            errorMessage = "Invalid email or password";
          } else if (error?.message?.includes("Email not confirmed")) {
            errorMessage = "Please confirm your email before signing in";
          } else if (error?.message) {
            errorMessage = error.message;
          }

          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      register: async (
        email: string,
        password: string,
        displayName?: string
      ) => {
        if (USE_MOCK_AUTH) {
          apiClient.setAuthToken(MOCK_TOKEN);
          set({
            user: {
              ...MOCK_USER,
              email,
              displayName: displayName || MOCK_USER.displayName,
              username:
                displayName || email.split("@")[0] || MOCK_USER.username,
            },
            supabaseSession: null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        }

        set({ isLoading: true, error: null });

        try {
          const supabase = getSupabaseClient();
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName,
              },
            },
          });

          if (error) {
            throw error;
          }

          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error: any) {
          let errorMessage = "Registration failed";

          if (error?.message?.includes("already registered")) {
            errorMessage = "An account with this email already exists";
          } else if (error?.message) {
            errorMessage = error.message;
          }

          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      sendMagicLink: async (email: string) => {
        if (USE_MOCK_AUTH) {
          set({
            emailForSignIn: email,
            isLoading: false,
            error: null,
          });
          return true;
        }

        set({ isLoading: true, error: null });

        try {
          const supabase = getSupabaseClient();
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
            },
          });

          if (error) {
            throw error;
          }

          set({
            emailForSignIn: email,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error: any) {
          let errorMessage = "Failed to send login link";

          if (error?.message?.toLowerCase().includes("rate limit")) {
            errorMessage = "Too many requests. Please try again later";
          } else if (error?.message) {
            errorMessage = error.message;
          }

          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      completeMagicLinkSignIn: async (email: string, token: string) => {
        if (USE_MOCK_AUTH) {
          apiClient.setAuthToken(MOCK_TOKEN);
          set({
            user: {
              ...MOCK_USER,
              email,
            },
            supabaseSession: null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            emailForSignIn: null,
          });
          return true;
        }

        set({ isLoading: true, error: null });

        try {
          const supabase = getSupabaseClient();
          const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "email",
          });

          if (error) {
            throw error;
          }

          set({
            isLoading: false,
            emailForSignIn: null,
            error: null,
          });
          return true;
        } catch (error: any) {
          let errorMessage = "Failed to complete sign-in";

          if (error?.message?.toLowerCase().includes("expired")) {
            errorMessage = "The code has expired. Request a new one";
          } else if (error?.message?.toLowerCase().includes("invalid")) {
            errorMessage = "Invalid verification code";
          } else if (error?.message) {
            errorMessage = error.message;
          }

          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      checkForMagicLink: async () => {
        if (USE_MOCK_AUTH) {
          return false;
        }

        return false;
      },

      logout: async () => {
        if (USE_MOCK_AUTH) {
          apiClient.clearAuthToken();
          set({
            user: null,
            supabaseSession: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true });

        try {
          const supabase = getSupabaseClient();
          await supabase.auth.signOut();
          apiClient.clearAuthToken();
          set({
            user: null,
            supabaseSession: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error("Logout error:", error);
          set({
            isLoading: false,
            error: "Logout failed",
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setEmailForSignIn: (email: string | null) => {
        set({ emailForSignIn: email });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        emailForSignIn: state.emailForSignIn,
      }),
    }
  )
);

async function handleSupabaseSession(
  session: Session,
  set: (partial: Partial<AuthState>) => void
) {
  const supabaseUser = session.user;
  if (!supabaseUser) {
    return;
  }

  const mappedUser = mapSupabaseUser(supabaseUser);
  apiClient.setAuthToken(session.access_token);

  set({
    user: mappedUser,
    supabaseSession: session,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
}
