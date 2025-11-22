import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { type UserPrincipal } from "@/lib/api";
import MainContent from "./components/MainContent";
import AuthPrompt from "./components/AuthPrompt";
import LoadingScreen from "./components/LoadingScreen";

interface PageProblemDetails {
  problemNumber: string;
  problemTitle: string;
  href: string;
  descriptionHtml?: string;
  descriptionText?: string;
  language?: string;
  solutionCode?: string;
  difficulty?: string;
}

function toPlainText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const text = doc.body.textContent ?? "";
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function findLeetCodeProblemDetailsInActivePage(
  tabId: number
): Promise<PageProblemDetails | null> {
  if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
    return null;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        const containers = Array.from(
          document.querySelectorAll("div.text-title-large")
        ) as HTMLElement[];
        for (const container of containers) {
          const link = container.querySelector(
            'a[href^="/problems/"]'
          ) as HTMLAnchorElement | null;
          if (!link) {
            continue;
          }

          const rawText = link.textContent?.trim() ?? "";
          if (!rawText) {
            continue;
          }

          const titleMatch = rawText.match(/^(\d+)\.\s*(.+)$/);
          if (!titleMatch) {
            continue;
          }

          const nextDataElement = document.getElementById("__NEXT_DATA__");
          let descriptionHtml: string | undefined;
          if (nextDataElement?.textContent) {
            try {
              const data = JSON.parse(nextDataElement.textContent);
              const queries =
                data?.props?.pageProps?.dehydratedState?.queries ?? [];
              for (const query of queries) {
                const question = query?.state?.data?.question;
                if (question?.content) {
                  descriptionHtml = question.content;
                  break;
                }
              }
            } catch (error) {
              console.warn(
                "[leetstack] Failed to parse __NEXT_DATA__ on page",
                error
              );
            }
          }

          if (!descriptionHtml) {
            const descriptionNode = document.querySelector(
              '[data-track-load="description_content"]'
            ) as HTMLElement | null;
            if (descriptionNode) {
              descriptionHtml = descriptionNode.innerHTML;
            }
          }

          const normalizeDifficulty = (
            value?: string | null
          ): string | undefined => {
            if (!value) {
              return undefined;
            }
            const normalized = value.trim().toLowerCase();
            if (!normalized) {
              return undefined;
            }
            if (normalized.includes("easy")) {
              return "Easy";
            }
            if (normalized.includes("medium")) {
              return "Medium";
            }
            if (normalized.includes("hard")) {
              return "Hard";
            }
            return undefined;
          };

          const detectDifficulty = (): string | undefined => {
            const inspectNode = (node: Element | null): string | undefined => {
              if (!node) {
                return undefined;
              }
              const elements: Element[] = [
                node,
                ...Array.from(node.querySelectorAll("*")),
              ];
              for (const element of elements) {
                const classList = Array.from(element.classList ?? []);
                for (const cls of classList) {
                  const normalizedByClass = normalizeDifficulty(cls);
                  if (normalizedByClass) {
                    return normalizedByClass;
                  }
                }

                const textMatch = normalizeDifficulty(element.textContent);
                if (textMatch) {
                  return textMatch;
                }
              }
              return undefined;
            };

            const parent = container.parentElement;
            const grandParent = parent?.parentElement;
            const primarySibling =
              grandParent?.nextElementSibling as HTMLElement | null;
            const fallbackSiblings: (Element | null | undefined)[] = [
              primarySibling,
              parent?.nextElementSibling,
              container.nextElementSibling,
            ];

            for (const sibling of fallbackSiblings) {
              if (!sibling) {
                continue;
              }
              const directText = normalizeDifficulty(sibling.textContent);
              if (directText) {
                return directText;
              }
              const nested = inspectNode(sibling);
              if (nested) {
                return nested;
              }
            }

            return inspectNode(primarySibling);
          };

          const detectLanguage = (): string | undefined => {
            const selectors = [
              '[data-cy="language-select-menu"] button span',
              '[data-cy="lang-select"] span',
              ".editor-lang-shortcut span",
              ".ant-select-selection-item",
            ];
            for (const selector of selectors) {
              const node = document.querySelector(selector);
              const text = node?.textContent?.trim();
              if (text) {
                return text;
              }
            }
            return undefined;
          };

          const readIndexedDbSolution = (
            problemNum: string
          ): Promise<{ code: string; language?: string } | null> => {
            return new Promise((resolve) => {
              const normalizedProblemNum = `${problemNum ?? ""}`.trim();
              if (!normalizedProblemNum || !(window as any).indexedDB) {
                resolve(null);
                return;
              }

              const request = (window as any).indexedDB.open(
                "LeetCode-problems"
              );
              request.onerror = () => resolve(null);
              request.onsuccess = () => {
                const db = request.result;
                let resolved = false;
                const finish = (
                  payload: { code: string; language?: string } | null
                ) => {
                  if (!resolved) {
                    resolved = true;
                    resolve(payload);
                  }
                };

                try {
                  const tx = db.transaction("problem_code", "readonly");
                  const store = tx.objectStore("problem_code");
                  const cursorReq = store.openCursor();
                  cursorReq.onerror = () => finish(null);
                  cursorReq.onsuccess = (event: any) => {
                    const cursor = event.target.result;
                    if (!cursor) {
                      finish(null);
                      return;
                    }

                    const key = String(cursor.key ?? "");
                    const suffix = "-updated-time";
                    if (
                      key.endsWith(suffix) ||
                      !key.startsWith(`${normalizedProblemNum}_`)
                    ) {
                      cursor.continue();
                      return;
                    }

                    const keySegments = key.split("_");
                    const problemSegment = keySegments[0];
                    if (problemSegment !== normalizedProblemNum) {
                      cursor.continue();
                      return;
                    }

                    const inferredLanguage =
                      keySegments.length === 3 ? keySegments[2] : undefined;
                    let record = cursor.value;
                    finish({ code: record, language: inferredLanguage });
                  };

                  tx.oncomplete = () => finish(null);
                  tx.onerror = () => finish(null);
                } catch (error) {
                  console.warn(
                    "[leetstack] IndexedDB inspection failed",
                    error
                  );
                  finish(null);
                }
              };
            });
          };

          const detectedDifficulty = detectDifficulty();
          let solutionCode: string | undefined;
          let detectedLanguage = detectLanguage();

          try {
            const indexed = await readIndexedDbSolution(titleMatch[1]);
            if (indexed?.code) {
              solutionCode = indexed.code;
              if (!detectedLanguage && indexed.language) {
                detectedLanguage = indexed.language;
              }
            }
          } catch (error) {
            console.warn("[leetstack] IndexedDB lookup failed", error);
          }

          let descriptionText: string | undefined;
          if (descriptionHtml) {
            const tempContainer = document.createElement("div");
            tempContainer.innerHTML = descriptionHtml;
            descriptionText = tempContainer.textContent?.trim();
          }

          return {
            problemNumber: titleMatch[1],
            problemTitle: titleMatch[2],
            href: link.href,
            descriptionHtml,
            descriptionText,
            solutionCode,
            language: detectedLanguage,
            difficulty: detectedDifficulty,
          };
        }

        return null;
      },
    });
    return (result?.result ?? null) as PageProblemDetails | null;
  } catch (error) {
    console.warn(
      "[leetstack] Failed to read LeetCode title from active page",
      error
    );
    return null;
  }
}

