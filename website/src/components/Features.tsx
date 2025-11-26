import { Chrome, Smartphone, Zap, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Features() {
  return (
    <div className="py-20 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl text-gray-900 mb-4">
            Two Powerful Tools, One Goal
          </h2>
          <p className="text-xl text-gray-600">
            LeetStack combines the convenience of browser automation with mobile learning
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Chrome Extension Feature */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl">
              <Chrome className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-3xl text-gray-900 mb-3">Chrome Extension</h3>
              <p className="text-gray-700">
                Automatically captures your LeetCode solutions with comprehensive metadata—title, URL, 
                difficulty, tags, problem statement, and your code—all with a preview before saving.
              </p>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">One-click capture from any LeetCode problem page</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Preview before submission with missing field detection</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Add custom notes and prevent duplicate saves</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Secure API key authentication with actionable feedback</span>
              </li>
            </ul>
          </div>
          
          {/* Mobile App Feature */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-xl">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-3xl text-gray-900 mb-3">Mobile App</h3>
              <p className="text-gray-700">
                Review solutions on iOS and Android with an FSR spaced repetition engine (SuperMemo SM-2). 
                Track streaks, daily goals, and progress—all offline-first with cloud sync.
              </p>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Spaced repetition review mode for optimal retention</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Curated problem sets: Grind 75, Blind 75, NeetCode 100</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Dashboard with streaks, goals, and motivational insights</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">Offline-first with optional cloud backup and cross-device sync</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1605108222700-0d605d9ebafe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBwaG9uZSUyMGFwcHxlbnwxfHx8fDE3NjQwMzI4OTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
              alt="Mobile app interface"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1758522964581-a60c3e87a44e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeWluZyUyMG5vdGVzJTIwcmV2aWV3fGVufDF8fHx8MTc2NDExNzgzOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
              alt="Reviewing solutions"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}