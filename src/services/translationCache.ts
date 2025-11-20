import type { SupportedLanguage, TranslationStrings } from '../constants/translations';

/**
 * Shared translation cache
 * This is in a separate file to avoid circular dependencies
 */
export const translationCache = new Map<SupportedLanguage, TranslationStrings>();

