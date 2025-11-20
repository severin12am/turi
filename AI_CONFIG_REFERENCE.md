# AI Configuration Reference

## 📍 Where to Configure Everything

**ONE FILE TO RULE THEM ALL:** `src/config/aiConfig.ts`

## 🎛️ Quick Reference: What to Change

### Change Provider Percentages
Location: `src/config/aiConfig.ts` → `AI_CONFIG` object

```typescript
export const AI_CONFIG: Record<AITask, ProviderConfig[] | TTSConfig[]> = {
  'dialogue-generation': [
    { provider: 'gemini', percentage: 50, model: 'gemini-1.5-flash' },  // ← Change these
    { provider: 'groq', percentage: 30, model: 'mixtral-8x7b-32768' },  // ← numbers
    { provider: 'deepseek', percentage: 20, model: 'deepseek-chat' }    // ← here
  ],
  // ... more tasks
}
```

### Change Models
Same location, change the `model` field:

```typescript
{ provider: 'gemini', percentage: 50, model: 'gemini-1.5-flash' }  // ← Change this
                                              ↓
{ provider: 'gemini', percentage: 50, model: 'gemini-1.5-pro' }    // To this
```

### Change ElevenLabs Voices
```typescript
'tts-npc': [
  {
    provider: 'elevenlabs',
    percentage: 60,
    elevenLabsVoices: {
      male: '21m00Tcm4TlvDq8ikWAM',      // ← Change these voice IDs
      female: 'EXAVITQu4vr4xnSDxMaL'     // ← to your ElevenLabs voices
    }
  } as TTSConfig,
  // ...
]
```

## 📋 All Tasks at a Glance

### Text Generation Tasks

#### 1. dialogue-generation
**What it does:** Generates full NPC dialogues with translations
**Current:** Gemini 50%, Groq 30%, Deepseek 20%
**Recommendation:** Balanced - this is a heavy task

```typescript
'dialogue-generation': [
  { provider: 'gemini', percentage: 50, model: 'gemini-1.5-flash' },
  { provider: 'groq', percentage: 30, model: 'mixtral-8x7b-32768' },
  { provider: 'deepseek', percentage: 20, model: 'deepseek-chat' }
],
```

#### 2. npc-response
**What it does:** Real-time mission NPC responses
**Current:** Groq 60%, Gemini 30%, Deepseek 10%
**Recommendation:** Use fast provider (Groq) more

```typescript
'npc-response': [
  { provider: 'groq', percentage: 60, model: 'mixtral-8x7b-32768' },
  { provider: 'gemini', percentage: 30, model: 'gemini-1.5-flash' },
  { provider: 'deepseek', percentage: 10, model: 'deepseek-chat' }
],
```

#### 3. helper-robot
**What it does:** Checks user sentences for errors
**Current:** Groq 70%, Deepseek 20%, Gemini 10%
**Recommendation:** Fast provider for quick checks

```typescript
'helper-robot': [
  { provider: 'groq', percentage: 70, model: 'mixtral-8x7b-32768' },
  { provider: 'deepseek', percentage: 20, model: 'deepseek-chat' },
  { provider: 'gemini', percentage: 10, model: 'gemini-1.5-flash-8b' }
],
```

#### 4. word-explanation
**What it does:** Generates detailed word explanations
**Current:** Gemini 40%, Deepseek 40%, Groq 20%
**Recommendation:** Quality providers for accuracy

```typescript
'word-explanation': [
  { provider: 'gemini', percentage: 40, model: 'gemini-1.5-flash' },
  { provider: 'deepseek', percentage: 40, model: 'deepseek-chat' },
  { provider: 'groq', percentage: 20, model: 'mixtral-8x7b-32768' }
],
```

#### 5. text-explanation
**What it does:** Explains grammar and phrase structure
**Current:** Gemini 40%, Deepseek 40%, Groq 20%
**Recommendation:** Quality providers for accuracy

