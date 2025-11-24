import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle, XCircle, HelpCircle, Volume, Mic, MicOff, 
  ArrowRight, Loader2, BookMarked 
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useStore } from '../store';
import { logger } from '../services/logger';
import { trackCompletedDialogue, saveAnonymousProgress } from '../services/auth';
import { trackCompletedScenarioDialogue } from '../services/progress';
import { generateSpeech, translateWord } from '../services/aiService'; // All AI calls through router
import { fetchScenarioQuizWords } from '../services/scenarioQuiz';
import { fetchScenarioExpressions } from '../services/scenarioExpressions';
import { extractExpressionsFromDialogue, type ExtractedExpression } from '../services/aiService'; // All AI calls go through router
import { addWordToDictionary } from '../services/dictionary';
import AppPanel, { PanelBackdrop } from './AppPanel';
import { PanelButton } from './PanelElements';
import { getTranslation } from '../constants/translations';

// Add WebSpeechAPI type definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    _quizSpeechRecognitionActive?: boolean;
  }
}

// Updated to match quiz table schema with all language columns
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
  audioUrl?: string; // Cached audio URL for TTS to avoid regenerating
  [key: string]: any; // Allow dynamic column access
}

interface VocalQuizProps {
  dialogueId: number;
  onComplete: (passed: boolean) => void;
  onClose: () => void;
  characterId?: number;
  isScenario?: boolean;
  scenarioNumber?: number;
  isMission?: boolean;
  missionConversation?: string; // Full conversation text from mission for AI extraction
  missionScenarioNumber?: number; // Scenario number for mission tracking
  missionNumber?: number; // Mission number (1-5) for tracking
  usedHelpInMission?: boolean; // Whether user used help during mission
  customWords?: VocalQuizWord[]; // Custom words for vocabulary quiz
  isVocabularyQuiz?: boolean; // Flag to indicate this is a vocabulary quiz (not counted)
}

import { useTranslations } from '../hooks/useTranslations';
import type { SupportedLanguage } from '../constants/translations';
import { getSpeechRecognitionLanguage, getLanguageName } from '../utils/languageMappings';

// getSpeechRecognitionLanguage is now imported from utils/languageMappings

// getLanguageName is now imported from utils/languageMappings

