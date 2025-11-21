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

// Try different Gemini models in order of preference (same as dialogue generation)
const GEMINI_MODELS = [
  'gemini-1.5-flash-latest',       // Latest stable flash model (v1 API compatible)
  'gemini-1.5-pro-latest',         // Latest stable pro model
  'gemini-1.5-flash-002',          // Stable flash version
  'gemini-1.5-pro-002'             // Stable pro version
];

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
  motherLanguage?: SupportedLanguage;  // For transliteration in mother language script
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
 * Now includes retry logic to try multiple models if one fails
 */
export const translateWithAI = async (
  request: TranslationRequest
): Promise<TranslationResult> => {
  const { sourceText, sourceLanguage, targetLanguage, motherLanguage, includeTransliteration = true } = request;

  logger.info('AI translation requested', { 
    sourceLanguage, 
    targetLanguage,
    motherLanguage,
    textLength: sourceText.length 
  });

  const prompt = generateTranslationPrompt(
    sourceText,
    sourceLanguage,
    targetLanguage,
    motherLanguage,
    includeTransliteration
  );

  // Try different models until one works
  let lastError: Error | null = null;
  
  for (const modelName of GEMINI_MODELS) {
    try {
      logger.info('Trying Gemini model for translation', { 
        modelName, 
        sourceLanguage, 
        targetLanguage 
      });

      // Call Netlify Function for translation
      const response = await fetch('/.netlify/functions/gemini-dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelName,
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
        const errorText = await response.text();
        logger.error('Gemini API error during translation', { 
          status: response.status, 
          error: errorText, 
          modelName 
        });
        
        // If it's a 404, try the next model
        if (response.status === 404) {
          lastError = new Error(`Model ${modelName} not found`);
          continue;
        }
        
        // If quota exceeded (429), try next model instead of throwing
        if (response.status === 429) {
          lastError = new Error('Quota exceeded for this model');
          logger.info(`Model ${modelName} quota exceeded, trying next model...`);
          continue;
        }
        
        // For other errors, try next model
        if (response.status === 403) {
          lastError = new Error('API access denied');
          continue;
        } else {
          lastError = new Error(`AI service error (${response.status})`);
          continue;
        }
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        logger.error('Invalid Gemini API response structure during translation', { 
          data, 
          modelName 
        });
        lastError = new Error('Invalid response from AI service');
        continue;
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Parse JSON response
      let result;
      try {
        const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
        result = JSON.parse(cleanedText);
      } catch (parseError) {
        logger.error('Failed to parse AI translation response', { 
          generatedText, 
          parseError, 
          modelName 
        });
        lastError = new Error('Failed to parse AI response. Please try again.');
        continue;
      }

      logger.info('AI translation successful', { 
        sourceLanguage, 
        targetLanguage,
        hasTransliteration: !!result.transliteration,
        modelName
      });

      return {
        translation: result.translation,
        transliteration: result.transliteration
      };

    } catch (error) {
      logger.error('Error with translation model', { error, modelName });
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }

  // If all models failed, throw the last error
  logger.error('All Gemini models failed for translation', { 
    sourceLanguage, 
    targetLanguage,
    lastError 
  });
  throw lastError || new Error('AI translation is currently unavailable. Please try again later.');
};

/**
 * Generate translation prompt for AI
 */
function generateTranslationPrompt(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage | undefined,
  includeTransliteration: boolean
): string {
  const sourceLangName = getLanguageName(sourceLanguage);
  const targetLangName = getLanguageName(targetLanguage);
  const motherLangName = motherLanguage ? getLanguageName(motherLanguage) : sourceLangName;

  // Special case: if source = target, we're only doing transliteration
  const isTransliterationOnly = sourceLanguage === targetLanguage;

  let prompt;
  
  if (isTransliterationOnly && includeTransliteration) {
    // Transliteration-only mode (e.g., Turkish text → Russian script)
    prompt = `Transliterate the following ${sourceLangName} text into ${motherLangName} script.

Text: "${text}"

Return a JSON object with:
- "translation": keep the same text in ${sourceLangName} (no translation needed)
- "transliteration": the text written using ${motherLangName} alphabet/script (lowercase, no punctuation)

Example format:
{
  "translation": "original text here",
  "transliteration": "transliterated text here in ${motherLangName} script"
}

Be accurate and natural. Approximate the ${sourceLangName} sounds using the ${motherLangName} writing system (not English romanization).`;
  } else {
    // Normal translation mode
    prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.

Text: "${text}"

Return a JSON object with:
- "translation": the translated text in ${targetLangName}`;

    if (includeTransliteration) {
      prompt += `
- "transliteration": the translation written using ${motherLangName} alphabet/script (lowercase, no punctuation)`;
    }

    prompt += `

Example format:
{
  "translation": "translated text here",
  "transliteration": "transliterated text here"
}

Be accurate and natural. For transliteration, approximate the ${targetLangName} sounds using the ${motherLangName} writing system.`;
  }

  return prompt;
}

/**
 * Get language full name from code
 * Only includes the 30 supported languages
 */
function getLanguageName(code: SupportedLanguage): string {
  const languageNames: Record<SupportedLanguage, string> = {
    'en': 'English',
    'CH': 'Chinese',
    'hi': 'Hindi',
    'es': 'Spanish',
    'fr': 'French',
    'ar': 'Arabic',
    'bn': 'Bengali',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'id': 'Indonesian',
    'ur': 'Urdu',
    'de': 'German',
    'ja': 'Japanese',
    'sw': 'Swahili',
    'te': 'Telugu',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'tr': 'Turkish',
    'ko': 'Korean',
    'vi': 'Vietnamese',
    'it': 'Italian',
    'th': 'Thai',
    'pl': 'Polish',
    'uk': 'Ukrainian',
    'nl': 'Dutch',
    'ro': 'Romanian',
    'el': 'Greek',
    'cs': 'Czech',
    'sv': 'Swedish',
    'hu': 'Hungarian'
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
    console.log('🔄 FETCHING WITH FALLBACK:', { tableName, dialogueId, targetLanguage, motherLanguage });

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

    console.log('✅ Data fetched from Supabase:', data.length, 'phrases');

    // Check if translations are missing
    const targetColumn = `${targetLanguage.toLowerCase()}_text`;
    const motherColumn = `${motherLanguage.toLowerCase()}_text`;
    const transliterationColumn = `${targetLanguage.toLowerCase()}_text_${motherLanguage.toLowerCase()}`;
    
    // Check if the columns actually exist in the data
    const hasTransliterationColumn = data.length > 0 && transliterationColumn in data[0];
    
    const needsTargetTranslation = data.some(phrase => !phrase[targetColumn]);
    const needsMotherTranslation = data.some(phrase => !phrase[motherColumn]);
    const needsTransliteration = hasTransliterationColumn 
      ? data.some(phrase => !phrase[transliterationColumn])
      : true; // If column doesn't exist, we'll generate transliteration in memory

    console.log('🔍 TRANSLATION CHECK:', {
      targetColumn,
      motherColumn,
      transliterationColumn,
      needsTargetTranslation,
      needsMotherTranslation,
      needsTransliteration,
      hasTransliterationColumn,
      sampleData: data[0] ? {
        id: data[0].id,
        targetText: data[0][targetColumn],
        motherText: data[0][motherColumn],
        transliteration: data[0][transliterationColumn]
      } : null
    });

    // If we have all the data, return it
    if (!needsTargetTranslation && !needsMotherTranslation && !needsTransliteration) {
      logger.info('All translations present in Supabase', { tableName, dialogueId });
      console.log('✅ All translations present, returning data as-is');
      return data;
    }

    // Otherwise, fill in missing translations with AI
    logger.info('Some translations missing, using AI fallback', { 
      tableName, 
      dialogueId,
      needsTargetTranslation,
      needsMotherTranslation,
      needsTransliteration,
      hasTransliterationColumn
    });

    const enrichedData = await Promise.all(
      data.map(async (phrase) => {
        const enrichedPhrase = { ...phrase };

        // Translate to target language if missing
        if (!phrase[targetColumn] && phrase.en_text) {
          try {
            const aiResult = await translateWithAI({
              sourceText: phrase.en_text,
              sourceLanguage: 'en',
              targetLanguage: targetLanguage,
              motherLanguage: motherLanguage,
              includeTransliteration: needsTransliteration
            });

            enrichedPhrase[targetColumn] = aiResult.translation;
            
            // Store transliteration in memory (whether or not DB column exists)
            if (aiResult.transliteration) {
              enrichedPhrase[transliterationColumn] = aiResult.transliteration;
              
              if (!hasTransliterationColumn) {
                logger.info('Transliteration generated in-memory (column does not exist in DB)', {
                  dialogueStep: phrase.dialogue_step,
                  transliterationColumn
                });
              }
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
        // If translation exists but transliteration is missing (and column doesn't exist)
        else if (!hasTransliterationColumn && phrase[targetColumn]) {
          try {
            const aiResult = await translateWithAI({
              sourceText: phrase[targetColumn],
              sourceLanguage: targetLanguage,
              targetLanguage: targetLanguage, // Same language for transliteration only
              motherLanguage: motherLanguage,
              includeTransliteration: true
            });
            
            if (aiResult.transliteration) {
              enrichedPhrase[transliterationColumn] = aiResult.transliteration;
              logger.info('Transliteration generated in-memory for existing translation', {
                dialogueStep: phrase.dialogue_step
              });
            }
          } catch (error) {
            logger.error('Failed to generate transliteration', { error, dialogueStep: phrase.dialogue_step });
          }
        }

        // Translate to mother language if missing (for the translation display)
        if (!phrase[motherColumn] && phrase.en_text) {
          try {
            const aiResult = await translateWithAI({
              sourceText: phrase.en_text,
              sourceLanguage: 'en',
              targetLanguage: motherLanguage,
              includeTransliteration: false // No transliteration needed for mother language
            });

            enrichedPhrase[motherColumn] = aiResult.translation;
            
            logger.info('Added AI translation to mother language', { 
              dialogueStep: phrase.dialogue_step,
              motherLanguage
            });
          } catch (error) {
            logger.error('Failed to translate phrase to mother language with AI', { 
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

