/**
 * Centralized AI Configuration
 * 
 * This file controls ALL AI provider usage in the app:
 * - Which provider is used for which task
 * - Load balancing percentages between providers
 * - Model configurations
 * - TTS voice configurations (male/female)
 */

export type AIProvider = 'gemini' | 'deepseek' | 'groq';
export type TTSProvider = 'google' | 'elevenlabs';

export type AITask = 
  | 'dialogue-generation'      // Generate full dialogues with NPC
  | 'npc-response'             // Mission NPC responses
  | 'helper-robot'             // Sentence correction checking
  | 'word-explanation'         // Detailed word explanations
  | 'text-explanation'         // Grammar/phrase explanations
  | 'expression-extraction'    // Extract common expressions
  | 'translation'              // AI translation fallback
  | 'tts-npc'                  // NPC voice (character-specific)
  | 'tts-turi';                // Turi system voice (quiz, pronunciations)

/**
 * Provider Configuration
 * Each task can have multiple providers with percentage distribution
 */
export interface ProviderConfig {
  provider: AIProvider;
  percentage: number;  // 0-100, should sum to 100 across providers for a task
  model: string;       // Specific model to use with this provider
}

export interface TTSConfig {
  provider: TTSProvider;
  percentage: number;
  // ElevenLabs voice IDs - supports both single voice (legacy) and voice arrays for character-specific voices
  elevenLabsVoices?: {
    male: string | string[];
    female: string | string[];
  };
}

/**
 * Main AI Configuration
 * 
 * HOW TO USE:
 * 1. Set percentage distribution for each task (should sum to 100)
 * 2. Configure models for each provider
 * 3. For TTS, set ElevenLabs voice IDs for male/female
 * 4. The system will automatically load balance based on percentages
 */
export const AI_CONFIG: Record<AITask, ProviderConfig[] | TTSConfig[]> = {
  /**
   * DIALOGUE GENERATION (Full conversation creation)
   * Heavy task - Gemini best for structured JSON arrays
   */
  'dialogue-generation': [
    {
      provider: 'gemini',
      percentage: 70,  // Gemini best for JSON arrays
      model: 'gemini-2.5-flash-lite'
    },
    {
      provider: 'groq',
      percentage: 30,  // Groq as fallback
      model: 'llama-3.3-70b-versatile'
    }
  ],

  /**
   * NPC RESPONSES (Mission conversations)
   * Requires natural, conversational responses - Groq for maximum speed
   */
  'npc-response': [
    {
      provider: 'groq',
      percentage: 100,  // 100% Groq - fastest provider (~1s responses)
      model: 'llama-3.3-70b-versatile'
    }
  ],

  /**
   * HELPER ROBOT (Sentence correction)
   * Lightweight task - can use faster models
   */
  'helper-robot': [
    {
      provider: 'groq',
      percentage: 85,  // Groq is very fast and reliable
      model: 'llama-3.3-70b-versatile'
    },
    {
      provider: 'gemini',
      percentage: 15,  // Gemini as backup
      model: 'gemini-2.5-flash-lite'
    }
  ],

  /**
   * WORD EXPLANATION (Detailed explanations)
   * Quality is important here - Gemini best for structured JSON
   */
  'word-explanation': [
    {
      provider: 'gemini',
      percentage: 60,  // Gemini best for structured JSON output
      model: 'gemini-2.5-flash-lite'
    },
    {
      provider: 'groq',
      percentage: 40,  // Groq as fallback
      model: 'llama-3.3-70b-versatile'
    }
  ],

  /**
   * TEXT EXPLANATION (Grammar/phrase explanations)
   * Groq is primary (very fast, accurate, and free)
   */
  'text-explanation': [
    {
      provider: 'groq',
      percentage: 100,  // Groq as primary (user preference)
      model: 'llama-3.3-70b-versatile'
    }
  ],

  /**
   * EXPRESSION EXTRACTION
   * Needs good understanding of language patterns - Gemini best for JSON
   */
  'expression-extraction': [
    {
      provider: 'gemini',
      percentage: 70,  // Gemini best for structured extraction
      model: 'gemini-2.5-flash-lite'
    },
    {
      provider: 'groq',
      percentage: 30,  // Groq as fallback
      model: 'llama-3.3-70b-versatile'
    }
  ],

  /**
   * TRANSLATION (AI fallback when database translation missing)
   * Gemini is MUCH better at returning structured JSON for translations
   */
  'translation': [
    {
      provider: 'gemini',
      percentage: 70,  // Gemini BEST for JSON translations (rarely returns plain text)
      model: 'gemini-2.5-flash-lite'
    },
    {
      provider: 'groq',
      percentage: 30,  // Groq as fallback (sometimes returns plain text)
      model: 'llama-3.3-70b-versatile'
    }
  ],

  /**
   * TTS - NPC VOICES (Character-specific voices)
   * ElevenLabs provides much better quality for mission dialogues
   * Multiple voices per gender - each character gets their own unique voice
   */
  'tts-npc': [
    {
      provider: 'elevenlabs',
      percentage: 100,  // 100% ElevenLabs for mission dialogues - best quality
      // Voice pools from ElevenLabs - each character uses CHARACTER_VOICE_INDICES to select their voice
      elevenLabsVoices: {
        male: [
          '2EiwWnXFnvU5JabPnv8n',  // Male voice 1
          'CwhRBWXzGAHq8TQ4Fs17',  // Male voice 2
          'JBFqnCBsd6RMkjVDRZzb',  // Male voice 3
          'SOYHLrjzK2X1ezoPC6cr',  // Male voice 4
          'bIHbv24MWmeRgasZH58o',  // Male voice 5
          'iP95p4xoKVk53GoZ742B',  // Male voice 6
          'nPczCjzI2devNBz1zQrb',  // Male voice 7
          'pqHfZKP75CvOlQylNhV4'   // Male voice 8
        ],
        female: [
          'SAz9YHcvj6GT2YYXdXww',  // Female voice 1
          'EXAVITQu4vr4xnSDxMaL',  // Female voice 2
          'XrExE9yKIg1WjnnlVkGX',  // Female voice 3
          'cgSgspJ2msm6clMCkdW9',  // Female voice 4
          'pFZP5JQG7iQjIQuC4Bku'   // Female voice 5
        ]
      }
    } as TTSConfig
  ] as TTSConfig[],

  /**
   * TTS - TURI SYSTEM VOICE (Quiz, word pronunciation, etc.)
   * Can use lower quality since it's system voice
   */
  'tts-turi': [
    {
      provider: 'google',
      percentage: 80,  // Mostly Google TTS to save ElevenLabs quota
    } as TTSConfig,
    {
      provider: 'elevenlabs',
      percentage: 20,
      // For Turi system voice, use first voice from each pool
      elevenLabsVoices: {
        male: '2EiwWnXFnvU5JabPnv8n',      // Turi male voice
        female: 'SAz9YHcvj6GT2YYXdXww'     // Turi female voice
      }
    } as TTSConfig
  ] as TTSConfig[]
};

