import { FormEvent, useEffect, useState } from "react";
import {
  createGeneralNoteJob,
  getGeneralNoteJob,
  getExistingGeneralNote,
  addGeneralNoteCard,
  deleteGeneralNoteCard,
} from "@/lib/api";
import { getActiveTab } from "../utils/browser";
import {
  captureActivePageContent,
  captureActivePageHtml,
  selectPageElementContent,
} from "../utils/page";
import TurndownService from "turndown";
import { TaskStatus } from "../../../../shared-types/TaskStatus";

type StackResult = {
  noteId: string | null;
  topic: string | null;
  summary: string | null;
  cards: {
    id?: string | null;
    front: string;
    back: string;
    extra?: string | null;
  }[];
  url: string;
  source: "generated" | "existing";
} | null;

export default function GeneralNotesTab() {
  const [stackResult, setStackResult] = useState<StackResult>(null);
  const [generationState, setGenerationState] = useState<TaskStatus | "idle" | "loading" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedCardsCount, setGeneratedCardsCount] = useState<number>(0);
  const [cardDraft, setCardDraft] = useState({
    front: "",
    back: "",
    extra: "",
  });
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [activeInsertSlot, setActiveInsertSlot] = useState<string | null>(null);
  const [activeInsertAfterId, setActiveInsertAfterId] = useState<string | null>(
    null
  );
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [selectedSource, setSelectedSource] = useState<{
    url: string;
    title: string | null;
    text: string;
    html?: string | null;
    markdown?: string | null;
  } | null>(null);
  const [isSelectingContent, setIsSelectingContent] = useState(false);

  const START_SLOT_ID = "__start__";

  const isGenerating = generationState === "processing";
  const cardsCount = stackResult?.cards?.length ?? 0;
  const hasCards = cardsCount > 0;
  const canEditCards = Boolean(stackResult?.noteId);

  useEffect(() => {
    let cancelled = false;

    const loadExistingNote = async () => {
      setIsLoadingExisting(true);
      try {
        const tab = await getActiveTab();
        const tabUrl = tab?.url?.trim();
        if (!tabUrl) {
          setIsLoadingExisting(false);
          return;
        }
        const existing = await getExistingGeneralNote(tabUrl);
        if (cancelled || !existing) {
          setIsLoadingExisting(false);
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
        setGenerationState("completed");
      } catch (error) {
        if (!cancelled) {
          console.warn("[leetstack] Failed to load existing note", error);
        }
      } finally {
        setIsLoadingExisting(false);
      }
    };

    void loadExistingNote();

    return () => {
      cancelled = true;
    };
  }, []);

  // Extract topic from markdown headings
  const extractTopicFromMarkdown = (markdown: string): string | null => {
    // Find first # or ## heading and extract the topic
    // Using exec is more efficient as it stops at first match
    const lines = markdown.split('\n');
    for (const line of lines) {
      const headingMatch = line.match(/^#{1,2}\s+(.+)$/);
      if (headingMatch) {
        return headingMatch[1].trim();
      }
    }
    return null;
  };

  const handleGenerate = async () => {
    setGenerationState("processing");
    setErrorMessage(null);
    setStackResult(null);
    setGeneratedCardsCount(0);
    try {
      const tab = await getActiveTab();
      const tabId = tab?.id;
      const tabUrl = tab?.url?.trim();
      if (!tabId || !tabUrl) {
        throw new Error("Open the page you want to convert before generating.");
      }

      let selectionToUse = selectedSource;
      if (selectionToUse && selectionToUse.url !== tabUrl) {
        selectionToUse = null;
        setSelectedSource(null);
      }

      const snapshot = await captureActivePageContent(tabId);

      // Use markdown if available from selected element, otherwise try to convert page HTML to markdown
      let payload: string;
      if (selectionToUse?.markdown) {
        // Use markdown from selected element
        payload = selectionToUse.markdown.trim();
      } else if (selectionToUse?.html) {
        // Convert selected element HTML to markdown if not already converted
        try {
          const turndown = new TurndownService({
            headingStyle: "atx", // Use # for headings instead of underlines
          });
          payload = turndown.turndown(selectionToUse.html).trim();
        } catch (error) {
          console.warn(
            "[leetstack] Failed to convert selected HTML to markdown, falling back to text",
            error
          );
          payload = selectionToUse.text.trim();
        }
      } else {
        // Try to get page HTML, extract body, and convert to markdown
        try {
          const pageHtmlSnapshot = await captureActivePageHtml(tabId);
          if (pageHtmlSnapshot?.html) {
            // Extract only the body content
            const bodyMatch = pageHtmlSnapshot.html.match(
              /<body[^>]*>([\s\S]*?)<\/body>/i
            );
            const bodyContent = bodyMatch
              ? bodyMatch[1]
              : pageHtmlSnapshot.html;

            const turndown = new TurndownService({
              headingStyle: "atx", // Use # for headings instead of underlines
            });
            const pageMarkdown = turndown.turndown(bodyContent);
            payload = pageMarkdown.trim();
          } else {
            // Fallback to page text
            payload = (snapshot?.text ?? "").trim();
          }
        } catch (error) {
          console.warn(
            "[leetstack] Failed to convert page body HTML to markdown, using text content",
            error
          );
          payload = (snapshot?.text ?? "").trim();
        }
      }

      if (!payload) {
        throw new Error(
          "Couldn't read the current page. Refresh it and try again."
        );
      }

      // Try to extract topic from markdown headings first, then fall back to titles
      const extractedTopic = extractTopicFromMarkdown(payload);
      const topic = extractedTopic ?? selectionToUse?.title ?? snapshot?.title ?? tab.title ?? null;

      await runGenerationLoop({
        url: tabUrl,
        payload,
        topic,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to generate review cards";
      setErrorMessage(message);
      setGenerationState("error");
    }
  };

  const handleSelectElement = async () => {
    setErrorMessage(null);
    setGenerationState("idle");
    setIsSelectingContent(true);

    try {
      const tab = await getActiveTab();
      const tabId = tab?.id;
      const tabUrl = tab?.url?.trim();
      if (!tabId || !tabUrl) {
        throw new Error("Load the page you want to capture before selecting.");
      }

      const selection = await selectPageElementContent(tabId);
      const normalized = selection?.text?.trim();
      if (!selection || !normalized) {
        setGenerationState("idle");
        return;
      }

      let markdown: string | undefined;
      if (selection.html) {
        try {
          const turndown = new TurndownService({
            headingStyle: "atx", // Use # for headings instead of underlines
          });
          markdown = turndown.turndown(selection.html);
          console.log("[leetstack] Selected element markdown", {
            url: tabUrl,
            title: selection.title ?? tab.title ?? null,
            markdown,
          });
        } catch (error) {
          console.warn(
            "[leetstack] Failed to convert selected element to markdown",
            error
          );
        }
      }

      setSelectedSource({
        url: tabUrl,
        title: selection.title ?? tab.title ?? null,
        text: normalized,
        html: selection.html ?? null,
        markdown: markdown ?? null,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to capture the selected element";
      setErrorMessage(message);
      setGenerationState("error");
    } finally {
      setIsSelectingContent(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedSource(null);
  };

  const runGenerationLoop = async ({
    url,
    payload,
    topic,
  }: {
    url: string;
    payload: string;
    topic: string | null;
  }) => {
    const job = await createGeneralNoteJob({
      url,
      content: payload,
      topic,
    });
    const polled = await pollJobUntilComplete(job.jobId);
    const { url: jobUrl, status, noteId, cards } = polled;

    setStackResult((prev) => {
      return {
        noteId: noteId ?? prev?.noteId ?? null,
        topic: prev?.topic ?? null,
        summary: prev?.summary ?? null,
        cards: cards || [],
        url: jobUrl,
        source: "generated",
      };
    });
    setGenerationState(status);
  };

  const pollJobUntilComplete = async (
    jobId: string
  ): Promise<Awaited<ReturnType<typeof getGeneralNoteJob>>> => {
    const POLL_INTERVAL_MS = 3000;

    while (true) {
      const status = await getGeneralNoteJob(jobId);
      console.log("====got status", status, status?.totalCards);
      setGeneratedCardsCount(status?.totalCards ?? 0);

      if (status.status === "completed") {
        // Log the full response for debugging
        console.log("[leetstack] Job completed", {
          jobId,
          status: status.status,
          totalCards: status.totalCards,
          noteId: status.noteId,
          cards: status.cards,
        });

        return status;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  };

  useEffect(() => {
    setActiveInsertAfterId(null);
    setCardDraft({ front: "", back: "", extra: "" });
  }, [stackResult?.noteId]);

  
  const handleAddCard = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!stackResult?.noteId) {
      setErrorMessage("Generate or load cards before editing them");
      setGenerationState("error");
      return;
    }

    const front = cardDraft.front.trim();
    const back = cardDraft.back.trim();
    const extra = cardDraft.extra.trim();
    if (!front || !back) {
      setErrorMessage("Front and back are required");
      setGenerationState("error");
      return;
    }

    setIsSavingCard(true);
    setErrorMessage(null);
    try {
      const insertAfterCardId =
        activeInsertSlot === START_SLOT_ID
          ? null
          : activeInsertAfterId ?? undefined;
      const response = await addGeneralNoteCard(stackResult.noteId, {
        front,
        back,
        extra: extra ? extra : undefined,
        insertAfterCardId,
      });
      setStackResult((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          noteId: prev.noteId ?? response.noteId,
          cards: response.cards,
        };
      });
      setCardDraft({ front: "", back: "", extra: "" });
      setActiveInsertAfterId(null);
      setActiveInsertSlot(null);
      setGenerationState("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add card";
      setErrorMessage(message);
      setGenerationState("error");
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string | undefined | null) => {
    if (!cardId || !stackResult?.noteId) {
      return;
    }
    setDeletingCardId(cardId);
    setErrorMessage(null);
    try {
      const response = await deleteGeneralNoteCard(stackResult.noteId, cardId);
      setStackResult((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          cards: response.cards,
        };
      });
      setGenerationState("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete card";
      setErrorMessage(message);
      setGenerationState("error");
    } finally {
      setDeletingCardId(null);
    }
  };

  const handleOpenInsertSlot = (
    slotKey: string,
    insertAfterCardId: string | null
  ) => {
    if (!canEditCards) {
      return;
    }
    setActiveInsertSlot(slotKey);
    setActiveInsertAfterId(insertAfterCardId);
    setCardDraft({ front: "", back: "", extra: "" });
    setErrorMessage(null);
  };

  const handleCancelInsert = () => {
    setActiveInsertSlot(null);
    setActiveInsertAfterId(null);
    setCardDraft({ front: "", back: "", extra: "" });
  };

  const renderAddCardSlot = ({
    slotKey,
    insertAfterCardId,
    disabled,
  }: {
    slotKey: string;
    insertAfterCardId: string | null;
    disabled?: boolean;
  }) => {
    if (!stackResult) {
      return null;
    }
    const isActive = activeInsertSlot === slotKey;
    if (!isActive || disabled) {
      return (
        <div key={`slot-${slotKey}`} className="py-2">
          <button
            type="button"
            onClick={() => handleOpenInsertSlot(slotKey, insertAfterCardId)}
            disabled={disabled || !canEditCards}
            className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed"
          >
            + Add card here
          </button>
        </div>
      );
    }

    return (
      <form
        key={`slot-${slotKey}`}
        onSubmit={handleAddCard}
        className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
      >
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Front
          </label>
          <textarea
            rows={2}
            value={cardDraft.front}
            onChange={(event) =>
              setCardDraft((prev) => ({
                ...prev,
                front: event.target.value,
              }))
            }
            disabled={!canEditCards || isSavingCard}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none"
            placeholder="e.g., What trade-offs define the design?"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Back
          </label>
          <textarea
            rows={3}
            value={cardDraft.back}
            onChange={(event) =>
              setCardDraft((prev) => ({
                ...prev,
                back: event.target.value,
              }))
            }
            disabled={!canEditCards || isSavingCard}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none"
            placeholder="Summarize the answer you want to remember"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Extra (optional)
          </label>
          <input
            type="text"
            value={cardDraft.extra}
            onChange={(event) =>
              setCardDraft((prev) => ({
                ...prev,
                extra: event.target.value,
              }))
            }
            disabled={!canEditCards || isSavingCard}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none"
            placeholder="Memory aids, warnings, or links"
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancelInsert}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 underline underline-offset-4"
            disabled={isSavingCard}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canEditCards || isSavingCard}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingCard ? "Saving..." : "Save card"}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {isLoadingExisting && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-purple-500" />
          <span>Checking if you've already saved cards for this page…</span>
        </div>
      )}
      {selectedSource ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Selected section
              </p>
              <p className="mt-1 font-semibold">
                {selectedSource.title ?? "From current page"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-amber-800">
                {selectedSource.text.length > 320
                  ? `${selectedSource.text.slice(0, 320)}...`
                  : selectedSource.text}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-semibold uppercase tracking-wide text-amber-800 underline-offset-4 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
      {!stackResult && !isLoadingExisting && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-900">
            <p>
              Capture the active tab's content—system design writeups,
              behavioural prompts, anything—and let AI turn it into Anki-style
              review cards.
            </p>
            <p className="mt-2 text-xs text-purple-700">
              Tip: load the page you want to study first. Use “Select element”
              to capture a single section or run generation for the entire page.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {isGenerating && generatedCardsCount > 0 && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700 border border-blue-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="font-medium">
                      <span className="inline-flex">
                        {generatedCardsCount}
                        <span className="mx-1">cards</span>
                        <span className="inline-flex">
                          <span>g</span>
                          <span>e</span>
                          <span>n</span>
                          <span>e</span>
                          <span>r</span>
                          <span>a</span>
                          <span>t</span>
                          <span>e</span>
                          <span>d</span>
                        </span>
                      </span>
                    </span>
                    <span className="inline-flex">
                      <span>s</span>
                      <span>o</span>
                      <span> </span>
                      <span>f</span>
                      <span>a</span>
                      <span>r</span>
                      <span>...</span>
                    </span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleSelectElement}
                disabled={
                  isSelectingContent || isLoadingExisting || isGenerating
                }
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSelectingContent ? "Click on the page..." : "Select element"}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isLoadingExisting}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:shadow-xl hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGenerating ? "Generating..." : "AI generates review cards"}
              </button>
            </div>
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
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleSelectElement}
                disabled={isSelectingContent || isGenerating}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSelectingContent ? "Click on the page..." : "Select element"}
              </button>
            </div>
          </div>

          {/* Show error message if generation failed */}
          {generationState === "failed" && errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-900">
              <p className="font-semibold">Error generating cards</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          {hasCards ? (
            <ul className="space-y-3">
              {stackResult.cards.map((card, index) => {
                const cardId = card.id ?? `card-${index + 1}`;
                const slotKey = card.id ?? `slot-${index}`;
                return (
                  <li key={`${cardId}-${index}`} className="space-y-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
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
                            <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-500">
                              {card.extra}
                            </p>
                          ) : null}
                        </div>
                        {canEditCards ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            disabled={!card.id || deletingCardId === card.id}
                            className="text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingCardId === card.id
                              ? "Removing..."
                              : "Delete"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {renderAddCardSlot({
                      slotKey,
                      insertAfterCardId: card.id ?? null,
                      disabled: !card.id,
                    })}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              <p>AI didn't return any cards for this page.</p>
              <p className="mt-1">Add your own notes below to get started.</p>
              <div className="mt-4">
                {renderAddCardSlot({
                  slotKey: START_SLOT_ID,
                  insertAfterCardId: null,
                })}
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
