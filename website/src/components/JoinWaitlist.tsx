import type { FormEvent } from "react";
import { useState } from "react";
import { Mail } from "lucide-react";

const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSf6N970iBjLFHFeLDLhr3nJgKqWZSztKVs4gN1_o3yrRVPJWg/formResponse";
const EMAIL_FIELD_NAME = "entry.1611704284";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function JoinWaitlist() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "submitting") return;

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    setSubmitState("submitting");

    fetch(GOOGLE_FORM_ACTION, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    })
      .then(() => {
        formElement.reset();
        setSubmitState("success");
      })
      .catch(() => setSubmitState("error"));
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-3xl border border-white/20 bg-white/10 px-6 py-6 text-white shadow-2xl shadow-purple-900/20 backdrop-blur">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-200">
              Chrome + Mobile beta
            </p>
            <h3 className="text-2xl font-semibold">
              Join the LeetStack waitlist
            </h3>
          </div>
          {submitState === "success" && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              ✅ You&rsquo;re in!
            </span>
          )}
        </div>
        <p className="text-sm text-slate-200">
          Drop your email to get early access to the AI-powered Chrome extension
          and iOS/Android drill apps. We&rsquo;ll invite waitlisters first.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2"
        >
          <label className="sr-only" htmlFor="waitlist-email">
            Email address
          </label>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm text-white">
              <Mail className="h-4 w-4" />
              <input
                id="waitlist-email"
                name={EMAIL_FIELD_NAME}
                type="email"
                required
                placeholder="you@example.com"
                className="w-full border-none bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="ml-6 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-purple-900/30 transition hover:scale-[1.02] disabled:opacity-70"
              disabled={submitState === "submitting"}
            >
              {submitState === "success"
                ? "You&rsquo;re on the list"
                : submitState === "submitting"
                ? "Submitting..."
                : "Join waitlist"}
            </button>
          </div>
        </form>
        {submitState === "error" && (
          <p className="text-sm text-rose-200">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
