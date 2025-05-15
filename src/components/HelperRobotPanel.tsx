import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useStore } from '../store';
import { logger } from '../services/logger';
import ProgressVisualization from './ProgressVisualization';
import { syncWordProgress } from '../services/progress';
import { LogOut } from 'lucide-react';

// Add translations for HelperRobotPanel
const helperPanelTranslations = {
  en: {
    title: "Hey! Let's look at our progress! Every step counts!",
    logout: "Logout",
    loading: "Loading...",
    errorTitle: "Something went wrong",
    tryAgain: "Try Again",
    currentPair: "Current Pair",
    previousPairs: "Available Pairs",
    selectPrevious: "Select language pair",
    noPreviousPairs: "No language pairs",
    newLanguage: "New Language",
    chooseNewLanguage: "Choose a new language pair",
    learningProgress: "Learning Progress",
    vocabulary: "Your Vocabulary",
    backToSummary: "Back to Summary",
    words: "words",
    searchWords: "Search words...",
    noMatchingWords: "No matching words found",
    tryDifferentSearch: "Try a different search term",
    noWordsLearned: "No words learned yet",
    completeFirstDialogue: "Complete your first dialogue to start building your vocabulary",
    startLearning: "Start Learning",
    signInRequired: "Sign In Required",
    signInMessage: "Please sign in to view your language learning journey.",
    close: "Close",
    showHelpTooltip: "Show help information",
    currentPairMark: "(current)"
  },
  ru: {
    title: "Привет! Давайте посмотрим на наш прогресс! Каждый шаг важен!",
    logout: "Выйти",
    loading: "Загрузка...",
    errorTitle: "Что-то пошло не так",
    tryAgain: "Попробовать снова",
    currentPair: "Текущая пара",
    previousPairs: "Доступные пары",
    selectPrevious: "Выберите языковую пару",
    noPreviousPairs: "Нет языковых пар",
    newLanguage: "Новый язык",
    chooseNewLanguage: "Выбрать новую языковую пару",
    learningProgress: "Прогресс обучения",
    vocabulary: "Ваш словарный запас",
    backToSummary: "Вернуться к сводке",
    words: "слов",
    searchWords: "Поиск слов...",
    noMatchingWords: "Соответствующие слова не найдены",
    tryDifferentSearch: "Попробуйте другой поисковый запрос",
    noWordsLearned: "Пока не изучено ни одного слова",
    completeFirstDialogue: "Завершите свой первый диалог, чтобы начать создавать словарный запас",
    startLearning: "Начать обучение",
    signInRequired: "Требуется вход в систему",
    signInMessage: "Пожалуйста, войдите в систему, чтобы просмотреть ваш путь изучения языка.",
    close: "Закрыть",
    showHelpTooltip: "Показать справочную информацию",
    currentPairMark: "(текущая)"
  },
  es: {
    title: "¡Hola! ¡Veamos nuestro progreso! ¡Cada paso cuenta!",
    logout: "Cerrar sesión",
    loading: "Cargando...",
    errorTitle: "Algo salió mal",
    tryAgain: "Intentar de nuevo",
    currentPair: "Par actual",
    previousPairs: "Pares anteriores",
    selectPrevious: "Seleccionar un par anterior",
    noPreviousPairs: "No hay pares anteriores",
    newLanguage: "Nuevo idioma",
    chooseNewLanguage: "Elegir un nuevo par de idiomas",
    learningProgress: "Progreso de aprendizaje",
    vocabulary: "Tu vocabulario",
    backToSummary: "Volver al resumen",
    words: "palabras",
    searchWords: "Buscar palabras...",
    noMatchingWords: "No se encontraron palabras coincidentes",
    tryDifferentSearch: "Prueba con un término de búsqueda diferente",
    noWordsLearned: "Aún no has aprendido palabras",
    completeFirstDialogue: "Completa tu primer diálogo para comenzar a construir tu vocabulario",
    startLearning: "Comenzar a aprender",
    signInRequired: "Se requiere iniciar sesión",
    signInMessage: "Por favor, inicia sesión para ver tu viaje de aprendizaje de idiomas.",
    close: "Cerrar",
    showHelpTooltip: "Mostrar información de ayuda"
  },
  fr: {
    title: "Salut ! Examinons nos progrès ! Chaque étape compte !",
    logout: "Déconnexion",
    loading: "Chargement...",
    errorTitle: "Quelque chose s'est mal passé",
    tryAgain: "Réessayer",
    currentPair: "Paire actuelle",
    previousPairs: "Paires précédentes",
    selectPrevious: "Sélectionner une paire précédente",
    noPreviousPairs: "Pas de paires précédentes",
    newLanguage: "Nouvelle langue",
    chooseNewLanguage: "Choisir une nouvelle paire de langues",
    learningProgress: "Progrès d'apprentissage",
    vocabulary: "Votre vocabulaire",
    backToSummary: "Retour au résumé",
    words: "mots",
    searchWords: "Rechercher des mots...",
    noMatchingWords: "Aucun mot correspondant trouvé",
    tryDifferentSearch: "Essayez un terme de recherche différent",
    noWordsLearned: "Aucun mot appris pour l'instant",
    completeFirstDialogue: "Complétez votre premier dialogue pour commencer à constituer votre vocabulaire",
    startLearning: "Commencer l'apprentissage",
    signInRequired: "Connexion requise",
    signInMessage: "Veuillez vous connecter pour voir votre parcours d'apprentissage des langues.",
    close: "Fermer",
    showHelpTooltip: "Afficher les informations d'aide"
  },
  de: {
    title: "Hallo! Schauen wir uns unseren Fortschritt an! Jeder Schritt zählt!",
    logout: "Abmelden",
    loading: "Wird geladen...",
    errorTitle: "Etwas ist schiefgelaufen",
    tryAgain: "Erneut versuchen",
    currentPair: "Aktuelles Paar",
    previousPairs: "Vorherige Paare",
    selectPrevious: "Vorheriges Paar auswählen",
    noPreviousPairs: "Keine vorherigen Paare",
    newLanguage: "Neue Sprache",
    chooseNewLanguage: "Neues Sprachpaar auswählen",
    learningProgress: "Lernfortschritt",
    vocabulary: "Ihr Wortschatz",
    backToSummary: "Zurück zur Übersicht",
    words: "Wörter",
    searchWords: "Wörter suchen...",
    noMatchingWords: "Keine passenden Wörter gefunden",
    tryDifferentSearch: "Versuchen Sie einen anderen Suchbegriff",
    noWordsLearned: "Noch keine Wörter gelernt",
    completeFirstDialogue: "Schließen Sie Ihren ersten Dialog ab, um mit dem Aufbau Ihres Wortschatzes zu beginnen",
    startLearning: "Lernen beginnen",
    signInRequired: "Anmeldung erforderlich",
    signInMessage: "Bitte melden Sie sich an, um Ihre Sprachlernreise anzusehen.",
    close: "Schließen",
    showHelpTooltip: "Hilfeinformationen anzeigen"
  }
  // Add more languages as needed
};

