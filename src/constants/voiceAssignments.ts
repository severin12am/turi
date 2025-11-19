/**
 * Voice assignments for Google Cloud TTS
 * Each character gets their own unique voice that stays consistent
 * Turi (system voice) has a dedicated female voice for quiz/word pronunciation
 */

import { SupportedLanguage } from './languages';

/**
 * Voice configuration per language
 * Each language has pools of male and female voices
 */
export interface VoicePool {
  male: string[];
  female: string[];
  turiVoice: string; // Reserved female voice for Turi (system/quiz)
}

/**
 * Available voices for each supported language
 * Using variety of Neural2, WaveNet, and Chirp3-HD voices
 */
export const VOICE_POOLS: Record<string, VoicePool> = {
  'en': {
    male: [
      'en-US-Neural2-A',
      'en-US-Neural2-I',
      'en-US-Neural2-J',
      'en-US-WaveNet-A',
      'en-US-WaveNet-I',
      'en-US-WaveNet-J',
      'en-US-Casual-K',
      'en-US-Studio-Q',
      'en-US-Chirp3-HD-Achird',
      'en-US-Chirp3-HD-Algenib',
      'en-US-Chirp3-HD-Algieba',
      'en-US-Chirp3-HD-Alnilam',
      'en-US-Chirp3-HD-Charon'
    ],
    female: [
      'en-US-Neural2-F',
      'en-US-Neural2-G',
      'en-US-Neural2-H',
      'en-US-WaveNet-F',
      'en-US-WaveNet-G',
      'en-US-WaveNet-H',
      'en-US-Studio-O',
      'en-US-Chirp3-HD-Aoede',
      'en-US-Chirp3-HD-Callirrhoe',
      'en-US-Chirp3-HD-Kore',
      'en-US-Chirp3-HD-Gacrux',
      'en-US-Chirp3-HD-Erinome'
    ],
    turiVoice: 'en-US-Neural2-D' // Reserved for Turi - nice, clear female voice
  },
  'ru': {
    male: [
      'ru-RU-Wavenet-B',
      'ru-RU-Standard-B',
      'ru-RU-Standard-D'
    ],
    female: [
      'ru-RU-Wavenet-A',
      'ru-RU-Wavenet-C',
      'ru-RU-Wavenet-E',
      'ru-RU-Standard-A',
      'ru-RU-Standard-C',
      'ru-RU-Standard-E'
    ],
    turiVoice: 'ru-RU-Wavenet-A'
  },
  'es': {
    male: [
      'es-ES-Neural2-B',
      'es-ES-Wavenet-B',
      'es-ES-Standard-B'
    ],
    female: [
      'es-ES-Neural2-A',
      'es-ES-Neural2-C',
      'es-ES-Wavenet-C',
      'es-ES-Standard-A'
    ],
    turiVoice: 'es-ES-Neural2-A'
  },
  'fr': {
    male: [
      'fr-FR-Neural2-B',
      'fr-FR-Neural2-D',
      'fr-FR-Wavenet-B',
      'fr-FR-Wavenet-D'
    ],
    female: [
      'fr-FR-Neural2-A',
      'fr-FR-Neural2-C',
      'fr-FR-Neural2-E',
      'fr-FR-Wavenet-A',
      'fr-FR-Wavenet-C',
      'fr-FR-Wavenet-E'
    ],
    turiVoice: 'fr-FR-Neural2-A'
  },
  'de': {
    male: [
      'de-DE-Neural2-B',
      'de-DE-Neural2-D',
      'de-DE-Wavenet-B',
      'de-DE-Wavenet-D'
    ],
    female: [
      'de-DE-Neural2-A',
      'de-DE-Neural2-C',
      'de-DE-Neural2-F',
      'de-DE-Wavenet-A',
      'de-DE-Wavenet-C',
      'de-DE-Wavenet-F'
    ],
    turiVoice: 'de-DE-Neural2-A'
  },
  'it': {
    male: [
      'it-IT-Neural2-C',
      'it-IT-Wavenet-C',
      'it-IT-Wavenet-D'
    ],
    female: [
      'it-IT-Neural2-A',
      'it-IT-Neural2-B',
      'it-IT-Wavenet-A',
      'it-IT-Wavenet-B'
    ],
    turiVoice: 'it-IT-Neural2-A'
  },
  'ar': {
    male: [
      'ar-XA-Wavenet-B',
      'ar-XA-Wavenet-D',
      'ar-XA-Standard-B',
      'ar-XA-Standard-D'
    ],
    female: [
      'ar-XA-Wavenet-A',
      'ar-XA-Wavenet-C',
      'ar-XA-Standard-A',
      'ar-XA-Standard-C'
    ],
    turiVoice: 'ar-XA-Wavenet-A'
  },
  'CH': {
    male: [
      'cmn-CN-Wavenet-B',
      'cmn-CN-Wavenet-C',
      'cmn-CN-Standard-B',
      'cmn-CN-Standard-C'
    ],
    female: [
      'cmn-CN-Wavenet-A',
      'cmn-CN-Wavenet-D',
      'cmn-CN-Standard-A',
      'cmn-CN-Standard-D'
    ],
    turiVoice: 'cmn-CN-Wavenet-A'
  },
  'ja': {
    male: [
      'ja-JP-Neural2-C',
      'ja-JP-Neural2-D',
      'ja-JP-Wavenet-C',
      'ja-JP-Wavenet-D'
    ],
    female: [
      'ja-JP-Neural2-A',
      'ja-JP-Neural2-B',
      'ja-JP-Wavenet-A',
      'ja-JP-Wavenet-B'
    ],
    turiVoice: 'ja-JP-Neural2-A'
  },
  'tr': {
    male: [
      'tr-TR-Wavenet-B',
      'tr-TR-Wavenet-E',
      'tr-TR-Standard-B',
      'tr-TR-Standard-E'
    ],
    female: [
      'tr-TR-Wavenet-A',
      'tr-TR-Wavenet-C',
      'tr-TR-Wavenet-D',
      'tr-TR-Standard-A',
      'tr-TR-Standard-C',
      'tr-TR-Standard-D'
    ],
    turiVoice: 'tr-TR-Wavenet-A'
  }
};

