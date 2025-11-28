import { useEffect, useState } from "react";
import { Route, Routes, Navigate, Outlet, NavLink } from "react-router-dom";
import { observer } from "mobx-react-lite";
import LoginView from "@/views/LoginView";
import DashboardView from "@/views/DashboardView";
import ProblemsView from "@/views/ProblemsView";
import ProblemDetailView from "@/views/ProblemDetailView";
import ProblemReviewView from "@/views/ProblemReviewView";
import NotesView from "@/views/NotesView";
import NoteDetailView from "@/views/NoteDetailView";
import ReviewView from "@/views/ReviewView";
import SettingsView from "@/views/SettingsView";
import { useStores } from "@/stores/StoreProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookMarked,
  LayoutDashboard,
  Menu,
  Settings,
  StickyNote,
  Workflow,
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/problems", label: "DSA Problems", icon: Workflow },
  { path: "/notes", label: "Notes & Cards", icon: StickyNote },
  { path: "/review", label: "Review Session", icon: BookMarked },
  { path: "/settings", label: "Settings", icon: Settings },
];

const ProtectedShell = observer(() => {
  const { loginStore, notebookStore } = useStores();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  if (!loginStore.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  useEffect(() => {
    if (loginStore.isAuthenticated) {
      void notebookStore.refreshAll();
    }
  }, [loginStore.isAuthenticated, notebookStore]);
  const closeMobileNav = () => setMobileNavOpen(false);
  const userLabel = loginStore.user?.email ?? loginStore.email;
  return (
    <div className="grid min-h-screen bg-slate-950 text-white lg:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col border-r border-white/5 bg-slate-950/80 px-6 py-8 lg:flex">
        <div className="space-y-1">
          <p className="text-xl font-semibold">LeetStack</p>
        </div>
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-white/5",
                  isActive ? "bg-white/10 text-white" : "text-white/70"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
          <p className="font-semibold text-white">Signed in</p>
          <p className="truncate">{userLabel}</p>
        </div>
      </aside>

      <div className="flex flex-col bg-gradient-to-b from-white to-slate-50 text-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle navigation"
              className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-700 lg:hidden"
              onClick={() => setMobileNavOpen((value) => !value)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm text-muted-foreground">Notebook workspace</p>
              <h1 className="text-lg font-semibold">Ship smarter practice sessions</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                {userLabel || "Active session"}
              </p>
              <p>Private beta</p>
            </div>
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
              'fixed inset-0 z-30 bg-slate-950/60 transition-opacity duration-200',
              mobileNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            )}
            onClick={closeMobileNav}
          />
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-40 w-72 max-w-[80%] border-r border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-200',
              mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
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
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
                      isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
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
        <Route path="/review/problems/:problemId" element={<ProblemReviewView />} />
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
