/**
 * AI Router Service
 * 
 * Routes AI requests to the appropriate provider based on aiConfig.ts
 * Handles load balancing, fallbacks, and error recovery
 */

import { logger } from './logger';
import { 
  AITask, 
  ProviderConfig, 
  TTSConfig,
  selectProvider, 
  getFallbackModels,
  getTaskConfig,
  PROVIDER_ENDPOINTS,
  AIProvider
} from '../config/aiConfig';

export interface AIRequest {
  task: AITask;
  prompt: string;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  safetySettings?: any[];
}

export interface TTSRequest {
  task: 'tts-npc' | 'tts-turi';
  text: string;
  languageCode: string;
  gender: 'male' | 'female';
  characterId?: number | null;
  voiceName?: string;  // For Google TTS
}

/**
 * Main AI request router
 * Automatically selects provider based on task configuration and percentage distribution
 */
export async function routeAIRequest(request: AIRequest): Promise<any> {
  const { task, prompt, generationConfig, safetySettings } = request;
  
  // Select provider based on percentage distribution
  const selectedConfig = selectProvider(task) as ProviderConfig;
  
  // ENHANCED LOGGING - Always visible
  console.log(`🤖 [AI Router] Task: ${task} | Provider: ${selectedConfig.provider.toUpperCase()} | Model: ${selectedConfig.model}`);
  
  logger.info('[AIRouter] Selected provider', {
    task,
    provider: selectedConfig.provider,
    model: selectedConfig.model
  });
  
  // Try primary provider
  try {
    const result = await callAIProvider(
      selectedConfig.provider,
      selectedConfig.model,
      prompt,
      generationConfig,
      safetySettings
    );
    console.log(`✅ [AI Router] Success with ${selectedConfig.provider.toUpperCase()}`);
    return result;
  } catch (error) {
    console.error(`❌ [AI Router] ${selectedConfig.provider.toUpperCase()} failed, trying fallbacks...`);
    logger.error('[AIRouter] Primary provider failed', { 
      provider: selectedConfig.provider, 
      error 
    });
    
    // Try fallback models for the same provider
    const fallbackModels = getFallbackModels(selectedConfig.provider);
    for (const fallbackModel of fallbackModels) {
      if (fallbackModel === selectedConfig.model) continue; // Skip already tried model
      
      try {
        logger.info('[AIRouter] Trying fallback model', { 
          provider: selectedConfig.provider, 
          model: fallbackModel 
        });
        
        const result = await callAIProvider(
          selectedConfig.provider,
          fallbackModel,
          prompt,
          generationConfig,
          safetySettings
        );
        return result;
      } catch (fallbackError) {
        logger.error('[AIRouter] Fallback model failed', { 
          model: fallbackModel, 
          error: fallbackError 
        });
        continue;
      }
    }
    
    // All models for primary provider failed - try OTHER providers for this task
    console.log(`🔄 [AI Router] All ${selectedConfig.provider.toUpperCase()} models failed, trying other providers...`);
    const allTaskProviders = getTaskConfig(task) as ProviderConfig[];
    
    for (const alternativeConfig of allTaskProviders) {
      // Skip the provider we already tried
      if (alternativeConfig.provider === selectedConfig.provider) continue;
      
      try {
        console.log(`🔄 [AI Router] Trying alternative: ${alternativeConfig.provider.toUpperCase()} | Model: ${alternativeConfig.model}`);
        logger.info('[AIRouter] Trying alternative provider', { 
          provider: alternativeConfig.provider, 
          model: alternativeConfig.model 
        });
        
        const result = await callAIProvider(
          alternativeConfig.provider,
          alternativeConfig.model,
          prompt,
          generationConfig,
          safetySettings
        );
        console.log(`✅ [AI Router] Success with alternative ${alternativeConfig.provider.toUpperCase()}`);
        return result;
      } catch (alternativeError) {
        console.error(`❌ [AI Router] Alternative ${alternativeConfig.provider.toUpperCase()} also failed`);
        logger.error('[AIRouter] Alternative provider failed', { 
          provider: alternativeConfig.provider, 
          error: alternativeError 
        });
        continue;
      }
    }
    
    // If all providers failed, throw error
    throw new Error(`All providers failed for task: ${task}`);
  }
}

/**
 * Call a specific AI provider
 */
