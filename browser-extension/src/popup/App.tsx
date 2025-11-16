import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { checkSession, saveUserDsaQuestion, type UserPrincipal } from '@/lib/api'

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
              console.warn('[leetstack] Failed to parse __NEXT_DATA__ on page', error)
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
    console.warn('[leetstack] Failed to read LeetCode title from active page', error)
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
    console.warn('[leetstack] Failed to normalize LeetCode URL', error)
    return url
  }
}

function extractSlugFromUrl(url: string): string | null {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    const problemsIndex = segments.indexOf('problems')
    if (problemsIndex === -1 || problemsIndex + 1 >= segments.length) {
      return null
    }

    return segments[problemsIndex + 1]
  } catch (error) {
    console.warn('[leetstack] Failed to extract slug from url', error)
    return null
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const STORAGE_KEY = 'leetstack.leetPopupState'
const PENDING_EMAIL_STORAGE_KEY = 'leetstack.pendingAuthEmail'

interface PopupFormState {
  url: string
  problemNumber: string
  title: string
  description: string
  code: string
  idealSolutionCode: string
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
        console.warn('[leetstack] Failed to query active tab', chrome.runtime.lastError)
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
        console.warn('[leetstack] Failed to read popup storage', chrome.runtime.lastError)
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
        console.warn('[leetstack] Failed to persist popup storage', chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

function readPendingAuthEmail(): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(PENDING_EMAIL_STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.warn('[leetstack] Failed to read pending auth email', chrome.runtime.lastError)
        resolve(null)
        return
      }

      const value = result?.[PENDING_EMAIL_STORAGE_KEY]
      resolve(typeof value === 'string' ? value : null)
    })
  })
}

function storePendingAuthEmail(email: string): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [PENDING_EMAIL_STORAGE_KEY]: email }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[leetstack] Failed to persist pending auth email', chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

