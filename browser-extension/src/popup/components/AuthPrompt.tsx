interface AuthPromptProps {
  mode: "enterEmail" | "awaitingOtp";
  emailValue: string;
  pendingEmail?: string | null;
  otpValue: string;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onEmailChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onResetPending: () => void;
}

export default function AuthPrompt({
  mode,
  emailValue,
  pendingEmail,
  otpValue,
  isSubmitting,
  errorMessage,
  onEmailChange,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
  onResetPending,
}: AuthPromptProps) {
  const buttonLabel = isSubmitting ? "Sending code..." : "Send login code";
  const finalizeLabel = isSubmitting ? "Verifying…" : "Verify code";

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

          {mode === "enterEmail" ? (
            <div className="space-y-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Work Email
                </span>
                <input
                  type="email"
                  value={emailValue}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                  autoFocus
                />
              </label>
              <button
                type="button"
                onClick={onSendOtp}
                disabled={isSubmitting || !emailValue.trim()}
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
                  We've sent a 8-digit code to <strong>{pendingEmail}</strong>.
                </p>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Enter code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpValue}
                  onChange={(event) => onOtpChange(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="12345678"
                  maxLength={8}
                  autoFocus
                />
              </label>
              <button
                type="button"
                onClick={onVerifyOtp}
                disabled={isSubmitting || otpValue.trim().length !== 8}
                className="w-full rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {finalizeLabel}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={onSendOtp}
                  disabled={isSubmitting}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={onResetPending}
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
