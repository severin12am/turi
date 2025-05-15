import { supabase } from './supabase';
import { logger } from './logger';
import type { LanguageLevel } from '../types';
import { useStore } from '../store';

/**
 * Advanced word progress tracking
 * Calculates word progress based on completed dialogues and actual words encountered
 */
export const calculateWordProgress = async (userId: string, targetLanguage: 'en' | 'ru'): Promise<number> => {
  try {
    // Instead of fetching from user_progress, get the highest dialogue ID from language_levels
    const { data: languageLevel, error: levelError } = await supabase
      .from('language_levels')
      .select('*')
      .eq('user_id', userId)
      .eq('target_language', targetLanguage)
      .single();
      
    if (levelError) {
      logger.error('Error fetching language level', { error: levelError });
      return 0;
    }
    
    // Define words per dialogue (can be adjusted)
    const dialogueWordCounts: Record<number, number> = {
      1: 7, 2: 6, 3: 7, 4: 7, 5: 7,
      6: 8, 7: 8, 8: 8, 9: 8, 10: 8
    };
    
    // Calculate total words learned based on highest dialogue completed
    let highestDialogueId = 1; // Default to 1
    
    // If we have an explicit dialogue_number field, use that
    if (languageLevel?.dialogue_number) {
      highestDialogueId = languageLevel.dialogue_number;
    } 
    // Otherwise, estimate from the level (each level has 5 dialogues)
    else if (languageLevel?.level) {
      // For now, use a simple approach to estimate dialogue progress
      highestDialogueId = Math.max(1, (languageLevel.level - 1) * 5 + 1);
    }
    
    // Calculate total words based on dialogues completed
    let totalWords = 0;
    for (let i = 1; i <= highestDialogueId; i++) {
      totalWords += dialogueWordCounts[i] || 7; // Default to 7 words per dialogue
    }
    
    // Cap at 500 total words for the progress tracking
    return Math.min(totalWords, 500);
  } catch (error) {
    logger.error('Error calculating word progress', { error });
    return 0;
  }
};

/**
 * Sync word progress with completed dialogues
 * Makes sure language_levels.word_progress is consistent with user_progress
 */
export const syncWordProgress = async (userId: string, targetLanguage: 'en' | 'ru'): Promise<LanguageLevel | null> => {
  try {
    // Get current language level
    const { data: currentLevel, error: levelError } = await supabase
      .from('language_levels')
      .select('*')
      .eq('user_id', userId)
      .eq('target_language', targetLanguage)
      .single();
      
    if (levelError && levelError.code !== 'PGRST116') {
      logger.error('Error fetching language level', { error: levelError });
      return null;
    }
    
    // Calculate word progress based on dialogues completed
    const calculatedWordProgress = await calculateWordProgress(userId, targetLanguage);
    
    // Default level is 1
    let newLevel = 1;
    
    // If we have a dialogue_number, calculate the level
    // Each level has 5 dialogues
    let dialogueNumber = currentLevel?.dialogue_number || 1;
    
    // Calculate level based on dialogue number
    if (dialogueNumber > 5) {
      newLevel = Math.floor((dialogueNumber - 1) / 5) + 1;
    }
    
    // Create or update the language level
    if (currentLevel) {
      // Update if needed
      if (currentLevel.word_progress !== calculatedWordProgress || currentLevel.level !== newLevel) {
        const { data, error } = await supabase
          .from('language_levels')
          .update({
            word_progress: calculatedWordProgress,
            level: newLevel
          })
          .eq('id', currentLevel.id)
          .select()
          .single();
          
        if (error) {
          logger.error('Error updating language level', { error });
          return currentLevel;
        }
        
        logger.info('Language level updated', { 
          userId, 
          wordProgress: calculatedWordProgress,
          level: newLevel
        });
        
        return data;
      }
      
      return currentLevel;
    } else {
      // Create new language level
      const { data, error } = await supabase
        .from('language_levels')
        .insert([{
          user_id: userId,
          target_language: targetLanguage,
          mother_language: useStore.getState().motherLanguage, // Use actual mother language from store
          word_progress: calculatedWordProgress,
          level: newLevel,
          dialogue_number: 1 // Initialize dialogue number
        }])
        .select()
        .single();
        
        if (error) {
          logger.error('Error creating language level', { error });
          return null;
        }
        
        logger.info('Language level created', { 
          userId, 
          wordProgress: calculatedWordProgress,
          level: newLevel
        });
        
        return data;
    }
  } catch (error) {
    logger.error('Error syncing word progress', { error });
    return null;
  }
};

/**
 * Calculate learning statistics for the user
 */
