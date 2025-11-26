import {
  Chrome,
  Smartphone,
  Zap,
  Sparkles,
  TrendingUp,
  Cloud,
  BookOpen,
  Code2,
  Users,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white">
              One Click. Cloud Sync. Mobile Review.
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl max-w-5xl mx-auto text-white mb-6 leading-tight">
            Master Interview Questions,
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Ace Your Tech Interview
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-xl text-gray-300 mb-12 leading-relaxed">
            One-click to save your notes for{" "}
            <span className="text-purple-300 font-semibold">DSA</span>, turn the{" "}
            <span className="text-pink-300 font-semibold">System Design</span>,
            or{" "}
            <span className="text-indigo-300 font-semibold">
              Behavioral questions
            </span>{" "}
            into flashcards powered by the AI. Sync to the cloud and review on
            mobile apps on the go. Master all the questions you need.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <button className="group px-8 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-3 transform hover:scale-105">
              <Chrome className="w-5 h-5" />
              <span className="font-medium">Install Chrome Extension</span>
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
            <button className="px-8 py-5 bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-3 transform hover:scale-105">
              <Smartphone className="w-5 h-5" />
              <span className="font-medium">Download Mobile App</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg p-8 rounded-2xl border border-green-500/20 hover:border-green-500/40 transition-all hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="text-xl text-white mb-2">One-Click Save</div>
              <p className="text-gray-400">
                Capture DSA, System Design & Behavioral notes instantly
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg p-8 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Cloud className="w-7 h-7 text-white" />
              </div>
              <div className="text-xl text-white mb-2">Cloud Sync</div>
              <p className="text-gray-400">
                Access your notes anywhere, on any device
              </p>
            </div>

            <div className="group bg-gradient-to-br from-indigo-500/10 to-blue-500/10 backdrop-blur-lg p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div className="text-xl text-white mb-2">Review On The Go</div>
              <p className="text-gray-400">
                Practice anywhere with spaced repetition
              </p>
            </div>
          </div>

          {/* Question types badges */}
          <div className="flex flex-wrap gap-4 justify-center max-w-3xl mx-auto">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg border border-blue-400/30 rounded-full">
              <Code2 className="w-5 h-5 text-blue-300" />
              <span className="text-white font-medium">
                Data Structures & Algorithms
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-lg border border-orange-400/30 rounded-full">
              <TrendingUp className="w-5 h-5 text-orange-300" />
              <span className="text-white font-medium">System Design</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-lg border border-pink-400/30 rounded-full">
              <Users className="w-5 h-5 text-pink-300" />
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