function normalizeLeetCodeUrl(url: string): string {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("leetcode.com")) {
      return parsed.toString();
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const problemsIndex = segments.indexOf("problems");
    if (problemsIndex === -1 || problemsIndex + 1 >= segments.length) {
      return parsed.toString();
    }

    const slug = segments[problemsIndex + 1];
    parsed.pathname = `/problems/${slug}/`;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch (error) {
    console.warn("[leetstack] Failed to normalize LeetCode URL", error);
    return url;
  }
}

function extractSlugFromUrl(url: string): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const problemsIndex = segments.indexOf("problems");
    if (problemsIndex === -1 || problemsIndex + 1 >= segments.length) {
      return null;
    }

    return segments[problemsIndex + 1];
  } catch (error) {
    console.warn("[leetstack] Failed to extract slug from url", error);
    return null;
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const STORAGE_KEY = "leetstack.leetPopupState";
const PENDING_EMAIL_STORAGE_KEY = "leetstack.pendingAuthEmail";

interface PopupFormState {
  url: string;
  problemNumber: string;
  title: string;
  description: string;
  code: string;
  notes: string;
  language?: string;
  difficulty?: string;
}

type PopupStorageMap = Record<string, PopupFormState>;

function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to query active tab",
          chrome.runtime.lastError
        );
        resolve(null);
        return;
      }

      resolve(tabs[0] ?? null);
    });
  });
}

