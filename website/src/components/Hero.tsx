import { Chrome, Smartphone } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
              <Chrome className="w-4 h-4" />
              <span>Chrome Extension + Mobile App</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl text-gray-900">
                Master LeetCode
                <span className="block text-blue-600">One Solution at a Time</span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-xl">
                Save your LeetCode solutions instantly with our Chrome extension, 
                then review them on-the-go with our mobile app. Perfect for acing 
                your next coding interview.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors">
                <Chrome className="w-5 h-5" />
                Add to Chrome
              </button>
              <button className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors">
                <Smartphone className="w-5 h-5" />
                Download App
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1604781109199-ced99b89b0f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RpbmclMjBsYXB0b3AlMjBkZXNrfGVufDF8fHx8MTc2NDExNzgzOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                alt="Coding workspace"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
