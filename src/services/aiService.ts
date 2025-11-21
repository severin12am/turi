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

  const targetLangName = getLanguageName(targetLanguage);
  const motherLangName = getLanguageName(motherLanguage);

  const prompt = `Explain this sentence structure in ${motherLangName} (2-3 sentences MAX):

${targetLangName}: "${phrase}"
${motherLangName}: "${translation}"

Cover: 1) sentence structure, 2) word order, 3) key grammar point.
BE BRIEF.`;

  const request: AIRequest = {
    task: 'text-explanation',
    prompt,
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 300,  // Reduced from 1000 to avoid MAX_TOKENS
    }
  };

  console.log(`📚 [AI Service] Generating structure explanation via router | Task: text-explanation`);
  logger.info('Generating text explanation via router', { phrase, targetLanguage, motherLanguage });

  const data = await routeAIRequest(request);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const explanation = data.candidates[0].content.parts[0].text;
  
  console.log(`✅ [AI Service] Structure explanation generated successfully via router`);
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
  const missionLine = lines.find((line: string) => line.includes('MISSION_COMPLETE:'));
  const missionCompleted = missionLine ? missionLine.includes('true') : false;
  
  const response = lines
    .filter((line: string) => !line.includes('MISSION_COMPLETE:'))
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

// OLD checkUserSentence and translateWithAI implementations removed - see new versions below with better logging

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
  const task = characterId !== null ? 'tts-npc' : 'tts-turi';
  
  console.log(`🔊 [AI Service] Generating speech via router | Task: ${task} | Gender: ${gender} | CharID: ${characterId || 'Turi'}`);
  logger.info('Generating speech via router', { text, languageCode, gender, characterId });

  try {
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
    
    console.log('✅ [AI Service] Successfully generated speech via router');
    logger.info('Speech generated successfully via router', { languageCode, textLength: text.length });
    
    return audio;
  } catch (error) {
    console.error('❌ [AI Service] Failed to generate speech via router', error);
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

/**
 * Generate transliteration only (via router)
 */
export const generateTransliteration = async (
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<string> => {
  console.log(`🔤 [AI Service] Generating transliteration via router | ${sourceLanguage} → ${targetLanguage}`);
  
  const result = await translateWithAI({
    sourceText: text,
    sourceLanguage,
    targetLanguage: sourceLanguage, // Same language for transliteration only
    motherLanguage: targetLanguage,
    includeTransliteration: true
  });

  return result.transliteration || '';
};

// ============================================================================
// EXPRESSION EXTRACTION (Router-based)
// ============================================================================

export interface ExtractedExpression {
  target: string;
  mother: string;
}

export interface ExtractExpressionsParams {
  dialogueText: string;
  targetLanguage: SupportedLanguage;
  motherLanguage: SupportedLanguage;
}

/**
 * Extract key expressions from dialogue (via router)
 */
export const extractExpressionsFromDialogue = async (
  params: ExtractExpressionsParams
): Promise<ExtractedExpression[]> => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please wait before requesting another extraction.');
  }

  const { dialogueText, targetLanguage, motherLanguage } = params;
  
  const targetLangName = getLanguageName(targetLanguage);
  const motherLangName = getLanguageName(motherLanguage);

  const prompt = `You are a language learning assistant. Extract 5-8 of the most useful common expressions from this dialogue in ${targetLangName}.

Dialogue:
${dialogueText}

Rules:
1. Extract COMPLETE expressions and useful phrases (not just single words)
2. Focus on phrases that are reusable in other contexts
3. Include greetings, common questions, polite expressions, and idiomatic phrases
4. Each expression should be 2-7 words long

Return a JSON object with an array "expressions":
{
  "expressions": [
    { "target": "expression in ${targetLangName}", "mother": "translation in ${motherLangName}" }
  ]
}

Extract 5-8 expressions. Return ONLY the JSON object, no other text.`;

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

  console.log(`📚 [AI Service] Extracting expressions via router | Task: expression-extraction`);
  logger.info('Extracting expressions via router', { targetLanguage, motherLanguage, textLength: dialogueText.length });

  const data = await routeAIRequest(request);

  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const generatedText = data.candidates[0].content.parts[0].text;
  
  // Parse JSON response
  const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
  const result = JSON.parse(cleanedText);

  if (!result.expressions || !Array.isArray(result.expressions)) {
    throw new Error('Invalid expression extraction response format');
  }

  const expressions: ExtractedExpression[] = result.expressions.filter(
    (expr: any) => expr.target && expr.mother
  );

  console.log(`✅ [AI Service] Extracted ${expressions.length} expressions via router`);
  logger.info('Expressions extracted successfully', { count: expressions.length });

  return expressions;
};

