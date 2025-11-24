/**
 * Centralized language code mappings for the entire application
 * Single source of truth for all language-related conversions
 */

import type { SupportedLanguage } from '../constants/translations';

/**
 * Map language codes to database column names for quiz table
 * Used in: scenarioQuiz.ts, VocalQuizComponent.tsx
 */
export const getQuizColumnForLanguage = (language: SupportedLanguage): string => {
  const columnMap: Record<SupportedLanguage, string> = {
    'en': 'english',
    'CH': 'chinese',
    'hi': 'hindi',
    'es': 'spanish',
    'fr': 'french',
    'ar': 'arabic',
    'bn': 'bengali',
    'pt': 'portuguese',
    'ru': 'russian',
    'id': 'indonesian',
    'ur': 'urdu',
    'de': 'german',
    'ja': 'japanese',
    'sw': 'swahili',
    'te': 'telugu',
    'mr': 'marathi',
    'ta': 'tamil',
    'tr': 'turkish',
    'ko': 'korean',
    'vi': 'vietnamese',
    'it': 'italian',
    'th': 'thai',
    'pl': 'polish',
    'uk': 'ukrainian',
    'nl': 'dutch',
    'ro': 'romanian',
    'el': 'greek',
    'cs': 'czech',
    'sv': 'swedish',
    'hu': 'hungarian'
  };
  
  return columnMap[language] || 'english';
};

/**
 * Map language codes to scenario table column names
 * Used in: scenarioQuiz.ts, translationFallback.ts, DialogueBox.tsx
 */
export const getScenarioColumnForLanguage = (language: SupportedLanguage): string => {
  const columnMap: Record<SupportedLanguage, string> = {
    'en': 'en_text',
    'CH': 'ch_text',
    'hi': 'hi_text',
    'es': 'es_text',
    'fr': 'fr_text',
    'ar': 'ar_text',
    'bn': 'bn_text',
    'pt': 'pt_text',
    'ru': 'ru_text',
    'id': 'id_text',
    'ur': 'ur_text',
    'de': 'de_text',
    'ja': 'ja_text',
    'sw': 'sw_text',
    'te': 'te_text',
    'mr': 'mr_text',
    'ta': 'ta_text',
    'tr': 'tr_text',
    'ko': 'ko_text',
    'vi': 'vi_text',
    'it': 'it_text',
    'th': 'th_text',
    'pl': 'pl_text',
    'uk': 'uk_text',
    'nl': 'nl_text',
    'ro': 'ro_text',
    'el': 'el_text',
    'cs': 'cs_text',
    'sv': 'sv_text',
    'hu': 'hu_text'
  };
  
  return columnMap[language] || 'en_text';
};

/**
 * Map language codes to speech recognition language codes
 * Used in: VocalQuizComponent.tsx
 * Returns null if speech recognition is not supported for that language
 */
export const getSpeechRecognitionLanguage = (language: SupportedLanguage): string | null => {
  const languageMap: Partial<Record<SupportedLanguage, string>> = {
    'en': 'en-US',
    'ru': 'ru-RU',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'ar': 'ar-SA',
    'CH': 'zh-CN',
    'ja': 'ja-JP',
    'tr': 'tr-TR',
    'ko': 'ko-KR',
    'pt': 'pt-PT',
    'hi': 'hi-IN',
    'th': 'th-TH',
    'vi': 'vi-VN',
    'pl': 'pl-PL',
    'uk': 'uk-UA',
    'nl': 'nl-NL',
    'el': 'el-GR',
    'cs': 'cs-CZ',
    'sv': 'sv-SE',
    'hu': 'hu-HU',
    'ro': 'ro-RO'
  };
  
  return languageMap[language] || null;
};

/**
 * Map language codes to entry_in_* column prefix for quiz words
 * Used in: scenarioQuiz.ts
 */
export const getQuizEntryColumn = (language: SupportedLanguage): string => {
  const columnMap: Record<SupportedLanguage, string> = {
    'en': 'entry_in_en',
    'CH': 'entry_in_ch',
    'hi': 'entry_in_hi',
    'es': 'entry_in_es',
    'fr': 'entry_in_fr',
    'ar': 'entry_in_ar',
    'bn': 'entry_in_bn',
    'pt': 'entry_in_pt',
    'ru': 'entry_in_ru',
    'id': 'entry_in_id',
    'ur': 'entry_in_ur',
    'de': 'entry_in_de',
    'ja': 'entry_in_ja',
    'sw': 'entry_in_sw',
    'te': 'entry_in_te',
    'mr': 'entry_in_mr',
    'ta': 'entry_in_ta',
    'tr': 'entry_in_tr',
    'ko': 'entry_in_ko',
    'vi': 'entry_in_vi',
    'it': 'entry_in_it',
    'th': 'entry_in_th',
    'pl': 'entry_in_pl',
    'uk': 'entry_in_uk',
    'nl': 'entry_in_nl',
    'ro': 'entry_in_ro',
    'el': 'entry_in_el',
    'cs': 'entry_in_cs',
    'sv': 'entry_in_sv',
    'hu': 'entry_in_hu'
  };
  
  return columnMap[language] || 'entry_in_en';
};

/**
 * Get language name for display in user's language
 * Used in: VocalQuizComponent.tsx
 */
export const getLanguageName = (
  targetLang: SupportedLanguage, 
  displayLang: SupportedLanguage
): string => {
  // This is a simplified version - you can expand this with full translations
  const languageNames: Partial<Record<SupportedLanguage, Partial<Record<SupportedLanguage, string>>>> = {
    'en': { en: 'English', ru: 'английском', es: 'inglés', fr: 'anglais', de: 'Englisch' },
    'ru': { en: 'Russian', ru: 'русском', es: 'ruso', fr: 'russe', de: 'Russisch' },
    'es': { en: 'Spanish', ru: 'испанском', es: 'español', fr: 'espagnol', de: 'Spanisch' },
    'fr': { en: 'French', ru: 'французском', es: 'francés', fr: 'français', de: 'Französisch' },
    'de': { en: 'German', ru: 'немецком', es: 'alemán', fr: 'allemand', de: 'Deutsch' },
    'it': { en: 'Italian', ru: 'итальянском', es: 'italiano', fr: 'italien', de: 'Italienisch' },
    'ar': { en: 'Arabic', ru: 'арабском', es: 'árabe', fr: 'arabe', de: 'Arabisch' },
    'CH': { en: 'Chinese', ru: 'китайском', es: 'chino', fr: 'chinois', de: 'Chinesisch' },
    'ja': { en: 'Japanese', ru: 'японском', es: 'japonés', fr: 'japonais', de: 'Japanisch' },
    'tr': { en: 'Turkish', ru: 'турецком', es: 'turco', fr: 'turc', de: 'Türkisch' },
    'pt': { en: 'Portuguese', ru: 'португальском', es: 'portugués', fr: 'portugais', de: 'Portugiesisch' },
    'hi': { en: 'Hindi', ru: 'хинди', es: 'hindi', fr: 'hindi', de: 'Hindi' },
    'ko': { en: 'Korean', ru: 'корейском', es: 'coreano', fr: 'coréen', de: 'Koreanisch' },
    'vi': { en: 'Vietnamese', ru: 'вьетнамском', es: 'vietnamita', fr: 'vietnamien', de: 'Vietnamesisch' }
  };
  
  return languageNames[targetLang]?.[displayLang] || targetLang;
};