const VocalQuizComponent: React.FC<VocalQuizProps> = ({ 
  dialogueId, 
  onComplete, 
  onClose, 
  characterId = 1,
  isScenario = false,
  scenarioNumber = 1,
  isMission = false,
  missionConversation,
  missionScenarioNumber,
  missionNumber,
  usedHelpInMission = false,
  customWords,
  isVocabularyQuiz = false
}) => {
  // Log props received
  console.log('🎮 [VocalQuizComponent] Props received:', {
    isMission,
    usedHelpInMission,
    missionScenarioNumber,
    missionNumber,
    dialogueId,
    isVocabularyQuiz,
    customWordsCount: customWords?.length
  });
  
  // Get languages from store
  const { motherLanguage, targetLanguage, user, setIsQuizActive, setIsMovementDisabled } = useStore();
  
  // Get translations
  const { t } = useTranslations();
  
  // Added ref to track if user manually stopped listening
  const userStoppedListening = useRef(false);
  
  // Quiz state
  const [quizWords, setQuizWords] = useState<VocalQuizWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Add this line with other state declarations
  const [recognitionActive, setRecognitionActive] = useState(false);
  const recognitionActiveRef = useRef(false);
  
  // Dictionary state
  const [addingWordToDictionary, setAddingWordToDictionary] = useState(false);
  const [wordAddedFeedback, setWordAddedFeedback] = useState<string | null>(null);
  
  // Helper function to remove accents/diacritics for comparison
  const removeAccents = (str: string): string => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const PUNCTUATION_REGEX = /[\u2000-\u206F\u2E00-\u2E7F\u060C\u061B\u061F¿¡!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~،؟؛«»""''…-]/g;

  const stripPunctuation = (value: string): string => {
    return value.replace(PUNCTUATION_REGEX, '');
  };
  
  // Cleanup cached audio URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log('💾 QUIZ: Cleaning up cached audio URLs');
      quizWords.forEach(word => {
        if (word.audioUrl && word.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(word.audioUrl);
        }
      });
    };
  }, []); // Empty dependency array - only run on unmount
  
  // Ensure dialogue ID is a valid number
  const safeDialogueId = useMemo(() => {
    // Convert to number and check if valid
    const numId = Number(dialogueId);
    console.log('Creating safe dialogue ID:', dialogueId, '→', numId, 'isNaN?', isNaN(numId));
    
    // Default to 1 if not a valid number
    return isNaN(numId) ? 1 : numId;
  }, [dialogueId]);
  
  // Fetch quiz words from the database
  useEffect(() => {
    const fetchQuizWords = async () => {
      try {
        setIsLoading(true);
        
        // If custom words are provided (vocabulary quiz), use them directly
        if (isVocabularyQuiz) {
          if (customWords && customWords.length > 0) {
            console.log('📚 Using custom words for vocabulary quiz:', customWords.length, 'words');
            setQuizWords(customWords);
            setIsLoading(false);
            return;
          } else {
            console.error('⚠️ Vocabulary quiz requested but no valid words provided');
            setError('No valid words available for quiz. Please ensure your saved words have translations.');
            setIsLoading(false);
            return;
          }
        }
        
        logger.info('Fetching quiz words', { 
          dialogueId: safeDialogueId, 
          targetLanguage, 
          isScenario, 
          scenarioNumber 
        });
        console.log('🔍 QUIZ SYSTEM CHECK:', {
          dialogueId: safeDialogueId,
          isScenario,
          isMission,
          scenarioNumber,
          characterId,
          system: (isScenario || isMission) ? '✅ NEW (expressions table - exact matching)' : '❌ LEGACY (words_quiz table)'
        });
        
        // For scenarios OR missions, use 3-tier fallback: Supabase → AI → Words
        if (isScenario || isMission) {
          // For missions with conversation text, skip Tier 1 and go directly to AI extraction
          if (isMission && missionConversation) {
            console.log('🎯 Mission mode with conversation text: Using AI extraction directly');
            console.log('📝 Note: Mission conversations are unique - extracting fresh expressions each time');
            
            // Don't use cache for missions - each conversation is unique and AI-generated
            // Extract expressions from mission conversation with AI
            try {
              console.log('🤖 Calling AI to extract expressions from mission conversation...');
              
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AI extraction timeout')), 10000)
              );
              
              const extractionPromise = extractExpressionsFromDialogue({
                dialogueText: missionConversation,
                targetLanguage,
                motherLanguage
              });
              
              const aiExpressions: ExtractedExpression[] = await Promise.race([
                extractionPromise,
                timeoutPromise
              ]) as ExtractedExpression[];
              
              // Transform AI expressions to VocalQuizWord format
              const quizWordsFromAI: VocalQuizWord[] = aiExpressions.map((expr, index) => ({
                id: Date.now() + index,
                dialogue_id: safeDialogueId,
                entry_in_en: targetLanguage === 'en' ? expr.target : expr.mother,
                entry_in_ru: targetLanguage === 'ru' ? expr.target : (motherLanguage === 'ru' ? expr.mother : ''),
                entry_in_es: targetLanguage === 'es' ? expr.target : (motherLanguage === 'es' ? expr.mother : ''),
                entry_in_fr: targetLanguage === 'fr' ? expr.target : (motherLanguage === 'fr' ? expr.mother : ''),
                entry_in_de: targetLanguage === 'de' ? expr.target : (motherLanguage === 'de' ? expr.mother : ''),
                entry_in_it: targetLanguage === 'it' ? expr.target : (motherLanguage === 'it' ? expr.mother : ''),
                entry_in_pt: targetLanguage === 'pt' ? expr.target : (motherLanguage === 'pt' ? expr.mother : ''),
                entry_in_ar: targetLanguage === 'ar' ? expr.target : (motherLanguage === 'ar' ? expr.mother : ''),
                entry_in_ch: targetLanguage === 'CH' ? expr.target : (motherLanguage === 'CH' ? expr.mother : ''),
                entry_in_ja: targetLanguage === 'ja' ? expr.target : (motherLanguage === 'ja' ? expr.mother : ''),
                entry_in_tr: targetLanguage === 'tr' ? expr.target : (motherLanguage === 'tr' ? expr.mother : ''),
                [`entry_in_${targetLanguage}`]: expr.target,
                [`entry_in_${motherLanguage}`]: expr.mother,
                is_from_500: false
              }));
              
              if (quizWordsFromAI.length > 0) {
                console.log('✅ Mission AI extracted', quizWordsFromAI.length, 'expressions from actual conversation');
                
                // Don't cache mission expressions - each mission conversation is unique
                setQuizWords(quizWordsFromAI);
                setIsLoading(false);
                return;
              }
            } catch (aiError) {
              console.warn('⚠️ Mission AI extraction failed:', aiError instanceof Error ? aiError.message : 'Unknown error');
              logger.info('Mission AI extraction failed', { error: aiError });
            }
          }
          
          // TIER 1: Try pre-curated expressions from Supabase
          console.log('💬 Tier 1: Attempting to fetch pre-curated expressions from Supabase...');
          
          // For missions, always use expressions_1 table (characterId = 1)
          const effectiveCharacterId = isMission ? 1 : characterId;
          console.log(isMission ? '🎯 Mission mode: using expressions_1 table' : `📚 Scenario mode: using expressions_${characterId} table`);
          
          const scenarioExpressions = await fetchScenarioExpressions(
            effectiveCharacterId,
            safeDialogueId,
            scenarioNumber,
            targetLanguage,
            motherLanguage
          );
          
          // If expressions found, use them (fastest path)
          if (scenarioExpressions && scenarioExpressions.length > 0) {
            console.log('✅ Tier 1: Found', scenarioExpressions.length, 'pre-curated expressions');
            setQuizWords(scenarioExpressions as unknown as VocalQuizWord[]);
            setIsLoading(false);
            return;
          }
          
          // TIER 2: Try AI extraction
          console.log('⚠️ Tier 1 failed. Tier 2: Attempting AI expression extraction...');
          
          // Check cache first
          const cacheKey = `ai_expressions_${characterId}_${safeDialogueId}_${targetLanguage}_${motherLanguage}`;
          const cachedExpressions = sessionStorage.getItem(cacheKey);
          
          if (cachedExpressions) {
            try {
              const parsedCache = JSON.parse(cachedExpressions);
              console.log('✅ Tier 2: Found', parsedCache.length, 'cached AI expressions');
              setQuizWords(parsedCache as VocalQuizWord[]);
              setIsLoading(false);
              return;
            } catch (e) {
              console.warn('Failed to parse cached expressions, will regenerate');
            }
          }
          
          // No cache, fetch dialogue and extract with AI
          try {
            // Fetch dialogue text from scenario table
            const sourceTable = `scenario_${characterId}`;
            const { data: dialogueData, error: dialogueError } = await supabase
              .from(sourceTable)
              .select('*')
              .eq('dialogue_id', safeDialogueId)
              .order('dialogue_step', { ascending: true });
            
            if (dialogueError || !dialogueData || dialogueData.length === 0) {
              console.warn('⚠️ Tier 2: Could not fetch dialogue for AI extraction');
              throw new Error('No dialogue data for AI extraction');
            }
            
            // Get target language column name
            const getTargetLanguageColumn = (lang: SupportedLanguage): string => {
              const columnMap: Record<string, string> = {
                'en': 'en_text',
                'ru': 'ru_text',
                'es': 'es_text',
                'fr': 'fr_text',
                'de': 'de_text',
                'it': 'it_text',
                'pt': 'pt_text',
                'ar': 'ar_text',
                'CH': 'ch_text',
                'ja': 'ja_text',
                'tr': 'tr_text'
              };
              return columnMap[lang] || 'en_text';
            };
            
            // Extract dialogue text
            const targetColumn = getTargetLanguageColumn(targetLanguage);
            const allDialogueText = dialogueData
              .map(phrase => phrase[targetColumn] || '')
              .join(' ');
            
            if (!allDialogueText.trim()) {
              throw new Error('Empty dialogue text');
            }
            
            console.log('🤖 Tier 2: Calling AI to extract expressions from dialogue...');
            
            // Call AI extraction with timeout (10s to allow trying all 5 models)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AI extraction timeout')), 10000)
            );
            
            const extractionPromise = extractExpressionsFromDialogue({
              dialogueText: allDialogueText,
              targetLanguage,
              motherLanguage
            });
            
            const aiExpressions: ExtractedExpression[] = await Promise.race([
              extractionPromise,
              timeoutPromise
            ]) as ExtractedExpression[];
            
            // Transform AI expressions to VocalQuizWord format
            const quizWordsFromAI: VocalQuizWord[] = aiExpressions.map((expr, index) => ({
              id: Date.now() + index, // Temporary ID
              dialogue_id: safeDialogueId,
              entry_in_en: targetLanguage === 'en' ? expr.target : expr.mother,
              entry_in_ru: targetLanguage === 'ru' ? expr.target : (motherLanguage === 'ru' ? expr.mother : ''),
              entry_in_es: targetLanguage === 'es' ? expr.target : (motherLanguage === 'es' ? expr.mother : ''),
              entry_in_fr: targetLanguage === 'fr' ? expr.target : (motherLanguage === 'fr' ? expr.mother : ''),
              entry_in_de: targetLanguage === 'de' ? expr.target : (motherLanguage === 'de' ? expr.mother : ''),
              entry_in_it: targetLanguage === 'it' ? expr.target : (motherLanguage === 'it' ? expr.mother : ''),
              entry_in_pt: targetLanguage === 'pt' ? expr.target : (motherLanguage === 'pt' ? expr.mother : ''),
              entry_in_ar: targetLanguage === 'ar' ? expr.target : (motherLanguage === 'ar' ? expr.mother : ''),
              entry_in_ch: targetLanguage === 'CH' ? expr.target : (motherLanguage === 'CH' ? expr.mother : ''),
              entry_in_ja: targetLanguage === 'ja' ? expr.target : (motherLanguage === 'ja' ? expr.mother : ''),
              entry_in_tr: targetLanguage === 'tr' ? expr.target : (motherLanguage === 'tr' ? expr.mother : ''),
              [`entry_in_${targetLanguage}`]: expr.target,
              [`entry_in_${motherLanguage}`]: expr.mother,
              is_from_500: false
            }));
            
            if (quizWordsFromAI.length > 0) {
              console.log('✅ Tier 2: AI extracted', quizWordsFromAI.length, 'expressions');
              
              // Cache the results
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify(quizWordsFromAI));
                console.log('💾 Cached AI expressions for future use');
              } catch (e) {
                console.warn('Failed to cache AI expressions (storage full?)');
              }
              
              setQuizWords(quizWordsFromAI);
              setIsLoading(false);
              return;
            }
            
          } catch (aiError) {
            console.warn('⚠️ Tier 2 failed:', aiError instanceof Error ? aiError.message : 'Unknown error');
            logger.info('AI extraction failed, falling back to word matching', { error: aiError });
          }
          
          // TIER 3: Fallback to dynamic word matching from quiz table
          console.log('⚠️ Tier 2 failed. Tier 3: Falling back to dynamic word matching...');
          const scenarioWords = await fetchScenarioQuizWords(
            characterId,
            safeDialogueId,
            scenarioNumber,
            targetLanguage,
            motherLanguage
          );
          
          if (!scenarioWords || scenarioWords.length === 0) {
            logger.warn('No matching quiz words found for scenario (all tiers failed)', { 
              characterId, 
              dialogueId: safeDialogueId,
              scenarioNumber 
            });
            console.warn('❌ All 3 tiers failed. This scenario has no quiz available.');
            // Set empty array - quiz will show message about completion without quiz
            setQuizWords([]);
            setIsLoading(false);
            return;
          }
          
          console.log('✅ Tier 3: Found', scenarioWords.length, 'quiz words from fallback');
          setQuizWords(scenarioWords as VocalQuizWord[]);
          setIsLoading(false);
          return;
        }
        
        // For regular dialogues, use words_quiz table as before
        const { data, error } = await supabase
          .from('words_quiz')
          .select('*')
          .eq('dialogue_id', safeDialogueId); // Use the safe dialogue ID
        
        if (error) {
          logger.error('Error fetching quiz data', { error });
          console.error('Error fetching quiz data:', error);
          setError('Failed to load quiz words: ' + error.message);
          setIsLoading(false);
          return;
        }
        
        if (!data || data.length === 0) {
          logger.warn('No quiz words found', { dialogueId: safeDialogueId });
          console.warn('No quiz words found for dialogue ID:', safeDialogueId);
          
          // Try querying without the dialogue_id filter to see if there are any words at all
          const { data: allData, error: allError } = await supabase
            .from('words_quiz')
            .select('*');
        
          if (!allError && allData && allData.length > 0) {
            console.log('Found words in quiz table, but none for this dialogue_id. Total words:', allData.length);
            console.log('Available dialogue_ids:', [...new Set(allData.map(item => item.dialogue_id))]);
            
            // Fall back to dialogue_id 1 if the requested dialogue has no words
            if (safeDialogueId !== 1) {
              console.log('Falling back to dialogue_id 1');
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('words_quiz')
                .select('*')
                .eq('dialogue_id', 1);
        
              if (!fallbackError && fallbackData && fallbackData.length > 0) {
                console.log('Found fallback words for dialogue_id 1:', fallbackData.length);
                setQuizWords(fallbackData as VocalQuizWord[]);
                setIsLoading(false);
                return;
              }
            }
          }
          
          setError('No quiz words found for this dialogue');
          setIsLoading(false);
          return;
        }
        
        logger.info('Quiz words fetched successfully', { count: data.length });
        console.log('Fetched quiz words:', data);
        
        setQuizWords(data as VocalQuizWord[]);
        setIsLoading(false);
      } catch (err) {
        logger.error('Exception fetching quiz words', { error: err });
        console.error('Exception fetching quiz words:', err);
        setError('Failed to load quiz words: ' + (err as Error).message);
        setIsLoading(false);
      }
    };
    
    fetchQuizWords();
  }, [safeDialogueId, targetLanguage, isScenario, scenarioNumber, characterId, motherLanguage, customWords]);
  
  // Get current word
  const currentWord = quizWords.length > 0 ? quizWords[currentWordIndex] : null;
  
  // Handle case where quiz has no words (scenarios might not have matching common words)
  const hasQuizWords = quizWords.length > 0;
  
  // Get the word to display and the expected answer based on language direction
  const getCurrentWord = () => {
    try {
      if (!currentWord) return { displayWord: '', answerWord: '' };

      // Dynamic language column mapping
      const getLanguageColumn = (lang: SupportedLanguage): string => {
        // Map language codes to database column names
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

      // Get the column names for target and mother languages
      const targetColumn = getLanguageColumn(targetLanguage);
      const motherColumn = getLanguageColumn(motherLanguage);

      // Get the words from the appropriate columns
      const targetWord = currentWord[targetColumn] || '';
      const motherWord = currentWord[motherColumn] || '';

      // Debug logging
      console.log('🔍 getCurrentWord DEBUG:', {
        targetLanguage,
        motherLanguage,
        targetColumn,
        motherColumn,
        targetWord,
        motherWord,
        availableColumns: Object.keys(currentWord).filter(key => key.startsWith('entry_in_'))
      });

      // Fallback logic if columns don't exist
      let finalTargetWord = targetWord;
      let finalMotherWord = motherWord;

      // If target word is empty, try English fallback
      if (!finalTargetWord && currentWord.entry_in_en) {
        finalTargetWord = currentWord.entry_in_en;
        console.log('🔄 Using English fallback for target word:', finalTargetWord);
      }

      // If mother word is empty, try English fallback
      if (!finalMotherWord && currentWord.entry_in_en) {
        finalMotherWord = currentWord.entry_in_en;
        console.log('🔄 Using English fallback for mother word:', finalMotherWord);
      }
      
      // If both are still empty, try to use ANY available language column
      if (!finalTargetWord || !finalMotherWord) {
        const availableWord = currentWord.entry_in_es || 
                             currentWord.entry_in_ru || 
                             currentWord.entry_in_fr || 
                             currentWord.entry_in_de ||
                             currentWord.spanish ||
                             currentWord.english ||
                             currentWord.russian ||
                             '';
        
        if (availableWord) {
          if (!finalTargetWord) {
            finalTargetWord = availableWord;
            console.log('🔄 Using available word as target:', finalTargetWord);
          }
          if (!finalMotherWord) {
            finalMotherWord = `[${availableWord}] (translation missing - please populate quiz table)`;
            console.warn('⚠️ Quiz table missing translations! Only Spanish words are populated.');
          }
        }
      }

      // User is learning the target language, so:
      // - Show word in mother language (what they know)
      // - Expect answer in target language (what they're learning)
      return {
        displayWord: finalMotherWord,  // Show in mother language
        answerWord: finalTargetWord    // Expect in target language
      };
    } catch (error) {
      console.error('Error in getCurrentWord:', error);
      // Return safe default values if there's an error
      return { displayWord: '', answerWord: '' };
    }
  };
  
  const { displayWord, answerWord } = getCurrentWord();
  
  // Set up speech recognition - improved for Russian language support
  useEffect(() => {
    // Skip if no word is available yet
    if (!currentWord) {
      return;
    }
  
    // Early cleanup of any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current = null;
        setRecognitionActive(false);
        recognitionActiveRef.current = false;
      } catch (error) {
        console.error('Error cleaning up previous recognition instance:', error);
      }
    }
    
    // Check browser support
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    
    // Current expected answer - stored for closure access
    const expectedAnswer = answerWord;
    console.log(`🎯 Setting up recognition for expected answer: "${expectedAnswer}"`);
    
    // Longer wait for first question to ensure dialogue recognition is fully released
    const initDelay = currentWordIndex === 0 ? 1200 : 500;
    console.log(`Setting up recognition with ${initDelay}ms delay (first question: ${currentWordIndex === 0})`);
    
    // Wait before initializing to avoid race conditions
    const initTimeout = setTimeout(() => {
      try {
        // Prevent multiple initialization
        if (recognitionActiveRef.current) {
          console.log('🎤 Recognition is already active, skipping initialization');
          return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Set language based on what the user is learning
        const recognitionLanguage = getSpeechRecognitionLanguage(targetLanguage);
        recognition.lang = recognitionLanguage || 'en-US';
        
        console.log(`🎤 Creating speech recognition for: ${recognitionLanguage}`);
        
        // Simple configuration that's known to work more reliably
        recognition.continuous = false;
        recognition.interimResults = false;  // Only get final results
        recognition.maxAlternatives = 5;  // Increased from 3 to 5 for better matching
        
        // Basic handlers with minimal logic
        recognition.onstart = () => {
          console.log(`🎤 Recognition started (language: ${recognitionLanguage})`);
          setIsListening(true);
          setRecognitionActive(true);
          recognitionActiveRef.current = true;
        };
      
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          try {
            // Keep it simple - get the transcript and alternatives
            const result = event.results[0];
            
            // Try to get multiple alternatives for better matching
            let transcripts = [];
            for (let i = 0; i < result.length; i++) {
              transcripts.push(result[i].transcript.trim());
              console.log(`🎤 Recognized (alt ${i}): "${result[i].transcript}" (${result[i].confidence.toFixed(2)})`);
            }
            
            // Use the first/best transcript for display
            const primaryTranscript = transcripts[0];
            setTranscript(primaryTranscript);
            
            // Log answer info for debugging
            console.log(`🔍 DEBUG - Expected answer: "${expectedAnswer}"`);
            console.log(`🔍 DEBUG - Transcribed: "${primaryTranscript}"`);
            
            // Check all alternatives against the expected answer
            let foundMatch = false;
            let matchingTranscript = '';
            
            for (const transcript of transcripts) {
              // If exact visual match (ignoring only whitespace)
              if (transcript.trim() === expectedAnswer.trim()) {
                console.log(`✅ EXACT MATCH! "${transcript}" matches "${expectedAnswer}"`);
                foundMatch = true;
                matchingTranscript = transcript;
                break;
              }
              
              // If match after cleaning
              if (checkTranscriptMatch(transcript, expectedAnswer)) {
                console.log(`✅ MATCHED! "${transcript}" accepted for "${expectedAnswer}"`);
                foundMatch = true;
                matchingTranscript = transcript;
                break;
              }
            }
            
            // Process the answer based on matching
            if (foundMatch) {
              console.log(`✅ ACCEPTING ANSWER: "${matchingTranscript}" for "${expectedAnswer}"`);
              processCorrectAnswer();
            } else {
              console.log(`❌ REJECTING ANSWER: No match found for "${expectedAnswer}"`);
              processIncorrectAnswer();
            }
          } catch (err) {
            console.error('Error processing recognition result:', err);
            // If error, ensure we reset the recognition state
            setRecognitionActive(false);
            recognitionActiveRef.current = false;
            setIsListening(false);
          }
        };
        
        recognition.onend = () => {
          console.log('🎤 Recognition ended');
          setIsListening(false);
          
          // Reset the active flag
          setRecognitionActive(false);
          recognitionActiveRef.current = false;
          
          // Restart recognition if we're still waiting for an answer
          if (isCorrect === null && !userStoppedListening.current) {
            console.log('🎤 Auto-restarting recognition after end event');
            
            // Create a reliable restart function
            const restartRecognition = (attempt = 1, maxAttempts = 3) => {
              try {
                if (recognitionRef.current && isCorrect === null && !recognitionActiveRef.current) {
                  recognition.start();
                  console.log(`🎤 Recognition restarted successfully (attempt ${attempt})`);
                  return true;
                }
              } catch (err) {
                console.error(`Error restarting recognition (attempt ${attempt}):`, err);
                
                // Try again if we haven't reached max attempts
                if (attempt < maxAttempts) {
                  console.log(`Scheduling retry ${attempt + 1} of ${maxAttempts}`);
                  setTimeout(() => {
                    restartRecognition(attempt + 1, maxAttempts);
                  }, 700); // Longer delay between retries
                } else {
                  console.error('Failed all recognition restart attempts');
                }
              }
              return false;
            };
            
            // Give a little delay before first attempt
            setTimeout(() => {
              restartRecognition();
            }, 800);
          }
        };
        
        recognition.onerror = (event: any) => {
          const errorEvent = event as any;
          console.error(`🎤 Recognition error: ${errorEvent.error}`);
          
          // Reset the recognition state
          setRecognitionActive(false);
          recognitionActiveRef.current = false;
          setIsListening(false);
          
          // Only try to restart if it's a network error or aborted
          if (errorEvent.error === 'network' || errorEvent.error === 'aborted') {
            setTimeout(() => {
              try {
                if (recognitionRef.current && isCorrect === null && !recognitionActiveRef.current) {
                  recognitionRef.current.start();
                  console.log('🎤 Restarted after error');
                }
              } catch (e) {
                console.error('Failed to restart after error', e);
              }
            }, 2000); // Longer timeout for errors
          }
        };
        
        // Store and start only if not already active
        recognitionRef.current = recognition;
        
        // Only start if not already active
        if (!recognitionActiveRef.current) {
          try {
            recognition.start();
            console.log('🎤 Initial recognition started');
          } catch (err) {
            console.error('Failed to start initial recognition:', err);
          }
        }
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        setRecognitionActive(false);
        recognitionActiveRef.current = false;
      }
    }, initDelay); // Small delay before initializing
    
    // Cleanup
    return () => {
      clearTimeout(initTimeout);
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          recognitionRef.current = null;
          setRecognitionActive(false);
          recognitionActiveRef.current = false;
        } catch (error) {
          console.error('Error cleaning up recognition:', error);
        }
      }
    };
  }, [currentWordIndex, isCorrect, targetLanguage, answerWord, currentWord]); // Re-initialize when word, language, or answer changes
  
  // Check if a transcript matches the expected answer
  const checkTranscriptMatch = (transcript: string, expected: string): boolean => {
    if (!transcript || !expected) return false;
    
    console.log(`🔍 Comparing answer: "${transcript.trim()}" vs expected "${expected.trim()}"`);
    
    // Special case for first question - be more lenient
    const isFirstQuestion = currentWordIndex === 0;
    if (isFirstQuestion) {
      console.log('🔍 This is the first question - using more lenient matching');
      
      // Check if it's "ваш" which is particularly problematic
      if (expected.trim().toLowerCase() === 'ваш') {
        console.log('🔍 Special case for "ваш" - extra lenient matching');
        const userLower = transcript.toLowerCase().trim();
        
        // Add common English sounds heard for "ваш"
        const lenientMatches = ['va', 'wa', 'vash', 'wash', 'wha', 'vas', 'vos', 'was', 'wass'];
        for (const match of lenientMatches) {
          if (userLower.includes(match)) {
            console.log(`✓ FIRST QUESTION LENIENT MATCH: found "${match}" in "${userLower}"`);
            return true;
          }
        }
      }
    }
  
    // NEW: Special case for when user says "машина" which seems to cause issues
    if (transcript.trim().toLowerCase().includes('машина') || transcript.trim().toLowerCase().includes('mashina')) {
      console.log('🚨 Detected "машина" in speech - using special handler to continue recognition');
      // Don't accept as correct, but ensure we restart recognition immediately
      setTimeout(() => {
        try {
          if (recognitionRef.current && isCorrect === null) {
            console.log('🔄 Forcefully restarting recognition after "машина" detected');
            
            // Force abort and recreate to ensure clean state
            recognitionRef.current.abort();
            
            // Create fresh recognition instance after a short delay
            setTimeout(() => {
              const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
              const freshRecognition = new SpeechRecognition();
              freshRecognition.continuous = false;
              freshRecognition.interimResults = false;
              freshRecognition.maxAlternatives = 10;
              freshRecognition.lang = getSpeechRecognitionLanguage(targetLanguage) || 'en-US';
              
              // Copy existing handlers
              if (recognitionRef.current) {
                freshRecognition.onresult = recognitionRef.current.onresult;
                freshRecognition.onend = recognitionRef.current.onend;
                freshRecognition.onerror = recognitionRef.current.onerror;
              }
              
              // Replace the reference and start
              recognitionRef.current = freshRecognition;
              if (recognitionRef.current) {
                recognitionRef.current.start();
                console.log('🔄 Started fresh recognition after "машина"');
              }
            }, 300);
          }
        } catch (e) {
          console.error('Error handling "машина" special case:', e);
        }
      }, 100);
      return false;
    }
  
    // Directly compare the transcripts for exact visual match - extra important for Russian
    if (transcript.trim() === expected.trim()) {
      console.log('✓ EXACT VISUAL MATCH');
      return true;
    }
    
    // Clean up both strings for comparison
    const userClean = stripPunctuation(removeAccents(transcript.toLowerCase().trim()))
      .replace(/\s+/g, ' ');
    
    const expectedClean = stripPunctuation(removeAccents(expected.toLowerCase().trim()))
      .replace(/\s+/g, ' ');
    
    console.log(`🔍 Checking: "${userClean}" vs "${expectedClean}"`);
    
    // Compare directly ignoring case
    if (userClean === expectedClean) {
      console.log('✓ EXACT MATCH (ignoring case)');
      return true;
    }
    
    // NEW: Check if the expected word appears anywhere in the transcript
    // This makes it more lenient for repeated words like "ты ты"
    if (userClean.includes(expectedClean)) {
      console.log('✓ CONTAINS MATCH - expected word found in transcript');
      return true;
    }
    
    // Russian-specific exact match ignoring case and all spaces
    if (targetLanguage === 'ru') {
      const userNoSpace = userClean.replace(/\s+/g, '');
      const expectedNoSpace = expectedClean.replace(/\s+/g, '');
    
      if (userNoSpace === expectedNoSpace) {
        console.log('✓ EXACT MATCH (ignoring spaces)');
        return true;
      }
      
      // NEW: Check if expectedNoSpace appears anywhere in userNoSpace
      // Handles cases like "тыты" which should match "ты"
      if (userNoSpace.includes(expectedNoSpace)) {
        console.log('✓ CONTAINS MATCH (ignoring spaces)');
        return true;
      }
    }
    
    // Make character matching stricter
    if (expectedClean.length > 0 && userClean.length > 0) {
      // Check if they have similar length - prevents "машина" matching with "ваш"
      const lengthDifference = Math.abs(expectedClean.length - userClean.length);
      if (lengthDifference > 2 && !userClean.includes(expectedClean)) {
        console.log('✗ LENGTH MISMATCH: too different');
        return false;
      }
      
      // Count matching characters at start of word
      let matchingChars = 0;
      const minLength = Math.min(expectedClean.length, userClean.length);
      
      for (let i = 0; i < minLength; i++) {
        if (expectedClean[i] === userClean[i]) {
          matchingChars++;
        } else {
          break;
        }
      }
      
      // Stricter percentage requirement - at least 50% of the word must match
      const matchPercentage = (matchingChars / expectedClean.length) * 100;
      console.log(`🔤 Character match: ${matchingChars} chars, ${matchPercentage.toFixed(1)}%`);
      
      if (matchingChars >= 2 && matchPercentage >= 50) {
        console.log('✓ CHARACTER MATCH at beginning of word');
        return true;
      }
      
      // Special phonetic matching for Russian
      if (targetLanguage === 'ru') {
        // Examples of common misconversions:
        // "ваш" might be heard as "wash" or "vash"
        // "мой" might be heard as "moy"
        
        // Check for specific exact match cases
        const russianExactMatches: {[key: string]: string[]} = {
          'ваш': ['wash', 'vash', 'vosh', 'воше', 'ваше', 'vas', 'wass', 'was', 'what\'s', 'wax', 'voice', 'watch', 'wats', 'watts', 'vos', 'vars', 'vass', 'wass', 'vac', 'wise', 'fast', 'vast'],
          'мой': ['moy', 'moi', 'моя', 'my', 'me', 'mine', 'may', 'boy', 'toy', 'roy', 'joy'],
          'твой': ['tvoy', 'tvoi', 'твоя'],
          'наш': ['nash', 'наше'],
          'ваша': ['vasha', 'washa'],
          'моя': ['moya', 'моя', 'моё'], 
          'их': ['ikh', 'eeh', 'eah'],
          'твоя': ['tvoya', 'твой'],
          'его': ['yevo', 'yego', 'его'],
          'ты': ['ty', 'ti', 'tea', 'tee']  // Added more phonetic matches for "ты"
        };
        
        // Check for direct matches in our dictionary
        for (const [russianWord, englishEquivalents] of Object.entries(russianExactMatches)) {
          if (expectedClean === russianWord) {
            if (englishEquivalents.includes(userClean)) {
              console.log(`✓ RUSSIAN EXACT PHONETIC MATCH: ${russianWord} = ${userClean}`);
              return true;
            }
          }
        }
        
        // Simple phonetic map for Russian->English conversion
        const russianToEnglishMap: {[key: string]: string[]} = {
          'в': ['v', 'w'], 
          'а': ['a'],
          'ш': ['sh', 's'],
          'м': ['m'],
          'о': ['o'],
          'й': ['y', 'j', 'i'],
          'т': ['t'],
          'я': ['ya', 'ia'],
          'и': ['e', 'i', 'ee']
        };
        
        // This approach is too permissive and can lead to false positives
        // Let's make it stricter by requiring more accurate matches
        
        // Only attempt phonetic matching on short words (3 chars or less)
        // where confusion is more likely
        if (expectedClean.length <= 3) {
          // Convert expected Russian to possible English phonetics
          const russianChars = expectedClean.split('');
          let englishPhoneticParts: string[] = [];
          
          // Build possible English phonetic parts
          russianChars.forEach(char => {
            if (russianToEnglishMap[char]) {
              englishPhoneticParts = [...englishPhoneticParts, ...russianToEnglishMap[char]];
            }
          });
          
          // Check if the English transcript contains phonetic parts
          // but be much stricter - require most parts to match
          let matchCount = 0;
          if (englishPhoneticParts.length > 0) {
            englishPhoneticParts.forEach(part => {
              if (userClean.includes(part)) {
                matchCount++;
              }
            });
            
            // Require at least 75% of phonetic parts to match
            const requiredMatches = Math.ceil(englishPhoneticParts.length * 0.75);
            if (matchCount >= requiredMatches) {
              console.log(`✓ PHONETIC MATCH for Russian word: ${matchCount}/${englishPhoneticParts.length} parts`);
              return true;
            }
          }
        }
      }
    }
    
    return false;
  };
  
  // Process a correct answer
  const processCorrectAnswer = () => {
    console.log('✅ Answer accepted as correct');
    setIsCorrect(true);
      setCorrectCount(prev => prev + 1);
      
      // Play success sound
      const audio = new Audio('/sounds/correct.mp3');
    audio.play().catch(e => console.error('Failed to play sound:', e));
    
    // Always stop listening after processing an answer
    if (recognitionRef.current) {
      try {
        userStoppedListening.current = true;
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition after correct answer:', err);
      }
    }
    
    // Move to next word after a brief delay
    setTimeout(() => {
      if (currentWordIndex < quizWords.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setTranscript('');
        setIsCorrect(null);
        setShowHint(false);
      } else {
        // Last word - finish quiz and show results
        finishQuiz();
        // Increment index to trigger results screen render
        setCurrentWordIndex(prev => prev + 1);
        setTranscript('');
        setIsCorrect(null);
      }
    }, 1500);
  };
  
  // Process an incorrect answer
  const processIncorrectAnswer = () => {
    console.log('❌ Answer incorrect');
    setIsCorrect(false);
    
    // Play error sound
    const audio = new Audio('/sounds/incorrect.mp3');
    audio.play().catch(e => console.error('Failed to play sound:', e));
    
    // CRUCIAL: Stop the current recognition but ensure we restart properly
    if (recognitionRef.current) {
      try {
        // Temporarily stop to reset the recognition state
        recognitionRef.current.stop();
        console.log('🎤 Temporarily stopped recognition after incorrect answer');
      } catch (err) {
        console.error('Error stopping recognition after incorrect answer:', err);
      }
    }
    
    // Show the error state momentarily but ensure we restart listening properly
    // Use a guaranteed restart approach with multiple attempts
    setTimeout(() => {
      // Only reset if still on the same question and still marked as incorrect
      if (isCorrect === false) {
        console.log('🎤 Resetting after incorrect answer');
        setIsCorrect(null);
        setTranscript('');
        
        // Make sure user didn't manually stop listening
        userStoppedListening.current = false;
        
        // First restart attempt
        const attemptRestart = () => {
          if (recognitionRef.current && isCorrect === null) {
            try {
              recognitionRef.current.start();
              console.log('🎤 Successfully restarted recognition after incorrect answer');
              return true;
            } catch (err) {
              console.warn('Error on first restart attempt:', err);
              return false;
            }
          }
          return false;
        };
        
        // Schedule multiple restart attempts
        setTimeout(() => {
          if (!attemptRestart()) {
            console.log('🎤 First restart attempt failed, scheduling second attempt');
            setTimeout(() => {
              if (!attemptRestart()) {
                console.log('🎤 Second restart attempt failed, scheduling final attempt');
                setTimeout(() => {
                  if (!attemptRestart()) {
                    console.error('🎤 All restart attempts failed after incorrect answer');
                  }
                }, 500);
              }
            }, 300);
          }
        }, 300);
      } else {
        console.log('🎤 Not resetting - state has changed');
      }
    }, 1000); // Faster error display for better responsiveness
  };

  // Debug function to manually process a recognized word (bypassing speech recognition)
  const debugRecognizeWord = () => {
    try {
      if (!currentWord || !answerWord) {
        console.error('Cannot debug recognize - currentWord or answerWord is empty');
        return;
      }
      
      const fakeRecognition = answerWord.toLowerCase();
      console.log(`🐛 DEBUG: Processing word manually: "${fakeRecognition}"`);
      setTranscript(fakeRecognition);
      
      // Use the match checker for consistency
      if (checkTranscriptMatch(fakeRecognition, answerWord)) {
        processCorrectAnswer();
      } else {
        processIncorrectAnswer();
      }
    } catch (error) {
      console.error('Error in debugRecognizeWord:', error);
    }
  };
  
  // Load speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('📢 Loaded', voices.length, 'voices');
        setAvailableVoices(voices);
        setVoicesLoaded(true);
        
        // Log available voices for debug
        voices.forEach((voice, i) => {
          console.log(`Voice ${i}: ${voice.name}, Lang: ${voice.lang}, Default: ${voice.default}`);
        });
      } else {
        console.log('No voices available yet, waiting...');
      }
    };
    
    // Initial load
    loadVoices();
    
    // Chrome needs this event to get voices
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);
  
  // Special handler ONLY for the first quiz question
  useEffect(() => {
    // ONLY run this for the first question (index 0)
    if (currentWordIndex !== 0 || !currentWord) {
      return;
    }

    console.log('🚨 SPECIAL FIRST QUESTION HANDLER ACTIVATED');
    console.log(`Expected answer for first question: "${answerWord}"`);

    // Ensure any existing recognition is fully cleared
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
        console.log('🧹 Cleared existing recognition for first question');
      } catch (e) {
        console.error('Error clearing recognition:', e);
      }
    }

    // Give the browser a moment to release resources
    setTimeout(() => {
      try {
        // Create a completely fresh recognition ONLY for first question
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error('Speech recognition not supported');
          return;
        }

        const firstQuestionRecognition = new SpeechRecognition();
        
        // Configure with increased alternatives for better matching
        firstQuestionRecognition.continuous = false;
        firstQuestionRecognition.interimResults = false;
        firstQuestionRecognition.maxAlternatives = 10; // Much higher for first question
        firstQuestionRecognition.lang = getSpeechRecognitionLanguage(targetLanguage) || 'en-US';
        
        console.log(`🎤 Created dedicated recognition for first question (${firstQuestionRecognition.lang})`);

        // Handle start event
        firstQuestionRecognition.onstart = () => {
          console.log('🎤 First question recognition started');
          setIsListening(true);
          setRecognitionActive(true);
          recognitionActiveRef.current = true;
        };

        // Handle result with extremely lenient matching for first question only
        firstQuestionRecognition.onresult = (event: any) => {
          try {
            const results = event.results[0];
            
            // Log ALL alternatives for debugging
            console.log(`🔍 First question recognition results (${results.length} alternatives):`);
            const transcripts = [];
            
            for (let i = 0; i < results.length; i++) {
              const alt = results[i];
              transcripts.push(alt.transcript.trim());
              console.log(`  Alternative ${i+1}: "${alt.transcript}" (${alt.confidence.toFixed(2)})`);
            }
            
            // Set the primary transcript for UI
            const primaryTranscript = transcripts[0];
            setTranscript(primaryTranscript);
            
            // Check if ANY of the alternatives are acceptable
            let foundMatch = false;
            let matchingTranscript = '';
            
            // First, try normal matching
            for (const transcript of transcripts) {
              if (checkTranscriptMatch(transcript, answerWord)) {
                console.log(`✅ First question matched: "${transcript}" accepted for "${answerWord}"`);
                foundMatch = true;
                matchingTranscript = transcript;
                break;
              }
            }
            
            // If still no match, try EXTREMELY lenient matching just for first question
            if (!foundMatch) {
              // Extra lenient matching - check if any transcript has any part of the expected answer
              const cleanExpected = stripPunctuation(removeAccents(answerWord.toLowerCase().trim()));
              
              // Break expected into character pairs and check for them
              if (cleanExpected.length >= 2) {
                for (let i = 0; i < cleanExpected.length - 1; i++) {
                  const charPair = cleanExpected.substr(i, 2);
                  
                  for (const transcript of transcripts) {
                    const cleanTranscript = stripPunctuation(removeAccents(transcript.toLowerCase().trim()));
                    
                    if (cleanTranscript.includes(charPair)) {
                      console.log(`✅ SPECIAL FIRST QUESTION MATCH: Found character pair "${charPair}" from "${cleanExpected}" in "${cleanTranscript}"`);
                      foundMatch = true;
                      matchingTranscript = transcript;
                      break;
                    }
                  }
                  
                  if (foundMatch) break;
                }
              }
            }
            
            // Process the result
            if (foundMatch) {
              console.log(`✅ FIRST QUESTION ACCEPTED: "${matchingTranscript}" for "${answerWord}"`);
              processCorrectAnswer();
            } else {
              console.log(`❌ FIRST QUESTION REJECTED: No match found for "${answerWord}"`);
              processIncorrectAnswer();
              
              // For first question, immediately restart with higher leniency
              setTimeout(() => {
                if (isCorrect === null && !userStoppedListening.current) {
                  try {
                    if (recognitionRef.current) {
                      recognitionRef.current.start();
                      console.log('🔄 Restarted after first question rejection');
                    }
                  } catch (e) {
                    console.error('Error restarting first question recognition:', e);
                  }
                }
              }, 2000);
            }
          } catch (err) {
            console.error('Error processing first question result:', err);
          }
        };

        // Auto-restart when recognition ends
        firstQuestionRecognition.onend = () => {
          console.log('🎤 First question recognition ended');
          setIsListening(false);
          
          // Only reset activeRef if we're still on first question
          if (currentWordIndex === 0) {
            setRecognitionActive(false);
            recognitionActiveRef.current = false;
            
            // Auto-restart if needed
            if (isCorrect === null && !userStoppedListening.current) {
              console.log('🔄 Auto-restarting first question recognition');
              setTimeout(() => {
                try {
                  if (recognitionRef.current) {
                    recognitionRef.current.start();
                    console.log('✅ Successfully restarted first question recognition');
                  }
                } catch (e) {
                  console.error('Error restarting first question recognition:', e);
                }
              }, 500);
            }
          }
        };

        // Handle errors
        firstQuestionRecognition.onerror = (event: any) => {
          const errorEvent = event as any;
          console.error(`❌ First question recognition error: ${errorEvent.error}`);
          
          // Auto-restart even on error for first question
          setTimeout(() => {
            if (currentWordIndex === 0 && isCorrect === null && !userStoppedListening.current) {
              try {
                firstQuestionRecognition.start();
                console.log('🔄 Restarted after error in first question');
              } catch (e) {
                console.error('Failed to restart after error:', e);
              }
            }
          }, 1000);
        };

        // Store reference and start
        recognitionRef.current = firstQuestionRecognition;
        
        // Start with a delay to ensure setup is complete
        setTimeout(() => {
          if (recognitionRef.current && isCorrect === null) {
            try {
              recognitionRef.current.start();
              console.log('🎬 Started first question recognition');
            } catch (e) {
              console.error('Error starting first question recognition:', e);
            }
          }
        }, 500);
      } catch (e) {
        console.error('Fatal error setting up first question recognition:', e);
      }
    }, 1000);

    // Cleanup
    return () => {
      console.log('Cleaning up first question recognition');
      if (recognitionRef.current && currentWordIndex === 0) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {
          console.error('Error cleaning up first question recognition:', e);
        }
      }
    };
  }, [currentWordIndex, answerWord, targetLanguage, currentWord, isCorrect]);
  
  // Auto start listening when moving to next word
  useEffect(() => {
    // Skip for the first question - it's handled by our special handler
    if (currentWordIndex === 0) {
      console.log('🛑 Skipping standard recognition setup for first question - using dedicated handler');
      return;
    }
    
    // Normal behavior for questions after the first one
    if (recognitionRef.current && !isListening && isCorrect === null && !recognitionActiveRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Starting speech recognition for word beyond first question');
      } catch (error) {
        console.error('Failed to start speech recognition for non-first word', error);
      }
    }
  }, [currentWordIndex, isListening, isCorrect]);
  
  // Start listening for speech - now used for manual restart if needed
  const startListening = () => {
    setTranscript('');
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to manually start speech recognition', error);
      }
    }
  };
  
  // Stop listening for speech
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        userStoppedListening.current = true; // Flag that user stopped it
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Failed to stop speech recognition', error);
      }
    }
  };
  
  // Play pronunciation of the current word (uses cached audio if available)
  const playAudio = async () => {
    if (!currentWord || !displayWord) {
      console.error('Cannot play audio - currentWord or displayWord is missing');
      return;
    }
    
    // Check if we have cached audio for this word
    if (currentWord.audioUrl) {
      console.log('🔊 QUIZ: Using cached audio URL');
      try {
        const audio = new Audio(currentWord.audioUrl);
        audio.onended = () => {
          console.log('✅ QUIZ: Cached audio completed');
          if (isCorrect === null) {
            userStoppedListening.current = false;
            startListening();
          }
        };
        audio.onerror = (error) => {
          console.error('❌ QUIZ: Cached audio playback error, regenerating:', error);
          // Clear the bad cached URL and regenerate
          currentWord.audioUrl = undefined;
          playAudio();
        };
        await audio.play();
        return;
      } catch (error) {
        console.error('❌ QUIZ: Error with cached audio, regenerating:', error);
        currentWord.audioUrl = undefined;
        // Fall through to generate new audio
      }
    }
    
    // We want to play the word in the language the user is learning
    // Use the same language column mapping as getCurrentWord
    const getLanguageColumn = (lang: SupportedLanguage): string => {
      const columnMap: Record<string, string> = {
        'en': 'entry_in_en',
        'ru': 'entry_in_ru', 
        'es': 'entry_in_es',
        'fr': 'entry_in_fr',
        'de': 'entry_in_de',
        'it': 'entry_in_it',
        'pt': 'entry_in_pt',
        'ar': 'entry_in_ar',
        'CH': 'entry_in_ch',
        'ja': 'entry_in_ja',
        'av': 'entry_in_av'
      };
      return columnMap[lang] || 'entry_in_en'; // fallback to English
    };

    const targetColumn = getLanguageColumn(targetLanguage);
    let wordToPlay = currentWord[targetColumn] || currentWord.entry_in_en;
    
    // Debug logging to see what's happening
    console.log('🔊 QUIZ DEBUG playAudio:', {
      targetLanguage,
      targetColumn,
      currentWord: currentWord,
      wordToPlay,
      availableColumns: Object.keys(currentWord).filter(key => key.startsWith('entry_in_'))
    });
    
    // Check if we have a valid word to play
    if (!wordToPlay || wordToPlay.trim() === '') {
      console.error('🔊 ERROR: No valid word to play', { targetColumn, currentWord });
      
      // Try to find any available text to play as fallback
      const availableColumns = Object.keys(currentWord).filter(key => key.startsWith('entry_in_'));
      let fallbackWord = '';
      
      // Try English first as fallback
      if (currentWord.entry_in_en) {
        fallbackWord = currentWord.entry_in_en;
        console.log('🔊 FALLBACK: Using English word:', fallbackWord);
      } else if (availableColumns.length > 0) {
        // Use the first available column
        const fallbackColumn = availableColumns[0];
        fallbackWord = currentWord[fallbackColumn];
        console.log('🔊 FALLBACK: Using', fallbackColumn, ':', fallbackWord);
      }
      
      if (!fallbackWord || fallbackWord.trim() === '') {
        alert('No audio available for this word in any language.');
        return;
      }
      
      // Update wordToPlay to use the fallback
      wordToPlay = fallbackWord;
    }
    
    // Stop speech recognition temporarily while playing audio
    stopListening();
    
    console.log('🔊 QUIZ playAudio called with:', { wordToPlay, targetLanguage });
    
    // For Chinese, check if text contains actual Chinese characters (not pinyin)
    if (targetLanguage === 'CH') {
      const hasChineseCharacters = /[\u4e00-\u9fff]/.test(wordToPlay);
      if (!hasChineseCharacters) {
        console.warn('⚠️ QUIZ Text is pinyin, not Chinese characters. Using browser TTS.');
        // Fall through to browser TTS
      } else {
        // Try TTS via router (ElevenLabs or Google based on config)
        try {
          console.log('🔊 QUIZ Attempting TTS via router');
          const audio = await generateSpeech(wordToPlay, targetLanguage, 'female', null);
          
          // Cache the audio URL for future replays
          if (audio.src && currentWord) {
            console.log('💾 QUIZ: Caching audio URL');
            currentWord.audioUrl = audio.src;
            // Update the quizWords array
            setQuizWords(prev => prev.map(w => 
              w.id === currentWord.id ? { ...w, audioUrl: audio.src } : w
            ));
          }
          
          audio.onended = () => {
            console.log('✅ QUIZ Gemini TTS completed');
            if (isCorrect === null) {
              userStoppedListening.current = false;
              startListening();
            }
          };
          
          audio.onerror = (error) => {
            console.error('❌ QUIZ Gemini TTS playback error, falling back:', error);
            playBrowserTTS(wordToPlay);
          };
          
          await audio.play();
          return;
        } catch (error) {
          console.error('❌ QUIZ TTS router failed, falling back to browser TTS:', error);
          // Fall through to browser TTS
        }
      }
    } else {
      // Try TTS via router for all other languages
      try {
        console.log('🔊 QUIZ Attempting TTS via router');
        const audio = await generateSpeech(wordToPlay, targetLanguage, 'female', null);
        
        // Cache the audio URL for future replays
        if (audio.src && currentWord) {
          console.log('💾 QUIZ: Caching audio URL');
          currentWord.audioUrl = audio.src;
          // Update the quizWords array
          setQuizWords(prev => prev.map(w => 
            w.id === currentWord.id ? { ...w, audioUrl: audio.src } : w
          ));
        }
        
        audio.onended = () => {
          console.log('✅ QUIZ Gemini TTS completed');
          if (isCorrect === null) {
            userStoppedListening.current = false;
            startListening();
          }
        };
        
        audio.onerror = (error) => {
          console.error('❌ QUIZ Gemini TTS playback error, falling back:', error);
          playBrowserTTS(wordToPlay);
        };
        
        await audio.play();
        return;
      } catch (error) {
        console.error('❌ QUIZ Gemini TTS failed, falling back:', error);
        // Fall through to browser TTS
      }
    }
    
    // Fallback to browser TTS
    playBrowserTTS(wordToPlay);
  };
  
  // Helper function for browser TTS playback
  const playBrowserTTS = (wordToPlay: string) => {
    console.log('🔊 QUIZ Using browser speech. Language:', targetLanguage);
    
    // Browser speech synthesis for other languages or fallback
    try {
      console.log(`🔊 Playing ${targetLanguage} audio for word:`, wordToPlay);
      
      const voices = window.speechSynthesis?.getVoices() || [];
      const targetLangVoices = voices.filter(voice => 
        voice.lang.startsWith(targetLanguage.toLowerCase()) || 
        (targetLanguage === 'ar' && (voice.lang.startsWith('ar') || voice.name.toLowerCase().includes('arabic')))
      );
      
      // Use a direct approach that works more reliably across browsers
      const utterance = new SpeechSynthesisUtterance(wordToPlay);
      
      // Set language to match what we're playing
      utterance.lang = getSpeechRecognitionLanguage(targetLanguage) || 'en-US';
      utterance.volume = 1.0;  // Maximum volume
      utterance.rate = 0.8;    // Slightly slower
      
      // Try to select an appropriate voice for the target language
      if (targetLangVoices.length > 0) {
        utterance.voice = targetLangVoices[0];
        console.log('🔊 QUIZ Selected voice for', targetLanguage, ':', targetLangVoices[0].name);
      } else {
        // If no target language voice, try to find a fallback
        const fallbackVoice = voices.find(voice => 
          voice.lang.startsWith('en') || voice.default
        );
        if (fallbackVoice) {
          utterance.voice = fallbackVoice;
          console.warn('🔊 QUIZ No voice found for', targetLanguage, ', using fallback:', fallbackVoice.name);
        }
      }
      
      // Log that we're about to speak
      console.log('🔊 Speaking:', wordToPlay, 'with language:', utterance.lang);
      
      // Cancel any existing speech and speak the new one
      window.speechSynthesis.cancel();
      
      // Add event handlers for debugging
      utterance.onstart = () => console.log('🔊 Speech started');
      utterance.onend = () => {
        console.log('🔊 Speech completed');
        // After speech completes, we can resume recognition if needed
        if (isCorrect === null) {
          userStoppedListening.current = false;
          startListening();
        }
      };
      utterance.onerror = (e) => console.error('🔊 Speech error:', e);
      
      // Speak
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      alert('Could not play audio. Please check your browser settings.');
    }
  };
  
  // Retry voice recognition - only restart if not already listening
  const retryVoiceRecognition = () => {
    // If already listening and working fine, don't interrupt
    if (isListening && recognitionActiveRef.current && isCorrect === null) {
      console.log('🎤 Already listening - no need to restart');
      return;
    }
    
    // Reset state
    setTranscript('');
    setIsCorrect(null);
    setRecognitionActive(false);
    recognitionActiveRef.current = false;
    userStoppedListening.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('🎤 Stopping recognition for manual restart');
      } catch (error) {
        console.log('🎤 Recognition already stopped or not active');
      }
      
      // Shorter delay for faster response
      setTimeout(() => {
        if (recognitionRef.current && !recognitionActiveRef.current) {
          try {
            recognitionRef.current.start();
            console.log('🎤 Manually restarted speech recognition');
          } catch (error) {
            console.error('Failed to start recognition:', error);
            // Don't show error in transcript - just log it
            console.log('Recognition will auto-restart on next cycle');
          }
        }
      }, 200);
    }
  };
  
  // Toggle hint visibility - enhanced to always show answer in both languages
  const toggleHint = () => {
    console.log('Toggling hint visibility. Current state:', showHint);
    setShowHint(prevState => !prevState); // Use function form to ensure state toggle works
    
    // Temporarily stop recognizing speech while looking at hint
    if (!showHint) {
      stopListening();
    }
  };
  
  // Skip current word
  const skipWord = () => {
    // Mark current word as incorrect
    setIsCorrect(false);
    
    // Stop listening
    if (recognitionRef.current) {
      try {
        userStoppedListening.current = true;
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition for skip:', err);
      }
    }
    
    // Move to next word after a delay
    setTimeout(() => {
      if (currentWordIndex < quizWords.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setTranscript('');
        setIsCorrect(null);
        setShowHint(false);
      } else {
        // Last word - finish quiz and show results
        finishQuiz();
        // Increment index to trigger results screen render
        setCurrentWordIndex(prev => prev + 1);
        setTranscript('');
        setIsCorrect(null);
      }
    }, 1000);
  };
  
  // Add current word to dictionary
  const handleAddWordToDictionary = async () => {
    if (!currentWord || !answerWord) return;
    
    // Check if user is logged in
    if (!user || !user.id) {
      console.log('📚 User not logged in, cannot add word to dictionary');
      alert(getTranslation(motherLanguage, 'pleaseSignIn') || t.pleaseSignIn);
      return;
    }
    
    const normalizedWord = stripPunctuation(answerWord.trim());
    
    // Set loading state
    setAddingWordToDictionary(true);
    
    try {
      // Get translation for the word
      console.log(`📚 Translating "${normalizedWord}" from ${targetLanguage} to ${motherLanguage}`);
      const translation = await translateWord({
        word: normalizedWord,
        fromLanguage: targetLanguage,
        toLanguage: motherLanguage
      });
      
      console.log(`📚 Translation result: "${translation}"`);
      
      // Add word to dictionary with translation
      const result = await addWordToDictionary(
        user.id,
        normalizedWord,
        targetLanguage,
        motherLanguage,
        translation || undefined
      );
      
      if (result) {
        // Show success feedback
        setWordAddedFeedback(normalizedWord);
        console.log(`📚 Word "${normalizedWord}" added to dictionary with translation "${translation}"`);
        
        // Clear feedback after 2 seconds
        setTimeout(() => {
          setWordAddedFeedback(null);
        }, 2000);
      } else {
        console.warn(`📚 Failed to add word "${normalizedWord}" to dictionary`);
      }
    } catch (error) {
      console.error('Error adding word to dictionary:', error);
      logger.error('Error adding word to dictionary', { error, word: normalizedWord });
    } finally {
      setAddingWordToDictionary(false);
    }
  };
  
  // Debug check of user and character info at component mount
  useEffect(() => {
    console.log("VocalQuizComponent - Component mounted with:", {
      dialogueId,
      characterId,
      user: user?.id ? `User ID: ${user.id}` : "No user logged in"
    });
    
    // Return cleanup function
    return () => {
      console.log("VocalQuizComponent - Component unmounting");
    };
  }, [dialogueId, characterId, user?.id]);
  
  // Update user's progress when quiz is completed
  const finishQuiz = async () => {
    try {
      const passPercentage = (correctCount / quizWords.length) * 100;
      // For missions: Pass if all questions were answered (eventual completion)
      // For regular dialogues: Pass if 60% correct on first try
      const passed = isMission ? true : passPercentage >= 60;
      
      console.log("VocalQuizComponent - Quiz finished with score:", passPercentage, "passed:", passed, "isMission:", isMission);
      
      if (user?.id) {
        try {
          // First, check if the user actually exists in the users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (userError || !userData) {
            console.log("VocalQuizComponent - User exists in auth but not in users table, prompting signup");
            // The user has an auth ID but no entry in the users table
            // Call onComplete with a special flag to trigger the signup prompt
            onComplete(passed);
            
            logger.info('Vocal quiz completed - user needs signup', { 
              correctCount, 
              totalQuestions: quizWords.length,
              score: passPercentage,
              passed,
              characterId,
              dialogueId,
              authUserId: user.id
            });
            return;
          }
          
          // User exists in both auth and users table, update progress in the database
          console.log("VocalQuizComponent - Updating progress for user:", user.id, "dialogue:", dialogueId, "character:", characterId);
          
          // Use the actual count of words in this quiz
          const wordCount = quizWords.length;
          
          console.log("VocalQuizComponent - Quiz contains", wordCount, "words for dialogue", dialogueId);
          
          // Skip tracking for vocabulary quizzes (user review, not counted)
          if (!isVocabularyQuiz) {
            // Track dialogue completion (this already handles word progress correctly)
            if (isScenario) {
              await trackCompletedScenarioDialogue(user.id, characterId, scenarioNumber, dialogueId, passPercentage);
              console.log("VocalQuizComponent - Scenario dialogue completion tracked for scenario:", scenarioNumber, "dialogue:", dialogueId);
            } else {
              await trackCompletedDialogue(user.id, characterId, dialogueId, passPercentage);
              console.log("VocalQuizComponent - Dialogue completion tracked for dialogue:", dialogueId, "with word count:", wordCount);
            }
          } else {
            console.log("VocalQuizComponent - Vocabulary quiz mode: progress tracking skipped");
          }
          
          // NEW: Track mission completion if this is a mission quiz (not vocabulary quiz)
          if (!isVocabularyQuiz && isMission && missionScenarioNumber !== undefined && missionNumber !== undefined) {
            console.log("VocalQuizComponent - This is a mission quiz, tracking mission completion");
            
            // Import the function
            const { trackCompletedMission } = await import('../services/progress');
            
            const missionTracked = await trackCompletedMission(
              user.id,
              missionScenarioNumber,
              missionNumber,
              usedHelpInMission,
              passed, // Quiz passed
              passPercentage
            );
            
            console.log("VocalQuizComponent - Mission completion tracked:", {
              scenario: missionScenarioNumber,
              mission: missionNumber,
              usedHelp: usedHelpInMission,
              passed,
              actuallyCompleted: missionTracked
            });
            
            if (!missionTracked) {
              console.log("VocalQuizComponent - Mission NOT counted as completed due to:", 
                usedHelpInMission ? "Used help" : "Quiz not passed");
            }
          }
          
          // Track which words/expressions the user has learned (skip for vocabulary quizzes)
          if (!isVocabularyQuiz) {
            const learnedWords = quizWords
              .filter((word, index) => {
                // Consider a word "learned" if answered correctly or if it's from the special 500 words list
                return (index < correctCount) || word.is_from_500;
              })
              .map(word => word.id);
              
            console.log("VocalQuizComponent - Number of learned words:", learnedWords.length);
            
            // Still track individual words if needed
            if (learnedWords.length > 0) {
            const wordData = learnedWords.map(wordId => ({
              user_id: user.id,
              word_id: wordId,
              language_id: targetLanguage,
              learned_at: new Date().toISOString()
            }));
            
            console.log("VocalQuizComponent - Updating learned words:", learnedWords.length, "words");
            
            const { data: wordUpsertData, error: wordUpsertError } = await supabase
              .from('user_learned_words')
              .upsert(wordData);
              
            if (wordUpsertError) {
              console.error("VocalQuizComponent - Error upserting learned words:", wordUpsertError);
            } else {
              console.log("VocalQuizComponent - Word update successful for", learnedWords.length, "words");
            }
            }
          }
        } catch (progressError) {
          console.error("VocalQuizComponent - Error updating progress:", progressError);
          logger.error("Error updating progress for logged-in user", { progressError });
          // We continue despite the error to ensure the quiz completion is acknowledged
        }
      } else {
        // User is not logged in, save progress locally
        console.log("VocalQuizComponent - No user logged in, saving progress locally");
        
        if (passed) {
          const missionOptions = (isMission && typeof missionScenarioNumber === 'number' && typeof missionNumber === 'number')
            ? {
                missionScenarioNumber,
                missionNumber,
                usedHelpInMission,
                quizPassed: passed
              }
            : undefined;
          
          // Save anonymous progress to localStorage
          const saved = saveAnonymousProgress(dialogueId, characterId, passPercentage, missionOptions);
          
          if (saved) {
            console.log("VocalQuizComponent - Anonymous progress saved locally");
          } else {
            console.warn("VocalQuizComponent - Failed to save anonymous progress locally");
          }
        }
      }
      
      // Don't call onComplete here - let the results screen handle it
      // when user clicks "Continue my journey" button
      console.log("VocalQuizComponent - Progress updated, showing results screen");
      logger.info('Vocal quiz completed', { 
        correctCount, 
        totalQuestions: quizWords.length,
        score: passPercentage,
        passed,
        characterId,
        dialogueId
      });
    } catch (error) {
      console.error('VocalQuizComponent - Failed to update progress', error);
      logger.error('Failed to update quiz progress', { error, characterId, dialogueId });
      
      // Even on error, we still want to show results screen
      // Don't call onComplete here
    }
  };
  
  // Update store quiz state when component mounts/unmounts
  useEffect(() => {
    // Set quiz as active in the store when component mounts
    setIsQuizActive(true);
    // Disable movement during quiz
    setIsMovementDisabled(true);
    
    // Clean up when unmounting
    return () => {
      setIsQuizActive(false);
      setIsMovementDisabled(false);
    };
  }, [setIsQuizActive, setIsMovementDisabled]);
  
  // Improved cleanup on unmount and special initial cleanup
  useEffect(() => {
    console.log('Quiz Component Mounted with dialogueId:', dialogueId);
    
    // CRITICAL: Completely flush all existing speech recognition at startup
    // This is crucial for preventing conflicts between dialogue and quiz components
    try {
      // Cancel any speech synthesis first
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        console.log('🔇 Cancelled any ongoing speech synthesis');
      }
      
      // Hard kill ALL Speech Recognition
      // This aggressive approach is needed to ensure a clean state
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        // Create and abort multiple temporary instances to flush the system
        for (let i = 0; i < 3; i++) {
          try {
            const temp = new SpeechRecognition();
            temp.continuous = false;
            temp.interimResults = false;
            
            // Nullify all handlers
            temp.onresult = null;
            temp.onerror = null;
            temp.onend = null;
            temp.onstart = null;
            
            // Abort immediately
            temp.abort();
            console.log(`🗑️ Aborted temporary recognition instance ${i+1}`);
          } catch (e) {
            console.log(`Error with cleanup instance ${i+1}:`, e);
          }
        }
      }
      
      // Clear any global flags/timers that might affect recognition
      if (typeof window !== 'undefined') {
        window._quizSpeechRecognitionActive = true;
        
        // Clear any lingering timeouts that might be interfering
        const highestId = window.setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
          window.clearTimeout(i);
        }
        console.log(`🧹 Cleared lingering timeouts`);
      }
    } catch (e) {
      console.error('Error during initial cleanup:', e);
    }
    
    // Return a cleanup function
    return () => {
      console.log('Quiz Component Unmounting - cleaning up speech recognition');
      // Cleanup speech recognition
      if (recognitionRef.current) {
        try {
          // Nullify all handlers first
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onstart = null;
          
          // Then abort
          recognitionRef.current.abort();
          recognitionRef.current = null;
          
          setRecognitionActive(false);
          recognitionActiveRef.current = false;
        } catch (error) {
          console.error('Error cleaning up recognition on unmount:', error);
        }
      }
      
      // Reset the global flag
      try {
        if (typeof window !== 'undefined') {
          window._quizSpeechRecognitionActive = false;
          
          // Cancel any speech
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        }
      } catch (e) {
        console.error('Error resetting global speech recognition flag:', e);
      }
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140]" style={{ pointerEvents: 'auto' }} />
        <div className="fixed inset-0 flex items-center justify-center z-[150]">
          <div className="w-full max-w-md p-8 shadow-2xl rounded-xl bg-slate-900 backdrop-blur-md border-2 border-slate-600 text-white" style={{ pointerEvents: 'auto', minHeight: '300px' }}>
          <div className="flex flex-col items-center justify-center space-y-5">
            <div className="p-4 rounded-full bg-indigo-900/30 border border-indigo-800/40">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            </div>
            <p className="text-xl font-medium text-white">Turi is preparing your quiz...</p>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 animate-pulse rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
          </div>
        </div>
      </>
    );
  }
  
  // Handle errors vs no quiz words for scenarios differently
  if (error) {
    console.log('Showing error state:', { error });
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140]" style={{ pointerEvents: 'auto' }} />
        <div className="fixed inset-0 flex items-center justify-center z-[150]">
          <div className="w-full max-w-md p-8 mx-4 shadow-2xl rounded-xl bg-slate-900 backdrop-blur-md border-2 border-slate-600 text-white" style={{ pointerEvents: 'auto', minHeight: '300px' }}>
          <div className="flex flex-col items-center justify-center space-y-5">
            <div className="p-4 rounded-full bg-red-900/20 border border-red-800/30">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-xl font-medium text-white text-center">
              {error}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 mt-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg transition-colors font-medium shadow-md"
            >
              {t.goBackButton}
            </button>
          </div>
          </div>
        </div>
      </>
    );
  }
  
  // For scenarios with no matching quiz words, complete without quiz
  if (quizWords.length === 0 && isScenario) {
    console.log('No quiz words for scenario - completing without quiz');
    
    // Immediately track completion
    const handleScenarioNoQuizComplete = async () => {
      try {
        if (user?.id) {
          await trackCompletedScenarioDialogue(
            user.id, 
            characterId, 
            scenarioNumber, 
            dialogueId, 
            100 // Full score since no quiz
          );
          console.log("✅ Scenario completed without quiz (no matching common words)");
        }
        onComplete(true); // Pass true since no quiz = auto-pass
      } catch (err) {
        console.error('Error tracking scenario completion:', err);
        onComplete(true); // Still complete even if tracking fails
      }
    };
    
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140]" style={{ pointerEvents: 'auto' }} />
        <div className="fixed inset-0 flex items-center justify-center z-[150]">
          <div className="w-full max-w-md p-8 mx-4 shadow-2xl rounded-xl bg-slate-900 backdrop-blur-md border-2 border-slate-600 text-white" style={{ pointerEvents: 'auto', minHeight: '300px' }}>
            <div className="flex flex-col items-center justify-center space-y-5">
              <div className="p-4 rounded-full bg-green-900/20 border border-green-800/30">
                <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <p className="text-xl font-medium text-white text-center">
              {t.greatWork}
            </p>
            <p className="text-sm text-slate-300 text-center">
              This scenario dialogue completed successfully!
              <br />
              (No common words available for quiz)
            </p>
            <button
              onClick={handleScenarioNoQuizComplete}
              className="px-8 py-3 mt-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition-colors font-medium shadow-md cursor-pointer"
              type="button"
            >
              {t.continueButton} →
            </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // For regular dialogues with no words, show error
  if (quizWords.length === 0) {
    console.log('Showing error state: no quiz words');
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140]" style={{ pointerEvents: 'auto' }} />
        <div className="fixed inset-0 flex items-center justify-center z-[150]">
          <div className="w-full max-w-md p-8 mx-4 shadow-2xl rounded-xl bg-slate-900 backdrop-blur-md border-2 border-slate-600 text-white" style={{ pointerEvents: 'auto', minHeight: '300px' }}>
          <div className="flex flex-col items-center justify-center space-y-5">
            <div className="p-4 rounded-full bg-red-900/20 border border-red-800/30">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-xl font-medium text-white text-center">
              Turi couldn't find any quiz words for this dialogue
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 mt-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg transition-colors font-medium shadow-md"
            >
              {t.goBackButton}
            </button>
          </div>
          </div>
        </div>
      </>
    );
  }
  
  // Quiz completed state
  if (currentWordIndex >= quizWords.length) {
    const passPercentage = (correctCount / quizWords.length) * 100;
    // For missions: Pass if all questions were answered (eventual completion)
    // For regular dialogues: Pass if 60% correct on first try
    const passed = isMission ? true : passPercentage >= 60;
    
    console.log('🎯 [QUIZ RESULTS SCREEN] Rendering results:', {
      isMission,
      usedHelpInMission,
      passed,
      passPercentage,
      missionScenarioNumber,
      missionNumber,
      shouldShowWarning: isMission && usedHelpInMission && passed
    });
    
    return (
      <PanelBackdrop zIndex={150} onClick={onClose}>
        <div className="w-full max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
          <AppPanel
            width="100%"
            padding={0}
            className="max-h-[90vh] overflow-hidden"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="p-6 space-y-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-5 rounded-full border ${passed ? 'bg-green-900/20 border-green-700/40' : 'bg-amber-900/20 border-amber-700/40'}`}>
                    {passed ? (
                      <CheckCircle className="w-16 h-16 text-green-400" />
                    ) : (
                      <XCircle className="w-16 h-16 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">
                      {t.vocabularyQuiz}
                    </p>
                    <h2 className="text-3xl font-bold">
                      {passed ? t.greatWork : t.letsTryAgain}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="rounded-full bg-white/10 hover:bg-white/20 h-10 w-10 flex items-center justify-center transition-colors"
                  type="button"
                  aria-label="Close quiz"
                >
                  ×
                </button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="text-sm text-white/70 mb-3">
                    {t.yourScore}
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle 
                          className="text-white/10" 
                          strokeWidth="8" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="40" 
                          cx="50" 
                          cy="50" 
                        />
                        <circle 
                          className="text-indigo-400" 
                          strokeWidth="8" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="40" 
                          cx="50" 
                          cy="50" 
                          strokeDasharray={`${(passPercentage * 2.51)}, 251`} 
                          strokeDashoffset="0" 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{passPercentage.toFixed(0)}%</span>
                        <span className="text-sm font-medium text-white/70">{correctCount}/{quizWords.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-center text-center">
                  <p className="text-base text-white/80">
                    {passed ? t.impressedWithProgress : t.believeInYou}
                  </p>
                </div>
              </div>
              
              {isMission && usedHelpInMission && passed && (
                <div className="w-full bg-yellow-900/30 border border-yellow-500/40 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-2xl">
                      ⚠️
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-yellow-100 font-bold mb-2">
                        {t.missionNotCounted}
                      </p>
                      <p className="text-sm text-yellow-100/90 leading-relaxed">
                        {t.missionNotCountedMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <PanelButton
                variant="primary"
                onClick={() => onComplete(passed)}
                className="w-full justify-center"
                type="button"
              >
                {t.continueMyJourney}
              </PanelButton>
            </div>
          </AppPanel>
        </div>
      </PanelBackdrop>
    );
  }
  
  // Main quiz view (now in a modal window rather than full screen)
  return (
    <PanelBackdrop zIndex={150} onClick={onClose}>
      <div className="w-full max-w-md px-4" onClick={(e) => e.stopPropagation()}>
        {(() => {
          try {
            console.log('Rendering quiz UI with:', {
              currentWordIndex,
              totalWords: quizWords.length,
              currentWord: currentWord ? `${currentWord.entry_in_en} / ${currentWord.entry_in_ru}` : 'NULL',
              displayWord,
              answerWord
            });
            
            return (
              <AppPanel
                width="100%"
                padding={0}
                className="overflow-hidden max-h-[90vh]"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">{t.vocabularyQuiz}</h2>
                  <button 
                    onClick={onClose}
                    className="rounded-full bg-white/10 hover:bg-white/20 h-8 w-8 flex items-center justify-center transition-colors"
                    type="button"
                    aria-label="Close quiz"
                  >
                    ×
                  </button>
                </div>
                
                <div className="p-6 text-white" style={{ display: 'block', flexShrink: 0 }}>
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-medium text-slate-400">
                    {t.question} {currentWordIndex + 1} of {quizWords.length}
          </span>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-slate-400">
                      {t.correct}: {correctCount}
            </span>
          </div>
        </div>
        
        {/* Question */}
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {t.howDoYouSay} "{displayWord}" in {getLanguageName(targetLanguage, motherLanguage)}?
                    {currentWord?.is_from_500 && (
                      <span className="ml-2 text-yellow-400">⭐</span>
                    )}
          </h2>
                  
                  {/* Sound buttons container */}
                  <div className="text-xl font-medium text-indigo-300 flex justify-center items-center gap-3 mt-4 sound-container relative" style={{ zIndex: 5 }}>
                    {/* Sound button */}
            <button 
                      onClick={(e) => { e.stopPropagation(); playAudio(); }}
                      className="p-4 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transition-colors cursor-pointer flex items-center justify-center shadow-lg"
                      style={{ minWidth: '60px', minHeight: '60px' }}
                      aria-label={t.playPronunciation}
                      type="button"
            >
                      <Volume className="w-8 h-8" />
            </button>
                    
                    {/* Microphone button - visual indicator and manual restart if needed */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        retryVoiceRecognition(); 
                      }}
                      className={`p-4 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-lg ${
                        isListening 
                          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 animate-pulse' 
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600'
                      }`}
                      style={{ minWidth: '60px', minHeight: '60px' }}
                      aria-label={isListening ? t.listening : t.startListening}
                      type="button"
                      title={isListening ? '🎤 Listening for your answer (red = active)' : 'Click if not listening'}
                    >
                      <Mic className="w-8 h-8" />
                    </button>
          </div>
                  
                  {/* Enhanced hint section */}
                  {showHint && (
                    <div className="mt-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-800">
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="text-slate-400 text-sm">{t.wordToPronounce}</span>
                          <div className="text-indigo-300 font-medium text-xl">{answerWord}</div>
                        </div>
                        
                        <div className="border-t border-indigo-800 pt-2">
                          <span className="text-slate-400 text-sm">{t.translation}</span>
                          <div className="text-white font-medium">{displayWord}</div>
                        </div>
                      </div>
                    </div>
                  )}
        </div>
        
        {/* Voice input section */}
                <div className="mb-8">
          <div 
            className={`
              p-4 rounded-lg border text-center mb-4
              ${isCorrect === true ? 'bg-green-900/20 border-green-700 text-green-400' : 
                isCorrect === false ? 'bg-red-900/20 border-red-700 text-red-400' : 
                        'bg-slate-800/60 border-slate-700 text-white hover:border-indigo-500 transition-colors'}
            `}
          >
            <p className="text-lg font-medium">
                      {transcript ? transcript : t.sayTheWord}
            </p>
          </div>
        </div>
        
                {/* Feedback section - made larger and more prominent */}
        {isCorrect === true && (
          <div className="mb-6 text-center animate-fade-in">
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                    <p className="text-lg font-bold text-green-400">{t.greatJobTuriProud}</p>
          </div>
        )}

                {/* Add a "Try Again" button when answer is incorrect */}
                {isCorrect === false && (
                  <div className="mb-6 text-center animate-fade-in">
                    <XCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
                    <p className="text-lg font-bold text-red-400">{t.notQuiteRight}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCorrect(null);
                        setTranscript('');
                        userStoppedListening.current = false;
                        retryVoiceRecognition();
                      }}
                      className="mt-4 px-5 py-2.5 flex items-center gap-1 mx-auto rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 transition-colors text-white font-medium shadow-md"
                      type="button"
                    >
                      {t.tryAgain}
                    </button>
                  </div>
                )}
        
        {/* Success feedback for saved word */}
        {wordAddedFeedback && (
          <div className="mb-4 text-center animate-fade-in">
            <div className="inline-block px-4 py-2 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-green-400 font-medium">{t.wordSaved}</p>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
                <div className="flex items-center justify-center gap-3 relative z-10 flex-wrap">
          <button
                    onClick={(e) => { e.stopPropagation(); toggleHint(); }}
                    className="px-5 py-2.5 flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 transition-colors text-white font-medium shadow-md"
                    style={{ minHeight: '44px' }}
                    type="button"
          >
            <HelpCircle className="w-5 h-5" />
                    {showHint ? t.hideHint : t.showHint}
          </button>
          
          {/* Save to Dictionary button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleAddWordToDictionary(); }}
            className="px-5 py-2.5 flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 transition-colors text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px' }}
            type="button"
            disabled={addingWordToDictionary}
          >
            <BookMarked className="w-5 h-5" />
            {addingWordToDictionary ? t.saving : t.saveToDictionary}
          </button>
          
                  {/* Debug Accept button */}
          <button
                    onClick={(e) => { e.stopPropagation(); debugRecognizeWord(); }}
                    className="px-5 py-2.5 flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 transition-colors text-white font-medium shadow-md"
                    style={{ minHeight: '44px' }}
                    type="button"
                  >
                    {t.debugAccept}
          </button>
        </div>
                
                {/* Debug Panel - simplified */}
                <div className="mt-6 pt-3 border-t border-slate-700">
                  <details className="text-sm text-slate-400">
                    <summary className="cursor-pointer hover:text-slate-300 transition-colors">
                      {t.debugInfo}
                    </summary>
                    <div className="mt-2 bg-slate-800/40 p-3 rounded-lg">
                      <p>{t.expected} <span className="text-white font-medium">{answerWord}</span> <span className="text-slate-500">({answerWord.length} chars)</span></p>
                      <p>{t.heard} <span className="text-white font-medium">{transcript}</span> <span className="text-slate-500">({transcript.length} chars)</span></p>
                      <p>{t.lengthDifference} <span className={`font-medium ${Math.abs(answerWord.length - transcript.length) > 2 ? 'text-red-400' : 'text-green-400'}`}>{Math.abs(answerWord.length - transcript.length)}</span></p>
                      
                      {targetLanguage === 'ru' && (
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <p className="text-slate-400 mb-1">Phonetic alternatives for "{answerWord}":</p>
                          <div className="text-xs bg-slate-800 p-2 rounded font-mono">
                            {answerWord === 'ваш' && 'wash, vash, vosh'}
                            {answerWord === 'мой' && 'moy, moi, moye'}
                            {answerWord === 'твой' && 'tvoy, tvoi, tvoya'}
                            {answerWord === 'наш' && 'nash, nush'}
                            {answerWord === 'ваша' && 'vasha, washa'}
                            {answerWord === 'моя' && 'moya, moia'}
                            {answerWord === 'их' && 'ikh, eeh'}
                            {answerWord === 'твоя' && 'tvoya, tvoia'}
                            {answerWord === 'его' && 'yevo, yego'}
                            {/* Add other common words here */}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <p>{t.targetLanguageLabel} <span className="text-white">{targetLanguage}</span></p>
                        <p>{t.wordIndex} <span className="text-white">{currentWordIndex + 1}/{quizWords.length}</span></p>
                        <p>{t.correctAnswers} <span className="text-white">{correctCount}</span></p>
                      </div>
                    </div>
                  </details>
                </div>
                </div>
              </AppPanel>
          );
        } catch (error) {
          console.error('Error rendering quiz UI:', error);
          return (
              <AppPanel width="100%" padding={32} className="mx-auto text-white" style={{ pointerEvents: 'auto' }}>
                <h2 className="text-xl font-bold mb-4">{t.somethingWentWrong}</h2>
                <p className="mb-4">{t.quizError}</p>
                <PanelButton
                  onClick={onClose}
                  variant="primary"
                  className="w-full justify-center"
                  type="button"
                >
                  {t.goBackButton}
                </PanelButton>
              </AppPanel>
          );
        }
      })()}
      </div>
    </PanelBackdrop>
  );
};

// Set default props
VocalQuizComponent.defaultProps = {
  characterId: 1
};

export default VocalQuizComponent; 

// Expose VocalQuizComponent to the global window object for direct access
if (typeof window !== 'undefined') {
  (window as any).VocalQuizComponent = VocalQuizComponent;
  console.log('VocalQuizComponent exposed to window object');
} 