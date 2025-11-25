import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { UserPrincipal } from "@/lib/api";
import LoadingScreen from "./LoadingScreen";
import {
  clearPendingAuthEmail,
  readPendingAuthEmail,
  storePendingAuthEmail,
} from "../utils/storage";
import { buildPrincipalFromSupabase } from "../utils/auth";

interface AuthPromptProps {
  onAuthenticated: (user: UserPrincipal) => void;
}

type AuthViewState =
  | "checking"
  | "enterEmail"
  | "awaitingOtp"
  | "authenticated";

export default function AuthPrompt({ onAuthenticated }: AuthPromptProps) {
  const [viewState, setViewState] = useState<AuthViewState>("checking");
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendCode, setIsResendCode] = useState(false);
  const [principal, setPrincipal] = useState<UserPrincipal | null>(null);

  useEffect(() => {
    if (viewState === "checking" || viewState === "authenticated") {
      buildPrincipalFromSupabase().then((p) => {
        if (p) {
          clearPendingAuthEmail().then(() => {
            setPrincipal(p);
          });
        } else {
          readPendingAuthEmail().then((e) => {
            if (e) {
              setViewState("awaitingOtp");
              setEmailInput(e);
            } else {
              setViewState("enterEmail");
            }
          });
        }
      });
    }
  }, [viewState]);

  useEffect(() => {
    if (principal) {
      onAuthenticated(principal);
    }
  }, [principal]);

  const handleSendOtp = useCallback(async () => {
    const email = emailInput.trim();
    if (!email) {
      setErrorMessage("Email is required");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      setOtpInput("");
      setViewState("awaitingOtp");
      storePendingAuthEmail(email);
    } catch (error) {
      console.warn("[leetstack] Failed to send OTP", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to send code";
      setErrorMessage(message);
      setViewState("enterEmail");
    } finally {
      setIsSubmitting(false);
    }
  }, [emailInput]);

  const handleVerifyOtp = useCallback(async () => {
    const email = emailInput.trim();
    const token = otpInput.trim();
    if (!email) {
      setErrorMessage("Enter the email where you received the code");
      return;
    }
    if (!token) {
      setErrorMessage("Enter the 6-digit code from your email");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await supabase.auth.verifyOtp({ email, token, type: "email" });
      setOtpInput("");
      setViewState("authenticated");
    } catch (error) {
      console.warn("[leetstack] Failed to verify OTP", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Invalid or expired code";
      setErrorMessage(message);
      setViewState("awaitingOtp");
    } finally {
      setIsSubmitting(false);
    }
  }, [emailInput, otpInput]);

  const handleResetPending = useCallback(async () => {
    await clearPendingAuthEmail();
    setEmailInput("");
    setOtpInput("");
    setErrorMessage(null);
    setViewState("enterEmail");
  }, []);

  if (viewState === "checking") {
    return <LoadingScreen message="Logging in..." />;
  }

  const buttonLabel = isSubmitting ? "Sending code..." : "Send login code";
  const finalizeLabel = isResendCode
    ? "Verify code"
    : isSubmitting
    ? "Verifying…"
    : "Verify code";
  const isAwaitingOtp = viewState === "awaitingOtp";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-[420px] max-w-full rounded-3xl bg-white p-8 shadow-dialog">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">
            Connect LeetStack
          </h1>
          <p className="text-sm text-slate-500">
            We'll email you a secure sign-in link—no passwords required.
          </p>
        </header>
        <div className="mt-6 space-y-4">
          {errorMessage ? (
            <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {errorMessage}
            </p>
          ) : null}

          {!isAwaitingOtp ? (
            <div className="space-y-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Work Email
                </span>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                  autoFocus
                />
              </label>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSubmitting || !emailInput.trim()}
                className="w-full rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {buttonLabel}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Check your email</p>
                <p className="mt-1 text-sm text-slate-500">
                  We've sent an 8 digits code to <strong>{emailInput}</strong>.
                </p>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Enter code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpInput}
                  onChange={(event) => setOtpInput(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="12345678"
                  maxLength={8}
                  autoFocus
                />
              </label>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isSubmitting || otpInput.trim().length !== 8}
                className="w-full rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {finalizeLabel}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsResendCode(true);
                    handleSendOtp().finally(() => {
                      setIsResendCode(false);
                    });
                  }}
                  disabled={isSubmitting}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {isResendCode ? "Resending..." : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={handleResetPending}
                  className="text-xs font-semibold text-slate-500 underline underline-offset-4 transition hover:text-slate-700"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
