import { useEffect, useMemo, useState } from "react";
import {
  createGeneralNoteJob,
  getExistingGeneralNote,
  getGeneralNoteJob,
  type GeneralNoteJobResult,
  type GeneralNoteJobStatusResponse,
} from "@/lib/api";
import { getActiveTab } from "../utils/browser";
import { captureActivePageContent } from "../utils/page";

type GenerationState = "idle" | "generating" | "success" | "error";
type CopyState = "idle" | "copied";

type StackResult =
  | (GeneralNoteJobResult & { url: string; source: "generated" | "existing" })
  | null;

export default function GeneralNotesTab() {
  const [stackResult, setStackResult] = useState<StackResult>(null);
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [latestJobStatus, setLatestJobStatus] =
    useState<GeneralNoteJobStatusResponse | null>(null);

  const isPolling = Boolean(activeJobId);
  const isGenerating =
    generationState === "generating" ||
    isPolling ||
    latestJobStatus?.status === "processing";
  const hasCards = (stackResult?.cards?.length ?? 0) > 0;

  const statusText = (() => {
    if (isPolling || latestJobStatus?.status === "processing") {
      return "AI is reading this page and drafting review cards...";
    }
    if (generationState === "generating") {
      return "Queuing AI to study this page...";
    }
    if (generationState === "error" && errorMessage) {
      return errorMessage;
    }
    if (hasCards) {
      if (stackResult?.source === "existing") {
        return "Showing your saved flashcards for this page.";
      }
      return `AI generated ${
        stackResult?.cards.length ?? 0
      } card(s) for this page.`;
    }
    return "Open any interview prep article or prompt, then let AI create review cards from it.";
  })();

  const statusTone = (() => {
    if (generationState === "error") {
      return "text-red-600";
    }
    if (isPolling || generationState === "generating") {
      return "text-blue-600";
    }
    if (hasCards) {
      return "text-emerald-600";
    }
    return "text-slate-500";
  })();

  const ankiStackText = useMemo(() => {
    if (!hasCards || !stackResult) {
      return "";
    }
    return stackResult.cards
      .map((card) => {
        const front = card.front?.trim() ?? "";
        const back = card.back?.trim() ?? "";
        const extra = card.extra?.trim();
        const safeFront = front || "Prompt";
        const safeBack = back || "Answer";
        return `${safeFront}\t${safeBack}${extra ? `\t${extra}` : ""}`;
      })
      .join("\n");
  }, [hasCards, stackResult]);

  useEffect(() => {
    let cancelled = false;

    const loadExistingNote = async () => {
      try {
        const tab = await getActiveTab();
        const tabUrl = tab?.url?.trim();
        if (!tabUrl) {
          return;
        }
        const existing = await getExistingGeneralNote(tabUrl);
        if (cancelled || !existing) {
          return;
        }
        setStackResult({
          noteId: existing.noteId,
          topic: existing.topic,
          summary: existing.summary,
          cards: existing.cards,
          url: existing.url,
          source: "existing",
        });
        setGenerationState("success");
      } catch (error) {
        if (!cancelled) {
          console.warn("[leetstack] Failed to load existing note", error);
        }
      }
    };

    void loadExistingNote();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = async () => {
    setGenerationState("generating");
    setErrorMessage(null);
    setCopyState("idle");
    setStackResult(null);
    setLatestJobStatus(null);
    setActiveJobId(null);

    try {
      const tab = await getActiveTab();
      const tabId = tab?.id;
      const tabUrl = tab?.url?.trim();
      if (!tabId || !tabUrl) {
        throw new Error("Open the page you want to convert before generating.");
      }

      const snapshot = await captureActivePageContent(tabId);
      const payload = snapshot?.text?.trim();
      if (!payload) {
        throw new Error(
          "Couldn't read the current page. Refresh it and try again."
        );
      }

      const job = await createGeneralNoteJob({
        url: tabUrl,
        payload,
        topic: snapshot?.title ?? tab.title ?? null,
      });
      setActiveJobId(job.jobId);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to generate review cards";
      setErrorMessage(message);
      setGenerationState("error");
    }
  };

  useEffect(() => {
    if (!activeJobId) {
      return undefined;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const status = await getGeneralNoteJob(activeJobId);
        if (cancelled) {
          return;
        }
        setLatestJobStatus(status);

        if (status.status === "completed" && status.result) {
          setStackResult({
            ...status.result,
            url: status.url,
            source: "generated",
          });
          setGenerationState("success");
          setActiveJobId(null);
        } else if (status.status === "failed") {
          setErrorMessage(
            status.errorMessage ?? "Failed to generate review cards"
          );
          setGenerationState("error");
          setActiveJobId(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.warn("[leetstack] Failed to poll general note job", error);
        setErrorMessage("Unable to check job status");
        setGenerationState("error");
        setActiveJobId(null);
      }
    };

    void poll();
    const intervalId = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeJobId]);

  const handleCopyStack = async () => {
    if (!ankiStackText) {
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setErrorMessage(
        "Clipboard access is unavailable in this browser context."
      );
      setGenerationState("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(ankiStackText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch (error) {
      console.warn("[leetstack] Failed to copy generated stack", error);
      setErrorMessage("Unable to copy stack to clipboard");
      setGenerationState("error");
    }
  };

  return (
    <div className="space-y-6">
      {!stackResult && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-900">
            <p>
              Capture the active tab's content—system design writeups,
              behavioural prompts, anything—and let AI turn it into Anki-style
              review cards.
            </p>
            <p className="mt-2 text-xs text-purple-700">
              Tip: load the page you want to study first, then tap the button
              below.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-sm ${statusTone}`}>{statusText}</span>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:shadow-xl hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGenerating ? "Generating..." : "AI generates review cards"}
            </button>
          </div>
        </section>
      )}
      {stackResult ? (
        <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Flashcards Generated
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {stackResult.topic ?? "General note"}
              </h2>
              <p className="text-xs text-slate-400">
                {stackResult.source === "existing"
                  ? "Loaded from your saved flashcards"
                  : "Newly generated by AI"}
              </p>
              {stackResult.url ? (
                <a
                  href={stackResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline-offset-2 hover:underline"
                >
                  {stackResult.url}
                </a>
              ) : null}
              <p className="text-xs text-slate-400">
                {hasCards
                  ? `${stackResult.cards.length} card${
                      stackResult.cards.length === 1 ? "" : "s"
                    }`
                  : "No cards returned"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyStack}
              disabled={!hasCards}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copyState === "copied" ? "Copied" : "Copy stack"}
            </button>
          </div>

          {hasCards ? (
            <ul className="space-y-3">
              {stackResult.cards.map((card, index) => (
                <li
                  key={`${card.id ?? card.front ?? "card"}-${index}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Card {index + 1}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {card.front || "Prompt"}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {card.back || "Answer"}
                  </p>
                  {card.extra ? (
                    <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
                      {card.extra}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              AI responded but did not return any individual cards.
            </p>
          )}

          {ankiStackText ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tab-delimited text for Anki import
              </p>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-700">
                {ankiStackText}
              </pre>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
