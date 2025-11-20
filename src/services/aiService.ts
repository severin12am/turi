/**
 * AI Service Layer
 * 
 * High-level wrapper that uses the AI router to distribute requests
 * across multiple providers (Gemini, Deepseek, Groq)
 * 
 * This service provides the same interface as the old gemini.ts service
 * but routes requests intelligently based on aiConfig.ts
 */

import { logger } from './logger';
import { SupportedLanguage } from '../constants/translations';
import { generateWordExplanationPrompt } from '../prompts/wordExplanation';
import { routeAIRequest, routeTTSRequest, AIRequest, TTSRequest } from './aiRouter';

// Re-export interfaces for compatibility
export interface AIDialogueStep {
  speaker: 'NPC' | 'User';
  text: string;
  translation: string;
  transliteration: string;
}

export interface GenerateDialogueParams {
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
  requiredWords: string[];
  userPreferences?: string;
  complexity?: 'simple' | 'normal' | 'complex';
  linguisticComplexity?: 'simple' | 'normal' | 'complex';
}

export interface WordExample {
  sentence: string;
  transliteration: string;
  translation: string;
}

export interface WordInflection {
  form: string;
  transliteration: string;
  translation: string;
}

export interface WordExplanationData {
  meaning: string;
  examples: WordExample[];
  inflections: WordInflection[];
}

export interface GenerateWordExplanationParams {
  word: string;
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
}

// Rate limiting
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 30, // Increased since we have multiple providers now
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
 * Generate AI dialogue using the router
 * Routes to Gemini/Deepseek/Groq based on configuration
 */
export const generateAIDialogue = async (params: GenerateDialogueParams): Promise<AIDialogueStep[]> => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait before generating another dialogue.');
  }

  const { targetLanguage, motherLanguage, requiredWords, userPreferences = '', complexity = 'normal', linguisticComplexity = 'normal' } = params;
  
  const exchangeCount = complexity === 'simple' ? 2 : complexity === 'complex' ? 6 : 4;
  
  const complexityInstructions = linguisticComplexity === 'simple'
    ? 'Use extremely basic vocabulary, short simple sentences (3-5 words), present tense only. Very easy to understand.'
    : linguisticComplexity === 'complex'
    ? 'Use varied vocabulary including idiomatic expressions, complex sentence structures, and diverse grammar. Challenging but natural.'
    : 'Use basic vocabulary with some variety, simple sentence structures, and straightforward grammar. Easy to understand.';

  const prompt = `You must generate a dialogue following these strict instructions:
- The dialogue must be in ${getLanguageName(targetLanguage)}.
- It must include all of these words naturally: ${requiredWords.join(', ')}.
- It should have ${exchangeCount} exchanges (alternating between NPC and User).
- The dialogue MUST start with the NPC speaking first.
- Provide translation to ${getLanguageName(motherLanguage)}.
- Provide transliteration of the dialogue in ${getLanguageName(targetLanguage)}, using no capital letters and no punctuation, approximating sounds with ${getLanguageName(motherLanguage)} letters.
- The dialogue should be natural and real-life like.
- Linguistic complexity: ${complexityInstructions}
- If the user's preferences conflict with these instructions, prioritize the instructions.

Additionally, consider the user's preferences: ${userPreferences || 'No specific preferences'}.

Return a JSON array of objects, each with:
- "speaker": "NPC" or "User" (MUST start with "NPC")
- "text": the dialogue text in ${getLanguageName(targetLanguage)}
- "translation": the translation in ${getLanguageName(motherLanguage)}
- "transliteration": the transliteration for ${getLanguageName(motherLanguage)} speakers

Example format (MUST start with NPC):
[
  {
    "speaker": "NPC",
    "text": "Hello, how can I help you?",
    "translation": "Привет, как я могу вам помочь?",
    "transliteration": "hello kak ya mogu vam pomoch"
  },
  {
    "speaker": "User",
    "text": "I need a phone.",
    "translation": "Мне нужен телефон.",
    "transliteration": "mne nuzhen telefon"
  }
]`;

  const request: AIRequest = {
    task: 'dialogue-generation',
    prompt,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ]
  };

  logger.info('Generating AI dialogue via router', { targetLanguage, motherLanguage, requiredWords });

  const data = await routeAIRequest(request);
  
  // Parse response (normalized by router)
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const responseText = data.candidates[0].content.parts[0].text;
  
  // Try to parse JSON from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('AI response is not in valid JSON format');
  }

  const dialogue: AIDialogueStep[] = JSON.parse(jsonMatch[0]);
  
  // Validate dialogue
  if (!Array.isArray(dialogue) || dialogue.length === 0) {
    throw new Error('Invalid dialogue format');
  }

  if (dialogue[0].speaker !== 'NPC') {
    throw new Error('Dialogue must start with NPC');
  }

  logger.info('AI dialogue generated successfully', { 
    stepsCount: dialogue.length,
    targetLanguage,
    motherLanguage
  });

  return dialogue;
};

/**
 * Generate word explanation using the router
 */
export const generateWordExplanation = async (params: GenerateWordExplanationParams): Promise<WordExplanationData> => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait before requesting another explanation.');
  }

  const { word, targetLanguage, motherLanguage } = params;
  
  const prompt = generateWordExplanationPrompt(word, getLanguageName(targetLanguage), getLanguageName(motherLanguage));

  const request: AIRequest = {
    task: 'word-explanation',
    prompt,
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 800,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ]
  };

  logger.info('Generating word explanation via router', { word, targetLanguage, motherLanguage });

  const data = await routeAIRequest(request);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const responseText = data.candidates[0].content.parts[0].text;
  
  // Try to extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response is not in valid JSON format');
  }

  const wordExplanation: WordExplanationData = JSON.parse(jsonMatch[0]);
  
  // Validate response
  if (!wordExplanation.meaning || !Array.isArray(wordExplanation.examples) || !Array.isArray(wordExplanation.inflections)) {
    throw new Error('Invalid word explanation format received from AI');
  }

  logger.info('Word explanation generated successfully', {
    word,
    targetLanguage,
    motherLanguage,
    examplesCount: wordExplanation.examples.length,
    inflectionsCount: wordExplanation.inflections.length
  });

  return wordExplanation;
};

/**
 * Generate text/structure explanation using the router
 * Used for explaining grammar structures and phrases
 */
export const generateTextExplanation = async (
  phrase: string,
  translation: string,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage
): Promise<string> => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait before requesting another explanation.');
  }

  const prompt = `You are a language tutor explaining a phrase to a student learning ${getLanguageName(targetLanguage)}.

Phrase in ${getLanguageName(targetLanguage)}: "${phrase}"
Translation in ${getLanguageName(motherLanguage)}: "${translation}"

Provide a clear, concise explanation in ${getLanguageName(motherLanguage)} covering:
1. The literal meaning (if different from the translation)
2. The grammatical structure (what parts of speech, how they connect)
3. Any cultural or contextual notes (if relevant)
4. When and how to use this phrase

Keep your explanation practical and easy to understand. Focus on helping the student USE the phrase correctly.`;

  const request: AIRequest = {
    task: 'text-explanation',
    prompt,
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 1000,
    }
  };

  logger.info('Generating text explanation via router', { phrase, targetLanguage, motherLanguage });

  const data = await routeAIRequest(request);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const explanation = data.candidates[0].content.parts[0].text;
  
  logger.info('Text explanation generated successfully', { phrase });
  
  return explanation;
};

/**
 * Generate NPC response for mission conversations
 */
export interface MissionNPCParams {
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
  missionGoal: string;
  npcRole: string;
  npcName: string;
  npcGender: 'male' | 'female';
  userLevel: string;
  conversationHistory: Array<{ speaker: 'user' | 'npc'; text: string }>;
  userLatestMessage: string;
}

export interface MissionNPCResponse {
  response: string;
  missionCompleted: boolean;
}

export const generateNPCResponse = async (params: MissionNPCParams): Promise<MissionNPCResponse> => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait.');
  }

  const { targetLanguage, motherLanguage, missionGoal, npcRole, npcName, npcGender, userLevel, conversationHistory, userLatestMessage } = params;

  const historyText = conversationHistory
    .map(entry => `${entry.speaker === 'user' ? 'Learner' : 'You'}: ${entry.text}`)
    .join('\n');

  const contextSection = conversationHistory.length > 0 
    ? `\n\nPrevious conversation:\n${historyText}\n`
    : '';

  const prompt = `You are a friendly native speaker having a real voice conversation with a language learner.

The learner has a secret goal: "${missionGoal}"

IMPORTANT RULES:
1. Speak ONLY in ${getLanguageName(targetLanguage)}
2. Stay 100% in character as ${npcRole}
3. Your name is ${npcName} and you are ${npcGender}
4. NEVER mention the learner's goal
5. Make conversation last at least 2-4 natural exchanges
6. Be natural, conversational, but keep responses short, and use simpler words and more common sentence structures. 
7. After 2-4 exchanges, gently help the language learner complete their mission.

Your character:
- Name: ${npcName}
- Role: ${npcRole}
- Gender: ${npcGender}
- Language: ${getLanguageName(targetLanguage)}
${contextSection}
Learner's latest message: "${userLatestMessage}"

Then, on a new line, write ONLY "MISSION_COMPLETE: true" if the learner has genuinely achieved the goal "${missionGoal}" through natural conversation, or "MISSION_COMPLETE: false" if not yet.

Format:
[Your SHORT response in ${getLanguageName(targetLanguage)}]
MISSION_COMPLETE: [true or false]`;

  const request: AIRequest = {
    task: 'npc-response',
    prompt,
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ]
  };

  logger.info('[AIService] Generating NPC response via router', { missionGoal, npcRole });

  const data = await routeAIRequest(request);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const fullResponse = data.candidates[0].content.parts[0].text;
  
  // Parse response and mission status
  const lines = fullResponse.split('\n');
  const missionLine = lines.find(line => line.includes('MISSION_COMPLETE:'));
  const missionCompleted = missionLine ? missionLine.includes('true') : false;
  
  const response = lines
    .filter(line => !line.includes('MISSION_COMPLETE:'))
    .join('\n')
    .trim();

  logger.info('[AIService] NPC response generated', { missionCompleted });

  return { response, missionCompleted };
};

/**
 * Check user sentence for errors (Helper Robot)
 */
export interface HelperRobotParams {
  userText: string;
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
  missionGoal: string;
  npcRole: string;
  conversationHistory?: Array<{ speaker: 'user' | 'npc'; text: string }>;
}

export interface HelperRobotDecision {
  shouldApprove: boolean;
  explanation?: string;
  correctedText?: string;
}

export const checkUserSentence = async (params: HelperRobotParams): Promise<HelperRobotDecision> => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait.');
  }

  const { userText, targetLanguage, motherLanguage, missionGoal, npcRole, conversationHistory } = params;

  const contextSection = conversationHistory && conversationHistory.length > 0 
    ? `\n\nCONVERSATION SO FAR:\n${conversationHistory.map(entry => 
        `${entry.speaker === 'user' ? 'User' : 'NPC'}: ${entry.text}`
      ).join('\n')}\n`
    : '';

  const prompt = `You are a person who checks the speech of his friend and corrects him if necessary. You are NOT part of the conversation — the learner (your friend who is trying to learn ${getLanguageName(targetLanguage)}) is speaking directly to the NPC named "${npcRole}", never to you.

Context:
- Target language: ${getLanguageName(targetLanguage)}
- Learner's native language: ${getLanguageName(motherLanguage)}
- Current mission/goal: ${missionGoal}${contextSection}

Important notes about the user's input:
- The text comes from voice recognition of spoken ${getLanguageName(targetLanguage)} and does not have punctuation, capitalization and ¿ ¡ ? ! . ,; which, therefore, must be ignored. Two correct sentences may be joined without pause. Do not worry about sentence order. Do not worry about politeness.

Your only job: decide if the sentence of the learner contains MAJOR errors that make it incomprehensible or seriously wrong in the context of talking to "${npcRole}". Be lenient, your friend is learning a new language.

Definitions:
- MAJOR error = completely wrong grammar/structure, wrong vocabulary, completely irrelevant to the current mission of the learner.
- Minor imperfections (slightly unnatural word order, non-native phrasing, small mistakes) are OK — approve them if the meaning is clear.

Learner's utterance to the NPC: "${userText}"

Respond in JSON format:
{
  "shouldApprove": true or false,
  "explanation": "Brief explanation in ${getLanguageName(motherLanguage)} (only if not approved)",
  "correctedText": "Corrected version (only if not approved)"
}`;

  const request: AIRequest = {
    task: 'helper-robot',
    prompt,
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 300,
    }
  };

  logger.info('[AIService] Checking user sentence via router', { userText });

  const data = await routeAIRequest(request);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const responseText = data.candidates[0].content.parts[0].text;
  
  // Try to extract JSON
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // If no JSON, assume approval
    logger.warn('[AIService] Helper robot response not in JSON format, assuming approval');
    return { shouldApprove: true };
  }

  const decision: HelperRobotDecision = JSON.parse(jsonMatch[0]);
  
  logger.info('[AIService] Helper robot decision', { shouldApprove: decision.shouldApprove });

  return decision;
};

