import { supabase } from './supabase';
import type { SupportedLanguage, TranslationStrings } from '../constants/translations';
import { translationCache } from './translationCache';
import { translateWithAI } from './aiService';
import { logger } from './logger';

// Loading promises tracker
const loadingPromises = new Map<SupportedLanguage, Promise<TranslationStrings>>();

/**
 * Loads translations for a specific language from Supabase
 * Uses cache to avoid redundant database calls
 */
export async function loadTranslations(language: SupportedLanguage): Promise<TranslationStrings> {
  // Return English immediately (it's bundled with the app)
  if (language === 'en') {
    const { translations } = await import('../constants/translations');
    return translations.en;
  }

  // Return from cache if already loaded
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  // If already loading, return the existing promise
  if (loadingPromises.has(language)) {
    return loadingPromises.get(language)!;
  }

  // Start loading
  const loadPromise = fetchTranslationsFromSupabase(language);
  loadingPromises.set(language, loadPromise);

  try {
    const translations = await loadPromise;
    translationCache.set(language, translations);
    return translations;
  } finally {
    loadingPromises.delete(language);
  }
}

/**
 * Fetches translations from Supabase for a specific language
 * Falls back to AI translation if keys are missing
 */
async function fetchTranslationsFromSupabase(language: SupportedLanguage): Promise<TranslationStrings> {
  try {
    const { data, error } = await supabase
      .from('translations')
      .select('translation_key, translation_value')
      .eq('language_code', language);

    if (error) {
      console.error(`Error loading translations for ${language}:`, error);
      throw error;
    }

    // Convert array of key-value pairs to TranslationStrings object
    const translationObj: any = {};
    
    if (data && data.length > 0) {
      for (const row of data) {
        const key = row.translation_key;
        const value = row.translation_value;
        
        // Handle nested characterNames object
        if (key.startsWith('characterNames.')) {
          const characterId = key.split('.')[1];
          if (!translationObj.characterNames) {
            translationObj.characterNames = {};
          }
          translationObj.characterNames[parseInt(characterId)] = value;
        } else {
          translationObj[key] = value;
        }
      }
    }

    // Check for missing keys and use AI fallback
    const { translations } = await import('../constants/translations');
    const englishTranslations = translations.en;
    const missingKeys: string[] = [];
    
    // Find missing top-level keys
    for (const key in englishTranslations) {
      if (key === 'characterNames') {
        // Handle character names separately
        const englishCharNames = englishTranslations.characterNames;
        if (englishCharNames) {
          if (!translationObj.characterNames) {
            translationObj.characterNames = {};
          }
          for (const charId in englishCharNames) {
            if (!translationObj.characterNames[charId]) {
              missingKeys.push(`characterNames.${charId}`);
            }
          }
        }
      } else if (!translationObj[key] && englishTranslations[key as keyof TranslationStrings]) {
        missingKeys.push(key);
      }
    }
    
    // If there are missing translations, use AI
    if (missingKeys.length > 0) {
      console.log(`🤖 Using AI to translate ${missingKeys.length} missing UI strings for ${language}`);
      logger.info('AI fallback for UI translations', { language, missingCount: missingKeys.length });
      
      // Translate missing keys with AI (in batches to avoid rate limits)
      const batchSize = 5;
      for (let i = 0; i < missingKeys.length; i += batchSize) {
        const batch = missingKeys.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (key) => {
          try {
            let englishText: string;
            
            // Get English text for this key
            if (key.startsWith('characterNames.')) {
              const charId = key.split('.')[1];
              englishText = englishTranslations.characterNames?.[parseInt(charId)] || `Character ${charId}`;
            } else {
              englishText = englishTranslations[key as keyof TranslationStrings] as string;
            }
            
            if (!englishText) return;
            
            // Translate using AI (Groq/Gemini via router)
            const result = await translateWithAI({
              sourceText: englishText,
              sourceLanguage: 'en',
              targetLanguage: language,
              includeTransliteration: false
            });
            
            // Store the translation
            if (key.startsWith('characterNames.')) {
              const charId = key.split('.')[1];
              if (!translationObj.characterNames) {
                translationObj.characterNames = {};
              }
              translationObj.characterNames[parseInt(charId)] = result.translation;
            } else {
              translationObj[key] = result.translation;
            }
            
            console.log(`✅ AI translated: ${key} → ${result.translation.substring(0, 50)}...`);
          } catch (err) {
            console.error(`Failed to AI-translate ${key}:`, err);
            // Keep English as fallback for this specific key
            if (key.startsWith('characterNames.')) {
              const charId = key.split('.')[1];
              if (!translationObj.characterNames) {
                translationObj.characterNames = {};
              }
              translationObj.characterNames[parseInt(charId)] = englishTranslations.characterNames?.[parseInt(charId)] || `Character ${charId}`;
            } else {
              translationObj[key] = englishTranslations[key as keyof TranslationStrings];
            }
          }
        }));
        
        // Small delay between batches to avoid rate limits
        if (i + batchSize < missingKeys.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return translationObj;
  } catch (error) {
    console.error(`Failed to fetch translations for ${language}:`, error);
    return {}; // Return empty object, will fallback to English
  }
}

/**
 * Preloads translations for a language in the background
 * Useful for preloading the user's preferred language on app start
 */
export function preloadTranslations(language: SupportedLanguage): void {
  if (language !== 'en' && !translationCache.has(language) && !loadingPromises.has(language)) {
    loadTranslations(language).catch(error => {
      console.error(`Failed to preload translations for ${language}:`, error);
    });
  }
}

/**
 * Clears the translation cache
 * Useful for debugging or forcing a refresh
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  loadingPromises.clear();
}

// Re-export the cache for external access
export { translationCache };

/**
 * Gets a specific translation key with fallback to English
 */
export async function getTranslationAsync(
  language: SupportedLanguage,
  key: keyof TranslationStrings
): Promise<string> {
  try {
    const translations = await loadTranslations(language);
    
    if (translations[key]) {
      return translations[key] as string;
    }

    // Fallback to English
    const { translations: allTranslations } = await import('../constants/translations');
    const englishValue = allTranslations.en[key];
    if (englishValue) {
      return englishValue as string;
    }

    // Final fallback
    return key;
  } catch (error) {
    console.error(`Error getting translation for ${key} in ${language}:`, error);
    return key;
  }
}

/**
 * Gets character name with fallback to English
 */
export async function getCharacterNameAsync(
  language: SupportedLanguage,
  characterId: number
): Promise<string> {
  try {
    const translations = await loadTranslations(language);
    
    if (translations.characterNames?.[characterId]) {
      return translations.characterNames[characterId];
    }

    // Fallback to English
    const { translations: allTranslations } = await import('../constants/translations');
    const englishName = allTranslations.en.characterNames?.[characterId];
    if (englishName) {
      return englishName;
    }

    // Final fallback
    return `Character ${characterId}`;
  } catch (error) {
    console.error(`Error getting character name for ${characterId} in ${language}:`, error);
    return `Character ${characterId}`;
  }
}

