import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../store';
import { logger } from '../services/logger';
import HelperRobotModel from '../scenes/HelperRobotModel';
import { supabase } from '../services/supabase';
import { checkAndUpdateUserProgress } from '../services/auth';
import AppPanel from './AppPanel';
import { PanelBackdrop } from './AppPanel';
import { PanelTitle, PanelButton, PanelSelect } from './PanelElements';
import { POPULAR_LANGUAGES } from '../constants/languages';
import { translations as allTranslations, getTranslation, SupportedLanguage, type TranslationStrings } from '../constants/translations';
import { translationCache } from '../services/translationCache';
import { loadTranslations } from '../services/translationLoader';

interface HelperRobotProps {
  instructions: Record<string, string>;
  onLanguageSelect: (mother: string, target: string) => void;
  onLogin: () => void;
  position?: { x: number; y: number };
  scale?: number;
  onClick?: () => void;
  onReady?: () => void; // Callback when component is ready to show
  shouldAnimate?: boolean; // Parent tells us when to start language selection animation
}

const ANIMATION_SPEED = 30;
const PANEL_WIDTH = 600;
const PANEL_HEIGHT = 576;
const SPACING = 32; // 2rem or 32px consistent spacing

// Use the centralized language list - now supports all 30 languages!
const languages = POPULAR_LANGUAGES.map(lang => ({
  code: lang.code,
  name: `${lang.nativeName} (${lang.name})`,
  nameRu: `${lang.nativeName} (${lang.name})`  // We'll use native name for all
}));

// Small dictionary for cycling placeholder translations (visual effect only)
// These are immediately available without needing to load from Supabase
const placeholderTranslations: Record<string, string> = {
  'en': 'Choose your native language',
  'ru': 'Выберите родной язык',
  'es': 'Elige tu lengua materna',
  'fr': 'Choisissez votre langue maternelle',
  'de': 'Wählen Sie Ihre Muttersprache',
  'it': 'Scegli la tua lingua madre',
  'pt': 'Escolha seu idioma nativo',
  'ar': 'اختر لغتك الأم',
  'CH': '选择您的母语',
  'ja': '母国語を選択してください'
};

// Helper function to get translations from cache or fallback to English
const getHelperTranslation = (language: string, key: string): string => {
  const lang = language as SupportedLanguage;
  
  // For English, return directly from bundled translations
  if (lang === 'en') {
    const translation = allTranslations.en[key as keyof TranslationStrings];
    return (translation as string) || key;
  }
  
  // Try to get from cache (translations loaded from Supabase)
  const cachedTranslations = translationCache.get(lang);
  if (cachedTranslations) {
    const translation = cachedTranslations[key as keyof TranslationStrings];
    if (translation) {
      return translation as string;
    }
  }
  
  // Fallback to English
  const englishTranslation = allTranslations.en[key as keyof TranslationStrings];
  return (englishTranslation as string) || key;
};


