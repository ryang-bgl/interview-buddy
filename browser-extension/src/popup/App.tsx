import { useEffect, useRef, useState, type ReactNode } from 'react'

interface PageProblemDetails {
  problemNumber: string
  problemTitle: string
  href: string
  descriptionHtml?: string
  descriptionText?: string
}

function toPlainText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const text = doc.body.textContent ?? ''
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

async function findLeetCodeProblemDetailsInActivePage(tabId: number): Promise<PageProblemDetails | null> {
  if (typeof chrome === 'undefined' || !chrome.scripting?.executeScript) {
    return null
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const containers = Array.from(document.querySelectorAll('div.text-title-large')) as HTMLElement[]
        for (const container of containers) {
          const link = container.querySelector('a[href^="/problems/"]') as HTMLAnchorElement | null
          if (!link) {
            continue
          }

          const rawText = link.textContent?.trim() ?? ''
          if (!rawText) {
            continue
          }

          const titleMatch = rawText.match(/^(\d+)\.\s*(.+)$/)
          if (!titleMatch) {
            continue
          }

          const nextDataElement = document.getElementById('__NEXT_DATA__')
          let descriptionHtml: string | undefined
          if (nextDataElement?.textContent) {
            try {
              const data = JSON.parse(nextDataElement.textContent)
              const queries = data?.props?.pageProps?.dehydratedState?.queries ?? []
              for (const query of queries) {
                const question = query?.state?.data?.question
                if (question?.content) {
                  descriptionHtml = question.content
                  break
                }
              }
            } catch (error) {
              console.warn('[interview-buddy] Failed to parse __NEXT_DATA__ on page', error)
            }
          }

          if (!descriptionHtml) {
            const descriptionNode = document.querySelector('[data-track-load="description_content"]') as HTMLElement | null
            if (descriptionNode) {
              descriptionHtml = descriptionNode.innerHTML
            }
          }

          let descriptionText: string | undefined
          if (descriptionHtml) {
            const tempContainer = document.createElement('div')
            tempContainer.innerHTML = descriptionHtml
            descriptionText = tempContainer.textContent?.trim()
          }

          return {
            problemNumber: titleMatch[1],
            problemTitle: titleMatch[2],
            href: link.href,
            descriptionHtml,
            descriptionText,
          }
        }

        return null
      },
    })
    return (result?.result ?? null) as PageProblemDetails | null
  } catch (error) {
    console.warn('[interview-buddy] Failed to read LeetCode title from active page', error)
    return null
  }
}

function normalizeLeetCodeUrl(url: string): string {
  if (!url) {
    return ''
  }

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('leetcode.com')) {
      return parsed.toString()
    }

    const segments = parsed.pathname.split('/').filter(Boolean)
    const problemsIndex = segments.indexOf('problems')
    if (problemsIndex === -1 || problemsIndex + 1 >= segments.length) {
      return parsed.toString()
    }

    const slug = segments[problemsIndex + 1]
    parsed.pathname = `/problems/${slug}/`
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch (error) {
    console.warn('[interview-buddy] Failed to normalize LeetCode URL', error)
    return url
  }
}

const STORAGE_KEY = 'interviewBuddy.leetPopupState'

interface PopupFormState {
  url: string
  problemNumber: string
  title: string
  description: string
  code: string
  notes: string
}

type PopupStorageMap = Record<string, PopupFormState>

function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.warn('[interview-buddy] Failed to query active tab', chrome.runtime.lastError)
        resolve(null)
        return
      }

      resolve(tabs[0] ?? null)
    })
  })
}

function readStoredMap(): Promise<PopupStorageMap> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return Promise.resolve({})
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.warn('[interview-buddy] Failed to read popup storage', chrome.runtime.lastError)
        resolve({})
        return
      }

      const map = result[STORAGE_KEY]
      if (map && typeof map === 'object') {
        resolve(map as PopupStorageMap)
      } else {
        resolve({})
      }
    })
  })
}

function writeStoredMap(map: PopupStorageMap): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: map }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[interview-buddy] Failed to persist popup storage', chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

interface FieldLabelProps {
  label: string
  children: ReactNode
  hint?: string
}

