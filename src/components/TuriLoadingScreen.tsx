import React, { useEffect, useState } from 'react';

interface TuriLoadingScreenProps {
  onLoadingComplete: () => void;
  minimumLoadTime?: number; // Minimum time to show loading screen (ms)
}

const TuriLoadingScreen: React.FC<TuriLoadingScreenProps> = ({ 
  onLoadingComplete,
  minimumLoadTime = 2000 
}) => {
  const [dots, setDots] = useState('');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Animated dots effect
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 400);

    // Minimum load time + fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Wait for fade animation to complete before calling onLoadingComplete
      setTimeout(() => {
        onLoadingComplete();
      }, 500);
    }, minimumLoadTime);

    return () => {
      clearInterval(dotsInterval);
      clearTimeout(timer);
    };
  }, [onLoadingComplete, minimumLoadTime]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        {/* Turi Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Pulsing circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-purple-500/20 rounded-full animate-ping"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-indigo-500/30 rounded-full animate-pulse"></div>
            </div>
            
            {/* Center icon */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading text with Turi's character */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">
            Turi is getting ready
            <span className="inline-block w-12 text-left">{dots}</span>
          </h1>
          
          <p className="text-indigo-300 text-lg">
            Preparing your language learning journey
          </p>

          {/* Loading bar */}
          <div className="mt-8 w-64 h-1 bg-slate-700 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-loading-bar"></div>
          </div>
        </div>
      </div>

      {/* Add custom animation for loading bar */}
      <style>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 70%;
            margin-left: 0%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TuriLoadingScreen;

