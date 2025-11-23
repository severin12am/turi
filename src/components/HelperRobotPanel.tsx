import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useStore } from '../store';
import { logger } from '../services/logger';
import ProgressVisualization from './ProgressVisualization';
import { syncWordProgress } from '../services/progress';
import { getUserDictionary, type DictionaryEntry } from '../services/dictionary';
import { LogOut } from 'lucide-react';
import AppPanel from './AppPanel';
import { PanelBackdrop } from './AppPanel';
import { PanelTitle, PanelButton, PanelInput } from './PanelElements';
import { SCENARIO_NAMES, DIALOGUES_PER_SCENARIO, TOTAL_SCENARIOS, getScenarioName, getScenarioProgress } from '../constants/scenarios';
import { getMissionsForScenario, MISSIONS_PER_SCENARIO, getTotalMissions } from '../constants/missions';
import { getTranslation } from '../constants/translations';
import VocalQuizComponent from './VocalQuizComponent';

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
  entry_in_es?: string;
  entry_in_fr?: string;
  entry_in_de?: string;
  entry_in_it?: string;
  entry_in_pt?: string;
  entry_in_ar?: string;
  entry_in_ch?: string;
  entry_in_ja?: string;
  entry_in_av?: string;
  [key: string]: any; // Allow dynamic column access
}

interface LanguagePair {
  id: number;
  mother_language: string;
  target_language: string;
  level: number;
  word_progress: number;
  dialogue_number?: number;
  scenario_progress?: number;
  scenario_dialogue_progress?: number;
  mission_progress?: number;
  user_id?: string;
}

interface VocalQuizWord {
  id: number;
  entry_in_en: string;
  entry_in_ru: string;
  entry_in_es?: string;
  entry_in_fr?: string;
  entry_in_de?: string;
  entry_in_it?: string;
  entry_in_pt?: string;
  entry_in_ar?: string;
  entry_in_ch?: string;
  entry_in_ja?: string;
  entry_in_av?: string;
  dialogue_id: number;
  is_from_500: boolean;
  [key: string]: any;
}