function clearPendingAuthEmail(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    chrome.storage.local.remove(PENDING_EMAIL_STORAGE_KEY, () => {
      if (chrome.runtime.lastError) {
        console.warn('[leetstack] Failed to clear pending auth email', chrome.runtime.lastError)
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


function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-[360px] max-w-full rounded-3xl bg-white p-8 text-center shadow-dialog">
        <div className="text-sm font-semibold text-slate-900">{message}</div>
        <div className="mt-3 text-xs text-slate-500">This should only take a moment.</div>
      </div>
    </div>
  )
}

interface AuthPromptProps {
  mode: 'enterEmail' | 'awaitingOtp'
  emailValue: string
  pendingEmail?: string | null
  otpValue: string
  isSubmitting: boolean
  errorMessage?: string | null
  onEmailChange: (value: string) => void
  onOtpChange: (value: string) => void
  onSendOtp: () => void
  onVerifyOtp: () => void
  onResetPending: () => void
}

function AuthPrompt({
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
  const buttonLabel = isSubmitting ? 'Sending code...' : 'Send login code'
  const finalizeLabel = isSubmitting ? 'Verifying…' : 'Verify code'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-[420px] max-w-full rounded-3xl bg-white p-8 shadow-dialog">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">Connect LeetStack</h1>
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

          {mode === 'enterEmail' ? (
            <div className="space-y-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Work Email</span>
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
              <p className="text-sm text-slate-600">
                We emailed a one-time code to <span className="font-semibold text-slate-900">{pendingEmail ?? emailValue}</span>.
                Enter the 6-digit code to finish signing in.
              </p>
              <input
                type="text"
                value={otpValue}
                onChange={(event) => onOtpChange(event.target.value)}
                placeholder="Enter the 6-digit code"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 tracking-widest text-center"
                inputMode="numeric"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onVerifyOtp}
                  disabled={isSubmitting || !otpValue.trim()}
                  className="flex-1 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {finalizeLabel}
                </button>
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
  )
}

const codeDefaultValue = `function twoSum(nums, target) {\n  const map = new Map();\n\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n\n    map.set(nums[i], i);\n  }\n}`

function MainContent({ user, onSignOut }: { user: UserPrincipal; onSignOut: () => void }) {
  const [problemNumber, setProblemNumber] = useState('')
  const [problemLink, setProblemLink] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [codeInput, setCodeInput] = useState(codeDefaultValue)
  const [idealSolutionCodeInput, setIdealSolutionCodeInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const storageCacheRef = useRef<PopupStorageMap>({})
  const initialStateRef = useRef<PopupFormState | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedTitle, setLastSavedTitle] = useState<string | null>(null)
  const isSaving = saveState === 'saving'
  const userDisplayName = user.firstName || user.email || 'LeetStack member'

  const applyFormState = useCallback((state: PopupFormState) => {
    setProblemNumber(state.problemNumber ?? '')
    setProblemLink(state.url ?? '')
    setTitleInput(state.title ?? '')
    setDescriptionInput(state.description ?? '')
    setCodeInput(state.code ?? codeDefaultValue)
    setIdealSolutionCodeInput(state.idealSolutionCode ?? '')
    setNotesInput(state.notes ?? '')
  }, [])

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

      if (storageKey) {
        setCurrentUrl(storageKey)
        setProblemLink(storageKey)
        const storedState = storedMap[storageKey]
        if (storedState) {
          const snapshot: PopupFormState = {
            url: storedState.url,
            problemNumber: storedState.problemNumber,
            title: storedState.title,
            description: storedState.description,
            code: storedState.code,
            idealSolutionCode: storedState.idealSolutionCode ?? '',
            notes: storedState.notes ?? '',
          }
          applyFormState(snapshot)
          initialStateRef.current = { ...snapshot }
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

        const description = pageDetails.descriptionHtml
          ? toPlainText(pageDetails.descriptionHtml)
          : pageDetails.descriptionText ?? ''
        const initialState: PopupFormState = {
          url: key || pageDetails.href || '',
          problemNumber: pageDetails.problemNumber ?? '',
          title: pageDetails.problemTitle ?? '',
          description: description || '',
          code: codeDefaultValue,
          idealSolutionCode: '',
          notes: '',
        }

        applyFormState(initialState)
        initialStateRef.current = { ...initialState }

        if (key) {
          const updatedMap = {
            ...storageCacheRef.current,
            [key]: initialState,
          }
          storageCacheRef.current = updatedMap
          await writeStoredMap(updatedMap)
        }
      } catch (error) {
        console.warn('[leetstack] Unable to discover LeetCode title', error)
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
      idealSolutionCode: idealSolutionCodeInput,
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
  }, [
    currentUrl,
    problemNumber,
    titleInput,
    descriptionInput,
    codeInput,
    idealSolutionCodeInput,
    notesInput,
    isInitialized,
  ])

  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.close()
    }
  }, [])

  const handleCancel = useCallback(() => {
    const baseline = initialStateRef.current ?? {
      url: currentUrl,
      problemNumber: '',
      title: '',
      description: '',
      code: codeDefaultValue,
      idealSolutionCode: '',
      notes: '',
    }

    const snapshot: PopupFormState = { ...baseline }
    applyFormState(snapshot)

    if (currentUrl) {
      storageCacheRef.current = {
        ...storageCacheRef.current,
        [currentUrl]: snapshot,
      }
      void writeStoredMap(storageCacheRef.current)
    }

    initialStateRef.current = snapshot
    setSaveState('idle')
    setSaveError(null)
    setLastSavedTitle(null)
  }, [currentUrl])

  const handleSave = async () => {
    const trimmedTitle = titleInput.trim() || (problemNumber ? `LeetCode Problem ${problemNumber}` : 'Untitled Problem')
    const slugFromUrl = extractSlugFromUrl(problemLink)
    const derivedSlug = slugFromUrl || slugify(trimmedTitle)
    const fallbackSlug = problemNumber ? `problem-${problemNumber}` : `problem-${Date.now()}`
    const titleSlug = derivedSlug || fallbackSlug
    const description = descriptionInput.trim() || 'No description provided.'
    const solution = codeInput.trim() || null
    const idealSolutionCode = idealSolutionCodeInput.trim() || null
    const note = notesInput.trim() || null

    setSaveState('saving')
    setSaveError(null)
    setLastSavedTitle(null)

    try {
      const response = await saveUserDsaQuestion({
        title: trimmedTitle,
        titleSlug,
        difficulty: 'Unknown',
        isPaidOnly: false,
        description,
        solution,
        idealSolutionCode,
        note,
        exampleTestcases: null,
      })

      setSaveState('success')
      setLastSavedTitle(response.title)
      if (currentUrl) {
        const snapshot: PopupFormState = {
          url: currentUrl,
          problemNumber,
          title: titleInput,
          description: descriptionInput,
          code: codeInput,
          idealSolutionCode: idealSolutionCodeInput,
          notes: notesInput,
        }
        initialStateRef.current = { ...snapshot }
        storageCacheRef.current = {
          ...storageCacheRef.current,
          [currentUrl]: snapshot,
        }
        void writeStoredMap(storageCacheRef.current)
      }
      window.setTimeout(() => {
        setSaveState('idle')
        setLastSavedTitle(null)
      }, 4000)
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Failed to save problem'
      setSaveError(message)
      setSaveState('error')
    }
  }

  const headerProblemLabel = problemNumber ? `Problem #${problemNumber}` : 'Problem'
  const headerTitleText = titleInput || 'Open a LeetCode problem to capture details.'
  const headerLink = problemLink
  const statusMessage = (() => {
    if (saveState === 'saving') {
      return 'Saving problem...'
    }
    if (saveState === 'success') {
      return lastSavedTitle ? `Saved "${lastSavedTitle}"` : 'Problem saved'
    }
    if (saveState === 'error' && saveError) {
      return saveError
    }
    return 'Ready to save...'
  })()
  const statusMessageClassName = (() => {
    if (saveState === 'error') {
      return 'text-red-600'
    }
    if (saveState === 'success') {
      return 'text-green-600'
    }
    if (saveState === 'saving') {
      return 'text-blue-600'
    }
    return 'text-slate-500'
  })()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-[540px] max-w-full rounded-3xl bg-white p-8 shadow-dialog">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Signed in as</p>
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
                Save to LeetStack
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

          <FieldLabel label="Ideal Solution Code" hint="Capture the canonical or editorial implementation">
            <textarea
              rows={6}
              value={idealSolutionCodeInput}
              onChange={(event) => setIdealSolutionCodeInput(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
              placeholder="Paste the optimal solution for quick reference"
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
          <span className={`text-sm ${statusMessageClassName}`}>{statusMessage}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save to LeetStack'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function App() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'sendingOtp' | 'awaitingOtp' | 'verifyingOtp' | 'authenticating' | 'needsAuth' | 'authenticated'>('checking')
  const [authError, setAuthError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserPrincipal | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const pendingEmailRef = useRef<string | null>(null)

  const syncPendingEmail = useCallback((value: string | null) => {
    pendingEmailRef.current = value
    setPendingEmail(value)
  }, [])

  const hydrateUser = useCallback(async () => {
    setAuthStatus('authenticating')
    try {
      const principal = await checkSession()
      if (principal) {
        await clearPendingAuthEmail()
        syncPendingEmail(null)
        setOtpInput('')
        setAuthError(null)
        setCurrentUser(principal)
        setAuthStatus('authenticated')
      } else {
        setCurrentUser(null)
        setAuthStatus(pendingEmailRef.current ? 'awaitingOtp' : 'needsAuth')
      }
    } catch (error) {
      console.warn('[leetstack] Failed to hydrate user session', error)
      setAuthError('Could not verify your session. Please try again.')
      setCurrentUser(null)
      setAuthStatus(pendingEmailRef.current ? 'awaitingOtp' : 'needsAuth')
    }
  }, [syncPendingEmail])

  useEffect(() => {
    let cancelled = false

    readPendingAuthEmail().then((stored) => {
      if (cancelled) {
        return
      }
      if (stored) {
        setEmailInput((prev) => prev || stored)
      }
      syncPendingEmail(stored)
    })

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) {
        return
      }
      if (data.session) {
        void hydrateUser()
      } else {
        setAuthStatus(pendingEmailRef.current ? 'awaitingOtp' : 'needsAuth')
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) {
        return
      }

      if (session) {
        void hydrateUser()
      } else {
        setCurrentUser(null)
        setAuthStatus(pendingEmailRef.current ? 'awaitingOtp' : 'needsAuth')
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [hydrateUser, syncPendingEmail])

  const handleSendOtp = useCallback(async () => {
    const email = emailInput.trim()
    if (!email) {
      setAuthError('Email is required')
      return
    }

    setAuthError(null)
    setAuthStatus('sendingOtp')
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })
      await storePendingAuthEmail(email)
      syncPendingEmail(email)
      setOtpInput('')
      setAuthStatus('awaitingOtp')
    } catch (error) {
      console.warn('[leetstack] Failed to send OTP', error)
      const message = error instanceof Error && error.message ? error.message : 'Unable to send code'
      setAuthError(message)
      setAuthStatus('needsAuth')
    }
  }, [emailInput, syncPendingEmail])

  const handleVerifyOtp = useCallback(async () => {
    const email = (pendingEmailRef.current ?? emailInput).trim()
    const token = otpInput.trim()
    if (!email) {
      setAuthError('Enter the email where you received the code')
      return
    }
    if (!token) {
      setAuthError('Enter the 6-digit code from your email')
      return
    }

    setAuthError(null)
    setAuthStatus('verifyingOtp')
    try {
      await supabase.auth.verifyOtp({ email, token, type: 'email' })
      setOtpInput('')
    } catch (error) {
      console.warn('[leetstack] Failed to verify OTP', error)
      const message = error instanceof Error && error.message ? error.message : 'Invalid or expired code'
      setAuthError(message)
      setAuthStatus('awaitingOtp')
    }
  }, [emailInput, otpInput])

  const handleResetPending = useCallback(async () => {
    await clearPendingAuthEmail()
    syncPendingEmail(null)
    setEmailInput('')
    setOtpInput('')
    setAuthError(null)
    setAuthStatus('needsAuth')
  }, [syncPendingEmail])

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('[leetstack] Failed to sign out', error)
    } finally {
      await clearPendingAuthEmail()
      syncPendingEmail(null)
      setCurrentUser(null)
      setAuthStatus('needsAuth')
    }
  }, [syncPendingEmail])

  if (authStatus === 'authenticated' && currentUser) {
    return <MainContent user={currentUser} onSignOut={handleSignOut} />
  }

  if (authStatus === 'authenticated' && !currentUser) {
    return <LoadingScreen message="Loading your profile..." />
  }

  if (authStatus === 'checking') {
    return <LoadingScreen message="Checking your session..." />
  }

  const authPromptMode = authStatus === 'awaitingOtp' ? 'awaitingOtp' : 'enterEmail'
  const promptSubmitting = authStatus === 'sendingOtp' || authStatus === 'verifyingOtp'

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
  )
}
