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
              />
              <span className="text-2xl text-white font-semibold">
                LeetStack
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Save LeetCode solutions with our Chrome extension and master them
              through spaced repetition on mobile. Transform problem-solving
              into lasting knowledge.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all hover:-translate-y-1"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all hover:-translate-y-1"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all hover:-translate-y-1"
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
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Chrome Extension
                </a>
              </li>
              <li>
                <a
                  href="#mobile"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Mobile App
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white mb-5 text-lg">Company</h4>
            <ul className="space-y-3">
              <li>
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
              </li>
              <li>
                <a
                  href="/browser-extension-privacy"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Browser Extension Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors hover:translate-x-1 inline-block"
                >
                  Terms of Service
                </a>
              </li>
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
