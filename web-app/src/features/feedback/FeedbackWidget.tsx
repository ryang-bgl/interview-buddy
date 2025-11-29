import { useMemo, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback, type SubmitFeedbackPayload } from "@/lib/api";

const categories: SubmitFeedbackPayload["category"][] = [
  "idea",
  "bug",
  "other",
];

const getPageUrl = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.location.href;
};

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SubmitFeedbackPayload["category"]>("idea");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const isDisabled = status === "sending";

  const buttonLabel = useMemo(() => {
    if (status === "sending") return "Sending...";
    if (status === "success") return "Sent!";
    return "Send";
  }, [status]);

  const resetForm = () => {
    setMessage("");
    setCategory("idea");
    setStatus("idle");
    setError(null);
  };

  const handleToggle = () => {
    if (isOpen) {
      resetForm();
    }
    setIsOpen((value) => !value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setError("Please share at least a few words.");
      return;
    }

    setStatus("sending");
    setError(null);
    try {
      await submitFeedback({
        message: trimmed,
        category,
        pageUrl: getPageUrl(),
      });
      setStatus("success");
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send feedback";
      setError(message);
      setStatus("error");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      {isOpen ? (
        <div className="mb-2 w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-[#0f172a]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Share feedback
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help us improve LeetStack
              </p>
            </div>
            <button
              type="button"
              aria-label="Close feedback form"
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={handleToggle}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Category
              </label>
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={category}
                disabled={isDisabled}
                onChange={(event) => setCategory(event.target.value as SubmitFeedbackPayload["category"])}
              >
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value === "idea"
                      ? "Idea / Request"
                      : value === "bug"
                        ? "Bug"
                        : "Other"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Message
              </label>
              <Textarea
                className="mt-1 min-h-[120px] rounded-2xl border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="What’s on your mind?"
                value={message}
                disabled={isDisabled}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-xs text-rose-500">{error}</p>
            ) : null}
            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full rounded-2xl"
            >
              <Send className="mr-2 h-4 w-4" /> {buttonLabel}
            </Button>
          </form>
        </div>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={handleToggle}
        aria-label="Send feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    </div>
  );
}