/**
 * Model fallback lists for each provider
 * If primary model fails, tries these in order
 */
export const MODEL_FALLBACKS: Record<AIProvider, string[]> = {
  gemini: [
    'gemini-2.5-flash-lite',    // Try lite first (fastest)
    'gemini-2.5-flash',          // Standard model
    'gemini-2.0-flash',          // Older stable
    'gemini-2.0-flash-lite',     // Older lite
    'gemini-2.0-flash-exp'       // Experimental (last resort)
  ],
  
  groq: [
    'llama-3.3-70b-versatile',   // Latest Llama (default)
    'llama-3.1-8b-instant',      // Very fast fallback
    'gemma2-9b-it'               // Lightweight fallback
  ],
  
  deepseek: [
    'deepseek-chat',             // Latest chat model
    'deepseek-coder'             // Alternative (good at structured tasks)
  ]
};

/**
 * API Endpoints for each provider
 * Netlify functions will proxy these
 */
export const PROVIDER_ENDPOINTS = {
  gemini: '/.netlify/functions/gemini-proxy',
  deepseek: '/.netlify/functions/deepseek-proxy',
  groq: '/.netlify/functions/groq-proxy',
  google_tts: '/.netlify/functions/gemini-tts',
  elevenlabs_tts: '/.netlify/functions/elevenlabs-tts'
};

/**
 * Get provider configuration for a specific task
 */
export function getTaskConfig(task: AITask): ProviderConfig[] | TTSConfig[] {
  return AI_CONFIG[task];
}

/**
 * Get a random provider based on percentage distribution
 */
export function selectProvider(task: AITask): ProviderConfig | TTSConfig {
  const configs = getTaskConfig(task);
  
  // Validate percentages sum to 100
  const totalPercentage = configs.reduce((sum, config) => sum + config.percentage, 0);
  if (totalPercentage !== 100) {
    console.warn(`Task "${task}" percentages sum to ${totalPercentage}, not 100. Using first provider.`);
    return configs[0];
  }
  
  // Select based on random weighted choice
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const config of configs) {
    cumulative += config.percentage;
    if (random <= cumulative) {
      return config;
    }
  }
  
  // Fallback to first provider
  return configs[0];
}

/**
 * Get fallback models for a provider
 */
export function getFallbackModels(provider: AIProvider): string[] {
  return MODEL_FALLBACKS[provider];
}

/**
 * Environment variable names for API keys
 * These should be set in Netlify environment variables
 */
export const ENV_VARS = {
  GOOGLE_GEMINI_API_KEY: 'GOOGLE_GEMINI_API_KEY',
  GOOGLE_TTS_API_KEY: 'GOOGLE_TTS_API_KEY',
  DEEPSEEK_API_KEY: 'DEEPSEEK_API_KEY',
  GROQ_API_KEY: 'GROQ_API_KEY',
  ELEVENLABS_API_KEY: 'ELEVENLABS_API_KEY'
};

