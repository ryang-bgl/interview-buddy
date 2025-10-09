import { useMemo, type ReactNode } from 'react'

const programmingLanguages = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'Go',
]

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
  const codeCharCount = useMemo(() => codeDefaultValue.length, [])

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
                Save Solution to InterviewBuddy
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
                  <span>Problem #1</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                    Easy
                  </span>
                </div>
                <a
                  href="https://leetcode.com/problems/two-sum"
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-slate-600 underline-offset-2 hover:underline"
                >
                  https://leetcode.com/problems/two-sum
                </a>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-500 shadow-sm">
                JavaScript
              </span>
            </div>
          </div>

          <FieldLabel label="Problem Title">
            <input
              type="text"
              defaultValue="Two Sum"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </FieldLabel>

          <FieldLabel label="Programming Language" hint={`<> ${codeCharCount} characters`}>
            <div className="relative flex items-center">
              <select
                defaultValue="JavaScript"
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {programmingLanguages.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.085l3.71-3.854a.75.75 0 0 1 1.08 1.04l-4.25 4.415a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06" />
                </svg>
              </span>
            </div>
          </FieldLabel>

          <FieldLabel label="Your Solution Code">
            <textarea
              rows={9}
              defaultValue={codeDefaultValue}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
            />
          </FieldLabel>

          <FieldLabel label="Personal Notes (Optional)">
            <textarea
              rows={3}
              placeholder="e.g., Remember the hashmap trick, time complexity is O(n)..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </FieldLabel>

          <FieldLabel label="Problem Description">
            <textarea
              rows={3}
              defaultValue="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
