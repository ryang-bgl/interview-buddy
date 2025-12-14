import { useEffect, useState } from "react";
import { Route, Routes, Navigate, Outlet, NavLink } from "react-router-dom";
import { observer } from "mobx-react-lite";
import LoginView from "@/features/auth/LoginView";
import DashboardView from "@/features/dashboard/DashboardView";
import ProblemsView from "@/features/problems/ProblemsView";
import ProblemDetailView from "@/features/problems/ProblemDetailView";
import ProblemReviewView from "@/features/problems/ProblemReviewView";
import NotesView from "@/features/notes/NotesView";
import NoteDetailView from "@/features/notes/NoteDetailView";
import ReviewView from "@/features/review/ReviewView";
import SettingsView from "@/features/settings/SettingsView";
import { FeedbackWidget } from "@/features/feedback/FeedbackWidget";
import { useStores } from "@/stores/StoreProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookMarked,
  Moon,
  Sun,
  LayoutDashboard,
  Menu,
  Settings,
  StickyNote,
  Workflow,
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/problems", label: "DSA Problems", icon: Workflow },
  { path: "/notes", label: "Notes & Cards", icon: StickyNote },
  { path: "/review", label: "Review Session", icon: BookMarked },
  { path: "/settings", label: "Settings", icon: Settings },
];

const ProtectedShell = observer(() => {
  const { loginStore, notebookStore } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (loginStore.isAuthenticated) {
      void notebookStore.refreshAll();
    }
  }, [loginStore.isAuthenticated, notebookStore]);

  if (!loginStore.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const closeMobileNav = () => setMobileNavOpen(false);
  const userLabel = loginStore.user?.email ?? loginStore.email;
  return (
    <div
      className={cn(
        "grid min-h-screen text-slate-900 dark:text-slate-100 lg:grid-cols-[260px_1fr]",
        theme === "dark"
          ? "bg-[#0f172a]"
          : "bg-gradient-to-br from-[#f8f9fe] to-[#eef2ff]"
      )}
    >
      <aside
        className={cn(
          "hidden flex-col border-r px-6 py-8 lg:flex",
          theme === "dark"
            ? "border-[#1f2a40] bg-[#1c2640]"
            : "border-slate-200"
        )}
      >
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
            Nail dream offer
          </p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">
            LeetStack (beta)
          </p>
        </div>
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            Signed in
          </p>
          <p className="truncate">{userLabel}</p>
        </div>
      </aside>

      <div
        className={cn(
          theme === "dark"
            ? "flex flex-col bg-[#111a2c]/90"
            : "flex flex-col bg-transparent"
        )}
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
          <button
            type="button"
            aria-label="Toggle navigation"
            className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-700 dark:border-slate-700 dark:text-slate-200 lg:hidden"
            onClick={() => setMobileNavOpen((value) => !value)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-200"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loginStore.signOut()}
            >
              Sign out
            </Button>
          </div>
        </header>
        <div className="lg:hidden">
          <div
            className={cn(
              "fixed inset-0 z-30 bg-slate-950/60 transition-opacity duration-200",
              mobileNavOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            )}
            onClick={closeMobileNav}
          />
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-72 max-w-[80%] border-r border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900",
              mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileNav}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                        : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>
      <FeedbackWidget />
    </div>
  );
});

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route element={<ProtectedShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/problems" element={<ProblemsView />} />
        <Route path="/problems/:problemId" element={<ProblemDetailView />} />
        <Route
          path="/review/problems/:problemId"
          element={<ProblemReviewView />}
        />
        <Route path="/notes" element={<NotesView />} />
        <Route path="/notes/:noteId" element={<NoteDetailView />} />
        <Route path="/review" element={<ReviewView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