const HelperRobotPanel: React.FC<HelperRobotPanelProps> = ({ onClose }) => {
  const { user, isLoggedIn, motherLanguage, targetLanguage, setLanguages, resetState, logout } = useStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showVocabulary, setShowVocabulary] = useState<boolean>(false);
  const [showCurrentVocabulary, setShowCurrentVocabulary] = useState<boolean>(false);
  const [showScenarios, setShowScenarios] = useState<boolean>(false);
  const [showMissions, setShowMissions] = useState<boolean>(false);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<Word[]>([]);
  const [dictionaryEntries, setDictionaryEntries] = useState<DictionaryEntry[]>([]);
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<Array<{scenario_number: number, mission_number: number}>>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dictionarySearchTerm, setDictionarySearchTerm] = useState<string>('');
  const [showHelpTooltip, setShowHelpTooltip] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Quiz states
  const [showVocabularyQuiz, setShowVocabularyQuiz] = useState<boolean>(false);
  const [quizWordsCount, setQuizWordsCount] = useState<string>('10');
  const [quizSource, setQuizSource] = useState<'current' | 'progress'>('current');
  
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
      
      // Load dictionary entries
      await loadDictionary();
      
      // Load language pairs data
      await loadLanguagePairs();
      
      // Load mission completions
      await loadMissionCompletions();
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
        // Dynamic language column mapping
        const getLanguageColumn = (lang: string): string => {
          const columnMap: Record<string, string> = {
            'en': 'entry_in_en',
            'ru': 'entry_in_ru',
            'es': 'entry_in_es',
            'fr': 'entry_in_fr',
            'de': 'entry_in_de',
            'it': 'entry_in_it',
            'ar': 'entry_in_ar',
            'CH': 'entry_in_ch',
            'ja': 'entry_in_ja',
            'tr': 'entry_in_tr'
          };
          return columnMap[lang] || 'entry_in_en'; // fallback to English
        };

        // Process words based on target language
        const processedWords = wordsData.map(word => {
          // Get the column names for target and mother languages
          const targetColumn = getLanguageColumn(targetLanguage);
          const motherColumn = getLanguageColumn(motherLanguage);
          
          // Get the words from the appropriate columns
          const targetWord = word[targetColumn] || word.word;
          const translationWord = word[motherColumn] || word.translation;
          
          return {
            ...word,
            word: targetWord,
            translation: translationWord
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
  
  const loadDictionary = async () => {
    if (!user?.id) return;
    
    try {
      console.log('HelperRobotPanel: Loading ALL dictionary entries for user:', user.id);
      // Load ALL dictionary entries for the user, not filtered by current language pair
      // This allows users to see all their saved vocabulary across all language pairs
      const entries = await getUserDictionary(user.id);
      console.log(`HelperRobotPanel: Loaded ${entries.length} dictionary entries from table`, entries);
      setDictionaryEntries(entries);
    } catch (error) {
      logger.error('Error in loadDictionary', { error });
      console.error('Error loading dictionary:', error);
    }
  };
  
  const loadLanguagePairs = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('language_levels')
        .select('*')
        .eq('user_id', user.id)
        .not('word_progress', 'eq', 0); // Only get pairs with some progress
        
      if (error) {
        logger.error('Error fetching language pairs', { error });
        return;
      }
      
      if (data) {
        console.log("Language pairs with progress:", data);
        setLanguagePairs(data);
      }
    } catch (error) {
      logger.error('Error in loadLanguagePairs', { error });
    }
  };
  
  const loadMissionCompletions = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('mission_completions')
        .select('scenario_number, mission_number')
        .eq('user_id', user.id);
        
      if (error) {
        logger.error('Error fetching mission completions', { error });
        return;
      }
      
      if (data) {
        console.log("Mission completions:", data);
        setMissionCompletions(data);
      }
    } catch (error) {
      logger.error('Error in loadMissionCompletions', { error });
    }
  };
  
  const switchLanguagePair = async (motherLang: 'en' | 'ru', targetLang: 'en' | 'ru') => {
    setLanguages(motherLang, targetLang);
    // After switching, reload data
    await loadData();
  };
  
  const startNewLanguagePair = () => {
    // Show "Coming Soon!" message instead of any functionality
    alert("Coming Soon!");
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
      'ar': 'Arabic',
      'CH': 'Chinese',
      'ja': 'Japanese',
      'tr': 'Turkish'
    };
    
    return languages[code] || code;
  };
  
  const toggleVocabulary = () => {
    setShowVocabulary(!showVocabulary);
  };
  
  const toggleCurrentVocabulary = () => {
    setShowCurrentVocabulary(!showCurrentVocabulary);
  };
  
  const toggleScenarios = () => {
    setShowScenarios(!showScenarios);
  };
  
  const toggleMissions = () => {
    setShowMissions(!showMissions);
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
  
  // Filter dictionary entries based on search term
  const filteredDictionaryEntries = useMemo(() => {
    if (!dictionarySearchTerm.trim()) return dictionaryEntries;
    
    const term = dictionarySearchTerm.toLowerCase().trim();
    return dictionaryEntries.filter(entry => 
      entry.word.toLowerCase().includes(term) || 
      (entry.translation && entry.translation.toLowerCase().includes(term))
    );
  }, [dictionaryEntries, dictionarySearchTerm]);
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      // Use the centralized logout function
      const { logout: authLogout } = await import('../services/auth');
      await authLogout();
      
      // Use the store's logout function to update UI state
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
  
  // Handle starting vocabulary quiz
  const handleStartQuiz = (source: 'current' | 'progress') => {
    const count = parseInt(quizWordsCount) || 10;
    if (count <= 0) {
      alert('Please enter a valid number of words (greater than 0)');
      return;
    }
    
    const sourceWords = source === 'current' ? filteredDictionaryEntries : learnedWords;
    if (sourceWords.length === 0) {
      alert(`No words available in ${source === 'current' ? 'Current Vocabulary' : 'Vocabulary Progress'}`);
      return;
    }
    
    setQuizSource(source);
    setShowVocabularyQuiz(true);
  };
  
  // Get quiz words based on source
  const getQuizWords = (): VocalQuizWord[] => {
    const count = parseInt(quizWordsCount) || 10;
    const sourceWords = quizSource === 'current' ? filteredDictionaryEntries : learnedWords;
    const maxWords = Math.min(count, sourceWords.length);
    
    // Shuffle and take the requested number of words
    const shuffled = [...sourceWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, maxWords);
    
    // Convert to VocalQuizWord format
    return selectedWords.map((word, index) => {
      const getLanguageColumn = (lang: string): string => {
        const columnMap: Record<string, string> = {
          'en': 'entry_in_en',
          'ru': 'entry_in_ru',
          'es': 'entry_in_es',
          'fr': 'entry_in_fr',
          'de': 'entry_in_de',
          'it': 'entry_in_it',
          'ar': 'entry_in_ar',
          'CH': 'entry_in_ch',
          'ja': 'entry_in_ja',
          'tr': 'entry_in_tr'
        };
        return columnMap[lang] || 'entry_in_en';
      };
      
      const targetCol = getLanguageColumn(targetLanguage);
      const motherCol = getLanguageColumn(motherLanguage);
      
      // Check if it's a DictionaryEntry (has target_word) or Word (has word)
      const targetWord = 'target_word' in word ? word.target_word : word.word;
      const motherWord = 'translation' in word ? word.translation : '';
      
      return {
        id: word.id,
        dialogue_id: 1, // Not relevant for vocabulary quiz
        is_from_500: false,
        entry_in_en: '',
        entry_in_ru: '',
        entry_in_es: '',
        entry_in_fr: '',
        entry_in_de: '',
        entry_in_it: '',
        entry_in_pt: '',
        entry_in_ar: '',
        entry_in_ch: '',
        entry_in_ja: '',
        entry_in_tr: '',
        [targetCol]: targetWord,
        [motherCol]: motherWord
      };
    });
  };
  
  // Handle quiz complete
  const handleQuizComplete = (passed: boolean) => {
    console.log('Vocabulary quiz completed, passed:', passed);
    setShowVocabularyQuiz(false);
  };
  
  // Handle quiz close
  const handleQuizClose = () => {
    console.log('Vocabulary quiz closed');
    setShowVocabularyQuiz(false);
  };
  
  // Show quiz if active
  if (showVocabularyQuiz) {
    return (
      <VocalQuizComponent
        dialogueId={1}
        characterId={1}
        onComplete={handleQuizComplete}
        onClose={handleQuizClose}
        customWords={getQuizWords()}
        isVocabularyQuiz={true}
      />
    );
  }
  
  if (!isLoggedIn || !user) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 w-full max-w-md">
          <h2 className="text-xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-slate-300 mb-6">Please sign in to view your language learning journey.</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Filter to get only previous language pairs with progress (exclude current pair)
  const previousPairs = languagePairs.filter(
    pair => pair.mother_language !== motherLanguage || pair.target_language !== targetLanguage
  );
  
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
    <PanelBackdrop zIndex={100}>
      <AppPanel 
        width={700} 
        height="auto" 
        className="helper-robot-panel max-h-[90vh] overflow-y-auto"
        style={{ minWidth: '700px', width: '700px' }}
      >
        <div className="flex justify-between items-center mb-6">
          <PanelTitle>
            Let's look at your progress
          </PanelTitle>
          
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors rounded-full p-2"
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
          </div>
        )}
        
        {loadError && !isLoading && (
          <div className="bg-red-500/20 border border-red-500/30 text-white p-4 rounded-2xl mb-6">
            <p>{loadError}</p>
            <PanelButton onClick={loadData} className="mt-4">Try Again</PanelButton>
          </div>
        )}
        
        {!isLoading && !loadError && (
          <>
            {/* Current language pair info */}
            <div className="bg-white/5 rounded-2xl p-5 mb-6">
              <h3 className="text-xl font-medium text-white/90 mb-3">Current language pair</h3>
              <div className="flex justify-between items-center">
                <p className="text-white/80">
                  <span className="text-blue-400 font-medium">{getLanguageName(motherLanguage)}</span> - <span className="text-blue-400 font-medium">{getLanguageName(targetLanguage)}</span>
                </p>
                <PanelButton 
                  onClick={startNewLanguagePair}
                  className="text-sm px-4 py-2"
                >
                  Start a New Language Pair
                </PanelButton>
              </div>
            </div>
            
            {/* Progress Metrics - Reordered */}
            {/* 1. Missions Progress */}
            <div className="bg-white/5 rounded-2xl p-5 mb-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={toggleMissions}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-medium text-white/90">Missions Progress</h3>
                <span className="text-blue-400 text-sm">{showMissions ? 'Hide Details' : 'Show Details'}</span>
              </div>
              <div className="mt-4">
                {languagePairs.map(pair => {
                  if (pair.mother_language === motherLanguage && pair.target_language === targetLanguage) {
                    const totalMissions = getTotalMissions(); // 150 missions total
                    const completedMissionsCount = missionCompletions.length;
                    
                    return (
                      <div key={pair.id}>
                        <div className="flex justify-between text-sm text-white/60 mb-1">
                          <span>Missions completed</span>
                          <span>{completedMissionsCount} / {totalMissions}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full" 
                            style={{ width: `${(completedMissionsCount / totalMissions) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
            
            {/* Missions list (shown when toggled) */}
            {showMissions && (
              <div className="mb-6">
                <div className="max-h-[60vh] overflow-y-auto bg-white/5 rounded-2xl p-4">
                  <div className="space-y-4">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(scenarioNum => {
                      const scenarioMissions = getMissionsForScenario(scenarioNum);
                      
                      return (
                        <div key={scenarioNum} className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-lg font-semibold text-white mb-3">
                            {getTranslation(motherLanguage, 'scenario')} {scenarioNum}: {getTranslation(motherLanguage, `scenario${scenarioNum}` as any)}
                          </h4>
                          
                          <div className="space-y-2">
                            {scenarioMissions.map((mission) => {
                              const isCompleted = missionCompletions.some(
                                mc => mc.scenario_number === scenarioNum && mc.mission_number === mission.missionNumber
                              );
                              
                              // For Mission 1: Check if all missions from previous scenario are completed
                              // For other missions: Check if previous mission in same scenario is completed
                              let isUnlocked = false;
                              
                              if (mission.missionNumber === 1) {
                                if (scenarioNum === 1) {
                                  // First scenario's first mission is always unlocked
                                  isUnlocked = true;
                                } else {
                                  // Check if ALL 5 missions of previous scenario are completed
                                  const prevScenarioMissions = missionCompletions.filter(
                                    mc => mc.scenario_number === scenarioNum - 1
                                  );
                                  const allPreviousCompleted = prevScenarioMissions.length === 5 &&
                                    [1, 2, 3, 4, 5].every(m => 
                                      prevScenarioMissions.some(mc => mc.mission_number === m)
                                    );
                                  isUnlocked = allPreviousCompleted;
                                }
                              } else {
                                // Mission N requires mission N-1 of same scenario
                                const isPreviousCompleted = missionCompletions.some(
                                  mc => mc.scenario_number === scenarioNum && mc.mission_number === mission.missionNumber - 1
                                );
                                isUnlocked = isPreviousCompleted;
                              }
                              
                              return (
                                <div
                                  key={mission.id}
                                  className={`p-3 rounded-lg transition-all ${
                                    isCompleted
                                      ? 'bg-green-900/20 border border-green-500/30'
                                      : isUnlocked
                                      ? 'bg-orange-900/20 border border-orange-500/30'
                                      : 'bg-white/5 border border-white/10 opacity-50'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-white">
                                          Mission {mission.missionNumber}
                                        </span>
                                        {!isUnlocked && (
                                          <span className="text-yellow-400 text-xs">🔒</span>
                                        )}
                                        {isCompleted && (
                                          <span className="text-green-400 text-xs">✓</span>
                                        )}
                                      </div>
                                      <p className={`text-xs ${isUnlocked ? 'text-white/80' : 'text-white/40'}`}>
                                        {mission.goal}
                                      </p>
                                      <p className={`text-xs italic mt-1 ${isUnlocked ? 'text-white/60' : 'text-white/30'}`}>
                                        NPC: {mission.npcRole}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* 2. Scenarios Progress */}
            <div className="bg-white/5 rounded-2xl p-5 mb-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={toggleScenarios}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-medium text-white/90">Scenarios Progress</h3>
                <span className="text-blue-400 text-sm">{showScenarios ? 'Hide Details' : 'Show Details'}</span>
              </div>
              <div className="mt-4">
                {languagePairs.map(pair => {
                  if (pair.mother_language === motherLanguage && pair.target_language === targetLanguage) {
                    let currentScenario = pair.scenario_progress || 0;
                    let currentDialogueProgress = pair.scenario_dialogue_progress || 0;
                    
                    if (currentDialogueProgress >= DIALOGUES_PER_SCENARIO && currentScenario > 0) {
                      currentScenario = currentScenario + 1;
                      currentDialogueProgress = 0;
                    }
                    
                    const scenariosCompleted = currentScenario > 0 ? currentScenario - 1 : 0;
                    
                    return (
                      <div key={pair.id}>
                        <div className="flex justify-between text-sm text-white/60 mb-1">
                          <span>Scenarios completed</span>
                          <span>{scenariosCompleted} / {TOTAL_SCENARIOS}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                            style={{ width: `${(scenariosCompleted / TOTAL_SCENARIOS) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
            
            {/* Scenarios list (shown when toggled) */}
            {showScenarios && (
              <div className="mb-6">
                <div className="max-h-[60vh] overflow-y-auto bg-white/5 rounded-2xl p-4">
                  <div className="space-y-3">
                    {Array.from({ length: TOTAL_SCENARIOS }, (_, i) => i + 1).map(scenarioNum => {
                      const currentPair = languagePairs.find(
                        pair => pair.mother_language === motherLanguage && pair.target_language === targetLanguage
                      );
                      
                      let userScenarioProgress = currentPair?.scenario_progress || 0;
                      let rawDialogueProgress = currentPair?.scenario_dialogue_progress || 0;
                      
                      if (rawDialogueProgress >= DIALOGUES_PER_SCENARIO && userScenarioProgress > 0) {
                        userScenarioProgress = userScenarioProgress + 1;
                        rawDialogueProgress = 0;
                      }
                      
                      const currentScenarioDialogues = scenarioNum === userScenarioProgress
                        ? rawDialogueProgress
                        : 0;
                      
                      const isUnlocked = scenarioNum <= userScenarioProgress;
                      const isCompleted = scenarioNum < userScenarioProgress;
                      const isCurrent = scenarioNum === userScenarioProgress;
                      
                      return (
                        <div
                          key={scenarioNum}
                          className={`p-4 rounded-xl transition-all ${
                            isCompleted
                              ? 'bg-green-900/20 border border-green-500/30'
                              : isCurrent
                              ? 'bg-purple-900/20 border border-purple-500/30'
                              : 'bg-white/5 border border-white/10 opacity-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold text-white">
                                  Scenario {scenarioNum}
                                </span>
                                {!isUnlocked && (
                                  <span className="text-yellow-400 text-sm">🔒</span>
                                )}
                                {isCompleted && (
                                  <span className="text-green-400 text-sm">✓</span>
                                )}
                              </div>
                              <p className={`text-sm ${isUnlocked ? 'text-white/80' : 'text-white/40'}`}>
                                {getTranslation(motherLanguage, `scenario${scenarioNum}` as any)}
                              </p>
                              {isCurrent && (
                                <p className="text-xs text-purple-400 mt-2">
                                  {currentScenarioDialogues} / {DIALOGUES_PER_SCENARIO} dialogues finished
                                </p>
                              )}
                              {isCompleted && (
                                <p className="text-xs text-green-400 mt-2">
                                  {DIALOGUES_PER_SCENARIO} / {DIALOGUES_PER_SCENARIO} dialogues finished
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* 3. Current Vocabulary Section */}
            <div className="bg-white/5 rounded-2xl p-5 mb-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={toggleCurrentVocabulary}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-medium text-white/90">Current Vocabulary</h3>
                  <p className="text-sm text-white/60 mt-1">{dictionaryEntries.length} saved words</p>
                </div>
                <span className="text-blue-400 text-sm">{showCurrentVocabulary ? 'Hide Details' : 'Show Details'}</span>
              </div>
            </div>
            
            {/* Current Vocabulary list (shown when toggled) */}
            {showCurrentVocabulary && (
              <div className="mb-6">
                <PanelInput
                  type="text"
                  placeholder="Search saved words..."
                  value={dictionarySearchTerm}
                  onChange={(e) => setDictionarySearchTerm(e.target.value)}
                  className="mb-4"
                />
                
                {/* Quiz Controls */}
                <div className="flex items-center gap-2 mb-4 bg-white/5 rounded-xl p-3">
                  <button
                    className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors border border-white/20"
                    disabled
                  >
                    randomly
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quizWordsCount}
                    onChange={(e) => setQuizWordsCount(e.target.value)}
                    className="w-20 px-3 py-2 text-sm bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                  <button
                    onClick={() => handleStartQuiz('current')}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all border border-blue-400/30"
                  >
                    quiz me
                  </button>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto bg-white/5 rounded-2xl p-4">
                  {filteredDictionaryEntries.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredDictionaryEntries.map(entry => (
                        <div 
                          key={entry.id}
                          className="relative p-3 rounded-xl transition-all bg-white/5 border border-white/10 hover:bg-white/10"
                        >
                          <div className="space-y-1">
                            <div 
                              className="text-lg font-medium text-white break-words cursor-help" 
                              title={entry.word}
                            >
                              {entry.word}
                            </div>
                            {entry.translation && (
                              <div 
                                className="text-sm text-slate-300 break-words cursor-help" 
                                title={entry.translation}
                              >
                                {entry.translation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-white/60">
                      {dictionarySearchTerm.trim() ? 'No words found' : 'No saved words yet. Hover over words in dialogues and click "Save to vocabulary" to add them here.'}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 4. 500 most common words separator */}
            <div className="my-6 border-t border-white/20 pt-2">
              <h3 className="text-lg font-medium text-white/70 text-center">{getTranslation(motherLanguage, 'commonWordsInContext')}</h3>
            </div>
            
            {/* 5. Level Progress */}
            <div className="bg-white/5 rounded-2xl p-5 mb-6">
              <h3 className="text-xl font-medium text-white/90 mb-3">Level Progress</h3>
              <div className="mt-4">
                {/* Display level progress */}
                {languagePairs.map(pair => {
                  if (pair.mother_language === motherLanguage && pair.target_language === targetLanguage) {
                    const currentLevel = pair.level || 1;
                    const maxLevel = 30;  // Total of 30 levels
                    const dialoguesInLevel = pair.dialogue_number ? pair.dialogue_number % 5 : 0;
                    const dialoguesPerLevel = 5;
                    const levelProgress = (dialoguesInLevel / dialoguesPerLevel) * 100;
                    
                    return (
                      <div key={pair.id}>
                        <div className="flex justify-between text-sm text-white/60 mb-1">
                          <span>Current Level</span>
                          <span>{currentLevel} / {maxLevel}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full" 
                            style={{ width: `${(currentLevel / maxLevel) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
            
            {/* 6. Dialogues Progress */}
            <div className="bg-white/5 rounded-2xl p-5 mb-6">
              <h3 className="text-xl font-medium text-white/90 mb-3">Dialogues Progress</h3>
              <div className="mt-4">
                {languagePairs.map(pair => {
                  if (pair.mother_language === motherLanguage && pair.target_language === targetLanguage) {
                    const totalDialogues = 150;
                    const completedDialogues = pair.dialogue_number || 0;
                    
                    return (
                      <div key={pair.id}>
                        <div className="flex justify-between text-sm text-white/60 mb-1">
                          <span>Dialogues completed</span>
                          <span>{completedDialogues} / {totalDialogues}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full" 
                            style={{ width: `${(completedDialogues / totalDialogues) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
            
            {/* 7. Vocabulary Progress */}
            <div className="bg-white/5 rounded-2xl p-5 mb-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={toggleVocabulary}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-medium text-white/90">Vocabulary Progress</h3>
                <span className="text-blue-400 text-sm">{showVocabulary ? 'Hide Details' : 'Show Details'}</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-white/60 mb-1">
                  <span>Words learned</span>
                  <span>{learnedWords.length} / {allWords.length}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${allWords.length > 0 ? (learnedWords.length / allWords.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Vocabulary list (shown when toggled) */}
            {showVocabulary && (
              <div className="mb-6">
                <PanelInput
                  type="text"
                  placeholder="Search words..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                
                {/* Quiz Controls */}
                <div className="flex items-center gap-2 mb-4 bg-white/5 rounded-xl p-3">
                  <button
                    className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors border border-white/20"
                    disabled
                  >
                    randomly
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quizWordsCount}
                    onChange={(e) => setQuizWordsCount(e.target.value)}
                    className="w-20 px-3 py-2 text-sm bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                  <button
                    onClick={() => handleStartQuiz('progress')}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all border border-blue-400/30"
                  >
                    quiz me
                  </button>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto bg-white/5 rounded-2xl p-4">
                  {filteredWords.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {filteredWords.map(word => (
                        <div 
                          key={word.id}
                          className={`relative p-3 rounded-xl transition-all ${
                            learnedWords.some(w => w.id === word.id) 
                              ? 'bg-green-900/20 border border-green-500/30' 
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {/* Word Info */}
                          <div className="space-y-2">
                            {/* Word Numbers */}
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>{word.id}</span>
                              <span>{word.dialogue_id}</span>
                            </div>
                            
                            {/* Word and Translation */}
                            <div className="space-y-1">
                              <div 
                                className="text-lg font-medium text-white truncate cursor-help" 
                                title={word.word}
                              >
                                {word.word}
                              </div>
                              <div 
                                className="text-sm text-slate-300 truncate cursor-help" 
                                title={word.translation}
                              >
                                {word.translation}
                              </div>
                            </div>
                            
                            {/* Example if available */}
                            {word.example && (
                              <div 
                                className="text-xs text-slate-400 italic mt-2 line-clamp-2 cursor-help" 
                                title={word.example}
                              >
                                {word.example}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-white/60">
                      No words found
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Account section */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-xl font-medium text-white/90 mb-4">Account</h3>
              
              {user ? (
                <div>
                  <p className="text-white/80 mb-4">
                    Logged in as: <span className="text-blue-400">{user.email}</span>
                  </p>
                  
                  <PanelButton 
                    onClick={handleLogout}
                    className="text-red-300 border-red-300/30 hover:bg-red-500/20"
                  >
                    Log Out
                  </PanelButton>
                </div>
              ) : (
                <p className="text-white/60">Not logged in</p>
              )}
            </div>
          </>
        )}
      </AppPanel>
    </PanelBackdrop>
  );
};

export default HelperRobotPanel; 