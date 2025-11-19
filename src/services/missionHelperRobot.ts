/**
 * Mission Helper Robot AI Service
 * Checks user sentences and provides corrections in mission mode
 */

import { logger } from './logger';
import { SupportedLanguage } from '../constants/languages';

const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

export interface HelperRobotDecision {
  decision: 'No errors' | 'Incorrect';
  explanation?: string; // Short explanation in mother language
  correctedSentence?: string; // Corrected sentence with transliteration and translation
}

export interface HelperRobotCheckParams {
  userText: string;
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
  missionGoal: string;
  npcRole: string;
}

/**
 * Helper robot checks user sentence and decides if it needs correction
 */
export const checkUserSentence = async (params: HelperRobotCheckParams): Promise<HelperRobotDecision> => {
  const { userText, targetLanguage, motherLanguage, missionGoal, npcRole } = params;

  logger.info('[HelperRobot] Checking user sentence', { userText, targetLanguage, motherLanguage, missionGoal });

  // Construct the prompt based on user's requirements
  const prompt = `You are Turi, a helper robot in a VOICE-ONLY language learning app.

User practising: ${targetLanguage}
User's native language: ${motherLanguage} (speak only in this language)
Mission: ${missionGoal}
Talking to: ${npcRole}

⚠️ CRITICAL: This is transcribed speech. NO punctuation in transcripts. NEVER flag missing punctuation (?, !, ¿, ¡). Only check grammar, vocabulary, word order.

User said: "${userText}"

Return JSON ONLY:

If no significant errors → {"decision": "No errors"}

If errors exist → {
  "decision": "Incorrect",
  "explanation": "Brief explanation in ${motherLanguage}. No punctuation complaints.",
  "correctedSentence": "Corrected in ${targetLanguage} [Phonetics] — Translation in ${motherLanguage}"
}

Example: "¿Cómo te llamas? [KOH-moh teh YAH-mahs] — What's your name?"`;

  let lastError: Error | null = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      logger.info('[HelperRobot] Trying model', { modelName });

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
              temperature: 0.3, // Lower temperature for consistent corrections
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 512,
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
        logger.error('[HelperRobot] API error', { status: response.status, error: errorText, modelName });
        
        if (response.status === 404 || response.status === 429 || response.status === 403) {
          lastError = new Error(`Model ${modelName} failed: ${response.status}`);
          continue;
        }
        
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      logger.info('[HelperRobot] Received response', { modelName });

      // Validate response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        logger.error('[HelperRobot] Invalid response structure', { data });
        throw new Error('Invalid AI response structure');
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      logger.info('[HelperRobot] Raw AI response', { textResponse });

      // Parse JSON response
      try {
        // Clean the response to extract only JSON
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const decision: HelperRobotDecision = JSON.parse(jsonMatch[0]);
        logger.info('[HelperRobot] Parsed decision', { decision });

        // Validate decision structure
        if (decision.decision !== 'No errors' && decision.decision !== 'Incorrect') {
          throw new Error('Invalid decision format');
        }

        if (decision.decision === 'Incorrect' && (!decision.explanation || !decision.correctedSentence)) {
          throw new Error('Missing explanation or corrected sentence');
        }

        return decision;
      } catch (parseError) {
        logger.error('[HelperRobot] Failed to parse JSON', { error: parseError, textResponse });
        throw new Error('Failed to parse AI response as JSON');
      }

    } catch (error) {
      logger.error('[HelperRobot] Error with model', { modelName, error });
      lastError = error as Error;
      continue;
    }
  }

  // All models failed
  logger.error('[HelperRobot] All models failed', { lastError });
  throw lastError || new Error('All AI models failed');
};

/**
 * Helper robot generates a suggestion when user clicks "help me"
 */
export const generateHelpSuggestion = async (params: Omit<HelperRobotCheckParams, 'userText'>): Promise<string> => {
  const { targetLanguage, motherLanguage, missionGoal, npcRole } = params;

  logger.info('[HelperRobot] Generating help suggestion', { targetLanguage, motherLanguage, missionGoal });

  const prompt = `You are Turi, a neutral, friendly helper robot in a language learning app.

The user is practising ${targetLanguage}.
Their native language is ${motherLanguage}.

Current mission: ${missionGoal}
The user is talking to: ${npcRole}

The user clicked "help me" because they don't know what to say.

Generate ONE natural, appropriate sentence in ${targetLanguage} that would help achieve the mission goal.

Format EXACTLY like this (no brackets around translation):
Sentence in ${targetLanguage} [Transliteration in ${motherLanguage} script] — Translation in ${motherLanguage}

Example: ¿Cómo te llamas? [KOH-moh teh YAH-mahs] — What's your name?

Be concise and natural. Return only the formatted suggestion, nothing else.`;

  let lastError: Error | null = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      logger.info('[HelperRobot] Generating suggestion with model', { modelName });

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
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 256,
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[HelperRobot] Suggestion API error', { status: response.status, error: errorText, modelName });
        
        if (response.status === 404 || response.status === 429 || response.status === 403) {
          lastError = new Error(`Model ${modelName} failed: ${response.status}`);
          continue;
        }
        
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        logger.error('[HelperRobot] Invalid suggestion response structure', { data });
        throw new Error('Invalid AI response structure');
      }

      const suggestion = data.candidates[0].content.parts[0].text.trim();
      logger.info('[HelperRobot] Generated suggestion', { suggestion });

      return suggestion;

    } catch (error) {
      logger.error('[HelperRobot] Error generating suggestion', { modelName, error });
      lastError = error as Error;
      continue;
    }
  }

  // All models failed
  logger.error('[HelperRobot] All models failed for suggestion', { lastError });
  throw lastError || new Error('All AI models failed');
};

