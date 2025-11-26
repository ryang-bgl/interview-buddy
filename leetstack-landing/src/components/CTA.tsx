import { Chrome, Smartphone, ArrowRight, Sparkles, Trophy } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full mb-8">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span className="text-white">Join Thousands of Successful Developers</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl text-white mb-6 leading-tight">
            Ready to Ace Your<br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Next Tech Interview?
            </span>
          </h2>
          <p className="text-xl text-indigo-200 mb-12 max-w-3xl mx-auto leading-relaxed">
            Start saving your interview prep notes today. One click to capture, cloud sync to access anywhere, and mobile review to master everything.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <button className="group px-10 py-6 bg-white text-purple-600 rounded-2xl hover:bg-gray-50 transition-all flex items-center gap-3 shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-105 transform">
              <Chrome className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm text-gray-500">Available on</div>
                <div className="text-lg font-semibold">Chrome Web Store</div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="group px-10 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-3 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transform">
              <Smartphone className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm text-purple-200">Download for</div>
                <div className="text-lg font-semibold">iOS & Android</div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}