```typescript
'text-explanation': [
  { provider: 'gemini', percentage: 40, model: 'gemini-1.5-flash' },
  { provider: 'deepseek', percentage: 40, model: 'deepseek-chat' },
  { provider: 'groq', percentage: 20, model: 'mixtral-8x7b-32768' }
],
```

#### 6. expression-extraction
**What it does:** Extracts common expressions from dialogues
**Current:** Gemini 50%, Deepseek 30%, Groq 20%
**Recommendation:** Gemini good at pattern recognition

```typescript
'expression-extraction': [
  { provider: 'gemini', percentage: 50, model: 'gemini-1.5-flash' },
  { provider: 'deepseek', percentage: 30, model: 'deepseek-chat' },
  { provider: 'groq', percentage: 20, model: 'mixtral-8x7b-32768' }
],
```

#### 7. translation
**What it does:** AI-powered translation fallback
**Current:** Gemini 50%, Deepseek 30%, Groq 20%
**Recommendation:** Balanced for accuracy

```typescript
'translation': [
  { provider: 'gemini', percentage: 50, model: 'gemini-1.5-flash' },
  { provider: 'deepseek', percentage: 30, model: 'deepseek-chat' },
  { provider: 'groq', percentage: 20, model: 'mixtral-8x7b-32768' }
],
```

### TTS Tasks

#### 8. tts-npc
**What it does:** Character voices in dialogues/missions
**Current:** ElevenLabs 60%, Google 40%
**Recommendation:** ElevenLabs for quality, Google for fallback

```typescript
'tts-npc': [
  {
    provider: 'elevenlabs',
    percentage: 60,
    elevenLabsVoices: {
      male: '21m00Tcm4TlvDq8ikWAM',      // ← Your male voice ID
      female: 'EXAVITQu4vr4xnSDxMaL'     // ← Your female voice ID
    }
  } as TTSConfig,
  {
    provider: 'google',
    percentage: 40
  } as TTSConfig
],
```

#### 9. tts-turi
**What it does:** System voice (quiz, word pronunciation)
**Current:** Google 80%, ElevenLabs 20%
**Recommendation:** Google mostly to save ElevenLabs quota

```typescript
'tts-turi': [
  {
    provider: 'google',
    percentage: 80
  } as TTSConfig,
  {
    provider: 'elevenlabs',
    percentage: 20,
    elevenLabsVoices: {
      male: '21m00Tcm4TlvDq8ikWAM',
      female: 'EXAVITQu4vr4xnSDxMaL'
    }
  } as TTSConfig
],
```

## 🎨 Common Configuration Scenarios

### Scenario 1: Minimize Costs (Free Only)
```typescript
// Use only Gemini and Groq (both have free tiers)
'dialogue-generation': [
  { provider: 'gemini', percentage: 50, model: 'gemini-1.5-flash' },
  { provider: 'groq', percentage: 50, model: 'mixtral-8x7b-32768' }
],

// Use only Google TTS (remove ElevenLabs)
'tts-npc': [
  { provider: 'google', percentage: 100 }
],
```

### Scenario 2: Maximize Speed
```typescript
// Use Groq for everything (fastest provider)
'dialogue-generation': [
  { provider: 'groq', percentage: 100, model: 'llama-3.1-8b-instant' }
],
'npc-response': [
  { provider: 'groq', percentage: 100, model: 'llama-3.1-8b-instant' }
],
```

### Scenario 3: Maximize Quality
```typescript
// Use best models
'dialogue-generation': [
  { provider: 'gemini', percentage: 100, model: 'gemini-1.5-pro' }  // Pro model
],

// Use ElevenLabs only
'tts-npc': [
  {
    provider: 'elevenlabs',
    percentage: 100,
    elevenLabsVoices: {
      male: 'YOUR_BEST_MALE_VOICE',
      female: 'YOUR_BEST_FEMALE_VOICE'
    }
  } as TTSConfig
],
```

