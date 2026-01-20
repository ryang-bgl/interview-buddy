import { Github, Twitter, Mail, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <img
                src="/assets-shared/leetstack.jpg"
                alt="LeetStack logo"
                className="h-12 w-12 rounded-2xl shadow-xl"
                loading="lazy"
                width="48"
                height="48"
              />
              <span className="text-2xl text-white font-semibold">
                LeetStack
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Save LeetCode solutions, keep System Design notes, and organize Behavioral
              stories. Review everything with AI-powered spaced repetition flashcards.
              Transform interview prep into lasting knowledge.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors hover:-translate-y-1 cursor-pointer"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors hover:-translate-y-1 cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors hover:-translate-y-1 cursor-pointer"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white mb-5 text-lg">Product</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#extension"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block cursor-pointer"
                >
                  Chrome Extension
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white mb-5 text-lg">Company</h4>
            <ul className="space-y-3">
              {/* <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Blog
                </a>
              </li> */}
              <li>
                <a
                  href="/browser-extension-privacy"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block cursor-pointer"
                >
                  Browser Extension Privacy
                </a>
              </li>
              {/* <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Terms of Service
                </a>
              </li> */}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500">
            &copy; 2025 LeetStack. All rights reserved.
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500 fill-current" />{" "}
            for developers
          </p>
        </div>
      </div>
    </footer>
  );
}
