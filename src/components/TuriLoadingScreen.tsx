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
        {/* Turi Icon/Logo */}
        <div className="relative">
          {/* Pulsing circles for visual interest */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-purple-500/20 rounded-full animate-ping"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-indigo-500/30 rounded-full animate-pulse"></div>
          </div>
          
          {/* Center gradient circle */}
          <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <div className="text-6xl">🌍</div>
          </div>
        </div>

        {/* Loading text - centered */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-white">
            Turi is getting ready
            <span className="inline-block w-12 text-left">{dots}</span>
          </h1>
          
          <p className="text-indigo-200 text-xl">
            Preparing your language learning journey
          </p>

          {/* Loading bar */}
          <div className="w-80 h-1.5 bg-slate-700 rounded-full overflow-hidden mx-auto mt-8">
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

