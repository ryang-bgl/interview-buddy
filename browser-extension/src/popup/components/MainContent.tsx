import { useEffect, useState } from "react";
import type { UserPrincipal } from "@/lib/api";
import GeneralNotesTab from "./GeneralNotesTab";
import DsaNotebookTab from "./DsaNotebookTab";
import { isLeetCodeDomain } from "../utils/leetcode";

interface MainContentProps {
  user: UserPrincipal;
  onSignOut: () => void;
}

export default function MainContent({ user, onSignOut }: MainContentProps) {
  const [currentUrl, setCurrentUrl] = useState("");
  const userDisplayName = user.firstName || user.email || "LeetStack member";

  // Get current URL for domain detection
  useEffect(() => {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          setCurrentUrl(tab.url);
        }
      } catch (error) {
        console.warn("[leetstack] Unable to get current tab URL", error);
      }
    })();
  }, []);

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
          <div className="flex items-center gap-2">
            <a
              href="https://web.leetstack.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              Web Portal
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <path d="M15 3h6v6" />
                <path d="M10 14L21 3" />
              </svg>
            </a>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {isLeetCodeDomain(currentUrl) ? (
            <DsaNotebookTab />
          ) : (
            <GeneralNotesTab />
          )}
        </div>
      </div>
    </div>
  );
}
