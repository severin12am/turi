import { supabase } from './supabase';
import type { SupportedLanguage, TranslationStrings } from '../constants/translations';

// Cache for loaded translations (exported for synchronous access)
export const translationCache = new Map<SupportedLanguage, TranslationStrings>();
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

    if (!data || data.length === 0) {
      console.warn(`No translations found for ${language}, will use fallback`);
      return {};
    }

    // Convert array of key-value pairs to TranslationStrings object
    const translationObj: any = {};
    
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

