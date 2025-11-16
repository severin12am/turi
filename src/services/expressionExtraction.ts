import { logger } from './logger';
import { SupportedLanguage } from '../constants/translations';
import { generateExpressionExtractionPrompt } from '../prompts/expressionExtraction';

// Netlify Function endpoint for expression extraction
const getGeminiExpressionExtractionUrl = () => '/.netlify/functions/gemini-extract-expressions';

// Use the EXACT same models as gemini.ts for consistency
// These models are proven to work with word explanations
const GEMINI_MODELS = [
  'gemini-1.5-flash',              // Try legacy model first (most compatible)
  'gemini-1.5-pro',                // Legacy pro model
  'gemini-flash-latest',           // Alias for latest Gemini 2.5 Flash (may have quota limits)
  'gemini-flash-lite-latest',      // Alias for latest Gemini 2.5 Flash Lite
  'gemini-1.5-flash-8b'            // Smaller, faster model
];

// Rate limiting (shared concept with other AI features)
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 15, // Slightly higher since this is lighter than word explanations
  windowMs: 60 * 1000, // 1 minute window
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
};

/**
 * Interface for extracted expressions
 */
export interface ExtractedExpression {
  target: string;  // Expression in target language
  mother: string;  // Translation in mother language
}

/**
 * Interface for expression extraction parameters
 */
export interface ExtractExpressionsParams {
  dialogueText: string;
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
}

/**
 * Get full language name from language code
 */
function getLanguageName(code: SupportedLanguage): string {
  const languageNames: Record<SupportedLanguage, string> = {
    'en': 'English',
    'ru': 'Russian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
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
    'ext': 'Extremaduran'
  };
  return languageNames[code] || code;
}

/**
 * Extract conversational expressions from dialogue using AI
 * Returns 3-5 key expressions that can be reused in other conversations
 * 
 * @param params - Parameters including dialogue text and languages
 * @returns Array of extracted expressions (3-5 items)
 * @throws Error if rate limit exceeded or AI service fails
 */
export const extractExpressionsFromDialogue = async (
  params: ExtractExpressionsParams
): Promise<ExtractedExpression[]> => {
  // Check rate limiting
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait before requesting another extraction.');
  }

  const { dialogueText, targetLanguage, motherLanguage } = params;
  
  // Construct the prompt
  const prompt = generateExpressionExtractionPrompt(
    dialogueText,
    getLanguageName(targetLanguage),
    getLanguageName(motherLanguage)
  );

  logger.info('Extracting expressions from dialogue', {
    targetLanguage,
    motherLanguage,
    textLength: dialogueText.length
  });

  // Try different models until one works
  let lastError: Error | null = null;
  
  for (const modelName of GEMINI_MODELS) {
    try {
      logger.info('Trying Gemini model for expression extraction', { modelName });
      
      // Call our Netlify Function
      const response = await fetch(getGeminiExpressionExtractionUrl(), {
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
              temperature: 0.2, // Low temperature for consistent extraction
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 400, // Smaller than word explanation (faster)
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Gemini API error for expression extraction', {
          status: response.status,
          error: errorText,
          modelName
        });
        
        // Try next model on common errors
        if (response.status === 404 || response.status === 429 || response.status === 403) {
          lastError = new Error(`Model ${modelName} unavailable (${response.status})`);
          continue;
        }
        
        lastError = new Error(`AI service error (${response.status})`);
        continue;
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        logger.error('Invalid Gemini API response for expression extraction', { data, modelName });
        lastError = new Error('Invalid response from AI service');
        continue;
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Parse JSON response
      try {
        // Remove markdown code blocks if present
        const cleanedText = generatedText
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        
        const expressions: ExtractedExpression[] = JSON.parse(cleanedText);
        
        // Validate response structure
        if (!Array.isArray(expressions) || expressions.length === 0) {
          logger.warn('AI returned empty or invalid expressions array', { expressions });
          lastError = new Error('No expressions extracted');
          continue;
        }
        
        // Validate each expression has required fields
        const validExpressions = expressions.filter(expr => 
          expr.target && expr.mother && 
          typeof expr.target === 'string' && 
          typeof expr.mother === 'string'
        );
        
        if (validExpressions.length === 0) {
          logger.warn('No valid expressions in AI response', { expressions });
          lastError = new Error('Invalid expression format');
          continue;
        }
        
        logger.info('Successfully extracted expressions', {
          count: validExpressions.length,
          modelName,
          expressions: validExpressions
        });
        
        console.log(`✅ AI extracted ${validExpressions.length} expressions using ${modelName}`);
        
        return validExpressions;
        
      } catch (parseError) {
        logger.error('Failed to parse AI expression response', {
          error: parseError,
          generatedText,
          modelName
        });
        lastError = new Error('Failed to parse AI response');
        continue;
      }
      
    } catch (error) {
      logger.error('Error during expression extraction', {
        error,
        modelName
      });
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }
  
  // All models failed
  const errorMessage = lastError?.message || 'All AI models failed to extract expressions';
  logger.error('Expression extraction failed for all models', { lastError });
  throw new Error(errorMessage);
};

