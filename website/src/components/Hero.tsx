import {
  Code2,
  Cloud,
  BookOpen,
  TrendingUp,
  Users,
  CheckCircle2,
} from "lucide-react";
import { JoinWaitlist } from "./JoinWaitlist";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements - professional blue tones */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img
              src="/assets-shared/leetstack.jpg"
              alt="LeetStack logo"
              className="h-14 w-14 rounded-2xl shadow-xl"
              loading="lazy"
              width="56"
              height="56"
            />
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold">
                Spaced Repetition for All Your Interview Prep
              </span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl max-w-5xl mx-auto text-white mb-6 leading-tight" id="main-heading">
            One Place for All Your
            <span className="block bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Interview Preparation
            </span>
          </h1>

          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:justify-center">
            <div className="flex flex-col items-center gap-2">
              <a
                href="https://chromewebstore.google.com/detail/leetstack/npflknpllcpnddnhpdkmdjnlomfgmjph"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full min-w-[200px] px-6 py-5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-xl hover:shadow-2xl hover:shadow-sky-500/50 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <img
                  src="/assets/chrome.svg"
                  alt="Chrome Web Store logo"
                  className="w-5 h-5"
                  width="20"
                  height="20"
                />
                <span className="font-medium">Install Extension</span>
                <Code2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </a>
            </div>
            <div className="flex flex-col items-center gap-2">
              <a
                href="https://web.leetstack.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-w-[200px] px-6 py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Review & Practice</span>
              </a>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-xl text-slate-200 leading-relaxed mb-6">
              Save{" "}
              <span className="text-sky-300 font-semibold">LeetCode solutions</span> in one click.
              Keep <span className="text-violet-300 font-semibold">System Design</span> and{" "}
              <span className="text-amber-300 font-semibold">Behavioral Questions</span> notes organized.
              Review everything with spaced repetition flashcards.
            </p>

            {/* Three product pillars */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-lg border border-slate-600/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Complete Interview Prep System</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-200">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-sky-400" />
                    <span className="font-semibold text-white">DSA</span>
                  </div>
                  <span className="text-sm text-center">Review LeetCode with spaced repetition</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-violet-400" />
                    <span className="font-semibold text-white">System Design</span>
                  </div>
                  <span className="text-sm text-center">Organize notes, auto-generate flashcards</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-white">Behavioral</span>
                  </div>
                  <span className="text-sm text-center">Keep stories, review with flashcards</span>
                </div>
              </div>
            </div>

            <p className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-slate-50 to-emerald-200 font-semibold text-lg">
              Stop forgetting what you studied. Enter interviews with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            <div className="group bg-gradient-to-br from-sky-500/10 to-cyan-500/10 backdrop-blur-lg p-8 rounded-2xl border border-sky-500/20 hover:border-sky-500/40 transition-colors hover:shadow-xl hover:shadow-sky-500/20 cursor-pointer text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center mb-5 mx-auto">
                <Code2 className="w-7 h-7 text-white" />
              </div>
              <div className="text-xl text-white mb-2">One-Click Save</div>
              <p className="text-slate-400">
                Capture LeetCode solutions with code, notes, and problem details
              </p>
            </div>

            <div className="group bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-lg p-8 rounded-2xl border border-violet-500/20 hover:border-violet-500/40 transition-colors hover:shadow-xl hover:shadow-violet-500/20 cursor-pointer text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center mb-5 mx-auto">
                <Cloud className="w-7 h-7 text-white" />
              </div>
              <div className="text-xl text-white mb-2">Notes Hub</div>
              <p className="text-slate-400">
                Keep System Design & Behavioral notes organized in one place
              </p>
            </div>

            <div className="group bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-lg p-8 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/40 transition-colors hover:shadow-xl hover:shadow-emerald-500/20 cursor-pointer text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center mb-5 mx-auto">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="text-xl text-white mb-2">Smart Flashcards</div>
              <p className="text-slate-400">
                AI converts your notes into review cards at optimal intervals
              </p>
            </div>
          </div>

          {/* Question types badges */}
          <div className="flex flex-wrap gap-4 justify-center max-w-3xl mx-auto">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 backdrop-blur-lg border border-sky-400/30 rounded-full">
              <Code2 className="w-5 h-5 text-sky-300" />
              <span className="text-white font-medium">
                Data Structures & Algorithms
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-lg border border-violet-400/30 rounded-full">
              <TrendingUp className="w-5 h-5 text-violet-300" />
              <span className="text-white font-medium">System Design Notes</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-lg border border-emerald-400/30 rounded-full">
              <BookOpen className="w-5 h-5 text-emerald-300" />
              <span className="text-white font-medium">
                AI Flashcards
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-lg border border-amber-400/30 rounded-full">
              <Users className="w-5 h-5 text-amber-300" />
              <span className="text-white font-medium">
                Behavioral Questions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