export const getUserLearningStats = async (userId: string, targetLanguage: 'en' | 'ru') => {
  try {
    console.log(`Getting learning stats for user ${userId} with target language ${targetLanguage}`);
    
    // Get language level info directly from database to ensure accurate values
    const { data: levelData, error: levelError } = await supabase
      .from('language_levels')
      .select('*')
      .eq('user_id', userId)
      .eq('target_language', targetLanguage)
      .single();
      
    if (levelError) {
      console.error('Error fetching language level:', levelError);
      logger.error('Error fetching language level', { error: levelError, userId, targetLanguage });
      
      if (levelError.code === 'PGRST116') {
        // No data found, but not an error per se
        console.log('No language level data found for user');
        return {
          completedDialoguesCount: 0,
          uniqueCharactersCount: 0,
          wordCount: 0,
          currentLevel: 1,
          languageLevel: null
        };
      }
      return null;
    }
    
    console.log('Language level data from database:', levelData);
    
    // We don't need user_progress table - all data comes from language_levels
    // Calculate statistics directly from language_levels data
    const completedDialoguesCount = levelData?.dialogue_number || 0;
    const uniqueCharactersCount = 1; // This isn't used anymore but kept for API compatibility
    const wordCount = levelData?.word_progress || 0;
    const currentLevel = levelData?.level || 1;
    
    const result = {
      completedDialoguesCount,
      uniqueCharactersCount,
      wordCount,
      currentLevel,
      languageLevel: levelData
    };
    
    console.log('Calculated user learning stats:', result);
    logger.info('User learning stats calculated', { 
      userId, 
      completedDialoguesCount,
      wordCount,
      currentLevel,
      dialogueNumber: levelData?.dialogue_number
    });
    
    return result;
  } catch (error) {
    console.error('Error getting user learning stats:', error);
    logger.error('Error getting user learning stats', { error });
    return null;
  }
};

/**
 * Track a completed dialogue and update language levels
 */
export const trackCompletedDialogue = async (
  userId: string,
  characterId: number,
  dialogueId: number,
  score: number = 100
) => {
  try {
    logger.info('Tracking dialogue completion', { userId, dialogueId, characterId });
    
    // Get both languages from the store
    const { targetLanguage, motherLanguage } = useStore.getState();
    
    console.log('💬 LANGUAGES FROM STORE:', { targetLanguage, motherLanguage });
    
    if (!targetLanguage) {
      throw new Error('Target language not found in store');
    }
    
    // Get current language level
    const { data: languageLevel, error: levelError } = await supabase
      .from('language_levels')
      .select('*')
      .eq('user_id', userId)
      .eq('target_language', targetLanguage)
      .eq('mother_language', motherLanguage)
      .single();
    
    if (levelError && levelError.code !== 'PGRST116') {
      logger.error('Error fetching language level for tracking completion', { error: levelError });
      throw levelError;
    }
    
    // Define words per dialogue
    const dialogueWordCounts: Record<number, number> = {
      1: 7, 2: 6, 3: 7, 4: 7, 5: 7,
      6: 8, 7: 8, 8: 8, 9: 8, 10: 8
    };
    
    // Calculate word progress based on the dialogue completed
    let totalWords = 0;
    for (let i = 1; i <= dialogueId; i++) {
      totalWords += dialogueWordCounts[i] || 7; // Default to 7 words per dialogue
    }
    
    // Calculate level based on dialogue ID
    const level = dialogueId <= 5 ? 1 : Math.floor((dialogueId - 1) / 5) + 1;
    
    // Get actual word count from database for more accuracy
    const { data: wordCounts, error: wordCountError } = await supabase
      .from('words_quiz')
      .select('*')
      .lte('dialogue_id', dialogueId);
      
    if (!wordCountError && wordCounts) {
      totalWords = wordCounts.length;
      logger.info('Calculated actual word progress from database', { 
        wordCount: totalWords, 
        dialogueId
      });
    }
    
    if (languageLevel) {
      // Always update dialogue_number to the just completed dialogue ID
      // This makes sure that whatever dialogue was just completed is recorded
      const { data, error } = await supabase
        .from('language_levels')
        .update({
          dialogue_number: dialogueId,
          word_progress: totalWords,
          level: level
        })
        .eq('user_id', userId)
        .eq('target_language', targetLanguage)
        .eq('mother_language', motherLanguage)
        .select();
        
      if (error) {
        logger.error('Error updating language level for dialogue completion', { error });
        throw error;
      }
      
      logger.info('Language level updated from dialogue completion', { 
        userId, 
        dialogueId,
        wordProgress: totalWords,
        level
      });
    } else {
      // Create a new language level entry with the correct languages
      const { data, error } = await supabase
        .from('language_levels')
        .insert([{
          user_id: userId,
          target_language: targetLanguage,
          mother_language: motherLanguage,  // Use the actual mother language from the store
          dialogue_number: dialogueId,
          word_progress: totalWords,
          level: level
        }])
        .select();
        
      if (error) {
        logger.error('Error creating language level for dialogue completion', { error });
        throw error;
      }
      
      logger.info('Language level created from dialogue completion', { 
        userId, 
        motherLanguage,
        targetLanguage,
        dialogueId,
        wordProgress: totalWords,
        level
      });
    }
    
    return true;
  } catch (error) {
    logger.error('Error tracking completed dialogue', { error });
    return false;
  }
}; 