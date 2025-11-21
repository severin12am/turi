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
   * Heavy task - distributing load recommended
   */
  'dialogue-generation': [
    {
      provider: 'gemini',
      percentage: 50,  // 50% Gemini (free tier)
      model: 'gemini-2.5-flash'
    },
    {
      provider: 'groq',
      percentage: 30,  // 30% Groq (fast and free)
      model: 'mixtral-8x7b-32768'  // or 'llama2-70b-4096'
    },
    {
      provider: 'deepseek',
      percentage: 20,  // 20% Deepseek (good quality)
      model: 'deepseek-chat'
    }
  ],

  /**
   * NPC RESPONSES (Mission conversations)
   * Requires natural, conversational responses
   */
  'npc-response': [
    {
      provider: 'groq',
      percentage: 60,  // Groq is fast for real-time conversations
      model: 'mixtral-8x7b-32768'
    },
    {
      provider: 'gemini',
      percentage: 30,
      model: 'gemini-2.5-flash'
    },
    {
      provider: 'deepseek',
      percentage: 10,
      model: 'deepseek-chat'
    }
  ],

  /**
   * HELPER ROBOT (Sentence correction)
   * Lightweight task - can use faster models
   */
  'helper-robot': [
    {
      provider: 'groq',
      percentage: 70,  // Groq is very fast for this
      model: 'mixtral-8x7b-32768'
    },
    {
      provider: 'deepseek',
      percentage: 20,
      model: 'deepseek-chat'
    },
    {
      provider: 'gemini',
      percentage: 10,
      model: 'gemini-2.5-flash-lite'  // Fast model for quick checks
    }
  ],

  /**
   * WORD EXPLANATION (Detailed explanations)
   * Quality is important here
   */
  'word-explanation': [
    {
      provider: 'gemini',
      percentage: 40,  // Gemini good for structured output
      model: 'gemini-2.5-flash'
    },
    {
      provider: 'deepseek',
      percentage: 40,  // Deepseek is good at explanations
      model: 'deepseek-chat'
    },
    {
      provider: 'groq',
      percentage: 20,
      model: 'mixtral-8x7b-32768'
    }
  ],

  /**
   * TEXT EXPLANATION (Grammar/phrase explanations)
   * Deepseek is better for structured explanations
   */
  'text-explanation': [
    {
      provider: 'deepseek',
      percentage: 60,  // Prioritize Deepseek for better explanations
      model: 'deepseek-chat'
    },
    {
      provider: 'groq',
      percentage: 30,
      model: 'mixtral-8x7b-32768'
    },
    {
      provider: 'gemini',
      percentage: 10,  // Gemini as fallback only
      model: 'gemini-2.5-flash'
    }
  ],

  /**
   * EXPRESSION EXTRACTION
   * Needs good understanding of language patterns
   */
  'expression-extraction': [
    {
      provider: 'gemini',
      percentage: 50,
      model: 'gemini-2.5-flash'
    },
    {
      provider: 'deepseek',
      percentage: 30,
      model: 'deepseek-chat'
    },
    {
      provider: 'groq',
      percentage: 20,
      model: 'mixtral-8x7b-32768'
    }
  ],

  /**
   * TRANSLATION (AI fallback when database translation missing)
   * Accuracy is critical
   */
  'translation': [
    {
      provider: 'gemini',
      percentage: 50,
      model: 'gemini-2.5-flash'
    },
    {
      provider: 'deepseek',
      percentage: 30,
      model: 'deepseek-chat'
    },
    {
      provider: 'groq',
      percentage: 20,
      model: 'mixtral-8x7b-32768'
    }
  ],

  /**
   * TTS - NPC VOICES (Character-specific voices)
   * ElevenLabs provides better quality but has limits
   */
  'tts-npc': [
    {
      provider: 'elevenlabs',
      percentage: 60,  // 60% ElevenLabs for better quality
      // Get these voice IDs from your ElevenLabs dashboard
      // https://elevenlabs.io/app/voice-library
      elevenLabsVoices: {
        male: '21m00Tcm4TlvDq8ikWAM',      // Default male voice (you can change)
        female: 'EXAVITQu4vr4xnSDxMaL'     // Default female voice (you can change)
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
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro'
  ],
  
  groq: [
    'mixtral-8x7b-32768',       // Fast and capable
    'llama2-70b-4096',           // Powerful but slower
    'llama-3.3-70b-versatile',   // Latest Llama
    'gemma2-9b-it',              // Lightweight
    'llama-3.1-8b-instant'       // Very fast
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

