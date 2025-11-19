/**
 * Mission Helper Robot AI Service
 * Checks user sentences and provides corrections in mission mode
 */

import { logger } from './logger';
import type { SupportedLanguage } from '../constants/translations';

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
  conversationHistory?: Array<{ speaker: 'user' | 'npc'; text: string }>;
}

/**
 * Helper robot checks user sentence and decides if it needs correction
 */
export const checkUserSentence = async (params: HelperRobotCheckParams): Promise<HelperRobotDecision> => {
  const { userText, targetLanguage, motherLanguage, missionGoal, npcRole, conversationHistory } = params;

  logger.info('[HelperRobot] Checking user sentence', { userText, targetLanguage, motherLanguage, missionGoal });

  // Build conversation context if history exists
  const contextSection = conversationHistory && conversationHistory.length > 0 
    ? `\n\nCONVERSATION SO FAR:\n${conversationHistory.map(entry => 
        `${entry.speaker === 'user' ? 'User' : 'NPC'}: ${entry.text}`
      ).join('\n')}\n`
    : '';

  // Construct the prompt based on user's requirements
  const prompt = `You are a friend who checks his friend`s speech and corrects him if necessary. You are NOT part of the conversation — the learner (your friend who is trying to learn ${targetLanguage} )  is speaking directly to the NPC named "${npcRole}", never to you.

  Context:
  - Target language: ${targetLanguage}
  - Learner's native language: ${motherLanguage}
  - Current mission/goal: ${missionGoal}${contextSection}
  
  Important notes about the user's input:
  - The text comes from voice recognition of spoken ${targetLanguage} and doesn`t have punctuation, capitalization and  ¿ ¡ ? ! . ,; which, therefore, must be ignored.  Two correct sentences may be joined without pause.
  
  Your only job: decide if the learner's sentence contains MAJOR errors that make it incomprehensible or seriously wrong in the context of talking to "${npcRole}".
  
  Definitions:
  - MAJOR error = completely wrong grammar/structure, wrong vocabulary, completely irrelevant to learner`s current mission.
  - Minor imperfections (slightly unnatural word order, non-native phrasing, small mistakes) are OK — approve them if the meaning is clear.
  
  Learner's utterance to the NPC: "${userText}"
  
  Task:
  Answer with ONLY valid JSON in exactly one of the two formats below. No extra text, no markdown, no explanations outside the JSON.
  
  If no major errors:
  {"decision": "No errors"}
  
  If there are major errors:
  {
    "decision": "Incorrect",
    "explanation": "Short, friendly explanation in ${motherLanguage} (1–2 sentences max)",
    "correctedSentence": "Say: Corrected ${targetLanguage} sentence here [phonetic transliteration in parentheses] — Translation to ${motherLanguage}: translation here"
  }
  
  Return only the JSON object.`;

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

