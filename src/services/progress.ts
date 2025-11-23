import { supabase } from './supabase';
import { logger } from './logger';
import type { LanguageLevel } from '../types';
import type { SupportedLanguage } from '../constants/translations';
import { useStore } from '../store';
import { secureQuery, validateAndSanitizeUserInput, SecurityError } from './security';
import { DIALOGUES_PER_SCENARIO } from '../constants/scenarios';

/**
 * Ensure user is authenticated before making database requests
 * Falls back gracefully when RLS is disabled or when using localStorage auth
 */
const ensureAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Error getting session', { error });
      // Don't throw error, just log it - RLS might be disabled
      return null;
    }
    
    if (!session?.user) {
      logger.warn('No authenticated session found, but continuing (RLS might be disabled)');
      // Don't throw error, just log it - RLS might be disabled or using localStorage auth
      return null;
    }
    
    return session;
  } catch (error) {
    logger.error('Authentication check failed', { error });
    // Don't throw error, just log it - RLS might be disabled
    return null;
  }
};

/**
 * Make a database query with proper error handling for RLS issues
 */
const makeQuery = async (queryFn: () => Promise<any>, operation: string) => {
  try {
    const result = await queryFn();
    return result;
  } catch (error: any) {
    // Handle specific RLS/authentication errors
    if (error?.code === 'PGRST301' || error?.message?.includes('row-level security')) {
      logger.warn(`RLS policy blocked ${operation}, but continuing`, { error: error.message });
      // Return error instead of null data to let calling code handle it
      return { data: null, error: error };
    }
    
    // Handle 406 Not Acceptable errors
    if (error?.status === 406 || error?.code === '406') {
      logger.warn(`406 error on ${operation}, likely RLS issue, continuing`, { error: error.message });
      // Return error instead of null data to let calling code handle it
      return { data: null, error: error };
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Advanced word progress tracking
 * Calculates word progress based on completed dialogues and actual words encountered
 */
export const calculateWordProgress = async (userId: string, targetLanguage: SupportedLanguage): Promise<number> => {
  try {
    // Use secure query to validate access
    const result = await secureQuery(
      'calculate_word_progress',
      userId,
      async () => {
        const { data: languageLevel, error: levelError } = await supabase
          .from('language_levels')
          .select('*')
          .eq('user_id', userId)
          .eq('target_language', targetLanguage)
          .single();
        
        return { data: languageLevel, error: levelError };
      }
    );
    
    const { data: languageLevel, error: levelError } = result;
      
    if (levelError) {
      logger.error('Error fetching language level', { error: levelError });
      return 0;
    }
    
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
    
    // Get actual word count from database - single source of truth
    const { data: wordCounts, error: wordCountError } = await supabase
      .from('words_quiz')
      .select('*')
      .lte('dialogue_id', highestDialogueId);
    
    let totalWords = 0;
    if (!wordCountError && wordCounts) {
      totalWords = wordCounts.length;
      logger.info('Calculated word progress from database in calculateWordProgress', { 
        wordCount: totalWords, 
        highestDialogueId,
        userId
      });
    } else {
      logger.error('Error fetching word counts in calculateWordProgress', { 
        error: wordCountError,
        highestDialogueId,
        userId 
      });
      // Fallback: estimate based on dialogue number
      totalWords = highestDialogueId * 5; // Conservative estimate
      logger.warn('Using fallback word count estimation in calculateWordProgress', { 
        totalWords, 
        highestDialogueId,
        userId 
      });
    }
    
    // Cap at 500 total words for the progress tracking
    return Math.min(totalWords, 500);
  } catch (error) {
    if (error instanceof SecurityError) {
      logger.warn('Security check failed in calculateWordProgress', { error: error.message });
      return 0;
    }
    logger.error('Error calculating word progress', { error });
    return 0;
  }
};

/**
 * Sync word progress with completed dialogues
 * Makes sure language_levels.word_progress is consistent with user_progress
 * NOTE: This function ONLY updates existing records, it never creates new ones
 */
export const syncWordProgress = async (userId: string, targetLanguage: SupportedLanguage): Promise<LanguageLevel | null> => {
  try {
    // Get current language level with security validation
    const levelResult = await secureQuery(
      'sync_word_progress',
      userId,
      async () => {
        const { data: currentLevel, error: levelError } = await supabase
          .from('language_levels')
          .select('*')
          .eq('user_id', userId)
          .eq('target_language', targetLanguage)
          .maybeSingle();
        
        return { data: currentLevel, error: levelError };
      }
    );
    
    const { data: currentLevel, error: levelError } = levelResult;
      
    if (levelError) {
      logger.error('Error fetching language level', { error: levelError });
      return null;
    }
    
    // If no existing record, return null - DO NOT CREATE
    if (!currentLevel) {
      logger.info('No language level found, but syncWordProgress does not create records');
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
    
    // Update existing record only if values have changed
    if (currentLevel.word_progress !== calculatedWordProgress || currentLevel.level !== newLevel) {
      const updateResult = await secureQuery(
        'update_language_level_sync',
        userId,
        async () => {
          const { data, error } = await supabase
            .from('language_levels')
            .update({
              word_progress: calculatedWordProgress,
              level: newLevel,
              dialogue_number: dialogueNumber
            })
            .eq('user_id', userId)
            .eq('target_language', targetLanguage)
            .select()
            .single();
          
          return { data, error };
        }
      );
      
      const { data, error } = updateResult;
        
      if (error) {
        logger.error('Error updating language level', { error });
        // Return the current level with updated values
        return {
          ...currentLevel,
          word_progress: calculatedWordProgress,
          level: newLevel,
          dialogue_number: dialogueNumber
        };
      }
      
      if (data) {
        logger.info('Language level updated', { 
          userId, 
          wordProgress: calculatedWordProgress,
          level: newLevel,
          dialogueNumber
        });
        return data;
      }
    }
    
    // Return current level if no update needed
    return currentLevel;
  } catch (error) {
    if (error instanceof SecurityError) {
      logger.warn('Security check failed in syncWordProgress', { error: error.message });
      return null;
    }
    logger.error('Error syncing word progress', { error });
    return null;
  }
};

/**
 * Calculate learning statistics for the user
 */
export const getUserLearningStats = async (userId: string, targetLanguage: SupportedLanguage) => {
  try {
    console.log(`Getting learning stats for user ${userId} with target language ${targetLanguage}`);
    
    // Get language level info with security validation
    const levelResult = await secureQuery(
      'get_user_learning_stats',
      userId,
      async () => {
        const { data: levelData, error: levelError } = await supabase
          .from('language_levels')
          .select('*')
          .eq('user_id', userId)
          .eq('target_language', targetLanguage)
          .single();
        
        return { data: levelData, error: levelError };
      }
    );
    
    const { data: levelData, error: levelError } = levelResult;
      
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
    
    return result;
  } catch (error) {
    if (error instanceof SecurityError) {
      logger.warn('Security check failed in getUserLearningStats', { error: error.message });
      return null;
    }
    console.error('Error getting user learning stats:', error);
    logger.error('Error getting user learning stats', { error, userId, targetLanguage });
    return null;
  }
};

/**
 * Track a completed scenario dialogue and update user progress
 */
export const trackCompletedScenarioDialogue = async (
  userId: string, 
  characterId: number, 
  scenarioNumber: number,
  dialogueId: number, 
  score: number
) => {
  try {
    logger.info('Tracking scenario dialogue completion', { userId, characterId, scenarioNumber, dialogueId, score });
    
    // Validate input parameters
    if (!Number.isInteger(characterId) || characterId < 1) {
      throw new SecurityError('Invalid character ID', 'INVALID_PARAMETER');
    }
    
    if (!Number.isInteger(dialogueId) || dialogueId < 1) {
      throw new SecurityError('Invalid dialogue ID', 'INVALID_PARAMETER');
    }
    
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new SecurityError('Invalid score', 'INVALID_PARAMETER');
    }
    
    // Get the target language from current user with security validation
    const userResult = await secureQuery(
      'get_user_for_scenario_tracking',
      userId,
      async () => {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('target_language')
          .eq('id', userId)
          .single();
        
        return { data: userData, error: userError };
      }
    );
    
    const { data: userData, error: userError } = userResult;
      
    // Handle case when user record doesn't exist
    let targetLanguage: SupportedLanguage = 'en'; // Default to English
    
    if (userError) {
      // If no user found, try to get target language from store
      const { targetLanguage: storeTargetLanguage } = useStore.getState();
      if (storeTargetLanguage) {
        targetLanguage = storeTargetLanguage;
        logger.warn('User record not found in database, using target language from store', { 
          userId,
          targetLanguage 
        });
      }
    } else {
      targetLanguage = userData?.target_language as SupportedLanguage || 'en';
    }
    
    // Get current language level with security validation
    const levelResult = await secureQuery(
      'get_language_level_for_scenario_tracking',
      userId,
      async () => {
        const { data: languageLevel, error: levelError } = await supabase
          .from('language_levels')
          .select('*')
          .eq('user_id', userId)
          .eq('target_language', targetLanguage)
          .single();
        
        return { data: languageLevel, error: levelError };
      }
    );
    
    const { data: languageLevel, error: levelError } = levelResult;
    
    if (levelError && levelError.code !== 'PGRST116') {
      logger.error('Error fetching language level for tracking scenario completion', { error: levelError });
      throw levelError;
    }
    
    // Calculate scenario progress
    // scenario_progress represents the CURRENT scenario the user is working on
    // When a scenario is completed (all 10 dialogues), we move to the next scenario
    
    if (languageLevel) {
      const currentScenarioProgress = languageLevel.scenario_progress || 0;
      const currentDialogueProgress = languageLevel.scenario_dialogue_progress || 0;
      
      let newScenarioProgress = currentScenarioProgress;
      let newScenarioDialogueProgress = currentDialogueProgress;
      
      // Only update if this is for the current scenario (don't downgrade if replaying old scenarios)
      if (scenarioNumber >= currentScenarioProgress) {
        if (scenarioNumber === currentScenarioProgress) {
          // Update progress within current scenario
          newScenarioDialogueProgress = Math.max(dialogueId, currentDialogueProgress);
          
          // If this dialogue completes the scenario, move to next scenario
          if (newScenarioDialogueProgress >= DIALOGUES_PER_SCENARIO) {
            newScenarioProgress = scenarioNumber + 1;
            newScenarioDialogueProgress = 0; // Reset for next scenario
          } else {
            newScenarioProgress = scenarioNumber;
          }
        } else if (scenarioNumber > currentScenarioProgress) {
          // User somehow jumped ahead to a future scenario
          // Set to this scenario with current dialogue
          newScenarioProgress = scenarioNumber;
          newScenarioDialogueProgress = dialogueId;
          
          // If this dialogue completes the scenario, move to next scenario
          if (newScenarioDialogueProgress >= DIALOGUES_PER_SCENARIO) {
            newScenarioProgress = scenarioNumber + 1;
            newScenarioDialogueProgress = 0; // Reset for next scenario
          }
        }
      }
      // If scenarioNumber < currentScenarioProgress, user is replaying old content - don't update
      
      console.log('🔄 Updating scenario progress:', {
        oldScenarioDialogueProgress: currentDialogueProgress,
        newScenarioDialogueProgress,
        oldScenarioProgress: currentScenarioProgress,
        newScenarioProgress,
        dialogueId,
        scenarioNumber,
        completedScenario: newScenarioDialogueProgress === 0 && newScenarioProgress > scenarioNumber
      });
      
      // Update existing language level with security validation
      const updateResult = await secureQuery(
        'update_language_level_scenario_completion',
        userId,
        async () => {
          const { data, error } = await supabase
            .from('language_levels')
            .update({
              scenario_dialogue_progress: newScenarioDialogueProgress,
              scenario_progress: newScenarioProgress
            })
            .eq('user_id', userId)
            .eq('target_language', targetLanguage)
            .select();
          
          return { data, error };
        }
      );
      
      const { data: updateData, error: updateError } = updateResult;
      
      if (updateError) {
        console.error('❌ Failed to update scenario progress:', updateError);
        logger.error('Failed to update language level from scenario dialogue completion', { 
          error: updateError,
          userId, 
          scenarioNumber,
          dialogueId
        });
        throw new Error(`Failed to update scenario progress: ${updateError.message}`);
      }
      
      if (!updateData || updateData.length === 0) {
        console.error('❌ Update returned no data');
        logger.error('Update returned no data', { userId, targetLanguage });
        throw new Error('Update returned no data - possible RLS issue');
      }
      
      console.log('✅ Scenario progress updated successfully:', updateData[0]);
      logger.info('Language level updated from scenario dialogue completion', { 
        userId, 
        scenarioNumber,
        dialogueId,
        newScenarioProgress,
        updatedRecord: updateData[0]
      });
    } else {
      // Create new language level record with security validation
      // For a new record, determine initial progress
      let initialScenarioProgress = scenarioNumber;
      let initialScenarioDialogueProgress = dialogueId;
      
      // If completing the first scenario with dialogue 10, move to scenario 2
      if (dialogueId >= DIALOGUES_PER_SCENARIO) {
        initialScenarioProgress = scenarioNumber + 1;
        initialScenarioDialogueProgress = 0;
      }
      
      console.log('📝 Creating new language level record for scenario:', {
        userId,
        targetLanguage,
        dialogueId,
        scenarioNumber,
        initialScenarioProgress,
        initialScenarioDialogueProgress
      });
      
      const createResult = await secureQuery(
        'create_language_level_scenario_completion',
        userId,
        async () => {
          const { data, error } = await supabase
            .from('language_levels')
            .insert([{
              user_id: userId,
              target_language: targetLanguage,
              mother_language: targetLanguage === 'en' ? 'ru' : 'en',
              scenario_dialogue_progress: initialScenarioDialogueProgress,
              scenario_progress: initialScenarioProgress,
              level: 1,
              word_progress: 0
            }])
            .select();
          
          return { data, error };
        }
      );
      
      const { data: createData, error: createError } = createResult;
      
      if (createError) {
        console.error('❌ Failed to create language level:', createError);
        logger.error('Failed to create language level from scenario dialogue completion', { 
          error: createError,
          userId, 
          scenarioNumber,
          dialogueId
        });
        throw new Error(`Failed to create scenario progress: ${createError.message}`);
      }
      
      if (!createData || createData.length === 0) {
        console.error('❌ Insert returned no data');
        logger.error('Insert returned no data', { userId, targetLanguage });
        throw new Error('Insert returned no data - possible RLS issue');
      }
      
      console.log('✅ Language level created successfully:', createData[0]);
      logger.info('Created language level from scenario dialogue completion', { 
        userId, 
        scenarioNumber,
        dialogueId,
        scenarioProgress,
        createdRecord: createData[0]
      });
    }
    
    logger.info('Scenario dialogue completion tracked successfully', { dialogueId, scenarioNumber, characterId });
    return true;
  } catch (error) {
    if (error instanceof SecurityError) {
      logger.warn('Security check failed in trackCompletedScenarioDialogue', { error: error.message });
      throw error;
    }
    logger.error('Error in trackCompletedScenarioDialogue', { error });
    throw error;
  }
};

/**
 * Track a completed dialogue and update user progress
 */
export const trackCompletedDialogue = async (
  userId: string, 
  characterId: number, 
  dialogueId: number, 
  score: number
) => {
  try {
    logger.info('Tracking dialogue completion', { userId, characterId, dialogueId, score });
    
    // Validate input parameters
    if (!Number.isInteger(characterId) || characterId < 1) {
      throw new SecurityError('Invalid character ID', 'INVALID_PARAMETER');
    }
    
    if (!Number.isInteger(dialogueId) || dialogueId < 1) {
      throw new SecurityError('Invalid dialogue ID', 'INVALID_PARAMETER');
    }
    
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new SecurityError('Invalid score', 'INVALID_PARAMETER');
    }
    
    // Get the target language from current user with security validation
    const userResult = await secureQuery(
      'get_user_for_dialogue_tracking',
      userId,
      async () => {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('target_language')
          .eq('id', userId)
          .single();
        
        return { data: userData, error: userError };
      }
    );
    
    const { data: userData, error: userError } = userResult;
      
    // Handle case when user record doesn't exist
    let targetLanguage: SupportedLanguage = 'en'; // Default to English
    
    if (userError) {
      // If no user found, try to get target language from store
      const { targetLanguage: storeTargetLanguage } = useStore.getState();
      if (storeTargetLanguage) {
        targetLanguage = storeTargetLanguage;
        logger.warn('User record not found in database, using target language from store', { 
          userId,
          targetLanguage 
        });
      } else {
        logger.error('Error fetching user language and no target language in store', { error: userError });
        logger.info('Creating user record with default target language');
        
        // Create a basic user record with security validation
        await secureQuery(
          'create_user_for_dialogue_tracking',
          userId,
          async () => {
            const { error: createError } = await supabase
              .from('users')
              .insert([{
                id: userId,
                email: `user_${userId.substring(0, 8)}@example.com`, // Generate placeholder email
                target_language: targetLanguage,
                mother_language: targetLanguage === 'en' ? 'ru' : 'en',
                total_minutes: 0
              }]);
            
            return { data: null, error: createError };
          }
        );
      }
    } else {
      targetLanguage = userData?.target_language as SupportedLanguage || 'en';
    }
    
    // Get current language level with security validation
    const levelResult = await secureQuery(
      'get_language_level_for_dialogue_tracking',
      userId,
      async () => {
        const { data: languageLevel, error: levelError } = await supabase
          .from('language_levels')
          .select('*')
          .eq('user_id', userId)
          .eq('target_language', targetLanguage)
          .single();
        
        return { data: languageLevel, error: levelError };
      }
    );
    
    const { data: languageLevel, error: levelError } = levelResult;
    
    if (levelError && levelError.code !== 'PGRST116') {
      logger.error('Error fetching language level for tracking completion', { error: levelError });
      throw levelError;
    }
    
    // Calculate level based on dialogue ID
    const level = dialogueId <= 5 ? 1 : Math.floor((dialogueId - 1) / 5) + 1;
    
    // Get actual word count from database - this is the single source of truth
    const { data: wordCounts, error: wordCountError } = await supabase
      .from('words_quiz')
      .select('*')
      .lte('dialogue_id', dialogueId);
      
    let totalWords = 0;
    if (!wordCountError && wordCounts) {
      totalWords = wordCounts.length;
      logger.info('Calculated word progress from database', { 
        wordCount: totalWords, 
        dialogueId,
        message: 'Using database as single source of truth for word count'
      });
    } else {
      logger.error('Error fetching word counts from database', { 
        error: wordCountError,
        dialogueId 
      });
      // Fallback: estimate based on dialogue number (3-8 words per dialogue average)
      totalWords = dialogueId * 5; // Conservative estimate
      logger.warn('Using fallback word count estimation', { 
        totalWords, 
        dialogueId 
      });
    }
    
    if (languageLevel) {
      // Update existing language level with security validation
      await secureQuery(
        'update_language_level_dialogue_completion',
        userId,
        async () => {
          const { data, error } = await supabase
            .from('language_levels')
            .update({
              dialogue_number: Math.max(dialogueId, languageLevel.dialogue_number || 0),
              word_progress: totalWords,
              level: level
            })
            .eq('user_id', userId)
            .eq('target_language', targetLanguage)
            .select();
          
          return { data, error };
        }
      );
      
      logger.info('Language level updated from dialogue completion', { 
        userId, 
        dialogueId,
        wordProgress: totalWords,
        level
      });
    } else {
      // Create new language level record with security validation
      await secureQuery(
        'create_language_level_dialogue_completion',
        userId,
        async () => {
          const { data, error } = await supabase
            .from('language_levels')
            .insert([{
              user_id: userId,
              target_language: targetLanguage,
              mother_language: targetLanguage === 'en' ? 'ru' : 'en',
              dialogue_number: dialogueId,
              word_progress: totalWords,
              level: level
            }])
            .select();
          
          return { data, error };
        }
      );
      
      logger.info('Created language level from dialogue completion', { 
        userId, 
        dialogueId,
        wordProgress: totalWords
      });
    }
    
    logger.info('Dialogue completion tracked successfully', { dialogueId, characterId });
    return true;
  } catch (error) {
    if (error instanceof SecurityError) {
      logger.warn('Security check failed in trackCompletedDialogue', { error: error.message });
      throw error;
    }
    logger.error('Error in trackCompletedDialogue', { error });
    throw error;
  }
};

/**
 * Track a completed mission and update user progress
 * Only counts as completed if:
 * 1. User completed conversation without help
 * 2. User passed the quiz
 */
export const trackCompletedMission = async (
  userId: string,
  scenarioNumber: number,
  missionNumber: number,
  usedHelp: boolean,
  quizPassed: boolean,
  score: number
) => {
  try {
    logger.info('Tracking mission completion', { 
      userId, 
      scenarioNumber, 
      missionNumber, 
      usedHelp, 
      quizPassed, 
      score 
    });
    
    // Validate input parameters
    if (!Number.isInteger(scenarioNumber) || scenarioNumber < 1 || scenarioNumber > 30) {
      throw new SecurityError('Invalid scenario number', 'INVALID_PARAMETER');
    }
    
    if (!Number.isInteger(missionNumber) || missionNumber < 1 || missionNumber > 5) {
      throw new SecurityError('Invalid mission number', 'INVALID_PARAMETER');
    }
    
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new SecurityError('Invalid score', 'INVALID_PARAMETER');
    }
    
    // CRITICAL: Mission only counts if NO HELP and QUIZ PASSED
    const missionActuallyCompleted = !usedHelp && quizPassed;
    
    if (!missionActuallyCompleted) {
      logger.warn('Mission not counted as completed', { 
        reason: usedHelp ? 'Used help' : 'Quiz not passed',
        usedHelp,
        quizPassed,
        scenarioNumber,
        missionNumber
      });
      return false; // Don't update progress
    }
    
    // Get target language from current user with security validation
    const userResult = await secureQuery(
      'get_user_for_mission_tracking',
      userId,
      async () => {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('target_language')
          .eq('id', userId)
          .single();
        
        return { data: userData, error: userError };
      }
    );
    
    const { data: userData, error: userError } = userResult;
    
    // Handle case when user record doesn't exist
    let targetLanguage: SupportedLanguage = 'en'; // Default to English
    
    if (userError) {
      // If no user found, try to get target language from store
      const { targetLanguage: storeTargetLanguage } = useStore.getState();
      if (storeTargetLanguage) {
        targetLanguage = storeTargetLanguage;
        logger.warn('User record not found in database, using target language from store', { 
          userId,
          targetLanguage 
        });
      }
    } else {
      targetLanguage = userData?.target_language as SupportedLanguage || 'en';
    }
    
    // Get current language level with security validation
    const levelResult = await secureQuery(
      'get_language_level_for_mission',
      userId,
      async () => {
        const { data, error } = await supabase
          .from('language_levels')
          .select('*')
          .eq('user_id', userId)
          .eq('target_language', targetLanguage)
          .single();
        
        return { data, error };
      }
    );
    
    const { data: languageLevel, error: levelError } = levelResult;
    
    if (levelError && levelError.code !== 'PGRST116') {
      throw levelError;
    }
    
    // Calculate global mission ID: (scenarioNumber - 1) * 5 + missionNumber
    // Example: Scenario 1, Mission 1 = 1
    //          Scenario 1, Mission 5 = 5
    //          Scenario 2, Mission 1 = 6
    const globalMissionId = (scenarioNumber - 1) * 5 + missionNumber;
    
    if (languageLevel) {
      const currentMissionProgress = languageLevel.mission_progress || 0;
      
      // Only update if this mission is the next one (sequential unlocking)
      // Or if it's higher (user somehow completed a future mission)
      const newMissionProgress = Math.max(globalMissionId, currentMissionProgress);
      
      logger.info('Updating mission progress', {
        oldProgress: currentMissionProgress,
        newProgress: newMissionProgress,
        scenarioNumber,
        missionNumber,
        globalMissionId
      });
      
      // Update language level with security validation
      const updateResult = await secureQuery(
        'update_mission_progress',
        userId,
        async () => {
          const { data, error } = await supabase
            .from('language_levels')
            .update({
              mission_progress: newMissionProgress
            })
            .eq('user_id', userId)
            .eq('target_language', targetLanguage)
            .select();
          
          return { data, error };
        }
      );
      
      if (updateResult.error) {
        console.error('❌ Failed to update mission progress:', updateResult.error);
        logger.error('Failed to update mission progress', { 
          error: updateResult.error,
          userId,
          scenarioNumber,
          missionNumber
        });
        throw new Error(`Failed to update mission progress: ${updateResult.error.message || updateResult.error}`);
      }
      
      console.log('✅ Mission progress updated successfully');
      logger.info('Mission completion tracked successfully', { 
        scenarioNumber, 
        missionNumber, 
        globalMissionId,
        newProgress: newMissionProgress 
      });
      
    } else {
      // Create new language level if doesn't exist
      const createResult = await secureQuery(
        'create_language_level_for_mission',
        userId,
        async () => {
          const { data, error } = await supabase
            .from('language_levels')
            .insert([{
              user_id: userId,
              target_language: targetLanguage,
              mother_language: targetLanguage === 'en' ? 'ru' : 'en',
              mission_progress: globalMissionId,
              dialogue_number: 0,
              word_progress: 0,
              level: 1
            }])
            .select();
          
          return { data, error };
        }
      );
      
      if (createResult.error) {
        console.error('❌ Failed to create language level:', createResult.error);
        logger.error('Failed to create language level for mission', { 
          error: createResult.error,
          userId,
          scenarioNumber,
          missionNumber
        });
        throw new Error(`Failed to create language level: ${createResult.error.message || createResult.error}`);
      }
      
      console.log('✅ Language level created successfully');
      logger.info('Created language level with mission progress', { 
        scenarioNumber, 
        missionNumber, 
        globalMissionId 
      });
    }
    
    // ALSO SAVE TO mission_completions TABLE FOR DETAILED TRACKING
    const completionResult = await secureQuery(
      'insert_mission_completion',
      userId,
      async () => {
        const { data, error } = await supabase
          .from('mission_completions')
          .upsert([{
            user_id: userId,
            scenario_number: scenarioNumber,
            mission_number: missionNumber,
            score: Math.round(score), // Round to integer for database
            used_help: usedHelp,
            completed_at: new Date().toISOString()
          }], {
            onConflict: 'user_id,scenario_number,mission_number'
          })
          .select();
        
        return { data, error };
      }
    );
    
    if (completionResult.error) {
      console.error('❌ Failed to save mission completion:', completionResult.error);
      logger.error('Failed to save mission completion', { 
        error: completionResult.error, 
        scenarioNumber, 
        missionNumber,
        userId 
      });
      // Don't throw - mission_progress was already updated above
      // Just log the error so user knows the detailed record didn't save
    } else {
      console.log('✅ Mission completion record saved successfully');
      logger.info('Mission completion record saved', { scenarioNumber, missionNumber });
    }
    
    return true;
    
  } catch (error) {
    if (error instanceof SecurityError) {
      logger.error('Security error in trackCompletedMission', { error: error.message });
    } else {
      logger.error('Failed to track mission completion', { error });
    }
    throw error;
  }
}; 