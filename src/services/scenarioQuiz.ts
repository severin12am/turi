import { supabase } from './supabase';
import { logger } from './logger';
import type { SupportedLanguage } from '../constants/translations';
import { getQuizColumnForLanguage, getScenarioColumnForLanguage } from '../utils/languageMappings';

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

// getQuizColumnForLanguage is now imported from utils/languageMappings

/**
 * Extract individual words from dialogue text
 * Removes punctuation, converts to lowercase, removes duplicates
 */
const extractWordsFromDialogue = (dialogueText: string): string[] => {
  // Remove punctuation and split into words
  const words = dialogueText
    .toLowerCase()
    .replace(/[.,!?;:()\"'¡¿]/g, ' ') // Replace punctuation with spaces (including Spanish punctuation)
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 2) // Filter out very short words (like "a", "I")
    .map(word => word.trim())
    .filter(word => word.length > 0);
  
  // Return unique words
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
    const targetColumn = getScenarioColumnForLanguage(targetLanguage);
    const allDialogueText = dialogueData
      .map(phrase => phrase[targetColumn] || '')
      .join(' ');

    logger.info('Extracted dialogue text', { 
      textLength: allDialogueText.length, 
      phraseCount: dialogueData.length 
    });

    // Step 3: Extract individual words from dialogue
    const dialogueWords = extractWordsFromDialogue(allDialogueText);
    logger.info('Extracted words from dialogue', { 
      uniqueWords: dialogueWords.length,
      sample: dialogueWords.slice(0, 10)
    });

    if (dialogueWords.length === 0) {
      logger.warn('No words extracted from dialogue');
      return [];
    }

    // Step 4: Fetch matching words from quiz table (exact match)
    const quizColumn = getQuizColumnForLanguage(targetLanguage);
    const { data: quizData, error: quizError } = await supabase
      .from('quiz')
      .select('*')
      .in(quizColumn, dialogueWords) // Match words from dialogue (exact)
      .limit(5); // Limit to 5 words

    if (quizError) {
      logger.error('Error fetching from quiz table', { error: quizError });
      return [];
    }

    if (!quizData || quizData.length === 0) {
      logger.warn('No matching words found in quiz table', { 
        dialogueWords: dialogueWords.slice(0, 10) 
      });
      return [];
    }

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

// getScenarioColumnForLanguage (formerly getTargetLanguageColumn) is now imported from utils/languageMappings

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
    const targetColumn = getScenarioColumnForLanguage(targetLanguage);
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

