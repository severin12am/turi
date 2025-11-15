import { logger } from './logger';
import { SupportedLanguage } from '../constants/translations';
import { supabase } from './supabase';

/**
 * Translation Fallback Service
 * 
 * This service provides AI-powered translation and transliteration fallback
 * when content is missing from Supabase tables. It uses Google Gemini API
 * to translate English source content on-demand.
 */

export interface DialoguePhrase {
  id?: number;
  dialogue_id: number;
  dialogue_step: number;
  speaker: 'NPC' | 'User';
  en_text?: string;
  [key: string]: any; // For language-specific columns
}

export interface TranslationRequest {
  sourceText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  includeTransliteration?: boolean;
}

export interface TranslationResult {
  translation: string;
  transliteration?: string;
}

/**
 * Load English source dialogues from CSV files
 * This reads the CSV files and extracts only English content for fallback
 */
export const loadEnglishSourceFromCSV = async (
  tableName: string
): Promise<DialoguePhrase[]> => {
  try {
    // Determine if it's a scenario or phrases table
    const isScenario = tableName.startsWith('scenario_');
    const tableNumber = tableName.split('_')[1];
    const csvPath = `/src/data/csv/${tableName}.csv`;

    logger.info('Loading English source from CSV', { tableName, csvPath });

    // In browser environment, we'll need to fetch the CSV file
    const response = await fetch(csvPath);
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${csvPath}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');
    
    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Find column indices
    const idIndex = headers.indexOf('id');
    const dialogueIdIndex = headers.indexOf('dialogue_id');
    const dialogueStepIndex = headers.indexOf('dialogue_step');
    const speakerIndex = headers.indexOf('speaker');
    const enTextIndex = headers.indexOf('en_text');

    if (enTextIndex === -1) {
      throw new Error('CSV does not contain en_text column');
    }

    // Parse data rows
    const phrases: DialoguePhrase[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted fields)
      const values = parseCSVLine(line);
      
      if (values.length < headers.length) continue;

      phrases.push({
        id: idIndex !== -1 ? parseInt(values[idIndex]) : undefined,
        dialogue_id: parseInt(values[dialogueIdIndex]),
        dialogue_step: parseInt(values[dialogueStepIndex]),
        speaker: values[speakerIndex] as 'NPC' | 'User',
        en_text: values[enTextIndex].replace(/"/g, '').trim()
      });
    }

    logger.info('Loaded English source from CSV', { 
      tableName, 
      phrasesCount: phrases.length 
    });

    return phrases;
  } catch (error) {
    logger.error('Failed to load English source from CSV', { error, tableName });
    return [];
  }
};

/**
 * Simple CSV line parser that handles quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) {
    result.push(current.trim());
  }
  
  return result;
}

/**
 * Translate text using Google Gemini API
 * This is called when Supabase content is missing
 */
