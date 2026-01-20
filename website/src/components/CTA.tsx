import { Chrome, Smartphone, ArrowRight, Target } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background - professional blue tones */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full mb-8">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-white">Your Next Interview is Coming Soon</span>
          </div>

          <h2 className="text-5xl md:text-6xl text-white mb-6 leading-tight">
            Ready to Remember{" "}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Everything You Studied?
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Start saving your interview prep today. LeetCode solutions with one click.
            Keep System Design and Behavioral notes organized. Review everything with spaced repetition.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <a
              href="https://chromewebstore.google.com/detail/leetstack/npflknpllcpnddnhpdkmdjnlomfgmjph"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-10 py-6 bg-white text-slate-900 rounded-2xl hover:bg-gray-50 transition-colors flex items-center gap-3 shadow-2xl shadow-white/20 hover:shadow-white/30 cursor-pointer"
            >
              <Chrome className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm text-gray-500">Install from</div>
                <div className="text-lg font-semibold">Chrome Web Store</div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <button disabled className="group px-10 py-6 bg-gradient-to-r from-slate-700 to-slate-600 text-white/60 rounded-2xl cursor-not-allowed flex items-center gap-3 shadow-2xl shadow-slate-900/30">
              <Smartphone className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm text-slate-400">Coming soon to</div>
                <div className="text-lg font-semibold">iOS & Android</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