function readStoredMap(): Promise<PopupStorageMap> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve({});
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to read popup storage",
          chrome.runtime.lastError
        );
        resolve({});
        return;
      }

      const map = result[STORAGE_KEY];
      if (map && typeof map === "object") {
        resolve(map as PopupStorageMap);
      } else {
        resolve({});
      }
    });
  });
}

function writeStoredMap(map: PopupStorageMap): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: map }, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to persist popup storage",
          chrome.runtime.lastError
        );
      }
      resolve();
    });
  });
}

function readPendingAuthEmail(): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(PENDING_EMAIL_STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to read pending auth email",
          chrome.runtime.lastError
        );
        resolve(null);
        return;
      }

      const value = result?.[PENDING_EMAIL_STORAGE_KEY];
      resolve(typeof value === "string" ? value : null);
    });
  });
}

function storePendingAuthEmail(email: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [PENDING_EMAIL_STORAGE_KEY]: email }, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to persist pending auth email",
          chrome.runtime.lastError
        );
      }
      resolve();
    });
  });
}

function clearPendingAuthEmail(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.storage.local.remove(PENDING_EMAIL_STORAGE_KEY, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to clear pending auth email",
          chrome.runtime.lastError
        );
      }
      resolve();
    });
  });
}

export default function App() {
  const [authStatus, setAuthStatus] = useState<
    | "checking"
    | "sendingOtp"
    | "awaitingOtp"
    | "verifyingOtp"
    | "authenticating"
    | "needsAuth"
    | "authenticated"
  >("checking");
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserPrincipal | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const pendingEmailRef = useRef<string | null>(null);

  const syncPendingEmail = useCallback((value: string | null) => {
    pendingEmailRef.current = value;
    setPendingEmail(value);
  }, []);

  const buildPrincipalFromSupabase =
    useCallback(async (): Promise<UserPrincipal | null> => {
      const { data } = await supabase.auth.getUser();
      const supaUser = data.user;
      if (!supaUser) {
        return null;
      }

      return {
        id: supaUser.id,
        email: supaUser.email ?? null,
        firstName:
          (supaUser.user_metadata?.first_name as string | undefined) ?? null,
        lastName:
          (supaUser.user_metadata?.last_name as string | undefined) ?? null,
        leetstackUsername:
          (supaUser.user_metadata?.username as string | undefined) ?? null,
        createdDate: supaUser.created_at ?? null,
        lastUpdatedDate: supaUser.last_sign_in_at ?? null,
      };
    }, []);

  const ensureSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    let session = data.session;
    if (session && session.expires_at) {
      const expiresAt = session.expires_at * 1000;
      if (expiresAt <= Date.now() + 5000) {
        const refresh = await supabase.auth.refreshSession();
        session = refresh.data.session;
      }
    }
    return session;
  }, []);

  const hydrateUser = useCallback(async () => {
    setAuthStatus("authenticating");
    try {
      const session = await ensureSession();
      if (!session) {
        setCurrentUser(null);
        setAuthStatus(pendingEmailRef.current ? "awaitingOtp" : "needsAuth");
        return;
      }

      const principal = await buildPrincipalFromSupabase();
      if (!principal) {
        setCurrentUser(null);
        setAuthStatus(pendingEmailRef.current ? "awaitingOtp" : "needsAuth");
        return;
      }

      await clearPendingAuthEmail();
      syncPendingEmail(null);
      setOtpInput("");
      setAuthError(null);
      setCurrentUser(principal);
      setAuthStatus("authenticated");
    } catch (error) {
      console.warn("[leetstack] Unable to hydrate Supabase session", error);
      setAuthError("Failed to verify your session. Please try again.");
      setCurrentUser(null);
      setAuthStatus(pendingEmailRef.current ? "awaitingOtp" : "needsAuth");
    }
  }, [buildPrincipalFromSupabase, ensureSession, syncPendingEmail]);

  useEffect(() => {
    let cancelled = false;

    readPendingAuthEmail().then((stored) => {
      if (cancelled) {
        return;
      }
      if (stored) {
        setEmailInput((prev) => prev || stored);
      }
      syncPendingEmail(stored);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) {
        return;
      }
      if (data.session) {
        void hydrateUser();
      } else {
        setAuthStatus(pendingEmailRef.current ? "awaitingOtp" : "needsAuth");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) {
          return;
        }

        if (session) {
          void hydrateUser();
        } else {
          setCurrentUser(null);
          setAuthStatus(pendingEmailRef.current ? "awaitingOtp" : "needsAuth");
        }
      }
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [hydrateUser, syncPendingEmail]);

  const handleSendOtp = useCallback(async () => {
    const email = emailInput.trim();
    if (!email) {
      setAuthError("Email is required");
      return;
    }

    setAuthError(null);
    setAuthStatus("sendingOtp");
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      await storePendingAuthEmail(email);
      syncPendingEmail(email);
      setOtpInput("");
      setAuthStatus("awaitingOtp");
    } catch (error) {
      console.warn("[leetstack] Failed to send OTP", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to send code";
      setAuthError(message);
      setAuthStatus("needsAuth");
    }
  }, [emailInput, syncPendingEmail]);

  const handleVerifyOtp = useCallback(async () => {
    const email = (pendingEmailRef.current ?? emailInput).trim();
    const token = otpInput.trim();
    if (!email) {
      setAuthError("Enter the email where you received the code");
      return;
    }
    if (!token) {
      setAuthError("Enter the 6-digit code from your email");
      return;
    }

    setAuthError(null);
    setAuthStatus("verifyingOtp");
    try {
      await supabase.auth.verifyOtp({ email, token, type: "email" });
      setOtpInput("");
      await hydrateUser();
    } catch (error) {
      console.warn("[leetstack] Failed to verify OTP", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Invalid or expired code";
      setAuthError(message);
      setAuthStatus("awaitingOtp");
    }
  }, [emailInput, otpInput, hydrateUser]);

  const handleResetPending = useCallback(async () => {
    await clearPendingAuthEmail();
    syncPendingEmail(null);
    setEmailInput("");
    setOtpInput("");
    setAuthError(null);
    setAuthStatus("needsAuth");
  }, [syncPendingEmail]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("[leetstack] Failed to sign out", error);
    } finally {
      await clearPendingAuthEmail();
      syncPendingEmail(null);
      setCurrentUser(null);
      setAuthStatus("needsAuth");
    }
  }, [syncPendingEmail]);

  if (authStatus === "authenticated" && currentUser) {
    return <MainContent user={currentUser} onSignOut={handleSignOut} />;
  }

  if (authStatus === "authenticated" && !currentUser) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  if (authStatus === "checking" || authStatus === "authenticating") {
    return <LoadingScreen message="Logging in..." />;
  }

  const authPromptMode =
    authStatus === "awaitingOtp" ? "awaitingOtp" : "enterEmail";
  const promptSubmitting =
    authStatus === "sendingOtp" || authStatus === "verifyingOtp";

  return (
    <AuthPrompt
      mode={authPromptMode}
      emailValue={emailInput}
      pendingEmail={pendingEmail}
      otpValue={otpInput}
      isSubmitting={promptSubmitting}
      errorMessage={authError}
      onEmailChange={setEmailInput}
      onOtpChange={setOtpInput}
      onSendOtp={handleSendOtp}
      onVerifyOtp={handleVerifyOtp}
      onResetPending={handleResetPending}
    />
  );
}