const HelperRobot: React.FC<HelperRobotProps> = ({ 
  instructions, 
  onLanguageSelect, 
  onLogin,
  position = { x: 0, y: 0 },
  scale = 1,
  onClick,
  onReady,
  shouldAnimate = false
}) => {
  const { 
    isHelperRobotOpen, 
    isLanguageSelected,
    modelPaths,
    setIsLanguageSelected,
    user,
    isLoggedIn,
    targetLanguage,
    motherLanguage
  } = useStore();
  
  const [selectedMotherLang, setSelectedMotherLang] = useState<string>('');
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>('');
  const [step, setStep] = useState<'mother' | 'target' | 'ready'>('mother');
  const [isAnimating, setIsAnimating] = useState(true);
  const [hasAnimationStarted, setHasAnimationStarted] = useState(false);
  const [hasInitialAnimationRun, setHasInitialAnimationRun] = useState(false);
  const [texts, setTexts] = useState({
    question: '',
    account: ''
  });
  
  // State for rotating language placeholder
  const [placeholderLang, setPlaceholderLang] = useState<string>('en');
  
  // Ref to track animation interval for cleanup
  const animationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Use the helper function to get translations from cache
  const currentLang = selectedMotherLang || 'en';
  const t = {
    whatLanguage: getHelperTranslation(currentLang, 'whatLanguage'),
    whatToLearn: getHelperTranslation(currentLang, 'whatToLearn'),
    ready: getHelperTranslation(currentLang, 'ready'),
    selectDifferent: getHelperTranslation(currentLang, 'selectDifferent'),
    chooseLanguage: getHelperTranslation(currentLang, 'chooseLanguage'),
    chooseLanguageYouSpeak: getHelperTranslation(currentLang, 'chooseLanguageYouSpeak'),
    startJourney: getHelperTranslation(currentLang, 'startJourney'),
    haveAccount: getHelperTranslation(currentLang, 'alreadyHaveAccount'), // Use correct key
    back: getHelperTranslation(currentLang, 'goBack') // Use correct key
  };
  const placeholderText = placeholderTranslations[placeholderLang] || placeholderTranslations['en'];

  // Setup rotation of placeholder languages
  useEffect(() => {
    // Only rotate when on the mother language selection step
    if (step !== 'mother') return;
    
    const languageCodes = ['en', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'CH', 'ja'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % languageCodes.length;
      setPlaceholderLang(languageCodes[currentIndex]);
    }, 2000); // Rotate every 2 seconds
    
    return () => clearInterval(interval);
  }, [step]);

  const animateAllTexts = (questionText: string, accountText: string) => {
    // Clear any existing animation first to prevent orphaned intervals
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    
    setIsAnimating(true);
    setHasAnimationStarted(true);
    let iteration = 0;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const maxLength = Math.max(questionText.length, accountText.length);
    
    const interval = setInterval(() => {
      setTexts(prev => ({
        question: questionText
          .split('')
          .map((letter, index) => {
            if (index < iteration) return letter;
            return letters[Math.floor(Math.random() * 26)];
          })
          .join(''),
        account: accountText
          .split('')
          .map((letter, index) => {
            if (index < iteration) return letter;
            return letters[Math.floor(Math.random() * 26)];
          })
          .join('')
      }));
      
      iteration += 1;
      
      if (iteration > maxLength) {
        clearInterval(interval);
        animationIntervalRef.current = null;
        setIsAnimating(false);
      }
    }, ANIMATION_SPEED);
    
    // Store interval ref for cleanup
    animationIntervalRef.current = interval;
  };

  // Track if we've already called onReady to prevent duplicates
  const hasCalledOnReady = React.useRef(false);
  
  // Called when the 3D model is actually loaded
  const handleModelReady = React.useCallback(() => {
    console.log('[DEBUG] handleModelReady called, hasCalledOnReady:', hasCalledOnReady.current);
    
    if (hasCalledOnReady.current) {
      console.log('[DEBUG] onReady already called, skipping');
      return;
    }
    hasCalledOnReady.current = true;
    
    if (onReady) {
      console.log('[DEBUG] Calling onReady prop');
      onReady();
    } else {
      console.warn('[DEBUG] onReady prop is missing!');
    }
  }, [onReady]);
  
  useEffect(() => {
    console.log("🤖 HelperRobot component MOUNTED");
    
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      console.log("🤖 HelperRobot component UNMOUNTED");
    };
  }, []); // Empty deps - only run once on mount

  // Start the glitch text animation ONLY when parent tells us
  useEffect(() => {
    if (!shouldAnimate || hasInitialAnimationRun) return;

    const whatLanguage = allTranslations.en.whatLanguage || "Hi! I'm Turi, I will guide you on your language learning journey! Firstly, what language do you already speak?";
    const haveAccount = allTranslations.en.alreadyHaveAccount || "Already have an account?";
    animateAllTexts(whatLanguage, haveAccount);
    setHasInitialAnimationRun(true);
  }, [shouldAnimate, hasInitialAnimationRun]);

  // This effect is intentionally empty/removed to prevent re-animation issues
  // The initial animation is handled by the mount effect above
  // The second animation is handled by handleMotherLanguageSelect

  const handleMotherLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    if (!lang) return;
    
    // Update selected language
    setSelectedMotherLang(lang);
    
    // Start loading translations in the background (non-blocking)
    if (lang !== 'en') {
      loadTranslations(lang as SupportedLanguage).catch(error => {
        console.error(`Failed to load translations for ${lang}:`, error);
      });
    }
    
    // Move to target selection immediately
    setStep('target');
    
    // Get text (will use cached if available, or fallback to English)
    const whatToLearn = getHelperTranslation(lang, 'whatToLearn');
    const haveAccount = getHelperTranslation(lang, 'alreadyHaveAccount');
    
    // Animate the second question immediately
    animateAllTexts(whatToLearn, haveAccount);
  };

  const handleTargetLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    if (!lang || lang === selectedMotherLang) {
      setTexts(prev => ({
        ...prev,
        question: t.selectDifferent
      }));
      return;
    }
    
    setSelectedTargetLang(lang);
    setStep('ready');
    animateAllTexts(t.ready, t.haveAccount);
  };

  const handleStartJourney = () => {
    onLanguageSelect(selectedMotherLang, selectedTargetLang);
    setIsLanguageSelected(true);
  };

  const handleBack = () => {
    if (step === 'target') {
      setStep('mother');
      setSelectedMotherLang('');
      animateAllTexts(t.whatLanguage, t.haveAccount);
    } else if (step === 'ready') {
      setStep('target');
      setSelectedTargetLang('');
      setTexts({
        question: t.whatToLearn,
        account: t.haveAccount
      });
    }
  };

  // Handle robot click - delegate to parent onClick handler
  const handleRobotClick = (e: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("🤖 Helper robot clicked! User:", user?.id, "isLoggedIn:", isLoggedIn);
    logger.info('Helper robot clicked', { userId: user?.id, isLoggedIn });
    
    // Call the onClick prop if it exists
    if (onClick) {
      console.log("🤖 Calling parent onClick handler");
      onClick();
    }
  };
  
  return (
    <div className="pointer-events-auto fixed" style={{ zIndex: 100 }}>
      <div className="relative">
        <div 
          className="w-96 h-96 mb-2 helper-robot-container cursor-pointer relative"
          onClick={handleRobotClick}
          style={{ pointerEvents: 'auto' }}
        >

          
          <Canvas 
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation();
              console.log("🤖 Canvas clicked");
              handleRobotClick(e as any);
            }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <HelperRobotModel 
              path={modelPaths.helperRobot} 
              onClick={() => handleRobotClick(undefined as any)}
              onModelReady={handleModelReady}
            />
          </Canvas>
        </div>
        
        {/* LANGUAGE SELECTION PANEL - only show when this is being used for language selection */}
        {instructions.mode === "language_selection" && !isLanguageSelected && !isLoggedIn && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30" style={{ zIndex: 101 }}>
            <div 
              className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden"
              style={{ 
                width: PANEL_WIDTH,
                height: PANEL_HEIGHT,
                padding: SPACING 
              }}
            >
              {/* Question section - fixed height */}
              <div className="h-32 flex items-center justify-center">
                <h2 className={`text-2xl font-bold text-center text-slate-100 ${isAnimating ? 'animate-glitch' : ''}`}>
                  {hasAnimationStarted ? (texts.question || t.whatLanguage) : ''}
                </h2>
              </div>
              
              {/* Dropdowns section - fixed position */}
              <div className="space-y-4">
                {/* Label for mother language selection */}
                <div className="mb-1 text-slate-300 text-lg font-medium">
                  {step === 'mother' && 
                    <span className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                    </span>
                  }
                </div>
                <select
                  value={selectedMotherLang}
                  onChange={handleMotherLanguageSelect}
                  className={`w-full h-16 rounded-lg bg-slate-800/60 border text-white transition-all appearance-none px-4 ${
                    step === 'mother' 
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 animate-pulse-subtle' 
                      : 'border-slate-700'
                  }`}
                  disabled={step !== 'mother'}
                >
                  <option value="" className="bg-gray-900">
                    {step === 'mother' ? placeholderText : t.chooseLanguageYouSpeak}
                  </option>
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-gray-900">
                      {lang.name}
                    </option>
                  ))}
                </select>
                
                <div className={`transition-all duration-300 ${step === 'mother' ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>
                  <div className="mb-1 text-slate-300 text-lg font-medium mt-6">
                    {step === 'target' && 
                      <span className="flex items-center">
                        <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></span>
                      </span>
                    }
                  </div>
                  <select
                    value={selectedTargetLang}
                    onChange={handleTargetLanguageSelect}
                    className={`w-full h-16 rounded-lg bg-slate-800/60 border text-white transition-all appearance-none px-4 ${
                      step === 'target' 
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 animate-pulse-subtle' 
                        : 'border-slate-700'
                    }`}
                    disabled={step === 'mother' || step === 'ready'}
                  >
                    <option value="" className="bg-gray-900">
                      {t.chooseLanguage}
                    </option>
                    {languages.map(lang => (
                      <option 
                        key={lang.code} 
                        value={lang.code}
                        className="bg-gray-900"
                        disabled={lang.code === selectedMotherLang}
                      >
                        {lang.code === selectedMotherLang ? `${lang.name} (${t.selectDifferent})` : lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Action buttons - fixed position at bottom */}
              <div className={`absolute bottom-8 left-8 right-8 flex ${step === 'target' || step === 'ready' ? 'justify-between' : 'justify-end'}`}>
                {(step === 'target' || step === 'ready') && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 rounded-lg border border-slate-600 bg-slate-800/40 text-slate-300 hover:bg-slate-700/60 hover:border-slate-500 transition-all"
                  >
                    {t.back}
                  </button>
                )}
                
                {step === 'target' && selectedTargetLang && selectedTargetLang !== selectedMotherLang && (
                  <button
                    onClick={handleStartJourney}
                    className="px-6 py-3 rounded-lg border-2 border-indigo-500 bg-indigo-600/20 text-slate-100 hover:bg-indigo-500 hover:text-white transition-all flex items-center"
                  >
                    {t.startJourney}
                  </button>
                )}
                
                {step === 'ready' && (
                  <button
                    onClick={handleStartJourney}
                    className="px-6 py-3 rounded-lg border-2 border-indigo-500 bg-indigo-600/20 text-slate-100 hover:bg-indigo-500 hover:text-white transition-all flex items-center"
                  >
                    {t.startJourney}
                  </button>
                )}
                
                <div className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center">
                  <button onClick={() => {
                    // Toggle helper robot to hide the language panel
                    useStore.getState().toggleHelperRobot();
                    // Call the onLogin callback to show the login panel
                    onLogin();
                  }}>{t.haveAccount}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelperRobot;