/**
 * Mission NPC AI Service
 * Generates NPC responses during mission conversations
 */

import { logger } from './logger';
import { SupportedLanguage } from '../constants/languages';

const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

export interface MissionNPCParams {
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
  missionGoal: string;
  npcRole: string;
  userLevel: string; // A1, A2, B1, B2, etc.
  conversationHistory: Array<{ speaker: 'user' | 'npc'; text: string }>;
  userLatestMessage: string;
}

export interface MissionNPCResponse {
  response: string; // NPC's response in target language
  missionCompleted: boolean; // Whether the goal has been achieved
}

/**
 * Generate NPC response for mission conversation
 */
export const generateNPCResponse = async (params: MissionNPCParams): Promise<MissionNPCResponse> => {
  const { targetLanguage, motherLanguage, missionGoal, npcRole, userLevel, conversationHistory, userLatestMessage } = params;

  logger.info('[MissionNPC] Generating response', { 
    targetLanguage, 
    missionGoal, 
    npcRole, 
    conversationHistory: conversationHistory.length,
    userLatestMessage 
  });

  // Build conversation history string
  const historyText = conversationHistory
    .map(entry => `${entry.speaker === 'user' ? 'Learner' : 'You'}: ${entry.text}`)
    .join('\n');

  // Construct the NPC prompt
  const prompt = `You are a friendly native speaker having a real voice conversation with a language learner (${userLevel} level).

The learner has a secret goal: "${missionGoal}"

IMPORTANT RULES:
1. NEVER mention the learner's goal
2. Keep responses SHORT: maximum 2 sentences, maximum 12 words total
3. Make conversation last at least 2-4 natural exchanges (ask follow-ups, be realistically stubborn)
4. Adjust speed/vocab to ${userLevel} level
5. Stay 100% in character as ${npcRole}
6. NEVER correct mistakes — you are not a teacher, just a native speaker having a natural conversation
7. Speak ONLY in ${targetLanguage}
8. Be natural, conversational, and true to your role
9. If the learner has achieved the goal naturally through conversation, the mission should be considered complete

Your role: ${npcRole}
Language: ${targetLanguage}

Previous conversation:
${historyText}

Learner's latest message: "${userLatestMessage}"

Respond naturally in ${targetLanguage} (max 2 sentences, max 12 words). Then, on a new line, write ONLY "MISSION_COMPLETE: true" if the learner has genuinely achieved the goal "${missionGoal}" through natural conversation, or "MISSION_COMPLETE: false" if not yet.

Format:
[Your SHORT response in ${targetLanguage} - max 2 sentences, max 12 words]
MISSION_COMPLETE: [true or false]`;

  let lastError: Error | null = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      logger.info('[MissionNPC] Trying model', { modelName });

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
              temperature: 0.8, // Higher temperature for more natural, varied responses
              topK: 40,
              topP: 0.95,
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
        logger.error('[MissionNPC] API error', { status: response.status, error: errorText, modelName });
        
        if (response.status === 404 || response.status === 429 || response.status === 403) {
          lastError = new Error(`Model ${modelName} failed: ${response.status}`);
          continue;
        }
        
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      logger.info('[MissionNPC] Received response', { modelName });

      // Validate response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        logger.error('[MissionNPC] Invalid response structure', { data });
        throw new Error('Invalid AI response structure');
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      logger.info('[MissionNPC] Raw AI response', { textResponse });

      // Parse the response
      const lines = textResponse.split('\n').filter(line => line.trim());
      
      // Find the MISSION_COMPLETE line
      let missionCompleted = false;
      let npcResponse = '';
      
      for (const line of lines) {
        if (line.includes('MISSION_COMPLETE:')) {
          const match = line.match(/MISSION_COMPLETE:\s*(true|false)/i);
          if (match) {
            missionCompleted = match[1].toLowerCase() === 'true';
          }
        } else {
          // This is part of the NPC's response
          npcResponse += line + ' ';
        }
      }

      npcResponse = npcResponse.trim();

      if (!npcResponse) {
        throw new Error('Empty NPC response');
      }

      logger.info('[MissionNPC] Parsed response', { npcResponse, missionCompleted });

      return {
        response: npcResponse,
        missionCompleted
      };

    } catch (error) {
      logger.error('[MissionNPC] Error with model', { modelName, error });
      lastError = error as Error;
      continue;
    }
  }

  // All models failed
  logger.error('[MissionNPC] All models failed', { lastError });
  throw lastError || new Error('All AI models failed');
};

/**
 * Evaluate if mission is complete (fallback check)
 * This is a secondary check in case the NPC AI doesn't properly report completion
 */
export const evaluateMissionCompletion = async (params: {
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
  missionGoal: string;
  conversationHistory: Array<{ speaker: 'user' | 'npc'; text: string }>;
}): Promise<boolean> => {
  const { targetLanguage, missionGoal, conversationHistory } = params;

  logger.info('[MissionNPC] Evaluating mission completion', { missionGoal, historyLength: conversationHistory.length });

  // Build conversation history string
  const historyText = conversationHistory
    .map(entry => `${entry.speaker === 'user' ? 'Learner' : 'NPC'}: ${entry.text}`)
    .join('\n');

  const prompt = `You are evaluating if a language learner has completed a mission.

Mission goal: "${missionGoal}"

Conversation in ${targetLanguage}:
${historyText}

Based on this conversation, has the learner genuinely achieved the goal "${missionGoal}"?

Answer with ONLY "true" or "false" (nothing else).`;

  try {
    const modelName = GEMINI_MODELS[0];
    logger.info('[MissionNPC] Evaluating completion with model', { modelName });

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
            temperature: 0.2, // Low temperature for consistent evaluation
            topK: 10,
            topP: 0.8,
            maxOutputTokens: 10,
          }
        }
      })
    });

    if (!response.ok) {
      logger.error('[MissionNPC] Evaluation API error', { status: response.status });
      return false;
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      logger.error('[MissionNPC] Invalid evaluation response structure');
      return false;
    }

    const textResponse = data.candidates[0].content.parts[0].text.trim().toLowerCase();
    const completed = textResponse.includes('true');
    
    logger.info('[MissionNPC] Evaluation result', { completed, textResponse });

    return completed;

  } catch (error) {
    logger.error('[MissionNPC] Error evaluating completion', { error });
    return false;
  }
};