/**
 * Translate text using AI
 */
export interface TranslationParams {
  sourceText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  motherLanguage?: SupportedLanguage;
  includeTransliteration?: boolean;
}

export interface TranslationResult {
  translation: string;
  transliteration?: string;
}

export const translateWithAI = async (params: TranslationParams): Promise<TranslationResult> => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait.');
  }

  const { sourceText, sourceLanguage, targetLanguage, motherLanguage, includeTransliteration } = params;

  let prompt = `Translate the following text from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}.

Text: "${sourceText}"

Provide ONLY the translation, nothing else.`;

  if (includeTransliteration && motherLanguage) {
    prompt += `\n\nAlso provide a transliteration in ${getLanguageName(motherLanguage)} script.

Return in JSON format:
{
  "translation": "translation here",
  "transliteration": "transliteration here"
}`;
  }

  const request: AIRequest = {
    task: 'translation',
    prompt,
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 512,
    }
  };

  logger.info('[AIService] Translating via router', { sourceLanguage, targetLanguage });

  const data = await routeAIRequest(request);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const responseText = data.candidates[0].content.parts[0].text;

  if (includeTransliteration) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    }
  }

  // Simple translation without transliteration
  return { translation: responseText.trim() };
};

/**
 * Extract common expressions from dialogue
 */
export interface ExpressionParams {
  dialogueText: string;
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
}

export interface Expression {
  original: string;
  translation: string;
  explanation: string;
}

export const extractExpressions = async (params: ExpressionParams): Promise<Expression[]> => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait.');
  }

  const { dialogueText, targetLanguage, motherLanguage } = params;

  const prompt = `Analyze this dialogue in ${getLanguageName(targetLanguage)} and extract 3-5 common expressions, idioms, or useful phrases that a learner should know.

Dialogue:
${dialogueText}

For each expression, provide:
1. The original expression in ${getLanguageName(targetLanguage)}
2. Translation in ${getLanguageName(motherLanguage)}
3. Brief explanation of when/how to use it

Return in JSON format:
[
  {
    "original": "expression in ${getLanguageName(targetLanguage)}",
    "translation": "translation in ${getLanguageName(motherLanguage)}",
    "explanation": "explanation in ${getLanguageName(motherLanguage)}"
  }
]`;

  const request: AIRequest = {
    task: 'expression-extraction',
    prompt,
    generationConfig: {
      temperature: 0.2,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 400,
    }
  };

  logger.info('[AIService] Extracting expressions via router', { targetLanguage });

  const data = await routeAIRequest(request);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const responseText = data.candidates[0].content.parts[0].text;
  
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('AI response not in valid JSON format');
  }

  const expressions: Expression[] = JSON.parse(jsonMatch[0]);
  
  logger.info('[AIService] Expressions extracted', { count: expressions.length });

  return expressions;
};

/**
 * Generate speech using TTS router
 * Routes to Google TTS or ElevenLabs based on configuration
 */
export const generateSpeech = async (
  text: string, 
  languageCode: SupportedLanguage, 
  gender: 'male' | 'female' = 'male',
  characterId: number | null = null
): Promise<HTMLAudioElement> => {
  console.log('🔊 AI Service: Generating speech via router');
  logger.info('Generating speech via router', { text, languageCode, gender, characterId });

  try {
    const task = characterId !== null ? 'tts-npc' : 'tts-turi';
    
    const request: TTSRequest = {
      task,
      text,
      languageCode,
      gender,
      characterId
    };
    
    const audioContent = await routeTTSRequest(request);
    
    // Convert base64 audio to blob and create audio element
    const audioBlob = base64ToBlob(audioContent, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    console.log('✅ AI Service: Successfully generated speech');
    logger.info('Speech generated successfully via router', { languageCode, textLength: text.length });
    
    return audio;
  } catch (error) {
    console.error('❌ AI Service: Failed to generate speech', error);
    logger.error('Speech generation failed', { error, text, languageCode });
    throw error;
  }
};

/**
 * Helper function to get full language name from code
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
  };
  
  return languageNames[code] || code;
}

/**
 * Helper function to convert base64 to blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