async function callAIProvider(
  provider: AIProvider,
  model: string,
  prompt: string,
  generationConfig?: any,
  safetySettings?: any[]
): Promise<any> {
  const endpoint = PROVIDER_ENDPOINTS[provider];
  
  // Build request body based on provider
  const requestBody = buildProviderRequestBody(
    provider,
    model,
    prompt,
    generationConfig,
    safetySettings
  );
  
  logger.info('[AIRouter] Calling provider', { provider, model, endpoint });
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[AIRouter] Provider API error', {
      provider,
      status: response.status,
      error: errorText
    });
    throw new Error(`${provider} API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Normalize response format (different providers return different structures)
  return normalizeProviderResponse(provider, data);
}

/**
 * Build request body for specific provider
 * Each provider has different API format
 */
function buildProviderRequestBody(
  provider: AIProvider,
  model: string,
  prompt: string,
  generationConfig?: any,
  safetySettings?: any[]
): any {
  switch (provider) {
    case 'gemini':
      return {
        modelName: model,
        requestBody: {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: generationConfig || {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: safetySettings || []
        }
      };
    
    case 'deepseek':
      return {
        model: model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: generationConfig?.temperature || 0.7,
        max_tokens: generationConfig?.maxOutputTokens || 1024,
        top_p: generationConfig?.topP || 0.95
      };
    
    case 'groq':
      return {
        model: model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: generationConfig?.temperature || 0.7,
        max_tokens: generationConfig?.maxOutputTokens || 1024,
        top_p: generationConfig?.topP || 0.95
      };
    
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Normalize response from different providers to a common format
 */
function normalizeProviderResponse(provider: AIProvider, data: any): any {
  switch (provider) {
    case 'gemini':
      // Gemini returns: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
      return data; // Already in expected format for existing code
    
    case 'deepseek':
    case 'groq':
      // OpenAI-compatible format: { choices: [{ message: { content: "..." } }] }
      // Convert to Gemini-like format for compatibility
      if (data.choices && data.choices[0]?.message?.content) {
        return {
          candidates: [{
            content: {
              parts: [{
                text: data.choices[0].message.content
              }],
              role: 'model'
            },
            finishReason: 'STOP',
            index: 0
          }]
        };
      }
      return data;
    
    default:
      return data;
  }
}

/**
 * Route TTS requests
 */
export async function routeTTSRequest(request: TTSRequest): Promise<string> {
  const { task, text, languageCode, gender, characterId, voiceName } = request;
  
  // Select TTS provider based on percentage distribution
  const selectedConfig = selectProvider(task) as TTSConfig;
  
  // ENHANCED LOGGING - Always visible
  console.log(`🔊 [TTS Router] Task: ${task} | Provider: ${selectedConfig.provider.toUpperCase()} | Gender: ${gender} | CharID: ${characterId || 'Turi'}`);
  
  logger.info('[AIRouter] Selected TTS provider', {
    task,
    provider: selectedConfig.provider,
    gender
  });
  
  try {
    if (selectedConfig.provider === 'elevenlabs') {
      const result = await callElevenLabsTTS(text, gender, selectedConfig, languageCode);
      console.log(`✅ [TTS Router] Success with ELEVENLABS`);
      return result;
    } else {
      const result = await callGoogleTTS(text, languageCode, gender, voiceName, characterId);
      console.log(`✅ [TTS Router] Success with GOOGLE TTS`);
      return result;
    }
  } catch (error) {
    console.error(`❌ [TTS Router] ${selectedConfig.provider.toUpperCase()} failed, trying fallback...`);
    logger.error('[AIRouter] TTS provider failed, trying fallback', { error });
    
    // Fallback to Google TTS if ElevenLabs fails
    if (selectedConfig.provider === 'elevenlabs') {
      console.log(`🔄 [TTS Router] Falling back to GOOGLE TTS`);
      logger.info('[AIRouter] Falling back to Google TTS');
      return await callGoogleTTS(text, languageCode, gender, voiceName, characterId);
    }
    
    throw error;
  }
}

/**
 * Call ElevenLabs TTS
 */
async function callElevenLabsTTS(
  text: string,
  gender: 'male' | 'female',
  config: TTSConfig,
  languageCode: string
): Promise<string> {
  const voiceId = gender === 'male' 
    ? config.elevenLabsVoices?.male 
    : config.elevenLabsVoices?.female;
  
  if (!voiceId) {
    throw new Error('ElevenLabs voice ID not configured');
  }
  
  const response = await fetch(PROVIDER_ENDPOINTS.elevenlabs_tts, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId,
      languageCode
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.audioContent; // Base64 encoded audio
}

/**
 * Call Google Cloud TTS
 */
async function callGoogleTTS(
  text: string,
  languageCode: string,
  gender: 'male' | 'female',
  voiceName?: string,
  characterId?: number | null
): Promise<string> {
  // Import voice assignment functions dynamically
  const { getCharacterVoice, getTuriVoice, getLanguageCode } = await import('../constants/voiceAssignments');
  
  // Get the appropriate voice
  let selectedVoiceName: string;
  if (voiceName) {
    selectedVoiceName = voiceName;
  } else if (characterId !== null && characterId !== undefined && characterId >= 1 && characterId <= 30) {
    selectedVoiceName = getCharacterVoice(characterId, gender, languageCode as any);
  } else {
    selectedVoiceName = getTuriVoice(languageCode as any);
  }
  
  const langCode = getLanguageCode(languageCode as any);
  
  const requestBody = {
    input: { text },
    voice: {
      languageCode: langCode,
      name: selectedVoiceName
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.85,
      pitch: 0
    }
  };
  
  const response = await fetch(PROVIDER_ENDPOINTS.google_tts, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.audioContent; // Base64 encoded audio
}