/**
 * Character voice assignments (1-30)
 * Each character ID maps to an index in their gender's voice pool
 * This ensures consistent voice per character while using variety
 */
export const CHARACTER_VOICE_INDICES: Record<number, number> = {
  // Male characters - cycle through available male voices
  1: 0,   // Alex
  3: 1,   // Jamie
  5: 2,   // Marcus
  7: 3,   // Chris
  9: 4,   // Noah
  11: 5,  // Ryan
  13: 6,  // Tom
  15: 7,  // Dr. Chen
  17: 8,  // James
  19: 9,  // Kevin
  21: 10, // Lucas
  23: 11, // Tyler
  25: 12, // Jordan
  27: 0,  // Eric (cycle back)
  29: 1,  // Victor (cycle back)
  
  // Female characters - cycle through available female voices
  2: 0,   // Maya
  4: 1,   // Sophie
  6: 2,   // Diana
  8: 3,   // Professor Lee
  10: 4,  // Emma
  12: 5,  // Olivia
  14: 6,  // Isabella
  16: 7,  // Officer Sarah
  18: 8,  // Attorney Rodriguez
  20: 9,  // Zoe
  22: 10, // Mia
  24: 11, // Rachel
  26: 0,  // Lily (cycle back)
  28: 1,  // Nina (cycle back)
  30: 2   // Ava (cycle back)
};

/**
 * Get the voice name for a specific character in a given language
 */
export const getCharacterVoice = (
  characterId: number, 
  gender: 'male' | 'female',
  languageCode: SupportedLanguage
): string => {
  // Get language code (handle special cases)
  const langKey = languageCode === 'CH' ? 'CH' : languageCode;
  
  // Get voice pool for this language, fallback to English
  const voicePool = VOICE_POOLS[langKey] || VOICE_POOLS['en'];
  
  // Get character's voice index
  const voiceIndex = CHARACTER_VOICE_INDICES[characterId] || 0;
  
  // Get appropriate voice array based on gender
  const voiceArray = gender === 'female' ? voicePool.female : voicePool.male;
  
  // Return voice (use modulo to handle cycling)
  return voiceArray[voiceIndex % voiceArray.length];
};

/**
 * Get the Turi system voice for a given language
 * Used for quiz, word pronunciation, and system audio
 */
export const getTuriVoice = (languageCode: SupportedLanguage): string => {
  const langKey = languageCode === 'CH' ? 'CH' : languageCode;
  const voicePool = VOICE_POOLS[langKey] || VOICE_POOLS['en'];
  return voicePool.turiVoice;
};

/**
 * Get language code for Google TTS
 */
export const getLanguageCode = (languageCode: SupportedLanguage): string => {
  const languageCodeMap: Record<string, string> = {
    'en': 'en-US',
    'ru': 'ru-RU',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'ar': 'ar-XA',
    'CH': 'cmn-CN',
    'ja': 'ja-JP',
    'tr': 'tr-TR'
  };
  
  return languageCodeMap[languageCode] || 'en-US';
};

