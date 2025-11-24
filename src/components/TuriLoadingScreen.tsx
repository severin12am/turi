import React, { useEffect, useState } from 'react';

interface TuriLoadingScreenProps {
  onLoadingComplete: () => void;
  minimumLoadTime?: number;
}

const TuriLoadingScreen: React.FC<TuriLoadingScreenProps> = ({ 
  onLoadingComplete,
  minimumLoadTime = 1500
}) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animated dots effect
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 400);

    // Fade out after minimum load time
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Call onLoadingComplete after fade animation
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
      <div className="flex flex-col items-center justify-center w-full space-y-8">
        {/* Loading text - centered */}
        <div className="text-center space-y-6">
          <p className="text-indigo-200 text-xl font-medium">
            Preparing your language learning journey...
          </p>

          {/* Loading bar */}
          <div className="w-80 h-1.5 bg-slate-700 rounded-full overflow-hidden mx-auto">
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

