import { Download, Save, Repeat, Trophy } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Download,
      title: 'Install & Authenticate',
      description: 'Add the Chrome extension and paste your Interview Buddy API key to get started',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Save,
      title: 'Capture Solutions',
      description: 'Click save on any LeetCode problem—preview the capture with all metadata before submission',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Repeat,
      title: 'Review with FSR',
      description: 'Use the mobile app\'s spaced repetition engine to review at optimal intervals',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Trophy,
      title: 'Track Progress',
      description: 'Monitor your streaks, daily goals, and improvement across all your saved solutions',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="py-20 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Get started with LeetStack in four simple steps
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow h-full">
                <div className="space-y-4">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${step.color}`}>
                    <step.icon className="w-7 h-7" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-900 text-white rounded-full">
                      {index + 1}
                    </div>
                    <h3 className="text-xl text-gray-900">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-200 -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}