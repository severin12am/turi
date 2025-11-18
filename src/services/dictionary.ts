// src/services/dictionary.ts
import { supabase } from './supabase';
import { logger } from './logger';
import type { SupportedLanguage } from '../constants/translations';

export interface DictionaryEntry {
  id: string;
  user_id: string;
  word: string;
  target_language: string;
  translation?: string;
  mother_language: string;
  created_at?: string;
}

/**
 * Add a word to the user's dictionary
 * @param userId - The user's ID
 * @param word - The word in the target language
 * @param targetLanguage - The language being learned
 * @param motherLanguage - The user's native language
 * @param translation - Optional translation in mother language
 * @returns The created dictionary entry or null if failed
 */
export const addWordToDictionary = async (
  userId: string,
  word: string,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage,
  translation?: string
): Promise<DictionaryEntry | null> => {
  try {
    // Clean the word (remove punctuation)
    const cleanWord = word.trim().toLowerCase().replace(/[.,?!;:]/g, '');
    
    if (!cleanWord) {
      logger.warn('Attempted to add empty word to dictionary');
      return null;
    }

    logger.info('Adding word to dictionary', { 
      userId, 
      word: cleanWord, 
      targetLanguage, 
      motherLanguage 
    });

    // Insert the word into the dictionary table
    // The unique index will prevent duplicates automatically
    const { data, error } = await supabase
      .from('dictionary')
      .insert({
        user_id: userId,
        word: cleanWord,
        target_language: targetLanguage,
        mother_language: motherLanguage,
        translation: translation || null
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate error (unique constraint violation)
      if (error.code === '23505') {
        logger.info('Word already exists in dictionary', { word: cleanWord });
        // Return a success-like response since the word is already there
        return {
          id: '',
          user_id: userId,
          word: cleanWord,
          target_language: targetLanguage,
          mother_language: motherLanguage,
          translation: translation
        };
      }
      
      logger.error('Error adding word to dictionary', { error });
      return null;
    }

    logger.info('Word added to dictionary successfully', { word: cleanWord });
    return data;
  } catch (error) {
    logger.error('Exception in addWordToDictionary', { error });
    return null;
  }
};

/**
 * Check if a word is already in the user's dictionary
 * @param userId - The user's ID
 * @param word - The word to check
 * @param targetLanguage - The language being learned
 * @param motherLanguage - The user's native language
 * @returns true if word exists, false otherwise
 */
export const isWordInDictionary = async (
  userId: string,
  word: string,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage
): Promise<boolean> => {
  try {
    const cleanWord = word.trim().toLowerCase().replace(/[.,?!;:]/g, '');
    
    const { data, error } = await supabase
      .from('dictionary')
      .select('id')
      .eq('user_id', userId)
      .eq('target_language', targetLanguage)
      .eq('mother_language', motherLanguage)
      .ilike('word', cleanWord)
      .limit(1);

    if (error) {
      logger.error('Error checking if word is in dictionary', { error });
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    logger.error('Exception in isWordInDictionary', { error });
    return false;
  }
};

/**
 * Get all words from the user's dictionary
 * @param userId - The user's ID
 * @param targetLanguage - The language being learned (optional filter)
 * @param motherLanguage - The user's native language (optional filter)
 * @returns Array of dictionary entries
 */
export const getUserDictionary = async (
  userId: string,
  targetLanguage?: SupportedLanguage,
  motherLanguage?: SupportedLanguage
): Promise<DictionaryEntry[]> => {
  try {
    console.log('📚 getUserDictionary called with:', { userId, targetLanguage, motherLanguage });
    
    let query = supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', userId);

    if (targetLanguage) {
      console.log('📚 Filtering by target_language:', targetLanguage);
      query = query.eq('target_language', targetLanguage);
    }

    if (motherLanguage) {
      console.log('📚 Filtering by mother_language:', motherLanguage);
      query = query.eq('mother_language', motherLanguage);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('📚 Error fetching user dictionary:', error);
      logger.error('Error fetching user dictionary', { error });
      return [];
    }

    console.log('📚 Dictionary query returned:', data?.length || 0, 'entries', data);
    return data || [];
  } catch (error) {
    console.error('📚 Exception in getUserDictionary:', error);
    logger.error('Exception in getUserDictionary', { error });
    return [];
  }
};

/**
 * Remove a word from the user's dictionary
 * @param userId - The user's ID
 * @param wordId - The dictionary entry ID
 * @returns true if successful, false otherwise
 */
export const removeWordFromDictionary = async (
  userId: string,
  wordId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('dictionary')
      .delete()
      .eq('id', wordId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error removing word from dictionary', { error });
      return false;
    }

    logger.info('Word removed from dictionary successfully', { wordId });
    return true;
  } catch (error) {
    logger.error('Exception in removeWordFromDictionary', { error });
    return false;
  }
};

