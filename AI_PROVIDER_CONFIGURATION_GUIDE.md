# AI Provider Configuration Guide

This guide explains how to configure and manage multiple AI providers (Gemini, Deepseek, Groq, ElevenLabs) in your Turi language learning app.

## 🎯 Overview

The app uses a **centralized AI configuration system** that allows you to:
- Control which AI provider is used for each task
- Set percentage distribution between providers (load balancing)
- Configure specific models for each provider
- Manage TTS providers (Google TTS and ElevenLabs) with male/female voice differentiation

## 📁 Key Files

### 1. `src/config/aiConfig.ts`
**THE SINGLE SOURCE OF TRUTH** for all AI configuration.

This file contains:
- Provider percentages for each AI task
- Model selections for each provider
- TTS voice configurations
- Fallback model lists

### 2. `src/services/aiRouter.ts`
Routes AI requests to the appropriate provider based on your configuration.

### 3. `src/services/aiService.ts`
High-level API that your app uses to make AI requests (doesn't need to know which provider is used).

### 4. Netlify Functions (in `netlify/functions/`)
- `gemini-proxy.js` - Routes to Google Gemini
- `deepseek-proxy.js` - Routes to Deepseek
- `groq-proxy.js` - Routes to Groq
- `gemini-tts.js` - Google Cloud TTS
- `elevenlabs-tts.js` - ElevenLabs TTS

## 🔧 Configuration

### Step 1: Set API Keys in Netlify

Go to your Netlify project → Site settings → Environment variables, and add:

```bash
GOOGLE_GEMINI_API_KEY=your_gemini_key_here
GOOGLE_TTS_API_KEY=your_google_tts_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
GROQ_API_KEY=your_groq_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

**How to get these keys:**

1. **Gemini**: https://makersuite.google.com/app/apikey
2. **Google TTS**: https://console.cloud.google.com/ (Enable Text-to-Speech API)
3. **Deepseek**: https://platform.deepseek.com/
4. **Groq**: https://console.groq.com/
5. **ElevenLabs**: https://elevenlabs.io/app/settings/api-keys

### Step 2: Configure Provider Percentages

Open `src/config/aiConfig.ts` and adjust the percentages for each task:

```typescript
'dialogue-generation': [
  {
    provider: 'gemini',
    percentage: 50,  // 50% of dialogue requests go to Gemini
    model: 'gemini-1.5-flash'
  },
  {
    provider: 'groq',
    percentage: 30,  // 30% go to Groq
    model: 'mixtral-8x7b-32768'
  },
  {
    provider: 'deepseek',
    percentage: 20,  // 20% go to Deepseek
    model: 'deepseek-chat'
  }
],
```

**Important:** Percentages for each task MUST sum to 100.

### Step 3: Configure ElevenLabs Voices

In `src/config/aiConfig.ts`, under TTS configuration, set your ElevenLabs voice IDs:

```typescript
'tts-npc': [
  {
    provider: 'elevenlabs',
    percentage: 60,
    elevenLabsVoices: {
      male: '21m00Tcm4TlvDq8ikWAM',      // Your male voice ID
      female: 'EXAVITQu4vr4xnSDxMaL'     // Your female voice ID
    }
  } as TTSConfig,
  // ...
]
```

**To get voice IDs:**
1. Go to https://elevenlabs.io/app/voice-library
2. Choose or clone voices you want
3. Copy the voice IDs from your Voice Library

## 📊 AI Tasks Explained

| Task | Description | Recommended Provider |
|------|-------------|---------------------|
| `dialogue-generation` | Full NPC dialogues with translations | Balanced (heavy task) |
| `npc-response` | Real-time mission NPC responses | Groq (fast) |
| `helper-robot` | Sentence correction checking | Groq (fast, simple) |
| `word-explanation` | Detailed word explanations | Gemini/Deepseek (quality) |
| `text-explanation` | Grammar/phrase explanations | Gemini/Deepseek (quality) |
| `expression-extraction` | Extract common expressions | Gemini (good at patterns) |
| `translation` | AI translation fallback | Balanced (accuracy important) |
| `tts-npc` | Character voices | ElevenLabs (quality) |
| `tts-turi` | System voice (quiz, etc.) | Google TTS (save quota) |

## 🎛️ Configuration Strategies

### Strategy 1: Preserve Gemini Free Tier
If you want to save your Gemini quota:

```typescript
'dialogue-generation': [
  { provider: 'groq', percentage: 60, model: 'mixtral-8x7b-32768' },
  { provider: 'deepseek', percentage: 30, model: 'deepseek-chat' },
  { provider: 'gemini', percentage: 10, model: 'gemini-1.5-flash' }
],
```

### Strategy 2: Maximize Speed
If you want fastest responses:

```typescript
'npc-response': [
  { provider: 'groq', percentage: 100, model: 'llama-3.1-8b-instant' }
],
```

### Strategy 3: Maximize Quality
If you want best quality responses:

```typescript
'word-explanation': [
  { provider: 'gemini', percentage: 50, model: 'gemini-1.5-pro' },
  { provider: 'deepseek', percentage: 50, model: 'deepseek-chat' }
],
```

### Strategy 4: Balanced (Default)
Current configuration distributes load across all providers while preserving Gemini quota.

## 🔄 How Load Balancing Works

When your app makes an AI request:

1. **Router selects provider** based on random weighted choice (according to percentages)
2. **Tries primary model** for that provider
3. **If it fails**, tries fallback models for the same provider
4. **If all fail**, throws error

Example: If dialogue-generation has 50% Gemini, 30% Groq, 20% Deepseek:
- 50% of requests will try Gemini first
- 30% will try Groq first
- 20% will try Deepseek first

## 🎯 ElevenLabs Voice Configuration

### Character Voices (tts-npc)
Used for: NPC dialogues in scenarios and missions

```typescript
'tts-npc': [
  {
    provider: 'elevenlabs',
    percentage: 60,  // 60% use ElevenLabs (better quality)
    elevenLabsVoices: {
      male: 'YOUR_MALE_VOICE_ID',
      female: 'YOUR_FEMALE_VOICE_ID'
    }
  },
  {
    provider: 'google',
    percentage: 40   // 40% use Google TTS (fallback)
  }
]
```

The system automatically selects male/female voice based on character gender.

### System Voices (tts-turi)
Used for: Quiz questions, word pronunciations, system messages

```typescript
'tts-turi': [
  {
    provider: 'google',
    percentage: 80  // Use Google TTS mostly to save ElevenLabs quota
  },
  {
    provider: 'elevenlabs',
    percentage: 20,
    elevenLabsVoices: {
      male: 'YOUR_NEUTRAL_VOICE_ID',
      female: 'YOUR_NEUTRAL_VOICE_ID'
    }
  }
]
```

## 🧪 Testing Your Configuration

After configuring:

1. **Deploy to Netlify** (with environment variables set)
2. **Test each AI feature:**
   - Generate a dialogue (dialogue-generation)
   - Talk to mission NPC (npc-response)
   - Get word explanation (word-explanation)
   - Listen to NPC speech (tts-npc)
3. **Check browser console** for logs like:
   ```
   [AIRouter] Selected provider: groq, model: mixtral-8x7b-32768
   ```

## 📈 Monitoring Usage

Check your provider dashboards:

- **Gemini**: https://makersuite.google.com/app/apikey (quota info)
- **Groq**: https://console.groq.com/ (usage stats)
- **Deepseek**: https://platform.deepseek.com/ (billing/usage)
- **ElevenLabs**: https://elevenlabs.io/app/usage (character count)

## 🚨 Troubleshooting

### Provider keeps failing
1. Check API key is set correctly in Netlify
2. Check model name is correct (some models may not be available)
3. Check API quota/limits on provider dashboard

### "All providers failed" error
- All configured providers are unavailable/quota exceeded
- Check provider dashboards
- Adjust percentages to use working providers

### ElevenLabs not working
- Check API key
- Verify voice IDs are correct
- Check character quota (ElevenLabs free tier: 10k chars/month)

### Wrong voice gender
- Check character gender is set correctly in database
- Verify male/female voice IDs in config

## 🎨 Customization Examples

### Example 1: Only use Groq (fastest, free)
```typescript
// Set ALL tasks to 100% Groq
'dialogue-generation': [
  { provider: 'groq', percentage: 100, model: 'mixtral-8x7b-32768' }
],
'npc-response': [
  { provider: 'groq', percentage: 100, model: 'mixtral-8x7b-32768' }
],
// ... repeat for all tasks
```

### Example 2: Only use Google TTS (no ElevenLabs)
```typescript
'tts-npc': [
  { provider: 'google', percentage: 100 }
],
'tts-turi': [
  { provider: 'google', percentage: 100 }
]
```

### Example 3: Premium quality (use best models)
```typescript
'dialogue-generation': [
  { provider: 'gemini', percentage: 100, model: 'gemini-1.5-pro' }
],
'tts-npc': [
  {
    provider: 'elevenlabs',
    percentage: 100,
    elevenLabsVoices: {
      male: 'YOUR_BEST_MALE_VOICE',
      female: 'YOUR_BEST_FEMALE_VOICE'
    }
  }
]
```

## 📝 Best Practices

1. **Start conservative** - Use free tier limits, test gradually
2. **Monitor costs** - Check usage dashboards regularly
3. **Balance quality vs. cost** - Use premium providers for important tasks only
4. **Keep fallbacks** - Don't set any provider to 100% unless testing
5. **Test after changes** - Always test in development before deploying
6. **Log everything** - Check browser/Netlify logs to see which provider was used

## 🆘 Support

If you encounter issues:
1. Check browser console for error messages
2. Check Netlify function logs
3. Verify all environment variables are set
4. Test API keys directly on provider websites

## 📚 Additional Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Deepseek API Docs](https://platform.deepseek.com/docs)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Google Cloud TTS Docs](https://cloud.google.com/text-to-speech/docs)

