import { useCallback, useEffect, useRef, useState } from "react";
import {
  saveUserDsaQuestion,
  generateAiSolution,
  type UserPrincipal,
} from "@/lib/api";
import FieldLabel from "./FieldLabel";
import GeneralNotesTab from "./GeneralNotesTab";
import {
  extractSlugFromUrl,
  findLeetCodeProblemDetailsInActivePage,
  normalizeLeetCodeUrl,
  slugify,
  toPlainText,
} from "../utils/leetcode";
import { getActiveTab } from "../utils/browser";
import { readStoredMap, writeStoredMap } from "../utils/storage";
import type { PopupFormState, PopupStorageMap } from "../types";

interface MainContentProps {
  user: UserPrincipal;
  onSignOut: () => void;
}

const MAIN_TABS = [
  { id: "leetcode", label: "DSA Notebook" },
  { id: "generalNotes", label: "Text -> Review Cards" },
] as const;

type MainTabId = (typeof MAIN_TABS)[number]["id"];

export default function MainContent({ user, onSignOut }: MainContentProps) {
  const [problemNumber, setProblemNumber] = useState("");
  const [problemLink, setProblemLink] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [idealSolutionInput, setIdealSolutionInput] = useState("");
  const [isGeneratingIdealSolution, setIsGeneratingIdealSolution] =
    useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [languageLabel, setLanguageLabel] = useState("Unknown");
  const [difficultyLabel, setDifficultyLabel] = useState("Unknown");
  const [currentUrl, setCurrentUrl] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const storageCacheRef = useRef<PopupStorageMap>({});
  const initialStateRef = useRef<PopupFormState | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedTitle, setLastSavedTitle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MainTabId>("leetcode");
  const isSaving = saveState === "saving";
  const userDisplayName = user.firstName || user.email || "LeetStack member";

  const applyFormState = useCallback((state: PopupFormState) => {
    setProblemNumber(state.problemNumber ?? "");
    setProblemLink(state.url ?? "");
    setTitleInput(state.title ?? "");
    setDescriptionInput(state.description ?? "");
    setCodeInput(state.code ?? "");
    setIdealSolutionInput(state.idealSolution ?? "");
    setNotesInput(state.notes ?? "");
    setDifficultyLabel(state.difficulty ?? "Unknown");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const storedMap = await readStoredMap();
      if (cancelled) {
        return;
      }
      storageCacheRef.current = storedMap;

      const tab = await getActiveTab();
      if (cancelled) {
        return;
      }

      const tabUrl = tab?.url ?? "";
      const tabId = tab?.id;
      const normalizedTabUrl = tabUrl ? normalizeLeetCodeUrl(tabUrl) : "";
      const storageKey = normalizedTabUrl || tabUrl;

      if (storageKey) {
        setCurrentUrl(storageKey);
        setProblemLink(storageKey);
      }

      if (tabId === undefined) {
        setIsInitialized(true);
        return;
      }

      try {
        const pageDetails = await findLeetCodeProblemDetailsInActivePage(tabId);
        if (cancelled || !pageDetails) {
          setIsInitialized(true);
          return;
        }

        console.log("=====pageDetails", pageDetails);
        setLanguageLabel(pageDetails.language ?? "Unknown");

        const normalizedUrl = normalizeLeetCodeUrl(
          pageDetails.href || tabUrl || ""
        );
        const key = normalizedUrl || storageKey;
        if (key) {
          setCurrentUrl(key);
          setProblemLink(key);
        }

        const description = pageDetails.descriptionHtml
          ? toPlainText(pageDetails.descriptionHtml)
          : pageDetails.descriptionText ?? "";
        const initialState: PopupFormState = {
          url: key || pageDetails.href || "",
          problemNumber: pageDetails.problemNumber ?? "",
          title: pageDetails.problemTitle ?? "",
          description: description || "",
          code: pageDetails.solutionCode?.trim() ?? "",
          idealSolution: "",
          notes: "",
          language: pageDetails.language,
          difficulty: pageDetails.difficulty ?? "Unknown",
        };

        applyFormState(initialState);
        initialStateRef.current = { ...initialState };

        if (key) {
          const updatedMap = {
            ...storageCacheRef.current,
            [key]: initialState,
          };
          storageCacheRef.current = updatedMap;
          await writeStoredMap(updatedMap);
        }
      } catch (error) {
        console.warn("[leetstack] Unable to discover LeetCode title", error);
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [applyFormState]);

  useEffect(() => {
    if (!currentUrl || !isInitialized) {
      return;
    }

    const state: PopupFormState = {
      url: currentUrl,
      problemNumber,
      title: titleInput,
      description: descriptionInput,
      code: codeInput,
      idealSolution: idealSolutionInput,
      notes: notesInput,
      language: languageLabel,
      difficulty: difficultyLabel,
    };

    storageCacheRef.current = {
      ...storageCacheRef.current,
      [currentUrl]: state,
    };

    const timeoutId = window.setTimeout(() => {
      void writeStoredMap(storageCacheRef.current);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    currentUrl,
    problemNumber,
    titleInput,
    descriptionInput,
    codeInput,
    idealSolutionInput,
    notesInput,
    languageLabel,
    difficultyLabel,
    isInitialized,
  ]);

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined") {
      window.close();
    }
  }, []);

  const handleGenerateIdealSolution = useCallback(async () => {
    if (isGeneratingIdealSolution) {
      return;
    }
    setIsGeneratingIdealSolution(true);
    setSaveError(null);
    try {
      const payload = {
        questionIndex: `${problemNumber}`,
        language: languageLabel || undefined,
      };
      const response = await generateAiSolution(payload);
      setIdealSolutionInput(response.answer);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to generate AI solution";
      setSaveError(message);
    } finally {
      setIsGeneratingIdealSolution(false);
    }
  }, [isGeneratingIdealSolution, languageLabel]);

  const handleCancel = useCallback(() => {
    const baseline = initialStateRef.current ?? {
      url: currentUrl,
      problemNumber: "",
      title: "",
      description: "",
      code: "",
      idealSolution: "",
      notes: "",
      language: languageLabel,
      difficulty: difficultyLabel,
    };

    const snapshot: PopupFormState = {
      ...baseline,
      language: baseline.language ?? languageLabel ?? "Unknown",
      difficulty: baseline.difficulty ?? difficultyLabel ?? "Unknown",
    };
    applyFormState(snapshot);

    if (currentUrl) {
      storageCacheRef.current = {
        ...storageCacheRef.current,
        [currentUrl]: snapshot,
      };
      void writeStoredMap(storageCacheRef.current);
    }

    initialStateRef.current = snapshot;
    setSaveState("idle");
    setSaveError(null);
    setLastSavedTitle(null);
  }, [applyFormState, currentUrl, difficultyLabel, languageLabel]);

  const computeQuestionIndex = useCallback(() => {
    const normalizedProblemNumber = problemNumber.trim();
    if (normalizedProblemNumber) {
      return normalizedProblemNumber;
    }
    const trimmedTitle =
      titleInput.trim() ||
      (problemNumber
        ? `LeetCode Problem ${problemNumber}`
        : "Untitled Problem");
    const slugFromUrl = extractSlugFromUrl(problemLink);
    const derivedSlug = slugFromUrl || slugify(trimmedTitle);
    const fallbackSlug = problemNumber
      ? `problem-${problemNumber}`
      : `problem-${Date.now()}`;
    return derivedSlug || fallbackSlug;
  }, [problemLink, problemNumber, titleInput]);

  const handleSave = async () => {
    const trimmedTitle =
      titleInput.trim() ||
      (problemNumber
        ? `LeetCode Problem ${problemNumber}`
        : "Untitled Problem");
    const slugFromUrl = extractSlugFromUrl(problemLink);
    const derivedSlug = slugFromUrl || slugify(trimmedTitle);
    const fallbackSlug = problemNumber
      ? `problem-${problemNumber}`
      : `problem-${Date.now()}`;
    const titleSlug = derivedSlug || fallbackSlug;
    const questionIndex = computeQuestionIndex();
    const description = descriptionInput.trim() || "No description provided.";
    const solution = codeInput.trim() || null;
    const idealSolution = idealSolutionInput.trim() || null;
    const note = notesInput.trim() || null;
    const difficultyValue = difficultyLabel?.trim() || "Unknown";

    setSaveState("saving");
    setSaveError(null);
    setLastSavedTitle(null);

    try {
      const response = await saveUserDsaQuestion({
        questionIndex,
        title: trimmedTitle,
        titleSlug,
        difficulty: difficultyValue,
        description,
        solution,
        idealSolutionCode: idealSolution,
        note,
      });

      setSaveState("success");
      setLastSavedTitle(response.title);
      if (currentUrl) {
        const snapshot: PopupFormState = {
          url: currentUrl,
          problemNumber,
          title: titleInput,
          description: descriptionInput,
          code: codeInput,
          idealSolution: idealSolutionInput,
          notes: notesInput,
          language: languageLabel,
          difficulty: difficultyValue,
        };
        initialStateRef.current = { ...snapshot };
        storageCacheRef.current = {
          ...storageCacheRef.current,
          [currentUrl]: snapshot,
        };
        void writeStoredMap(storageCacheRef.current);
      }
      window.setTimeout(() => {
        setSaveState("idle");
        setLastSavedTitle(null);
      }, 4000);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save problem";
      setSaveError(message);
      setSaveState("error");
    }
  };

  const headerProblemLabel = problemNumber
    ? `Problem #${problemNumber}`
    : "Problem";
  const headerTitleText =
    titleInput || "Open a LeetCode problem to capture details.";
  const headerLink = problemLink;
  const difficultyDisplay = difficultyLabel || "Unknown";
  const difficultyToneClass = (() => {
    const normalized = difficultyDisplay.toLowerCase();
    if (normalized === "easy") {
      return "bg-emerald-100 text-emerald-600";
    }
    if (normalized === "medium") {
      return "bg-amber-100 text-amber-600";
    }
    if (normalized === "hard") {
      return "bg-rose-100 text-rose-600";
    }
    return "bg-slate-200 text-slate-600";
  })();
  const statusMessage = (() => {
    if (saveState === "saving") {
      return "Saving problem...";
    }
    if (saveState === "success") {
      return lastSavedTitle ? `Saved "${lastSavedTitle}"` : "Problem saved";
    }
    if (saveState === "error" && saveError) {
      return saveError;
    }
    return "Ready to save...";
  })();
  const statusMessageClassName = (() => {
    if (saveState === "error") {
      return "text-red-600";
    }
    if (saveState === "success") {
      return "text-green-600";
    }
    if (saveState === "saving") {
      return "text-blue-600";
    }
    return "text-slate-500";
  })();

  return (
    <div className="flex min-h-screen justify-center bg-slate-100 px-2 py-2">
      <div className="w-[540px] max-w-full rounded-3xl bg-white p-8 shadow-dialog">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Signed in as
            </p>
            <p className="font-semibold text-slate-900">{userDisplayName}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-1 items-start gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <h1 className="text-xl font-semibold text-slate-900">
                Save to LeetStack
              </h1>
              <p className="text-sm text-slate-500">
                Capture your code and notes for later review
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={handleClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M12 10.586L16.95 5.636l1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05l1.414-1.414z"
              />
            </svg>
          </button>
        </header>

        <div className="mt-6 space-y-6">
          <div className="rounded-3xl bg-slate-50 p-1 text-sm font-semibold text-slate-500">
            <div className="grid grid-cols-2 gap-1">
              {MAIN_TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                      isActive
                        ? "bg-white text-slate-900 shadow-md shadow-purple-100 ring-1 ring-purple-200"
                        : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                    }`}
                    aria-pressed={isActive}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "leetcode" ? (
            <>
              <section className="space-y-5">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-blue-600">
                        <span>{headerProblemLabel}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${difficultyToneClass}`}
                        >
                          {difficultyDisplay}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700">
                        {headerTitleText}
                      </div>
                      {headerLink ? (
                        <a
                          href={headerLink}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sm text-slate-600 underline-offset-2 hover:underline"
                        >
                          {headerLink}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">
                          No problem link detected.
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-500 shadow-sm">
                      {languageLabel || "Unknown"}
                    </span>
                  </div>
                </div>

                <FieldLabel label="Problem Title">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(event) => setTitleInput(event.target.value)}
                    placeholder="Problem title"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </FieldLabel>
                <FieldLabel label="Problem Description">
                  <textarea
                    rows={9}
                    value={descriptionInput}
                    onChange={(event) =>
                      setDescriptionInput(event.target.value)
                    }
                    placeholder="Problem description"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </FieldLabel>
                <FieldLabel label={`Your Solution Code (})`}>
                  <textarea
                    rows={9}
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    }}
                  />
                </FieldLabel>
                <FieldLabel label="Ideal Solution (Optional)">
                  <div className="space-y-3">
                    <textarea
                      rows={7}
                      value={idealSolutionInput}
                      onChange={(event) =>
                        setIdealSolutionInput(event.target.value)
                      }
                      placeholder="Add an ideal or editorial-grade solution for quick reference"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      style={{
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      }}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>
                        Store the polished solution you want to memorize.
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateIdealSolution}
                        disabled={isGeneratingIdealSolution}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:shadow-xl hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isGeneratingIdealSolution
                          ? "Generating..."
                          : "Generate with AI"}
                      </button>
                    </div>
                  </div>
                </FieldLabel>

                <FieldLabel label="Personal Notes (Optional)">
                  <textarea
                    rows={3}
                    value={notesInput}
                    onChange={(event) => setNotesInput(event.target.value)}
                    placeholder="e.g., Remember the hashmap trick, time complexity is O(n)..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </FieldLabel>
              </section>

              <footer className="flex flex-wrap items-center justify-between gap-4">
                <span className={`text-sm ${statusMessageClassName}`}>
                  {statusMessage}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving ? "Saving..." : "Save to LeetStack"}
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <GeneralNotesTab />
          )}
        </div>
      </div>
    </div>
  );
}
