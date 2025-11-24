import React, { useEffect, useState } from 'react';

interface TuriLoadingScreenProps {
  // No props needed - parent controls visibility by mounting/unmounting
}

// Translations for the loading message
const loadingTranslations = [
  'Preparing your language learning journey...',
  '正在为您准备语言学习之旅……',
  'Preparando tu viaje de aprendizaje de idiomas...',
  'جارٍ تجهيز رحلة تعلّم اللغة الخاصة بك...',
  'Preparando sua jornada de aprendizado de idiomas...',
  'Подготовка к вашему путешествию по изучению языка...',
  '言語学習の旅を準備しています…',
  'Vorbereitung deiner Sprachlernreise...',
  'Préparation de votre parcours d\'apprentissage linguistique...',
  'Preparazione del tuo viaggio di apprendimento linguistico...'
];

const TuriLoadingScreen: React.FC<TuriLoadingScreenProps> = () => {
  const [, forceUpdate] = useState({});
  const translationIndexRef = React.useRef(0);

  useEffect(() => {
    console.log('🎬 TuriLoadingScreen MOUNTED');
    
    // Cycle through translations every 3 seconds
    const intervalId = setInterval(() => {
      translationIndexRef.current = (translationIndexRef.current + 1) % loadingTranslations.length;
      console.log(`🔄 Translation changed to: ${translationIndexRef.current} - "${loadingTranslations[translationIndexRef.current]}"`);
      forceUpdate({}); // Force re-render to show new translation
    }, 3000);
    
    console.log('⏰ Interval created');

    return () => {
      console.log('🛑 TuriLoadingScreen UNMOUNTED - clearing interval');
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"
    >
      <div className="flex flex-col items-center justify-center w-full space-y-8">
        {/* Loading text - centered with smooth transition */}
        <div className="text-center space-y-6">
          <p className="text-indigo-200 text-xl font-medium min-h-[2rem]">
            {loadingTranslations[translationIndexRef.current]}
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

