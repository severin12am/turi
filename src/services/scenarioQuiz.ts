import { supabase } from './supabase';
import { logger } from './logger';
import type { SupportedLanguage } from '../constants/translations';
// @ts-ignore - natural doesn't have full TypeScript support
import { PorterStemmerEs, PorterStemmerRu, PorterStemmer } from 'natural';

/**
 * Interface for quiz words from the common words table
 */
export interface ScenarioQuizWord {
  id: number;
  spanish?: string;
  english?: string;
  russian?: string;
  french?: string;
  german?: string;
  italian?: string;
  portuguese?: string;
  arabic?: string;
  chinese?: string;
  japanese?: string;
  turkish?: string;
  // Add a dialogue_id for compatibility with VocalQuizComponent
  dialogue_id: number;
  [key: string]: any;
}

/**
 * Get column name in quiz table for a given language
 */
const getQuizColumnForLanguage = (language: SupportedLanguage): string => {
  const columnMap: Record<string, string> = {
    'en': 'english',
    'ru': 'russian',
    'es': 'spanish',
    'fr': 'french',
    'de': 'german',
    'it': 'italian',
    'pt': 'portuguese',
    'ar': 'arabic',
    'CH': 'chinese',
    'ja': 'japanese',
    'tr': 'turkish'
  };
  
  return columnMap[language] || 'english';
};

/**
 * Get the appropriate stemmer for a language
 */
const getStemmer = (language: SupportedLanguage) => {
  const stemmerMap: Record<string, any> = {
    'es': PorterStemmerEs,
    'ru': PorterStemmerRu,
    'en': PorterStemmer,
    // For other languages, default to English stemmer (basic)
    'fr': PorterStemmer,
    'de': PorterStemmer,
    'it': PorterStemmer,
    'pt': PorterStemmer,
  };
  
  return stemmerMap[language] || PorterStemmer;
};

/**
 * Stem a word using the appropriate language stemmer
 */
const stemWord = (word: string, language: SupportedLanguage): string => {
  try {
    const stemmer = getStemmer(language);
    return stemmer.stem(word);
  } catch (error) {
    logger.warn('Stemming failed, using original word', { word, language, error });
    return word;
  }
};

/**
 * Extract individual words from dialogue text
 * Removes punctuation, converts to lowercase, removes duplicates
 */
