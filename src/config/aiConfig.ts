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
  // ElevenLabs voice IDs (you'll need to set these from your ElevenLabs account)
  elevenLabsVoices?: {
    male: string;
    female: string;
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
   * Requires natural, conversational responses - primarily Groq for speed
   */
  'npc-response': [
    {
      provider: 'groq',
      percentage: 75,  // Increased - Groq is fast and reliable
      model: 'llama-3.3-70b-versatile'
    },
    {
      provider: 'gemini',
      percentage: 25,  // Gemini as backup
      model: 'gemini-2.5-flash-lite'
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
   * ElevenLabs provides better quality
   */
  'tts-npc': [
    {
      provider: 'elevenlabs',
      percentage: 60,  // 60% ElevenLabs for better quality
      // Get these voice IDs from your ElevenLabs dashboard
      // https://elevenlabs.io/app/voice-library
      elevenLabsVoices: {
        male: '21m00Tcm4TlvDq8ikWAM',      // Default male voice
        female: 'EXAVITQu4vr4xnSDxMaL'     // Default female voice
      }
    } as TTSConfig,
    {
      provider: 'google',
      percentage: 40,  // 40% Google TTS (fallback)
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
      elevenLabsVoices: {
        male: '21m00Tcm4TlvDq8ikWAM',      // Turi voice (neutral)
        female: 'EXAVITQu4vr4xnSDxMaL'
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

