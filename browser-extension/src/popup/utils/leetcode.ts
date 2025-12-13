import type { PageProblemDetails } from "../types";

export function toPlainText(html: string): string {
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

export async function findLeetCodeProblemDetailsInActivePage(
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
            if (normalized.includes("easy") || normalized.includes("difficulty-easy")) {
              return "Easy";
            }
            if (normalized.includes("medium") || normalized.includes("difficulty-medium")) {
              return "Medium";
            }
            if (normalized.includes("hard") || normalized.includes("difficulty-hard")) {
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
              const nested = inspectNode(sibling);
              if (nested) {
                return nested;
              }
              const directText = normalizeDifficulty(sibling.textContent);
              if (directText) {
                return directText;
              }
            }

            return inspectNode(primarySibling);
          };

          const detectLanguage = (): string | undefined => {
            const node = document.querySelector<HTMLElement>("#editor button");
            const text = node?.textContent?.trim();
            if (text) {
              return text;
            }
            return undefined;
          };

          const readIndexedDbSolution = (
            problemNum: string,
            language?: string
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
                    const languageMap: Record<string, string> = {
                      typescript: "typescript",
                      java: "java",
                      "c++": "cpp",
                      python: "python",
                    };

                    const normalizedLanguage = language?.toLowerCase();
                    const languageKey =
                      normalizedLanguage && normalizedLanguage in languageMap
                        ? languageMap[normalizedLanguage]
                        : undefined;
                    if (
                      key.endsWith(suffix) ||
                      !key.startsWith(`${normalizedProblemNum}_`)
                    ) {
                      cursor.continue();
                      return;
                    }

                    if (languageKey && key.indexOf(languageKey) < 0) {
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

          console.log("======", detectedLanguage);
          try {
            const indexed = await readIndexedDbSolution(
              titleMatch[1],
              detectedLanguage
            );
            if (indexed?.code) {
              solutionCode = indexed.code;
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

          console.log("======detectedLanguage", detectedLanguage);

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

export function normalizeLeetCodeUrl(url: string): string {
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

export function extractSlugFromUrl(url: string): string | null {
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

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
