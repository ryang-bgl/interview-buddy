import { Brain, Zap, Target } from 'lucide-react';

export function HowItWorks() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%230ea5e9' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-12 shadow-2xl shadow-slate-900/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl text-white mb-4">Why Spaced Repetition Works</h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Research shows spaced repetition is one of the most effective learning techniques. By reviewing at optimal intervals, you retain problem-solving patterns, design concepts, and behavioral stories when you need them most—in your interviews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {[
                {
                  icon: Brain,
                  emoji: '🧠',
                  title: 'Better Retention',
                  desc: 'Remember LeetCode solutions, design concepts, and STAR stories months later without re-studying',
                  stat: '10x'
                },
                {
                  icon: Zap,
                  emoji: '⚡',
                  title: 'Efficient Prep',
                  desc: 'Focus time on what you\'re actually forgetting—whether DSA, System Design, or Behavioral',
                  stat: '5x Faster'
                },
                {
                  icon: Target,
                  emoji: '🎯',
                  title: 'Interview Ready',
                  desc: 'Enter interviews with confidence knowing your prep is fresh in your mind',
                  stat: '95% Success'
                }
              ].map((benefit, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center hover:bg-white/20 transition-colors cursor-pointer">
                  <div className="text-5xl mb-4">{benefit.emoji}</div>
                  <div className="text-3xl font-bold text-white mb-2">{benefit.stat}</div>
                  <div className="text-xl text-white mb-3">{benefit.title}</div>
                  <p className="text-slate-300">{benefit.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
              <p className="text-lg text-white leading-relaxed">
                <span className="font-semibold">Powered by SuperMemo SM-2 algorithm:</span> Our FSR (Flexible Spaced Repetition) engine automatically calculates the perfect time to review each item—LeetCode solutions, System Design notes, or Behavioral stories—based on your performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
