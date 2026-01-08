import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createGeneralNoteJob,
  getGeneralNoteJob,
  getExistingGeneralNote,
  addGeneralNoteCard,
  deleteGeneralNoteCard,
  generateSummary,
  updateNote,
} from "@/lib/api";
import { getActiveTab } from "../utils/browser";
import { selectPageElementContent } from "../utils/page";
import TurndownService from "turndown";
import { TaskStatus } from "../../../../shared-types/TaskStatus";
import { MarkdownViewer } from "./MarkdownViewer";

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
  const [generationState, setGenerationState] = useState<
    TaskStatus | "idle" | "loading" | "success" | "error"
  >("pending");
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
    topic?: string | null;
  } | null>(null);
  const [isSelectingContent, setIsSelectingContent] = useState(false);

  // Notes mode: "notes" for simple notes, "flashcards" for card editing
  const [notesMode, setNotesMode] = useState<"notes" | "flashcards">("notes");
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryInput, setSummaryInput] = useState("");
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [pageTopic, setPageTopic] = useState("");

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
        console.log("[leetstack] Loading existing note for URL:", tabUrl);
        const existing = await getExistingGeneralNote(tabUrl);
        console.log("[leetstack] Existing note response:", existing);
        if (cancelled || !existing) {
          console.log("[leetstack] No existing note found or cancelled");
          setIsLoadingExisting(false);
          return;
        }
        console.log("[leetstack] Setting stack result with:", {
          noteId: existing.noteId,
          topic: existing.topic,
          summary: existing.summary,
          summaryLength: existing.summary?.length || 0,
          cardsCount: existing.cards?.length || 0,
          cards: existing.cards,
          url: existing.url,
        });
        setStackResult({
          noteId: existing.noteId,
          topic: existing.topic,
          summary: existing.summary,
          cards: existing.cards,
          url: existing.url,
          source: "existing",
        });
        const summaryValue = existing.summary ?? "";
        const topicValue = existing.topic ?? "";
        console.log(
          "[leetstack] Setting summaryInput:",
          summaryValue ? "has content" : "empty"
        );
        console.log("[leetstack] Setting pageTopic:", topicValue || "empty");
        setSummaryInput(summaryValue);
        setPageTopic(topicValue);
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

  // Clear selected source when tab changes
  useEffect(() => {
    const checkTabUrl = async () => {
      const tab = await getActiveTab();
      const currentTabUrl = tab?.url?.trim();
      if (
        selectedSource &&
        currentTabUrl &&
        selectedSource.url !== currentTabUrl
      ) {
        setSelectedSource(null);
      }
    };

    checkTabUrl();
  }, [selectedSource?.url]);

  // Extract topic from markdown headings
  const extractTopicFromMarkdown = (markdown: string): string | null => {
    // Find first # or ## heading and extract the topic
    // Using exec is more efficient as it stops at first match
    const lines = markdown.split("\n");
    for (const line of lines) {
      // Skip empty lines and whitespace-only lines
      if (!line.trim()) {
        continue;
      }
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

      // Must have selected content to generate cards
      if (!selectedSource || selectedSource.url !== tabUrl) {
        setSelectedSource(null);
        throw new Error(
          "Please select an element on the page first before generating cards."
        );
      }

      // Use markdown from selected element
      let payload: string;
      if (selectedSource.markdown) {
        payload = selectedSource.markdown.trim();
      } else if (selectedSource.html) {
        // Convert selected element HTML to markdown if not already converted
        try {
          const turndown = new TurndownService({
            headingStyle: "atx", // Use # for headings instead of underlines
          });
          payload = turndown.turndown(selectedSource.html).trim();
        } catch (error) {
          console.warn(
            "[leetstack] Failed to convert selected HTML to markdown, using text",
            error
          );
          payload = selectedSource.text.trim();
        }
      } else {
        payload = selectedSource.text.trim();
      }

      if (!payload) {
        throw new Error(
          "Selected content is empty. Please select a different element."
        );
      }

      // Use topic from selected source
      const topic =
        selectedSource.topic ?? selectedSource.title ?? tab.title ?? null;

      await runGenerationLoop({
        url: tabUrl,
        payload,
        topic,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to generate flashcards";
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
        } catch (error) {
          console.warn(
            "[leetstack] Failed to convert selected element to markdown",
            error
          );
        }
      }

      // Extract topic from markdown if available
      const extractedTopic = markdown
        ? extractTopicFromMarkdown(markdown)
        : null;

      setSelectedSource({
        url: tabUrl,
        title: selection.title ?? tab.title ?? null,
        text: normalized,
        html: selection.html ?? null,
        markdown: markdown ?? null,
        topic: extractedTopic,
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
    topic: initialTopic,
  }: {
    url: string;
    payload: string;
    topic: string | null;
  }) => {
    const job = await createGeneralNoteJob({
      url,
      content: payload,
      topic: initialTopic,
    });
    const polled = await pollJobUntilComplete(job.jobId);
    const { url: jobUrl, status, noteId, cards, topic } = polled;

    setStackResult((prev) => {
      return {
        noteId: noteId ?? prev?.noteId ?? null,
        topic: topic ?? prev?.topic ?? null,
        summary: prev?.summary ?? null,
        cards: cards || [],
        url: jobUrl,
        source: "generated",
      };
    });
    setPageTopic(topic ?? "");
    setGenerationState(status);
  };

  const pollJobUntilComplete = async (
    jobId: string
  ): Promise<Awaited<ReturnType<typeof getGeneralNoteJob>>> => {
    const POLL_INTERVAL_MS = 10000;

    while (true) {
      const status = await getGeneralNoteJob(jobId);
      setGeneratedCardsCount(status?.totalCards ?? 0);

      if (status.status === "completed") {
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

  const handleSaveSummary = async () => {
    setIsSavingSummary(true);
    setErrorMessage(null);
    try {
      const tab = await getActiveTab();
      const tabUrl = tab?.url?.trim();
      if (!tabUrl) {
        throw new Error("No active tab found");
      }

      // Use existing noteId
      const noteId = stackResult?.noteId;
      if (!noteId) {
        throw new Error("Please generate AI summary first or create a note");
      }

      // Determine if topic changed
      const currentTopic = stackResult?.topic ?? null;
      const newTopic = pageTopic || currentTopic;
      const topicChanged = newTopic !== currentTopic;

      // Call the API to update the note
      const result = await updateNote(noteId, {
        summary: summaryInput || undefined,
        ...(topicChanged ? { topic: newTopic || undefined } : {}),
      });

      // Update local state with the response
      setStackResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: result.summary,
          topic: result.topic,
        };
      });

      // Switch to preview mode after saving
      setIsEditingSummary(false);
      setGenerationState("completed");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save notes";
      setErrorMessage(message);
      setGenerationState("error");
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleGenerateSummary = async () => {
    setErrorMessage(null);
    setGenerationState("processing");
    try {
      const tab = await getActiveTab();
      const tabId = tab?.id;
      const tabUrl = tab?.url?.trim();
      if (!tabId || !tabUrl) {
        throw new Error("Open the page you want to summarize");
      }

      // Must have selected content to generate summary
      if (!selectedSource || selectedSource.url !== tabUrl) {
        setSelectedSource(null);
        throw new Error(
          "Please select an element on the page first before generating summary."
        );
      }

      // Use markdown from selected element
      let content: string;
      if (selectedSource.markdown) {
        content = selectedSource.markdown.trim();
      } else if (selectedSource.html) {
        // Convert selected element HTML to markdown if not already converted
        try {
          const turndown = new TurndownService({
            headingStyle: "atx", // Use # for headings instead of underlines
          });
          content = turndown.turndown(selectedSource.html).trim();
        } catch (error) {
          console.warn(
            "[leetstack] Failed to convert selected HTML to markdown, using text",
            error
          );
          content = selectedSource.text.trim();
        }
      } else {
        content = selectedSource.text.trim();
      }

      if (!content) {
        throw new Error(
          "Selected content is empty. Please select a different element."
        );
      }

      // Use topic from selected source, or page topic if set, or page title
      const topic =
        pageTopic ||
        (selectedSource.topic ??
          selectedSource.title ??
          tab.title ??
          undefined);

      // Call the new summary API (now saves to DynamoDB)
      const { summary, noteId } = await generateSummary({
        url: tabUrl,
        content,
        topic,
      });

      // Update the summary input with the generated summary
      setSummaryInput(summary);

      // Update the stackResult with the noteId from API response
      setStackResult((prev) => {
        if (!prev) {
          return {
            noteId,
            topic: topic ?? null,
            summary,
            cards: [],
            url: tabUrl,
            source: "generated",
          };
        }
        return {
          ...prev,
          noteId,
          summary,
        };
      });

      // Update page topic if it was extracted
      if (!pageTopic && selectedSource.topic) {
        setPageTopic(selectedSource.topic);
      }

      // Switch to preview mode
      setIsEditingSummary(false);
      setGenerationState("completed");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to generate summary";
      setErrorMessage(message);
      setGenerationState("error");
    }
  };

  // Debug: manually reload existing note
  const handleDebugReloadNote = useCallback(async () => {
    setIsLoadingExisting(true);
    setErrorMessage(null);
    try {
      const tab = await getActiveTab();
      const tabUrl = tab?.url?.trim();
      if (!tabUrl) {
        setErrorMessage("No active tab URL found");
        setIsLoadingExisting(false);
        return;
      }
      console.log("[leetstack] Debug: Loading existing note for URL:", tabUrl);
      const existing = await getExistingGeneralNote(tabUrl);
      console.log("[leetstack] Debug: Full API response:", JSON.stringify(existing, null, 2));
      console.log("[leetstack] Debug: Existing note response:", existing);
      if (!existing) {
        setErrorMessage("No existing note found for this URL");
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
      setSummaryInput(existing.summary ?? "");
      setPageTopic(existing.topic ?? "");
      setGenerationState("completed");
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load note";
      console.error("[leetstack] Debug: Error loading note:", error);
      setErrorMessage(`Debug: ${message}`);
      setGenerationState("error");
    } finally {
      setIsLoadingExisting(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Debug button */}
      <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
        <span className="text-xs font-semibold text-amber-800">
          Debug Controls
        </span>
        <button
          type="button"
          onClick={handleDebugReloadNote}
          className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Reload Note
        </button>
      </div>

      {isLoadingExisting && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500">
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-purple-500" />
          <span>Checking if you've already saved cards for this page…</span>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="rounded-full bg-slate-100 p-1 text-sm font-semibold text-slate-600">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setNotesMode("notes")}
            className={`rounded-full px-4 py-2 transition ${
              notesMode === "notes"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setNotesMode("flashcards")}
            className={`rounded-full px-4 py-2 transition ${
              notesMode === "flashcards"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Flashcards
          </button>
        </div>
      </div>

      {/* Notes Mode */}
      {notesMode === "notes" && (
        <section className="space-y-4">
          {/* Topic Input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Topic
            </label>
            <input
              type="text"
              value={pageTopic}
              onChange={(e) => setPageTopic(e.target.value)}
              placeholder="e.g., React Hooks Tutorial"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Summary/Notes Editor */}
          <div>
            {isEditingSummary || !summaryInput ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </label>
                <textarea
                  rows={12}
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                  placeholder="Write your notes in markdown format. Use # for headings, ``` for code blocks, etc."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                />
                <div className="flex items-center justify-between">
                  {summaryInput && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSummary(false)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Preview
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSummary}
                    disabled={isSavingSummary || !summaryInput.trim()}
                    className="ml-auto rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSavingSummary ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>
            ) : (
              <MarkdownViewer
                content={summaryInput}
                onEdit={() => setIsEditingSummary(true)}
              />
            )}
          </div>

          {/* AI Actions */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSelectElement}
                disabled={isSelectingContent || isGenerating}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                  <path d="M13 13l6 6" />
                </svg>
                {isSelectingContent ? "Click on the page..." : "Select element"}
              </button>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isGenerating || !selectedSource}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:shadow-xl hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-600 disabled:shadow-none"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-10z" />
                </svg>
                {isGenerating ? "Generating..." : "Generate AI Summary"}
              </button>
            </div>

            {/* Show selected element content */}
            {selectedSource ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-amber-700 font-medium">
                      Selected content
                    </p>
                    {selectedSource.topic && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-600">
                          Topic:
                        </span>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          {selectedSource.topic}
                        </span>
                      </div>
                    )}
                    <p className="mt-2 text-xs leading-relaxed text-amber-800 line-clamp-3">
                      {selectedSource.text.length > 200
                        ? `${selectedSource.text.slice(0, 200)}...`
                        : selectedSource.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-amber-800 underline-offset-4 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : null}

            {/* Show generation progress */}
            {isGenerating && (
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
                    <svg
                      className="h-6 w-6 animate-spin text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    Generating summary...
                  </div>
                  <p className="text-xs text-blue-500 mt-1 animate-pulse">
                    AI is analyzing the selected content
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Show error message if generation failed */}
          {(generationState === "error" || generationState === "failed") &&
            errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-900">
                <p className="font-semibold">Unable to generate summary</p>
                <p className="mt-1">{errorMessage}</p>
              </div>
            )}
        </section>
      )}
      {notesMode === "flashcards" &&
        !stackResult &&
        !isLoadingExisting &&
        generationState !== "completed" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-base text-purple-900">
              <p>
                <span className="font-semibold text-lg">
                  Generate flashcards from any content:
                </span>
              </p>
              <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-purple-700 leading-relaxed">
                <li>
                  Click "Select element" and highlight content on the page
                </li>
                <li>
                  Review your selection below, then click "Generate cards"
                </li>
                <li>AI will create flashcards from your selected content</li>
              </ol>
              <p className="mt-3 text-sm text-purple-700 italic">
                Note: You must select an element before generating cards.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectElement}
                  disabled={
                    isSelectingContent || isLoadingExisting || isGenerating
                  }
                  className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                    <path d="M13 13l6 6" />
                  </svg>
                  {isSelectingContent
                    ? "Click on the page..."
                    : "Select element"}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={
                    isGenerating || isLoadingExisting || !selectedSource
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:shadow-xl hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-600 disabled:shadow-none"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  {isGenerating ? "Generating..." : "Generate cards"}
                </button>
              </div>

              {/* Show selected element content below buttons */}
              {selectedSource ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wide text-amber-700 font-medium">
                        Selected content
                      </p>
                      {selectedSource.topic && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-amber-600">
                            Topic:
                          </span>
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                            {selectedSource.topic}
                          </span>
                        </div>
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-amber-800 line-clamp-3">
                        {selectedSource.text.length > 200
                          ? `${selectedSource.text.slice(0, 200)}...`
                          : selectedSource.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-amber-800 underline-offset-4 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Show generation progress after selected content */}
              {isGenerating && (
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
                      <svg
                        className="h-6 w-6 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                    <div className="absolute -inset-1 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1 text-lg font-bold text-blue-600">
                      <span className="relative">
                        <span className="text-2xl transition-all duration-300 ease-out">
                          {generatedCardsCount}
                        </span>
                        <span className="absolute -top-1 -right-2 text-xs font-medium text-blue-500 bg-blue-50 rounded-full px-1.5 py-0.5 animate-pulse">
                          +1
                        </span>
                      </span>
                      <span className="text-blue-500">card</span>
                      {generatedCardsCount !== 1 && (
                        <span className="text-blue-500">s</span>
                      )}
                    </div>
                    <p className="text-xs text-blue-500 mt-1 animate-pulse">
                      Generating flashcards...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      {notesMode === "flashcards" && stackResult && (
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSelectElement}
                disabled={isSelectingContent || isGenerating}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSelectingContent ? "Click on the page..." : "Select element"}
              </button>
              {selectedSource && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedSource}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:shadow-xl hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-600 disabled:shadow-none"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  {isGenerating ? "Generating..." : "Generate cards"}
                </button>
              )}
            </div>
          </div>

          {/* Show selected element content when existing cards are loaded */}
          {selectedSource && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-amber-700 font-medium">
                    Selected content to generate new cards
                  </p>
                  {selectedSource.topic && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-600">
                        Topic:
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        {selectedSource.topic}
                      </span>
                    </div>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-amber-800 line-clamp-3">
                    {selectedSource.text.length > 200
                      ? `${selectedSource.text.slice(0, 200)}...`
                      : selectedSource.text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-amber-800 underline-offset-4 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Show generation progress after selected content */}
          {isGenerating && selectedSource && (
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
                  <svg
                    className="h-6 w-6 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <div className="absolute -inset-1 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-1 text-lg font-bold text-blue-600">
                  <span className="relative">
                    <span className="text-2xl transition-all duration-300 ease-out">
                      {generatedCardsCount}
                    </span>
                    <span className="absolute -top-1 -right-2 text-xs font-medium text-blue-500 bg-blue-50 rounded-full px-1.5 py-0.5 animate-pulse">
                      +1
                    </span>
                  </span>
                  <span className="text-blue-500">card</span>
                  {generatedCardsCount !== 1 && (
                    <span className="text-blue-500">s</span>
                  )}
                </div>
                <p className="text-xs text-blue-500 mt-1 animate-pulse">
                  Generating flashcards...
                </p>
              </div>
            </div>
          )}

          {/* Show error message if generation failed */}
          {(generationState === "error" || generationState === "failed") &&
            errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-900">
                <p className="font-semibold">Unable to generate flashcards</p>
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
      )}
    </div>
  );
}