### Scenario 4: Preserve Gemini Quota
```typescript
// Minimize Gemini usage
'dialogue-generation': [
  { provider: 'groq', percentage: 70, model: 'mixtral-8x7b-32768' },
  { provider: 'deepseek', percentage: 20, model: 'deepseek-chat' },
  { provider: 'gemini', percentage: 10, model: 'gemini-1.5-flash' }
],

// Use Groq for real-time tasks
'npc-response': [
  { provider: 'groq', percentage: 100, model: 'mixtral-8x7b-32768' }
],
```

## 🔧 Available Models

### Gemini Models
```typescript
'gemini-1.5-flash'              // Default, fast and good
'gemini-1.5-pro'                // Better quality, slower
'gemini-flash-latest'           // Latest version (may have limits)
'gemini-flash-lite-latest'      // Lighter version
'gemini-1.5-flash-8b'           // Smallest, fastest
```

### Groq Models
```typescript
'mixtral-8x7b-32768'            // Best balance (recommended)
'llama2-70b-4096'               // Powerful but slower
'llama-3.3-70b-versatile'       // Latest Llama
'llama-3.1-8b-instant'          // FASTEST
'gemma2-9b-it'                  // Lightweight
```

### Deepseek Models
```typescript
'deepseek-chat'                 // Main model (recommended)
'deepseek-coder'                // Good for structured tasks
```

## 📝 Rules to Follow

### 1. Percentages Must Sum to 100
```typescript
// ✅ CORRECT
{ provider: 'gemini', percentage: 50 },
{ provider: 'groq', percentage: 30 },
{ provider: 'deepseek', percentage: 20 }
// 50 + 30 + 20 = 100 ✓

// ❌ WRONG
{ provider: 'gemini', percentage: 50 },
{ provider: 'groq', percentage: 30 }
// 50 + 30 = 80 ✗ (needs to be 100)
```

### 2. ElevenLabs Needs Voice IDs
```typescript
// ✅ CORRECT
{
  provider: 'elevenlabs',
  percentage: 60,
  elevenLabsVoices: {
    male: '21m00Tcm4TlvDq8ikWAM',
    female: 'EXAVITQu4vr4xnSDxMaL'
  }
}

// ❌ WRONG (missing voices)
{
  provider: 'elevenlabs',
  percentage: 60
  // No elevenLabsVoices!
}
```

### 3. Model Names Must Be Exact
```typescript
// ✅ CORRECT
model: 'mixtral-8x7b-32768'

// ❌ WRONG
model: 'mixtral'              // Too vague
model: 'Mixtral-8x7b-32768'   // Wrong case
model: 'mixtral-8x7b'         // Missing context window
```

## 🧪 Testing Your Changes

After editing `aiConfig.ts`:

1. **Save the file**
2. **Redeploy** to Netlify (or run locally)
3. **Test features** - generate dialogue, talk to NPC, etc.
4. **Check console** - should see:
   ```
   [AIRouter] Selected provider: groq, model: mixtral-8x7b-32768
   ```

## 🎯 When to Change What

### Change Percentages When:
- You're hitting API quota limits
- You want to save costs
- You want faster/slower responses
- Testing new providers

### Change Models When:
- Current model is too slow
- Current model quality is bad
- You want to test newer models
- Provider recommends different model

### Change Voice IDs When:
- You want different character voices
- You cloned custom voices in ElevenLabs
- You want to match character personality better

## 💡 Pro Tips

1. **Start Conservative**: Don't use 100% of any provider (keep backups)
2. **Test Incremental**: Change one thing at a time
3. **Monitor Usage**: Check provider dashboards weekly
4. **Keep Logs**: Browser console shows which provider was used
5. **Document Changes**: Comment your changes in the config file

## 🔗 Quick Links

- Full Guide: `AI_PROVIDER_CONFIGURATION_GUIDE.md`
- Quick Start: `AI_PROVIDERS_QUICK_START.md`
- Implementation Details: `AI_PROVIDER_IMPLEMENTATION_SUMMARY.md`

---

**That's everything you need to configure your AI providers!** 🎉