interface HelperRobotPanelProps {
  onClose: () => void;
}

interface Word {
  id: number;
  dialogue_id: number;
  word: string;
  translation: string;
  example: string;
  is_learned?: boolean;
  entry_in_en?: string;
  entry_in_ru?: string;
}

interface LanguagePair {
  id: number;
  mother_language: string;
  target_language: string;
  level: number;
  word_progress: number;
}

const HelperRobotPanel: React.FC<HelperRobotPanelProps> = ({ onClose }) => {
  const { user, isLoggedIn, motherLanguage, targetLanguage, setLanguages, resetState, resetLanguageSelection, logout } = useStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showVocabulary, setShowVocabulary] = useState<boolean>(false);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<Word[]>([]);
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showHelpTooltip, setShowHelpTooltip] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      console.log('HelperRobotPanel: User is logged in with ID:', user.id);
      loadData();
    } else {
      console.log('HelperRobotPanel: User not logged in or missing ID');
    }
  }, [isLoggedIn, user?.id, targetLanguage, motherLanguage]);
  
  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Sync user progress to ensure we have the latest data
      if (user?.id) {
        console.log('HelperRobotPanel: Syncing word progress for user:', user.id);
        await syncWordProgress(user.id, targetLanguage);
      }
      
      // Load words data
      await loadWords();
      
      // Load language pairs data
      await loadLanguagePairs();
    } catch (error) {
      console.error('Error loading data:', error);
      logger.error('Error loading data in HelperRobotPanel', { error });
      setLoadError('Failed to load your progress data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadWords = async () => {
    if (!user?.id) return;
    
    try {
      // First get all words
      const { data: wordsData, error: wordsError } = await supabase
        .from('words_quiz')
        .select('*')
        .order('dialogue_id', { ascending: true })
        .order('id', { ascending: true });
        
      if (wordsError) {
        logger.error('Error fetching words', { error: wordsError });
        return;
      }
      
      if (wordsData) {
        // Process words based on target language
        const processedWords = wordsData.map(word => {
          // If target language is English, entry_in_en is the target word and entry_in_ru is the translation
          // If target language is Russian, entry_in_ru is the target word and entry_in_en is the translation
          return {
            ...word,
            word: targetLanguage === 'en' ? word.entry_in_en || word.word : word.entry_in_ru || word.word,
            translation: targetLanguage === 'en' ? word.entry_in_ru || word.translation : word.entry_in_en || word.translation
          };
        });
        
        setAllWords(processedWords);
        
        // Get user's language level to determine which words they've learned
        const { data: levelData, error: levelError } = await supabase
          .from('language_levels')
          .select('dialogue_number, word_progress, level')
          .eq('user_id', user.id)
          .eq('target_language', targetLanguage)
          .single();
          
        if (levelError && levelError.code !== 'PGRST116') {
          logger.error('Error fetching language level', { error: levelError });
          return;
        }
        
        console.log("Language level data:", levelData);
        
        // If we have actual data from the database, use it
        const highestDialogue = levelData?.dialogue_number || 0;
        console.log("Highest dialogue completed:", highestDialogue);
        
        // Mark words as learned if they're from completed dialogues
        const learned = processedWords.filter(word => word.dialogue_id <= highestDialogue);
        console.log(`Marking ${learned.length} words as learned from ${processedWords.length} total words`);
        setLearnedWords(learned);
      }
    } catch (error) {
      logger.error('Error in loadWords', { error });
      console.error('Error loading words:', error);
    }
  };
  
  const loadLanguagePairs = async () => {
    if (!user?.id) return;
    
    try {
      // Get all language pairs for this user, regardless of progress
      const { data, error } = await supabase
        .from('language_levels')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        logger.error('Error fetching language pairs', { error });
        return;
      }
      
      if (data) {
        console.log("All language pairs for user:", data);
        setLanguagePairs(data);
      }
    } catch (error) {
      logger.error('Error in loadLanguagePairs', { error });
    }
  };
  
  const switchLanguagePair = async (motherLang: 'en' | 'ru', targetLang: 'en' | 'ru') => {
    setLanguages(motherLang, targetLang);
    // After switching, reload data
    await loadData();
  };
  
  const startNewLanguagePair = () => {
    // Close the current panel
    onClose();
    
    // Use resetLanguageSelection instead of resetState to preserve login status
    resetLanguageSelection();
    
    // Trigger a custom event to signal that the language selection panel should be shown
    // This event will be caught by the App component
    setTimeout(() => {
      const customEvent = new CustomEvent('showLanguageSelection', {
        detail: { isLoggedIn: true }
      });
      window.dispatchEvent(customEvent);
      console.log('Triggered showLanguageSelection event');
    }, 100); // Small delay to ensure panel closes first
  };
  
  // Helper function to get language display name
  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      'en': 'English',
      'ru': 'Russian',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ar': 'Arabic',
      'zh': 'Chinese',
      'ja': 'Japanese'
    };
    
    return languages[code] || code;
  };
  
  const toggleVocabulary = () => {
    setShowVocabulary(!showVocabulary);
  };
  
  // Filter words based on search term
  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) return allWords;
    
    const term = searchTerm.toLowerCase().trim();
    return allWords.filter(word => 
      word.word.toLowerCase().includes(term) || 
      word.translation.toLowerCase().includes(term) ||
      (word.example && word.translation.toLowerCase().includes(term))
    );
  }, [allWords, searchTerm]);
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('turi_user');
      localStorage.removeItem('turi_anonymous_user');
      
      // Log out from Supabase auth
      await supabase.auth.signOut();
      
      // Use the store's logout function
      logout();
      
      // Close the panel
      onClose();
      
      logger.info('User logged out successfully');
      console.log('User logged out successfully');
    } catch (error) {
      logger.error('Error during logout', { error });
      console.error('Error during logout:', error);
    }
  };
  
  if (!isLoggedIn || !user) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 w-full max-w-md">
          <h2 className="text-xl font-bold text-white mb-4">{helperPanelTranslations[motherLanguage]?.signInRequired}</h2>
          <p className="text-slate-300 mb-6">{helperPanelTranslations[motherLanguage]?.signInMessage}</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              {helperPanelTranslations[motherLanguage]?.close}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Progress section tooltip content
  const progressHelpContent = (
    <div className="bg-slate-700 p-3 rounded-lg shadow-lg text-sm text-white max-w-xs">
      <p className="mb-2"><span className="font-bold">How progress is calculated:</span></p>
      <ul className="list-disc ml-4 space-y-1">
        <li>Words Learned: Based on words from completed dialogues</li>
        <li>Dialogues Completed: The number of dialogues you've finished</li>
        <li>Current Level: Each level contains 5 dialogues</li>
      </ul>
      <p className="mt-2 text-slate-300 text-xs">Complete more dialogues to increase all metrics!</p>
    </div>
  );
  
  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto" 
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative pointer-events-auto"
      >
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            {helperPanelTranslations[motherLanguage]?.title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center gap-1 transition-colors"
              title={helperPanelTranslations[motherLanguage]?.logout}
            >
              <LogOut size={16} />
              <span>{helperPanelTranslations[motherLanguage]?.logout}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors pointer-events-auto"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-slate-300">{helperPanelTranslations[motherLanguage]?.loading}</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-2xl">
                ⚠️
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{helperPanelTranslations[motherLanguage]?.errorTitle}</h3>
              <p className="text-slate-400 mb-6 max-w-md">{loadError}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadData();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors pointer-events-auto"
              >
                {helperPanelTranslations[motherLanguage]?.tryAgain}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Language Pair Selector */}
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  {/* Current Language Pair */}
                  <div className="bg-slate-800/80 p-3 rounded-md">
                    <div className="text-sm text-slate-400 mb-2">{helperPanelTranslations[motherLanguage]?.currentPair}</div>
                    <div className="flex items-center justify-center">
                      <span className="text-white font-medium">{getLanguageName(motherLanguage)}</span>
                      <span className="text-blue-400 mx-2">→</span>
                      <span className="text-white font-medium">{getLanguageName(targetLanguage)}</span>
                    </div>
                  </div>
                  
                  {/* Previous Pairs Dropdown */}
                  <div className="bg-slate-800/50 p-3 rounded-md">
                    <div className="text-sm text-slate-400 mb-2">{helperPanelTranslations[motherLanguage]?.previousPairs}</div>
                    {languagePairs.length > 0 ? (
                      <select 
                        className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-1 text-sm pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          const [mother, target] = e.target.value.split('-');
                          if (mother && target) {
                            switchLanguagePair(mother as 'en' | 'ru', target as 'en' | 'ru');
                          }
                        }}
                        value="placeholder"
                      >
                        <option value="placeholder" disabled>{helperPanelTranslations[motherLanguage]?.selectPrevious}</option>
                        {languagePairs.map(pair => (
                          <option 
                            key={`${pair.mother_language}-${pair.target_language}`}
                            value={`${pair.mother_language}-${pair.target_language}`}
                            disabled={pair.mother_language === motherLanguage && pair.target_language === targetLanguage}
                          >
                            {getLanguageName(pair.mother_language)} → {getLanguageName(pair.target_language)}
                            {pair.mother_language === motherLanguage && pair.target_language === targetLanguage ? 
                              ` ${helperPanelTranslations[motherLanguage]?.currentPairMark}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-center text-slate-400 text-sm py-1">
                        {helperPanelTranslations[motherLanguage]?.noPreviousPairs}
                      </div>
                    )}
                  </div>
                  
                  {/* New Language Button */}
                  <div className="bg-slate-800/50 p-3 rounded-md flex flex-col justify-between">
                    <div className="text-sm text-slate-400 mb-2">{helperPanelTranslations[motherLanguage]?.newLanguage}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startNewLanguagePair();
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors text-sm pointer-events-auto"
                    >
                      {helperPanelTranslations[motherLanguage]?.chooseNewLanguage}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Progress Section with Help Tooltip */}
              {user.id && (
                <div className={showVocabulary ? "hidden" : "block"}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-white">{helperPanelTranslations[motherLanguage]?.learningProgress}</h3>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHelpTooltip(!showHelpTooltip);
                        }}
                        className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 transition-colors text-sm pointer-events-auto"
                        aria-label={helperPanelTranslations[motherLanguage]?.showHelpTooltip}
                      >
                        ?
                      </button>
                      {showHelpTooltip && (
                        <div className="absolute right-0 top-8 z-10 pointer-events-auto">
                          {progressHelpContent}
                        </div>
                      )}
                    </div>
                  </div>
                  <ProgressVisualization userId={user.id} onWordsClick={toggleVocabulary} />
                </div>
              )}
              
              {/* Vocabulary Section with Search */}
              {showVocabulary && (
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">{helperPanelTranslations[motherLanguage]?.vocabulary}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVocabulary();
                      }}
                      className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded transition-colors pointer-events-auto"
                    >
                      {helperPanelTranslations[motherLanguage]?.backToSummary}
                    </button>
                  </div>
                  
                  <div className="bg-slate-700/30 p-4 rounded-lg mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
                          style={{ width: `${(learnedWords.length / (allWords.length || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-white font-medium whitespace-nowrap">
                        {learnedWords.length} / {allWords.length} {helperPanelTranslations[motherLanguage]?.words}
                      </div>
                    </div>
                    
                    {/* Search input */}
                    <div className="mt-4">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder={helperPanelTranslations[motherLanguage]?.searchWords}
                          className="bg-slate-800 text-white w-full py-2 px-4 pr-10 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {searchTerm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchTerm('');
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white pointer-events-auto"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Empty state for no words */}
                  {filteredWords.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📚</span>
                      </div>
                      {searchTerm ? (
                        <div>
                          <h4 className="text-lg font-medium text-white mb-2">{helperPanelTranslations[motherLanguage]?.noMatchingWords}</h4>
                          <p className="text-slate-400">{helperPanelTranslations[motherLanguage]?.tryDifferentSearch}</p>
                        </div>
                      ) : learnedWords.length === 0 ? (
                        <div>
                          <h4 className="text-lg font-medium text-white mb-2">{helperPanelTranslations[motherLanguage]?.noWordsLearned}</h4>
                          <p className="text-slate-400 mb-4">{helperPanelTranslations[motherLanguage]?.completeFirstDialogue}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm pointer-events-auto"
                          >
                            {helperPanelTranslations[motherLanguage]?.startLearning}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-lg font-medium text-white mb-2">No words available</h4>
                          <p className="text-slate-400">Try selecting a different language pair</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Word grid */}
                  {filteredWords.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                      {filteredWords.map(word => {
                        const isLearned = learnedWords.some(w => w.id === word.id);
                        return (
                          <div 
                            key={word.id}
                            className={`p-2 rounded-lg border cursor-pointer transition-colors hover:shadow-sm pointer-events-auto ${
                              isLearned 
                                ? 'bg-green-900/20 border-green-700/50 hover:bg-green-900/30' 
                                : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // This could be expanded to show a modal with more details, pronunciation, etc.
                              console.log('Word clicked:', word);
                            }}
                          >
                            <div className="flex flex-col">
                              <div className="flex justify-between items-start mb-1">
                                <span className={`font-medium text-sm truncate ${isLearned ? 'text-green-400' : 'text-slate-300'}`}>
                                  {word.word}
                                </span>
                                <div className="flex flex-col items-end">
                                  <span className="text-xs bg-slate-700 rounded px-1 py-0.5 ml-1 whitespace-nowrap mb-1">
                                    {word.dialogue_id}
                                  </span>
                                  <span className="text-xs bg-blue-700/50 rounded px-1 py-0.5 ml-1 whitespace-nowrap">
                                    {word.id}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-slate-400 truncate">{word.translation}</div>
                              {isLearned && (
                                <div className="mt-1 flex justify-end">
                                  <span className="text-xs bg-green-900/50 text-green-300 rounded-full px-1 py-0">
                                    ✓
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelperRobotPanel; 