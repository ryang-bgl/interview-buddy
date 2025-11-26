import { Smartphone, Brain, BarChart3, List, Target, Zap, Flame, Calendar, BookOpen, Star } from 'lucide-react';

export function MobileApp() {
  const features = [
    {
      icon: Brain,
      title: 'Spaced Repetition Engine',
      description: 'Built on SuperMemo SM-2 algorithm, our FSR system ensures you review problems at optimal intervals for maximum retention and long-term memory.',
      color: 'purple',
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Smartphone,
      title: 'Offline-First Design',
      description: 'All your solutions and review sessions are stored locally in AsyncStorage. Review anywhere, anytime, with optional cloud sync for backup and cross-device access.',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Target,
      title: 'Daily Progress Tracking',
      description: 'Home dashboard shows your streak, daily goals, quick stats, and "continue review" cards. Stay motivated with progress insights and helpful tips.',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: List,
      title: 'Curated Problem Lists',
      description: 'Access Grind 75, Blind 75, NeetCode 100, and Hot 100 lists. Browse your solved problems or create custom lists for focused practice.',
      color: 'orange',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      title: 'Seamless Authentication',
      description: 'Email/OTP registration and login powered by Firebase. Includes onboarding, profile setup, resend flows, and offline tolerance for uninterrupted review.',
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: BarChart3,
      title: 'Cross-Platform Native',
      description: 'Built with React Native and Expo for smooth performance on both iOS and Android. Native mobile experience optimized for on-the-go learning.',
      color: 'pink',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  return (
    <section id="mobile" className="py-24 bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full mb-6">
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 font-medium">Mobile Review App</span>
          </div>
          <h2 className="text-5xl text-gray-900 mb-6 leading-tight">
            Review Smarter, <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Remember Longer</span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Transform your saved solutions into a powerful spaced repetition learning system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>
              <div className="relative bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-${feature.color}-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 rounded-3xl p-10 md:p-16 shadow-2xl shadow-purple-900/50 relative overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10"></div>
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <h3 className="text-4xl text-white mb-4">Key Screens & Features</h3>
              <p className="text-purple-200 text-lg">Everything you need for effective spaced repetition learning</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { 
                  icon: Brain, 
                  title: 'Review Mode', 
                  desc: 'Practice with spaced repetition. Rate your recall, and the algorithm schedules the next review automatically.',
                  gradient: 'from-purple-500 to-pink-500'
                },
                { 
                  icon: BookOpen, 
                  title: 'Solutions List', 
                  desc: 'Browse all your saved problems, filter by difficulty or tags, and jump into any solution instantly.',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                { 
                  icon: BarChart3, 
                  title: 'Progress Dashboard', 
                  desc: 'Track your streaks, daily goals, and overall stats. See motivational tips to keep you going.',
                  gradient: 'from-green-500 to-emerald-500'
                },
                { 
                  icon: Star, 
                  title: 'My Notes', 
                  desc: 'Access your personal notes for each problem, helping you remember key insights and approaches.',
                  gradient: 'from-yellow-500 to-orange-500'
                }
              ].map((screen, index) => (
                <div key={index} className="group bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-1">
                  <div className={`w-14 h-14 bg-gradient-to-br ${screen.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <screen.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl text-white mb-3">{screen.title}</h4>
                  <p className="text-purple-200 leading-relaxed">{screen.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}