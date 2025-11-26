import { Code, Database, Smartphone, Shield, RefreshCw, Zap } from 'lucide-react';

export function TechDetails() {
  const highlights = [
    {
      icon: Code,
      title: 'Complete Problem Capture',
      description: 'Extracts title, canonical URL, difficulty, tags, full problem statement, your solution code, and optional notes',
      color: 'text-blue-600',
    },
    {
      icon: Shield,
      title: 'Secure & Isolated',
      description: 'Personal API key authentication with per-user data isolation and duplicate save prevention',
      color: 'text-green-600',
    },
    {
      icon: Database,
      title: 'Offline-First Architecture',
      description: 'Mobile app stores solutions in AsyncStorage with optional REST API sync for backup and cross-device access',
      color: 'text-purple-600',
    },
    {
      icon: RefreshCw,
      title: 'FSR Spaced Repetition',
      description: 'SuperMemo SM-2 inspired algorithm schedules reviews at optimal intervals for maximum retention',
      color: 'text-orange-600',
    },
    {
      icon: Smartphone,
      title: 'Cross-Platform Mobile',
      description: 'React Native + Expo app runs seamlessly on iOS and Android with Firebase email/OTP authentication',
      color: 'text-pink-600',
    },
    {
      icon: Zap,
      title: 'Curated Problem Sets',
      description: 'Built-in access to Grind 75, Blind 75, NeetCode 100, Hot 100, plus custom list support',
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="py-20 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl text-gray-900 mb-4">
            Built for Serious Interview Prep
          </h2>
          <p className="text-xl text-gray-600">
            Enterprise-grade features designed to accelerate your learning and retention
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className={`${highlight.color}`}>
                  <highlight.icon className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl text-gray-900">{highlight.title}</h3>
                  <p className="text-gray-600">{highlight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-3xl text-white">Seamless Data Flow</h3>
              <p className="text-gray-300">
                Browser extension captures sync instantly to your mobile app via the Interview Buddy backend. 
                Review dashboard shows greeting, streaks, daily goals, quick stats, and "continue review" cards 
                to keep you motivated and on track.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white">Browser Extension</div>
                  <div className="text-gray-400">Capture & Sync</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="w-0.5 h-8 bg-gray-700"></div>
              </div>
              
              <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white">Mobile App</div>
                  <div className="text-gray-400">Review & Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