export interface HelperRobotDecision {
  decision: 'No errors' | 'Incorrect';
  explanation?: string;
  correctedSentence?: string;
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
 * Helper robot checks user sentence (via router)
 */
export const checkUserSentence = async (params: HelperRobotCheckParams): Promise<HelperRobotDecision> => {
  const { userText, targetLanguage, motherLanguage, missionGoal, npcRole, conversationHistory } = params;

  const contextSection = conversationHistory && conversationHistory.length > 0 
    ? `\n\nCONVERSATION SO FAR:\n${conversationHistory.map(entry => 
        `${entry.speaker === 'user' ? 'User' : 'NPC'}: ${entry.text}`
      ).join('\n')}\n`
    : '';

  const prompt = `You are a person who checks the speech of his friend and corrects him if necessary. You are NOT part of the conversation — the learner (your friend who is trying to learn ${targetLanguage} )  is speaking directly to the NPC named "${npcRole}", never to you.

  Context:
  - Target language: ${targetLanguage}
  - Learner's native language: ${motherLanguage}
  - Current mission/goal: ${missionGoal}${contextSection}
  
  Important notes about the user's input:
  - The text comes from voice recognition of spoken ${targetLanguage} and doesnot have punctuation, capitalization and  ¿ ¡ ? ! . ,; which, therefore, must be ignored. Two correct sentences may be joined without pause. Do not worry about sentence order. Do not worry about politeness.
  
  Your only job: decide if the sentence of the learner contains MAJOR errors that make it incomprehensible or seriously wrong in the context of talking to "${npcRole}". Be lenient, your friend is learning a new language.
  
  Definitions:
  - MAJOR error = completely wrong grammar/structure, wrong vocabulary, completely irrelevant to the current mission of the learner.
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

  const request: AIRequest = {
    task: 'helper-robot',
    prompt,
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 512,
    }
  };

  console.log(`🤖 [AI Service] Checking user sentence via router | Task: helper-robot`);
  logger.info('Checking user sentence via router', { userText, targetLanguage });

  const data = await routeAIRequest(request);

  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const textResponse = data.candidates[0].content.parts[0].text;

  // Parse JSON response
  const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const decision: HelperRobotDecision = JSON.parse(jsonMatch[0]);

  if (decision.decision !== 'No errors' && decision.decision !== 'Incorrect') {
    throw new Error('Invalid decision format');
  }

  if (decision.decision === 'Incorrect' && (!decision.explanation || !decision.correctedSentence)) {
    throw new Error('Missing explanation or corrected sentence');
  }

  console.log(`✅ [AI Service] Sentence check completed via router | Decision: ${decision.decision}`);
  logger.info('Sentence check completed', { decision: decision.decision });

  return decision;
};

/**
 * Helper robot generates a suggestion (via router)
 */
export const generateHelpSuggestion = async (params: Omit<HelperRobotCheckParams, 'userText'>): Promise<string> => {
  const { targetLanguage, motherLanguage, missionGoal, npcRole } = params;

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

  const request: AIRequest = {
    task: 'helper-robot',
    prompt,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 256,
    }
  };

  console.log(`💡 [AI Service] Generating help suggestion via router | Task: helper-robot`);
  logger.info('Generating help suggestion via router', { missionGoal, targetLanguage });

  const data = await routeAIRequest(request);

  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const suggestion = data.candidates[0].content.parts[0].text.trim();

  console.log(`✅ [AI Service] Help suggestion generated via router`);
  logger.info('Help suggestion generated', { suggestion });

  return suggestion;
};

// ============================================================================
// TRANSLATION & TRANSLITERATION (Router-based)
// ============================================================================

export interface TranslationRequest {
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

/**
 * Translate text using AI router
 */
export const translateWithAI = async (request: TranslationRequest): Promise<TranslationResult> => {
  const { sourceText, sourceLanguage, targetLanguage, motherLanguage, includeTransliteration = true } = request;

  const sourceLangName = getLanguageName(sourceLanguage);
  const targetLangName = getLanguageName(targetLanguage);
  const motherLangName = motherLanguage ? getLanguageName(motherLanguage) : sourceLangName;

  const isTransliterationOnly = sourceLanguage === targetLanguage;

  let prompt;
  
  if (isTransliterationOnly && includeTransliteration) {
    prompt = `Transliterate the following ${sourceLangName} text into ${motherLangName} script.

Text: "${sourceText}"

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
    prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.

Text: "${sourceText}"

Return a JSON object with:
- "translation": the translated text in ${targetLangName}`;

    if (includeTransliteration) {
      prompt += `
- "transliteration": the ORIGINAL ${sourceLangName} text written phonetically using ${motherLangName} alphabet/script (lowercase, no punctuation)`;
    }

    prompt += `

Example format:
{
  "translation": "translated text here",
  "transliteration": "phonetic transliteration of the original ${sourceLangName} text"
}

Be accurate and natural. For transliteration, approximate the ORIGINAL ${sourceLangName} sounds (NOT the translation) using the ${motherLangName} writing system.`;
  }

  const aiRequest: AIRequest = {
    task: 'translation',
    prompt,
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 200,  // Increased to account for Gemini 2.5's thinking tokens
    }
  };

  console.log(`🌐 [AI Service] Translating via router | Task: translation | ${sourceLangName} → ${targetLangName}`);
  logger.info('Translating via router', { sourceLanguage, targetLanguage, textLength: sourceText.length });

  const data = await routeAIRequest(aiRequest);

  // Router now validates everything - we just need basic safety checks
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response generated from AI');
  }

  const generatedText = data.candidates[0].content.parts[0].text;

  // Parse JSON response
  const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
  const result = JSON.parse(cleanedText);

  console.log(`✅ [AI Service] Translation completed via router`);
  logger.info('Translation successful', { hasTransliteration: !!result.transliteration });

  return {
    translation: result.translation,
    transliteration: result.transliteration
  };
};
