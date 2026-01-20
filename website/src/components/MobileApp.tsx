import {
  Smartphone,
  Brain,
  BarChart3,
  List,
  Target,
  Zap,
  Flame,
  Calendar,
  BookOpen,
  Star,
} from "lucide-react";

export function MobileApp() {
  const features = [
    {
      icon: Brain,
      title: "Spaced Repetition Engine",
      description:
        "Built on SuperMemo SM-2 algorithm, schedules reviews at optimal intervals for maximum retention. Works for LeetCode, System Design notes, and Behavioral stories.",
      color: "violet",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Smartphone,
      title: "Offline-First Design",
      description:
        "All your prep data stored locally. Review during commute, lunch breaks, or anytime. Your entire interview prep travels with you.",
      color: "sky",
      gradient: "from-sky-500 to-cyan-500",
    },
    {
      icon: Target,
      title: "Daily Progress Tracking",
      description:
        "Home dashboard shows your streak, daily goals, quick stats, and 'continue review' cards. Stay consistent with your interview preparation.",
      color: "emerald",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: List,
      title: "Organize Everything",
      description:
        "Access your LeetCode solutions, System Design notes, and Behavioral question stories. Create custom lists for targeted prep.",
      color: "amber",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: Zap,
      title: "Seamless Authentication",
      description:
        "Email/OTP registration and login. Includes onboarding, profile setup, and offline tolerance for uninterrupted interview prep.",
      color: "cyan",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: BarChart3,
      title: "Cross-Platform Native",
      description:
        "Built with React Native and Expo for smooth performance on both iOS and Android. Optimized for on-the-go review.",
      color: "rose",
      gradient: "from-rose-500 to-pink-500",
    },
  ];

  return (
    <section
      id="mobile"
      className="py-24 bg-gradient-to-br from-slate-50 via-sky-50 to-slate-50 relative overflow-hidden"
    >
      {/* Decorative blobs - professional tones */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-4 rounded-2xl border border-violet-200 bg-white px-6 py-4 shadow-xl shadow-violet-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-900">
                Mobile Review App
              </p>
            </div>
            <span className="rounded-full border border-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-600">
              Coming soon
            </span>
          </div>
        </div>

        <div className="text-center mb-20">
          <h2 className="text-5xl text-gray-900 mb-6 leading-tight">
            Review All Your Prep{" "}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              On The Go
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            LeetCode solutions, System Design notes, Behavioral stories—review
            everything with spaced repetition on your phone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              <div
                className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}
              ></div>
              <div className="relative bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-2xl transition-colors cursor-pointer">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-${feature.color}-500/30`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 md:p-16 shadow-2xl shadow-slate-900/50 relative overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-emerald-500/10"></div>

          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <h3 className="text-4xl text-white mb-4">
                What You Can Review
              </h3>
              <p className="text-slate-300 text-lg">
                All your interview preparation, organized and ready for spaced repetition
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Brain,
                  title: "DSA Flashcards",
                  desc: "Review LeetCode solutions with spaced repetition. Rate your recall, and we'll schedule the next review.",
                  gradient: "from-sky-500 to-cyan-500",
                },
                {
                  icon: BookOpen,
                  title: "System Design Notes",
                  desc: "Access your system design notes, diagrams, and key concepts. AI converts them into review flashcards.",
                  gradient: "from-violet-500 to-purple-500",
                },
                {
                  icon: BarChart3,
                  title: "Progress Dashboard",
                  desc: "Track your streaks, daily goals, and overall stats. See how prepared you are across all interview types.",
                  gradient: "from-emerald-500 to-green-500",
                },
                {
                  icon: Star,
                  title: "Behavioral Stories",
                  desc: "Keep your STAR stories organized. Review them with flashcards so you don't forget your best examples.",
                  gradient: "from-amber-500 to-orange-500",
                },
              ].map((screen, index) => (
                <div
                  key={index}
                  className="group bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${screen.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg`}
                  >
                    <screen.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl text-white mb-3">{screen.title}</h4>
                  <p className="text-slate-300 leading-relaxed">
                    {screen.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
