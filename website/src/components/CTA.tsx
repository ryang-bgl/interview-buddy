import { Chrome, Smartphone, ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <div className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-white">
            Ready to Level Up Your Interview Prep?
          </h2>
          
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of developers who are mastering LeetCode with LeetStack
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors">
              <Chrome className="w-5 h-5" />
              <span>Add to Chrome - It's Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors">
              <Smartphone className="w-5 h-5" />
              <span>Download Mobile App</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-white pt-8">
            <div className="text-center">
              <div className="text-4xl mb-1">10k+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-1">500k+</div>
              <div className="text-blue-100">Solutions Saved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-1">4.8★</div>
              <div className="text-blue-100">Chrome Store Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