export const translateWithAI = async (
  request: TranslationRequest
): Promise<TranslationResult> => {
  const { sourceText, sourceLanguage, targetLanguage, includeTransliteration = true } = request;

  logger.info('AI translation requested', { 
    sourceLanguage, 
    targetLanguage, 
    textLength: sourceText.length 
  });

  try {
    const prompt = generateTranslationPrompt(
      sourceText,
      sourceLanguage,
      targetLanguage,
      includeTransliteration
    );

    // Call Netlify Function for translation
    const response = await fetch('/.netlify/functions/gemini-dialogue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelName: 'gemini-1.5-flash',
        requestBody: {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3, // Lower temperature for consistent translations
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 512,
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`AI translation failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid AI response');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse JSON response
    const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanedText);

    logger.info('AI translation successful', { 
      sourceLanguage, 
      targetLanguage,
      hasTransliteration: !!result.transliteration
    });

    return {
      translation: result.translation,
      transliteration: result.transliteration
    };
  } catch (error) {
    logger.error('AI translation failed', { error, sourceLanguage, targetLanguage });
    throw error;
  }
};

/**
 * Generate translation prompt for AI
 */
function generateTranslationPrompt(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  includeTransliteration: boolean
): string {
  const sourceLangName = getLanguageName(sourceLanguage);
  const targetLangName = getLanguageName(targetLanguage);

  let prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.

Text: "${text}"

Return a JSON object with:
- "translation": the translated text in ${targetLangName}`;

  if (includeTransliteration) {
    prompt += `
- "transliteration": the translation written in ${sourceLangName} letters (lowercase, no punctuation)`;
  }

  prompt += `

Example format:
{
  "translation": "translated text here",
  "transliteration": "transliterated text here"
}

Be accurate and natural. For transliteration, approximate the sounds using ${sourceLangName} alphabet.`;

  return prompt;
}

/**
 * Get language full name from code
 */
function getLanguageName(code: SupportedLanguage): string {
  const languageNames: Record<SupportedLanguage, string> = {
    'en': 'English',
    'ru': 'Russian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ar': 'Arabic',
    'CH': 'Chinese',
    'ja': 'Japanese',
    'tr': 'Turkish',
    'ko': 'Korean',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
    'cs': 'Czech',
    'sk': 'Slovak',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sr': 'Serbian',
    'sl': 'Slovenian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'mt': 'Maltese',
    'ga': 'Irish',
    'cy': 'Welsh',
    'is': 'Icelandic',
    'fo': 'Faroese',
    'eu': 'Basque',
    'ca': 'Catalan',
    'gl': 'Galician',
    'ast': 'Asturian',
    'oc': 'Occitan',
    'co': 'Corsican',
    'sc': 'Sardinian',
    'rm': 'Romansh',
    'fur': 'Friulian',
    'lad': 'Ladino',
    'an': 'Aragonese',
    'ext': 'Extremaduran',
    'mwl': 'Mirandese',
    'he': 'Hebrew',
    'fa': 'Persian',
    'ur': 'Urdu',
    'ps': 'Pashto',
    'ku': 'Kurdish',
    'az': 'Azerbaijani',
    'kk': 'Kazakh',
    'ky': 'Kyrgyz',
    'uz': 'Uzbek',
    'tk': 'Turkmen',
    'mn': 'Mongolian',
    'bo': 'Tibetan',
    'my': 'Burmese',
    'km': 'Khmer',
    'lo': 'Lao',
    'si': 'Sinhala',
    'ta': 'Tamil',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'pa': 'Punjabi',
    'or': 'Odia',
    'as': 'Assamese',
    'ne': 'Nepali',
    'mr': 'Marathi',
    'sa': 'Sanskrit',
    'sd': 'Sindhi',
    'dv': 'Dhivehi',
    'am': 'Amharic',
    'ti': 'Tigrinya',
    'om': 'Oromo',
    'so': 'Somali',
    'sw': 'Swahili',
    'zu': 'Zulu',
    'xh': 'Xhosa',
    'af': 'Afrikaans',
    'st': 'Sesotho',
    'tn': 'Setswana',
    've': 'Venda',
    'ts': 'Tsonga',
    'ss': 'Swati',
    'nr': 'Ndebele',
    'nso': 'Northern Sotho',
    'lg': 'Luganda',
    'rw': 'Kinyarwanda',
    'rn': 'Kirundi',
    'ny': 'Chichewa',
    'sn': 'Shona',
    'id': 'Indonesian',
    'ms': 'Malay',
    'tl': 'Tagalog',
    'ceb': 'Cebuano',
    'hil': 'Hiligaynon',
    'war': 'Waray',
    'bcl': 'Bikol',
    'pag': 'Pangasinan',
    'mrw': 'Maranao',
    'tsg': 'Tausug'
  };
  
  return languageNames[code] || code;
}

/**
 * Fetch dialogues with AI fallback for missing translations
 * This is the main function that components should use
 */
export const fetchDialoguesWithFallback = async (
  tableName: string,
  dialogueId: number,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage
): Promise<DialoguePhrase[]> => {
  try {
    logger.info('Fetching dialogues with fallback', { 
      tableName, 
      dialogueId, 
      targetLanguage, 
      motherLanguage 
    });

    // First, try to fetch from Supabase
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('dialogue_id', dialogueId)
      .order('dialogue_step', { ascending: true });

    if (error) {
      logger.error('Supabase fetch error, will try CSV fallback', { error, tableName });
      throw error;
    }

    if (!data || data.length === 0) {
      logger.warn('No data in Supabase, trying CSV fallback', { tableName, dialogueId });
      throw new Error('No data in Supabase');
    }

    // Check if translations are missing
    const targetColumn = `${targetLanguage.toLowerCase()}_text`;
    const transliterationColumn = `${targetLanguage.toLowerCase()}_text_${motherLanguage.toLowerCase()}`;
    
    const needsTranslation = data.some(phrase => !phrase[targetColumn]);
    const needsTransliteration = data.some(phrase => !phrase[transliterationColumn]);

    // If we have all the data, return it
    if (!needsTranslation && !needsTransliteration) {
      logger.info('All translations present in Supabase', { tableName, dialogueId });
      return data;
    }

    // Otherwise, fill in missing translations with AI
    logger.info('Some translations missing, using AI fallback', { 
      tableName, 
      dialogueId,
      needsTranslation,
      needsTransliteration
    });

    const enrichedData = await Promise.all(
      data.map(async (phrase) => {
        const enrichedPhrase = { ...phrase };

        // Check if translation is missing
        if (!phrase[targetColumn] && phrase.en_text) {
          try {
            const aiResult = await translateWithAI({
              sourceText: phrase.en_text,
              sourceLanguage: 'en',
              targetLanguage: targetLanguage,
              includeTransliteration: needsTransliteration
            });

            enrichedPhrase[targetColumn] = aiResult.translation;
            
            if (aiResult.transliteration) {
              enrichedPhrase[transliterationColumn] = aiResult.transliteration;
            }

            logger.info('Added AI translation to phrase', { 
              dialogueStep: phrase.dialogue_step,
              targetLanguage
            });
          } catch (error) {
            logger.error('Failed to translate phrase with AI', { 
              error, 
              dialogueStep: phrase.dialogue_step 
            });
            // Keep the phrase without translation rather than failing completely
          }
        }

        return enrichedPhrase;
      })
    );

    return enrichedData;
  } catch (error) {
    logger.error('Failed to fetch dialogues with fallback', { 
      error, 
      tableName, 
      dialogueId 
    });
    throw error;
  }
};

/**
 * Check which content is missing in a Supabase table
 * Useful for diagnostics and determining what needs translation
 */
export const checkMissingContent = async (
  tableName: string,
  targetLanguage: SupportedLanguage
): Promise<{
  totalRows: number;
  missingTranslations: number;
  missingTransliterations: number;
  coverage: number;
}> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) throw error;
    if (!data) return { totalRows: 0, missingTranslations: 0, missingTransliterations: 0, coverage: 0 };

    const targetColumn = `${targetLanguage.toLowerCase()}_text`;
    const transliterationPattern = `${targetLanguage.toLowerCase()}_text_`;

    let missingTranslations = 0;
    let missingTransliterations = 0;

    for (const row of data) {
      if (!row[targetColumn]) {
        missingTranslations++;
      }

      // Check if any transliteration column is missing
      const hasAnyTransliteration = Object.keys(row).some(
        key => key.startsWith(transliterationPattern) && row[key]
      );
      
      if (!hasAnyTransliteration) {
        missingTransliterations++;
      }
    }

    const coverage = data.length > 0 
      ? ((data.length - missingTranslations) / data.length) * 100 
      : 0;

    return {
      totalRows: data.length,
      missingTranslations,
      missingTransliterations,
      coverage: Math.round(coverage * 100) / 100
    };
  } catch (error) {
    logger.error('Failed to check missing content', { error, tableName });
    throw error;
  }
};