function FieldLabel({ label, hint, children }: FieldLabelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        {hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

const codeDefaultValue = `function twoSum(nums, target) {\n  const map = new Map();\n\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n\n    map.set(nums[i], i);\n  }\n}`

export default function App() {
  const [problemNumber, setProblemNumber] = useState('')
  const [problemLink, setProblemLink] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [codeInput, setCodeInput] = useState(codeDefaultValue)
  const [notesInput, setNotesInput] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const storageCacheRef = useRef<PopupStorageMap>({})
  console.log("====storageKey222");

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      const storedMap = await readStoredMap()
      if (cancelled) {
        return
      }
      storageCacheRef.current = storedMap

      const tab = await getActiveTab()
      if (cancelled) {
        return
      }

      const tabUrl = tab?.url ?? ''
      const tabId = tab?.id
      const normalizedTabUrl = tabUrl ? normalizeLeetCodeUrl(tabUrl) : ''
      const storageKey = normalizedTabUrl || tabUrl

      console.log("====storageKey", storageKey);
      if (storageKey) {
        setCurrentUrl(storageKey)
        setProblemLink(storageKey)
        const storedState = storedMap[storageKey]
        if (storedState) {
          setProblemNumber(storedState.problemNumber)
          setTitleInput(storedState.title)
          setDescriptionInput(storedState.description)
          setCodeInput(storedState.code ?? codeDefaultValue)
          setNotesInput(storedState.notes ?? '')
          setIsInitialized(true)
          return
        }
      }

      if (tabId === undefined) {
        setIsInitialized(true)
        return
      }

      try {
        const pageDetails = await findLeetCodeProblemDetailsInActivePage(tabId)
        if (cancelled || !pageDetails) {
          setIsInitialized(true)
          return
        }

        const normalizedUrl = normalizeLeetCodeUrl(pageDetails.href || tabUrl || '')
        const key = normalizedUrl || storageKey
        if (key) {
          setCurrentUrl(key)
          setProblemLink(key)
        }

        setProblemNumber(pageDetails.problemNumber)
        setTitleInput(pageDetails.problemTitle)

        const description = pageDetails.descriptionHtml
          ? toPlainText(pageDetails.descriptionHtml)
          : pageDetails.descriptionText ?? ''
        setDescriptionInput(description)
        setCodeInput(codeDefaultValue)
        setNotesInput('')

        if (key) {
          const updatedMap = {
            ...storageCacheRef.current,
            [key]: {
              url: key,
              problemNumber: pageDetails.problemNumber,
              title: pageDetails.problemTitle,
              description: description || '',
              code: codeDefaultValue,
              notes: '',
            },
          }
          storageCacheRef.current = updatedMap
          await writeStoredMap(updatedMap)
        }
      } catch (error) {
        console.warn('[interview-buddy] Unable to discover LeetCode title', error)
      } finally {
        if (!cancelled) {
          setIsInitialized(true)
        }
      }
    }

    void initialize()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!currentUrl || !isInitialized) {
      return
    }

    const state: PopupFormState = {
      url: currentUrl,
      problemNumber,
      title: titleInput,
      description: descriptionInput,
      code: codeInput,
      notes: notesInput,
    }

    storageCacheRef.current = {
      ...storageCacheRef.current,
      [currentUrl]: state,
    }

    const timeoutId = window.setTimeout(() => {
      void writeStoredMap(storageCacheRef.current)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentUrl, problemNumber, titleInput, descriptionInput, codeInput, notesInput, isInitialized])

  const headerProblemLabel = problemNumber ? `Problem #${problemNumber}` : 'Problem'
  const headerTitleText = titleInput || 'Open a LeetCode problem to capture details.'
  const headerLink = problemLink

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-[540px] max-w-full rounded-3xl bg-white p-8 shadow-dialog">
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-1 items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m6 1v5h5"
                />
                <path
                  fill="currentColor"
                  d="M8 14h8v2H8zm0 3h5v2H8z"
                />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <h1 className="text-xl font-semibold text-slate-900">
                Save to InterviewBuddy
                {}
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

        <section className="mt-6 space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-blue-600">
                  <span>{headerProblemLabel}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                    Easy
                  </span>
                </div>
                <div className="text-sm text-slate-700">{headerTitleText}</div>
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
                  <span className="text-sm text-slate-500">No problem link detected.</span>
                )}
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-500 shadow-sm">
                JavaScript
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
              onChange={(event) => setDescriptionInput(event.target.value)}
              placeholder="Problem description"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </FieldLabel>
          <FieldLabel label="Your Solution Code">
            <textarea
              rows={9}
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
            />
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

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm text-slate-500">Ready to save...</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Save to InterviewBuddy
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