const extractWordsFromDialogue = (dialogueText: string, language: SupportedLanguage): string[] => {
  // Remove punctuation and split into words
  const words = dialogueText
    .toLowerCase()
    .replace(/[.,!?;:()\"'¡¿]/g, ' ') // Replace punctuation with spaces (including Spanish punctuation)
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 2) // Filter out very short words (like "a", "I")
    .map(word => word.trim())
    .filter(word => word.length > 0);
  
  // Return unique words (original forms, not stemmed yet)
  return [...new Set(words)];
};

/**
 * Fetch quiz words for a scenario dialogue
 * Matches dialogue words with the quiz table (1000 common words)
 * Returns up to 5 words (or fewer if not enough matches)
 * 
 * @param characterId - The character ID for the scenario
 * @param dialogueId - The dialogue ID within the scenario
 * @param scenarioNumber - The scenario number
 * @param targetLanguage - The language being learned
 * @param motherLanguage - The user's native language
 * @returns Array of quiz words (0-5 words)
 */
export const fetchScenarioQuizWords = async (
  characterId: number,
  dialogueId: number,
  scenarioNumber: number,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage
): Promise<ScenarioQuizWord[]> => {
  try {
    logger.info('Fetching scenario quiz words', { 
      characterId, 
      dialogueId, 
      scenarioNumber, 
      targetLanguage, 
      motherLanguage 
    });

    // Step 1: Fetch the dialogue from scenario table
    const sourceTable = `scenario_${characterId}`;
    const { data: dialogueData, error: dialogueError } = await supabase
      .from(sourceTable)
      .select('*')
      .eq('dialogue_id', dialogueId)
      .order('dialogue_step', { ascending: true });

    if (dialogueError) {
      logger.error('Error fetching scenario dialogue', { error: dialogueError });
      return [];
    }

    if (!dialogueData || dialogueData.length === 0) {
      logger.warn('No dialogue data found for scenario', { characterId, dialogueId });
      return [];
    }

    // Step 2: Extract all text from the dialogue in target language
    const targetColumn = getTargetLanguageColumn(targetLanguage);
    const allDialogueText = dialogueData
      .map(phrase => phrase[targetColumn] || '')
      .join(' ');

    logger.info('Extracted dialogue text', { 
      textLength: allDialogueText.length, 
      phraseCount: dialogueData.length 
    });

    // Step 3: Extract individual words from dialogue
    const dialogueWords = extractWordsFromDialogue(allDialogueText, targetLanguage);
    logger.info('Extracted words from dialogue', { 
      uniqueWords: dialogueWords.length,
      sample: dialogueWords.slice(0, 10)
    });

    if (dialogueWords.length === 0) {
      logger.warn('No words extracted from dialogue');
      return [];
    }

    // Step 4: Stem the dialogue words for matching
    const stemmedDialogueWords = dialogueWords.map(word => stemWord(word, targetLanguage));
    const stemToOriginalMap = new Map<string, string>();
    dialogueWords.forEach((word, index) => {
      stemToOriginalMap.set(stemmedDialogueWords[index], word);
    });
    
    logger.info('Stemmed dialogue words', {
      original: dialogueWords.slice(0, 5),
      stemmed: stemmedDialogueWords.slice(0, 5)
    });

    // Step 5: Fetch ALL quiz words (we'll match client-side with stemming)
    const quizColumn = getQuizColumnForLanguage(targetLanguage);
    const { data: allQuizData, error: quizError } = await supabase
      .from('quiz')
      .select('*')
      .not(quizColumn, 'is', null); // Only get rows with target language populated

    if (quizError) {
      logger.error('Error fetching from quiz table', { error: quizError });
      return [];
    }

    if (!allQuizData || allQuizData.length === 0) {
      logger.warn('Quiz table is empty or has no words in target language');
      return [];
    }

    // Step 6: Stem quiz words and find matches
    const matches: any[] = [];
    const matchedStems = new Set<string>();
    
    for (const quizWord of allQuizData) {
      const originalWord = quizWord[quizColumn];
      if (!originalWord) continue;
      
      const stemmedQuizWord = stemWord(originalWord.toLowerCase(), targetLanguage);
      
      // Check if this stem matches any dialogue word stem
      if (stemmedDialogueWords.includes(stemmedQuizWord) && !matchedStems.has(stemmedQuizWord)) {
        matches.push(quizWord);
        matchedStems.add(stemmedQuizWord);
        
        logger.info('Found match via stemming', {
          dialogueWord: stemToOriginalMap.get(stemmedQuizWord),
          quizWord: originalWord,
          stem: stemmedQuizWord
        });
        
        // Stop at 5 matches
        if (matches.length >= 5) break;
      }
    }

    if (matches.length === 0) {
      logger.warn('No matching words found in quiz table after stemming', { 
        dialogueWords: dialogueWords.slice(0, 10),
        stemmedWords: stemmedDialogueWords.slice(0, 10)
      });
      return [];
    }
    
    const quizData = matches;

    // Step 7: Transform quiz table format to VocalQuizWord format
    const targetQuizColumn = quizColumn;
    const motherQuizColumn = getQuizColumnForLanguage(motherLanguage);

    const quizWords: ScenarioQuizWord[] = quizData.map((word, index) => ({
      id: word.id || index,
      dialogue_id: dialogueId, // Add for compatibility
      // Map quiz table columns to entry_in_* format expected by VocalQuizComponent
      entry_in_en: word.english || '',
      entry_in_ru: word.russian || '',
      entry_in_es: word.spanish || '',
      entry_in_fr: word.french || '',
      entry_in_de: word.german || '',
      entry_in_it: word.italian || '',
      entry_in_pt: word.portuguese || '',
      entry_in_ar: word.arabic || '',
      entry_in_ch: word.chinese || '',
      entry_in_ja: word.japanese || '',
      entry_in_tr: word.turkish || '',
      // Also include raw quiz table data
      ...word
    }));

    logger.info('Successfully matched quiz words', { 
      matchedCount: quizWords.length,
      words: quizWords.map(w => w[`entry_in_${targetLanguage}`])
    });

    return quizWords;
  } catch (error) {
    logger.error('Error in fetchScenarioQuizWords', { error });
    return [];
  }
};

/**
 * Get the column name for target language in scenario dialogue tables
 */
const getTargetLanguageColumn = (language: SupportedLanguage): string => {
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
  
  return columnMap[language] || 'en_text';
};

/**
 * Get scenario quiz statistics (for debugging/tracking)
 */
export const getScenarioQuizStats = async (
  characterId: number,
  dialogueId: number,
  targetLanguage: SupportedLanguage
): Promise<{
  totalDialogueWords: number;
  matchedWords: number;
  availableForQuiz: number;
}> => {
  try {
    // Fetch dialogue
    const sourceTable = `scenario_${characterId}`;
    const { data: dialogueData } = await supabase
      .from(sourceTable)
      .select('*')
      .eq('dialogue_id', dialogueId);

    if (!dialogueData || dialogueData.length === 0) {
      return { totalDialogueWords: 0, matchedWords: 0, availableForQuiz: 0 };
    }

    // Extract words
    const targetColumn = getTargetLanguageColumn(targetLanguage);
    const allDialogueText = dialogueData
      .map(phrase => phrase[targetColumn] || '')
      .join(' ');
    const dialogueWords = extractWordsFromDialogue(allDialogueText);

    // Check matches in quiz table
    const quizColumn = getQuizColumnForLanguage(targetLanguage);
    const { data: matchedData } = await supabase
      .from('quiz')
      .select('id')
      .in(quizColumn, dialogueWords);

    return {
      totalDialogueWords: dialogueWords.length,
      matchedWords: matchedData?.length || 0,
      availableForQuiz: Math.min(matchedData?.length || 0, 5)
    };
  } catch (error) {
    logger.error('Error getting scenario quiz stats', { error });
    return { totalDialogueWords: 0, matchedWords: 0, availableForQuiz: 0 };
  }
};

