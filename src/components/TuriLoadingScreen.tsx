import React from 'react';

interface TuriLoadingScreenProps {
  // No props needed - parent controls visibility by mounting/unmounting
}

const TuriLoadingScreen: React.FC<TuriLoadingScreenProps> = () => {

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center animate-fade-in"
    >
      <div className="flex flex-col items-center justify-center w-full space-y-8">
        {/* Loading text - centered with smooth transition */}
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
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TuriLoadingScreen;

