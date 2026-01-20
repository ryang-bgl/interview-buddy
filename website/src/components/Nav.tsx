import { LogIn } from "lucide-react";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/assets-shared/leetstack.jpg"
              alt="LeetStack logo"
              className="h-8 w-8 rounded-xl shadow-lg"
              loading="lazy"
              width="32"
              height="32"
            />
            <span className="text-xl text-white font-semibold">
              LeetStack
            </span>
          </div>

          {/* Login button */}
          <a
            href="https://web.leetstack.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-sky-500/30 transition-all duration-300 font-medium"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
