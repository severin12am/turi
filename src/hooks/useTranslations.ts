import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { translations, type TranslationStrings, type SupportedLanguage } from '../constants/translations';
import { loadTranslations, preloadTranslations } from '../services/translationLoader';

/**
 * React hook for accessing translations in the user's mother language
 * Handles async loading of non-English translations from Supabase
 */
export function useTranslations() {
  const { motherLanguage } = useStore();
  const [translationData, setTranslationData] = useState<TranslationStrings>(translations.en);
  const [isLoading, setIsLoading] = useState(motherLanguage !== 'en');

  useEffect(() => {
    // English is always available immediately
    if (motherLanguage === 'en') {
      setTranslationData(translations.en);
      setIsLoading(false);
      return;
    }

    // Load other languages asynchronously
    setIsLoading(true);
    loadTranslations(motherLanguage)
      .then(data => {
        setTranslationData(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error(`Failed to load translations for ${motherLanguage}:`, error);
        // Fall back to English on error
        setTranslationData(translations.en);
        setIsLoading(false);
      });
  }, [motherLanguage]);

  return {
    t: translationData,
    isLoading,
    language: motherLanguage
  };
}

/**
 * Hook to get a specific translation string with automatic fallback
 */
export function useTranslation(key: keyof TranslationStrings): string {
  const { t } = useTranslations();
  return (t[key] as string) || key;
}

/**
 * Hook to get character name in user's language
 */
export function useCharacterName(characterId: number): string {
  const { t } = useTranslations();
  
  if (t.characterNames?.[characterId]) {
    return t.characterNames[characterId];
  }
  
  // Fallback to English
  if (translations.en.characterNames?.[characterId]) {
    return translations.en.characterNames[characterId];
  }
  
  return `Character ${characterId}`;
}

/**
 * Preload translations for a specific language
 * Useful for preloading the target language translations
 */
export function usePreloadTranslations(language: SupportedLanguage) {
  useEffect(() => {
    if (language && language !== 'en') {
      preloadTranslations(language);
    }
  }, [language]);
}

